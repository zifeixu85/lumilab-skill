#!/usr/bin/env bun
/**
 * Output validator for lumilab-coach-yc.
 * Validates the artifacts this skill writes:
 *   - yc_brief.md             6-forcing-question brief
 *   - hypotheses.yaml         3-5 initial falsifiable hypotheses
 *   - coach_session_<ts>.md   per-session coaching log
 *
 * Enforces SKILL.md rules (## 输出 schema / ## 反 Slop 自检):
 *   yc_brief.md must have sections answering all 6 forcing questions:
 *     One-liner / Who / Why they want it / How to reach / Money / Why now
 *   - One-liner <= 30 CN chars, no slop words
 *   hypotheses.yaml: each hypothesis has id / statement / falsifier / status
 *     status enum: pending | supported | refuted
 *   coach_session_<ts>.md: non-trivial content
 *
 * Usage:
 *   bun run scripts/validate-output.ts <file|dir> [...]
 *   bun run scripts/validate-output.ts --help
 *
 * Exit 0 = valid, 1 = violations.
 */
import { readFileSync, statSync, readdirSync } from 'fs';
import { join, basename } from 'path';

const HELP = `validate-output.ts — lumilab-coach-yc output validator

Usage:
  bun run scripts/validate-output.ts <file|dir> [...]

Validates yc_brief.md (6 forcing questions), hypotheses.yaml, coach_session_*.md.
Exit 0 = valid, 1 = violations.`;

const BRIEF_SECTIONS = ['One-liner', 'Who', 'Why they want it', 'How to reach', 'Money', 'Why now'];
const STATUS_ENUM = ['pending', 'supported', 'refuted'];
const SLOP = ['赋能', '打造', '一站式', '闭环', '赛道', '心智', '抓手', '颗粒度'];

function validateBrief(text: string): string[] {
  const issues: string[] = [];
  for (const s of BRIEF_SECTIONS) {
    if (!text.includes(s)) issues.push(`缺少章节: ${s}`);
  }
  // One-liner: line after the "## One-liner" header
  const m = text.match(/##\s*One-liner\s*\n+([^\n]+)/);
  if (m) {
    const line = m[1].trim();
    if ([...line].length > 30) issues.push(`One-liner 长度 ${[...line].length} > 30 字: "${line}"`);
    for (const w of SLOP) if (line.includes(w)) issues.push(`One-liner 含禁词 ${w}`);
  }
  return issues;
}

function validateHypotheses(text: string): string[] {
  const issues: string[] = [];
  if (!/^\s*hypotheses\s*:/m.test(text)) issues.push('缺少顶层 hypotheses: 键');
  const ids = text.match(/^\s*-\s*id\s*:/gm) || [];
  if (ids.length < 3) issues.push(`假设数 ${ids.length} < 3（SKILL 要求初始 3-5 条）`);
  if (ids.length > 5) issues.push(`假设数 ${ids.length} > 5（SKILL 要求初始 3-5 条）`);
  // every hypothesis block needs statement + falsifier
  for (const k of ['statement', 'falsifier', 'status']) {
    const count = (text.match(new RegExp(`^\\s*${k}\\s*:`, 'gm')) || []).length;
    if (count < ids.length) issues.push(`有 ${ids.length} 条假设但只有 ${count} 个 ${k}`);
  }
  const statuses = text.match(/status\s*:\s*([a-z]+)/g) || [];
  for (const s of statuses) {
    const v = s.split(':')[1].trim();
    if (!STATUS_ENUM.includes(v)) issues.push(`status "${v}" 不在枚举 ${STATUS_ENUM.join('|')}`);
  }
  return issues;
}

function validateFile(path: string): boolean {
  const name = basename(path);
  let text: string;
  try { text = readFileSync(path, 'utf-8'); } catch (e) {
    console.log(`✗ ${path}\n  无法读取: ${(e as Error).message}`);
    return false;
  }
  let issues: string[];
  if (name === 'yc_brief.md') issues = validateBrief(text);
  else if (name === 'hypotheses.yaml') issues = validateHypotheses(text);
  else if (/^coach_session_.*\.md$/.test(name)) {
    issues = text.trim().length < 50 ? ['coach session 内容过短'] : [];
  } else { console.log(`- ${path} (跳过：非 coach-yc 产物)`); return true; }

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
    .filter(f => f === 'yc_brief.md' || f === 'hypotheses.yaml' || /^coach_session_.*\.md$/.test(f))
    .map(f => join(target, f));
}

function main(): void {
  const argv = process.argv.slice(2);
  if (argv.length === 0 || argv.includes('--help') || argv.includes('-h')) {
    console.log(HELP);
    process.exit(argv.length === 0 ? 1 : 0);
  }
  const files = argv.flatMap(collect);
  if (files.length === 0) { console.log('没有找到 coach-yc 产物文件'); process.exit(1); }
  let ok = true;
  for (const f of files) if (!validateFile(f)) ok = false;
  console.log(ok ? `✓ ${files.length} 个文件全部通过校验` : '✗ 存在违规');
  process.exit(ok ? 0 : 1);
}

main();
