---
name: lumilab-product-mvp
description: |
  MVP = riskiest-assumption test, not minimum viable feature. Marty Cagan + Eric Ries lineage. Concierge / Wizard-of-Oz / fake door / smoke test / explainer video patterns. Lumi-Lab Chinese overlay with platform-aware fake-door scripts.
  关键词：MVP / riskiest assumption / concierge / Wizard of Oz / fake door / smoke test / explainer video
version: 1.0.0-rc1
metadata:
  hermes:
    tags: [mvp, marty-cagan, riskiest-assumption, concierge, wizard-of-oz]
  lumilab:
    tier: overlay
    requires_browser: false
    chat_only_ok: true
  category: agent
  agent: product
  upstream:
    - "jlengrand/slc-scope + shawnpang/mvp-scoping"
    - "Marty Cagan《Inspired》— prototype types"
    - "Eric Ries《The Lean Startup》"
    - "Rob Fitzpatrick《The Mom Test》"
    - "Dropbox MVP（explainer video）"
    - "Zappos MVP（concierge）"
  status: P0-overlay
  outputs:
    - "data/ventures/<name>/mvp_plan.md"
    - "data/ventures/<name>/riskiest_assumptions.yaml"
    - "data/ventures/<name>/mvp_test_<id>.md"
  reads:
    - "data/ventures/<name>/hypotheses.yaml"
    - "data/ventures/<name>/audience.md"
    - "data/ventures/<name>/positioning.md"
license: Apache-2.0
platforms: [macos, linux]
prerequisites:
  env_vars: []
  commands: [bun]
compatibility: "Claude Code, OpenClaw 2026.4.25+, Hermes Agent v0.13.0+, Cursor, Codex"
---

# product-mvp — VST Overlay

## 用途

**MVP 不是「砍掉一半 feature 的产品」**。MVP 是「为了验证最高风险的假设，能做出的最小实验」。

很多独立开发者死在这一步：花 3 个月把"MVP"做到 70% 完成度才发布，结果发现核心假设是错的。这个 skill 帮你提前 8 周发现这件事。

## 何时调用

**触发**：
- 用户说「我准备开始写代码 / 做 MVP」
- 用户列出 10+ features 要在 v1 做
- 用户已经写了 2 周代码但还没拿过用户反馈
- founder-coach Layer 1 / lumilab-product-positioning 后 chain 过来
- 用户问「Concierge MVP / Wizard of Oz 怎么做」

**不要调用**：
- 还没 audience.md 和 positioning.md → 回去做这两步
- 用户已经有 ≥ 40 个活跃用户 → 用 lumilab-product-pmf
- 用户只是想 ship 一个完整产品 → 用 lumilab-launch-strategy

## 方法论核心

### MVP 真正的定义

> "The minimum viable product is that version of a new product which allows a team to collect the maximum amount of validated learning about customers with the least effort."
> — Eric Ries

关键词：**learning**，不是 product。

### Marty Cagan 的 4 类 risk

每个 product idea 有 4 类风险，MVP 是去测**最大那个**：

```
1. Value risk     —— 用户会用吗 / 会付钱吗？
2. Usability risk —— 用户能用得明白吗？
3. Feasibility risk —— 我能做出来吗？
4. Business risk  —— 公司能挣到钱吗？
```

**90% 独立开发者最大的 risk 是 #1（value）。** 他们却花时间在 #3（feasibility）。

### MVP 的 6 种形态

| 类型 | 测什么 | 工时 | 例子 |
|---|---|---|---|
| **Smoke test / Fake door** | 有没有人点 | 2-4h | "立即购买" 按钮 → 显示 "敬请期待 + 留邮箱" |
| **Landing page MVP** | 谁会留邮箱 | 4-8h | hero + CTA + Plausible |
| **Explainer video** | 概念有没有共鸣 | 4-12h | Dropbox 2009 那条视频 |
| **Concierge MVP** | 用户真的会做工作流吗 | 2-3 周 | Zappos 创始人手工买鞋寄货 |
| **Wizard of Oz** | 用户会用「假装是机器人」的服务吗 | 2-4 周 | 后端是人工，前端看起来是 AI |
| **Single-feature MVP** | 单个核心 feature 留人吗 | 4-6 周 | Buffer 第一版只能发推 |

**选择规则**：能用前 3 种就别用后 3 种。

### 反 "再加一个 feature" 陷阱

每次用户说 "再加一个 feature MVP 就完整了"，问：
1. 这个 feature 解决的是哪条 hypothesis？
2. 这条 hypothesis 是不是 riskiest？
3. 不做这个 feature，MVP 还能测核心 hypothesis 吗？

如果 2 = No 或 3 = Yes → 砍。

## 工作流程

### Step 1 · 列假设并排 risk

读 hypotheses.yaml。如果还没立项，先建：

```
Q: 你这个产品要成立，必须有哪些事情是真的？至少 5 条。

例：
- h-001 目标用户每周至少花 2h 写小红书标题
- h-002 他们愿意为打分工具付 ¥39/月
- h-003 他们会用 AI 给的建议（不是必须人工）
- h-004 我们能拿到限流词库
- h-005 小红书不会封我们的 API 调用
```

让用户对每条打 risk score：

```
For each hypothesis:
  Likelihood it's WRONG: 1-5
  Impact if WRONG:       1-5
  Risk score = L × I
  
Top risk score = riskiest assumption = MVP 要测的
```

### Step 2 · 选 MVP 形态

```
Q: 你最高风险的假设是 h-002（用户愿意付 ¥39/月）。
   测这个最便宜的方法：

   ○ Fake door (4h): landing page + "立即订阅" → 收集 emails，看转化率
   ○ Smoke test (8h): 收 ¥1 占位预付款，可退
   ○ Concierge (2 周): 人工帮 10 个目标用户做标题打分，看他们愿不愿意续费
   ○ Single feature (6 周): 做最薄的产品收订阅

   推荐：Fake door。除非你想 4h 内就被打脸。
```

### Step 3 · 设 success criteria（**前置**写下来）

⚠️ MVP 最常见错误：跑完才决定算不算成功。

```
Q: 跑这个 MVP 之前，你认为：
   - 多少 % 落地用户点 CTA = success？（建议 ≥ 5%）
   - 多少 留邮箱 / 总点击 = success？（建议 ≥ 25%）
   - 多少 邮箱说愿意付费 = success？（建议 ≥ 30%）
   
   写下来。跑完按这个判，不许中途调。
```

### Step 4 · Build

把 MVP 拆 ≤ 1 周的任务。Single-feature MVP > 1 周 → 砍 feature 不是延期。

### Step 5 · Run + Measure

跑 ≥ 7 天 + ≥ 200 流量（landing） or ≥ 10 用户（concierge）。

### Step 6 · Decide

```
按 Step 3 criteria 判：
- 全 pass → h-X verified，去下个 riskiest assumption
- 部分 pass → 细看哪段断（流量、转化、付费）
- fail → 进 lumilab-founder-coach pivot vs persevere
```

## 真实示例

**Venture**: TitleHero · Day 12

**Hypotheses + risk score**:

| id | hypothesis | L | I | risk |
|---|---|---|---|---|
| h-001 | 腰部博主每周花 ≥2h 写标题 | 2 | 3 | 6 |
| h-002 | 他们愿付 ¥39/月 | **5** | **5** | **25** |
| h-003 | AI 标题质量够高 | 3 | 4 | 12 |
| h-004 | 我们能爬限流词 | 2 | 3 | 6 |

**Riskiest = h-002**（这是 value risk）。

**MVP 形态选**：Fake door + smoke test
- Landing page，hero = positioning_statement
- CTA = "立即解锁 7 天试用 ¥9"（真扣钱、可退）
- 跑 14 天

**Success criteria（前置）**：
- 流量 ≥ 300（小红书 + 微信群分发）
- 点 CTA 率 ≥ 8%
- 完成 ¥9 试用支付率 ≥ 25%（点了的人里）
- 即：≥ 6 人付费 = h-002 verified

**Build**: 6h（Vercel + Stripe Payment Link + Plausible）

**Run 14 天**:
- 流量 412
- 点 CTA 47 = 11.4% ✓
- 完成支付 14 = 29.8% ✓
- 12 人填了 "为什么愿意付" 问卷 → 9 人提到「限流」

**Decision**: h-002 verified。下一个 riskiest = h-003（AI 质量）→ 做 single-feature MVP。

**关键**: 没有花 6 周写完整产品。14 天 + ¥0 营销预算就锁了核心 hypothesis。

## 输出 schema

`data/ventures/<name>/mvp_plan.md`:

```markdown
# MVP Plan · TitleHero

## Riskiest assumption
h-002: 腰部博主愿付 ¥39/月

## MVP type
Fake door + smoke test (¥9 / 7 天试用)

## Build scope
- [ ] Landing page (hero + 3 feature + CTA + footer)
- [ ] Stripe Payment Link
- [ ] Plausible analytics
- [ ] "为什么愿付" 问卷（Tally）

## Success criteria（前置）
- Traffic ≥ 300
- CTA CTR ≥ 8%
- ¥9 payment completion ≥ 25%
- ≥ 6 people paid

## Timeline
Build: 1 day
Run: 14 days
Decide: Day 15

## Linked hypotheses
- h-002 (PRIMARY)
- h-001 (secondary, will surface in survey)

## Decision tree
- All pass → MVP-2 测 h-003
- CTR pass, payment fail → 价格 / 价值表达问题，回 positioning
- CTR fail → audience 错 / hero copy 错，回 audience.md
```

`riskiest_assumptions.yaml`:

```yaml
ranked:
  - id: h-002
    text: "腰部博主愿付 ¥39/月"
    likelihood_wrong: 5
    impact_wrong: 5
    risk_score: 25
    test: "mvp_test_001"
    status: pending
  - id: h-003
    text: "AI 标题质量够高"
    likelihood_wrong: 3
    impact_wrong: 4
    risk_score: 12
    test: null
    status: queued
```

## 反 Slop 自检

- [ ] MVP 测的是 #1 风险，不是顺手做的
- [ ] Success criteria **跑之前**写下并签名
- [ ] 没有「再加一个 feature 就完整」陷阱
- [ ] 工期 ≤ 2 周（≥ 2 周一定是 over-built）
- [ ] 用 fake door / smoke 能测的不去做 concierge
- [ ] 没出现：赋能 / 闭环 / 心智 / 链路 / 用户画像

## Chat-only fallback

```
飞书 chat 里：
1. VST 让用户口头列 hypotheses + 打分 → chat 表格
2. 推荐 MVP 类型 + success criteria → chat
3. 让用户口头 commit 不许中途改
4. Run 期间用户每天发 1 条 "today's number" 进 chat → VST 追踪
5. Day-15 chat 出 decision report
```

## VST 上下文叠加

- **产物路径**：data/ventures/<name>/mvp_*
- **下游路由**：
  - MVP 通过 → lumilab-product-pmf（拉用户测 PMF）
  - MVP 通过部分 → 本 skill MVP-2
  - MVP failed → lumilab-founder-coach Layer 3 (pivot decision)
- **关联记忆**：MVP pattern 沉淀到 memory/resources/mvp-patterns/
- **平台约束**：landing 投放小红书 / 视频号时读 platform-rules，避免封号

## 必做约束

```
✓ 选 MVP 形态前必排 risk
✓ Success criteria 前置签字
✓ 工期硬上限 2 周
✓ 不许跑完才补 criteria
✓ Fake door / smoke 优先于 build
✓ failed MVP surface 给 founder-coach
```

## 引用

- Eric Ries《The Lean Startup》(2011)
- Marty Cagan《Inspired》(2017, 2nd ed)
- Rob Fitzpatrick《The Mom Test》(2013)
- "How DHH and 37signals ship": single-feature first
- Dropbox MVP（explainer video，2008）/ Zappos MVP（concierge，1999）
- 上游：jlengrand/slc-scope + shawnpang/mvp-scoping
- 配套：lumilab-founder-coach / lumilab-product-positioning / lumilab-product-pmf / lumilab-landing-mvp

## Dependencies

| 依赖 | 类型 | 是否付费 | 说明 |
|---|---|---|---|
| bun | CLI runtime | 免费 | ≥1.0，必需 |
| host LLM | 由 Claude Code / OpenClaw / Cursor / Hermes 提供 | 取决于宿主 | Lumi Lab 本身不直连 LLM，复用宿主 |

## Outputs

`data/ventures/<slug>/mvp_plan.md`（riskiest assumption test）

## Example

见 SKILL.md「真实示例」段

## Tests

`tests/smoke.md` — 该 skill 的最小冒烟测试约定：让 host LLM 在对话中跑通 SKILL.md「真实示例」段即视为通过。E2E 真集成见 `docs/TUTORIAL.zh.md`。

## Idempotency

riskiest assumption test 列表用增量写入，已验证的标 `[validated]`/`[invalidated]` 不删除。

## Privacy

fake door / smoke test 若上线，URL 由用户主动 lumilab-deploy 才发生。

## Cache

5 种 MVP 类型模板（concierge / wizard / fake-door / smoke / explainer）常量。

## Failure modes

若 "我们再加一个 feature" 类型回答 → 拒绝写 MVP plan，回到 riskiest assumption。

## Edge cases

concierge 至少 5 个真用户；fake door 转化率 < 2% 视为 invalidated；explainer 视频不计入"真用户行为"。

## Alternatives

用户现在可能用什么替代方案，以及 Lumi Lab 为什么不一样：

- **通用 LLM「我的 MVP 应该有什么功能」**：会列功能清单，强化"再加一个 feature"陷阱。
- **No-code 工具**：能快速做但不帮你想"什么是最该验证的假设"。

Lumi Lab 的差异：Marty Cagan riskiest-assumption test + 5 种 MVP 类型（concierge / wizard / fake-door / smoke / explainer），拒绝功能堆砌。

## Moat（复利护城河）

riskiest assumption 列表带 `[validated]` / `[invalidated]` 状态累积，你能回放"我验证过哪些假设、哪些被推翻"。
