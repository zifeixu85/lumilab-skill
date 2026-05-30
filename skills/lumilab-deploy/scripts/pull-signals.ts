#!/usr/bin/env bun
/**
 * pull-signals.ts — 从部署页的第一方埋点 D1 拉验证信号，写 studio/validation-signals.json。
 * Studio「验证信号」漏斗面板 + lumilab-metrics 读这个文件。
 *
 * 用法：bun run pull-signals.ts <venture>
 * 数据源：CF D1 `lumilab-<venture>`（部署时由 setup-cf-backend 建好绑定）+ payment/summary.json。
 * 缺 D1 权限/数据时 source=none，写一个带说明的占位（面板显示「待数据」），绝不崩。
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { spawnSync } from 'child_process';

const HOME = process.env.LUMILAB_HOME ?? join(homedir(), '.lumilab');

function secret(name: string): string | undefined {
  for (const k of [name, name.toLowerCase()]) if (process.env[k]) return process.env[k];
  try { const s = JSON.parse(readFileSync(join(HOME, 'secrets.json'), 'utf-8')); return s[name] || s[name.toLowerCase()]; } catch { return undefined; }
}

function d1Query(db: string, sql: string, token: string): any[] | null {
  const r = spawnSync('wrangler', ['d1', 'execute', db, '--remote', '--json', `--command=${sql}`],
    { encoding: 'utf-8', env: { ...process.env, CLOUDFLARE_API_TOKEN: token }, timeout: 60000 });
  const out = (r.stdout || '');
  try {
    const j = JSON.parse(out.slice(out.indexOf('[')));
    // wrangler d1 --json 返回 [{results:[...]}] 或 {result:[{results}]}
    const res = Array.isArray(j) ? j[0]?.results : j?.result?.[0]?.results;
    return Array.isArray(res) ? res : null;
  } catch { return null; }
}

function num(v: unknown): number { const n = Number(v); return Number.isFinite(n) ? n : 0; }

function main(): void {
  const venture = process.argv[2];
  if (!venture) { console.error('用法：pull-signals.ts <venture>'); process.exit(2); }
  const ventureDir = join(HOME, 'data', 'ventures', venture);
  const outDir = join(ventureDir, 'studio');
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, 'validation-signals.json');

  const db = `lumilab-${venture}`.toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 50);
  const token = secret('CLOUDFLARE_API_TOKEN');

  let source: 'd1' | 'none' = 'none';
  const funnel = { uv: 0, cta_click: 0, email_submit: 0, payment_paid: 0 };
  let byChannel: { source: string; uv: number; cta: number; email: number }[] = [];
  let byCountry: { country: string; uv: number }[] = [];
  let dwellMedian = 0, notice = '';

  if (token) {
    const f = d1Query(db, `SELECT event, COUNT(DISTINCT sid) n FROM events WHERE venture='${venture.replace(/'/g, "")}' GROUP BY event`, token);
    if (f) {
      source = 'd1';
      const m: Record<string, number> = {}; f.forEach((r) => { m[String(r.event)] = num(r.n); });
      funnel.uv = num(m['page_view']);
      funnel.cta_click = num(m['cta_click']);
      funnel.email_submit = num(m['email_submit']);
      const ch = d1Query(db, `SELECT COALESCE(NULLIF(utm_source,''),'(direct)') src, COUNT(DISTINCT sid) uv, COUNT(DISTINCT CASE WHEN event='cta_click' THEN sid END) cta, COUNT(DISTINCT CASE WHEN event='email_submit' THEN sid END) email FROM events WHERE venture='${venture.replace(/'/g, "")}' GROUP BY src ORDER BY uv DESC LIMIT 8`, token);
      if (ch) byChannel = ch.map((r) => ({ source: String(r.src), uv: num(r.uv), cta: num(r.cta), email: num(r.email) }));
      const co = d1Query(db, `SELECT COALESCE(NULLIF(country,''),'?') country, COUNT(DISTINCT sid) uv FROM events WHERE venture='${venture.replace(/'/g, "")}' GROUP BY country ORDER BY uv DESC LIMIT 8`, token);
      if (co) byCountry = co.map((r) => ({ country: String(r.country), uv: num(r.uv) }));
    } else {
      notice = 'D1 暂无法查询（可能 token 缺 D1 权限，或还没流量）。配好权限 + 有访问后再拉。';
    }
  } else {
    notice = '未配置 CLOUDFLARE_API_TOKEN —— 无法拉埋点。';
  }

  // payment 从 Stripe summary 合并（最强信号）
  try {
    const ps = JSON.parse(readFileSync(join(ventureDir, 'payment', 'summary.json'), 'utf-8'));
    funnel.payment_paid = num(ps.count_paid);
  } catch { /* 无 payment 数据 */ }

  const out = {
    venture, updated_at: new Date().toISOString(), source, notice: notice || undefined,
    funnel, by_channel: byChannel, by_country: byCountry, dwell_median_ms: dwellMedian,
  };
  writeFileSync(outPath, JSON.stringify(out, null, 2));
  console.log(`✓ 验证信号 → ${outPath}（source=${source} · UV=${funnel.uv} · CTA=${funnel.cta_click} · email=${funnel.email_submit} · paid=${funnel.payment_paid}）`);
  if (notice) console.log('  ' + notice);
}

main();
