#!/usr/bin/env bun
/**
 * Web research adapter — Exa API.
 *
 * Usage:
 *   bun run scripts/web_exa.ts "<query>" --venture <name> [--num 10] [--mock] [--type neural|keyword]
 *
 * Reads EXA_API_KEY from env or ~/.lumilab/secrets.json. Without it, returns
 * mock results and exits 0 with a clear notice (won't break dry-run testing).
 *
 * Output: <workspace>/data/ventures/<venture>/research/web_exa.json
 *
 * Exa API: https://exa.ai/docs/reference  POST https://api.exa.ai/search
 *  body: { query, numResults, type, useAutoprompt, contents: { text: true } }
 */
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

interface Args { query: string; venture?: string; num: number; mock: boolean; type: 'neural' | 'keyword' | 'auto'; }

function parseArgs(argv: string[]): Args {
  let query = '';
  let venture: string | undefined;
  let num = 10;
  let mock = false;
  let type: Args['type'] = 'auto';
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--venture') venture = argv[++i];
    else if (a === '--num') num = Number(argv[++i]);
    else if (a === '--mock') mock = true;
    else if (a === '--type') type = argv[++i] as Args['type'];
    else if (!query) query = a;
  }
  if (!query) { console.error('用法：web_exa.ts "<query>" --venture <name>'); process.exit(2); }
  return { query, venture, num, mock, type };
}

function loadSecret(name: string): string | undefined {
  if (process.env[name]) return process.env[name];
  const secretsPath = join(process.env.LUMILAB_HOME ?? join(homedir(), '.lumilab'), 'secrets.json');
  if (!existsSync(secretsPath)) return undefined;
  try {
    const s = JSON.parse(readFileSync(secretsPath, 'utf-8'));
    return s[name] || s.exa?.api_key;
  } catch { return undefined; }
}

function mockResults(query: string, n: number) {
  return Array.from({ length: n }, (_, i) => ({
    title: `${query} — 占位结果 #${i + 1}`,
    url: `https://example.com/mock/${i}`,
    author: '',
    published_date: '',
    score: 0.5 - i * 0.02,
    text: `Mock 摘要：关于「${query}」第 ${i + 1} 条占位内容。配置 EXA_API_KEY 后切换真实搜索。`,
    highlights: [],
  }));
}

async function searchExa(args: Args, apiKey: string) {
  const url = 'https://api.exa.ai/search';
  const body = {
    query: args.query,
    numResults: args.num,
    type: args.type === 'auto' ? undefined : args.type,
    useAutoprompt: args.type === 'auto',
    contents: { text: { maxCharacters: 2000 }, highlights: { numSentences: 2, highlightsPerUrl: 3 } },
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'x-api-key': apiKey, 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`E_${res.status} · Exa: ${res.statusText}${errText ? ' · ' + errText.slice(0, 200) : ''}`);
  }
  const json = await res.json() as any;
  const items = json?.results ?? [];
  return items.map((r: any) => ({
    title: r.title ?? '',
    url: r.url,
    author: r.author ?? '',
    published_date: r.publishedDate ?? '',
    score: r.score ?? 0,
    text: (r.text ?? '').slice(0, 2000),
    highlights: r.highlights ?? [],
  }));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const apiKey = loadSecret('EXA_API_KEY');

  let results: any[];
  let source: 'exa' | 'mock';
  let notice = '';

  if (args.mock || !apiKey) {
    results = mockResults(args.query, args.num);
    source = 'mock';
    notice = apiKey ? '⚠️  --mock 启用' : '⚠️  未配置 EXA_API_KEY，回退 mock。设置后会自动启用。';
  } else {
    try {
      results = await searchExa(args, apiKey);
      source = 'exa';
    } catch (e: any) {
      console.error(`✗ ${e.message}`);
      results = mockResults(args.query, args.num);
      source = 'mock';
      notice = `⚠️  ${e.message}`;
    }
  }

  const out = { query: args.query, fetched_at: new Date().toISOString(), source, notice: notice || undefined, results };

  if (args.venture) {
    const workspace = process.env.LUMILAB_WORKSPACE ?? process.cwd();
    const outDir = join(workspace, 'data', 'ventures', args.venture, 'research');
    if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
    const outPath = join(outDir, 'web_exa.json');
    writeFileSync(outPath, JSON.stringify(out, null, 2));
    console.log(`✓ ${results.length} 条结果 · source=${source} → ${outPath}`);
    if (notice) console.log(notice);
  } else {
    console.log(JSON.stringify(out, null, 2));
  }
}

main().catch(e => { console.error(e); process.exit(1); });
