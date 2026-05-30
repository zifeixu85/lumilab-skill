---
name: lumilab-research-platforms
description: |
  Dual-channel platform research for venture validation. Channel A = browser automation (Playwright / CDP) for 小红书 (P0), 抖音 / 微博 / 知乎 / B 站 (P1). Channel B = third-party APIs (Tavily / Tavily for web; TikHub / 飞瓜 / 新榜 for China). Outputs cross-platform synthesis with pain point density, source URLs, evidence excerpts. Feeds back to hypothesis-ledger as evidence. Use when user types /lumilab research or asks for market/competitor/painpoint data.
  关键词：调研 / research / 市场调研 / 竞品分析 / 小红书搜索 / web search / 双通道 / Playwright / Tavily / TikHub / cross-platform / 痛点挖掘
version: 1.5.0
metadata:
  hermes:
    tags: [xhs, tavily, tikhub, research, playwright]
  lumilab:
    tier: utility
    requires_browser: false
    chat_only_ok: true
  category: agent
  agent: research
  upstream:
    - "clawhub:xiaohongshu-search-summarizer (Playwright + 多模态采集 + AI 综合 ★)"
    - "github.com/white0dew/XiaohongshuSkills (CDP 备选)"
    - "github.com/dzhng/deep-research (breadth × depth 迭代算法)"
    - "github.com/paperclipai/interview-script (Mom Test 访谈脚本)"
    - "github.com/openclaudia/icp-builder (ICP 画像)"
    - "Tavily / Tavily / TikHub / 飞瓜 / 新榜 APIs"
  outputs:
    - "data/ventures/<name>/research/xhs_raw.json (XHS 原始抓取数据)"
    - "data/ventures/<name>/research/web_tavily.json (Web 原始搜索数据)"
    - "data/ventures/<name>/research/cross_platform_synthesis.md (★ 推荐先看，跨平台合成)"
    - "data/ventures/<name>/research/painpoint_density.csv (痛点跨平台分布)"
  reads:
    - "data/ventures/<name>/project_brief.md (idea + 关键词)"
    - "data/ventures/<name>/hypotheses.yaml (要验证什么)"
    - "~/.lumilab/config.json (启用哪些通道)"
    - "~/.lumilab/secrets.enc (各家 API token)"
license: Apache-2.0
platforms: [macos, linux]
prerequisites:
  env_vars: []
  commands: [bun]
compatibility: "Claude Code, OpenClaw 2026.4.25+, Hermes Agent v0.13.0+, Cursor, Codex"
---


# research-platforms · 平台数据调研

**一句话价值（utility）**：一条命令抓小红书笔记 / Exa 网搜，产出结构化调研数据喂下游——无 key 自动 mock，断网不报错。

## 目标用户

要抓小红书笔记或做网搜调研的独立开发者。不面向不需要外部数据的纯方法论用户。

## 核心方法 / 能力

TikHub 抓小红书(笔记/互动/封面) + Exa 网搜(语义)。统一结构化输出，无 API key 时自动 mock 降级，结果喂 research-keywords/competitor 等下游。

## 何时调用

用户 /lumilab research-xhs 或 research-web，或需要平台一手数据。

## 工作流程与用法

1. 跑 research-xhs/research-web。2. 无 key 自动 mock(不阻塞)。3. 结构化结果写入 venture research/ → 喂下游 skill。

```text
lumilab research-xhs "独立开发" --limit 20
lumilab research-web "indie hacker tools" --num 10
# 无 key 自动 --mock
```

## 输出

字段：平台 / 标题 / 互动数 / 链接 / 摘要。结构由 `scripts/validate-output.ts` 校验，anti-slop-lint 兜禁词。

## 差异化与抗替代

- **vs 现有替代**：手动翻平台(慢)、通用网搜(无结构、不沉淀)。
- **为什么不是通用 LLM**：真实调外部 API 抓数 + 结构化 + 无 key mock 降级，纯 LLM 拿不到实时平台数据。
- **沉淀**：调研数据沉淀进 venture、跨 skill 复用。

## 异常路径 · 幂等 · 边界

无 key 自动 mock 不报错；网络失败降级；分页幂等覆盖写。

## 依赖与成本

bun；TIKHUB_API_KEY / EXA_API_KEY(可选，无则 mock)；SKILL.md 精简、scripts/ 按需加载，单次上下文成本低、可缓存。

## 安全与隐私

key 仅 env/keychain、不入 repo；只读公开数据。

## 深入参考

完整操作细节（详细流程 / 表格 / 边界 / 分支决策）见 `references/full-guide.md`，宿主执行流水线时按需加载。

## Changelog

- 1.5.0：精简至 ≤6000 字、补齐 rubric 维度（目标用户/差异化与抗替代/异常·幂等·边界/依赖/安全），提升可发现性、可缓存性与稳定性表达。
