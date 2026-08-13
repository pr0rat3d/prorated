// ─────────────────────────────────────────────────────────────
// ProRated — Supabase Edge Function: notify-watchers
//
// Called when a new review is submitted for an address.
// Finds all users who saved that address and emails them via
// Resend — replaces the earlier Web Push approach, which had no
// real path to deliver inside the native iOS/Android apps (no
// APNs/FCM integration, browser-only Push API).
//
// Now also sends a real push (via _shared/fcm.ts, real APNs/FCM this
// time) to any watcher with a registered device token — independent
// of email: a registered token means OS permission was already
// granted, which is its own consent signal, separate from
// watchlist_email_opt_in.
//
// Deploy with: supabase functions deploy notify-watchers
//
// Set secrets with:
//   supabase secrets set RESEND_API_KEY=your_resend_key
//   supabase secrets set GOOGLE_SERVICE_ACCOUNT_JSON=...
// ─────────────────────────────────────────────────────────────

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendPush, getServiceAccount } from "../_shared/fcm.ts";

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin":  "*",
        "Access-Control-Allow-Headers": "authorization, content-type",
      },
    });
  }

  try {
    const { address, reviewData } = await req.json();

    if (!address) {
      return new Response(JSON.stringify({ error: "address required" }), { status: 400 });
    }

    // Init Supabase with service role for full DB access
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // 1. Find all users who saved this address
    const normalizedAddress = address.toLowerCase().trim();
    const { data: savedRows } = await supabase
      .from("saved_addresses")
      .select("user_id")
      .ilike("address", `%${normalizedAddress.split(",")[0]}%`)
      .eq("notify", true);

    if (!savedRows || savedRows.length === 0) {
      return new Response(JSON.stringify({ sent: 0, message: "No watchers found" }));
    }

    const userIds = [...new Set(savedRows.map((r: any) => r.user_id))];
    const streetName = address.split(",")[0]?.trim() || address;
    const subject = `🛡️ New review on ${streetName}`;

    // 2. Push path — independent of email opt-in. Any watcher with a
    // registered device gets pushed; a token existing at all means OS
    // permission was already granted, which is its own consent gate.
    let pushSent = 0, pushFailed = 0;
    try {
      const { data: tokenRows } = await supabase
        .from("push_tokens")
        .select("token")
        .in("user_id", userIds);

      if (tokenRows && tokenRows.length > 0) {
        const sa = getServiceAccount();
        const pushBody = `${streetName} just got a new verified trade professional review${reviewData?.trade ? ` (${reviewData.trade})` : ""}. Take a look before you bid.`;
        for (const row of tokenRows) {
          const result = await sendPush(sa, row.token, { title: subject, body: pushBody });
          if (result.ok) pushSent++; else {
            pushFailed++;
            if (result.deadToken) await supabase.from("push_tokens").delete().eq("token", row.token);
          }
        }
      }
    } catch (err) {
      console.warn("[ProRated] Push path skipped:", (err as Error).message);
    }

    // 3. Email path — opt-in only. Default is off
    // (watchlist_email_opt_in defaults false on the contractors table);
    // a saved address alone does not imply consent to be emailed.
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      console.log("[ProRated] notify-watchers — no RESEND_API_KEY, skipping email");
      return new Response(JSON.stringify({ sent: 0, pushSent, pushFailed, reason: "no-resend-key" }));
    }

    const { data: watchers } = await supabase
      .from("contractors")
      .select("id, email, name")
      .in("id", userIds)
      .eq("watchlist_email_opt_in", true);

    if (!watchers || watchers.length === 0) {
      return new Response(JSON.stringify({ sent: 0, pushSent, pushFailed, message: "No watcher emails found" }));
    }
    const html = `
      <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px; background: #F8FAFC;">
        <div style="background: #0F172A; border-radius: 16px; padding: 32px; text-align: center; margin-bottom: 24px;">
          <h1 style="color: #F8FAFC; font-size: 24px; font-weight: 800; margin: 0 0 8px;">ProRated</h1>
          <p style="color: #94A3B8; font-size: 13px; margin: 0;">Built by Pros, Built for Pros</p>
        </div>
        <div style="background: #fff; border-radius: 16px; padding: 32px; border: 1px solid #E2E8F0;">
          <h2 style="color: #0F172A; font-size: 20px; font-weight: 800; margin: 0 0 12px;">New review on a saved address</h2>
          <p style="color: #64748B; font-size: 14px; line-height: 1.65; margin: 0 0 24px;">
            <strong>${streetName}</strong> just got a new verified trade professional review${reviewData?.trade ? ` (${reviewData.trade})` : ""}. Take a look before you bid.
          </p>
          <div style="text-align: center;">
            <a href="https://prorated.app"
              style="display: inline-block; background: #2563EB; color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-size: 15px; font-weight: 700;">
              View the review →
            </a>
          </div>
        </div>
        <p style="text-align: center; color: #94A3B8; font-size: 11px; margin-top: 20px;">
          ProRated · You're getting this because you saved this address to your watchlist.
          <a href="https://prorated.app/dashboard" style="color: #2563EB;">Manage saved addresses</a>
        </p>
      </div>
    `;

    // 4. Send one email per watcher (never a shared "to" array — that would
    // expose every recipient's address to every other recipient)
    let sent = 0;
    let failed = 0;

    for (const watcher of watchers) {
      if (!watcher.email) { failed++; continue; }
      try {
        const emailRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from:    "ProRated <hello@prorated.app>",
            to:      [watcher.email],
            subject,
            html,
          }),
        });
        if (emailRes.ok) sent++; else failed++;
      } catch {
        failed++;
      }
    }

    // 5. Log the notification
    await supabase.from("notification_log").insert({
      type:    "new_review",
      title:   subject,
      body:    `Emailed ${sent} watcher(s), pushed ${pushSent} device(s), for ${streetName}`,
      address: normalizedAddress,
      success: sent > 0 || pushSent > 0,
    });

    console.log(`[ProRated] Watchers: ${sent} emailed (${failed} failed), ${pushSent} pushed (${pushFailed} failed)`);

    return new Response(
      JSON.stringify({ sent, failed, pushSent, pushFailed, watchers: userIds.length }),
      { headers: { "Content-Type": "application/json" } }
    );

  } catch (err: any) {
    console.error("[ProRated] Edge function error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
