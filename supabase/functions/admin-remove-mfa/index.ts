// supabase/functions/admin-remove-mfa/index.ts
// Admin-only 2FA recovery. Supabase's TOTP MFA has no backup-code
// mechanism, and unenrolling a verified factor requires AAL2 (confirmed
// live 2026-08-11: a password-only session gets 422 insufficient_aal
// trying to self-remove) — so a lost-authenticator-device account has no
// self-service recovery path at all. This is the only way out.
//
// Deploy with: supabase functions deploy admin-remove-mfa

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl   = Deno.env.get("SUPABASE_URL")!;
const serviceKey    = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const adminPassword = Deno.env.get("ADMIN_PASSWORD");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { userId, adminPass } = await req.json();

    if (!userId) {
      return new Response(JSON.stringify({ error: "userId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Admin console only — unlike delete-user, there is no self-service
    // branch here, deliberately: someone who could pass their own aal1
    // token would already be blocked from this by GoTrue itself, and this
    // endpoint exists specifically for the case where that's not possible.
    if (adminPass !== adminPassword) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data, error } = await supabase.rpc("admin_remove_mfa_factor", { p_user_id: userId });

    if (error) {
      console.error("[ProRated] admin-remove-mfa RPC error:", error.message);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[ProRated] Admin removed ${data} MFA factor(s) for user ${userId}`);
    return new Response(JSON.stringify({ success: true, removed: data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: any) {
    console.error("[ProRated] admin-remove-mfa exception:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
