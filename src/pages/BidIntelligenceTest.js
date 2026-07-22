// src/pages/BidIntelligenceTest.js
// ─────────────────────────────────────────────────────────────
// Bid Intelligence — Test Harness & Demo
//
// Every score on this page is computed by the REAL production scoring
// engine (src/utils/bidScoring.js — the exact same calculateBidScore()
// the live app calls) against synthetic-but-realistic review data built
// from the real tag library (src/data/tradeTags.js) and the real
// reviews table schema. Nothing here is a mocked or parallel algorithm —
// this is what the engine actually does, run against 14 constructed
// scenarios chosen to stress different parts of it.
//
// Internal tool. Not linked from product nav — reachable directly at
// /bid-intelligence-test for demo/QA use.
// ─────────────────────────────────────────────────────────────
import { useState } from "react";
import { calculateBidScore } from "../utils/bidScoring";
import { getTagById } from "../data/tradeTags";
import { BRAND, Bar } from "../components/UI";
import Logo from "../components/Logo";

// ── Review factory ──────────────────────────────────────────────
// Matches the real `reviews` table shape exactly: overall_score (1-5
// star rating shown on cards) is a SEPARATE field from the five
// sub-category scores (payment/communication/timeline/access/obstacles)
// that calculateBidScore actually weighs.
let _id = 0;
const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString();

const R = (overrides = {}) => ({
  id: `demo-${++_id}`,
  created_at: daysAgo(30),
  reviewer_trust_score: 50,
  overall_score: 4,
  payment_score: 4,
  communication_score: 4,
  timeline_score: 4,
  access_score: 4,
  obstacles_score: 4,
  tags: [],
  would_return: true,
  property_type: "homestead",
  work_label: "General Remodel",
  review_text: "",
  ...overrides,
});

// Shorthand builders used across scenarios
const good = (overrides = {}) => R({
  overall_score: 5, payment_score: 5, communication_score: 5, timeline_score: 4, access_score: 4, obstacles_score: 4,
  tags: ["pays_well", "great_owner"], would_return: true, ...overrides,
});
const bad = (overrides = {}) => R({
  overall_score: 2, payment_score: 2, communication_score: 2, timeline_score: 2, access_score: 3, obstacles_score: 3,
  tags: ["unreasonable"], would_return: false, ...overrides,
});

// ── 14 scenarios — the 12 requested + 2 covering Part 5 edge cases
// that weren't otherwise fully exercised (a large clean history with a
// single bad outlier, and reviews missing sub-scores entirely) ────────
const SCENARIOS = [
  {
    id: "dream-client", name: "Dream Client",
    desc: "9 positive, 1 neutral. Consistent payment, varied positive tags.",
    build: () => [
      ...Array.from({ length: 9 }, (_, i) => good({
        created_at: daysAgo(10 + i * 20), reviewer_trust_score: 40 + i * 5,
        tags: [["pays_well","great_owner"], ["great_comms","clear_scope"], ["easy_access","understanding"]][i % 3],
        review_text: "Paid immediately, clear scope, would work here again in a heartbeat.",
      })),
      R({ created_at: daysAgo(15), overall_score: 3, payment_score: 3, communication_score: 3, timeline_score: 3, access_score: 3, obstacles_score: 3, tags: [], would_return: null, review_text: "Fine, nothing remarkable either way." }),
    ],
  },
  {
    id: "payment-risky", name: "Payment Risky",
    desc: "6 positive, 4 late-payment. Good work, terrible cash flow.",
    build: () => [
      ...Array.from({ length: 6 }, (_, i) => good({ created_at: daysAgo(20 + i * 15) })),
      ...Array.from({ length: 4 }, (_, i) => R({
        created_at: daysAgo(30 + i * 25), overall_score: 3, payment_score: 1, communication_score: 4, timeline_score: 4, access_score: 4, obstacles_score: 4,
        tags: ["slow_payment"], would_return: null,
        review_text: "Work was solid, quality was there — but I had to call three times to get paid.",
      })),
    ],
  },
  {
    id: "scope-creep", name: "Scope Creep Nightmare",
    desc: "7 positive, 3 scope-creep. Homeowner wants free extras.",
    build: () => [
      ...Array.from({ length: 7 }, (_, i) => good({ created_at: daysAgo(15 + i * 18) })),
      ...Array.from({ length: 3 }, (_, i) => R({
        created_at: daysAgo(25 + i * 20), overall_score: 2, payment_score: 4, communication_score: 3, timeline_score: 2, access_score: 4, obstacles_score: 3,
        tags: ["scope_creep"], would_return: false,
        review_text: "Paid fine, but kept adding 'small' extras with the expectation they were included.",
      })),
    ],
  },
  {
    id: "comms-broken", name: "Communication Broken",
    desc: "8 positive, 2 communication-issues. Good work, hard to reach.",
    build: () => [
      ...Array.from({ length: 8 }, (_, i) => good({ created_at: daysAgo(10 + i * 15) })),
      ...Array.from({ length: 2 }, (_, i) => R({
        created_at: daysAgo(20 + i * 30), overall_score: 3, payment_score: 5, communication_score: 1, timeline_score: 3, access_score: 4, obstacles_score: 4,
        tags: ["poor_comms"], would_return: null,
        review_text: "Paid on time, work was good, but getting a decision out of them took days every time.",
      })),
    ],
  },
  {
    id: "red-flag-city", name: "Red Flag City",
    desc: "5 positive, 2 payment issues, 1 comms, 2 scope-creep.",
    build: () => [
      ...Array.from({ length: 5 }, (_, i) => good({ created_at: daysAgo(10 + i * 20) })),
      ...Array.from({ length: 2 }, (_, i) => R({ created_at: daysAgo(40 + i * 15), overall_score: 2, payment_score: 1, communication_score: 3, timeline_score: 3, access_score: 3, obstacles_score: 3, tags: ["slow_payment"], would_return: false })),
      R({ created_at: daysAgo(50), overall_score: 2, payment_score: 4, communication_score: 1, timeline_score: 3, access_score: 3, obstacles_score: 3, tags: ["poor_comms"], would_return: false }),
      ...Array.from({ length: 2 }, (_, i) => R({ created_at: daysAgo(60 + i * 10), overall_score: 2, payment_score: 3, communication_score: 3, timeline_score: 2, access_score: 3, obstacles_score: 3, tags: ["scope_creep"], would_return: false })),
    ],
  },
  {
    id: "split-opinion", name: "Split Opinion",
    desc: "5 positive, 5 negative. No clear pattern between reviewers.",
    build: () => [
      ...Array.from({ length: 5 }, (_, i) => good({ created_at: daysAgo(15 + i * 18), reviewer_trust_score: 60 })),
      ...Array.from({ length: 5 }, (_, i) => bad({
        created_at: daysAgo(20 + i * 22), reviewer_trust_score: 45,
        tags: [["rude_hostile"], ["poor_comms"], ["slow_payment"], ["scope_creep"], ["unreasonable"]][i],
      })),
    ],
  },
  {
    id: "mostly-bad", name: "Mostly Bad",
    desc: "2 positive, 8 negative with clear reasons. Avoid this one.",
    build: () => [
      ...Array.from({ length: 2 }, (_, i) => good({ created_at: daysAgo(200 + i * 40), reviewer_trust_score: 30 })),
      ...Array.from({ length: 8 }, (_, i) => bad({
        created_at: daysAgo(10 + i * 12), overall_score: 1, payment_score: 1, communication_score: 2, timeline_score: 2, access_score: 2, obstacles_score: 2,
        tags: [["rude_hostile","slow_payment"], ["unreasonable"], ["scope_creep","poor_comms"], ["slow_payment"], ["inflexible"], ["rude_hostile"], ["poor_comms","unreasonable"], ["slow_payment","scope_creep"]][i],
      })),
    ],
  },
  {
    id: "newer-contractor", name: "Newer Contractor",
    desc: "3 reviews, all positive. Limited data — medium confidence.",
    build: () => Array.from({ length: 3 }, (_, i) => good({ created_at: daysAgo(5 + i * 10), reviewer_trust_score: 55 })),
  },
  {
    id: "seasonal", name: "Seasonal Issue",
    desc: "6 positive, 4 late-payment clustered in winter months.",
    build: () => [
      ...Array.from({ length: 6 }, (_, i) => good({ created_at: daysAgo(40 + i * 25) })),
      // Winter cluster — recent enough (within ~6mo) to carry full recency weight
      ...Array.from({ length: 4 }, (_, i) => R({
        created_at: daysAgo(60 + i * 5), overall_score: 3, payment_score: 1, communication_score: 4, timeline_score: 3, access_score: 4, obstacles_score: 4,
        tags: ["slow_payment"], would_return: null,
        review_text: "Great in-season, but cash flow dried up over the winter — payment dragged for weeks.",
      })),
    ],
  },
  {
    id: "too-few", name: "Too Few Reviews",
    desc: "1 positive review only. Not enough data to trust.",
    build: () => [good({ created_at: daysAgo(8), reviewer_trust_score: 35 })],
  },
  {
    id: "perfect-storm", name: "Perfect Storm",
    desc: "Multiple red flags stacked across every category at once.",
    build: () => Array.from({ length: 6 }, (_, i) => R({
      created_at: daysAgo(10 + i * 12), overall_score: 1, payment_score: 1, communication_score: 1, timeline_score: 1, access_score: 2, obstacles_score: 1,
      tags: [["slow_payment","scope_creep"], ["rude_hostile","unreasonable"], ["poor_comms","slow_payment"], ["scope_creep","inflexible"], ["site_hazards","aggressive_dog"], ["slow_payment","poor_comms","scope_creep"]][i],
      would_return: false, reviewer_trust_score: 65,
      review_text: "Everything that could go wrong did — payment, scope, communication, all of it.",
    })),
  },
  {
    id: "contradictory", name: "Contradictory",
    desc: "Bimodal — raves and pans, nothing in between.",
    build: () => [
      ...Array.from({ length: 4 }, (_, i) => R({ created_at: daysAgo(15 + i * 15), overall_score: 5, payment_score: 5, communication_score: 5, timeline_score: 5, access_score: 5, obstacles_score: 5, tags: ["pays_well","great_owner","great_comms"], would_return: true, review_text: "Best homeowner I've worked with all year." })),
      ...Array.from({ length: 4 }, (_, i) => R({ created_at: daysAgo(18 + i * 15), overall_score: 1, payment_score: 1, communication_score: 1, timeline_score: 1, access_score: 1, obstacles_score: 1, tags: ["rude_hostile","slow_payment","unreasonable"], would_return: false, review_text: "Avoid at all costs — nightmare from day one." })),
    ],
  },
  {
    id: "one-bad-apple", name: "One Bad Apple",
    desc: "20 great reviews, 1 recent bad one. Does a big clean history absorb an outlier gracefully?",
    build: () => [
      ...Array.from({ length: 20 }, (_, i) => good({ created_at: daysAgo(20 + i * 18), reviewer_trust_score: 50 + (i % 5) * 8 })),
      bad({ created_at: daysAgo(5), overall_score: 1, payment_score: 1, tags: ["rude_hostile"], review_text: "Uncharacteristically bad — hopefully a one-off." }),
    ],
  },
  {
    id: "missing-data", name: "Missing Data",
    desc: "Some reviews have no sub-scores filled in at all — how does the engine treat a gap vs. a bad score?",
    build: () => [
      good({ created_at: daysAgo(20) }),
      good({ created_at: daysAgo(40) }),
      // payment_score intentionally omitted — real schema allows null here
      R({ created_at: daysAgo(10), overall_score: 4, payment_score: null, communication_score: 4, timeline_score: 4, access_score: 4, obstacles_score: 4, tags: [], would_return: true, review_text: "Left payment info blank — just didn't answer that question." }),
      R({ created_at: daysAgo(15), overall_score: 4, payment_score: undefined, communication_score: null, timeline_score: 4, access_score: 4, obstacles_score: 4, tags: [], would_return: true }),
    ],
  },
];

// ── Derived, transparent analysis built on the SAME real fields the
// engine uses — every number here traces back to something in the raw
// review data, nothing is invented ─────────────────────────────────
const WATCH_TAGS = ["scope_creep", "unclear_scope", "slow_payment", "poor_comms", "rude_hostile", "unreasonable", "inflexible", "rushed_timeline", "delayed_start", "site_hazards", "aggressive_dog", "pets_loose"];

function computeMix(reviews) {
  const ratingDist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  reviews.forEach(r => { const s = Math.round(r.overall_score || 0); if (ratingDist[s] !== undefined) ratingDist[s]++; });

  const tagFreq = {};
  reviews.forEach(r => (r.tags || []).forEach(t => { tagFreq[t] = (tagFreq[t] || 0) + 1; }));

  let onTime = 0, late = 0, noData = 0;
  reviews.forEach(r => {
    if (r.payment_score == null) { noData++; return; }
    if ((r.tags || []).includes("slow_payment") || r.payment_score <= 2) late++;
    else onTime++;
  });

  const wouldReturn = { yes: 0, no: 0, neutral: 0 };
  reviews.forEach(r => {
    if (r.would_return === true) wouldReturn.yes++;
    else if (r.would_return === false) wouldReturn.no++;
    else wouldReturn.neutral++;
  });

  return { ratingDist, tagFreq, paymentStatus: { onTime, late, noData }, wouldReturn, total: reviews.length };
}

function computeSubScores(reviews, mix) {
  const n = reviews.length || 1;
  const paymentReliability = Math.round((mix.paymentStatus.onTime / n) * 100);
  const scopeCreepCount = reviews.filter(r => (r.tags || []).some(t => ["scope_creep", "unclear_scope"].includes(t))).length;
  const scopeCreepRisk = Math.round((scopeCreepCount / n) * 100);
  const commVals = reviews.map(r => r.communication_score).filter(v => v != null);
  const communicationQuality = commVals.length ? Math.round((commVals.reduce((a, b) => a + b, 0) / commVals.length) / 5 * 100) : null;
  const satVals = reviews.map(r => r.overall_score).filter(v => v != null);
  const customerSatisfaction = satVals.length ? Math.round((satVals.reduce((a, b) => a + b, 0) / satVals.length) / 5 * 100) : null;
  const wouldReturnRate = Math.round((mix.wouldReturn.yes / n) * 100);
  return { paymentReliability, scopeCreepRisk, communicationQuality, customerSatisfaction, wouldReturnRate, scopeCreepCount };
}

function computeRedFlags(reviews, mix, bidResult) {
  const flags = [];
  const n = reviews.length;

  if (mix.tagFreq.scope_creep >= Math.ceil(n * 0.25)) {
    flags.push({ level: "warn", text: `${mix.tagFreq.scope_creep} of ${n} reviews (${Math.round(mix.tagFreq.scope_creep / n * 100)}%) flag scope creep` });
  }
  if (mix.paymentStatus.late >= Math.ceil(n * 0.25)) {
    flags.push({ level: "danger", text: `${mix.paymentStatus.late} of ${n} reviews (${Math.round(mix.paymentStatus.late / n * 100)}%) report payment delays` });
  }
  if (mix.tagFreq.poor_comms >= Math.ceil(n * 0.2)) {
    flags.push({ level: "warn", text: `${mix.tagFreq.poor_comms} of ${n} reviews flag poor communication` });
  }
  if (mix.paymentStatus.noData > 0) {
    flags.push({ level: "info", text: `${mix.paymentStatus.noData} review${mix.paymentStatus.noData !== 1 ? "s" : ""} missing payment data — the engine currently treats a gap as a 0, same as a bad score, not as "no signal"` });
  }
  if (bidResult.confidence === "low" || bidResult.confidence === "none") {
    flags.push({ level: "info", text: `Only ${n} review${n !== 1 ? "s" : ""} on file — ${bidResult.confidence} confidence` });
  }

  const sorted = [...reviews].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  if (sorted.length >= 4) {
    const half = Math.floor(sorted.length / 2);
    const avgOverall = arr => arr.reduce((s, r) => s + (r.overall_score || 0), 0) / arr.length;
    const recentAvg = avgOverall(sorted.slice(0, half));
    const olderAvg = avgOverall(sorted.slice(half));
    if (recentAvg < olderAvg - 0.75) {
      flags.push({ level: "warn", text: `Recent reviews (avg ${recentAvg.toFixed(1)}★) trending below older reviews (avg ${olderAvg.toFixed(1)}★) — declining pattern` });
    } else if (recentAvg > olderAvg + 0.75) {
      flags.push({ level: "good", text: `Recent reviews (avg ${recentAvg.toFixed(1)}★) trending above older reviews (avg ${olderAvg.toFixed(1)}★) — improving pattern` });
    }
  }

  if (flags.length === 0) flags.push({ level: "good", text: "No significant red flags — consistent positive feedback across reviewers" });
  return flags;
}

function computeRecommendation(bidResult) {
  if (bidResult.reviewCount === 0) return { label: "Insufficient Data", color: "#6B7280", reason: "No reviews on file for this address yet." };
  if (bidResult.confidence === "low" && bidResult.reviewCount <= 2) return { label: "Insufficient Data", color: "#6B7280", reason: `Only ${bidResult.reviewCount} review${bidResult.reviewCount !== 1 ? "s" : ""} on file — treat this signal as provisional until more data comes in.` };
  if (bidResult.signal === "strong" || bidResult.signal === "good") return { label: "Proceed with Confidence", color: "#16A34A", reason: `Signal is "${bidResult.signal}" with ${bidResult.confidence} confidence across ${bidResult.reviewCount} reviews.` };
  if (bidResult.signal === "caution") return { label: "Proceed with Caution", color: "#D97706", reason: "Mixed signals in the review history — review the flagged concerns below before bidding." };
  return { label: "High Risk", color: "#DC2626", reason: `Signal is "${bidResult.signal}" — multiple significant concerns show up consistently in the review history.` };
}

// ── UI atoms ─────────────────────────────────────────────────────
const SIGNAL_META = {
  strong:    { emoji: "🟢", label: "Strong", color: "#16A34A" },
  good:      { emoji: "🔵", label: "Good", color: "#2563EB" },
  caution:   { emoji: "🟡", label: "Caution", color: "#D97706" },
  high_risk: { emoji: "🔴", label: "High Risk", color: "#DC2626" },
  avoid:     { emoji: "⚫", label: "Avoid", color: "#374151" },
};
const CONF_META = {
  high: { label: "High Confidence", color: "#16A34A" },
  medium: { label: "Medium Confidence", color: "#D97706" },
  low: { label: "Low Confidence", color: "#DC2626" },
  none: { label: "No Confidence", color: "#6B7280" },
};
const FLAG_META = {
  danger: { bg: "#FEE2E2", color: "#991B1B", border: "#FCA5A5", icon: "⚠️" },
  warn:   { bg: "#FEF9C3", color: "#854D0E", border: "#FDE047", icon: "⚠️" },
  info:   { bg: "#EFF6FF", color: "#1E40AF", border: "#BFDBFE", icon: "ℹ️" },
  good:   { bg: "#DCFCE7", color: "#166534", border: "#86EFAC", icon: "✓" },
};

function MiniStat({ label, value, sub }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 20, fontWeight: 900, color: BRAND.dark, lineHeight: 1, fontFamily: "'DM Mono', monospace" }}>{value}</div>
      <div style={{ fontSize: 9.5, color: BRAND.gray, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", marginTop: 3 }}>{label}</div>
      {sub && <div style={{ fontSize: 9, color: "#94A3B8", marginTop: 1 }}>{sub}</div>}
    </div>
  );
}

function SubScoreBar({ label, value, invert = false, formula }) {
  const displayVal = value == null ? null : value;
  const color = value == null ? "#94A3B8" : invert
    ? (value <= 20 ? "#16A34A" : value <= 50 ? "#D97706" : "#DC2626")
    : (value >= 70 ? "#16A34A" : value >= 40 ? "#D97706" : "#DC2626");
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: BRAND.dark }}>{label}</span>
        <span style={{ fontSize: 12.5, fontWeight: 800, color, fontFamily: "'DM Mono', monospace" }}>{displayVal == null ? "N/A" : `${displayVal}%`}</span>
      </div>
      <div style={{ height: 7, background: "#E2E8F0", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${displayVal ?? 0}%`, background: color, borderRadius: 4, transition: "width 0.4s ease" }} />
      </div>
      {formula && <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 3, lineHeight: 1.5 }}>{formula}</div>}
    </div>
  );
}

// ── One scenario, fully analyzed ────────────────────────────────
function ScenarioCard({ scenario, expanded, onToggle }) {
  const reviews = scenario.build();
  const bidResult = calculateBidScore(reviews);
  const mix = computeMix(reviews);
  const subScores = computeSubScores(reviews, mix);
  const redFlags = computeRedFlags(reviews, mix, bidResult);
  const rec = computeRecommendation(bidResult);
  const sig = SIGNAL_META[bidResult.signal] || SIGNAL_META.caution;
  const conf = CONF_META[bidResult.confidence] || CONF_META.low;
  const overallPct = Math.round((bidResult.finalScore / 5) * 100);

  return (
    <div style={{ background: "#fff", border: `1.5px solid ${BRAND.border}`, borderRadius: 16, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
      {/* Header — always visible */}
      <div onClick={onToggle} style={{ cursor: "pointer", padding: "1.1rem 1.25rem", borderBottom: expanded ? `1px solid ${BRAND.border}` : "none" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: BRAND.dark }}>{scenario.name}</div>
            <div style={{ fontSize: 11.5, color: BRAND.gray, marginTop: 2, lineHeight: 1.5 }}>{scenario.desc}</div>
          </div>
          <div style={{ flexShrink: 0, textAlign: "center", background: sig.color, color: "#fff", borderRadius: 10, padding: "6px 10px" }}>
            <div style={{ fontSize: 16, fontWeight: 900, fontFamily: "'DM Mono', monospace", lineHeight: 1 }}>{bidResult.finalScore.toFixed(1)}</div>
            <div style={{ fontSize: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em", marginTop: 2 }}>{sig.emoji} {sig.label}</div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, background: "#F8FAFC", borderRadius: 10, padding: "10px 6px" }}>
          <MiniStat label="Reviews" value={bidResult.reviewCount} />
          <MiniStat label="Confidence" value={conf.label.split(" ")[0]} />
          <MiniStat label="Would Return" value={`${subScores.wouldReturnRate}%`} />
          <MiniStat label="Overall" value={`${overallPct}%`} />
        </div>
        <div style={{ textAlign: "center", marginTop: 8, fontSize: 11, color: BRAND.blue, fontWeight: 700 }}>
          {expanded ? "− Hide full breakdown" : "+ Show full breakdown"}
        </div>
      </div>

      {expanded && (
        <div style={{ padding: "1.25rem" }}>
          {/* A. Raw review data */}
          <SectionLabel>A · Raw Review Data ({reviews.length})</SectionLabel>
          <div style={{ overflowX: "auto", marginBottom: 20 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11.5 }}>
              <thead>
                <tr style={{ borderBottom: `1.5px solid ${BRAND.border}` }}>
                  {["★", "Pay", "Comm", "Time", "Acc", "Obs", "Tags", "Return", "Age"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "4px 6px", color: BRAND.gray, fontWeight: 700, fontSize: 10, textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reviews.map(r => {
                  const daysOld = Math.round((Date.now() - new Date(r.created_at)) / 86400000);
                  return (
                    <tr key={r.id} style={{ borderBottom: `1px solid ${BRAND.border}` }}>
                      <td style={{ padding: "5px 6px", fontWeight: 700 }}>{r.overall_score ?? "—"}</td>
                      <td style={{ padding: "5px 6px", color: r.payment_score == null ? "#94A3B8" : undefined }}>{r.payment_score ?? "∅"}</td>
                      <td style={{ padding: "5px 6px", color: r.communication_score == null ? "#94A3B8" : undefined }}>{r.communication_score ?? "∅"}</td>
                      <td style={{ padding: "5px 6px" }}>{r.timeline_score ?? "∅"}</td>
                      <td style={{ padding: "5px 6px" }}>{r.access_score ?? "∅"}</td>
                      <td style={{ padding: "5px 6px" }}>{r.obstacles_score ?? "∅"}</td>
                      <td style={{ padding: "5px 6px", maxWidth: 180 }}>
                        {(r.tags || []).map(t => {
                          const tag = getTagById(t);
                          return <span key={t} style={{ display: "inline-block", fontSize: 9.5, background: "#F1F5F9", color: "#475569", padding: "1px 6px", borderRadius: 10, marginRight: 3, marginBottom: 2 }}>{tag?.label || t}</span>;
                        })}
                      </td>
                      <td style={{ padding: "5px 6px" }}>{r.would_return === true ? "✓" : r.would_return === false ? "✗" : "—"}</td>
                      <td style={{ padding: "5px 6px", color: BRAND.gray }}>{daysOld}d</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* B. Review mix summary */}
          <SectionLabel>B · Review Mix Summary</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: BRAND.dark, marginBottom: 6 }}>Rating distribution</div>
              {[5, 4, 3, 2, 1].map(star => (
                <div key={star} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                  <span style={{ fontSize: 10, width: 24, color: BRAND.gray }}>{star}★</span>
                  <div style={{ flex: 1, height: 6, background: "#E2E8F0", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${(mix.ratingDist[star] / mix.total) * 100}%`, background: "#D97706", borderRadius: 3 }} />
                  </div>
                  <span style={{ fontSize: 10, width: 14, color: BRAND.gray }}>{mix.ratingDist[star]}</span>
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: BRAND.dark, marginBottom: 6 }}>Payment status</div>
              <div style={{ fontSize: 11.5, marginBottom: 3 }}>✅ On-time: <strong>{mix.paymentStatus.onTime}</strong></div>
              <div style={{ fontSize: 11.5, marginBottom: 3 }}>⏰ Late/disputed: <strong>{mix.paymentStatus.late}</strong></div>
              {mix.paymentStatus.noData > 0 && <div style={{ fontSize: 11.5, marginBottom: 3 }}>∅ No data: <strong>{mix.paymentStatus.noData}</strong></div>}
              <div style={{ fontSize: 11, fontWeight: 700, color: BRAND.dark, margin: "10px 0 6px" }}>Would return</div>
              <div style={{ fontSize: 11.5 }}>👍 {mix.wouldReturn.yes} · 👎 {mix.wouldReturn.no} · 🤷 {mix.wouldReturn.neutral}</div>
            </div>
          </div>
          {Object.keys(mix.tagFreq).length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: BRAND.dark, marginBottom: 6 }}>Tag frequency</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {Object.entries(mix.tagFreq).sort((a, b) => b[1] - a[1]).map(([tagId, count]) => {
                  const tag = getTagById(tagId);
                  const meta = tag?.severity === "bad" ? FLAG_META.danger : tag?.severity === "warn" ? FLAG_META.warn : FLAG_META.good;
                  return (
                    <span key={tagId} style={{ fontSize: 11, fontWeight: 600, background: meta.bg, color: meta.color, border: `1px solid ${meta.border}`, padding: "3px 9px", borderRadius: 20 }}>
                      {tag?.label || tagId} × {count}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* C. Bid Intelligence breakdown */}
          <SectionLabel>C · Bid Intelligence Breakdown</SectionLabel>
          <div style={{ background: "#F8FAFC", border: `1px solid ${BRAND.border}`, borderRadius: 12, padding: "14px 16px", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, paddingBottom: 14, borderBottom: `1px solid ${BRAND.border}` }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: BRAND.gray, textTransform: "uppercase", letterSpacing: "0.04em" }}>Overall Score (real engine output)</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: sig.color, fontFamily: "'DM Mono', monospace", lineHeight: 1.1 }}>{bidResult.finalScore.toFixed(2)} <span style={{ fontSize: 14, color: BRAND.gray }}>/ 5.0</span></div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: sig.color }}>{sig.emoji} {sig.label} signal</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: conf.color, marginTop: 2 }}>{conf.label}</div>
              </div>
            </div>
            <SubScoreBar label="Payment Reliability" value={subScores.paymentReliability}
              formula={`${mix.paymentStatus.onTime}/${mix.total} reviews on-time, no slow_payment tag or payment_score ≤ 2 (${mix.paymentStatus.onTime} of ${mix.total} = ${subScores.paymentReliability}%)`} />
            <SubScoreBar label="Scope Creep Risk" value={subScores.scopeCreepRisk} invert
              formula={`${subScores.scopeCreepCount}/${mix.total} reviews tagged scope_creep or unclear_scope`} />
            <SubScoreBar label="Communication Quality" value={subScores.communicationQuality}
              formula={`Avg communication_score across ${reviews.filter(r=>r.communication_score!=null).length} reviews with data, scaled to 100`} />
            <SubScoreBar label="Customer Satisfaction" value={subScores.customerSatisfaction}
              formula={`Avg overall_score (star rating) across all reviews, scaled to 100`} />
            <SubScoreBar label="Would-Return Rate" value={subScores.wouldReturnRate}
              formula={`${mix.wouldReturn.yes}/${mix.total} reviewers said yes (${mix.wouldReturn.no} no, ${mix.wouldReturn.neutral} didn't answer)`} />
          </div>

          {/* D. Algorithm transparency */}
          <SectionLabel>D · Algorithm Transparency</SectionLabel>
          <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 12, padding: "14px 16px", marginBottom: 20, fontSize: 12, color: "#1E3A8A", lineHeight: 1.7 }}>
            <p style={{ margin: "0 0 8px" }}>
              <strong>Base score</strong> = weighted average of the 5 sub-category scores per review — Payment 30%, Communication 20%, Timeline 20%, Access 15%, Obstacles 15% — with each review's contribution scaled by <strong>recency</strong> (reviews &gt;24mo old count for only 25% as much as reviews from the last 6mo) and <strong>reviewer trust</strong> (a trust-score-80+ reviewer's review counts 1.3×, a brand-new reviewer counts 0.8×).
            </p>
            <p style={{ margin: "0 0 8px" }}>
              This scenario's base score: <strong>{bidResult.baseScore.toFixed(2)}</strong>/5.
            </p>
            <p style={{ margin: "0 0 8px" }}>
              <strong>Tag modifier</strong> then nudges that base score: each "good"-severity tag adds +0.3, "warn" subtracts 0.2, "bad" subtracts 0.5 — summed across every tag on every review, then scaled ×0.1 before being added. This scenario's raw tag modifier: <strong>{bidResult.tagModifier >= 0 ? "+" : ""}{bidResult.tagModifier.toFixed(2)}</strong> → applied as {(bidResult.tagModifier * 0.1) >= 0 ? "+" : ""}{(bidResult.tagModifier * 0.1).toFixed(2)} to the final score.
            </p>
            <p style={{ margin: 0 }}>
              <strong>Final score</strong> = {bidResult.baseScore.toFixed(2)} + {(bidResult.tagModifier * 0.1).toFixed(2)} = <strong>{bidResult.finalScore.toFixed(2)}</strong>, clamped to [0, 5]. Confidence is {bidResult.confidence} because there {bidResult.reviewCount === 1 ? "is" : "are"} {bidResult.reviewCount} review{bidResult.reviewCount !== 1 ? "s" : ""} on file (5+ = high, 3-4 = medium, 1-2 = low).
            </p>
          </div>

          {/* E. Red flags */}
          <SectionLabel>E · Red Flags &amp; Warnings</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 20 }}>
            {redFlags.map((f, i) => {
              const m = FLAG_META[f.level];
              return (
                <div key={i} style={{ background: m.bg, color: m.color, border: `1px solid ${m.border}`, borderRadius: 9, padding: "8px 12px", fontSize: 12, fontWeight: 600 }}>
                  {m.icon} {f.text}
                </div>
              );
            })}
          </div>

          {/* F. Recommendation */}
          <SectionLabel>F · Recommendation</SectionLabel>
          <div style={{ background: rec.color, color: "#fff", borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 4 }}>{rec.label}</div>
            <div style={{ fontSize: 12.5, opacity: 0.92, lineHeight: 1.6 }}>{rec.reason}</div>
          </div>
        </div>
      )}
    </div>
  );
}

function SectionLabel({ children }) {
  return <div style={{ fontSize: 10.5, fontWeight: 800, color: BRAND.gray, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8, marginTop: 4 }}>{children}</div>;
}

// ── Page ─────────────────────────────────────────────────────────
export default function BidIntelligenceTest({ go }) {
  const [expandedId, setExpandedId] = useState(null);
  const [filter, setFilter] = useState("all");

  const analyzed = SCENARIOS.map(s => {
    const reviews = s.build();
    const result = calculateBidScore(reviews);
    return { ...s, result };
  });

  const filtered = analyzed.filter(s => {
    if (filter === "high-risk") return s.result.signal === "high_risk" || s.result.signal === "avoid";
    if (filter === "payment-issues") return computeMix(s.build()).paymentStatus.late > 0;
    if (filter === "low-confidence") return s.result.confidence === "low" || s.result.confidence === "none";
    return true;
  });

  const FILTERS = [
    { id: "all", label: `All (${analyzed.length})` },
    { id: "high-risk", label: `High Risk (${analyzed.filter(s => s.result.signal === "high_risk" || s.result.signal === "avoid").length})` },
    { id: "payment-issues", label: `Payment Issues (${analyzed.filter(s => computeMix(s.build()).paymentStatus.late > 0).length})` },
    { id: "low-confidence", label: `Low Confidence (${analyzed.filter(s => s.result.confidence === "low" || s.result.confidence === "none").length})` },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ background: BRAND.dark, padding: "2.5rem 1.5rem 2rem", textAlign: "center", position: "relative" }}>
        {go && (
          <button onClick={() => go("home")} style={{ position: "absolute", top: 16, left: 16, background: "none", border: "none", color: "#94A3B8", fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
            ← Back
          </button>
        )}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}><Logo size={48} /></div>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "#93C5FD", marginBottom: 10 }}>Internal Test Harness</div>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: "#F8FAFC", margin: "0 0 10px" }}>Bid Intelligence — Proof It Works</h1>
        <p style={{ fontSize: 13, color: "#94A3B8", maxWidth: 560, margin: "0 auto", lineHeight: 1.7 }}>
          Every score below is produced by <code style={{ background: "rgba(255,255,255,0.1)", padding: "1px 6px", borderRadius: 4, color: "#93C5FD" }}>calculateBidScore()</code> — the exact function running in production — against 14 constructed review scenarios. Nothing here is simulated separately from the real engine.
        </p>
      </div>

      <div style={{ maxWidth: 920, margin: "0 auto", padding: "1.5rem 1.25rem 4rem" }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: "1.5rem", justifyContent: "center" }}>
          {FILTERS.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              style={{ padding: "7px 14px", borderRadius: 20, border: `1.5px solid ${filter === f.id ? BRAND.blue : BRAND.border}`, background: filter === f.id ? BRAND.blue : "#fff", color: filter === f.id ? "#fff" : BRAND.dark, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
              {f.label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {filtered.map(s => (
            <ScenarioCard key={s.id} scenario={s} expanded={expandedId === s.id} onToggle={() => setExpandedId(id => id === s.id ? null : s.id)} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "3rem", color: BRAND.gray, fontSize: 13 }}>No scenarios match this filter.</div>
        )}

        <div style={{ marginTop: "2.5rem", background: "#fff", border: `1px solid ${BRAND.border}`, borderRadius: 14, padding: "1.25rem 1.5rem", fontSize: 11.5, color: BRAND.gray, lineHeight: 1.7 }}>
          <strong style={{ color: BRAND.dark }}>Note on scale:</strong> the production engine (<code>src/utils/bidScoring.js</code>) outputs a 0–5 continuous score plus a discrete signal (strong/good/caution/high_risk/avoid) and confidence (high/medium/low/none) — this page also shows that score as a 0–100% for easier scanning, but the 0–5 number and signal shown are the real, unmodified engine output every time.
        </div>
      </div>
    </div>
  );
}
