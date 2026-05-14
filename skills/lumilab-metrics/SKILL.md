---
name: lumilab-metrics
description: |
  AARRR Pirate Metrics + Sean Ellis North Star + leading vs lagging + Amplitude/PostHog event schema. Cohort retention curve reading. Lumi-Lab overlay with Chinese-first event naming and Anti-Slop for vanity metrics. Use when the user asks which metrics to track, can't tell if a product is healthy from GA data, needs an event schema before MVP launch, or wants to read a cohort retention curve.
  关键词：metrics / AARRR / 海盗指标 / north star / leading / lagging / vanity / retention curve / event schema / PostHog / Amplitude
version: 1.1.0
metadata:
  hermes:
    tags: [aarrr, north-star, retention, amplitude, posthog]
  lumilab:
    tier: overlay
    requires_browser: false
    chat_only_ok: true
  category: agent
  agent: sop_growth
  upstream:
    - "wshobson/startup-metrics-framework 6.3K installs"
    - "Dave McClure《Startup Metrics for Pirates》(AARRR)"
    - "Sean Ellis《Hacking Growth》— North Star Metric"
    - "Amplitude — Behavioral analytics taxonomy"
    - "PostHog — Self-hosted product analytics"
    - "Andrew Chen — vanity vs actionable metrics"
  status: P0-overlay
  outputs:
    - "data/ventures/<name>/metrics.yaml"
    - "data/ventures/<name>/event_schema.yaml"
    - "data/ventures/<name>/north_star.md"
    - "data/ventures/<name>/retention_curve.md"
  reads:
    - "data/ventures/<name>/audience.md"
    - "data/ventures/<name>/positioning.md"
    - "data/ventures/<name>/pmf_score.md"
license: Apache-2.0
platforms: [macos, linux]
prerequisites:
  env_vars: []
  commands: [bun]
compatibility: "Claude Code, OpenClaw 2026.4.25+, Hermes Agent v0.13.0+, Cursor, Codex"
---

# metrics — VST Overlay

## 用途

让独立开发者**不再用 GA 看 PV 自我感动**。这个 skill 给你：
1. 一个 north star（一个数字 = 产品健康）
2. 一个干净的 event schema（不会半年后悔重做）
3. 看 cohort retention curve 的方法
4. 区分 vanity vs actionable 的标准

不解决埋点工具选型问题（PostHog / Amplitude / 自建 ClickHouse 你自选），解决**测什么、怎么命名、怎么读**。

## 何时调用

**触发**：
- 用户问「应该追踪哪些指标」
- 用户看 GA 数据但说不清产品健不健康
- MVP 上线前要装埋点
- PMF survey 前要先有 retention 数据
- lumilab-launch-strategy 之前装好

**不要调用**：
- 用户 0 用户 0 流量 → 装埋点没数据，先去 lumilab-product-mvp
- 用户问「PostHog 怎么配置」→ 那是工具，不是方法
- 用户问「转化率太低怎么办」→ 那是 lumilab-product-pmf

## 方法论核心

### 1. AARRR 海盗指标（Dave McClure）

```
Acquisition  — 用户怎么来（哪个 channel）
Activation   — 第一次「啊我懂了」的瞬间（aha moment）
Retention    — 用户继续回来
Referral     — 用户带新用户
Revenue      — 用户付钱
```

顺序是关键：**Retention 没解决，加 Acquisition 就是漏水的桶往里倒水**。

90% 独立开发者优先级错了：先做 A（广告 / SEO），再修 R（产品）。应该反过来。

### 2. Sean Ellis · North Star Metric

一个数字，回答：**这个产品给用户带来核心价值的频次**。

例：
- Airbnb: nights booked / week
- Slack: messages sent in teams ≥ 3 members
- Spotify: time spent listening
- TitleHero: titles scored per active user per week

**判断好 NSM 的 3 条**：
- 量出来的是 value delivered，不是 activity
- 跟 revenue 高度相关，但**不是** revenue 本身
- 团队每天能影响

❌ 反例：DAU、注册数、PV → vanity
✅ 正例：weekly engaged users、actions per user、retained cohort size

### 3. Leading vs Lagging

```
Lagging (果)：MRR, retention 30d, NPS, churn rate
Leading (因)：activation rate, week-1 actions, time to aha
```

只看 lagging → 等你看到掉头时已经 2 个月晚了。
只看 leading → 噪声大但能改。

**原则**：每个 lagging 指标至少有 1 个 leading 对应。

### 4. Vanity vs Actionable

| Vanity | Actionable |
|---|---|
| Total registered users | Weekly engaged users |
| Cumulative downloads | DAU/MAU |
| Page views | Activation rate |
| Total revenue | Cohort revenue retention |
| Twitter followers | Email open + click |

判断公式：**这个数字下个月会下降吗？** 不会 → vanity。

### 5. Event Schema 设计原则（Amplitude / Iteratively / PostHog 共识）

```
1. Verb + Noun naming: "title_scored", "subscription_started" — 不要 "user_action_1"
2. snake_case 全小写
3. 每个 event 配标准 properties: source, plan, locale, platform
4. 不在 event name 里塞动态值（"title_scored_xhs" ❌；用 property platform="xhs" ✓）
5. 一开始就埋核心 6-10 个，不要 50 个
6. 永远埋 timestamp + user_id + session_id
7. Server-side 优于 client-side（ad blocker 干扰小）
```

### 6. Cohort Retention Curve（读图）

```
% retained
100 |•
 80 |
 60 |  •
 40 |     • • • • • ← flatten 在 30%
 20 |
  0 |________________
     W0  W1  W2  W3  W4  W5  W6

判读：
- 曲线一直下降到 0 → 没 PMF
- 曲线 flatten 在 20-30% → 有核心用户群（小，但真）
- Flatten 在 40%+ → 强 PMF（罕见）
- "Smile curve"（先降后升）→ 顶级 retention（极罕见）
```

## 工作流程

### Step 1 · 定 North Star

```
Q: 你的用户用产品「获得价值」的具体动作是什么？

  例：
  ○ 给标题打了分（TitleHero）
  ○ 收到了一个客户付款（独立 CRM）
  ○ 发布了一篇笔记（写作工具）
  
  那么 north star = "weekly active users who did [action] ≥ 2 times"
  
  写下你的 NSM。
```

把候选给用户挑：

```
○ Weekly engaged users (WEU)
○ Actions per user per week
○ Retained cohort size after 4 weeks
○ Revenue retention 12 weeks
```

### Step 2 · 列 AARRR 每段的 1-2 个指标

```
Acquisition:
  - Channel-attributed signups (lagging)
  - CAC by channel (lagging)

Activation:
  - % users completing aha action within 24h (leading) ★
  - Time to aha (leading)

Retention:
  - W1, W4, W8 cohort retention (lagging)
  - DAU/MAU (leading)

Referral:
  - Organic share rate (leading)
  - K-factor (lagging)

Revenue:
  - Trial → paid conversion (leading)
  - MRR / churn (lagging)
```

### Step 3 · 设计 Event Schema

```yaml
events:
  - name: user_signed_up
    when: 注册完成
    properties: { source, locale, plan_at_signup }
  - name: title_scored          # aha action
    when: 第一次完成打分
    properties: { score, platform, length, used_template }
  - name: subscription_started
    when: Stripe webhook success
    properties: { plan, amount_cny, trial }
  - name: subscription_cancelled
    properties: { reason, days_active, plan }
  - name: shared_outbound
    properties: { channel, target_platform }

properties_global:
  - user_id
  - session_id
  - timestamp
  - utm_source
  - utm_campaign
  - app_version
```

### Step 4 · 装工具（用户选）

VST 不替选工具，但给推荐：

```
○ PostHog (self-host or cloud) — 推荐独立开发者，免费 1M events/月
○ Amplitude — 推荐 ≥ 10k DAU，免费 10M events/月
○ Plausible — 仅 web analytics，不是 product analytics
○ Mixpanel — 老牌，免费层小
○ ClickHouse 自建 — 仅当你有 DevOps 精力
```

### Step 5 · 跑 ≥ 4 周后读 retention curve

```
Q: 你的 W1 → W4 cohort retention 是？
  
  [用户填]
  
  判读：
  - 持续下降未 flatten → 优先做 retention，不做 acquisition
  - W4 flatten 在 20-30% → 有 core，可以小幅放量
  - W4 flatten 在 40%+ → 准备 launch（去 lumilab-launch-strategy）
```

### Step 6 · 月度 review

每月输出 `north_star.md`：

```markdown
# North Star · TitleHero · 2026-05

NSM: WEU who scored ≥ 2 titles
Current: 312
4w ago: 247
Trend: +26% MoM ↑

Leading indicators:
- Activation rate (24h): 64% ↑
- Time to aha: 4.2 min ↓

Lagging:
- W4 retention: 38% ↑
- MRR: ¥18,400 ↑
- Churn: 6.2% / month ↓

Anti-vanity check:
- Not reporting: total signups, PV, follower count
```

## 真实示例

**Venture**: TitleHero · Day 60

**North Star**: "WEU (weekly engaged users) who scored ≥ 2 titles"
- 理由：scoring 是用户拿到价值的瞬间，2 次以上代表「不是只玩了一下」

**Event schema（6 个事件）**:
```
user_signed_up
title_scored          ← aha event
subscription_trial_started
subscription_started
subscription_cancelled
shared_outbound
```

**装 PostHog Cloud（免费）**: 2h 完成

**4 周后数据**:
- Acquisition: 412 signups (XHS 41%, 公众号 28%, 朋友推荐 19%, 其他 12%)
- Activation: 64% 在 24h 内完成 ≥1 次 score
- Retention: W1 71%, W2 52%, W3 44%, W4 38%（flatten 在 38%）
- Revenue: 14% trial → paid，MRR ¥18,400

**判读**:
- W4 38% = 有 core 用户群，准备进 launch（→ chain lumilab-launch-strategy）
- Activation 64% 已不错，但 time-to-aha 还能压（leading 指标动作空间）
- Acquisition channel 数据健康，不需要立刻多元化

**Anti-vanity**:
- 不报：累计注册数（412 没意义，谁还在用才是）
- 不报：PV（标题打分不靠浏览量）
- 不报：朋友圈点赞

## 输出 schema

`data/ventures/<name>/metrics.yaml`:

```yaml
north_star:
  name: "WEU scored ≥ 2 titles"
  current: 312
  trend_4w: "+26%"
  measure_cadence: weekly

aarrr:
  acquisition:
    primary: channel_attributed_signups
    cac_by_channel: { xhs: 8.4, wechat_oa: 14.1 }
  activation:
    primary: pct_aha_in_24h
    current: 0.64
    aha_event: "title_scored"
  retention:
    cohort_w1: 0.71
    cohort_w4: 0.38
    flatten_at_week: 4
  referral:
    organic_share_rate: 0.09
  revenue:
    mrr_cny: 18400
    trial_to_paid: 0.14
    monthly_churn: 0.062

event_schema_path: data/ventures/<name>/event_schema.yaml
tool: posthog_cloud
review_cadence: monthly
```

## 反 Slop 自检

- [ ] North Star 是 value delivered，不是 activity
- [ ] AARRR 每段至少 1 leading + 1 lagging
- [ ] Event 命名 verb_noun snake_case，不塞动态值
- [ ] 没把 total signups / PV / follower count 当核心指标
- [ ] Cohort retention 图至少 4 周才解读
- [ ] 没出现：赋能 / 数智 / 链路 / 用户画像 / 颗粒度

## Chat-only fallback

```
飞书 chat 里：
1. VST 不画图，用 ASCII retention curve
2. Event schema 用 chat 表格输出
3. 用户每周一发当周 NSM 数 → VST 在 chat 里算 trend
4. 月度 review 在 chat 里出 markdown 报告
5. 提示用户落盘路径
```

## VST 上下文叠加

- **产物路径**：data/ventures/<name>/metrics.yaml + event_schema.yaml + north_star.md
- **下游消费**：
  - lumilab-product-pmf 读 metrics.yaml 的 retention + activation
  - lumilab-launch-strategy 读 channel_attributed_signups
  - lumilab-founder-coach Layer 2 用 trend 检测决策疲劳 / 假设失败
- **关联记忆**：好 event schema 沉淀到 memory/resources/event-schemas/
- **平台约束**：跨平台埋点（小红书 / 微信 / 视频号 SDK）读 platform-rules

## 必做约束

```
✓ NSM 单数字，不许 3 个并列
✓ AARRR 每段 leading + lagging 配对
✓ Event 命名规范统一
✓ Vanity 指标拒绝出现在 north_star.md
✓ Retention 4 周后才解读
✓ 月度 review 强制
```

## 引用

- Dave McClure, "Startup Metrics for Pirates" (2007)
- Sean Ellis & Morgan Brown《Hacking Growth》(2017)
- Andrew Chen, "Vanity Metrics vs Actionable Metrics"
- Amplitude, "The North Star Playbook"
- Eric Ries《The Lean Startup》— Innovation Accounting 章节
- Lenny Rachitsky, "What's a good retention rate?"
- 上游：wshobson/startup-metrics-framework
- 配套：lumilab-product-pmf / lumilab-product-mvp / lumilab-launch-strategy / lumilab-founder-coach

## 分支决策

| 条件 | 动作 |
|---|---|
| 用户 0 用户 0 流量 | 拒绝装埋点，回 `lumilab-product-mvp` |
| 用户问「PostHog 怎么配置」 | 不答工具配置，本 skill 只解决测什么/怎么命名 |
| 用户问「转化率太低怎么办」 | 转 `lumilab-product-pmf` |
| cohort retention 不足 4 周 | 拒绝解读 retention curve，先攒数据 |
| W4 retention flatten 在 40%+ | 准备 launch，路由到 `lumilab-launch-strategy` |
| W4 持续下降未 flatten | 优先做 retention，不做 acquisition |
| 用户把 PV / 总注册数 当核心指标 | 警示 vanity，替换为 actionable（W1 retention / activation rate） |

## Dependencies

| 依赖 | 类型 | 是否付费 | 单次调用成本 | 说明 |
|---|---|---|---|---|
| bun | CLI runtime | 免费 | free（本地执行） | ≥1.0，必需 |
| host LLM | 由 Claude Code / OpenClaw / Cursor / Hermes 提供 | 取决于宿主 | ~5-9K tokens / 次 schema 设计 | Lumi Lab 本身不直连 LLM，复用宿主 |

## Output validation

`scripts/validate-output.ts`（bun，确定性校验）检查 `metrics.yaml`（含 `north_star`（有 `name` + `measure_cadence`）和 `aarrr` 五段 `acquisition`/`activation`/`retention`/`referral`/`revenue`）与 `event_schema.yaml`（含 `events` 列表，每个 event 名为 verb_noun snake_case，事件数不超过 20）。

```bash
bun run scripts/validate-output.ts data/ventures/<slug>/   # exit 0 = valid, 1 = invalid
bun run scripts/validate-output.ts --help
```

校验字段:
- `metrics.yaml` → `north_star`: object（必含 `name`: string、`measure_cadence`: string）
- `metrics.yaml` → `aarrr`: object（必含五段 `acquisition` / `activation` / `retention` / `referral` / `revenue`，均为 object）
- `event_schema.yaml` → `events`: list（非空，长度 ≤ 20）
- `event_schema.yaml` → `events[].name`: string（必须匹配 verb_noun snake_case：`^[a-z]+(_[a-z0-9]+)+$`）

## Outputs

- `data/ventures/<slug>/metrics.yaml`（north star + AARRR 指标）
- `data/ventures/<slug>/event_schema.yaml`（核心 6-10 个事件定义）
- `data/ventures/<slug>/north_star.md`（月度 review 报告）
- `data/ventures/<slug>/retention_curve.md`（cohort retention 判读）

## Example

见 SKILL.md「真实示例」段

## Tests

`tests/smoke.md` — 该 skill 的最小冒烟测试约定：让 host LLM 在对话中跑通 SKILL.md「真实示例」段即视为通过。E2E 真集成见 `docs/TUTORIAL.zh.md`。

## Idempotency

`metrics.yaml` 是事件 schema，追加新事件不删除老的；schema migration 自动版本号 +1。

## Privacy

事件名 / 属性定义本地；真接 Amplitude / PostHog 时由用户配 token，本 skill 不直发。

## Cache

AARRR / Pirate Metrics 模板常量；用户事件命名规范缓存。

## Failure modes

vanity metric（PV / 总注册数无对照）→ 警示并建议替换为 actionable（W1 retention / activation rate）。

## Edge cases

cohort 切片至少 W1 / W4 / W8；vanity vs actionable 双列对照；leading vs lagging 必须标注。

## Alternatives

用户现在可能用什么替代方案，以及 Lumi Lab 为什么不一样：

- **通用 LLM「我该看哪些指标」**：容易给 vanity metrics（PV / 总注册数）。
- **Google Analytics / 各类 dashboard**：给一堆数但不分 leading / lagging、actionable / vanity。

Lumi Lab 的差异：AARRR + North Star + vanity/actionable 双列对照 + cohort 切片规范，vanity metric 直接警示。

## Moat（复利护城河）

metrics.yaml 是累积的事件 schema，schema 版本化。跑得越久，事件定义越稳，跨 venture 的指标可对比。

## Changelog

- **1.0.0-rc1** — 加 `## Changelog` / `scripts/package.json` / `校验字段:` 显式 schema 声明；Dependencies 表补单次调用成本列。
- **0.3.0** — `validate-output.ts` 加 event 命名 verb_noun snake_case 检查 + 事件数 ≤ 20 上限；`anti-slop-lint.ts` 扫 vanity metric 词。
- **0.2.0** — 补 leading vs lagging 配对规范、cohort retention 4 周才解读约束、`## 分支决策` if-then 表。
- **0.1.0-p0** — 初版：AARRR + North Star + vanity/actionable 双列对照 + event schema 设计原则。

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
