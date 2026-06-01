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
import { homedir } from 'os';
// @ts-ignore
import * as yaml from 'js-yaml';

// ── Lumi Lab home root (~/.lumilab) ──
const LUMILAB_HOME = process.env.LUMILAB_HOME || join(homedir(), '.lumilab');

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

// 每个 stage 的主 skill（真实存在；点进去/兜底时跑的那个）。
// 关联 skill 见 docs/STAGE_BRANCH_GEO_2026-05-29.md §1.1。
const STAGE_SKILL_HINT: Record<Stage, string> = {
  overview: '',
  idea:     'lumilab-coach-yc',
  research: 'lumilab-research-platforms',
  product:  'lumilab-product-mvp',
  build:    'lumilab-landing-mvp',
  launch:   'lumilab-launch-strategy',
  retro:    'lumilab-weekly-sop-runner',
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
  // 兼容三种 brief 写法：
  //   **目标用户**: xxx   （加粗 inline）
  //   - 目标用户: xxx      （列表项，project_brief 模板实际格式）
  //   目标用户：xxx        （裸行，中文冒号）
  const re = new RegExp(
    `(?:^|\\n)\\s*[-*]?\\s*\\*{0,2}${label}\\*{0,2}\\s*[:：]\\s*([^\\n]+)`,
    'i',
  );
  const m = brief.match(re);
  return m ? m[1].trim().replace(/\*+$/, '').trim() : '';
}

// ── Artifact detection (relative-link aware) ──
// Returns the highest landing/v<N> dir number, or 0 if only landing/index.html, or -1 if none.
function detectLandingVersions(ventureDir: string): { versions: number[]; flat: boolean } {
  const landingDir = join(ventureDir, 'landing');
  const versions: number[] = [];
  let flat = false;
  if (existsSync(landingDir)) {
    try {
      for (const e of readdirSync(landingDir)) {
        const m = e.match(/^v(\d+)$/);
        if (m && existsSync(join(landingDir, e, 'index.html'))) versions.push(parseInt(m[1], 10));
      }
    } catch { /* ignore */ }
    if (existsSync(join(landingDir, 'index.html'))) flat = true;
  }
  versions.sort((a, b) => a - b);
  return { versions, flat };
}

interface ShareEntry {
  venture: string;
  url: string;
  preview_url?: string;
  status?: string;
}
function findShare(slug: string): ShareEntry | null {
  const shares = readJson<{ shares?: ShareEntry[] }>(join(LUMILAB_HOME, 'shares.json'));
  if (!shares?.shares) return null;
  return shares.shares.find((s) => s.venture === slug) ?? null;
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

  const hasRetroYaml = (() => {
    const rd = join(ventureDir, 'research');
    if (!existsSync(rd)) return false;
    try { return readdirSync(rd).some((f) => /^retro-.*\.ya?ml$/.test(f)); } catch { return false; }
  })();
  const hasLanding = (() => {
    const ld = join(ventureDir, 'landing');
    if (!existsSync(ld)) return false;
    if (existsSync(join(ld, 'index.html'))) return true;
    try { return readdirSync(ld).some((e) => /^v\d+$/.test(e) && existsSync(join(ld, e, 'index.html'))); }
    catch { return false; }
  })();

  return {
    overview: true,
    idea:     has('project_brief.md') || has('audience.md') || has('hypotheses.yaml'),
    research: has(join('reports', 'market-report.html')) || has('market_analysis.json') || dir('research') || has('painpoints.md') || has('competitors.md') || has('market_research.md'),
    product:  has('product_definition.md') || has('mvp_scope.md') || has('pricing.md'),
    build:    hasLanding || has('design_direction.json') || dir('content') || dir('deploy'),
    launch:   dir('deploy') || has('growth_sop.md') || has('content_calendar.md') || has('validation_metrics.md'),
    retro:    hasRetroYaml || has('review_report.md') || dir('retro'),
  };
}

// ── 数据来源可信度徽章（真实 API / 宿主代搜 / 估算 / mock）──
interface SrcBadge { label: string; cls: string; }
function sourceBadge(src: string): SrcBadge {
  switch (src) {
    case 'tavily': case 'tikhub': case 'dataforseo': case 'keywordseverywhere': case 'stripe':
      return { label: '真实 API', cls: 'src--real' };
    case 'agent-web':       return { label: '宿主代搜·web', cls: 'src--agent' };
    case 'agent-knowledge': return { label: '宿主知识', cls: 'src--est' };
    case 'agent-estimate':  return { label: '启发式估计', cls: 'src--est' };
    case 'agent-pending':   return { label: '待宿主补全', cls: 'src--pending' };
    case 'mock':            return { label: 'mock 占位', cls: 'src--mock' };
    default:                return { label: src || '—', cls: 'src--mock' };
  }
}

function fmtTokens(n: number): string { return n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1) + 'k' : String(n); }
function llmSrcLabel(src: string): string {
  return src === 'host-reported' ? '宿主自报' : src === 'estimated' ? '量级粗估' : src === 'mixed' ? '自报+粗估' : '—';
}

// ── 「这一轮消耗」汇总（外部精确 + LLM 自报/估算）。best-effort，缺 config 也不报错。──
function readUsageSummary(venture: string): any | null {
  try {
    const u = require('../../lumilab-config/scripts/usage.ts');
    if (typeof u?.summarize === 'function') return u.summarize(venture, { estimateIfMissing: true });
  } catch { /* usage 账本可选 */ }
  return null;
}

// ── 调研足迹：本轮用了哪些服务 / 搜了什么 / 拿回多少条 ──
interface FootprintRow { service: string; query: string; count: number; channel: string; }
function buildResearchFootprint(ventureDir: string): FootprintRow[] {
  const rows: FootprintRow[] = [];
  const rdir = join(ventureDir, 'research');
  if (!existsSync(rdir)) return rows;
  const web = readJson<any>(join(rdir, 'web_tavily.json'));
  if (web && web.source) rows.push({ service: web.source, query: web.query ?? '', count: Array.isArray(web.results) ? web.results.length : 0, channel: 'Web' });
  const xhs = readJson<any>(join(rdir, 'xhs_raw.json'));
  if (xhs && xhs.source) rows.push({ service: xhs.source, query: xhs.keyword ?? '', count: Array.isArray(xhs.notes) ? xhs.notes.length : 0, channel: '小红书' });
  // keywords：从 landscape.md 头部 `> source=` + metrics.csv 行数拿
  const land = readText(join(rdir, 'keyword_landscape.md'));
  if (land) {
    const m = land.match(/source=([\w-]+)/);
    const csv = readText(join(rdir, 'keyword_metrics.csv'));
    const count = csv ? Math.max(0, csv.trim().split('\n').length - 1) : 0;
    if (m) rows.push({ service: m[1], query: '关键词需求', count, channel: '关键词' });
  }
  return rows;
}

// ── yc_brief.md → 教练梳理结论 5 字段（一句话定位 / ICP / 钩子 / 最高风险假设 / 第一个验证动作）──
interface CoachBrief { positioning?: string; icp?: string; hook?: string; riskiest?: string; firstTest?: string; }
function parseCoachBrief(md: string): CoachBrief | null {
  if (!md.trim()) return null;
  const grab = (labels: string[]): string | undefined => {
    for (const lab of labels) {
      // 匹配「**一句话定位**：xxx」「## 一句话定位\nxxx」「- 一句话定位: xxx」等常见写法
      const re = new RegExp(`(?:[#>*\\-\\s]*)${lab}[*]*\\s*[:：]?\\s*([^\\n]+)`, 'i');
      const m = md.match(re);
      if (m && m[1].trim().replace(/^[*：:\s]+/, '')) return m[1].trim().replace(/^[*：:\s]+/, '');
    }
    return undefined;
  };
  const b: CoachBrief = {
    positioning: grab(['一句话定位', '一句话价值', 'positioning']),
    icp: grab(['目标用户', 'ICP', '目标人群']),
    hook: grab(['核心钩子', '钩子', 'hook']),
    riskiest: grab(['最高风险假设', '最大未验证假设', '核心假设', 'riskiest']),
    firstTest: grab(['第一个验证动作', '下一步', '验证动作', 'first test']),
  };
  return (b.positioning || b.icp || b.hook || b.riskiest || b.firstTest) ? b : null;
}

export function render(ventureDir: string): string {
  const ventureName = ventureDir.split('/').filter(Boolean).pop()!;
  const brief = readText(join(ventureDir, 'project_brief.md'));
  const audience = readText(join(ventureDir, 'audience.md'));
  const productDef = readText(join(ventureDir, 'product_definition.md'));
  const reviewReport = readText(join(ventureDir, 'review_report.md'));
  // archived = soft-deleted; kept in YAML for history but hidden from the dashboard.
  const hypotheses = (readYaml<Hypothesis[]>(join(ventureDir, 'hypotheses.yaml')) ?? [])
    .filter((h) => (h as any).status !== 'archived');
  const decisions = readYaml<Decision[]>(join(ventureDir, 'decisions.yaml')) ?? [];
  const designDirection = readJson<any>(join(ventureDir, 'design_direction.json'));
  const accent = designDirection?.palette?.accent ?? 'oklch(42% 0.16 28)';
  // W2: next-actions decision-engine output (kanban + mindmap)
  const nextActions = readJson<any>(join(ventureDir, 'studio', 'next-actions.json'));
  // W3: payment validation signal
  const paymentSummary = readJson<any>(join(ventureDir, 'payment', 'summary.json'));

  // ── Real pipeline artifacts ──
  const marketAnalysis = readJson<any>(join(ventureDir, 'market_analysis.json'));
  const hasMarketReport = existsSync(join(ventureDir, 'reports', 'market-report.html'));
  // 1.13.0 验证信号漏斗（读第一方埋点汇总 studio/validation-signals.json）
  const signals = readJson<any>(join(ventureDir, 'studio', 'validation-signals.json'));
  // 1.12.0 Studio 透明度：教练梳理结论 / 调研足迹 / 消耗看板
  const coachBrief = parseCoachBrief(readText(join(ventureDir, 'yc_brief.md')));
  const footprint = buildResearchFootprint(ventureDir);
  const usage = readUsageSummary(ventureName);
  const { versions: landingVersions, flat: landingFlat } = detectLandingVersions(ventureDir);
  const share = findShare(ventureName);
  // retro YAML: research/retro-*.yaml
  let retroData: any = null;
  const researchDir = join(ventureDir, 'research');
  if (existsSync(researchDir)) {
    try {
      const retroFiles = readdirSync(researchDir)
        .filter((f) => /^retro-.*\.ya?ml$/.test(f))
        .sort();
      if (retroFiles.length) {
        retroData = readYaml<any>(join(researchDir, retroFiles[retroFiles.length - 1]));
      }
    } catch { /* ignore */ }
  }
  const renderedAt = new Date().toISOString().slice(0, 16).replace('T', ' ');

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
    nextActions: nextActions ?? null,
    build: {
      landingTop: landingVersions.length ? landingVersions[landingVersions.length - 1] : null,
      preset: designDirection?.preset ?? null,
      hypothesisCount: hypotheses.length,
    },
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

  // ── Pending-state component ──
  // Frame: pipeline hasn't reached this step (not "go run a skill yourself").
  const pendingState = (stageLabel: string, skillHint: string) => `
    <div class="empty-card">
      <div class="empty-card__title">「${esc(stageLabel)}」还没有内容</div>
      <div class="empty-card__hint">待 <code>idea-to-landing</code> 流水线推进到这一步会自动生成。</div>
      <div class="empty-card__fallback">手动兜底（一般不需要）：在 AI 宿主里跑 <code>${esc(skillHint)}</code></div>
    </div>`;

  // ── Artifact card: a real link to a generated file ──
  const artifactCard = (icon: string, title: string, href: string, sub?: string) => `
    <a class="artifact-card" href="${esc(href)}" target="_blank" rel="noopener">
      <span class="artifact-card__icon">${icon}</span>
      <span class="artifact-card__text">
        <span class="artifact-card__title">${esc(title)}</span>
        ${sub ? `<span class="artifact-card__sub">${esc(sub)}</span>` : ''}
      </span>
      <span class="artifact-card__arrow">→</span>
    </a>`;

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
    return `<a class="prog-cell ${cls}" data-stage="${s}" role="button" tabindex="0" title="查看「${esc(STAGE_LABELS[s])}」"><span class="prog-roman">${['I','II','III','IV','V','VI'][i]}</span><span class="prog-label">${esc(STAGE_LABELS[s])}</span></a>`;
  }).join('');

  // ── Recent decisions (overview) ──
  const recentDecisions = decisions.slice().reverse().slice(0, 5).map((d) => `
    <li class="row row--decision" data-target="decision" data-id="${esc(d.id)}">
      <span class="row-id">${esc(d.at.slice(5, 10))}</span>
      <span class="row-fact">${esc(d.decision)}</span>
      <span class="row-tag tag--ghost">${esc(decisionTypeLabel(d.type))}</span>
    </li>`).join('');

  // ── 透明度面板：消耗看板 / 调研足迹 / 教练结论 ──
  const usageCard = usage && (usage.external_calls > 0 || usage.llm.total > 0) ? `
      <header class="section__head" style="margin-top:24px;">
        <h2 class="section__title">本轮消耗</h2>
        <span class="section__count">usage.json</span>
      </header>
      <div class="usage-grid">
        <div class="usage-cell">
          <span class="usage-cell__num">$${usage.external_cost_usd.toFixed(3)}</span>
          <span class="usage-cell__lbl">外部服务成本</span>
          <span class="usage-cell__sub">${usage.external_calls} 次调用 · 精确计量</span>
        </div>
        <div class="usage-cell">
          <span class="usage-cell__num">${usage.llm.source === 'host-reported' ? '' : '~'}${fmtTokens(usage.llm.total)}</span>
          <span class="usage-cell__lbl">宿主 LLM token${usage.llm.source === 'host-reported' ? '' : '（粗估）'}</span>
          <span class="usage-cell__sub"><span class="src-badge ${usage.llm.source === 'host-reported' ? 'src--real' : 'src--est'}">${llmSrcLabel(usage.llm.source)}</span></span>
        </div>
        ${usage.agent_calls > 0 ? `
        <div class="usage-cell usage-cell--good">
          <span class="usage-cell__num">${usage.agent_calls}</span>
          <span class="usage-cell__lbl">宿主代搜</span>
          <span class="usage-cell__sub">0 外部成本 · 零 key 也能跑</span>
        </div>` : ''}
      </div>
      ${usage.services.length ? `<ul class="usage-svc">${usage.services.map((s: any) => `<li><span class="usage-svc__name">${esc(s.label)}</span><span class="usage-svc__meta">${s.calls} 次 · ${s.est_cost_usd > 0 ? '$' + s.est_cost_usd.toFixed(3) : '免费'}</span></li>`).join('')}</ul>` : ''}
      ${usage.llm.source !== 'host-reported' && usage.llm.total > 0 ? `<p class="usage-note">※ 宿主 LLM token 是按「已跑哪几个 phase」估的<strong>量级（偏保守下限）</strong> —— 脚本看不到宿主真实 token 表，准确用量请看你宿主自己的用量页。上方外部服务成本（$）为精确计量。</p>` : ''}
  ` : '';

  const footprintPanel = footprint.length ? `
      <header class="section__head" style="margin-top:20px;">
        <h2 class="section__title">调研足迹</h2>
        <span class="section__count">用了哪些服务 · 搜了什么</span>
      </header>
      <ul class="footprint">
        ${footprint.map((f) => { const b = sourceBadge(f.service); return `
        <li class="footprint__row">
          <span class="footprint__chan">${esc(f.channel)}</span>
          <span class="footprint__q">${esc(f.query || '—')}</span>
          <span class="footprint__cnt">${f.count} 条</span>
          <span class="src-badge ${b.cls}">${esc(b.label)}</span>
        </li>`; }).join('')}
      </ul>
  ` : '';

  const coachCard = coachBrief ? `
      <header class="section__head">
        <h2 class="section__title">教练梳理结论</h2>
        <span class="section__count">yc_brief.md · coach-yc</span>
      </header>
      <div class="coach-brief">
        ${coachBrief.positioning ? `<div class="coach-brief__row"><span class="coach-brief__k">一句话定位</span><span class="coach-brief__v">${esc(coachBrief.positioning)}</span></div>` : ''}
        ${coachBrief.icp ? `<div class="coach-brief__row"><span class="coach-brief__k">目标用户</span><span class="coach-brief__v">${esc(coachBrief.icp)}</span></div>` : ''}
        ${coachBrief.hook ? `<div class="coach-brief__row"><span class="coach-brief__k">核心钩子</span><span class="coach-brief__v">${esc(coachBrief.hook)}</span></div>` : ''}
        ${coachBrief.riskiest ? `<div class="coach-brief__row coach-brief__row--risk"><span class="coach-brief__k">最高风险假设</span><span class="coach-brief__v">${esc(coachBrief.riskiest)}</span></div>` : ''}
        ${coachBrief.firstTest ? `<div class="coach-brief__row coach-brief__row--test"><span class="coach-brief__k">第一个验证动作</span><span class="coach-brief__v">${esc(coachBrief.firstTest)}</span></div>` : ''}
      </div>
  ` : '';

  // ── Stage section builders ──
  // ── 验证信号漏斗（第一方埋点：访问→点CTA→留邮箱→真付费 + 渠道归因）──
  const sf = signals?.funnel;
  const hasSignals = sf && (sf.uv > 0 || sf.payment_paid > 0 || sf.email_submit > 0);
  const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 100) : 0);
  const funnelRow = (label: string, n: number, base: number, strong?: boolean) => `
        <div class="vsig__row">
          <span class="vsig__l">${esc(label)}</span>
          <span class="vsig__n${strong ? ' vsig__n--strong' : ''}">${n}</span>
          <span class="vsig__pct">${base > 0 ? pct(n, base) + '%' : '—'}</span>
          <span class="vsig__bar"><i style="width:${base > 0 ? Math.max(pct(n, base), n > 0 ? 4 : 0) : 0}%"></i></span>
        </div>`;
  const signalsPanel = hasSignals ? `
      <header class="section__head" style="margin-top:24px;">
        <h2 class="section__title">验证信号</h2>
        <span class="section__count">第一方埋点 · ${signals.source === 'd1' ? '实时' : signals.source}</span>
      </header>
      <div class="vsig">
        ${funnelRow('访问 UV', sf.uv, sf.uv)}
        ${funnelRow('点了 CTA', sf.cta_click, sf.uv)}
        ${funnelRow('留邮箱', sf.email_submit, sf.uv, true)}
        ${funnelRow('真付费', sf.payment_paid, sf.uv, true)}
      </div>
      ${Array.isArray(signals.by_channel) && signals.by_channel.length ? `
      <div class="vsig-chan">
        <div class="vsig-chan__h">渠道归因（哪个渠道带来 + 转化）</div>
        ${signals.by_channel.slice(0, 5).map((c: any) => `
          <div class="vsig-chan__row"><span class="vsig-chan__src">${esc(c.source)}</span><span class="vsig-chan__m">${c.uv} 访问 · ${c.cta} 点击 · ${c.email} 留资</span></div>`).join('')}
      </div>` : ''}` : '';

  // ── 完成后的下一步面板（landing 已生成 → 接着测真实意愿；把孤岛 deploy/payment/launch/retro 接回脊柱）──
  const hasLandingBuilt = landingVersions.length > 0 || !!landingFlat;
  const isDeployed = !!share;
  const nstep = (icon: string, title: string, sub: string, copy: string, tag?: string) => `
        <div class="nstep">
          <div class="nstep__h"><span class="nstep__ic">${icon}</span><span class="nstep__t">${esc(title)}</span>${tag ? `<span class="nstep__tag">${esc(tag)}</span>` : ''}</div>
          <p class="nstep__s">${esc(sub)}</p>
          <code class="nstep__code" data-copy="${esc(copy)}">${esc(copy)}</code>
        </div>`;
  const nextStepsPanel = hasLandingBuilt ? `
      <header class="section__head" style="margin-top:24px;">
        <h2 class="section__title">完成后的下一步</h2>
        <span class="section__count">landing 已生成 · 接着测真实意愿</span>
      </header>
      <div class="nsteps">
        ${nstep('🚀', isDeployed ? '重新部署 / 更新上线' : '部署上线（公开验证页）', isDeployed ? '改了内容就重新部署；公开页带第一方埋点收数据。' : '公开发出去让真实陌生人来测意愿，自带第一方埋点（访问/点击/留资/国家）。', `用 lumilab-deploy 把 ${ventureName} 的 landing 公开部署上线`, '需确认')}
        ${nstep('💳', '换成 Stripe 真付费按钮', '把假门邮箱换成真 checkout —— 「愿意付钱」比「留邮箱」强一档的信号。', `用 lumilab-payment-link 给 ${ventureName} 建 Stripe 测试付费链接、接到 landing 上`, '需确认')}
        ${nstep('📱', '出小红书 / 朋友圈内容 + 配图', '把这个 idea 做成多平台引流内容（含封面图），把人引到验证页。', `用 lumilab-content-repurpose 给 ${ventureName} 出小红书和朋友圈内容、配上封面图`)}
        ${nstep('📣', '冷启动计划', '4-8 周怎么把第一批真实用户引到验证页。', `用 lumilab-launch-strategy 给 ${ventureName} 出 4-8 周冷启动计划`)}
        ${nstep('🔁', '复盘 + 下一步行动', '有访问/付费数据后 → 信号解读 + 该继续/调整/放弃。', `用 lumilab-next-actions 给 ${ventureName} 解读当前信号、理出下一步`)}
      </div>` : '';

  const stageOverview = `
    <section class="stage" data-stage="overview">
      ${oneLiner ? `<p class="stage-deck">${esc(oneLiner)}</p>` : ''}
      ${kpiGrid}
      <header class="section__head">
        <h2 class="section__title">阶段进度</h2>
        <span class="section__count">${stagesDone.length} / 6 已完成</span>
      </header>
      <div class="prog-row">${progRow}</div>
      ${signalsPanel}
      ${nextStepsPanel}
      ${usageCard}
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
      ${coachCard}
      ${brief.trim() ? `
        <header class="section__head"${coachBrief ? ' style="margin-top:20px;"' : ''}>
          <h2 class="section__title">项目简报</h2>
          <span class="section__count">project_brief.md</span>
        </header>
        <article class="md-card md-content">${renderMarkdown(brief)}</article>
        ${!coachBrief ? `<p class="coach-hint">想把 idea 梳理得更锋利？让 <code>idea-to-landing</code> 跑一轮 <b>coach-yc</b> 教练澄清 —— 产出一句话定位 / ICP / 钩子 / 最高风险假设 / 第一个验证动作，会显示在这里。</p>` : ''}
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

  // ── 调研 stage ──
  const researchSummary = marketAnalysis?.market?.summary ?? '';
  const competitorCount = Array.isArray(marketAnalysis?.competitors) ? marketAnalysis.competitors.length : 0;
  const audienceCount = Array.isArray(marketAnalysis?.audience) ? marketAnalysis.audience.length : 0;
  const directionCount = Array.isArray(marketAnalysis?.directions) ? marketAnalysis.directions.length : 0;
  const hasResearchArtifact = hasMarketReport || !!marketAnalysis || footprint.length > 0;
  const stageResearch = `
    <section class="stage" data-stage="research" hidden>
      ${hasResearchArtifact ? `
        ${footprintPanel}
        ${hasMarketReport ? `
          <header class="section__head">
            <h2 class="section__title">市场分析</h2>
            <span class="section__count">reports/market-report.html</span>
          </header>
          ${artifactCard('📊', '打开市场分析报告', '../reports/market-report.html', '完整的市场 / 竞品 / 受众 / 方向分析')}
        ` : ''}
        ${marketAnalysis ? `
          <header class="section__head" style="margin-top:20px;">
            <h2 class="section__title">分析摘要</h2>
            <span class="section__count">market_analysis.json</span>
          </header>
          <div class="md-card">
            ${researchSummary ? `<p style="line-height:1.65;margin-bottom:14px;">${esc(researchSummary)}</p>` : ''}
            <dl class="panel-meta-list" style="grid-template-columns:96px 1fr;">
              <dt>竞品</dt><dd>${competitorCount} 个</dd>
              <dt>受众分层</dt><dd>${audienceCount} 个</dd>
              <dt>方向候选</dt><dd>${directionCount} 个</dd>
            </dl>
          </div>
        ` : ''}
      ` : pendingState(STAGE_LABELS.research, STAGE_SKILL_HINT.research)}
    </section>`;

  // ── 产品 stage ──
  const directions: any[] = Array.isArray(marketAnalysis?.directions) ? marketAnalysis.directions : [];
  // chosen direction: a decision whose type/related references a direction, or text mentions "方向"
  const directionDecision = decisions
    .slice()
    .reverse()
    .find((d) =>
      /方向|direction/i.test(d.decision) ||
      (Array.isArray(d.related) && d.related.some((r) => /^d\d+$/.test(r)))
    );
  const chosenDirId =
    directionDecision?.related?.find((r) => /^d\d+$/.test(r)) ?? null;
  const chosenDir = chosenDirId ? directions.find((d) => d.id === chosenDirId) : null;
  const directionsList = directions
    .map((d) => {
      const isChosen = chosenDir ? d.id === chosenDir.id : !!d.recommended;
      return `
        <li class="dir-row ${isChosen ? 'is-chosen' : ''}">
          <span class="dir-row__mark">${isChosen ? '◆' : '◇'}</span>
          <span class="dir-row__body">
            <span class="dir-row__title">${esc(d.title ?? d.id)}${isChosen ? ' <span class="dir-row__badge">已选 / 推荐</span>' : ''}</span>
            ${d.angle ? `<span class="dir-row__angle">${esc(d.angle)}</span>` : ''}
            ${d.why_it_works ? `<span class="dir-row__why">${esc(d.why_it_works)}</span>` : ''}
            ${d.risk ? `<span class="dir-row__risk">⚠ ${esc(d.risk)}</span>` : ''}
            <span class="dir-row__cta">
              <button class="btn-ghost" data-act="dir-gen" data-id="${esc(d.id ?? '')}" data-title="${escAttr(d.title ?? d.id ?? '')}">用此方向生成 Landing →</button>
            </span>
          </span>
        </li>`;
    })
    .join('');
  const hasProductArtifact = productDef.trim() || directions.length > 0 || !!directionDecision;
  const stageProduct = `
    <section class="stage" data-stage="product" hidden>
      ${hasProductArtifact ? `
        ${directionDecision ? `
          <header class="section__head">
            <h2 class="section__title">已选方向</h2>
            <span class="section__count">decisions.yaml</span>
          </header>
          <div class="md-card">
            <p style="font-size:15px;font-weight:500;color:var(--ink);line-height:1.5;">${esc(directionDecision.decision)}</p>
            ${directionDecision.rationale ? `<p style="margin-top:8px;color:var(--ink-2);line-height:1.6;">${esc(directionDecision.rationale)}</p>` : ''}
          </div>
        ` : ''}
        ${directions.length > 0 ? `
          <header class="section__head" style="margin-top:20px;">
            <h2 class="section__title">方向候选</h2>
            <span class="section__count">${directions.length} 个 · market_analysis.json</span>
          </header>
          <ul class="dir-list">${directionsList}</ul>
        ` : ''}
        ${productDef.trim() ? `
          <header class="section__head" style="margin-top:20px;">
            <h2 class="section__title">产品定义</h2>
            <span class="section__count">product_definition.md</span>
          </header>
          <article class="md-card md-content">${renderMarkdown(productDef)}</article>
        ` : ''}
      ` : pendingState(STAGE_LABELS.product, STAGE_SKILL_HINT.product)}
    </section>`;

  // ── 构建 stage ──
  // primary landing link: highest v<N>, else flat landing/index.html
  const topVersion = landingVersions.length ? landingVersions[landingVersions.length - 1] : null;
  const primaryLandingHref =
    topVersion != null ? `../landing/v${topVersion}/index.html`
    : landingFlat ? '../landing/index.html'
    : null;
  const primaryLandingLabel =
    topVersion != null ? `打开 Landing 验证页 (v${topVersion})` : '打开 Landing 验证页';
  const landingVersionList = landingVersions
    .map((n) => `<li class="ver-row"><a href="../landing/v${n}/index.html" target="_blank" rel="noopener">v${n}</a>${n === topVersion ? '<span class="ver-row__latest">最新</span>' : ''}</li>`)
    .join('');
  const hasBuildArtifact = !!primaryLandingHref || !!designDirection;
  const stageBuild = `
    <section class="stage" data-stage="build" hidden>
      ${hasBuildArtifact ? `
        ${primaryLandingHref ? `
          <header class="section__head">
            <h2 class="section__title">Landing 验证页</h2>
            <span class="section__count">landing/</span>
          </header>
          ${artifactCard('🌐', primaryLandingLabel, primaryLandingHref, '真实购买意愿验证页（fake-door）')}
          ${landingVersions.length > 1 ? `<ul class="ver-list">${landingVersionList}</ul>` : ''}
        ` : ''}
        ${designDirection ? (() => {
          const dd = designDirection;
          const accent = dd.palette?.accent ?? dd.palette?.cta ?? 'oklch(45% 0.15 25)';
          const accent2 = dd.palette?.accent_2 ?? 'oklch(70% 0.12 250)';
          const surface = dd.palette?.surface ?? dd.palette?.neutral ?? 'oklch(97% 0.012 85)';
          const ink = dd.palette?.text_primary ?? dd.palette?.primary ?? 'oklch(23% 0.02 60)';
          const ink2 = dd.palette?.text_secondary ?? 'oklch(52% 0.02 70)';
          const radius = dd.radius != null ? dd.radius : 4;
          const spaceScale = dd.layout?.space_scale ?? 1;
          const heroLayout = dd.layout?.hero ?? 'split';
          const buttonStyle = dd.layout?.button ?? 'solid';
          const fontHeading = dd.typography?.heading ?? '"Fraunces","Noto Serif SC",Georgia,serif';
          const fontBody = dd.typography?.body ?? '"Fraunces","Noto Serif SC",Georgia,serif';
          // font whitelist (anti-slop: no Inter/Roboto/Arial) — visibly distinct + loaded/system-safe
          const HEADING_FONTS: [string, string][] = [
            ['"Fraunces","Noto Serif SC",Georgia,serif', 'Fraunces 衬线'],
            ['"Noto Serif SC",Georgia,serif', 'Noto Serif 宋'],
            ['Georgia,"Times New Roman",serif', 'Georgia 经典衬线'],
            ['"JetBrains Mono",ui-monospace,monospace', 'JetBrains 等宽（编辑感）'],
            ['ui-sans-serif,system-ui,sans-serif', 'System 无衬线'],
          ];
          const BODY_FONTS: [string, string][] = [
            ['"Fraunces","Noto Serif SC",Georgia,serif', 'Fraunces 衬线'],
            ['Georgia,"Times New Roman",serif', 'Georgia 衬线'],
            ['ui-sans-serif,system-ui,sans-serif', 'System 无衬线'],
            ['"JetBrains Mono",ui-monospace,monospace', 'JetBrains 等宽'],
          ];
          const opt = (pairs: [string, string][], cur: string) => pairs
            .map(([v, label]) => `<option value="${escAttr(v)}"${v === cur ? ' selected' : ''}>${esc(label)}</option>`).join('');
          const presetOpts = ['editorial', 'minimalist', 'brutalist', 'soft']
            .map((p) => `<option value="${p}"${p === dd.preset ? ' selected' : ''}>${p}</option>`).join('');
          const heroOpts = [['split', '分栏'], ['centered', '居中'], ['editorial', '编辑感']]
            .map(([v, l]) => `<option value="${v}"${v === heroLayout ? ' selected' : ''}>${l}</option>`).join('');
          const btnOpts = [['solid', '实心'], ['outline', '描边'], ['pill', '胶囊']]
            .map(([v, l]) => `<option value="${v}"${v === buttonStyle ? ' selected' : ''}>${l}</option>`).join('');
          return `
          <header class="section__head" style="margin-top:20px;">
            <h2 class="section__title">设计系统 · 实时 re-theme</h2>
            <span class="section__count">${esc(dd.preset ?? '—')} preset · 拖旋钮 → 右侧真实落地页立刻变</span>
          </header>
          <div class="ds" data-ds
            data-accent="${escAttr(accent)}" data-accent2="${escAttr(accent2)}" data-surface="${escAttr(surface)}"
            data-ink="${escAttr(ink)}" data-ink2="${escAttr(ink2)}" data-radius="${radius}" data-space="${spaceScale}"
            data-hero="${escAttr(heroLayout)}" data-button="${escAttr(buttonStyle)}"
            data-fh="${escAttr(fontHeading)}" data-fb="${escAttr(fontBody)}"
            data-landing="${primaryLandingHref ? escAttr(primaryLandingHref) : ''}">
            <div class="ds-panel">
              <div class="ds-grp">
                <div class="ds-grp__t">预设</div>
                <label class="ds-ctl"><span>一键套用</span><select data-ds-preset>${presetOpts}</select></label>
              </div>
              <div class="ds-grp">
                <div class="ds-grp__t">色彩</div>
                <label class="ds-ctl"><span>主强调色 <i class="ds-sw" data-sw="accent" style="background:${esc(accent)}"></i></span><input type="text" value="${escAttr(accent)}" data-ds-tok="accent" spellcheck="false"></label>
                <label class="ds-ctl"><span>次强调色 <i class="ds-sw" data-sw="accent2" style="background:${esc(accent2)}"></i></span><input type="text" value="${escAttr(accent2)}" data-ds-tok="accent2" spellcheck="false"></label>
                <label class="ds-ctl"><span>表面色调 暖 ↔ 冷 <b data-ds-out="surfacehue">—</b></span><input type="range" min="20" max="280" value="85" data-ds-surfacehue></label>
              </div>
              <div class="ds-grp">
                <div class="ds-grp__t">形状</div>
                <label class="ds-ctl"><span>圆角 <b data-ds-out="radius">${radius}px</b></span><input type="range" min="0" max="28" value="${radius}" data-ds-radius></label>
                <label class="ds-ctl"><span>间距密度 <b data-ds-out="space">${spaceScale}×</b></span><input type="range" min="80" max="140" value="${Math.round(spaceScale * 100)}" data-ds-space></label>
              </div>
              <div class="ds-grp">
                <div class="ds-grp__t">字体（白名单 · 禁 Inter/Roboto）</div>
                <label class="ds-ctl"><span>标题字体</span><select data-ds-tok="fontHeading">${opt(HEADING_FONTS, fontHeading)}</select></label>
                <label class="ds-ctl"><span>正文字体</span><select data-ds-tok="fontBody">${opt(BODY_FONTS, fontBody)}</select></label>
              </div>
              <div class="ds-grp">
                <div class="ds-grp__t">版式</div>
                <label class="ds-ctl"><span>hero 版式</span><select data-ds-layout="hero">${heroOpts}</select></label>
                <label class="ds-ctl"><span>按钮风格</span><select data-ds-layout="button">${btnOpts}</select></label>
              </div>
              <div class="ds-actions">
                <button class="btn-primary" data-act="design-apply">应用设计（确定性写回）</button>
                <button class="btn-ghost" data-act="design-gen-gate">生成验证页 →</button>
              </div>
              <p class="ds-hint">纯视觉调整即时反映、写回 <code>theme.css</code>（无需 LLM）。换方向 / 改文案 / 换版式结构才走「生成验证页」引导门。</p>
            </div>
            <div class="ds-stage">
              ${primaryLandingHref
                ? `<div class="ds-stage__bar"><span class="ds-stage__dot"></span>真实落地页 · ${esc(primaryLandingLabel)}</div>
                   <iframe class="ds-frame" id="ds-frame" src="${esc(primaryLandingHref)}" title="landing 实时预览" loading="lazy"></iframe>`
                : `<div class="ds-stage__empty">还没有 landing 验证页。<br>用下方「生成验证页 →」先生成一个，再回来实时调样式。</div>`}
            </div>
          </div>
        `; })() : ''}
      ` : pendingState(STAGE_LABELS.build, STAGE_SKILL_HINT.build)}
    </section>`;

  // ── 付款验证块（W3）：读 payment/summary.json + R6 基线 → 信号灯 ──
  const paymentBlock = (() => {
    if (!paymentSummary || typeof paymentSummary.count_paid !== 'number') return '';
    const ps = paymentSummary;
    const paid = ps.count_paid;
    const amount = (ps.gross_amount ?? 0) / 100;
    const cur = String(ps.currency ?? '').toUpperCase();
    const total = Array.isArray(ps.sessions) ? ps.sessions.length : paid;
    const cvr = total ? (paid / total) : 0;
    // R6 payment_any：任意真实付款即强信号；0 笔 = 死信号
    const level = paid > 0 ? 'strong' : 'dead';
    const sigClass = paid > 0 ? 'g' : 'r';
    const sigLabel = paid > 0 ? '强信号' : '死信号';
    const interp = paid > 0
      ? `${paid} 笔真实付款 = 比任何留资/点赞都强的需求信号。该放大、扩量。`
      : `付款 0 笔。若 UV 已足够仍无付款，「愿意付」假设未成立，考虑换定位或换受众。`;
    const modeTag = ps.mode === 'live' ? 'live' : 'test';
    return `
      <header class="section__head">
        <h2 class="section__title">付款验证</h2>
        <span class="section__count">payment/summary.json · Stripe ${esc(modeTag)} mode</span>
      </header>
      <div class="pay">
        <div class="pay-grid">
          <div class="pay-kpi"><div class="pay-kpi__v">${paid}</div><div class="pay-kpi__l">真实付款</div></div>
          <div class="pay-kpi"><div class="pay-kpi__v">${amount.toFixed(0)} <span class="pay-cur">${esc(cur)}</span></div><div class="pay-kpi__l">累计金额</div></div>
          <div class="pay-kpi"><div class="pay-kpi__v">${(cvr * 100).toFixed(1)}%</div><div class="pay-kpi__l">付款/会话</div></div>
          <div class="pay-kpi pay-kpi--sig pay-kpi--${sigClass}"><div class="pay-kpi__v"><span class="pay-dot"></span>${esc(sigLabel)}</div><div class="pay-kpi__l">R6 payment_any · tier A</div></div>
        </div>
        <p class="pay-interp">${esc(interp)}</p>
        ${ps.source === 'mock' ? `<p class="pay-note">※ 当前为预置样例数据（demo 兜底）。配 Stripe test key + 网络后跑 <code>lumilab payment sync ${esc(ventureName)}</code> 现场真拉。</p>` : `<p class="pay-note">这是真实 Stripe 付款，不是 mock。最近同步：${esc(String(ps.last_synced ?? '').slice(0, 16).replace('T', ' '))}</p>`}
      </div>`;
  })();

  // ── 启动 stage ──
  const hasAnyLanding = !!primaryLandingHref;
  // ── 内容画廊：content/xhs/*.png（封面/活动长图）+ 文案复制 + 下载 ──
  const xhsContentDir = join(ventureDir, 'content', 'xhs');
  const contentImgs = existsSync(xhsContentDir) ? readdirSync(xhsContentDir).filter((f) => f.endsWith('.png')).sort() : [];
  let xhsCopy = '';
  if (existsSync(xhsContentDir)) {
    for (const m of readdirSync(xhsContentDir).filter((f) => f.endsWith('.md'))) { const t = readText(join(xhsContentDir, m)); if (t.trim()) { xhsCopy = t; break; } }
  }
  const contentGallery = contentImgs.length ? `
      <header class="section__head" style="margin-top:20px;">
        <h2 class="section__title">内容画廊</h2>
        <span class="section__count">${contentImgs.length} 张 · 点图下载</span>
      </header>
      <div class="cgal">
        ${contentImgs.map((f) => `
        <figure class="cgal__item">
          <a href="../content/xhs/${esc(f)}" download title="下载 ${esc(f)}"><img class="cgal__img" src="../content/xhs/${esc(f)}" alt="${esc(f)}" loading="lazy"></a>
          <figcaption class="cgal__cap"><span class="cgal__nm">${esc(f)}</span><a class="cgal__dl" href="../content/xhs/${esc(f)}" download>↓</a></figcaption>
        </figure>`).join('')}
      </div>
      ${xhsCopy ? `<div class="cgal-copy"><div class="cgal-copy__h">小红书文案 · 点击复制全文</div><pre class="cgal-copy__t" data-copy="${esc(xhsCopy)}">${esc(xhsCopy.slice(0, 700))}${xhsCopy.length > 700 ? '\n…（点击复制全文）' : ''}</pre></div>` : ''}` : '';

  const stageLaunch = `
    <section class="stage" data-stage="launch" hidden>
      ${paymentBlock}
      ${contentGallery}
      ${share ? `
        <header class="section__head">
          <h2 class="section__title">已上线</h2>
          <span class="section__count">shares.json</span>
        </header>
        ${artifactCard('🚀', '打开线上验证页', share.url, share.url)}
        <div class="md-card" style="margin-top:14px;">
          <p style="line-height:1.65;">验证数据：跑几天后把 <strong>UV</strong> / <strong>CTA 点击率</strong> / <strong>邮箱率</strong> 填进 <code>lumilab retro</code>。</p>
        </div>
      ` : hasAnyLanding ? `
        <div class="empty-card">
          <div class="empty-card__title">Landing 已生成，还没部署</div>
          <div class="empty-card__hint">可部署上线开始收集验证数据。</div>
          <div class="empty-card__skill"><code>lumilab deploy ${esc(ventureName)}</code></div>
        </div>
      ` : pendingState(STAGE_LABELS.launch, STAGE_SKILL_HINT.launch)}
    </section>`;

  // ── W2 · 下一步行动：看板 + 脑图（内联，确定性渲染 next-actions.json）──
  const NA_SIG_CLASS: Record<string, string> = { dead: 'r', weak: 'y', normal: 'g', strong: 'g', excellent: 'g', na: 'n' };
  const NA_TIER_NOTE: Record<string, string> = { A: '高置信', B: '中置信', C: '经验值' };
  const naSignalsHtml = (sigs: any[]): string => {
    if (!Array.isArray(sigs) || !sigs.length) return '';
    const rows = sigs.map((s) => {
      const cls = NA_SIG_CLASS[s.level] ?? 'n';
      const val = s.value != null ? `<span class="na-sig__val">${esc(String(s.value))}</span>` : '';
      const tier = s.tier ? `<span class="na-sig__tier na-sig__tier--${esc(s.tier)}" title="${esc(NA_TIER_NOTE[s.tier] ?? '')}">tier ${esc(s.tier)}</span>` : '';
      return `<div class="na-sig na-sig--${cls}">
        <span class="na-sig__dot"></span>
        <span class="na-sig__metric">${esc(s.metric)}</span>
        ${val}
        <span class="na-sig__interp">${esc(s.interpretation ?? '')}</span>
        ${tier}
      </div>`;
    }).join('');
    return `<div class="na-signals">
      <div class="na-signals__head">① 信号（仅参考，非判决）· 对照 R6 基线</div>
      ${rows}
    </div>`;
  };
  const naCard = (t: any): string => {
    const prio = ['high', 'medium', 'low'].includes(t.priority) ? t.priority : 'medium';
    const chip = t.linked_hypothesis
      ? `<a class="na-chip" data-target="hypothesis" data-id="${escAttr(t.linked_hypothesis)}" title="跳到该假设">${esc(t.linked_hypothesis)}</a>`
      : '';
    return `<article class="na-card na-card--${prio}" draggable="true" data-id="${escAttr(t.id)}" data-col="${escAttr(t.column)}">
      <span class="na-card__bar"></span>
      <div class="na-card__body">
        <p class="na-card__title">${esc(t.title)}</p>
        ${t.detail ? `<p class="na-card__detail">${esc(t.detail)}</p>` : ''}
        <div class="na-card__foot">
          ${chip}
          ${t.source ? `<span class="na-card__src">${esc(t.source)}</span>` : ''}
          <span class="na-card__spacer"></span>
          <button class="na-card__x" data-act="na-del" data-id="${escAttr(t.id)}" title="删除">×</button>
        </div>
      </div>
    </article>`;
  };
  const naBoardHtml = (na: any): string => {
    const cols = Array.isArray(na?.columns) && na.columns.length ? na.columns
      : [{ id: 'to_validate', title: '待验证' }, { id: 'in_progress', title: '进行中' }, { id: 'learned', title: '已学到' }];
    const tasks: any[] = Array.isArray(na?.tasks) ? na.tasks : [];
    const colHtml = cols.map((c: any) => {
      const items = tasks.filter((t) => t.column === c.id);
      return `<section class="na-col" data-col="${escAttr(c.id)}">
        <div class="na-col__head"><span>${esc(c.title)}</span><span class="na-col__n">${items.length}</span></div>
        <div class="na-col__drop" data-col="${escAttr(c.id)}">
          ${items.map(naCard).join('') || '<p class="na-col__empty">拖卡到这里</p>'}
        </div>
        <button class="na-add" data-act="na-add" data-col="${escAttr(c.id)}">＋ 加一条</button>
      </section>`;
    }).join('');
    return `<div class="na-board" data-na-pane="kanban">${colHtml}</div>`;
  };
  const naSection = nextActions ? `
        <header class="section__head">
          <h2 class="section__title">下一步行动</h2>
          <span class="section__count">本轮信号 → 现在该做什么 · next-actions.json</span>
        </header>
        <div class="na" data-na>
          <div class="na-toolbar">
            <div class="seg-group na-seg">
              <button class="seg-btn is-active" data-na-view="kanban" type="button">看板</button>
              <button class="seg-btn" data-na-view="mindmap" type="button">脑图</button>
            </div>
            <button class="btn-ghost na-print" data-act="na-print" type="button">🖨 打印 / 导出 PDF</button>
          </div>
          ${naSignalsHtml(nextActions.source_signals)}
          ${naBoardHtml(nextActions)}
          <div class="na-mind" data-na-pane="mindmap" hidden>
            <div class="na-mind__tools">
              <button data-mind="out" type="button" title="缩小">−</button>
              <button data-mind="fit" type="button" title="适配">适配</button>
              <button data-mind="in" type="button" title="放大">＋</button>
            </div>
            <div class="na-mind__canvas"><svg id="na-mind-svg" role="img" aria-label="下一步行动脑图"></svg></div>
          </div>
          <p class="na-foot">信号灯只表达方向/温度，不表达成败结论。「多方向」是同一 idea 的不同推进岔路。最终继续 / 调整 / 放弃由你拍板。</p>
        </div>
  ` : (existsSync(join(ventureDir, 'studio', 'next-actions.html')) ? `
        <header class="section__head">
          <h2 class="section__title">下一步行动</h2>
          <span class="section__count">本轮信号 → 现在该做什么</span>
        </header>
        ${artifactCard('🧭', '打开「下一步」行动卡', 'next-actions.html', '信号灯 + 解读 + 候选动作（你来选，不替你拍板）')}
  ` : '');
  const hasNextActions = !!nextActions || existsSync(join(ventureDir, 'studio', 'next-actions.html'));

  // ── 复盘 stage ──
  const retroBucket = (label: string, cls: string, items: any): string => {
    const arr = Array.isArray(items) ? items : items ? [items] : [];
    if (!arr.length) return '';
    return `
      <div class="retro-bucket retro-bucket--${cls}">
        <div class="retro-bucket__label">${esc(label)}</div>
        <ul class="retro-bucket__list">
          ${arr.map((it) => `<li>${esc(typeof it === 'string' ? it : (it?.text ?? it?.note ?? JSON.stringify(it)))}</li>`).join('')}
        </ul>
      </div>`;
  };
  const retroBuckets = retroData
    ? [
        retroBucket('做得强', 'strong', retroData.strong ?? retroData.strengths),
        retroBucket('中等', 'mid', retroData.mid ?? retroData.medium),
        retroBucket('偏弱', 'weak', retroData.weak ?? retroData.weaknesses),
        retroBucket('已迭代', 'iterated', retroData.iterated ?? retroData.iteration),
      ].join('')
    : '';
  const hasRetroArtifact = !!retroData || reviewReport.trim() || decisions.length > 0;
  const stageRetro = `
    <section class="stage" data-stage="retro" hidden>
      ${naSection}
      ${retroData ? `
        <header class="section__head">
          <h2 class="section__title">复盘</h2>
          <span class="section__count">research/retro-*.yaml</span>
        </header>
        <div class="retro-grid">${retroBuckets}</div>
      ` : ''}
      ${reviewReport.trim() ? `
        <header class="section__head" style="margin-top:20px;">
          <h2 class="section__title">复盘报告</h2>
          <span class="section__count">review_report.md</span>
        </header>
        <article class="md-card md-content">${renderMarkdown(reviewReport)}</article>
      ` : ''}
      ${hasRetroArtifact ? `
        <header class="section__head" style="margin-top:20px;">
          <h2 class="section__title">完整决策时间线</h2>
          <span class="section__count">共 ${decisions.length} 条</span>
        </header>
        ${decisions.length === 0
          ? `<p class="empty">尚无决策。</p>`
          : `<ul class="rows">${decisionsList}</ul>`}
      ` : pendingState(STAGE_LABELS.retro, STAGE_SKILL_HINT.retro)}
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
.btn-ghost--danger:hover { border-color: oklch(58% 0.18 25); color: oklch(50% 0.2 25); background: oklch(96% 0.03 25); }

/* ───── Inline panel form (interactive edit/supersede) ───── */
.panel-form { margin-top: 14px; }
.pf { display: flex; flex-direction: column; gap: 12px; padding: 16px; background: var(--surface-2); border: 1px solid var(--hairline); border-radius: var(--r-lg); }
.pf-title { font-size: 13px; font-weight: 700; color: var(--ink); }
.pf-note, .pf-hint p { font-size: 12px; color: var(--mute); line-height: 1.55; margin: 0; }
.pf-row { display: flex; flex-direction: column; gap: 5px; }
.pf-label { font-size: 11.5px; font-weight: 600; color: var(--ink-2); }
.pf textarea, .pf input, .pf select {
  font: inherit; font-size: 13px; color: var(--ink);
  padding: 8px 10px; border: 1px solid var(--hairline-strong); border-radius: var(--r-md);
  background: var(--surface); width: 100%; box-sizing: border-box; resize: vertical;
}
.pf textarea:focus, .pf input:focus, .pf select:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
.pf-actions { display: flex; gap: 8px; margin-top: 2px; }
.pf-hint { display: flex; flex-direction: column; gap: 8px; padding: 14px; background: var(--surface-2); border: 1px dashed var(--hairline-strong); border-radius: var(--r-lg); }
.pf-cmd { display: block; font-family: var(--mono); font-size: 11.5px; padding: 8px 10px; background: var(--ink); color: var(--surface); border-radius: var(--r-md); cursor: copy; word-break: break-all; }

/* ───── Toast ───── */
#lumi-toast {
  position: fixed; left: 50%; bottom: 28px; transform: translateX(-50%) translateY(20px);
  background: var(--ink); color: var(--surface); font-size: 13px; font-weight: 500;
  padding: 10px 18px; border-radius: 999px; box-shadow: 0 8px 30px oklch(0% 0 0 / 0.25);
  opacity: 0; pointer-events: none; transition: all 220ms var(--ease); z-index: 9999;
}
#lumi-toast.is-show { opacity: 1; transform: translateX(-50%) translateY(0); }
#lumi-toast.is-warn { background: oklch(50% 0.2 25); }
#lumi-toast.is-ok { background: oklch(48% 0.12 150); }
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

/* ── 数据来源徽章（真实/宿主代搜/估算/mock）── */
.src-badge {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 11px; font-weight: 600; line-height: 1;
  padding: 3px 7px; border-radius: 999px; white-space: nowrap;
}
.src--real    { background: var(--moss-soft);  color: var(--moss); }
.src--agent   { background: var(--accent-soft); color: var(--accent); }
.src--est     { background: var(--ochre-soft); color: var(--ochre); }
.src--pending { background: var(--ash-soft);   color: var(--mute); }
.src--mock    { background: var(--ash-soft);   color: var(--mute-2); }

/* ── 消耗看板 ── */
.usage-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 10px; }
@media (max-width: 1100px) { .usage-grid { grid-template-columns: repeat(2, 1fr); } }
.usage-cell {
  background: var(--surface); border-radius: var(--r-xl); padding: 14px 16px;
  box-shadow: var(--shadow-soft); display: flex; flex-direction: column; gap: 3px;
}
.usage-cell--good { background: color-mix(in oklch, var(--moss-soft) 55%, var(--surface)); }
.usage-cell__num { font-size: 22px; font-weight: 700; color: var(--ink); letter-spacing: -0.01em; }
.usage-cell__lbl { font-size: 12px; color: var(--ink-2); font-weight: 600; }
.usage-cell__sub { font-size: 11px; color: var(--mute); }
.usage-svc { display: flex; flex-direction: column; gap: 1px; margin-top: 2px; }
.usage-svc li {
  display: flex; justify-content: space-between; align-items: center;
  padding: 7px 12px; border-radius: var(--r-md);
  font-size: 12px; border-bottom: 1px solid var(--hairline);
}
.usage-svc li:last-child { border-bottom: 0; }
.usage-svc__name { color: var(--ink-2); }
.usage-svc__meta { color: var(--mute); font-family: var(--mono); font-size: 11px; }
.usage-note { font-size: 11px; color: var(--mute); margin-top: 6px; line-height: 1.5; }

/* ── 调研足迹 ── */
.footprint { display: flex; flex-direction: column; gap: 6px; }
.footprint__row {
  display: grid; grid-template-columns: 64px 1fr auto auto; gap: 10px; align-items: center;
  padding: 9px 14px; background: var(--surface); border-radius: var(--r-lg); box-shadow: var(--shadow-soft);
}
.footprint__chan { font-size: 12px; font-weight: 600; color: var(--accent); }
.footprint__q { font-size: 13px; color: var(--ink-2); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.footprint__cnt { font-size: 12px; color: var(--mute); font-family: var(--mono); }

/* ── 教练梳理结论 ── */
.coach-brief { display: flex; flex-direction: column; gap: 1px; background: var(--surface); border-radius: var(--r-xl); box-shadow: var(--shadow-soft); overflow: hidden; }
.coach-brief__row { display: grid; grid-template-columns: 104px 1fr; gap: 12px; padding: 12px 16px; border-bottom: 1px solid var(--hairline); }
.coach-brief__row:last-child { border-bottom: 0; }
.coach-brief__row--risk { background: color-mix(in oklch, var(--accent-soft) 35%, var(--surface)); }
.coach-brief__row--test { background: color-mix(in oklch, var(--moss-soft) 45%, var(--surface)); }
.coach-brief__k { font-size: 12px; font-weight: 600; color: var(--mute); padding-top: 1px; }
.coach-brief__v { font-size: 14px; color: var(--ink); line-height: 1.55; }
.coach-hint { font-size: 12px; color: var(--mute); margin-top: 12px; line-height: 1.6; padding: 12px 14px; background: var(--ash-soft); border-radius: var(--r-lg); }
.coach-hint code { font-family: var(--mono); font-size: 0.9em; color: var(--accent); }

/* ── 完成后的下一步面板 ── */
.nsteps { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
@media (max-width: 1100px) { .nsteps { grid-template-columns: 1fr; } }
.nstep { background: var(--surface); border-radius: var(--r-xl); padding: 14px 16px; box-shadow: var(--shadow-soft);
  display: flex; flex-direction: column; gap: 7px; }
.nstep__h { display: flex; align-items: center; gap: 8px; }
.nstep__ic { font-size: 17px; line-height: 1; }
.nstep__t { font-size: 14px; font-weight: 600; color: var(--ink); }
.nstep__tag { margin-left: auto; font-size: 10px; font-weight: 600; color: var(--accent);
  background: var(--accent-soft); padding: 2px 7px; border-radius: 999px; white-space: nowrap; }
.nstep__s { font-size: 12px; color: var(--mute); line-height: 1.55; }
.nstep__code { font-family: var(--mono); font-size: 11px; color: var(--ink-2); background: var(--ash-soft);
  border-radius: var(--r-md); padding: 7px 10px; cursor: copy; word-break: break-all; line-height: 1.5; }
.nstep__code:hover { color: var(--accent); }

/* ── 验证信号漏斗 ── */
.vsig { display: flex; flex-direction: column; gap: 8px; background: var(--surface); border-radius: var(--r-xl);
  padding: 16px 18px; box-shadow: var(--shadow-soft); }
.vsig__row { display: grid; grid-template-columns: 72px 52px 44px 1fr; gap: 12px; align-items: center; }
.vsig__l { font-size: 13px; color: var(--ink-2); }
.vsig__n { font-family: var(--mono); font-size: 18px; font-weight: 600; color: var(--ink); text-align: right; }
.vsig__n--strong { color: var(--accent); }
.vsig__pct { font-family: var(--mono); font-size: 12px; color: var(--mute); text-align: right; }
.vsig__bar { height: 8px; border-radius: 999px; background: var(--ash-soft); overflow: hidden; }
.vsig__bar i { display: block; height: 100%; background: var(--accent); border-radius: 999px; }
.vsig-chan { margin-top: 10px; background: var(--surface); border-radius: var(--r-lg); padding: 12px 16px; box-shadow: var(--shadow-soft); }
.vsig-chan__h { font-size: 12px; font-weight: 600; color: var(--mute); margin-bottom: 8px; }
.vsig-chan__row { display: flex; justify-content: space-between; gap: 12px; padding: 5px 0; border-bottom: 1px solid var(--hairline); font-size: 12px; }
.vsig-chan__row:last-child { border-bottom: 0; }
.vsig-chan__src { color: var(--accent); font-weight: 600; }
.vsig-chan__m { color: var(--mute); font-family: var(--mono); }

/* ── 内容画廊 ── */
.cgal { display: grid; grid-template-columns: repeat(auto-fill, minmax(132px, 1fr)); gap: 12px; }
.cgal__item { margin: 0; background: var(--surface); border-radius: var(--r-lg); overflow: hidden; box-shadow: var(--shadow-soft); }
.cgal__img { width: 100%; aspect-ratio: 3/4; object-fit: cover; display: block; cursor: pointer; transition: opacity .15s; }
.cgal__img:hover { opacity: .82; }
.cgal__cap { display: flex; align-items: center; justify-content: space-between; gap: 6px; padding: 6px 9px; }
.cgal__nm { font-family: var(--mono); font-size: 10px; color: var(--mute); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cgal__dl { font-size: 13px; color: var(--accent); text-decoration: none; flex: none; }
.cgal-copy { margin-top: 12px; background: var(--surface); border-radius: var(--r-lg); padding: 12px 16px; box-shadow: var(--shadow-soft); }
.cgal-copy__h { font-size: 12px; font-weight: 600; color: var(--mute); margin-bottom: 8px; }
.cgal-copy__t { font-family: var(--mono); font-size: 11px; line-height: 1.6; color: var(--ink-2); white-space: pre-wrap; cursor: copy; max-height: 220px; overflow: hidden; }
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

/* ───── Refresh bar (数据更新于) ───── */
.refresh-bar {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  padding: 5px 28px;
  background: var(--ash-soft);
  border-bottom: 1px solid var(--hairline);
  font-family: var(--mono);
  font-size: 10.5px;
  color: var(--mute);
  letter-spacing: 0.02em;
}
.refresh-bar__time { color: var(--ink-2); }
.refresh-bar__sep { color: var(--hairline-strong); }
.refresh-bar code {
  font-family: var(--mono);
  background: var(--surface);
  border: 1px solid var(--hairline);
  border-radius: var(--r-sm);
  padding: 1px 5px;
  color: var(--ink-2);
}

/* ───── Deploy panel ───── */
.deploy-panel {
  position: absolute;
  right: 16px;
  top: calc(var(--top-h) + 4px);
  z-index: 20;
  width: 380px;
  background: var(--surface);
  border-radius: var(--r-lg);
  box-shadow: 0 8px 28px oklch(20% 0.02 60 / 0.16), 0 0 0 1px var(--hairline);
  padding: 16px 18px;
}
.deploy-panel[hidden] { display: none; }
.deploy-panel__title { font-size: 13.5px; font-weight: 600; color: var(--ink); margin-bottom: 4px; }
.deploy-panel__note { font-size: 12px; color: var(--mute); margin-bottom: 12px; }
.deploy-panel__row { display: flex; align-items: flex-start; gap: 8px; margin-bottom: 8px; }
.deploy-panel__way {
  font-family: var(--mono); font-size: 10px; letter-spacing: 0.06em;
  color: var(--mute); background: var(--surface-2);
  padding: 3px 7px; border-radius: var(--r-sm); flex-shrink: 0; margin-top: 1px;
}
.deploy-panel__code {
  font-family: var(--mono); font-size: 11.5px;
  color: var(--accent); background: var(--accent-soft);
  padding: 4px 9px; border-radius: var(--r-sm);
  cursor: copy; word-break: break-word; line-height: 1.45;
  transition: background 140ms var(--ease);
}
.deploy-panel__code:hover { background: var(--accent-tint); }
[data-copy] { cursor: copy; position: relative; }
[data-copy].copied::after {
  content: '已复制 ✓';
  position: absolute; left: 0; top: -22px;
  font-family: var(--sans); font-size: 10.5px;
  background: var(--ink); color: var(--surface);
  padding: 2px 7px; border-radius: var(--r-sm);
  white-space: nowrap;
}

/* ───── Nav hint (新建 venture) ───── */
.nav-hint {
  font-size: 11.5px;
  color: var(--mute);
  line-height: 1.5;
  padding: 6px 12px 4px;
}
.nav-hint[hidden] { display: none; }
.nav-hint code {
  display: inline-block;
  font-family: var(--mono); font-size: 11px;
  color: var(--accent); background: var(--accent-soft);
  padding: 2px 6px; border-radius: var(--r-sm);
  margin-top: 4px; cursor: copy;
}

/* ───── Breadcrumb home link ───── */
.crumb-home {
  color: var(--accent);
  transition: color 140ms var(--ease);
}
.crumb-home:hover { color: var(--ink); }

/* ───── Prog cells clickable ───── */
.prog-cell { cursor: pointer; transition: background 140ms var(--ease), box-shadow 140ms var(--ease); }
.prog-cell:hover { background: oklch(94% 0.016 80); }
.prog-cell.is-selected { box-shadow: inset 0 0 0 1.5px var(--accent); }
.prog-cell:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; }

/* ───── Artifact card (real link to generated file) ───── */
.artifact-card {
  display: flex; align-items: center; gap: 14px;
  padding: 16px 18px;
  background: var(--surface);
  border-radius: var(--r-xl);
  box-shadow: var(--shadow-soft);
  transition: box-shadow 160ms var(--ease), transform 160ms var(--ease);
  border-left: 3px solid var(--accent);
}
.artifact-card:hover {
  box-shadow: 0 4px 14px oklch(20% 0.02 60 / 0.1), 0 0 0 1px var(--hairline-strong);
  transform: translateY(-1px);
}
.artifact-card__icon { font-size: 22px; flex-shrink: 0; }
.artifact-card__text { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }
.artifact-card__title { font-size: 14px; font-weight: 600; color: var(--ink); }
.artifact-card__sub { font-size: 12px; color: var(--mute); }
.artifact-card__arrow {
  font-family: var(--mono); font-size: 16px; color: var(--accent);
  flex-shrink: 0; transition: transform 160ms var(--ease);
}
.artifact-card:hover .artifact-card__arrow { transform: translateX(3px); }

.empty-card__fallback {
  font-size: 11.5px; color: var(--mute-2); margin-top: 10px; line-height: 1.5;
}
.empty-card__fallback code, .empty-card__hint code {
  font-family: var(--mono); font-size: 0.92em;
  background: var(--surface-2); padding: 1px 5px; border-radius: var(--r-sm);
  color: var(--ink-2);
}

/* ───── Direction list (产品 stage) ───── */
.dir-list { display: flex; flex-direction: column; gap: 8px; }
.dir-row {
  display: flex; gap: 12px;
  padding: 14px 16px;
  background: var(--surface);
  border-radius: var(--r-lg);
  box-shadow: var(--shadow-soft);
}
.dir-row.is-chosen {
  background: var(--accent-soft);
  box-shadow: 0 0 0 1.5px var(--accent);
}
.dir-row__mark { font-size: 14px; color: var(--mute-2); flex-shrink: 0; line-height: 1.6; }
.dir-row.is-chosen .dir-row__mark { color: var(--accent); }
.dir-row__body { display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 0; }
.dir-row__risk { font-size: 12px; color: oklch(50% 0.14 40); line-height: 1.5; }
.dir-row__cta { margin-top: 8px; }
.dir-row__cta .btn-ghost { font-size: 12px; height: 28px; padding: 4px 12px; }

/* ───── Design System demo (P3) ───── */
.ds { display: grid; grid-template-columns: 300px 1fr; gap: 16px; align-items: start; }
@media (max-width: 980px) { .ds { grid-template-columns: 1fr; } }
.ds-panel {
  display: flex; flex-direction: column; gap: 14px;
  padding: 16px; background: var(--surface-2);
  border: 1px solid var(--hairline); border-radius: var(--r-lg);
}
.ds-grp { display: flex; flex-direction: column; gap: 9px; }
.ds-grp__t { font-family: var(--mono); font-size: 10px; letter-spacing: 0.06em; text-transform: uppercase; color: var(--ink-2); padding-bottom: 5px; border-bottom: 1px solid var(--hairline); }
.ds-sw { display: inline-block; width: 11px; height: 11px; border-radius: 3px; border: 1px solid var(--hairline-strong); vertical-align: middle; margin-left: 4px; }
.ds-hint { font-size: 11px; color: var(--mute); line-height: 1.5; }
.ds-hint code { background: var(--surface); padding: 1px 5px; border-radius: 4px; }
.ds-stage { border: 1px solid var(--hairline); border-radius: var(--r-lg); overflow: hidden; background: var(--surface); display: flex; flex-direction: column; min-height: 520px; }
.ds-stage__bar { display: flex; align-items: center; gap: 8px; padding: 9px 14px; font-family: var(--mono); font-size: 11px; color: var(--ink-2); border-bottom: 1px solid var(--hairline); background: var(--surface-2); }
.ds-stage__dot { width: 8px; height: 8px; border-radius: 50%; background: oklch(60% 0.14 150); }
.ds-frame { width: 100%; flex: 1; min-height: 480px; border: 0; display: block; background: white; }
.ds-stage__empty { padding: 60px 24px; text-align: center; color: var(--mute); line-height: 1.7; font-size: 13px; }
.ds-ctl { display: flex; flex-direction: column; gap: 5px; font-size: 11.5px; color: var(--ink-2); font-weight: 600; }
.ds-ctl b { color: var(--accent); font-variant-numeric: tabular-nums; }
.ds-ctl select, .ds-ctl input[type=text] {
  font: inherit; font-size: 13px; padding: 7px 10px; border: 1px solid var(--hairline-strong);
  border-radius: var(--r-md); background: var(--surface); color: var(--ink); width: 100%; box-sizing: border-box;
}
.ds-ctl input[type=range] { width: 100%; accent-color: var(--accent); }
.ds-actions { display: flex; flex-direction: column; gap: 8px; margin-top: 4px; }
/* W4 · 引导式生成门 */
.gate { display: flex; flex-direction: column; gap: 12px; }
.gate-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 7px; }
.gate-row { display: flex; gap: 9px; align-items: flex-start; font-size: 13px; line-height: 1.5; }
.gate-row__mark { flex-shrink: 0; width: 18px; height: 18px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: oklch(100% 0 0); }
.gate-row--ok .gate-row__mark { background: oklch(60% 0.14 150); }
.gate-row--no .gate-row__mark { background: oklch(72% 0.13 85); }
.gate-row__txt em { color: var(--ink-2); font-style: normal; font-size: 11.5px; display: block; }
.gate-note { font-size: 13px; line-height: 1.6; color: var(--ink); background: var(--surface-2); border-left: 3px solid var(--moss); padding: 10px 12px; border-radius: 8px; }
.gate-confirm { font-size: 13px; line-height: 1.6; color: var(--ink); padding: 10px 12px; border: 1px solid var(--hairline-strong); border-radius: 8px; }
.gate-diff { font-family: var(--mono); font-size: 11px; color: var(--mute); line-height: 1.5; }
.ds-preview { display: grid; grid-template-columns: 1.7fr 1fr; gap: 14px; align-items: start; }
@media (max-width: 600px) { .ds-preview { grid-template-columns: 1fr; } }
.ds-pv-card {
  background: var(--ds-surface); border: 1px solid var(--hairline);
  border-radius: var(--ds-radius); padding: 20px;
  box-shadow: 0 6px 24px oklch(0% 0 0 / 0.07); transition: border-radius 160ms var(--ease);
}
.ds-pv-card--lg { display: flex; flex-direction: column; gap: 10px; }
.ds-pv-eyebrow { font-family: var(--mono); font-size: 10.5px; letter-spacing: 0.08em; color: var(--ds-accent); text-transform: uppercase; }
.ds-pv-h { font-size: clamp(20px, 3vw, 30px); line-height: 1.12; color: var(--ds-ink); margin: 0; }
.ds-pv-body { font-size: 13.5px; line-height: 1.6; color: var(--ds-ink2); margin: 0; }
.ds-pv-btns { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; margin-top: 4px; }
.ds-pv-btn { font: inherit; font-size: 13px; font-weight: 600; padding: 9px 18px; border-radius: var(--ds-radius); cursor: pointer; transition: all 140ms var(--ease); border: 1px solid transparent; }
.ds-pv-btn--primary { background: var(--ds-accent); color: oklch(100% 0 0); }
.ds-pv-btn--primary:hover { filter: brightness(0.92); }
.ds-pv-btn--ghost { background: transparent; border-color: var(--ds-accent); color: var(--ds-accent); }
.ds-pv-chip { font-size: 11.5px; padding: 3px 11px; border-radius: 999px; background: color-mix(in oklch, var(--ds-accent) 14%, transparent); color: var(--ds-accent); font-weight: 600; }
.ds-pv-side { display: flex; flex-direction: column; gap: 10px; }
.ds-pv-card--sm { display: flex; align-items: center; gap: 10px; padding: 14px 16px; font-size: 13px; color: var(--ds-ink2); }
.ds-pv-num { display: inline-flex; width: 26px; height: 26px; align-items: center; justify-content: center; border-radius: var(--ds-radius); background: var(--ds-accent); color: oklch(100% 0 0); font-weight: 700; font-size: 12px; }
.ds-pv-swatches { display: flex; flex-wrap: wrap; gap: 6px; }
.dir-row__title { font-size: 13.5px; font-weight: 600; color: var(--ink); }
.dir-row__badge {
  font-family: var(--mono); font-size: 10px; font-weight: 500;
  color: var(--accent); background: var(--surface);
  padding: 1px 6px; border-radius: 999px; margin-left: 4px;
}
.dir-row__angle { font-size: 12px; color: var(--ink-2); }
.dir-row__why { font-size: 12px; color: var(--mute); line-height: 1.55; }

/* ───── Landing version list (构建 stage) ───── */
.ver-list { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 8px; }
.ver-row {
  display: flex; align-items: center; gap: 4px;
  background: var(--surface-2);
  border-radius: var(--r-md);
  padding: 3px 8px;
}
.ver-row a { font-family: var(--mono); font-size: 11.5px; color: var(--ink-2); }
.ver-row a:hover { color: var(--accent); }
.ver-row__latest {
  font-family: var(--mono); font-size: 9.5px;
  color: var(--moss); background: oklch(94% 0.05 145);
  padding: 1px 5px; border-radius: 999px;
}

/* ───── Retro buckets (复盘 stage) ───── */
.retro-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}
@media (max-width: 900px) { .retro-grid { grid-template-columns: 1fr; } }
.retro-bucket {
  background: var(--surface);
  border-radius: var(--r-lg);
  padding: 14px 16px;
  box-shadow: var(--shadow-soft);
  border-left: 3px solid var(--hairline-strong);
}
.retro-bucket--strong { border-left-color: var(--moss); background: var(--moss-soft); }
.retro-bucket--mid { border-left-color: var(--ochre); background: var(--ochre-soft); }
.retro-bucket--weak { border-left-color: var(--mute-2); }
.retro-bucket--iterated { border-left-color: var(--accent); background: var(--accent-soft); }
.retro-bucket__label {
  font-family: var(--mono); font-size: 10.5px; letter-spacing: 0.08em;
  font-weight: 600; color: var(--mute); margin-bottom: 8px;
}
.retro-bucket__list { display: flex; flex-direction: column; gap: 6px; }
.retro-bucket__list li {
  font-size: 13px; line-height: 1.55; color: var(--ink-2);
  padding-left: 12px; position: relative;
}
.retro-bucket__list li::before {
  content: '·'; position: absolute; left: 2px; color: var(--mute-2);
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

/* ───────── W2 · 下一步行动：看板 + 脑图 ───────── */
.na { display: flex; flex-direction: column; gap: 14px; }
.na-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.na-seg { flex: 0 0 auto; }
.na-print { font-size: 12px; height: 30px; padding: 5px 14px; }
.na-signals { display: flex; flex-direction: column; gap: 0; border: 1px solid var(--hairline); border-radius: var(--r-lg); overflow: hidden; background: var(--surface); }
.na-signals__head { font-family: var(--mono); font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase; color: var(--ink-2); padding: 9px 14px; background: var(--surface-2); border-bottom: 1px solid var(--hairline); }
.na-sig { display: grid; grid-template-columns: auto auto auto 1fr auto; align-items: center; gap: 10px; padding: 10px 14px; border-bottom: 1px solid var(--hairline); font-size: 13px; }
.na-sig:last-child { border-bottom: 0; }
.na-sig__dot { width: 9px; height: 9px; border-radius: 50%; background: var(--mute); }
.na-sig--g .na-sig__dot { background: oklch(60% 0.14 150); }
.na-sig--y .na-sig__dot { background: oklch(74% 0.13 85); }
.na-sig--r .na-sig__dot { background: oklch(58% 0.19 25); }
.na-sig__metric { font-family: var(--mono); font-size: 12px; color: var(--ink); }
.na-sig__val { font-family: var(--mono); font-weight: 700; color: var(--ink); }
.na-sig__interp { color: var(--ink-2); line-height: 1.5; min-width: 0; }
.na-sig__tier { font-family: var(--mono); font-size: 10px; padding: 2px 7px; border-radius: 999px; background: var(--surface-2); color: var(--ink-2); white-space: nowrap; }
.na-sig__tier--C { background: oklch(94% 0.05 60); color: oklch(48% 0.12 50); }

.na-board { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; align-items: start; }
.na-col { background: var(--surface-2); border: 1px solid var(--hairline); border-radius: var(--r-lg); display: flex; flex-direction: column; min-height: 120px; }
.na-col__head { display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; font-weight: 600; font-size: 13px; border-bottom: 1px solid var(--hairline); }
.na-col__n { font-family: var(--mono); font-size: 11px; color: var(--ink-2); background: var(--surface); border-radius: 999px; padding: 1px 8px; }
.na-col__drop { display: flex; flex-direction: column; gap: 8px; padding: 10px; flex: 1; transition: background 120ms var(--ease); }
.na-col__drop.is-over { background: color-mix(in oklch, var(--moss-soft) 60%, var(--surface)); outline: 2px dashed var(--moss); outline-offset: -4px; border-radius: 8px; }
.na-col__empty { color: var(--mute); font-size: 12px; text-align: center; padding: 16px 4px; border: 1px dashed var(--hairline-strong); border-radius: 8px; }
.na-add { margin: 0 10px 10px; font-family: inherit; font-size: 12px; color: var(--ink-2); background: transparent; border: 1px dashed var(--hairline-strong); border-radius: 8px; padding: 7px; cursor: pointer; transition: all 120ms var(--ease); }
.na-add:hover { color: var(--ink); border-color: var(--moss); }
.na-card { display: flex; gap: 0; background: var(--surface); border: 1px solid var(--hairline); border-radius: 10px; overflow: hidden; cursor: grab; transition: box-shadow 120ms var(--ease), border-color 120ms var(--ease); }
.na-card:hover { border-color: var(--hairline-strong); box-shadow: 0 2px 10px oklch(20% 0 0 / 0.06); }
.na-card.is-dragging { opacity: 0.5; cursor: grabbing; }
.na-card__bar { width: 4px; flex-shrink: 0; background: var(--mute); }
.na-card--high .na-card__bar { background: oklch(50% 0.18 25); }
.na-card--medium .na-card__bar { background: oklch(72% 0.13 85); }
.na-card--low .na-card__bar { background: var(--mute); }
.na-card__body { padding: 10px 12px; flex: 1; min-width: 0; }
.na-card__title { font-size: 13.5px; font-weight: 600; line-height: 1.4; color: var(--ink); }
.na-card__detail { font-size: 12px; color: var(--ink-2); line-height: 1.5; margin-top: 5px; }
.na-card__foot { display: flex; align-items: center; gap: 8px; margin-top: 8px; }
.na-card__spacer { flex: 1; }
.na-chip { font-family: var(--mono); font-size: 10.5px; padding: 2px 7px; border-radius: 999px; background: color-mix(in oklch, var(--moss-soft) 70%, var(--surface)); color: var(--moss); text-decoration: none; cursor: pointer; }
.na-chip:hover { background: var(--moss); color: oklch(100% 0 0); }
.na-card__src { font-family: var(--mono); font-size: 10px; color: var(--mute); }
.na-card__x { background: none; border: none; color: var(--mute); font-size: 16px; line-height: 1; cursor: pointer; padding: 0 2px; }
.na-card__x:hover { color: oklch(55% 0.18 25); }

.na-mind { border: 1px solid var(--hairline); border-radius: var(--r-lg); background: var(--surface); position: relative; }
.na-mind__tools { position: absolute; top: 10px; right: 10px; display: flex; gap: 4px; z-index: 2; }
.na-mind__tools button { font-family: var(--mono); font-size: 12px; min-width: 30px; height: 28px; padding: 0 8px; border: 1px solid var(--hairline); background: var(--surface); color: var(--ink-2); border-radius: 7px; cursor: pointer; }
.na-mind__tools button:hover { color: var(--ink); border-color: var(--hairline-strong); }
.na-mind__canvas { overflow: hidden; height: 460px; border-radius: var(--r-lg); }
#na-mind-svg { width: 100%; height: 100%; display: block; font-family: var(--sans); }
.na-mind-link { fill: none; stroke: var(--hairline-strong); stroke-width: 1.5px; }
.na-mind-node rect { fill: var(--surface); stroke: var(--hairline-strong); }
.na-mind-node--d0 rect { fill: var(--ink); stroke: var(--ink); }
.na-mind-node--d0 text { fill: oklch(100% 0 0); font-weight: 700; }
.na-mind-node--d1 rect { fill: color-mix(in oklch, var(--moss-soft) 60%, var(--surface)); stroke: var(--moss); }
.na-mind-node text { fill: var(--ink); font-size: 12px; }
.na-foot { font-family: var(--mono); font-size: 11px; color: var(--mute); line-height: 1.5; }
@media (max-width: 900px) { .na-board { grid-template-columns: 1fr; } }

/* ───────── W3 · 付款验证 ───────── */
.pay { border: 1px solid var(--hairline); border-radius: var(--r-lg); background: var(--surface); padding: 16px; }
.pay-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.pay-kpi { background: var(--surface-2); border: 1px solid var(--hairline); border-radius: 12px; padding: 14px 16px; }
.pay-kpi__v { font-size: 26px; font-weight: 700; line-height: 1.1; color: var(--ink); display: flex; align-items: center; gap: 7px; }
.pay-cur { font-size: 13px; font-weight: 600; color: var(--ink-2); }
.pay-kpi__l { font-family: var(--mono); font-size: 10.5px; letter-spacing: 0.04em; color: var(--ink-2); margin-top: 6px; text-transform: uppercase; }
.pay-kpi--sig .pay-kpi__v { font-size: 17px; }
.pay-dot { width: 11px; height: 11px; border-radius: 50%; display: inline-block; }
.pay-kpi--g { background: color-mix(in oklch, oklch(60% 0.14 150) 14%, var(--surface)); border-color: color-mix(in oklch, oklch(60% 0.14 150) 40%, var(--hairline)); }
.pay-kpi--g .pay-dot { background: oklch(60% 0.14 150); }
.pay-kpi--r { background: color-mix(in oklch, oklch(58% 0.19 25) 12%, var(--surface)); border-color: color-mix(in oklch, oklch(58% 0.19 25) 36%, var(--hairline)); }
.pay-kpi--r .pay-dot { background: oklch(58% 0.19 25); }
.pay-interp { margin-top: 12px; color: var(--ink); line-height: 1.6; font-size: 14px; }
.pay-note { margin-top: 8px; font-family: var(--mono); font-size: 11px; color: var(--mute); line-height: 1.5; }
.pay-note code { background: var(--surface-2); padding: 1px 6px; border-radius: 4px; }
@media (max-width: 760px) { .pay-grid { grid-template-columns: repeat(2, 1fr); } }

/* ───────── 打印（看板 + 脑图 贴墙）───────── */
@media print {
  @page { margin: 14mm; }
  .topbar, .nav, .resizer, .panel, .na-toolbar, .na-add, .na-card__x, .seg-group { display: none !important; }
  html, body, .shell, .main { display: block !important; height: auto !important; overflow: visible !important; background: #fff !important; }
  .shell { grid-template-columns: 1fr !important; }
  .stage[hidden] { display: block !important; }   /* print whatever is on screen */
  .stage:not([data-stage="retro"]) { display: none !important; }
  .na-board { display: block !important; }
  .na-col { break-inside: avoid; border: 1px solid #999 !important; margin-bottom: 10px; background: #fff !important; }
  .na-card { break-inside: avoid; border: 1px solid #ccc !important; box-shadow: none !important; }
  .na-card__title::before { content: "☐  "; }
  .na-mind { break-inside: avoid; }
  .na-mind__canvas { height: auto !important; }
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
    ${share
      ? `<a class="btn-primary" href="${esc(share.url)}" target="_blank" rel="noopener">已上线 ↗</a>`
      : `<button class="btn-primary" id="deploy-toggle" aria-expanded="false">部署</button>`}
  </div>
</header>

<!-- 数据更新于 bar -->
<div class="refresh-bar">
  <span class="refresh-bar__time">数据更新于 ${esc(renderedAt)}</span>
  <span class="refresh-bar__sep">·</span>
  <span class="refresh-bar__hint">要刷新？跟 AI 说「重新渲染这个 venture」，或 CLI 跑 <code>lumilab render ${esc(ventureName)}</code></span>
</div>

${share ? '' : `
<!-- 部署面板（静态页无法直接部署，给出可复制命令） -->
<div class="deploy-panel" id="deploy-panel" hidden>
  <div class="deploy-panel__title">部署这个 venture 的 Landing 验证页</div>
  <div class="deploy-panel__note">静态页跑不了部署。用下面任一方式触发：</div>
  <div class="deploy-panel__row">
    <span class="deploy-panel__way">CLI</span>
    <code class="deploy-panel__code" data-copy="lumilab deploy ${esc(ventureName)}">lumilab deploy ${esc(ventureName)}</code>
  </div>
  <div class="deploy-panel__row">
    <span class="deploy-panel__way">AI 宿主</span>
    <code class="deploy-panel__code" data-copy="用 lumilab-deploy 把 ${esc(ventureName)} 的 landing 验证页部署上线">用 lumilab-deploy 把 ${esc(ventureName)} 的 landing 验证页部署上线</code>
  </div>
</div>
`}

<div class="shell" id="shell">

  <nav class="nav" id="nav">
    <div class="nav-venture">
      <span class="nav-dot"></span>
      <span>${esc(ventureName)}</span>
    </div>
    ${navStages}
    <div class="nav-divider"></div>
    <div class="nav-section-label">其他</div>
    <a class="nav-item--minor" href="../../../_home/home.html" target="_blank" rel="noopener">← 回首页 / 全部 ventures</a>
    <a class="nav-item--minor" id="new-venture-toggle" role="button" tabindex="0">+ 新建 venture</a>
    <div class="nav-hint" id="new-venture-hint" hidden>
      在你的 AI 宿主里说一句你的新想法，或 CLI 跑
      <code data-copy="lumilab idea &quot;&lt;想法&gt;&quot;">lumilab idea "&lt;想法&gt;"</code>
    </div>
  </nav>

  <div class="resizer resizer--left" id="resizer-left" data-resizer="nav" role="separator" aria-orientation="vertical" aria-label="调整左侧导航宽度"></div>

  <main class="main" id="main">
    <div class="main__breadcrumb">
      <a class="crumb-home" href="../../../_home/home.html" target="_blank" rel="noopener">← 回首页</a>
      <span class="crumb-sep">/</span>
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

// ── Runtime mode ──
// Same HTML serves both file:// (read-only) and http://localhost (interactive).
const VENTURE = DATA.venture.name;
const LUMI = { interactive: location.protocol !== 'file:' };

function toast(msg, kind) {
  let t = document.getElementById('lumi-toast');
  if (!t) { t = document.createElement('div'); t.id = 'lumi-toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.className = 'is-show' + (kind ? ' is-' + kind : '');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { t.className = ''; }, 2600);
}

function legacyCopy(txt, ok) {
  try {
    const ta = document.createElement('textarea');
    ta.value = txt; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    const done = document.execCommand('copy');
    document.body.removeChild(ta);
    if (done) ok(); else toast('复制失败，请手动选中', 'warn');
  } catch { toast('复制失败，请手动选中', 'warn'); }
}

async function lumiPost(path, body) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ venture: VENTURE, ...body }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) throw new Error(data.error || ('HTTP ' + res.status));
  return data;
}

// In static (file://) mode, mutation isn't possible — show how to do it via AI host.
function staticHint(label, prompt) {
  toast('本地只读模式：' + label, 'warn');
  const form = document.getElementById('panel-form');
  if (form) {
    form.hidden = false;
    form.innerHTML = '<div class="pf-hint"><p>file:// 是只读看板，写操作要起本地服务或让 AI 宿主代劳。</p>'
      + '<p>跑 <code data-copy="lumilab studio ' + esc(VENTURE) + '">lumilab studio ' + esc(VENTURE) + '</code> 进入可编辑模式，或对 AI 说：</p>'
      + '<code class="pf-cmd" data-copy="' + esc(prompt) + '">' + esc(prompt) + '</code></div>';
  }
}

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
    <div class="panel-actions" data-kind="hypothesis" data-id="\${esc(h.id)}">
      <button class="btn-ghost" data-act="hyp-edit" data-id="\${esc(h.id)}">编辑</button>
      \${h.status === 'superseded' ? '' : \`<button class="btn-ghost" data-act="hyp-supersede" data-id="\${esc(h.id)}">迭代为新版</button>\`}
      <button class="btn-ghost btn-ghost--danger" data-act="hyp-delete" data-id="\${esc(h.id)}">删除</button>
    </div>
    <div class="panel-form" id="panel-form" hidden></div>
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
    <div class="panel-actions" data-kind="decision" data-id="\${esc(d.id)}">
      <button class="btn-ghost" data-act="dec-edit" data-id="\${esc(d.id)}">编辑</button>
      <button class="btn-ghost btn-ghost--danger" data-act="dec-delete" data-id="\${esc(d.id)}">删除</button>
    </div>
    <div class="panel-form" id="panel-form" hidden></div>
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

// ── Hypothesis / decision mutations (interactive mode) ──
function fieldRow(label, inner) {
  return '<label class="pf-row"><span class="pf-label">' + esc(label) + '</span>' + inner + '</label>';
}
function selectFor(name, val, opts) {
  return '<select name="' + name + '">' + opts.map(o =>
    '<option value="' + esc(o[0]) + '"' + (o[0] === val ? ' selected' : '') + '>' + esc(o[1]) + '</option>'
  ).join('') + '</select>';
}
function showForm(title, inner, onSubmit) {
  const form = document.getElementById('panel-form');
  if (!form) return;
  form.hidden = false;
  form.innerHTML = '<form class="pf"><div class="pf-title">' + esc(title) + '</div>' + inner
    + '<div class="pf-actions"><button type="submit" class="btn-primary">保存</button>'
    + '<button type="button" class="btn-ghost" data-pf-cancel>取消</button></div></form>';
  const f = form.querySelector('form');
  f.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const fd = Object.fromEntries(new FormData(f).entries());
    const btn = f.querySelector('button[type=submit]');
    btn.disabled = true; btn.textContent = '保存中…';
    try { await onSubmit(fd); }
    catch (err) { toast('保存失败：' + err.message, 'warn'); btn.disabled = false; btn.textContent = '保存'; }
  });
  f.querySelector('[data-pf-cancel]').addEventListener('click', () => { form.hidden = true; form.innerHTML = ''; });
  form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
function reloadSoon() { toast('已保存，刷新中…', 'ok'); setTimeout(() => location.reload(), 600); }

const CONF_OPTS = [['high','强信号'],['medium','中信号'],['low','弱信号']];
const TS_OPTS = [['pending','待测试'],['running','测试中'],['passed','已验证'],['failed','已证伪']];
const DECTYPE_OPTS = Object.entries(DECISION_TYPE_LABEL);

// Show a copyable AI-host prompt in the panel (generation needs the LLM host, not the server).
function aiHandoff(title, prompt) {
  openPanel('overview');
  const form = document.getElementById('panel-form') || (() => {
    const pb = document.getElementById('panel-body');
    const d = document.createElement('div'); d.id = 'panel-form'; pb.appendChild(d); return d;
  })();
  document.getElementById('panel-title').textContent = title;
  form.hidden = false;
  form.innerHTML = '<div class="pf-hint"><p>生成 Landing 由 AI 宿主完成（需要 LLM，本地 server 只负责记录与重渲）。把下面这句发给你的 AI：</p>'
    + '<code class="pf-cmd" data-copy="' + esc(prompt) + '">' + esc(prompt) + '</code></div>';
}

// W4 · 引导式生成门：前置清单 + 说明 + 确认 + 版本 diff 提示（替代裸「生成」按钮）。
function openGenGate() {
  const b = DATA.build || {};
  const decisions = DATA.decisions || [];
  const dirDec = decisions.find(d => d.type === 'directional' || /方向|direction/i.test(d.decision || ''));
  const hasDirection = !!dirDec;
  const dirTitle = dirDec ? (dirDec.decision || '').replace(/^选定方向[：:]\\s*/, '') : '（用 idea 推导的默认方向）';
  const hypOk = (b.hypothesisCount || 0) >= 2;
  const designOk = !!b.preset;
  const nextVer = (b.landingTop || 0) + 1;
  const presetName = b.preset || 'editorial';

  const row = (ok, label, fixHint) =>
    '<li class="gate-row gate-row--' + (ok ? 'ok' : 'no') + '">'
    + '<span class="gate-row__mark">' + (ok ? '✓' : '!') + '</span>'
    + '<span class="gate-row__txt">' + esc(label) + (ok ? '' : ' <em>' + esc(fixHint) + '</em>') + '</span></li>';

  openPanel('overview');
  document.getElementById('panel-title').textContent = '生成验证页 · 引导门';
  const form = document.getElementById('panel-form') || (() => {
    const pb = document.getElementById('panel-body');
    const d = document.createElement('div'); d.id = 'panel-form'; pb.appendChild(d); return d;
  })();
  form.hidden = false;
  const prompt = '用 ' + VENTURE + ' 的「' + dirTitle + '」方向 + 当前 design_direction.json 设计，生成一个新的 fake-door landing 验证页（landing/v' + nextVer + '），出海默认英文。生成后在 v' + nextVer + ' 顶部用注释标出相对 v' + (b.landingTop || '—') + ' 改了什么（方向 / hero 版式 / 文案）。';
  form.innerHTML =
    '<div class="gate">'
    + '<ul class="gate-list">'
    + row(hasDirection, hasDirection ? '已选方向：' + dirTitle : '未选方向', '可在「产品」阶段选一个，或用默认')
    + row(hypOk, '假设 ' + (b.hypothesisCount || 0) + ' 条' + (hypOk ? '' : '（建议 ≥ 2）'), '先在「想法」阶段落 2 条假设')
    + row(designOk, '设计方向已定：' + presetName + ' preset', '先选设计方向')
    + '</ul>'
    + '<div class="gate-note">这会生成一个 <b>fake-door 验证页</b> —— 不是成品，是测「有没有人愿意买」的仪器。生成后你可以调样式、部署、收数据。</div>'
    + '<div class="gate-confirm">将生成 <b>v' + nextVer + '</b>：方向《' + esc(dirTitle) + '》· 设计《' + esc(presetName) + '》· 语言《English（出海默认）》</div>'
    + '<div class="pf-hint"><p>实际生成由 AI 宿主完成（LLM 写文案/结构）。把下面这句发给你的 AI：</p>'
    + '<code class="pf-cmd" data-copy="' + esc(prompt) + '">' + esc(prompt) + '</code></div>'
    + '<div class="gate-diff">生成后回到右侧 iframe 预览；v' + nextVer + ' vs v' + (b.landingTop || '—') + ' 的差异会标在新页顶部。</div>'
    + '</div>';
  if (LUMI.interactive && hasDirection && dirDec && dirDec.related && dirDec.related[0]) {
    // best-effort: re-affirm the direction selection is on record (no-op if already)
  }
  form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ── W4 · live re-theme: read the design panel into a canonical theme object ──
function readTheme() {
  const ds = document.querySelector('[data-ds]'); if (!ds) return null;
  const v = (sel) => { const el = ds.querySelector(sel); return el ? el.value : undefined; };
  const radius = Number(v('[data-ds-radius]') || 4);
  const space = Number(v('[data-ds-space]') || 100) / 100;
  return {
    preset: v('[data-ds-preset]'),
    accent: v('[data-ds-tok="accent"]'),
    accent2: v('[data-ds-tok="accent2"]'),
    surface: ds.dataset.surfaceLive || ds.dataset.surface,
    ink: ds.dataset.ink,
    ink2: ds.dataset.ink2,
    radius: radius,
    spaceScale: space,
    fontHeading: v('[data-ds-tok="fontHeading"]'),
    fontBody: v('[data-ds-tok="fontBody"]'),
    hero: (ds.querySelector('[data-ds-layout="hero"]') || {}).value,
    button: (ds.querySelector('[data-ds-layout="button"]') || {}).value,
  };
}
// Apply a canonical token to the live landing iframe (same-origin under the daemon).
function dsFrameDoc() {
  const f = document.getElementById('ds-frame');
  try { return f && f.contentDocument ? f.contentDocument : null; } catch (_) { return null; }
}
function dsSetVar(name, val) {
  const doc = dsFrameDoc();
  if (doc && doc.documentElement) doc.documentElement.style.setProperty(name, val);
}
function dsSetBodyAttr(attr, val) {
  const doc = dsFrameDoc();
  if (doc && doc.body) doc.body.setAttribute(attr, val);
}
function dsSwatch(tok, val) {
  const sw = document.querySelector('.ds-sw[data-sw="' + tok + '"]');
  if (sw) sw.style.background = val;
}
// Push the whole current theme onto the iframe (used on iframe load + preset switch).
function dsPushAll() {
  const t = readTheme(); if (!t) return;
  if (t.accent) dsSetVar('--accent', t.accent);
  if (t.accent2) dsSetVar('--accent-2', t.accent2);
  if (t.surface) dsSetVar('--surface', t.surface);
  if (t.ink) dsSetVar('--ink', t.ink);
  if (t.ink2) dsSetVar('--ink-2', t.ink2);
  dsSetVar('--radius', t.radius + 'px');
  dsSetVar('--space-scale', String(t.spaceScale));
  if (t.fontHeading) dsSetVar('--font-heading', t.fontHeading);
  if (t.fontBody) dsSetVar('--font-body', t.fontBody);
  if (t.hero) dsSetBodyAttr('data-hero', t.hero);
  if (t.button) dsSetBodyAttr('data-button', t.button);
}
const DS_PRESETS = {
  editorial:   { accent: 'oklch(45% 0.15 25)',  accent2: 'oklch(70% 0.12 250)', radius: 2,  space: 110, hero: 'editorial', button: 'solid' },
  minimalist:  { accent: 'oklch(42% 0.16 28)',  accent2: 'oklch(66% 0.10 250)', radius: 6,  space: 100, hero: 'split',     button: 'outline' },
  brutalist:   { accent: 'oklch(60% 0.22 30)',  accent2: 'oklch(55% 0.20 280)', radius: 0,  space: 95,  hero: 'split',     button: 'solid' },
  soft:        { accent: 'oklch(62% 0.13 200)', accent2: 'oklch(75% 0.10 320)', radius: 18, space: 120, hero: 'centered',  button: 'pill' },
};
function dsApplyPreset(name) {
  const p = DS_PRESETS[name]; if (!p) return;
  const ds = document.querySelector('[data-ds]'); if (!ds) return;
  const set = (sel, val) => { const el = ds.querySelector(sel); if (el != null && val != null) el.value = val; };
  set('[data-ds-tok="accent"]', p.accent); dsSwatch('accent', p.accent);
  set('[data-ds-tok="accent2"]', p.accent2); dsSwatch('accent2', p.accent2);
  set('[data-ds-radius]', p.radius); const ro = document.querySelector('[data-ds-out="radius"]'); if (ro) ro.textContent = p.radius + 'px';
  set('[data-ds-space]', p.space); const so = document.querySelector('[data-ds-out="space"]'); if (so) so.textContent = (p.space / 100) + '×';
  set('[data-ds-layout="hero"]', p.hero);
  set('[data-ds-layout="button"]', p.button);
  dsPushAll();
}

function handleAction(act, id, el) {
  if (act === 'dir-gen') {
    const title = (el && el.dataset.title) || id;
    const prompt = '用 ' + VENTURE + ' 的「' + title + '」方向生成一个新的 landing 验证页（landing/v<n+1>），出海默认英文';
    if (LUMI.interactive) {
      lumiPost('/api/direction/select', { directionId: id, title })
        .then(() => { toast('已记录方向选择', 'ok'); aiHandoff('生成 Landing · ' + title, prompt); })
        .catch(e => toast('失败：' + e.message, 'warn'));
    } else { aiHandoff('生成 Landing · ' + title, prompt); }
    return;
  }
  if (act === 'design-apply') {
    const theme = readTheme(); if (!theme) return;
    if (!LUMI.interactive) return staticHint('应用设计', '把 ' + VENTURE + ' 的设计 token 写回 design_direction.json + theme.css：' + JSON.stringify(theme));
    const btn = el; if (btn) { btn.disabled = true; btn.textContent = '写入中…'; }
    lumiPost('/api/design/apply', { theme })
      .then((r) => { toast(r.themeCssWritten ? '✓ 已写回 theme.css，刷新中…' : '✓ 已写回 design_direction.json', 'ok'); setTimeout(() => location.reload(), 700); })
      .catch(e => { toast('失败：' + e.message, 'warn'); if (btn) { btn.disabled = false; btn.textContent = '应用设计（确定性写回）'; } });
    return;
  }
  if (act === 'design-gen-gate') { openGenGate(); return; }
  // ── W2 · next-actions kanban card ops ──
  if (act === 'na-print') { window.print(); return; }
  if (act === 'na-del') {
    if (!LUMI.interactive) return staticHint('删除行动卡 ' + id, '删除 ' + VENTURE + ' 的下一步行动 ' + id);
    if (!confirm('删除这条行动？')) return;
    lumiPost('/api/next-action/delete', { id }).then(reloadSoon).catch(e => toast('失败：' + e.message, 'warn'));
    return;
  }
  if (act === 'na-add') {
    const col = (el && el.dataset.col) || 'to_validate';
    if (!LUMI.interactive) return staticHint('加行动卡', '给 ' + VENTURE + ' 的「' + col + '」加一条下一步行动');
    showForm('加一条行动 · ' + col,
      fieldRow('标题', '<input name="title" required placeholder="现在具体做什么？">')
      + fieldRow('说明', '<textarea name="detail" rows="2" placeholder="为什么是它 / 预期验证什么 / 第一步"></textarea>')
      + fieldRow('优先级', selectFor('priority', 'medium', [['high','高'],['medium','中'],['low','低']])),
      async (fd) => { await lumiPost('/api/next-action/add', { task: { ...fd, column: col } }); reloadSoon(); });
    return;
  }
  if (act === 'hyp-edit') {
    if (!LUMI.interactive) return staticHint('编辑假设 ' + id, '编辑 ' + VENTURE + ' 的假设 ' + id);
    const h = DATA.hypotheses.find(x => x.id === id); if (!h) return;
    showForm('编辑假设 ' + id,
      fieldRow('陈述', '<textarea name="fact" rows="2" required>' + esc(h.fact) + '</textarea>')
      + fieldRow('信号', selectFor('confidence', h.confidence, CONF_OPTS))
      + fieldRow('测试方法', '<textarea name="test_method" rows="2">' + esc(h.test_method || '') + '</textarea>')
      + fieldRow('测试状态', selectFor('test_status', h.test_status, TS_OPTS)),
      async (fd) => { await lumiPost('/api/hypothesis/save', { hypothesis: { id, ...fd } }); reloadSoon(); });
  } else if (act === 'hyp-supersede') {
    if (!LUMI.interactive) return staticHint('迭代假设 ' + id, '把 ' + VENTURE + ' 的假设 ' + id + ' 迭代为新版');
    const h = DATA.hypotheses.find(x => x.id === id); if (!h) return;
    showForm('迭代 ' + id + ' 为新版',
      '<p class="pf-note">旧假设会标记为「已迭代」并保留历史，新假设取代它。</p>'
      + fieldRow('新陈述', '<textarea name="fact" rows="2" required>' + esc(h.fact) + '</textarea>')
      + fieldRow('信号', selectFor('confidence', h.confidence, CONF_OPTS))
      + fieldRow('测试方法', '<textarea name="test_method" rows="2">' + esc(h.test_method || '') + '</textarea>')
      + fieldRow('迭代原因', '<input name="reason" placeholder="为什么要改？新证据是什么？">'),
      async (fd) => { await lumiPost('/api/hypothesis/supersede', { id, ...fd }); reloadSoon(); });
  } else if (act === 'hyp-delete') {
    if (!LUMI.interactive) return staticHint('删除假设 ' + id, '归档 ' + VENTURE + ' 的假设 ' + id);
    if (!confirm('归档假设 ' + id + '？历史会保留，可恢复。')) return;
    lumiPost('/api/hypothesis/delete', { id }).then(reloadSoon).catch(e => toast('失败：' + e.message, 'warn'));
  } else if (act === 'dec-edit') {
    if (!LUMI.interactive) return staticHint('编辑决策 ' + id, '编辑 ' + VENTURE + ' 的决策 ' + id);
    const d = DATA.decisions.find(x => x.id === id); if (!d) return;
    showForm('编辑决策 ' + id,
      fieldRow('决策', '<textarea name="decision" rows="2" required>' + esc(d.decision) + '</textarea>')
      + fieldRow('理由', '<textarea name="rationale" rows="2">' + esc(d.rationale || '') + '</textarea>')
      + fieldRow('类型', selectFor('type', d.type, DECTYPE_OPTS)),
      async (fd) => { await lumiPost('/api/decision/save', { decision: { id, ...fd } }); reloadSoon(); });
  } else if (act === 'dec-delete') {
    if (!LUMI.interactive) return staticHint('删除决策 ' + id, '删除 ' + VENTURE + ' 的决策 ' + id);
    if (!confirm('删除决策 ' + id + '？')) return;
    lumiPost('/api/decision/delete', { id }).then(reloadSoon).catch(e => toast('失败：' + e.message, 'warn'));
  }
}

// ── Stage switching (no scroll, no hash) ──
// Keeps left-nav AND middle prog-cells visually in sync.
function switchStage(stage) {
  document.querySelectorAll('.nav-stage').forEach(el => {
    el.setAttribute('data-active', el.dataset.stage === stage ? 'true' : 'false');
  });
  document.querySelectorAll('.prog-cell').forEach(el => {
    el.classList.toggle('is-selected', el.dataset.stage === stage);
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
// W2: wire kanban drag-and-drop (mindmap renders lazily on first toggle)
initNextActions();
// Deep-link to a stage via #stage=<name> (shareable links + deck screenshots).
(function () {
  const m = (location.hash || '').match(/stage=([a-z]+)/);
  if (m && STAGE_LABELS[m[1]]) { switchStage(m[1]); if (m[1] === 'retro') { try { renderMindmap(); } catch (_) {} } }
})();

// Delegated click
document.addEventListener('click', (e) => {
  // Panel action buttons (edit / supersede / delete)
  const actBtn = e.target.closest('[data-act]');
  if (actBtn) {
    handleAction(actBtn.dataset.act, actBtn.dataset.id, actBtn);
    return;
  }
  // Mindmap zoom controls
  const mindBtn = e.target.closest('[data-mind]');
  if (mindBtn) {
    const op = mindBtn.dataset.mind;
    if (op === 'in') _mindZoom = Math.min(2.4, _mindZoom + 0.15);
    else if (op === 'out') _mindZoom = Math.max(0.4, _mindZoom - 0.15);
    else _mindZoom = 1;
    applyMindZoom();
    return;
  }
  // Stage nav (left rail) OR middle progress cells — same behavior
  const stageEl = e.target.closest('.nav-stage, .prog-cell');
  if (stageEl && stageEl.dataset.stage) {
    e.preventDefault();
    switchStage(stageEl.dataset.stage);
    return;
  }
  // Deploy panel toggle
  const deployToggle = e.target.closest('#deploy-toggle');
  if (deployToggle) {
    const dp = document.getElementById('deploy-panel');
    if (dp) {
      const open = dp.hidden;
      dp.hidden = !open;
      deployToggle.setAttribute('aria-expanded', String(open));
    }
    return;
  }
  // New-venture hint toggle
  const nvToggle = e.target.closest('#new-venture-toggle');
  if (nvToggle) {
    const h = document.getElementById('new-venture-hint');
    if (h) h.hidden = !h.hidden;
    return;
  }
  // Copy-to-clipboard code chip (with file:// fallback)
  const copyEl = e.target.closest('[data-copy]');
  if (copyEl) {
    const txt = copyEl.dataset.copy || '';
    const ok = () => { copyEl.classList.add('copied'); setTimeout(() => copyEl.classList.remove('copied'), 1400); toast('已复制', 'ok'); };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(txt).then(ok).catch(() => legacyCopy(txt, ok));
    } else {
      legacyCopy(txt, ok);
    }
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
    // next-actions view toggle (看板 / 脑图)
    const view = segBtn.dataset.naView;
    if (view) {
      const na = segBtn.closest('[data-na]');
      if (na) na.querySelectorAll('[data-na-pane]').forEach(p => { p.hidden = p.dataset.naPane !== view; });
      if (view === 'mindmap') renderMindmap();
    }
    return;
  }
});

// ── W2 · next-actions: native HTML5 drag-and-drop + offline mindmap ──
let naDragId = null;
function initNextActions() {
  const na = document.querySelector('[data-na]');
  if (!na) return;
  na.querySelectorAll('.na-card').forEach(card => {
    card.addEventListener('dragstart', (e) => {
      naDragId = card.dataset.id;
      card.classList.add('is-dragging');
      try { e.dataTransfer.setData('text/plain', card.dataset.id); e.dataTransfer.effectAllowed = 'move'; } catch (_) {}
    });
    card.addEventListener('dragend', () => { card.classList.remove('is-dragging'); naDragId = null; });
  });
  na.querySelectorAll('.na-col__drop').forEach(drop => {
    drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('is-over'); try { e.dataTransfer.dropEffect = 'move'; } catch (_) {} });
    drop.addEventListener('dragleave', () => drop.classList.remove('is-over'));
    drop.addEventListener('drop', (e) => {
      e.preventDefault();
      drop.classList.remove('is-over');
      const id = naDragId || (e.dataTransfer && e.dataTransfer.getData('text/plain'));
      const col = drop.dataset.col;
      if (!id || !col) return;
      const card = na.querySelector('.na-card[data-id="' + (window.CSS && CSS.escape ? CSS.escape(id) : id) + '"]');
      if (card && card.dataset.col === col) return; // no-op same column
      // optimistic DOM move
      if (card) { const empty = drop.querySelector('.na-col__empty'); if (empty) empty.remove(); drop.appendChild(card); card.dataset.col = col; }
      if (!LUMI.interactive) { staticHint('移动行动卡', '把 ' + VENTURE + ' 的行动 ' + id + ' 移到「' + col + '」'); return; }
      lumiPost('/api/next-action/move', { id, column: col })
        .then(() => toast('已移动', 'ok'))
        .catch(e => { toast('移动失败：' + e.message, 'warn'); setTimeout(() => location.reload(), 400); });
    });
  });
}

// Offline mindmap: parse mindmap_md (heading + list outline) → tree → horizontal SVG layout.
// Local, zero-dependency, works under file:// and offline (no CDN, no markmap/d3).
let _mindZoom = 1, _mindRendered = false;
function parseOutline(md) {
  const root = { text: (md.match(/^#\\s+(.*)$/m) || [null, '本 venture'])[1], children: [], depth: 0 };
  const stack = [{ node: root, level: 0 }];
  md.split(/\\r?\\n/).forEach(raw => {
    const line = raw.replace(/\\s+$/, '');
    let level = null, text = null;
    const h = line.match(/^(#{2,6})\\s+(.*)$/);
    const li = line.match(/^(\\s*)[-*]\\s+(.*)$/);
    if (h) { level = h[1].length - 1; text = h[2]; }            // ## → level 1, ### → 2 ...
    else if (li) { level = 2 + Math.floor(li[1].length / 2); text = li[2]; }
    else return;
    if (!text) return;
    while (stack.length > 1 && stack[stack.length - 1].level >= level) stack.pop();
    const parent = stack[stack.length - 1].node;
    const node = { text, children: [], depth: level };
    parent.children.push(node);
    stack.push({ node, level });
  });
  return root;
}
function renderMindmap() {
  const svg = document.getElementById('na-mind-svg');
  if (!svg || !DATA.nextActions || !DATA.nextActions.mindmap_md) return;
  if (_mindRendered) return;
  _mindRendered = true;
  const root = parseOutline(DATA.nextActions.mindmap_md);
  const COLX = 230, ROWH = 30, PADX = 24, PADY = 24;
  let leafY = 0;
  const nodes = [], links = [];
  (function layout(n, depth, parent) {
    n.x = PADX + depth * COLX;
    if (!n.children.length) { n.y = PADY + (leafY++) * ROWH; }
    else { n.children.forEach(c => layout(c, depth + 1, n)); n.y = (n.children[0].y + n.children[n.children.length - 1].y) / 2; }
    nodes.push({ n, depth });
    if (parent) links.push({ a: parent, b: n });
  })(root, 0, null);
  const maxX = Math.max(...nodes.map(o => o.n.x)) + COLX;
  const maxY = Math.max(PADY + leafY * ROWH, ...nodes.map(o => o.n.y)) + PADY;
  const NS = 'http://www.w3.org/2000/svg';
  while (svg.firstChild) svg.removeChild(svg.firstChild);
  const g = document.createElementNS(NS, 'g');
  g.setAttribute('id', 'na-mind-g');
  svg.appendChild(g);
  svg.setAttribute('viewBox', '0 0 ' + maxX + ' ' + maxY);
  for (const { a, b } of links) {
    const p = document.createElementNS(NS, 'path');
    const x1 = a.x + nodeW(a), y1 = a.y, x2 = b.x, y2 = b.y, mx = (x1 + x2) / 2;
    p.setAttribute('d', 'M' + x1 + ',' + y1 + ' C' + mx + ',' + y1 + ' ' + mx + ',' + y2 + ' ' + x2 + ',' + y2);
    p.setAttribute('class', 'na-mind-link');
    g.appendChild(p);
  }
  for (const { n, depth } of nodes) {
    const grp = document.createElementNS(NS, 'g');
    grp.setAttribute('class', 'na-mind-node na-mind-node--d' + Math.min(depth, 2));
    grp.setAttribute('transform', 'translate(' + n.x + ',' + (n.y - 11) + ')');
    const w = nodeW(n);
    const rect = document.createElementNS(NS, 'rect');
    rect.setAttribute('width', w); rect.setAttribute('height', 22); rect.setAttribute('rx', 6);
    grp.appendChild(rect);
    const t = document.createElementNS(NS, 'text');
    t.setAttribute('x', 9); t.setAttribute('y', 15);
    t.textContent = clip(n.text, 24);
    grp.appendChild(t);
    g.appendChild(grp);
  }
  applyMindZoom();
  function nodeW(n) { return Math.min(210, 22 + clip(n.text, 24).length * 8.2); }
  function clip(s, n) { s = String(s); return s.length > n ? s.slice(0, n - 1) + '…' : s; }
}
function applyMindZoom() {
  const g = document.getElementById('na-mind-g');
  if (g) g.setAttribute('transform', 'scale(' + _mindZoom + ')');
}

// W4 · live re-theme: dials write canonical CSS vars onto the real landing iframe in real time.
document.addEventListener('input', (e) => {
  const t = e.target;
  if (!t || !t.dataset) return;
  const ds = t.closest('[data-ds]');
  if (t.hasAttribute('data-ds-radius')) {
    dsSetVar('--radius', t.value + 'px');
    const out = document.querySelector('[data-ds-out="radius"]'); if (out) out.textContent = t.value + 'px';
  } else if (t.hasAttribute('data-ds-space')) {
    dsSetVar('--space-scale', String(Number(t.value) / 100));
    const out = document.querySelector('[data-ds-out="space"]'); if (out) out.textContent = (Number(t.value) / 100) + '×';
  } else if (t.hasAttribute('data-ds-surfacehue')) {
    const hue = Number(t.value);
    const surf = 'oklch(97% 0.012 ' + hue + ')';
    if (ds) ds.dataset.surfaceLive = surf;
    dsSetVar('--surface', surf);
    const out = document.querySelector('[data-ds-out="surfacehue"]'); if (out) out.textContent = hue < 150 ? '暖 ' + hue : '冷 ' + hue;
  } else if (t.dataset.dsTok) {
    const tok = t.dataset.dsTok;
    const map = { accent: '--accent', accent2: '--accent-2', fontHeading: '--font-heading', fontBody: '--font-body' };
    if (map[tok]) dsSetVar(map[tok], t.value);
    if (tok === 'accent' || tok === 'accent2') dsSwatch(tok, t.value);
  } else if (t.dataset.dsLayout) {
    dsSetBodyAttr('data-' + t.dataset.dsLayout, t.value);
  } else if (t.hasAttribute('data-ds-preset')) {
    dsApplyPreset(t.value);
  }
});
// also respond to <select> change (input fires on most browsers, change is the reliable one)
document.addEventListener('change', (e) => {
  const t = e.target;
  if (!t || !t.dataset) return;
  if (t.hasAttribute('data-ds-preset')) dsApplyPreset(t.value);
  else if (t.dataset.dsLayout) dsSetBodyAttr('data-' + t.dataset.dsLayout, t.value);
  else if (t.dataset.dsTok === 'fontHeading') dsSetVar('--font-heading', t.value);
  else if (t.dataset.dsTok === 'fontBody') dsSetVar('--font-body', t.value);
});
// when the landing iframe finishes loading, push the current theme so preview matches the panel.
(function bindDsFrame() {
  const f = document.getElementById('ds-frame');
  if (f) f.addEventListener('load', () => { try { dsPushAll(); } catch (_) {} });
})();

// Keyboard activation for role=button stage cells / toggles
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const t = e.target;
  if (t && t.matches && t.matches('.prog-cell, #new-venture-toggle')) {
    e.preventDefault();
    t.click();
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

  renderVenture(absDir);
  console.log(`✓ Studio rendered: ${join(absDir, 'studio', 'index.html')}`);
}

/** Render a venture's studio HTML to disk and return the output path. Reused by serve.ts. */
export function renderVenture(absDir: string): string {
  const html = render(absDir);
  const outDir = join(absDir, 'studio');
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, 'index.html');
  writeFileSync(outPath, html);
  return outPath;
}

// Only run the CLI entry when invoked directly (not when imported by serve.ts).
if (import.meta.main) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
