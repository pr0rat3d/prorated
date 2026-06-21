// ─────────────────────────────────────────────────────────────
// ProRated — Claude API Client
// Calls our Vercel proxy (/api/claude) which keeps the
// Anthropic API key server-side and never exposes it.
// ─────────────────────────────────────────────────────────────

async function callClaude(userPrompt, systemPrompt) {
  const response = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system:     systemPrompt,
      max_tokens: 1000,
      messages:   [{ role: "user", content: userPrompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || "API error");
  }

  const data = await response.json();
  const text = data.content?.find(b => b.type === "text")?.text || "{}";
  try { return JSON.parse(text.replace(/```json|```/g, "").trim()); }
  catch { return null; }
}

export async function generateAddressData(address) {
  return callClaude(
    `Generate realistic contractor job site rating data for: "${address}"

Return ONLY this exact JSON — no markdown, no extra text:
{
  "street": "street portion only",
  "city": "city",
  "state": "2-letter state",
  "zip": "zip code",
  "overallScore": <number 1.0-5.0, one decimal>,
  "reviewCount": <integer 4-18>,
  "ratings": {
    "access": <number 1.0-5.0>,
    "payment": <number 1.0-5.0>,
    "timeline": <number 1.0-5.0>,
    "communication": <number 1.0-5.0>,
    "obstacles": <number 1.0-5.0>
  },
  "tags": [<3-5 tag ids from: steep_driveway, no_parking, tight_access, aggressive_dog, scope_creep, slow_payment, micromanager, old_systems, hoa, unsafe, pays_well, easy_access, great_owner, clear_scope, poor_comms, great_comms, delayed_start, site_hazards>],
  "reviews": [
    {
      "id": "r1",
      "contractorName": "<First Last-initial.>",
      "contractorInitials": "<2 capitals>",
      "trade": "<one of: roofing painting plumbing electrical hvac general landscaping concrete>",
      "date": "<YYYY-MM-DD last 18 months>",
      "overallScore": <integer 1-5>,
      "tags": [<2-3 tag ids>],
      "text": "<authentic 2-3 sentence contractor review with specific job site details>",
      "helpfulCount": <integer 2-25>
    }
  ]
}
Include 3-4 reviews from different trades. Rate all 5 categories realistically.`,
    "You are a database API for ProRated, a contractor job-site rating platform. Tagline: Built by Pros, Built for Pros. Return ONLY valid JSON parseable by JSON.parse(). No markdown."
  );
}

export async function generateSubmitConfirmation(address, trade, overall) {
  return callClaude(
    `A ${trade} contractor submitted a ${overall}-star review on ProRated for "${address}".
Return ONLY: {"message": "<warm 1-2 sentence confirmation mentioning the address, pending verification, from the ProRated team — Built by Pros, Built for Pros>"}`,
    "You are the ProRated API. Return ONLY valid JSON."
  );
}
