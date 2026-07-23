// ─────────────────────────────────────────────────────────────
// ProRated — Bid Intelligence Pattern Detectors
// Deterministic, rule-based annotations that run alongside
// calculateBidScore() — these don't change the score itself, they
// flag *why* a score looks the way it does (a masked outlier, a
// genuine split in reviewer opinion, a trend). Each detector is a
// pure function over the same review rows calculateBidScore() sees.
// ─────────────────────────────────────────────────────────────

// A strong majority of positive reviews with only 1-2 negative ones —
// the score already isn't fully masked by these (see bidScoring.js's
// tag-modifier averaging), but a contractor should still be told
// explicitly that a low review is a rare exception, not a pattern.
export function detectOutlier(reviews) {
  const n = reviews.length;
  if (n === 0) return null;
  const positive = reviews.filter(r => (r.overall_score || 0) >= 4).length;
  const negative = reviews.filter(r => (r.overall_score || 0) > 0 && r.overall_score <= 2).length;
  const positiveRatio = positive / n;
  if (positiveRatio >= 0.85 && negative >= 1 && negative <= 2) {
    return { type: "isolated_incident", positiveCount: positive, negativeCount: negative, total: n };
  }
  return null;
}

// Reviews split sharply between very positive and very negative with
// little middle ground — a bimodal distribution reads very differently
// from a uniform "consistently mediocre" 3-star average, even though
// both can average out to a similar score.
export function detectBimodal(reviews) {
  const n = reviews.length;
  if (n === 0) return null;
  const positive = reviews.filter(r => (r.overall_score || 0) >= 4).length / n;
  const negative = reviews.filter(r => (r.overall_score || 0) > 0 && r.overall_score <= 2).length / n;
  const neutral  = reviews.filter(r => r.overall_score === 3).length / n;
  if (positive > 0.3 && negative > 0.3 && neutral < 0.2) {
    return { type: "split_opinion", positivePct: Math.round(positive * 100), negativePct: Math.round(negative * 100) };
  }
  return null;
}

// Recent reviews trending meaningfully above/below older reviews —
// promoted out of the internal test harness (BidIntelligenceTest.js
// used to compute this inline) so production and the demo use the
// exact same function instead of two copies that can drift apart.
export function detectTrend(reviews) {
  if (reviews.length < 4) return null;
  const sorted = [...reviews].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const half = Math.floor(sorted.length / 2);
  const avgOverall = arr => arr.reduce((s, r) => s + (r.overall_score || 0), 0) / arr.length;
  const recentAvg = avgOverall(sorted.slice(0, half));
  const olderAvg  = avgOverall(sorted.slice(half));
  if (recentAvg < olderAvg - 0.75) {
    return { type: "declining_trend", recentAvg: parseFloat(recentAvg.toFixed(2)), olderAvg: parseFloat(olderAvg.toFixed(2)) };
  }
  if (recentAvg > olderAvg + 0.75) {
    return { type: "improving_trend", recentAvg: parseFloat(recentAvg.toFixed(2)), olderAvg: parseFloat(olderAvg.toFixed(2)) };
  }
  return null;
}

export function detectPatterns(reviews) {
  return [detectOutlier(reviews), detectBimodal(reviews), detectTrend(reviews)].filter(Boolean);
}
