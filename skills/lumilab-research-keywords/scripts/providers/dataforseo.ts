#!/usr/bin/env bun
/**
 * DataForSEO provider — default KeywordProvider adapter.
 *
 * Implements `expand` + `metrics` against DataForSEO API v3.
 * Basic auth from `dataforseo_login` / `dataforseo_password` secrets:
 *   keychain first (../lumilab-config/scripts/keychain.ts), then
 *   ~/.lumilab/secrets.json fallback — same pattern as research-platforms/web_tavily.ts.
 *
 * Endpoints used (per SKILL.md):
 *   - Keywords Data Google Ads Search Volume   /v3/keywords_data/google_ads/search_volume/live
 *   - Labs Bulk Keyword Difficulty             /v3/dataforseo_labs/google/bulk_keyword_difficulty/live
 *   - Labs Related Keywords                    /v3/dataforseo_labs/google/related_keywords/live
 *   - Labs Keyword Suggestions                 /v3/dataforseo_labs/google/keyword_suggestions/live
 *   - Labs Keyword Ideas                       /v3/dataforseo_labs/google/keyword_ideas/live
 */
import type { KeywordMetric, KeywordProvider, ExpandOpts, MetricsOpts } from './index.ts';
import { loadSecret } from './index.ts';

const BASE = 'https://api.dataforseo.com';

function basicAuth(): string | null {
  const login = loadSecret('dataforseo_login');
  const password = loadSecret('dataforseo_password');
  if (!login || !password) return null;
  return 'Basic ' + Buffer.from(`${login}:${password}`).toString('base64');
}

export function hasToken(): boolean {
  return basicAuth() !== null;
}

async function call(path: string, payload: unknown): Promise<any> {
  const auth = basicAuth();
  if (!auth) throw new Error('E_AUTH · 未配置 dataforseo_login / dataforseo_password');
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { Authorization: auth, 'content-type': 'application/json' },
    body: JSON.stringify([payload]),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`E_${res.status} · DataForSEO ${path}: ${res.statusText}${body ? ' · ' + body.slice(0, 200) : ''}`);
  }
  const json = (await res.json()) as any;
  const task = json?.tasks?.[0];
  if (!task || task.status_code >= 40000) {
    throw new Error(`E_TASK · DataForSEO ${path}: ${task?.status_message ?? 'unknown task error'}`);
  }
  return task.result ?? [];
}

function locationName(country: string): string {
  const map: Record<string, string> = {
    us: 'United States', cn: 'China', gb: 'United Kingdom',
    jp: 'Japan', de: 'Germany', fr: 'France', in: 'India',
  };
  return map[country.toLowerCase()] ?? 'United States';
}

function languageName(language: string): string {
  const map: Record<string, string> = {
    en: 'English', zh: 'Chinese', ja: 'Japanese', de: 'German', fr: 'French',
  };
  return map[language.toLowerCase()] ?? 'English';
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
  const loc = { location_name: locationName(opts.country), language_name: languageName(opts.language) };
  const collected: string[] = [...seeds];

  for (const seed of seeds) {
    try {
      const related = await call('/v3/dataforseo_labs/google/related_keywords/live', {
        ...loc, keyword: seed, depth: Math.min(breadth, 4), limit: 40,
      });
      for (const r of related ?? []) {
        for (const item of r.items ?? []) {
          const kw = item?.keyword_data?.keyword ?? item?.keyword;
          if (kw) collected.push(kw);
        }
      }
    } catch (e) {
      console.error(`  related_keywords("${seed}") 失败: ${(e as Error).message}`);
    }
    try {
      const suggestions = await call('/v3/dataforseo_labs/google/keyword_suggestions/live', {
        ...loc, keyword: seed, limit: 30 * breadth,
      });
      for (const r of suggestions ?? []) {
        for (const item of r.items ?? []) {
          const kw = item?.keyword_data?.keyword ?? item?.keyword;
          if (kw) collected.push(kw);
        }
      }
    } catch (e) {
      console.error(`  keyword_suggestions("${seed}") 失败: ${(e as Error).message}`);
    }
  }

  try {
    const ideas = await call('/v3/dataforseo_labs/google/keyword_ideas/live', {
      ...loc, keywords: seeds.slice(0, 20), limit: 50 * breadth,
    });
    for (const r of ideas ?? []) {
      for (const item of r.items ?? []) {
        const kw = item?.keyword_data?.keyword ?? item?.keyword;
        if (kw) collected.push(kw);
      }
    }
  } catch (e) {
    console.error(`  keyword_ideas 失败: ${(e as Error).message}`);
  }

  return dedupe(collected).slice(0, 150);
}

interface RawMetric {
  volume: number;
  cpc: number | null;
  competition: number | null;
  trend: { month: string; year: number; value: number }[];
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function parseSearchVolume(result: any[]): Map<string, RawMetric> {
  const out = new Map<string, RawMetric>();
  for (const r of result ?? []) {
    const items = r.items ?? (Array.isArray(r) ? r : [r]);
    for (const item of items) {
      const kw = item?.keyword;
      if (!kw) continue;
      const trend = (item?.monthly_searches ?? []).map((m: any) => ({
        month: MONTHS[(m.month ?? 1) - 1] ?? String(m.month),
        year: m.year ?? 0,
        value: m.search_volume ?? 0,
      }));
      out.set(kw.toLowerCase(), {
        volume: item?.search_volume ?? 0,
        cpc: item?.cpc ?? null,
        competition: item?.competition_index != null ? item.competition_index / 100 : (item?.competition ?? null),
        trend,
      });
    }
  }
  return out;
}

function parseDifficulty(result: any[]): Map<string, number> {
  const out = new Map<string, number>();
  for (const r of result ?? []) {
    for (const item of r.items ?? []) {
      const kw = item?.keyword;
      if (kw && item?.keyword_difficulty != null) out.set(kw.toLowerCase(), item.keyword_difficulty);
    }
  }
  return out;
}

async function metrics(keywords: string[], opts: MetricsOpts): Promise<KeywordMetric[]> {
  const loc = { location_name: locationName(opts.country), language_name: languageName(opts.language) };
  const now = new Date().toISOString();

  let volMap = new Map<string, RawMetric>();
  let kdMap = new Map<string, number>();

  // Search volume — batches of 1000 keywords supported; we keep batches of 700.
  for (let i = 0; i < keywords.length; i += 700) {
    const batch = keywords.slice(i, i + 700);
    try {
      const result = await call('/v3/keywords_data/google_ads/search_volume/live', { ...loc, keywords: batch });
      for (const [k, v] of parseSearchVolume(result)) volMap.set(k, v);
    } catch (e) {
      console.error(`  search_volume batch 失败: ${(e as Error).message}`);
    }
  }

  // Bulk keyword difficulty — batches of 1000.
  for (let i = 0; i < keywords.length; i += 700) {
    const batch = keywords.slice(i, i + 700);
    try {
      const result = await call('/v3/dataforseo_labs/google/bulk_keyword_difficulty/live', { ...loc, keywords: batch });
      for (const [k, v] of parseDifficulty(result)) kdMap.set(k, v);
    } catch (e) {
      console.error(`  bulk_keyword_difficulty batch 失败: ${(e as Error).message}`);
    }
  }

  return keywords.map((keyword) => {
    const norm = keyword.toLowerCase();
    const raw = volMap.get(norm);
    const relation = opts.relationOf?.(keyword) ?? 'related';
    const metric: KeywordMetric = {
      keyword,
      provider: 'dataforseo',
      volume: raw?.volume ?? 0,
      cpc: raw?.cpc ?? null,
      competition: raw?.competition ?? null,
      keyword_difficulty: kdMap.get(norm) ?? null,
      trend: raw?.trend ?? [],
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

export const dataforseoProvider: KeywordProvider = { name: 'dataforseo', expand, metrics, hasToken };
