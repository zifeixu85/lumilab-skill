#!/usr/bin/env bun
/**
 * lumilab-home — Lumi Lab 的门面 / 入口 skill 的脚本。
 *
 * 两个子命令：
 *   home.ts status            打印确定性 JSON（onboarded / 工具 / venture / 下一步），无 HTML
 *   home.ts render            生成 data/_home/home.html dashboard；本地开浏览器，chat 环境打印路径
 *   home.ts --help
 *
 * 约定：
 *   LUMILAB_HOME       状态目录，默认 ~/.lumilab —— config.json + data/（venture / home 数据）
 *   LUMILAB_CHANNEL    local（默认）开浏览器；其它（feishu/...）只打印路径
 *
 * venture / home 数据永远在 ~/.lumilab/data/，跟 cwd / 谁调用无关 ——
 * 宿主对话式调用和 CLI 调用落点一致。
 *
 * 失败模式：config 缺失/损坏 → status 仍输出（onboarded=false）；
 * render 仍生成（空/未配置状态），永不崩。
 */
import { existsSync, readFileSync, readdirSync, statSync, mkdirSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
import { homedir } from 'os';
import { spawn } from 'child_process';

// ── 约定路径 ──
function lumilabHome(): string {
  return process.env.LUMILAB_HOME ?? join(homedir(), '.lumilab');
}
function dataRoot(): string {
  return join(lumilabHome(), 'data');
}
function venturesRoot(): string {
  return join(dataRoot(), 'ventures');
}
function channel(): string {
  return process.env.LUMILAB_CHANNEL ?? 'local';
}

// ── 9 个工具（config.json api.has_* 标志）──
const TOOLS: { key: string; label: string; note: string }[] = [
  { key: 'has_cloudflare', label: 'Cloudflare', note: '部署 venture Studio' },
  { key: 'has_tavily', label: 'Tavily', note: 'web 搜索调研' },
  { key: 'has_tikhub', label: 'TikHub', note: '国内平台数据' },
  { key: 'has_dataforseo', label: 'DataForSEO', note: '关键词搜索量' },
  { key: 'has_keywordseverywhere', label: 'Keywords Everywhere', note: '关键词需求（备选）' },
  { key: 'has_stripe', label: 'Stripe', note: '收款验证' },
  { key: 'has_resend', label: 'Resend', note: '邮件触达' },
  { key: 'has_wechat', label: '微信', note: '公众号发布' },
  { key: 'has_x', label: 'X', note: 'X 内容发布' },
];
const TOOLS_TOTAL = TOOLS.length;

// ── Types ──
interface PhaseMap {
  '0-intake': boolean;
  '1-analysis': boolean;
  '2-report': boolean;
  '3-direction': boolean;
  '4-landing': boolean;
  '5-retro': boolean;
}
interface VentureCost {
  external_usd: number;
  tokens: number;
  agent_calls: number;
  llm_source: string;
}
interface VentureStatus {
  slug: string;
  idea: string;
  phases: PhaseMap;
  progress: string;
  updated_at: string;
  deployed: boolean;
  cost?: VentureCost;
}

function fmtK(n: number): string { return n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1) + 'k' : String(n); }

// 读 venture 消耗汇总（外部精确 + LLM 自报/估算）。best-effort，缺 config 也不报错。
function readVentureCost(slug: string): VentureCost | undefined {
  try {
    const u = require('../../lumilab-config/scripts/usage.ts');
    if (typeof u?.summarize !== 'function') return undefined;
    const s = u.summarize(slug, { estimateIfMissing: true });
    if (!s || (s.external_calls === 0 && s.llm.total === 0)) return undefined;
    return { external_usd: s.external_cost_usd, tokens: s.llm.total, agent_calls: s.agent_calls, llm_source: s.llm.source };
  } catch { return undefined; }
}
interface HomeStatus {
  onboarded: boolean;
  has_config: boolean;
  channel: string;
  default_design_preset: string | null;
  tools_configured: string[];
  tools_total: number;
  ventures: VentureStatus[];
  next_suggestion: string;
}

// ── config.json 读取（损坏不崩）──
interface RawConfig {
  onboarded?: boolean;
  default_design_preset?: string;
  api?: Record<string, unknown>;
}
function readConfig(): { config: RawConfig | null; has_config: boolean } {
  const p = join(lumilabHome(), 'config.json');
  if (!existsSync(p)) return { config: null, has_config: false };
  try {
    const parsed = JSON.parse(readFileSync(p, 'utf-8')) as RawConfig;
    if (!parsed || typeof parsed !== 'object') return { config: null, has_config: true };
    return { config: parsed, has_config: true };
  } catch {
    // 损坏：has_config=true 但视为未 onboarded
    return { config: null, has_config: true };
  }
}

// ── shares.json 读取（部署状态，损坏不崩）──
function readDeployedSlugs(): Set<string> {
  const p = join(lumilabHome(), 'shares.json');
  if (!existsSync(p)) return new Set();
  try {
    const parsed = JSON.parse(readFileSync(p, 'utf-8')) as { shares?: { venture?: string }[] };
    const list = Array.isArray(parsed?.shares) ? parsed.shares : [];
    return new Set(list.map((s) => s?.venture).filter((v): v is string => typeof v === 'string'));
  } catch {
    return new Set();
  }
}

// ── venture 进度扫描 ──
function extractIdea(briefPath: string): string {
  try {
    const text = readFileSync(briefPath, 'utf-8');
    // idea 在顶部的 `> **<idea>**` 引用块里
    const m = text.match(/^>\s*\*\*(.+?)\*\*/m);
    if (m && m[1].trim()) return m[1].trim();
    // 退路：## 一句话 idea 段
    const m2 = text.match(/##\s*一句话\s*idea\s*\n+([^\n]+)/);
    if (m2 && m2[1].trim()) return m2[1].trim();
  } catch {
    /* ignore */
  }
  return '(未命名想法)';
}

function newestMtime(dir: string): string {
  let newest = 0;
  const visit = (p: string) => {
    let st;
    try {
      st = statSync(p);
    } catch {
      return;
    }
    if (st.mtimeMs > newest) newest = st.mtimeMs;
    if (st.isDirectory()) {
      let entries: string[] = [];
      try {
        entries = readdirSync(p);
      } catch {
        return;
      }
      for (const e of entries) visit(join(p, e));
    }
  };
  visit(dir);
  return newest > 0 ? new Date(newest).toISOString() : new Date().toISOString();
}

function scanVenture(ventureDir: string, slug: string, deployedSlugs: Set<string>): VentureStatus {
  const has = (rel: string) => existsSync(join(ventureDir, rel));
  let landingHasSubdir = false;
  if (has('landing')) {
    try {
      landingHasSubdir = readdirSync(join(ventureDir, 'landing')).some((d) => {
        try {
          return statSync(join(ventureDir, 'landing', d)).isDirectory();
        } catch {
          return false;
        }
      });
    } catch {
      landingHasSubdir = false;
    }
  }
  let directionDecided = false;
  if (has('decisions.yaml')) {
    try {
      directionDecided = readFileSync(join(ventureDir, 'decisions.yaml'), 'utf-8').includes('direction');
    } catch {
      directionDecided = false;
    }
  }
  const retroDone =
    has('reports/retro.html') || has('retro.md') || has('reports/weekly-retro.html');
  const phases: PhaseMap = {
    '0-intake': has('project_brief.md'),
    '1-analysis': has('market_analysis.json'),
    '2-report': has('reports/market-report.html'),
    '3-direction': directionDecided,
    '4-landing': landingHasSubdir,
    '5-retro': retroDone,
  };
  const done = Object.values(phases).filter(Boolean).length;
  return {
    slug,
    idea: has('project_brief.md') ? extractIdea(join(ventureDir, 'project_brief.md')) : '(无 project_brief)',
    phases,
    progress: `${done}/6`,
    updated_at: newestMtime(ventureDir),
    deployed: deployedSlugs.has(slug),
    cost: readVentureCost(slug),
  };
}

function scanVentures(): VentureStatus[] {
  const root = venturesRoot();
  if (!existsSync(root)) return [];
  let entries: string[] = [];
  try {
    entries = readdirSync(root);
  } catch {
    return [];
  }
  const deployedSlugs = readDeployedSlugs();
  const out: VentureStatus[] = [];
  for (const e of entries) {
    if (e.startsWith('.')) continue;
    const dir = join(root, e);
    try {
      if (!statSync(dir).isDirectory()) continue;
    } catch {
      continue;
    }
    out.push(scanVenture(dir, e, deployedSlugs));
  }
  // 按最近活动排序
  out.sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1));
  return out;
}

// ── 下一步建议 ──
// 返回一条主建议；render 时如果指向某个 venture 会把卡片链接拼上去。
interface NextHint {
  text: string;
  slug: string | null;
}
function nextHint(onboarded: boolean, ventures: VentureStatus[]): NextHint {
  if (!onboarded)
    return { text: '还没走首次引导 —— 说一句「lumilab config」开始配置（工具 token 都能跳过）', slug: null };
  if (ventures.length === 0)
    return { text: '还没有 venture —— 在 AI 宿主里说一句你的想法就能开始第一个验证', slug: null };
  const stuckAtAnalysis = ventures.find((v) => v.phases['1-analysis'] && !v.phases['3-direction']);
  if (stuckAtAnalysis)
    return {
      text: `「${stuckAtAnalysis.slug}」分析做完了 —— 点开它的卡片去 Studio 选方向`,
      slug: stuckAtAnalysis.slug,
    };
  const readyToDeploy = ventures.find((v) => v.phases['4-landing'] && !v.deployed);
  if (readyToDeploy)
    return {
      text: `「${readyToDeploy.slug}」的 landing 好了 —— 说「lumilab deploy」上线`,
      slug: readyToDeploy.slug,
    };
  const noAnalysis = ventures.find((v) => v.phases['0-intake'] && !v.phases['1-analysis']);
  if (noAnalysis)
    return {
      text: `「${noAnalysis.slug}」还停在 intake —— 跑一遍自主市场分析`,
      slug: noAnalysis.slug,
    };
  const deployedNoRetro = ventures.find((v) => v.deployed && !v.phases['5-retro']);
  if (deployedNoRetro)
    return {
      text: `「${deployedNoRetro.slug}」已上线 —— 收够数据后点开卡片做一次复盘`,
      slug: deployedNoRetro.slug,
    };
  return {
    text: `继续推进「${ventures[0].slug}」，或说一句新想法开第二个 venture`,
    slug: ventures[0].slug,
  };
}
function nextSuggestion(onboarded: boolean, ventures: VentureStatus[]): string {
  return nextHint(onboarded, ventures).text;
}

// ── status 子命令 ──
function buildStatus(): HomeStatus {
  const { config, has_config } = readConfig();
  const onboarded = config?.onboarded === true;
  const api = (config?.api ?? {}) as Record<string, unknown>;
  const tools_configured = TOOLS.filter((t) => api[t.key] === true).map((t) =>
    t.key.replace(/^has_/, ''),
  );
  const default_design_preset =
    typeof config?.default_design_preset === 'string' && config.default_design_preset
      ? config.default_design_preset
      : null;
  const ventures = scanVentures();
  return {
    onboarded,
    has_config,
    channel: channel(),
    default_design_preset,
    tools_configured,
    tools_total: TOOLS_TOTAL,
    ventures,
    next_suggestion: nextSuggestion(onboarded, ventures),
  };
}

function cmdStatus(): void {
  console.log(JSON.stringify(buildStatus(), null, 2));
}

// ── HTML helpers ──
function esc(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}
function formatNow(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return esc(iso);
  const diff = Date.now() - then;
  const min = Math.floor(diff / 60000);
  if (min < 1) return '刚刚';
  if (min < 60) return `${min} 分钟前`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} 小时前`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day} 天前`;
  const mon = Math.floor(day / 30);
  if (mon < 12) return `${mon} 个月前`;
  return `${Math.floor(mon / 12)} 年前`;
}

const PHASE_LABELS: { key: keyof PhaseMap; label: string }[] = [
  { key: '0-intake', label: '想法澄清' },
  { key: '1-analysis', label: '调研' },
  { key: '2-report', label: '产品' },
  { key: '3-direction', label: '构建' },
  { key: '4-landing', label: '启动' },
  { key: '5-retro', label: '复盘' },
];

// venture 状态标签 —— 由完成的 phase + 是否部署推导
function ventureStatusLabel(v: VentureStatus): { label: string; tone: string } {
  if (v.phases['5-retro']) return { label: '已复盘', tone: 'retro' };
  if (v.deployed) return { label: '已部署', tone: 'live' };
  if (v.phases['4-landing']) return { label: 'landing 就绪', tone: 'ready' };
  if (v.phases['1-analysis'] && !v.phases['3-direction'])
    return { label: '待选方向', tone: 'wait' };
  if (v.phases['0-intake'] && !v.phases['1-analysis'])
    return { label: '待调研', tone: 'wait' };
  const done = Object.values(v.phases).filter(Boolean).length;
  if (done === 0) return { label: '刚建立', tone: 'idle' };
  return { label: '进行中', tone: 'going' };
}

// ── HTML 区块渲染 ──
function renderTools(status: HomeStatus): string {
  const configured = new Set(status.tools_configured);
  const cells = TOOLS.map((t, i) => {
    const on = configured.has(t.key.replace(/^has_/, ''));
    return `
      <li class="tool ${on ? 'is-on' : 'is-off'}" style="--i:${i}">
        <span class="tool__mark">${on ? '✓' : '—'}</span>
        <span class="tool__body">
          <span class="tool__name">${esc(t.label)}</span>
          <span class="tool__note">${esc(t.note)}</span>
        </span>
      </li>`;
  }).join('');
  const preset = status.default_design_preset
    ? `<span class="tools__preset">默认设计风格 · ${esc(status.default_design_preset)}</span>`
    : '';
  return `
  <section class="section" style="--s:2">
    <div class="section__head">
      <span class="section__no">Nº 02</span>
      <div class="section__titlerow">
        <h2 class="section__title">工具集成</h2>
        <button type="button" class="cfg-btn" aria-expanded="false" onclick="lumiToggleCfg(this)">
          <span class="cfg-btn__ico">✎</span> 修改配置
        </button>
      </div>
      <p class="section__hint">已配 ${status.tools_configured.length} / ${status.tools_total} · 工具都是可选的，没配也能用宿主模型知识跑</p>
    </div>
    <div class="cfg-panel" hidden>
      <p class="cfg-panel__lead">改 token、换默认风格、改部署偏好 —— 都在配置向导里。两种方式：</p>
      <div class="cfg-panel__ways">
        <div class="cfg-way">
          <span class="cfg-way__tag">跟 AI 说一句</span>
          <code class="cfg-way__cmd">打开 lumilab 配置</code>
        </div>
        <div class="cfg-way">
          <span class="cfg-way__tag">或终端运行</span>
          <button type="button" class="cfg-way__copy" onclick="lumiCopyCfg(this)" data-cmd="lumilab config"><code>lumilab config</code><span class="cfg-way__hint">点击复制</span></button>
        </div>
      </div>
      <p class="cfg-panel__note">配置向导会在浏览器打开（127.0.0.1:7777），改完保存，这个首页会自动重渲染。</p>
    </div>
    ${preset}
    <ul class="tool-grid">${cells}</ul>
  </section>`;
}

function renderPhaseBar(phases: PhaseMap): string {
  const segs = PHASE_LABELS.map((p) => {
    const done = phases[p.key];
    return `
        <span class="phase ${done ? 'is-done' : 'is-todo'}">
          <span class="phase__seg"></span>
          <span class="phase__label">${esc(p.label)}</span>
        </span>`;
  }).join('');
  return `<div class="phase-bar">${segs}</div>`;
}

const VENTURE_SHOW_LIMIT = 12;

function renderVentures(status: HomeStatus): string {
  if (status.ventures.length === 0) {
    return `
  <section class="section" style="--s:1">
    <div class="section__head">
      <span class="section__no">Nº 01</span>
      <h2 class="section__title">我的 venture</h2>
    </div>
    <div class="empty">
      <p class="empty__title">还没有 venture</p>
      <p class="empty__body">在 AI 宿主里说一句你的想法就能开始第一个 —— 系统会自动跑市场分析、给方向建议、生成一个验证 landing。</p>
      <code class="empty__code">lumilab idea "你的想法"</code>
      <p class="empty__divider">或</p>
      <p class="empty__body">先看一个跑通的样本（lumilab 自己用 lumilab 做的自指验证）：</p>
      <code class="empty__code">lumilab demo</code>
    </div>
  </section>`;
  }
  const shown = status.ventures.slice(0, VENTURE_SHOW_LIMIT);
  const cards = shown
    .map((v, i) => {
      const st = ventureStatusLabel(v);
      const deployedBadge = v.deployed
        ? `<span class="venture-badge">🌐 已上线</span>`
        : '';
      const href = `../ventures/${encodeURIComponent(v.slug)}/studio/index.html`;
      return `
      <a class="venture-card" href="${esc(href)}" style="--i:${i}">
        <header class="venture-card__head">
          <span class="venture-slug">${esc(v.slug)}</span>
          <span class="venture-progress">${esc(v.progress)}</span>
        </header>
        <p class="venture-idea">${esc(truncate(v.idea, 72))}</p>
        ${renderPhaseBar(v.phases)}
        ${v.cost ? `<p class="venture-cost">${v.cost.external_usd > 0 ? '≈$' + v.cost.external_usd.toFixed(3) + ' 外部' : '$0 外部'}${v.cost.tokens > 0 ? ` · ~${fmtK(v.cost.tokens)} token${v.cost.llm_source !== 'host-reported' ? '（粗估）' : ''}` : ''}${v.cost.agent_calls > 0 ? ` · <b>${v.cost.agent_calls} 代搜</b>` : ''}</p>` : ''}
        <footer class="venture-card__foot">
          <span class="venture-status venture-status--${st.tone}">${esc(st.label)}</span>
          ${deployedBadge}
          <span class="venture-updated">${esc(relativeTime(v.updated_at))}</span>
          <span class="venture-open">打开 Studio →</span>
        </footer>
      </a>`;
    })
    .join('');
  const overflow =
    status.ventures.length > VENTURE_SHOW_LIMIT
      ? `<p class="venture-overflow">共 ${status.ventures.length} 个，上面是最近活跃的 ${VENTURE_SHOW_LIMIT} 个</p>`
      : '';
  return `
  <section class="section" style="--s:1">
    <div class="section__head">
      <span class="section__no">Nº 01</span>
      <h2 class="section__title">我的 venture</h2>
      <p class="section__hint">共 ${status.ventures.length} 个 · 按最近活动排序 · 点卡片进各自的 Studio</p>
    </div>
    <div class="venture-grid">${cards}</div>
    ${overflow}
  </section>`;
}

function renderNext(status: HomeStatus): string {
  const hint = nextHint(status.onboarded, status.ventures);
  const suggestion = hint.slug
    ? `<a class="next-suggestion next-suggestion--link" href="../ventures/${esc(
        encodeURIComponent(hint.slug),
      )}/studio/index.html">${esc(hint.text)}</a>`
    : `<p class="next-suggestion">${esc(hint.text)}</p>`;
  return `
  <section class="section section--next" style="--s:3">
    <div class="section__head">
      <span class="section__no">Nº 03</span>
      <h2 class="section__title">下一步建议</h2>
    </div>
    ${suggestion}
    <ul class="next-actions">
      <li class="next-action">
        <span class="next-action__key">新 idea</span>
        <span class="next-action__body">直接说一句话想法，系统跑完整条验证流水线</span>
      </li>
      <li class="next-action">
        <span class="next-action__key">继续 venture</span>
        <span class="next-action__body">点上面任意卡片进它的 Studio，接着上次的进度往下走</span>
      </li>
      <li class="next-action">
        <span class="next-action__key">改配置</span>
        <span class="next-action__body">说「lumilab config」重开引导页</span>
      </li>
    </ul>
  </section>`;
}

function renderHtml(status: HomeStatus): string {
  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Lumi Lab · Home</title>
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
.footer  { animation-delay: 0.6s; }

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
.header__title {
  font-family: var(--serif);
  font-weight: 600;
  font-size: clamp(2.4rem, 1.4rem + 4.2vw, 4.2rem);
  line-height: 1.05;
  letter-spacing: -0.02em;
  color: var(--ink);
  margin-bottom: 14px;
}
.header__tagline {
  font-family: var(--serif);
  font-style: italic;
  font-size: clamp(1.05rem, 0.95rem + 0.8vw, 1.35rem);
  color: var(--ink-2);
  margin-bottom: 20px;
}
.header__what {
  font-family: var(--mono);
  font-size: 12px;
  line-height: 1.65;
  color: var(--mute);
  background: var(--paper-2);
  border-left: 3px solid var(--hairline-2);
  padding: 11px 14px;
  margin-bottom: 18px;
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

/* ── Freshness bar ── */
.freshbar {
  position: relative;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 8px;
  max-width: 920px;
  margin: 0 auto;
  padding: 9px clamp(20px, 5vw, 56px) 0;
  font-family: var(--mono);
  font-size: 10.5px;
  letter-spacing: 0.02em;
  color: var(--mute-2);
}
.freshbar__time { color: var(--mute); font-weight: 600; }
.freshbar__sep { color: var(--hairline-2); }
.freshbar__hint { color: var(--mute-2); }

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

/* ── Tools ── */
.tools__preset {
  display: inline-block;
  font-family: var(--mono);
  font-size: 11px;
  letter-spacing: 0.04em;
  color: var(--moss);
  background: var(--moss-soft);
  padding: 4px 10px;
  border-radius: 2px;
  margin-bottom: 16px;
}
.tool-grid {
  list-style: none;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
.tool {
  display: flex;
  gap: 11px;
  align-items: flex-start;
  background: var(--surface);
  box-shadow: var(--shadow-soft);
  padding: 14px 15px;
  border-left: 3px solid var(--hairline-2);
}
.tool.is-on  { border-left-color: var(--moss); }
.tool.is-off { opacity: 0.62; }
.tool__mark {
  font-family: var(--mono);
  font-size: 13px;
  font-weight: 600;
  flex-shrink: 0;
  line-height: 1.5;
}
.tool.is-on  .tool__mark { color: var(--moss); }
.tool.is-off .tool__mark { color: var(--mute-2); }
.tool__body { display: flex; flex-direction: column; gap: 2px; }
.tool__name {
  font-family: var(--serif);
  font-weight: 600;
  font-size: 1rem;
  color: var(--ink);
}
.tool__note {
  font-family: var(--mono);
  font-size: 10.5px;
  color: var(--mute);
  line-height: 1.4;
}

/* ── 修改配置 按钮 + 面板 ── */
.section__titlerow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}
.cfg-btn {
  flex: 0 0 auto;
  font-family: var(--mono);
  font-size: 12px;
  letter-spacing: 0.04em;
  color: var(--accent);
  background: var(--accent-soft);
  border: 1px solid var(--accent);
  border-radius: 999px;
  padding: 6px 14px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: transform 0.14s cubic-bezier(0.16,1,0.3,1), box-shadow 0.14s cubic-bezier(0.16,1,0.3,1);
}
.cfg-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 14px oklch(48% 0.15 28 / 0.2); }
.cfg-btn__ico { font-size: 13px; }
.cfg-panel {
  margin: 16px 0 4px;
  background: var(--surface);
  border: 1px solid var(--hairline);
  border-left: 3px solid var(--accent);
  border-radius: 12px;
  padding: 18px 20px;
  box-shadow: var(--shadow-card);
}
.cfg-panel__lead {
  font-family: var(--serif);
  font-size: 0.95rem;
  color: var(--ink);
  margin-bottom: 14px;
}
.cfg-panel__ways { display: flex; flex-wrap: wrap; gap: 12px; }
.cfg-way {
  flex: 1 1 220px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.cfg-way__tag {
  font-family: var(--mono);
  font-size: 10.5px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--mute);
}
.cfg-way__cmd {
  font-family: var(--mono);
  font-size: 13px;
  color: var(--ink);
  background: var(--paper-2);
  border: 1px solid var(--hairline);
  border-radius: 8px;
  padding: 8px 12px;
}
.cfg-way__copy {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  font-family: var(--mono);
  font-size: 13px;
  color: var(--ink);
  background: var(--paper-2);
  border: 1px solid var(--hairline);
  border-radius: 8px;
  padding: 8px 12px;
  cursor: pointer;
  text-align: left;
  transition: border-color 0.14s ease;
}
.cfg-way__copy:hover { border-color: var(--accent); }
.cfg-way__copy code { background: none; border: 0; padding: 0; }
.cfg-way__hint {
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: 0.08em;
  color: var(--mute);
}
.cfg-panel__note {
  font-family: var(--mono);
  font-size: 11px;
  color: var(--mute);
  line-height: 1.5;
  margin-top: 14px;
}

/* ── Ventures ── */
.venture-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}
.venture-cost {
  font-size: 11px;
  color: var(--mute);
  font-family: var(--mono, ui-monospace, Menlo, monospace);
  letter-spacing: -0.01em;
}
.venture-cost b { color: var(--moss); font-weight: 600; }
.venture-card {
  background: var(--surface);
  box-shadow: var(--shadow-card);
  padding: 20px;
  border-top: 3px solid var(--indigo);
  display: flex;
  flex-direction: column;
  gap: 14px;
  text-decoration: none;
  color: inherit;
  transition: transform 0.18s cubic-bezier(0.16, 1, 0.3, 1),
    box-shadow 0.18s cubic-bezier(0.16, 1, 0.3, 1);
}
.venture-card:hover,
.venture-card:focus-visible {
  transform: translateY(-3px);
  box-shadow: 0 10px 28px oklch(25% 0.02 60 / 0.12), 0 0 0 1px var(--indigo);
  outline: none;
}
.venture-card:hover .venture-open,
.venture-card:focus-visible .venture-open { color: var(--indigo); }
.venture-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.venture-slug {
  font-family: var(--mono);
  font-size: 12.5px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--ink);
}
.venture-progress {
  font-family: var(--mono);
  font-size: 11px;
  font-weight: 600;
  color: var(--accent);
  background: var(--accent-soft);
  padding: 3px 9px;
  border-radius: 2px;
}
.venture-idea {
  font-family: var(--serif);
  font-size: 1.08rem;
  line-height: 1.4;
  color: var(--ink-2);
}
.phase-bar {
  display: flex;
  gap: 5px;
}
.phase {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.phase__seg {
  height: 5px;
  border-radius: 2px;
  background: var(--hairline);
}
.phase.is-done .phase__seg { background: var(--moss); }
.phase__label {
  font-family: var(--mono);
  font-size: 9px;
  letter-spacing: 0.02em;
  text-align: center;
  color: var(--mute-2);
}
.phase.is-done .phase__label { color: var(--moss); }
.venture-card__foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  font-family: var(--mono);
  font-size: 11px;
  color: var(--mute);
}
.venture-status {
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 2px;
}
.venture-status--retro { color: var(--indigo); background: var(--indigo-soft); }
.venture-status--live  { color: var(--moss);   background: var(--moss-soft); }
.venture-status--ready { color: var(--ochre);  background: var(--ochre-soft); }
.venture-status--wait,
.venture-status--going { color: var(--accent); background: var(--accent-soft); }
.venture-status--idle  { color: var(--mute);   background: var(--paper-2); }
.venture-badge {
  font-weight: 600;
  color: var(--moss);
  background: var(--moss-soft);
  padding: 2px 8px;
  border-radius: 2px;
}
.venture-updated { color: var(--mute-2); }
.venture-open {
  margin-left: auto;
  font-weight: 600;
  color: var(--mute-2);
  transition: color 0.18s ease;
}
.venture-overflow {
  font-family: var(--mono);
  font-size: 11px;
  color: var(--mute-2);
  margin-top: 14px;
  text-align: center;
}

/* ── Empty state ── */
.empty {
  background: var(--paper-2);
  border: 1px dashed var(--hairline-2);
  padding: 32px 28px;
  text-align: center;
}
.empty__title {
  font-family: var(--serif);
  font-weight: 600;
  font-size: 1.3rem;
  color: var(--ink);
  margin-bottom: 8px;
}
.empty__body {
  font-size: 0.98rem;
  line-height: 1.6;
  color: var(--ink-2);
  max-width: 420px;
  margin: 0 auto 16px;
}
.empty__code {
  display: inline-block;
  font-family: var(--mono);
  font-size: 12.5px;
  color: var(--ink);
  background: var(--surface);
  box-shadow: var(--shadow-soft);
  padding: 8px 14px;
  border-radius: 2px;
  user-select: all;
}

/* ── Next ── */
.section--next {
  background: var(--paper-2);
  margin-left: calc(-1 * clamp(20px, 5vw, 56px));
  margin-right: calc(-1 * clamp(20px, 5vw, 56px));
  padding: 40px clamp(20px, 5vw, 56px);
  border-top: 1px solid var(--hairline);
  border-bottom: 1px solid var(--hairline);
}
.next-suggestion {
  display: block;
  font-family: var(--serif);
  font-weight: 500;
  font-size: clamp(1.25rem, 1rem + 1.4vw, 1.7rem);
  line-height: 1.35;
  color: var(--ink);
  border-left: 4px solid var(--accent);
  padding-left: 18px;
  margin-bottom: 24px;
}
.next-suggestion--link {
  text-decoration: none;
  transition: border-color 0.18s ease, color 0.18s ease;
}
.next-suggestion--link:hover,
.next-suggestion--link:focus-visible {
  border-left-color: var(--indigo);
  color: var(--indigo);
  outline: none;
}
.next-actions { list-style: none; display: flex; flex-direction: column; gap: 10px; }
.next-action {
  display: flex;
  gap: 14px;
  align-items: baseline;
  background: var(--surface);
  box-shadow: var(--shadow-soft);
  padding: 13px 16px;
}
.next-action__key {
  font-family: var(--mono);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--ochre);
  background: var(--ochre-soft);
  padding: 3px 9px;
  border-radius: 2px;
  flex-shrink: 0;
}
.next-action__body { font-size: 0.96rem; color: var(--ink-2); line-height: 1.5; }

/* ── Footer ── */
.footer {
  margin-top: 56px;
  padding-top: 28px;
  border-top: 2px solid var(--ink);
  text-align: center;
}
.footer__hint {
  font-family: var(--serif);
  font-size: 1.1rem;
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
  .tool-grid { grid-template-columns: 1fr; }
  .venture-grid { grid-template-columns: 1fr; }
  .section--next {
    margin-left: calc(-1 * clamp(20px, 5vw, 56px));
    margin-right: calc(-1 * clamp(20px, 5vw, 56px));
  }
  .next-action { flex-direction: column; gap: 6px; }
}
</style>
</head>
<body>
<div class="freshbar">
  <span class="freshbar__time">数据更新于 ${formatNow()}</span>
  <span class="freshbar__sep">·</span>
  <span class="freshbar__hint">写时更新 —— skill 干完活会自动重渲染。要手动刷新？跟 AI 说「刷新 lumilab home」</span>
</div>
<main class="wrap">
  <header class="header">
    <div class="header__kicker">Lumi Lab · Home</div>
    <h1 class="header__title">Lumi Lab</h1>
    <p class="header__tagline">从一句话想法，到一个能测真实购买意愿的验证 landing。</p>
    <p class="header__what">C 端创业 idea 的快速验证工具：一句话 idea → 自动市场分析 → fake-door 验证页。每个 venture 都有自己的 Studio 作战室，点下面的卡片就能进。</p>
    <div class="header__meta">
      <span>channel · ${esc(status.channel)}</span>
      <span>${status.onboarded ? '已 onboarded' : '未 onboarded'}</span>
      <span>${status.ventures.length} 个 venture · 已配 ${status.tools_configured.length}/${status.tools_total} 工具</span>
    </div>
  </header>

  ${renderVentures(status)}
  ${renderTools(status)}
  ${renderNext(status)}

  <footer class="footer">
    <p class="footer__hint">回到对话里说一句想法，或继续某个 venture。</p>
    <p class="footer__sub">输入「lumilab home」随时回到这里</p>
  </footer>
</main>
<script>
function lumiToggleCfg(btn){
  var panel = document.querySelector('.cfg-panel');
  if(!panel) return;
  var open = panel.hasAttribute('hidden');
  if(open){ panel.removeAttribute('hidden'); } else { panel.setAttribute('hidden',''); }
  btn.setAttribute('aria-expanded', open ? 'true' : 'false');
}
function lumiCopyCfg(btn){
  var cmd = btn.getAttribute('data-cmd') || '';
  var hint = btn.querySelector('.cfg-way__hint');
  var done = function(){ if(hint){ var old = hint.textContent; hint.textContent = '已复制 ✓'; setTimeout(function(){ hint.textContent = old; }, 1600); } };
  if(navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(cmd).then(done).catch(done); }
  else { var ta = document.createElement('textarea'); ta.value = cmd; document.body.appendChild(ta); ta.select(); try{ document.execCommand('copy'); }catch(e){} document.body.removeChild(ta); done(); }
}
</script>
</body>
</html>`;
}

function cmdRender(): void {
  const status = buildStatus();
  const html = renderHtml(status);
  const outDir = join(dataRoot(), '_home');
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, 'home.html');
  writeFileSync(outPath, html, 'utf-8');

  const ch = channel();
  if (ch === 'local') {
    // 优先走 studio 守护进程开 localhost（内容更新自动刷新），守护进程脚本不在/起不来才回退 file://
    const serveTs = join(import.meta.dir, '..', '..', 'lumilab-studio', 'scripts', 'serve.ts');
    if (existsSync(serveTs)) {
      try {
        spawn('bun', ['run', serveTs, '--open-home'], { detached: true, stdio: 'ignore' }).unref();
        console.log(`\x1b[32m[home] 已生成并在浏览器打开（实时）:\x1b[0m ${outPath}`);
        return;
      } catch { /* 回退 file:// */ }
    }
    const opener =
      process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
    try {
      spawn(opener, [outPath], { detached: true, stdio: 'ignore' }).unref();
      console.log(`\x1b[32m[home] 已生成并在浏览器打开:\x1b[0m ${outPath}`);
    } catch {
      console.log(`\x1b[32m[home] 已生成:\x1b[0m ${outPath}`);
    }
  } else {
    console.log(`\x1b[32m[home] 已生成:\x1b[0m ${outPath}`);
  }
}

// ── CLI ──
const HELP = `lumilab-home — Lumi Lab 门面 / 入口

用法:
  bun run scripts/home.ts status    打印 JSON：onboarded / 工具 / venture / 下一步建议
  bun run scripts/home.ts render    生成 data/_home/home.html dashboard
  bun run scripts/home.ts --help

环境变量:
  LUMILAB_HOME       状态目录（默认 ~/.lumilab）—— config.json + data/
  LUMILAB_CHANNEL    local（默认）开浏览器；其它只打印路径`;

const cmd = process.argv[2];
if (cmd === '--help' || cmd === '-h' || !cmd) {
  console.log(HELP);
  process.exit(0);
}
switch (cmd) {
  case 'status':
    cmdStatus();
    break;
  case 'render':
    cmdRender();
    break;
  default:
    console.error(`unknown command: ${cmd}`);
    console.error(HELP);
    process.exit(2);
}
