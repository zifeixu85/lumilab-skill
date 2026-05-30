---
name: lumilab-copy
description: |
  文案不是写出来的，是从用户原话里挖出来的。基于 Joanna Wiebe Copy Hackers VoC mining + Eugene Schwartz 5 awareness stages + 经典 headline 框架（4U / PAS / AIDA / BAB）+ 中文小红书/公众号 hook patterns。强制反 Slop 用词清单（禁"赋能/打造/赛道/闭环/心智/抓手"等）。Use when 用户要写 landing hero、邮件主题、小红书标题、公众号开头、cold outreach 第一句、广告短文案。
  关键词：copy / 文案 / VoC / voice of customer / 5 awareness stages / Joanna Wiebe / Eugene Schwartz / Schwartz / Wiebe / headline / hook / 标题 / 反 Slop
version: 1.5.0
metadata:
  hermes:
    tags: [copywriting, eugene-schwartz, voice-of-customer, 4u, pas, aida]
  lumilab:
    tier: overlay
    requires_browser: false
    chat_only_ok: true
  category: agent
  agent: content
  authors: [lumilab]
  upstream:
    - "johndoeblocks/copy-skill"
    - "shipshitdev/copy-validator"
    - "Joanna Wiebe — Copy Hackers (VoC mining, message hierarchy)"
    - "Eugene Schwartz — Breakthrough Advertising (5 awareness stages)"
    - "David Ogilvy — Ogilvy on Advertising"
    - "Ann Handley — Everybody Writes"
    - "营销百问 / 小马宋 / 半佛仙人（中文 hook 范式）"
  outputs:
    - "data/ventures/<name>/copy_brief.yaml"
    - "data/ventures/<name>/copy_candidates.md (≥5 候选)"
    - "data/ventures/<name>/voc_mining.md"
  reads:
    - "data/ventures/<name>/icp.yaml"
    - "data/ventures/<name>/positioning.yaml"
    - "data/ventures/<name>/interviews/*.md"
    - "data/ventures/<name>/interview_synthesis.md"
license: Apache-2.0
platforms: [macos, linux]
prerequisites:
  env_vars: []
  commands: [bun]
compatibility: "Claude Code, OpenClaw 2026.4.25+, Hermes Agent v0.13.0+, Cursor, Codex"
---


# copy · 从用户原话里挖文案

**一句话价值（productivity）**：文案不是写出来的，是从用户原话里挖出来的——基于 VoC mining 给你高转化的 landing hero / 邮件主题 / 小红书标题，强制反 Slop 用词。

## 目标用户

要写 landing hero / 邮件主题 / 小红书标题 / 公众号开头 / cold outreach 第一句的**独立开发者 / 创作者**。不面向长篇内容创作。

## 方法论核心

- **Joanna Wiebe VoC mining**：从用户评论/访谈原话里挖卖点，比自己编的强。
- **Eugene Schwartz 5 awareness stages**：按读者「认知阶段」（不知道问题→知道方案→知道你）选不同 hook。
- **经典框架**：4U（Useful/Urgent/Unique/Ultra-specific）、PAS、AIDA、BAB。
- **反 Slop 清单**：禁「赋能/打造/赛道/闭环/心智/抓手」等。

## 何时调用

用户要写 landing hero、邮件主题、小红书标题、公众号开头、cold outreach 第一句、广告短文案。

## 工作流程与用法

1. 先收集用户原话（评论/访谈/小红书评论区）——没有就先去挖。
2. 判定读者 awareness 阶段 → 选 hook 框架。
3. 产出 3-5 个候选 → 过反 Slop 清单 → A/B。

示例：与其写「智能高效的记账工具」，不如用用户原话「月底总对不上账」→ hero：「再也不用月底翻三天微信账单」。

## 输出

字段：候选标题/hero（3-5 个） / 所用框架 / awareness 阶段 / 反 Slop 检查。落到 landing/邮件/内容。

```text
用户原话: "月底总对不上账"
hero: "再也不用月底翻三天微信账单"  (VoC 挖的, 非编的)
过反 Slop: 禁 赋能/打造/闭环
```

## 差异化与抗替代

- **vs 现有替代**：通用「帮我写个文案」（凭空编卖点）、凭感觉憋金句。
- **为什么不是通用 LLM**：强制 **VoC mining**（从真实原话挖）+ awareness 阶段匹配 + 反 Slop 用词清单，产出可直接上 landing 的转化文案而非漂亮废话。
- **沉淀**：VoC 语料与高转化 hook 跨 venture 沉淀。

## 异常路径 · 幂等 · 边界

无用户原话时**先引导收集 VoC**，不凭空编；禁词命中即重写；给候选不替你定稿。

## 依赖与成本

纯知识叠加，无外部依赖；SKILL.md 精简，单次上下文成本低、可缓存。

## 安全与隐私

纯本地、不外传、不处理 PII。

## 深入参考

完整操作细节（详细流程 / 表格 / 边界 / 分支决策）见 `references/full-guide.md`，宿主执行流水线时按需加载。

## Changelog

- 1.5.0：精简至 ≤6000 字、补齐 rubric 维度，强化 VoC mining 与反 Slop 差异化。
