#!/usr/bin/env bun
/**
 * Lumi Lab — Setup Wizard (utility / control-panel UI)
 *
 * Lumi Lab is a Skills bundle that runs inside a host AI (Claude Code /
 * OpenClaw / Cursor / Codex / Hermes / Gemini CLI). The host provides the LLM.
 * This wizard therefore does NOT ask for LLM tokens (Anthropic / OpenAI /
 * DashScope / Gemini). It only collects tool-type tokens that real skills
 * actually need: Cloudflare for deploy, Tavily / TikHub for research, and
 * Stripe / Resend / WeChat MP / X for the Pro tier. Everything is optional.
 *
 * Single-file bun HTTP server on 127.0.0.1:7777 (fallback 7778-7780).
 *
 *   Step 1/6  Welcome (product onboarding)
 *   Step 2/6  Design preset (default aesthetic for validation pages)
 *   Step 3/6  Identity
 *   Step 4/6  Preferences (language / writing style / AI-trace tolerance)
 *   Step 5/6  Tool integrations (all optional)
 *   Step 6/6  Deploy preferences + how-to-start
 *
 * Run with:  bun run skills/lumilab-config/scripts/wizard.ts
 */

import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync, chmodSync } from "node:fs";
import { homedir, platform } from "node:os";
import { join } from "node:path";

// ─────────────  paths  ─────────────

const LUMI_DIR     = process.env.LUMILAB_HOME ?? join(homedir(), ".lumilab");
const CONFIG_PATH  = join(LUMI_DIR, "config.json");
const SECRETS_PATH = join(LUMI_DIR, "secrets.json");

function ensureDir() {
  if (!existsSync(LUMI_DIR)) mkdirSync(LUMI_DIR, { recursive: true, mode: 0o700 });
}

// ─────────────  types  ─────────────

type Identity = {
  name: string;
  locale: string;
  background: string;
  stage: "idea" | "product" | "users" | "revenue" | "";
};
type Prefs = {
  language: "zh-CN" | "en" | "zh-en-mix";
  writing_style: "formal" | "friendly" | "custom";
  ai_tolerance: number;     // 0-10
};
type ApiKeys = {
  // Lumi Lab itself never needs an LLM token (host provides it).
  // Kept null on disk for forward compatibility with any old reader.
  llm_provider: null;
  has_anthropic: null;
  has_dashscope: null;
  // Tool-type tokens (all optional):
  has_cloudflare: boolean;
  has_tavily: boolean;
  has_tikhub: boolean;
  has_dataforseo: boolean;
  has_keywordseverywhere: boolean;
  has_stripe: boolean;
  has_resend: boolean;
  has_wechat: boolean;
  has_x: boolean;
  cloudflare_account?: string;
  stripe_account?: string;
  resend_domain_count?: number;
};
type Deploy = {
  default_password: string;
  reuse_password: boolean;
  default_visibility: "private" | "public";
};
type DesignPreset = "editorial" | "minimalist" | "brutalist" | "soft" | "";
type WizardConfig = {
  version: "0.1.0";
  step: number;             // last completed step (0 = none)
  identity: Identity;
  prefs: Prefs;
  api: ApiKeys;
  deploy: Deploy;
  default_design_preset: DesignPreset;
  onboarded: boolean;
  onboarded_at?: string;
  completed_at?: string;
};

type Secrets = Record<string, string>;

// ─────────────  config persistence  ─────────────

function genPassword(): string {
  // 6-digit numeric, easy to dictate
  return String(Math.floor(100000 + Math.random() * 900000));
}

function defaultConfig(): WizardConfig {
  return {
    version: "0.1.0",
    step: 0,
    identity: { name: "", locale: "", background: "", stage: "" },
    prefs:    { language: "zh-CN", writing_style: "friendly", ai_tolerance: 4 },
    api:      {
      llm_provider: null,
      has_anthropic: null,
      has_dashscope: null,
      has_cloudflare: false,
      has_tavily: false,
      has_tikhub: false,
      has_dataforseo: false,
      has_keywordseverywhere: false,
      has_stripe: false,
      has_resend: false,
      has_wechat: false,
      has_x: false,
    },
    deploy:   { default_password: genPassword(), reuse_password: true, default_visibility: "public" },
    default_design_preset: "",
    onboarded: false,
  };
}

function loadConfig(): WizardConfig {
  ensureDir();
  if (!existsSync(CONFIG_PATH)) return defaultConfig();
  try {
    const raw = readFileSync(CONFIG_PATH, "utf8");
    const parsed = JSON.parse(raw);
    const base = defaultConfig();
    return {
      ...base,
      ...parsed,
      identity: { ...base.identity, ...(parsed.identity ?? {}) },
      prefs:    { ...base.prefs,    ...(parsed.prefs ?? {}) },
      api:      { ...base.api,      ...(parsed.api ?? {}), llm_provider: null, has_anthropic: null, has_dashscope: null },
      deploy:   { ...base.deploy,   ...(parsed.deploy ?? {}) },
    };
  } catch (e) {
    console.error(`[wizard] could not parse ${CONFIG_PATH}: ${(e as Error).message}; using defaults`);
    return defaultConfig();
  }
}

function saveConfig(cfg: WizardConfig) {
  ensureDir();
  writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2), { mode: 0o600 });
  try { chmodSync(CONFIG_PATH, 0o600); } catch { /* best-effort */ }
}

function loadSecrets(): Secrets {
  ensureDir();
  if (!existsSync(SECRETS_PATH)) return {};
  try { return JSON.parse(readFileSync(SECRETS_PATH, "utf8")); }
  catch { return {}; }
}

function saveSecret(key: string, value: string) {
  const s = loadSecrets();
  s[key] = value;
  writeFileSync(SECRETS_PATH, JSON.stringify(s, null, 2), { mode: 0o600 });
  try { chmodSync(SECRETS_PATH, 0o600); } catch { /* best-effort */ }
}

// ─────────────  verifiers  ─────────────

type VerifyResult = { ok: boolean; account?: string; meta?: string; error?: string; code?: string };

async function verifyCloudflare(token: string): Promise<VerifyResult> {
  if (!token || token.length < 20) return { ok: false, error: "token 太短", code: "E_FORMAT" };
  try {
    const r = await fetch("https://api.cloudflare.com/client/v4/accounts", {
      headers: { "Authorization": `Bearer ${token}`, "content-type": "application/json" },
    });
    if (!r.ok) {
      if (r.status === 400) return { ok: false, code: "E_400", error: "Cloudflare 400：token 格式不对，请确认完整粘贴" };
      if (r.status === 401) return { ok: false, code: "E_401", error: "Cloudflare 401：token 已失效或权限不足，请到 dash.cloudflare.com 重新生成" };
      if (r.status === 403) return { ok: false, code: "E_403", error: "Cloudflare 403：缺少 Account 读取权限" };
      return { ok: false, code: `E_${r.status}`, error: `Cloudflare ${r.status}` };
    }
    const j = await r.json() as { result?: Array<{ id: string; name: string }>; success?: boolean };
    if (!j.success || !j.result?.length) return { ok: false, code: "E_NOACCT", error: "token 有效，但未关联任何 Account" };
    return { ok: true, account: `${j.result[0].name} (${j.result[0].id.slice(0, 8)}…)` };
  } catch (e) {
    return { ok: false, code: "E_NET", error: `网络错误：${(e as Error).message}` };
  }
}

async function verifyTavily(token: string): Promise<VerifyResult> {
  if (!token || token.length < 8) return { ok: false, error: "token 太短", code: "E_FORMAT" };
  try {
    const r = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({ query: "lumi lab test", max_results: 1 }),
    });
    if (r.ok) return { ok: true };
    if (r.status === 401) return { ok: false, code: "E_401", error: "Tavily 401：API key 无效" };
    if (r.status === 403) return { ok: false, code: "E_403", error: "Tavily 403：权限不足" };
    if (r.status === 429) return { ok: false, code: "E_429", error: "Tavily 429：触发限流" };
    return { ok: false, code: `E_${r.status}`, error: `Tavily ${r.status}` };
  } catch (e) {
    return { ok: false, code: "E_NET", error: `网络错误：${(e as Error).message}` };
  }
}

async function verifyStripe(token: string): Promise<VerifyResult> {
  if (!token || token.length < 8) return { ok: false, code: "E_FORMAT", error: "token 太短" };
  try {
    const r = await fetch("https://api.stripe.com/v1/account", {
      headers: { "Authorization": `Bearer ${token}` },
    });
    if (r.ok) {
      const j = await r.json() as { id?: string; email?: string; business_profile?: { name?: string } };
      const acct = j.business_profile?.name || j.email || j.id || "ok";
      return { ok: true, account: acct };
    }
    if (r.status === 401) return { ok: false, code: "E_401", error: "Stripe 401：secret key 无效" };
    return { ok: false, code: `E_${r.status}`, error: `Stripe ${r.status}` };
  } catch (e) {
    return { ok: false, code: "E_NET", error: `网络错误：${(e as Error).message}` };
  }
}

async function verifyResend(token: string): Promise<VerifyResult> {
  if (!token || token.length < 8) return { ok: false, code: "E_FORMAT", error: "token 太短" };
  try {
    const r = await fetch("https://api.resend.com/domains", {
      headers: { "Authorization": `Bearer ${token}` },
    });
    if (r.ok) {
      const j = await r.json() as { data?: unknown[] };
      const n = Array.isArray(j.data) ? j.data.length : 0;
      return { ok: true, meta: `${n} 个域名` };
    }
    if (r.status === 401) return { ok: false, code: "E_401", error: "Resend 401：API key 无效" };
    return { ok: false, code: `E_${r.status}`, error: `Resend ${r.status}` };
  } catch (e) {
    return { ok: false, code: "E_NET", error: `网络错误：${(e as Error).message}` };
  }
}

async function verifyTikHub(token: string): Promise<VerifyResult> {
  if (!token || token.length < 8) return { ok: false, code: "E_FORMAT", error: "token 太短" };
  try {
    // 用 TikHub 的 user daily-usage 端点做最小验证（不消耗抓取配额）。
    const r = await fetch("https://api.tikhub.io/api/v1/tikhub/user/get_user_info", {
      headers: { "Authorization": `Bearer ${token}` },
    });
    if (r.ok) return { ok: true, meta: "TikHub API verify 通过" };
    if (r.status === 401) return { ok: false, code: "E_401", error: "TikHub 401：API key 无效" };
    if (r.status === 403) return { ok: false, code: "E_403", error: "TikHub 403：权限不足或套餐未开通" };
    if (r.status === 429) return { ok: false, code: "E_429", error: "TikHub 429：触发限流" };
    // 端点路径可能随版本变化——非 4xx 时不阻塞用户，保存并提示首次使用时再检查
    return { ok: true, meta: `TikHub 返回 ${r.status}，已保存，首次抓取时会再验证` };
  } catch (e) {
    return { ok: false, code: "E_NET", error: `网络错误：${(e as Error).message}` };
  }
}

async function verifyKeywordsEverywhere(token: string): Promise<VerifyResult> {
  if (!token || token.length < 8) return { ok: false, code: "E_FORMAT", error: "token 太短" };
  try {
    const r = await fetch("https://api.keywordseverywhere.com/v1/get_credits", {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}` },
    });
    if (r.ok) {
      const j = await r.json() as { data?: { credits?: number } };
      const credits = j?.data?.credits;
      return { ok: true, meta: credits !== undefined ? `${credits} credits` : "verify 通过" };
    }
    if (r.status === 401 || r.status === 403) return { ok: false, code: `E_${r.status}`, error: "Keywords Everywhere: API key 无效或权限不足" };
    if (r.status === 429) return { ok: false, code: "E_429", error: "Keywords Everywhere 429：触发限流" };
    return { ok: false, code: `E_${r.status}`, error: `Keywords Everywhere ${r.status}` };
  } catch (e) {
    return { ok: false, code: "E_NET", error: `网络错误：${(e as Error).message}` };
  }
}

async function verifyGeneric(_provider: string, token: string): Promise<VerifyResult> {
  if (!token || token.length < 4) return { ok: false, code: "E_FORMAT", error: "token 太短" };
  return { ok: true, meta: "已保存（首次使用时验证）" };
}

async function verifyToken(provider: string, token: string): Promise<VerifyResult> {
  switch (provider) {
    case "cloudflare": return verifyCloudflare(token);
    case "tavily":        return verifyTavily(token);
    case "stripe":     return verifyStripe(token);
    case "resend":     return verifyResend(token);
    case "tikhub":     return verifyTikHub(token);
    case "keywordseverywhere": return verifyKeywordsEverywhere(token);
    default:           return verifyGeneric(provider, token);
  }
}

// ─────────────  HTML chrome  ─────────────

const FONT_LINK = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Geist:wght@300..700&family=JetBrains+Mono:wght@400..600&family=Fraunces:ital,opsz,wght@0,9..144,400..600;1,9..144,400..500&family=Space+Grotesk:wght@400..600&family=Space+Mono:wght@400;700&family=Noto+Serif+SC:wght@400..600&family=Noto+Sans+SC:wght@400..600&display=swap" rel="stylesheet">`;

const CSS = `
:root {
  --color-bg:        oklch(97% 0.012 80);
  --color-bg-2:      oklch(95% 0.014 80);
  --color-surface:   oklch(99.5% 0.006 80);
  --color-ink:       oklch(18% 0.018 60);
  --color-ink-2:     oklch(35% 0.015 60);
  --color-mute:      oklch(58% 0.012 60);
  --color-hairline:  oklch(86% 0.012 60);
  --color-accent:    oklch(42% 0.16 28);
  --color-accent-2:  oklch(95% 0.04 28);
  --color-success:   oklch(45% 0.12 145);
  --color-warn:      oklch(58% 0.14 70);
  --color-error:     oklch(50% 0.18 28);

  --font-sans:   "Geist", "Geist Sans", ui-sans-serif, system-ui, -apple-system, sans-serif;
  --font-mono:   "JetBrains Mono", ui-monospace, "SFMono-Regular", Menlo, monospace;

  --space-1:  0.25rem;
  --space-2:  0.5rem;
  --space-3:  0.75rem;
  --space-4:  1rem;
  --space-6:  1.5rem;
  --space-8:  2rem;

  --radius:    6px;
  --radius-2:  9px;
  --radius-lg: 12px;

  /* 暖色调柔和阴影 —— 让卡片浮在纸面上，而不是平铺的硬框 */
  --shadow-sm: 0 1px 2px oklch(30% 0.02 60 / 0.06);
  --shadow-md: 0 6px 18px oklch(30% 0.03 60 / 0.08), 0 2px 5px oklch(30% 0.02 60 / 0.05);
  --shadow-lift: 0 12px 30px oklch(30% 0.03 60 / 0.12), 0 3px 8px oklch(30% 0.02 60 / 0.06);
  --shadow-accent: 0 8px 22px oklch(45% 0.15 32 / 0.22);

  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
}

/* ── live theme presets (Step 2 re-themes the whole wizard) ── */
/* editorial — warm paper + serif headings */
html[data-theme="editorial"] {
  --color-bg:       oklch(96% 0.022 85);
  --color-bg-2:     oklch(93% 0.026 85);
  --color-surface:  oklch(98.5% 0.012 85);
  --color-ink:      oklch(22% 0.03 60);
  --color-ink-2:    oklch(38% 0.026 55);
  --color-mute:     oklch(56% 0.02 60);
  --color-hairline: oklch(82% 0.022 70);
  --color-accent:   oklch(45% 0.15 32);
  --color-accent-2: oklch(93% 0.045 40);
  --font-sans: "Fraunces", "Noto Serif SC", Georgia, serif;
  --font-mono: "JetBrains Mono", ui-monospace, Menlo, monospace;
  --radius: 8px;
  --radius-2: 12px;
  --radius-lg: 16px;
}
/* minimalist — cool near-white + geometric sans + airy */
html[data-theme="minimalist"] {
  --color-bg:       oklch(98.5% 0.003 250);
  --color-bg-2:     oklch(96% 0.004 250);
  --color-surface:  oklch(99.6% 0.002 250);
  --color-ink:      oklch(24% 0.008 250);
  --color-ink-2:    oklch(42% 0.008 250);
  --color-mute:     oklch(62% 0.008 250);
  --color-hairline: oklch(90% 0.005 250);
  --color-accent:   oklch(52% 0.09 250);
  --color-accent-2: oklch(95% 0.025 250);
  --font-sans: "Space Grotesk", "Noto Sans SC", ui-sans-serif, sans-serif;
  --font-mono: "Space Mono", ui-monospace, Menlo, monospace;
  --radius: 0px;
  --radius-2: 0px;
  --radius-lg: 0px;
}
/* brutalist — high-contrast acid + mono + hard edges */
html[data-theme="brutalist"] {
  --color-bg:       oklch(94% 0.13 96);
  --color-bg-2:     oklch(89% 0.15 96);
  --color-surface:  oklch(97% 0.07 96);
  --color-ink:      oklch(16% 0.02 60);
  --color-ink-2:    oklch(24% 0.02 60);
  --color-mute:     oklch(40% 0.03 60);
  --color-hairline: oklch(16% 0.02 60);
  --color-accent:   oklch(52% 0.22 28);
  --color-accent-2: oklch(88% 0.16 96);
  --font-sans: "Space Mono", "Noto Sans SC", ui-monospace, monospace;
  --font-mono: "Space Mono", ui-monospace, Menlo, monospace;
  --radius: 0px;
  --radius-2: 0px;
  --radius-lg: 0px;
}
/* soft — low-saturation pastel + rounded + gentle */
html[data-theme="soft"] {
  --color-bg:       oklch(96.5% 0.022 30);
  --color-bg-2:     oklch(94% 0.03 30);
  --color-surface:  oklch(98.5% 0.014 30);
  --color-ink:      oklch(34% 0.04 25);
  --color-ink-2:    oklch(48% 0.04 25);
  --color-mute:     oklch(64% 0.035 25);
  --color-hairline: oklch(87% 0.03 28);
  --color-accent:   oklch(60% 0.11 22);
  --color-accent-2: oklch(93% 0.05 25);
  --font-sans: "Space Grotesk", "Noto Sans SC", ui-sans-serif, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, Menlo, monospace;
  --radius: 12px;
  --radius-2: 16px;
  --radius-lg: 22px;
}

* { box-sizing: border-box; margin: 0; padding: 0; }
html { -webkit-text-size-adjust: 100%; font-size: 16px; }
body {
  font-family: var(--font-sans);
  background: var(--color-bg);
  color: var(--color-ink);
  min-height: 100dvh;
  line-height: 1.6;
  /* 基础字号随视口缩放：小屏 15px，大屏到 17px */
  font-size: clamp(15px, 0.9rem + 0.25vw, 17px);
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

/* layout — 大屏加宽，不再死守 760px */
.shell {
  max-width: clamp(760px, 60vw, 1040px);
  margin: 0 auto;
  padding: var(--space-6) var(--space-6) var(--space-8);
}
@media (min-width: 1100px) {
  .shell { padding: var(--space-8) var(--space-8) var(--space-8); }
}

/* header bar */
.bar {
  display: flex; align-items: center; justify-content: space-between;
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--color-hairline);
  margin-bottom: var(--space-6);
}
.bar__brand {
  font-family: var(--font-mono);
  font-size: 11px; font-weight: 600;
  letter-spacing: 0.14em; text-transform: uppercase;
  color: var(--color-ink);
  display: inline-flex; align-items: center; gap: var(--space-2);
}
.bar__brand .sq {
  display: inline-block; width: 8px; height: 8px;
  background: var(--color-accent);
}
.bar__meta {
  font-family: var(--font-mono); font-size: 11px;
  color: var(--color-mute); letter-spacing: 0.08em;
}

/* progress */
.steps {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 0; margin-bottom: var(--space-6);
  border: 1px solid var(--color-hairline);
  border-radius: var(--radius-2);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}
.step-cell {
  position: relative;
  padding: var(--space-3) var(--space-3);
  border-right: 1px solid var(--color-hairline);
  background: var(--color-surface);
  cursor: default;
  transition: background 150ms var(--ease-out);
}
.step-cell:last-child { border-right: 0; }
.step-cell.clickable { cursor: pointer; }
.step-cell.clickable:hover { background: var(--color-bg-2); }
.step-cell__num {
  font-family: var(--font-mono); font-size: 11px;
  color: var(--color-mute); letter-spacing: 0.08em;
}
.step-cell__label {
  font-family: var(--font-sans); font-size: 12px;
  font-weight: 500; color: var(--color-ink-2); margin-top: 2px;
}
.step-cell.done .step-cell__num { color: var(--color-accent); }
.step-cell.done .step-cell__label { color: var(--color-ink); }
.step-cell.current { background: var(--color-bg-2); }
.step-cell.current::after {
  content: ''; position: absolute; left: 0; right: 0; bottom: -1px;
  height: 2px; background: var(--color-accent);
}
.step-cell.current .step-cell__num { color: var(--color-accent); font-weight: 600; }
.step-cell.current .step-cell__label { color: var(--color-ink); font-weight: 600; }

/* page heading (compact) */
.page-h {
  display: flex; align-items: baseline; justify-content: space-between;
  margin-bottom: var(--space-6);
}
.page-h__title {
  font-family: var(--font-sans);
  font-size: 24px; font-weight: 600;
  letter-spacing: -0.01em; color: var(--color-ink);
}
.page-h__sub {
  font-family: var(--font-mono); font-size: 11px;
  letter-spacing: 0.1em; text-transform: uppercase;
  color: var(--color-mute);
}

/* short intro text on welcome */
.intro {
  font-family: var(--font-sans); font-size: 15.5px;
  color: var(--color-ink-2); line-height: 1.6;
  max-width: 60ch; margin-bottom: var(--space-4);
}
.intro strong { color: var(--color-ink); font-weight: 600; }
.intro code {
  font-family: var(--font-mono); font-size: 13px;
  background: var(--color-bg-2); padding: 1px 5px;
  border: 1px solid var(--color-hairline); border-radius: 3px;
  white-space: normal; overflow-wrap: anywhere; word-break: break-word;
}

/* "what this step does" intro box */
.step-intro {
  display: flex; gap: var(--space-3); align-items: flex-start;
  border: 1px solid var(--color-accent-2);
  border-left: 3px solid var(--color-accent);
  border-radius: var(--radius-2);
  background: var(--color-accent-2);
  padding: var(--space-4) var(--space-4);
  margin-bottom: var(--space-6);
}
.step-intro__tag {
  font-family: var(--font-mono); font-size: 10px;
  letter-spacing: 0.12em; text-transform: uppercase;
  color: var(--color-surface);
  background: var(--color-accent);
  border-radius: 999px;
  padding: 3px 9px;
  white-space: nowrap; flex: 0 0 auto;
}
.step-intro__text {
  font-family: var(--font-sans); font-size: 14.5px;
  color: var(--color-ink-2); line-height: 1.55;
}
.step-intro__text strong { color: var(--color-ink); font-weight: 600; }

/* fieldset / sections */
fieldset {
  border: 0;
  padding: 0;
  margin-bottom: var(--space-6);
}
legend {
  font-family: var(--font-mono); font-size: 11px;
  letter-spacing: 0.16em; text-transform: uppercase;
  color: var(--color-mute);
  padding-bottom: var(--space-2);
  border-bottom: 1px solid var(--color-hairline);
  margin-bottom: var(--space-4);
  width: 100%;
  display: block;
}

/* form rows: left label / right input */
.row {
  display: grid;
  grid-template-columns: 160px 1fr;
  gap: var(--space-4);
  align-items: start;
  padding: var(--space-3) 0;
  border-bottom: 1px solid var(--color-hairline);
}
.row:last-child { border-bottom: 0; }
.row__label {
  font-family: var(--font-sans); font-size: 13px;
  font-weight: 500; color: var(--color-ink); padding-top: 8px;
}
.row__label .req {
  font-family: var(--font-mono); font-size: 10px;
  color: var(--color-mute); margin-left: 4px;
  letter-spacing: 0.08em;
}
.row__body { display: grid; gap: 6px; }
.row__hint {
  font-family: var(--font-sans); font-size: 12px;
  color: var(--color-mute); line-height: 1.5;
}

/* inputs */
input[type="text"],
input[type="password"],
input[type="number"],
textarea, select {
  font-family: var(--font-mono);
  font-size: 13px;
  padding: 8px 10px;
  background: var(--color-surface);
  color: var(--color-ink);
  border: 1px solid var(--color-hairline);
  border-radius: var(--radius);
  width: 100%;
  height: 36px;
  outline: none;
  transition: border-color 150ms var(--ease-out);
}
input.prose, textarea.prose {
  font-family: var(--font-sans);
  font-size: 14px;
}
textarea {
  min-height: 64px; height: auto;
  resize: vertical;
  line-height: 1.5;
  padding-top: 8px;
}
input:focus, textarea:focus, select:focus {
  border-color: var(--color-accent);
}
input::placeholder, textarea::placeholder {
  color: var(--color-mute);
  font-family: var(--font-mono);
}
input.prose::placeholder, textarea.prose::placeholder {
  font-family: var(--font-sans);
}

/* radio group (segmented) */
.seg {
  display: inline-flex;
  border: 1px solid var(--color-hairline);
  background: var(--color-surface);
  height: 36px;
}
.seg label {
  font-family: var(--font-sans); font-size: 12px;
  padding: 0 var(--space-3);
  display: inline-flex; align-items: center;
  cursor: pointer;
  color: var(--color-ink-2);
  border-right: 1px solid var(--color-hairline);
  transition: background 120ms;
  user-select: none;
  white-space: nowrap;
}
.seg label:last-child { border-right: 0; }
.seg label input { display: none; }
.seg label.active,
.seg label:has(input:checked) {
  background: var(--color-ink);
  color: var(--color-bg);
  font-weight: 500;
}
.seg label:hover:not(.active) { background: var(--color-bg-2); }

/* slider */
.slider {
  display: grid; grid-template-columns: 1fr 56px; gap: var(--space-3); align-items: center;
}
.slider input[type="range"] {
  width: 100%;
  -webkit-appearance: none; appearance: none;
  background: transparent; height: 24px;
}
.slider input[type="range"]::-webkit-slider-runnable-track {
  height: 2px; background: var(--color-ink);
}
.slider input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none; appearance: none;
  width: 14px; height: 14px;
  background: var(--color-accent); border: 0;
  margin-top: -6px;
  border-radius: 0;
}
.slider .v {
  font-family: var(--font-mono); font-size: 13px;
  color: var(--color-ink); text-align: right; font-weight: 600;
}
.slider-scale {
  display: flex; justify-content: space-between;
  font-family: var(--font-mono); font-size: 10px;
  color: var(--color-mute); letter-spacing: 0.08em;
  margin-top: 4px;
}

/* checkbox */
.check {
  display: inline-flex; align-items: center; gap: var(--space-2);
  font-family: var(--font-sans); font-size: 13px;
  color: var(--color-ink-2); cursor: pointer;
}
.check input[type="checkbox"] {
  appearance: none; -webkit-appearance: none;
  width: 14px; height: 14px;
  border: 1px solid var(--color-ink);
  background: var(--color-surface);
  cursor: pointer; position: relative;
  border-radius: 0;
}
.check input[type="checkbox"]:checked { background: var(--color-ink); }
.check input[type="checkbox"]:checked::after {
  content: ''; position: absolute;
  left: 3px; top: 0; width: 5px; height: 9px;
  border: solid var(--color-bg); border-width: 0 1.5px 1.5px 0;
  transform: rotate(45deg);
}

/* buttons */
button {
  font-family: var(--font-sans);
  font-size: 13px; font-weight: 500;
  height: 36px; padding: 0 var(--space-4);
  background: var(--color-surface);
  color: var(--color-ink);
  border: 1px solid var(--color-hairline);
  border-radius: var(--radius);
  cursor: pointer;
  transition: transform 100ms var(--ease-out), background 120ms, color 120ms, border-color 120ms;
  white-space: nowrap;
}
button:hover { background: var(--color-bg-2); }
button:active { transform: translateY(1px); }
button.primary {
  background: var(--color-ink);
  color: var(--color-bg);
  border-color: var(--color-ink);
}
button.primary:hover { background: var(--color-ink-2); border-color: var(--color-ink-2); }
button.ghost {
  background: transparent;
  color: var(--color-ink-2);
}
button.ghost:hover { color: var(--color-ink); }
button[disabled] { opacity: 0.4; cursor: not-allowed; }

/* token input row */
.token-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0;
}
.token-row input {
  border-right: 0;
}
.token-row button {
  border-left: 1px solid var(--color-hairline);
}

/* status bars (success / error / pending) */
.status {
  font-family: var(--font-mono); font-size: 12px;
  min-height: 20px;
  padding: 4px 0 4px var(--space-3);
  border-left: 3px solid transparent;
  color: var(--color-mute);
  line-height: 1.4;
  display: none;
}
.status.show { display: block; }
.status.ok      { border-left-color: var(--color-success); color: var(--color-success); }
.status.err     { border-left-color: var(--color-error);   color: var(--color-error); }
.status.pending { border-left-color: var(--color-warn);    color: var(--color-warn); }

/* quickstart details */
details.qs {
  margin-top: 4px;
}
details.qs > summary {
  font-family: var(--font-mono); font-size: 11px;
  letter-spacing: 0.08em; color: var(--color-mute);
  cursor: pointer; list-style: none;
  padding: 4px 0;
}
details.qs > summary::-webkit-details-marker { display: none; }
details.qs > summary::before { content: '▸ '; color: var(--color-accent); }
details.qs[open] > summary::before { content: '▾ '; }
details.qs > div {
  font-family: var(--font-sans); font-size: 12px;
  color: var(--color-ink-2);
  padding: var(--space-2) 0 var(--space-2) var(--space-3);
  border-left: 1px solid var(--color-hairline);
  margin-top: 4px;
}
details.qs ol { margin: 4px 0 0 1.2rem; padding: 0; display: grid; gap: 2px; }
details.qs a { color: var(--color-accent); text-decoration: underline; text-underline-offset: 2px; }
details.qs code {
  font-family: var(--font-mono); font-size: 11px;
  background: var(--color-bg-2); padding: 1px 4px;
  border: 1px solid var(--color-hairline);
  white-space: nowrap; word-break: keep-all;
}

/* optional pro tier */
details.pro {
  margin-top: var(--space-4);
  border-top: 1px solid var(--color-hairline);
  padding-top: var(--space-4);
}
details.pro > summary {
  font-family: var(--font-mono); font-size: 11px;
  letter-spacing: 0.16em; text-transform: uppercase;
  color: var(--color-mute);
  cursor: pointer; list-style: none;
  padding: var(--space-2) 0;
}
details.pro > summary::-webkit-details-marker { display: none; }
details.pro > summary::before { content: '+ '; color: var(--color-accent); }
details.pro[open] > summary::before { content: '− '; }

/* footer actions */
.actions {
  display: flex; gap: var(--space-2); justify-content: flex-end;
  margin-top: var(--space-8);
  padding-top: var(--space-4);
  border-top: 1px solid var(--color-hairline);
}
.actions .spacer { flex: 1; }

/* summary card (step 5) */
.summary {
  border: 1px solid var(--color-hairline);
  background: var(--color-surface);
  padding: var(--space-4);
  margin-top: var(--space-4);
}
.summary__row {
  display: grid; grid-template-columns: 140px 1fr;
  gap: var(--space-3); padding: 4px 0;
  font-family: var(--font-mono); font-size: 12px;
}
.summary__row dt {
  color: var(--color-mute);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-size: 10px;
  padding-top: 2px;
}
.summary__row dd { color: var(--color-ink); }

/* step 6 — tool integration overview (✓/— per tool) */
.tool-overview { margin-top: var(--space-4); }
.tool-overview__h {
  font-family: var(--font-mono); font-size: 11px; font-weight: 600;
  letter-spacing: 0.06em; color: var(--color-ink-2);
  margin-bottom: var(--space-2);
}
.tool-stats {
  display: grid; grid-template-columns: 1fr 1fr; gap: 1px;
  background: var(--color-hairline);
  border: 1px solid var(--color-hairline);
}
.tool-stat {
  display: flex; align-items: baseline; gap: var(--space-2);
  background: var(--color-surface);
  padding: var(--space-2) var(--space-3);
  font-family: var(--font-sans); font-size: 13px;
}
.tool-stat__mark {
  font-family: var(--font-mono); font-weight: 600;
  flex: 0 0 auto; width: 12px;
}
.tool-stat.is-on  .tool-stat__mark { color: var(--color-accent); }
.tool-stat.is-off .tool-stat__mark { color: var(--color-mute); }
.tool-stat.is-on  .tool-stat__name { color: var(--color-ink); font-weight: 600; }
.tool-stat.is-off .tool-stat__name { color: var(--color-mute); }
.tool-stat__note {
  font-size: 11px; color: var(--color-mute);
  margin-left: auto; text-align: right; min-width: 0;
}
.tool-overview__note {
  font-family: var(--font-sans); font-size: 12px;
  color: var(--color-mute); line-height: 1.6;
  margin: var(--space-2) 0 0;
}
.autosave-note {
  font-family: var(--font-sans); font-size: 13px; line-height: 1.65;
  color: var(--color-ink-2);
  background: var(--color-bg-2);
  border: 1px solid var(--color-hairline);
  border-left: 3px solid var(--color-accent);
  border-radius: var(--radius);
  padding: var(--space-3) var(--space-4);
  margin-top: var(--space-4);
}
.autosave-note strong { color: var(--color-ink); font-weight: 600; }

/* welcome — flow diagram (the hero) */
.flow {
  display: flex; align-items: stretch; flex-wrap: wrap;
  gap: var(--space-2);
  border: 1px solid var(--color-hairline);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  padding: var(--space-6);
  margin-bottom: var(--space-6);
  box-shadow: var(--shadow-md);
}
.flow__node {
  flex: 1 1 0; min-width: 96px;
  display: flex; flex-direction: column; gap: 5px;
  padding: var(--space-3) var(--space-3) calc(var(--space-3) + 2px);
  background: var(--color-bg-2);
  border: 1px solid var(--color-hairline);
  border-radius: var(--radius);
  transition: transform 150ms var(--ease-out);
}
.flow__node .k {
  font-family: var(--font-mono); font-size: 10px;
  letter-spacing: 0.1em; color: var(--color-mute);
}
.flow__node .t {
  font-family: var(--font-sans); font-size: 12.5px;
  font-weight: 600; color: var(--color-ink); line-height: 1.35;
}
.flow__arrow {
  align-self: center;
  font-family: var(--font-mono); font-size: 14px;
  color: var(--color-hairline);
}
/* 两个「产物」节点 = 流程里真正的产出，填实重音色让它们跳出来 */
.flow__node.accent {
  background: var(--color-accent);
  border-color: var(--color-accent);
  box-shadow: var(--shadow-accent);
}
.flow__node.accent .k { color: var(--color-accent-2); }
.flow__node.accent .t { color: var(--color-surface); }

/* welcome — section heading（带重音 kicker，方便扫读） */
.block-h {
  font-family: var(--font-sans); font-size: 16px; font-weight: 600;
  color: var(--color-ink); margin: var(--space-8) 0 var(--space-4);
  padding-bottom: var(--space-2); border-bottom: 1px solid var(--color-hairline);
  display: flex; align-items: center; gap: var(--space-2);
}
.block-h::before {
  content: ''; flex: 0 0 auto;
  width: 4px; height: 16px; border-radius: 2px;
  background: var(--color-accent);
}

/* welcome — two deliverables（产物 = 用户真正拿到的东西，做成会浮起的卡片） */
.deliverables {
  display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4);
  margin-bottom: var(--space-4);
}
.deliv {
  position: relative;
  border: 1px solid var(--color-hairline); border-radius: var(--radius-lg);
  background: var(--color-surface); padding: var(--space-6); min-width: 0;
  box-shadow: var(--shadow-md);
  transition: transform 180ms var(--ease-out), box-shadow 180ms var(--ease-out);
}
.deliv:hover { transform: translateY(-3px); box-shadow: var(--shadow-lift); }
.deliv::before {
  content: ''; position: absolute; left: 0; right: 0; top: 0; height: 3px;
  background: var(--color-accent);
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
}
.deliv__no {
  display: inline-block;
  font-family: var(--font-mono); font-size: 11px; font-weight: 600;
  color: var(--color-surface); background: var(--color-accent);
  letter-spacing: 0.06em; padding: 3px 9px; border-radius: 999px;
}
.deliv__title {
  font-family: var(--font-sans); font-size: 17px; font-weight: 600;
  color: var(--color-ink); margin: var(--space-3) 0 var(--space-2);
}
.deliv__desc {
  font-family: var(--font-sans); font-size: 14.5px; line-height: 1.65;
  color: var(--color-ink-2); margin: 0;
}

/* welcome — skill showcase chips */
.skills-show {
  display: flex; flex-wrap: wrap; gap: var(--space-2);
  margin-bottom: var(--space-6);
}
.skill-chip {
  font-family: var(--font-mono); font-size: 12px;
  color: var(--color-ink-2); background: var(--color-surface);
  border: 1px solid var(--color-hairline); border-radius: 999px;
  padding: 5px 12px; white-space: nowrap;
  box-shadow: var(--shadow-sm);
  transition: transform 120ms var(--ease-out), border-color 120ms var(--ease-out);
}
.skill-chip:hover { transform: translateY(-1px); border-color: var(--color-accent); }

/* welcome — tips list */
.tips {
  list-style: none; display: grid; gap: var(--space-3);
  margin-bottom: var(--space-6);
}
.tips li {
  display: flex; align-items: baseline; gap: var(--space-2);
  font-family: var(--font-sans); font-size: 14.5px;
  color: var(--color-ink-2); line-height: 1.6;
}
.tips li::before {
  content: '›'; font-family: var(--font-mono);
  color: var(--color-accent); font-weight: 600;
  flex: 0 0 auto;
}
.tips li > span { min-width: 0; flex: 1 1 auto; }
.tips code {
  font-family: var(--font-mono); font-size: 12px;
  background: var(--color-bg-2); padding: 1px 5px;
  border: 1px solid var(--color-hairline); border-radius: 3px;
  white-space: normal; overflow-wrap: anywhere; word-break: break-word;
}

/* design preset cards */
.presets {
  display: grid; grid-template-columns: repeat(2, 1fr);
  gap: var(--space-4); margin-bottom: var(--space-6);
}
.preset-card {
  border: 1px solid var(--color-hairline);
  background: var(--color-surface);
  cursor: pointer;
  transition: border-color 120ms var(--ease-out), box-shadow 120ms var(--ease-out);
  display: flex; flex-direction: column;
  overflow: hidden;
}
.preset-card:hover { border-color: var(--color-ink-2); }
.preset-card.selected {
  border-color: var(--color-accent);
  box-shadow: inset 0 0 0 1px var(--color-accent);
}
.preset-card__preview {
  height: 200px; padding: 18px 20px;
  display: flex; flex-direction: column; justify-content: center; gap: 10px;
  position: relative; overflow: hidden;
}
.preset-card__btn {
  display: inline-block; align-self: flex-start;
  padding: 7px 14px; font-size: 12px;
}
.preset-card__meta {
  padding: var(--space-3) var(--space-4);
  border-top: 1px solid var(--color-hairline);
  display: flex; flex-direction: column; gap: 2px;
}
.preset-card__name {
  font-family: var(--font-mono); font-size: 12px;
  font-weight: 600; letter-spacing: 0.08em;
  color: var(--color-ink); text-transform: uppercase;
  display: flex; align-items: center; gap: var(--space-2);
}
.preset-card__name .pick {
  font-family: var(--font-mono); font-size: 10px;
  color: var(--color-accent); letter-spacing: 0.06em;
  text-transform: none; display: none;
}
.preset-card.selected .preset-card__name .pick { display: inline; }
.preset-card__vibe {
  font-family: var(--font-sans); font-size: 12px;
  color: var(--color-mute); line-height: 1.4;
}

/* preset preview — editorial */
.pv-editorial {
  background: oklch(96% 0.02 85);
  color: oklch(22% 0.03 60);
}
.pv-editorial .eyebrow {
  font-family: "JetBrains Mono", monospace; font-size: 10px;
  letter-spacing: 0.18em; text-transform: uppercase;
  color: oklch(45% 0.14 30);
}
.pv-editorial .hd {
  font-family: "Fraunces", "Noto Serif SC", Georgia, serif;
  font-size: 30px; font-weight: 600; line-height: 1.05;
  letter-spacing: -0.01em;
}
.pv-editorial .preset-card__btn {
  background: oklch(22% 0.03 60); color: oklch(96% 0.02 85);
  border: 1px solid oklch(22% 0.03 60);
  font-family: "JetBrains Mono", monospace; letter-spacing: 0.04em;
}

/* preset preview — minimalist */
.pv-minimalist {
  background: oklch(98% 0.004 100);
  color: oklch(25% 0.006 250);
}
.pv-minimalist .eyebrow {
  font-family: "Space Mono", monospace; font-size: 10px;
  letter-spacing: 0.1em; color: oklch(60% 0.01 250);
}
.pv-minimalist .hd {
  font-family: "Space Grotesk", "Noto Sans SC", sans-serif;
  font-size: 26px; font-weight: 500; line-height: 1.15;
  letter-spacing: -0.02em;
}
.pv-minimalist .preset-card__btn {
  background: transparent; color: oklch(25% 0.006 250);
  border: 1px solid oklch(78% 0.006 250);
  font-family: "Space Mono", monospace;
}

/* preset preview — brutalist */
.pv-brutalist {
  background: oklch(93% 0.16 95);
  color: oklch(16% 0.02 60);
}
.pv-brutalist .eyebrow {
  font-family: "JetBrains Mono", monospace; font-size: 10px;
  letter-spacing: 0.04em; text-transform: uppercase;
  background: oklch(16% 0.02 60); color: oklch(93% 0.16 95);
  padding: 2px 6px; align-self: flex-start;
}
.pv-brutalist .hd {
  font-family: "Space Mono", "Noto Sans SC", monospace;
  font-size: 28px; font-weight: 700; line-height: 1.0;
  text-transform: uppercase;
}
.pv-brutalist .preset-card__btn {
  background: oklch(55% 0.22 28); color: oklch(97% 0.02 95);
  border: 2px solid oklch(16% 0.02 60);
  box-shadow: 3px 3px 0 oklch(16% 0.02 60);
  font-family: "Space Mono", monospace; font-weight: 700;
  text-transform: uppercase;
}

/* preset preview — soft */
.pv-soft {
  background: oklch(95% 0.03 30);
  color: oklch(32% 0.04 25);
}
.pv-soft .eyebrow {
  font-family: "Space Mono", monospace; font-size: 10px;
  letter-spacing: 0.12em; color: oklch(58% 0.1 25);
}
.pv-soft .hd {
  font-family: "Fraunces", "Noto Serif SC", serif;
  font-size: 27px; font-weight: 400; line-height: 1.12;
  font-style: italic;
}
.pv-soft .preset-card__btn {
  background: oklch(80% 0.09 25); color: oklch(28% 0.05 25);
  border: 1px solid oklch(72% 0.1 25);
  border-radius: 20px;
  font-family: "Space Grotesk", "Noto Sans SC", sans-serif;
}

/* finish — how to start */
.kickoff {
  border: 1px solid var(--color-accent);
  background: var(--color-accent-2);
  padding: var(--space-4);
  margin-top: var(--space-6);
}
.kickoff__h {
  font-family: var(--font-mono); font-size: 11px;
  letter-spacing: 0.14em; text-transform: uppercase;
  color: var(--color-accent); margin-bottom: var(--space-3);
}
.kickoff__cmd {
  font-family: var(--font-mono); font-size: 13px;
  background: var(--color-surface);
  border: 1px solid var(--color-hairline);
  padding: 8px 10px; margin-bottom: var(--space-2);
  color: var(--color-ink);
  white-space: nowrap; overflow-x: auto;
}
.kickoff__note {
  font-family: var(--font-sans); font-size: 12px;
  color: var(--color-ink-2); line-height: 1.5;
}

/* responsive */
@media (max-width: 680px) {
  .row { grid-template-columns: 1fr; gap: var(--space-2); }
  .row__label { padding-top: 0; }
  .seg { width: 100%; flex-wrap: wrap; height: auto; }
  .seg label { flex: 1; justify-content: center; padding: 8px var(--space-2); }
  .step-cell__label { display: none; }
  .presets { grid-template-columns: 1fr; }
  .flow__arrow { transform: rotate(90deg); }
}
`;

function topBar(): string {
  return `
<header class="bar">
  <div class="bar__brand"><span class="sq"></span>LUMI · LAB &nbsp;/&nbsp; 配置向导</div>
  <div class="bar__meta">v0.1.0 · 127.0.0.1</div>
</header>`;
}

function progressBar(current: number): string {
  const labels = ["欢迎", "界面风格", "你是谁", "偏好", "工具集成", "部署偏好"];
  const cells = labels.map((label, i) => {
    const num = String(i + 1).padStart(2, "0");
    const stepNo = i + 1;
    let cls = "step-cell";
    if (stepNo < current) cls += " done clickable";
    if (stepNo === current) cls += " current";
    const click = stepNo < current ? `onclick="go('/.setup/${stepNo}.html')"` : "";
    return `<div class="${cls}" ${click}><div class="step-cell__num">${num}</div><div class="step-cell__label">${label}</div></div>`;
  }).join("");
  return `<nav class="steps" aria-label="配置进度">${cells}</nav>`;
}

function page(title: string, current: number, body: string, extraScript = "", theme: DesignPreset = ""): string {
  const themeAttr = theme ? ` data-theme="${theme}"` : "";
  return `<!doctype html>
<html lang="zh-CN"${themeAttr}>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} · Lumi Lab 配置向导</title>
${FONT_LINK}
<style>${CSS}</style>
</head>
<body>
<div class="shell">
  ${topBar()}
  ${progressBar(current)}
  <main>${body}</main>
</div>
<script>
async function postJSON(url, data) {
  const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(data) });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return r.json();
}
function go(path) { window.location.href = path; }
function applyTheme(id) {
  document.documentElement.setAttribute('data-theme', id);
}
function setSeg(rootId, name) {
  const root = document.getElementById(rootId);
  if (!root) return;
  root.querySelectorAll('label').forEach(lbl => {
    lbl.addEventListener('click', () => {
      root.querySelectorAll('label').forEach(l => l.classList.remove('active'));
      lbl.classList.add('active');
      const inp = lbl.querySelector('input');
      if (inp) inp.checked = true;
    });
  });
}
${extraScript}
</script>
</body>
</html>`;
}

// ─────────────  helpers  ─────────────

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function escapeAttr(s: string): string { return escapeHtml(s); }

// ─────────────  step renderers  ─────────────

function renderStep1(cfg: WizardConfig): string {
  const body = `
<section class="page-h">
  <h1 class="page-h__title">欢迎来到 Lumi Lab</h1>
  <span class="page-h__sub">01 / 06</span>
</section>

<div class="step-intro">
  <span class="step-intro__tag">这一步</span>
  <span class="step-intro__text">先花两分钟认识一下 Lumi Lab —— 它是什么、能帮你省掉什么、整个流程长什么样。看完点「开始」往下走。</span>
</div>

<p class="intro">
  <strong>有个创业 idea，但不知道行不行？别急着写代码、别急着做产品。</strong>
  Lumi Lab 帮你在写第一行代码之前，先把这个 idea 跑成一份<strong>能拿来做判断的东西</strong> ——
  一份完整的网页版分析报告，加一个能测<strong>真实购买意愿</strong>的验证页。几天时间、几乎零成本，就知道值不值得做。
</p>

<div class="flow" aria-label="Lumi Lab 工作流">
  <div class="flow__node"><span class="k">输入</span><span class="t">一句话 idea</span></div>
  <span class="flow__arrow">→</span>
  <div class="flow__node"><span class="k">自动</span><span class="t">市场 / 竞品 / 人群 / 关键词分析</span></div>
  <span class="flow__arrow">→</span>
  <div class="flow__node accent"><span class="k">产物 ①</span><span class="t">网页版分析报告</span></div>
  <span class="flow__arrow">→</span>
  <div class="flow__node"><span class="k">你来选</span><span class="t">方向建议</span></div>
  <span class="flow__arrow">→</span>
  <div class="flow__node accent"><span class="k">产物 ②</span><span class="t">fake-door 验证页</span></div>
  <span class="flow__arrow">→</span>
  <div class="flow__node"><span class="k">上线</span><span class="t">部署验证</span></div>
</div>

<h2 class="block-h">你会拿到两样东西</h2>
<div class="deliverables">
  <article class="deliv">
    <span class="deliv__no">产物 ①</span>
    <h3 class="deliv__title">网页版分析报告</h3>
    <p class="deliv__desc">不是一堆聊天文字 —— 是一份图文并茂的 HTML 报告：市场快照、竞品格局、目标人群、关键词红蓝海、3-5 个可选方向。打开就能看，能存能分享。</p>
  </article>
  <article class="deliv">
    <span class="deliv__no">产物 ②</span>
    <h3 class="deliv__title">fake-door 验证页</h3>
    <p class="deliv__desc">一个真能上线的落地页，带「立即购买 / 留邮箱」CTA + 转化追踪 + SEO/GEO。跑几天，回收「有多少人真的想买」这个数字。</p>
  </article>
</div>

<h2 class="block-h">背后是一整套 skill 在干活</h2>
<p class="intro" style="margin-bottom: var(--space-3);">你只给一句话，下面这些 skill 会自动接力 —— 你不用知道它们的名字，但它们都在为你这一个 idea 服务：</p>
<div class="skills-show">
  <span class="skill-chip">市场分析</span>
  <span class="skill-chip">竞品扫描</span>
  <span class="skill-chip">人群拆解 (ICP)</span>
  <span class="skill-chip">关键词调研 · 红蓝海</span>
  <span class="skill-chip">定位 / PMF</span>
  <span class="skill-chip">文案 (VoC)</span>
  <span class="skill-chip">设计方向</span>
  <span class="skill-chip">Landing 生成</span>
  <span class="skill-chip">SEO / GEO</span>
  <span class="skill-chip">加密部署</span>
  <span class="skill-chip">假设账本</span>
  <span class="skill-chip">周复盘</span>
</div>

<ul class="tips">
  <li><span>省掉几个月白做的风险 —— 在投入之前就知道有没有人真的想买。</span></li>
  <li><span>一句话就能跑：默认入口是 <code>lumilab idea "&lt;你的想法&gt;"</code>，不用懂技术。</span></li>
  <li><span>产物都是真能用的网页：一份分析报告 + 一个可部署的验证页链接。</span></li>
  <li><span>全程最多打扰你 2 次 —— 只在方向取舍这种该你拍板的事上停下来。</span></li>
  <li><span>不需要 LLM key —— 你的 AI 宿主（Claude Code / OpenClaw / Hermes…）已经自带。</span></li>
</ul>

<p class="intro" style="color: var(--color-mute);">
  接下来 5 步：选默认界面风格、填基本信息、设偏好、（可选）接工具 token、定部署默认值。
  配置写入 <code>~/.lumilab/config.json</code>，token 写入 <code>~/.lumilab/secrets.json</code>（权限 600）。
  之后随时重跑这个向导即可修改。
</p>

<div class="actions">
  <button class="ghost" onclick="go('/api/quit')">退出</button>
  <div class="spacer"></div>
  <button class="primary" onclick="go('/.setup/2.html')">开始 →</button>
</div>
`;
  return page("欢迎", 1, body, "", cfg.default_design_preset);
}

type PresetMeta = {
  id: "editorial" | "minimalist" | "brutalist" | "soft";
  name: string;
  vibe: string;
  eyebrow: string;
  headline: string;
  cta: string;
};

const DESIGN_PRESETS: PresetMeta[] = [
  { id: "editorial",  name: "editorial",  vibe: "杂志感 · 衬线大标题 · 暖纸张底，适合有观点的内容型产品。",
    eyebrow: "VALIDATION", headline: "你的想法\n值得被验证", cta: "加入等待列表" },
  { id: "minimalist", name: "minimalist", vibe: "克制留白 · 几何无衬线 · 冷灰，适合工具类、效率类产品。",
    eyebrow: "early access", headline: "少即是多\n先验证再做", cta: "获取早期访问" },
  { id: "brutalist",  name: "brutalist",  vibe: "高对比 · 粗体等宽 · 硬边阴影，适合敢表达、要被记住的产品。",
    eyebrow: "FAKE DOOR", headline: "别猜了\n测一下", cta: "立即预约" },
  { id: "soft",       name: "soft",       vibe: "柔和暖调 · 斜体衬线 · 圆角，适合生活方式、社区、情感向产品。",
    eyebrow: "coming soon", headline: "慢一点\n想清楚", cta: "抢先体验" },
];

function presetCard(p: PresetMeta, selected: boolean): string {
  const lines = p.headline.split("\n").map(escapeHtml).join("<br>");
  return `
<div class="preset-card${selected ? " selected" : ""}" data-preset="${p.id}" onclick="pickPreset('${p.id}')">
  <div class="preset-card__preview pv-${p.id}">
    <span class="eyebrow">${escapeHtml(p.eyebrow)}</span>
    <span class="hd">${lines}</span>
    <span class="preset-card__btn">${escapeHtml(p.cta)}</span>
  </div>
  <div class="preset-card__meta">
    <span class="preset-card__name">${escapeHtml(p.name)}<span class="pick">✓ 已选</span></span>
    <span class="preset-card__vibe">${escapeHtml(p.vibe)}</span>
  </div>
</div>`;
}

function renderStep2(cfg: WizardConfig): string {
  const current = cfg.default_design_preset;
  const cards = DESIGN_PRESETS.map(p => presetCard(p, p.id === current)).join("");
  const body = `
<section class="page-h">
  <h1 class="page-h__title">界面风格</h1>
  <span class="page-h__sub">02 / 06</span>
</section>

<div class="step-intro">
  <span class="step-intro__tag">这一步</span>
  <span class="step-intro__text">选一个默认界面风格 —— 之后 Lumi Lab 给你生成的验证页、报告都会用这个调性。<strong>选中即时预览，整个向导会立刻变成那个风格</strong>，后面几步也会保持。</span>
</div>

<p class="intro" style="margin-bottom: var(--space-4);">
  下面是 4 套预设的真实迷你预览（字体、配色、按钮都是该风格的样子）。
  点一下就能让整个页面换成那套风格，亲自感受一下再决定。之后每个 venture 还能单独覆盖。
</p>

<div class="presets" id="preset-grid">
  ${cards}
</div>

<p class="intro" style="color: var(--color-mute); font-size: 13px;">
  全部预设都遵守 Lumi Lab Anti-Slop：只用 OKLCH 颜色、不用 Inter/Roboto、不用纯黑纯白、不用紫色渐变。
</p>

<form id="form-preset" onsubmit="return submitStep2(event)">
  <input type="hidden" id="preset-value" value="${escapeAttr(current)}">
  <div class="actions">
    <button type="button" class="ghost" onclick="go('/.setup/1.html')">← 上一步</button>
    <div class="spacer"></div>
    <button type="submit" class="primary">下一步 →</button>
  </div>
</form>
`;
  const script = `
async function pickPreset(id) {
  document.getElementById('preset-value').value = id;
  document.querySelectorAll('#preset-grid .preset-card').forEach(c => {
    c.classList.toggle('selected', c.dataset.preset === id);
  });
  applyTheme(id);
  try { await postJSON('/api/design-preset', { step: 2, default_design_preset: id }); }
  catch (err) { /* persist best-effort; submit will retry */ }
}
async function submitStep2(e) {
  e.preventDefault();
  const preset = document.getElementById('preset-value').value;
  if (!preset) { alert('请先选一套界面风格'); return false; }
  await postJSON('/api/design-preset', { step: 2, default_design_preset: preset });
  go('/.setup/3.html');
  return false;
}
`;
  return page("界面风格", 2, body, script, current);
}

function renderStep3(cfg: WizardConfig): string {
  const id = cfg.identity;
  const body = `
<section class="page-h">
  <h1 class="page-h__title">你是谁</h1>
  <span class="page-h__sub">03 / 06</span>
</section>

<div class="step-intro">
  <span class="step-intro__tag">这一步</span>
  <span class="step-intro__text">留下基本信息 —— Lumi Lab 会据此调整推荐：你在哪、做什么背景、走到哪一步，决定了它默认给你建议哪些平台、用什么口吻。</span>
</div>

<form id="form-identity" onsubmit="return submitStep3(event)">
  <fieldset>
    <legend>个人资料</legend>

    <div class="row">
      <label class="row__label" for="name">称呼</label>
      <div class="row__body">
        <input class="prose" type="text" id="name" name="name" value="${escapeAttr(id.name)}" required autofocus placeholder="车车 / Liu Wei / @handle">
      </div>
    </div>

    <div class="row">
      <label class="row__label" for="locale">所在地</label>
      <div class="row__body">
        <input class="prose" type="text" id="locale" name="locale" value="${escapeAttr(id.locale)}" placeholder="上海 / 柏林 / 远程">
        <span class="row__hint">时区和文化背景会影响默认推荐的平台（比如小红书 vs Reddit）。</span>
      </div>
    </div>

    <div class="row">
      <label class="row__label" for="background">背景</label>
      <div class="row__body">
        <textarea class="prose" id="background" name="background" rows="2" placeholder="前端工程师，做过 2 个 side project，准备全职做自己的产品">${escapeAttr(id.background)}</textarea>
        <span class="row__hint">一两句话即可。后续 skills 会读这段来个性化输出。</span>
      </div>
    </div>

    <div class="row">
      <label class="row__label">当前阶段</label>
      <div class="row__body">
        <div class="seg" id="stage-radios">
          ${stageRadio("idea",    "想法",   id.stage)}
          ${stageRadio("product", "有产品", id.stage)}
          ${stageRadio("users",   "有用户", id.stage)}
          ${stageRadio("revenue", "有收入", id.stage)}
        </div>
      </div>
    </div>
  </fieldset>

  <div class="actions">
    <button type="button" class="ghost" onclick="go('/.setup/2.html')">← 上一步</button>
    <div class="spacer"></div>
    <button type="submit" class="primary">下一步 →</button>
  </div>
</form>
`;
  const script = `
setSeg('stage-radios', 'stage');
async function submitStep3(e) {
  e.preventDefault();
  const form = document.getElementById('form-identity');
  const data = {
    name: form.name.value.trim(),
    locale: form.locale.value.trim(),
    background: form.background.value.trim(),
    stage: (document.querySelector('#stage-radios input:checked') || {}).value || '',
  };
  if (!data.name) { alert('请填写称呼'); return false; }
  await postJSON('/api/save', { step: 3, identity: data });
  go('/.setup/4.html');
  return false;
}
`;
  return page("你是谁", 3, body, script, cfg.default_design_preset);
}

function stageRadio(value: string, label: string, current: string): string {
  const active = value === current ? " active" : "";
  const checked = value === current ? "checked" : "";
  return `<label class="${active.trim()}"><input type="radio" name="stage" value="${value}" ${checked}>${label}</label>`;
}

function renderStep4(cfg: WizardConfig): string {
  const p = cfg.prefs;
  const body = `
<section class="page-h">
  <h1 class="page-h__title">偏好设置</h1>
  <span class="page-h__sub">04 / 06</span>
</section>

<div class="step-intro">
  <span class="step-intro__tag">这一步</span>
  <span class="step-intro__text">定一下 Lumi Lab 写东西的默认调性 —— 语言、文风、以及对「AI 味」的容忍度。这决定了它给你的报告和验证页文案读起来像不像人话。</span>
</div>

<form id="form-prefs" onsubmit="return submitStep4(event)">
  <fieldset>
    <legend>写作</legend>

    <div class="row">
      <label class="row__label">语言</label>
      <div class="row__body">
        <div class="seg" id="lang-radios">
          ${prefRadio("language", "zh-CN",     "中文",     p.language)}
          ${prefRadio("language", "en",        "English",  p.language)}
          ${prefRadio("language", "zh-en-mix", "中英混排", p.language)}
        </div>
        <span class="row__hint">skills 的默认输出语言。具体对话里可以再覆盖。</span>
      </div>
    </div>

    <div class="row">
      <label class="row__label">文风</label>
      <div class="row__body">
        <div class="seg" id="style-radios">
          ${prefRadio("writing_style", "formal",   "正式",   p.writing_style)}
          ${prefRadio("writing_style", "friendly", "亲切",   p.writing_style)}
          ${prefRadio("writing_style", "custom",   "自定义", p.writing_style)}
        </div>
      </div>
    </div>

    <div class="row">
      <label class="row__label" for="ai_tolerance">AI 味容忍度</label>
      <div class="row__body">
        <div class="slider">
          <input type="range" id="ai_tolerance" name="ai_tolerance" min="0" max="10" step="1" value="${p.ai_tolerance}" oninput="document.getElementById('ai-v').textContent = this.value + ' / 10'">
          <span class="v" id="ai-v">${p.ai_tolerance} / 10</span>
        </div>
        <div class="slider-scale">
          <span>0 · 拒绝 AI 味</span>
          <span>5 · 平衡</span>
          <span>10 · 不管</span>
        </div>
        <span class="row__hint">0 = 强力改写常见 AI 套话（比如 "Get Started"、滥用破折号）。10 = 完全不干预。</span>
      </div>
    </div>
  </fieldset>

  <div class="actions">
    <button type="button" class="ghost" onclick="go('/.setup/3.html')">← 上一步</button>
    <div class="spacer"></div>
    <button type="submit" class="primary">下一步 →</button>
  </div>
</form>
`;
  const script = `
setSeg('lang-radios', 'language');
setSeg('style-radios', 'writing_style');
async function submitStep4(e) {
  e.preventDefault();
  const data = {
    language: (document.querySelector('#lang-radios input:checked') || {}).value || 'zh-CN',
    writing_style: (document.querySelector('#style-radios input:checked') || {}).value || 'friendly',
    ai_tolerance: parseInt(document.getElementById('ai_tolerance').value || '4', 10),
  };
  await postJSON('/api/save', { step: 4, prefs: data });
  go('/.setup/5.html');
  return false;
}
`;
  return page("偏好设置", 4, body, script, cfg.default_design_preset);
}

function prefRadio(name: string, value: string, label: string, current: string): string {
  const active = value === current ? " active" : "";
  const checked = value === current ? "checked" : "";
  return `<label class="${active.trim()}"><input type="radio" name="${name}" value="${value}" ${checked}>${label}</label>`;
}

type TokenFieldOpts = {
  provider: string;
  label: string;
  hint?: string;
  verified: boolean;
  verifiable: boolean;     // shows the Verify button
  extraStatus?: string;
  quickstart?: string;     // HTML body of the <details><div>…</div></details>
};

function tokenField(o: TokenFieldOpts): string {
  const statusInitial = o.verified
    ? `<div id="status-${o.provider}" class="status show ok">✓ 已保存${o.extraStatus ? "  ·  " + escapeHtml(o.extraStatus) : ""}</div>`
    : `<div id="status-${o.provider}" class="status"></div>`;
  const placeholder = o.verified ? "已保存——粘贴新值可覆盖" : `粘贴 ${o.label}…`;
  const button = o.verifiable
    ? `<button type="button" onclick="verifyKey('${o.provider}')">验证</button>`
    : "";
  const inputCell = o.verifiable
    ? `<div class="token-row"><input type="password" id="input-${o.provider}" autocomplete="off" placeholder="${placeholder}">${button}</div>`
    : `<input type="password" id="input-${o.provider}" autocomplete="off" placeholder="${placeholder}">`;
  const qs = o.quickstart ? `<details class="qs"><summary>快速上手 →</summary><div>${o.quickstart}</div></details>` : "";
  return `
<div class="row">
  <label class="row__label" for="input-${o.provider}">${o.label}<span class="req">可选</span></label>
  <div class="row__body">
    ${inputCell}
    ${statusInitial}
    ${o.hint ? `<span class="row__hint">${o.hint}</span>` : ""}
    ${qs}
  </div>
</div>`;
}

function renderStep5(cfg: WizardConfig): string {
  const a = cfg.api;
  const body = `
<section class="page-h">
  <h1 class="page-h__title">工具集成</h1>
  <span class="page-h__sub">05 / 06 · 全部可选</span>
</section>

<div class="step-intro">
  <span class="step-intro__tag">这一步</span>
  <span class="step-intro__text"><strong>（可选）接入工具 token</strong> —— 接了就能用真实数据（真实搜索、真实部署链接），不接就用 mock / 宿主 LLM 的知识兜底，不影响核心流程。任何一项都能跳过。</span>
</div>

<p class="intro" style="margin-bottom: var(--space-4);">
  Lumi Lab 不需要 LLM 密钥——你的 AI 宿主（Claude Code / OpenClaw 等）会自带 LLM。
  这里的 token 用来解锁<strong>部署</strong>、<strong>调研</strong>，以及 Pro 档的<strong>发布</strong>。
</p>

<form id="form-keys" onsubmit="return false">

  <fieldset>
    <legend>部署</legend>
    ${tokenField({
      provider: "cloudflare",
      label: "Cloudflare API Token",
      verified: a.has_cloudflare,
      verifiable: true,
      extraStatus: a.cloudflare_account,
      hint: "用于把作品 <code>lumilab deploy</code> 到 Cloudflare Pages。",
      quickstart: `
        <ol>
          <li>打开 <a href="https://dash.cloudflare.com/profile/api-tokens" target="_blank">dash.cloudflare.com / Profile / API Tokens</a></li>
          <li>Create Token → Custom Token</li>
          <li>权限：<code>Account · Cloudflare Pages · Edit</code> 和 <code>Account · Account Settings · Read</code></li>
          <li>Create → 复制 token → 粘贴到这里 → 点验证</li>
        </ol>`,
    })}
  </fieldset>

  <fieldset>
    <legend>调研</legend>
    ${tokenField({
      provider: "tavily",
      label: "Tavily key",
      verified: a.has_tavily,
      verifiable: true,
      hint: "调研 skills 的深度网页搜索。",
      quickstart: `<ol><li>到 <a href="https://app.tavily.com" target="_blank">app.tavily.com</a> 注册</li><li>Dashboard → API Keys → Create Key（tvly- 开头）</li><li>粘贴 → 验证</li></ol>`,
    })}
    ${tokenField({
      provider: "tikhub",
      label: "TikHub key",
      verified: a.has_tikhub,
      verifiable: true,
      hint: "免登录抓取小红书 / 抖音 / B 站的兜底 API。",
      quickstart: `<ol><li>到 <a href="https://tikhub.io/" target="_blank">tikhub.io</a> 注册</li><li>Console → API Key</li><li>粘贴到这里</li></ol>`,
    })}
    ${tokenField({
      provider: "dataforseo_login",
      label: "DataForSEO · API login（邮箱）",
      verified: a.has_dataforseo,
      verifiable: false,
      hint: "关键词调研默认数据源（搜索量 / KD / 红蓝海）。这里填 dashboard 的 API Access / API Dashboard 面板里显示的 “API login”——是一个邮箱。",
      quickstart: `<ol><li>到 <a href="https://dataforseo.com/" target="_blank">dataforseo.com</a> 注册</li><li>充值 $50（PAYG，余额不过期）</li><li>打开 dashboard 的 <strong>API Access / API Dashboard</strong> 面板</li><li>那里有一组 “API CREDENTIALS”：<strong>API login</strong>（一个邮箱）和 <strong>API password</strong>（一串单独生成的密码）</li><li>把这两个值分别填到下面两栏</li></ol>`,
    })}
    ${tokenField({
      provider: "dataforseo_password",
      label: "DataForSEO · API password（独立生成的，非账户登录密码）",
      verified: a.has_dataforseo,
      verifiable: false,
      hint: "同一个 API Access / API Dashboard 面板里的 “API password”——是系统生成的一串密码，<strong>不是</strong>你登录 DataForSEO 账户用的密码。",
    })}
    ${tokenField({
      provider: "keywordseverywhere",
      label: "Keywords Everywhere key",
      verified: a.has_keywordseverywhere,
      verifiable: true,
      hint: "可选的关键词调研数据源。已订阅 KE 插件的用户可共用 credit 池。",
      quickstart: `<ol><li>装 <a href="https://keywordseverywhere.com/" target="_blank">Keywords Everywhere</a> 浏览器插件</li><li>Account → API Access 取 key</li><li>粘贴 → 验证</li></ol>`,
    })}
  </fieldset>

  <details class="pro">
    <summary>Pro 档 · 支付 / 邮件 / 发布</summary>
    <div style="margin-top: var(--space-3);">

      <fieldset>
        <legend>支付 &amp; 邮件</legend>
        ${tokenField({
          provider: "stripe",
          label: "Stripe Secret Key",
          verified: a.has_stripe,
          verifiable: true,
          extraStatus: a.stripe_account,
          hint: "迭代阶段先用测试密钥（<code>sk_test_…</code>）。",
          quickstart: `<ol><li>打开 <a href="https://dashboard.stripe.com/test/apikeys" target="_blank">dashboard.stripe.com / test / apikeys</a></li><li>Reveal Secret key → 复制 <code>sk_test_…</code></li><li>粘贴 → 验证</li></ol>`,
        })}
        ${tokenField({
          provider: "resend",
          label: "Resend API Key",
          verified: a.has_resend,
          verifiable: true,
          extraStatus: a.resend_domain_count !== undefined ? `${a.resend_domain_count} 个域名` : "",
          hint: "用户激活 / 事务性邮件。",
          quickstart: `<ol><li>打开 <a href="https://resend.com/api-keys" target="_blank">resend.com / api-keys</a></li><li>Create API Key</li><li>粘贴 → 验证</li></ol>`,
        })}
      </fieldset>

      <fieldset>
        <legend>微信公众号</legend>
        ${tokenField({
          provider: "wechat_appid",
          label: "公众号 AppID",
          verified: a.has_wechat,
          verifiable: false,
          hint: "来自 mp.weixin.qq.com · 开发 · 基本配置。",
        })}
        ${tokenField({
          provider: "wechat_secret",
          label: "公众号 AppSecret",
          verified: a.has_wechat,
          verifiable: false,
        })}
      </fieldset>

      <fieldset>
        <legend>X（Twitter）</legend>
        ${tokenField({
          provider: "x_key",
          label: "X API Key",
          verified: a.has_x,
          verifiable: false,
          hint: "去 <a href='https://developer.twitter.com/en/portal/dashboard' target='_blank'>developer.twitter.com</a> 获取。",
        })}
        ${tokenField({
          provider: "x_secret",
          label: "X API Secret",
          verified: a.has_x,
          verifiable: false,
        })}
      </fieldset>

    </div>
  </details>

  <div class="actions">
    <button type="button" class="ghost" onclick="go('/.setup/4.html')">← 上一步</button>
    <div class="spacer"></div>
    <button type="button" class="ghost" onclick="skipAll()">全部跳过</button>
    <button type="button" class="primary" onclick="finishStep5()">下一步 →</button>
  </div>
</form>
`;
  const script = `
async function verifyKey(provider) {
  const input = document.getElementById('input-' + provider);
  const status = document.getElementById('status-' + provider);
  const token = (input.value || '').trim();
  status.classList.remove('ok','err','pending');
  status.classList.add('show');
  if (!token) {
    status.textContent = 'E_EMPTY · 请先粘贴 token';
    status.classList.add('err');
    return;
  }
  status.textContent = '验证中…';
  status.classList.add('pending');
  try {
    const res = await postJSON('/api/verify', { provider, token });
    status.classList.remove('pending','err','ok');
    if (res.ok) {
      let txt = '✓ 验证通过';
      if (res.account) txt += '  ·  ' + res.account;
      else if (res.meta) txt += '  ·  ' + res.meta;
      status.textContent = txt;
      status.classList.add('ok');
      input.dataset.verified = '1';
    } else {
      status.textContent = (res.code || 'E_FAIL') + ' · ' + (res.error || '验证失败');
      status.classList.add('err');
      input.dataset.verified = '';
    }
  } catch (err) {
    status.classList.remove('pending');
    status.classList.add('err');
    status.textContent = 'E_LOCAL · ' + err.message;
  }
}

async function finishStep5() {
  const verifiable = ['cloudflare','tavily','tikhub','keywordseverywhere','stripe','resend'];
  const plain      = ['dataforseo_login','dataforseo_password','wechat_appid','wechat_secret','x_key','x_secret'];
  const keys = {};
  for (const p of verifiable) {
    const inp = document.getElementById('input-' + p);
    if (inp && inp.dataset.verified === '1' && inp.value.trim()) {
      keys[p] = inp.value.trim();
    }
  }
  for (const p of plain) {
    const inp = document.getElementById('input-' + p);
    if (inp && inp.value.trim()) {
      keys[p] = inp.value.trim();
    }
  }
  await postJSON('/api/save-keys', { keys });
  go('/.setup/6.html');
}

async function skipAll() {
  await postJSON('/api/save', { step: 5 });
  go('/.setup/6.html');
}
`;
  return page("工具集成", 5, body, script, cfg.default_design_preset);
}

function renderStep6(cfg: WizardConfig): string {
  const d = cfg.deploy;
  const id = cfg.identity;
  const a = cfg.api;
  const presetLabel = cfg.default_design_preset || "（未选）";
  // 每个工具一行 ✓/— ，让用户在总览里看到完整配置状态（配了什么、没配什么）
  const toolList: [string, boolean, string][] = [
    ["Cloudflare", a.has_cloudflare, a.cloudflare_account ? a.cloudflare_account : "部署验证页"],
    ["Tavily", a.has_tavily, "Web 深度搜索"],
    ["TikHub", a.has_tikhub, "小红书 / 抖音抓取"],
    ["DataForSEO", a.has_dataforseo, "关键词调研（默认源）"],
    ["Keywords Everywhere", a.has_keywordseverywhere, "关键词调研（可选源）"],
    ["Stripe", a.has_stripe, "支付（Pro）"],
    ["Resend", a.has_resend, "邮件（Pro）"],
    ["微信公众号", a.has_wechat, "发布（Pro）"],
    ["X / Twitter", a.has_x, "发布（Pro）"],
  ];
  const configuredCount = toolList.filter(([, on]) => on).length;
  const toolRows = toolList
    .map(([name, on, note]) =>
      `<div class="tool-stat ${on ? "is-on" : "is-off"}">
        <span class="tool-stat__mark">${on ? "✓" : "—"}</span>
        <span class="tool-stat__name">${escapeHtml(name)}</span>
        <span class="tool-stat__note">${escapeHtml(note)}</span>
      </div>`,
    )
    .join("");

  const body = `
<section class="page-h">
  <h1 class="page-h__title">部署偏好 · 怎么开始</h1>
  <span class="page-h__sub">06 / 06</span>
</section>

<div class="step-intro">
  <span class="step-intro__tag">这一步</span>
  <span class="step-intro__text">最后一步 —— 设好验证页上线时的默认值（密码、可见性），核对一遍总览，然后就能跑你的第一个 idea 了。</span>
</div>

<p class="intro" style="margin-bottom: var(--space-4);">
  Lumi 部署验证页时，会把这些默认值预填进去。
  每次 <code>lumilab deploy</code> 时还可以覆盖。
</p>

<form id="form-deploy" onsubmit="return submitStep6(event)">
  <fieldset>
    <legend>分享默认值</legend>

    <div class="row">
      <label class="row__label" for="default_password">默认分享密码</label>
      <div class="row__body">
        <input type="text" id="default_password" name="default_password" value="${escapeAttr(d.default_password)}" pattern="[a-zA-Z0-9]{4,32}" required>
        <span class="row__hint">4–32 位字母或数字。默认是 6 位数字（方便口述）。</span>
      </div>
    </div>

    <div class="row">
      <label class="row__label">复用</label>
      <div class="row__body">
        <label class="check"><input type="checkbox" id="reuse_password" name="reuse_password" ${d.reuse_password ? "checked" : ""}>每次 <code style="font-family: var(--font-mono);">lumilab deploy</code> 都预填这个密码</label>
      </div>
    </div>

    <div class="row">
      <label class="row__label">默认可见性</label>
      <div class="row__body">
        <div class="seg" id="vis-radios">
          ${prefRadio("default_visibility", "private", "仅密码可见", d.default_visibility)}
          ${prefRadio("default_visibility", "public",  "公开",       d.default_visibility)}
        </div>
        <span class="row__hint">仅密码可见 = 需要密码访问 · 公开 = 适合 landing page。</span>
      </div>
    </div>
  </fieldset>

  <fieldset>
    <legend>总览</legend>
    <dl class="summary">
      <div class="summary__row"><dt>称呼</dt><dd>${escapeHtml(id.name || "—")}</dd></div>
      <div class="summary__row"><dt>所在地</dt><dd>${escapeHtml(id.locale || "—")}</dd></div>
      <div class="summary__row"><dt>阶段</dt><dd>${escapeHtml(id.stage || "—")}</dd></div>
      <div class="summary__row"><dt>语言</dt><dd>${escapeHtml(cfg.prefs.language)} · ${escapeHtml(cfg.prefs.writing_style)}</dd></div>
      <div class="summary__row"><dt>界面风格</dt><dd>${escapeHtml(presetLabel)}</dd></div>
      <div class="summary__row"><dt>配置路径</dt><dd>~/.lumilab/config.json</dd></div>
      <div class="summary__row"><dt>密钥路径</dt><dd>~/.lumilab/secrets.json (600)</dd></div>
    </dl>

    <div class="tool-overview">
      <div class="tool-overview__h">工具集成 · 已配 ${configuredCount} / ${toolList.length}</div>
      <div class="tool-stats">${toolRows}</div>
      <p class="tool-overview__note">未配的不影响核心流程 —— 对应能力会用 mock 数据 / 宿主 LLM 知识兜底。随时重跑 <code>lumilab config</code> 补上。</p>
    </div>

    <p class="autosave-note">
      ✓ 以上每一步在你点「下一步」时就<strong>已经自动保存</strong>到 <code>~/.lumilab/config.json</code> 了 ——
      <strong>不需要你回去告诉 AI「配好了」</strong>。点下面「保存并完成」后，向导会把一份配置摘要打印到终端，你的 AI 宿主能直接看到。
    </p>
  </fieldset>

  <div class="kickoff">
    <div class="kickoff__h">完成 · 怎么开始</div>
    <p class="kickoff__note" style="margin-bottom: var(--space-2);">
      点「保存并完成」后向导自动关闭。回到终端，把你的想法填进这一句就能开跑：
    </p>
    <div class="kickoff__cmd">lumilab idea "你的一句话想法"</div>
    <p class="kickoff__note" style="margin-bottom: var(--space-3);">
      或者在你的 AI 宿主里直接说一句：<strong>用 lumilab-idea-to-landing 帮我跑这个 idea</strong>。
    </p>
    <p class="kickoff__note">
      接下来它会<strong>自动跑分析 → 给你方向建议 → 出一个 fake-door 验证页</strong>（默认用你选的「${escapeHtml(presetLabel)}」风格），
      你只需要在中间选一次方向。中间产物都会主动推 HTML 给你看，不用自己翻目录。
    </p>
  </div>

  <div class="actions">
    <button type="button" class="ghost" onclick="go('/.setup/5.html')">← 上一步</button>
    <div class="spacer"></div>
    <button type="submit" class="primary">保存并完成</button>
  </div>
</form>
`;
  const script = `
setSeg('vis-radios', 'default_visibility');
async function submitStep6(e) {
  e.preventDefault();
  const data = {
    default_password: document.getElementById('default_password').value.trim(),
    reuse_password: document.getElementById('reuse_password').checked,
    default_visibility: (document.querySelector('#vis-radios input:checked') || {}).value || 'public',
  };
  await postJSON('/api/save', { step: 6, deploy: data });
  await postJSON('/api/done', {});
  go('/.setup/done.html');
  return false;
}
`;
  return page("部署偏好", 6, body, script, cfg.default_design_preset);
}

function renderDone(cfg: WizardConfig): string {
  const body = `
<section class="page-h">
  <h1 class="page-h__title">配置完成</h1>
  <span class="page-h__sub">已关闭</span>
</section>

<p class="intro">
  配置已写入。可以关闭这个标签页。回到终端，运行
  <code>lumilab idea "你的一句话想法"</code> 开始第一个 venture，或者随时重跑这个向导修改。
</p>

<dl class="summary">
  <div class="summary__row"><dt>身份</dt><dd>${escapeHtml(cfg.identity.name || "anonymous")}</dd></div>
  <div class="summary__row"><dt>语言</dt><dd>${escapeHtml(cfg.prefs.language)} · ${escapeHtml(cfg.prefs.writing_style)}</dd></div>
  <div class="summary__row"><dt>界面风格</dt><dd>${escapeHtml(cfg.default_design_preset || "—")}</dd></div>
  <div class="summary__row"><dt>cloudflare</dt><dd>${cfg.api.has_cloudflare ? (cfg.api.cloudflare_account || "已验证") : "—"}</dd></div>
  <div class="summary__row"><dt>配置</dt><dd>~/.lumilab/config.json</dd></div>
  <div class="summary__row"><dt>密钥</dt><dd>~/.lumilab/secrets.json（权限 600）</dd></div>
</dl>

<div class="actions">
  <div class="spacer"></div>
  <button class="ghost" onclick="window.close()">关闭窗口</button>
</div>
`;
  return page("完成", 6, body, "", cfg.default_design_preset);
}

// ─────────────  server  ─────────────

function openBrowser(url: string) {
  const cmd = platform() === "darwin" ? "open" : platform() === "win32" ? "start" : "xdg-open";
  try {
    spawn(cmd, [url], { stdio: "ignore", detached: true }).unref();
  } catch (e) {
    console.warn(`[wizard] could not auto-open browser: ${(e as Error).message}`);
  }
}

async function startServer() {
  const PORTS = [7777, 7778, 7779, 7780];
  let server: ReturnType<typeof Bun.serve> | null = null;
  let chosenPort = 0;

  for (const port of PORTS) {
    try {
      server = Bun.serve({
        port,
        hostname: "127.0.0.1",
        development: false,
        fetch: handleRequest,
        error(err) {
          console.error("[wizard] server error:", err);
          return new Response("internal error", { status: 500 });
        },
      });
      chosenPort = port;
      break;
    } catch {
      // try next port
    }
  }

  if (!server) {
    console.error("[wizard] could not bind to any port in 7777–7780. Is another wizard already running?");
    process.exit(1);
  }

  const url = `http://localhost:${chosenPort}/`;
  console.log(`\n  ✓ Lumi Lab Setup Wizard\n    serving at  ${url}\n    opening browser …\n    (Ctrl-C to abort)\n`);
  openBrowser(url);

  process.on("SIGINT", () => {
    console.log("\n  ✓ wizard interrupted; partial state saved to ~/.lumilab/config.json");
    server?.stop();
    process.exit(0);
  });
}

async function handleRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;
  const cfg = loadConfig();

  if (path === "/" || path === "/.setup/") {
    // 没引导完 → 永远从第 1 步开始（首次引导体验）；
    // 已引导完（用户回来改配置）→ 跳到上次停留的步骤。
    const next = cfg.onboarded ? Math.min(Math.max(cfg.step, 1), 6) : 1;
    return Response.redirect(`/.setup/${next}.html`, 302);
  }

  if (path === "/.setup/1.html")    return html(renderStep1(cfg));
  if (path === "/.setup/2.html")    return html(renderStep2(cfg));
  if (path === "/.setup/3.html")    return html(renderStep3(cfg));
  if (path === "/.setup/4.html")    return html(renderStep4(cfg));
  if (path === "/.setup/5.html")    return html(renderStep5(cfg));
  if (path === "/.setup/6.html")    return html(renderStep6(cfg));
  if (path === "/.setup/done.html") return html(renderDone(cfg));

  if (path === "/api/verify"        && req.method === "POST") return apiVerify(req);
  if (path === "/api/save"          && req.method === "POST") return apiSave(req);
  if (path === "/api/design-preset" && req.method === "POST") return apiDesignPreset(req);
  if (path === "/api/save-keys"     && req.method === "POST") return apiSaveKeys(req);
  if (path === "/api/done"          && req.method === "POST") return apiDone();
  if (path === "/api/quit") {
    setTimeout(() => process.exit(0), 200);
    return new Response("正在关闭…");
  }

  return new Response("not found", { status: 404 });
}

function html(s: string): Response {
  return new Response(s, { headers: { "content-type": "text/html; charset=utf-8" } });
}

async function apiVerify(req: Request): Promise<Response> {
  let body: { provider?: string; token?: string };
  try { body = await req.json(); }
  catch { return json({ ok: false, code: "E_BADJSON", error: "invalid request body" }, 400); }

  const provider = String(body.provider || "");
  const token    = String(body.token || "");
  if (!provider) return json({ ok: false, code: "E_NOPROV", error: "provider missing" }, 400);

  const result = await verifyToken(provider, token);
  return json(result);
}

async function apiSave(req: Request): Promise<Response> {
  let body: Partial<WizardConfig> & { step?: number };
  try { body = await req.json(); }
  catch { return json({ ok: false, error: "invalid json" }, 400); }

  const cfg = loadConfig();
  if (body.identity) cfg.identity = { ...cfg.identity, ...body.identity };
  if (body.prefs)    cfg.prefs    = { ...cfg.prefs,    ...body.prefs };
  if (body.deploy)   cfg.deploy   = { ...cfg.deploy,   ...body.deploy };
  if (typeof body.step === "number") cfg.step = Math.max(cfg.step, body.step);
  saveConfig(cfg);
  return json({ ok: true });
}

async function apiDesignPreset(req: Request): Promise<Response> {
  let body: { step?: number; default_design_preset?: string };
  try { body = await req.json(); }
  catch { return json({ ok: false, error: "invalid json" }, 400); }

  const valid: DesignPreset[] = ["editorial", "minimalist", "brutalist", "soft"];
  const preset = String(body.default_design_preset || "");
  if (!valid.includes(preset as DesignPreset)) {
    return json({ ok: false, code: "E_PRESET", error: `未知风格：${preset}。可选：${valid.join(" / ")}` }, 400);
  }

  const cfg = loadConfig();
  cfg.default_design_preset = preset as DesignPreset;
  if (typeof body.step === "number") cfg.step = Math.max(cfg.step, body.step);
  saveConfig(cfg);
  return json({ ok: true });
}

async function apiSaveKeys(req: Request): Promise<Response> {
  let body: { keys?: Record<string, string> };
  try { body = await req.json(); }
  catch { return json({ ok: false, error: "invalid json" }, 400); }

  const keys = body.keys || {};
  const cfg = loadConfig();

  // Group wechat / x pairs.
  const wechatAppid  = keys["wechat_appid"];
  const wechatSecret = keys["wechat_secret"];
  const xKey         = keys["x_key"];
  const xSecret      = keys["x_secret"];

  // Verifiable providers — re-verify server-side (defence in depth).
  // secrets.json 里的规范 key 名（和 CHAT_PROVIDERS / 各 skill 读取逻辑对齐）：
  const SECRET_KEY: Record<string, string> = {
    cloudflare: "cloudflare_api_token",
    tavily: "tavily_api_key",
    tikhub: "tikhub_api_key",
    keywordseverywhere: "keywordseverywhere_api_key",
    stripe: "stripe_secret_key",
    resend: "resend_api_key",
  };
  const verifiable = ["cloudflare", "tavily", "tikhub", "keywordseverywhere", "stripe", "resend"];
  for (const provider of verifiable) {
    const token = keys[provider];
    if (!token) continue;
    const r = await verifyToken(provider, token);
    if (!r.ok) continue;
    saveSecret(SECRET_KEY[provider] ?? `${provider}_token`, token);
    const flagKey = `has_${provider}` as keyof ApiKeys;
    (cfg.api as Record<string, unknown>)[flagKey] = true;
    if (provider === "cloudflare" && r.account) cfg.api.cloudflare_account = r.account;
    if (provider === "stripe" && r.account)     cfg.api.stripe_account     = r.account;
    if (provider === "resend" && r.meta) {
      const m = r.meta.match(/(\d+)/);
      if (m) cfg.api.resend_domain_count = parseInt(m[1], 10);
    }
  }

  // DataForSEO (paired login + password, no live verify in wizard — verified on first use).
  const dfsLogin    = keys["dataforseo_login"];
  const dfsPassword = keys["dataforseo_password"];
  if (dfsLogin && dfsPassword) {
    saveSecret("dataforseo_login", dfsLogin);
    saveSecret("dataforseo_password", dfsPassword);
    cfg.api.has_dataforseo = true;
  }

  // WeChat (paired, no verify in P0).
  if (wechatAppid && wechatSecret) {
    saveSecret("wechat_appid", wechatAppid);
    saveSecret("wechat_secret", wechatSecret);
    cfg.api.has_wechat = true;
  }
  // X (paired, no verify in P0).
  if (xKey && xSecret) {
    saveSecret("x_key", xKey);
    saveSecret("x_secret", xSecret);
    cfg.api.has_x = true;
  }

  cfg.step = Math.max(cfg.step, 5);
  saveConfig(cfg);
  return json({ ok: true });
}

async function apiDone(): Promise<Response> {
  const cfg = loadConfig();
  cfg.step = 6;
  cfg.completed_at = new Date().toISOString();
  cfg.onboarded = true;
  cfg.onboarded_at = new Date().toISOString();
  saveConfig(cfg);
  // 写时更新：配置变了 → 顺手 re-render home dashboard（best-effort，失败不影响）。
  try {
    const homeScript = join(import.meta.dir, "..", "..", "lumilab-home", "scripts", "home.ts");
    if (existsSync(homeScript)) {
      Bun.spawnSync(["bun", "run", homeScript, "render"], { stdout: "ignore", stderr: "ignore" });
    }
  } catch { /* best-effort */ }
  setTimeout(() => {
    // 打印结构化配置摘要到 stdout —— `lumilab config` 是阻塞调用，
    // stdio:inherit，所以宿主 agent 退出时能直接看到「配了什么」，
    // 不需要用户回去手动告诉 AI。
    const a = cfg.api;
    const tools = [
      ["Cloudflare", a.has_cloudflare], ["Tavily", a.has_tavily], ["TikHub", a.has_tikhub],
      ["DataForSEO", a.has_dataforseo], ["Keywords Everywhere", a.has_keywordseverywhere],
      ["Stripe", a.has_stripe], ["Resend", a.has_resend],
      ["微信公众号", a.has_wechat], ["X", a.has_x],
    ] as [string, boolean][];
    const on = tools.filter(([, v]) => v).map(([n]) => n);
    const off = tools.filter(([, v]) => !v).map(([n]) => n);
    console.log("\n──────────────────────────────────────────────");
    console.log("  ✓ Lumi Lab 首次引导完成 · 配置已自动保存");
    console.log("──────────────────────────────────────────────");
    console.log(`  界面风格 : ${cfg.default_design_preset || "（未选）"}`);
    console.log(`  称呼     : ${cfg.identity.name || "—"}`);
    console.log(`  语言风格 : ${cfg.prefs.language} · ${cfg.prefs.writing_style}`);
    console.log(`  已配工具 : ${on.length ? on.join("、") : "（无 · 仅基础 skills）"}`);
    console.log(`  未配工具 : ${off.length ? off.join("、") : "（全部已配）"}`);
    console.log(`  配置文件 : ~/.lumilab/config.json`);
    console.log(`  密钥文件 : ~/.lumilab/secrets.json (mode 600)`);
    console.log("──────────────────────────────────────────────");
    console.log('  下一步：lumilab idea "你的一句话想法"');
    console.log("  或在 AI 宿主里说：用 lumilab-idea-to-landing 帮我跑这个 idea");
    console.log("──────────────────────────────────────────────\n");
    // 机器可读摘要：宿主 agent 可解析，知道用户配了什么、可以接着干什么
    console.log("LUMILAB_ONBOARD_DONE " + JSON.stringify({
      onboarded: true,
      default_design_preset: cfg.default_design_preset || null,
      tools_configured: on,
      tools_unconfigured: off,
      config_path: "~/.lumilab/config.json",
    }));
    process.exit(0);
  }, 1500);
  return json({ ok: true });
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

// ─────────────  chat-mode (LUMILAB_CHANNEL != local)  ─────────────
//
// 飞书 / Telegram / Slack 等 chat 环境没有浏览器。这套 --chat-* 子命令是
// agent-friendly 的：host LLM 在对话里收集 token，然后逐个调 --chat-set。
// 每个命令输出确定性 JSON，便于 agent 解析后回复用户。
//
//   wizard.ts --chat-prompts          列出可配置的 provider + 设置指引
//   wizard.ts --chat-status           当前已配置了什么（不回显 token 值）
//   wizard.ts --chat-set <p> <token>  verify + 写入（优先 keychain）一个 token
//   wizard.ts --chat-set <p> -        token 从 stdin 读（避免出现在进程列表）

type ChatProvider = {
  id: string;
  label: string;
  secretKey: string;       // keychain / secrets.json 里的 key 名
  configFlag: keyof ApiKeys;
  required: boolean;
  setupHint: string;
};

const CHAT_PROVIDERS: ChatProvider[] = [
  { id: "cloudflare", label: "Cloudflare API Token", secretKey: "cloudflare_api_token", configFlag: "has_cloudflare", required: false,
    setupHint: "dash.cloudflare.com → My Profile → API Tokens → Create Token（权限：Account·Cloudflare Pages:Edit + Account Settings:Read）。启用 `lumilab deploy`。" },
  { id: "tavily", label: "Tavily API Key", secretKey: "tavily_api_key", configFlag: "has_tavily", required: false,
    setupHint: "app.tavily.com → Dashboard → API Keys（tvly- 开头）。启用 `lumilab research-web` 真实搜索。" },
  { id: "tikhub", label: "TikHub API Key", secretKey: "tikhub_api_key", configFlag: "has_tikhub", required: false,
    setupHint: "tikhub.io → 注册 → API Key。启用 `lumilab research-xhs` 真实抓取小红书。" },
  { id: "keywordseverywhere", label: "Keywords Everywhere API Key", secretKey: "keywordseverywhere_api_key", configFlag: "has_keywordseverywhere", required: false,
    setupHint: "keywordseverywhere.com → 装插件 → Account → API Access。启用 `lumilab keywords` 关键词调研（KE 数据源）。" },
  { id: "stripe", label: "Stripe Secret Key", secretKey: "stripe_secret_key", configFlag: "has_stripe", required: false,
    setupHint: "dashboard.stripe.com → Developers → API keys → Secret key。Pro tier。" },
  { id: "resend", label: "Resend API Key", secretKey: "resend_api_key", configFlag: "has_resend", required: false,
    setupHint: "resend.com → API Keys。Pro tier，发邮件用。" },
];

// 把一个 token 写进 keychain（优先）或 secrets.json（兜底）。
function persistSecret(secretKey: string, token: string): { backend: string } {
  const keychainScript = join(import.meta.dir, "keychain.ts");
  if (existsSync(keychainScript)) {
    const envKey = secretKey.toUpperCase();
    const r = Bun.spawnSync(["bun", "run", keychainScript, "set", envKey, token], { stdout: "pipe", stderr: "pipe" });
    if (r.exitCode === 0) {
      const backend = (r.stdout?.toString() || "").match(/in (\S+)/)?.[1] || "keychain";
      return { backend };
    }
  }
  // fallback: secrets.json (chmod 600)
  saveSecret(secretKey, token);
  return { backend: "plaintext" };
}

function chatPrompts(): void {
  const out = {
    mode: "chat",
    channel: process.env.LUMILAB_CHANNEL ?? "local",
    intro: "Lumi Lab 不需要 LLM API key（宿主已提供）。以下都是可选的工具 token，按需配置。",
    providers: CHAT_PROVIDERS.map(p => ({ id: p.id, label: p.label, required: p.required, setup: p.setupHint })),
    next: "收集到 token 后，对每个调用：wizard.ts --chat-set <id> <token>",
  };
  console.log(JSON.stringify(out, null, 2));
}

function chatStatus(): void {
  const cfg = loadConfig();
  const out = {
    mode: "chat",
    channel: process.env.LUMILAB_CHANNEL ?? "local",
    configured: CHAT_PROVIDERS.map(p => ({
      id: p.id, label: p.label,
      configured: Boolean(cfg.api[p.configFlag]),
    })),
    note: "不回显 token 值。已配置的 provider 对应的 skill 即可启用真实 API；未配置的走 mock fallback。",
  };
  console.log(JSON.stringify(out, null, 2));
}

async function chatSet(providerId: string, rawToken: string): Promise<void> {
  const provider = CHAT_PROVIDERS.find(p => p.id === providerId);
  if (!provider) {
    console.log(JSON.stringify({ ok: false, code: "E_PROVIDER", error: `未知 provider：${providerId}。可选：${CHAT_PROVIDERS.map(p => p.id).join(" / ")}` }));
    process.exit(2);
  }
  let token = rawToken;
  if (token === "-") token = (await Bun.stdin.text()).trim();
  if (!token) {
    console.log(JSON.stringify({ ok: false, code: "E_EMPTY", error: "token 为空" }));
    process.exit(2);
  }
  // verify against real API
  const result = await verifyToken(provider.id, token);
  if (!result.ok) {
    console.log(JSON.stringify({ ok: false, provider: provider.id, code: result.code ?? "E_VERIFY", error: result.error ?? "验证失败" }));
    process.exit(1);
  }
  // persist
  const { backend } = persistSecret(provider.secretKey, token);
  // update config flag
  const cfg = loadConfig();
  (cfg.api[provider.configFlag] as boolean) = true;
  if (provider.id === "cloudflare" && result.account) cfg.api.cloudflare_account = result.account;
  cfg.step = Math.max(cfg.step, 4);
  saveConfig(cfg);
  console.log(JSON.stringify({
    ok: true, provider: provider.id, backend,
    verified: result.account || result.meta || "API verify 通过",
  }));
}

// --chat-onboard：飞书等 chat 环境的「首次引导」文本版。
// 一次性输出完整引导脚本（产品介绍 + 风格选择 + token 配置指引），
// host LLM 据此和用户走一遍，再用 --chat-set / --chat-onboard-preset / --chat-onboard-done 落地。
function chatOnboard(): void {
  const cfg = loadConfig();
  console.log(JSON.stringify({
    mode: "chat-onboard",
    channel: process.env.LUMILAB_CHANNEL ?? "local",
    already_onboarded: cfg.onboarded === true,
    intro: {
      what: "Lumi Lab 是 C 端创业 idea 的快速验证工具。给一句话 idea，自动跑市场分析、提方向建议、生成能测购买意愿的 fake-door 验证页。",
      flow: "一句话 idea → 自动分析 → HTML 报告 → 选方向 → fake-door 验证页 → 部署验证",
      tips: [
        "默认入口：直接说『用 lumilab-idea-to-landing 帮我跑这个 idea』",
        "全程最多问你 2 次（一次可选补充 + 一次选方向）",
        "中间产物会主动推 HTML 给你看，不静默落盘",
        "不需要 LLM key，宿主已提供",
      ],
    },
    step_design_preset: {
      ask: "选一个默认界面风格（之后生成的验证页用它当基准）：",
      options: [
        { id: "editorial", desc: "编辑杂志感 · 衬线大标题 · 暖纸色" },
        { id: "minimalist", desc: "极简 · 大留白 · 克制" },
        { id: "brutalist", desc: "粗野 · 强对比 · 硬边" },
        { id: "soft", desc: "柔和 · 圆角 · 低饱和" },
      ],
      apply: "用户选定后调：wizard.ts --chat-onboard-preset <id>",
    },
    step_tokens: {
      ask: "可选：配置工具 token（都可跳过，跳过就用 mock / 宿主 LLM 知识）。",
      note: "单 token 的用 wizard.ts --chat-set <provider> <token>（provider 见 --chat-prompts）。DataForSEO 是 login+password 两段，用：lumilab secrets set DATAFORSEO_LOGIN <x> 和 lumilab secrets set DATAFORSEO_PASSWORD <y>。",
    },
    finish: "全部走完后调：wizard.ts --chat-onboard-done（标记 onboarded，不再每次提示）",
  }, null, 2));
}

function chatOnboardPreset(preset: string): void {
  const VALID = ["editorial", "minimalist", "brutalist", "soft"];
  if (!VALID.includes(preset)) {
    console.log(JSON.stringify({ ok: false, code: "E_PRESET", error: `未知风格：${preset}。可选：${VALID.join(" / ")}` }));
    process.exit(2);
  }
  const cfg = loadConfig();
  cfg.default_design_preset = preset as WizardConfig["default_design_preset"];
  saveConfig(cfg);
  console.log(JSON.stringify({ ok: true, default_design_preset: preset }));
}

function chatOnboardDone(): void {
  const cfg = loadConfig();
  cfg.onboarded = true;
  cfg.onboarded_at = new Date().toISOString();
  cfg.step = Math.max(cfg.step, 6);
  saveConfig(cfg);
  console.log(JSON.stringify({ ok: true, onboarded: true, onboarded_at: cfg.onboarded_at }));
}

async function runChatMode(argv: string[]): Promise<boolean> {
  const idx = argv.findIndex(a => a.startsWith("--chat-"));
  if (idx === -1) return false;
  const cmd = argv[idx];
  if (cmd === "--chat-prompts") { chatPrompts(); return true; }
  if (cmd === "--chat-status")  { chatStatus(); return true; }
  if (cmd === "--chat-onboard") { chatOnboard(); return true; }
  if (cmd === "--chat-onboard-preset") {
    const preset = argv[idx + 1];
    if (!preset) {
      console.log(JSON.stringify({ ok: false, code: "E_USAGE", error: "用法：wizard.ts --chat-onboard-preset <editorial|minimalist|brutalist|soft>" }));
      process.exit(2);
    }
    chatOnboardPreset(preset);
    return true;
  }
  if (cmd === "--chat-onboard-done") { chatOnboardDone(); return true; }
  if (cmd === "--chat-set") {
    const provider = argv[idx + 1];
    const token = argv[idx + 2];
    if (!provider || token === undefined) {
      console.log(JSON.stringify({ ok: false, code: "E_USAGE", error: "用法：wizard.ts --chat-set <provider> <token|->" }));
      process.exit(2);
    }
    await chatSet(provider, token);
    return true;
  }
  console.log(JSON.stringify({ ok: false, code: "E_CMD", error: `未知 chat 命令：${cmd}` }));
  process.exit(2);
}

// ─────────────  entry  ─────────────

if (import.meta.main) {
  const argv = process.argv.slice(2);
  const channel = process.env.LUMILAB_CHANNEL ?? "local";
  const hasChatFlag = argv.some(a => a.startsWith("--chat-"));

  if (hasChatFlag) {
    // 显式 --chat-* 命令：直接走 chat 模式（任何环境都能用）
    await runChatMode(argv);
  } else if (channel !== "local") {
    // chat 环境但没给子命令：打印用法，不要尝试开浏览器
    console.log(JSON.stringify({
      mode: "chat",
      channel,
      error: "E_NO_BROWSER",
      message: `当前在 ${channel} 环境，没有浏览器。请用 chat 子命令：`,
      commands: [
        "wizard.ts --chat-onboard           # 首次引导（产品介绍 + 风格选择 + token 指引）",
        "wizard.ts --chat-onboard-preset <id>  # 选默认界面风格",
        "wizard.ts --chat-onboard-done      # 标记引导完成",
        "wizard.ts --chat-prompts           # 列出可配置 token",
        "wizard.ts --chat-status            # 看当前配置",
        "wizard.ts --chat-set <provider> <token>   # 配置一个 token",
      ],
    }, null, 2));
    process.exit(0);
  } else {
    // local：开浏览器 wizard
    await startServer();
  }
}
