---
name: lumilab-weekly-sop-runner
description: |
  7-day standard operating procedure (SOP) generator for venture validation experiments. Generates Day 0-7 blueprint with self-contained cold-start brief per day, content publishing calendar, data collection table, decision thresholds. Registers paperclip routines (P0 structure only, P1 enables actual cron). Use when user types /lumilab launch or /lumilab sop, after content is generated.
  关键词：7 天 SOP / 增长实验 / launch plan / 冷启动 / cron / blueprint / 发布日历 / 数据回收 / 决策阈值 / paperclip routines / OKR / Pirate metrics
version: 1.5.0
metadata:
  hermes:
    tags: [sop, growth, 7-day, retro]
  lumilab:
    tier: core
    requires_browser: false
    chat_only_ok: true
  category: agent
  agent: sop_growth
  upstream:
    - "github.com/wshobson/startup-metrics-framework (6.3K 安装最多)"
    - "github.com/ognjengt/{go-to-market-plan,sop-creator,outreach-specialist}"
    - "github.com/skenetechnologies/growth-experimentation"
    - "github.com/aitytech/launch-strategy (PH + waitlist + beta 顺序)"
    - "~/.claude/skills/blueprint (5-phase pipeline)"
    - "~/.claude/skills/paperclip (heartbeat + routines)"
    - "~/.claude/skills/autoplan (decision framework)"
  outputs:
    - "data/ventures/<name>/growth_sop.md (7 日 blueprint)"
    - "data/ventures/<name>/content_calendar.md (发布日历)"
    - "data/ventures/<name>/validation_metrics.csv (数据回收表)"
    - "data/ventures/<name>/decision_thresholds.md (决策阈值)"
    - "data/ventures/<name>/task_list.md (每日任务清单)"
  reads:
    - "data/ventures/<name>/content/*.md (各平台已生成的内容)"
    - "data/ventures/<name>/hypotheses.yaml (要验证什么)"
    - "data/ventures/<name>/metrics.md (Primary / Guardrail / Secondary 指标)"
    - "memory/resources/platform-rules/*.md (各平台发布时机)"
license: Apache-2.0
platforms: [macos, linux]
prerequisites:
  env_vars: []
  commands: [bun]
compatibility: "Claude Code, OpenClaw 2026.4.25+, Hermes Agent v0.13.0+, Cursor, Codex"
---


# weekly-sop-runner · 7 天 SOP + 周复盘

**一句话价值（productivity）**：把验证跑成 7 天 SOP(每日自含冷启 brief + 发布日历 + 数据回收 + 决策阈值) + 周复盘四桶——结构化到可照做。

## 目标用户

要把验证跑成节奏化 7 天 SOP + 周复盘的独立创业者。不面向不做节奏化验证的随意试错。

## 核心方法 / 能力

7 天 blueprint(Day0-7 每日自含 brief) + 内容发布日历 + 数据回收表 + 决策阈值 + 周复盘四桶(强/中/弱/已迭代)。复盘信号喂 next-actions。

## 何时调用

用户 /lumilab launch 或 sop，内容生成后；周末 /lumilab retro 复盘。

## 工作流程与用法

1. 生成 7 天 SOP + 日历 + 回收表 + 阈值。2. 跑一周。3. 周复盘四桶填信号 → 喂 next-actions。

```text
Day0: 落地页上线  Day1-3: 3社群放量  Day7: 复盘
阈值: UV≥100 且 CTA≥6% → 继续; 否则换钩子
复盘四桶: 强/中/弱/已迭代
```

## 输出

字段：strong / mid / weak / iterated / next_direction（周复盘四桶）。结构由 `scripts/validate-output.ts` 校验，anti-slop-lint 兜禁词。

## 差异化与抗替代

- **vs 现有替代**：自己排计划(无阈值)、通用「给个增长计划」(不可照做)。
- **为什么不是通用 LLM**：7 天每日自含 brief + 量化决策阈值 + 复盘四桶，接 next-actions 形成验证闭环，纯 LLM 给不出可持久化的节奏与回收表。
- **沉淀**：复盘四桶信号喂 next-actions、跨周沉淀。

## 异常路径 · 幂等 · 边界

数据缺失时四桶可空填；幂等重渲；不替拍板 pivot。

## 依赖与成本

bun；读本地 venture 数据，无外部 API；SKILL.md 精简、scripts/ 按需加载，单次上下文成本低、可缓存。

## 安全与隐私

纯本地、不外传、不收 PII。

## 深入参考

完整操作细节（详细流程 / 表格 / 边界 / 分支决策）见 `references/full-guide.md`，宿主执行流水线时按需加载。

## Changelog

- 1.5.0：精简至 ≤6000 字、补齐 rubric 维度（目标用户/差异化与抗替代/异常·幂等·边界/依赖/安全），提升可发现性、可缓存性与稳定性表达。
