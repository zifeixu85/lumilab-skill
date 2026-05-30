---
name: lumilab-product-pmf
description: |
  PMF measurement & engine. Sean Ellis 40% Survey + Rahul Vohra Superhuman PMF engine + Brian Balfour 4-fit. Lumi-Lab overlay with Chinese-first instrumentation and Anti-Slop. Use when the product has been live 6+ weeks with 40+ active users, the retention curve will not flatten, or the founder asks "do we have PMF".
  关键词：product-market-fit / PMF / 产品市场契合 / Sean Ellis 40% / Superhuman engine / 4-fit / retention curve / 留存曲线 / 留存分析
version: 1.5.0
metadata:
  hermes:
    tags: [pmf, sean-ellis, superhuman, balfour-4-fit]
  lumilab:
    tier: overlay
    requires_browser: false
    chat_only_ok: true
  category: agent
  agent: product
  upstream:
    - "refoundai/measuring-pmf + omermetin/pmf"
    - "Sean Ellis《Hacking Growth》"
    - "Rahul Vohra (First Round Review) — How Superhuman built an engine to find PMF"
    - "Brian Balfour — 4 Fits"
  status: P0-overlay
  outputs:
    - "data/ventures/<name>/pmf_score.md"
    - "data/ventures/<name>/pmf_survey_<date>.csv"
    - "data/ventures/<name>/4fit_map.md"
    - "data/ventures/<name>/retention_curve.md"
  reads:
    - "data/ventures/<name>/audience.md"
    - "data/ventures/<name>/positioning.md"
    - "data/ventures/<name>/metrics.yaml"
license: Apache-2.0
platforms: [macos, linux]
prerequisites:
  env_vars: []
  commands: [bun]
compatibility: "Claude Code, OpenClaw 2026.4.25+, Hermes Agent v0.13.0+, Cursor, Codex"
---


# product-pmf · PMF 测量与引擎

**一句话价值（decision_support）**：用可测的方法回答「我们到底有没有 PMF」，并给出把留存曲线压平的改进引擎——不是凭感觉说「快了」。

## 目标用户

产品已上线 **6+ 周、40+ 活跃用户**、留存曲线压不平的创始人。不面向还没上线 / 样本不足的早期阶段。

## 方法论核心

- **Sean Ellis 40% 调查**：「如果不能再用这个产品你会多失望」——「非常失望」≥40% 是 PMF 强信号。
- **Rahul Vohra Superhuman PMF 引擎**：按用户分层（很失望/有点失望/不失望），聚焦「很失望」群体放大、把「有点失望」往上拉。
- **Brian Balfour 4-fit**：market↔product↔channel↔model 四重契合，缺一不可。

## 何时调用

用户问「我们有没有 PMF / 留存为什么压不平 / 40% 调查怎么做」。

## 工作流程与用法

1. 达门槛（6 周 + 40 活跃）才测，否则先攒样本。
2. 跑 Sean Ellis 40% 调查 + 读 cohort 留存曲线（是否趋平）。
3. 按 Superhuman 引擎分层改进 → 喂 metrics / next-actions。

示例：40% 调查只有 18% 「非常失望」→ 还没 PMF；深挖「非常失望」群体的共同画像与 JTBD，收窄定位再测。

## 输出

字段：很失望% / 留存曲线判读 / 核心用户画像 / 改进动作。落到 venture 复盘与指标。

```text
Sean Ellis 40% 调查 → 很失望 18% → 还没 PMF
动作：深挖"很失望"群体画像 + JTBD → 收窄定位再测
```

## 差异化与抗替代

- **vs 现有替代**：凭感觉喊「快 PMF 了」、通用解释 PMF 是什么（不给可测判定）。
- **为什么不是通用 LLM**：把 PMF 落成**可测流程**（40% 阈值 + 留存曲线判读 + 分层引擎）+ 中文埋点 + 反虚荣指标，并接入 lumilab 指标体系。
- **沉淀**：PMF 测量与改进引擎跨产品复用。

## 异常路径 · 幂等 · 边界

样本不足时**先要求达门槛再测**，不给假结论；只给判定 + 改进方向，不替执行。

## 依赖与成本

纯知识叠加，无外部依赖；埋点不收 PII；SKILL.md 精简，单次上下文成本低、可缓存。

## 安全与隐私

埋点不含 PII、纯本地、不外传。

## 深入参考

完整操作细节（详细流程 / 表格 / 边界 / 分支决策）见 `references/full-guide.md`，宿主执行流水线时按需加载。

## Changelog

- 1.5.0：精简至 ≤6000 字、补齐 rubric 维度，强化可测 PMF 判定与差异化。
