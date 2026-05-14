#!/usr/bin/env bun
/**
 * Output validator for lumilab-copy.
 * Validates the artifacts this skill writes:
 *   - copy_brief.yaml      structured copy decision
 *   - copy_candidates.md   >=5 H1/hook candidates
 *   - voc_mining.md        >=10 verbatim VoC quotes
 *
 * Enforces structural rules from SKILL.md (## 反 Slop 自检 / ## 输出 schema):
 *   - copy_brief.yaml: required keys, awareness_stage enum, H1 length <=25 CN chars,
 *     anti_slop_pass true, forbidden_words_found empty
 *   - copy_candidates.md: >=5 candidates
 *   - voc_mining.md: >=10 quoted lines
 *
 * Usage:
 *   bun run scripts/validate-output.ts <file|dir> [...]
 *   bun run scripts/validate-output.ts --help
 *
 * Exit 0 = valid, 1 = violations.
 */
import { readFileSync, statSync, readdirSync } from 'fs';
import { join, basename } from 'path';

const HELP = `validate-output.ts — lumilab-copy output validator

Usage:
  bun run scripts/validate-output.ts <file|dir> [...]

Validates copy_brief.yaml / copy_candidates.md / voc_mining.md.
Exit 0 = valid, 1 = violations.`;

const AWARENESS_ENUM = ['unaware', 'problem_aware', 'solution_aware', 'product_aware', 'most_aware'];
const FORBIDDEN = ['赋能', '打造', '闭环', '赛道', '抓手', '心智', '颗粒度', '矩阵', '助力', '一站式', '无缝', '极致'];

function cnLen(s: string): number {
  // count CJK + others roughly as display width is not needed; SKILL rule is 中文字数
  return [...s].length;
}

function validateBrief(path: string, text: string): string[] {
  const issues: string[] = [];
  const need = ['surface', 'awareness_stage', 'h1', 'cta_primary'];
  for (const k of need) {
    if (!new RegExp(`(^|\\n)\\s*${k}\\s*:`, 'm').test(text)) issues.push(`缺少键 ${k}`);
  }
  const stageM = text.match(/awareness_stage\s*:\s*([a-z_]+)/);
  if (stageM && !AWARENESS_ENUM.includes(stageM[1])) {
    issues.push(`awareness_stage "${stageM[1]}" 不在枚举 ${AWARENESS_ENUM.join('|')}`);
  }
  const h1M = text.match(/h1\s*:\s*["']?([^"'\n]+)["']?/);
  if (h1M) {
    const h1 = h1M[1].trim();
    if (cnLen(h1) > 25) issues.push(`h1 长度 ${cnLen(h1)} > 25 字: "${h1}"`);
  }
  if (/anti_slop_pass\s*:\s*false/.test(text)) issues.push('anti_slop_pass 为 false');
  const fw = text.match(/forbidden_words_found\s*:\s*\[([^\]]*)\]/);
  if (fw && fw[1].trim()) issues.push(`forbidden_words_found 非空: [${fw[1].trim()}]`);
  for (const w of FORBIDDEN) {
    if (h1M && h1M[1].includes(w)) issues.push(`h1 含禁词 ${w}`);
  }
  return issues;
}

function validateCandidates(path: string, text: string): string[] {
  const issues: string[] = [];
  // count candidate blocks: lines starting with a letter+) or 候选
  const blocks = text.match(/^\s*[A-Z]\)/gm) || text.match(/候选\s*\d/g) || [];
  if (blocks.length < 5) issues.push(`候选数 ${blocks.length} < 5（A/B 测试需 ≥5）`);
  return issues;
}

function validateVoc(path: string, text: string): string[] {
  const issues: string[] = [];
  const quotes = text.match(/[“"][^“"”]{2,}[”"]/g) || [];
  if (quotes.length < 10) issues.push(`逐字原话 ${quotes.length} 句 < 10`);
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
  if (name === 'copy_brief.yaml') issues = validateBrief(path, text);
  else if (name === 'copy_candidates.md') issues = validateCandidates(path, text);
  else if (name === 'voc_mining.md') issues = validateVoc(path, text);
  else { console.log(`- ${path} (跳过：非 copy skill 产物)`); return true; }

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
  const want = new Set(['copy_brief.yaml', 'copy_candidates.md', 'voc_mining.md']);
  return readdirSync(target).filter(f => want.has(f)).map(f => join(target, f));
}

function main(): void {
  const argv = process.argv.slice(2);
  if (argv.length === 0 || argv.includes('--help') || argv.includes('-h')) {
    console.log(HELP);
    process.exit(argv.length === 0 ? 1 : 0);
  }
  const files = argv.flatMap(collect);
  if (files.length === 0) { console.log('没有找到 copy skill 产物文件'); process.exit(1); }
  let ok = true;
  for (const f of files) if (!validateFile(f)) ok = false;
  console.log(ok ? `✓ ${files.length} 个文件全部通过校验` : '✗ 存在违规');
  process.exit(ok ? 0 : 1);
}

main();
