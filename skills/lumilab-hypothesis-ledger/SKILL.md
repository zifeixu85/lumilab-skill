---
name: lumilab-hypothesis-ledger
description: |
  Atomic hypothesis ledger for Lumi Lab. Track startup hypotheses as YAML facts with supersede history, confidence scoring, test methods, and verification counts. Generates HTML diff view when hypothesis evolves. Use when user wants to add/update/supersede/list hypotheses, when Research Agent finds evidence that contradicts a hypothesis, when Review Agent runs weekly retro, or when ven­ture decision needs traceable history.
  关键词：假设 / 假设管理 / hypothesis / ledger / 创业假设 / supersede / 复盘 / 验证 / Mom Test / lean startup / atomic fact
version: 1.4.1
metadata:
  hermes:
    tags: [hypothesis, atomic-fact, supersede, lean-startup]
  lumilab:
    tier: core
    requires_browser: false
    chat_only_ok: true
  category: foundation
  agent: review
  authors: [lumilab]
  upstream:
    - "para-memory-files (~/.claude/skills/para-memory-files)"
    - "obra/superpowers-skills/collaboration/remembering-conversations"
  outputs:
    - "data/ventures/<name>/hypotheses.yaml"
    - "data/ventures/<name>/studio/preview/hypothesis-diff.html (Thariq diff view)"
  reads:
    - "data/ventures/<name>/research/*.md (Research Agent 写入的证据)"
    - "data/ventures/<name>/decisions.yaml (相关决策)"
license: Apache-2.0
platforms: [macos, linux]
prerequisites:
  env_vars: []
  commands: [bun]
compatibility: "Claude Code, OpenClaw 2026.4.25+, Hermes Agent v0.13.0+, Cursor, Codex"
---

# Hypothesis Ledger — Venture 假设的原子事实账本

## 用途

每个 venture 的核心 **可证伪假设** 集合，按 atomic YAML facts 存储。这是 Lumi Lab 最重要的真理源，所有 Agent 都向它写 / 读。

## 何时调用

- 用户输入 `/lumilab new` 后 Founder Coach 阶段——生成 3 个最大假设
- Research Agent 找到证据后——更新 confidence / 触发 supersede
- 用户输入 `/lumilab review` 周复盘——给假设打分 + 决定继续/调整/放弃
- 用户问「我目前的假设是什么」「为什么这个假设变了」——读取展示
- Memory 周综合时——把 verified ≥3 的假设升格到 `resources/proven-hooks/`

## 核心 Schema

每条 fact 严格遵守：

```yaml
- id: h-001                    # h-NNN 递增编号，永不复用
  fact: "[一句话陈述，可证伪]"
  category: assumption          # assumption | observation | decision | preference
  confidence: medium            # high | medium | low
  test_method: "[具体测试方法]"
  test_status: pending          # pending | running | passed | failed
  evidence:                     # Research / 用户回收数据写入
    - source: "URL or file path"
      excerpt: "关键引文"
      timestamp: "ISO-8601"
  status: active                # active | superseded
  superseded_by: null           # 指向新 fact 的 id
  superseded_reason: null
  created_at: "ISO-8601"
  updated_at: "ISO-8601"
  related_entities: []          # memory/resources/ 或 memory/areas/ 路径
  last_accessed: "YYYY-MM-DD"
  access_count: 0
  verification_count: 0         # ≥3 升格到 resources/proven-hooks
```

## 核心操作

### Op 1: Add（新增假设）

```yaml
# 用户给 idea，Founder Coach 输出 3 个最大假设。每个：
- id: h-{next_id}
  fact: "[fact]"
  category: assumption
  confidence: {high|medium|low}     # 初始用户主观判断
  test_method: "[基于方法论 - Mom Test / A/B / 调研]"
  test_status: pending
  created_at: now()
  status: active
  # ... 其他字段默认
```

**规则**：
- `fact` 必须可证伪（不能是「我觉得用户会喜欢」，要是「48h 内 ≥5 条评论提及 X 痛点」）
- 一个 venture 通常 3-5 条 active 假设，超过 10 条说明 idea 没收敛
- `test_method` 必须具体（含触达样本数 / 阈值）

### Op 2: Add Evidence（追加证据）

不修改 fact 本身，只在 `evidence[]` 追加：

```yaml
evidence:
  - source: "research/xhs_findings.md"
    excerpt: "8/12 评论说「质量 > 数量」"
    timestamp: "2026-05-13T14:30:00Z"
```

证据足够后，可以更新 `confidence`。

### Op 3: Verify（验证通过）

```yaml
test_status: passed
verification_count: {previous + 1}
confidence: high                  # 通过即升级
```

**当 verification_count ≥ 3**：
- 自动 surface 给用户："这条假设已被 3 次独立验证，建议升格到 resources/proven-hooks/"
- 用户确认后写入 `memory/resources/proven-hooks/<topic>.md`

### Op 4: Supersede（推翻 + 新增）

**永不删除**。流程：

1. 旧 fact：`status: superseded` + `superseded_by: h-{new_id}` + `superseded_reason: "..."`  
2. 新 fact：完整新条目，`related_entities` 包含旧 fact id
3. 同时写 `decisions.yaml` 记录推翻决策（type: user_challenge）
4. **触发 diff view 生成**（见下节）

### Op 5: List / Read

按需 lazy load：
- 用户问「目前的假设」→ 只读 active + 高 confidence
- 用户问「为什么 X 假设变了」→ 读 h-{old} + h-{new} + 调 diff view
- 周复盘 → 读所有 active + 最近 7d superseded

## ★ Diff View（Thariq 加强项）

每次 supersede 时，生成 `studio/preview/hypothesis-diff.html`，把旧/新对比给用户看（spatial information, not flattened text）。

### 生成时机

任何 `supersede` 操作后自动调用 `lumilab-studio` 的渲染脚本，更新 diff view 区块。

### Diff View HTML 结构

```html
<div class="diff-view" data-pair="h-001→h-004">
  <header>
    <h2>Hypothesis Evolution</h2>
    <p class="timestamp">2026-05-13T18:30:00Z</p>
    <p class="reason">{{superseded_reason}}</p>
  </header>

  <div class="diff-pair">
    <article class="diff-old">
      <h3>h-001 <span class="badge failed">SUPERSEDED</span></h3>
      <p class="fact">{{old.fact}}</p>
      <dl>
        <dt>Confidence</dt><dd class="medium">{{old.confidence}}</dd>
        <dt>Test method</dt><dd>{{old.test_method}}</dd>
        <dt>Evidence</dt><dd>{{old.evidence.length}} 条</dd>
      </dl>
    </article>

    <article class="diff-new">
      <h3>h-004 <span class="badge active">ACTIVE</span></h3>
      <p class="fact">{{new.fact}}</p>
      <dl>
        <dt>Confidence</dt><dd class="strong">{{new.confidence}}</dd>
        <dt>Test method</dt><dd>{{new.test_method}}</dd>
        <dt>Evidence</dt><dd>{{new.evidence.length}} 条</dd>
      </dl>
    </article>
  </div>

  <details class="diff-narrative">
    <summary>Why this changed</summary>
    <p>{{superseded_reason}}</p>
    <h4>Triggering evidence</h4>
    <ul>{{evidence_that_caused_pivot}}</ul>
    <h4>Related decision</h4>
    <p>{{linked_decision_from_decisions.yaml}}</p>
  </details>
</div>
```

### CSS 风格

- 左右并排（grid-template-columns: 1fr 1fr）
- 旧版灰度处理 + 删除线 + `opacity: 0.6`
- 新版主色 + 强调
- 中间 `→` 箭头 SVG

实现见 `lumilab-studio/templates/hypothesis-diff.html.tpl`。

## 决策时间线（与 decisions.yaml 联动）

每次 supersede 必同时写一条 `decisions.yaml`：

```yaml
- id: d-{next}
  decision: "Supersede h-001 → h-004"
  rationale: "{{detailed_reason}}"
  by: user                      # 因为是 user_challenge 类型
  type: user_challenge
  at: now()
  related:
    - hypothesis: h-001
    - hypothesis: h-004
    - evidence: research/xhs_findings.md
```

## 必做约束（Self-Check）

每次操作 hypotheses.yaml 前后：

```
✓ fact 是否可证伪（含具体阈值 / 触达数）
✓ test_method 是否具体可执行
✓ supersede 时旧 fact 没被删（status 变 superseded 即可）
✓ supersede 时同步写了 decisions.yaml
✓ supersede 时触发了 diff view 重渲染
✓ 当前 active 假设数 ≤ 10（超过提示用户收敛）
✓ 三层 Memory 引用更新（related_entities）
```

## 跨 runtime user-input 协议

```yaml
user_input:
  - mode: terminal
    method: "AskUserQuestion (确认 supersede)"
    method: "stdin (verify count++ 时只通知不询问)"
  - mode: browser
    method: "studio/decisions/02-clarify-hypotheses.html POST"
    method: "studio/decisions/08-weekly-retro.html 中的 supersede 按钮"
```

## Anti-Slop

- ❌ fact 写「用户会喜欢这个产品」→ ✅ 「48h 内 ≥5 条评论提及 X」
- ❌ test_method 写「调研一下」→ ✅ 「Mom Test 访谈 10 个变现期博主，≥3 个自然提及」
- ❌ 用「重要」「关键」「核心」泛词
- ❌ 一条 fact 包含多个独立陈述（atomic 即一事一条）

## 引用

- 上游：`para-memory-files` 的 PARA 三层模型 + atomic YAML schema
- 配套：`lumilab-studio` 渲染 diff view + 时间线
- 配套：`lumilab-founder-coach`（Layer 1 生成初始假设）
- 配套：`lumilab-research-platforms`（产出 evidence 喂回）

## 分支决策

| 条件 | 动作 |
|---|---|
| 用户给 idea 但无 active 假设 | 走 Op 1 Add，生成 3 条最大假设 |
| Research Agent 写入 evidence 且与某 fact 矛盾 | 走 Op 4 Supersede（旧 fact status→superseded），不改旧 fact 文字 |
| Research Agent 写入 evidence 且支持某 fact | 走 Op 2 Add Evidence，证据足够再升 confidence |
| `verification_count` 达到 3 | surface 用户，确认后升格到 `resources/proven-hooks/` |
| active 假设数 > 10 | 不再 Add，提示用户先收敛 idea |
| 用户问「为什么 X 假设变了」 | 走 Op 5 Read，读 h-old + h-new + 调 diff view |

## Dependencies

| 依赖 | 类型 | 是否付费 | 单次调用成本 | 说明 |
|---|---|---|---|---|
| bun | CLI runtime | 免费 | free（本地执行） | ≥1.0，必需 |
| host LLM | 由 Claude Code / OpenClaw / Cursor / Hermes 提供 | 取决于宿主 | ~2-5K tokens / 次操作 | Lumi Lab 本身不直连 LLM，复用宿主 |

## Output validation

`scripts/validate-output.ts`（bun，确定性校验）检查 `hypotheses.yaml`：每条 fact 的 `id` 匹配 `h-NNN` 且唯一、`confidence ∈ {high,medium,low}`、`status ∈ {active,superseded}`、`evidence[]` 非空、`superseded_by` 指向存在的 id（无孤儿）、supersede 链无回环。

```bash
bun run scripts/validate-output.ts data/ventures/<slug>/   # exit 0 = valid, 1 = invalid
bun run scripts/validate-output.ts --help
```

每次 supersede 操作后应跑一遍，确保链完整。

校验字段:
- `hypotheses.yaml` → `[].id`: string（必须匹配 `h-NNN`，全局唯一）
- `hypotheses.yaml` → `[].confidence`: enum（`high` | `medium` | `low`）
- `hypotheses.yaml` → `[].status`: enum（`active` | `superseded`）
- `hypotheses.yaml` → `[].evidence`: list（非空）
- `hypotheses.yaml` → `[].superseded_by`: string（可空；非空时必须指向存在的 id，链无回环，且 `status` 必须为 `superseded`）

## Outputs

- `data/ventures/<slug>/hypotheses.yaml`（atomic facts，含 supersede 链）
- `data/ventures/<slug>/studio/preview/hypothesis-diff.html`（supersede 时生成的 Thariq diff view）

## Example

`@bot 添加假设：「目标用户每周愿意为模板付 50 元」` → ledger 自动分配 id + 写 YAML。后续 supersede 时旧条目保留 `status: superseded` + `superseded_by: h-004`。

## Tests

`tests/smoke.md` — 该 skill 的最小冒烟测试约定：让 host LLM 在对话中跑通 SKILL.md「真实示例」段即视为通过。E2E 真集成见 `docs/TUTORIAL.zh.md`。

## Idempotency

YAML 追加为主：新建假设分配 `h-<n+1>`；supersede 时旧条目保留 `status: superseded` + `superseded_by: h-X`，**绝不删除**。同一 idea 重跑生成的 id 严格递增，可重放完整证据链。

## Privacy

纯本地 YAML 操作，零外部网络。无遥测。`evidence:` 字段允许引用 `research/*.json` 但不上传原始访谈录音。

## Cache

YAML 是确定性输入，按文件 mtime 缓存。Studio 渲染时读 ledger 后生成的 HTML 缓存到 `studio/index.html`，ledger 改了才重渲。

## Failure modes

若 supersede 指向不存在的 id → 直接报错（防孤儿）；若 confidence 非 0–100 → 拒写；若同时存在 active + superseded 同 id → 报 conflict。

## Edge cases

supersede 不能链式回环（A→B→A 检测拒绝）；evidence 数组要求 ≥ 1 条非空字符串；conf < 30 的假设在 Studio 渲染为虚化样式提示用户。

## Alternatives

用户现在可能用什么替代方案，以及 Lumi Lab 为什么不一样：

- **Notion / Airtable 假设表**：能记录但不强制 atomic、不防误删、没有 supersede 链。
- **脑子里记 / 备忘录**：假设会被悄悄改写，自我验证而不自知。
- **通用 LLM 帮你列假设**：每次重新生成，上一轮的证据链丢失。

Lumi Lab 的差异：每个假设是带 `id` / `confidence` / `evidence` / supersede 历史的 atomic YAML，pivot 时旧假设保留 `status: superseded`，Studio 渲染 diff。

## Moat（复利护城河）

复利在证据链：跑得越久，ledger 里 superseded 链越长，你能回放"为什么当初放弃这个方向"。新 venture 可以 grep 历史 ledger 找"我是不是又在犯同一个假设错误"。删了就什么都没有，留着就是你的判断力数据库。

## Changelog

- **1.0.0-rc1** — 加 `## Changelog` / `scripts/package.json` / `校验字段:` 显式 schema 声明；Dependencies 表补单次调用成本列。
- **0.3.0** — `validate-output.ts` 加 supersede 链孤儿检测 + 回环检测；`anti-slop-lint.ts` 接入。
- **0.2.0** — 补 `## 分支决策` if-then 表、`status: superseded` 软删除、Studio diff view。
- **0.1.0-p0** — 初版：atomic YAML 假设（`id` / `confidence` / `evidence`）+ supersede 历史链。

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
