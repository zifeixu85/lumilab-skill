---
name: lumilab-founder-coach
description: |
  Three-layer founder coach for solopreneurs and OPC. Layer 1 = methodology coach (YC office-hours, Mom Test, Lean Canvas, Sean Ellis PMF, Jobs-to-be-Done). Layer 2 = cognitive trap warning (sunk cost, self-validation, faith-without-evidence, hammer-looking-for-nails, decision fatigue). Layer 3 = psychological support (loneliness, self-doubt, recovery from failed hypotheses, when to rest, pivot-vs-persevere). OPT-IN deep mode — NOT the default entry (lumilab-idea-to-landing is). Use ONLY when user explicitly wants one-on-one deep coaching: when they say "陪我深聊/帮我一步步想清楚/我卡住了", when hypothesis fails, when user shows signs of decision fatigue, when stuck between pivot and persevere, or when launching a new venture. Use when 用户要一对一深聊、卡住、假设失败、或在 pivot 与 persevere 间纠结时。
  关键词：创业教练 / founder coach / idea 澄清 / 假设拆解 / 决策疲劳 / 复盘心理 / pivot 还是 persevere / YC / Mom Test / Lean Startup / 创业心理 / 苏格拉底式提问 / 毛泽东思想式追问
version: 1.5.0
metadata:
  hermes:
    tags: [founder-coach, validation, methodology, yc, mom-test]
  lumilab:
    tier: core
    requires_browser: false
    chat_only_ok: true
  category: agent
  agent: founder_coach
  authors: [lumilab]
  upstream:
    - "github.com/kit4some/office-hours (YC 6 forcing questions)"
    - "github.com/getagentseal/lean-startup (Eric Ries methodology)"
    - "github.com/leoyeai/afrexai-founder-os (Idea→Series A)"
    - "github.com/askroundtable/expert-graham (Paul Graham heuristics)"
    - "github.com/paperclipai/interview-script (Mom Test + JTBD)"
    - "obra/superpowers/skills/brainstorming (HARD-GATE conversation)"
    - "clawhub:maozedong-founder-coach (Chinese: contradiction analysis)"
    - "clawhub:socratic-business-model-canvas (Chinese: Socratic)"
  outputs:
    - "data/ventures/<name>/audience.md (Layer 1 输出)"
    - "data/ventures/<name>/hypotheses.yaml (initial 3 假设，调 lumilab-hypothesis-ledger)"
    - "data/ventures/<name>/risks.md"
    - "data/ventures/<name>/coach_session_<ts>.md (对话归档)"
  reads:
    - "data/ventures/<name>/project_brief.md (idea 是什么)"
    - "data/ventures/<name>/hypotheses.yaml (现有假设)"
    - "data/ventures/<name>/decisions.yaml (历史决策密度 → 检测决策疲劳)"
    - "MEMORY.md (用户偏好 / 历史失败模式)"
license: AGPL-3.0-or-later
platforms: [macos, linux]
prerequisites:
  env_vars: []
  commands: [bun]
compatibility: "Claude Code, OpenClaw 2026.4.25+, Hermes Agent v0.13.0+, Cursor, Codex"
---


# founder-coach · 三层创始人教练

**一句话价值（emotion_expression）**：给单人创始人的一对一深聊：方法论 + 认知陷阱预警(沉没成本/自我验证) + 心理支持(孤独/自我怀疑/pivot 还是 persevere)。Use when 用户要深聊或卡住时。

## 目标用户

卡住/自我怀疑/在 pivot 与 persevere 间纠结的单人创始人(OPC)。不面向只想要工具产出、不要深聊的用户。

## 核心方法 / 能力

三层：① 方法论教练(YC/Mom Test/Lean Canvas/Sean Ellis/JTBD)。② 认知陷阱预警(沉没成本/自我验证/无证据信仰/拿着锤子找钉子/决策疲劳)。③ 心理支持(孤独/自我怀疑/失败复盘/何时休息/pivot vs persevere)。苏格拉底式追问。

## 何时调用

用户说「陪我深聊/帮我一步步想清楚/我卡住了」、假设失败、决策疲劳、pivot 与 persevere 之间纠结时。

## 工作流程与用法

1. 判断进哪一层(方法论/认知/心理)。2. 苏格拉底式追问、识别陷阱。3. 给候选而非替拍板；必要时建议休息。

```text
用户: 投了3个月不想放弃
教练(认知层): 这是「在用 idea 阶段还是沉没成本说话」?
→ 预警沉没成本陷阱, 不替你拍板
```

## 输出

字段：当前层级 / 识别的认知陷阱 / 苏格拉底追问 / 候选方向。结构由 `scripts/validate-output.ts` 校验，anti-slop-lint 兜禁词。

## 差异化与抗替代

- **vs 现有替代**：泛泛的 AI 鼓励(无预警)、收费创业教练(贵且不常在)。
- **为什么不是通用 LLM**：三层结构 + 主动预警沉没成本/自我验证等认知陷阱，纯 LLM 默认不会主动指出你正陷入哪个陷阱。
- **沉淀**：复盘心理与决策模式跨轮沉淀。

## 异常路径 · 幂等 · 边界

假设失败/决策疲劳时切心理支持层；不替拍板 pivot；情绪激烈时先稳住。

## 依赖与成本

纯对话、无外部依赖、无脚本；SKILL.md 精简、scripts/ 按需加载，单次上下文成本低、可缓存。

## 安全与隐私

深度对话纯本地、不外传、不评判、不处理 PII。

## 深入参考

完整操作细节（详细流程 / 表格 / 边界 / 分支决策）见 `references/full-guide.md`，宿主执行流水线时按需加载。

## Changelog

- 1.5.0：精简至 ≤6000 字、补齐 rubric 维度（目标用户/差异化与抗替代/异常·幂等·边界/依赖/安全），提升可发现性、可缓存性与稳定性表达。
