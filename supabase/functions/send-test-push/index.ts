// supabase/functions/send-test-push/index.ts
// Admin-only: sends a real test push to every device registered under a
// given contractor email — the push equivalent of the existing "Send test
// to my email" button on Automated Emails, since there's no single "admin's
// own device" concept (admin console auth is password-based, separate from
// being logged in as a contractor with a registered push_tokens row).
//
// Deploy with: supabase functions deploy send-test-push

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendPush, getServiceAccount } from "../_shared/fcm.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  try {
    const { adminPass, email } = await req.json();

    if (adminPass !== Deno.env.get("ADMIN_PASSWORD")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!email) {
      return new Response(JSON.stringify({ error: "email required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: contractor } = await supabase
      .from("contractors")
      .select("id, name")
      .eq("email", email)
      .maybeSingle();

    if (!contractor) {
      return new Response(JSON.stringify({ error: `No contractor found with email ${email}` }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: tokenRows } = await supabase
      .from("push_tokens")
      .select("token")
      .eq("user_id", contractor.id);

    if (!tokenRows || tokenRows.length === 0) {
      return new Response(JSON.stringify({ sent: 0, deviceCount: 0, message: `No registered devices for ${email}` }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sa = getServiceAccount();
    let sent = 0, failed = 0;
    for (const row of tokenRows) {
      const result = await sendPush(sa, row.token, {
        title: "🔔 Test push from ProRated Admin",
        body: `Hey ${contractor.name || "there"} — if you're seeing this, push notifications are working correctly.`,
      });
      if (result.ok) sent++; else {
        failed++;
        if (result.deadToken) await supabase.from("push_tokens").delete().eq("token", row.token);
      }
    }

    return new Response(JSON.stringify({ sent, failed, deviceCount: tokenRows.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: any) {
    console.error("[ProRated] send-test-push error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
