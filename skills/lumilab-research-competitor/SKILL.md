---
name: lumilab-research-competitor
description: |
  Competitor / alternative landscape 真的有用的那种。不做 feature matrix。基于 April Dunford 竞争定位框架 + Clayton Christensen disruption theory + "alternatives to nothing" 思维。把"竞品"扩展为：直接竞品 / 间接替代品 / status quo（什么都不做） / forced-choice 替代。Use when 用户准备做定位、写 landing、要回答"为什么选你不选 X"，或在 pivot 前想看清楚周围地形。
  关键词：competitor / 竞品分析 / 替代品 / alternatives / April Dunford / positioning / disruption / 反 feature matrix / status quo
version: 1.5.0
metadata:
  hermes:
    tags: [competitor, positioning, april-dunford, christensen]
  lumilab:
    tier: overlay
    requires_browser: false
    chat_only_ok: true
  category: agent
  agent: research
  authors: [lumilab]
  upstream:
    - "alirezarezvani/competitive-intel"
    - "alter123/idea-validator-zh"
    - "April Dunford — Obviously Awesome, Sales Pitch"
    - "Clayton Christensen — Innovator's Dilemma, Disruptive Innovation"
    - "Andy Raskin — Greatest Sales Deck (strategic narrative)"
  outputs:
    - "data/ventures/<name>/competitor_landscape.md"
    - "data/ventures/<name>/positioning.yaml"
    - "data/ventures/<name>/alternatives_quadrant.md"
  reads:
    - "data/ventures/<name>/icp.yaml"
    - "data/ventures/<name>/yc_brief.md"
license: Apache-2.0
platforms: [macos, linux]
prerequisites:
  env_vars: []
  commands: [bun]
compatibility: "Claude Code, OpenClaw 2026.4.25+, Hermes Agent v0.13.0+, Cursor, Codex"
---


# research-competitor · 竞争地形图

**一句话价值（decision_support）**：不做 feature matrix——把「竞品」扩成 直接/间接替代/status quo(什么都不做)/forced-choice，帮你回答「为什么选你不选 X」。

## 目标用户

准备做定位/写 landing、要回答「为什么选你」的创始人。不面向只想要功能对比表的人。

## 核心方法 / 能力

基于 April Dunford 竞争定位 + Clayton Christensen 颠覆理论。四类替代：直接竞品 / 间接替代品 / status quo(用户什么都不做) / forced-choice(被迫二选一)。重点是 status quo——多数用户的真实替代是「继续凑合」。

## 何时调用

用户准备定位/写 landing、问「为什么选你不选 X」，或 pivot 前想看清地形。

## 工作流程与用法

1. 先列 status quo(用户不买你时怎么凑合)。2. 列直接/间接替代 + forced-choice。3. 找你相对每类的独特价值 → 喂 positioning/landing。

```text
status quo: 用户现在用 Excel 手记
直接: Notion 模板  间接: 记账 app
你的独特价值 = 自动化 + 行业模板(替代品都没有)
```

## 输出

字段：status_quo / 直接替代 / 间接替代 / forced-choice / 各自缺口 / 你的独特价值。结构由 `scripts/validate-output.ts` 校验，anti-slop-lint 兜禁词。

## 差异化与抗替代

- **vs 现有替代**：罗列功能对比表(没人看)、通用竞品搜索(不分类)。
- **为什么不是通用 LLM**：把竞品重构为含 status quo 的四类替代、反 feature matrix，产出可被 positioning 直接消费的地形图。
- **沉淀**：竞争地形图跨轮沉淀、pivot 前复用。

## 异常路径 · 幂等 · 边界

无数据时先列 status quo 替代；给地形不替结论；分页/抓取失败降级。

## 依赖与成本

bun；SERP 深度可借 Playwright/Tavily(可选)，无强外部依赖；SKILL.md 精简、scripts/ 按需加载，单次上下文成本低、可缓存。

## 安全与隐私

只读公开信息、不外传、不处理 PII。

## 深入参考

完整操作细节（详细流程 / 表格 / 边界 / 分支决策）见 `references/full-guide.md`，宿主执行流水线时按需加载。

## Changelog

- 1.5.0：精简至 ≤6000 字、补齐 rubric 维度（目标用户/差异化与抗替代/异常·幂等·边界/依赖/安全），提升可发现性、可缓存性与稳定性表达。
