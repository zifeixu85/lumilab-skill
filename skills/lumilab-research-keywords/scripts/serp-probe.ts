#!/usr/bin/env bun
/**
 * SERP competition probe for lumilab-research-keywords.
 *
 * For top keywords (by volume) this estimates `serp_strong_count` — how many
 * of the Google SERP top-10 are "strong" domains (high DR / big site / official).
 * That number both feeds the friction term of opportunity_score AND fills the
 * keyword_difficulty gap for the Keywords Everywhere provider.
 *
 * TODO: real implementation reuses lumi-lab's Playwright (Channel A) / Exa
 * (Channel B) to fetch the live Google SERP first page and count strong
 * domains; DataForSEO users can call Labs SERP Competitors directly and skip
 * crawling. Until that lands, this module returns a DETERMINISTIC heuristic
 * estimate from volume + ad competition so the pipeline never breaks tokenless.
 *
 * Usage (standalone, prints JSON):
 *   bun run scripts/serp-probe.ts "<keyword>" [--volume 1000] [--competition 0.5]
 */
import type { KeywordMetric } from './providers/index.ts';

export interface SerpProbeOpts {
  /** How many of the top keywords (by volume) to probe. Default 15. */
  topN: number;
  /** When false, probing is skipped entirely (--no-serp-probe). */
  enabled: boolean;
}

/**
 * Deterministic heuristic: stronger SERP competition correlates with higher
 * search volume and higher ad competition. Returns an integer 0–10.
 *
 * This is a STUB. It is intentionally pure and side-effect-free so it is
 * trivially testable and so callers behave identically with mock data.
 */
export function estimateSerpStrongCount(volume: number, competition: number | null): number {
  // Volume contributes up to ~7 points on a log scale (vol 100k → ~7).
  const volComponent = Math.min(7, Math.log10(volume + 1) * 1.4);
  // Ad competition contributes up to 3 points.
  const compComponent = (competition ?? 0.3) * 3;
  const raw = volComponent + compComponent;
  return Math.max(0, Math.min(10, Math.round(raw)));
}

/**
 * Probe SERP competition for a list of metrics. Returns NEW metrics with
 * `serp_strong_count` filled for the top-N by volume (and for any metric that
 * is missing keyword_difficulty, since scoring needs a friction input).
 *
 * Immutable: input array is not mutated.
 */
export function probeSerp(metrics: KeywordMetric[], opts: SerpProbeOpts): KeywordMetric[] {
  if (!opts.enabled) return metrics.map((m) => ({ ...m }));

  // Rank by volume; the top-N get probed regardless of KD availability.
  const ranked = [...metrics].sort((a, b) => b.volume - a.volume);
  const topKeywords = new Set(ranked.slice(0, opts.topN).map((m) => m.keyword));

  return metrics.map((m) => {
    const needsProbe = topKeywords.has(m.keyword) || m.keyword_difficulty == null;
    if (!needsProbe) return { ...m };
    const serp_strong_count = estimateSerpStrongCount(m.volume, m.competition);
    return { ...m, serp_strong_count };
  });
}

// ---- standalone CLI -------------------------------------------------------
if (import.meta.main) {
  const argv = process.argv.slice(2);
  let keyword = '';
  let volume = 1000;
  let competition: number | null = 0.5;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--volume') volume = Number(argv[++i]);
    else if (a === '--competition') competition = Number(argv[++i]);
    else if (!keyword) keyword = a;
  }
  if (!keyword) {
    console.error('用法：serp-probe.ts "<keyword>" [--volume N] [--competition 0-1]');
    process.exit(2);
  }
  const serp_strong_count = estimateSerpStrongCount(volume, competition);
  console.log(JSON.stringify({ keyword, volume, competition, serp_strong_count, note: 'deterministic stub — see TODO in serp-probe.ts' }, null, 2));
}
