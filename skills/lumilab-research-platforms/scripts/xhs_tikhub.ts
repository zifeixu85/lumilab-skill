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

function loadSecret(name: string): string | undefined {
  if (process.env[name]) return process.env[name];
  const secretsPath = join(process.env.LUMILAB_HOME ?? join(homedir(), '.lumilab'), 'secrets.json');
  if (!existsSync(secretsPath)) return undefined;
  try {
    const s = JSON.parse(readFileSync(secretsPath, 'utf-8'));
    return s[name] || s.tikhub?.api_key;
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

interface TikHubNote {
  note_id?: string; id?: string;
  display_title?: string; title?: string;
  desc?: string;
  user?: { nickname?: string };
  interact_info?: { liked_count?: string; collected_count?: string; comment_count?: string; share_count?: string };
  tag_list?: { name: string }[];
}

async function fetchTikHub(keyword: string, limit: number, apiKey: string) {
  const url = `https://api.tikhub.io/api/v1/xiaohongshu/web/search_notes?keyword=${encodeURIComponent(keyword)}&page=1&sort_type=general`;
  const res = await fetch(url, { headers: { 'Authorization': `Bearer ${apiKey}` } });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`E_${res.status} · TikHub: ${res.status} ${res.statusText}${body ? ' · ' + body.slice(0, 200) : ''}`);
  }
  const json = await res.json() as { data?: { items?: TikHubNote[] } };
  const items = json?.data?.items ?? [];
  return items.slice(0, limit).map((n): any => ({
    id: n.note_id ?? n.id,
    title: n.display_title ?? n.title ?? '',
    desc: n.desc ?? '',
    author: n.user?.nickname ?? '',
    likes: Number(n.interact_info?.liked_count ?? 0),
    collects: Number(n.interact_info?.collected_count ?? 0),
    comments: Number(n.interact_info?.comment_count ?? 0),
    shares: Number(n.interact_info?.share_count ?? 0),
    tags: (n.tag_list ?? []).map(t => t.name),
    url: `https://www.xiaohongshu.com/explore/${n.note_id ?? n.id}`,
    captured_at: new Date().toISOString(),
  }));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const apiKey = loadSecret('TIKHUB_API_KEY');

  let notes: any[];
  let source: 'tikhub' | 'mock';
  let notice = '';

  if (args.mock || !apiKey) {
    notes = mockNotes(args.keyword, args.limit);
    source = 'mock';
    notice = apiKey
      ? '⚠️  --mock 启用，未走真实 API'
      : '⚠️  未配置 TIKHUB_API_KEY，回退 mock 数据。可在 `lumilab config` 或 `~/.lumilab/secrets.json` 设置后启用真抓取。';
  } else {
    try {
      notes = await fetchTikHub(args.keyword, args.limit, apiKey);
      source = 'tikhub';
    } catch (e: any) {
      console.error(`✗ ${e.message}`);
      console.error('  回退 mock 数据。');
      notes = mockNotes(args.keyword, args.limit);
      source = 'mock';
      notice = `⚠️  真抓取失败：${e.message}`;
    }
  }

  const out = {
    keyword: args.keyword,
    fetched_at: new Date().toISOString(),
    source,
    notice: notice || undefined,
    notes,
  };

  if (args.venture) {
    // venture 数据永远在 ~/.lumilab/data/ventures/，跟 cwd / 谁调用无关。
    const lumilabHome = process.env.LUMILAB_HOME ?? join(homedir(), '.lumilab');
    const outDir = join(lumilabHome, 'data', 'ventures', args.venture, 'research');
    if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
    const outPath = join(outDir, 'xhs_raw.json');
    writeFileSync(outPath, JSON.stringify(out, null, 2));
    console.log(`✓ ${notes.length} 条笔记 · source=${source} → ${outPath}`);
    if (notice) console.log(notice);
  } else {
    console.log(JSON.stringify(out, null, 2));
  }
}

main().catch(e => { console.error(e); process.exit(1); });
