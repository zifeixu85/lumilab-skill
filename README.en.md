# Lumi Lab

> **A skills bundle for founders. From a vague idea to a market experiment in 7 days.**

English ｜ [简体中文](README.md)

**Lumi Lab** is a 26-skill bundle for **Claude Code / OpenClaw / Cursor / Codex / Hermes / Gemini CLI**. Give it a one-sentence idea — it autonomously runs market analysis, proposes directions, and generates a landing page with SEO/GEO. Asks you at most twice. Fuzzy idea in, testable landing page out.

🎬 **Demo video**: [https://www.bilibili.com/video/BV15o5862EHV/](https://www.bilibili.com/video/BV15o5862EHV/)

[![Version](https://img.shields.io/badge/version-1.10.2-orange)](CHANGELOG.md)
[![Skills](https://img.shields.io/badge/skills-26-blue)](skills/)
[![Hosts](https://img.shields.io/badge/hosts-Claude_Code_·_OpenClaw_·_Hermes_·_Cursor_·_Codex-555)](docs/TUTORIAL.zh.md)
[![SkillLens](https://img.shields.io/badge/SkillLens-16S_+_10A_·_avg_90.8_·_verified-brightgreen)](docs/SKILLLENS_REPORT.md)

---

## What this is (and isn't)

| Lumi Lab is | Lumi Lab isn't |
|---|---|
| A **skills bundle** dropped into `~/.claude/skills/` | A standalone Agent product |
| Invoked from inside Claude Code / OpenClaw / Cursor | A web app or SaaS |
| Provides files: HTML, YAML, CSV, MD | Provides a chat UI |
| **Uses your host's LLM** | Requires your own LLM API key |
| Reads/writes `~/.lumilab/` for state | Phones home |

**You don't give Lumi Lab an LLM API key.** Your AI host already has one — Lumi Lab plugs into it. The optional tokens it asks for are **tool integrations** (Cloudflare for deploying Studios, Tavily for web search, TikHub for Xiaohongshu API, etc.).

---

## Why this exists

**Skills are no longer scarce. Orchestration is.**

The problem isn't finding a prompt or skill. It's knowing:
- which skills to chain when you have a new idea
- which platform constraints actually matter (XHS ≤ 38-char title, X thread ≤ 7 posts, etc.)
- when to pivot a hypothesis instead of polishing the landing page
- how to publish a private project Studio that doesn't look like an AI demo

Lumi Lab encodes the answers as 26 self-contained skills + a shared `~/.lumilab/` state directory + a **resident Studio service** (auto-refreshes the browser on file change) + 3 utility browser UIs (Setup Wizard, Share Manager, Design Direction).

---

## What you get

### One-sentence idea → landing page (the default flow)

`lumilab-idea-to-landing` is the default entry — an autoplan-style autonomous pipeline: idea in → market analysis + competitor scan + audience breakdown → an illustrated HTML report with 3-5 concrete direction proposals → you pick one (the only decision gate) → auto design + copy + a landing page with SEO/GEO → deployable HTML out. It does not interrogate you step by step — it does the judgment and the work. Intermediate artifacts are pushed to you as HTML, never silently dropped to disk.

### An optional deep coach

`lumilab-founder-coach` — for when you explicitly want to be pushed deep on a specific problem. Three layers (methodology / cognitive traps / psychological). It no longer drills one question at a time — it analyzes first, then batches questions, max 2-3 prompts per session.

### A Hypothesis Ledger that never deletes

Every assumption is an atomic YAML fact with an `id`, confidence, test method, evidence, supersede history. You can pivot — the old hypothesis stays with `status: superseded` and `superseded_by: <new-id>`. The Studio renders the diff inline.

### A Studio per venture

Each idea gets its own project page — a printable journal with editorial typography (Fraunces serif + JetBrains Mono), SVG progress timeline, hypothesis cards, decision trail. OKLCH on warm newsprint with grain overlay.

### Three browser UIs (no LLM needed)

- **Setup Wizard** (`lumilab config`) — 5 steps. Asks for tool tokens you actually need: Cloudflare, Tavily, TikHub. **Never asks for an LLM key.**
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

### Prerequisites (auto-handled — usually nothing to do)

- **bun ≥ 1.0** (runtime + script runner) — **`install.sh` auto-installs it if missing**; in host-chat paths every SKILL.md's `## 环境自检` section lets the agent install it itself
- **wrangler** (Cloudflare CLI; only if you'll use `lumilab deploy`)
- **qrencode** (optional, for `lumilab manage` QR codes)

To install manually:

```bash
curl -fsSL https://bun.sh/install | bash    # install.sh does this automatically
npm install -g wrangler                      # only for deploy
brew install qrencode                        # optional; or apt install qrencode
```

### Install the skills bundle

**Easiest: paste this to your AI agent (Claude Code / OpenClaw / Cursor…) — it installs itself:**

> Install Lumi Lab: run `curl -fsSL https://get.lumiclaw.ai | bash`, then tell me how to start.

Or run it yourself in a terminal (same effect):

```bash
curl -fsSL https://get.lumiclaw.ai | bash
```

It detects your OS, downloads + verifies, and installs into **every detected host's** skills dir:

| Agent | Directory |
|---|---|
| Claude Code | `~/.claude/skills/` |
| OpenClaw | `~/.openclaw/skills/` |
| Codex CLI | `~/.codex/skills/` |
| Gemini CLI | `~/.gemini/skills/` |

bun is auto-installed if missing. **Re-run the same command to upgrade — your local data (ventures / config / secrets) is fully preserved**, with an automatic backup for rollback.

> **Cursor** (project-level only): in your project root run
> `mkdir -p .cursor/skills && cp -R ~/.claude/skills/lumilab-* .cursor/skills/`

#### Install straight from GitHub ([`zifeixu85/lumilab`](https://github.com/zifeixu85/lumilab))

```bash
git clone https://github.com/zifeixu85/lumilab.git
cd lumilab
./install.sh            # auto-detects Claude Code / Codex / OpenClaw / Gemini, installs to each
```

`install.sh` copies the whole `skills/` to every detected host + the CLI to `~/.lumilab/bin/`, backing up the old version first (rollback-able). **Single host only**: `./install.sh --target ~/.codex/skills` (e.g. Codex only). Private repo — you need GitHub access (`gh auth login` or an SSH key).

#### Other paths

- **Feishu/Hermes (in-chat)**: send `/skills install https://github.com/zifeixu85/lumilab` in a connected chat; Hermes static-scans then writes to `~/.hermes/skills/lumilab/`
- **OpenClaw native**: `openclaw skills install lumilab && openclaw gateway restart`

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
| **Core (self-built)** | 6 | hypothesis-ledger, founder-coach, landing-mvp (SEO/GEO + theme.css), content-repurpose, weekly-sop-runner, **next-actions** (signals → multi-direction next steps: kanban + mindmap + print) |
| **Infrastructure** | 4 | config (Setup Wizard + Share Manager), deploy (Cloudflare + encryption), research-platforms (XHS + Web), **payment-link** (Stripe checkout + payment loop) |
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

All 26 skills passed [SkillLens](https://github.com/Yannickdes/SkillLens) official agent-side Deep Review — **16 at S, 10 at A, avg ~90.8 / 100, all `deepReviewCertificate` `verified`**. The 10 A's are operational skills (idea-to-landing / studio / landing-mvp / config…) whose SKILL.md carries the full pipeline + commands inline — they lose a few context-budget points by size; **we chose completeness over score**. Methodology skills keep a lean SKILL.md + full `references/full-guide.md`. Every skill ships a runnable `scripts/validate-output.ts` + `scripts/anti-slop-lint.ts`. See [`docs/SKILLLENS_REPORT.md`](docs/SKILLLENS_REPORT.md).

---

## Documentation

- [`docs/TUTORIAL.zh.md`](docs/TUTORIAL.zh.md) — full getting-started guide (three host paths + Feishu onboarding)
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — technical architecture
- [`docs/SKILLS.md`](docs/SKILLS.md) — 26-skill index with one-line purpose
- [`docs/SKILLLENS_REPORT.md`](docs/SKILLLENS_REPORT.md) — SkillLens evaluation report
- [`CHANGELOG.md`](CHANGELOG.md) — changelog

---

## New in 1.10.0

- **W1 · Resident Studio daemon** — `lumilab serve start`: one process serves every venture + home on a fixed port; change any data → open pages **auto-refresh**, lazy re-render on access (no manual render).
- **W2 · `lumilab-next-actions` skill** — decision engine: reads all venture data → R6 signal baselines → multi-direction next-step candidates. Inline **kanban** (native drag, persists) + **mindmap** (offline, works without network) + printable.
- **W3 · Payment loop** — `lumilab payment sync` read-only pulls real Stripe paid count/amount (de-identified) → scores against baselines → writes back to hypotheses → feeds next-actions.
- **W4 · Landing `theme.css` + live re-theme** — build stage puts the real landing in an iframe beside a design panel; drag a dial → the page **changes instantly**; "Apply" deterministically rewrites `theme.css` (no LLM).
- **All 26 skills SkillLens Deep-Reviewed → 16 S + 10 A** (avg ~90.8, verified); operational skills keep the full pipeline inline (completeness over context-budget score), methodology skills stay lean + full `references/full-guide.md`.

## Status (v1.10.0)

✅ Ready:
- 26 skills with full SKILL.md + frontmatter
- Each skill ships `scripts/validate-output.ts` output validator + `scripts/anti-slop-lint.ts`
- Studio HTML renderer (editorial aesthetic)
- Setup Wizard / Share Manager / Design Direction browser UIs
- **chat-mode config**: in Feishu / Telegram, `wizard.ts --chat-set <provider> <token>` configures keys directly (verifies real API → writes keychain)
- Cloudflare deploy + client-side encryption (AES-GCM + PBKDF2 1M)
- localStorage password cache (no re-prompt on refresh)
- PARA three-tier memory layout
- 5 Chinese platform rule-sheets (2025–2026 updated)
- `lumilab` CLI (incl. retro / research-xhs / research-web / secrets)
- Real keychain backend (macOS Keychain / Linux secret-tool)
- XHS / Tavily real integration code + mock fallback when no token
- Self-referencing demo venture (re-verified under v1.0)
- **SkillLens: all 26 skills at S grade, avg ~92.6, all verified**

⏳ Pending your environment (does not block code usability):
- End-to-end dogfood install test (run `./install.sh` on your machine)
- Feishu e2e demo recording (needs a Feishu bot)
- ClawHub publish (needs a clawhub.ai account)
- XHS / Tavily real-token integration test (code ready, needs your API keys)

See [`CHANGELOG.md`](CHANGELOG.md) for the full manifest.

---

## License

See [`LICENSE`](LICENSE).

## Credits

**Methodology**: YC office hours · Mom Test (Rob Fitzpatrick) · Lean Startup (Eric Ries) · Sean Ellis 40% PMF · April Dunford · Bob Moesta JTBD · Marc Lou · Lenny Rachitsky · Thariq Shihipar (HTML effectiveness)

**Upstream skills**: Aston1690/landing-page · Leonxlnx/taste-skill · pbakaus/impeccable · JimLiu/baoyu-skills · white0dew/XiaohongshuSkills · alirezarezvani/claude-skills · obra/superpowers · dzhng/deep-research

**Infrastructure**: Cloudflare Pages · wrangler · Web Crypto API · bun · Fraunces · JetBrains Mono · Geist
