---
name: lumilab-payment-link
description: |
  把 fake-door landing 的"立即购买"按钮换成 Stripe Test Mode 真 checkout。一次性创建 Stripe product + price + payment link，输出可分享 URL。用户点了用测试卡 4242… 完成假 checkout = "愿意付钱"的强信号，比邮件留资强一档。需要 sk_test（sandbox 无需 KYC）。 Use when 用户 /lumilab payment create 或 sync，要测真付费或回读成交。
  关键词：stripe / payment link / 假门 / 测试卡 / sandbox / fake door / 付费意向 / Test Mode / pricing
version: 0.2.0
metadata:
  hermes:
    tags: [stripe, payment, fake-door, validation, sandbox]
  lumilab:
    tier: overlay
    requires_browser: false
    chat_only_ok: false
  category: integration
  authors: [lumilab]
  outputs:
    - "data/ventures/<name>/payment/stripe.json (product+price+link metadata)"
  reads:
    - "keychain: stripe.sk_test"
license: Apache-2.0
platforms: [macos, linux]
prerequisites:
  env_vars: []
  commands: [bun]
compatibility: "Claude Code, OpenClaw 2026.4.25+, Hermes Agent v0.13.0+, Cursor, Codex"
---


# payment-link · Stripe 真 checkout + 付款回流

**一句话价值（decision_support）**：把 fake-door 的「立即购买」换成 Stripe 真 checkout，并只读回读真实付款笔数/金额——付款是比留邮箱强 1000× 的需求信号。

## 目标用户

要测真实付费意愿、不止留邮箱的 C 端验证独立开发者。不面向需要复杂订阅计费的成熟产品。

## 核心方法 / 能力

create：一次性建 Stripe product+price+payment_link(test mode 免 KYC)。sync：只读 GET /v1/checkout/sessions 回读付款笔数/金额/转化率 → payment/summary.json(脱敏：只存 id/amount/status/created)。对照 R6 baselines 判信号、回写假设、喂 next-actions。

## 何时调用

用户 /lumilab payment create / sync；要把验证页升级成真付费测试或回读成交。

## 工作流程与用法

1. payment create 挂上真 checkout 按钮。2. 评委用 4242 卡付款。3. payment sync 回读 → studio 显示「N 笔/¥X/强信号」。

```text
lumilab payment create --venture v --price 9900
lumilab payment sync v        # 只读回读
lumilab payment sync v --mock # 无 key 兜底
```

## 输出

字段：count_paid / gross_amount / currency / mode / sessions(脱敏)。结构由 `scripts/validate-output.ts` 校验，anti-slop-lint 兜禁词。

## 差异化与抗替代

- **vs 现有替代**：只留邮箱(弱信号)、裸用 Stripe(不接验证回路)。
- **为什么不是通用 LLM**：真实调 Stripe API 建 link + 只读回读 + 脱敏持久化 + R6 基线判信号，纯 LLM 无法真收款/回读成交。
- **沉淀**：付款历史作为可追溯需求证据、跨轮累积。

## 异常路径 · 幂等 · 边界

无 key/link 清晰报错 + --mock 兜底；sync 只读幂等；create 重复会建重复 product(文档警示)；分页 has_more。

## 依赖与成本

bun + Stripe API；key 仅 keychain/env(STRIPE_SK_TEST)，无 key 走 --mock；SKILL.md 精简、scripts/ 按需加载，单次上下文成本低、可缓存。

## 安全与隐私

key 仅从 keychain/env 读、绝不写日志/repo；summary.json 脱敏不存邮箱/卡/姓名；仅 test mode demo。

## 深入参考

完整操作细节（详细流程 / 表格 / 边界 / 分支决策）见 `references/full-guide.md`，宿主执行流水线时按需加载。

## Changelog

- 0.2.0：精简至 ≤6000 字、补齐 rubric 维度（目标用户/差异化与抗替代/异常·幂等·边界/依赖/安全），提升可发现性、可缓存性与稳定性表达。
