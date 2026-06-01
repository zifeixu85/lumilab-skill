---
name: lumilab-research-interview
description: |
  用户访谈脚本与教练。基于 Rob Fitzpatrick The Mom Test 三原则 + Bob Moesta JTBD switch interview + 5 layers of why。生成访谈提纲、识别 8 种访谈反模式、按 saturation 规则（5-8 个达到饱和）判断是否够、把录音转录提炼成可用结构化数据。Use when 用户准备打第一批冷启动电话、准备做 ICP 验证访谈、已经做了几次访谈但拿到的回答全是空话。
  关键词：interview / Mom Test / 用户访谈 / JTBD switch / 5 whys / 访谈脚本 / 访谈反模式 / saturation / 妈妈测试
version: 1.5.0
metadata:
  hermes:
    tags: [mom-test, interview, jtbd-switch, 5-whys]
  lumilab:
    tier: overlay
    requires_browser: false
    chat_only_ok: true
  category: agent
  agent: research
  authors: [lumilab]
  upstream:
    - "paperclipai/interview-script"
    - "phuryn/interview-script"
    - "Rob Fitzpatrick — The Mom Test"
    - "Bob Moesta — Demand-Side Sales (switch interview)"
    - "Erika Hall — Just Enough Research"
    - "Sakichi Toyoda — 5 Whys"
  outputs:
    - "data/ventures/<name>/interview_script.md"
    - "data/ventures/<name>/interviews/<id>.md (单次转录)"
    - "data/ventures/<name>/interview_synthesis.md (≥5 次后聚合)"
  reads:
    - "data/ventures/<name>/icp.yaml"
    - "data/ventures/<name>/hypotheses.yaml"
license: AGPL-3.0-or-later
platforms: [macos, linux]
prerequisites:
  env_vars: []
  commands: [bun]
compatibility: "Claude Code, OpenClaw 2026.4.25+, Hermes Agent v0.13.0+, Cursor, Codex"
---


# research-interview · 用户访谈教练

**一句话价值（decision_support）**：教你打第一批冷启动访谈、不拿到客气空话——基于 The Mom Test，问过去与具体，不问「你会喜欢吗」。

## 目标用户

准备打第一批冷启动访谈、却总拿到空话的独立创业者。不面向已有充足一手洞察的团队。

## 核心方法 / 能力

Rob Fitzpatrick《The Mom Test》三原则(聊他们的生活非你的点子、问具体过去非泛泛未来、少说多听) + Bob Moesta JTBD switch + 5 whys。识别 8 种访谈反模式，按 saturation(5-8 个)判够。

## 何时调用

用户准备打第一批冷启动电话/做 ICP 验证访谈，或访谈拿到的全是空话。

## 工作流程与用法

1. 生成访谈提纲(只问过去与具体)。2. 实访中识别反模式(对方在恭维/假设)。3. 5-8 个达饱和 → 转录提炼成结构化洞察。

```text
❌ "你会用这个吗?"(诱导)
✓ "上次遇到这问题你具体怎么做的?"(过去+具体)
饱和: 第6个访谈无新信息 → 够了
```

## 输出

字段：访谈提纲 / 反模式标记 / 结构化洞察 / 饱和判定。结构由 `scripts/validate-output.ts` 校验，anti-slop-lint 兜禁词。

## 差异化与抗替代

- **vs 现有替代**：随便问问(拿客气话)、引导式问题(诱导出假需求)。
- **为什么不是通用 LLM**：强制 Mom Test 问过去与具体 + 8 种反模式识别 + saturation 判定，把录音提炼成可用数据，纯 LLM 不会主动纠正诱导式提问。
- **沉淀**：访谈语料与洞察跨轮沉淀。

## 异常路径 · 幂等 · 边界

拿到空话时回到 Mom Test 改问法；样本不足提示继续；不替下结论。

## 依赖与成本

纯知识叠加，无外部依赖；SKILL.md 精简、scripts/ 按需加载，单次上下文成本低、可缓存。

## 安全与隐私

访谈数据纯本地、脱敏、不外传。

## 深入参考

完整操作细节（详细流程 / 表格 / 边界 / 分支决策）见 `references/full-guide.md`，宿主执行流水线时按需加载。

## Changelog

- 1.5.0：精简至 ≤6000 字、补齐 rubric 维度（目标用户/差异化与抗替代/异常·幂等·边界/依赖/安全），提升可发现性、可缓存性与稳定性表达。
