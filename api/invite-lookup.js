// api/invite-lookup.js — Server-side invite + company lookup
// Uses service key to bypass RLS — invite tokens are public by design
// (UUID tokens are unguessable; no auth required to look one up)

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  const { token } = req.query;
  if (!token || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token)) {
    return res.status(400).json({ error: "invalid_token" });
  }

  const base    = process.env.SUPABASE_URL;
  const svcKey  = process.env.SUPABASE_SERVICE_KEY;
  if (!base || !svcKey) return res.status(500).json({ error: "server_misconfigured" });

  const headers = {
    "apikey":        svcKey,
    "Authorization": `Bearer ${svcKey}`,
  };

  try {
    const invRes  = await fetch(`${base}/rest/v1/invites?token=eq.${token}&select=*&limit=1`, { headers });
    const invites = await invRes.json();
    const invite  = invites?.[0];

    if (!invite) return res.status(404).json({ error: "not_found" });

    const compRes   = await fetch(`${base}/rest/v1/companies?id=eq.${invite.company_id}&select=id,name,plan&limit=1`, { headers });
    const companies = await compRes.json();

    res.status(200).json({ invite, company: companies?.[0] || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
