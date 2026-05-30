#!/usr/bin/env bun
/**
 * usage.ts — 每个 venture 的「消耗账本」(usage.json)。
 *
 * 诚实分两层（与「宿主代搜」同哲学：能精确算的精确算，算不到的标清楚是估算）：
 *
 *   1) 外部服务消耗 —— **可精确计量**。我们控制 Tavily/TikHub/DataForSEO 等调用，
 *      每次成本已知。脚本调用成功后 recordService() 累加。走「宿主代搜」(agent-*) 的
 *      来源 = 0 外部成本（用宿主自己能力，不烧任何 credit）。
 *
 *   2) 宿主 LLM token —— **脚本测不到**（确定性脚本是子进程，看不到宿主 token 表）。
 *      混合策略：宿主 agent 每 phase 后 recordLlm()(source: host-reported) 自报优先；
 *      没自报就 estimateLlmFromArtifacts() 按产物体量估算(source: estimated)兜底。
 *
 * 文件：~/.lumilab/data/ventures/<slug>/usage.json
 *
 * CLI：
 *   bun run usage.ts record-service <venture> <service> [--calls N] [--credits N] [--cost USD]
 *   bun run usage.ts record-llm <venture> --phase <p> --in <N> --out <M> [--source host-reported] [--model <m>]
 *   bun run usage.ts estimate-llm <venture>     # 无自报时按产物体量估算
 *   bun run usage.ts show <venture>             # 打印汇总 JSON
 *
 * 所有写操作 best-effort：失败只记 stderr，绝不抛、绝不阻塞主流程。
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const HOME = process.env.LUMILAB_HOME ?? join(homedir(), '.lumilab');

// 单次调用约成本（USD）——与各 skill SKILL.md 依赖表口径一致。估算量级，非账单精确值。
const SERVICE_COST: Record<string, { perCall: number; credits: number; label: string }> = {
  tavily:            { perCall: 0.008, credits: 1, label: 'Tavily Web 搜索' },
  tikhub:            { perCall: 0.01,  credits: 1, label: 'TikHub 小红书' },
  dataforseo:        { perCall: 0.03,  credits: 1, label: 'DataForSEO 关键词' },
  keywordseverywhere:{ perCall: 0.002, credits: 1, label: 'Keywords Everywhere' },
  stripe:            { perCall: 0,     credits: 0, label: 'Stripe 只读回读' },
  evolink:           { perCall: 0.03,  credits: 1, label: 'EvoLink AI 出图' },
  // 宿主代搜/代答/估算 —— 用宿主自己能力，0 外部成本（这正是「零 key 也能跑」的量化证据）。
  'agent-web':       { perCall: 0,     credits: 0, label: '宿主代搜（web 工具）' },
  'agent-knowledge': { perCall: 0,     credits: 0, label: '宿主代答（知识）' },
  'agent-estimate':  { perCall: 0,     credits: 0, label: '宿主启发式估计' },
  mock:              { perCall: 0,     credits: 0, label: 'mock（测试）' },
};

export interface ServiceRow { calls: number; credits: number; est_cost_usd: number; label: string; last_ts: string; }
export interface LlmEntry { phase: string; tokens_in: number; tokens_out: number; source: 'host-reported' | 'estimated'; model?: string; ts: string; }
export interface Usage {
  venture: string;
  updated_at: string;
  services: Record<string, ServiceRow>;
  llm: { entries: LlmEntry[]; total_in: number; total_out: number; source: 'host-reported' | 'estimated' | 'mixed' | 'none' };
}

function ventureDir(slug: string): string { return join(HOME, 'data', 'ventures', slug); }
function usagePath(slug: string): string { return join(ventureDir(slug), 'usage.json'); }

function emptyUsage(slug: string): Usage {
  return { venture: slug, updated_at: new Date().toISOString(), services: {}, llm: { entries: [], total_in: 0, total_out: 0, source: 'none' } };
}

export function readUsage(slug: string): Usage {
  const p = usagePath(slug);
  if (!existsSync(p)) return emptyUsage(slug);
  try {
    const o = JSON.parse(readFileSync(p, 'utf-8')) as Usage;
    return { ...emptyUsage(slug), ...o, services: o.services ?? {}, llm: o.llm ?? emptyUsage(slug).llm };
  } catch { return emptyUsage(slug); }
}

function write(slug: string, u: Usage): void {
  try {
    const dir = ventureDir(slug);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(usagePath(slug), JSON.stringify({ ...u, updated_at: new Date().toISOString() }, null, 2) + '\n', 'utf-8');
  } catch (e) { process.stderr.write(`  (usage write skipped: ${(e as Error).message})\n`); }
}

/** 外部服务调用累加（best-effort，绝不抛）。credits/cost 缺省按成本表推算。 */
export function recordService(slug: string, service: string, opts: { calls?: number; credits?: number; costUsd?: number } = {}): void {
  try {
    const cost = SERVICE_COST[service] ?? { perCall: 0, credits: 0, label: service };
    const calls = opts.calls ?? 1;
    const u = readUsage(slug);
    const prev = u.services[service] ?? { calls: 0, credits: 0, est_cost_usd: 0, label: cost.label, last_ts: '' };
    const services = {
      ...u.services,
      [service]: {
        calls: prev.calls + calls,
        credits: prev.credits + (opts.credits ?? cost.credits * calls),
        est_cost_usd: Number((prev.est_cost_usd + (opts.costUsd ?? cost.perCall * calls)).toFixed(4)),
        label: cost.label,
        last_ts: new Date().toISOString(),
      },
    };
    write(slug, { ...u, services });
  } catch (e) { process.stderr.write(`  (recordService skipped: ${(e as Error).message})\n`); }
}

function recomputeLlm(entries: LlmEntry[]): Usage['llm'] {
  const total_in = entries.reduce((a, e) => a + (e.tokens_in || 0), 0);
  const total_out = entries.reduce((a, e) => a + (e.tokens_out || 0), 0);
  const srcs = new Set(entries.map((e) => e.source));
  const source: Usage['llm']['source'] = entries.length === 0 ? 'none' : srcs.size > 1 ? 'mixed' : [...srcs][0];
  return { entries, total_in, total_out, source };
}

/** 宿主自报 token（host-reported 优先）。同一 phase 的 host-reported 覆盖旧条目。 */
export function recordLlm(slug: string, e: Omit<LlmEntry, 'ts'>): void {
  try {
    const u = readUsage(slug);
    const ts = new Date().toISOString();
    // 同 phase 同 source 去重覆盖（避免重复自报翻倍）
    const kept = u.llm.entries.filter((x) => !(x.phase === e.phase && x.source === e.source));
    const entries = [...kept, { ...e, ts }];
    write(slug, { ...u, llm: recomputeLlm(entries) });
  } catch (err) { process.stderr.write(`  (recordLlm skipped: ${(err as Error).message})\n`); }
}

// 体量→token 估算：中英混排约 2.8 字符/token（输出）；输入按读取的研究/上下文约 2.2× 输出粗估。
const CHARS_PER_TOKEN = 2.8;
const INPUT_MULTIPLIER = 2.2;
// 估算计入的「宿主产物」（agent 写的分析/文案，token 主要花在这些上；模板化 HTML 不计）。
const ARTIFACTS = [
  'project_brief.md', 'yc_brief.md', 'market_analysis.json', 'audience.md', 'painpoints.md',
  'competitors.md', 'product_definition.md', 'pricing_hypothesis.md', 'hypotheses.yaml',
];

/** 无 host-reported 时按产物体量估算（source: estimated，幂等替换旧 estimated 条目）。 */
export function estimateLlmFromArtifacts(slug: string): Usage {
  const u = readUsage(slug);
  // 已有宿主自报就不覆盖（自报优先）
  if (u.llm.entries.some((e) => e.source === 'host-reported')) return u;

  try {
    const dir = ventureDir(slug);
    let chars = 0;
    for (const rel of ARTIFACTS) {
      const p = join(dir, rel);
      if (existsSync(p)) { try { chars += readFileSync(p, 'utf-8').length; } catch { /* skip */ } }
    }
    // research/*.md 综合报告也算（cross_platform_synthesis 等是 agent 产出）
    const rdir = join(dir, 'research');
    if (existsSync(rdir)) {
      for (const f of readdirSync(rdir)) {
        if (f.endsWith('.md')) { try { chars += readFileSync(join(rdir, f), 'utf-8').length; } catch { /* skip */ } }
      }
    }
    if (chars === 0) return u;
    const tokens_out = Math.round(chars / CHARS_PER_TOKEN);
    const tokens_in = Math.round(tokens_out * INPUT_MULTIPLIER);
    const entries = [
      ...u.llm.entries.filter((e) => e.source !== 'estimated'),
      { phase: 'aggregate-estimate', tokens_in, tokens_out, source: 'estimated' as const, ts: new Date().toISOString() },
    ];
    const next = { ...u, llm: recomputeLlm(entries) };
    write(slug, next);
    return next;
  } catch { return u; }
}

export interface UsageSummary {
  external_cost_usd: number;
  external_calls: number;
  services: { service: string; label: string; calls: number; credits: number; est_cost_usd: number }[];
  llm: { tokens_in: number; tokens_out: number; total: number; source: Usage['llm']['source'] };
  agent_calls: number;   // 走宿主代搜的次数（0 外部成本，是卖点）
}

/** 给 render/home 用的汇总。无 host-reported 时惰性触发体量估算。 */
export function summarize(slug: string, opts: { estimateIfMissing?: boolean } = {}): UsageSummary {
  let u = readUsage(slug);
  if ((opts.estimateIfMissing ?? true) && u.llm.source === 'none') u = estimateLlmFromArtifacts(slug);
  const services = Object.entries(u.services).map(([service, r]) => ({ service, label: r.label, calls: r.calls, credits: r.credits, est_cost_usd: r.est_cost_usd }));
  const external_cost_usd = Number(services.reduce((a, s) => a + s.est_cost_usd, 0).toFixed(4));
  const external_calls = services.reduce((a, s) => a + s.calls, 0);
  const agent_calls = services.filter((s) => s.service.startsWith('agent-')).reduce((a, s) => a + s.calls, 0);
  return {
    external_cost_usd,
    external_calls,
    services,
    llm: { tokens_in: u.llm.total_in, tokens_out: u.llm.total_out, total: u.llm.total_in + u.llm.total_out, source: u.llm.source },
    agent_calls,
  };
}

// ── CLI ──
function arg(flags: string[], name: string): string | undefined {
  const i = flags.indexOf(name);
  return i >= 0 ? flags[i + 1] : undefined;
}

function main(): void {
  const [cmd, slug, ...rest] = process.argv.slice(2);
  if (!cmd || !slug) {
    console.error('用法：usage.ts <record-service|record-llm|estimate-llm|show> <venture> [...]');
    process.exit(2);
  }
  switch (cmd) {
    case 'record-service': {
      const service = rest.find((a) => !a.startsWith('--')) ?? '';
      if (!service) { console.error('✗ 缺 service 名'); process.exit(2); }
      recordService(slug, service, {
        calls: rest.includes('--calls') ? Number(arg(rest, '--calls')) : undefined,
        credits: rest.includes('--credits') ? Number(arg(rest, '--credits')) : undefined,
        costUsd: rest.includes('--cost') ? Number(arg(rest, '--cost')) : undefined,
      });
      console.log(`✓ usage: +${service} → ${usagePath(slug)}`);
      break;
    }
    case 'record-llm': {
      recordLlm(slug, {
        phase: arg(rest, '--phase') ?? 'unspecified',
        tokens_in: Number(arg(rest, '--in') ?? 0),
        tokens_out: Number(arg(rest, '--out') ?? 0),
        source: (arg(rest, '--source') as LlmEntry['source']) ?? 'host-reported',
        model: arg(rest, '--model'),
      });
      console.log(`✓ usage: llm(${arg(rest, '--phase')}) 自报记账 → ${usagePath(slug)}`);
      break;
    }
    case 'estimate-llm': {
      const u = estimateLlmFromArtifacts(slug);
      console.log(`✓ 估算：in=${u.llm.total_in} out=${u.llm.total_out} source=${u.llm.source}`);
      break;
    }
    case 'show':
      console.log(JSON.stringify(summarize(slug), null, 2));
      break;
    default:
      console.error(`✗ 未知命令：${cmd}`);
      process.exit(2);
  }
}

if (import.meta.main) main();
