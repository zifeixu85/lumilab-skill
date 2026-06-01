---
name: lumilab
description: |
  Lumi Lab —— C 端创业 idea 的快速验证 skills bundle。给一句话 idea，自动跑市场分析 / 竞品扫描 / 人群拆解 / 关键词红蓝海，产出一份图文并茂的网页版分析报告 + 几个具体方向建议，用户选定方向后再自动生成一个能测真实购买意愿的 fake-door 验证页（带 SEO/GEO + 转化追踪），可一键加密部署上线。全程最多问用户 2 次。26 个 skill 协同，跑在 Claude Code / OpenClaw / Cursor / Codex / Hermes / Gemini CLI 里——宿主提供 LLM，bundle 不需要 LLM API key。
  关键词：创业 idea 验证 / 一句话想法 / 市场分析 / 竞品分析 / 人群拆解 / 关键词调研 / 红蓝海 / landing page / fake-door 验证页 / SEO / GEO / 购买意愿 / 轻量验证 / skills bundle / OPC / 独立开发者
version: 1.14.0
license: AGPL-3.0-or-later
homepage: https://github.com/zifeixu85/lumilab
platforms: [macos, linux]
prerequisites:
  env_vars: []
  commands: [bun]
compatibility: "Claude Code, OpenClaw 2026.4.25+, Hermes Agent v0.13.0+, Cursor, Codex, Gemini CLI"
metadata:
  lumilab:
    tier: bundle
    requires_browser: false
    chat_only_ok: true
    default_entry: lumilab-home
    skill_count: 26
  hermes:
    tags: [bundle, idea-validation, market-analysis, landing-page, fake-door, seo, geo, opc]
  authors: [ameng]
---

# Lumi Lab —— C 端创业 idea 的快速验证 bundle

> 这是 **bundle 入口 SKILL.md**。Lumi Lab 是一套 26 个 skill 的集合，跑在你已有的 AI 宿主里。
> 完整文档见 [`README.md`](./README.md)，逐 skill 索引见 [`docs/SKILLS.md`](./docs/SKILLS.md)。

## 装完怎么用（宿主 agent 必读，并据此转告用户）

**正确用法 = 用户直接对你（AI）说一句话，不用 `cd`、不用 `bun run`：**

- 「打开 lumilab」 → 进主页 / 看进度（你触发 `lumilab-home`）
- 「帮我用 Lumi Lab 验证一个想法：<一句话>」 → 自动跑完整条验证流水线（你触发 `lumilab-idea-to-landing`）

终端党才用 CLI —— 可执行文件是 `scripts/lumilab`，**没有 `.ts` 后缀**：

```bash
lumilab idea "<一句话想法>"                   # install.sh 已把它加进 PATH
bun run scripts/lumilab idea "<一句话想法>"    # 或直接用 bundle 里的（不是 lumilab.ts）
```

**给宿主 agent 的纠错提醒（别照文件树瞎猜命令）：**
- ❌ 没有 `scripts/lumilab.ts` —— CLI 是 `scripts/lumilab`（无扩展名）。
- ❌ `install.sh` 是**安装器**，不是「创建想法」；装一次即可，别拿它建想法。
- ❌ 别让用户 `cd` 进目录手动跑脚本 —— 正常用法就是在 AI 宿主里说一句话，skill 自动接力。
- ⚠️ 若你只是把仓库 clone 到了 workspace：先跑一次 `bash install.sh`（或宿主自带的 skills install），把 26 个 skill 装进宿主的 skills 目录，它们才会作为 skill 被加载、用户才能用一句话触发。

## 它解决什么问题

有个创业 idea，但不知道行不行 —— 该不该投入几个月去做？

传统做法是凭感觉、或者直接埋头做出来再说。Lumi Lab 让你在**写第一行产品代码之前**，几天时间、几乎零成本地拿到答案：

```
你：一句话 idea
 ↓  （最多问你一次可选补充，能跳过就跳过）
自动：市场分析 + 竞品扫描 + 人群拆解 + 关键词红蓝海
 ↓
产物①：图文并茂的网页版分析报告 + 3-5 个具体方向建议
 ↓  （唯一一次决策：选个方向，或说「你来定」）
自动：设计 + 文案 + SEO/GEO
 ↓
产物②：fake-door 验证页 —— 真实「立即购买/留邮箱」CTA + 转化追踪
 ↓
上线几天 → 回收「有多少人真的想买」这个数字 → 判断继续还是 pivot
```

最终产出的 landing **不是营销页，是验证仪器** —— 它的工作是测量真实需求信号。

## 默认入口

```bash
lumilab idea "你的一句话想法"
```

或在 AI 宿主里直接说：**用 lumilab-idea-to-landing 帮我跑这个 idea**。

宿主 LLM 会按 `lumilab-idea-to-landing` 这个 orchestrator skill 的 EXECUTION CONTRACT 自动跑完整条流水线，全程最多打扰你 2 次（一次可选补充 + 一次方向选择），中间产物都是 HTML 主动推给你看。

## 26 个 skill 怎么协同

| 层 | 数量 | skills |
|---|---|---|
| **Orchestrator（默认入口）** | 1 | idea-to-landing |
| **核心（自建）** | 5 | hypothesis-ledger / founder-coach / landing-mvp / content-repurpose / weekly-sop-runner |
| **基础设施** | 3 | config / deploy / research-platforms |
| **渲染** | 1 | studio |
| **Overlay** | 12 | coach-yc / research-{interview,icp,competitor,keywords} / product-{positioning,pmf,mvp} / copy / launch-strategy / metrics / design-direction |
| **知识** | 1 | playbook-cn |

`idea-to-landing` 是编排者；它在 Phase 1 自动调用 research-platforms（定性痛点）+ research-competitor + research-icp + research-keywords（定量搜索需求），Phase 2 调 studio 渲染分析报告，Phase 4 调 design-direction + landing-mvp + copy 生成验证页。其余 skill 在对话中按需调用。

每个 skill 是 `skills/<name>/SKILL.md` + 可选的 `scripts/`（含 `validate-output.ts` 输出校验 + `anti-slop-lint.ts` 文案检查）。共 26 个 skill。

## 安装

三种宿主三条路径，详见 [`README.md`](./README.md)：

```bash
# Claude Code / Cursor / Codex —— 本地
git clone https://github.com/zifeixu85/lumilab.git && cd lumilab && ./install.sh

# OpenClaw —— ClawHub
openclaw skills install lumilab

# Hermes —— chat 内一句话装
/skills install https://github.com/zifeixu85/lumilab
```

`install.sh` 缺 bun 会自动装。首次用跑 `lumilab config` 走 6 步引导页（选界面风格 / 配可选工具 token）。

## 不需要 LLM API key

Lumi Lab 跑在你的 AI 宿主里，宿主已经有 LLM。bundle 只要可选的**工具 token**（Cloudflare 部署 / Tavily·TikHub 调研 / DataForSEO·Keywords Everywhere 关键词），而且全部可跳过 —— 不配就用 mock 数据或宿主 LLM 知识兜底，不影响核心流程。

## License

授权见 [`LICENSE`](./LICENSE)。
