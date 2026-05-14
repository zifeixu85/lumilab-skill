# Lumi Lab

> **A skills bundle for founders. From a vague idea to a market experiment in 7 days.**

English ｜ [简体中文](README.md)

**Lumi Lab** is a 21-skill bundle for **Claude Code / OpenClaw / Cursor / Codex / Hermes / Gemini CLI**. Drop it into your AI host's skills directory and it turns a fuzzy idea into shippable, testable, decision-traceable artifacts — landing page, multi-platform content, hypothesis ledger, growth SOP, deployable Studio page.

[![Version](https://img.shields.io/badge/version-1.0.0--rc3-orange)](CHANGELOG.md)
[![License](https://img.shields.io/badge/license-Apache_2.0-blue)](LICENSE)
[![Skills](https://img.shields.io/badge/skills-21-blue)](skills/)
[![Hosts](https://img.shields.io/badge/hosts-Claude_Code_·_OpenClaw_·_Hermes_·_Cursor_·_Codex-555)](docs/TUTORIAL.zh.md)
[![SkillLens](https://img.shields.io/badge/SkillLens-1_S_+_20_A_·_avg_87.3_·_verified-brightgreen)](docs/SKILLLENS_REPORT.md)

---

## What this is (and isn't)

| Lumi Lab is | Lumi Lab isn't |
|---|---|
| A **skills bundle** dropped into `~/.claude/skills/` | A standalone Agent product |
| Invoked from inside Claude Code / OpenClaw / Cursor | A web app or SaaS |
| Provides files: HTML, YAML, CSV, MD | Provides a chat UI |
| **Uses your host's LLM** | Requires your own LLM API key |
| Reads/writes `~/.lumilab/` for state | Phones home |

**You don't give Lumi Lab an LLM API key.** Your AI host already has one — Lumi Lab plugs into it. The optional tokens it asks for are **tool integrations** (Cloudflare for deploying Studios, Exa for web search, TikHub for Xiaohongshu API, etc.).

---

## Why this exists

**Skills are no longer scarce. Orchestration is.**

The problem isn't finding a prompt or skill. It's knowing:
- which skills to chain when you have a new idea
- which platform constraints actually matter (XHS ≤ 38-char title, X thread ≤ 7 posts, etc.)
- when to pivot a hypothesis instead of polishing the landing page
- how to publish a private project Studio that doesn't look like an AI demo

Lumi Lab encodes the answers as 21 self-contained skills + a shared `~/.lumilab/` state directory + 3 utility browser UIs (Setup Wizard, Share Manager, Design Direction).

---

## What you get

### A Founder Coach with three modes

Not a chatbot — a coach that picks one of three modes based on your state:

```
○ Methodology   YC office hours / Mom Test / Lean Canvas / Sean Ellis
○ Cognitive     sunk-cost detection / "where's the evidence?" / decision fatigue
○ Psychological recovery from failed hypotheses / pivot vs. persevere
```

One question at a time. Refuses to skip ahead.

### A Hypothesis Ledger that never deletes

Every assumption is an atomic YAML fact with an `id`, confidence, test method, evidence, supersede history. You can pivot — the old hypothesis stays with `status: superseded` and `superseded_by: <new-id>`. The Studio renders the diff inline.

### A Studio per venture

Each idea gets its own project page — a printable journal with editorial typography (Fraunces serif + JetBrains Mono), SVG progress timeline, hypothesis cards, decision trail. OKLCH on warm newsprint with grain overlay.

### Three browser UIs (no LLM needed)

- **Setup Wizard** (`lumilab config`) — 5 steps. Asks for tool tokens you actually need: Cloudflare, Exa, TikHub. **Never asks for an LLM key.**
- **Share Manager** (`lumilab manage`) — every deployed Studio, with reveal-password / rotate / delete.
- **Design Direction** (`lumilab design-direction <venture>`) — 4 aesthetic samples + 3 dials (variance / motion / density) + iframe live preview. Output writes `design_direction.json` consumed by downstream skills.

### One-command deploy with password gate

```
$ lumilab deploy my-venture

  🔑 using password: ••••••
  🔒 encrypting (AES-GCM + PBKDF2 1M iter)
  ☁️  wrangler pages deploy → my-venture-yourname.pages.dev

  ✅ deployed
     URL:      https://my-venture-yourname.pages.dev
     Password: 728345   (share this separately)
```

Visitors enter the password once. With "Remember on this device" checked, refreshing or new-tabbing won't re-prompt — localStorage cache invalidates automatically when you rotate the password.

### Platform know-how baked in

Five Chinese platforms (小红书, 公众号, 抖音, 朋友圈, X) each have hard rules in `skills/lumilab-content-repurpose/references/platform-rules/`:

```
xiaohongshu.md:
- 标题 ≤ 38 字 (中文 ×2, 英文/数字 ×1)
- 图文必有图（无图不可发）
- 图视频不可混用
- 首图必须可读
- 标签 3-10 个
- 不在正文放外链
```

The Content skill reads these before generating anything. No LLM "推断" — written-down rules.

---

## Install

### Prerequisites

- **bun ≥ 1.0** (runtime + script runner)
- **wrangler** (Cloudflare CLI; only if you'll use `lumilab deploy`)
- **qrencode** (optional, for `lumilab manage` QR codes)

```bash
curl -fsSL https://bun.sh/install | bash
npm install -g wrangler
brew install qrencode    # macOS; or `apt install qrencode`
```

### Install the skills bundle

Lumi Lab 支持三种宿主的三条安装路径——选你正在用的：

#### Claude Code / Cursor / Codex（本地 `~/.claude/skills/`）

```bash
git clone https://github.com/zifeixu85/lumilab.git
cd lumilab
./install.sh
```

`install.sh` 把 21 个 skill 复制到 `~/.claude/skills/`（或 `--target` 自定义）。`--yes` 非交互。

#### OpenClaw（ClawHub 集中安装）

```bash
openclaw skills install lumilab
openclaw gateway restart
```

绑定飞书 bot（可选，跑通 OpenClaw → 飞书 chat 入口）：

```bash
openclaw channels login --channel feishu
```

#### Hermes Agent（chat 内一句话装，飞书 / Telegram / Slack 全 channel 通用）

在你已经接好的 chat（如飞书 @bot）直接发：

```
/skills install https://github.com/zifeixu85/lumilab
```

Hermes 会 quarantine → `skills_guard` 静态扫描 → 写入 `~/.hermes/skills/lumilab/`。后续 `@bot 帮我用 lumilab 走一遍这个 idea` 即可调用。

### Configure (one-time, 2 min)

```bash
lumilab config
```

Opens a 5-step browser wizard. Pick the tool tokens you want. **Skip any of them** — basic skills (coach, hypothesis ledger, content) work without external tokens.

### Try the demo

```bash
lumilab list
lumilab studio lumilab-meta
```

Opens the self-referencing demo venture in your browser.

### Your own venture

```bash
lumilab new "AI content factory for Xiaohongshu KOLs"
```

Then in **your AI host** (Claude Code, OpenClaw, etc.):

> "Switch to lumilab-founder-coach Layer 1 (methodology). Use YC office-hours forcing questions, HARD-GATE pacing, one question at a time. Write the output to hypotheses.yaml and audience.md."

The host's LLM does the thinking; the skill provides the structure.

```bash
lumilab render          # refresh Studio HTML
lumilab studio          # view
lumilab deploy          # publish + encrypt + URL + password
```

---

## Commands

```
lumilab new "<idea>"            start a new venture
lumilab list                    list ventures
lumilab studio [venture]        open Studio in browser
lumilab render [venture]        re-render Studio HTML

lumilab design-direction [venture]    pick aesthetic + dials + live preview
lumilab deploy <venture>              deploy to Cloudflare Pages w/ password gate
lumilab manage                        manage all deployed Studios
lumilab config                        Setup Wizard

lumilab help                          show help
```

Inside Claude Code / OpenClaw / etc., the skills `coach / clarify / research / build-assets / launch / review` are invoked **conversationally**:

> "Run lumilab-research-platforms for venture xhs-factory, channels: web + xhs"

---

## Inside the box

| Layer | Count | Skills |
|---|---|---|
| **Core (self-built)** | 5 | hypothesis-ledger, founder-coach, landing-mvp, content-repurpose, weekly-sop-runner |
| **Infrastructure** | 3 | config (Setup Wizard + Share Manager), deploy (Cloudflare + encryption), research-platforms (XHS + Web) |
| **Rendering** | 1 | studio (HTML + SVG progress + hypothesis cards + decision timeline) |
| **Overlays (upstream wrappers)** | 11 | coach-yc, research-{interview,icp,competitor}, product-{positioning,pmf,mvp}, copy, launch-strategy, metrics, design-direction |
| **Knowledge** | 1 | playbook-cn (13 frameworks + China platform rules index) |

Each skill is `skills/<name>/SKILL.md` plus optional `scripts/`, `references/`, `templates/`. Open one and read it — flat Markdown the host's LLM consumes.

---

## How it differs from a "super prompt"

A super prompt is text. Lumi Lab is a workspace.

| Super prompt | Lumi Lab |
|---|---|
| Stateless. Re-paste every session. | `~/.lumilab/` is the state. |
| One author's voice. | 21 distinct skills, each with its own discipline. |
| Output is text dumped to chat. | Output is files: HTML, YAML, CSV, MD. Diffable. Deployable. |
| "Try this approach." | Atomic hypothesis ledger with supersede history. |
| Hard to share. | `lumilab deploy` → encrypted public Studio in 30 seconds. |
| Forgets last week. | PARA three-tier memory in `~/.lumilab/`. |

---

## Quality

All 21 skills passed [SkillLens](https://github.com/Yannickdes/SkillLens) official agent-side Deep Review — **1 S + 20 A, avg 87.3 / 100, all 21 `deepReviewCertificate` `verified`**. Top: `lumilab-content-repurpose` 90.33 (S grade). See [`docs/SKILLLENS_REPORT.md`](docs/SKILLLENS_REPORT.md).

---

## Documentation

- [`docs/TUTORIAL.zh.md`](docs/TUTORIAL.zh.md) — full getting-started guide (three host paths + Feishu onboarding)
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — technical architecture
- [`docs/SKILLS.md`](docs/SKILLS.md) — 21-skill index with one-line purpose
- [`docs/SKILLLENS_REPORT.md`](docs/SKILLLENS_REPORT.md) — SkillLens evaluation report
- [`CHANGELOG.md`](CHANGELOG.md) — changelog

---

## v1.0.0-rc3 status

✅ Ready:
- 21 skills with full SKILL.md + agentskills.io v1 frontmatter
- Studio HTML renderer (editorial aesthetic)
- Setup Wizard / Share Manager / Design Direction browser UIs
- Cloudflare deploy + client-side encryption (AES-GCM + PBKDF2 1M)
- localStorage password cache (no re-prompt on refresh)
- PARA three-tier memory layout
- 5 Chinese platform rule-sheets (2025–2026 updated)
- `lumilab` CLI (incl. retro / research-xhs / research-web / secrets)
- Real keychain backend (macOS Keychain / Linux secret-tool)
- XHS / Exa real integration code + mock fallback when no token
- Self-referencing demo venture
- SkillLens: 1 S + 20 A, avg 87.3, all verified

⏳ rc3 → final:
- End-to-end dogfood install test (run on your machine)
- Feishu e2e demo recording (needs a Feishu bot)
- ClawHub publish (needs account registration)
- XHS / Exa real-token integration test

See [`CHANGELOG.md`](CHANGELOG.md) for the full manifest.

---

## License

Apache 2.0 — see [`LICENSE`](LICENSE).

## Credits

**Methodology**: YC office hours · Mom Test (Rob Fitzpatrick) · Lean Startup (Eric Ries) · Sean Ellis 40% PMF · April Dunford · Bob Moesta JTBD · Marc Lou · Lenny Rachitsky · Thariq Shihipar (HTML effectiveness)

**Upstream skills**: Aston1690/landing-page · Leonxlnx/taste-skill · pbakaus/impeccable · JimLiu/baoyu-skills · white0dew/XiaohongshuSkills · alirezarezvani/claude-skills · obra/superpowers · dzhng/deep-research

**Infrastructure**: Cloudflare Pages · wrangler · Web Crypto API · bun · Fraunces · JetBrains Mono · Geist
