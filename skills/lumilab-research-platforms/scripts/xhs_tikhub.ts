#!/usr/bin/env bun
/**
 * Xiaohongshu (XHS) research adapter — TikHub API.
 *
 * Usage:
 *   bun run scripts/xhs_tikhub.ts <keyword> --venture <name> [--limit 10] [--mock]
 *
 * Reads TIKHUB_API_KEY from env or ~/.lumilab/secrets.json.
 * If no key (or --mock), emits curated mock data and exits 0 with a clear notice.
 * Output: <workspace>/data/ventures/<venture>/research/xhs_raw.json
 *
 * TikHub endpoints used (api/v1/xiaohongshu/web):
 *   - /search/notes?keyword=<>&page=1&sort_type=general
 *   - /note/detail?note_id=<>           (optional enrich)
 *
 * Schema returned:
 * {
 *   keyword, fetched_at, source: 'tikhub' | 'mock',
 *   notes: [
 *     { id, title, desc, author, likes, collects, comments, shares, tags, url, captured_at }
 *   ]
 * }
 */
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

interface CliArgs { keyword: string; venture?: string; limit: number; mock: boolean; }

function parseArgs(argv: string[]): CliArgs {
  let keyword = '';
  let venture: string | undefined;
  let limit = 10;
  let mock = false;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--venture') venture = argv[++i];
    else if (a === '--limit') limit = Number(argv[++i]);
    else if (a === '--mock') mock = true;
    else if (!keyword) keyword = a;
  }
  if (!keyword) {
    console.error('用法：xhs_tikhub.ts <keyword> --venture <name> [--limit 10] [--mock]');
    process.exit(2);
  }
  return { keyword, venture, limit, mock };
}

// Resolve a secret across env → platform keychain → secrets.json, trying BOTH
// the canonical UPPER name and the wizard's lowercase form (e.g. tikhub_api_key).
// Mirrors research-keywords/providers/index.ts so config-wizard tokens are actually found.
function loadSecret(name: string): string | undefined {
  const lower = name.toLowerCase();
  if (process.env[name]) return process.env[name];
  if (process.env[lower]) return process.env[lower];
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
    return s[name] || s[lower] || s.tikhub?.api_key;
  } catch { return undefined; }
}

function mockNotes(keyword: string, n: number) {
  return Array.from({ length: n }, (_, i) => ({
    id: `mock-${Date.now()}-${i}`,
    title: `${keyword} · 关键洞察 #${i + 1}`,
    desc: `这是 mock 数据。配置 TIKHUB_API_KEY 后会自动切换真实抓取。关键词「${keyword}」第 ${i + 1} 条占位内容。`,
    author: `mock_author_${i}`,
    likes: 100 + i * 37 % 800,
    collects: 30 + i * 19 % 220,
    comments: 5 + i * 7 % 80,
    shares: 2 + i * 3 % 30,
    tags: [keyword, '副业', '独立开发'].slice(0, 2 + (i % 2)),
    url: `https://www.xiaohongshu.com/explore/mock-${i}`,
    captured_at: new Date().toISOString(),
  }));
}

// Xiaohongshu-App-V2-API note shape: items are { note, model_type }, counts are flat on note.
interface TikHubNoteItem {
  model_type?: string;
  note?: {
    id?: string;
    title?: string;
    desc?: string;
    type?: string;
    user?: { nickname?: string };
    liked_count?: number | string;
    collected_count?: number | string;
    comments_count?: number | string;
    shared_count?: number | string;
    tag_info?: { name?: string }[] | unknown;
    xsec_token?: string;
  };
}

async function fetchTikHub(keyword: string, limit: number, apiKey: string) {
  // 旧的 /api/v1/xiaohongshu/web/search_notes 已被 TikHub 弃用 → 迁到 App-V2-API（推荐）。
  // 响应：json.data.data.items[]，每项 { note, model_type }，互动数平铺在 note 上。
  const url = `https://api.tikhub.io/api/v1/xiaohongshu/app_v2/search_notes?keyword=${encodeURIComponent(keyword)}&page=1&sort=general`;
  const res = await fetch(url, { headers: { 'Authorization': `Bearer ${apiKey}` } });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`E_${res.status} · TikHub: ${res.status} ${res.statusText}${body ? ' · ' + body.slice(0, 200) : ''}`);
  }
  const json = await res.json() as { data?: { data?: { items?: TikHubNoteItem[] } } };
  const items = json?.data?.data?.items ?? [];
  return items
    .filter((it) => it?.model_type === 'note' && it.note)
    .slice(0, limit)
    .map((it): any => {
      const n = it.note!;
      const tags = Array.isArray(n.tag_info) ? (n.tag_info as { name?: string }[]).map((t) => t?.name).filter(Boolean) : [];
      const token = n.xsec_token ? `?xsec_token=${n.xsec_token}&xsec_source=pc_search` : '';
      return {
        id: n.id,
        title: n.title ?? '',
        desc: n.desc ?? '',
        author: n.user?.nickname ?? '',
        likes: Number(n.liked_count ?? 0),
        collects: Number(n.collected_count ?? 0),
        comments: Number(n.comments_count ?? 0),
        shares: Number(n.shared_count ?? 0),
        tags,
        url: `https://www.xiaohongshu.com/explore/${n.id}${token}`,
        captured_at: new Date().toISOString(),
      };
    });
}

function writeOut(args: CliArgs, d: { source: string; notes: any[]; notice?: string }): void {
  const out = { keyword: args.keyword, fetched_at: new Date().toISOString(), source: d.source, notice: d.notice || undefined, notes: d.notes };
  if (args.venture) {
    // venture 数据永远在 ~/.lumilab/data/ventures/，跟 cwd / 谁调用无关。
    const lumilabHome = process.env.LUMILAB_HOME ?? join(homedir(), '.lumilab');
    const outDir = join(lumilabHome, 'data', 'ventures', args.venture, 'research');
    if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
    const outPath = join(outDir, 'xhs_raw.json');
    writeFileSync(outPath, JSON.stringify(out, null, 2));
    console.log(`✓ ${d.notes.length} 条笔记 · source=${d.source} → ${outPath}`);
    if (d.notice) console.log(d.notice);
  } else {
    console.log(JSON.stringify(out, null, 2));
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const apiKey = loadSecret('TIKHUB_API_KEY');

  // 显式 --mock：仅测试 / 纯离线 demo。
  if (args.mock) {
    writeOut(args, { source: 'mock', notice: '⚠️  --mock 启用（占位数据，仅测试）', notes: mockNotes(args.keyword, args.limit) });
    return;
  }

  // 有 key：真实 TikHub。
  if (apiKey) {
    try {
      const notes = await fetchTikHub(args.keyword, args.limit, apiKey);
      writeOut(args, { source: 'tikhub', notes });
      const { recordUsage } = await import('./agent_handoff.ts');
      recordUsage(args.venture, 'tikhub');
      return;
    } catch (e: any) {
      console.error(`✗ ${e.message}`);
      // 真抓取失败不落 mock —— 交宿主 agent 代搜（真实兜底）。
      const { emitAgentPending } = await import('./agent_handoff.ts');
      emitAgentPending({ channel: 'xhs', venture: args.venture, queries: [args.keyword], reason: `TikHub 抓取失败（${String(e.message).split('·')[0].trim()}）` });
      return;
    }
  }

  // 无 key：宿主代搜（真实数据，非 mock）。
  const { emitAgentPending } = await import('./agent_handoff.ts');
  emitAgentPending({ channel: 'xhs', venture: args.venture, queries: [args.keyword], reason: '未配置 TIKHUB_API_KEY' });
}

main().catch(e => { console.error(e); process.exit(1); });
