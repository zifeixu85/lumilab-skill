# Lumi Lab · 26 Skills Index

> Each skill is a folder `skills/<name>/` with a `SKILL.md` (instructions the host LLM reads) plus optional `scripts/`, `references/`, `templates/`, `examples/`.
>
> All skills run **inside the host AI** (Claude Code / OpenClaw / Cursor / Codex / Hermes / Gemini CLI). They don't ship their own LLM — the host's LLM reads SKILL.md and acts on it.

---

## Routing entry point

| Skill | Purpose |
|---|---|
| **`lumilab`** | OS-level orchestrator. Reads `~/.lumilab/state.json`, routes user intent to the right skill, maintains cross-session memory. |

(Phase 1 will promote the current CLI `scripts/lumilab` into a routing skill at `skills/lumilab/`.)

---

## Core · 5 skills

The five self-built skills that carry the venture-validation methodology.

| Skill | Trigger | Output |
|---|---|---|
| **`lumilab-founder-coach`** | "help me clarify this idea" / `lumilab coach` | 3-layer dialogue (methodology / cognitive / psychological). One question at a time. HARD-GATE pacing. Writes hypotheses.yaml. |
| **`lumilab-hypothesis-ledger`** | After Coach, or anytime new evidence arrives | Atomic YAML facts with supersede history. Diff-view rendered into Studio. Never deletes. |
| **`lumilab-landing-mvp`** | "build a landing page for this venture" | HTML + standalone CSS + image catalog + email-capture stub. 6-phase non-skippable pipeline. Anti-Slop + 6 self-check gates. |
| **`lumilab-content-repurpose`** | "give me xhs + wechat + x posts for this idea" | 5-platform content (xhs / wechat / douyin / moments / x) with each platform's hard rules enforced. |
| **`lumilab-weekly-sop-runner`** | "give me a 7-day launch SOP" | 7-day blueprint with cold-start daily briefs + content calendar + data-collection table. |

---

## Infrastructure · 3 skills

The utility skills that make the bundle actually usable.

| Skill | Trigger | What it does |
|---|---|---|
| **`lumilab-config`** | `lumilab config` (CLI) | Browser-based 5-step Setup Wizard. Configures **tool tokens only** (Cloudflare / Tavily / TikHub / Stripe / Resend / WeChat / X), preferences, default share password. **Never asks for an LLM key.** |
| **`lumilab-config` (Share Manager)** | `lumilab manage` (CLI) | Browser dashboard for all deployed Studios. Reveal/copy password · rotate · toggle visibility · delete · QR code. |
| **`lumilab-deploy`** | `lumilab deploy <venture>` | Encrypts the venture's Studio bundle with AES-GCM + PBKDF2 (1M iter), wraps it in an HTML password gate with localStorage caching, deploys to Cloudflare Pages via wrangler. |
| **`lumilab-research-platforms`** | "research this niche on web + xhs" | Dual-channel research: browser automation (Playwright/CDP) + third-party APIs (Tavily / Tavily / TikHub). Outputs cross-platform synthesis with painpoint density. |

---

## Rendering · 1 skill

| Skill | Trigger | Output |
|---|---|---|
| **`lumilab-studio`** | `lumilab render` / `lumilab studio` (CLI) | Renders the venture's MD/YAML data into the Studio HTML — editorial typography (Fraunces + JetBrains Mono), SVG progress diagram, hypothesis cards (with supersede strike-through), decision timeline. |
| **`lumilab-design-direction`** | `lumilab design-direction <venture>` | Browser interactive page: 4 aesthetic samples + 3 dials (variance / motion / density) + iframe live preview. Output → `design_direction.json` consumed by landing-mvp / content-repurpose. |

---

## Overlays · 11 skills

Thin wrappers around upstream community skills, with Lumi Lab-specific Anti-Slop + platform constraints applied to their output. Phase 1 will deepen these.

| Skill | Wraps |
|---|---|
| `lumilab-coach-yc` | kit4some/office-hours + getagentseal/lean-startup |
| `lumilab-research-interview` | paperclipai/interview-script + phuryn/interview-script |
| `lumilab-research-icp` | openclaudia/icp-builder |
| `lumilab-research-competitor` | alirezarezvani/competitive-intel + alter123/idea-validator-zh |
| `lumilab-product-positioning` | alirezarezvani/product-discovery + product-strategist |
| `lumilab-product-pmf` | refoundai/measuring-pmf + omermetin/pmf |
| `lumilab-product-mvp` | jlengrand/slc-scope + shawnpang/mvp-scoping |
| `lumilab-copy` | johndoeblocks/copy-skill + shipshitdev/copy-validator |
| `lumilab-launch-strategy` | aitytech/launch-strategy + ognjengt/go-to-market |
| `lumilab-metrics` | wshobson/startup-metrics-framework (6.3K installs) |
| `lumilab-design-direction` (overlay layer) | Leonxlnx/taste-skill + pbakaus/impeccable |

---

## Knowledge · 1 skill

| Skill | Content |
|---|---|
| **`lumilab-playbook-cn`** | 13 Chinese-first methodology frameworks (Mom Test, Lean Canvas, Sean Ellis 40% PMF, Bob Moesta JTBD, April Dunford, Marc Lou's indie playbook, Lenny's product frameworks, Thariq's HTML effectiveness, etc.) + index into the 5 platform rule-sheets. |

## Added since v1.0 · 5 skills

| Skill | When | Purpose |
|---|---|---|
| **`lumilab-home`** | "open lumilab" / "where do I start" | Front-door dashboard: configured tools + every venture's pipeline progress + suggested next step. |
| **`lumilab-idea-to-landing`** | one-sentence idea in | Default orchestrator: auto-runs analysis → HTML report → direction gate → fake-door landing. Asks at most twice. |
| **`lumilab-next-actions`** | after retro / "what's next" | Decision engine: reads all venture data → R6 baselines → 2-4 multi-direction next-step candidates. Kanban + mindmap + print. |
| **`lumilab-payment-link`** | "test real willingness to pay" | Swaps fake-door CTA for a real Stripe checkout; `payment sync` reads back paid count/amount (de-identified) → strongest demand signal. |
| **`lumilab-research-keywords`** | "search volume / 红蓝海" | Reverse-searches Google demand: volume / CPC / difficulty / 12-mo trend / long-tail, scored Blue/Red Ocean. |

---

---

## State directory

Lumi Lab keeps **all state** in `~/.lumilab/`:

```
~/.lumilab/
├── config.json              user preferences + default password
├── secrets.json             tool tokens + venture passwords (chmod 600)
│                            (NEVER contains LLM API keys)
├── shares.json              deployed Studios manifest
└── ventures/<slug>/         per-venture artifacts
    ├── project_brief.md
    ├── hypotheses.yaml      atomic facts with supersede history
    ├── decisions.yaml       decision trail
    ├── audience.md / competitors.md / painpoints.md / ...
    ├── design_direction.json
    ├── landing_page.html + styles.css
    ├── content/{xhs,wechat,douyin,moments,x}.md
    ├── studio/index.html    rendered project journal
    └── deploy/              encrypted bundle + QR code
```

The state is local-only and survives across host sessions. No telemetry, no cloud.
