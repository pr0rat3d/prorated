// supabase/functions/revenuecat-webhook/index.ts
// ─────────────────────────────────────────────────────────────
// ProRated — RevenueCat Webhook Handler
// Syncs iOS In-App Purchase entitlements into contractors.plan
// (same field the Stripe webhook writes to for web subscriptions).
//
// Deploy: supabase functions deploy revenuecat-webhook
//
// RevenueCat dashboard → Project Settings → Integrations → Webhooks:
//   URL: https://wsdrbdojnzmtwndswpwr.supabase.co/functions/v1/revenuecat-webhook
//   Authorization header value: set to REVENUECAT_WEBHOOK_AUTH secret below
//
// Set Supabase secrets:
//   supabase secrets set REVENUECAT_WEBHOOK_AUTH=<shared secret, also set in RevenueCat dashboard>
// ─────────────────────────────────────────────────────────────

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl   = Deno.env.get("SUPABASE_URL")!;
const serviceKey    = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const webhookAuth    = Deno.env.get("REVENUECAT_WEBHOOK_AUTH")!;

// ── Product ID → plan tier mapping ────────────────────────────
const PRODUCT_TO_PLAN: Record<string, string> = {
  "com.prorated.bronze": "bronze",
  "com.prorated.silver": "silver",
  "com.prorated.gold":   "gold",
};

const SEAT_LIMIT: Record<string, number> = { bronze: 5, silver: 15, gold: 999 };

const ACTIVATING_EVENTS = new Set([
  "INITIAL_PURCHASE",
  "RENEWAL",
  "PRODUCT_CHANGE",
  "UNCANCELLATION",
]);

serve(async (req) => {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || authHeader !== webhookAuth) {
    return new Response("Unauthorized", { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const event = body?.event;
  if (!event?.type || !event?.app_user_id) {
    return new Response("Missing event fields", { status: 400 });
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  console.log(`[ProRated RevenueCat] Event: ${event.type} — app_user_id: ${event.app_user_id}`);

  try {
    // app_user_id is the contractor's own UUID (Purchases.configure is called
    // with contractor.id as the RevenueCat appUserID at login) — no mapping needed.
    const { data: contractor } = await supabase
      .from("contractors")
      .select("id, company_id")
      .eq("id", event.app_user_id)
      .single();

    if (!contractor) {
      console.warn(`[ProRated RevenueCat] No contractor found for app_user_id ${event.app_user_id}`);
      return new Response(JSON.stringify({ received: true }), { headers: { "Content-Type": "application/json" } });
    }

    if (ACTIVATING_EVENTS.has(event.type)) {
      const plan = PRODUCT_TO_PLAN[event.product_id] || "bronze";

      await supabase
        .from("contractors")
        .update({ plan, plan_source: "revenuecat" })
        .eq("id", contractor.id);

      if (contractor.company_id) {
        await supabase
          .from("companies")
          .update({
            plan,
            seat_limit: SEAT_LIMIT[plan] || 5,
            status:     "active",
          })
          .eq("id", contractor.company_id);
      }

      console.log(`[ProRated RevenueCat] ✅ Activated ${plan} for contractor ${contractor.id}`);
    } else if (event.type === "EXPIRATION") {
      // CANCELLATION alone (auto-renew off) does NOT lose access — only a real
      // EXPIRATION does. Only downgrade if RevenueCat is still the plan's source
      // of truth — don't let an abandoned/expired IAP trial clobber an active
      // Stripe subscription on the same contractor.
      const { data: current } = await supabase
        .from("contractors")
        .select("plan_source")
        .eq("id", contractor.id)
        .single();

      if (current?.plan_source === "revenuecat") {
        await supabase
          .from("contractors")
          .update({ plan: "free", plan_source: "revenuecat" })
          .eq("id", contractor.id);

        if (contractor.company_id) {
          await supabase
            .from("companies")
            .update({ status: "cancelled" })
            .eq("id", contractor.company_id);
        }

        console.log(`[ProRated RevenueCat] ❌ Expired — downgraded contractor ${contractor.id} to free`);
      }
    } else {
      console.log(`[ProRated RevenueCat] Unhandled event: ${event.type}`);
    }
  } catch (err: any) {
    console.error("[ProRated RevenueCat] Handler error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
