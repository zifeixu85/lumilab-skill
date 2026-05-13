/**
 * render.ts — Studio rendering engine.
 *
 * Reads MD/YAML data layer for a venture, renders into HTML for:
 *   - studio/index.html (作战室主页, SVG progress diagram)
 *   - studio/decisions/*.html (互动决策页)
 *   - studio/preview/*.html (资产预览)
 *
 * Pure string template, no framework, no build step.
 *
 * Usage:
 *   bun run render.ts <venture-dir>
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from 'fs';
import { join, resolve, dirname } from 'path';
// @ts-ignore - js-yaml optional dep, fallback to simple parser
import * as yaml from 'js-yaml';

const SCRIPT_DIR = __dirname;
const TEMPLATE_DIR = join(SCRIPT_DIR, '..', 'templates');

interface Hypothesis {
  id: string;
  fact: string;
  category: string;
  confidence: 'high' | 'medium' | 'low';
  status: 'active' | 'superseded';
  superseded_by?: string | null;
  test_status: string;
  verification_count: number;
}

interface Decision {
  id: string;
  decision: string;
  rationale: string;
  by: string;
  type: string;
  at: string;
}

interface VentureData {
  ventureName: string;
  ventureSlug: string;
  ventureDir: string;
  projectBrief: string;
  hypotheses: Hypothesis[];
  decisions: Decision[];
  designDirection: any;
  metrics: any[];
  currentDay: number;
  totalDays: number;
  currentStage: string;
  stagesDone: string[];
}

const STAGES = ['idea', 'coach', 'research', 'product', 'build', 'launch', 'retro'];

function readYaml<T = any>(filePath: string): T | null {
  if (!existsSync(filePath)) return null;
  const content = readFileSync(filePath, 'utf-8');
  try {
    return yaml.load(content) as T;
  } catch (e) {
    // Fallback super-naive parser for hypotheses list
    return null;
  }
}

function readJson<T = any>(filePath: string): T | null {
  if (!existsSync(filePath)) return null;
  try {
    return JSON.parse(readFileSync(filePath, 'utf-8'));
  } catch {
    return null;
  }
}

function readText(filePath: string): string {
  if (!existsSync(filePath)) return '';
  return readFileSync(filePath, 'utf-8');
}

function loadVentureData(ventureDir: string): VentureData {
  const ventureName = ventureDir.split('/').filter(Boolean).pop()!;
  const projectBrief = readText(join(ventureDir, 'project_brief.md'));
  const hypotheses = readYaml<Hypothesis[]>(join(ventureDir, 'hypotheses.yaml')) ?? [];
  const decisions = readYaml<Decision[]>(join(ventureDir, 'decisions.yaml')) ?? [];
  const designDirection = readJson(join(ventureDir, 'design_direction.json'));

  // Determine current stage from what files exist
  const stagesDone: string[] = ['idea']; // assume idea always done if dir exists
  if (existsSync(join(ventureDir, 'audience.md'))) stagesDone.push('coach');
  if (existsSync(join(ventureDir, 'research')) || existsSync(join(ventureDir, 'market_research.md'))) stagesDone.push('research');
  if (existsSync(join(ventureDir, 'product_definition.md'))) stagesDone.push('product');
  if (existsSync(join(ventureDir, 'landing_page.html'))) stagesDone.push('build');
  if (existsSync(join(ventureDir, 'growth_sop.md'))) stagesDone.push('launch');
  if (existsSync(join(ventureDir, 'review_report.md'))) stagesDone.push('retro');

  const currentStage = STAGES.find(s => !stagesDone.includes(s)) ?? 'retro';

  return {
    ventureName,
    ventureSlug: ventureName,
    ventureDir,
    projectBrief,
    hypotheses,
    decisions,
    designDirection,
    metrics: [],
    currentDay: 0,
    totalDays: 7,
    currentStage,
    stagesDone,
  };
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function extractOneLiner(brief: string): string {
  const m = brief.match(/>\s*\*\*(.+?)\*\*/);
  return m ? m[1] : '';
}

function extractField(brief: string, label: string): string {
  const re = new RegExp(`\\*\\*${label}\\*\\*:?\\s*([^\\n]+)`, 'i');
  const m = brief.match(re);
  return m ? m[1].trim() : '';
}

function renderProgressDiagram(stagesDone: string[], currentStage: string): string {
  const stageLabels: Record<string, string> = {
    idea: 'Idea', coach: 'Coach', research: 'Research',
    product: 'Product', build: 'Build', launch: 'Launch', retro: 'Retro'
  };
  const stageOrdinals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

  const W = 1080, H = 200;
  const padX = 50;
  const usable = W - padX * 2;
  const step = usable / (STAGES.length - 1);
  const cy = 90;

  let svg = `<svg viewBox="0 0 ${W} ${H}" class="progress-diagram" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" aria-label="Venture progress timeline">`;

  // Baseline ruler
  svg += `<line x1="${padX}" y1="${cy}" x2="${W - padX}" y2="${cy}" class="rail" />`;

  // Tick marks under each stage
  STAGES.forEach((_, i) => {
    const x = padX + step * i;
    svg += `<line x1="${x}" y1="${cy - 12}" x2="${x}" y2="${cy + 12}" class="tick" />`;
  });

  // Nodes + labels
  STAGES.forEach((stage, i) => {
    const cx = padX + step * i;
    const isDone = stagesDone.includes(stage);
    const isCurrent = stage === currentStage;
    const state = isDone ? 'done' : isCurrent ? 'current' : 'pending';

    svg += `<g class="stage stage--${state}" data-stage="${stage}">`;

    // Concentric rings for current; filled square for done; outline circle for pending
    if (isCurrent) {
      svg += `<circle cx="${cx}" cy="${cy}" r="18" class="ring-outer" />`;
      svg += `<circle cx="${cx}" cy="${cy}" r="10" class="ring-inner" />`;
      svg += `<circle cx="${cx}" cy="${cy}" r="4" class="ring-core" />`;
    } else if (isDone) {
      svg += `<rect x="${cx - 8}" y="${cy - 8}" width="16" height="16" class="square" />`;
    } else {
      svg += `<circle cx="${cx}" cy="${cy}" r="6" class="dot" />`;
    }

    // Ordinal numeral above
    svg += `<text x="${cx}" y="${cy - 30}" text-anchor="middle" class="ordinal">${stageOrdinals[i]}</text>`;
    // Stage name below
    svg += `<text x="${cx}" y="${cy + 38}" text-anchor="middle" class="stage-label">${stageLabels[stage]}</text>`;

    svg += `</g>`;
  });

  // Connecting paths beneath (progress fill)
  const lastDoneIdx = STAGES.reduce((acc, s, i) => stagesDone.includes(s) ? i : acc, -1);
  if (lastDoneIdx > 0) {
    const x1 = padX;
    const x2 = padX + step * lastDoneIdx;
    svg += `<line x1="${x1}" y1="${cy}" x2="${x2}" y2="${cy}" class="rail rail--filled" />`;
  }

  svg += `</svg>`;
  return svg;
}

function renderHypothesisCard(h: Hypothesis, index: number): string {
  const statusLabel = h.status === 'superseded'
    ? `已迭代 → ${h.superseded_by ?? '?'}`
    : h.confidence === 'high' ? '强信号'
    : h.confidence === 'medium' ? '中信号'
    : '弱信号';

  const statusClass = h.status === 'superseded' ? 'superseded'
    : h.confidence === 'high' ? 'strong'
    : h.confidence === 'medium' ? 'medium'
    : 'weak';

  // Alternate offset for asymmetric rhythm
  const offset = index % 2 === 0 ? '' : 'h-card--offset';
  const stars = '★'.repeat(Math.min(h.verification_count, 5));

  return `
  <article class="h-card ${offset}" data-status="${h.status}">
    <div class="h-card__rail">
      <span class="h-id">${escapeHtml(h.id)}</span>
      <span class="h-status h-status--${statusClass}">${escapeHtml(statusLabel)}</span>
    </div>
    <p class="h-fact">${escapeHtml(h.fact)}</p>
    <footer class="h-meta">
      <span class="h-meta__item"><em>测试</em> ${escapeHtml(h.test_status)}</span>
      <span class="h-meta__item"><em>已验证</em> ${h.verification_count} 次 <span class="stars">${stars}</span></span>
    </footer>
  </article>`;
}

function renderDecisionTimeline(decisions: Decision[]): string {
  if (decisions.length === 0) {
    return '<p class="empty">尚无决策记录。第一次 <code>/lumilab review</code> 后会出现在这里。</p>';
  }
  const recent = decisions.slice(-6).reverse();

  return `<ol class="d-timeline">${recent.map((d, i) => {
    const date = d.at.slice(0, 10);
    const time = d.at.slice(11, 16);
    const typeLabel = d.type.replace(/_/g, ' ');
    return `
    <li class="d-row" data-type="${escapeHtml(d.type)}">
      <div class="d-date">
        <time class="d-day" datetime="${escapeHtml(d.at)}">${date}</time>
        <span class="d-time">${time}</span>
      </div>
      <div class="d-body">
        <p class="d-decision">${escapeHtml(d.decision)}</p>
        <p class="d-rationale"><em>${escapeHtml(d.rationale)}</em></p>
        <span class="d-tag">${escapeHtml(typeLabel)} · ${escapeHtml(d.by)}</span>
      </div>
    </li>`;
  }).join('')}</ol>`;
}

function renderIndex(data: VentureData): string {
  const accent = data.designDirection?.palette?.accent ?? 'oklch(42% 0.16 28)';

  const activeHypotheses = data.hypotheses.filter(h => h.status === 'active');
  const supersededHypotheses = data.hypotheses.filter(h => h.status === 'superseded');
  const verifiedCount = data.hypotheses.reduce((acc, h) => acc + (h.verification_count >= 3 ? 1 : 0), 0);

  const oneLiner = extractOneLiner(data.projectBrief);
  const targetAudience = extractField(data.projectBrief, '目标用户');
  const stage = extractField(data.projectBrief, '当前阶段') || data.currentStage;
  const iteration = extractField(data.projectBrief, '当前 Iteration') || '#1';

  const now = new Date();
  const issueDate = now.toISOString().slice(0, 10);
  const issueTime = now.toISOString().slice(11, 16);
  const issueNo = String(Math.max(1, data.decisions.length)).padStart(3, '0');

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(data.ventureName)} · Studio · Nº ${issueNo}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght,SOFT@0,9..144,300..900,0..100;1,9..144,300..900,0..100&family=JetBrains+Mono:ital,wght@0,300..700;1,300..700&display=swap" rel="stylesheet">
<style>
:root {
  --ink:       oklch(15% 0.018 60);
  --ink-2:     oklch(28% 0.015 60);
  --ash:       oklch(45% 0.015 60);
  --mute:      oklch(62% 0.013 60);
  --hairline:  oklch(85% 0.012 60);
  --paper:     oklch(97% 0.012 80);
  --paper-2:   oklch(94.5% 0.014 80);
  --cream:     oklch(99% 0.006 80);
  --accent:    ${accent};
  --accent-2:  oklch(55% 0.13 28);
  --moss:      oklch(45% 0.10 145);
  --ochre:     oklch(55% 0.13 75);

  --serif:   "Fraunces", "Times New Roman", serif;
  --mono:    "JetBrains Mono", ui-monospace, "SFMono-Regular", Menlo, monospace;

  --section-space: clamp(3rem, 6vw, 6rem);
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
}

* { box-sizing: border-box; margin: 0; padding: 0; }

html { -webkit-text-size-adjust: 100%; }
body {
  font-family: var(--serif);
  font-variation-settings: "opsz" 18, "SOFT" 30;
  background: var(--paper);
  color: var(--ink);
  min-height: 100dvh;
  line-height: 1.45;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  font-feature-settings: "ss01", "ss02", "kern", "liga";
  position: relative;
}

/* Grain texture overlay — gives the paper feel without heavy assets */
body::before {
  content: '';
  position: fixed; inset: 0;
  pointer-events: none;
  z-index: 1;
  opacity: 0.4;
  mix-blend-mode: multiply;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.08, 0 0 0 0 0.06, 0 0 0 0 0.05, 0 0 0 0.5 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
}

.frame {
  max-width: 1180px;
  margin: 0 auto;
  padding: clamp(1.5rem, 3.5vw, 3rem) clamp(1.25rem, 4vw, 3.5rem) 0;
  position: relative;
  z-index: 2;
}

/* ─────────  MASTHEAD  ───────── */
.masthead {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: baseline;
  gap: clamp(1rem, 3vw, 3rem);
  padding-bottom: 0.875rem;
  border-bottom: 1px solid var(--ink);
  position: relative;
}
.masthead::after {
  content: '';
  position: absolute;
  left: 0; right: 0; bottom: -4px;
  height: 1px; background: var(--ink);
}
.brand {
  font-family: var(--mono);
  font-size: 0.75rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  font-weight: 600;
  color: var(--ink);
  display: inline-flex; align-items: center; gap: 0.5rem;
}
.brand .dot { width: 6px; height: 6px; background: var(--accent); border-radius: 50%; display: inline-block; }
.brand .sep { color: var(--mute); }
.mast-runner {
  font-family: var(--mono);
  font-size: 0.7rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ash);
  text-align: center;
  font-style: italic;
}
.issue {
  font-family: var(--mono);
  font-size: 0.72rem;
  letter-spacing: 0.12em;
  color: var(--ash);
  text-align: right;
}

/* ─────────  COVER  ───────── */
.cover {
  display: grid;
  grid-template-columns: minmax(0, 9fr) minmax(0, 4fr);
  gap: clamp(2rem, 6vw, 6rem);
  padding: clamp(2.5rem, 6vw, 5rem) 0 clamp(2rem, 5vw, 4rem);
  border-bottom: 1px solid var(--hairline);
  align-items: end;
}
.cover__kicker {
  font-family: var(--mono);
  font-size: 0.7rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--accent);
  margin-bottom: 1.25rem;
  display: inline-flex; align-items: center; gap: 0.75rem;
}
.cover__kicker::before {
  content: ''; width: 28px; height: 1px; background: var(--accent);
}
.cover__title {
  font-family: var(--serif);
  font-variation-settings: "opsz" 144, "SOFT" 50, "wght" 380;
  font-size: clamp(2.8rem, 7.2vw, 6.5rem);
  line-height: 0.94;
  letter-spacing: -0.025em;
  color: var(--ink);
  margin-bottom: 1.5rem;
}
.cover__title em {
  font-style: italic;
  font-variation-settings: "opsz" 144, "SOFT" 100, "wght" 380;
  color: var(--accent);
}
.cover__deck {
  font-family: var(--serif);
  font-variation-settings: "opsz" 14, "wght" 400;
  font-style: italic;
  font-size: clamp(1.05rem, 1.6vw, 1.35rem);
  color: var(--ink-2);
  line-height: 1.5;
  max-width: 38ch;
}
.cover__deck::before {
  content: '“'; font-size: 2em; line-height: 0; color: var(--accent);
  vertical-align: -0.3em; margin-right: 0.1em;
}
.cover__deck::after {
  content: '”'; font-size: 2em; line-height: 0; color: var(--accent);
  vertical-align: -0.3em; margin-left: 0.05em;
}

.cover__meta {
  display: grid; gap: 1rem;
  font-family: var(--mono);
  font-size: 0.78rem;
  border-left: 1px solid var(--hairline);
  padding-left: 1.75rem;
}
.cover__meta dl { display: grid; gap: 0.2rem; }
.cover__meta dt {
  font-size: 0.65rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--mute);
}
.cover__meta dd {
  font-size: 0.95rem;
  color: var(--ink);
  font-family: var(--serif);
  font-variation-settings: "opsz" 14;
}
.cover__meta dd.mono { font-family: var(--mono); font-size: 0.82rem; }

/* ─────────  SECTION FRAME  ───────── */
.section {
  padding: var(--section-space) 0;
  border-bottom: 1px solid var(--hairline);
  position: relative;
}
.section:last-of-type { border-bottom: 0; }

.section__head {
  display: grid;
  grid-template-columns: 5rem 1fr auto;
  align-items: baseline;
  gap: 1.5rem;
  margin-bottom: clamp(1.5rem, 3vw, 2.5rem);
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--ink);
}
.section__num {
  font-family: var(--mono);
  font-size: 0.78rem;
  letter-spacing: 0.18em;
  color: var(--accent);
  font-weight: 600;
}
.section__title {
  font-family: var(--serif);
  font-variation-settings: "opsz" 18, "wght" 500;
  font-size: clamp(1.4rem, 2.2vw, 1.85rem);
  letter-spacing: -0.01em;
}
.section__stats {
  font-family: var(--mono);
  font-size: 0.7rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ash);
  text-align: right;
  line-height: 1.6;
}
.section__stats em {
  font-style: normal;
  color: var(--ink);
  font-weight: 600;
}

/* ─────────  PROGRESS DIAGRAM  ───────── */
.progress-wrap {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.25rem;
}
.progress-diagram { width: 100%; height: auto; max-height: 220px; display: block; }
.progress-diagram .rail { stroke: var(--hairline); stroke-width: 1; }
.progress-diagram .rail--filled { stroke: var(--accent); stroke-width: 1.5; }
.progress-diagram .tick { stroke: var(--hairline); stroke-width: 1; }
.progress-diagram .ordinal {
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: 0.1em;
  fill: var(--mute);
}
.progress-diagram .stage-label {
  font-family: var(--serif);
  font-variation-settings: "opsz" 12, "wght" 500;
  font-size: 13px;
  fill: var(--ink-2);
  letter-spacing: 0.02em;
}
.progress-diagram .stage--done .square {
  fill: var(--ink);
  stroke: var(--ink);
}
.progress-diagram .stage--done .ordinal { fill: var(--accent); font-weight: 600; }
.progress-diagram .stage--current .ring-outer {
  fill: none;
  stroke: var(--accent);
  stroke-width: 1.5;
  animation: ring-breath 2.4s var(--ease-out) infinite;
}
.progress-diagram .stage--current .ring-inner {
  fill: var(--paper);
  stroke: var(--accent);
  stroke-width: 1;
}
.progress-diagram .stage--current .ring-core {
  fill: var(--accent);
  animation: pulse-dot 1.8s ease-in-out infinite;
}
.progress-diagram .stage--current .ordinal { fill: var(--accent); font-weight: 700; }
.progress-diagram .stage--current .stage-label { fill: var(--accent); font-style: italic; }
.progress-diagram .stage--pending .dot {
  fill: var(--paper);
  stroke: var(--ash);
  stroke-width: 1;
}
.progress-diagram .stage--pending .ordinal { fill: var(--mute); }
.progress-diagram .stage--pending .stage-label { fill: var(--mute); }
@keyframes ring-breath { 0%, 100% { r: 18; opacity: 1; } 50% { r: 22; opacity: 0.5; } }
@keyframes pulse-dot { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }

.progress-meta {
  display: flex; gap: 2rem; flex-wrap: wrap;
  font-family: var(--mono);
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  color: var(--ash);
  border-top: 1px dashed var(--hairline);
  padding-top: 1rem;
}
.progress-meta span em {
  font-style: normal;
  color: var(--ink);
  font-weight: 600;
}

/* ─────────  HYPOTHESES  ───────── */
.h-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0;
}
.h-card {
  display: grid;
  grid-template-columns: 9rem 1fr;
  gap: 2rem;
  padding: 1.75rem 0;
  border-top: 1px solid var(--hairline);
  position: relative;
  transition: background 250ms var(--ease-out);
}
.h-card:first-child { border-top: 0; }
.h-card:hover { background: var(--paper-2); }
.h-card--offset { padding-left: clamp(0rem, 4vw, 4rem); }

.h-card[data-status="superseded"] {
  opacity: 0.5;
}
.h-card[data-status="superseded"] .h-fact {
  text-decoration: line-through;
  text-decoration-color: var(--ash);
  text-decoration-thickness: 1px;
}

.h-card__rail {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-family: var(--mono);
}
.h-id {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--ink);
  letter-spacing: 0.04em;
}
.h-status {
  font-size: 0.65rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  font-weight: 600;
  padding: 0.18rem 0;
  display: inline-flex; align-items: center; gap: 0.4rem;
  width: fit-content;
}
.h-status::before {
  content: ''; width: 8px; height: 8px; display: inline-block;
}
.h-status--strong { color: var(--moss); }
.h-status--strong::before { background: var(--moss); }
.h-status--medium { color: var(--ochre); }
.h-status--medium::before { background: var(--ochre); }
.h-status--weak { color: var(--mute); }
.h-status--weak::before { background: var(--mute); border: 1px solid var(--hairline); }
.h-status--superseded { color: var(--accent); }
.h-status--superseded::before { background: var(--accent); transform: rotate(45deg); }

.h-fact {
  font-family: var(--serif);
  font-variation-settings: "opsz" 24, "wght" 380;
  font-size: clamp(1.15rem, 1.7vw, 1.4rem);
  line-height: 1.4;
  color: var(--ink);
  letter-spacing: -0.005em;
  margin-bottom: 1rem;
  max-width: 56ch;
}
.h-meta {
  display: flex; gap: 2rem; flex-wrap: wrap;
  font-family: var(--mono);
  font-size: 0.72rem;
  color: var(--ash);
  letter-spacing: 0.04em;
}
.h-meta__item em {
  font-style: normal;
  color: var(--mute);
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 0.65rem;
  margin-right: 0.4rem;
}
.h-meta .stars { color: var(--accent); margin-left: 0.2rem; letter-spacing: 0.1em; }

/* ─────────  DECISIONS  ───────── */
.d-timeline { list-style: none; }
.d-row {
  display: grid;
  grid-template-columns: 8rem 1fr;
  gap: clamp(1.5rem, 4vw, 3rem);
  padding: 1.5rem 0;
  border-top: 1px solid var(--hairline);
  align-items: baseline;
}
.d-row:first-child { border-top: 0; }
.d-date {
  font-family: var(--mono);
  text-align: right;
  border-right: 1px solid var(--hairline);
  padding-right: clamp(1.5rem, 4vw, 3rem);
  margin-right: calc(-1 * clamp(1.5rem, 4vw, 3rem));
}
.d-day {
  display: block;
  font-size: 0.85rem;
  color: var(--ink);
  font-weight: 600;
  letter-spacing: 0.02em;
}
.d-time {
  font-size: 0.72rem;
  color: var(--ash);
  letter-spacing: 0.08em;
}
.d-decision {
  font-family: var(--serif);
  font-variation-settings: "opsz" 18, "wght" 450;
  font-size: clamp(1.05rem, 1.4vw, 1.2rem);
  line-height: 1.4;
  color: var(--ink);
  margin-bottom: 0.5rem;
  max-width: 60ch;
}
.d-rationale {
  font-family: var(--serif);
  font-variation-settings: "opsz" 14, "wght" 380;
  font-size: 1rem;
  line-height: 1.55;
  color: var(--ash);
  max-width: 60ch;
  margin-bottom: 0.75rem;
}
.d-tag {
  font-family: var(--mono);
  font-size: 0.65rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--mute);
  padding: 0.2rem 0.5rem;
  border: 1px solid var(--hairline);
}
.d-row[data-type="user_challenge"] .d-decision::before {
  content: '◆ ';
  color: var(--accent);
  font-size: 0.85em;
  vertical-align: 0.05em;
}
.d-row[data-type="taste"] .d-decision::before {
  content: '◇ ';
  color: var(--ochre);
  font-size: 0.85em;
}

.empty {
  font-family: var(--serif);
  font-style: italic;
  color: var(--mute);
  font-size: 1.05rem;
  padding: 1rem 0;
}
.empty code {
  font-family: var(--mono);
  font-size: 0.85em;
  font-style: normal;
  color: var(--accent);
  background: var(--paper-2);
  padding: 0.1rem 0.4rem;
  border-radius: 2px;
}

/* ─────────  BRIEF  ───────── */
.brief {
  display: grid;
  grid-template-columns: minmax(0, 7fr) minmax(0, 5fr);
  gap: clamp(2rem, 5vw, 5rem);
  align-items: start;
}
.brief__copy {
  font-family: var(--serif);
  font-variation-settings: "opsz" 14, "wght" 400;
  font-size: 1.05rem;
  line-height: 1.65;
  color: var(--ink-2);
  white-space: pre-wrap;
  max-width: 64ch;
}
.brief__sidenote {
  font-family: var(--mono);
  font-size: 0.78rem;
  color: var(--ash);
  border-left: 2px solid var(--accent);
  padding: 0.25rem 0 0.25rem 1.25rem;
  line-height: 1.7;
  letter-spacing: 0.02em;
}
.brief__sidenote strong {
  display: block;
  font-family: var(--serif);
  font-variation-settings: "opsz" 14, "wght" 500;
  font-style: italic;
  color: var(--ink);
  font-size: 0.95rem;
  margin-bottom: 0.4rem;
  letter-spacing: 0;
}

/* ─────────  COLOPHON  ───────── */
.colophon {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 2rem 0 3rem;
  font-family: var(--mono);
  font-size: 0.7rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--mute);
  border-top: 1px solid var(--ink);
  margin-top: var(--section-space);
}
.colophon a { color: var(--accent); text-decoration: none; border-bottom: 1px solid currentColor; }

/* ─────────  ANIMATIONS  ───────── */
@keyframes ink-reveal {
  from { opacity: 0; transform: translateY(12px); filter: blur(2px); }
  to   { opacity: 1; transform: translateY(0); filter: blur(0); }
}
@keyframes hairline-grow {
  from { transform: scaleX(0); }
  to   { transform: scaleX(1); }
}

.masthead, .cover, .section, .colophon {
  animation: ink-reveal 700ms var(--ease-out) both;
}
.cover { animation-delay: 80ms; }
.section:nth-of-type(1) { animation-delay: 160ms; }
.section:nth-of-type(2) { animation-delay: 240ms; }
.section:nth-of-type(3) { animation-delay: 320ms; }
.section:nth-of-type(4) { animation-delay: 400ms; }
.colophon { animation-delay: 480ms; }

.masthead, .section__head {
  position: relative;
}

/* Responsive */
@media (max-width: 920px) {
  .cover { grid-template-columns: 1fr; gap: 2.5rem; }
  .cover__meta { border-left: 0; border-top: 1px solid var(--hairline); padding: 1.5rem 0 0; }
  .section__head { grid-template-columns: 1fr auto; }
  .section__num { grid-column: 1 / -1; margin-bottom: 0.25rem; }
  .h-card { grid-template-columns: 1fr; gap: 0.5rem; }
  .h-card__rail { flex-direction: row; align-items: center; gap: 1.5rem; }
  .h-card--offset { padding-left: 0; }
  .d-row { grid-template-columns: 1fr; gap: 0.5rem; }
  .d-date { text-align: left; border-right: 0; padding-right: 0; margin-right: 0; padding-bottom: 0.5rem; }
  .brief { grid-template-columns: 1fr; }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
</style>
</head>
<body>
<div class="frame">

  <header class="masthead">
    <span class="brand"><span class="dot"></span>LUMI LAB <span class="sep">/</span> STUDIO</span>
    <span class="mast-runner">一份 venture 实验日志</span>
    <span class="issue">${issueDate} · ${issueTime} · 第 ${issueNo} 期</span>
  </header>

  <article class="cover">
    <div class="cover__body">
      <p class="cover__kicker">${escapeHtml(data.ventureSlug)}</p>
      <h1 class="cover__title">${escapeHtml(data.ventureName.replace(/-/g, ' '))}<em>.</em></h1>
      ${oneLiner ? `<p class="cover__deck">${escapeHtml(oneLiner)}</p>` : ''}
    </div>
    <aside class="cover__meta">
      <dl><dt>第几天</dt><dd class="mono">${data.currentDay} / ${data.totalDays}</dd></dl>
      <dl><dt>阶段</dt><dd>${escapeHtml(stage)}</dd></dl>
      <dl><dt>第几轮</dt><dd class="mono">${escapeHtml(iteration)}</dd></dl>
      ${targetAudience ? `<dl><dt>目标用户</dt><dd>${escapeHtml(targetAudience)}</dd></dl>` : ''}
    </aside>
  </article>

  <section class="section">
    <header class="section__head">
      <span class="section__num">Nº 01</span>
      <h2 class="section__title">进度</h2>
      <span class="section__stats">已完成 <em>${data.stagesDone.length}</em> / ${STAGES.length} 个阶段</span>
    </header>
    <div class="progress-wrap">
      ${renderProgressDiagram(data.stagesDone, data.currentStage)}
      <div class="progress-meta">
        <span><em>当前</em> · ${escapeHtml(data.currentStage)}</span>
        <span><em>下一步</em> · ${escapeHtml(STAGES[STAGES.indexOf(data.currentStage) + 1] ?? '—')}</span>
        <span><em>第几天</em> · ${data.currentDay}/${data.totalDays}</span>
      </div>
    </div>
  </section>

  <section class="section">
    <header class="section__head">
      <span class="section__num">Nº 02</span>
      <h2 class="section__title">假设</h2>
      <span class="section__stats">
        <em>${activeHypotheses.length}</em> 个活跃${supersededHypotheses.length ? ` · ${supersededHypotheses.length} 个已迭代` : ''}${verifiedCount ? ` · ${verifiedCount} 个已验证` : ''}
      </span>
    </header>
    ${data.hypotheses.length === 0
      ? `<p class="empty">尚无假设。在你的 AI 宿主里调用 <code>lumilab-founder-coach</code> 开始 3 条假设。</p>`
      : `<div class="h-grid">${data.hypotheses.map(renderHypothesisCard).join('')}</div>`}
  </section>

  <section class="section">
    <header class="section__head">
      <span class="section__num">Nº 03</span>
      <h2 class="section__title">决策轨迹</h2>
      <span class="section__stats">显示最近 <em>${Math.min(6, data.decisions.length)}</em> / 共 ${data.decisions.length} 条</span>
    </header>
    ${renderDecisionTimeline(data.decisions)}
  </section>

  <section class="section">
    <header class="section__head">
      <span class="section__num">Nº 04</span>
      <h2 class="section__title">简报</h2>
      <span class="section__stats">venture 档案</span>
    </header>
    <div class="brief">
      <div class="brief__copy">${escapeHtml(data.projectBrief || '尚未生成简报。')}</div>
      <aside class="brief__sidenote">
        <strong>如何阅读这份 Studio</strong>
        章节按印刷刊物方式编号。假设被划掉表示已经被新版「迭代」，但永远不删除——Lumi Lab 保留完整决策轨迹。进度图上呼吸的圆环是当前阶段。
      </aside>
    </div>
  </section>

  <footer class="colophon">
    <span>字体：<em style="font-style: italic; font-family: var(--serif);">Fraunces</em> &amp; JetBrains Mono</span>
    <span>由 <code>lumilab-studio</code> 生成</span>
    <span>${now.toISOString().slice(0, 16).replace('T', ' ')}</span>
  </footer>

</div>
</body>
</html>`;
}

async function main() {
  const ventureDir = process.argv[2];
  if (!ventureDir) {
    console.error('Usage: bun run render.ts <venture-dir>');
    process.exit(1);
  }

  const absDir = resolve(ventureDir);
  if (!existsSync(absDir)) {
    console.error(`Venture dir not found: ${absDir}`);
    process.exit(1);
  }

  const data = loadVentureData(absDir);
  const studioDir = join(absDir, 'studio');
  mkdirSync(studioDir, { recursive: true });

  // Render index
  const indexHtml = renderIndex(data);
  writeFileSync(join(studioDir, 'index.html'), indexHtml);

  console.log(`✓ Rendered: ${join(studioDir, 'index.html')}`);
  console.log(`  Stage: ${data.currentStage} (${data.stagesDone.length}/${STAGES.length} done)`);
  console.log(`  Hypotheses: ${data.hypotheses.length} (${data.hypotheses.filter(h => h.status === 'active').length} active)`);
  console.log(`  Decisions: ${data.decisions.length}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
