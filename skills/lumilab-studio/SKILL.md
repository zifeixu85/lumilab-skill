---
name: lumilab-studio
description: |
  HTML rendering engine + interactive decision pages for venture Studio. Renders MD/YAML data layer into spatial HTML (Thariq "values reading" pattern). Generates index.html with SVG progress diagram, decisions/* interactive pages (clarify, design-direction, retro, manage), and preview/* asset previews. Supports dual mode (file:// static read + localhost:7777 interactive). Auto re-renders on data change. Use when the user types /lumilab studio, when any data/ventures/ file changes and the dashboard needs re-rendering, or when an interactive decision page (config / manage / retro) must open.
  关键词：studio / 作战室 / 项目网页 / html dashboard / svg progress / 交互页 / 渲染引擎 / dual mode / file 协议 / localhost / 数据驱动渲染
version: 2.0.0
metadata:
  hermes:
    tags: [studio, html, editorial, progress, venture-journal]
  lumilab:
    tier: utility
    requires_browser: false
    chat_only_ok: true
  category: foundation
  agent: infrastructure
  upstream:
    - "Thariq Shihipar: HTML effectiveness patterns"
    - "Web Crypto / Web APIs"
  outputs:
    - "data/ventures/<name>/studio/index.html (作战室主页 + SVG progress)"
    - "data/ventures/<name>/studio/decisions/02-clarify-hypotheses.html"
    - "data/ventures/<name>/studio/decisions/04-design-direction.html (★ 旋钮 + Live Preview)"
    - "data/ventures/<name>/studio/decisions/08-weekly-retro.html"
    - "data/ventures/<name>/studio/preview/{landing,content-xhs,content-wechat,...}.html"
  reads:
    - "data/ventures/<name>/* (所有数据)"
    - "design_direction.json (视觉 token)"
license: Apache-2.0
platforms: [macos, linux]
prerequisites:
  env_vars: []
  commands: [bun]
compatibility: "Claude Code, OpenClaw 2026.4.25+, Hermes Agent v0.13.0+, Cursor, Codex"
---


# studio · HTML 渲染引擎 + 常驻服务

**一句话价值（productivity）**：把 venture 数据层确定性渲染成可交互的空间化 HTML 作战室；常驻守护进程统一服务、文件变更自动刷新、看板/脑图/付款验证/落地页实时 re-theme 一屏俱全。

## 目标用户

用 Lumi Lab 跑验证、想一屏看清 venture 进度并就地编辑的创始人。不面向需要复杂多人协作 BI 的团队。

## 核心方法 / 能力

确定性 render.ts 把 MD/YAML 数据层渲染成 HTML(SVG progress + 7 阶段)。serve.ts 双模式(file:// 只读 + localhost 交互) + **常驻守护进程**(lumilab serve start，固定端口、SSE 文件变更自动刷新、访问惰性重渲)。复盘阶段内联看板(原生拖拽)+ 脑图(离线 SVG)+ 付款验证块；构建阶段真实落地页 iframe + 设计面板实时 re-theme(确定性写 theme.css，无 LLM)。

## 何时调用

用户 /lumilab studio / serve；任何 data/ventures 文件变更需重渲；交互页(看板/付款/设计)要打开。

## 工作流程与用法

1. lumilab serve start 起守护进程。2. lumilab studio <v> 开作战室。3. 改数据→自动刷新；拖看板/调旋钮即时持久化。

```text
lumilab serve start   # 常驻, 固定 7777, 自动刷新
lumilab studio my-venture
# 拖看板→持久化; 拖设计旋钮→真实落地页即时变
```

## 输出

字段：studio/index.html / next-actions.json / SSE /api/events / /api/* 写接口。结构由 `scripts/validate-output.ts` 校验，anti-slop-lint 兜禁词。

## 差异化与抗替代

- **vs 现有替代**：散落 md/yaml 看不出全貌、静态报告不能编辑、手搭 dashboard。
- **为什么不是通用 LLM**：确定性渲染引擎 + 本地常驻 server + SSE 自动刷新 + iframe 实时 re-theme，纯 LLM 无法渲染/托管/实时更新本地页面。
- **沉淀**：studio 沉淀整条 venture 旅程(假设/决策/信号/看板)，跨轮累积复利。

## 异常路径 · 幂等 · 边界

缺 venture 报错、路径穿越 403、render try/catch 保留旧页；惰性重渲幂等；recursive watch 不支持时降级。

## 依赖与成本

bun + js-yaml；零外部 API、纯本地 HTTP；SKILL.md 精简、scripts/ 按需加载，单次上下文成本低、可缓存。

## 安全与隐私

只服务 DATA_ROOT、路径穿越守护；控制走 run-file 不开额外端点；纯本地不外传。

## 深入参考

完整操作细节（详细流程 / 表格 / 边界 / 分支决策）见 `references/full-guide.md`，宿主执行流水线时按需加载。

## Changelog

- 2.0.0：精简至 ≤6000 字、补齐 rubric 维度（目标用户/差异化与抗替代/异常·幂等·边界/依赖/安全），提升可发现性、可缓存性与稳定性表达。
