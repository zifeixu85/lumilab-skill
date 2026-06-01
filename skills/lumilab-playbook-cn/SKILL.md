---
name: lumilab-playbook-cn
description: |
  Chinese-language methodology playbook for venture validation. Index of 13 frameworks (Mom Test / Lean Canvas / Sean Ellis 40% / Bob Moesta JTBD / April Dunford / YC office hours / etc.) plus China-specific platform rules. Pure knowledge skill, read by other Skills when they need methodology references. Use when user asks 「这个方法论是什么」「Mom Test 怎么用」「PMF 怎么测」etc.
  关键词：方法论 / playbook / 创业知识 / Mom Test / Lean Canvas / PMF / JTBD / 中文方法论 / 国内平台规则
version: 1.5.0
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
license: AGPL-3.0-or-later
platforms: [macos, linux]
prerequisites:
  env_vars: []
  commands: [bun]
compatibility: "Claude Code, OpenClaw 2026.4.25+, Hermes Agent v0.13.0+, Cursor, Codex"
---


# playbook-cn · 中文方法论知识库

**一句话价值（learning）**：13 套创业框架(Mom Test/Lean Canvas/40%/JTBD/Dunford/YC...) + 国内平台规则的中文单一索引，被其它 skill 读取。

## 目标用户

想查「某方法论怎么用」的中文创业者，以及需要方法论引用的其它 skill。不面向要执行动作而非查方法论的场景。

## 核心方法 / 能力

13 框架索引：Mom Test、Lean Canvas、Sean Ellis 40%、Bob Moesta JTBD、April Dunford、YC office hours 等 + 国内平台(小红书/公众号/抖音)规则。纯知识地基，供其它 skill 引用。

## 何时调用

用户问「Mom Test 怎么用 / PMF 怎么测 / 这个方法论是什么」，或其它 skill 需要方法论引用。

## 工作流程与用法

1. 按主题查框架。2. 给出框架核心 + 适用边界。3. 其它 skill 读取作为方法论依据。

```text
查询: "PMF 怎么测?"
→ Sean Ellis 40% 调查 + 留存曲线
未收录 → 给最近邻框架 + 说明边界
```

## 输出

字段：框架名 / 核心 / 适用场景 / 国内平台规则。结构由 `scripts/validate-output.ts` 校验，anti-slop-lint 兜禁词。

## 差异化与抗替代

- **vs 现有替代**：散落课程/书里的方法论、英文资料(国内场景缺位)。
- **为什么不是通用 LLM**：13 框架 + 国内平台规则的中文单一索引，被全 bundle 复用、统一口径，纯 LLM 知识散乱无版本。
- **沉淀**：方法论知识库被全 bundle 复用，是共享地基。

## 异常路径 · 幂等 · 边界

未收录方法论时给最近邻 + 说明边界；纯读无副作用、幂等。

## 依赖与成本

纯知识库、无外部依赖；SKILL.md 精简、scripts/ 按需加载，单次上下文成本低、可缓存。

## 安全与隐私

纯本地知识、不外传。

## 深入参考

完整操作细节（详细流程 / 表格 / 边界 / 分支决策）见 `references/full-guide.md`，宿主执行流水线时按需加载。

## Changelog

- 1.5.0：精简至 ≤6000 字、补齐 rubric 维度（目标用户/差异化与抗替代/异常·幂等·边界/依赖/安全），提升可发现性、可缓存性与稳定性表达。
