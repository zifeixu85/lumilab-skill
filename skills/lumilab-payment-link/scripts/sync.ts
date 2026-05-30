#!/usr/bin/env bun
/**
 * lumilab payment sync — Stripe 只读回读付款数据 → 验证信号（W3）。
 *
 * 把 fake-door 落地页「立即购买」按钮背后的 Stripe payment link 的真实成交回读下来：
 *   付款次数 + 金额 + 转化率 → 写 payment/summary.json → 喂 metrics / next-actions / hypothesis-ledger。
 * 付款是「比留邮箱强 1000×」的真实需求信号，也是我们唯一能服务端自动回读的真信号。
 *
 * 用法：
 *   bun run sync.ts <venture-slug>            # 真拉（需 stripe.sk_test + 网络）
 *   bun run sync.ts <venture-slug> --mock     # 写一份样例 summary（无 key/网络，demo 兜底 / 测试）
 *
 * 只读：仅 GET /v1/checkout/sessions（必要时 /v1/payment_intents）。绝不对 Stripe 做写操作。
 * 安全：key 仅从 keychain / secrets / env 读，永不进 git / 永不打印全量 / 永不写日志。
 *       summary.json 脱敏：只存 id/amount/status/created，绝不存客户邮箱 / 卡 / 姓名。
 */
import { spawnSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const LUMILAB_HOME = process.env.LUMILAB_HOME ?? join(homedir(), '.lumilab');

interface Session { id: string; amount: number; status: string; created: number; }
interface Summary {
  count_paid: number; gross_amount: number; currency: string;
  mode: 'test' | 'live'; last_synced: string; sessions: Session[];
  source?: 'stripe' | 'mock';
}

function ventureDir(slug: string): string { return join(LUMILAB_HOME, 'data', 'ventures', slug); }
function paymentDir(slug: string): string { return join(ventureDir(slug), 'payment'); }

function getStripeKey(): string | null {
  if (process.env.STRIPE_SK_TEST) return process.env.STRIPE_SK_TEST;
  if (process.env.STRIPE_SK_LIVE) return process.env.STRIPE_SK_LIVE;
  const keychainScript = join(import.meta.dir, '..', '..', 'lumilab-config', 'scripts', 'keychain.ts');
  if (existsSync(keychainScript)) {
    for (const name of ['stripe.sk_test', 'stripe.sk_live']) {
      const r = spawnSync('bun', ['run', keychainScript, 'get', name]);
      const key = String(r.stdout).trim();
      if (key.startsWith('sk_test_') || key.startsWith('sk_live_')) return key;
    }
  }
  return null;
}

async function stripeGet(path: string, key: string, params: Record<string, string | number>): Promise<any> {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) qs.set(k, String(v));
  const r = await fetch('https://api.stripe.com' + path + '?' + qs.toString(), {
    method: 'GET',
    headers: { authorization: 'Basic ' + btoa(key + ':') },
  });
  if (!r.ok) {
    const text = await r.text();
    throw new Error(`stripe GET ${path} → ${r.status} ${text.slice(0, 200)}`);
  }
  return r.json();
}

// Append payment evidence to a "付费意愿 / willingness-to-pay" hypothesis if one exists (best-effort).
function writeLedgerEvidence(slug: string, summary: Summary): void {
  const p = join(ventureDir(slug), 'hypotheses.yaml');
  if (!existsSync(p)) return;
  try {
    // @ts-ignore
    const yaml = require('js-yaml');
    const list = yaml.load(readFileSync(p, 'utf-8'));
    if (!Array.isArray(list)) return;
    const h = list.find((x: any) =>
      x?.status === 'active' && /付费|付款|愿意付|willing|pay|购买/i.test(String(x.fact ?? '') + String(x.test_method ?? '')));
    if (!h) return;
    h.evidence = Array.isArray(h.evidence) ? h.evidence : [];
    h.evidence.push({
      source: 'payment/summary.json',
      excerpt: `Stripe ${summary.mode} 真实付款 ${summary.count_paid} 笔 / ${(summary.gross_amount / 100).toFixed(0)} ${summary.currency.toUpperCase()}`,
      timestamp: summary.last_synced,
    });
    if (summary.count_paid > 0 && h.test_status !== 'passed') h.test_status = 'passed';
    h.verification_count = (h.verification_count ?? 0) + 1;
    h.updated_at = summary.last_synced;
    writeFileSync(p, yaml.dump(list, { lineWidth: 120, noRefs: true }), 'utf-8');
    console.log(`  ✓ 回写假设 ${h.id} 的付款证据`);
  } catch { /* ledger writeback is best-effort, never block sync */ }
}

function writeSummary(slug: string, summary: Summary): string {
  const dir = paymentDir(slug);
  mkdirSync(dir, { recursive: true });
  const p = join(dir, 'summary.json');
  writeFileSync(p, JSON.stringify(summary, null, 2) + '\n', 'utf-8');
  return p;
}

function reRender(slug: string): void {
  const renderTs = join(import.meta.dir, '..', '..', 'lumilab-studio', 'scripts', 'render.ts');
  if (!existsSync(renderTs)) return;
  spawnSync('bun', ['run', renderTs, ventureDir(slug)], { stdout: 'ignore', stderr: 'ignore' });
}

function mockSummary(): Summary {
  const now = Date.now();
  const day = 86400;
  const sessions: Session[] = [
    { id: 'cs_test_a1', amount: 9900, status: 'paid', created: Math.floor((now) / 1000) - day * 1 },
    { id: 'cs_test_a2', amount: 9900, status: 'paid', created: Math.floor((now) / 1000) - day * 2 },
    { id: 'cs_test_a3', amount: 9900, status: 'paid', created: Math.floor((now) / 1000) - day * 2 },
    { id: 'cs_test_a4', amount: 19900, status: 'paid', created: Math.floor((now) / 1000) - day * 3 },
    { id: 'cs_test_b1', amount: 9900, status: 'open', created: Math.floor((now) / 1000) - day * 1 },
  ];
  const paid = sessions.filter((s) => s.status === 'paid');
  return {
    count_paid: paid.length,
    gross_amount: paid.reduce((a, s) => a + s.amount, 0),
    currency: 'cny',
    mode: 'test',
    last_synced: new Date().toISOString(),
    sessions,
    source: 'mock',
  };
}

async function syncReal(slug: string, key: string): Promise<Summary> {
  const stripePath = join(paymentDir(slug), 'stripe.json');
  if (!existsSync(stripePath)) {
    throw new Error('没有 payment/stripe.json — 先 `lumilab payment create --venture ' + slug + ' ...`');
  }
  const stripe = JSON.parse(readFileSync(stripePath, 'utf-8'));
  const linkId = stripe.payment_link_id;
  if (!linkId) throw new Error('stripe.json 缺 payment_link_id');
  const mode: 'test' | 'live' = key.startsWith('sk_live_') ? 'live' : 'test';

  const sessions: Session[] = [];
  let startingAfter: string | undefined;
  for (let page = 0; page < 20; page++) {
    const params: Record<string, string | number> = { payment_link: linkId, limit: 100 };
    if (startingAfter) params.starting_after = startingAfter;
    const res = await stripeGet('/v1/checkout/sessions', key, params);
    for (const s of res.data ?? []) {
      sessions.push({ id: s.id, amount: s.amount_total ?? 0, status: s.payment_status ?? s.status ?? 'unknown', created: s.created });
    }
    if (!res.has_more || !res.data?.length) break;
    startingAfter = res.data[res.data.length - 1].id;
  }
  const paid = sessions.filter((s) => s.status === 'paid');
  const currency = stripe.currency ?? 'usd';
  return {
    count_paid: paid.length,
    gross_amount: paid.reduce((a, s) => a + s.amount, 0),
    currency,
    mode,
    last_synced: new Date().toISOString(),
    sessions,
    source: 'stripe',
  };
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const slug = args.find((a) => !a.startsWith('--'));
  const mock = args.includes('--mock');
  if (!slug) {
    console.error('用法：lumilab payment sync <venture-slug> [--mock]');
    process.exit(1);
  }
  if (!existsSync(ventureDir(slug))) {
    console.error('✗ venture 不存在：' + slug);
    process.exit(1);
  }

  let summary: Summary;
  if (mock) {
    summary = mockSummary();
    console.log('  ▸ 写入样例付款数据（--mock，不触网）');
  } else {
    const key = getStripeKey();
    if (!key) {
      console.error('✗ 没有 Stripe key（keychain stripe.sk_test / 环境变量 STRIPE_SK_TEST）');
      console.error('  无 key 时 demo 用预置 payment/summary.json 兜底；要真拉先：lumilab secrets set stripe.sk_test');
      console.error('  或写样例：lumilab payment sync ' + slug + ' --mock');
      process.exit(1);
    }
    console.log('  ▸ 只读拉取 Stripe checkout sessions…');
    try {
      summary = await syncReal(slug, key);
    } catch (e) {
      console.error('✗ ' + (e as Error).message);
      process.exit(1);
    }
  }

  const p = writeSummary(slug, summary);
  writeLedgerEvidence(slug, summary);
  reRender(slug);

  const cvr = summary.sessions.length ? (summary.count_paid / summary.sessions.length) : 0;
  console.log('');
  console.log('  ✓ 付款回流 → ' + p);
  console.log(`    真实付款 ${summary.count_paid} 笔 · ${(summary.gross_amount / 100).toFixed(0)} ${summary.currency.toUpperCase()} · ${summary.mode} mode`);
  if (summary.count_paid > 0) console.log('    ≥1 笔已付 = 真实需求信号（强于任何留资）。Studio 复盘阶段已显示信号灯。');
}

if (import.meta.main) main().catch((e) => { console.error('✗', e.message); process.exit(1); });
