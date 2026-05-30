---
name: lumilab-research-keywords
description: |
  Quantitative search-demand validation for venture ideas. Given the product keywords behind an idea, reverse-searches Google search demand: search volume, CPC, competition, keyword difficulty, 12-month trend, related + long-tail + "People Also Search For" expansion. Scores each keyword direction as Blue Ocean / Red Ocean / Differentiation Opportunity. Pluggable provider layer — default DataForSEO (pay-as-you-go), optional Keywords Everywhere. SERP competition depth filled via lumi-lab's existing Playwright / Tavily. Feeds hypothesis-ledger as demand evidence and research-platforms cross-platform synthesis. Use when user types /lumilab keywords or asks for search volume / keyword difficulty / 红蓝海 / 关键词热度 / SEO 需求.
  关键词：关键词调研 / keyword research / 搜索量 / search volume / 关键词难度 / keyword difficulty / 长尾词 / long-tail / 趋势 / trend / 红海蓝海 / blue ocean / red ocean / 差异化机会 / SEO 需求验证 / DataForSEO / Keywords Everywhere
version: 1.5.0
status: P0-ready
metadata:
  hermes:
    tags: [dataforseo, keywordseverywhere, keyword-research, search-volume, blue-ocean]
  lumilab:
    tier: overlay
    requires_browser: false
    chat_only_ok: true
  category: agent
  agent: research
  authors: [lumilab]
  upstream:
    - "DataForSEO API v3 (https://docs.dataforseo.com/v3/) — default provider"
    - "Keywords Everywhere API v1 (https://api.keywordseverywhere.com/docs/) — optional provider"
    - "github.com/dzhng/deep-research (breadth × depth 迭代算法，复用关键词扩展)"
  outputs:
    - "data/ventures/<name>/research/keyword_landscape.md (★ 推荐先看 — 红蓝海地图)"
    - "data/ventures/<name>/research/keyword_metrics.csv (每个关键词全字段，供 Studio 渲染)"
    - "data/ventures/<name>/research/keyword_sources.jsonl (一行一条原始 API 返回，可追溯)"
  reads:
    - "data/ventures/<name>/project_brief.md (idea + 种子关键词)"
    - "data/ventures/<name>/hypotheses.yaml (要验证什么需求)"
    - "~/.lumilab/config.json (provider 选择 + 国家/语言)"
    - "~/.lumilab/secrets.json (DataForSEO / Keywords Everywhere token)"
license: Apache-2.0
platforms: [macos, linux]
prerequisites:
  env_vars: []
  commands: [bun]
compatibility: "Claude Code, OpenClaw 2026.4.25+, Hermes Agent v0.13.0+, Cursor, Codex"
---


# research-keywords · 搜索需求量化验证

**一句话价值（decision_support）**：给 idea 背后的关键词反查 Google 搜索需求：搜索量/CPC/竞争度/难度/12 月趋势/长尾扩展，每个方向评红蓝海——把「有没有人搜」量化。

## 目标用户

想量化验证 idea 搜索需求、看红蓝海的独立开发者。不面向纯线下/无搜索场景的生意。

## 核心方法 / 能力

给产品关键词，反查搜索量/CPC/竞争度/关键词难度/12 月趋势 + related/long-tail/PASF 扩展。每个方向评 蓝海/红海/差异化机会。可插拔 provider(默认 DataForSEO 按量付费，可选 Keywords Everywhere)。SERP 竞争深度借 Playwright/Tavily。喂 hypothesis-ledger 作需求证据。

## 何时调用

用户 /lumilab keywords，或要搜索量/关键词难度/红蓝海/SEO 需求验证。

## 工作流程与用法

1. 给产品关键词。2. 反查搜索量/难度/趋势 + 长尾扩展。3. 评红蓝海 → 喂 hypothesis-ledger / 跨平台综合。

```text
lumilab keywords "独立开发 工具"
→ 搜索量 1.2k/mo, KD 28, 趋势↑, 蓝海
→ 长尾: "indie hacker saas 模板"
```

## 输出

字段：keyword / search_volume / cpc / competition / difficulty / trend / 红蓝海评级。结构由 `scripts/validate-output.ts` 校验，anti-slop-lint 兜禁词。

## 差异化与抗替代

- **vs 现有替代**：拍脑袋觉得有需求、通用「这个有市场吗」(无量化数据)。
- **为什么不是通用 LLM**：真实调搜索数据 provider 拿量化搜索量/难度/趋势 + 红蓝海评级，纯 LLM 没有实时搜索量数据。
- **沉淀**：搜索需求数据沉淀进 venture、喂跨平台综合。

## 异常路径 · 幂等 · 边界

无凭证时提示配置/降级；网络失败重试；分页幂等；provider 可插拔切换。

## 依赖与成本

bun；DataForSEO(按量付费，凭证 keychain) / Keywords Everywhere(可选)；SKILL.md 精简、scripts/ 按需加载，单次上下文成本低、可缓存。

## 安全与隐私

凭证仅 keychain、不入 repo；只读搜索数据。

## 深入参考

完整操作细节（详细流程 / 表格 / 边界 / 分支决策）见 `references/full-guide.md`，宿主执行流水线时按需加载。

## Changelog

- 1.5.0：精简至 ≤6000 字、补齐 rubric 维度（目标用户/差异化与抗替代/异常·幂等·边界/依赖/安全），提升可发现性、可缓存性与稳定性表达。
