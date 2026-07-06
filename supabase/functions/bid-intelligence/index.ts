// supabase/functions/bid-intelligence/index.ts
// Generates an AI-powered Bid Intelligence report from pre-calculated
// review scoring data. JWT verification is OFF — this function is called
// directly from the frontend with the anon key, gated by the
// bid_intelligence feature flag + plan check on the client.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are Bid Intelligence, a specialized AI analysis engine built into ProRated — the verified job site intelligence platform for licensed trade professionals.

Your role is to analyze verified peer reviews and pre-calculated scoring data to generate actionable bid preparation intelligence.

Your audience is experienced trade professionals — roofers, plumbers, electricians, HVAC techs, painters, landscapers, pressure washers, and all other licensed trades. Speak their language. Be direct and practical. No corporate speak. No filler.

Scoring weights used:
- Payment Reliability: 30% (highest priority)
- Customer Communication: 20%
- Timeline Respect: 20%
- Access & Parking: 15%
- Job Site Obstacles: 15%

Recency weighting applied — newer reviews count more. Reviewer trust score weighting applied — established trade professionals carry more weight than brand new accounts.

CRITICAL RULES:
- Never fabricate anything not in review data
- Never suggest specific dollar amounts or percentages
- Directional advice only — flag conditions, let the trade professional use their own expertise
- If data is limited say so clearly
- Under 250 words total
- Always say trade professional not contractor`;

function buildUserPrompt(address: string, reviews: any[], bidScore: any) {
  const { finalScore, signal, confidence, reviewCount, topTags, categoryAvgs } = bidScore;

  const topTagsText = (topTags || []).join(", ") || "None flagged";

  const recentReviews = [...(reviews || [])]
    .sort((a, b) => new Date(b.created_at || b.date || 0).getTime() - new Date(a.created_at || a.date || 0).getTime())
    .slice(0, 5)
    .map(r => {
      const date  = (r.created_at || r.date || "").toString().split("T")[0];
      const score = r.overallScore ?? r.overall_score ?? "—";
      const tags  = (r.tags || []).join(", ") || "none";
      const text  = r.text || r.review_text || "";
      return `- ${date} · ${r.trade || "trade unknown"} · ${score}/5 · tags: ${tags}\n  "${text}"`;
    })
    .join("\n");

  return `Analyze job site: ${address}

Weighted Bid Score: ${finalScore}/5.0
Signal: ${signal}
Confidence: ${confidence} (${reviewCount} reviews)

Category averages:
Payment Reliability:    ${categoryAvgs.payment}/5.0
Customer Communication: ${categoryAvgs.communication}/5.0
Timeline Respect:       ${categoryAvgs.timeline}/5.0
Access & Parking:       ${categoryAvgs.access}/5.0
Job Site Obstacles:     ${categoryAvgs.obstacles}/5.0

Note: scores weighted by reviewer credibility and recency — established trade professionals carry more influence.

Top flagged conditions: ${topTagsText}

Recent reviews (most recent first):
${recentReviews || "No review text available."}

Return JSON only — no other text:
{
  "summary": "2-3 sentence site assessment in trade professional language",
  "risks": ["risk 1","risk 2","risk 3"],
  "positives": ["positive 1","positive 2"],
  "recommendation": "1-2 sentences directional advice — no numbers or percentages",
  "confidence": "high|medium|low",
  "signal": "strong|good|caution|high_risk|avoid",
  "score": ${finalScore}
}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { address, reviews, bidScore } = await req.json();

    if (!address || !bidScore) {
      return new Response(JSON.stringify({ error: "address and bidScore are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userPrompt = buildUserPrompt(address, reviews || [], bidScore);

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        temperature: 0.3,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text().catch(() => "");
      console.error("[ProRated] Bid Intelligence — Anthropic API error:", anthropicRes.status, errText);
      return new Response(JSON.stringify({ error: "AI generation failed" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await anthropicRes.json();
    const rawText = data?.content?.find((b: any) => b.type === "text")?.text || "";
    const cleaned = rawText.replace(/```json|```/g, "").trim();

    let report;
    try {
      report = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error("[ProRated] Bid Intelligence — JSON parse failed:", cleaned);
      return new Response(JSON.stringify({ error: "Malformed AI response" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(report), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: any) {
    console.error("[ProRated] Bid Intelligence exception:", err);
    return new Response(JSON.stringify({ error: err.message || "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
