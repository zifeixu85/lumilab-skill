#!/usr/bin/env bun
/**
 * Studio server — the localhost half of the dual-mode Studio.
 *
 * Two run shapes share ONE fetch handler (buildHandler):
 *   bun run serve.ts <venture-slug>   foreground, opens browser, port-scans 7777-7786
 *   bun run serve.ts --home           foreground home dashboard
 *   bun run serve.ts --daemon         resident daemon (W1): fixed port, no browser,
 *                                      writes ~/.lumilab/run/studio.json, SIGTERM-aware
 *
 * Serves the whole ~/.lumilab/data tree (so the studio page's relative links
 * to ../landing, ../reports, ../../../_home all resolve), and exposes write
 * APIs that mutate the venture's YAML/JSON data layer and re-render the studio.
 *
 * W1 additions (resident studio):
 *   - GET /api/ping            → { ok, pid, port, version }  (liveness / anti-port-clash)
 *   - GET /api/events          → SSE stream; fs.watch(DATA_ROOT) → `reload` to all clients
 *   - live-reload script injected into served .html (skipped under file:// at runtime)
 *   - lazy re-render: GET a studio index whose data files are newer → renderVenture first
 *
 * The SAME index.html works under file:// (read-only) and here (interactive):
 * the page detects location.protocol at runtime. No separate build.
 *
 * Write APIs (all POST, JSON body always includes { venture }):
 *   /api/hypothesis/save | /supersede | /delete
 *   /api/decision/save | /delete
 *   /api/design/adjust       { design }           merge into design_direction.json
 *   /api/design/apply        { theme }            deterministic re-theme: json + theme.css (W4)
 *   /api/direction/select    { directionId, title }
 *   /api/next-action/add | /update | /move | /delete                            (W2)
 *   /api/render              {}                    re-render only
 */

import { existsSync, readFileSync, writeFileSync, statSync, mkdirSync, readdirSync, watch as fsWatch, unlinkSync } from 'fs';
import { join, resolve, normalize } from 'path';
import { homedir } from 'os';
// @ts-ignore
import * as yaml from 'js-yaml';
import { renderVenture } from './render.ts';

const LUMILAB_HOME = process.env.LUMILAB_HOME || join(homedir(), '.lumilab');
const DATA_ROOT = join(LUMILAB_HOME, 'data');
const VENTURES = join(DATA_ROOT, 'ventures');
const RUN_DIR = join(LUMILAB_HOME, 'run');
const RUN_FILE = join(RUN_DIR, 'studio.json');
const PORT_BASE = 7777;
const STUDIO_VERSION = '1.9.0';

function readConfig(): any {
  try { return JSON.parse(readFileSync(join(LUMILAB_HOME, 'config.json'), 'utf-8')); } catch { return {}; }
}
function studioPort(): number {
  return Number(process.env.LUMILAB_STUDIO_PORT || readConfig().studio_port || PORT_BASE);
}

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
function naPath(slug: string): string {
  return join(ventureDir(slug), 'studio', 'next-actions.json');
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

// ── Design direction (P3): merge a partial design into design_direction.json ──
function ddPath(slug: string): string {
  return join(ventureDir(slug), 'design_direction.json');
}
function designAdjust(slug: string, patch: any): void {
  const p = ddPath(slug);
  let dd: any = {};
  if (existsSync(p)) { try { dd = JSON.parse(readFileSync(p, 'utf-8')); } catch { dd = {}; } }
  if (patch.preset) dd.preset = patch.preset;
  if (patch.dials) dd.dials = { ...(dd.dials ?? {}), ...patch.dials };
  if (patch.radius != null) dd.radius = patch.radius;
  if (patch.palette) dd.palette = { ...(dd.palette ?? {}), ...patch.palette };
  if (patch.typography) dd.typography = { ...(dd.typography ?? {}), ...patch.typography };
  dd.updated_at = nowIso();
  writeFileSync(p, JSON.stringify(dd, null, 2) + '\n', 'utf-8');
}

// ── Design APPLY (W4): deterministic re-theme — write json + rewrite landing theme.css, NO LLM ──
// theme: { accent, accent2, surface, ink, ink2, radius, spaceScale, fontHeading, fontBody, hero, button }
function detectLatestLandingDir(slug: string): string | null {
  const lp = join(ventureDir(slug), 'landing');
  if (!existsSync(lp)) return null;
  let best: { n: number; dir: string } | null = null;
  let flat = false;
  for (const e of readdirSync(lp)) {
    const m = e.match(/^v(\d+)$/);
    if (m && existsSync(join(lp, e, 'index.html'))) {
      const n = parseInt(m[1], 10);
      if (!best || n > best.n) best = { n, dir: join(lp, e) };
    } else if (e === 'index.html') flat = true;
  }
  if (best) return best.dir;
  if (flat) return lp;
  return null;
}
function themeCss(t: any): string {
  // canonical design tokens consumed by landing styles.css + live preview.
  const v = (x: any, d: string) => (x == null || x === '' ? d : String(x));
  const accent = v(t.accent, 'oklch(45% 0.15 25)');
  const accent2 = v(t.accent2, 'oklch(70% 0.12 250)');
  const surface = v(t.surface, 'oklch(98% 0.01 80)');
  const ink = v(t.ink, 'oklch(20% 0 0)');
  const ink2 = v(t.ink2, 'oklch(45% 0 0)');
  const radius = v(t.radius, '6') + (String(t.radius ?? '').includes('px') ? '' : 'px');
  const spaceScale = v(t.spaceScale, '1');
  const fontHeading = v(t.fontHeading, '"Fraunces","Noto Serif SC",Georgia,serif');
  const fontBody = v(t.fontBody, '"Fraunces","Noto Serif SC",Georgia,serif');
  return `/* theme.css — Lumi Lab deterministic design tokens (re-theme target, no LLM).
   Loaded AFTER styles.css; overrides :root tokens the landing consumes.
   The Studio design panel writes this file via POST /api/design/apply. */
:root{
  --accent: ${accent};
  --accent-2: ${accent2};
  --surface: ${surface};
  --ink: ${ink};
  --ink-2: ${ink2};
  --radius: ${radius};
  --space-scale: ${spaceScale};
  --font-heading: ${fontHeading};
  --font-body: ${fontBody};

  /* bridge canonical color tokens → the variable names the landing's styles.css uses.
     (fonts/radius/space are consumed via the canonical names directly in styles.css) */
  --color-accent: var(--accent);
  --color-paper: var(--surface);
  --color-surface: color-mix(in oklch, var(--surface) 70%, white);
  --color-ink: var(--ink);
  --color-muted: var(--ink-2);
  --color-line: color-mix(in oklch, var(--ink) 14%, transparent);
}
`;
}
function designApply(slug: string, theme: any): { themeCssWritten: boolean } {
  // 1) persist the canonical tokens into design_direction.json (data truth)
  const p = ddPath(slug);
  let dd: any = {};
  if (existsSync(p)) { try { dd = JSON.parse(readFileSync(p, 'utf-8')); } catch { dd = {}; } }
  dd.preset = theme.preset ?? dd.preset;
  dd.palette = { ...(dd.palette ?? {}), accent: theme.accent ?? dd.palette?.accent, accent_2: theme.accent2 ?? dd.palette?.accent_2, surface: theme.surface ?? dd.palette?.surface, text_primary: theme.ink ?? dd.palette?.text_primary, text_secondary: theme.ink2 ?? dd.palette?.text_secondary };
  if (theme.radius != null) dd.radius = parseInt(String(theme.radius), 10);
  dd.dials = { ...(dd.dials ?? {}), ...(theme.dials ?? {}) };
  dd.typography = { ...(dd.typography ?? {}), heading: theme.fontHeading ?? dd.typography?.heading, body: theme.fontBody ?? dd.typography?.body };
  dd.layout = { ...(dd.layout ?? {}), hero: theme.hero ?? dd.layout?.hero, button: theme.button ?? dd.layout?.button, space_scale: theme.spaceScale ?? dd.layout?.space_scale };
  dd.updated_at = nowIso();
  writeFileSync(p, JSON.stringify(dd, null, 2) + '\n', 'utf-8');

  // 2) deterministically (re)write the latest landing's theme.css — no LLM involved
  const landingDir = detectLatestLandingDir(slug);
  let themeCssWritten = false;
  if (landingDir) {
    writeFileSync(join(landingDir, 'theme.css'), themeCss(theme), 'utf-8');
    themeCssWritten = true;
    // ensure index.html links theme.css (idempotent) + sets hero/button data hooks
    const idx = join(landingDir, 'index.html');
    if (existsSync(idx)) {
      let html = readFileSync(idx, 'utf-8');
      if (!/href="theme\.css"/.test(html)) {
        // inject AFTER styles.css so theme overrides win; else before </head>
        if (/href="styles\.css"\s*\/?>/.test(html)) {
          html = html.replace(/(<link[^>]*href="styles\.css"[^>]*>)/, '$1\n<link rel="stylesheet" href="theme.css">');
        } else {
          html = html.replace('</head>', '<link rel="stylesheet" href="theme.css">\n</head>');
        }
      }
      if (theme.hero) html = html.replace(/(<body[^>]*?)( data-hero="[^"]*")?(>)/, `$1 data-hero="${escAttr(String(theme.hero))}"$3`);
      if (theme.button) html = html.replace(/(<body[^>]*?)( data-button="[^"]*")?(>)/, `$1 data-button="${escAttr(String(theme.button))}"$3`);
      writeFileSync(idx, html, 'utf-8');
    }
  }
  return { themeCssWritten };
}
function escAttr(s: string): string { return String(s).replace(/"/g, '&quot;').replace(/</g, '&lt;'); }

// ── Direction pick (P2): record the chosen direction as a decision ──
function directionSelect(slug: string, directionId: string, title: string): void {
  const p = decPath(slug);
  const list = readList(p);
  list.push({
    id: nextId(list, 'd'),
    decision: '选定方向：' + (title || directionId),
    rationale: '用户在 Studio 方向卡片中选择此方向，准备生成对应的 landing 验证页。',
    by: 'user', type: 'directional', at: nowIso(),
    related: [directionId], superseded_by: null,
  });
  writeList(p, list);
}

// ── Next actions (W2): kanban card ops on studio/next-actions.json ──
function readNa(slug: string): any {
  const p = naPath(slug);
  if (!existsSync(p)) return null;
  try { return JSON.parse(readFileSync(p, 'utf-8')); } catch { return null; }
}
function writeNa(slug: string, na: any): void {
  const p = naPath(slug);
  mkdirSync(join(ventureDir(slug), 'studio'), { recursive: true });
  na.generated_at = na.generated_at ?? nowIso();
  writeFileSync(p, JSON.stringify(na, null, 2) + '\n', 'utf-8');
}
function naRequire(slug: string): any {
  const na = readNa(slug);
  if (!na) throw new Error('no next-actions.json — run lumilab-next-actions first');
  na.tasks = Array.isArray(na.tasks) ? na.tasks : [];
  return na;
}
function naMove(slug: string, id: string, column: string): void {
  const na = naRequire(slug);
  const t = na.tasks.find((x: any) => x.id === id);
  if (!t) throw new Error('task ' + id + ' not found');
  t.column = column;
  t.updated_at = nowIso();
  writeNa(slug, na);
}
function naAdd(slug: string, task: any): void {
  const na = naRequire(slug);
  const id = nextId(na.tasks, 't');
  na.tasks.push({
    id, column: task.column ?? 'to_validate', title: task.title ?? '(未命名)',
    detail: task.detail ?? '', priority: task.priority ?? 'medium', stage: task.stage ?? 'launch',
    linked_hypothesis: task.linked_hypothesis ?? null, source: task.source ?? 'user',
    created_at: nowIso(), updated_at: nowIso(),
  });
  writeNa(slug, na);
}
function naUpdate(slug: string, id: string, patch: any): void {
  const na = naRequire(slug);
  const t = na.tasks.find((x: any) => x.id === id);
  if (!t) throw new Error('task ' + id + ' not found');
  Object.assign(t, pick(patch, ['title', 'detail', 'priority', 'column', 'stage', 'linked_hypothesis']), { updated_at: nowIso() });
  writeNa(slug, na);
}
function naDelete(slug: string, id: string): void {
  const na = naRequire(slug);
  na.tasks = na.tasks.filter((x: any) => x.id !== id);
  writeNa(slug, na);
}

function pick(obj: any, keys: string[]): any {
  const out: any = {};
  for (const k of keys) if (obj[k] !== undefined) out[k] = obj[k];
  return out;
}

function json(body: any, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8' } });
}

// ── SSE live-reload (W1) ──
const enc = new TextEncoder();
const sseClients = new Set<ReadableStreamDefaultController>();
let watching = false;
let heartbeat: ReturnType<typeof setInterval> | null = null;

function broadcast(msg: string): void {
  const chunk = enc.encode(msg);
  for (const c of sseClients) { try { c.enqueue(chunk); } catch { /* dropped */ } }
}
function ignoredPath(fn: string | null): boolean {
  if (!fn) return false;
  const p = fn.replace(/\\/g, '/');
  return p.includes('/run/') || p.endsWith('.log')
    || p.endsWith('studio/index.html') || p.endsWith('_home/home.html')
    || p.includes('/.git/') || p.endsWith('.tmp') || p.endsWith('~');
}
function ensureWatch(): void {
  if (watching) return;
  watching = true;
  let t: ReturnType<typeof setTimeout> | null = null;
  try {
    fsWatch(DATA_ROOT, { recursive: true }, (_ev, fn) => {
      if (ignoredPath(fn as string)) return;
      if (t) clearTimeout(t);
      t = setTimeout(() => broadcast('data: reload\n\n'), 200);
    });
  } catch {
    // recursive watch unsupported (some Linux): degrade to no-live-reload; manual refresh still works
    watching = false;
  }
}
function sseResponse(): Response {
  let ctrl: ReadableStreamDefaultController;
  const stream = new ReadableStream({
    start(controller) {
      ctrl = controller;
      sseClients.add(controller);
      controller.enqueue(enc.encode(': connected\n\n'));
      ensureWatch();
      if (!heartbeat) heartbeat = setInterval(() => broadcast(': ping\n\n'), 30000);
    },
    cancel() { sseClients.delete(ctrl); },
  });
  return new Response(stream, {
    headers: {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache, no-transform',
      'connection': 'keep-alive',
    },
  });
}

const RELOAD_SNIPPET =
  '<script>if(location.protocol!=="file:"){try{var _es=new EventSource("/api/events");' +
  '_es.onmessage=function(e){if(e.data==="reload")location.reload();};}catch(_){}}</script>';

// ── Lazy re-render (W1): if a studio's source data is newer than its rendered HTML, render first ──
function latestDataMtime(dir: string): number {
  let max = 0;
  const bump = (p: string) => { try { if (existsSync(p)) max = Math.max(max, statSync(p).mtimeMs); } catch { /* ignore */ } };
  const walk = (p: string, depth = 0) => {
    if (depth > 4 || !existsSync(p)) return;
    let st; try { st = statSync(p); } catch { return; }
    if (st.isFile()) { max = Math.max(max, st.mtimeMs); return; }
    if (st.isDirectory()) { try { for (const e of readdirSync(p)) if (!e.startsWith('.')) walk(join(p, e), depth + 1); } catch { /* ignore */ } }
  };
  for (const f of ['hypotheses.yaml', 'decisions.yaml', 'market_analysis.json', 'design_direction.json', 'project_brief.md', 'review_report.md']) bump(join(dir, f));
  for (const d of ['landing', 'research', 'payment', 'reports']) walk(join(dir, d));
  bump(join(dir, 'studio', 'next-actions.json'));
  return max;
}
function maybeRerenderStudio(pathname: string): void {
  const m = pathname.match(/^\/ventures\/([^/]+)\/studio\/index\.html$/);
  if (!m) return;
  const slug = decodeURIComponent(m[1]);
  const dir = ventureDir(slug);
  if (!existsSync(dir)) return;
  const idx = join(dir, 'studio', 'index.html');
  const idxM = existsSync(idx) ? statSync(idx).mtimeMs : 0;
  if (latestDataMtime(dir) > idxM) {
    try { renderVenture(dir); } catch { /* keep stale page rather than 500 */ }
  }
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
  if (ext === '.html') {
    // inject live-reload snippet (no-op under file://); never touches on-disk file
    let html = readFileSync(target, 'utf-8');
    html = html.includes('</body>') ? html.replace('</body>', RELOAD_SNIPPET + '</body>') : html + RELOAD_SNIPPET;
    return new Response(html, { headers: { 'content-type': MIME['.html'] } });
  }
  return new Response(readFileSync(target), { headers: { 'content-type': MIME[ext] ?? 'application/octet-stream' } });
}

async function handleApi(pathname: string, req: Request): Promise<Response> {
  const body = await req.json().catch(() => ({}));
  const slug = String(body.venture ?? '');
  if (!slug || !existsSync(ventureDir(slug))) return json({ ok: false, error: 'unknown venture: ' + slug }, 400);
  try {
    let extra: any = {};
    switch (pathname) {
      case '/api/hypothesis/save': hypSave(slug, body.hypothesis ?? {}); break;
      case '/api/hypothesis/supersede': hypSupersede(slug, body.id, body.fact, body.confidence, body.test_method, body.reason); break;
      case '/api/hypothesis/delete': hypDelete(slug, body.id); break;
      case '/api/decision/save': decSave(slug, body.decision ?? {}); break;
      case '/api/decision/delete': decDelete(slug, body.id); break;
      case '/api/design/adjust': designAdjust(slug, body.design ?? {}); break;
      case '/api/design/apply': extra = designApply(slug, body.theme ?? {}); break;
      case '/api/direction/select': directionSelect(slug, body.directionId, body.title); break;
      case '/api/next-action/move': naMove(slug, body.id, body.column); break;
      case '/api/next-action/add': naAdd(slug, body.task ?? {}); break;
      case '/api/next-action/update': naUpdate(slug, body.id, body.patch ?? body); break;
      case '/api/next-action/delete': naDelete(slug, body.id); break;
      case '/api/render': break;
      default: return json({ ok: false, error: 'unknown endpoint' }, 404);
    }
    reRender(slug);
    return json({ ok: true, ...extra });
  } catch (e) {
    return json({ ok: false, error: (e as Error).message }, 500);
  }
}

// Re-render the home dashboard (data/_home/home.html) without opening a browser.
function reRenderHome(): void {
  const homeScript = join(import.meta.dir, '..', '..', 'lumilab-home', 'scripts', 'home.ts');
  if (!existsSync(homeScript)) return;
  Bun.spawnSync(['bun', 'run', homeScript, 'render'], {
    env: { ...process.env, LUMILAB_CHANNEL: 'served' },
    stdout: 'ignore', stderr: 'ignore',
  });
}

// ── Shared fetch handler ──
function buildHandler(openPath: string) {
  return async function fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const pn = url.pathname;
    if (pn === '/api/ping') return json({ ok: true, pid: process.pid, port: ACTIVE_PORT, version: STUDIO_VERSION });
    if (pn === '/api/events' && req.method === 'GET') return sseResponse();
    if (pn.startsWith('/api/') && req.method === 'POST') return handleApi(pn, req);
    if (pn === '/favicon.ico') return new Response(null, { status: 204 });
    if (pn === '/_home/home.html') { reRenderHome(); return serveStatic(pn); }
    if (pn === '/') return Response.redirect(openPath, 302);
    maybeRerenderStudio(pn);
    return serveStatic(pn);
  };
}

let ACTIVE_PORT = PORT_BASE;

function writeRunFile(port: number): void {
  mkdirSync(RUN_DIR, { recursive: true });
  writeFileSync(RUN_FILE, JSON.stringify({
    pid: process.pid, port, host: '127.0.0.1', version: STUDIO_VERSION, started_at: nowIso(),
  }, null, 2) + '\n', 'utf-8');
}
function clearRunFile(): void { try { if (existsSync(RUN_FILE)) unlinkSync(RUN_FILE); } catch { /* ignore */ } }

function runDaemon(): void {
  const port = studioPort();
  ACTIVE_PORT = port;
  let server: any;
  try {
    server = Bun.serve({ port, hostname: '127.0.0.1', fetch: buildHandler('/_home/home.html') });
  } catch (e) {
    console.error('[daemon] port ' + port + ' busy — run `lumilab serve stop` or set studio_port. ' + (e as Error).message);
    process.exit(1);
  }
  reRenderHome();
  writeRunFile(server.port);
  const url = 'http://127.0.0.1:' + server.port + '/';
  console.log('[daemon] resident studio up · ' + url + ' · pid ' + process.pid);
  const shutdown = () => { clearRunFile(); try { server.stop(true); } catch { /* ignore */ } process.exit(0); };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

function runForeground(): void {
  const args = process.argv.slice(2);
  const homeMode = args.includes('--home');
  const slug = args.find((a) => !a.startsWith('--'));

  let openPath: string;
  if (homeMode) {
    reRenderHome();
    openPath = '/_home/home.html';
  } else {
    if (!slug) { console.error('usage: bun serve.ts <venture-slug> | --home | --daemon'); process.exit(1); }
    if (!existsSync(ventureDir(slug))) { console.error('venture not found: ' + ventureDir(slug)); process.exit(1); }
    reRender(slug);
    openPath = '/ventures/' + slug + '/studio/index.html';
  }

  const handler = buildHandler(openPath);
  let server: any;
  for (let port = PORT_BASE; port < PORT_BASE + 10; port++) {
    try {
      server = Bun.serve({ port, fetch: handler });
      ACTIVE_PORT = port;
      break;
    } catch {
      if (port === PORT_BASE + 9) { console.error('no free port in 7777-7786'); process.exit(1); }
    }
  }

  const openUrl = 'http://localhost:' + server.port + openPath;
  const tag = homeMode ? '[home]' : '[studio]';
  console.log(tag + ' interactive · ' + openUrl);
  console.log(tag + ' Ctrl+C to stop');
  const opener = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
  try { Bun.spawn([opener, openUrl], { stdout: 'ignore', stderr: 'ignore' }); } catch { /* manual */ }
}

function main(): void {
  if (process.argv.includes('--daemon')) runDaemon();
  else runForeground();
}

if (import.meta.main) main();
