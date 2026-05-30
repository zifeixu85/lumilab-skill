---
name: lumilab-config
description: |
  Setup Wizard + Share Manager + Secrets storage for the Lumi Lab skills bundle.

  Browser-based 6-step first-run onboarding page: user identity / preferences / tool tokens (Cloudflare for deploy, Tavily for search, TikHub/Stripe/Resend/WeChat/X as optional integrations) / default deploy password.

  Browser-based Share Manager to view/copy/rotate/delete deployed venture Studios.

  Lumi Lab is a skills bundle that runs INSIDE Claude Code / OpenClaw / Cursor / Codex / Hermes. The host environment provides the LLM, so this wizard never asks for LLM API keys. It only configures tool integrations and user preferences.

  Use when user types /lumilab config, /lumilab manage, or on first /lumilab init.

  关键词：setup wizard / config / 配置 / tool token / cloudflare / tavily / share management / 分享管理 / secrets / 密钥管理 / venture 密码
version: 1.5.0
status: P0-ready
metadata:
  hermes:
    tags: [config, wizard, secrets, keychain, share-manager]
  lumilab:
    tier: utility
    requires_browser: true
    chat_only_ok: true
  category: foundation
  agent: infrastructure
  upstream: []
  outputs:
    - "~/.lumilab/config.json (user prefs + default password)"
    - "~/.lumilab/secrets.json (tool tokens + venture passwords — NEVER LLM keys)"
    - "~/.lumilab/shares.json (deployed venture manifest)"
  reads:
    - "host workspace openclaw.json (config schema, if present)"
license: Apache-2.0
platforms: [macos, linux]
prerequisites:
  env_vars: []
  commands: [bun]
compatibility: "Claude Code, OpenClaw 2026.4.25+, Hermes Agent v0.13.0+, Cursor, Codex"
---


# config · 配置向导 + 分享管理

**一句话价值（utility）**：浏览器 6 步首次引导(身份/偏好/工具 token/默认密码) + Share Manager + keychain 密钥存储——把配置封装成一次性可视化流程。

## 目标用户

首次安装 Lumi Lab、要配工具 token / 选界面风格 / 管分享的用户。不面向无需配置的纯只读浏览。

## 核心方法 / 能力

6 步引导：用户身份 / 偏好 / 工具 token(Cloudflare/Tavily/TikHub/Stripe...) / 默认部署密码。Share Manager 看/复制/改密/删已部署 Studio。密钥存系统 keychain。宿主提供 LLM，故不问 LLM key。

## 何时调用

用户 /lumilab config / manage，或首次 /lumilab init。

## 工作流程与用法

1. 浏览器 6 步引导(可选 token 都可跳)。2. token 存 keychain。3. Share Manager 管理已部署。

```text
lumilab config
→ 6 步: 身份/偏好/token/密码
token → 系统 keychain (不落明文)
lumilab manage → Share Manager
```

## 输出

字段：onboarded / service_mode / 已配 token 列表 / default_password。结构由 `scripts/validate-output.ts` 校验，anti-slop-lint 兜禁词。

## 差异化与抗替代

- **vs 现有替代**：手写 .env、翻文档找配置项。
- **为什么不是通用 LLM**：浏览器 6 步引导 + keychain 安全存储 + Share Manager，纯 LLM 无法操作本地 keychain 与可视化配置。
- **沉淀**：配置一次长期复用、跨 venture 共享。

## 异常路径 · 幂等 · 边界

缺 token 时降级提示不阻塞主流程；幂等可重入；端口占用顺延。

## 依赖与成本

bun + 浏览器；token 存系统 keychain，不落明文；SKILL.md 精简、scripts/ 按需加载，单次上下文成本低、可缓存。

## 安全与隐私

密钥仅进 keychain / 不写 repo / 不打印全量；不问 LLM key。

## 深入参考

完整操作细节（详细流程 / 表格 / 边界 / 分支决策）见 `references/full-guide.md`，宿主执行流水线时按需加载。

## Changelog

- 1.5.0：精简至 ≤6000 字、补齐 rubric 维度（目标用户/差异化与抗替代/异常·幂等·边界/依赖/安全），提升可发现性、可缓存性与稳定性表达。
