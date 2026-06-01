---
name: lumilab-config
description: |
  Setup Wizard + Share Manager + Secrets storage for the Lumi Lab skills bundle.

  Browser-based 6-step first-run onboarding page: user identity / preferences / tool tokens (Cloudflare for deploy, Tavily for search, TikHub/Stripe/Resend/WeChat/X as optional integrations) / default deploy password.

  Browser-based Share Manager to view/copy/rotate/delete deployed venture Studios.

  Lumi Lab is a skills bundle that runs INSIDE Claude Code / OpenClaw / Cursor / Codex / Hermes. The host environment provides the LLM, so this wizard never asks for LLM API keys. It only configures tool integrations and user preferences.

  Use when user types /lumilab config, /lumilab manage, or on first /lumilab init.

  关键词：setup wizard / config / 配置 / tool token / cloudflare / tavily / share management / 分享管理 / secrets / 密钥管理 / venture 密码
version: 1.6.1
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
license: AGPL-3.0-or-later
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

## Setup Wizard — 6 步首次引导页

`lumilab config` 是 **首次使用引导页**。第一次用 Lumi Lab 时（`~/.lumilab/config.json` 不存在或没有 `onboarded: true`）应跑一遍。

```
Step 1/6  欢迎 — 产品引导：Lumi Lab 是什么 + idea→验证页流程图 + 4 条使用提示
Step 2/6  界面风格 — 4 套美学样本可视化选（editorial / minimalist / brutalist / soft）
          → 存为 default_design_preset，新 venture 的验证页用它当基准
Step 3/6  Identity — name, location, background, current venture stage
Step 4/6  Preferences — language, writing style, AI-trace tolerance
Step 5/6  Tool integrations (all optional, pick what you need)
          ── Deploy ──
            ☐ Cloudflare API Token (enables `lumilab deploy`)
          ── Research ──
            ☐ Tavily (Web deep search)
            ☐ TikHub (Xiaohongshu API, no-login)
            ☐ DataForSEO Login + Password (关键词调研默认数据源)
            ☐ Keywords Everywhere key (关键词调研可选数据源)
          ── Pro tier ──
            ☐ Stripe / Resend / WeChat MP / X (Twitter)
Step 6/6  Deploy preferences + 完成 · 怎么开始
          Default share password (6-digit numeric): [______]   ← "house password"
          完成 → 写 onboarded: true，给出 `lumilab idea "<想法>"` 开始指引
```

每个工具 token 卡片带 4 步快速指引（去哪注册 / 取 key）+ Verify 按钮（打真实 API）。**全部可跳过** —— 基础 skill 不需要任何 token。

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

Same pattern for Tavily / TikHub / DataForSEO / Keywords Everywhere / Stripe / Resend / WeChat / X. Each card has a 4-step quickstart and a Verify button that hits the real API. DataForSEO 是 login + password 两栏（关键词调研默认数据源），首次使用时验证。

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
  "tavily_api_key": "...",
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
| Tavily | `POST /search` (minimal) | 200 OK |
| TikHub | API-specific | quota info |
| Stripe | `GET /v1/account` | account name |
| Resend | `GET /domains` | 200 OK |

Failures return specific codes: `E_401 token invalid`, `E_403 missing scope`, `E_429 rate limit`. Never "Something went wrong."

## Files

```
skills/lumilab-config/scripts/
├── wizard.ts          ← /lumilab config → 6 步首次引导页 + chat-mode 子命令
├── keychain.ts        ← macOS Keychain / Linux secret-tool / plaintext fallback
├── manage.ts          ← /lumilab manage → Share Manager
└── anti-slop-lint.ts  ← 文案检查器
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
- `lumilab-research-platforms` reads Tavily / TikHub
- Publishing skills (content-repurpose) read WeChat / X tokens

## Chat-only mode (LUMILAB_CHANNEL != local) — 已实装

飞书 / Telegram / Slack 等 chat 环境没有浏览器。`wizard.ts` 自动检测 `LUMILAB_CHANNEL`，提供 **agent-friendly 子命令**（每个输出确定性 JSON，host LLM 解析后回复用户）：

```bash
# 首次引导（产品介绍 + 风格选择 + token 指引，一次性输出完整脚本）
bun run scripts/wizard.ts --chat-onboard
bun run scripts/wizard.ts --chat-onboard-preset <editorial|minimalist|brutalist|soft>
bun run scripts/wizard.ts --chat-onboard-done   # 标记 onboarded，不再每次提示

# token 配置
bun run scripts/wizard.ts --chat-prompts        # 列出可配置 provider + 设置指引
bun run scripts/wizard.ts --chat-status         # 看当前配置（不回显 token 值）
bun run scripts/wizard.ts --chat-set <provider> <token>   # verify 真实 API → 写 keychain → 更新 config flag
bun run scripts/wizard.ts --chat-set tavily -      # token 从 stdin 读，不进进程列表
```

**单 token provider**：`cloudflare` / `tavily` / `tikhub` / `keywordseverywhere` / `stripe` / `resend`。
**DataForSEO 是 login + password 两段**，chat 环境直接用 keychain：`lumilab secrets set DATAFORSEO_LOGIN <x>` + `lumilab secrets set DATAFORSEO_PASSWORD <y>`。

**首次引导飞书流程**（host LLM 编排）：用户第一次用 → agent 调 `--chat-onboard` 拿到引导脚本 → 跟用户讲产品 + 让选风格（`--chat-onboard-preset`）+ 按需配 token（`--chat-set`）→ 调 `--chat-onboard-done` 收尾。

**典型飞书对话流程**（host LLM 编排）：

```
User: 帮我配置 lumilab 的 Tavily key
Bot:  [调 wizard.ts --chat-prompts] → 告诉用户去 tavily.com 拿 key
User: 我的 key 是 abc123...
Bot:  [调 wizard.ts --chat-set tavily abc123...]
      → {"ok":true,"provider":"tavily","backend":"macos-keychain","verified":"..."}
      → 回复用户「✓ Tavily 已配置并通过 verify，research-web 现在走真实搜索」
```

`--chat-set` 行为：
1. 调对应的 `verifyXxx()` 打**真实 API**（Cloudflare/Tavily/Stripe/Resend/TikHub），失败返回标准错误码 `E_401`/`E_403`/`E_429`/`E_NET`
2. verify 通过 → 经 `scripts/keychain.ts` 写入（优先 macOS Keychain / Linux secret-tool，兜底 `~/.lumilab/secrets.json` chmod 600）
3. 更新 `~/.lumilab/config.json` 的 `api.has_<provider>` flag
4. 输出 JSON 含 `backend` 字段（`macos-keychain` / `linux-secret-tool` / `plaintext`）

**Share Manager 文本版**：
- `@bot lumilab list shares` → 飞书 markdown 表格
- `@bot lumilab share <name>` → interactive card 含 URL / 复制按钮 / QR 图片附件 / rotate 按钮

`LUMILAB_CHANNEL != local` 且没给 `--chat-*` 子命令时，wizard.ts 不会尝试开浏览器——直接打印 chat 命令用法 JSON。

详见 `scripts/wizard.ts` 的 chat-mode 段、`scripts/keychain.ts`（M6 真 keychain bridge）和 `manifest.json` 的 `chat_fallback: "text-wizard"`。

## Secrets backend (M6 真 keychain)

`scripts/keychain.ts` 提供跨平台 secrets 存储：

| 平台 | 后端 | 命令 |
|---|---|---|
| macOS | `security` Login Keychain | `keychain.ts set TAVILY_API_KEY <value>` |
| Linux | `secret-tool` (libsecret) | 同上 |
| 其他 | `~/.lumilab/secrets.json` chmod 600 | 自动 fallback |

从 P0 plaintext 迁移：

```bash
bun run scripts/keychain.ts migrate-plaintext
```

迁移后 `~/.lumilab/secrets.json` 内容归档到 `secrets.json.migrated-<ts>`，主文件标记为 `{ _migrated_to: <backend> }`。

## 分支决策

| if 条件 | then 走哪条路径 |
|---|---|
| `lumilab config` 首次运行 + 有浏览器 | 走 5 步浏览器 Wizard |
| `LUMILAB_CHANNEL != local`（飞书/TG/Slack）| 走 chat-mode 子命令（`--chat-prompts` / `--chat-status` / `--chat-set`），不开浏览器 |
| 有浏览器但 `lumilab manage` | 走 Share Manager dashboard，不走 Wizard |
| 其他 skill 需要某 tool token | 静默 decrypt 读取，无 UI |
| token verify 返回 E_401 / E_403 / E_429 | 返回对应错误码 + 具体修复链接，不写入 secrets |
| macOS Keychain 已存在同 service+account 条目 | `set` 先 delete 再 add，防重复条目 |
| 用户尝试配置 LLM API key | 拒绝 — host 才管 LLM key，不存任何 LLM key 字段 |

## Output validation

`scripts/validate-output.ts` 是确定性校验器，强制 SKILL.md「Hard constraints」「Secrets abstraction」里的约束。

校验字段：`secrets.json` 任何深度的键名不得匹配 LLM key（anthropic / openai / dashscope / gemini，命中即判违规）· `secrets.json.venture_passwords.<slug>`（string，6 位数字）· `config.json.default_share_password`（string，6 位数字，若存在）· `shares.json[].url`（string，每条必填）。

```bash
bun run scripts/validate-output.ts          # 默认校验 ~/.lumilab/
# exit 0 = 合规，exit 1 = 逐条列出违规（LLM key 泄漏永远判违规）
```

## Dependencies

| 依赖 | 类型 | 是否付费 | 单次调用约成本 | 说明 |
|---|---|---|---|---|
| bun | CLI runtime | 免费 | free | ≥1.0，必需 |
| host LLM | 宿主提供 | 取决于宿主 | ~0.5-1k tokens / chat-mode 编排 | 仅 chat 模式编排用，wizard 本身无 LLM |
| 各 tool API（Cloudflare/Tavily/TikHub/Stripe/Resend） | verify endpoint | 各家计费 | verify 调用通常免费额度内（~1 次/配置） | 仅做 token verify，不产生业务调用 |

## Outputs

`~/.lumilab/config.json` · `~/.lumilab/secrets.json`（或 keychain）· `~/.lumilab/shares.json`

## Example

`lumilab config` → 浏览器 5 步；chat 模式逐项问

## Tests

`tests/smoke.md` — 该 skill 的最小冒烟测试约定：让 host LLM 在对话中跑通 SKILL.md「真实示例」段即视为通过。E2E 真集成见 `docs/TUTORIAL.zh.md`。

## Idempotency

Wizard 5 步独立可重跑；secrets `set` 覆盖同 key，`del` 删除单 key；migrate-plaintext 归档而不删主文件。

## Privacy

**核心承诺**：从不存 LLM API key；token 优先存 macOS Keychain / Linux secret-tool；plaintext fallback chmod 600；HTTP 服务器只绑 127.0.0.1。

## Cache

config / shares 按 mtime 缓存；verify 结果按 token 前 8 位 + 60 分钟 TTL 缓存（防同一会话多次 verify）。

## Failure modes

`E_401` token 无效 / `E_403` 缺权限 / `E_429` 限流——每种错都给具体修复链接（如 dash.cloudflare.com/profile/api-tokens）。Verify 全部命中真实 API，无 mock success。

## Edge cases

同一 service + account 已存在时 `set` 先 delete 再 add（防 macOS Keychain 重复条目）；plaintext 迁移失败回滚保留原文件。

## Alternatives

用户现在可能用什么替代方案，以及 Lumi Lab 为什么不一样：

- **手动编辑 .env / config 文件**：易错，无 verify，token 明文散落。
- **通用密码管理器**：存得了但不针对 AI 宿主的 tool token 场景，不做 API verify。

Lumi Lab 的差异：5 步浏览器 wizard + 真实 API verify（返回 E_401/E_403/E_429）+ macOS Keychain / Linux secret-tool 真后端 + 从不存 LLM key。

## Moat（复利护城河）

配一次，所有 venture 和 skill 共用 `~/.lumilab/`。keychain 后端让 token 跟着系统钥匙串走，换项目不用重配。

## Changelog

- **1.0.0-rc4** — 新增 `scripts/validate-output.ts`（secrets.json 必须不含任何 LLM key 字段 + venture_passwords 6 位数字 + config.json 默认密码格式 + shares.json 每条带 url）+ Output validation 段；新增 分支决策 if-then 表；Dependencies 表加单次调用约成本列；确认 outputs 文件名三处一致（config.json / secrets.json / shares.json）。
- **1.0.0-rc1** — 初版：5 步 Setup Wizard + Share Manager + 跨平台 secrets。

## 环境自检（首次运行前）

本 skill 的 `scripts/` 用 **bun ≥ 1.0** 运行。宿主里第一次调用 Lumi Lab 任意 skill 前，先做一次环境自检——缺 bun 就自动装（装在 `~/.bun/`，无需 root，约 30 秒）：

```bash
command -v bun >/dev/null 2>&1 || { [ -x "$HOME/.bun/bin/bun" ] && export PATH="$HOME/.bun/bin:$PATH"; }
command -v bun >/dev/null 2>&1 || curl -fsSL https://bun.sh/install | bash
export PATH="$HOME/.bun/bin:$PATH"   # 当前 shell 立即可用
```

宿主 agent（Claude Code / OpenClaw / Hermes）能跑 shell，应在首次调用前自动执行上面这段。纯方法论用法（不跑脚本、只读 SKILL.md 做对话）不需要 bun。

## 主动交付（不要静默落盘）

这个 skill 产出的任何**用户该看的东西**，都要主动交付给用户 —— 不能写完文件就完事。

- **优先 HTML 图文并茂**：分析报告、landing、Studio、周复盘等用户要「看」的产物，渲染成 HTML，本地自动开浏览器，chat 环境（`LUMILAB_CHANNEL != local`）作为**文件附件**发给用户。
- **.md / .yaml 产物**：在 chat 里贴一段**纯文字摘要** + 告诉用户文件路径；用户要细节再发完整文件。不要假设用户会自己去翻 `data/ventures/` 目录。
- **每个 phase 结束**：用一两句话告诉用户「这一步做了什么、产出在哪、下一步是什么」。
- **判断「用户该看」的标准**：如果这个产物影响用户的下一个决策，或者用户花了输入成本期待一个结果 —— 就必须主动交付，不能等用户问。

## 写时更新（产物变了就刷新 home / studio）

Lumi Lab 用「写时更新」保持 home dashboard 和 venture Studio 是最新的 —— 没有常驻进程做实时同步，所以**谁改了数据，谁负责顺手刷新**。

这个 skill 只要**创建或更新了某个 venture 的文件**（写了 `market_analysis.json` / `reports/` / `landing/` / `decisions.yaml` / `design_direction.json` / retro YAML 等），做完后**必须**：

1. 重渲这个 venture 的 Studio：`bun run ../lumilab-studio/scripts/render.ts ~/.lumilab/data/ventures/<slug>`
2. 重渲 home dashboard：`bun run ../lumilab-home/scripts/home.ts render`

这样用户回到 home 或 Studio 就能立刻看到这一步的产物，不用手动说「刷新」。如果只是读、没写 venture 数据，不用刷新。

CLI 入口（`lumilab idea` / `config` / `deploy`）已经内置了写时更新；**对话式调用时由你（宿主 agent）负责补这两步**。
