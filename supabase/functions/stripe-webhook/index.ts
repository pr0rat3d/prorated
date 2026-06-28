// supabase/functions/stripe-webhook/index.ts
// ─────────────────────────────────────────────────────────────
// ProRated — Stripe Webhook Handler
// Listens for Stripe events and updates user plans in Supabase
//
// Deploy: supabase functions deploy stripe-webhook
//
// In Stripe Dashboard → Developers → Webhooks → Add endpoint:
//   URL: https://wsdrbdojnzmtwndswpwr.supabase.co/functions/v1/stripe-webhook
//   Events to listen for:
//     - checkout.session.completed
//     - customer.subscription.updated
//     - customer.subscription.deleted
//     - invoice.payment_failed
//
// Set Supabase secrets:
//   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxxxx
//   supabase secrets set STRIPE_SECRET_KEY=sk_live_xxxxx
// ─────────────────────────────────────────────────────────────

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14?target=deno";

const stripe         = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2024-06-20" });
const webhookSecret  = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;
const supabaseUrl    = Deno.env.get("SUPABASE_URL")!;
const serviceKey     = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// ── Plan price ID → tier name mapping ────────────────────────
// Add your live Stripe price IDs here after creating products
const PRICE_TO_PLAN: Record<string, string> = {
  "price_1TjOgqC1rxqA9InBsiUr7I6g": "bronze",
  "price_1TjR08C1rxqA9InBl5Pl127t": "silver",
  "price_1TjR2QC1rxqA9InB6TMOOS5L": "gold",
};

// ── Helper: get plan from price ID ───────────────────────────
const getPlanFromPriceId = (priceId: string): string => {
  return PRICE_TO_PLAN[priceId] || "bronze"; // default to bronze if unknown
};

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Missing stripe-signature", { status: 400 });
  }

  const body = await req.text();

  // Verify webhook signature — must use async variant in Deno (no sync crypto)
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret) as Stripe.Event;
  } catch (err: any) {
    console.error("[ProRated Stripe] Webhook signature verification failed:", err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  console.log(`[ProRated Stripe] Event: ${event.type}`);

  try {
    switch (event.type) {

      // ── Checkout completed → activate plan ─────────────────
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const email   = session.customer_email || session.customer_details?.email;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        // Get price ID from line_items or fetch from subscription
        let priceId = session.line_items?.data?.[0]?.price?.id || "";
        if (!priceId && subscriptionId) {
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          priceId = sub.items?.data?.[0]?.price?.id || "";
        }
        const plan = getPlanFromPriceId(priceId);
        console.log(`[ProRated Stripe] checkout completed — email: ${email}, priceId: ${priceId}, plan: ${plan}`);

        if (!email) {
          console.error("[ProRated Stripe] No email in checkout session");
          break;
        }

        // Find contractor by email
        const { data: contractors } = await supabase
          .from("contractors")
          .select("id, company_id")
          .eq("email", email)
          .limit(1);

        const contractor = contractors?.[0];
        if (!contractor) {
          // Contractor profile not created yet — upsert it
          console.warn(`[ProRated Stripe] Contractor not found for ${email} — creating basic record`);
          await supabase.from("contractors").upsert({
            email,
            plan:               plan,
            stripe_customer_id: customerId,
            account_type:       "solo",
            status:             "pending",
          }, { onConflict: "email" });
          break;
        }

        // Update contractor plan
        await supabase
          .from("contractors")
          .update({
            plan:               plan,
            stripe_customer_id: customerId,
          })
          .eq("id", contractor.id);

        // Update company if they have one
        if (contractor.company_id) {
          await supabase
            .from("companies")
            .update({
              plan:                    plan,
              seat_limit:              plan === "bronze" ? 5 : plan === "silver" ? 15 : 999,
              stripe_customer_id:      customerId,
              stripe_subscription_id:  subscriptionId,
              status:                  "active",
            })
            .eq("id", contractor.company_id);
        }

        console.log(`[ProRated Stripe] ✅ Activated ${plan} for ${email}`);
        break;
      }

      // ── Subscription updated → sync plan changes ───────────
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const priceId      = subscription.items.data[0]?.price?.id || "";
        const plan         = getPlanFromPriceId(priceId);
        const customerId   = subscription.customer as string;
        const status       = subscription.status; // active, past_due, canceled, etc.

        // Find contractor by stripe_customer_id
        const { data: contractors } = await supabase
          .from("contractors")
          .select("id, company_id")
          .eq("stripe_customer_id", customerId)
          .limit(1);

        const contractor = contractors?.[0];
        if (!contractor) break;

        await supabase
          .from("contractors")
          .update({ plan: status === "active" ? plan : "free" })
          .eq("id", contractor.id);

        if (contractor.company_id) {
          await supabase
            .from("companies")
            .update({
              plan:       status === "active" ? plan : "bronze",
              seat_limit: plan === "bronze" ? 5 : plan === "silver" ? 15 : 999,
              status:     status === "active" ? "active" : "past_due",
            })
            .eq("id", contractor.company_id);
        }

        console.log(`[ProRated Stripe] 🔄 Updated plan to ${plan} (${status}) for customer ${customerId}`);
        break;
      }

      // ── Subscription cancelled → downgrade to free ─────────
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId   = subscription.customer as string;

        const { data: contractors } = await supabase
          .from("contractors")
          .select("id, company_id")
          .eq("stripe_customer_id", customerId)
          .limit(1);

        const contractor = contractors?.[0];
        if (!contractor) break;

        await supabase
          .from("contractors")
          .update({ plan: "free" })
          .eq("id", contractor.id);

        if (contractor.company_id) {
          await supabase
            .from("companies")
            .update({ status: "cancelled" })
            .eq("id", contractor.company_id);
        }

        console.log(`[ProRated Stripe] ❌ Cancelled subscription for customer ${customerId}`);
        break;
      }

      // ── Payment failed → mark past due ─────────────────────
      case "invoice.payment_failed": {
        const invoice    = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        const { data: contractors } = await supabase
          .from("contractors")
          .select("id, company_id")
          .eq("stripe_customer_id", customerId)
          .limit(1);

        const contractor = contractors?.[0];
        if (!contractor) break;

        if (contractor.company_id) {
          await supabase
            .from("companies")
            .update({ status: "past_due" })
            .eq("id", contractor.company_id);
        }

        console.log(`[ProRated Stripe] ⚠️ Payment failed for customer ${customerId}`);
        break;
      }

      default:
        console.log(`[ProRated Stripe] Unhandled event: ${event.type}`);
    }
  } catch (err: any) {
    console.error("[ProRated Stripe] Handler error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
