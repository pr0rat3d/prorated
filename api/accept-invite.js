// api/accept-invite.js
// Accepts a team invite: links contractor to company + marks invite used.
// Uses service role key so RLS on the contractors table is never an issue.

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { token } = req.body || {};
  if (!token) return res.status(400).json({ error: "token required" });

  const userJwt = req.headers.authorization?.replace("Bearer ", "");
  if (!userJwt) return res.status(401).json({ error: "unauthorized" });

  const base    = process.env.SUPABASE_URL;
  const svcKey  = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.SUPABASE_ANON_KEY;

  if (!base || !svcKey) return res.status(500).json({ error: "server_misconfigured" });

  // Decode user ID from JWT sub claim (no extra network call)
  let userId;
  try {
    const payload = JSON.parse(Buffer.from(userJwt.split(".")[1], "base64").toString());
    userId = payload.sub;
    if (!userId) throw new Error("no sub");
  } catch {
    return res.status(401).json({ error: "invalid token" });
  }

  const svcHeaders = {
    "apikey":        svcKey,
    "Authorization": `Bearer ${svcKey}`,
    "Content-Type":  "application/json",
  };

  try {
    // Fetch invite
    const invRes  = await fetch(`${base}/rest/v1/invites?token=eq.${token}&select=*&limit=1`, { headers: svcHeaders });
    const invites = await invRes.json();
    const invite  = invites?.[0];

    if (!invite)          return res.status(404).json({ error: "invite not found" });
    if (invite.accepted_at) return res.status(409).json({ error: "invite already accepted" });
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      return res.status(410).json({ error: "invite expired" });
    }

    // Verify email match if invite is email-specific — fail closed
    if (invite.email) {
      const userRes = await fetch(`${base}/auth/v1/user`, {
        headers: { "apikey": anonKey, "Authorization": `Bearer ${userJwt}` }
      });
      if (!userRes.ok) {
        return res.status(401).json({ error: "Could not verify your identity. Please try signing in again." });
      }
      const userData = await userRes.json();
      if (userData.email?.toLowerCase() !== invite.email.toLowerCase()) {
        return res.status(403).json({ error: `This invite was sent to ${invite.email}. Please sign in with that email address.` });
      }
    }

    // Link contractor to company using service role (bypasses RLS)
    const patchRes = await fetch(
      `${base}/rest/v1/contractors?id=eq.${userId}`,
      {
        method:  "PATCH",
        headers: { ...svcHeaders, "Prefer": "return=representation" },
        body:    JSON.stringify({
          company_id:        invite.company_id,
          company_role:      "member",
          status:            "approved",
          verification_tier: "self_attested",
        }),
      }
    );

    if (!patchRes.ok) {
      const errText = await patchRes.text().catch(() => "");
      return res.status(500).json({ error: `contractor update failed (${patchRes.status})${errText ? ": " + errText : ""}` });
    }

    // Mark invite accepted
    await fetch(
      `${base}/rest/v1/invites?token=eq.${token}`,
      {
        method:  "PATCH",
        headers: svcHeaders,
        body:    JSON.stringify({ accepted_at: new Date().toISOString() }),
      }
    );

    // Fetch company for client session update
    const compRes   = await fetch(`${base}/rest/v1/companies?id=eq.${invite.company_id}&select=id,name,plan&limit=1`, { headers: svcHeaders });
    const companies = await compRes.json();

    return res.status(200).json({
      success:    true,
      company_id: invite.company_id,
      company:    companies?.[0] || null,
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
