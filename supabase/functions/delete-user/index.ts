// supabase/functions/delete-user/index.ts
// Deletes a user from Supabase Auth AND anonymizes their contractor row + reviews.
// Uses service role key — bypasses RLS for all three steps.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl   = Deno.env.get("SUPABASE_URL")!;
const serviceKey    = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const adminPassword = Deno.env.get("ADMIN_PASSWORD") || "LittlePigs6969!";

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

    if (adminPass !== adminPassword) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!userId) {
      return new Response(JSON.stringify({ error: "userId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Step 1 — anonymize contractor row (graceful if row doesn't exist)
    // email has NOT NULL constraint — replace with untraceable placeholder
    const { error: contractorErr } = await supabase
      .from("contractors")
      .update({
        deleted:            true,
        deletion_requested: false,
        name:               "Deleted Member",
        email:              `deleted_${userId.replace(/-/g, "")}@deleted.invalid`,
        phone:              null,
        license_number:     null,
      })
      .eq("id", userId);

    if (contractorErr) {
      console.error("[ProRated] Contractor anonymize error:", contractorErr.message);
      return new Response(JSON.stringify({ error: `Contractor update failed: ${contractorErr.message}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 2 — anonymize reviews
    await supabase
      .from("reviews")
      .update({ user_id: null })
      .eq("user_id", userId);

    // Step 3 — delete from Supabase Auth
    const { error: authErr } = await supabase.auth.admin.deleteUser(userId);

    if (authErr) {
      console.error("[ProRated] Auth delete error:", authErr.message);
      return new Response(JSON.stringify({ error: `Auth delete failed: ${authErr.message}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[ProRated] ✅ Deleted user ${userId}`);
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: any) {
    console.error("[ProRated] Delete user exception:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
