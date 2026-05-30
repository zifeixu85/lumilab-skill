#!/usr/bin/env bun
/**
 * setup-cf-backend.ts — 给一个 CF Pages 项目配好第一方埋点后端（D1 + 绑定 + Resend 密钥）。
 * 部署公开验证页前由 deploy.ts 调用（best-effort，失败不阻塞部署 —— Function 无绑定时只是不落库）。
 *
 * 用法：bun run setup-cf-backend.ts <project-name> <venture> [--from "Lumi Lab <hi@domain>"]
 * 幂等：D1 已存在则复用；绑定/密钥 PATCH 覆盖。
 *
 * 读 secrets.json：CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID / RESEND_API_KEY。
 * 输出 D1 数据库名（供后续查漏斗用）。
 */
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { spawnSync } from 'child_process';

const HOME = process.env.LUMILAB_HOME ?? join(homedir(), '.lumilab');

function secret(name: string): string | undefined {
  for (const k of [name, name.toLowerCase()]) if (process.env[k]) return process.env[k];
  try {
    const s = JSON.parse(readFileSync(join(HOME, 'secrets.json'), 'utf-8'));
    return s[name] || s[name.toLowerCase()];
  } catch { return undefined; }
}

function wrangler(args: string[], token: string): { code: number; out: string } {
  const r = spawnSync('wrangler', args, { encoding: 'utf-8', env: { ...process.env, CLOUDFLARE_API_TOKEN: token }, timeout: 90000 });
  return { code: r.status ?? 1, out: (r.stdout || '') + (r.stderr || '') };
}

async function cfApi(path: string, token: string, method: string, body?: unknown): Promise<any> {
  const r = await fetch('https://api.cloudflare.com/client/v4' + path, {
    method, headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  return r.json().catch(() => ({}));
}

async function ensureD1(dbName: string, token: string): Promise<string | null> {
  // 已存在？
  const list = wrangler(['d1', 'list', '--json'], token);
  try {
    const arr = JSON.parse(list.out.slice(list.out.indexOf('[')));
    const hit = Array.isArray(arr) ? arr.find((d: any) => d.name === dbName) : null;
    if (hit?.uuid) return hit.uuid;
  } catch { /* fall through to create */ }
  const create = wrangler(['d1', 'create', dbName], token);
  const m = create.out.match(/database_id\s*=\s*"([0-9a-f-]+)"/i) || create.out.match(/"uuid":\s*"([0-9a-f-]+)"/i);
  if (m) return m[1];
  // 创建可能因已存在失败 → 再 list 一次
  const list2 = wrangler(['d1', 'list', '--json'], token);
  try { const arr = JSON.parse(list2.out.slice(list2.out.indexOf('['))); const hit = arr.find((d: any) => d.name === dbName); if (hit?.uuid) return hit.uuid; } catch { /* */ }
  return null;
}

async function main(): Promise<void> {
  const [projectName, venture] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  const fromIdx = process.argv.indexOf('--from');
  const from = fromIdx >= 0 ? (process.argv[fromIdx + 1] || '') : '';
  if (!projectName || !venture) { console.error('用法：setup-cf-backend.ts <project-name> <venture> [--from "Name <hi@your-verified-domain>"]'); process.exit(2); }

  const token = secret('CLOUDFLARE_API_TOKEN');
  const account = secret('CLOUDFLARE_ACCOUNT_ID');
  if (!token || !account) { console.error('  ⚠ 埋点后端跳过：缺 CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID'); process.exit(0); }

  const dbName = `lumilab-${venture}`.toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 50);
  console.log(`  ▸ D1 数据库：${dbName}`);
  const dbId = await ensureD1(dbName, token);
  if (!dbId) { console.error('  ⚠ D1 创建/查找失败，埋点暂不落库（页面仍正常）'); process.exit(0); }

  // 应用 schema（远程）
  const schema = join(import.meta.dir, '..', 'templates', 'd1-schema.sql');
  if (existsSync(schema)) {
    const r = wrangler(['d1', 'execute', dbName, '--remote', `--file=${schema}`, '-y'], token);
    console.log(r.code === 0 ? '  ▸ D1 schema 已应用' : '  ⚠ D1 schema 应用可能失败（已存在表则无害）');
  }

  // PATCH Pages 项目：绑 D1 + env vars。Resend 只在配了**真实验证域名**的 from 时才绑
  // —— 否则发不出去（pages.dev / resend.dev 沙盒发不了给真订阅者），那就纯把邮箱捕获到 D1，不发欢迎信。
  const resend = secret('RESEND_API_KEY');
  const realFrom = from && !/resend\.dev/i.test(from) && /@[\w.-]+\.\w+/.test(from);
  const env_vars: Record<string, unknown> = {
    LUMILAB_VENTURE: { value: venture, type: 'plain_text' },
  };
  if (resend && realFrom) {
    env_vars.RESEND_FROM = { value: from, type: 'plain_text' };
    env_vars.RESEND_API_KEY = { value: resend, type: 'secret_text' };
    console.log(`  ▸ Resend 发信已配（from=${from}）`);
  } else {
    console.log('  ▸ 未配 Resend 验证域名 → 邮箱只入库 D1、不发欢迎信（验证主流程不受影响；要发信先在 Resend 验证一个自有域名再设 deploy.resend_from）');
  }
  const patch = await cfApi(`/accounts/${account}/pages/projects/${projectName}`, token, 'PATCH', {
    deployment_configs: { production: { d1_databases: { DB: { id: dbId } }, env_vars } },
  });
  if (patch?.success) console.log(`  ✓ 已绑定 D1(DB) + Resend 到 Pages 项目 ${projectName}`);
  else console.error(`  ⚠ 绑定 PATCH 未成功：${JSON.stringify(patch?.errors ?? patch).slice(0, 200)}`);

  console.log(`DB_NAME=${dbName}`); // 供 deploy.ts / 漏斗查询用
}

main().catch((e) => { console.error('  ⚠ setup-cf-backend:', (e as Error).message); process.exit(0); });
