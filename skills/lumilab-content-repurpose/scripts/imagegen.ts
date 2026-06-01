#!/usr/bin/env bun
/**
 * imagegen.ts — 配图「第二步」：AI 出底图/封面（EvoLink 网关）。
 *
 * 默认 gpt-image-2，可切 doubao-seedream-5.0-lite（中文大字直出更稳）。异步：提交→轮询→下载。
 * 中文大字偏弱的模型（gpt-image-2）建议「AI 出底图 + HTML 叠字」：本脚本只出图，文字仍走第一步 HTML。
 *
 * 用法：
 *   bun run imagegen.ts --venture <slug> --prompt "<英文/中文画面描述>" [--model gpt-image-2|doubao-seedream-5.0-lite]
 *                       [--size 3:4|1:1|...] [--quality low|medium|high] [--out <name>]
 *
 * key EVOLINK_API_KEY 走 config（env→keychain→secrets.json）。缺 key → 提示走纯 HTML 第一步，退出 0 不崩。
 * 产物：content/xhs/<out>.png（默认 <model>-bg）。记一次 usage（EvoLink）。
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const HOME = process.env.LUMILAB_HOME ?? join(homedir(), '.lumilab');
const API = 'https://api.evolink.ai/v1';

function loadKey(): string | undefined {
  for (const n of ['EVOLINK_API_KEY', 'evolink_api_key']) if (process.env[n]) return process.env[n];
  try {
    const kc = require('../../lumilab-config/scripts/keychain.ts');
    const v = kc?.getSecret?.('EVOLINK_API_KEY') || kc?.getSecret?.('evolink_api_key');
    if (v) return v;
  } catch { /* keychain 可选 */ }
  try { const s = JSON.parse(readFileSync(join(HOME, 'secrets.json'), 'utf-8')); return s.EVOLINK_API_KEY || s.evolink_api_key; } catch { return undefined; }
}

function arg(a: string[], n: string, d?: string): string | undefined { const i = a.indexOf(n); return i >= 0 ? a[i + 1] : d; }

async function main(): Promise<void> {
  const a = process.argv.slice(2);
  const venture = arg(a, '--venture');
  const prompt = arg(a, '--prompt');
  const model = arg(a, '--model', 'gpt-image-2')!;
  const size = arg(a, '--size', '3:4')!;
  const quality = arg(a, '--quality', 'medium')!;
  if (!venture || !prompt) { console.error('用法：imagegen.ts --venture <slug> --prompt "<画面描述>" [--model] [--size] [--quality] [--opt-in] [--out]'); process.exit(2); }
  // 这是「可选的 AI 出图第二步」，不是默认路径。小红书配图默认走 render-xhs-card.ts（HTML 渲染，0 崩中文字、免费、可控）。
  if (!a.includes('--opt-in')) {
    process.stderr.write('⚠ imagegen = 可选的 AI 出图第二步，不是默认路径。\n');
    process.stderr.write('  小红书配图默认应走 render-xhs-card.ts（HTML 模板渲染：0 崩中文字、免费、与 landing 视觉一致）。\n');
    process.stderr.write('  只在用户明确要 AI 底图 / 氛围背景时才用本脚本；请确认已先跑 HTML 渲染。加 --opt-in 消除本提示。\n');
  }
  const out = arg(a, '--out', `${model}-bg`)!;

  const key = loadKey();
  const outDir = join(HOME, 'data', 'ventures', venture, 'content', 'xhs');
  mkdirSync(outDir, { recursive: true });
  const pngPath = join(outDir, `${out}.png`);

  if (!key) {
    console.error('⚠️  未配置 EVOLINK_API_KEY —— 跳过 AI 出图。封面用第一步的纯 HTML 渲染即可（0 成本、0 崩字）。');
    console.error('   配置后：lumilab config 或 secrets set EVOLINK_API_KEY <key>。');
    process.exit(0);
  }

  // 1) 提交
  const body: Record<string, unknown> = { model, prompt, size, n: 1 };
  if (model === 'gpt-image-2') body.quality = quality;
  const sub = await fetch(`${API}/images/generations`, {
    method: 'POST', headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' }, body: JSON.stringify(body),
  });
  if (!sub.ok) { console.error(`✗ 提交失败 ${sub.status}：${(await sub.text()).slice(0, 200)}`); process.exit(1); }
  const task = await sub.json() as any;
  const id = task.id;
  if (!id) { console.error('✗ 无 task id'); process.exit(1); }
  console.log(`  ▸ ${model} 出图中（task ${id}）…`);

  // 2) 轮询（最多 ~3 分钟）
  let url = '';
  for (let i = 0; i < 36; i++) {
    await new Promise((r) => setTimeout(r, 5000));
    const r = await fetch(`${API}/tasks/${id}`, { headers: { authorization: `Bearer ${key}` } });
    const j = await r.json().catch(() => ({})) as any;
    const st = j.status;
    if (st === 'completed' || st === 'succeeded' || st === 'success') { url = j.results?.[0] || j.result_data?.[0]?.url || ''; break; }
    if (st === 'failed' || st === 'error') { console.error(`✗ 出图失败：${JSON.stringify(j).slice(0, 200)}`); process.exit(1); }
  }
  if (!url) { console.error('✗ 出图超时'); process.exit(1); }

  // 3) 下载落地（URL 24h 过期，必须存）
  const img = await fetch(url);
  if (!img.ok) { console.error(`✗ 下载失败 ${img.status}`); process.exit(1); }
  writeFileSync(pngPath, Buffer.from(await img.arrayBuffer()));

  // 记 usage（EvoLink 出图）
  try { require('../../lumilab-config/scripts/usage.ts').recordService?.(venture, 'evolink', { costUsd: 0.03 }); } catch { /* usage 可选 */ }

  console.log(`✓ AI 底图 → ${pngPath}（${model}, ${size}）`);
  console.log('  中文大字仍建议留在第一步 HTML 层（叠在此底图上），避免崩字。');
}

main().catch((e) => { console.error('✗', (e as Error).message); process.exit(1); });
