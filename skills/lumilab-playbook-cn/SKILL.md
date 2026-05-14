---
name: lumilab-playbook-cn
description: |
  Chinese-language methodology playbook for venture validation. Index of 13 frameworks (Mom Test / Lean Canvas / Sean Ellis 40% / Bob Moesta JTBD / April Dunford / YC office hours / etc.) plus China-specific platform rules. Pure knowledge skill, read by other Skills when they need methodology references. Use when user asks 「这个方法论是什么」「Mom Test 怎么用」「PMF 怎么测」etc.
  关键词：方法论 / playbook / 创业知识 / Mom Test / Lean Canvas / PMF / JTBD / 中文方法论 / 国内平台规则
version: 1.0.0-rc1
metadata:
  hermes:
    tags: [playbook, chinese, platform-rules, 13-frameworks]
  lumilab:
    tier: knowledge
    requires_browser: false
    chat_only_ok: true
  category: knowledge
  agent: shared
  upstream:
    - "github.com/leoyeai/afrexai-founder-os"
    - "github.com/getagentseal/lean-startup"
    - "clawhub:idea-to-startup (24 步)"
    - "wshobson/startup-metrics-framework"
license: Apache-2.0
platforms: [macos, linux]
prerequisites:
  env_vars: []
  commands: [bun]
compatibility: "Claude Code, OpenClaw 2026.4.25+, Hermes Agent v0.13.0+, Cursor, Codex"
---

# Playbook CN — 中文方法论 + 国内平台规则索引

## 用途

VST 内部知识库。其他 Skill 在需要方法论引用时 read 这里，不必重复嵌入完整方法论内容。

## 索引

### 1. Mom Test（Rob Fitzpatrick）

5 原则：
1. 谈他们的生活，不要你的 idea
2. 谈具体过去，不要泛泛未来
3. 闭嘴多听
4. 警惕：恭维 / 通论 / 未来式承诺
5. 看行为，不只是听语言

应用：客户访谈 / 调研问卷 / 用户测试

### 2. Lean Startup（Eric Ries）

Build → Measure → Learn 循环。
- MVP = Minimum Viable Product
- Pivot vs Persevere 决策点
- Innovation Accounting（创新会计）

### 3. Lean Canvas（Ash Maurya）

9 区块：
1. Problem
2. Customer Segments
3. Unique Value Proposition
4. Solution
5. Channels
6. Revenue Streams
7. Cost Structure
8. Key Metrics
9. Unfair Advantage

### 4. Sean Ellis 40% PMF Test

「如果不能再用这个产品，你会有多失望？」
- 非常失望 ≥ 40% → PMF 达成
- < 40% → 继续迭代

### 5. Jobs-to-be-Done（Bob Moesta + Clayton Christensen）

用户「雇佣」产品来完成 job。研究：hire / fire / current solution / desired outcome。

### 6. April Dunford Positioning

5 步定位：
1. Competitive alternatives
2. Unique attributes
3. Value
4. Customer who cares
5. Market category

### 7. YC Office Hours

6 forcing questions（见 founder-coach SKILL.md §Layer 1）。

### 8. Paul Graham Founder Heuristics

- Make something people want
- Talk to users
- Do things that don't scale
- Schlep blindness

### 9. Marc Lou Indie Hacker Playbook

- Ship fast, iterate fast
- Distribution > Product
- 每个项目 ≤ 2 周
- 多 venture portfolio

### 10. Balfour Four Fits（Brian Balfour）

- Product-Market Fit
- Market-Channel Fit
- Channel-Model Fit
- Model-Market Fit

### 11. Pirate Metrics AARRR

- Acquisition / Activation / Retention / Referral / Revenue

### 12. North Star Metric

定一个北极星指标，所有团队对齐。

### 13. Continuous Discovery（Teresa Torres）

- Opportunity Solution Tree
- Assumption Testing
- 每周客户访谈

## 国内平台 know-how 索引

平台规则详见 `references/platform-rules/*.md`（每个文件含 2025–2026 最新规则更新）：

- 小红书 → `references/platform-rules/xiaohongshu.md`
  - 历史规则：标题 ≤ 38 字 / 图视频不混用 / 标签 3-10 / 评论引导
  - 2025–2026 更新：笔记审核延迟 + 评论权重升级（2025 Q3）/ 账号分级 + 违禁词扩容（2026 Q1）
- 微信公众号 → `references/platform-rules/wechat-mp.md`
  - 历史规则：原创保护 / 标题 14 字决定打开 / 二条规则
  - 2025–2026 更新：订阅号信息流改版 + 视频号联动（2025 Q4）/ 付费阅读限制 + 伪原创检测升级（2026 Q1）
- 抖音 → `references/platform-rules/douyin.md`
  - 历史规则：5 秒钩子 / 完播率 / 千川 vs 自然流 / 垂直度
  - 2025–2026 更新：完播率权重下调 + 复看率 / 评论质量上调（2025 Q3）/ 违禁词收紧 + 垂直度评分降级（2026 Q1）
- 朋友圈 → `references/platform-rules/wechat-moments.md`
  - 历史规则：私域玩法 / 9 图节奏 / 互推 / 24h 删除
  - 2025–2026 更新：企微 + 个微整合 + 24h 可见（2025 Q4）/ 社群导流降权 + 三端互推白名单（2026 Q1）
- X/Twitter → `references/platform-rules/x-twitter.md`
  - 历史规则：钩子句 / 串推 / 数据可视化 / 时间窗
  - 2025–2026 更新：Premium 算法权重变化 + 长推文 vs 串推（2025 Q4）/ Community Notes 全球化 + Reply 排序（2026 Q2）

每条 2025–2026 更新含：发布时间 / 来源 / 影响 / 应对建议四个字段，供 Content Agent 在生成前做现场校准。

## 国内创业资源

- **OPC 社区**：即刻 / 雪球 / 36Kr / 虎嗅
- **流量平台**：小红书 / 抖音 / 公众号 / 视频号 / 即刻
- **变现工具**：知识星球 / 小报童 / 飞书文档付费
- **支付**：Stripe（海外）/ 微信支付 / 支付宝 / Lemon Squeezy
- **邮件**：Resend / Loops / 群发助手（国内）
- **建站**：Webflow / Framer / Vercel / Cloudflare Pages
- **数据**：Plausible / PostHog / Mixpanel

## 引用查找

Skills 调用方式：
```
读 lumilab-playbook-cn 的「Mom Test」段
读 lumilab-playbook-cn 的「Sean Ellis 40%」段
```

## 必做约束

```
✓ 只索引，不嵌入完整方法论（避免膨胀）
✓ 每个方法论给一句话总结 + 5-10 个核心点
✓ 每周可更新（加新方法论 / 调整索引）
```

## Dependencies

| 依赖 | 类型 | 是否付费 | 说明 |
|---|---|---|---|
| bun | CLI runtime | 免费 | ≥1.0，必需 |
| host LLM | 由 Claude Code / OpenClaw / Cursor / Hermes 提供 | 取决于宿主 | Lumi Lab 本身不直连 LLM，复用宿主 |

## Outputs

不写文件；通过 references/ 提供 13 方法论 + 5 平台规则

## Example

`@bot 引用 lumilab-playbook-cn 的「小红书发布约束」` → skill 返回相关条目

## Tests

`tests/smoke.md` — 该 skill 的最小冒烟测试约定：让 host LLM 在对话中跑通 SKILL.md「真实示例」段即视为通过。E2E 真集成见 `docs/TUTORIAL.zh.md`。

## Idempotency

reference 库追加为主，旧框架保留并标 `last_reviewed: <date>`。

## Privacy

所有方法论文本来自公开资料 + 用户笔记，本地存储。

## Cache

13 方法论 + 5 平台规则按 mtime 缓存；agent 按需 grep 加载，不每次全读。

## Failure modes

若用户引用方法论 ID 不存在 → 列出最相近 3 个建议。

## Edge cases

中文 / 英文术语双索引；同一方法论中文 / 英文表述都能命中。

## Alternatives

用户现在可能用什么替代方案，以及 Lumi Lab 为什么不一样：

- **通用 LLM 问方法论**：知道但不成体系，平台规则常过时。
- **散落的公众号文章 / 课程**：碎片化，没有统一索引。

Lumi Lab 的差异：13 个中文方法论 + 5 平台规则统一索引，中英术语双索引，2025–2026 规则更新。

## Moat（复利护城河）

references 库持续更新，你的笔记可以并进来。跑得越久，这就是你私人的创业方法论库。
