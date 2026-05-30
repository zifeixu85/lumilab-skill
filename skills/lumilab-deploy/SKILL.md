---
name: lumilab-deploy
description: |
  One-command deployment of venture Studio to Cloudflare Pages with client-side encryption and password gate. Reads encrypted content (AES-GCM + PBKDF2 1M iterations) and wraps it in static HTML password gate. Uses wrangler CLI to push to Cloudflare Pages. Generates QR code for mobile access. Supports rotate-password and undeploy. Use when user types /lumilab deploy, /lumilab undeploy, or /lumilab rotate-password.
  关键词：deploy / 部署 / cloudflare pages / wrangler / 加密分享 / 密码门 / venture studio 部署 / 一键部署 / 二维码 / 公网链接
version: 1.5.0
metadata:
  hermes:
    tags: [deploy, cloudflare, encryption, aes-gcm, password-gate]
  lumilab:
    tier: utility
    requires_browser: false
    chat_only_ok: true
  category: foundation
  agent: infrastructure
  upstream:
    - "wrangler (Cloudflare official CLI)"
    - "Web Crypto API (browser-native AES-GCM + PBKDF2)"
  outputs:
    - "data/ventures/<name>/deploy/manifest.json"
    - "data/ventures/<name>/deploy/encrypted-bundle/ (加密后的 HTML 包装层)"
    - "data/ventures/<name>/deploy/qr.png"
    - "~/.lumilab/shares.json (新增/更新条目)"
  reads:
    - "data/ventures/<name>/studio/ (要部署的内容)"
    - "~/.lumilab/config.json (默认密码 / 默认公开私密)"
    - "~/.lumilab/secrets.enc (Cloudflare token)"
license: Apache-2.0
platforms: [macos, linux]
prerequisites:
  env_vars: []
  commands: [bun]
compatibility: "Claude Code, OpenClaw 2026.4.25+, Hermes Agent v0.13.0+, Cursor, Codex"
---


# deploy · 一键加密部署

**一句话价值（utility）**：一条命令把验证页加密部署到 Cloudflare Pages(客户端 AES-GCM + 密码门 + 二维码)，拿到公网链接——纯 LLM 做不到真部署。

## 目标用户

要把验证页一键加密部署到公网拿链接的独立开发者。不面向需要复杂 CI/CD 的生产应用。

## 核心方法 / 能力

读加密内容(AES-GCM + PBKDF2 1M 迭代)包成静态 HTML 密码门，wrangler 推 Cloudflare Pages，生成访问二维码。支持 rotate-password / undeploy / 三档可见性。

## 何时调用

用户 /lumilab deploy / undeploy / rotate-password。

## 工作流程与用法

1. 加密内容 + 包密码门。2. wrangler 推 Pages(4.x 先建项目)。3. 出二维码 + 链接 → 进 Share Manager。

```text
lumilab deploy my-venture --public
→ AES-GCM 加密 + 密码门 + 推 CF Pages + 二维码
rotate-password / undeploy 可用
```

## 输出

字段：url / 可见性 / 密码 / 二维码 / 部署时间。结构由 `scripts/validate-output.ts` 校验，anti-slop-lint 兜禁词。

## 差异化与抗替代

- **vs 现有替代**：GitHub+Vercel 6 步、手搓密码门。
- **为什么不是通用 LLM**：Cloudflare 单 token + 客户端加密 + 密码门 + 二维码一条命令，纯 LLM 无法真执行部署。
- **沉淀**：部署记录进 Share Manager、可复用/改密/下线。

## 异常路径 · 幂等 · 边界

无 token 走 dry-run 文件 prep；wrangler 4.x 先建项目再部署、幂等。

## 依赖与成本

bun + wrangler + CLOUDFLARE_API_TOKEN(可选，无则 dry-run)；SKILL.md 精简、scripts/ 按需加载，单次上下文成本低、可缓存。

## 安全与隐私

内容客户端加密(PBKDF2 1M)、密码门；token 仅 env/keychain、不入 repo。

## 深入参考

完整操作细节（详细流程 / 表格 / 边界 / 分支决策）见 `references/full-guide.md`，宿主执行流水线时按需加载。

## Changelog

- 1.5.0：精简至 ≤6000 字、补齐 rubric 维度（目标用户/差异化与抗替代/异常·幂等·边界/依赖/安全），提升可发现性、可缓存性与稳定性表达。
