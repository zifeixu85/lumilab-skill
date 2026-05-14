#!/usr/bin/env bun
/**
 * Keywords Everywhere provider — optional KeywordProvider adapter.
 *
 * Implements `expand` + `metrics` against Keywords Everywhere API v1.
 * Bearer auth from the `keywordseverywhere_api_key` secret:
 *   keychain first, then ~/.lumilab/secrets.json fallback.
 *
 * Endpoints used:
 *   - POST https://api.keywordseverywhere.com/v1/get_keyword_data   (volume / cpc / competition / trend)
 *   - POST https://api.keywordseverywhere.com/v1/get_related_keywords
 *   - POST https://api.keywordseverywhere.com/v1/get_pasf_keywords  ("People Also Search For")
 *
 * NOTE: KE has no Keyword Difficulty endpoint — `keyword_difficulty` is left
 * null here and filled by serp-probe.ts before scoring.
 */
import type { KeywordMetric, KeywordProvider, ExpandOpts, MetricsOpts } from './index.ts';
import { loadSecret } from './index.ts';

const BASE = 'https://api.keywordseverywhere.com/v1';

function bearer(): string | null {
  const key = loadSecret('keywordseverywhere_api_key');
  return key ? `Bearer ${key}` : null;
}

export function hasToken(): boolean {
  return bearer() !== null;
}

async function call(path: string, form: Record<string, string | string[]>): Promise<any> {
  const auth = bearer();
  if (!auth) throw new Error('E_AUTH · 未配置 keywordseverywhere_api_key');
  const body = new URLSearchParams();
  for (const [k, v] of Object.entries(form)) {
    if (Array.isArray(v)) for (const item of v) body.append(`${k}[]`, item);
    else body.append(k, v);
  }
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { Authorization: auth, 'content-type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`E_${res.status} · KeywordsEverywhere ${path}: ${res.statusText}${text ? ' · ' + text.slice(0, 200) : ''}`);
  }
  return res.json();
}

function dedupe(list: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const k of list) {
    const norm = k.trim().toLowerCase();
    if (!norm || seen.has(norm)) continue;
    seen.add(norm);
    out.push(k.trim());
  }
  return out;
}

async function expand(seeds: string[], opts: ExpandOpts): Promise<string[]> {
  const breadth = opts.breadth ?? 3;
  const collected: string[] = [...seeds];
  const perSeed = Math.max(10, 15 * breadth);

  for (const seed of seeds) {
    try {
      const related = await call('/get_related_keywords', { keyword: seed, num: String(perSeed) });
      for (const r of related?.data ?? []) {
        const kw = typeof r === 'string' ? r : r?.keyword;
        if (kw) collected.push(kw);
      }
    } catch (e) {
      console.error(`  get_related_keywords("${seed}") 失败: ${(e as Error).message}`);
    }
    try {
      const pasf = await call('/get_pasf_keywords', { keyword: seed, num: String(perSeed) });
      for (const r of pasf?.data ?? []) {
        const kw = typeof r === 'string' ? r : r?.keyword;
        if (kw) collected.push(kw);
      }
    } catch (e) {
      console.error(`  get_pasf_keywords("${seed}") 失败: ${(e as Error).message}`);
    }
  }

  return dedupe(collected).slice(0, 150);
}

const MONTH_KEYS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

function parseTrend(trend: unknown): { month: string; year: number; value: number }[] {
  if (!Array.isArray(trend)) return [];
  return trend.map((t: any) => ({
    month: t?.month ?? '',
    year: Number(t?.year ?? 0),
    value: Number(t?.value ?? 0),
  }));
}

async function metrics(keywords: string[], opts: MetricsOpts): Promise<KeywordMetric[]> {
  const now = new Date().toISOString();
  const byKeyword = new Map<string, any>();

  // KE supports up to 100 keywords per call.
  for (let i = 0; i < keywords.length; i += 100) {
    const batch = keywords.slice(i, i + 100);
    try {
      const result = await call('/get_keyword_data', {
        kw: batch,
        country: opts.country,
        currency: 'USD',
        dataSource: 'gkp',
      });
      for (const row of result?.data ?? []) {
        if (row?.keyword) byKeyword.set(String(row.keyword).toLowerCase(), row);
      }
    } catch (e) {
      console.error(`  get_keyword_data batch 失败: ${(e as Error).message}`);
    }
  }

  return keywords.map((keyword) => {
    const norm = keyword.toLowerCase();
    const row = byKeyword.get(norm);
    const relation = opts.relationOf?.(keyword) ?? 'related';
    const metric: KeywordMetric = {
      keyword,
      provider: 'keywordseverywhere',
      volume: Number(row?.vol ?? 0),
      cpc: row?.cpc?.value != null ? Number(row.cpc.value) : (row?.cpc != null ? Number(row.cpc) : null),
      competition: row?.competition != null ? Number(row.competition) : null,
      keyword_difficulty: null, // KE has no KD — filled by serp-probe
      trend: parseTrend(row?.trend),
      trend_slope: 0,
      serp_strong_count: null,
      relation,
      opportunity_score: 0,
      verdict: 'low_demand',
      retrieved_at: now,
    };
    return metric;
  });
}

export const keywordsEverywhereProvider: KeywordProvider = {
  name: 'keywordseverywhere',
  expand,
  metrics,
  hasToken,
};
