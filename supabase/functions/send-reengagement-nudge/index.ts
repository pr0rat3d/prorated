// ─────────────────────────────────────────────────────────────
// ProRated — Supabase Edge Function: send-reengagement-nudge
//
// Runs daily via Supabase cron. Finds contractors who signed up
// exactly 3 days ago and haven't returned since (no lookup_log or
// reviews row), and emails a nudge whose content branches on what
// they actually did on day 1. Gated behind the `automated_emails`
// admin toggle (key = 'day3_reengagement') — a no-op when disabled.
//
// Manual invocation (from Admin → Automated Emails):
//   POST { trigger: true }              — real send, bypasses the
//                                          toggle for this one run only
//   POST { testEmail: "you@..." }       — sends all 3 variants to one
//                                          address with fake sample
//                                          data, using the exact same
//                                          renderEmail()/buildVariant()
//                                          code path as a real send.
//                                          Never touches contractors/
//                                          notification_log.
//
// Deploy with: supabase functions deploy send-reengagement-nudge
//
// Set secrets with:
//   supabase secrets set RESEND_API_KEY=your_resend_key
// ─────────────────────────────────────────────────────────────

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin":  "*",
        "Access-Control-Allow-Headers": "authorization, content-type",
      },
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      console.log("[ProRated] send-reengagement-nudge — no RESEND_API_KEY, skipping");
      return new Response(JSON.stringify({ sent: 0, reason: "no-resend-key" }));
    }

    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};

    // ── Test mode: send all 3 variants to one address, sample data only.
    // Identical rendering path to a real send — just skips the DB
    // targeting query and never writes to contractors/notification_log.
    if (body.testEmail) {
      const samples = [
        buildVariant("Canaan", true, false, 0, "free"),            // reviewed, never searched
        buildVariant("Canaan", false, true, 3, "free"),            // searched 3x, never reviewed — free plan (earn-a-search framing)
        buildVariant("Canaan", false, true, 3, "bronze"),          // searched 3x, never reviewed — paid plan (unlimited lookups already, no earn framing)
        buildVariant("Canaan", false, false, 0, "free"),           // did neither
      ];
      let sent = 0, failed = 0;
      for (const variant of samples) {
        const ok = await sendOne(resendKey, body.testEmail, `[TEST] ${variant.subject}`, variant.bodyHtml, variant.ctaLabel);
        if (ok) sent++; else failed++;
      }
      return new Response(JSON.stringify({ mode: "test", sent, failed, to: body.testEmail }));
    }

    // 1. Respect the admin kill switch — off by default, Canaan/Tommy
    // control this from Admin → Automated Emails, no deploy needed.
    // `trigger: true` (the manual "Send Now" button) bypasses this one
    // check for this run only — everything else (targeting, idempotency)
    // still applies, so it can't double-send anyone.
    if (!body.trigger) {
      const { data: setting } = await supabase
        .from("automated_emails")
        .select("enabled")
        .eq("key", "day3_reengagement")
        .single();

      if (!setting?.enabled) {
        return new Response(JSON.stringify({ sent: 0, reason: "disabled" }));
      }
    }

    // 2. Target: signed up exactly 3 days ago, never nudged before.
    // A one-day window (not "3+ days") so this only ever fires once.
    const threeDaysAgo = new Date();
    threeDaysAgo.setUTCDate(threeDaysAgo.getUTCDate() - 3);
    const windowStart = new Date(Date.UTC(
      threeDaysAgo.getUTCFullYear(), threeDaysAgo.getUTCMonth(), threeDaysAgo.getUTCDate()
    ));
    const windowEnd = new Date(windowStart.getTime() + 86400000);

    const { data: candidates, error } = await supabase
      .from("contractors")
      .select("id, name, email, plan")
      .eq("status", "approved")
      .is("reengagement_sent_at", null)
      .gte("created_at", windowStart.toISOString())
      .lt("created_at", windowEnd.toISOString());

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
    if (!candidates || candidates.length === 0) {
      return new Response(JSON.stringify({ sent: 0, message: "No candidates today" }));
    }

    let sent = 0;
    let failed = 0;

    for (const contractor of candidates) {
      if (!contractor.email) { failed++; continue; }

      const [{ count: reviewCount }, { count: lookupCount }] = await Promise.all([
        supabase.from("reviews").select("id", { count: "exact", head: true }).eq("user_id", contractor.id),
        supabase.from("lookup_log").select("id", { count: "exact", head: true }).eq("user_id", contractor.id),
      ]);

      const hasReview = (reviewCount || 0) > 0;
      const hasLookup = (lookupCount || 0) > 0;
      const firstName = (contractor.name || "").trim().split(" ")[0] || "there";

      const { subject, bodyHtml, ctaLabel } = buildVariant(firstName, hasReview, hasLookup, lookupCount || 0, contractor.plan);
      const ok = await sendOne(resendKey, contractor.email, subject, bodyHtml, ctaLabel);

      if (ok) sent++; else failed++;

      // Stamp regardless of outcome — the 1-day targeting window means a
      // failed send won't be retried tomorrow anyway (they'll have aged
      // out of the window), so this is purely idempotency against a
      // manual re-trigger the same day.
      await supabase.from("contractors")
        .update({ reengagement_sent_at: new Date().toISOString() })
        .eq("id", contractor.id);

      await supabase.from("notification_log").insert({
        user_id: contractor.id,
        type:    "reengagement_day3",
        title:   subject,
        body:    ok ? "sent" : "failed",
        success: ok,
      });
    }

    console.log(`[ProRated] Day-3 nudge: ${sent} sent, ${failed} failed`);
    return new Response(
      JSON.stringify({ sent, failed, candidates: candidates.length }),
      { headers: { "Content-Type": "application/json" } }
    );

  } catch (err: any) {
    console.error("[ProRated] Edge function error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});

// Single source of truth for the rendered email — both the real send loop
// and test mode call this, so a test send is byte-identical to a real one.
async function sendOne(resendKey: string, to: string, subject: string, bodyHtml: string, ctaLabel: string): Promise<boolean> {
  const html = `
    <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px; background: #F8FAFC;">
      <div style="background: #0F172A; border-radius: 16px; padding: 32px; text-align: center; margin-bottom: 24px;">
        <h1 style="color: #F8FAFC; font-size: 24px; font-weight: 800; margin: 0 0 8px;">ProRated</h1>
        <p style="color: #94A3B8; font-size: 13px; margin: 0;">Built by Pros, Built for Pros</p>
      </div>
      <div style="background: #fff; border-radius: 16px; padding: 32px; border: 1px solid #E2E8F0;">
        <p style="color: #64748B; font-size: 14px; line-height: 1.65; margin: 0 0 24px;">
          ${bodyHtml}
        </p>
        <div style="text-align: center;">
          <a href="https://prorated.app"
            style="display: inline-block; background: #2563EB; color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-size: 15px; font-weight: 700;">
            ${ctaLabel}
          </a>
        </div>
      </div>
      <p style="text-align: center; color: #94A3B8; font-size: 11px; margin-top: 20px;">
        ProRated · You're getting this because you're a verified Trade Pro member.
        <a href="https://prorated.app/dashboard" style="color: #2563EB;">Manage email preferences</a>
      </p>
    </div>
  `;

  try {
    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "ProRated <hello@prorated.app>",
        to:   [to],
        subject,
        html,
      }),
    });
    return emailRes.ok;
  } catch {
    return false;
  }
}

function buildVariant(firstName: string, hasReview: boolean, hasLookup: boolean, lookupCount: number, plan: string | null) {
  const PAID_PLANS = ["bronze", "silver", "gold", "platinum"];
  const isFreePlan = !PAID_PLANS.includes(plan || "free");

  if (hasReview && !hasLookup) {
    return {
      subject: "You've already helped one crew — see who could help you",
      ctaLabel: "Search a job site →",
      bodyHtml: `
        Hey ${firstName} — three days ago you left a review on a job site, and it's already
        visible to other licensed pros checking that address before they bid. Nice work.
        <br><br>
        You haven't searched an address yourself yet, though. Before your next bid, see
        what other Trade Pros are saying about payment reliability, site access, and
        whether the homeowner's easy to work with — usually takes under 10 seconds.
      `,
    };
  }

  if (hasLookup && !hasReview && isFreePlan) {
    const plural = lookupCount === 1 ? "address" : "addresses";
    return {
      subject: "Get an extra free search this month",
      ctaLabel: "Leave a review, earn a search →",
      bodyHtml: `
        Hey ${firstName} — you've searched ${lookupCount} ${plural} since joining ProRated.
        Your free plan includes 5 searches a month, but every review you leave adds one
        more for that month — no limit, and it resets fresh next month.
        <br><br>
        Leave one review — 60 seconds, five quick ratings — and it not only helps another
        pro before their bid, it buys you another search right now.
      `,
    };
  }

  if (hasLookup && !hasReview) {
    // Paid plan (Bronze+) already has unlimited lookups, so no "earn a
    // search" framing — encourage the review on its own merits instead.
    const plural = lookupCount === 1 ? "address" : "addresses";
    return {
      subject: "Other pros are relying on reviews like yours",
      ctaLabel: "Leave your first review →",
      bodyHtml: `
        Hey ${firstName} — you've searched ${lookupCount} ${plural} since joining ProRated,
        which means you've already seen how much a real review from another licensed pro
        can tell you before you bid.
        <br><br>
        Leave one on a site you've worked — 60 seconds, five quick ratings — and you're
        doing the same for the next pro who searches it.
      `,
    };
  }

  // Neither (also covers the has-both edge case, which shouldn't hit this
  // job at all since it targets zero-return-activity signups — falls back
  // to the simplest reactivation message if it ever does).
  return {
    subject: "You haven't searched a job site yet",
    ctaLabel: "Search your first address →",
    bodyHtml: `
      Hey ${firstName} — you joined ProRated 3 days ago but haven't searched an address
      yet. Other licensed trade pros are already rating job sites on payment reliability,
      access difficulty, and whether the homeowner's easy to work with.
      <br><br>
      Search any address you're about to bid on — it takes about 10 seconds, and it
      might save you from a bad site before you ever show up.
    `,
  };
}
