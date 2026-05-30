---
name: lumilab-metrics
description: |
  AARRR Pirate Metrics + Sean Ellis North Star + leading vs lagging + Amplitude/PostHog event schema. Cohort retention curve reading. Lumi-Lab overlay with Chinese-first event naming and Anti-Slop for vanity metrics. Use when the user asks which metrics to track, can't tell if a product is healthy from GA data, needs an event schema before MVP launch, or wants to read a cohort retention curve.
  关键词：metrics / AARRR / 海盗指标 / north star / leading / lagging / vanity / retention curve / event schema / PostHog / Amplitude
version: 1.5.0
metadata:
  hermes:
    tags: [aarrr, north-star, retention, amplitude, posthog]
  lumilab:
    tier: overlay
    requires_browser: false
    chat_only_ok: true
  category: agent
  agent: sop_growth
  upstream:
    - "wshobson/startup-metrics-framework 6.3K installs"
    - "Dave McClure《Startup Metrics for Pirates》(AARRR)"
    - "Sean Ellis《Hacking Growth》— North Star Metric"
    - "Amplitude — Behavioral analytics taxonomy"
    - "PostHog — Self-hosted product analytics"
    - "Andrew Chen — vanity vs actionable metrics"
  status: P0-overlay
  outputs:
    - "data/ventures/<name>/metrics.yaml"
    - "data/ventures/<name>/event_schema.yaml"
    - "data/ventures/<name>/north_star.md"
    - "data/ventures/<name>/retention_curve.md"
  reads:
    - "data/ventures/<name>/audience.md"
    - "data/ventures/<name>/positioning.md"
    - "data/ventures/<name>/pmf_score.md"
license: Apache-2.0
platforms: [macos, linux]
prerequisites:
  env_vars: []
  commands: [bun]
compatibility: "Claude Code, OpenClaw 2026.4.25+, Hermes Agent v0.13.0+, Cursor, Codex"
---


# metrics · 指标体系 + R6 信号基线

**一句话价值（decision_support）**：AARRR + North Star + leading/lagging + 留存曲线判读 + R6 量化信号基线(baselines.yaml)，帮你判断产品健不健康、追什么指标。

## 目标用户

不知道追什么指标、看 GA 看不出健康度的早期创始人。不面向还没上线/无埋点的更早阶段。

## 核心方法 / 能力

AARRR 海盗指标 + Sean Ellis North Star + leading vs lagging + vanity vs actionable + Amplitude/PostHog event schema + cohort 留存曲线判读。**assets/baselines.yaml = R6 量化信号基线(A/B/C 置信层)**，被 next-actions 读取判信号强弱。中文优先事件命名、反虚荣指标。

## 何时调用

用户问追什么指标、看 GA 看不出健康度、MVP 前要 event schema、或要读留存曲线；next-actions 读 baselines 判信号。

## 工作流程与用法

1. 定 North Star + AARRR 每段 1-2 指标。2. 设计 event schema。3. 跑≥4 周读留存曲线 → 对照 baselines 判信号。

```text
North Star: 周活跃创建数
baselines.yaml: landing_cvr normal=6.6% (tier A)
payment_any: 任意付款=强信号
```

## 输出

字段：North Star / AARRR 指标 / event schema / baselines(R6 信号基线)。结构由 `scripts/validate-output.ts` 校验，anti-slop-lint 兜禁词。

## 差异化与抗替代

- **vs 现有替代**：凭感觉看指标、通用解释 AARRR(不带量化基线)。
- **为什么不是通用 LLM**：带可被脚本读的 R6 量化基线(baselines.yaml) + 中文事件 schema + 反虚荣，next-actions 直接消费判信号，纯 LLM 给不出统一可追溯的基线数据。
- **沉淀**：event schema + baselines.yaml 跨 venture 复用沉淀。

## 异常路径 · 幂等 · 边界

样本不足时先要求达门槛；埋点 schema 不含 PII；幂等；缺数据降级。

## 依赖与成本

bun；纯知识 + 静态 baselines.yaml，无外部 API；SKILL.md 精简、scripts/ 按需加载，单次上下文成本低、可缓存。

## 安全与隐私

埋点不收 PII、纯本地、不外传。

## 深入参考

完整操作细节（详细流程 / 表格 / 边界 / 分支决策）见 `references/full-guide.md`，宿主执行流水线时按需加载。

## Changelog

- 1.5.0：精简至 ≤6000 字、补齐 rubric 维度（目标用户/差异化与抗替代/异常·幂等·边界/依赖/安全），提升可发现性、可缓存性与稳定性表达。
