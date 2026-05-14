#!/usr/bin/env bun
/**
 * Red-Ocean / Blue-Ocean scoring for lumilab-research-keywords.
 *
 * Pure functions — no I/O. Implements the opportunity_score formula and
 * verdict labeling exactly per SKILL.md:
 *
 *   demand   = log10(volume + 1)
 *   momentum = clamp(1 + trend_slope_normalized, 0.5, 2)
 *   friction = 1 + (keyword_difficulty ?? serp_proxy) / 25
 *              # KD missing → serp_proxy = serp_strong_count * 10
 *   opportunity_score = round(demand * momentum / friction, 2)
 *
 * Verdict rules:
 *   low_demand      volume < threshold (default 50)
 *   blue_ocean      有量 + KD/SERP 低 + competition 低
 *   red_ocean       高量 + KD/SERP 高 + competition 高
 *   differentiation 高量 + 高竞争，但 trend 上升 或 长尾切口明显
 */
import type { KeywordMetric, Verdict } from './providers/index.ts';

export interface ScoreThresholds {
  low_demand: number;     // volume below this → low_demand
  high_volume: number;    // volume at/above this counts as "高量"
  low_friction: number;   // KD/SERP-proxy below this counts as "低"
  high_friction: number;  // KD/SERP-proxy at/above this counts as "高"
  low_competition: number;  // ad competition below this counts as "低"
  high_competition: number; // ad competition at/above this counts as "高"
  rising_slope: number;   // trend_slope above this counts as "上升"
}

export const DEFAULT_THRESHOLDS: ScoreThresholds = {
  low_demand: 50,
  high_volume: 5000,
  low_friction: 30,
  high_friction: 60,
  low_competition: 0.4,
  high_competition: 0.7,
  rising_slope: 0.05,
};

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

/**
 * Linear-regression slope of the trend series, normalized to roughly [-1, 1]
 * by dividing by the mean trend value. Positive = rising demand.
 */
export function trendSlope(trend: { value: number }[]): number {
  const n = trend.length;
  if (n < 2) return 0;
  const xs = trend.map((_, i) => i);
  const ys = trend.map((t) => t.value);
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - meanX) * (ys[i] - meanY);
    den += (xs[i] - meanX) ** 2;
  }
  if (den === 0) return 0;
  const rawSlope = num / den;
  if (meanY === 0) return 0;
  // Normalize: slope per step relative to average level.
  return round2(clamp(rawSlope / meanY, -1, 1));
}

/**
 * The friction input: keyword_difficulty when present, otherwise a SERP proxy
 * derived from serp_strong_count (× 10). Returns 0 when neither is available.
 */
export function frictionInput(metric: Pick<KeywordMetric, 'keyword_difficulty' | 'serp_strong_count'>): number {
  if (metric.keyword_difficulty != null) return metric.keyword_difficulty;
  if (metric.serp_strong_count != null) return metric.serp_strong_count * 10;
  return 0;
}

/** opportunity_score per the SKILL.md formula. */
export function opportunityScore(
  metric: Pick<KeywordMetric, 'volume' | 'trend_slope' | 'keyword_difficulty' | 'serp_strong_count'>,
): number {
  const demand = Math.log10(metric.volume + 1);
  const momentum = clamp(1 + metric.trend_slope, 0.5, 2);
  const friction = 1 + frictionInput(metric) / 25;
  return round2((demand * momentum) / friction);
}

/** verdict label per the SKILL.md rules. */
export function verdictOf(
  metric: Pick<KeywordMetric, 'volume' | 'competition' | 'trend_slope' | 'relation' | 'keyword_difficulty' | 'serp_strong_count'>,
  thresholds: ScoreThresholds = DEFAULT_THRESHOLDS,
): Verdict {
  if (metric.volume < thresholds.low_demand) return 'low_demand';

  const friction = frictionInput(metric);
  const competition = metric.competition ?? 0;
  const highVolume = metric.volume >= thresholds.high_volume;
  const lowFriction = friction <= thresholds.low_friction;
  const highFriction = friction >= thresholds.high_friction;
  const lowCompetition = competition <= thresholds.low_competition;
  const highCompetition = competition >= thresholds.high_competition;
  const rising = metric.trend_slope > thresholds.rising_slope;
  const longtailAngle = metric.relation === 'longtail' || metric.relation === 'pasf';

  // blue_ocean: 有量 + 低阻力 + 低广告竞争
  if (lowFriction && lowCompetition) return 'blue_ocean';

  // 高量 + 高竞争 → 红海，除非 trend 上升 / 长尾切口明显 → differentiation
  if (highVolume && (highFriction || highCompetition)) {
    if (rising || longtailAngle) return 'differentiation';
    return 'red_ocean';
  }

  // 中间地带：低阻力倾向蓝海，否则视上升势头判差异化，再否则红海
  if (lowFriction || lowCompetition) return 'blue_ocean';
  if (rising || longtailAngle) return 'differentiation';
  return 'red_ocean';
}

/**
 * Score a single metric in place-immutably: returns a NEW metric with
 * trend_slope, opportunity_score and verdict computed.
 */
export function scoreMetric(metric: KeywordMetric, thresholds: ScoreThresholds = DEFAULT_THRESHOLDS): KeywordMetric {
  const trend_slope = metric.trend_slope || trendSlope(metric.trend);
  const withSlope = { ...metric, trend_slope };
  return {
    ...withSlope,
    opportunity_score: opportunityScore(withSlope),
    verdict: verdictOf(withSlope, thresholds),
  };
}

/** Score a list of metrics, sorted by opportunity_score descending. */
export function scoreAll(metrics: KeywordMetric[], thresholds: ScoreThresholds = DEFAULT_THRESHOLDS): KeywordMetric[] {
  return metrics
    .map((m) => scoreMetric(m, thresholds))
    .sort((a, b) => b.opportunity_score - a.opportunity_score);
}
