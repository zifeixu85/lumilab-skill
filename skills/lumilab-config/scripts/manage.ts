/**
 * manage.ts — /lumilab manage command.
 *
 * Utility Dashboard for deployed venture studios. Data-dense table view
 * (Linear / Stripe / Notion-style), one row per venture. Inline expanders
 * for rotate / QR / delete. No modals.
 *
 * Usage:
 *   bun run skills/lumilab-config/scripts/manage.ts
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
import { spawnSync } from 'child_process';
import { homedir } from 'os';
import QRCode from 'qrcode-svg';

const LUMILAB_HOME = process.env.LUMILAB_HOME ?? join(homedir(), '.lumilab');
const WORKSPACE = process.env.LUMILAB_WORKSPACE ?? resolve(__dirname, '../../..');
const SHARES_PATH = join(LUMILAB_HOME, 'shares.json');
const SECRETS_PATH = join(LUMILAB_HOME, 'secrets.json');

// ─────────  TYPES  ─────────

type Visibility = 'public' | 'private';
type Status = 'active' | 'archived';

interface ShareRecord {
  venture: string;
  url: string;
  password_ref: string;
  visibility: Visibility;
  deployed_at: string;
  last_redeployed: string;
  status: Status;
  cloudflare_project_name: string;
  display_name?: string;
  visits?: number;
}

interface SharesFile {
  shares: ShareRecord[];
}

interface SecretsFile {
  venture_passwords?: Record<string, string>;
  cloudflare_api_token?: string;
  [k: string]: unknown;
}

// ─────────  IO  ─────────

function loadShares(): SharesFile {
  if (!existsSync(SHARES_PATH)) return { shares: [] };
  try {
    return JSON.parse(readFileSync(SHARES_PATH, 'utf-8'));
  } catch {
    return { shares: [] };
  }
}

function saveShares(data: SharesFile): void {
  writeFileSync(SHARES_PATH, JSON.stringify(data, null, 2));
}

function loadSecrets(): SecretsFile {
  if (!existsSync(SECRETS_PATH)) return {};
  try {
    return JSON.parse(readFileSync(SECRETS_PATH, 'utf-8'));
  } catch {
    return {};
  }
}

function saveSecrets(data: SecretsFile): void {
  writeFileSync(SECRETS_PATH, JSON.stringify(data, null, 2));
}

function getVenturePassword(venture: string): string | null {
  const secrets = loadSecrets();
  return secrets.venture_passwords?.[venture] ?? null;
}

function setVenturePassword(venture: string, password: string): void {
  const secrets = loadSecrets();
  const next: SecretsFile = {
    ...secrets,
    venture_passwords: {
      ...(secrets.venture_passwords ?? {}),
      [venture]: password,
    },
  };
  saveSecrets(next);
}

function loadVentureDisplayName(venture: string): string {
  const briefPath = join(WORKSPACE, 'data', 'ventures', venture, 'project_brief.md');
  if (existsSync(briefPath)) {
    const text = readFileSync(briefPath, 'utf-8');
    const headingMatch = text.match(/^\s*#\s+(.+)$/m);
    if (headingMatch && headingMatch[1]) {
      return headingMatch[1].replace(/[*_`]/g, '').trim().slice(0, 80);
    }
  }
  return '';
}

// ─────────  DEPLOY HOOK  ─────────

interface DeployResult {
  ok: boolean;
  stdout: string;
  stderr: string;
}

function runDeploy(venture: string, options: { public?: boolean } = {}): DeployResult {
  const deployScript = join(WORKSPACE, 'skills', 'lumilab-deploy', 'scripts', 'deploy.ts');
  const args = [deployScript, venture];
  if (options.public) args.push('--public');
  const r = spawnSync('bun', ['run', ...args], {
    cwd: WORKSPACE,
    encoding: 'utf-8',
  });
  return {
    ok: r.status === 0,
    stdout: r.stdout ?? '',
    stderr: r.stderr ?? '',
  };
}

function runWranglerDelete(projectName: string): DeployResult {
  const secrets = loadSecrets();
  const token = secrets.cloudflare_api_token;
  const env = { ...process.env };
  if (token) env.CLOUDFLARE_API_TOKEN = token;
  const r = spawnSync(
    'npx',
    ['--yes', 'wrangler', 'pages', 'project', 'delete', projectName, '--yes'],
    { cwd: WORKSPACE, encoding: 'utf-8', env },
  );
  return {
    ok: r.status === 0,
    stdout: r.stdout ?? '',
    stderr: r.stderr ?? '',
  };
}

// ─────────  FORMATTERS  ─────────

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function fmtRelative(iso: string): string {
  try {
    const d = new Date(iso).getTime();
    if (!d) return '—';
    const diff = Date.now() - d;
    if (diff < 0) return '刚刚';
    const m = Math.floor(diff / 60_000);
    if (m < 1) return '刚刚';
    if (m < 60) return `${m} 分钟前`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} 小时前`;
    const day = Math.floor(h / 24);
    if (day < 30) return `${day} 天前`;
    const mon = Math.floor(day / 30);
    if (mon < 12) return `${mon} 个月前`;
    return `${Math.floor(mon / 12)} 年前`;
  } catch {
    return '—';
  }
}

function shortUrl(url: string): string {
  try {
    const u = new URL(url);
    const host = u.hostname;
    if (host.length <= 32) return host;
    return host.slice(0, 14) + '…' + host.slice(-14);
  } catch {
    return url;
  }
}

function qrSvg(url: string): string {
  const qr = new QRCode({
    content: url,
    padding: 1,
    width: 140,
    height: 140,
    color: '#221b15',
    background: '#fbf7ec',
    ecl: 'M',
    join: true,
  });
  return qr.svg();
}

// ─────────  ROW RENDERING  ─────────

function rowHtml(share: ShareRecord): string {
  const dn = share.display_name || loadVentureDisplayName(share.venture);
  const statusDotClass = share.status === 'active' ? 'dot dot--active' : 'dot dot--archived';
  const statusText = share.status === 'active' ? '活跃' : '已归档';
  const visBadge =
    share.status === 'archived'
      ? '<span class="vis vis--mute">—</span>'
      : share.visibility === 'public'
        ? '<span class="vis vis--public">公开</span>'
        : '<span class="vis vis--private">仅密码可见</span>';
  const visits =
    typeof share.visits === 'number' && share.visits > 0
      ? `<span class="row__visits">· ${share.visits} 次访问</span>`
      : '';
  const lastDeployed =
    share.status === 'archived'
      ? `已归档 · ${fmtRelative(share.last_redeployed || share.deployed_at)}`
      : `${fmtRelative(share.last_redeployed || share.deployed_at)}`;
  const urlDisplay = share.status === 'archived' ? '—' : shortUrl(share.url);
  const pwDisplay = share.status === 'archived' ? '—' : '●●●●●●';

  const actionsActive = `
    <button class="icon-btn" data-act="qr" title="显示二维码">▤</button>
    <button class="icon-btn" data-act="redeploy" title="重新部署">↻</button>
    <button class="icon-btn" data-act="rotate" title="更换密码">✎</button>
    <button class="icon-btn" data-act="visibility" title="${share.visibility === 'private' ? '切换为公开' : '切换为仅密码可见'}">⇅</button>
    <button class="icon-btn icon-btn--danger" data-act="delete" title="删除">✕</button>
  `;
  const actionsArchived = `
    <button class="icon-btn" data-act="restore" title="恢复（重新部署）">⇡</button>
  `;

  return `
<div class="row" data-venture="${esc(share.venture)}" data-status="${share.status}" data-url="${esc(share.url)}" data-visibility="${share.visibility}">
  <div class="row__main">
    <div class="cell cell--status">
      <span class="${statusDotClass}" title="${statusText}"></span>
    </div>
    <div class="cell cell--venture">
      <div class="venture-slug">${esc(share.venture)}</div>
      ${dn ? `<div class="venture-name">${esc(dn)}</div>` : ''}
    </div>
    <div class="cell cell--url">
      ${share.status === 'archived'
        ? `<span class="mute">—</span>`
        : `<button class="url-btn" data-act="copy-url" title="${esc(share.url)}（点击复制）">${esc(urlDisplay)}</button>`}
    </div>
    <div class="cell cell--pw">
      <code class="pw" data-pw-mask>${pwDisplay}</code>
      ${share.status === 'active' ? `<button class="icon-btn icon-btn--mini" data-act="reveal" title="显示密码">◉</button>` : ''}
    </div>
    <div class="cell cell--vis">${visBadge}</div>
    <div class="cell cell--time">
      <span>${esc(lastDeployed)}</span>${visits}
    </div>
    <div class="cell cell--actions">
      ${share.status === 'active' ? actionsActive : actionsArchived}
    </div>
  </div>
  <div class="row__detail" data-detail hidden></div>
  <div class="row__flash" data-flash hidden></div>
</div>`;
}

function renderPage(data: SharesFile): string {
  const all = data.shares;
  const active = all.filter((s) => s.status === 'active');
  const archived = all.filter((s) => s.status === 'archived');
  const lastSync = all.reduce<number>((acc, s) => {
    const t = new Date(s.last_redeployed || s.deployed_at).getTime();
    return Number.isNaN(t) ? acc : Math.max(acc, t);
  }, 0);
  const lastSyncStr = lastSync ? fmtRelative(new Date(lastSync).toISOString()) : '—';

  const rowsHtml = all.map(rowHtml).join('');

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Lumi Lab · 分享管理</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@300..700&family=JetBrains+Mono:wght@400..600&display=swap" rel="stylesheet">
<style>
:root {
  --color-bg:        oklch(97% 0.012 80);
  --color-bg-2:      oklch(95% 0.014 80);
  --color-surface:   oklch(99.5% 0.006 80);
  --color-ink:       oklch(18% 0.018 60);
  --color-ink-2:     oklch(35% 0.015 60);
  --color-mute:      oklch(58% 0.012 60);
  --color-hairline:  oklch(86% 0.012 60);
  --color-hairline-2: oklch(91% 0.012 60);
  --color-accent:    oklch(42% 0.16 28);
  --color-accent-2:  oklch(95% 0.04 28);
  --color-success:   oklch(45% 0.12 145);
  --color-warn:      oklch(58% 0.14 70);
  --color-error:     oklch(50% 0.18 28);
  --font-sans: "Geist", ui-sans-serif, system-ui, -apple-system, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, "SFMono-Regular", Menlo, monospace;
  --radius: 4px;
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
}
* { box-sizing: border-box; margin: 0; padding: 0; }
html { -webkit-text-size-adjust: 100%; }
body {
  font-family: var(--font-sans);
  background: var(--color-bg);
  color: var(--color-ink);
  min-height: 100dvh;
  line-height: 1.45;
  -webkit-font-smoothing: antialiased;
  font-feature-settings: "ss01", "cv11", "kern", "liga";
  font-size: 14px;
}
button { font-family: inherit; cursor: pointer; }
code { font-family: var(--font-mono); }

.shell {
  max-width: 1320px;
  margin: 0 auto;
  padding: 1.5rem 1.5rem 4rem;
}

/* ───── HEADER ───── */
.header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0.5rem 0 0.75rem;
  border-bottom: 1px solid var(--color-ink);
}
.header__left { display: flex; flex-direction: column; gap: 0.2rem; }
.header__title {
  display: inline-flex; align-items: center; gap: 0.6rem;
  font-size: 0.95rem; font-weight: 500; letter-spacing: -0.005em;
}
.header__title .glyph {
  color: var(--color-accent);
  font-family: var(--font-mono);
  font-size: 1rem;
}
.header__title .sep { color: var(--color-mute); font-weight: 400; }
.header__sub {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  letter-spacing: 0.04em;
  color: var(--color-mute);
}
.header__sub b { color: var(--color-ink-2); font-weight: 500; }
.header__right { display: flex; gap: 0.5rem; align-items: center; }
.btn {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  letter-spacing: 0.04em;
  background: var(--color-ink);
  color: var(--color-bg);
  border: 1px solid var(--color-ink);
  padding: 0.45rem 0.75rem;
  border-radius: var(--radius);
  cursor: pointer;
  transition: background 150ms var(--ease-out), color 150ms var(--ease-out);
  text-decoration: none;
  display: inline-flex; align-items: center; gap: 0.35rem;
}
.btn:hover { background: var(--color-accent); border-color: var(--color-accent); color: var(--color-bg); }
.btn--ghost {
  background: transparent;
  color: var(--color-ink-2);
  border-color: var(--color-hairline);
}
.btn--ghost:hover { background: var(--color-bg-2); color: var(--color-ink); border-color: var(--color-ink-2); }
.btn--accent {
  background: var(--color-accent);
  color: var(--color-bg);
  border-color: var(--color-accent);
}
.btn--accent:hover { background: var(--color-ink); border-color: var(--color-ink); }

/* ───── TOOLBAR ───── */
.toolbar {
  display: flex; align-items: center; gap: 0.5rem;
  padding: 0.85rem 0;
  border-bottom: 1px solid var(--color-hairline);
  flex-wrap: wrap;
}
.tab {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  letter-spacing: 0.04em;
  padding: 0.35rem 0.65rem;
  border-radius: var(--radius);
  border: 1px solid transparent;
  background: transparent;
  color: var(--color-ink-2);
  cursor: pointer;
  transition: all 150ms var(--ease-out);
  display: inline-flex; align-items: center; gap: 0.4rem;
}
.tab:hover { background: var(--color-bg-2); color: var(--color-ink); }
.tab.is-active {
  background: var(--color-ink);
  color: var(--color-bg);
}
.tab .count {
  font-size: 0.66rem;
  opacity: 0.7;
}
.toolbar__spacer { flex: 1; }
.search {
  font-family: var(--font-mono);
  font-size: 0.78rem;
  background: var(--color-surface);
  border: 1px solid var(--color-hairline);
  padding: 0.4rem 0.65rem;
  border-radius: var(--radius);
  color: var(--color-ink);
  width: 200px;
  outline: none;
  transition: border 150ms;
}
.search:focus { border-color: var(--color-ink-2); }
.search::placeholder { color: var(--color-mute); }
.sort {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  letter-spacing: 0.04em;
  color: var(--color-ink-2);
  background: var(--color-surface);
  border: 1px solid var(--color-hairline);
  padding: 0.4rem 0.65rem;
  border-radius: var(--radius);
  cursor: pointer;
  outline: none;
}

/* ───── TABLE ───── */
.table { display: block; }
.table__head, .row__main {
  display: grid;
  grid-template-columns: 1.25rem minmax(0, 1.5fr) minmax(0, 2fr) minmax(0, 1fr) 0.6fr 1fr minmax(0, 1.6fr);
  gap: 1rem;
  align-items: center;
  padding: 0.65rem 0.85rem;
}
.table__head {
  font-family: var(--font-mono);
  font-size: 0.66rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-mute);
  border-bottom: 1px solid var(--color-ink);
  padding-top: 0.85rem;
}
.row { border-bottom: 1px solid var(--color-hairline); position: relative; }
.row:last-child { border-bottom: 1px solid var(--color-ink); }
.row__main {
  transition: background 150ms var(--ease-out);
  cursor: default;
  min-height: 52px;
}
.row:hover .row__main { background: var(--color-bg-2); }
.row[data-status="archived"] .row__main { opacity: 0.6; }
.row.is-expanded .row__main { background: var(--color-bg-2); }

.cell { font-size: 0.83rem; min-width: 0; }
.cell--status { display: flex; justify-content: center; }
.dot {
  display: inline-block;
  width: 8px; height: 8px; border-radius: 50%;
  background: var(--color-mute);
}
.dot--active { background: var(--color-success); box-shadow: 0 0 0 2px color-mix(in oklch, var(--color-success) 22%, transparent); }
.dot--archived { background: transparent; border: 1px solid var(--color-mute); box-shadow: none; }

.venture-slug {
  font-family: var(--font-mono);
  font-size: 0.82rem;
  font-weight: 500;
  color: var(--color-ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.venture-name {
  font-size: 0.74rem;
  color: var(--color-mute);
  margin-top: 0.1rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.url-btn {
  font-family: var(--font-mono);
  font-size: 0.78rem;
  background: transparent;
  border: 0;
  padding: 0;
  color: var(--color-ink-2);
  cursor: pointer;
  text-align: left;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color 150ms;
}
.url-btn:hover { color: var(--color-accent); text-decoration: underline; text-underline-offset: 3px; }
.url-btn.is-copied { color: var(--color-success); }
.url-btn.is-copied::after { content: ' · 已复制'; font-size: 0.7rem; }

.pw {
  font-family: var(--font-mono);
  font-size: 0.78rem;
  color: var(--color-ink);
  letter-spacing: 0.02em;
}
.cell--pw { display: flex; align-items: center; gap: 0.4rem; }

.vis {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  letter-spacing: 0.04em;
  padding: 0.15rem 0.45rem;
  border-radius: 2px;
  border: 1px solid var(--color-hairline);
  color: var(--color-ink-2);
  background: var(--color-surface);
  display: inline-block;
}
.vis--public { color: var(--color-success); border-color: color-mix(in oklch, var(--color-success) 40%, var(--color-hairline)); }
.vis--private { color: var(--color-ink-2); }
.vis--mute { color: var(--color-mute); border-style: dashed; }

.cell--time {
  font-family: var(--font-mono);
  font-size: 0.74rem;
  color: var(--color-ink-2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.row__visits { color: var(--color-mute); margin-left: 0.25rem; }

.cell--actions { display: flex; gap: 0.15rem; justify-content: flex-end; }

.icon-btn {
  background: transparent;
  border: 1px solid transparent;
  width: 28px; height: 28px;
  padding: 0;
  font-family: var(--font-mono);
  font-size: 0.9rem;
  color: var(--color-ink-2);
  border-radius: var(--radius);
  cursor: pointer;
  transition: all 150ms var(--ease-out);
  display: inline-flex; align-items: center; justify-content: center;
  line-height: 1;
}
.icon-btn:hover {
  background: var(--color-surface);
  border-color: var(--color-hairline);
  color: var(--color-accent);
}
.icon-btn--danger:hover { color: var(--color-error); border-color: color-mix(in oklch, var(--color-error) 35%, var(--color-hairline)); }
.icon-btn--mini { width: 22px; height: 22px; font-size: 0.75rem; }
.icon-btn[disabled] { opacity: 0.5; cursor: wait; }
.icon-btn.is-active { background: var(--color-ink); color: var(--color-bg); border-color: var(--color-ink); }

/* ───── DETAIL EXPANSION ───── */
.row__detail {
  padding: 1rem 1rem 1.25rem 2.4rem;
  border-top: 1px solid var(--color-hairline);
  border-left: 3px solid var(--color-accent);
  background: var(--color-bg-2);
  animation: slide-down 200ms var(--ease-out);
  overflow: hidden;
}
.row__detail[hidden] { display: none; }
@keyframes slide-down {
  from { opacity: 0; max-height: 0; padding-top: 0; padding-bottom: 0; }
  to   { opacity: 1; max-height: 500px; }
}
.detail-title {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-mute);
  margin-bottom: 0.85rem;
}
.detail-title b { color: var(--color-ink); font-weight: 500; }
.detail-row { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.65rem; font-size: 0.82rem; }
.detail-row label {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--color-mute);
  letter-spacing: 0.05em;
  width: 80px;
}
.detail-row code, .detail-row input {
  font-family: var(--font-mono);
  font-size: 0.82rem;
}
.detail-input {
  background: var(--color-surface);
  border: 1px solid var(--color-hairline);
  padding: 0.4rem 0.6rem;
  border-radius: var(--radius);
  color: var(--color-ink);
  width: 160px;
  outline: none;
  letter-spacing: 0.04em;
}
.detail-input:focus { border-color: var(--color-ink-2); }
.detail-callout {
  font-family: var(--font-mono);
  font-size: 0.74rem;
  color: var(--color-ink-2);
  border-left: 2px solid var(--color-warn);
  padding: 0.35rem 0.65rem;
  margin: 0.5rem 0 0.85rem;
  background: color-mix(in oklch, var(--color-warn) 8%, transparent);
}
.detail-callout--danger {
  border-left-color: var(--color-error);
  background: color-mix(in oklch, var(--color-error) 8%, transparent);
}
.detail-actions { display: flex; gap: 0.5rem; margin-top: 0.5rem; }

.qr-frame {
  display: flex; align-items: flex-start; gap: 1.25rem;
}
.qr-frame svg {
  width: 140px; height: 140px;
  border: 1px solid var(--color-hairline);
  border-radius: var(--radius);
  background: var(--color-surface);
}
.qr-meta { font-family: var(--font-mono); font-size: 0.76rem; color: var(--color-ink-2); display: flex; flex-direction: column; gap: 0.4rem; }
.qr-meta .qr-url { color: var(--color-ink); word-break: break-all; max-width: 320px; }
.qr-meta .qr-mute { color: var(--color-mute); font-size: 0.7rem; }

/* ───── FLASH ───── */
.row__flash {
  padding: 0.55rem 1rem 0.55rem 2.4rem;
  border-top: 1px solid var(--color-hairline);
  border-left: 3px solid var(--color-success);
  background: color-mix(in oklch, var(--color-success) 8%, var(--color-bg-2));
  font-family: var(--font-mono);
  font-size: 0.76rem;
  color: var(--color-ink);
  animation: flash-in 180ms var(--ease-out);
}
.row__flash[hidden] { display: none; }
.row__flash--error {
  border-left-color: var(--color-error);
  background: color-mix(in oklch, var(--color-error) 8%, var(--color-bg-2));
}
@keyframes flash-in {
  from { opacity: 0; transform: translateY(-2px); }
  to   { opacity: 1; transform: none; }
}

/* ───── EMPTY ───── */
.empty {
  padding: 3rem 1rem;
  text-align: center;
  color: var(--color-ink-2);
  font-size: 0.9rem;
}
.empty__title { font-size: 1rem; color: var(--color-ink); margin-bottom: 0.85rem; }
.empty pre {
  font-family: var(--font-mono);
  font-size: 0.8rem;
  background: var(--color-surface);
  border: 1px solid var(--color-hairline);
  border-radius: var(--radius);
  display: inline-block;
  padding: 0.75rem 1.25rem;
  color: var(--color-accent);
  margin-top: 0.5rem;
}

/* ───── LOADING SPINNER FOR ROW ───── */
.row.is-busy::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: repeating-linear-gradient(
    90deg,
    transparent 0,
    transparent 8px,
    color-mix(in oklch, var(--color-accent) 14%, transparent) 8px,
    color-mix(in oklch, var(--color-accent) 14%, transparent) 16px
  );
  opacity: 0.5;
  animation: stripe-shift 800ms linear infinite;
}
@keyframes stripe-shift {
  from { background-position: 0 0; }
  to   { background-position: 16px 0; }
}

/* ───── RESPONSIVE ───── */
@media (max-width: 900px) {
  .table__head { display: none; }
  .row__main {
    grid-template-columns: 1rem 1fr auto;
    grid-template-areas:
      "status venture actions"
      ".      url     url"
      ".      pw      pw"
      ".      meta    meta";
    gap: 0.5rem;
    padding: 0.85rem;
  }
  .cell--status { grid-area: status; align-self: start; padding-top: 0.4rem; }
  .cell--venture { grid-area: venture; }
  .cell--url { grid-area: url; }
  .cell--pw { grid-area: pw; }
  .cell--vis, .cell--time { grid-area: meta; display: inline-flex; gap: 0.5rem; }
  .cell--actions { grid-area: actions; }
}
</style>
</head>
<body>
<main class="shell">

  <header class="header">
    <div class="header__left">
      <div class="header__title">
        <span class="glyph">◆</span>
        <span>Lumi Lab</span>
        <span class="sep">·</span>
        <span>分享管理</span>
      </div>
      <div class="header__sub">
        <b>${active.length}</b> 个活跃 · <b>${archived.length}</b> 个已归档 · 最近同步 <b>${esc(lastSyncStr)}</b>
      </div>
    </div>
    <div class="header__right">
      <a class="btn btn--ghost" href="https://github.com/" target="_blank" rel="noreferrer" data-act="docs">文档</a>
      <button class="btn" data-act="deploy-help">+ 新部署</button>
    </div>
  </header>

  <div class="toolbar">
    <button class="tab is-active" data-filter="active">活跃 <span class="count">${active.length}</span></button>
    <button class="tab" data-filter="archived">已归档 <span class="count">${archived.length}</span></button>
    <button class="tab" data-filter="all">全部 <span class="count">${all.length}</span></button>
    <div class="toolbar__spacer"></div>
    <input class="search" type="text" placeholder="搜索 venture…" data-search>
    <select class="sort" data-sort>
      <option value="recent">排序：最近</option>
      <option value="name">排序：名称</option>
      <option value="status">排序：状态</option>
    </select>
  </div>

  ${all.length === 0
    ? `<div class="empty">
        <div class="empty__title">还没有部署任何 venture</div>
        <div>先部署一个 venture：</div>
        <pre>lumilab deploy &lt;venture-name&gt;</pre>
       </div>`
    : `<div class="table">
        <div class="table__head">
          <div></div>
          <div>项目</div>
          <div>链接</div>
          <div>密码</div>
          <div>可见性</div>
          <div>部署时间</div>
          <div style="text-align:right">操作</div>
        </div>
        <div class="table__body" data-rows>
          ${rowsHtml}
        </div>
       </div>`}

</main>

<script>
const API = {
  showPw: (venture) => fetch('/api/show-password', { method: 'POST', body: JSON.stringify({ venture }) }).then(r => r.json()),
  rotate: (venture, new_password) => fetch('/api/rotate', { method: 'POST', body: JSON.stringify({ venture, new_password }) }).then(r => r.json()),
  visibility: (venture, isPublic) => fetch('/api/visibility', { method: 'POST', body: JSON.stringify({ venture, public: isPublic }) }).then(r => r.json()),
  redeploy: (venture) => fetch('/api/redeploy', { method: 'POST', body: JSON.stringify({ venture }) }).then(r => r.json()),
  del: (venture) => fetch('/api/delete', { method: 'POST', body: JSON.stringify({ venture }) }).then(r => r.json()),
  qr: (venture) => fetch('/api/qr?venture=' + encodeURIComponent(venture)).then(r => r.json()),
};

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function getRow(venture) {
  return document.querySelector('.row[data-venture="' + CSS.escape(venture) + '"]');
}
function getDetail(row) { return row.querySelector('[data-detail]'); }
function getFlash(row)  { return row.querySelector('[data-flash]'); }

function closeDetail(row) {
  const d = getDetail(row);
  d.hidden = true;
  d.innerHTML = '';
  row.classList.remove('is-expanded');
  row.querySelectorAll('.icon-btn.is-active').forEach(b => b.classList.remove('is-active'));
}

function openDetail(row, html, srcBtn) {
  // close any other open detail
  document.querySelectorAll('.row.is-expanded').forEach(r => { if (r !== row) closeDetail(r); });
  const d = getDetail(row);
  // toggle if same source
  if (row.classList.contains('is-expanded') && srcBtn && srcBtn.classList.contains('is-active')) {
    closeDetail(row);
    return;
  }
  d.innerHTML = html;
  d.hidden = false;
  row.classList.add('is-expanded');
  row.querySelectorAll('.icon-btn.is-active').forEach(b => b.classList.remove('is-active'));
  if (srcBtn) srcBtn.classList.add('is-active');
}

function flash(row, msg, isError) {
  const f = getFlash(row);
  f.textContent = '▍ ' + (isError ? '✕ ' : '✓ ') + msg;
  f.classList.toggle('row__flash--error', !!isError);
  f.hidden = false;
  clearTimeout(f._t);
  f._t = setTimeout(() => { f.hidden = true; }, 3500);
}

function setBusy(row, busy) {
  row.classList.toggle('is-busy', busy);
  row.querySelectorAll('.icon-btn').forEach(b => b.disabled = busy);
}

function genPassword(len) {
  const digits = '0123456789';
  let out = '';
  const arr = new Uint32Array(len);
  crypto.getRandomValues(arr);
  for (let i = 0; i < len; i++) out += digits[arr[i] % digits.length];
  return out;
}

async function copyText(t, btn) {
  try {
    await navigator.clipboard.writeText(t);
    if (btn) {
      btn.classList.add('is-copied');
      setTimeout(() => btn.classList.remove('is-copied'), 1400);
    }
  } catch (e) {
    console.error('clipboard failed', e);
  }
}

// ───── ACTIONS ─────

async function actReveal(row, btn) {
  const v = row.dataset.venture;
  const pwEl = row.querySelector('[data-pw-mask]');
  if (pwEl.dataset.revealed === '1') {
    pwEl.textContent = '●●●●●●';
    pwEl.dataset.revealed = '';
    btn.classList.remove('is-active');
    return;
  }
  btn.disabled = true;
  const r = await API.showPw(v);
  btn.disabled = false;
  if (r.error) { flash(row, r.error, true); return; }
  pwEl.textContent = r.password;
  pwEl.dataset.revealed = '1';
  btn.classList.add('is-active');
  await copyText(r.password);
  flash(row, '密码已复制');
}

async function actCopyUrl(row, btn) {
  const url = row.dataset.url;
  await copyText(url, btn);
}

async function actQr(row, btn) {
  const v = row.dataset.venture;
  const r = await API.qr(v);
  if (r.error) { flash(row, r.error, true); return; }
  const html =
    '<div class="detail-title">二维码 · <b>' + esc(v) + '</b></div>' +
    '<div class="qr-frame">' +
      r.svg +
      '<div class="qr-meta">' +
        '<div class="qr-url">' + esc(r.url) + '</div>' +
        '<div class="qr-mute">扫码打开 venture studio</div>' +
        '<div class="detail-actions">' +
          '<button class="btn btn--ghost" data-detail-act="copy-url">复制链接</button>' +
          '<button class="btn btn--ghost" data-detail-act="download-svg">下载 SVG</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  openDetail(row, html, btn);
  const detail = getDetail(row);
  detail.querySelector('[data-detail-act="copy-url"]').addEventListener('click', (e) => copyText(r.url, e.currentTarget));
  detail.querySelector('[data-detail-act="download-svg"]').addEventListener('click', () => {
    const blob = new Blob([r.svg], { type: 'image/svg+xml' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = v + '-qr.svg';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
}

async function actRotate(row, btn) {
  const v = row.dataset.venture;
  const pwEl = row.querySelector('[data-pw-mask]');
  const current = pwEl.dataset.revealed === '1' ? pwEl.textContent : '●●●●●●';
  const newPw = genPassword(6);
  const html =
    '<div class="detail-title">更换 <b>' + esc(v) + '</b> 的密码</div>' +
    '<div class="detail-row"><label>当前密码</label><code>' + esc(current) + '</code></div>' +
    '<div class="detail-row"><label>新密码</label>' +
      '<input class="detail-input" data-new-pw value="' + esc(newPw) + '" maxlength="32">' +
      '<button class="btn btn--ghost" data-detail-act="regen">随机生成</button>' +
    '</div>' +
    '<div class="detail-callout">▍ 更换后旧密码立刻失效，会重新加密并重新部署。</div>' +
    '<div class="detail-actions">' +
      '<button class="btn btn--ghost" data-detail-act="cancel">取消</button>' +
      '<button class="btn btn--accent" data-detail-act="confirm">确认更换</button>' +
    '</div>';
  openDetail(row, html, btn);
  const detail = getDetail(row);
  const input = detail.querySelector('[data-new-pw]');
  detail.querySelector('[data-detail-act="regen"]').addEventListener('click', () => { input.value = genPassword(6); input.focus(); });
  detail.querySelector('[data-detail-act="cancel"]').addEventListener('click', () => closeDetail(row));
  detail.querySelector('[data-detail-act="confirm"]').addEventListener('click', async () => {
    const np = input.value.trim();
    if (np.length < 4) { flash(row, '密码至少 4 个字符', true); return; }
    closeDetail(row);
    setBusy(row, true);
    const r = await API.rotate(v, np);
    setBusy(row, false);
    if (r.error) { flash(row, r.error + (r.detail ? ' — ' + r.detail.slice(0, 200) : ''), true); return; }
    flash(row, '已更换 · 旧密码失效 · 已重新部署');
    setTimeout(() => location.reload(), 1200);
  });
}

async function actVisibility(row, btn) {
  const v = row.dataset.venture;
  const wantPublic = row.dataset.visibility === 'private';
  setBusy(row, true);
  const r = await API.visibility(v, wantPublic);
  setBusy(row, false);
  if (r.error) { flash(row, r.error, true); return; }
  flash(row, wantPublic ? '已切换为公开' : '已切换为仅密码可见');
  setTimeout(() => location.reload(), 1000);
}

async function actRedeploy(row, btn) {
  const v = row.dataset.venture;
  setBusy(row, true);
  const r = await API.redeploy(v);
  setBusy(row, false);
  if (r.error) { flash(row, r.error, true); return; }
  flash(row, '已重新部署');
  setTimeout(() => location.reload(), 1000);
}

async function actRestore(row, btn) {
  // restore = redeploy (which marks status active)
  actRedeploy(row, btn);
}

async function actDelete(row, btn) {
  const v = row.dataset.venture;
  const html =
    '<div class="detail-title">删除 <b>' + esc(v) + '</b>？</div>' +
    '<div class="detail-callout detail-callout--danger">▍ 这会：<br>' +
      '&nbsp;&nbsp;· 删除 Cloudflare Pages 项目<br>' +
      '&nbsp;&nbsp;· 把此项目在 shares.json 中标记为已归档<br>' +
      '&nbsp;&nbsp;· 本地 studio HTML 不会被删（~/.lumilab/ventures/...）' +
    '</div>' +
    '<div class="detail-actions">' +
      '<button class="btn btn--ghost" data-detail-act="cancel">取消</button>' +
      '<button class="btn btn--accent" data-detail-act="confirm">确认删除</button>' +
    '</div>';
  openDetail(row, html, btn);
  const detail = getDetail(row);
  detail.querySelector('[data-detail-act="cancel"]').addEventListener('click', () => closeDetail(row));
  detail.querySelector('[data-detail-act="confirm"]').addEventListener('click', async () => {
    closeDetail(row);
    setBusy(row, true);
    const r = await API.del(v);
    setBusy(row, false);
    if (r.error) { flash(row, r.error, true); return; }
    flash(row, r.warning || '已归档');
    setTimeout(() => location.reload(), 1100);
  });
}

// ───── DELEGATION ─────

document.addEventListener('click', (e) => {
  const t = e.target;
  if (!(t instanceof HTMLElement)) return;
  const btn = t.closest('[data-act]');
  if (!btn) return;
  const row = btn.closest('.row');
  const act = btn.getAttribute('data-act');
  if (act === 'deploy-help') {
    alert('要部署一个新的 venture，请在终端运行：\\n\\n  lumilab deploy <venture-name>\\n\\n部署完成后刷新此页面。');
    return;
  }
  if (!row) return;
  switch (act) {
    case 'reveal':     return actReveal(row, btn);
    case 'copy-url':   return actCopyUrl(row, btn);
    case 'qr':         return actQr(row, btn);
    case 'rotate':     return actRotate(row, btn);
    case 'visibility': return actVisibility(row, btn);
    case 'redeploy':   return actRedeploy(row, btn);
    case 'restore':    return actRestore(row, btn);
    case 'delete':     return actDelete(row, btn);
  }
});

// ───── FILTER / SEARCH / SORT ─────

let currentFilter = 'active';

function applyView() {
  const search = (document.querySelector('[data-search]')?.value || '').toLowerCase().trim();
  const rows = Array.from(document.querySelectorAll('.row'));
  for (const r of rows) {
    const status = r.dataset.status;
    const venture = (r.dataset.venture || '').toLowerCase();
    const matchesFilter = currentFilter === 'all' || status === currentFilter;
    const matchesSearch = !search || venture.includes(search);
    r.style.display = (matchesFilter && matchesSearch) ? '' : 'none';
  }
}

document.querySelectorAll('.tab[data-filter]').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('is-active'));
    tab.classList.add('is-active');
    currentFilter = tab.dataset.filter;
    applyView();
  });
});

const searchEl = document.querySelector('[data-search]');
if (searchEl) searchEl.addEventListener('input', applyView);

const sortEl = document.querySelector('[data-sort]');
if (sortEl) sortEl.addEventListener('change', () => {
  const mode = sortEl.value;
  const body = document.querySelector('[data-rows]');
  if (!body) return;
  const rows = Array.from(body.querySelectorAll('.row'));
  rows.sort((a, b) => {
    if (mode === 'name') return a.dataset.venture.localeCompare(b.dataset.venture);
    if (mode === 'status') return a.dataset.status.localeCompare(b.dataset.status);
    // recent: leave server order (which is shares.json order); fallback to data attr if present
    return 0;
  });
  rows.forEach(r => body.appendChild(r));
});

// initial filter to active
applyView();
</script>
</body>
</html>`;
}

// ─────────  API HANDLERS  ─────────

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}

async function handleShowPassword(req: Request): Promise<Response> {
  const body = (await req.json().catch(() => ({}))) as { venture?: string };
  if (!body.venture) return json(400, { error: '缺少 venture 参数' });
  const pw = getVenturePassword(body.venture);
  if (!pw) return json(404, { error: '未找到 ' + body.venture + ' 的密码' });
  return json(200, { password: pw });
}

async function handleRotate(req: Request): Promise<Response> {
  const body = (await req.json().catch(() => ({}))) as {
    venture?: string;
    new_password?: string;
  };
  if (!body.venture || !body.new_password) {
    return json(400, { error: '需要 venture 和 new_password 参数' });
  }
  setVenturePassword(body.venture, body.new_password);
  const r = runDeploy(body.venture, { public: false });
  if (!r.ok) {
    return json(500, {
      error: '部署失败',
      detail: (r.stderr || r.stdout).slice(-600),
    });
  }
  const data = loadShares();
  const idx = data.shares.findIndex((s) => s.venture === body.venture);
  if (idx >= 0) {
    data.shares[idx] = {
      ...data.shares[idx],
      visibility: 'private',
      last_redeployed: new Date().toISOString(),
      status: 'active',
    };
    saveShares(data);
  }
  return json(200, { ok: true });
}

async function handleVisibility(req: Request): Promise<Response> {
  const body = (await req.json().catch(() => ({}))) as {
    venture?: string;
    public?: boolean;
  };
  if (!body.venture) return json(400, { error: '缺少 venture 参数' });
  const r = runDeploy(body.venture, { public: body.public });
  if (!r.ok) {
    return json(500, {
      error: '部署失败',
      detail: (r.stderr || r.stdout).slice(-600),
    });
  }
  const data = loadShares();
  const idx = data.shares.findIndex((s) => s.venture === body.venture);
  if (idx >= 0) {
    data.shares[idx] = {
      ...data.shares[idx],
      visibility: body.public ? 'public' : 'private',
      last_redeployed: new Date().toISOString(),
      status: 'active',
    };
    saveShares(data);
  }
  return json(200, { ok: true });
}

async function handleRedeploy(req: Request): Promise<Response> {
  const body = (await req.json().catch(() => ({}))) as { venture?: string };
  if (!body.venture) return json(400, { error: '缺少 venture 参数' });
  const data = loadShares();
  const existing = data.shares.find((s) => s.venture === body.venture);
  const r = runDeploy(body.venture, { public: existing?.visibility === 'public' });
  if (!r.ok) {
    return json(500, {
      error: '部署失败',
      detail: (r.stderr || r.stdout).slice(-600),
    });
  }
  const idx = data.shares.findIndex((s) => s.venture === body.venture);
  if (idx >= 0) {
    data.shares[idx] = {
      ...data.shares[idx],
      last_redeployed: new Date().toISOString(),
      status: 'active',
    };
    saveShares(data);
  }
  return json(200, { ok: true });
}

async function handleDelete(req: Request): Promise<Response> {
  const body = (await req.json().catch(() => ({}))) as { venture?: string };
  if (!body.venture) return json(400, { error: '缺少 venture 参数' });
  const data = loadShares();
  const idx = data.shares.findIndex((s) => s.venture === body.venture);
  if (idx < 0) return json(404, { error: '未找到该 venture' });
  const share = data.shares[idx];
  const r = runWranglerDelete(share.cloudflare_project_name);
  data.shares[idx] = { ...share, status: 'archived' };
  saveShares(data);
  if (!r.ok) {
    return json(200, {
      ok: true,
      warning: 'Cloudflare 删除返回非零状态，但已在本地归档',
      detail: (r.stderr || r.stdout).slice(-400),
    });
  }
  return json(200, { ok: true });
}

function handleQr(url: URL): Response {
  const venture = url.searchParams.get('venture');
  if (!venture) return json(400, { error: '缺少 venture 参数' });
  const data = loadShares();
  const share = data.shares.find((s) => s.venture === venture);
  if (!share) return json(404, { error: '未找到该 venture' });
  return json(200, { svg: qrSvg(share.url), url: share.url });
}

// ─────────  SERVER  ─────────

async function findFreePort(start: number, max: number): Promise<number> {
  for (let p = start; p < start + max; p++) {
    try {
      const s = Bun.serve({ port: p, hostname: '127.0.0.1', fetch: () => new Response('') });
      s.stop();
      return p;
    } catch {
      continue;
    }
  }
  throw new Error('no free port found near ' + start);
}

function openBrowser(url: string): void {
  const platform = process.platform;
  const cmd = platform === 'darwin' ? 'open' : platform === 'win32' ? 'start' : 'xdg-open';
  try {
    spawnSync(cmd, [url], { stdio: 'ignore', detached: true });
  } catch {
    // silent
  }
}

async function main(): Promise<void> {
  const port = await findFreePort(7777, 20);

  const server = Bun.serve({
    port,
    hostname: '127.0.0.1',
    async fetch(req: Request): Promise<Response> {
      const url = new URL(req.url);

      if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html')) {
        const data = loadShares();
        return new Response(renderPage(data), {
          headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
        });
      }

      if (req.method === 'GET' && url.pathname === '/api/shares') {
        return json(200, loadShares());
      }

      if (req.method === 'GET' && url.pathname === '/api/qr') {
        return handleQr(url);
      }

      if (req.method === 'POST') {
        try {
          switch (url.pathname) {
            case '/api/show-password': return await handleShowPassword(req);
            case '/api/rotate':        return await handleRotate(req);
            case '/api/visibility':    return await handleVisibility(req);
            case '/api/redeploy':      return await handleRedeploy(req);
            case '/api/delete':        return await handleDelete(req);
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          return json(500, { error: '服务器错误', detail: msg });
        }
      }

      return new Response('not found', { status: 404 });
    },
  });

  const localUrl = `http://127.0.0.1:${port}/`;
  process.stdout.write(`\n  lumi lab · share manager\n`);
  process.stdout.write(`  ────────────────────────\n`);
  process.stdout.write(`  open:   ${localUrl}\n`);
  process.stdout.write(`  shares: ${SHARES_PATH}\n`);
  process.stdout.write(`  ctrl-c to stop\n\n`);
  openBrowser(localUrl);

  process.on('SIGINT', () => {
    server.stop();
    process.exit(0);
  });
}

main().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  process.stderr.write(`manage.ts fatal: ${msg}\n`);
  process.exit(1);
});
