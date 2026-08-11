// ─────────────────────────────────────────────────────────────
// ProRated — Supabase Edge Function: send-reengagement-nudge
//
// Runs daily via Supabase cron. Finds contractors who signed up
// exactly 3 days ago and haven't returned since (no lookup_log or
// reviews row), and emails a nudge whose content branches on what
// they actually did on day 1. Gated behind the `automated_emails`
// admin toggle (key = 'day3_reengagement') — a no-op when disabled.
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

    // 1. Respect the admin kill switch — off by default, Canaan/Tommy
    // control this from Admin → Automated Emails, no deploy needed.
    const { data: setting } = await supabase
      .from("automated_emails")
      .select("enabled")
      .eq("key", "day3_reengagement")
      .single();

    if (!setting?.enabled) {
      return new Response(JSON.stringify({ sent: 0, reason: "disabled" }));
    }

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      console.log("[ProRated] send-reengagement-nudge — no RESEND_API_KEY, skipping");
      return new Response(JSON.stringify({ sent: 0, reason: "no-resend-key" }));
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
      .select("id, name, email")
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

      const { subject, bodyHtml, ctaLabel } = buildVariant(firstName, hasReview, hasLookup, lookupCount || 0);

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

      let ok = false;
      try {
        const emailRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from:    "ProRated <hello@prorated.app>",
            to:      [contractor.email],
            subject,
            html,
          }),
        });
        ok = emailRes.ok;
      } catch {
        ok = false;
      }

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

function buildVariant(firstName: string, hasReview: boolean, hasLookup: boolean, lookupCount: number) {
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

  if (hasLookup && !hasReview) {
    const plural = lookupCount === 1 ? "address" : "addresses";
    return {
      subject: "You're only seeing half of what ProRated shows",
      ctaLabel: "Leave your first review →",
      bodyHtml: `
        Hey ${firstName} — you've searched ${lookupCount} ${plural} since joining ProRated,
        but until you leave your first review, you're only seeing a locked card: address,
        photo, nothing else.
        <br><br>
        Leave one review — 60 seconds, five quick ratings — and every address you search
        from then on shows full scores, tags, and reviewer notes from other licensed pros.
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
