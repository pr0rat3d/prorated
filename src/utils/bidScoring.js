// ─────────────────────────────────────────────────────────────
// ProRated — Bid Intelligence Scoring Engine
// Weights payment reliability highest, applies recency and
// reviewer-trust weighting, and derives a bid signal.
// ─────────────────────────────────────────────────────────────
import { getTagById } from "../data/tradeTags";
import { detectPatterns } from "./bidPatterns";

export const calculateBidScore = (reviews) => {

  // Payment first — getting paid is everything
  const WEIGHTS = {
    payment:       0.30,
    communication: 0.20,
    timeline:      0.20,
    access:        0.15,
    obstacles:     0.15,
  };

  const TAG_MODIFIERS = {
    bad:  -0.5,
    warn: -0.2,
    good: +0.3,
  };

  // Newer reviews count more
  const getRecencyWeight = (createdAt) => {
    const monthsAgo =
      (Date.now() - new Date(createdAt))
      / (1000 * 60 * 60 * 24 * 30);
    if (monthsAgo <= 6)  return 1.00;
    if (monthsAgo <= 12) return 0.75;
    if (monthsAgo <= 24) return 0.50;
    return 0.25;
  };

  // Established reviewers carry more weight
  const getTrustMultiplier = (trustScore) => {
    if (trustScore >= 80) return 1.3;
    if (trustScore >= 60) return 1.1;
    if (trustScore >= 40) return 1.0;
    if (trustScore >= 20) return 0.9;
    return 0.8;
  };

  let totalWeight = 0;
  let weightedSum = 0;
  let tagModifier = 0;
  let taggedReviewCount = 0;

  reviews.forEach(review => {
    const recency   = getRecencyWeight(review.created_at);
    const trustMult = getTrustMultiplier(review.reviewer_trust_score || 0);
    const combined  = recency * trustMult;

    // Only score categories this review actually answered — a missing
    // sub-score is "no data", not a 0. Weights are renormalized across
    // whatever's present so payment still matters most when it's known,
    // and a review with nothing usable is skipped rather than dragging
    // the average toward zero.
    const categories = [
      { value: review.payment_score,       weight: WEIGHTS.payment },
      { value: review.communication_score, weight: WEIGHTS.communication },
      { value: review.timeline_score,      weight: WEIGHTS.timeline },
      { value: review.access_score,        weight: WEIGHTS.access },
      { value: review.obstacles_score,     weight: WEIGHTS.obstacles },
    ].filter(c => c.value != null);

    if (categories.length === 0) return;

    const categoryWeightSum = categories.reduce((s, c) => s + c.weight, 0);
    const score = categories.reduce((s, c) => s + c.value * c.weight, 0) / categoryWeightSum;

    weightedSum += score * combined;
    totalWeight += combined;

    (review.tags || []).forEach(tagId => {
      const tag = getTagById(tagId);
      if (tag?.severity) {
        tagModifier += TAG_MODIFIERS[tag.severity] || 0;
      }
    });
    taggedReviewCount += 1;
  });

  const baseScore = totalWeight > 0 ? weightedSum / totalWeight : 0;

  // Average, not sum — otherwise review COUNT alone inflates how much tags
  // can move the score (20 mildly-tagged reviews would otherwise always
  // outweigh 3 severely-tagged ones), independent of actual sentiment strength.
  const avgTagModifier = taggedReviewCount > 0 ? tagModifier / taggedReviewCount : 0;

  const finalScore = Math.max(0, Math.min(5,
    baseScore + (avgTagModifier * 0.1)));

  const confidence =
    reviews.length >= 5 ? "high"   :
    reviews.length >= 3 ? "medium" :
    reviews.length >= 1 ? "low"    : "none";

  const signal =
    finalScore >= 4.5 ? "strong"    :
    finalScore >= 3.5 ? "good"      :
    finalScore >= 2.5 ? "caution"   :
    finalScore >= 1.5 ? "high_risk" : "avoid";

  const avg = (field) => {
    const vals = reviews
      .map(r => r[field])
      .filter(v => v > 0);
    return vals.length
      ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)
      : "N/A";
  };

  const tagCounts = {};
  reviews.forEach(r =>
    (r.tags || []).forEach(t => {
      tagCounts[t] = (tagCounts[t] || 0) + 1;
    })
  );
  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([id]) => id);

  return {
    finalScore:  parseFloat(finalScore.toFixed(2)),
    baseScore:   parseFloat(baseScore.toFixed(2)),
    tagModifier: parseFloat(avgTagModifier.toFixed(2)),
    confidence,
    signal,
    reviewCount: reviews.length,
    topTags,
    patterns: detectPatterns(reviews),
    categoryAvgs: {
      payment:       avg("payment_score"),
      communication: avg("communication_score"),
      timeline:      avg("timeline_score"),
      access:        avg("access_score"),
      obstacles:     avg("obstacles_score"),
    }
  };
};
