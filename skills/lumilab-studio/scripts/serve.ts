#!/usr/bin/env bun
/**
 * Studio interactive server — the localhost half of the dual-mode Studio.
 *
 * Usage:
 *   bun run serve.ts <venture-slug>
 *
 * Serves the whole ~/.lumilab/data tree (so the studio page's relative links
 * to ../landing, ../reports, ../../../_home all resolve), and exposes write
 * APIs that mutate the venture's YAML data layer and re-render the studio.
 *
 * The SAME index.html works under file:// (read-only) and here (interactive):
 * the page detects location.protocol at runtime. No separate build.
 *
 * APIs (all POST, JSON body always includes { venture }):
 *   /api/hypothesis/save        { hypothesis: {...} }   upsert (no id → create)
 *   /api/hypothesis/supersede   { id, fact, confidence, test_method, reason }
 *   /api/hypothesis/delete      { id }                  soft delete (status=archived)
 *   /api/decision/save          { decision: {...} }     upsert
 *   /api/decision/delete        { id }
 *   /api/render                 {}                       re-render only
 */

import { existsSync, readFileSync, writeFileSync, statSync } from 'fs';
import { join, resolve, normalize } from 'path';
import { homedir } from 'os';
// @ts-ignore
import * as yaml from 'js-yaml';
import { renderVenture } from './render.ts';

const LUMILAB_HOME = process.env.LUMILAB_HOME || join(homedir(), '.lumilab');
const DATA_ROOT = join(LUMILAB_HOME, 'data');
const VENTURES = join(DATA_ROOT, 'ventures');
const PORT_BASE = 7777;

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.avif': 'image/avif', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml', '.woff2': 'font/woff2', '.woff': 'font/woff',
};

function ventureDir(slug: string): string {
  return join(VENTURES, slug);
}
function hypPath(slug: string): string {
  return join(ventureDir(slug), 'hypotheses.yaml');
}
function decPath(slug: string): string {
  return join(ventureDir(slug), 'decisions.yaml');
}
function readList(p: string): any[] {
  if (!existsSync(p)) return [];
  try {
    const d = yaml.load(readFileSync(p, 'utf-8'));
    return Array.isArray(d) ? d : [];
  } catch { return []; }
}
function writeList(p: string, list: any[]): void {
  writeFileSync(p, yaml.dump(list, { lineWidth: 120, noRefs: true }), 'utf-8');
}
function nextId(list: any[], prefix: string): string {
  let max = 0;
  for (const it of list) {
    const m = String(it?.id ?? '').match(new RegExp('^' + prefix + '-(\\d+)$'));
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return prefix + '-' + String(max + 1).padStart(3, '0');
}
function nowIso(): string { return new Date().toISOString(); }
function today(): string { return nowIso().slice(0, 10); }

function reRender(slug: string): void {
  const dir = ventureDir(slug);
  if (existsSync(dir)) renderVenture(dir);
}

// ── Hypothesis ops ──
function hypSave(slug: string, h: any): void {
  const p = hypPath(slug);
  const list = readList(p);
  const idx = list.findIndex((x) => x.id === h.id);
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...pick(h, ['fact', 'confidence', 'test_method', 'test_status', 'category']), updated_at: nowIso() };
  } else {
    const id = nextId(list, 'h');
    list.push({
      id, fact: h.fact ?? '', category: h.category ?? 'assumption',
      confidence: h.confidence ?? 'medium', test_method: h.test_method ?? '',
      test_status: h.test_status ?? 'pending', evidence: [], status: 'active',
      superseded_by: null, superseded_reason: null,
      created_at: nowIso(), updated_at: nowIso(), related_entities: [],
      last_accessed: today(), access_count: 0, verification_count: 0,
    });
  }
  writeList(p, list);
}
function hypSupersede(slug: string, id: string, fact: string, confidence: string, test_method: string, reason: string): void {
  const p = hypPath(slug);
  const list = readList(p);
  const old = list.find((x) => x.id === id);
  if (!old) throw new Error('hypothesis ' + id + ' not found');
  const newId = nextId(list, 'h');
  old.status = 'superseded';
  old.superseded_by = newId;
  old.superseded_reason = reason || null;
  old.updated_at = nowIso();
  list.push({
    id: newId, fact: fact ?? old.fact, category: old.category ?? 'assumption',
    confidence: confidence ?? old.confidence, test_method: test_method ?? old.test_method ?? '',
    test_status: 'pending', evidence: [], status: 'active',
    superseded_by: null, superseded_reason: null,
    created_at: nowIso(), updated_at: nowIso(), related_entities: old.related_entities ?? [],
    last_accessed: today(), access_count: 0, verification_count: 0,
  });
  writeList(p, list);
}
function hypDelete(slug: string, id: string): void {
  const p = hypPath(slug);
  const list = readList(p);
  const h = list.find((x) => x.id === id);
  if (!h) throw new Error('hypothesis ' + id + ' not found');
  h.status = 'archived';
  h.updated_at = nowIso();
  writeList(p, list);
}

// ── Decision ops ──
function decSave(slug: string, d: any): void {
  const p = decPath(slug);
  const list = readList(p);
  const idx = list.findIndex((x) => x.id === d.id);
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...pick(d, ['decision', 'rationale', 'type']) };
  } else {
    list.push({
      id: nextId(list, 'd'), decision: d.decision ?? '', rationale: d.rationale ?? '',
      by: 'user', type: d.type ?? 'mechanical', at: nowIso(), related: [], superseded_by: null,
    });
  }
  writeList(p, list);
}
function decDelete(slug: string, id: string): void {
  const p = decPath(slug);
  const list = readList(p).filter((x) => x.id !== id);
  writeList(p, list);
}

function pick(obj: any, keys: string[]): any {
  const out: any = {};
  for (const k of keys) if (obj[k] !== undefined) out[k] = obj[k];
  return out;
}

function json(body: any, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8' } });
}

// ── Static file serving (path-traversal guarded, rooted at DATA_ROOT) ──
function serveStatic(pathname: string): Response {
  let rel = decodeURIComponent(pathname.replace(/^\/+/, ''));
  const abs = normalize(join(DATA_ROOT, rel));
  if (!abs.startsWith(DATA_ROOT)) return new Response('forbidden', { status: 403 });
  let target = abs;
  if (existsSync(target) && statSync(target).isDirectory()) target = join(target, 'index.html');
  if (!existsSync(target)) return new Response('not found: ' + rel, { status: 404 });
  const ext = target.slice(target.lastIndexOf('.'));
  return new Response(readFileSync(target), { headers: { 'content-type': MIME[ext] ?? 'application/octet-stream' } });
}

async function handleApi(pathname: string, req: Request): Promise<Response> {
  const body = await req.json().catch(() => ({}));
  const slug = String(body.venture ?? '');
  if (!slug || !existsSync(ventureDir(slug))) return json({ ok: false, error: 'unknown venture: ' + slug }, 400);
  try {
    switch (pathname) {
      case '/api/hypothesis/save': hypSave(slug, body.hypothesis ?? {}); break;
      case '/api/hypothesis/supersede': hypSupersede(slug, body.id, body.fact, body.confidence, body.test_method, body.reason); break;
      case '/api/hypothesis/delete': hypDelete(slug, body.id); break;
      case '/api/decision/save': decSave(slug, body.decision ?? {}); break;
      case '/api/decision/delete': decDelete(slug, body.id); break;
      case '/api/render': break;
      default: return json({ ok: false, error: 'unknown endpoint' }, 404);
    }
    reRender(slug);
    return json({ ok: true });
  } catch (e) {
    return json({ ok: false, error: (e as Error).message }, 500);
  }
}

function main(): void {
  const slug = process.argv[2];
  if (!slug) { console.error('usage: bun serve.ts <venture-slug>'); process.exit(1); }
  if (!existsSync(ventureDir(slug))) { console.error('venture not found: ' + ventureDir(slug)); process.exit(1); }

  // ensure a fresh render before opening
  reRender(slug);

  let server: any;
  for (let port = PORT_BASE; port < PORT_BASE + 10; port++) {
    try {
      server = Bun.serve({
        port,
        async fetch(req): Promise<Response> {
          const url = new URL(req.url);
          if (url.pathname.startsWith('/api/') && req.method === 'POST') return handleApi(url.pathname, req);
          if (url.pathname === '/favicon.ico') return new Response(null, { status: 204 });
          if (url.pathname === '/') return Response.redirect('/ventures/' + slug + '/studio/index.html', 302);
          return serveStatic(url.pathname);
        },
      });
      break;
    } catch (e) {
      if (port === PORT_BASE + 9) { console.error('no free port in 7777-7786'); process.exit(1); }
    }
  }

  const openUrl = 'http://localhost:' + server.port + '/ventures/' + slug + '/studio/index.html';
  console.log('[studio] interactive · ' + openUrl);
  console.log('[studio] Ctrl+C to stop');
  const opener = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
  try { Bun.spawn([opener, openUrl], { stdout: 'ignore', stderr: 'ignore' }); } catch { /* manual */ }
}

if (import.meta.main) main();
