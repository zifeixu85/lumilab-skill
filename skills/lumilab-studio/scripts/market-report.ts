/**
 * market-report.ts — Lumi Lab 市场分析报告渲染器
 *
 * 自主分析阶段产出的「用户可见」工件。图文并茂的单文件 HTML 报告，
 * 与 lumilab-studio 同一产品家族的编辑式 OKLCH-on-warm-paper 美学。
 *
 * 输入 schema —— <venture-dir>/market_analysis.json
 * ────────────────────────────────────────────────
 * {
 *   "idea": string,                    // 用户的一句话 idea
 *   "generated_at": string,            // ISO 时间戳
 *   "source": "host-llm-knowledge" | "real-api",
 *   "market": {
 *     "summary": string,               // 2-3 句市场概况
 *     "size_signal": string,           // 市场规模/增长信号（定性也行）
 *     "trends": string[]               // 趋势列表
 *   },
 *   "competitors": [
 *     { "name": string, "what_they_do": string, "gap": string,
 *       "type": "direct" | "alternative" | "status-quo" }
 *   ],
 *   "audience": [
 *     { "segment": string, "jtbd": string, "where_they_are": string,
 *       "willingness": string }
 *   ],
 *   "directions": [
 *     { "id": string, "title": string, "angle": string, "segment": string,
 *       "why_it_works": string, "risk": string, "recommended"?: boolean }
 *   ]
 * }
 *
 * 输出: <venture-dir>/reports/market-report.html
 *
 * 用法:
 *   bun run scripts/market-report.ts <venture-dir>
 *   # LUMILAB_CHANNEL=local（或未设置）时在浏览器打开
 *   # 否则仅打印路径（飞书场景：作为文件附件发送）
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, resolve } from 'path';
import { spawn } from 'child_process';

// ── Types ──
type CompetitorType = 'direct' | 'alternative' | 'status-quo';
type Source = 'host-llm-knowledge' | 'real-api';

interface MarketBlock {
  summary: string;
  size_signal: string;
  trends: string[];
}
interface Competitor {
  name: string;
  what_they_do: string;
  gap: string;
  type: CompetitorType;
}
interface AudienceSegment {
  segment: string;
  jtbd: string;
  where_they_are: string;
  willingness: string;
}
interface Direction {
  id: string;
  title: string;
  angle: string;
  segment: string;
  why_it_works: string;
  risk: string;
  recommended?: boolean;
}
interface MarketAnalysis {
  idea: string;
  generated_at: string;
  source: Source;
  market: MarketBlock;
  competitors: Competitor[];
  audience: AudienceSegment[];
  directions: Direction[];
}

// ── Helpers ──
function esc(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fail(msg: string): never {
  console.error(`\x1b[31m[market-report] ${msg}\x1b[0m`);
  process.exit(1);
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return esc(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const SOURCE_LABEL: Record<Source, string> = {
  'host-llm-knowledge': '宿主模型知识',
  'real-api': '实时数据 API',
};

const COMP_TYPE: Record<CompetitorType, { label: string; cls: string }> = {
  direct: { label: '直接竞品', cls: 'is-direct' },
  alternative: { label: '替代品', cls: 'is-alt' },
  'status-quo': { label: '现状方案', cls: 'is-status' },
};

// ── Validation ──
function validate(data: unknown): MarketAnalysis {
  if (!data || typeof data !== 'object') fail('market_analysis.json 不是合法的 JSON 对象');
  const d = data as Record<string, unknown>;
  const need = (k: string) => {
    if (!(k in d)) fail(`market_analysis.json 缺少字段: ${k}`);
  };
  ['idea', 'generated_at', 'source', 'market', 'competitors', 'audience', 'directions'].forEach(need);
  const m = d.market as Record<string, unknown>;
  if (!m || typeof m !== 'object') fail('market 字段格式错误');
  if (!Array.isArray(d.competitors)) fail('competitors 必须是数组');
  if (!Array.isArray(d.audience)) fail('audience 必须是数组');
  if (!Array.isArray(d.directions)) fail('directions 必须是数组');
  if ((d.directions as unknown[]).length === 0) fail('directions 至少需要一个方向');
  return data as MarketAnalysis;
}

// ── Section renderers ──
function renderMarket(market: MarketBlock): string {
  const trends = (market.trends ?? [])
    .map(
      (t, i) => `
      <li class="trend" style="--i:${i}">
        <span class="trend__mark">◆</span>
        <span class="trend__text">${esc(t)}</span>
      </li>`,
    )
    .join('');

  return `
  <section class="section" style="--s:1">
    <div class="section__head">
      <span class="section__no">Nº 01</span>
      <h2 class="section__title">市场快照</h2>
    </div>
    <div class="market-grid">
      <p class="market-summary">${esc(market.summary)}</p>
      <aside class="callout">
        <span class="callout__label">规模信号</span>
        <p class="callout__body">${esc(market.size_signal)}</p>
      </aside>
    </div>
    <div class="trends">
      <span class="trends__label">关键趋势</span>
      <ul class="trends__list">${trends}</ul>
    </div>
  </section>`;
}

function renderCompetitors(competitors: Competitor[]): string {
  const rows = competitors
    .map((c, i) => {
      const t = COMP_TYPE[c.type] ?? { label: esc(c.type), cls: 'is-status' };
      return `
      <tr class="comp-row" style="--i:${i}">
        <td class="comp-name">
          <span class="comp-name__text">${esc(c.name)}</span>
          <span class="comp-badge ${t.cls}">${esc(t.label)}</span>
        </td>
        <td class="comp-do">${esc(c.what_they_do)}</td>
        <td class="comp-gap"><span class="gap-mark">◇</span> ${esc(c.gap)}</td>
      </tr>`;
    })
    .join('');

  const cards = competitors
    .map((c, i) => {
      const t = COMP_TYPE[c.type] ?? { label: esc(c.type), cls: 'is-status' };
      return `
      <article class="comp-card ${t.cls}" style="--i:${i}">
        <header class="comp-card__head">
          <h3 class="comp-card__name">${esc(c.name)}</h3>
          <span class="comp-badge ${t.cls}">${esc(t.label)}</span>
        </header>
        <p class="comp-card__do">${esc(c.what_they_do)}</p>
        <p class="comp-card__gap"><span class="gap-mark">◇</span> ${esc(c.gap)}</p>
      </article>`;
    })
    .join('');

  return `
  <section class="section" style="--s:2">
    <div class="section__head">
      <span class="section__no">Nº 02</span>
      <h2 class="section__title">竞争格局</h2>
    </div>
    <table class="comp-table">
      <thead>
        <tr>
          <th>玩家</th>
          <th>在做什么</th>
          <th>没做好的</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="comp-cards">${cards}</div>
  </section>`;
}

function renderAudience(audience: AudienceSegment[]): string {
  const cards = audience
    .map(
      (a, i) => `
      <article class="aud-card" style="--i:${i}">
        <h3 class="aud-card__seg">${esc(a.segment)}</h3>
        <dl class="aud-card__list">
          <div class="aud-row">
            <dt>挣扎场景</dt>
            <dd>${esc(a.jtbd)}</dd>
          </div>
          <div class="aud-row">
            <dt>在哪找到</dt>
            <dd>${esc(a.where_they_are)}</dd>
          </div>
          <div class="aud-row">
            <dt>付费意愿</dt>
            <dd class="aud-willing">${esc(a.willingness)}</dd>
          </div>
        </dl>
      </article>`,
    )
    .join('');

  return `
  <section class="section" style="--s:3">
    <div class="section__head">
      <span class="section__no">Nº 03</span>
      <h2 class="section__title">目标人群</h2>
    </div>
    <div class="aud-grid">${cards}</div>
  </section>`;
}

function renderDirections(directions: Direction[]): string {
  const cards = directions
    .map((dir, i) => {
      const rec = dir.recommended === true;
      return `
      <article class="dir-card${rec ? ' is-recommended' : ''}" style="--i:${i}">
        <header class="dir-card__head">
          <span class="dir-id">${esc(dir.id)}</span>
          ${rec ? '<span class="dir-rec">◆ 推荐</span>' : ''}
        </header>
        <h3 class="dir-card__title">${esc(dir.title)}</h3>
        <p class="dir-angle">${esc(dir.angle)}</p>
        <dl class="dir-meta">
          <div class="dir-row">
            <dt>针对人群</dt>
            <dd>${esc(dir.segment)}</dd>
          </div>
          <div class="dir-row">
            <dt>为什么可能成</dt>
            <dd>${esc(dir.why_it_works)}</dd>
          </div>
          <div class="dir-row dir-row--risk">
            <dt>最大风险</dt>
            <dd>${esc(dir.risk)}</dd>
          </div>
        </dl>
      </article>`;
    })
    .join('');

  return `
  <section class="section section--directions" style="--s:4">
    <div class="section__head">
      <span class="section__no">Nº 04</span>
      <h2 class="section__title">方向建议</h2>
      <p class="section__hint">每个方向都有编号，回到对话里告诉系统你选哪个。</p>
    </div>
    <div class="dir-grid">${cards}</div>
  </section>`;
}

// ── Page shell ──
function renderHtml(data: MarketAnalysis): string {
  const sourceLabel = SOURCE_LABEL[data.source] ?? esc(data.source);

  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>市场分析报告 · Lumi Lab</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,400&family=JetBrains+Mono:wght@400;500;600&family=Noto+Serif+SC:wght@400;500;600&display=swap" rel="stylesheet">
<style>
:root {
  --paper:      oklch(96.5% 0.014 78);
  --paper-2:    oklch(98.5% 0.008 78);
  --surface:    oklch(99% 0.006 78);
  --ink:        oklch(22% 0.02 55);
  --ink-2:      oklch(34% 0.018 55);
  --mute:       oklch(52% 0.016 58);
  --mute-2:     oklch(64% 0.013 58);
  --hairline:   oklch(85% 0.014 60);
  --hairline-2: oklch(78% 0.016 60);

  --accent:     oklch(48% 0.15 28);
  --accent-soft:oklch(94% 0.045 30);
  --moss:       oklch(46% 0.11 150);
  --moss-soft:  oklch(95% 0.035 150);
  --ochre:      oklch(56% 0.13 72);
  --ochre-soft: oklch(95% 0.05 72);
  --indigo:     oklch(45% 0.09 255);
  --indigo-soft:oklch(94% 0.03 255);

  --serif: "Fraunces", "Noto Serif SC", "Source Han Serif SC", Georgia, serif;
  --mono:  "JetBrains Mono", ui-monospace, Menlo, monospace;

  --shadow-soft: 0 1px 2px oklch(25% 0.02 60 / 0.05), 0 0 0 1px oklch(85% 0.014 60 / 0.55);
  --shadow-card: 0 4px 18px oklch(25% 0.02 60 / 0.07), 0 0 0 1px oklch(85% 0.014 60 / 0.6);
}

* { box-sizing: border-box; margin: 0; padding: 0; }

html { -webkit-text-size-adjust: 100%; }

body {
  font-family: var(--serif);
  background: var(--paper);
  color: var(--ink);
  line-height: 1.6;
  font-size: 16px;
  position: relative;
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
}

/* SVG grain overlay */
body::before {
  content: "";
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  opacity: 0.5;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='3' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)' opacity='0.32'/></svg>");
  mix-blend-mode: multiply;
}

.wrap {
  position: relative;
  z-index: 1;
  max-width: 920px;
  margin: 0 auto;
  padding: clamp(28px, 6vw, 72px) clamp(20px, 5vw, 56px) 80px;
}

@keyframes fade-up {
  from { opacity: 0; transform: translateY(18px); }
  to   { opacity: 1; transform: translateY(0); }
}

.section, .header, .footer {
  animation: fade-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) both;
}
.header  { animation-delay: 0s; }
.section { animation-delay: calc(0.12s * var(--s, 1)); }
.footer  { animation-delay: 0.7s; }

@media (prefers-reduced-motion: reduce) {
  .section, .header, .footer { animation: none; }
}

/* ── Header ── */
.header {
  border-bottom: 2px solid var(--ink);
  padding-bottom: 28px;
  margin-bottom: 48px;
}
.header__kicker {
  font-family: var(--mono);
  font-size: 11px;
  letter-spacing: 0.18em;
  color: var(--accent);
  text-transform: uppercase;
  margin-bottom: 18px;
}
.header__idea {
  font-family: var(--serif);
  font-weight: 500;
  font-size: clamp(1.9rem, 1.1rem + 3.6vw, 3.4rem);
  line-height: 1.12;
  letter-spacing: -0.012em;
  color: var(--ink);
  margin-bottom: 22px;
}
.header__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 14px;
  font-family: var(--mono);
  font-size: 12px;
  color: var(--mute);
}
.header__time { letter-spacing: 0.02em; }
.source-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 2px;
  background: var(--accent-soft);
  color: var(--accent);
  font-weight: 500;
  letter-spacing: 0.02em;
}
.source-badge::before { content: "◆"; font-size: 9px; }

/* ── Section frame ── */
.section { margin-bottom: 56px; }
.section__head { margin-bottom: 24px; }
.section__no {
  font-family: var(--mono);
  font-size: 11px;
  letter-spacing: 0.16em;
  color: var(--mute-2);
  display: block;
  margin-bottom: 6px;
}
.section__title {
  font-family: var(--serif);
  font-weight: 600;
  font-size: clamp(1.5rem, 1rem + 1.8vw, 2.1rem);
  letter-spacing: -0.01em;
  color: var(--ink);
}
.section__hint {
  font-family: var(--mono);
  font-size: 12px;
  color: var(--mute);
  margin-top: 8px;
  line-height: 1.5;
}

/* ── Market ── */
.market-grid {
  display: grid;
  grid-template-columns: 1.6fr 1fr;
  gap: 24px;
  margin-bottom: 28px;
}
.market-summary {
  font-size: 1.12rem;
  line-height: 1.7;
  color: var(--ink-2);
}
.callout {
  background: var(--surface);
  border-left: 3px solid var(--ochre);
  padding: 16px 18px;
  box-shadow: var(--shadow-soft);
}
.callout__label {
  font-family: var(--mono);
  font-size: 10.5px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ochre);
  display: block;
  margin-bottom: 8px;
}
.callout__body {
  font-size: 0.98rem;
  line-height: 1.55;
  color: var(--ink-2);
}
.trends__label {
  font-family: var(--mono);
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--mute);
  display: block;
  margin-bottom: 12px;
}
.trends__list { list-style: none; }
.trend {
  display: flex;
  gap: 12px;
  align-items: baseline;
  padding: 12px 0;
  border-bottom: 1px solid var(--hairline);
}
.trend:last-child { border-bottom: none; }
.trend__mark { color: var(--accent); font-size: 11px; flex-shrink: 0; }
.trend__text { font-size: 1.04rem; color: var(--ink-2); }

/* ── Competitors ── */
.comp-table {
  width: 100%;
  border-collapse: collapse;
  background: var(--surface);
  box-shadow: var(--shadow-soft);
}
.comp-table th {
  font-family: var(--mono);
  font-size: 10.5px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--mute);
  text-align: left;
  padding: 12px 16px;
  border-bottom: 2px solid var(--ink);
}
.comp-table td {
  padding: 16px;
  border-bottom: 1px solid var(--hairline);
  vertical-align: top;
  font-size: 0.96rem;
  line-height: 1.55;
}
.comp-row:last-child td { border-bottom: none; }
.comp-name {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 140px;
}
.comp-name__text { font-weight: 600; font-size: 1.04rem; color: var(--ink); }
.comp-do { color: var(--ink-2); }
.comp-gap { color: var(--ink-2); }
.gap-mark { color: var(--accent); font-size: 10px; }

.comp-badge {
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: 0.04em;
  padding: 3px 8px;
  border-radius: 2px;
  width: fit-content;
}
.comp-badge.is-direct { background: var(--accent-soft); color: var(--accent); }
.comp-badge.is-alt    { background: var(--ochre-soft); color: oklch(42% 0.12 72); }
.comp-badge.is-status { background: var(--indigo-soft); color: var(--indigo); }

/* card variant (mobile) */
.comp-cards { display: none; flex-direction: column; gap: 14px; }
.comp-card {
  background: var(--surface);
  box-shadow: var(--shadow-soft);
  padding: 16px 16px 14px;
  border-left: 3px solid var(--hairline-2);
}
.comp-card.is-direct { border-left-color: var(--accent); }
.comp-card.is-alt    { border-left-color: var(--ochre); }
.comp-card.is-status { border-left-color: var(--indigo); }
.comp-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}
.comp-card__name { font-family: var(--serif); font-weight: 600; font-size: 1.1rem; }
.comp-card__do { font-size: 0.95rem; color: var(--ink-2); margin-bottom: 8px; }
.comp-card__gap { font-size: 0.95rem; color: var(--ink-2); }

/* ── Audience ── */
.aud-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}
.aud-card {
  background: var(--surface);
  box-shadow: var(--shadow-card);
  padding: 20px;
  border-top: 3px solid var(--moss);
}
.aud-card__seg {
  font-family: var(--serif);
  font-weight: 600;
  font-size: 1.18rem;
  margin-bottom: 14px;
  color: var(--ink);
}
.aud-card__list { display: flex; flex-direction: column; gap: 12px; }
.aud-row dt {
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--mute);
  margin-bottom: 3px;
}
.aud-row dd { font-size: 0.96rem; line-height: 1.5; color: var(--ink-2); }
.aud-willing { color: var(--moss); font-weight: 500; }

/* ── Directions ── */
.section--directions {
  background: var(--paper-2);
  margin-left: calc(-1 * clamp(20px, 5vw, 56px));
  margin-right: calc(-1 * clamp(20px, 5vw, 56px));
  padding: 40px clamp(20px, 5vw, 56px);
  border-top: 1px solid var(--hairline);
  border-bottom: 1px solid var(--hairline);
}
.dir-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 18px;
}
.dir-card {
  background: var(--surface);
  box-shadow: var(--shadow-card);
  padding: 22px;
  display: flex;
  flex-direction: column;
  position: relative;
}
.dir-card.is-recommended {
  border: 2px solid var(--accent);
  box-shadow: 0 6px 24px oklch(48% 0.15 28 / 0.16);
}
.dir-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  min-height: 22px;
}
.dir-id {
  font-family: var(--mono);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: var(--mute);
  background: var(--paper);
  padding: 3px 9px;
  border-radius: 2px;
}
.dir-rec {
  font-family: var(--mono);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  color: var(--surface);
  background: var(--accent);
  padding: 4px 10px;
  border-radius: 2px;
}
.dir-card__title {
  font-family: var(--serif);
  font-weight: 600;
  font-size: 1.32rem;
  line-height: 1.25;
  color: var(--ink);
  margin-bottom: 8px;
}
.dir-angle {
  font-size: 0.98rem;
  font-style: italic;
  color: var(--accent);
  margin-bottom: 16px;
  line-height: 1.5;
}
.dir-meta { display: flex; flex-direction: column; gap: 12px; }
.dir-row dt {
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--mute);
  margin-bottom: 3px;
}
.dir-row dd { font-size: 0.96rem; line-height: 1.5; color: var(--ink-2); }
.dir-row--risk dd { color: oklch(45% 0.13 35); }

/* ── Footer ── */
.footer {
  margin-top: 56px;
  padding-top: 28px;
  border-top: 2px solid var(--ink);
  text-align: center;
}
.footer__hint {
  font-family: var(--serif);
  font-size: 1.15rem;
  color: var(--ink-2);
  margin-bottom: 8px;
}
.footer__sub {
  font-family: var(--mono);
  font-size: 11px;
  letter-spacing: 0.08em;
  color: var(--mute-2);
}

/* ── Responsive ── */
@media (max-width: 680px) {
  body { font-size: 15px; }
  .market-grid { grid-template-columns: 1fr; gap: 18px; }
  .aud-grid { grid-template-columns: 1fr; }
  .dir-grid { grid-template-columns: 1fr; }
  .comp-table { display: none; }
  .comp-cards { display: flex; }
  .section--directions {
    margin-left: calc(-1 * clamp(20px, 5vw, 56px));
    margin-right: calc(-1 * clamp(20px, 5vw, 56px));
  }
}
</style>
</head>
<body>
<main class="wrap">
  <header class="header">
    <div class="header__kicker">Lumi Lab · 市场分析报告</div>
    <h1 class="header__idea">${esc(data.idea)}</h1>
    <div class="header__meta">
      <span class="header__time">生成于 ${formatDate(data.generated_at)}</span>
      <span class="source-badge">${sourceLabel}</span>
    </div>
  </header>

  ${renderMarket(data.market)}
  ${renderCompetitors(data.competitors)}
  ${renderAudience(data.audience)}
  ${renderDirections(data.directions)}

  <footer class="footer">
    <p class="footer__hint">回到对话选一个方向，或说你自己的想法。</p>
    <p class="footer__sub">Lumi Lab — 从一句话到上线</p>
  </footer>
</main>
</body>
</html>`;
}

// ── Main ──
function main(): void {
  const arg = process.argv[2];
  if (!arg) fail('用法: bun run scripts/market-report.ts <venture-dir>');

  const ventureDir = resolve(arg);
  if (!existsSync(ventureDir)) fail(`venture 目录不存在: ${ventureDir}`);

  const inputPath = join(ventureDir, 'market_analysis.json');
  if (!existsSync(inputPath)) {
    fail(`找不到 ${inputPath}\n  自主分析阶段应先产出 market_analysis.json`);
  }

  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(inputPath, 'utf-8'));
  } catch (err) {
    fail(`market_analysis.json 解析失败: ${err instanceof Error ? err.message : String(err)}`);
  }

  const data = validate(raw);
  const html = renderHtml(data);

  const reportsDir = join(ventureDir, 'reports');
  mkdirSync(reportsDir, { recursive: true });
  const outPath = join(reportsDir, 'market-report.html');
  writeFileSync(outPath, html, 'utf-8');

  const channel = process.env.LUMILAB_CHANNEL ?? 'local';
  if (channel === 'local') {
    const opener =
      process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
    try {
      spawn(opener, [outPath], { detached: true, stdio: 'ignore' }).unref();
      console.log(`\x1b[32m[market-report] 已生成并在浏览器打开:\x1b[0m ${outPath}`);
    } catch {
      console.log(`\x1b[32m[market-report] 已生成:\x1b[0m ${outPath}`);
    }
  } else {
    console.log(`\x1b[32m[market-report] 已生成:\x1b[0m ${outPath}`);
  }
}

main();
