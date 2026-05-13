---
name: lumilab-metrics
description: |
  AARRR Pirate Metrics + Sean Ellis North Star + leading vs lagging + Amplitude/PostHog event schema. Cohort retention curve reading. Lumi-Lab overlay with Chinese-first event naming and Anti-Slop for vanity metrics.
  关键词：metrics / AARRR / 海盗指标 / north star / leading / lagging / vanity / retention curve / event schema / PostHog / Amplitude
version: 1.0.0-rc1
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

## Dependencies

| 依赖 | 类型 | 是否付费 | 说明 |
|---|---|---|---|
| bun | CLI runtime | 免费 | ≥1.0，必需 |
| host LLM | 由 Claude Code / OpenClaw / Cursor / Hermes 提供 | 取决于宿主 | Lumi Lab 本身不直连 LLM，复用宿主 |

## Outputs

`data/ventures/<slug>/metrics.yaml`（AARRR 事件 schema）

## Example

见 SKILL.md「真实示例」段

## Tests

`tests/smoke.md` — 该 skill 的最小冒烟测试约定：让 host LLM 在对话中跑通 SKILL.md「真实示例」段即视为通过。E2E 真集成见 `docs/TUTORIAL.zh.md`。
