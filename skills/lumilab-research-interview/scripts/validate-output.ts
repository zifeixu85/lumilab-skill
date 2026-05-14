#!/usr/bin/env bun
/**
 * Output validator for lumilab-research-interview.
 * Validates the structured transcript / synthesis docs this skill writes:
 *   - interviews/<id>.md       single interview transcript
 *   - interview_synthesis.md   aggregate (>=5 interviews)
 *
 * Enforces SKILL.md rules (## 输出 schema / ## 反 Slop 自检 / ## Edge cases):
 *   interviews/<id>.md must have sections:
 *     痛点（原话引用）/ 当前方案 / 触发瞬间 / 付费证据 / 反模式扫描 / 推荐链
 *   - interviewer_talk_ratio present and < 0.3
 *   - 痛点 section has >=1 quoted line (逐字原话)
 *   interview_synthesis.md must have 痛点频次 + saturation 信息
 *
 * Usage:
 *   bun run scripts/validate-output.ts <file|dir> [...]
 *   bun run scripts/validate-output.ts --help
 *
 * Exit 0 = valid, 1 = violations.
 */
import { readFileSync, statSync, readdirSync } from 'fs';
import { join, basename } from 'path';

const HELP = `validate-output.ts — lumilab-research-interview validator

Usage:
  bun run scripts/validate-output.ts <file|dir> [...]

Validates interviews/<id>.md required sections + talk ratio + verbatim quotes,
and interview_synthesis.md aggregate structure.
Exit 0 = valid, 1 = violations.`;

const TRANSCRIPT_SECTIONS = ['痛点', '当前方案', '触发瞬间', '付费证据', '反模式扫描', '推荐链'];
const SYNTHESIS_SECTIONS = ['痛点', 'saturation'];

function validateTranscript(text: string): string[] {
  const issues: string[] = [];
  for (const s of TRANSCRIPT_SECTIONS) {
    if (!text.includes(s)) issues.push(`缺少章节/字段: ${s}`);
  }
  const ratioM = text.match(/interviewer_talk_ratio\s*:?\s*([\d.]+)/);
  if (!ratioM) issues.push('缺少 interviewer_talk_ratio');
  else if (Number(ratioM[1]) >= 0.3) {
    issues.push(`interviewer_talk_ratio = ${ratioM[1]} ≥ 0.3（访谈员说太多）`);
  }
  // verbatim quote in 痛点 section
  const painIdx = text.indexOf('痛点');
  if (painIdx >= 0) {
    const slice = text.slice(painIdx, painIdx + 600);
    const quotes = slice.match(/[“"][^“"”\n]{2,}[”"]/g) || [];
    if (quotes.length < 1) issues.push('痛点章节缺少逐字原话引用（至少 1 句）');
  }
  return issues;
}

function validateSynthesis(text: string): string[] {
  const issues: string[] = [];
  for (const s of SYNTHESIS_SECTIONS) {
    if (!new RegExp(s, 'i').test(text)) issues.push(`缺少聚合内容: ${s}`);
  }
  if (!/频次|频率|\d+\s*\/\s*\d+/.test(text)) {
    issues.push('缺少痛点频次表（如 6/6 用户提到 X）');
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
  if (name === 'interview_synthesis.md') issues = validateSynthesis(text);
  else if (name === 'interview_script.md') {
    issues = text.length < 100 ? ['访谈脚本内容过短'] : [];
  } else {
    // treat anything else under interviews/ as a transcript
    issues = validateTranscript(text);
  }
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
  const out: string[] = [];
  for (const e of readdirSync(target)) {
    const p = join(target, e);
    const s = statSync(p);
    if (s.isDirectory() && e === 'interviews') {
      for (const f of readdirSync(p)) if (f.endsWith('.md')) out.push(join(p, f));
    } else if (s.isFile() && (e === 'interview_synthesis.md' || e === 'interview_script.md')) {
      out.push(p);
    }
  }
  return out;
}

function main(): void {
  const argv = process.argv.slice(2);
  if (argv.length === 0 || argv.includes('--help') || argv.includes('-h')) {
    console.log(HELP);
    process.exit(argv.length === 0 ? 1 : 0);
  }
  const files = argv.flatMap(collect);
  if (files.length === 0) { console.log('没有找到 interview skill 产物文件'); process.exit(1); }
  let ok = true;
  for (const f of files) if (!validateFile(f)) ok = false;
  console.log(ok ? `✓ ${files.length} 个文件全部通过校验` : '✗ 存在违规');
  process.exit(ok ? 0 : 1);
}

main();
