---
name: lumilab-research-icp
description: |
  Ideal Customer Profile 精准建模。Bob Moesta JTBD switch interview + Sean Ellis 40% PMF survey + April Dunford segment-of-one。把"目标用户"逼成"一个具体的人 + 一个具体的挣扎瞬间 + 一个具体的替代品"。Use when 用户说"我的用户是 X"但 X 太宽（开发者/中小企业/年轻人/创业者），或在做 landing / copy / cold outreach 前需要锁定第一波打谁。
  关键词：ICP / ideal customer profile / 精准用户 / JTBD / Jobs to be Done / switch interview / struggling moment / Sean Ellis 40% / 必备问题 / 反"所有人"
version: 1.5.0
metadata:
  hermes:
    tags: [icp, jtbd, segment, customer-profile]
  lumilab:
    tier: overlay
    requires_browser: false
    chat_only_ok: true
  category: agent
  agent: research
  authors: [lumilab]
  upstream:
    - "openclaudia/icp-builder"
    - "Bob Moesta — Demand-Side Sales / The Re-Wired Group"
    - "Sean Ellis — 40% must-have PMF survey"
    - "April Dunford — Obviously Awesome (segment-of-one positioning)"
    - "Clayton Christensen — Jobs To Be Done"
  outputs:
    - "data/ventures/<name>/icp.yaml"
    - "data/ventures/<name>/icp.md (human-readable)"
    - "data/ventures/<name>/jtbd_struggling_moments.md"
  reads:
    - "data/ventures/<name>/yc_brief.md (如有)"
    - "data/ventures/<name>/interviews/*.md (访谈转录)"
license: AGPL-3.0-or-later
platforms: [macos, linux]
prerequisites:
  env_vars: []
  commands: [bun]
compatibility: "Claude Code, OpenClaw 2026.4.25+, Hermes Agent v0.13.0+, Cursor, Codex"
---


# research-icp · 精准 ICP 建模

**一句话价值（decision_support）**：把「目标用户」从「开发者/中小企业」这种宽泛词，逼成「一个具体的人 + 一个挣扎瞬间 + 一个替代品」。

## 目标用户

说「我的用户是 X」但 X 太宽、要锁第一波打谁的创始人。不面向ICP 已精确锁定的团队。

## 核心方法 / 能力

Bob Moesta JTBD switch interview(用户从什么切换到什么、那一刻的挣扎) + Sean Ellis 40% 必备问题 + April Dunford segment-of-one。把人群收窄到「能指名道姓的一个人 + 一个具体场景」。

## 何时调用

用户人群描述太宽(开发者/中小企业/年轻人)，或做 landing/copy/cold outreach 前要锁第一波。

## 工作流程与用法

1. 写下当前人群描述。2. 用 JTBD 逼到「一个挣扎瞬间 + 一个被替代的方案」。3. 产出 segment-of-one 画像 → 喂 copy/outreach。

```text
宽: "给开发者"
收窄: 刚发布独立产品、卡在没人知道、现在手动发推的独立开发者
挣扎瞬间: 上线当天只有 3 个访客
```

## 输出

字段：当前人群 / 挣扎瞬间 / 被替代方案 / segment-of-one 画像 / 必备问题答案。结构由 `scripts/validate-output.ts` 校验，anti-slop-lint 兜禁词。

## 差异化与抗替代

- **vs 现有替代**：「我的用户是所有人」、通用人群描述(无场景)。
- **为什么不是通用 LLM**：强制收窄到 segment-of-one + 挣扎瞬间，给可直接喂 copy/outreach 的精准画像，纯 LLM 易给宽泛标签。
- **沉淀**：ICP 模型被 copy/outreach 继承、跨轮收敛。

## 异常路径 · 幂等 · 边界

人群过宽时强制收窄；样本不足提示先访谈；给候选画像不替拍板。

## 依赖与成本

纯知识叠加，无外部依赖；SKILL.md 精简、scripts/ 按需加载，单次上下文成本低、可缓存。

## 安全与隐私

访谈数据纯本地、脱敏、不外传。

## 深入参考

完整操作细节（详细流程 / 表格 / 边界 / 分支决策）见 `references/full-guide.md`，宿主执行流水线时按需加载。

## Changelog

- 1.5.0：精简至 ≤6000 字、补齐 rubric 维度（目标用户/差异化与抗替代/异常·幂等·边界/依赖/安全），提升可发现性、可缓存性与稳定性表达。
