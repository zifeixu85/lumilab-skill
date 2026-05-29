#!/usr/bin/env bun
/**
 * Validator: 检查 venture 下 payment/stripe.json 结构合法。
 *
 * Usage:
 *   bun run validate-output.ts <venture-dir>
 *
 * Exit 0 = OK, 1 = invalid.
 */
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const dir = process.argv[2];
if (!dir) {
  console.log('usage: validate-output.ts <venture-dir>');
  process.exit(0);
}

const path = join(dir, 'payment', 'stripe.json');
if (!existsSync(path)) {
  // optional file — no payment yet is valid
  console.log('(no payment/stripe.json — venture has no Stripe link yet, OK)');
  process.exit(0);
}

let data: Record<string, unknown>;
try {
  data = JSON.parse(readFileSync(path, 'utf-8'));
} catch (e) {
  console.error('✗ invalid JSON:', (e as Error).message);
  process.exit(1);
}

const required = ['mode', 'product_id', 'price_id', 'payment_link_id', 'payment_link_url', 'amount', 'currency', 'name', 'created_at'];
const missing = required.filter((k) => !(k in data));
if (missing.length) {
  console.error('✗ missing fields:', missing.join(', '));
  process.exit(1);
}

if (data.mode !== 'test' && data.mode !== 'live') {
  console.error('✗ mode must be "test" or "live", got:', data.mode);
  process.exit(1);
}
if (typeof data.payment_link_url !== 'string' || !data.payment_link_url.startsWith('https://buy.stripe.com/')) {
  console.error('✗ payment_link_url not a Stripe buy URL');
  process.exit(1);
}
if (typeof data.amount !== 'number' || data.amount <= 0) {
  console.error('✗ amount must be positive number');
  process.exit(1);
}

console.log('✓ payment/stripe.json valid');
process.exit(0);
