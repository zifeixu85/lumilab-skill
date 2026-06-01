# Lumi Lab · Architecture

> Technical architecture for the **1.14.0** skills bundle. For the skill-by-skill index, see [`SKILLS.md`](SKILLS.md).

---

## 1. Topology

```
                      ┌───────────────────────────┐
                      │  Host AI environment       │
                      │  Claude Code / OpenClaw /  │
                      │  Cursor / Codex / Hermes / │
                      │  Gemini CLI                │
                      │  (provides the LLM)        │
                      └───────────────┬───────────┘
                                      │ reads
                                      ▼
                  ~/.claude/skills/lumilab-*/
                  ┌────────────────────────────────────────┐
                  │  26 skills, each = SKILL.md + scripts/ │
                  └─────────────┬──────────────────────────┘
                                │ writes / reads
                                ▼
                       ~/.lumilab/
                       ┌─────────────────────────────────┐
                       │  config.json                    │
                       │  secrets.json (chmod 600)       │
                       │  shares.json                    │
                       │  ventures/<slug>/...            │
                       └─────────────────────────────────┘
                                │
                                ▼
              ┌──────────────────────────────────────┐
              │  ↓ `lumilab` CLI invokes scripts/    │
              │  ↓ Browser UIs (config / manage /    │
              │    design-direction) on localhost    │
              │  ↓ Studio HTML rendered locally      │
              │  ↓ Cloudflare Pages deploys          │
              │    (with client-side encryption)     │
              └──────────────────────────────────────┘
```

**Key design choice**: Lumi Lab is **not an Agent product** — it's a skills bundle. The host AI environment provides the LLM. Lumi Lab provides structured procedures, state, and tool integrations.

---

## 2. Skill anatomy

Every skill follows the same structure:

```
skills/lumilab-<name>/
├── SKILL.md                   ← the host LLM reads this
├── scripts/                   ← optional: bun/node scripts
│   └── <name>.ts
├── references/                ← optional: reference docs the LLM loads when needed
│   └── <topic>.md
├── templates/                 ← optional: HTML/Markdown templates
└── examples/                  ← optional: worked examples
```

The host LLM:
1. Discovers skills by scanning `~/.claude/skills/` (or equivalent path for the host)
2. Reads `SKILL.md` of the skill that matches user intent
3. Follows the instructions, calling `scripts/` if needed (via `bun run …`)
4. Reads/writes files in `~/.lumilab/`

---

## 3. State layout

```
~/.lumilab/
├── config.json          { user, deploy, search, … }   (preferences only)
├── secrets.json         { cloudflare_api_token, tavily_api_key, … }   (NEVER LLM keys)
├── shares.json          { shares: [ { venture, url, password_ref, … } ] }
└── ventures/
    └── <venture-slug>/
        ├── project_brief.md            single source of truth
        ├── hypotheses.yaml             atomic facts (never delete; supersede)
        ├── decisions.yaml              decision trail
        ├── audience.md / icp.md
        ├── competitors.md / painpoints.md / market_research.md
        ├── product_definition.md / mvp_scope.md / pricing_hypothesis.md
        ├── design_direction.json       4 preset + 3 dials + palette
        ├── landing_page.html + styles.css + image_catalog.md
        ├── content/{xhs,wechat,douyin,moments,x}.md
        ├── growth_sop.md + content_calendar.md + validation_metrics.csv
        ├── review_report.md
        ├── studio/index.html           rendered project journal (editorial)
        └── deploy/
            ├── encrypted-bundle/       AES-GCM-wrapped Studio
            ├── deploy-status.json
            └── qr.png
```

**Memory is just files.** No database. No proprietary format. Everything is `.md` / `.yaml` / `.json` / `.csv` / `.html`.

---

## 4. Atomic hypothesis ledger

Every hypothesis is a YAML record with a stable `id`. Never deleted — only superseded.

```yaml
- id: h-001
  fact: "OPC users find the largest pain in 'too many skills, no orchestration'"
  category: assumption
  confidence: medium
  test_method: "Mom Test interview 10 OPCs; ≥3 mention it unprompted"
  test_status: passed
  evidence:
    - source: "research/xhs_findings.md"
      excerpt: "5/5 interviewees described 'I have skills but don't know which to use first'"
      timestamp: "2026-05-13T08:00:00Z"
  status: superseded
  superseded_by: h-004
  superseded_reason: "Deeper pain is 'don't know how to compose them', not 'can't find them'"
  related_entities: []
  verification_count: 2
```

When supersede happens:
- old fact keeps `status: superseded` and points forward
- new fact is created with related_entities pointing back
- Studio renders both side-by-side with diff strikethrough

This gives a **fully auditable decision trail**: anyone reading the venture in 3 months can see why every choice was made and what was rejected.

---

## 5. Client-side encrypted deploys

`lumilab deploy <venture>` runs:

```
1. Read studio/index.html (single self-contained HTML)
2. Generate 16B salt + 12B IV
3. Derive AES-GCM-256 key via PBKDF2-SHA256 (1,000,000 iterations) from password
4. Encrypt the HTML
5. Wrap ciphertext (base64) in a static password-gate HTML
6. wrangler pages deploy → Cloudflare Pages
7. Save password + URL to ~/.lumilab/{secrets,shares}.json
```

The deployed page:
- pure static — no server logic
- visitor enters password → browser's Web Crypto API decrypts → `document.write` renders
- localStorage caches the unlocked state ("Remember on this device" — defaults to on)
- rotating the password rotates the salt → cache automatically invalidates

**Cloudflare cannot read the content.** Even with full database access, they only see ciphertext + salt + IV.

---

## 6. 5-platform content rules

Five Chinese platforms each have a rule-sheet in `skills/lumilab-content-repurpose/references/platform-rules/`:

| Platform | File | Hard rules (excerpt) |
|---|---|---|
| 小红书 | `xiaohongshu.md` | title ≤ 38 chars (中文×2, 英文/数字×1); must have image; no inline links |
| 微信公众号 | `wechat-mp.md` | title ≤ 22 chars; cover 2.35:1; convert outbound links to footer references |
| 抖音 | `douyin.md` | first-3-sec hook required; vertical 9:16; title ≤ 14 chars |
| 朋友圈 | `wechat-moments.md` | ≤ 6 lines; no inline links; ≤ 9 images |
| X (Twitter) | `x-twitter.md` | first tweet ≤ 280 chars; thread 2-7 posts; ≤ 2 hashtags |

The Content Repurpose skill reads the relevant rule-sheet **before** generating anything. No "LLM-推断" — written-down rules win.

---

## 7. Cross-runtime user-input

Skills that need browser UI (Wizard, Manager, Design Direction) embed an explicit protocol:

```yaml
user_input:
  - mode: browser
    method: "localhost:7777/* HTML POST"
  - mode: terminal (fallback)
    method: "stdin if browser unavailable"
```

The script spawns a bun HTTP server bound to **127.0.0.1 only**, never `0.0.0.0`. Port fallback 7777 → 7778 → 7779 → 7780 on conflict. Browser auto-opens. Server self-shuts down on completion via `POST /api/done`.

---

## 8. Anti-Slop ruleset

Three-source merged ruleset applied to all visual output:

**Typography**:
- ❌ Inter / Roboto / Arial / Open Sans
- ✅ Fraunces (Studio — editorial) / JetBrains Mono / Geist (utility UIs — Wizard / Manager / Direction)

**Color**:
- ❌ `#000` / `#fff` / purple-blue gradients
- ✅ OKLCH with `chroma 0.005–0.018` — warm paper bg, deep ink fg, single ox-blood accent

**Layout**:
- ❌ centered hero + 3-column-card grid
- ✅ Studio: asymmetric magazine grids; utility UIs: hairline forms + dense tables + functional grids

**Code**:
- ❌ `h-screen` / animating `top/left/width/height`
- ✅ `min-h-[100dvh]` / animating `transform/opacity` only

**Two visual systems**:
- **Editorial** (Studio): Fraunces + JetBrains Mono + warm paper + magazine layout — for the human reading their project
- **Utility** (Wizard / Manager / Design Direction): Geist + JetBrains Mono + same warm bg + dashboard layout — for filling forms + scanning data

---

## 9. Memory tiers (PARA-inspired)

```
Tier 1   ventures/<slug>/         Active project artifacts
Tier 2   areas/                   Long-term areas of responsibility (P1)
Tier 3   resources/               Reusable references (P1)
Tier 4   archives/                Completed/abandoned ventures (P1)
```

This release ships Tier 1 fully. Tier 2–4 land later with a knowledge-graph layer (MCP-compatible) for cross-venture pattern extraction.

---

## 10. Roadmap

| Phase | Window | What lands |
|---|---|---|
| **Now** (v1.14.0) | shipped | 26 skills · CLI · Studio · 3 browser UIs · encrypted deploys · 5 platform rules · self-referencing demo |
| **Next** | planned | Real keychain · 5 more interactive pages · XHS Playwright + Tavily actual integration · Stripe / Resend / PostHog · cross-venture portfolio · MCP memory graph · multi-account workspaces |
| **Later** | planned | Pro tier · service-provider tier · white-label · Cloudflare Workers edge · DNS auto-config · GDPR exports |

---

## License

AGPL-3.0（源码可见 + 强 copyleft），见 [`../LICENSE`](../LICENSE)。闭源 / 商业授权（dual-license）联系 ameng@ameng.blog。
