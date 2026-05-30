---
name: lumilab-content-repurpose
description: |
  Multi-platform content repurposing for venture validation. Takes one source content (idea, story, insight) and generates 5 platform-specific versions following each platform's hard constraints. Deep support for 小红书 / 微信公众号 / X. Template-based for 抖音 / 朋友圈 (Phase 0 lighter, Phase 1 enrich). Reads platform rules from memory/resources/platform-rules/. Use when user types /lumilab content or /lumilab build-assets.
  关键词：多平台内容 / 一稿七发 / 跨平台改写 / 内容矩阵 / 小红书 / 公众号 / 抖音 / 朋友圈 / X / 内容工厂 / 自媒体
version: 1.5.0
metadata:
  hermes:
    tags: [content, xiaohongshu, wechat, douyin, x, repurpose]
  lumilab:
    tier: core
    requires_browser: false
    chat_only_ok: true
  category: agent
  agent: content
  upstream:
    - "JimLiu/baoyu-skills (跨 runtime user-input + image-gen 抽象 + trigger shotgun)"
    - "white0dew/XiaohongshuSkills (XHS 必做约束金标准)"
    - "github.com/Jack5316/pyq-wechat-moments (朋友圈唯一参考)"
    - "github.com/johndoeblocks/copy-skill (Ogilvy + Handley)"
    - "github.com/revfactory/viral-copywriting"
  outputs:
    - "data/ventures/<name>/content/xhs/<slug>.md (深度)"
    - "data/ventures/<name>/content/wechat-mp/<slug>.md (深度，含排版)"
    - "data/ventures/<name>/content/x-twitter/<slug>.md (深度，thread 格式)"
    - "data/ventures/<name>/content/douyin/<slug>.md (模板)"
    - "data/ventures/<name>/content/wechat-moments/<slug>.md (模板)"
  reads:
    - "memory/resources/platform-rules/{xiaohongshu,wechat-mp,douyin,wechat-moments,x-twitter}.md (必读)"
    - "data/ventures/<name>/product_definition.md (一句话定位)"
    - "data/ventures/<name>/audience.md (目标用户语言习惯)"
    - "data/ventures/<name>/painpoints.md (痛点 → 钩子素材)"
    - "data/ventures/<name>/landing_copy.md (主文案，可复用)"
license: Apache-2.0
platforms: [macos, linux]
prerequisites:
  env_vars: []
  commands: [bun]
compatibility: "Claude Code, OpenClaw 2026.4.25+, Hermes Agent v0.13.0+, Cursor, Codex"
---


# content-repurpose · 一稿多平台改写

**一句话价值（productivity）**：把一条内容一稿多发到小红书/公众号/X/抖音/朋友圈，按各平台硬约束分别产出——不是一稿到底。

## 目标用户

要把一条内容一稿多发到多平台的独立创作者。不面向单平台单篇写作。

## 核心方法 / 能力

读 memory/resources/platform-rules/ 的各平台硬约束(字数/话题数/封面/钩子/发布时机)，从一份源内容按平台分别改写。小红书/公众号/X 深度支持，抖音/朋友圈模板化。

## 何时调用

用户 /lumilab content 或 build-assets，要把一个 idea/故事一稿多发。

## 工作流程与用法

1. 读源内容 + 平台规则。2. 按每平台硬约束分别改写。3. 产出 5 个平台版本 + 封面建议。

```text
源: 一篇产品故事
小红书: 标题党钩子+话题+封面文案
公众号: 长图文
X: thread 拆条
(各平台独立产出)
```

## 输出

字段：平台 / 标题 / 正文 / 标签 / 封面建议。结构由 `scripts/validate-output.ts` 校验，anti-slop-lint 兜禁词。

## 差异化与抗替代

- **vs 现有替代**：手动逐平台改写(慢)、通用「改成小红书风格」(不懂硬约束)。
- **为什么不是通用 LLM**：内置各平台硬约束从 memory 读规则、按平台分别产出，纯 LLM 不知道小红书话题上限/公众号排版/发布时机。
- **沉淀**：平台规则沉淀在 resources/、跨内容复用。

## 异常路径 · 幂等 · 边界

规则缺失时回退模板；各平台独立产出，单平台失败不影响其它；幂等。

## 依赖与成本

bun；平台规则读本地 memory，无外部 API；SKILL.md 精简、scripts/ 按需加载，单次上下文成本低、可缓存。

## 安全与隐私

纯本地、不外传草稿。

## 深入参考

完整操作细节（详细流程 / 表格 / 边界 / 分支决策）见 `references/full-guide.md`，宿主执行流水线时按需加载。

## Changelog

- 1.5.0：精简至 ≤6000 字、补齐 rubric 维度（目标用户/差异化与抗替代/异常·幂等·边界/依赖/安全），提升可发现性、可缓存性与稳定性表达。
