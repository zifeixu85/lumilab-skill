---
name: lumilab-product-mvp
description: |
  MVP = riskiest-assumption test, not minimum viable feature. Marty Cagan + Eric Ries lineage. Concierge / Wizard-of-Oz / fake door / smoke test / explainer video patterns. Lumi-Lab Chinese overlay with platform-aware fake-door scripts. Use when the user says they are about to write code / build an MVP, lists 10+ features for v1, or asks how to design a concierge or fake-door test.
  关键词：MVP / riskiest assumption / 最小可行产品 / 最高风险假设 / concierge / Wizard of Oz / fake door / smoke test / explainer video / 假门测试 / 烟雾测试
version: 1.5.0
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
license: AGPL-3.0-or-later
platforms: [macos, linux]
prerequisites:
  env_vars: []
  commands: [bun]
compatibility: "Claude Code, OpenClaw 2026.4.25+, Hermes Agent v0.13.0+, Cursor, Codex"
---


# product-mvp · MVP = 最高风险假设测试

**一句话价值（decision_support）**：纠正「MVP = 最小功能集」的误解——MVP 是验证**最高风险假设**的最小动作，帮你避免过早写一堆根本不该写的代码。

## 目标用户

准备动手写代码、或给 v1 列了 10+ 功能的**早期创始人 / 独立开发者**。不面向已验证需求、进入规模化的产品。

## 方法论核心

- **Marty Cagan + Eric Ries 谱系**：MVP 测的是「riskiest assumption」，不是功能多少。
- **5 种测试形态**：concierge（人肉先跑）/ Wizard-of-Oz（后台人工假装自动）/ fake door（假门测点击）/ smoke test（落地页测意愿）/ explainer video（视频测理解）。
- **国内 overlay**：fake-door 不止网页——小红书/朋友圈/海报的「假门」脚本，平台感知。

## 何时调用

用户说「我要开始写 MVP 了 / 列了一堆功能」，或问「concierge / fake-door 怎么设计」。

## 工作流程与用法

1. 列出所有假设 → 标出**最高风险**那个（错了就全错的）。
2. 选最轻的测试形态去测它（优先 concierge / fake door，不写代码）。
3. 定通过阈值 → 跑 → 喂 hypothesis-ledger / metrics。

示例：「给宠物主的健康记录 app」最高风险假设不是「能不能做」，是「主人愿不愿持续记录」→ 先用一个 fake-door 落地页测留资，而非先写 app。

## 输出

字段：最高风险假设 / 选定测试形态 / 通过阈值 / 第一步动作。落到 venture 假设与计划。

```text
idea: 宠物健康记录 app
最高风险假设 = 主人愿不愿持续记录(不是能不能做)
MVP = fake-door 落地页测留资  ❌ 先写 app
```

## 差异化与抗替代

- **vs 现有替代**：直接开干写代码（最贵的验证）、通用「帮我做个 MVP」（给功能清单，方向错了）。
- **为什么不是通用 LLM**：强制把「最小功能」纠正为「最高风险假设测试」，给**国内平台感知的 fake-door 脚本**，并接入 lumilab 的 landing/付款验证闭环。
- **沉淀**：风险假设与测试方式跨轮沉淀，形成你的验证打法。

## 异常路径 · 幂等 · 边界

功能堆叠时逼问「哪个假设错了就全白做」；给测试方案**不替你写代码**；样本不足提示先放量。

## 依赖与成本

纯知识叠加，无外部依赖、无网络；SKILL.md 精简，单次上下文成本低、可缓存。

## 安全与隐私

纯本地、不外传、不处理 PII。

## 深入参考

完整操作细节（详细流程 / 表格 / 边界 / 分支决策）见 `references/full-guide.md`，宿主执行流水线时按需加载。

## Changelog

- 1.5.0：精简至 ≤6000 字、补齐 rubric 维度，强化「riskiest assumption」与国内 fake-door 差异化。
