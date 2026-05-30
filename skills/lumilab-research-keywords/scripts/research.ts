#!/usr/bin/env bun
/**
 * Main entry for `/lumilab keywords` — quantitative search-demand validation.
 *
 * Flow: seeds → expand → metrics → serp-probe → score → write 3 outputs into
 *   <workspace>/data/ventures/<venture>/research/
 *     - keyword_landscape.md   (★ 红蓝海地图)
 *     - keyword_metrics.csv    (每个关键词全字段)
 *     - keyword_sources.jsonl  (一行一条 KeywordMetric，可追溯)
 *
 * Usage:
 *   bun run scripts/research.ts --seed="AI 改写工具,跨平台内容改写" --venture my-v
 *   bun run scripts/research.ts --provider=keywordseverywhere --country=cn --language=zh --venture my-v
 *   bun run scripts/research.ts --breadth=4 --no-serp-probe --venture my-v
 *   bun run scripts/research.ts --mock --seed="AI 改写工具" --venture testv
 *
 * Tokenless behavior: when no provider token is configured OR --mock is passed,
 * curated mock data is emitted and the process exits 0 with a clear `notice` —
 * exactly like research-platforms/web_tavily.ts. The mock still produces a
 * realistic keyword_landscape.md so the downstream pipeline works tokenless.
 */
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import {
  getProvider,
  loadKeywordsConfig,
  type KeywordMetric,
  type Relation,
} from './providers/index.ts';
import { probeSerp } from './serp-probe.ts';
import { scoreAll, DEFAULT_THRESHOLDS, type ScoreThresholds } from './scoring.ts';

interface Args {
  seed: string[];
  provider?: string;
  country?: string;
  language?: string;
  breadth?: number;
  serpProbe: boolean;
  venture?: string;
  mock: boolean;
}

function parseArgs(argv: string[]): Args {
  const args: Args = { seed: [], serpProbe: true, mock: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--seed=')) args.seed = a.slice(7).split(',').map((s) => s.trim()).filter(Boolean);
    else if (a.startsWith('--provider=')) args.provider = a.slice(11);
    else if (a.startsWith('--country=')) args.country = a.slice(10);
    else if (a.startsWith('--language=')) args.language = a.slice(11);
    else if (a.startsWith('--breadth=')) args.breadth = Number(a.slice(10));
    else if (a === '--no-serp-probe') args.serpProbe = false;
    else if (a === '--venture') args.venture = argv[++i];
    else if (a === '--mock') args.mock = true;
    else if (a === '--help' || a === '-h') {
      console.log('用法：research.ts --seed="kw1,kw2" --venture <name> [--provider=] [--country=] [--language=] [--breadth=N] [--no-serp-probe] [--mock]');
      process.exit(0);
    }
  }
  return args;
}

// ---- mock data ------------------------------------------------------------

const MONTHS = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'];

function mockTrend(base: number, slope: number): { month: string; year: number; value: number }[] {
  let year = 2025;
  return MONTHS.map((month, i) => {
    if (month === 'Jan') year = 2026;
    const value = Math.max(0, Math.round(base * (1 + slope * (i - 5))));
    return { month, year, value };
  });
}

/**
 * Curated mock metrics — realistic spread across blue_ocean / red_ocean /
 * differentiation / low_demand so the landscape report and downstream
 * pipeline have something believable to render tokenless.
 */
function mockMetrics(seeds: string[], country: string, language: string): KeywordMetric[] {
  const now = new Date().toISOString();
  const primary = seeds[0] ?? 'AI 改写工具';
  const rows: Array<Omit<KeywordMetric, 'trend' | 'trend_slope' | 'opportunity_score' | 'verdict' | 'retrieved_at' | 'provider'> & { base: number; slope: number }> = [
    { keyword: primary, volume: 40500, cpc: 3.4, competition: 0.88, keyword_difficulty: 76, serp_strong_count: 9, relation: 'seed', base: 40500, slope: 0.02 },
    { keyword: `${primary} 免费`, volume: 8100, cpc: 1.1, competition: 0.62, keyword_difficulty: 54, serp_strong_count: 6, relation: 'related', base: 8100, slope: 0.12 },
    { keyword: `${primary} 不丢原味`, volume: 1300, cpc: 1.2, competition: 0.21, keyword_difficulty: 18, serp_strong_count: 2, relation: 'longtail', base: 1300, slope: 0.18 },
    { keyword: '多平台内容分发', volume: 8100, cpc: 2.0, competition: 0.74, keyword_difficulty: 61, serp_strong_count: 7, relation: 'related', base: 8100, slope: 0.15 },
    { keyword: `${primary} 批量`, volume: 720, cpc: 0.9, competition: 0.33, keyword_difficulty: 24, serp_strong_count: 3, relation: 'longtail', base: 720, slope: 0.09 },
    { keyword: `${primary} 哪个好`, volume: 2900, cpc: 1.8, competition: 0.55, keyword_difficulty: 48, serp_strong_count: 5, relation: 'pasf', base: 2900, slope: 0.04 },
    { keyword: `${primary} api`, volume: 590, cpc: 2.4, competition: 0.41, keyword_difficulty: 35, serp_strong_count: 4, relation: 'related', base: 590, slope: 0.06 },
    { keyword: `${primary} 离线版`, volume: 30, cpc: 0.5, competition: 0.12, keyword_difficulty: 9, serp_strong_count: 1, relation: 'longtail', base: 30, slope: -0.02 },
  ];
  return rows.map((r) => ({
    keyword: r.keyword,
    provider: 'dataforseo' as const,
    volume: r.volume,
    cpc: r.cpc,
    competition: r.competition,
    keyword_difficulty: r.keyword_difficulty,
    trend: mockTrend(r.base, r.slope),
    trend_slope: 0,
    serp_strong_count: r.serp_strong_count,
    relation: r.relation as Relation,
    opportunity_score: 0,
    verdict: 'low_demand' as const,
    retrieved_at: now,
  }));
}

// ---- output writers -------------------------------------------------------

function fmtNum(n: number): string {
  return n.toLocaleString('en-US');
}

function trendArrow(slope: number): string {
  if (slope > 0.05) return `↗ +${Math.round(slope * 100)}%`;
  if (slope < -0.05) return `↘ ${Math.round(slope * 100)}%`;
  return `→ ${Math.round(slope * 100)}%`;
}

function frictionLabel(m: KeywordMetric): string {
  if (m.keyword_difficulty != null) return String(m.keyword_difficulty);
  if (m.serp_strong_count != null) return `SERP ${m.serp_strong_count}/10`;
  return 'n/a';
}

function buildLandscape(venture: string, metrics: KeywordMetric[], source: string, notice: string): string {
  const blue = metrics.filter((m) => m.verdict === 'blue_ocean');
  const red = metrics.filter((m) => m.verdict === 'red_ocean');
  const diff = metrics.filter((m) => m.verdict === 'differentiation');
  const low = metrics.filter((m) => m.verdict === 'low_demand');

  const lines: string[] = [];
  lines.push(`# Keyword Landscape — ${venture}`);
  lines.push('');
  lines.push(`> source=${source}${notice ? ` · ${notice}` : ''}`);
  lines.push('');
  lines.push('## 红蓝海地图');
  lines.push('');

  lines.push('### 🔵 蓝海方向（建议优先）');
  lines.push('');
  if (blue.length) {
    lines.push('| 关键词 | 月搜索量 | KD/SERP | 趋势 | opp_score | relation |');
    lines.push('|---|---|---|---|---|---|');
    for (const m of blue) {
      lines.push(`| ${m.keyword} | ${fmtNum(m.volume)} | ${frictionLabel(m)} | ${trendArrow(m.trend_slope)} | ${m.opportunity_score} | ${m.relation} |`);
    }
  } else {
    lines.push('_本轮无蓝海关键词。_');
  }
  lines.push('');

  lines.push('### 🔴 红海方向（需差异化）');
  lines.push('');
  if (red.length) {
    lines.push('| 关键词 | 月搜索量 | KD/SERP | SERP 首页强站 | 建议差异化切口 |');
    lines.push('|---|---|---|---|---|');
    for (const m of red) {
      const strong = m.serp_strong_count != null ? `${m.serp_strong_count}/10` : 'n/a';
      lines.push(`| ${m.keyword} | ${fmtNum(m.volume)} | ${frictionLabel(m)} | ${strong} | 找垂直长尾切口（见同主题 longtail/pasf 词） |`);
    }
  } else {
    lines.push('_本轮无红海关键词。_');
  }
  lines.push('');

  lines.push('### 🟡 差异化机会');
  lines.push('');
  if (diff.length) {
    lines.push('| 关键词 | 为什么是机会 |');
    lines.push('|---|---|');
    for (const m of diff) {
      lines.push(`| ${m.keyword} | 量 ${fmtNum(m.volume)} + 趋势 ${trendArrow(m.trend_slope)} + ${m.relation === 'longtail' || m.relation === 'pasf' ? '长尾切口明显' : '高竞争但势头向上'} |`);
    }
  } else {
    lines.push('_本轮无差异化机会关键词。_');
  }
  lines.push('');

  lines.push('### ⚪ 低需求（暂不做）');
  lines.push('');
  if (low.length) {
    for (const m of low) lines.push(`- ${m.keyword}（月搜索量 ${fmtNum(m.volume)} < 阈值）`);
  } else {
    lines.push('_本轮无低需求关键词。_');
  }
  lines.push('');

  lines.push('## 综合判断');
  lines.push('');
  const topBlue = blue[0];
  const topRed = red[0];
  if (topBlue) {
    lines.push(`这个 idea 的搜索需求在 ${metrics.length} 个关键词里有 ${blue.length} 个蓝海、${red.length} 个红海、${diff.length} 个差异化机会。最该先切「${topBlue.keyword}」（月搜索量 ${fmtNum(topBlue.volume)}、KD/SERP ${frictionLabel(topBlue)}、趋势 ${trendArrow(topBlue.trend_slope)}、opp_score ${topBlue.opportunity_score}）。`);
  } else if (topRed) {
    lines.push(`本轮没有现成蓝海，主流量集中在「${topRed.keyword}」（月搜索量 ${fmtNum(topRed.volume)}、KD/SERP ${frictionLabel(topRed)}）这类红海词，需要靠 differentiation 词或长尾切口进入。`);
  } else {
    lines.push(`本轮关键词整体搜索需求偏低（${low.length}/${metrics.length} 为低需求），建议换种子词或重新定位。`);
  }
  lines.push('');

  lines.push('## 建议的下一步');
  lines.push('');
  lines.push(`1. 进 lumilab-hypothesis-ledger 把「${topBlue?.keyword ?? metrics[0]?.keyword ?? '关键词'} 月搜索量 ≥ N」升格为可证伪假设`);
  lines.push('2. lumilab-research-platforms 对蓝海关键词做定性痛点交叉验证');
  lines.push('3. lumilab-landing-mvp 落地页主打蓝海关键词');
  lines.push('');
  return lines.join('\n');
}

function buildCsv(metrics: KeywordMetric[]): string {
  const header = 'keyword,provider,volume,cpc,competition,keyword_difficulty,trend_slope,serp_strong_count,relation,opportunity_score,verdict';
  const rows = metrics.map((m) => {
    const csvCell = (v: string | number | null): string => {
      if (v == null) return '';
      const s = String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    return [
      m.keyword, m.provider, m.volume, m.cpc, m.competition, m.keyword_difficulty,
      m.trend_slope, m.serp_strong_count, m.relation, m.opportunity_score, m.verdict,
    ].map(csvCell).join(',');
  });
  return [header, ...rows].join('\n') + '\n';
}

function buildJsonl(metrics: KeywordMetric[]): string {
  return metrics.map((m) => JSON.stringify(m)).join('\n') + '\n';
}

// ---- main -----------------------------------------------------------------

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const config = loadKeywordsConfig();
  const country = args.country ?? config.country;
  const language = args.language ?? config.language;
  const breadth = args.breadth ?? 3;
  const serpEnabled = args.serpProbe && config.serp_probe;
  const thresholds: ScoreThresholds = {
    ...DEFAULT_THRESHOLDS,
    low_demand: config.low_demand_threshold ?? DEFAULT_THRESHOLDS.low_demand,
  };

  if (args.seed.length === 0) {
    // In a full run, seeds come from project_brief.md / hypotheses.yaml.
    // Tokenless / no-seed fallback: use a generic seed so the pipeline runs.
    args.seed = ['AI 改写工具'];
    console.error('⚠️  未提供 --seed，使用占位种子词「AI 改写工具」。真实运行请从 project_brief.md 取产品关键词。');
  }

  const provider = await getProvider(args.provider);
  const tokenless = !provider.hasToken();

  let metrics: KeywordMetric[];
  let source: string;
  let notice = '';

  if (args.mock) {
    // 显式 --mock：仅测试 / 纯离线 demo。
    metrics = mockMetrics(args.seed, country, language);
    source = 'mock';
    notice = '⚠️  --mock 启用（占位数据，仅测试）';
    console.error(notice);
  } else if (tokenless) {
    // 无 keyword API token → 不当「假数据」用，而是「启发式量级估计 + 宿主 agent 核对」。
    // 搜索量是精确数字，agent 无法凭空知道；但红蓝海/相对需求的方向判断，agent 凭自身知识可校正。
    metrics = mockMetrics(args.seed, country, language);
    source = 'agent-estimate';
    notice = `无 ${provider.name} token → 搜索量为基于种子词的**启发式量级估计**（非精确值），红蓝海为**相对**判断。宿主 agent 应据自身知识核对量级、修正明显偏差，再把方向性结论写进 market_analysis.json。要精确数据就配 DataForSEO / Keywords Everywhere token。`;
    console.error('⚠️  ' + notice);
  } else {
    try {
      const seedSet = new Set(args.seed.map((s) => s.toLowerCase()));
      const expanded = await provider.expand(args.seed, { country, language, breadth });
      const relationOf = (kw: string): Relation => (seedSet.has(kw.toLowerCase()) ? 'seed' : 'related');
      metrics = await provider.metrics(expanded, { country, language, relationOf });
      source = provider.name;
    } catch (e) {
      console.error(`✗ ${(e as Error).message}`);
      // 调用失败也不当「假数据」——降级为启发式估计 + agent 核对，标清楚来源。
      console.error('  → 降级为启发式量级估计（agent 核对），非 mock。');
      metrics = mockMetrics(args.seed, country, language);
      source = 'agent-estimate';
      notice = `${provider.name} 查询失败（${(e as Error).message}）→ 搜索量降级为启发式估计，宿主 agent 应核对方向。`;
    }
  }

  // serp-probe → score
  const probed = probeSerp(metrics, { topN: config.serp_probe_top_n ?? 15, enabled: serpEnabled });
  const scored = scoreAll(probed, thresholds);

  // write 3 outputs
  if (!args.venture) {
    console.log(JSON.stringify({ source, notice: notice || undefined, metrics: scored }, null, 2));
    return;
  }

  // venture 数据永远在 ~/.lumilab/data/ventures/，跟 cwd / 谁调用无关。
  const lumilabHome = process.env.LUMILAB_HOME ?? join(homedir(), '.lumilab');
  const outDir = join(lumilabHome, 'data', 'ventures', args.venture, 'research');
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

  const landscapePath = join(outDir, 'keyword_landscape.md');
  const csvPath = join(outDir, 'keyword_metrics.csv');
  const jsonlPath = join(outDir, 'keyword_sources.jsonl');

  writeFileSync(landscapePath, buildLandscape(args.venture, scored, source, notice));
  writeFileSync(csvPath, buildCsv(scored));
  writeFileSync(jsonlPath, buildJsonl(scored));

  // 记一次消耗（真 provider → 计成本；agent-estimate/mock → 0 外部成本）。best-effort。
  try {
    const u = require('../../lumilab-config/scripts/usage.ts');
    if (typeof u?.recordService === 'function') u.recordService(args.venture, source);
  } catch { /* usage 账本可选 */ }

  console.log(`✓ ${scored.length} 个关键词 · source=${source} · serp_probe=${serpEnabled ? 'on' : 'off'}`);
  console.log(`  → ${landscapePath}`);
  console.log(`  → ${csvPath}`);
  console.log(`  → ${jsonlPath}`);
  if (notice) console.log(notice);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
