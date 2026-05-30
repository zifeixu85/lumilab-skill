---
name: lumilab-hypothesis-ledger
description: |
  Atomic hypothesis ledger for Lumi Lab. Track startup hypotheses as YAML facts with supersede history, confidence scoring, test methods, and verification counts. Generates HTML diff view when hypothesis evolves. Use when user wants to add/update/supersede/list hypotheses, when Research Agent finds evidence that contradicts a hypothesis, when Review Agent runs weekly retro, or when ven­ture decision needs traceable history.
  关键词：假设 / 假设管理 / hypothesis / ledger / 创业假设 / supersede / 复盘 / 验证 / Mom Test / lean startup / atomic fact
version: 1.5.0
metadata:
  hermes:
    tags: [hypothesis, atomic-fact, supersede, lean-startup]
  lumilab:
    tier: core
    requires_browser: false
    chat_only_ok: true
  category: foundation
  agent: review
  authors: [lumilab]
  upstream:
    - "para-memory-files (~/.claude/skills/para-memory-files)"
    - "obra/superpowers-skills/collaboration/remembering-conversations"
  outputs:
    - "data/ventures/<name>/hypotheses.yaml"
    - "data/ventures/<name>/studio/preview/hypothesis-diff.html (Thariq diff view)"
  reads:
    - "data/ventures/<name>/research/*.md (Research Agent 写入的证据)"
    - "data/ventures/<name>/decisions.yaml (相关决策)"
license: Apache-2.0
platforms: [macos, linux]
prerequisites:
  env_vars: []
  commands: [bun]
compatibility: "Claude Code, OpenClaw 2026.4.25+, Hermes Agent v0.13.0+, Cursor, Codex"
---


# hypothesis-ledger · 原子假设账本

**一句话价值（decision_support）**：把创业假设当原子事实追踪：supersede 历史 + 置信度 + 验证次数 + HTML diff——是 venture 最值钱的可追溯记忆。

## 目标用户

要把创业假设当原子事实追踪/supersede/复盘的独立创业者。不面向不做假设驱动验证的随意试错。

## 核心方法 / 能力

原子事实账本(YAML)。每条假设含 fact/confidence/test_method/test_status/evidence。supersede 时旧版标记保留、新版取代，留完整演化史。假设演化时生成 HTML diff。

## 何时调用

用户要 add/update/supersede/list 假设，Research Agent 发现矛盾证据，或周复盘需要可追溯历史。

## 工作流程与用法

1. add 新假设(原子事实)。2. 有证据→update/supersede(旧版保留)。3. list/diff 看演化史 → 喂 next-actions。

```text
add: "用户愿意付费" confidence=medium
supersede h-001 → h-004 (新证据: 4 笔付款)
旧版保留, 留演化史
```

## 输出

字段：id / fact / confidence / test_method / test_status / evidence / superseded_by。结构由 `scripts/validate-output.ts` 校验，anti-slop-lint 兜禁词。

## 差异化与抗替代

- **vs 现有替代**：假设记脑子里/散在笔记、通用 todo(无置信度无历史)。
- **为什么不是通用 LLM**：原子事实 + supersede 历史 + 置信度 + HTML diff，纯 LLM 给不出可追溯、可回溯的假设演化账本。
- **沉淀**：假设演化史跨轮累积，是 venture 最值钱的记忆。

## 异常路径 · 幂等 · 边界

supersede 保留旧版不删；幂等覆盖写；找不到 id 报错明确。

## 依赖与成本

bun + js-yaml；纯本地 YAML；SKILL.md 精简、scripts/ 按需加载，单次上下文成本低、可缓存。

## 安全与隐私

纯本地、不外传、不处理 PII。

## 深入参考

完整操作细节（详细流程 / 表格 / 边界 / 分支决策）见 `references/full-guide.md`，宿主执行流水线时按需加载。

## Changelog

- 1.5.0：精简至 ≤6000 字、补齐 rubric 维度（目标用户/差异化与抗替代/异常·幂等·边界/依赖/安全），提升可发现性、可缓存性与稳定性表达。
