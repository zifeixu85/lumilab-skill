---
name: lumilab-config
description: |
  Setup Wizard + Share Manager + Secrets storage for the Lumi Lab skills bundle.

  Browser-based 5-step wizard for first-time setup: user identity / preferences / tool tokens (Cloudflare for deploy, Exa for search, TikHub/Stripe/Resend/WeChat/X as optional integrations) / default deploy password.

  Browser-based Share Manager to view/copy/rotate/delete deployed venture Studios.

  Lumi Lab is a skills bundle that runs INSIDE Claude Code / OpenClaw / Cursor / Codex / Hermes. The host environment provides the LLM, so this wizard never asks for LLM API keys. It only configures tool integrations and user preferences.

  Use when user types /lumilab config, /lumilab manage, or on first /lumilab init.

  关键词：setup wizard / config / 配置 / tool token / cloudflare / exa / share management / 分享管理 / secrets / 密钥管理 / venture 密码
version: 1.0.0-rc1
status: P0-ready
metadata:
  hermes:
    tags: [config, wizard, secrets, keychain, share-manager]
  lumilab:
    tier: utility
    requires_browser: true
    chat_only_ok: true
  category: foundation
  agent: infrastructure
  upstream: []
  outputs:
    - "~/.lumilab/config.json (user prefs + default password)"
    - "~/.lumilab/secrets.json (tool tokens + venture passwords — NEVER LLM keys)"
    - "~/.lumilab/shares.json (deployed venture manifest)"
  reads:
    - "host workspace openclaw.json (config schema, if present)"
license: Apache-2.0
platforms: [macos, linux]
prerequisites:
  env_vars: []
  commands: [bun]
compatibility: "Claude Code, OpenClaw 2026.4.25+, Hermes Agent v0.13.0+, Cursor, Codex"
---

# Config — Setup Wizard + Share Manager + Secrets

## Purpose

Three jobs. **None of them ask for an LLM API key** — Lumi Lab runs inside an existing AI host (Claude Code / OpenClaw / Cursor / Codex / Hermes / Gemini CLI) which already has its own LLM configured.

1. **Setup Wizard** — first-time browser-based onboarding for user preferences and **tool-integration tokens** (deploy / search / publish / payment)
2. **Share Manager** — browser-based dashboard for deployed venture Studios
3. **Secrets abstraction** — local-only storage of tool tokens and venture passwords

## When to trigger

- User runs `lumilab config` → Setup Wizard (first time OR to edit later)
- User runs `lumilab manage` → Share Manager
- Any Skill needs a tool token (e.g. `lumilab deploy` reads Cloudflare token) → silently decrypt & read, no UI

## Setup Wizard — 5 steps

```
Step 1/5  Welcome — explain Lumi Lab is a skills bundle running inside your AI host
Step 2/5  Identity — name, location, background, current venture stage
Step 3/5  Preferences — language, writing style, AI-trace tolerance
Step 4/5  Tool integrations (all optional, pick what you need)
          ── Deploy ──
            ☐ Cloudflare API Token (enables `lumilab deploy`)
          ── Research ──
            ☐ Exa.ai (Web deep search)
            ☐ TikHub (Xiaohongshu API, no-login)
          ── Pro tier ──
            ☐ Stripe / Resend / WeChat MP / X (Twitter)
Step 5/5  Deploy preferences
          Default share password (6-digit numeric): [______]   ← "house password"
          ☑ Pre-fill this password on every /lumilab deploy
          ○ Default private  ○ Default public
```

**Never asks for an LLM API key.** That belongs to the host AI environment.

## Tool token modal (text-only guidance)

When the user clicks `[Setup →]` next to Cloudflare:

```
┌──────────────────────────────────────────────────────┐
│  Cloudflare API Token — enables `lumilab deploy`      │
├──────────────────────────────────────────────────────┤
│                                                        │
│  Step 1: sign in to Cloudflare                        │
│  → open https://dash.cloudflare.com                   │
│                                                        │
│  Step 2: go to My Profile → API Tokens                │
│  → open https://dash.cloudflare.com/profile/api-tokens│
│                                                        │
│  Step 3: Create Token → Custom Token                  │
│  Permissions:                                          │
│  • Account · Cloudflare Pages: Edit                   │
│  • Account · Account Settings: Read                   │
│                                                        │
│  Step 4: paste here + Verify                          │
│  [_________________]  [Verify]                        │
│                                                        │
│  ✓ verified — account: your-email@x.com               │
│                                                        │
│  [Save]                                                │
└──────────────────────────────────────────────────────┘
```

Same pattern for Exa / TikHub / Stripe / Resend / WeChat / X. Each card has a 4-step quickstart and a Verify button that hits the real API.

## Share Manager

`lumilab manage` opens a browser dashboard listing every deployed venture Studio. Per-row actions: copy URL, reveal/copy password, show QR, rotate password (re-encrypt + redeploy), toggle public/private, delete (wrangler delete + archive in `shares.json`).

## Secrets abstraction

By platform priority. **Only tool tokens and venture passwords. Never LLM keys.**

```
priority 1: macOS Keychain         (`security` CLI)
priority 2: Linux Secret Service   (`secret-tool`)
priority 3: Windows Credential Manager
fallback:   ~/.lumilab/secrets.json with chmod 600  (P0; P1 = AES-GCM with master key in keychain)
```

Schema:

```json
{
  "cloudflare_api_token": "...",
  "exa_api_key": "...",
  "tikhub_api_key": "...",
  "stripe_secret_key": "...",
  "resend_api_key": "...",
  "wechat_mp_appid": "...", "wechat_mp_secret": "...",
  "x_api_key": "...", "x_api_secret": "...",
  "venture_passwords": {
    "venture-slug-1": "728345",
    "venture-slug-2": "991122"
  }
}
```

**There is no `anthropic_api_key` / `openai_api_key` / `dashscope_api_key` field.** That's the host's concern.

## Real-time token verification

| Tool | Verify endpoint | Success returns |
|---|---|---|
| Cloudflare | `GET /accounts` | account info |
| Exa | `POST /search` (minimal) | 200 OK |
| TikHub | API-specific | quota info |
| Stripe | `GET /v1/account` | account name |
| Resend | `GET /domains` | 200 OK |

Failures return specific codes: `E_401 token invalid`, `E_403 missing scope`, `E_429 rate limit`. Never "Something went wrong."

## Files

```
skills/lumilab-config/scripts/
├── wizard.ts          ← /lumilab config → 5-step Wizard
├── manage.ts          ← /lumilab manage → Share Manager
└── secrets.ts         ← cross-platform keychain / secret-service / cred-manager
```

## Cross-runtime user-input protocol

```yaml
user_input:
  - mode: browser
    method: "localhost:7777/.setup/*.html POST (Wizard)"
    method: "localhost:7777/ (Manager)"
  - mode: terminal (fallback)
    method: "stdin if browser unavailable"
```

## Hard constraints

```
✓ Never ask for an LLM API key (host's job)
✓ Verify must hit a real API (no fake success)
✓ Tokens write to ~/.lumilab/secrets.json with mode 0o600
✓ Each step is independently editable (no forced linear flow)
✓ Revealing a password requires explicit click (prevents shoulder-surfing)
✓ Delete-deployment requires double confirmation
✓ HTTP server binds 127.0.0.1 only (never 0.0.0.0)
```

## Anti-Slop

❌ "Welcome! Let's get started on your journey!"
❌ ✨ 🚀 in UI text
❌ "Something went wrong" — give the error code
❌ "Powered by AI" / "Built with ❤️"

✅ "Cloudflare 401: token revoked or invalid — regenerate at dash.cloudflare.com"
✅ State the consequence before any destructive action
✅ Progress is visible (5 steps with current marker)

## Companions

- `lumilab-deploy` reads the Cloudflare token
- `lumilab-research-platforms` reads Exa / TikHub
- Publishing skills (content-repurpose) read WeChat / X tokens

## Chat-only fallback (LUMILAB_CHANNEL != local)

当 `LUMILAB_CHANNEL` 环境变量为 `feishu` / `telegram` / `slack` 等（由 OpenClaw / Hermes gateway 注入）时，浏览器 wizard 不可用——skill 自动进入**文本交互模式**：

1. **Setup Wizard 文本版**：agent 依次提问（每次一项），用户在 chat 内回复：
   ```
   Bot: 请粘贴你的 Cloudflare API token（可跳过）：
   User: cf_abc...
   Bot: ✓ Cloudflare verify 通过（账户 ID acc_xxx）
   Bot: 请粘贴 Exa API key（可跳过）：
   User: skip
   Bot: ✓ 跳过 Exa
   ...
   ```
   每次 verify 失败返回 `E_401 · token 无效` 等标准错误码，用户可立即修正。

2. **Share Manager 文本版**：
   - `@bot lumilab list shares` → 飞书 markdown 表格
   - `@bot lumilab share <name>` → interactive card 含 URL / 复制按钮 / QR 图片附件 / rotate 按钮

3. **Secrets 写入**：所有 token 经 `scripts/keychain.ts` 写入 macOS Keychain / Linux secret-tool / `~/.lumilab/secrets.json`（自动选择）。

4. **降级标志**：agent 在 chat 回复末尾附 `[mode: chat-fallback]`，便于排查。

详见 `scripts/keychain.ts`（M6 真 keychain bridge）和 `manifest.json` 的 `chat_fallback: "text-wizard"`。

## Secrets backend (M6 真 keychain)

`scripts/keychain.ts` 提供跨平台 secrets 存储：

| 平台 | 后端 | 命令 |
|---|---|---|
| macOS | `security` Login Keychain | `keychain.ts set EXA_API_KEY <value>` |
| Linux | `secret-tool` (libsecret) | 同上 |
| 其他 | `~/.lumilab/secrets.json` chmod 600 | 自动 fallback |

从 P0 plaintext 迁移：

```bash
bun run scripts/keychain.ts migrate-plaintext
```

迁移后 `~/.lumilab/secrets.json` 内容归档到 `secrets.json.migrated-<ts>`，主文件标记为 `{ _migrated_to: <backend> }`。

## Dependencies

| 依赖 | 类型 | 是否付费 | 说明 |
|---|---|---|---|
| bun | CLI runtime | 免费 | ≥1.0，必需 |
| host LLM | 由 Claude Code / OpenClaw / Cursor / Hermes 提供 | 取决于宿主 | Lumi Lab 本身不直连 LLM，复用宿主 |

## Outputs

`~/.lumilab/config.json` · `~/.lumilab/secrets.json`（或 keychain）· `~/.lumilab/shares.json`

## Example

`lumilab config` → 浏览器 5 步；chat 模式逐项问

## Tests

`tests/smoke.md` — 该 skill 的最小冒烟测试约定：让 host LLM 在对话中跑通 SKILL.md「真实示例」段即视为通过。E2E 真集成见 `docs/TUTORIAL.zh.md`。
