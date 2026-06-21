// supabase/functions/check-anniversary-rewards/index.ts
// ─────────────────────────────────────────────────────────────
// ProRated — Anniversary Reward Edge Function
// Runs weekly via Supabase cron to check if any company
// qualifies for their 13th month free reward
//
// Deploy: supabase functions deploy check-anniversary-rewards
// Cron:   Set in Supabase Dashboard → Edge Functions → Schedules
//         Schedule: 0 9 * * 1  (every Monday at 9am UTC)
// ─────────────────────────────────────────────────────────────

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl  = Deno.env.get("SUPABASE_URL")!;
const serviceKey   = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  // Allow manual trigger via POST with optional company_id
  const body = req.method === "POST"
    ? await req.json().catch(() => ({}))
    : {};

  const supabase = createClient(supabaseUrl, serviceKey);

  // Find companies whose anniversary is within the next 7 days
  const today      = new Date();
  const weekAhead  = new Date(today.getTime() + 7 * 86400000);

  let query = supabase
    .from("companies")
    .select("id, name, anniversary_date, plan, status")
    .eq("status", "active")
    .lte("anniversary_date", weekAhead.toISOString().split("T")[0])
    .gte("anniversary_date", today.toISOString().split("T")[0]);

  // If specific company_id provided, only check that one
  if (body.company_id) {
    query = supabase
      .from("companies")
      .select("id, name, anniversary_date, plan, status")
      .eq("id", body.company_id);
  }

  const { data: companies, error } = await query;

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  const results = [];

  for (const company of companies || []) {
    // Call the database function we already created
    const { data, error: fnError } = await supabase
      .rpc("check_anniversary_reward", { p_company_id: company.id });

    results.push({
      company_id:   company.id,
      company_name: company.name,
      result:       fnError ? { eligible: false, reason: fnError.message } : data,
    });

    // If eligible, send notification email to owner
    if (data?.eligible) {
      // Fetch owner email
      const { data: ownerData } = await supabase
        .from("contractors")
        .select("email, name")
        .eq("company_id", company.id)
        .eq("company_role", "owner")
        .single();

      if (ownerData?.email) {
        // Send via Supabase email (or your email provider)
        await supabase.auth.admin.sendRawEmail({
          to: ownerData.email,
          subject: "🎁 ProRated — Your team earned a free month!",
          html: `
            <div style="font-family: 'DM Sans', sans-serif; max-width: 500px; margin: 0 auto;">
              <h2>Congratulations, ${ownerData.name || "Pro"}!</h2>
              <p>Your team at <strong>${company.name}</strong> averaged 3 or more reviews per week over the past year.</p>
              <p>We've added <strong>one free month</strong> to your ProRated subscription as a thank-you.</p>
              <p>Keep up the great work — the more your team reviews, the better the data gets for everyone.</p>
              <p>— The ProRated Team</p>
              <hr />
              <p style="font-size: 12px; color: #94A3B8;">
                Built by Pros, Built for Pros · prorated.app
              </p>
            </div>
          `,
        }).catch(() => {}); // Don't fail if email errors
      }
    }
  }

  return new Response(
    JSON.stringify({
      checked:   results.length,
      eligible:  results.filter(r => r.result?.eligible).length,
      results,
    }),
    { headers: { "Content-Type": "application/json" } }
  );
});
