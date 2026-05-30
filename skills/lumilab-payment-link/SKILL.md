---
name: lumilab-payment-link
description: |
  把 fake-door landing 的"立即购买"按钮换成 Stripe Test Mode 真 checkout。一次性创建 Stripe product + price + payment link，输出可分享 URL。用户点了用测试卡 4242… 完成假 checkout = "愿意付钱"的强信号，比邮件留资强一档。需要 sk_test（sandbox 无需 KYC）。 Use when 用户 /lumilab payment create 或 sync，要测真付费或回读成交。
  关键词：stripe / payment link / 假门 / 测试卡 / sandbox / fake door / 付费意向 / Test Mode / pricing
version: 0.2.1
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



# payment-link — Stripe Test Mode 真 checkout

## 何时调用

**触发**：
- 用户已有 fake-door landing，想升级"立即购买"按钮从邮件 modal 变成真 Stripe checkout
- 用户问"怎么验证真付费意愿，不只是留邮箱"
- 决赛 demo 想体现"我们的假门可以真走 Stripe"

**反触发**：
- 用户还没确定定价（先 lumilab-product-mvp 算 LTV/CAC）
- 用户要做的是 SaaS 月订阅（本 skill 只做一次性 payment link；订阅走 Stripe Subscriptions API）

## 前置

一次性，10 分钟，永久受益：

1. 注册 Stripe 账号：https://dashboard.stripe.com/register（5 分钟，sandbox 无需 KYC）
2. 拿 sk_test 和 pk_test：Dashboard → Developers → API keys
3. 存进 lumilab keychain：
   ```bash
   lumilab secrets set stripe.sk_test
   # 粘贴 sk_test_… 回车
   ```

## 用法

### 一次性创建（不绑定 venture）

```bash
bun run scripts/create.ts \
  --name "Lumi Lab Pro · Validation Bundle" \
  --price 9900 \
  --currency cny
```

输出：
```
  ✓ Payment Link (Stripe Test Mode):
    https://buy.stripe.com/test_xxxxxxxxxx
```

### 绑定到 venture（推荐）

```bash
bun run scripts/create.ts \
  --venture lumilab-meta \
  --name "Lumi Lab Pro" \
  --price 9900 \
  --currency cny
```

额外写入 `~/.lumilab/data/ventures/lumilab-meta/payment/stripe.json`，landing-mvp 重新渲染时自动把 URL 替换到"立即购买"按钮的 `href`。

## 测试

```bash
# 用测试卡完成 checkout
open "https://buy.stripe.com/test_xxxxxxxxxx"
# → 卡号: 4242 4242 4242 4242
# → CVC:  任意 3 位
# → 日期: 任意未来
# → 邮箱: 测试邮箱

# Dashboard 看 webhook
open https://dashboard.stripe.com/test/payments
```

## Test Mode vs Live Mode

| 维度 | Test Mode（当前）| Live Mode |
|---|---|---|
| key 前缀 | `sk_test_` | `sk_live_` |
| KYC | 不需要 | 必须 |
| 银行账户 | 不需要 | 必须 |
| 真扣钱 | 否 | 是 |
| 测试卡 | 4242… 可用 | 不可用 |
| 用途 | fake-door 验证付费意向 | 真实交易 |

**v1.x 只支持 Test Mode**。Live Mode 升级路径：v2.x 当用户 venture 走通 PMF 后，引导他完成 Stripe 账户激活，换 sk_live。

## 安全

- sk_test 也是凭证 —— 即使是 sandbox，也别 commit / 别贴 chat / 别放环境变量文件
- 存进 macOS keychain（lumilab secrets set …）
- 怀疑泄漏：Stripe Dashboard 一键 rotate（30 秒）

## Alternatives

| 替代品 | 为什么不用 |
|---|---|
| 自己接 Stripe Checkout Sessions | 需要服务端，本 skill 是 zero-backend |
| Lemon Squeezy | 简单但海外用户多；国内 Stripe Test Mode 更通用 |
| Gumroad | 适合 digital product 而非创业 venture |
| Manual: 自己在 Stripe Dashboard 点 | 不可自动化 |

## Moat

把 lumilab fake-door 从"邮件留资"升级到"真 Stripe checkout"，验证信号强度 ×3。竞品（idea-insight / Lovable / v0）都不在这一层做。

## 分支决策

| 情况 | 该做 |
|---|---|
| 用户还没有 fake-door landing | 先 lumilab-landing-mvp |
| sk_test 不存在 | 提示 lumilab secrets set stripe.sk_test |
| price < 100（金额异常小）| 警告 currency 单位（cny: fen 分，usd: cents）|
| 用户问 "怎么真扣钱" | 答：v1.x 只 Test Mode；Live Mode 需 KYC |

## Changelog

- **0.1.0 · 2026-05-29**：首发，仅支持 product + one-time price + payment link。订阅 / refund / webhook 留给 v0.2。

## 校验字段

```yaml
required:
  - name: string (1-250 chars)
  - price: int > 0
  - currency: enum [cny, usd, hkd, eur, gbp, jpy]
optional:
  - venture: kebab-case slug
  - description: string ≤ 500 chars
```


## 回读付款 → 验证信号（sync · W3 · 2026-05-30）

创建只是挂上按钮；真正有价值的是**回读真实成交**。付款是「比留邮箱强 1000×」的需求信号，
也是唯一能服务端自动回读的真信号。

```bash
# 只读拉取 Stripe checkout sessions（需 stripe.sk_test + 网络）
lumilab payment sync <venture>
# 无 key / 断网 / demo 兜底：写一份样例
lumilab payment sync <venture> --mock
```

`sync.ts` 只读调 `GET /v1/checkout/sessions?payment_link=<id>`（分页），统计：
- `count_paid`（`payment_status === 'paid'` 的会话数）
- `gross_amount`（Σ `amount_total`，最小单位）+ `currency`
- 明细**脱敏**：只存 `id/amount/status/created`，**绝不存客户邮箱 / 卡号 / 姓名**

写 `data/ventures/<slug>/payment/summary.json` → 对照 `lumilab-metrics/assets/baselines.yaml`
（R6 `payment_any` tier A）判信号 → 回写「付费意愿」假设的 evidence → 喂 `lumilab-next-actions`
（强信号→放大动作 / 0 笔→换定位动作）。Studio 启动阶段显示「真实付款 N 笔 · ¥X · 转化 Y% · 强信号」。

**安全**：key 仅从 keychain / `STRIPE_SK_TEST` env 读，**永不进 git / 永不打印全量 / 永不写日志**；
仅 test mode 用于 demo。`create` 重复运行会建重复 product，注意幂等。
