/**
 * variant-workspace.ts — Variant B v3: Stage-switched 3-column workspace.
 *
 * v3 changes (vs v2):
 *  1. Left nav switches between 7 venture-validation stages (not in-page anchors)
 *  2. Interactive components have button affordance (border + bg + cursor)
 *  3. Right panel removes nested borders; uses hairline-labeled sections
 *  4. Stage switch does not scroll/anchor; clicks on rows update right panel only
 *  5. Pill padding fixed; no text-transform uppercase
 *  6. UI fully Chinese (iteration / decision types / test status)
 *  7. Markdown rendered to HTML for project_brief / audience / review_report
 *
 * Output:
 *   <venture-dir>/studio/index.html
 *
 * Usage:
 *   bun run skills/lumilab-studio/scripts/variant-workspace.ts data/ventures/lumilab-meta
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join, resolve } from 'path';
// @ts-ignore
import * as yaml from 'js-yaml';

interface Evidence {
  source: string;
  excerpt: string;
  timestamp?: string;
}

interface Hypothesis {
  id: string;
  fact: string;
  category: string;
  confidence: 'high' | 'medium' | 'low';
  status: 'active' | 'superseded';
  superseded_by?: string | null;
  superseded_reason?: string | null;
  test_method?: string;
  test_status: string;
  evidence?: Evidence[];
  verification_count: number;
  access_count?: number;
  related_entities?: string[];
  created_at?: string;
  updated_at?: string;
}

interface Decision {
  id: string;
  decision: string;
  rationale: string;
  by: string;
  type: string;
  at: string;
  related?: string[];
}

// ── Stages (v3: full 7-stage venture validation pipeline) ──
const STAGES = ['overview', 'idea', 'research', 'product', 'build', 'launch', 'retro'] as const;
type Stage = typeof STAGES[number];

const STAGE_LABELS: Record<Stage, string> = {
  overview: '概览',
  idea:     '想法澄清',
  research: '调研',
  product:  '产品',
  build:    '构建',
  launch:   '启动',
  retro:    '复盘',
};

const STAGE_SKILL_HINT: Record<Stage, string> = {
  overview: '',
  idea:     'lumilab-clarify',
  research: 'lumilab-research-platforms',
  product:  'lumilab-product-shape',
  build:    'lumilab-build',
  launch:   'lumilab-launch',
  retro:    'lumilab-retro',
};

const DECISION_TYPE_LABEL: Record<string, string> = {
  user_challenge: '战略决策',
  taste:          '品味判断',
  mechanical:     '直接执行',
};

function readYaml<T = any>(p: string): T | null {
  if (!existsSync(p)) return null;
  try { return yaml.load(readFileSync(p, 'utf-8')) as T; } catch { return null; }
}
function readText(p: string): string {
  return existsSync(p) ? readFileSync(p, 'utf-8') : '';
}
function readJson<T = any>(p: string): T | null {
  if (!existsSync(p)) return null;
  try { return JSON.parse(readFileSync(p, 'utf-8')); } catch { return null; }
}
function dirHasFiles(p: string): boolean {
  if (!existsSync(p)) return false;
  try {
    const st = statSync(p);
    if (!st.isDirectory()) return false;
    return readdirSync(p).filter((f) => !f.startsWith('.')).length > 0;
  } catch { return false; }
}
function esc(s: any): string {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
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

function confidenceLabel(c: string): string {
  return c === 'high' ? '强信号' : c === 'medium' ? '中信号' : '弱信号';
}
function testStatusLabel(s: string): string {
  return ({ passed: '已验证', pending: '待测试', failed: '已证伪', running: '测试中' } as Record<string, string>)[s] ?? s;
}
function decisionTypeLabel(t: string): string {
  return DECISION_TYPE_LABEL[t] ?? t;
}

// ── Minimal markdown renderer (no external deps) ──
function escAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}
function renderInline(s: string): string {
  // Escape HTML first
  let out = s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  // Inline code `code`
  out = out.replace(/`([^`]+?)`/g, (_, c) => `<code>${c}</code>`);
  // Links [text](url)
  out = out.replace(/\[([^\]]+?)\]\(([^)]+?)\)/g, (_, t, u) => `<a href="${escAttr(u)}">${t}</a>`);
  // Bold **
  out = out.replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>');
  // Italic * or _
  out = out.replace(/(^|[\s(])\*([^*\n]+?)\*(?=[\s.,;:!?)]|$)/g, '$1<em>$2</em>');
  out = out.replace(/(^|[\s(])_([^_\n]+?)_(?=[\s.,;:!?)]|$)/g, '$1<em>$2</em>');
  return out;
}

function renderMarkdown(md: string): string {
  if (!md.trim()) return '';
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const out: string[] = [];
  let i = 0;
  let inUl = false;
  let inOl = false;
  let inBq = false;
  let pBuf: string[] = [];

  const flushP = () => {
    if (pBuf.length) {
      out.push(`<p>${renderInline(pBuf.join(' '))}</p>`);
      pBuf = [];
    }
  };
  const closeLists = () => {
    if (inUl) { out.push('</ul>'); inUl = false; }
    if (inOl) { out.push('</ol>'); inOl = false; }
  };
  const closeBq = () => {
    if (inBq) { out.push('</blockquote>'); inBq = false; }
  };
  const closeAll = () => { flushP(); closeLists(); closeBq(); };

  while (i < lines.length) {
    const raw = lines[i];
    const line = raw.trimEnd();

    // fenced code block
    if (/^```/.test(line)) {
      closeAll();
      i++;
      const codeLines: string[] = [];
      while (i < lines.length && !/^```/.test(lines[i])) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      const escCode = codeLines.join('\n')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      out.push(`<pre><code>${escCode}</code></pre>`);
      continue;
    }

    // blank line
    if (line === '') {
      flushP();
      closeLists();
      closeBq();
      i++;
      continue;
    }

    // hr
    if (/^(\s*[-*_]){3,}\s*$/.test(line)) {
      closeAll();
      out.push('<hr>');
      i++;
      continue;
    }

    // heading
    const h = line.match(/^(#{1,6})\s+(.+)$/);
    if (h) {
      closeAll();
      const level = h[1].length;
      out.push(`<h${level} class="md-h${level}">${renderInline(h[2])}</h${level}>`);
      i++;
      continue;
    }

    // blockquote
    const bq = line.match(/^>\s?(.*)$/);
    if (bq) {
      flushP();
      closeLists();
      if (!inBq) { out.push('<blockquote>'); inBq = true; }
      out.push(`<p>${renderInline(bq[1])}</p>`);
      i++;
      continue;
    } else {
      closeBq();
    }

    // unordered list
    const ul = line.match(/^[-*]\s+(.+)$/);
    if (ul) {
      flushP();
      if (inOl) { out.push('</ol>'); inOl = false; }
      if (!inUl) { out.push('<ul>'); inUl = true; }
      out.push(`<li>${renderInline(ul[1])}</li>`);
      i++;
      continue;
    }

    // ordered list
    const ol = line.match(/^\d+\.\s+(.+)$/);
    if (ol) {
      flushP();
      if (inUl) { out.push('</ul>'); inUl = false; }
      if (!inOl) { out.push('<ol>'); inOl = true; }
      out.push(`<li>${renderInline(ol[1])}</li>`);
      i++;
      continue;
    }

    // close lists if we hit a non-list line
    closeLists();

    // paragraph buffer
    pBuf.push(line);
    i++;
  }
  closeAll();
  return out.join('\n');
}

// ── Stage completion detection ──
function detectStages(ventureDir: string) {
  const has = (p: string) => existsSync(join(ventureDir, p)) && readText(join(ventureDir, p)).trim().length > 0;
  const dir = (p: string) => dirHasFiles(join(ventureDir, p));

  return {
    overview: true,
    idea:     has('project_brief.md') || has('audience.md') || has('hypotheses.yaml'),
    research: dir('research') || has('painpoints.md') || has('competitors.md') || has('market_research.md'),
    product:  has('product_definition.md') || has('mvp_scope.md') || has('pricing.md'),
    build:    has('design_direction.json') || dir('content') || dir('deploy'),
    launch:   has('growth_sop.md') || has('content_calendar.md') || has('validation_metrics.md'),
    retro:    has('review_report.md') || dir('retro'),
  };
}

function render(ventureDir: string): string {
  const ventureName = ventureDir.split('/').filter(Boolean).pop()!;
  const brief = readText(join(ventureDir, 'project_brief.md'));
  const audience = readText(join(ventureDir, 'audience.md'));
  const productDef = readText(join(ventureDir, 'product_definition.md'));
  const reviewReport = readText(join(ventureDir, 'review_report.md'));
  const hypotheses = readYaml<Hypothesis[]>(join(ventureDir, 'hypotheses.yaml')) ?? [];
  const decisions = readYaml<Decision[]>(join(ventureDir, 'decisions.yaml')) ?? [];
  const designDirection = readJson(join(ventureDir, 'design_direction.json'));
  const accent = designDirection?.palette?.accent ?? 'oklch(42% 0.16 28)';

  const stageStatus = detectStages(ventureDir);
  const stagesDone = STAGES.filter((s) => stageStatus[s] && s !== 'overview');
  // current stage = first stage in order that is not yet done (after overview)
  const currentStage: Stage =
    (STAGES.filter((s) => s !== 'overview').find((s) => !stageStatus[s])) ?? 'retro';

  const oneLiner = extractOneLiner(brief);
  const targetAudience = extractField(brief, '目标用户');
  const iteration = extractField(brief, '当前 Iteration') || '#1';
  const currentDay = 0, totalDays = 7;

  const active = hypotheses.filter((h) => h.status === 'active');
  const superseded = hypotheses.filter((h) => h.status === 'superseded');
  const verified = hypotheses.filter((h) => h.test_status === 'passed').length;

  const dataPayload = {
    venture: { name: ventureName, oneLiner, audience: targetAudience, iteration, currentDay, totalDays, currentStage, stagesDone },
    hypotheses,
    decisions,
  };

  // ── Left nav: 7 stages ──
  const navStages = STAGES.map((s) => {
    const done = stageStatus[s];
    const isCurrent = s === currentStage;
    const isOverview = s === 'overview';
    const statusDot = isOverview
      ? ''
      : done
        ? '<span class="nav-stage__dot is-done" title="已完成">✓</span>'
        : isCurrent
          ? '<span class="nav-stage__dot is-current" title="进行中">●</span>'
          : '<span class="nav-stage__dot is-pending" title="未开始">○</span>';
    return `
      <a class="nav-stage" data-stage="${s}" data-active="${s === 'overview' ? 'true' : 'false'}">
        <span class="nav-stage__label">${esc(STAGE_LABELS[s])}</span>
        ${statusDot}
      </a>`;
  }).join('');

  // ── Hypothesis row builder (used inside idea stage) ──
  const hypothesesList = hypotheses.map((h) => {
    const cls = h.status === 'superseded' ? 'is-superseded' : '';
    const conf = h.status === 'superseded' ? `已迭代 → ${h.superseded_by ?? '?'}` : confidenceLabel(h.confidence);
    const confClass = h.status === 'superseded' ? 'tag--superseded'
      : h.confidence === 'high' ? 'tag--strong'
      : h.confidence === 'medium' ? 'tag--medium' : 'tag--weak';
    const tintClass = h.status === 'superseded' ? 'tint--superseded'
      : h.confidence === 'high' ? 'tint--strong'
      : h.confidence === 'medium' ? 'tint--medium' : 'tint--weak';
    const stars = h.verification_count > 0 ? '★'.repeat(Math.min(h.verification_count, 5)) : '·';
    return `
      <li class="row row--hypothesis ${cls} ${tintClass}" data-target="hypothesis" data-id="${esc(h.id)}">
        <span class="row-id">${esc(h.id)}</span>
        <span class="row-fact">${esc(h.fact)}</span>
        <span class="row-tag ${confClass}">${esc(conf)}</span>
        <span class="row-meta">${esc(testStatusLabel(h.test_status))}</span>
        <span class="row-meta row-stars">${stars}</span>
      </li>`;
  }).join('');

  const decisionsList = decisions.slice().reverse().map((d) => {
    const date = d.at.slice(0, 10);
    const time = d.at.slice(11, 16);
    const glyph = d.type === 'taste' ? '◇' : d.type === 'mechanical' ? '○' : '◆';
    const glyphClass = d.type === 'taste' ? 'glyph--taste'
      : d.type === 'mechanical' ? 'glyph--mech' : 'glyph--challenge';
    return `
      <li class="row row--decision" data-target="decision" data-id="${esc(d.id)}">
        <span class="row-id">${esc(d.id)}</span>
        <span class="row-date"><time>${date}</time><span class="row-time">${time}</span></span>
        <span class="row-fact"><span class="row-glyph ${glyphClass}">${glyph}</span> ${esc(d.decision)}</span>
        <span class="row-tag tag--ghost">${esc(decisionTypeLabel(d.type))}</span>
        <span class="row-meta">${esc(d.by)}</span>
      </li>`;
  }).join('');

  // ── Empty-state component ──
  const emptyState = (stageLabel: string, skillHint: string) => `
    <div class="empty-card">
      <div class="empty-card__title">还没有「${esc(stageLabel)}」内容</div>
      <div class="empty-card__hint">下一步：在你的 AI 宿主里运行 skill</div>
      <div class="empty-card__skill"><code>${esc(skillHint)}</code></div>
      <button class="btn-ghost" data-copy-prompt="${esc(skillHint)}">复制提示词</button>
    </div>`;

  // ── KPI grid for overview ──
  const kpiGrid = `
    <div class="kpi-grid">
      <div class="kpi kpi--hyp"><div class="kpi__label">活跃假设</div><div class="kpi__value">${active.length}</div><div class="kpi__sub">总 ${hypotheses.length} · 已迭代 ${superseded.length}</div></div>
      <div class="kpi kpi--verified"><div class="kpi__label">已验证</div><div class="kpi__value">${verified}</div><div class="kpi__sub">通过测试</div></div>
      <div class="kpi kpi--dec"><div class="kpi__label">决策</div><div class="kpi__value">${decisions.length}</div><div class="kpi__sub">累计</div></div>
      <div class="kpi kpi--stage"><div class="kpi__label">阶段进度</div><div class="kpi__value">${stagesDone.length}/6</div><div class="kpi__sub">已完成</div></div>
    </div>`;

  // ── Progress mini ──
  const progRow = STAGES.filter((s) => s !== 'overview').map((s, i) => {
    const done = stageStatus[s];
    const cur = s === currentStage;
    const cls = done ? 'is-done' : cur ? 'is-current' : 'is-pending';
    return `<div class="prog-cell ${cls}"><span class="prog-roman">${['I','II','III','IV','V','VI'][i]}</span><span class="prog-label">${esc(STAGE_LABELS[s])}</span></div>`;
  }).join('');

  // ── Recent decisions (overview) ──
  const recentDecisions = decisions.slice().reverse().slice(0, 5).map((d) => `
    <li class="row row--decision" data-target="decision" data-id="${esc(d.id)}">
      <span class="row-id">${esc(d.at.slice(5, 10))}</span>
      <span class="row-fact">${esc(d.decision)}</span>
      <span class="row-tag tag--ghost">${esc(decisionTypeLabel(d.type))}</span>
    </li>`).join('');

  // ── Stage section builders ──
  const stageOverview = `
    <section class="stage" data-stage="overview">
      ${oneLiner ? `<p class="stage-deck">${esc(oneLiner)}</p>` : ''}
      ${kpiGrid}
      <header class="section__head">
        <h2 class="section__title">阶段进度</h2>
        <span class="section__count">${stagesDone.length} / 6 已完成</span>
      </header>
      <div class="prog-row">${progRow}</div>
      <header class="section__head" style="margin-top:24px;">
        <h2 class="section__title">最近决策</h2>
        <span class="section__count">展示 5 条</span>
      </header>
      ${decisions.length === 0
        ? `<p class="empty">尚无决策。</p>`
        : `<ul class="rows rows--decisions-mini" data-rows-decisions>${recentDecisions}</ul>`}
    </section>`;

  const stageIdea = `
    <section class="stage" data-stage="idea" hidden>
      ${brief.trim() ? `
        <header class="section__head">
          <h2 class="section__title">项目简报</h2>
          <span class="section__count">project_brief.md</span>
        </header>
        <article class="md-card md-content">${renderMarkdown(brief)}</article>
      ` : ''}
      ${audience.trim() ? `
        <header class="section__head" style="margin-top:20px;">
          <h2 class="section__title">目标受众</h2>
          <span class="section__count">audience.md</span>
        </header>
        <article class="md-card md-content">${renderMarkdown(audience)}</article>
      ` : ''}
      <header class="section__head" style="margin-top:20px;">
        <h2 class="section__title">初始假设</h2>
        <span class="section__count">${active.length} 活跃 · ${superseded.length} 已迭代</span>
        <div class="seg-group" role="tablist">
          <button class="seg-btn is-active" data-view="list">列表</button>
          <button class="seg-btn" data-view="table" title="即将上线">表格</button>
          <button class="seg-btn" data-view="board" title="即将上线">看板</button>
        </div>
      </header>
      ${hypotheses.length === 0
        ? `<p class="empty">尚无假设。</p>`
        : `<ul class="rows" id="hypotheses-rows">${hypothesesList}</ul>`}
    </section>`;

  const stageResearch = `
    <section class="stage" data-stage="research" hidden>
      ${stageStatus.research
        ? `<p class="empty">研究内容已存在，但当前面板还未实现可视化。</p>`
        : emptyState(STAGE_LABELS.research, STAGE_SKILL_HINT.research)}
    </section>`;

  const stageProduct = `
    <section class="stage" data-stage="product" hidden>
      ${productDef.trim()
        ? `<header class="section__head">
            <h2 class="section__title">产品定义</h2>
            <span class="section__count">product_definition.md</span>
          </header>
          <article class="md-card md-content">${renderMarkdown(productDef)}</article>`
        : emptyState(STAGE_LABELS.product, STAGE_SKILL_HINT.product)}
    </section>`;

  const stageBuild = `
    <section class="stage" data-stage="build" hidden>
      ${designDirection ? `
        <header class="section__head">
          <h2 class="section__title">设计方向</h2>
          <span class="section__count">design_direction.json</span>
        </header>
        <div class="design-card">
          <dl class="design-meta">
            <dt>预设</dt><dd>${esc(designDirection.preset ?? '—')}</dd>
            <dt>方差</dt><dd>${esc(designDirection.dials?.variance ?? '—')}</dd>
            <dt>动效</dt><dd>${esc(designDirection.dials?.motion ?? '—')}</dd>
            <dt>密度</dt><dd>${esc(designDirection.dials?.density ?? '—')}</dd>
          </dl>
          <div class="palette-row">
            ${designDirection.palette ? Object.entries(designDirection.palette).map(([k, v]) =>
              `<div class="swatch"><span class="swatch-chip" style="background:${esc(String(v))}"></span><span class="swatch-name">${esc(k)}</span><code class="swatch-val">${esc(String(v))}</code></div>`
            ).join('') : ''}
          </div>
        </div>
      ` : emptyState(STAGE_LABELS.build, STAGE_SKILL_HINT.build)}
    </section>`;

  const stageLaunch = `
    <section class="stage" data-stage="launch" hidden>
      ${stageStatus.launch
        ? `<p class="empty">启动资产已存在，但当前面板还未实现可视化。</p>`
        : emptyState(STAGE_LABELS.launch, STAGE_SKILL_HINT.launch)}
    </section>`;

  const stageRetro = `
    <section class="stage" data-stage="retro" hidden>
      ${reviewReport.trim()
        ? `<header class="section__head">
            <h2 class="section__title">复盘报告</h2>
            <span class="section__count">review_report.md</span>
          </header>
          <article class="md-card md-content">${renderMarkdown(reviewReport)}</article>`
        : ''}
      <header class="section__head" style="margin-top:20px;">
        <h2 class="section__title">完整决策时间线</h2>
        <span class="section__count">共 ${decisions.length} 条</span>
      </header>
      ${decisions.length === 0
        ? emptyState(STAGE_LABELS.retro, STAGE_SKILL_HINT.retro)
        : `<ul class="rows">${decisionsList}</ul>`}
    </section>`;

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(ventureName)} · Workspace</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<style>
:root {
  --bg:        oklch(97% 0.012 80);
  --surface:   oklch(99% 0.006 80);
  --surface-2: oklch(95% 0.014 80);
  --sidebar:   oklch(95% 0.014 80);
  --ink:       oklch(15% 0.018 60);
  --ink-2:     oklch(28% 0.015 60);
  --mute:      oklch(50% 0.014 60);
  --mute-2:    oklch(65% 0.012 60);
  --hairline:  oklch(86% 0.012 60);
  --hairline-strong: oklch(78% 0.014 60);
  --accent:    ${accent};
  --accent-soft: oklch(95% 0.04 28);
  --accent-tint: oklch(92% 0.05 28);
  --moss:      oklch(45% 0.12 145);
  --moss-soft: oklch(97% 0.02 145);
  --ochre:     oklch(58% 0.14 70);
  --ochre-soft: oklch(97% 0.02 70);
  --ash-soft:  oklch(96% 0.008 60);

  --sans: "Geist", system-ui, -apple-system, "PingFang SC", "Hiragino Sans GB", sans-serif;
  --mono: "JetBrains Mono", ui-monospace, Menlo, monospace;

  --nav-w: 220px;
  --panel-w: 360px;
  --top-h: 48px;
  --resizer-w: 4px;

  --r-sm: 4px;
  --r-md: 6px;
  --r-lg: 10px;
  --r-xl: 12px;

  --shadow-soft: 0 1px 2px oklch(20% 0.02 60 / 0.04), 0 0 0 1px oklch(86% 0.012 60 / 0.5);
  --shadow-panel: -8px 0 24px oklch(20% 0.02 60 / 0.05);

  --ease: cubic-bezier(0.16, 1, 0.3, 1);
}

* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { height: 100%; overflow: hidden; }
body {
  font-family: var(--sans);
  background: var(--bg);
  color: var(--ink);
  font-size: 14px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}
button { font: inherit; color: inherit; background: none; border: 0; cursor: pointer; }
a { color: inherit; text-decoration: none; cursor: pointer; }
ol, ul { list-style: none; }
kbd {
  font-family: var(--mono); font-size: 0.85em;
  background: var(--surface-2); border: 1px solid var(--hairline);
  border-radius: 3px; padding: 0 4px;
}

/* ───────── TOP BAR ───────── */
.topbar {
  height: var(--top-h);
  display: grid;
  grid-template-columns: var(--nav-w) 1fr auto;
  align-items: center;
  border-bottom: 1px solid var(--hairline);
  background: var(--surface);
  padding-right: 16px;
}
.topbar__brand {
  padding: 0 16px;
  display: flex; align-items: center; gap: 8px;
  font-family: var(--mono);
  font-size: 12px;
  letter-spacing: 0.06em;
  font-weight: 600;
  color: var(--ink);
  border-right: 1px solid var(--hairline);
  height: 100%;
}
.topbar__brand .diamond {
  width: 10px; height: 10px;
  background: var(--accent);
  transform: rotate(45deg);
  display: inline-block;
}
.topbar__center {
  display: flex; align-items: center; gap: 12px;
  padding-left: 16px;
  font-family: var(--mono);
  font-size: 12px;
  color: var(--mute);
}
.topbar__center .slug { color: var(--ink); font-weight: 500; }
.topbar__center .sep { color: var(--hairline-strong); }
.topbar__center .stage-pill {
  padding: 3px 10px;
  background: var(--accent-soft);
  color: var(--accent);
  border-radius: 999px;
  font-weight: 500;
  letter-spacing: 0.02em;
  font-size: 11px;
}
.topbar__actions { display: flex; gap: 6px; }

/* ───── Buttons (clear affordance) ───── */
.btn-ghost {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 14px;
  font-size: 12.5px;
  color: var(--ink-2);
  border: 1px solid var(--hairline);
  border-radius: var(--r-md);
  background: var(--surface);
  cursor: pointer;
  transition: all 140ms var(--ease);
  height: 30px;
  white-space: nowrap;
}
.btn-ghost:hover { border-color: var(--accent); color: var(--ink); background: var(--surface-2); }
.btn-ghost:active { background: var(--accent-soft); }
.btn-primary {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 14px;
  font-size: 12.5px;
  background: var(--ink);
  color: var(--surface);
  border-radius: var(--r-md);
  cursor: pointer;
  height: 30px;
  transition: background 140ms var(--ease);
}
.btn-primary:hover { background: var(--accent); }

/* Segmented control */
.seg-group {
  margin-left: auto;
  display: inline-flex;
  border: 1px solid var(--hairline);
  border-radius: var(--r-md);
  overflow: hidden;
  background: var(--surface);
  height: 28px;
}
.seg-btn {
  padding: 0 12px;
  font-size: 12px;
  color: var(--mute);
  border-right: 1px solid var(--hairline);
  cursor: pointer;
  height: 100%;
  transition: all 140ms var(--ease);
}
.seg-btn:last-child { border-right: 0; }
.seg-btn:hover:not(.is-active) { color: var(--ink-2); background: var(--surface-2); }
.seg-btn.is-active {
  background: var(--accent-soft);
  color: var(--accent);
  font-weight: 500;
}

/* ───────── SHELL ───────── */
.shell {
  display: grid;
  grid-template-columns: var(--nav-w) var(--resizer-w) 1fr var(--resizer-w) var(--panel-w);
  height: calc(100% - var(--top-h));
}
.shell.is-dragging { user-select: none; cursor: col-resize; }
.shell.is-dragging * { cursor: col-resize !important; }
.shell.panel-closed {
  grid-template-columns: var(--nav-w) var(--resizer-w) 1fr 0 0;
}
.shell.panel-closed .resizer--right { display: none; }

/* Column resizers */
.resizer {
  position: relative;
  background: transparent;
  cursor: col-resize;
  z-index: 6;
  transition: background 140ms var(--ease);
}
.resizer::before {
  content: '';
  position: absolute;
  inset: 0;
  margin: 0 auto;
  width: 1px;
  background: var(--hairline);
  transition: width 140ms var(--ease), background 140ms var(--ease);
}
.resizer:hover::before,
.resizer.is-active::before {
  width: 2px;
  background: var(--accent);
}

/* ───────── LEFT NAV (stage switcher) ───────── */
.nav {
  background: var(--sidebar);
  border-right: 1px solid var(--hairline);
  overflow-y: auto;
  padding: 14px 10px;
  font-size: 13px;
  display: flex; flex-direction: column;
  gap: 2px;
}
.nav::-webkit-scrollbar { width: 6px; }
.nav::-webkit-scrollbar-thumb { background: var(--hairline-strong); border-radius: 3px; }

.nav-venture {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 10px;
  font-family: var(--mono);
  font-size: 11.5px;
  letter-spacing: 0.04em;
  font-weight: 600;
  color: var(--ink);
  margin-bottom: 8px;
}
.nav-venture .nav-dot {
  width: 6px; height: 6px;
  background: var(--accent);
  border-radius: 50%;
  display: inline-block;
}

.nav-stage {
  position: relative;
  display: flex; align-items: center;
  padding: 7px 12px 7px 14px;
  border-radius: 8px;
  color: var(--ink-2);
  cursor: pointer;
  font-size: 13.5px;
  line-height: 1.3;
  transition: background 140ms var(--ease), color 140ms var(--ease);
}
.nav-stage::before {
  content: '';
  position: absolute;
  left: 4px; top: 50%;
  transform: translateY(-50%);
  width: 3px; height: 0;
  background: var(--accent);
  border-radius: 2px;
  transition: height 160ms var(--ease);
}
.nav-stage:hover { background: oklch(92% 0.016 80); color: var(--ink); }
.nav-stage[data-active="true"] {
  background: var(--accent-soft);
  color: var(--ink);
  font-weight: 500;
}
.nav-stage[data-active="true"]::before { height: 18px; }
.nav-stage__label { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.nav-stage__dot {
  font-family: var(--mono);
  font-size: 11px;
  color: var(--mute-2);
  width: 16px; text-align: center;
  flex-shrink: 0;
}
.nav-stage__dot.is-done { color: var(--moss); }
.nav-stage__dot.is-current { color: var(--accent); }

.nav-divider {
  height: 1px;
  background: var(--hairline);
  margin: 12px 6px;
}
.nav-section-label {
  font-family: var(--mono);
  font-size: 10.5px;
  letter-spacing: 0.1em;
  color: var(--mute);
  padding: 0 12px 4px;
}
.nav-item--minor {
  display: flex;
  align-items: center;
  padding: 6px 12px;
  color: var(--mute);
  font-size: 12px;
  border-radius: 6px;
  cursor: pointer;
}
.nav-item--minor:hover { background: oklch(92% 0.016 80); color: var(--ink-2); }

/* ───────── MAIN ───────── */
.main {
  background: var(--bg);
  overflow-y: auto;
  display: flex; flex-direction: column;
}
.main::-webkit-scrollbar { width: 8px; }
.main::-webkit-scrollbar-thumb { background: var(--hairline-strong); border-radius: 4px; }

.main__breadcrumb {
  position: sticky;
  top: 0;
  z-index: 5;
  background: var(--bg);
  padding: 12px 28px;
  font-family: var(--mono);
  font-size: 11.5px;
  letter-spacing: 0.04em;
  color: var(--mute);
  border-bottom: 1px solid var(--hairline);
  display: flex; align-items: center; gap: 8px;
}
.main__breadcrumb .crumb-sep { color: var(--hairline-strong); }
.main__breadcrumb .crumb-current { color: var(--ink); font-weight: 500; }

.main__content { padding: 16px 28px 64px; }

.stage[hidden] { display: none; }

.stage-deck {
  font-size: 18px;
  line-height: 1.5;
  color: var(--ink);
  font-weight: 500;
  margin-bottom: 18px;
  padding: 14px 18px;
  background: var(--surface);
  border-radius: var(--r-xl);
  border-left: 3px solid var(--accent);
  box-shadow: var(--shadow-soft);
}

.section__head {
  display: flex; align-items: center; gap: 12px;
  margin: 16px 0 12px;
}
.section__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--ink);
}
.section__count {
  font-family: var(--mono);
  font-size: 11.5px;
  color: var(--mute);
  letter-spacing: 0.02em;
}

/* Progress mini */
.prog-row {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 4px;
  background: var(--surface);
  border-radius: var(--r-xl);
  padding: 4px;
  box-shadow: var(--shadow-soft);
}
.prog-cell {
  padding: 12px 8px;
  text-align: center;
  border-radius: var(--r-md);
  display: flex; flex-direction: column; gap: 4px;
  position: relative;
}
.prog-cell .prog-roman {
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: 0.12em;
  color: var(--mute-2);
}
.prog-cell .prog-label {
  font-size: 12px;
  color: var(--ink-2);
}
.prog-cell.is-done { background: oklch(96% 0.014 80); }
.prog-cell.is-done .prog-roman { color: var(--moss); }
.prog-cell.is-current {
  background: var(--accent-soft);
}
.prog-cell.is-current .prog-roman { color: var(--accent); font-weight: 700; }
.prog-cell.is-current .prog-label { color: var(--accent); font-weight: 500; }
.prog-cell.is-pending .prog-roman { color: var(--mute-2); }
.prog-cell.is-pending .prog-label { color: var(--mute-2); }

/* Rows */
.rows {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.row {
  display: grid;
  align-items: center;
  gap: 14px;
  padding: 12px 14px 12px 18px;
  background: var(--surface);
  border-radius: var(--r-lg);
  cursor: pointer;
  transition: background 120ms var(--ease), box-shadow 160ms var(--ease), transform 160ms var(--ease);
  font-size: 13px;
  position: relative;
  box-shadow: var(--shadow-soft);
  overflow: hidden;
}
.row::before {
  content: '';
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 3px;
  background: var(--hairline-strong);
  border-radius: var(--r-lg) 0 0 var(--r-lg);
}
.row:hover {
  box-shadow: 0 2px 6px oklch(20% 0.02 60 / 0.06), 0 0 0 1px oklch(86% 0.012 60 / 0.7);
  transform: translateY(-1px);
}
.row.is-active {
  background: var(--accent-soft);
  box-shadow: 0 0 0 1.5px var(--accent);
}

.row--hypothesis {
  grid-template-columns: 56px 1fr 92px 80px 80px;
}
.row--hypothesis.tint--strong { background: color-mix(in oklch, var(--moss-soft) 60%, var(--surface)); }
.row--hypothesis.tint--strong::before { background: var(--moss); }
.row--hypothesis.tint--medium { background: color-mix(in oklch, var(--ochre-soft) 50%, var(--surface)); }
.row--hypothesis.tint--medium::before { background: var(--ochre); }
.row--hypothesis.tint--weak::before { background: var(--mute-2); }
.row--hypothesis.tint--superseded::before { background: var(--accent); }
.row--hypothesis.is-superseded { opacity: 0.6; }
.row--hypothesis.is-superseded .row-fact {
  text-decoration: line-through;
  text-decoration-color: var(--mute-2);
}

.row--decision {
  grid-template-columns: 56px 110px 1fr 110px 64px;
}
.row--decision::before { background: var(--hairline); }
.rows--decisions-mini .row--decision {
  grid-template-columns: 60px 1fr 110px;
}
.row-glyph { margin-right: 4px; font-size: 0.95em; }
.glyph--challenge { color: var(--accent); }
.glyph--taste { color: var(--ochre); }
.glyph--mech { color: var(--mute); }

.row-id {
  font-family: var(--mono);
  font-size: 11.5px;
  color: var(--mute);
  font-weight: 600;
  letter-spacing: 0.02em;
}
.row-fact {
  color: var(--ink);
  font-size: 13.5px;
  line-height: 1.4;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.row-date {
  font-family: var(--mono);
  font-size: 11px;
  color: var(--ink-2);
  display: flex; flex-direction: column; line-height: 1.2;
}
.row-date time { color: var(--ink); font-weight: 500; }
.row-time { color: var(--mute); font-size: 10.5px; letter-spacing: 0.02em; }

.row-meta {
  font-family: var(--mono);
  font-size: 11px;
  color: var(--mute);
  letter-spacing: 0.02em;
  text-align: left;
}
.row-stars {
  color: var(--accent);
  font-family: var(--mono);
  letter-spacing: 0.18em;
  font-size: 11px;
}

/* Pills (non-interactive — no border, generous padding, no uppercase) */
.row-tag {
  font-size: 11px;
  letter-spacing: 0.01em;
  padding: 3px 10px;
  border-radius: 999px;
  font-weight: 500;
  text-align: center;
  white-space: nowrap;
  line-height: 1.4;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.tag--strong { color: var(--moss); background: oklch(94% 0.05 145); }
.tag--medium { color: oklch(40% 0.13 70); background: oklch(95% 0.06 70); }
.tag--weak   { color: var(--mute); background: oklch(93% 0.008 80); }
.tag--superseded { color: var(--accent); background: var(--accent-soft); }
.tag--ghost {
  color: var(--mute);
  background: var(--surface-2);
}

/* Empty state card */
.empty {
  font-style: italic;
  color: var(--mute);
  padding: 16px 0;
  font-size: 13px;
}
.empty-card {
  margin: 24px auto;
  max-width: 520px;
  text-align: center;
  background: var(--surface);
  border-radius: var(--r-xl);
  padding: 32px 28px;
  box-shadow: var(--shadow-soft);
}
.empty-card__title {
  font-size: 15px;
  font-weight: 500;
  color: var(--ink);
  margin-bottom: 14px;
}
.empty-card__hint {
  color: var(--mute);
  font-size: 13px;
  margin-bottom: 8px;
}
.empty-card__skill {
  margin-bottom: 16px;
}
.empty-card__skill code {
  font-family: var(--mono);
  font-size: 12.5px;
  color: var(--accent);
  background: var(--accent-soft);
  padding: 4px 10px;
  border-radius: var(--r-sm);
}

/* Design card (build stage) */
.design-card {
  background: var(--surface);
  border-radius: var(--r-xl);
  padding: 20px 24px;
  box-shadow: var(--shadow-soft);
}
.design-meta {
  display: grid;
  grid-template-columns: 80px 1fr 80px 1fr;
  gap: 8px 12px;
  font-family: var(--mono);
  font-size: 12px;
  margin-bottom: 18px;
}
.design-meta dt { color: var(--mute); font-size: 11px; }
.design-meta dd { color: var(--ink); }
.palette-row {
  display: flex; flex-wrap: wrap; gap: 12px;
}
.swatch {
  display: flex; align-items: center; gap: 8px;
  background: var(--surface-2);
  padding: 6px 10px;
  border-radius: var(--r-md);
}
.swatch-chip {
  width: 18px; height: 18px;
  border-radius: 4px;
  border: 1px solid var(--hairline);
  flex-shrink: 0;
}
.swatch-name { font-size: 12px; color: var(--ink-2); }
.swatch-val { font-family: var(--mono); font-size: 10.5px; color: var(--mute); }

/* Markdown card */
.md-card {
  background: var(--surface);
  border-radius: var(--r-xl);
  padding: 24px 28px;
  box-shadow: var(--shadow-soft);
  color: var(--ink-2);
}
.md-content h1, .md-content h2, .md-content h3,
.md-content h4, .md-content h5, .md-content h6 {
  color: var(--ink);
  font-weight: 600;
  line-height: 1.3;
}
.md-content h1 { font-size: 1.5rem; margin: 1.5rem 0 0.5rem; }
.md-content h1:first-child { margin-top: 0; }
.md-content h2 { font-size: 1.15rem; margin: 1.2rem 0 0.4rem; }
.md-content h3 { font-size: 1rem; margin: 1rem 0 0.3rem; color: var(--ink-2); }
.md-content h4, .md-content h5, .md-content h6 { font-size: 0.95rem; margin: 0.8rem 0 0.2rem; color: var(--ink-2); }
.md-content p { line-height: 1.65; margin: 0.5rem 0; font-size: 14px; }
.md-content ul, .md-content ol { padding-left: 1.5rem; margin: 0.5rem 0; }
.md-content ul { list-style: disc; }
.md-content ol { list-style: decimal; }
.md-content li { line-height: 1.65; margin: 0.2rem 0; }
.md-content code {
  font-family: var(--mono); font-size: 0.85em;
  background: var(--surface-2);
  padding: 0.1em 0.4em;
  border-radius: 3px;
  color: var(--ink);
}
.md-content pre {
  margin: 0.8rem 0;
}
.md-content pre code {
  display: block;
  padding: 0.75rem 1rem;
  background: var(--surface-2);
  border-radius: var(--r-md);
  overflow-x: auto;
  font-size: 12.5px;
  line-height: 1.55;
}
.md-content blockquote {
  border-left: 3px solid var(--accent);
  padding: 0.5rem 0 0.5rem 1rem;
  color: var(--ink-2);
  margin: 1rem 0;
  background: var(--accent-soft);
  border-radius: 0 var(--r-md) var(--r-md) 0;
}
.md-content blockquote p { margin: 0.2rem 0; }
.md-content a { color: var(--accent); text-decoration: underline; text-underline-offset: 2px; }
.md-content hr { border: 0; border-top: 1px solid var(--hairline); margin: 1.5rem 0; }
.md-content strong { font-weight: 600; color: var(--ink); }
.md-content em { font-style: italic; }

/* KPI grid */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-bottom: 18px;
}
@media (max-width: 1100px) { .kpi-grid { grid-template-columns: repeat(2, 1fr); } }
.kpi {
  background: var(--surface);
  border-radius: var(--r-xl);
  padding: 14px 16px;
  box-shadow: var(--shadow-soft);
  position: relative;
  overflow: hidden;
}
.kpi::after {
  content: '';
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 3px;
  background: var(--mute-2);
}
.kpi--hyp::after { background: var(--mute); }
.kpi--dec { background: color-mix(in oklch, var(--ochre-soft) 40%, var(--surface)); }
.kpi--dec::after { background: var(--ochre); }
.kpi--stage { background: color-mix(in oklch, var(--moss-soft) 45%, var(--surface)); }
.kpi--stage::after { background: var(--moss); }
.kpi--verified { background: var(--accent-soft); }
.kpi--verified::after { background: var(--accent); }
.kpi__label {
  font-family: var(--mono);
  font-size: 10.5px;
  letter-spacing: 0.06em;
  color: var(--mute);
  margin-bottom: 4px;
}
.kpi__value {
  font-size: 24px;
  font-weight: 500;
  color: var(--ink);
  font-family: var(--mono);
  letter-spacing: -0.02em;
}
.kpi__sub {
  font-family: var(--mono);
  font-size: 11px;
  color: var(--mute);
  margin-top: 2px;
}

/* ───────── RIGHT PANEL (drawer, no nested borders) ───────── */
.panel {
  background: var(--surface);
  overflow-y: auto;
  overflow-x: hidden;
  display: flex; flex-direction: column;
  transition: opacity 180ms var(--ease);
  border-radius: var(--r-xl) 0 0 var(--r-xl);
  margin: 8px 8px 8px 0;
  box-shadow: var(--shadow-panel), 0 0 0 1px oklch(86% 0.012 60 / 0.6);
  position: relative;
}
.panel::before {
  content: '';
  position: absolute;
  inset: 0 0 auto 0;
  height: 56px;
  background: linear-gradient(180deg, var(--panel-tint, oklch(96% 0.018 60)) 0%, transparent 100%);
  border-radius: var(--r-xl) 0 0 0;
  pointer-events: none;
  z-index: 1;
}
.panel[data-confidence="high"] { --panel-tint: oklch(96% 0.035 145); }
.panel[data-confidence="medium"] { --panel-tint: oklch(96% 0.04 70); }
.panel[data-confidence="low"] { --panel-tint: oklch(96% 0.01 60); }
.panel[data-status="superseded"] { --panel-tint: var(--accent-soft); }
.shell.panel-closed .panel { opacity: 0; pointer-events: none; margin: 0; }
.panel::-webkit-scrollbar { width: 6px; }
.panel::-webkit-scrollbar-thumb { background: var(--hairline-strong); border-radius: 3px; }

.panel__head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 20px 8px;
  position: sticky; top: 0;
  background: transparent;
  z-index: 3;
}
.panel__title {
  font-family: var(--mono);
  font-size: 11px;
  letter-spacing: 0.08em;
  color: var(--mute);
  font-weight: 600;
}
.panel__close {
  width: 26px; height: 26px;
  display: flex; align-items: center; justify-content: center;
  border-radius: var(--r-sm);
  color: var(--mute);
  font-size: 16px;
  cursor: pointer;
  transition: background 140ms var(--ease);
}
.panel__close:hover { background: oklch(91% 0.018 80); color: var(--ink); }

.panel__body { padding: 4px 20px 24px; flex: 1; position: relative; z-index: 2; }

/* Panel inner sections — no border, hairline label instead */
.panel-id {
  font-family: var(--mono);
  font-size: 12px;
  color: var(--mute);
  margin-bottom: 8px;
  letter-spacing: 0.02em;
}
.panel-fact {
  font-size: 18px;
  line-height: 1.45;
  color: var(--ink);
  margin-bottom: 20px;
  font-weight: 500;
  letter-spacing: -0.005em;
}
.panel-fact.is-struck {
  text-decoration: line-through;
  text-decoration-color: var(--mute-2);
  color: var(--mute);
}

.panel-block {
  padding: 14px 0 0;
}
.panel-block + .panel-block { border-top: 1px solid var(--hairline); margin-top: 14px; }

.panel-block__label {
  font-family: var(--mono);
  font-size: 10.5px;
  letter-spacing: 0.1em;
  color: var(--mute);
  margin-bottom: 10px;
  font-weight: 600;
}
.panel-block p {
  font-size: 13.5px;
  line-height: 1.6;
  color: var(--ink-2);
}

.panel-meta-list {
  display: grid;
  grid-template-columns: 80px 1fr;
  gap: 8px 14px;
  font-family: var(--mono);
  font-size: 12px;
}
.panel-meta-list dt { color: var(--mute); font-size: 11px; align-self: center; }
.panel-meta-list dd { color: var(--ink); }
.panel-meta-list dd.is-prose { font-family: var(--sans); font-size: 13px; line-height: 1.5; }

.evidence-item {
  padding: 8px 12px;
  background: var(--ash-soft);
  border-left: 2px solid var(--accent);
  border-radius: 0 var(--r-md) var(--r-md) 0;
  margin-bottom: 8px;
}
.evidence-item:last-child { margin-bottom: 0; }
.evidence-item .ev-source {
  font-family: var(--mono);
  font-size: 11px;
  color: var(--accent);
  margin-bottom: 4px;
}
.evidence-item .ev-excerpt {
  font-size: 13px;
  color: var(--ink-2);
  line-height: 1.55;
  font-style: italic;
}

.panel-related {
  display: flex; flex-wrap: wrap; gap: 6px;
}
.panel-related a {
  font-family: var(--mono);
  font-size: 11px;
  padding: 4px 10px;
  background: var(--surface-2);
  border: 1px solid var(--hairline);
  border-radius: 999px;
  color: var(--ink-2);
  cursor: pointer;
  transition: all 140ms var(--ease);
}
.panel-related a:hover { border-color: var(--accent); color: var(--accent); }

.status-badge {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 11px;
  padding: 3px 10px;
  border-radius: 999px;
  font-weight: 500;
  line-height: 1.4;
}
.status-badge::before {
  content: ''; width: 6px; height: 6px; border-radius: 50%;
  background: currentColor;
}
.status-badge.is-passed { color: var(--moss); background: oklch(94% 0.05 145); }
.status-badge.is-pending { color: oklch(40% 0.13 70); background: oklch(95% 0.06 70); }
.status-badge.is-failed { color: var(--accent); background: var(--accent-soft); }
.status-badge.is-running { color: var(--ochre); background: oklch(95% 0.06 70); }

.panel-actions {
  display: flex; gap: 6px; flex-wrap: wrap;
  padding-top: 14px;
  margin-top: 14px;
  border-top: 1px solid var(--hairline);
}

/* Responsive */
@media (max-width: 1100px) {
  .shell { grid-template-columns: var(--nav-w) var(--resizer-w) 1fr 0 0; }
  .shell .resizer--right { display: none; }
  .shell .panel { position: fixed; right: 0; top: var(--top-h); bottom: 0; width: var(--panel-w); z-index: 10; margin: 0; border-radius: 0; }
  .shell.panel-closed .panel { transform: translateX(100%); }
}
@media (max-width: 760px) {
  :root { --nav-w: 0px; }
  .nav, .resizer { display: none; }
  .shell { grid-template-columns: 1fr; }
  .topbar { grid-template-columns: 1fr auto; }
  .topbar__brand { border-right: 0; }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
</style>
</head>
<body>

<header class="topbar">
  <div class="topbar__brand">
    <span class="diamond"></span>
    <span>LUMI LAB</span>
  </div>
  <div class="topbar__center">
    <span class="slug">${esc(ventureName)}</span>
    <span class="sep">/</span>
    <span>第 ${currentDay} / ${totalDays} 天</span>
    <span class="sep">·</span>
    <span class="stage-pill" id="topbar-stage">${esc(STAGE_LABELS[currentStage] ?? currentStage)}</span>
    <span class="sep">·</span>
    <span>迭代 ${esc(iteration)}</span>
  </div>
  <div class="topbar__actions">
    <button class="btn-ghost">分享</button>
    <button class="btn-primary">部署</button>
  </div>
</header>

<div class="shell" id="shell">

  <nav class="nav" id="nav">
    <div class="nav-venture">
      <span class="nav-dot"></span>
      <span>${esc(ventureName)}</span>
    </div>
    ${navStages}
    <div class="nav-divider"></div>
    <div class="nav-section-label">其他</div>
    <a class="nav-item--minor">全部 ventures</a>
    <a class="nav-item--minor">+ 新建 venture</a>
  </nav>

  <div class="resizer resizer--left" id="resizer-left" data-resizer="nav" role="separator" aria-orientation="vertical" aria-label="调整左侧导航宽度"></div>

  <main class="main" id="main">
    <div class="main__breadcrumb">
      <span>${esc(ventureName)}</span>
      <span class="crumb-sep">/</span>
      <span class="crumb-current" id="crumb-current">${esc(STAGE_LABELS.overview)}</span>
    </div>

    <div class="main__content" id="main-content">
      ${stageOverview}
      ${stageIdea}
      ${stageResearch}
      ${stageProduct}
      ${stageBuild}
      ${stageLaunch}
      ${stageRetro}
    </div>
  </main>

  <div class="resizer resizer--right" id="resizer-right" data-resizer="panel" role="separator" aria-orientation="vertical" aria-label="调整右侧详情面板宽度"></div>

  <aside class="panel" id="panel">
    <div class="panel__head">
      <span class="panel__title" id="panel-title">概览</span>
      <button class="panel__close" id="panel-close" title="关闭 (Esc)">×</button>
    </div>
    <div class="panel__body" id="panel-body">
      <!-- filled by JS -->
    </div>
  </aside>

</div>

<script>
const DATA = ${JSON.stringify(dataPayload)};
const STAGE_LABELS = ${JSON.stringify(STAGE_LABELS)};
const DECISION_TYPE_LABEL = ${JSON.stringify(DECISION_TYPE_LABEL)};

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const decisionTypeLabel = (t) => DECISION_TYPE_LABEL[t] ?? t;
const testStatusLabel = (s) => ({ passed:'已验证', pending:'待测试', failed:'已证伪', running:'测试中' }[s] ?? s);

function renderOverview() {
  const v = DATA.venture;
  const hCount = DATA.hypotheses.length;
  const aCount = DATA.hypotheses.filter(h => h.status === 'active').length;
  const sCount = DATA.hypotheses.filter(h => h.status === 'superseded').length;
  const verified = DATA.hypotheses.filter(h => h.test_status === 'passed').length;
  const dCount = DATA.decisions.length;
  return \`
    <div class="panel-id">venture overview</div>
    \${v.oneLiner ? \`<p class="panel-fact">\${esc(v.oneLiner)}</p>\` : ''}
    <div class="panel-block">
      <div class="panel-block__label">元数据</div>
      <dl class="panel-meta-list">
        <dt>阶段</dt><dd>\${esc(STAGE_LABELS[v.currentStage] ?? v.currentStage)}</dd>
        <dt>进度</dt><dd>\${v.currentDay} / \${v.totalDays} 天</dd>
        <dt>迭代</dt><dd>\${esc(v.iteration)}</dd>
        \${v.audience ? \`<dt>目标用户</dt><dd class="is-prose">\${esc(v.audience)}</dd>\` : ''}
      </dl>
    </div>
    <div class="panel-block">
      <div class="panel-block__label">数据快览</div>
      <dl class="panel-meta-list">
        <dt>活跃假设</dt><dd>\${aCount} / \${hCount}</dd>
        <dt>已验证</dt><dd>\${verified}</dd>
        <dt>已迭代</dt><dd>\${sCount}</dd>
        <dt>决策</dt><dd>\${dCount} 条</dd>
      </dl>
    </div>
    <div class="panel-block">
      <div class="panel-block__label">提示</div>
      <p>点击中区任意行查看详情。按 <kbd>Esc</kbd> 折叠面板。</p>
    </div>
  \`;
}

function renderHypothesis(id) {
  const h = DATA.hypotheses.find(x => x.id === id);
  if (!h) return renderOverview();
  const conf = h.status === 'superseded' ? '已迭代' : (h.confidence === 'high' ? '强信号' : h.confidence === 'medium' ? '中信号' : '弱信号');
  const statusKey = h.test_status;
  const statusLabel = testStatusLabel(statusKey);
  const struck = h.status === 'superseded' ? 'is-struck' : '';
  const ev = (h.evidence || []).map(e => \`
    <div class="evidence-item">
      <div class="ev-source">\${esc(e.source)}</div>
      <div class="ev-excerpt">"\${esc(e.excerpt)}"</div>
    </div>
  \`).join('');
  const related = (h.related_entities || []).map(r =>
    \`<a data-target="hypothesis" data-id="\${esc(r)}">\${esc(r)}</a>\`
  ).join('');
  return \`
    <div class="panel-id">\${esc(h.id)} · \${esc(h.category)}</div>
    <p class="panel-fact \${struck}">\${esc(h.fact)}</p>
    \${h.status === 'superseded' ? \`
      <div class="panel-block">
        <div class="panel-block__label">迭代去向</div>
        <p>→ <a data-target="hypothesis" data-id="\${esc(h.superseded_by)}" class="panel-link">\${esc(h.superseded_by)}（已迭代）</a></p>
        \${h.superseded_reason ? \`<p style="margin-top:6px;color:var(--mute);font-style:italic;">\${esc(h.superseded_reason)}</p>\` : ''}
      </div>
    \` : ''}
    <div class="panel-block">
      <div class="panel-block__label">元数据</div>
      <dl class="panel-meta-list">
        <dt>信号</dt><dd>\${esc(conf)}</dd>
        <dt>测试方法</dt><dd class="is-prose">\${esc(h.test_method || '—')}</dd>
        <dt>测试状态</dt><dd><span class="status-badge is-\${statusKey}">\${esc(statusLabel)}</span></dd>
        <dt>验证次数</dt><dd>\${h.verification_count} 次</dd>
        \${h.access_count != null ? \`<dt>访问</dt><dd>\${h.access_count} 次</dd>\` : ''}
        \${h.updated_at ? \`<dt>更新</dt><dd>\${esc(h.updated_at.slice(0,16).replace('T',' '))}</dd>\` : ''}
      </dl>
    </div>
    <div class="panel-block">
      <div class="panel-block__label">证据</div>
      \${ev || '<p style="color:var(--mute);font-style:italic;">尚无证据。</p>'}
    </div>
    \${related ? \`<div class="panel-block">
      <div class="panel-block__label">关联</div>
      <div class="panel-related">\${related}</div>
    </div>\` : ''}
    <div class="panel-actions">
      <button class="btn-ghost">编辑</button>
      <button class="btn-ghost">迭代为新版</button>
      <button class="btn-ghost">删除</button>
    </div>
  \`;
}

function renderDecision(id) {
  const d = DATA.decisions.find(x => x.id === id);
  if (!d) return renderOverview();
  const related = (d.related || []).map(r =>
    \`<a data-target="hypothesis" data-id="\${esc(r)}">\${esc(r)}</a>\`
  ).join('');
  return \`
    <div class="panel-id">\${esc(d.id)} · \${esc(decisionTypeLabel(d.type))}</div>
    <p class="panel-fact">\${esc(d.decision)}</p>
    <div class="panel-block">
      <div class="panel-block__label">元数据</div>
      <dl class="panel-meta-list">
        <dt>时间</dt><dd>\${esc(d.at.slice(0,16).replace('T',' '))}</dd>
        <dt>由谁</dt><dd>\${esc(d.by)}</dd>
        <dt>类型</dt><dd>\${esc(decisionTypeLabel(d.type))}</dd>
      </dl>
    </div>
    <div class="panel-block">
      <div class="panel-block__label">理由</div>
      <p>\${esc(d.rationale)}</p>
    </div>
    \${related ? \`<div class="panel-block">
      <div class="panel-block__label">关联假设</div>
      <div class="panel-related">\${related}</div>
    </div>\` : ''}
    <div class="panel-actions">
      <button class="btn-ghost">编辑</button>
      <button class="btn-ghost">删除</button>
    </div>
  \`;
}

const shell = document.getElementById('shell');
const panel = document.getElementById('panel');
const panelBody = document.getElementById('panel-body');
const panelTitle = document.getElementById('panel-title');
const crumbCurrent = document.getElementById('crumb-current');
const topbarStage = document.getElementById('topbar-stage');

function setPanelTint(target, id) {
  panel.removeAttribute('data-confidence');
  panel.removeAttribute('data-status');
  if (target === 'hypothesis' && id) {
    const h = DATA.hypotheses.find(x => x.id === id);
    if (h) {
      panel.setAttribute('data-confidence', h.confidence);
      panel.setAttribute('data-status', h.status);
    }
  }
}

function openPanel(target, id) {
  if (shell.classList.contains('panel-closed')) {
    shell.classList.remove('panel-closed');
    restorePanelWidth();
  }
  document.querySelectorAll('.row.is-active').forEach(el => el.classList.remove('is-active'));
  setPanelTint(target, id);

  if (target === 'hypothesis' && id) {
    panelTitle.textContent = '假设详情';
    panelBody.innerHTML = renderHypothesis(id);
    document.querySelectorAll(\`.row[data-target="hypothesis"][data-id="\${id}"]\`).forEach(el => el.classList.add('is-active'));
  } else if (target === 'decision' && id) {
    panelTitle.textContent = '决策详情';
    panelBody.innerHTML = renderDecision(id);
    document.querySelectorAll(\`.row[data-target="decision"][data-id="\${id}"]\`).forEach(el => el.classList.add('is-active'));
  } else {
    panelTitle.textContent = '概览';
    panelBody.innerHTML = renderOverview();
  }
}

// ── Stage switching (no scroll, no hash) ──
function switchStage(stage) {
  document.querySelectorAll('.nav-stage').forEach(el => {
    el.setAttribute('data-active', el.dataset.stage === stage ? 'true' : 'false');
  });
  document.querySelectorAll('.stage').forEach(el => {
    el.hidden = el.dataset.stage !== stage;
  });
  if (crumbCurrent) crumbCurrent.textContent = STAGE_LABELS[stage] ?? stage;
  if (topbarStage) topbarStage.textContent = STAGE_LABELS[stage] ?? stage;
  // reset main scroll to top of stage
  const main = document.getElementById('main');
  if (main) main.scrollTop = 0;
}

// Initial panel
openPanel('overview');

// Delegated click
document.addEventListener('click', (e) => {
  // Stage nav
  const navStage = e.target.closest('.nav-stage');
  if (navStage && navStage.dataset.stage) {
    switchStage(navStage.dataset.stage);
    return;
  }
  // Row click → update panel only (no scroll)
  const row = e.target.closest('.row');
  if (row && row.dataset.target) {
    openPanel(row.dataset.target, row.dataset.id);
    return;
  }
  // Panel inline link
  const panelLink = e.target.closest('.panel-related a, .panel-link, a[data-target]');
  if (panelLink && panelLink.dataset.target) {
    openPanel(panelLink.dataset.target, panelLink.dataset.id);
    return;
  }
  // Segmented view toggle (display only)
  const segBtn = e.target.closest('.seg-btn');
  if (segBtn) {
    const group = segBtn.parentElement;
    group.querySelectorAll('.seg-btn').forEach(b => b.classList.toggle('is-active', b === segBtn));
    return;
  }
  // Copy prompt
  const copyBtn = e.target.closest('[data-copy-prompt]');
  if (copyBtn) {
    const skill = copyBtn.dataset.copyPrompt;
    const prompt = \`在我的 lumilab venture 工作目录里运行 \${skill} skill\`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(prompt).then(() => {
        const orig = copyBtn.textContent;
        copyBtn.textContent = '已复制 ✓';
        setTimeout(() => { copyBtn.textContent = orig; }, 1400);
      });
    }
    return;
  }
});

/* ───── Resizable columns ───── */
const LS_NAV = 'lumilab-workspace-nav-w';
const LS_PANEL = 'lumilab-workspace-panel-w';
const NAV_MIN = 180, NAV_MAX = 320;
const PANEL_MIN = 280, PANEL_MAX = 560;
const MIDDLE_MIN = 320;

let lastPanelW = 360;

function getRootPx(varName) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  return parseFloat(v) || 0;
}
function setNavW(px) {
  const clamped = Math.max(NAV_MIN, Math.min(NAV_MAX, px));
  document.documentElement.style.setProperty('--nav-w', clamped + 'px');
  try { localStorage.setItem(LS_NAV, String(clamped)); } catch (e) {}
}
function setPanelW(px) {
  const clamped = Math.max(PANEL_MIN, Math.min(PANEL_MAX, px));
  document.documentElement.style.setProperty('--panel-w', clamped + 'px');
  lastPanelW = clamped;
  try { localStorage.setItem(LS_PANEL, String(clamped)); } catch (e) {}
}
function restorePanelWidth() {
  document.documentElement.style.setProperty('--panel-w', lastPanelW + 'px');
}

try {
  const navW = parseFloat(localStorage.getItem(LS_NAV) || '');
  if (!isNaN(navW)) setNavW(navW);
  const panelW = parseFloat(localStorage.getItem(LS_PANEL) || '');
  if (!isNaN(panelW)) setPanelW(panelW);
} catch (e) {}

function bindResizer(el, which) {
  let startX = 0, startNav = 0, startPanel = 0;

  el.addEventListener('pointerdown', (e) => {
    if (window.innerWidth <= 900) return;
    if (which === 'panel' && shell.classList.contains('panel-closed')) return;
    e.preventDefault();
    startX = e.clientX;
    startNav = getRootPx('--nav-w');
    startPanel = getRootPx('--panel-w');
    el.classList.add('is-active');
    shell.classList.add('is-dragging');
    el.setPointerCapture(e.pointerId);
  });

  el.addEventListener('pointermove', (e) => {
    if (!el.hasPointerCapture(e.pointerId)) return;
    const dx = e.clientX - startX;
    const shellW = shell.getBoundingClientRect().width;
    if (which === 'nav') {
      let next = startNav + dx;
      const panelW = shell.classList.contains('panel-closed') ? 0 : startPanel;
      const maxByMiddle = shellW - panelW - MIDDLE_MIN - 8;
      next = Math.min(next, maxByMiddle);
      setNavW(next);
    } else {
      let next = startPanel - dx;
      const maxByMiddle = shellW - startNav - MIDDLE_MIN - 8;
      next = Math.min(next, maxByMiddle);
      setPanelW(next);
    }
  });

  const release = (e) => {
    if (el.hasPointerCapture && e.pointerId != null && el.hasPointerCapture(e.pointerId)) {
      el.releasePointerCapture(e.pointerId);
    }
    el.classList.remove('is-active');
    shell.classList.remove('is-dragging');
  };
  el.addEventListener('pointerup', release);
  el.addEventListener('pointercancel', release);

  el.addEventListener('dblclick', () => {
    if (which === 'nav') setNavW(220);
    else setPanelW(360);
  });
}

bindResizer(document.getElementById('resizer-left'), 'nav');
bindResizer(document.getElementById('resizer-right'), 'panel');

document.getElementById('panel-close').addEventListener('click', () => {
  lastPanelW = getRootPx('--panel-w') || lastPanelW;
  shell.classList.add('panel-closed');
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    lastPanelW = getRootPx('--panel-w') || lastPanelW;
    shell.classList.add('panel-closed');
  }
});
</script>
</body>
</html>`;
}

async function main() {
  const ventureDir = process.argv[2];
  if (!ventureDir) {
    console.error('Usage: bun run variant-workspace.ts <venture-dir>');
    process.exit(1);
  }
  const absDir = resolve(ventureDir);
  if (!existsSync(absDir)) {
    console.error(`Venture dir not found: ${absDir}`);
    process.exit(1);
  }

  const html = render(absDir);
  const outDir = join(absDir, 'studio');
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, 'index.html');
  writeFileSync(outPath, html);
  console.log(`✓ Studio rendered: ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
