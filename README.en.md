# Lumi Lab

> **Send a one-sentence idea into the startup lab. See clearly · Test it · Know what's next.**

English ｜ [简体中文](README.md)

From a hunch to knowing whether it's worth building — researching demand, finding positioning, building a validation page, shipping it, reading the data — **Lumi Lab runs that path for you**. It's a skills bundle that lives inside your AI assistant: give it a one-sentence idea, it relays the work across skills and hands you a page that measures real intent, plus a read on what to do next.

[![Version](https://img.shields.io/badge/version-1.14.2-orange)](CHANGELOG.md)
[![Skills](https://img.shields.io/badge/skills-26-blue)](skills/)
[![Hosts](https://img.shields.io/badge/hosts-Claude_Code_·_OpenClaw_·_Hermes_·_Cursor_·_Codex-555)](docs/SKILLS.md)
[![License](https://img.shields.io/badge/license-AGPL--3.0-green)](LICENSE)

## 🚀 Install in one line

Tell your AI host (Claude Code / OpenClaw / Cursor / Codex…) and it installs itself (the whole block copies cleanly):

```text
Install Lumi Lab for me: run  curl -fsSL https://get.lumiclaw.ai | bash  then tell me how to use it.
```

Or run it yourself:

```bash
curl -fsSL https://get.lumiclaw.ai | bash
```

Installs into every detected AI host (Claude Code / OpenClaw / Codex / Gemini); re-run to upgrade, local data preserved. `git clone` also works — see [Install](#install) below.

---

## It doesn't score your idea — it walks it through a real validation

You have an idea, but you're not sure:

> "I'm sure someone needs this… but how many are searching, who's already doing it, why they're unhappy — I never actually checked."
> "I listed ten features and started none, because I didn't know which to do first."
> "I want to test demand, but I can't make a decent page, a postable caption, or a single image."
> "The page is done — do I post to Xiaohongshu or WeChat first? What if no one responds?"
> "Some saves, some questions, zero email signups… did it work or not? What's next?"

Lumi Lab runs those legs for you —

- **① See clearly** · untangle the fuzz first: what, for whom, and which bet you're making.
- **② Test it** · web, Xiaohongshu, Moments, a poster — ship the cheapest one and watch real reactions.
- **③ What's next** · when data comes back, it helps you read it: keep going, pivot, or pause.

Expanded, that's 6 steps: **clarify the idea → map the terrain (market / competitors / pain) → positioning (what · for whom · pricing) → build something testable (validation page / copy / imagery / checkout) → ship it (cold-start plan) → read the data, decide next**.

> It gives you **baselines and a reading, but never declares success/failure for you** — every project's baseline differs; keep / adjust / pause is your call.

---

## One sentence, the whole path

Once installed, tell your AI "help me validate an idea with Lumi Lab" and leave the rest to it: it runs market analysis, competitor scan, direction proposals, and builds a page that measures real purchase intent — stopping **only at the two points that genuinely need your call**, autonomous otherwise. Every step is rendered as a web page and pushed to you, not dumped as files.

- **Zero-config to start** — the core flow works out of the box, no accounts to set up first.
- **Uses your AI's own brain** — no extra LLM key; your Claude Code / Codex / OpenClaw already has one.
- **Your data stays local** — ventures, config, secrets all in `~/.lumilab/`, never phoned home.
- Web research / one-click deploy / image-gen use third-party services that need their own keys — all **skippable**; you can run the whole validation without any of them.

---

## 26 skills, covering every step from idea to validation

Each skill is backed by a proven methodology (Mom Test, April Dunford positioning, Sean Ellis PMF, YC office hours…). You don't learn them one by one — **give a sentence, they relay**: research → product → copy → landing → launch, all the way to a page that measures real intent.

- **Idea → validation orchestrator** · the default entry, the conductor that chains the other skills.
- **Studio war-room** · the whole process rendered as a web page; resident service, auto-refreshes on change.
- **Hypothesis ledger** · every call is logged — revisit, and pivot without losing history.
- **Next-action engine** · when feedback returns, it tells you what to do next.
- **Founder coach** · there whenever you want to talk a problem through.

One-line descriptions of all 26 skills: [`docs/SKILLS.md`](docs/SKILLS.md).

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

```text
Install Lumi Lab: run  curl -fsSL https://get.lumiclaw.ai | bash  then tell me how to start.
```

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

`install.sh` copies the whole `skills/` to every detected host + the CLI to `~/.lumilab/bin/`, backing up the old version first (rollback-able). **Single host only**: `./install.sh --target ~/.codex/skills` (e.g. Codex only). The repo is public — `git clone` needs no login.

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

## Quality discipline

Operational skills inline the full pipeline + commands in their SKILL.md (the host follows them at run time); methodology skills keep a lean SKILL.md + full `references/full-guide.md` (progressive disclosure). Every skill ships a runnable `scripts/validate-output.ts` (output validator) + `scripts/anti-slop-lint.ts` (anti-AI-slop copy check).

---

## Documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — technical architecture
- [`docs/SKILLS.md`](docs/SKILLS.md) — 26-skill index with one-line purpose
- [`CHANGELOG.md`](CHANGELOG.md) — changelog

---

## Highlights

> Per-version changes: [`CHANGELOG.md`](CHANGELOG.md) (currently v1.14.0).

- **Resident Studio daemon** — `lumilab serve start`: one process serves every venture + home on a fixed port; change any data → open pages **auto-refresh**, lazy re-render on access (no manual render).
- **`lumilab-next-actions` decision engine** — reads all venture data → signal baselines → multi-direction next-step candidates. Inline **kanban** (native drag, persists) + **mindmap** (offline) + printable.
- **Payment loop** — `lumilab payment sync` read-only pulls real Stripe paid count/amount (de-identified) → scores against baselines → writes back to hypotheses → feeds next-actions.
- **Landing `theme.css` + live re-theme** — build stage puts the real landing in an iframe beside a design panel; drag a dial → the page **changes instantly**; "Apply" deterministically rewrites `theme.css` (no LLM).
- **First-party analytics + content imagery + host-search fallback** — first-party tracking on the public validation page (data lands in your own Cloudflare), 小红书/Moments/long-form campaign imagery, and host-LLM-knowledge fallback for research when no API keys are set.

## Status

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
- Self-referencing demo venture (`lumilab demo`)
- Each skill ships a runnable output validator + anti-slop copy check

⏳ Pending your environment (does not block code usability):
- End-to-end dogfood install test (run `./install.sh` on your machine)
- Feishu e2e demo recording (needs a Feishu bot)
- ClawHub publish (needs a clawhub.ai account)
- XHS / Tavily real-token integration test (code ready, needs your API keys)

See [`CHANGELOG.md`](CHANGELOG.md) for the full manifest.

---

## License

[AGPL-3.0](LICENSE) — free to use / modify / self-host; if you redistribute a modified version or run it as a network service, you must release your source under AGPL too. Commercial / proprietary licensing available separately.

## Credits

**Methodology**: YC office hours · Mom Test (Rob Fitzpatrick) · Lean Startup (Eric Ries) · Sean Ellis 40% PMF · April Dunford · Bob Moesta JTBD · Marc Lou · Lenny Rachitsky · Thariq Shihipar (HTML effectiveness)

**Upstream skills** (inspired patterns/methods; their code is not bundled): garrytan/gstack (autoplan one-command decision pipeline · office-hours decision briefs) · JimLiu/baoyu-skills (cross-runtime input + image-gen abstraction) · Aston1690/landing-page · Leonxlnx/taste-skill · pbakaus/impeccable · white0dew/XiaohongshuSkills · alirezarezvani/claude-skills · obra/superpowers · dzhng/deep-research

**Infrastructure**: Cloudflare Pages · wrangler · Web Crypto API · bun · Fraunces · JetBrains Mono · Geist
