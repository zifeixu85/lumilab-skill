---
name: lumilab-idea-to-landing
description: |
  One-sentence idea → autonomous market analysis → direction proposals → a fake-door validation landing page that measures real purchase intent. The default Lumi Lab entry point for validating C-end startup ideas. An autoplan-style orchestrator: it runs the whole pipeline autonomously, asks the user AT MOST twice (one optional intake, one direction-pick gate), and delivers visual HTML artifacts the user actually sees — not silent .md files. Use when the user gives a startup idea, says "帮我看看这个想法 / 验证一下 / 做个 landing", or wants to go from idea to a testable landing page fast.
  关键词：idea 验证 / 一句话想法 / 市场分析 / 竞品分析 / 方向建议 / landing 生成 / SEO / GEO / orchestrator / 自动流水线 / idea to landing / 想法落地 / 轻量验证
version: 1.5.0
license: Apache-2.0
platforms: [macos, linux]
prerequisites:
  env_vars: []
  commands: [bun]
compatibility: "Claude Code, OpenClaw 2026.4.25+, Hermes Agent v0.13.0+, Cursor, Codex"
metadata:
  lumilab:
    tier: core
    requires_browser: false
    chat_only_ok: true
  hermes:
    tags: [idea-to-landing, orchestrator, market-analysis, landing-page, seo, geo, validation]
  category: orchestrator
  agent: idea_pipeline
  authors: [lumilab]
  upstream:
    - "gstack/autoplan (one-command auto-decision pipeline, surface only taste gates)"
    - "gstack/office-hours (decision-brief AskUserQuestion format, smart stage routing)"
  outputs:
    - "~/.lumilab/data/ventures/<slug>/project_brief.md (idea + 极简 intake)"
    - "~/.lumilab/data/ventures/<slug>/market_analysis.json (自动分析结果，喂给报告渲染器)"
    - "~/.lumilab/data/ventures/<slug>/reports/market-report.html (图文并茂分析报告，主动交付给用户)"
    - "~/.lumilab/data/ventures/<slug>/landing/ (最终 landing page，带 SEO/GEO)"
    - "~/.lumilab/data/ventures/<slug>/decisions.yaml (方向选择记录)"
  reads:
    - "~/.lumilab/secrets.json 或 keychain (判断有没有 TikHub/Tavily token → 真 API vs 宿主 LLM 知识)"
    - "MEMORY.md (用户偏好)"
---


# idea-to-landing · 一句话想法到验证页

**一句话价值（productivity）**：一句话 idea → 自动市场分析 → 方向建议 → 一个测真实购买意愿的 fake-door 验证页。默认入口，自动跑全程、最多问你 2 次、产出你看得见的 HTML。

## 目标用户

给一句话创业 idea、想快速从想法到可测落地页的独立开发者/副业人。不面向已过验证阶段、要做成品的项目。

## 核心方法 / 能力

autoplan 式编排器：自动跑 分析→HTML 报告→方向选择门→landing 全流水线。EXECUTION CONTRACT 强制 Phase 1-2 零提问、Phase 3 后不准停。最多问用户 2 次(一次可选 intake、一次方向门)。产出可见 HTML 而非静默 .md。

## 何时调用

用户给一句话 idea、说「帮我看看这个想法/验证一下/做个 landing」，或要从 idea 快到可测落地页。

## 工作流程与用法

1. 一句话 idea 进。2. 自动分析→HTML 报告→方向门(用户选一次)→生成 fake-door landing。3. 部署收数据。

```text
lumilab idea "给宠物主的健康记录工具"
→ 自动: 市场分析 → HTML 报告 → 方向门 → landing
→ 全程最多问 2 次
```

## 输出

字段：market_analysis.json / 方向候选 / landing/v<n> / 验证页。结构由 `scripts/validate-output.ts` 校验，anti-slop-lint 兜禁词。

## 差异化与抗替代

- **vs 现有替代**：手翻方法论+手搭 landing+手发(串不起来)、Lovable/v0(跳过验证直接 build)。
- **为什么不是通用 LLM**：autoplan 式自动编排全流水线 + 强制零提问 + 产出可见 HTML，纯 LLM 不会自动跑多阶段并托管产物。
- **沉淀**：一条 idea 的分析/方向/landing/数据跨阶段累积，越跑越深。

## 异常路径 · 幂等 · 边界

Phase 1-2 零提问、Phase 3 后不准停；数据不足降级不报错；幂等重入。

## 依赖与成本

bun；编排各子 skill，宿主提供 LLM，无额外外部 API；SKILL.md 精简、scripts/ 按需加载，单次上下文成本低、可缓存。

## 安全与隐私

纯本地、idea 与数据都在你机器上、不外传。

## 深入参考

完整操作细节（详细流程 / 表格 / 边界 / 分支决策）见 `references/full-guide.md`，宿主执行流水线时按需加载。

## Changelog

- 1.5.0：精简至 ≤6000 字、补齐 rubric 维度（目标用户/差异化与抗替代/异常·幂等·边界/依赖/安全），提升可发现性、可缓存性与稳定性表达。
