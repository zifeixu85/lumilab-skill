#!/usr/bin/env bun
/**
 * lumilab payment-link · 一次性创建 Stripe product + price + payment link
 *
 * 用途：把 fake-door landing 的"立即购买"按钮换成 Stripe Test Mode 真 checkout。
 * 用户点了 → 进入 Stripe hosted checkout → 输测试卡 4242 4242 4242 4242 → 真返回 success。
 * 比邮件留资强一档：明确的"愿意付钱"信号。
 *
 * 用法：
 *   bun run create.ts --name "Lumi Lab Pro" --price 9900 --currency cny
 *   bun run create.ts --venture lumilab-meta --name "Pro" --price 9900
 *
 * 需要：
 *   keychain 里有 stripe.sk_test（或环境变量 STRIPE_SK_TEST）
 *   一次性 stripe.com 注册（5 分钟，sandbox 无需 KYC）
 *
 * 输出：
 *   stdout: payment link URL
 *   写入：data/ventures/<venture>/payment/stripe.json（若指定 --venture）
 */
import { spawnSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

interface Args {
  name?: string;
  price?: number;        // smallest unit (cny: fen, usd: cents)
  currency?: string;
  venture?: string;
  description?: string;
}

function parseArgs(argv: string[]): Args {
  const out: Args = { currency: 'cny' };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    const v = argv[i + 1];
    switch (k) {
      case '--name': out.name = v; i++; break;
      case '--price': out.price = Number(v); i++; break;
      case '--currency': out.currency = v.toLowerCase(); i++; break;
      case '--venture': out.venture = v; i++; break;
      case '--description': out.description = v; i++; break;
    }
  }
  return out;
}

function getStripeKey(): string {
  if (process.env.STRIPE_SK_TEST) return process.env.STRIPE_SK_TEST;
  // try keychain via lumilab keychain.ts
  const keychainScript = join(import.meta.dir, '..', '..', 'lumilab-config', 'scripts', 'keychain.ts');
  if (existsSync(keychainScript)) {
    const r = spawnSync('bun', ['run', keychainScript, 'get', 'stripe.sk_test']);
    const key = String(r.stdout).trim();
    if (key.startsWith('sk_test_')) return key;
  }
  console.error('✗ no STRIPE_SK_TEST in env, no stripe.sk_test in keychain');
  console.error('  fix: lumilab secrets set stripe.sk_test  (then paste sk_test_…)');
  process.exit(1);
}

async function stripeApi(path: string, key: string, body: Record<string, string | number>): Promise<unknown> {
  const form = new URLSearchParams();
  for (const [k, v] of Object.entries(body)) form.set(k, String(v));
  const r = await fetch('https://api.stripe.com' + path, {
    method: 'POST',
    headers: {
      'authorization': 'Basic ' + btoa(key + ':'),
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: form.toString(),
  });
  if (!r.ok) {
    const text = await r.text();
    throw new Error(`stripe ${path} → ${r.status} ${text}`);
  }
  return r.json();
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  if (!args.name || !args.price) {
    console.error('usage: bun create.ts --name "<product name>" --price <amount-in-smallest-unit> [--currency cny] [--venture <slug>]');
    process.exit(1);
  }
  const key = getStripeKey();

  console.log(`  ▸ creating product "${args.name}"…`);
  const prod = await stripeApi('/v1/products', key, {
    name: args.name,
    ...(args.description ? { description: args.description } : {}),
  }) as { id: string };

  console.log(`  ▸ creating price ${args.price} ${args.currency!.toUpperCase()}…`);
  const price = await stripeApi('/v1/prices', key, {
    product: prod.id,
    unit_amount: args.price,
    currency: args.currency!,
  }) as { id: string };

  console.log(`  ▸ creating payment link…`);
  const link = await stripeApi('/v1/payment_links', key, {
    'line_items[0][price]': price.id,
    'line_items[0][quantity]': 1,
  }) as { id: string; url: string };

  const result = {
    mode: 'test',
    product_id: prod.id,
    price_id: price.id,
    payment_link_id: link.id,
    payment_link_url: link.url,
    amount: args.price,
    currency: args.currency,
    name: args.name,
    created_at: new Date().toISOString(),
  };

  if (args.venture) {
    const LUMILAB_HOME = process.env.LUMILAB_HOME ?? join(homedir(), '.lumilab');
    const dir = join(LUMILAB_HOME, 'data', 'ventures', args.venture, 'payment');
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'stripe.json'), JSON.stringify(result, null, 2));
    console.log(`  ✓ saved → ${join(dir, 'stripe.json')}`);
  }

  console.log('');
  console.log('  ✓ Payment Link (Stripe Test Mode):');
  console.log('    ' + link.url);
  console.log('');
  console.log('  测试卡：4242 4242 4242 4242  CVC 任意  日期未来');
  console.log('  Stripe Dashboard：https://dashboard.stripe.com/test/payments');
}

if (import.meta.main) {
  main().catch((e) => { console.error('✗', e.message); process.exit(1); });
}
