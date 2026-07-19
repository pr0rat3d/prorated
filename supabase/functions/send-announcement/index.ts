// ─────────────────────────────────────────────────────────────
// ProRated — Bulk Announcement Edge Function
// Sends a one-off admin-composed email to every active trade pro.
//
// Deploy: supabase functions deploy send-announcement
//
// Called from AdminPage's Announce tab. Requires the admin password —
// this is a much higher blast-radius action than a single approval
// email, so (unlike send-approval-email) it must self-verify server-side
// rather than trusting the caller, same pattern as delete-user /
// list-auth-users.
//
// Sends one Resend call PER recipient (never a single call with many
// `to` addresses) so recipients never see each other's email address.
// ─────────────────────────────────────────────────────────────

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const { adminPass, subject, message } = await req.json();
    const adminPassword = Deno.env.get("ADMIN_PASSWORD");
    if (!adminPass || adminPass !== adminPassword) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!subject?.trim() || !message?.trim()) {
      return new Response(JSON.stringify({ error: "Subject and message are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    // "Active" = approved and not deleted — matches the definition already
    // used elsewhere in the admin console (e.g. activeCompanies).
    const { data: recipients, error: fetchError } = await supabase
      .from("contractors")
      .select("id, email, name")
      .eq("status", "approved")
      .or("deleted.eq.false,deleted.is.null");

    if (fetchError) {
      return new Response(JSON.stringify({ error: fetchError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const bodyHtml = message
      .split(/\n\s*\n/)
      .map((p: string) => `<p style="color: #334155; font-size: 14px; line-height: 1.7; margin: 0 0 16px;">${p.replace(/\n/g, "<br>")}</p>`)
      .join("");

    let sent = 0, failed = 0;

    for (const r of recipients || []) {
      if (!r.email) { failed++; continue; }
      const html = `
        <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px; background: #F8FAFC;">
          <div style="background: #0F172A; border-radius: 16px; padding: 32px; text-align: center; margin-bottom: 24px;">
            <h1 style="color: #F8FAFC; font-size: 24px; font-weight: 800; margin: 0 0 8px;">ProRated</h1>
            <p style="color: #94A3B8; font-size: 13px; margin: 0;">Built by Pros, Built for Pros</p>
          </div>
          <div style="background: #fff; border-radius: 16px; padding: 32px; border: 1px solid #E2E8F0;">
            <h2 style="color: #0F172A; font-size: 20px; font-weight: 800; margin: 0 0 16px;">${subject}</h2>
            ${bodyHtml}
            <div style="text-align: center; margin-top: 8px;">
              <a href="https://prorated.app"
                style="display: inline-block; background: #2563EB; color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-size: 14px; font-weight: 700;">
                Open ProRated →
              </a>
            </div>
          </div>
          <p style="color: #94A3B8; font-size: 11px; text-align: center; margin-top: 20px;">
            You're receiving this because you have a ProRated account.
          </p>
        </div>
      `;

      let ok = false;
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from:    "ProRated <hello@prorated.app>",
            to:      [r.email],
            subject,
            html,
          }),
        });
        ok = res.ok;
      } catch {
        ok = false;
      }
      if (ok) sent++; else failed++;

      // Log per-recipient, matching the existing notification_log convention
      await supabase.from("notification_log").insert({
        user_id: r.id,
        type:    "announcement",
        title:   subject,
        body:    `Sent to ${r.email}`,
        success: ok,
      }).catch(() => {});
    }

    return new Response(JSON.stringify({ sent, failed, total: (recipients || []).length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
