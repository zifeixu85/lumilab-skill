#!/usr/bin/env bun
/**
 * Output validator for lumilab-research-icp.
 * Validates icp.yaml against the documented five-dimension ICP schema.
 *
 * Enforces SKILL.md rules (## 输出 schema / ## 反 Slop 自检 / ## Edge cases):
 *   - required top-level keys under `icp:`
 *   - five dimensions present: demographic / firmographic / psychographic /
 *     behavioral / jtbd
 *   - segment_of_one_test enum: pass | fail
 *   - jtbd has trigger / fired_solution / anxiety / progress_wanted
 *   - jtbd.forces has push/pull/anxiety/habit as numbers 1-10
 *   - no slop tokens in the file (用户画像 / 颗粒度 / 心智 / 赛道 / 抓手)
 *
 * Usage:
 *   bun run scripts/validate-output.ts <icp.yaml|dir> [...]
 *   bun run scripts/validate-output.ts --help
 *
 * Exit 0 = valid, 1 = violations.
 */
import { readFileSync, statSync, readdirSync } from 'fs';
import { join, basename } from 'path';

const HELP = `validate-output.ts — lumilab-research-icp validator

Usage:
  bun run scripts/validate-output.ts <icp.yaml|dir> [...]

Validates icp.yaml five-dimension schema + JTBD forces + anti-slop.
Exit 0 = valid, 1 = violations.`;

const SOO_ENUM = ['pass', 'fail'];
const DIMENSIONS = ['demographic', 'firmographic', 'psychographic', 'behavioral', 'jtbd'];
const JTBD_KEYS = ['trigger', 'fired_solution', 'anxiety', 'progress_wanted'];
const FORCES = ['push', 'pull', 'anxiety', 'habit'];
const SLOP = ['用户画像', '颗粒度', '心智', '赛道', '抓手'];

function hasKey(text: string, key: string): boolean {
  return new RegExp(`(^|\\n)\\s*${key}\\s*:`, 'm').test(text);
}

function validateIcp(text: string): string[] {
  const issues: string[] = [];
  if (!hasKey(text, 'icp')) issues.push('缺少顶层 icp: 键');
  if (!hasKey(text, 'name')) issues.push('缺少 icp.name');
  const sooM = text.match(/segment_of_one_test\s*:\s*([a-z]+)/);
  if (!sooM) issues.push('缺少 segment_of_one_test（SKILL 要求必做）');
  else if (!SOO_ENUM.includes(sooM[1])) issues.push(`segment_of_one_test "${sooM[1]}" 不在枚举 pass|fail`);

  for (const d of DIMENSIONS) {
    if (!hasKey(text, d)) issues.push(`缺少五维之一: ${d}`);
  }
  for (const k of JTBD_KEYS) {
    if (!hasKey(text, k)) issues.push(`jtbd 缺少 ${k}`);
  }
  // forces block: each force should be a 1-10 number
  for (const f of FORCES) {
    const m = text.match(new RegExp(`\\n\\s+${f}\\s*:\\s*(-?\\d+)`));
    if (m) {
      const n = Number(m[1]);
      if (n < 1 || n > 10) issues.push(`jtbd.forces.${f} = ${n} 不在 1-10`);
    }
  }
  // segment size estimate must exist (a concrete number/range)
  if (!hasKey(text, 'segment_size_estimate')) {
    issues.push('缺少 segment_size_estimate（五维交叉后必须估出具体 segment size）');
  }
  for (const w of SLOP) {
    if (text.includes(w)) issues.push(`含禁词 ${w}（ICP 不准用 slop 词）`);
  }
  return issues;
}

function validateFile(path: string): boolean {
  const name = basename(path);
  if (name !== 'icp.yaml' && !/^icp\.v\d+\.yaml$/.test(name)) {
    console.log(`- ${path} (跳过：非 icp.yaml)`);
    return true;
  }
  let text: string;
  try { text = readFileSync(path, 'utf-8'); } catch (e) {
    console.log(`✗ ${path}\n  无法读取: ${(e as Error).message}`);
    return false;
  }
  const issues = validateIcp(text);
  if (issues.length) {
    console.log(`✗ ${path}`);
    for (const it of issues) console.log(`  - ${it}`);
    return false;
  }
  console.log(`✓ ${path}`);
  return true;
}

function collect(target: string): string[] {
  const st = statSync(target);
  if (st.isFile()) return [target];
  return readdirSync(target)
    .filter(f => f === 'icp.yaml' || /^icp\.v\d+\.yaml$/.test(f))
    .map(f => join(target, f));
}

function main(): void {
  const argv = process.argv.slice(2);
  if (argv.length === 0 || argv.includes('--help') || argv.includes('-h')) {
    console.log(HELP);
    process.exit(argv.length === 0 ? 1 : 0);
  }
  const files = argv.flatMap(collect);
  if (files.length === 0) { console.log('没有找到 icp.yaml'); process.exit(1); }
  let ok = true;
  for (const f of files) if (!validateFile(f)) ok = false;
  console.log(ok ? `✓ ${files.length} 个文件全部通过校验` : '✗ 存在违规');
  process.exit(ok ? 0 : 1);
}

main();
