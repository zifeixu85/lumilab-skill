---
name: lumilab-landing-mvp
description: |
  Fake-door validation page generator for C-end venture ideas. The landing is NOT a marketing page — it is a validation instrument that measures real purchase intent: a real, visible buy-style CTA → fake-door modal → email capture, with lightweight conversion tracking (cta_click / email_submit). Generates semantic HTML5 + standalone styles.css + inline tracking JS + validation_setup.md. Enforces 6-phase non-skippable pipeline (Research → Content Extraction → Image Catalog → Build → Verify → Deploy-ready). Anti-Slop banned words + banned visual patterns + 8-rule quality gate (incl. fake-door gate + SEO/GEO gate). Output reflects design_direction.json. Use when user types /lumilab build-assets or /lumilab landing, after design-direction page submitted.
  关键词：fake-door / 验证页 / 假门 / 购买意愿 / landing page / 落地页 / 邮件收集 / 立即购买 / CTA / 转化追踪 / cta_click / 价值主张 / Anti-Slop / editorial / brutalist
version: 2.0.0
metadata:
  hermes:
    tags: [landing-page, anti-slop, copywriting]
  lumilab:
    tier: core
    requires_browser: false
    chat_only_ok: true
  category: agent
  agent: landing
  authors: [lumilab]
  upstream:
    - "github.com/Aston1690/claude-skill-landing-page (★ Anti-Slop + 6-phase 流水线金标准)"
    - "github.com/ooiyeefei/landing-page-gtm (GTM 定位 + Feature→Benefit)"
    - "github.com/eng0ai/awwwards-landing-page (高设计美学)"
    - "github.com/dani-z/frontend-design-skill-benchmark (6 条质量断言)"
    - "github.com/johndoeblocks/copy-skill (Ogilvy + Handley 文案)"
    - "github.com/dominikmartn/nothing-design-skill (减法决策)"
  outputs:
    - "data/ventures/<name>/landing/v<n>/index.html (含 fake-door modal + 内嵌转化追踪 JS)"
    - "data/ventures/<name>/landing/v<n>/styles.css"
    - "data/ventures/<name>/landing/v<n>/copy.md"
    - "data/ventures/<name>/landing/v<n>/image_catalog.md"
    - "data/ventures/<name>/landing/v<n>/email_collection_config.md"
    - "data/ventures/<name>/landing/v<n>/validation_setup.md (怎么部署 / 怎么接邮箱端点 / 怎么回收数字)"
    - "data/ventures/<name>/landing/v<n>/anti-slop-checklist.md"
    - "data/ventures/<name>/landing/v<n>/sitemap.xml"
    - "data/ventures/<name>/landing/v<n>/robots.txt"
    - "data/ventures/<name>/landing/v<n>/llms.txt"
    - "data/ventures/<name>/studio/preview/landing.html (Studio 预览版)"
  reads:
    - "data/ventures/<name>/design_direction.json (必读 - 风格)"
    - "data/ventures/<name>/product_definition.md (必读 - 定位/价值主张)"
    - "data/ventures/<name>/audience.md (必读 - 目标用户)"
    - "data/ventures/<name>/painpoints.md (必读 - 用户痛点)"
    - "data/ventures/<name>/pricing_hypothesis.md (定价信息)"
license: Apache-2.0
platforms: [macos, linux]
prerequisites:
  env_vars: []
  commands: [bun]
compatibility: "Claude Code, OpenClaw 2026.4.25+, Hermes Agent v0.13.0+, Cursor, Codex"
---


# landing-mvp · fake-door 验证页生成器

**一句话价值（productivity）**：生成的不是营销页，是测真实购买意愿的仪器：真实可见的购买 CTA → fake-door modal → 邮箱捕获 + 转化追踪。产出 theme.css 可被 studio 实时 re-theme。

## 目标用户

要给 C 端 idea 生成 fake-door 验证页、量化购买意愿的独立开发者。不面向要做功能完整成品页的项目。

## 核心方法 / 能力

6 阶段不可跳步(Research→Content→Image→Build→Verify→Deploy-ready)。产出语义 HTML5 + styles.css + **theme.css(可调 token，被 studio 实时 re-theme)** + 内嵌追踪 JS(cta_click/email_submit) + validation_setup.md。Anti-Slop 禁词 + 禁视觉模式 + 8 关质量门(含 fake-door 门 + SEO/GEO 门)。出海默认英文。

## 何时调用

用户 /lumilab build-assets 或 landing，design-direction 提交后。

## 工作流程与用法

1. 走 6 阶段流水线。2. 产出 HTML + styles.css + theme.css + 追踪 JS。3. 过 8 关质量门 → 部署收数据。

```text
6 阶段: Research→Content→Image→Build→Verify→Deploy
产出: index.html + styles.css + theme.css(可调 token)
8 关: fake-door 门 + SEO/GEO 门 + anti-slop
```

## 输出

字段：index.html / styles.css / theme.css / 追踪事件(cta_click/email_submit) / validation_setup.md。结构由 `scripts/validate-output.ts` 校验，anti-slop-lint 兜禁词。

## 差异化与抗替代

- **vs 现有替代**：Carrd+Tally(只给页无验证仪器)、通用「做个落地页」(营销页非验证页)。
- **为什么不是通用 LLM**：把 landing 当验证仪器(真 CTA→fake-door→邮箱+追踪) + 8 关质量门 + theme.css 可被 studio 确定性 re-theme，纯 LLM 给不出可量化购买意愿的完整仪器。
- **沉淀**：landing 版本 + 转化数据跨轮累积，theme.css 沉淀设计。

## 异常路径 · 幂等 · 边界

6 阶段不可跳步；8 关质量门 exit 1 阻止坏页；theme.css 缺失时 server 兜底；幂等出 v<n+1>。

## 依赖与成本

bun；宿主提供 LLM，无额外外部 API；SKILL.md 精简、scripts/ 按需加载，单次上下文成本低、可缓存。

## 安全与隐私

纯本地、追踪 JS 不收敏感 PII、不外传。

## 深入参考

完整操作细节（详细流程 / 表格 / 边界 / 分支决策）见 `references/full-guide.md`，宿主执行流水线时按需加载。

## Changelog

- 2.0.0：精简至 ≤6000 字、补齐 rubric 维度（目标用户/差异化与抗替代/异常·幂等·边界/依赖/安全），提升可发现性、可缓存性与稳定性表达。
