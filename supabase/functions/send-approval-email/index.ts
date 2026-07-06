// ─────────────────────────────────────────────────────────────
// ProRated — Email Notification Edge Function
// Sends approval/rejection emails to contractors
//
// Deploy: supabase functions deploy send-approval-email
//
// Called from AdminPage when approving/rejecting a contractor
// Uses Resend for reliable email delivery (free tier: 3000/month)
// Sign up at resend.com and set RESEND_API_KEY in Supabase secrets
// ─────────────────────────────────────────────────────────────

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin":  "*",
        "Access-Control-Allow-Headers": "authorization, content-type",
      },
    });
  }

  try {
    const body = await req.json();
    const { contractorId, status, rejectionReason, type, inviteEmail, companyName, invitedByName,
            userName, userEmail, userTrade, userState, userLicense } = body;

    // Init Supabase
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // ── Handle admin signup notifications ─────────────────────
    if (type === "admin_notify") {
      const resendKey = Deno.env.get("RESEND_API_KEY");
      if (!resendKey) {
        console.log(`[ProRated] Would notify admin of new signup: ${userEmail}`);
        return new Response(JSON.stringify({ sent: false, reason: "no-resend-key" }), {
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      }
      const adminRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendKey}` },
        body: JSON.stringify({
          from: "ProRated <hello@prorated.app>",
          to: "hello@prorated.app",
          subject: `New ProRated member pending verification — ${userName}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px; background: #F8FAFC;">
              <div style="background: #0F172A; border-radius: 16px; padding: 32px; text-align: center; margin-bottom: 24px;">
                <h1 style="color: #F8FAFC; font-size: 24px; font-weight: 800; margin: 0 0 8px;">ProRated</h1>
                <p style="color: #94A3B8; margin: 0; font-size: 14px;">Admin Notification</p>
              </div>
              <div style="background: #fff; border-radius: 16px; padding: 32px; border: 1px solid #E2E8F0;">
                <h2 style="color: #0F172A; font-size: 20px; margin: 0 0 20px;">🔔 New member pending verification</h2>
                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                  <tr style="border-bottom: 1px solid #F1F5F9;">
                    <td style="padding: 10px 0; color: #64748B; width: 40%;">Name</td>
                    <td style="padding: 10px 0; color: #0F172A; font-weight: 600;">${userName}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #F1F5F9;">
                    <td style="padding: 10px 0; color: #64748B;">Email</td>
                    <td style="padding: 10px 0; color: #0F172A; font-weight: 600;">${userEmail}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #F1F5F9;">
                    <td style="padding: 10px 0; color: #64748B;">Trade</td>
                    <td style="padding: 10px 0; color: #0F172A; font-weight: 600;">${userTrade || "—"}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #F1F5F9;">
                    <td style="padding: 10px 0; color: #64748B;">State</td>
                    <td style="padding: 10px 0; color: #0F172A; font-weight: 600;">${userState || "—"}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; color: #64748B;">License #</td>
                    <td style="padding: 10px 0; color: #0F172A; font-weight: 600;">${userLicense || "—"}</td>
                  </tr>
                </table>
                <div style="text-align: center; margin-top: 28px;">
                  <a href="https://prorated.app/admin" style="background: #2563EB; color: #fff; text-decoration: none; padding: 13px 28px; border-radius: 10px; font-size: 14px; font-weight: 700; display: inline-block;">
                    Review in Admin Panel →
                  </a>
                </div>
              </div>
              <p style="color: #94A3B8; font-size: 11px; text-align: center; margin-top: 20px;">
                ProRated · <a href="https://prorated.app/admin" style="color: #94A3B8;">prorated.app/admin</a>
              </p>
            </div>
          `,
        }),
      });
      const adminData = await adminRes.json();
      return new Response(JSON.stringify({ ok: adminRes.ok, resend: adminData }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    // ── Handle team invite emails ──────────────────────────────
    if (type === "invite") {
      if (!inviteEmail) {
        return new Response(JSON.stringify({ error: "inviteEmail required" }), { status: 400 });
      }
      const inviteResendKey = Deno.env.get("RESEND_API_KEY");
      if (!inviteResendKey) {
        console.log(`[ProRated] Would send invite email to ${inviteEmail} — no RESEND_API_KEY`);
        return new Response(JSON.stringify({ sent: false, reason: "no-resend-key" }), {
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      }
      const link = body.inviteLink || `https://prorated.app/invite/`;
      const inviteRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${inviteResendKey}` },
        body: JSON.stringify({
          from: "ProRated <hello@prorated.app>",
          to: inviteEmail,
          subject: `${invitedByName || "A team"} invited you to join ProRated`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px; background: #F8FAFC;">
              <div style="background: #0F172A; border-radius: 16px; padding: 32px; text-align: center; margin-bottom: 24px;">
                <h1 style="color: #F8FAFC; font-size: 24px; font-weight: 800; margin: 0 0 8px;">ProRated</h1>
                <p style="color: #94A3B8; margin: 0; font-size: 14px;">Built by Pros, Built for Pros</p>
              </div>
              <div style="background: #fff; border-radius: 16px; padding: 32px; border: 1px solid #E2E8F0;">
                <h2 style="color: #0F172A; font-size: 20px; margin: 0 0 16px;">You've been invited!</h2>
                <p style="color: #475569; font-size: 15px; line-height: 1.6;">
                  <strong>${invitedByName || "A team member"}</strong> has invited you to join their team workspace <strong>${companyName || "on ProRated"}</strong>.
                </p>
                <p style="color: #475569; font-size: 15px; line-height: 1.6;">
                  ProRated is a verified job site intelligence platform for licensed trade professionals. Sign up to access job site reviews, manage your team, and bid smarter.
                </p>
                <div style="text-align: center; margin: 32px 0;">
                  <a href="${link}" style="background: #2563EB; color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-size: 15px; font-weight: 700; display: inline-block;">
                    Accept Invitation →
                  </a>
                </div>
                <p style="color: #94A3B8; font-size: 12px; text-align: center;">
                  Sign up with this email address (${inviteEmail}) to automatically join the team.
                </p>
              </div>
              <p style="color: #94A3B8; font-size: 11px; text-align: center; margin-top: 24px;">
                Built by Pros, Built for Pros · <a href="https://prorated.app" style="color: #94A3B8;">prorated.app</a>
              </p>
            </div>
          `,
        }),
      });
      const inviteData = await inviteRes.json();
      return new Response(JSON.stringify({ ok: true, resend: inviteData }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    // ── Handle approval / rejection emails ─────────────────────
    if (!contractorId || !status) {
      return new Response(JSON.stringify({ error: "contractorId and status required" }), { status: 400 });
    }

    // Get contractor details + email from auth.users
    const { data: contractor } = await supabase
      .from("contractors")
      .select("name, email, trade, state, license, plan")
      .eq("id", contractorId)
      .single();

    if (!contractor?.email) {
      return new Response(JSON.stringify({ error: "Contractor not found" }), { status: 404 });
    }

    const name  = contractor.name || "Contractor";
    const email = contractor.email;
    const isPaid = contractor.plan && contractor.plan !== "free";
    const searchLimit = isPaid ? "Unlimited searches" : "10 searches/month";

    // Bronze/Silver/Gold are free through Dec 31, 2026 (card collected, not charged
    // until Jan 2027). Platinum is custom-priced and unaffected by this promo.
    const planLabel = contractor.plan
      ? contractor.plan.charAt(0).toUpperCase() + contractor.plan.slice(1)
      : "";
    const isFree2026Plan = ["bronze", "silver", "gold"].includes(contractor.plan);
    const free2026Note = isFree2026Plan
      ? `<div style="background: #F0FDF4; border: 1px solid #86EFAC; border-radius: 12px; padding: 16px 20px; margin-bottom: 24px;">
           <p style="color: #166534; font-size: 13px; line-height: 1.6; margin: 0;">
             🎉 Your <strong>${planLabel}</strong> plan is active and free through December 31, 2026. Your card will not be charged until January 2027. Search, review, and help build the ProRated community.
           </p>
         </div>`
      : "";

    let subject: string;
    let html: string;

    if (status === "approved") {
      subject = "🎉 Welcome to ProRated — Your account is approved!";
      html = `
        <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px; background: #F8FAFC;">
          <div style="background: #0F172A; border-radius: 16px; padding: 32px; text-align: center; margin-bottom: 24px;">
            <h1 style="color: #F8FAFC; font-size: 24px; font-weight: 800; margin: 0 0 8px;">ProRated</h1>
            <p style="color: #94A3B8; font-size: 13px; margin: 0;">Built by Pros, Built for Pros</p>
          </div>
          <div style="background: #fff; border-radius: 16px; padding: 32px; border: 1px solid #E2E8F0;">
            <div style="text-align: center; margin-bottom: 24px;">
              <div style="font-size: 48px; margin-bottom: 12px;">✅</div>
              <h2 style="color: #0F172A; font-size: 22px; font-weight: 800; margin: 0 0 8px;">You're verified, ${name}!</h2>
              <p style="color: #64748B; font-size: 14px; line-height: 1.6; margin: 0;">
                Your contractor license has been verified and your ProRated account is fully active.
              </p>
            </div>
            ${free2026Note}
            <div style="background: #F0FDF4; border: 1px solid #86EFAC; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
              <p style="color: #166534; font-size: 13px; font-weight: 700; margin: 0 0 12px;">You can now:</p>
              <p style="color: #166534; font-size: 13px; margin: 4px 0;">✓ Search job site addresses (${searchLimit})</p>
              <p style="color: #166534; font-size: 13px; margin: 4px 0;">✓ Leave reviews for job sites you've worked</p>
              <p style="color: #166534; font-size: 13px; margin: 4px 0;">✓ Save addresses to your watchlist</p>
              <p style="color: #166534; font-size: 13px; margin: 4px 0;">✓ Get push notifications on saved addresses</p>
            </div>
            <div style="text-align: center;">
              <a href="https://prorated.app" 
                style="display: inline-block; background: #2563EB; color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-size: 15px; font-weight: 700;">
                Start searching job sites →
              </a>
            </div>
          </div>
          <p style="text-align: center; color: #94A3B8; font-size: 11px; margin-top: 20px;">
            ProRated · Hoover, Alabama · <a href="mailto:hello@prorated.app" style="color: #2563EB;">hello@prorated.app</a>
          </p>
        </div>
      `;
    } else if (status === "rejected") {
      subject = "ProRated — License verification update";
      html = `
        <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px; background: #F8FAFC;">
          <div style="background: #0F172A; border-radius: 16px; padding: 32px; text-align: center; margin-bottom: 24px;">
            <h1 style="color: #F8FAFC; font-size: 24px; font-weight: 800; margin: 0 0 8px;">ProRated</h1>
            <p style="color: #94A3B8; font-size: 13px; margin: 0;">Built by Pros, Built for Pros</p>
          </div>
          <div style="background: #fff; border-radius: 16px; padding: 32px; border: 1px solid #E2E8F0;">
            <h2 style="color: #0F172A; font-size: 20px; font-weight: 800; margin: 0 0 16px;">Hi ${name},</h2>
            <p style="color: #64748B; font-size: 14px; line-height: 1.65; margin: 0 0 20px;">
              We were unable to verify your contractor license at this time.
            </p>
            <div style="background: #FEF2F2; border: 1px solid #FECACA; border-radius: 12px; padding: 16px 20px; margin-bottom: 24px;">
              <p style="color: #991B1B; font-size: 13px; font-weight: 700; margin: 0 0 6px;">Reason:</p>
              <p style="color: #7F1D1D; font-size: 13px; margin: 0; line-height: 1.6;">
                ${rejectionReason || "Unable to verify license in state contractor database."}
              </p>
            </div>
            <p style="color: #64748B; font-size: 14px; line-height: 1.65; margin: 0 0 16px;">
              If you believe this is an error, please reply to this email with:
            </p>
            <ul style="color: #64748B; font-size: 14px; line-height: 1.8; margin: 0 0 24px; padding-left: 20px;">
              <li>Your license number</li>
              <li>Your state</li>
              <li>A photo or scan of your license</li>
            </ul>
            <p style="color: #64748B; font-size: 13px; margin: 0;">
              We review appeals within 2 business days.
            </p>
          </div>
          <p style="text-align: center; color: #94A3B8; font-size: 11px; margin-top: 20px;">
            ProRated · <a href="mailto:hello@prorated.app" style="color: #2563EB;">hello@prorated.app</a>
          </p>
        </div>
      `;
    } else {
      return new Response(JSON.stringify({ error: "Invalid status" }), { status: 400 });
    }

    // Send via Resend
    const resendKey = Deno.env.get("RESEND_API_KEY");

    if (!resendKey) {
      // Log to console if no email key set — at least we tried
      console.log(`[ProRated] Would send ${status} email to ${email}`);
      return new Response(JSON.stringify({ sent: false, reason: "no-resend-key", email }));
    }

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from:    "ProRated <hello@prorated.app>",
        to:      [email],
        subject,
        html,
      }),
    });

    const emailData = await emailRes.json();

    // Log to notification_log
    try {
      await supabase.from("notification_log").insert({
        user_id: contractorId,
        type:    `contractor_${status}`,
        title:   subject,
        body:    `Sent to ${email}`,
        success: emailRes.ok,
      });
    } catch {}

    return new Response(
      JSON.stringify({ sent: emailRes.ok, email, emailId: emailData.id }),
      { headers: { "Content-Type": "application/json" } }
    );

  } catch (err: any) {
    console.error("[ProRated] Email function error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
