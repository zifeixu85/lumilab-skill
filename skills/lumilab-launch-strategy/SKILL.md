---
name: lumilab-launch-strategy
description: |
  Cold-start playbook for OPC/独立开发者. Kevin Kelly 1000 true fans + Marc Lou ship-fast bundling + Product Hunt launch + Lenny Rachitsky cold-start. Lumi-Lab Chinese ladder: 飞书/微信小圈子 → 小红书 → 公众号 → 播客 → PH/HN. Use when the user is ready to launch a venture, needs a 4-8 week cold-start plan, or wants a weekly launch calendar with quantified success criteria.
  关键词：launch / 冷启动 / Product Hunt / 1000 true fans / ship fast / Lenny Rachitsky / 小红书冷启动
version: 1.5.0
metadata:
  hermes:
    tags: [launch, 1000-true-fans, product-hunt, cold-start, marc-lou]
  lumilab:
    tier: overlay
    requires_browser: false
    chat_only_ok: true
  category: agent
  agent: sop_growth
  upstream:
    - "aitytech/launch-strategy + ognjengt/go-to-market"
    - "Kevin Kelly《1,000 True Fans》(2008)"
    - "Marc Lou — ship fast, multi-product bundle (ByeDispute / ShipFast playbook)"
    - "Lenny Rachitsky — cold-start newsletter (Substack growth playbook)"
    - "Andrew Chen《The Cold Start Problem》(2021)"
    - "Ryan Hoover — Product Hunt launch best practices"
  status: P0-overlay
  outputs:
    - "data/ventures/<name>/launch_plan.md"
    - "data/ventures/<name>/launch_calendar.yaml"
    - "data/ventures/<name>/launch_assets/"
  reads:
    - "data/ventures/<name>/positioning.md"
    - "data/ventures/<name>/pmf_score.md"
    - "data/ventures/<name>/audience.md"
license: Apache-2.0
platforms: [macos, linux]
prerequisites:
  env_vars: []
  commands: [bun]
compatibility: "Claude Code, OpenClaw 2026.4.25+, Hermes Agent v0.13.0+, Cursor, Codex"
---


# launch-strategy · OPC 冷启动 playbook

**一句话价值（decision_support）**：给手上没流量的独立开发者一套 4-8 周冷启动周历，带量化成功标准——不是「去发个 Product Hunt」这种空话。

## 目标用户

要做冷启动、手上几乎没流量的 **OPC / 独立开发者**。不面向已有成熟增长渠道的团队。

## 方法论核心

- **Kevin Kelly 1000 true fans**：先要 100 个真爱用户，不是 10 万泛粉。
- **Marc Lou ship-fast + bundling**：快发、多产品互相导流。
- **Lenny cold-start**：先解决「冷启动问题」（双边/网络效应产品的鸡生蛋）。
- **国内阶梯**：飞书/微信小圈子 → 小红书 → 公众号 → 播客 → Product Hunt / HN（先私域攒种子，再公域放大）。

## 何时调用

用户准备 launch、要 4-8 周冷启动计划、或要一张带量化标准的发布周历。

## 工作流程与用法

1. 定第一波 100 真爱用户在哪（哪个小圈子）。
2. 排 4-8 周周历：每周一个动作 + 一个可量化目标。
3. 定成功阈值（如「第 2 周小红书 1 篇 ≥500 收藏」）→ 跑 → 喂 metrics / 复盘。

示例：第 1 周不发公域，先在 3 个飞书群拿 20 个种子用户访谈；第 3 周才上小红书。

## 输出

字段：第一波用户来源 / 4-8 周周历 / 每周动作与量化目标 / 成功阈值。落到 venture SOP。

```text
第1周: 3个飞书群拿20个种子(不发公域)
第3周: 上小红书, 目标1篇≥500收藏
第6周: Product Hunt
```

## 差异化与抗替代

- **vs 现有替代**：盲发 Product Hunt、通用「怎么推广」（不给节奏与阈值）。
- **为什么不是通用 LLM**：给**国内阶梯式**冷启动路径 + 量化成功标准的周历，接 weekly-sop-runner / metrics 形成可执行可复盘的闭环。
- **沉淀**：冷启 playbook 跨 venture 复用、按结果迭代。

## 异常路径 · 幂等 · 边界

渠道不适配时给替代路径；只给计划 + 阈值，**不替你执行**；目标未达给「换渠道/换钩子」候选。

## 依赖与成本

纯知识叠加，无外部依赖；SKILL.md 精简，单次上下文成本低、可缓存。

## 安全与隐私

纯本地、不外传、不处理 PII。

## 深入参考

完整操作细节（详细流程 / 表格 / 边界 / 分支决策）见 `references/full-guide.md`，宿主执行流水线时按需加载。

## Changelog

- 1.5.0：精简至 ≤6000 字、补齐 rubric 维度，强化国内阶梯式冷启动差异化。
