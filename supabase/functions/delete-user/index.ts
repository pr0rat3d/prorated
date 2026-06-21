// supabase/functions/delete-user/index.ts
// ─────────────────────────────────────────────────────────────
// ProRated — Admin Delete User Edge Function
// Deletes a user from Supabase Auth (requires service role key)
// Called from AdminPage when admin permanently deletes a user
//
// Deploy: supabase functions deploy delete-user
// ─────────────────────────────────────────────────────────────

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl    = Deno.env.get("SUPABASE_URL")!;
const serviceKey     = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const adminPassword  = Deno.env.get("ADMIN_PASSWORD") || "LittlePigs6969!";

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { userId, adminPass } = await req.json();

    // Verify admin password
    if (adminPass !== adminPassword) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    if (!userId) {
      return new Response(JSON.stringify({ error: "userId required" }), { status: 400 });
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Delete from Supabase Auth
    const { error } = await supabase.auth.admin.deleteUser(userId);

    if (error) {
      console.error("[ProRated] Delete user error:", error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    console.log(`[ProRated] ✅ Deleted user ${userId} from Auth`);
    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (err: any) {
    console.error("[ProRated] Delete user exception:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
