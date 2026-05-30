# payment-link · smoke test

```bash
# 1) 无 key 兜底：写样例付款回流
lumilab payment sync lumilab-meta --mock
#   期望：summary.json 有 count_paid>0、脱敏（无邮箱/卡/姓名）

# 2) 校验 stripe.json 结构（若已 create）
bun run scripts/validate-output.ts ~/.lumilab/data/ventures/lumilab-meta
#   期望：exit 0

# 3) anti-slop 干净
bun run scripts/anti-slop-lint.ts ~/.lumilab/data/ventures/lumilab-meta/payment
```

期望：`payment/summary.json` 含 count_paid / gross_amount / currency / mode / sessions(脱敏)；
有 key+网络时 `lumilab payment sync <slug>` 现场真拉覆盖。
