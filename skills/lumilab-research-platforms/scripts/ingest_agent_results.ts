#!/usr/bin/env bun
/**
 * ingest_agent_results.ts — 把宿主 agent 代搜 / 代答的结果归一成 canonical schema。
 *
 * 当没有外置 API key 时，data 脚本会 emit「检索清单」(source: agent-pending)；宿主 agent
 * 用自己的 web 工具或训练知识真搜真答后，把结果交给本脚本 → 校验 + 归一 → 写
 * web_tavily.json / xhs_raw.json，source = agent-web | agent-knowledge。下游 0 改动。
 *
 * 用法：
 *   bun run ingest_agent_results.ts --venture <slug> --channel web --mode web --query "<q>" --in items.json
 *   cat items.json | bun run ingest_agent_results.ts --venture <slug> --channel xhs --mode knowledge
 *
 * items.json = 宽松数组：
 *   web : [{ title, url, text|snippet|content, published_date?, score? }]
 *   xhs : [{ title, desc?, author?, likes?, collects?, comments?, tags?, url? }]
 *
 * 守卫（绝不静默落假数据）：
 *   - 0 条有效 → exit 3，提示宿主 agent 重搜。
 *   - 明显占位（example.com / /mock/ URL、Mock../占位/placeholder 开头的文本）→ 丢弃。
 *   - mode=web 每条需有 url；mode=knowledge 允许无 url（标注为知识来源）。
 */
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

type Channel = 'web' | 'xhs';
type Mode = 'web' | 'knowledge';

interface Args { venture?: string; channel: Channel; mode: Mode; query?: string; in?: string; }

function parseArgs(argv: string[]): Args {
  const a: Partial<Args> = { channel: 'web', mode: 'web' };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (k === '--venture') a.venture = argv[++i];
    else if (k === '--channel') a.channel = argv[++i] as Channel;
    else if (k === '--mode') a.mode = argv[++i] as Mode;
    else if (k === '--query') a.query = argv[++i];
    else if (k === '--in') a.in = argv[++i];
  }
  if (a.channel !== 'web' && a.channel !== 'xhs') { console.error('✗ --channel 必须是 web|xhs'); process.exit(2); }
  if (a.mode !== 'web' && a.mode !== 'knowledge') { console.error('✗ --mode 必须是 web|knowledge'); process.exit(2); }
  return a as Args;
}

function readInput(path?: string): unknown {
  let raw = '';
  if (path) {
    if (!existsSync(path)) { console.error(`✗ --in 文件不存在：${path}`); process.exit(2); }
    raw = readFileSync(path, 'utf-8');
  } else {
    try { raw = readFileSync(0, 'utf-8'); } catch { raw = ''; }   // stdin
  }
  raw = raw.trim();
  if (!raw) { console.error('✗ 没有输入（--in <file> 或 stdin）'); process.exit(2); }
  try {
    const j = JSON.parse(raw);
    // 容忍 {results:[...]} / {notes:[...]} / {items:[...]} 包裹
    if (Array.isArray(j)) return j;
    if (Array.isArray((j as any).results)) return (j as any).results;
    if (Array.isArray((j as any).notes)) return (j as any).notes;
    if (Array.isArray((j as any).items)) return (j as any).items;
    return j;
  } catch (e) {
    console.error(`✗ 输入不是合法 JSON：${(e as Error).message}`);
    process.exit(2);
  }
}

const MOCK_URL = /example\.com|\/mock\/|placeholder/i;
const MOCK_TEXT = /^\s*(mock|占位|placeholder|lorem ipsum|示例占位)/i;

function s(v: unknown): string { return typeof v === 'string' ? v.trim() : (v == null ? '' : String(v)); }
function n(v: unknown): number { const x = Number(v); return Number.isFinite(x) ? x : 0; }

function normalizeWeb(items: any[], mode: Mode): any[] {
  const out: any[] = [];
  for (const it of items) {
    if (!it || typeof it !== 'object') continue;
    const url = s(it.url ?? it.link ?? it.href);
    const text = s(it.text ?? it.snippet ?? it.content ?? it.summary ?? it.description);
    const title = s(it.title ?? it.name);
    if (!text && !title) continue;                       // 空条丢弃
    if (MOCK_URL.test(url) || MOCK_TEXT.test(text)) continue;   // 占位丢弃
    if (mode === 'web' && !url) continue;                // web 模式必须有真实 URL
    out.push({
      title,
      url,
      author: s(it.author),
      published_date: s(it.published_date ?? it.date),
      score: it.score != null ? n(it.score) : 0.7,
      text: text.slice(0, 2000),
      highlights: Array.isArray(it.highlights) ? it.highlights.map(s).filter(Boolean) : [],
      retrieved_by: mode === 'web' ? 'agent-web' : 'agent-knowledge',
    });
  }
  return out;
}

function normalizeXhs(items: any[], mode: Mode): any[] {
  const out: any[] = [];
  for (const it of items) {
    if (!it || typeof it !== 'object') continue;
    const title = s(it.title);
    const desc = s(it.desc ?? it.content ?? it.text ?? it.description);
    if (!title && !desc) continue;
    if (MOCK_URL.test(s(it.url)) || MOCK_TEXT.test(desc) || MOCK_TEXT.test(title)) continue;
    out.push({
      id: s(it.id) || `agent-${out.length}`,
      title,
      desc,
      author: s(it.author ?? it.nickname),
      likes: n(it.likes ?? it.liked_count),
      collects: n(it.collects ?? it.collected_count),
      comments: n(it.comments ?? it.comments_count),
      shares: n(it.shares ?? it.shared_count),
      tags: Array.isArray(it.tags) ? it.tags.map(s).filter(Boolean) : [],
      url: s(it.url),
      captured_at: new Date().toISOString(),
      retrieved_by: mode === 'web' ? 'agent-web' : 'agent-knowledge',
    });
  }
  return out;
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const input = readInput(args.in);
  const items = Array.isArray(input) ? input : [];
  if (!items.length) {
    console.error('✗ 输入为空数组——宿主 agent 请用真实能力补全后重试，禁止落 mock。');
    process.exit(3);
  }

  const source = args.mode === 'web' ? 'agent-web' : 'agent-knowledge';
  const normalized = args.channel === 'web' ? normalizeWeb(items, args.mode) : normalizeXhs(items, args.mode);

  if (!normalized.length) {
    console.error(`✗ 0 条有效结果（全部为空 / 占位 / 缺 URL）。`);
    console.error(`  mode=web 需要每条带真实 URL；若是凭知识作答请用 --mode knowledge。`);
    console.error(`  绝不静默落 mock——请补充真实内容后重跑。`);
    process.exit(3);
  }

  const spec = args.channel === 'web'
    ? { file: 'web_tavily.json', itemsKey: 'results' as const, queryKey: 'query' as const }
    : { file: 'xhs_raw.json', itemsKey: 'notes' as const, queryKey: 'keyword' as const };

  const out: Record<string, unknown> = {
    [spec.queryKey]: args.query ?? '',
    fetched_at: new Date().toISOString(),
    source,
    notice: args.mode === 'knowledge'
      ? '由宿主 agent 凭训练知识作答（真实认知，非实时检索；无 live URL 属正常）。'
      : '由宿主 agent 用自身 web 工具实时检索（真实数据，非外置 API）。',
    [spec.itemsKey]: normalized,
  };

  if (args.venture) {
    const home = process.env.LUMILAB_HOME ?? join(homedir(), '.lumilab');
    const dir = join(home, 'data', 'ventures', args.venture, 'research');
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    const p = join(dir, spec.file);
    writeFileSync(p, JSON.stringify(out, null, 2));
    // 记一次「宿主代搜」消耗（0 外部成本 —— 用宿主自己能力）。best-effort。
    try {
      const { recordUsage } = require('./agent_handoff.ts');
      recordUsage(args.venture, source);
    } catch { /* usage 可选 */ }
    console.log(`✓ ${normalized.length} 条 · source=${source} · channel=${args.channel} → ${p}`);
  } else {
    process.stdout.write(JSON.stringify(out, null, 2) + '\n');
  }
}

main();
