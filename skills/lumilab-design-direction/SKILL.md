---
name: lumilab-design-direction
description: |
  Design direction picker for venture validation — 4 aesthetic presets (editorial / minimalist / brutalist / soft) + 3 dials (variance / motion / density, 0-100) + brand palette, with iframe live preview. Outputs design_direction.json that landing-mvp / studio / copy all inherit for visual consistency. Lumi-Lab Anti-Slop enforced: OKLCH only, no Inter/Roboto, no purple-gradient. Use when user types /lumilab design-direction, or asks to pick a visual style / aesthetic / color palette / typography before building landing or studio pages.
  关键词：设计方向 / 美学 / 配色 / 字体 / 视觉风格 / 旋钮 / 实时预览 / design direction / aesthetic / color palette / typography / visual style / editorial / minimalist / brutalist / soft / Lumi Lab overlay
version: 1.5.0
metadata:
  hermes:
    tags: [design-direction, aesthetic, dials, live-preview, interactive-card]
  lumilab:
    tier: utility
    requires_browser: true
    chat_only_ok: true
  category: agent
  agent: design
  upstream:
    - "Leonxlnx/taste-skill + pbakaus/impeccable"
  outputs:
    - "data/ventures/<name>/design_direction.json (4 样本 + 3 旋钮 + 调色板 + 字体)"
  status: P0-ready
  full_overlay_in: phase_1
  interactive_page:
    script: scripts/serve.ts
    template: templates/design-direction.html.tpl
    port: 7777
license: Apache-2.0
platforms: [macos, linux]
prerequisites:
  env_vars: []
  commands: [bun]
compatibility: "Claude Code, OpenClaw 2026.4.25+, Hermes Agent v0.13.0+, Cursor, Codex"
---


# design-direction · 设计方向选择器

**一句话价值（utility）**：4 美学预设 + 旋钮 + iframe 实时预览，强制 OKLCH/禁 Inter/禁紫渐变，输出 design_direction.json 被 landing/studio/copy 继承。

## 目标用户

生成 landing/studio 前要先定视觉风格(配色/字体/旋钮)的独立开发者。不面向已有成熟设计系统的团队。

## 核心方法 / 能力

4 预设(editorial/minimalist/brutalist/soft) + 3 旋钮(variance/motion/density) + 品牌色，iframe 实时预览。Lumi-Lab Anti-Slop：仅 OKLCH、禁 Inter/Roboto、禁紫渐变。被 idea-to-landing 调用时风格由 idea 特征推导。Studio 构建阶段另有扩充 re-theme 旋钮直接调真实落地页 iframe。

## 何时调用

用户 /lumilab design-direction，或建 landing/studio 前要定视觉风格。

## 工作流程与用法

1. 选预设 → 调旋钮 → 选品牌色 → 实时预览 → 提交。2. 写 design_direction.json。3. landing/studio/copy 继承。

```text
lumilab design-direction my-venture
→ 浏览器: 4 预设 + 旋钮 + iframe 预览
→ design_direction.json (下游继承)
```

## 输出

字段：preset / palette / typography / dials / layout。结构由 `scripts/validate-output.ts` 校验，anti-slop-lint 兜禁词。

## 差异化与抗替代

- **vs 现有替代**：随便挑模板、通用「给我配个色」(无实时预览、不沉淀)。
- **为什么不是通用 LLM**：4 美学样本 + 旋钮 + iframe 实时预览 + anti-slop 强制，输出可被全产物继承的 token，纯 LLM 给文字描述无法实时预览。
- **沉淀**：设计方向一次定、全产物继承、跨 venture 复用。

## 异常路径 · 幂等 · 边界

未选时用 idea 推导默认；提交后 server 自关可重入；iframe 失败退静态样本。

## 依赖与成本

bun + 浏览器(交互页)；chat 环境降级文字卡；SKILL.md 精简、scripts/ 按需加载，单次上下文成本低、可缓存。

## 安全与隐私

纯本地、不外传、不处理 PII。

## 深入参考

完整操作细节（详细流程 / 表格 / 边界 / 分支决策）见 `references/full-guide.md`，宿主执行流水线时按需加载。

## Changelog

- 1.5.0：精简至 ≤6000 字、补齐 rubric 维度（目标用户/差异化与抗替代/异常·幂等·边界/依赖/安全），提升可发现性、可缓存性与稳定性表达。
