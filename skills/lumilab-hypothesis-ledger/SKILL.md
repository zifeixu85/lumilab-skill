---
name: lumilab-hypothesis-ledger
description: |
  Atomic hypothesis ledger for Lumi Lab. Track startup hypotheses as YAML facts with supersede history, confidence scoring, test methods, and verification counts. Generates HTML diff view when hypothesis evolves. Use when user wants to add/update/supersede/list hypotheses, when Research Agent finds evidence that contradicts a hypothesis, when Review Agent runs weekly retro, or when ven­ture decision needs traceable history.
  关键词：假设 / 假设管理 / hypothesis / ledger / 创业假设 / supersede / 复盘 / 验证 / Mom Test / lean startup / atomic fact
version: 1.0.0-rc1
metadata:
  hermes:
    tags: [hypothesis, atomic-fact, supersede, lean-startup]
  lumilab:
    tier: core
    requires_browser: false
    chat_only_ok: true
  category: foundation
  agent: review
  authors: [vst-team]
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

每个 venture 的核心 **可证伪假设** 集合，按 atomic YAML facts 存储。这是 VST 最重要的真理源，所有 Agent 都向它写 / 读。

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

## Dependencies

| 依赖 | 类型 | 是否付费 | 说明 |
|---|---|---|---|
| bun | CLI runtime | 免费 | ≥1.0，必需 |
| host LLM | 由 Claude Code / OpenClaw / Cursor / Hermes 提供 | 取决于宿主 | Lumi Lab 本身不直连 LLM，复用宿主 |

## Outputs

`data/ventures/<slug>/hypotheses.yaml`（atomic facts，含 supersede 链）

## Example

`@bot 添加假设：「目标用户每周愿意为模板付 50 元」` → ledger 自动分配 id + 写 YAML。后续 supersede 时旧条目保留 `status: superseded` + `superseded_by: h-004`。

## Tests

`tests/smoke.md` — 该 skill 的最小冒烟测试约定：让 host LLM 在对话中跑通 SKILL.md「真实示例」段即视为通过。E2E 真集成见 `docs/TUTORIAL.zh.md`。
