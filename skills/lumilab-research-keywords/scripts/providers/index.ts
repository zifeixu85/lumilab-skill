#!/usr/bin/env bun
/**
 * Provider factory + shared types for lumilab-research-keywords.
 *
 * Picks a KeywordProvider adapter by `keywords.provider` in ~/.lumilab/config.json
 * (default: dataforseo). Each adapter implements the unified KeywordProvider
 * interface so research.ts is provider-agnostic.
 *
 * Secret loading: keychain first (../../lumilab-config/scripts/keychain.ts),
 * then ~/.lumilab/secrets.json fallback — same pattern as research-platforms.
 */
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

export type Relation = 'seed' | 'related' | 'longtail' | 'pasf';
export type Verdict = 'blue_ocean' | 'red_ocean' | 'differentiation' | 'low_demand';
export type ProviderName = 'dataforseo' | 'keywordseverywhere';

export interface KeywordMetric {
  keyword: string;
  provider: ProviderName;
  volume: number;
  cpc: number | null;
  competition: number | null;
  keyword_difficulty: number | null;
  trend: { month: string; year: number; value: number }[];
  trend_slope: number;
  serp_strong_count: number | null;
  relation: Relation;
  opportunity_score: number;
  verdict: Verdict;
  retrieved_at: string;
}

export interface ExpandOpts {
  country: string;
  language: string;
  breadth?: number;
}

export interface MetricsOpts {
  country: string;
  language: string;
  /** Optional resolver so the provider can tag each keyword's relation. */
  relationOf?: (keyword: string) => Relation;
}

export interface KeywordProvider {
  name: ProviderName;
  expand(seeds: string[], opts: ExpandOpts): Promise<string[]>;
  metrics(keywords: string[], opts: MetricsOpts): Promise<KeywordMetric[]>;
  /** True when this provider has credentials configured. */
  hasToken(): boolean;
}

const LUMILAB_HOME = process.env.LUMILAB_HOME ?? join(homedir(), '.lumilab');

/**
 * Load a secret: platform keychain first, then ~/.lumilab/secrets.json fallback.
 * Mirrors the research-platforms secret-loading pattern but adds keychain.
 */
export function loadSecret(name: string): string | undefined {
  if (process.env[name]) return process.env[name];
  // 1. keychain (best-effort; module may be absent in stripped bundles)
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const kc = require('../../lumilab-config/scripts/keychain.ts');
    if (typeof kc?.getSecret === 'function') {
      const v = kc.getSecret(name);
      if (v) return v;
    }
  } catch {
    // keychain module unavailable — fall through to plaintext
  }
  // 2. plaintext fallback
  const secretsPath = join(LUMILAB_HOME, 'secrets.json');
  if (!existsSync(secretsPath)) return undefined;
  try {
    const s = JSON.parse(readFileSync(secretsPath, 'utf-8')) as Record<string, string>;
    return s[name];
  } catch {
    return undefined;
  }
}

export interface KeywordsConfig {
  provider: ProviderName;
  country: string;
  language: string;
  serp_probe: boolean;
  low_demand_threshold: number;
  serp_probe_top_n: number;
}

const DEFAULT_CONFIG: KeywordsConfig = {
  provider: 'dataforseo',
  country: 'us',
  language: 'en',
  serp_probe: true,
  low_demand_threshold: 50,
  serp_probe_top_n: 15,
};

/** Read the `keywords` section of ~/.lumilab/config.json, with defaults. */
export function loadKeywordsConfig(): KeywordsConfig {
  const configPath = join(LUMILAB_HOME, 'config.json');
  if (!existsSync(configPath)) return { ...DEFAULT_CONFIG };
  try {
    const cfg = JSON.parse(readFileSync(configPath, 'utf-8')) as { keywords?: Partial<KeywordsConfig> };
    return { ...DEFAULT_CONFIG, ...(cfg.keywords ?? {}) };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

/**
 * Provider factory. `override` (from --provider=) wins over config.
 */
export async function getProvider(override?: string): Promise<KeywordProvider> {
  const cfg = loadKeywordsConfig();
  const name = (override ?? cfg.provider ?? 'dataforseo') as ProviderName;
  if (name === 'keywordseverywhere') {
    const { keywordsEverywhereProvider } = await import('./keywords-everywhere.ts');
    return keywordsEverywhereProvider;
  }
  const { dataforseoProvider } = await import('./dataforseo.ts');
  return dataforseoProvider;
}
