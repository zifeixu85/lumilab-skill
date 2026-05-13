---
name: lumilab-product-pmf
description: |
  PMF measurement & engine. Sean Ellis 40% Survey + Rahul Vohra Superhuman PMF engine + Brian Balfour 4-fit. Lumi-Lab overlay with Chinese-first instrumentation and Anti-Slop.
  关键词：product-market-fit / PMF / Sean Ellis 40% / Superhuman engine / 4-fit / retention curve
version: 1.0.0-rc1
metadata:
  hermes:
    tags: [pmf, sean-ellis, superhuman, balfour-4-fit]
  lumilab:
    tier: overlay
    requires_browser: false
    chat_only_ok: true
  category: agent
  agent: product
  upstream:
    - "refoundai/measuring-pmf + omermetin/pmf"
    - "Sean Ellis《Hacking Growth》"
    - "Rahul Vohra (First Round Review) — How Superhuman built an engine to find PMF"
    - "Brian Balfour — 4 Fits"
  status: P0-overlay
  outputs:
    - "data/ventures/<name>/pmf_score.md"
    - "data/ventures/<name>/pmf_survey_<date>.csv"
    - "data/ventures/<name>/4fit_map.md"
    - "data/ventures/<name>/retention_curve.md"
  reads:
    - "data/ventures/<name>/audience.md"
    - "data/ventures/<name>/positioning.md"
    - "data/ventures/<name>/metrics.yaml"
license: Apache-2.0
platforms: [macos, linux]
prerequisites:
  env_vars: []
  commands: [bun]
compatibility: "Claude Code, OpenClaw 2026.4.25+, Hermes Agent v0.13.0+, Cursor, Codex"
---

# product-pmf — VST Overlay

## 用途

PMF 不是感觉。是**可测**的：40% 用户说「失去你会非常失望」就是 PMF 的硬指标。在那之前的所有「我们似乎有点 PMF」都是自欺。

这个 skill 干 3 件事：
1. 帮你跑 Sean Ellis 40% Survey
2. 教你 Rahul Vohra 的 Superhuman engine（如何从 22% → 58%）
3. 用 Brian Balfour 4-fit 找你卡在哪一段

## 何时调用

**触发**：
- 产品上线 ≥ 6 周，用户 ≥ 40 个活跃
- 留存曲线没有 flatten，或不知道怎么看
- 用户说「不错」但不愿付钱 / 推荐
- founder 问 "我们有 PMF 吗"
- 增长平台期：MAU 卡住 8 周以上

**不要调用**：
- 用户 < 40 个 → 样本太小，先 lumilab-product-mvp 拉用户
- 产品刚上线 < 2 周 → 数据噪声太大
- 还没付费版 → 先用 lumilab-product-positioning 找谁会真正在乎

## 方法论核心

### 1. Sean Ellis 40% Survey（PMF 硬指标）

问 1 个核心问题：

> **如果以后再也不能用 [产品]，你会怎么想？**
> A. 非常失望 (very disappointed)
> B. 有点失望 (somewhat disappointed)
> C. 不失望 (not disappointed)
> D. 我已经不用了 (N/A)

**判定**：
- A 答案占比 **≥ 40%** → 有 PMF 信号
- A 答案 25-40% → PMF 在路上，找 leverage
- A 答案 < 25% → 没 PMF，重做核心价值

样本要求：
- 至少 40 个**真实活跃用户**（最近 14 天用过 ≥ 2 次）
- 不要发给试用 1 次就走的人（noise）

### 2. Rahul Vohra Superhuman PMF Engine

Superhuman 把 22% → 58% 用了 4 步：

```
Step 1. Segment by "very disappointed" users (HXC = high expectation customer)
Step 2. 问他们 3 个问题：
        - 你属于哪种人？（找 archetype）
        - 你为什么会非常失望？（找 core value）
        - 我们能怎么改进？（找 next leverage）
Step 3. 问 "somewhat disappointed" 用户：
        - 我们差什么你才会变成 "very disappointed"？
Step 4. 形成 roadmap：
        - 加倍核心价值（serve HXC）
        - 修在「差一点」用户的 top-3 missing capability
```

### 3. Brian Balfour 4-Fit Model

PMF 不是单一 fit。是 4 个相互依赖的 fit：

```
Market  ⟷  Product   (用户真的要这个吗 → Sean Ellis 40%)
Product ⟷  Channel   (产品形态能在你拿用户的渠道上传播吗)
Channel ⟷  Model     (渠道 CAC ≤ LTV 的 1/3)
Model   ⟷  Market    (你的定价用户付得起、你毛利能活)
```

**任意一段断 → 增长会以一种你看不出原因的方式卡住。**

### 4. Leading indicators（在 40% 之前能看到的信号）

- **Retention curve 在第 N 周 flatten**（不再继续下降 → 一群人真的留下来了）
- **DAU/MAU ≥ 0.2**（轻产品）或 ≥ 0.5（重产品）
- **NPS ≥ 40**（次级指标，单独不够）
- **Organic referral rate ≥ 15%**（用户主动拉新）
- **Cohort revenue retention 在 12 周后 ≥ 100%**（付费产品）

## 工作流程

### Phase A · 准备

```
Q1: 你现在有多少最近 14 天用过 ≥2 次的活跃用户？
    ○ < 40 → HALT，回到 lumilab-product-mvp 拉用户
    ○ 40-100 → 可以跑，结果有 ±10% 误差
    ○ 100+ → 可以跑，结果可靠
    ○ 不知道 → 先去 lumilab-metrics 装基础事件
```

### Phase B · 跑 Survey

VST 生成一份 5 题 Survey（中文），用户发渠道（站内 banner / 邮件 / 私信）：

```
Q1（核心）：如果以后再也不能用 <产品>，你的感受是：
  □ 非常失望
  □ 有点失望
  □ 不失望
  □ 我已经不用了

Q2: 你觉得 <产品> 最适合给「什么样的人」用？（一句话）

Q3（仅对 "非常失望"）：你**为什么**会非常失望？（具体场景）

Q4（仅对 "有点失望"）：缺什么会让你变成「非常失望」？

Q5（所有人）：我们最应该改进什么？（一项）
```

回收 ≥ 30 个有效回答（活跃用户应有 30%+ 回复率）。

### Phase C · 分析

VST 输出 `pmf_score.md`：

```markdown
# PMF Score · <venture> · <date>

## Sean Ellis Score
- Very disappointed: 12 / 47 = **25.5%**
- Somewhat disappointed: 22 / 47 = 46.8%
- Not disappointed: 13 / 47 = 27.7%

判定：PMF 在路上，未到（< 40%）。

## HXC Archetype（从 "非常失望" 12 人推断）
- 共同特征：每周发 ≥5 篇小红书 + 商单月入 ≥3 万 + 被限流过
- 核心价值：「不再为标题被限流提心吊胆」

## Bridge analysis（从 "有点失望" 22 人）
- Top 3 missing capability:
  1. 抖音版本 (mentioned 14×)
  2. 批量导入选题 (mentioned 9×)
  3. 数据回流分析 (mentioned 7×)

## Recommended roadmap
- Double down: HXC 的限流避雷功能加深
- Bridge: 优先做抖音版本（修复最大 bridge）
- Avoid: 数据回流分析 — 用户说要但实际是 vanity feature

## Leading indicators
- Week-4 retention: 42% (flattens at week 6 = 38%) ✓
- DAU/MAU: 0.31 ✓
- Organic referral: 8% ✗（低）

## Next survey: <date + 6 weeks>
```

### Phase D · 4-Fit Diagnosis

只有 Sean Ellis < 40% 时跑：

```
Q: 你的 funnel 哪一段最卡？

  ○ Market-Product: 拉来的人不留 → 产品 / 市场不匹配
  ○ Product-Channel: 留下的人不会拉新 → 产品形态不适合渠道
  ○ Channel-Model: 拉新成本太高 → CAC 模型崩
  ○ Model-Market: 用户说贵 / 用户付得起但毛利负 → 商业模型崩
```

每个断点对应不同动作（见下游 skill 路由）。

## 真实示例

**Venture**: TitleHero（小红书标题打分器）· Week 8

**Survey**:
- 发出 67 份，回收 47（70%）
- Very disappointed: 12 (25.5%)
- Somewhat disappointed: 22 (46.8%)
- Not disappointed: 13 (27.7%)

**判定**：未达 40%，但 leading indicators 不错（retention 42% flatten）。

**HXC**: 商单月入 ≥3 万的腰部博主。核心价值 = 「不再为限流提心吊胆」。

**Bridge analysis**:
- Top missing: 抖音版本（→ 暗示 product-channel fit 不全：用户希望 cross-platform）
- 但**不要**做抖音。先把小红书的 HXC 服务到 40%+，再扩。

**下一步**:
- 6 周冲刺：限流避雷功能深度（HXC double-down）
- 不接 "有点失望" 用户的 feature request
- 6 周后重测 → 目标 35-40%

**结果（假想 Phase 2）**: 38%。再 6 周冲到 44%。

## 输出 schema

```yaml
# data/ventures/<name>/metrics.yaml
pmf:
  measured_at: 2026-05-14
  sample_size: 47
  very_disappointed_pct: 25.5
  somewhat_disappointed_pct: 46.8
  not_disappointed_pct: 27.7
  hxc_archetype: "商单月入 ≥3 万的腰部博主"
  hxc_core_value: "不再为限流提心吊胆"
  bridge_top_3:
    - "抖音版本 (14 mentions)"
    - "批量导入选题 (9 mentions)"
    - "数据回流分析 (7 mentions)"
  next_measure: 2026-06-25
  leading_indicators:
    week4_retention: 0.42
    retention_flattens_at: 6
    dau_mau: 0.31
    organic_referral: 0.08
```

## 反 Slop 自检

- [ ] 样本 ≥ 40 真实活跃用户
- [ ] 区分了 "very" vs "somewhat" 受访者（不要混合分析）
- [ ] HXC archetype 是具体行为描述，不是「年轻女性」类人口学画像
- [ ] Bridge 优先级有「数量 + 与 HXC 一致性」双重排序
- [ ] 没把 NPS 单独当 PMF 信号
- [ ] 没出现：赋能 / 心智 / 链路 / 用户画像 / 漏斗（除非真讲 funnel）

## Chat-only fallback

```
飞书 chat 里：
1. VST 把 5 题 Survey 文本直接给用户复制
2. 用户发渠道，把 raw 回答粘回 chat
3. VST 在 chat 里现场统计（≥30 条时）+ 输出 pmf_score 简版
4. 提示落盘路径，等用户有浏览器时归档
```

## VST 上下文叠加

- **产物路径**：data/ventures/<name>/pmf_*
- **下游路由**：
  - Sean Ellis < 25% → lumilab-product-positioning（重做定位）
  - 25-40% → 本 skill 的 HXC double-down 流程
  - ≥ 40% → lumilab-launch-strategy（开始放量）
- **关联记忆**：HXC archetype 沉淀到 memory/resources/archetypes/
- **平台约束**：survey 发到小红书 / 微信群时，避免违禁词触发，读对应 platform-rules

## 必做约束

```
✓ 样本不足拒绝出报告
✓ HXC 和 "somewhat" 分开分析
✓ Bridge 不等于 roadmap（要交叉 HXC 一致性）
✓ 输出 metrics.yaml 给 lumilab-metrics 读
✓ 不替用户决定 pivot（surface 给 founder-coach Layer 3）
```

## 引用

- Sean Ellis, "The Startup Pyramid" (2009)
- Rahul Vohra, "How Superhuman Built an Engine to Find Product/Market Fit" (First Round Review)
- Brian Balfour, "The Four Fits for $100M+ Growth"
- Andrew Chen, "After the Techcrunch bump: Life in the trough of sorrow"
- 上游：refoundai/measuring-pmf + omermetin/pmf
- 配套：lumilab-founder-coach / lumilab-metrics / lumilab-product-positioning / lumilab-launch-strategy

## Dependencies

| 依赖 | 类型 | 是否付费 | 说明 |
|---|---|---|---|
| bun | CLI runtime | 免费 | ≥1.0，必需 |
| host LLM | 由 Claude Code / OpenClaw / Cursor / Hermes 提供 | 取决于宿主 | Lumi Lab 本身不直连 LLM，复用宿主 |

## Outputs

`data/ventures/<slug>/pmf_survey.md` · `pmf_score.yaml`

## Example

见 SKILL.md「真实示例」段

## Tests

`tests/smoke.md` — 该 skill 的最小冒烟测试约定：让 host LLM 在对话中跑通 SKILL.md「真实示例」段即视为通过。E2E 真集成见 `docs/TUTORIAL.zh.md`。

## Idempotency

PMF survey 每次跑写新一份 `pmf_survey-<ISO>.md`；`pmf_score.yaml` 是累计版本（用户提交一次加一行）。

## Privacy

survey 回答存本地；用户敏感信息（邮箱 / 电话）不写入主 YAML，单独存 `participants/` 子目录可单独删。

## Cache

40% 阈值常量；Superhuman engine 模板缓存。

## Failure modes

若样本 < 40 → 标记 "insufficient sample"，不给 PMF 判断；NPS 数据缺失时不补 0（区分缺失 vs 0）。

## Edge cases

"Very disappointed" 比例计算包含权重；用户群分 power user / regular / inactive 三档分别看比例。

