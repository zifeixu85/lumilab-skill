---
name: lumilab-launch-strategy
description: |
  Cold-start playbook for OPC/独立开发者. Kevin Kelly 1000 true fans + Marc Lou ship-fast bundling + Product Hunt launch + Lenny Rachitsky cold-start. Lumi-Lab Chinese ladder: 飞书/微信小圈子 → 小红书 → 公众号 → 播客 → PH/HN. Use when the user is ready to launch a venture, needs a 4-8 week cold-start plan, or wants a weekly launch calendar with quantified success criteria.
  关键词：launch / 冷启动 / Product Hunt / 1000 true fans / ship fast / Lenny Rachitsky / 小红书冷启动
version: 1.3.0
metadata:
  hermes:
    tags: [launch, 1000-true-fans, product-hunt, cold-start, marc-lou]
  lumilab:
    tier: overlay
    requires_browser: false
    chat_only_ok: true
  category: agent
  agent: sop_growth
  upstream:
    - "aitytech/launch-strategy + ognjengt/go-to-market"
    - "Kevin Kelly《1,000 True Fans》(2008)"
    - "Marc Lou — ship fast, multi-product bundle (ByeDispute / ShipFast playbook)"
    - "Lenny Rachitsky — cold-start newsletter (Substack growth playbook)"
    - "Andrew Chen《The Cold Start Problem》(2021)"
    - "Ryan Hoover — Product Hunt launch best practices"
  status: P0-overlay
  outputs:
    - "data/ventures/<name>/launch_plan.md"
    - "data/ventures/<name>/launch_calendar.yaml"
    - "data/ventures/<name>/launch_assets/"
  reads:
    - "data/ventures/<name>/positioning.md"
    - "data/ventures/<name>/pmf_score.md"
    - "data/ventures/<name>/audience.md"
license: Apache-2.0
platforms: [macos, linux]
prerequisites:
  env_vars: []
  commands: [bun]
compatibility: "Claude Code, OpenClaw 2026.4.25+, Hermes Agent v0.13.0+, Cursor, Codex"
---

# launch-strategy — Lumi Lab Overlay

## 用途

冷启动不是「发个 PH 看运气」。是一套 4-8 周的有序释放：先小圈子验证消息→中圈子积累 first 100→大圈子放量。

很多独立开发者第一次发布失败，不是产品差，是顺序错：上来就 PH / HN / 朋友圈轰炸，没有先在 50 人的小圈子把消息打磨到能复制。

## 何时调用

**触发**：
- 用户说「我准备发布 / launch / 上 Product Hunt」
- PMF score ≥ 25% 且 retention 已 flatten
- 用户问「冷启动怎么做」
- 用户已 ship MVP 但 4 周用户增长 < 10/周
- founder-coach 在 Layer 1 完成、PMF 已经在路上

**不要调用**：
- PMF score < 15% → 先回 lumilab-product-pmf（放量等于把漏的桶端到瀑布下）
- positioning_statement 还没定 → 回 lumilab-product-positioning
- 用户想要的是「营销 / 投放」 → 这是 paid acquisition，不是冷启动 launch

## 方法论核心

### 1. Kevin Kelly · 1000 True Fans

独立开发者的数学：
- 1000 个每年付 ¥360 的真粉 = ¥36万/年 → 一人能活
- 拿 1000 真粉的方法**不是**1000 万次曝光，是 50 个超级 fan + 他们各自带 20 个

第一阶段任务：**找你的前 10 个 super fan**，不是前 1000 个用户。

### 2. Marc Lou · Ship Fast + Bundle

Marc 一年发 10+ 产品的 playbook：
- **Ship 时间 ≤ 4 周**（不许超）
- **Launch on multiple surfaces same week**（Product Hunt + Twitter/X + Indie Hackers + HN show）
- **Bundle**：每个新产品给老产品做内嵌广告位（"Built with ShipFast"）
- **Pricing 简单**：一次性买断 or 单档订阅，不许搞 3 档价格

### 3. Lenny Rachitsky · Cold Start

Lenny Substack 0 → 700K 的方法：
- **Write for one specific person**（不是泛读者）
- **Distribution 在 publish 前就开始**（朋友、Slack 群、之前的 LinkedIn 网络）
- **Free → paid 转化**：先用 6-12 个月免费内容积累信任，再 paywall
- **Cross-promote with peers**（同体量作者互推）

### 4. Andrew Chen · Cold Start Problem (Network Products)

如果你的产品有网络效应：
- 找 **atomic network**（最小可运转单位，如 Facebook 早期 = 一个学校）
- 把这一个 atomic network 做到 100% 渗透，再复制
- "Hard side first"（供给侧先做，需求侧自然来）

### 5. Ryan Hoover · Product Hunt Launch

- Launch day = **Tuesday-Thursday，太平洋时间 00:01**
- Pre-launch：拉 ≥ 30 个 hunter 同意 D-Day 投票
- Asset：30 秒 video + 5 张 carousel + GIF
- 留 Maker comment 在第 1 楼，讲故事不讲 feature
- 当天每 2h 互动一次，不要消失

### 6. 中国式 launch 阶梯（Lumi-Lab 原创）

中文产品的实际有效顺序：

```
Week 1-2 · 飞书 / 微信小圈子（10-30 人）
  目标：消息能不能 1 句话讲清楚 + 有没有人主动问「怎么用」

Week 3-4 · 小红书（中型博主合作 + 自发笔记）
  目标：first 100 用户 + 验证 hero copy

Week 5-6 · 微信公众号（深度长文 + 创始人访谈）
  目标：信任 + 转化率（PH 之前积累 social proof）

Week 7 · 播客（独立开发者 / 创业类）
  目标：圈层渗透 + 反向 SEO

Week 8 · Product Hunt + HN Show + Twitter/X 国际放量
  目标：海外用户 + backlinks + PR
```

⚠️ **顺序不可逆**。在没跑前 4 周就上 PH = 浪费一次 launch。

## 工作流程

### Step 1 · Readiness gate

```
Q: 检查 launch 准备度：
   ○ positioning_statement 存在并测过 ≥5 个目标用户能 1 句话复述
   ○ MVP 已 ship 且 ≥ 14 天稳定
   ○ Plausible / PostHog 装好，能追踪转化
   ○ 落地有付费 / 留资 CTA
   ○ 至少 10 个 super fan 名单（不是「我能想到的人」，是真在用的）

   全 ✓ → 进 Step 2
   有 ✗ → 回去补，4 周后再来
```

### Step 2 · 选 launch 形态

```
Q: 你的产品类型？

  ○ B2C 工具 / 内容产品 → 中国阶梯（小红书 + 公众号 + 播客 + PH）
  ○ Dev / SaaS / 全球受众 → PH + HN + Twitter/X + Indie Hackers
  ○ 网络效应产品 → atomic network 模式（先做单点饱和）
  ○ 中英双面 → 中国阶梯 + 第 8 周 PH/HN 双发
```

### Step 3 · 排 4-8 周日历

输出 launch_calendar.yaml（见下）。

### Step 4 · 准备 launch assets

按平台清单：

```
小红书：
  - 5 张图：痛点 → 方案 → 截图 → 价格 → CTA（OKLCH 色板，无紫渐变）
  - 文案 ≤ 200 字
  - 标签 3-5 个，过 lumilab platform-rules

公众号：
  - 创始人故事 1500-2500 字
  - 1 张主视觉
  - 文末 CTA + 二维码

Product Hunt：
  - Tagline ≤ 60 字符
  - Description ≤ 260 字符
  - Gallery: 5 张 1270×760
  - Demo GIF 1 个
  - Maker first comment 草稿

播客：
  - Pitch 邮件（≤ 150 字）
  - 推荐 5 个目标节目
```

### Step 5 · 跑日历 + 日度数据

每天发布 1 个 channel，每天回流数据进 metrics.yaml。每周一回顾。

### Step 6 · 复盘

最后 1 周总结：哪个 channel ROI 最高（用户/小时） → 沉淀为下次 launch 模板。

## 真实示例

**Venture**: TitleHero · PMF 38% · ready to launch

**Week 1 · 飞书圈**
- 找 12 个小红书博主朋友（不是 50 万粉那种，是 1-5 万腰部）
- 每人 1v1 chat，问 "我做了个 X，对你有用吗"
- 9 人愿意试 → 7 人付 ¥9 试用 → 5 人续 ¥39
- 验证消息：「不会被限流的标题」比「AI 写标题」点击高 3×

**Week 2 · 微信群定向**
- 找 3 个目标群（每个 100-300 人）
- 群主同意后发：1 个案例 + 1 张图 + 1 个限时优惠
- +28 用户

**Week 3-4 · 小红书**
- 自发 6 篇笔记（不投放）：3 篇「我帮博主朋友改了 X 个标题」+ 3 篇 demo
- 找 4 个 1-3 万粉博主：免费用 + 真实评价（不是软广）
- +127 用户

**Week 5-6 · 公众号**
- 1 篇创始人故事（"为什么我做 TitleHero"）
- 1 篇深度（"小红书 2026 限流词全解析"）
- 2 个朋友公众号转载
- +94 用户

**Week 7 · 播客**
- 上 2 档独立开发者播客
- +43 用户 + 3 个商务合作 inbound

**Week 8 · PH + Twitter/X**
- PH #6 of day（中文产品在 PH 难拿前 3）
- Twitter/X 串 + Indie Hackers post
- +210 国际用户 / 体验试用

**总计 8 周**：508 付费用户。Best channel ROI：小红书（127 / ~40h 工时）。

## 输出 schema

`data/ventures/<name>/launch_calendar.yaml`:

```yaml
launch_window: 2026-05-20 → 2026-07-15
type: china_ladder_plus_ph

weeks:
  - week: 1
    channel: "飞书 + 微信 1v1"
    target: "12 个 super fan validation"
    deliverable: "聊天 log，消息测试结果"
    success: "≥ 7 人愿付费试用"
  - week: 2
    channel: "微信群定向"
    target: "3 个目标群 + 30 用户"
    deliverable: "群发文案 + 数据回流"
  - week: 3-4
    channel: "小红书"
    target: "6 自发 + 4 合作"
    deliverable: "100 用户"
  - week: 5-6
    channel: "公众号"
    target: "1 故事 + 1 深度"
    deliverable: "1 篇 ≥ 1 万阅读"
  - week: 7
    channel: "播客"
    target: "2 档节目"
    deliverable: "≥ 30 用户"
  - week: 8
    channel: "Product Hunt + HN + Twitter/X"
    target: "PH top 10 + 200 国际用户"
    deliverable: "PH page + HN show + Twitter thread"

assets:
  - launch_assets/xhs_carousel_01.png
  - launch_assets/founder_story.md
  - launch_assets/ph_gallery_*.png
  - launch_assets/ph_maker_comment.md
```

## 反 Slop 自检

- [ ] 顺序：小圈子 → 中圈子 → 大放量（不可逆）
- [ ] 每个 channel 有量化 success criteria
- [ ] PH launch 不在第 1-2 周（除非纯英文 dev 产品）
- [ ] 不在 readiness gate 全过之前发布
- [ ] Asset 没用紫色渐变 / Inter / Roboto
- [ ] 没出现：赋能 / 心智 / 矩阵 / 抓手 / 链路 / 用户画像

## Chat-only fallback

```
飞书 chat 里：
1. Lumi Lab chat 里做 readiness gate 5 题
2. 不出 calendar.yaml，改输出 markdown 表格
3. 每天用户发「today's launch number」回 chat
4. Lumi Lab 在 chat 里做 weekly 回顾
5. PH launch 当天 Lumi Lab chat 里每 2h 发 reminder "去回复评论"
```

## Lumi Lab 上下文叠加

- **产物路径**：data/ventures/<name>/launch_*
- **下游消费**：lumilab-content-repurpose（一个 launch 故事拆 5 平台）
- **关联记忆**：channel ROI 沉淀到 memory/resources/channels/
- **平台约束**：所有 asset 落盘前过 platform-rules（小红书违禁词 / 视频号长度 / 公众号原创规则）
- **下游路由**：
  - launch 结果 < 目标 50% → lumilab-founder-coach Layer 2 复盘
  - launch 结果 ≥ 目标 → lumilab-metrics 设 north star 进入 scale 阶段

## 必做约束

```
✓ Readiness gate 不过不允许发
✓ 顺序锁定，不允许跳到 PH
✓ Asset 过 Anti-Slop + platform-rules
✓ 每周一次 weekly 回顾归档
✓ Channel ROI 表强制输出
✓ PMF < 15% 时拒绝 launch
```

## 引用

- Kevin Kelly, "1,000 True Fans" (2008)
- Marc Lou, ShipFast / ByeDispute / Twitter @marc_louvion
- Lenny Rachitsky, "How I grew Lenny's Newsletter"
- Andrew Chen《The Cold Start Problem》(2021)
- Ryan Hoover, Product Hunt launch guide
- Paul Graham, "Do Things That Don't Scale" (2013)
- 上游：aitytech/launch-strategy + ognjengt/go-to-market
- 配套：lumilab-product-positioning / lumilab-product-pmf / lumilab-content-repurpose / lumilab-metrics

## 分支决策

| 条件 | 动作 |
|---|---|
| PMF score < 15% | 拒绝 launch，回 `lumilab-product-pmf` |
| positioning_statement 未定 | 回 `lumilab-product-positioning` |
| Readiness gate 有任一 ✗ | 不排日历，让用户补 4 周后再来 |
| 产品类型 = B2C 工具/内容 | 用中国阶梯（小红书 + 公众号 + 播客 + PH） |
| 产品类型 = Dev/SaaS/全球受众 | 用 PH + HN + Twitter/X + Indie Hackers |
| 用户要在第 1-2 周上 Product Hunt | 警示阶段错配，先跑小圈子（纯英文 dev 产品除外） |
| launch 结果 < 目标 50% | 路由到 `lumilab-founder-coach` Layer 2 复盘 |

## Dependencies

| 依赖 | 类型 | 是否付费 | 单次调用成本 | 说明 |
|---|---|---|---|---|
| bun | CLI runtime | 免费 | free（本地执行） | ≥1.0，必需 |
| host LLM | 由 Claude Code / OpenClaw / Cursor / Hermes 提供 | 取决于宿主 | ~6-12K tokens / 次完整规划 | Lumi Lab 本身不直连 LLM，复用宿主 |

## Output validation

`scripts/validate-output.ts`（bun，确定性校验）检查 `launch_calendar.yaml`（含 `launch_window` / `type`、`weeks` 列表 ≥ 4 条、每条 week 有 `channel` + `target`）与 `launch_plan.md`（含 Readiness gate 段）。

```bash
bun run scripts/validate-output.ts data/ventures/<slug>/   # exit 0 = valid, 1 = invalid
bun run scripts/validate-output.ts --help
```

校验字段:
- `launch_calendar.yaml` → `launch_window`: string
- `launch_calendar.yaml` → `type`: string
- `launch_calendar.yaml` → `weeks`: list（≥ 4 条）
- `launch_calendar.yaml` → `weeks[].channel`: string；`weeks[].target`: string（每条 week 均必需）
- `launch_plan.md` → 必含 `Readiness gate` 段

## Outputs

- `data/ventures/<slug>/launch_plan.md`（4-8 周冷启动 playbook，重跑写 `launch_plan.v<n>.md`）
- `data/ventures/<slug>/launch_calendar.yaml`（按周日历 + 量化 success criteria）
- `data/ventures/<slug>/launch_assets/`（各平台 launch 素材）

## Example

见 SKILL.md「真实示例」段

## Tests

`tests/smoke.md` — 该 skill 的最小冒烟测试约定：让 host LLM 在对话中跑通 SKILL.md「真实示例」段即视为通过。E2E 真集成见 `docs/TUTORIAL.zh.md`。

## Idempotency

`launch_plan.md` 重跑写 `launch_plan.v<n>.md`，主版本只指向最新；Day 阶段已完成的部分不重生成。

## Privacy

所有 launch checklist 本地存储；具体平台账号（微信 / X / PH）token 用 lumilab-config 写入 keychain，不进 launch_plan。

## Cache

中国式 launch 阶梯（飞书 / 微信小圈子 → 小红书 → 公众号 → 播客）模板常量。

## Failure modes

若 1000 true fans 还没满 100 但用户跳到 Product Hunt → 警示阶段错配。

## Edge cases

Marc Lou ship fast 原则与 1000 true fans 速度冲突时按 venture 类型分流：B2C 偏 ship fast，B2B 偏 1000 true fans。

## Alternatives

用户现在可能用什么替代方案，以及 Lumi Lab 为什么不一样：

- **通用 LLM「帮我做发布计划」**：给泛泛清单，不分阶段、不懂中国式 launch 阶梯。
- **Product Hunt launch guide**：只讲 PH，不讲飞书 / 微信小圈子 → 小红书 → 公众号的国内路径。

Lumi Lab 的差异：1000 true fans + Marc Lou ship fast，按 venture 类型（B2C / B2B）分流，含中国式 launch 阶梯。

## Moat（复利护城河）

launch_plan.v<n>.md 留档，跑过几次 launch 后能复盘"哪个阶段我总是跳太快"。

## Changelog

- **1.0.0-rc1** — 加 `## Changelog` / `scripts/package.json` / `校验字段:` 显式 schema 声明；Dependencies 表补单次调用成本列。
- **0.3.0** — `validate-output.ts` 加 `weeks` ≥ 4 条 + 每条 channel/target 校验、Readiness gate 段检测；`anti-slop-lint.ts` 接入。
- **0.2.0** — 补 `## 分支决策` if-then 表、按 venture 类型（B2C / B2B）分流、中国式 launch 阶梯。
- **0.1.0-p0** — 初版：1000 true fans + Marc Lou ship fast，4-8 周冷启动 playbook + 按周日历。

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
