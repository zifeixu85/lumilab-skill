---
name: lumilab-product-positioning
description: |
  April Dunford 5-step positioning (competitive alternatives → unique attributes → value → customers who care → market category). Lumi-Lab overlay with Anti-Slop and platform constraints. Use when the user asks how to introduce their product, has a landing page with high bounce, is stuck on "what market am I in", or growth has stalled and positioning is suspected.
  关键词：product-positioning / 产品定位 / 市场定位 / April Dunford / Obviously Awesome / 竞争性替代品 / 市场类别 / 定位陈述 / Lumi Lab overlay
version: 1.5.0
metadata:
  hermes:
    tags: [positioning, april-dunford, obviously-awesome]
  lumilab:
    tier: overlay
    requires_browser: false
    chat_only_ok: true
  category: agent
  agent: product
  upstream:
    - "alirezarezvani/product-discovery + product-strategist"
    - "April Dunford《Obviously Awesome》"
    - "April Dunford《Sales Pitch》"
  status: P0-overlay-minimal
  full_overlay_in: phase_1
  outputs:
    - "data/ventures/<name>/positioning.md"
    - "data/ventures/<name>/positioning_statement.md"
    - "data/ventures/<name>/competitive_alternatives.md"
  reads:
    - "data/ventures/<name>/audience.md"
    - "data/ventures/<name>/hypotheses.yaml"
    - "data/ventures/<name>/project_brief.md"
license: AGPL-3.0-or-later
platforms: [macos, linux]
prerequisites:
  env_vars: []
  commands: [bun]
compatibility: "Claude Code, OpenClaw 2026.4.25+, Hermes Agent v0.13.0+, Cursor, Codex"
---


# product-positioning · April Dunford 5 步定位

**一句话价值（decision_support）**：用 April Dunford 的 5 步把「我在哪个市场、为什么选我」讲清楚，给出可用的定位陈述——治 landing 高跳出、growth 停滞、说不清品类。

## 目标用户

说不清「我属于哪个市场」、landing 高跳出、或被问「跟 X 有什么不同」答不上的创始人。不面向定位已清晰、只缺执行的团队。

## 方法论核心

April Dunford《Obviously Awesome》5 步：① 列**竞争性替代品**（用户不买你会用什么，包括什么都不做）→ ② 找你**独特属性**（替代品没有的）→ ③ 把属性翻译成**价值** → ④ 锁定**最在意这价值的客户** → ⑤ 选一个**市场类别**让价值显而易见。

## 何时调用

用户问「怎么介绍我的产品 / 我在哪个市场 / 为什么选我不选 X」，或 landing 跳出高疑似定位问题。

## 工作流程与用法

1. 先列替代品（含 status quo）——定位是相对替代品的。
2. 逐步走 5 步 → 产出一句定位陈述（给谁、什么类别、独特价值）。
3. 喂 copy / landing-mvp 继承。

示例：一个「AI 周报工具」别定位成「又一个 AI 写作」，而是「给独立开发者的『自动追踪进度并生成投资人周报』」——类别换了，价值就显了。

## 输出

字段：竞争性替代品 / 独特属性 / 价值 / 目标客户 / 市场类别 / 定位陈述。落到 venture，被 copy/landing 继承。

```text
竞争性替代品 → 独特属性 → 价值 → 在意的客户 → 市场类别
例: "又一个 AI 写作" → "给独立开发者的自动投资人周报"(换类别, 价值即显)
```

## 差异化与抗替代

- **vs 现有替代**：自封一个时髦品类、通用「帮我定位」（给口号不给方法）。
- **为什么不是通用 LLM**：强制走 Dunford 5 步**从替代品反推类别**，产出可被 landing/copy 直接消费的定位陈述，而非一句漂亮话。
- **沉淀**：定位陈述被全产物继承、跨轮迭代。

## 异常路径 · 幂等 · 边界

缺竞品输入时先补「替代品」再往下；给候选定位**不替你拍板**最终类别。

## 依赖与成本

纯知识叠加，无外部依赖；SKILL.md 精简，单次上下文成本低、可缓存。

## 安全与隐私

纯本地、不外传、不处理 PII。

## 深入参考

完整操作细节（详细流程 / 表格 / 边界 / 分支决策）见 `references/full-guide.md`，宿主执行流水线时按需加载。

## Changelog

- 1.5.0：精简至 ≤6000 字、补齐 rubric 维度，强化「从替代品反推类别」差异化。
