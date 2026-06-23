// ─────────────────────────────────────────────────────────────
// ProRated — Supabase Edge Function: notify-watchers
//
// Called when a new review is submitted for an address.
// Finds all users who saved that address and sends them
// a Web Push notification via VAPID.
//
// Deploy with: supabase functions deploy notify-watchers
//
// Set secrets with:
//   supabase secrets set VAPID_PUBLIC_KEY=your_public_key
//   supabase secrets set VAPID_PRIVATE_KEY=your_private_key
//   supabase secrets set VAPID_SUBJECT=mailto:hello@prorated.io
// ─────────────────────────────────────────────────────────────

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Web Push implementation for Deno
const sendWebPush = async (subscription: any, payload: string, vapidKeys: any) => {
  const webpush = await import("https://esm.sh/web-push@3.6.7");
  webpush.setVapidDetails(
    vapidKeys.subject,
    vapidKeys.publicKey,
    vapidKeys.privateKey,
  );
  return webpush.sendNotification(subscription, payload);
};

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

    // VAPID keys from Supabase secrets
    const vapidKeys = {
      publicKey:  Deno.env.get("VAPID_PUBLIC_KEY")!,
      privateKey: Deno.env.get("VAPID_PRIVATE_KEY")!,
      subject:    Deno.env.get("VAPID_SUBJECT") || "mailto:hello@prorated.io",
    };

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

    // 2. Get push subscriptions for those users
    const { data: subscriptions } = await supabase
      .from("push_subscriptions")
      .select("*")
      .in("user_id", userIds);

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ sent: 0, message: "No push subscriptions" }));
    }

    // 3. Build notification payload
    const streetName = address.split(",")[0]?.trim() || address;
    const payload = JSON.stringify({
      title: "ProRated 🛡️ — New Review",
      body:  `${streetName} just got a new contractor review. Tap to see it before you bid.`,
      url:   "/",
      tag:   `review-${Date.now()}`,
    });

    // 4. Send push to each subscription
    let sent = 0;
    let failed = 0;
    const expiredEndpoints: string[] = [];
    const sentIds: string[] = [];

    for (const sub of subscriptions) {
      try {
        await sendWebPush(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload,
          vapidKeys,
        );
        sentIds.push(sub.id);
        sent++;
      } catch (err: any) {
        // 404/410 = subscription expired, clean it up
        if (err.statusCode === 404 || err.statusCode === 410) {
          expiredEndpoints.push(sub.endpoint);
        }
        failed++;
      }
    }

    // Batch update last_used for all successful sends (was N individual writes)
    if (sentIds.length > 0) {
      await supabase
        .from("push_subscriptions")
        .update({ last_used: new Date().toISOString() })
        .in("id", sentIds);
    }

    // 5. Clean up expired subscriptions
    if (expiredEndpoints.length > 0) {
      await supabase
        .from("push_subscriptions")
        .delete()
        .in("endpoint", expiredEndpoints);
    }

    // 6. Log the notification
    await supabase.from("notification_log").insert({
      type:    "new_review",
      title:   "New Review",
      body:    payload,
      address: normalizedAddress,
      success: sent > 0,
    });

    console.log(`[ProRated] Push sent: ${sent} success, ${failed} failed`);

    return new Response(
      JSON.stringify({ sent, failed, watchers: userIds.length }),
      { headers: { "Content-Type": "application/json" } }
    );

  } catch (err: any) {
    console.error("[ProRated] Edge function error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
