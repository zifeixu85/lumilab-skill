---
name: lumilab-home
description: |
  Lumi Lab 的门面 / 入口 skill —— 用户第一次接触 Lumi Lab、或想看「现在什么情况」时调用。首次使用（~/.lumilab/config.json 无 onboarded）会引导用户走首次配置；已配置过则渲染一个 home dashboard：已配工具状态、所有 venture 及各自验证流水线进度、建议的下一步动作。是「不知道从哪开始」时的答案。 Use when 用户打开 lumilab、首次使用、或想看总览/进度/从哪开始。
  关键词：lumilab home / 打开 lumilab / lumilab dashboard / 开始用 lumilab / 主页 / 总览 / 仪表盘 / 首次使用 / 从哪开始 / 我的 venture / 进度 / getting started / 入口
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
    tags: [home, dashboard, onboarding, getting-started, entry, overview]
  category: orchestrator
  agent: home
  authors: [lumilab]
  outputs:
    - "~/.lumilab/data/_home/home.html (bundle 总览 dashboard，主动交付给用户)"
  reads:
    - "~/.lumilab/config.json (是否 onboarded + 已配工具)"
    - "~/.lumilab/data/ventures/*/  (每个 venture 的流水线进度)"
---


# home · Lumi Lab 门面 / 入口

**一句话价值（utility）**：第一次接触 Lumi Lab 或想看「现在什么情况」时的答案——一屏 dashboard 聚合已配工具 + 各 venture 进度 + 建议下一步。Use when 用户打开 lumilab、问从哪开始。

## 目标用户

第一次接触 Lumi Lab、或想看「现在什么情况/从哪开始」的用户。不面向已知道要跑哪个具体 skill 的老用户。

## 核心方法 / 能力

首次使用引导 onboarding；已配置则渲染 home dashboard：已配工具状态 + 所有 venture 的验证流水线进度 + 建议的下一步动作。是「不知道从哪开始」的入口。

## 何时调用

用户 lumilab / lumilab home、首次使用、或想看总览/进度。

## 工作流程与用法

1. 检测是否 onboarded。2. 未配置→引导首次配置。3. 已配置→渲染 dashboard(工具+venture 进度+下一步)。

```text
lumilab home
→ 首次: 引导配置
→ 回访: dashboard(3 个 venture + 各阶段进度 + 建议下一步)
```

## 输出

字段：已配工具 / venture 列表 / 各阶段进度 / 建议下一步。结构由 `scripts/validate-output.ts` 校验，anti-slop-lint 兜禁词。

## 差异化与抗替代

- **vs 现有替代**：自己翻目录找 venture、记不住进度散落各处。
- **为什么不是通用 LLM**：一屏聚合工具状态+全 venture 进度+建议下一步，是「不知道从哪开始」的答案，纯 LLM 无法渲染你本地的实时状态。
- **沉淀**：随 venture 推进自动更新，越用越像作战中枢。

## 异常路径 · 幂等 · 边界

首次未配置引导 onboarding；无 venture 时给起步指引不报错；幂等重渲。

## 依赖与成本

bun；读本地 ~/.lumilab，无网络；SKILL.md 精简、scripts/ 按需加载，单次上下文成本低、可缓存。

## 安全与隐私

纯本地渲染、不外传、不处理 PII。

## 深入参考

完整操作细节（详细流程 / 表格 / 边界 / 分支决策）见 `references/full-guide.md`，宿主执行流水线时按需加载。

## Changelog

- 1.5.0：精简至 ≤6000 字、补齐 rubric 维度（目标用户/差异化与抗替代/异常·幂等·边界/依赖/安全），提升可发现性、可缓存性与稳定性表达。
