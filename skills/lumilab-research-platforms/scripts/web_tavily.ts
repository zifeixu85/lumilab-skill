#!/usr/bin/env bun
/**
 * Web research adapter — Tavily API.
 *
 * Usage:
 *   bun run scripts/web_tavily.ts "<query>" --venture <name> [--num 10] [--mock] [--depth basic|advanced]
 *
 * Reads TAVILY_API_KEY from env or ~/.lumilab/secrets.json. Without it, returns
 * mock results and exits 0 with a clear notice (won't break dry-run testing).
 *
 * Output: <workspace>/data/ventures/<venture>/research/web_tavily.json
 *
 * Tavily API: https://docs.tavily.com/documentation/api-reference/endpoint/search
 *  POST https://api.tavily.com/search
 *  headers: { Authorization: "Bearer tvly-..." }
 *  body: { query, search_depth, max_results, include_answer, include_raw_content }
 */
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

interface Args { query: string; venture?: string; num: number; mock: boolean; depth: 'basic' | 'advanced'; }

function parseArgs(argv: string[]): Args {
  let query = '';
  let venture: string | undefined;
  let num = 10;
  let mock = false;
  let depth: Args['depth'] = 'basic';
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--venture') venture = argv[++i];
    else if (a === '--num') num = Number(argv[++i]);
    else if (a === '--mock') mock = true;
    else if (a === '--depth') depth = argv[++i] as Args['depth'];
    else if (!query) query = a;
  }
  if (!query) { console.error('用法：web_tavily.ts "<query>" --venture <name>'); process.exit(2); }
  return { query, venture, num, mock, depth };
}

// Resolve a secret across env → platform keychain → secrets.json, trying BOTH
// the canonical UPPER name and the wizard's lowercase form (e.g. tavily_api_key).
// Mirrors research-keywords/providers/index.ts so config-wizard tokens are actually found.
function loadSecret(name: string): string | undefined {
  const lower = name.toLowerCase();
  if (process.env[name]) return process.env[name];
  if (process.env[lower]) return process.env[lower];
  // platform keychain (best-effort; module may be absent in stripped bundles)
  try {
    const kc = require('../../lumilab-config/scripts/keychain.ts');
    if (typeof kc?.getSecret === 'function') {
      const v = kc.getSecret(name) || kc.getSecret(lower);
      if (v) return v;
    }
  } catch { /* keychain unavailable — fall through */ }
  const secretsPath = join(process.env.LUMILAB_HOME ?? join(homedir(), '.lumilab'), 'secrets.json');
  if (!existsSync(secretsPath)) return undefined;
  try {
    const s = JSON.parse(readFileSync(secretsPath, 'utf-8'));
    return s[name] || s[lower] || s.tavily?.api_key;
  } catch { return undefined; }
}

function mockResults(query: string, n: number) {
  return Array.from({ length: n }, (_, i) => ({
    title: `${query} — 占位结果 #${i + 1}`,
    url: `https://example.com/mock/${i}`,
    author: '',
    published_date: '',
    score: 0.5 - i * 0.02,
    text: `Mock 摘要：关于「${query}」第 ${i + 1} 条占位内容。配置 TAVILY_API_KEY 后切换真实搜索。`,
    highlights: [],
  }));
}

async function searchTavily(args: Args, apiKey: string) {
  const url = 'https://api.tavily.com/search';
  const body = {
    query: args.query,
    search_depth: args.depth,
    max_results: Math.min(Math.max(args.num, 1), 20),   // Tavily 上限 20
    include_answer: false,
    include_raw_content: false,
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`E_${res.status} · Tavily: ${res.statusText}${errText ? ' · ' + errText.slice(0, 200) : ''}`);
  }
  const json = await res.json() as any;
  const items = json?.results ?? [];
  return items.map((r: any) => ({
    title: r.title ?? '',
    url: r.url,
    author: '',                              // Tavily 不返回 author
    published_date: r.published_date ?? '',
    score: r.score ?? 0,
    text: (r.content ?? '').slice(0, 2000),  // Tavily 的摘要字段是 content
    highlights: [],                          // Tavily 无 highlights，留空保持下游 schema 不变
  }));
}

function writeOut(args: Args, d: { source: string; results: any[]; notice?: string }): void {
  const out = { query: args.query, fetched_at: new Date().toISOString(), source: d.source, notice: d.notice || undefined, results: d.results };
  if (args.venture) {
    // venture 数据永远在 ~/.lumilab/data/ventures/，跟 cwd / 谁调用无关。
    const lumilabHome = process.env.LUMILAB_HOME ?? join(homedir(), '.lumilab');
    const outDir = join(lumilabHome, 'data', 'ventures', args.venture, 'research');
    if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
    const outPath = join(outDir, 'web_tavily.json');
    writeFileSync(outPath, JSON.stringify(out, null, 2));
    console.log(`✓ ${d.results.length} 条结果 · source=${d.source} → ${outPath}`);
    if (d.notice) console.log(d.notice);
  } else {
    console.log(JSON.stringify(out, null, 2));
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const apiKey = loadSecret('TAVILY_API_KEY');

  // 显式 --mock：仅测试 / 纯离线 demo 用占位数据。
  if (args.mock) {
    writeOut(args, { source: 'mock', notice: '⚠️  --mock 启用（占位数据，仅测试）', results: mockResults(args.query, args.num) });
    return;
  }

  // 有 key：真实 Tavily。
  if (apiKey) {
    try {
      const results = await searchTavily(args, apiKey);
      writeOut(args, { source: 'tavily', results });
      const { recordUsage } = await import('./agent_handoff.ts');
      recordUsage(args.venture, 'tavily');
      return;
    } catch (e: any) {
      console.error(`✗ ${e.message}`);
      // key 失败也不落 mock —— 交宿主 agent 代搜（真实兜底）。
      const { emitAgentPending } = await import('./agent_handoff.ts');
      emitAgentPending({ channel: 'web', venture: args.venture, queries: [args.query], reason: `Tavily 调用失败（${String(e.message).split('·')[0].trim()}）` });
      return;
    }
  }

  // 无 key：宿主代搜（真实数据，非 mock）。宿主 agent 用自己的 web 工具/知识补全 → ingest_agent_results.ts 回写。
  const { emitAgentPending } = await import('./agent_handoff.ts');
  emitAgentPending({ channel: 'web', venture: args.venture, queries: [args.query], reason: '未配置 TAVILY_API_KEY' });
}

main().catch(e => { console.error(e); process.exit(1); });
