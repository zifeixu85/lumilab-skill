#!/usr/bin/env bun
/**
 * Reference validator for lumilab-playbook-cn.
 * This is a knowledge skill — it writes no venture files; instead it ships
 * references/platform-rules/*.md that other skills read. This validator checks
 * those reference files stay structurally consistent so downstream Content
 * Agents can parse them reliably.
 *
 * Enforces SKILL.md rules (## 国内平台 know-how 索引 / ## 必做约束):
 *   each platform-rules/*.md must have:
 *     - 「## 必做约束」section
 *     - 「## 2025–2026 规则更新」section
 *   each update entry (### 更新 N) must carry all 4 fields:
 *     发布时间 / 来源 / 影响 / 应对建议
 *   xiaohongshu.md hard rules must still say 标题 ≤ 38 字 and 标签 3-10
 *
 * Usage:
 *   bun run scripts/validate-output.ts [<references-dir>]   default: ./references
 *   bun run scripts/validate-output.ts --help
 *
 * Exit 0 = valid, 1 = violations.
 */
import { readFileSync, statSync, readdirSync, existsSync } from 'fs';
import { join, basename, dirname } from 'path';

const HELP = `validate-output.ts — lumilab-playbook-cn reference validator

Usage:
  bun run scripts/validate-output.ts [<references-dir>]

Validates references/platform-rules/*.md structural consistency:
required sections + 4-field update entries + xhs hard-rule invariants.
Exit 0 = valid, 1 = violations.`;

const REQUIRED_SECTIONS = ['必做约束', '2025–2026 规则更新'];
const UPDATE_FIELDS = ['发布时间', '来源', '影响', '应对建议'];

function validatePlatformFile(path: string): string[] {
  const issues: string[] = [];
  const text = readFileSync(path, 'utf-8');
  const name = basename(path);

  for (const sec of REQUIRED_SECTIONS) {
    if (!text.includes(sec)) issues.push(`缺少章节: ${sec}`);
  }

  // each "### 更新 N" block must contain all 4 fields
  const blocks = text.split(/^###\s+更新/m).slice(1);
  blocks.forEach((b, i) => {
    for (const f of UPDATE_FIELDS) {
      if (!b.includes(f)) issues.push(`更新条目 #${i + 1} 缺少字段: ${f}`);
    }
  });
  if (text.includes('规则更新') && blocks.length === 0) {
    issues.push('有「规则更新」章节但无 ### 更新 N 条目');
  }

  if (name === 'xiaohongshu.md') {
    if (!/标题\s*≤\s*38/.test(text)) issues.push('xhs 硬规则缺失：标题 ≤ 38 字');
    if (!/标签\s*3-10/.test(text)) issues.push('xhs 硬规则缺失：标签 3-10 个');
  }
  return issues;
}

function main(): void {
  const argv = process.argv.slice(2);
  if (argv.includes('--help') || argv.includes('-h')) {
    console.log(HELP);
    process.exit(0);
  }
  let refDir = argv[0];
  if (!refDir) {
    // default: resolve references/ relative to this script's skill dir
    const here = dirname(new URL(import.meta.url).pathname);
    refDir = join(here, '..', 'references');
  }
  const platformDir = join(refDir, 'platform-rules');
  if (!existsSync(platformDir)) {
    console.log(`✗ 找不到 ${platformDir}`);
    process.exit(1);
  }
  const files = readdirSync(platformDir)
    .filter(f => f.endsWith('.md'))
    .map(f => join(platformDir, f));
  if (files.length === 0) { console.log('✗ platform-rules/ 下没有 .md 文件'); process.exit(1); }

  let ok = true;
  for (const f of files) {
    const issues = validatePlatformFile(f);
    if (issues.length) {
      ok = false;
      console.log(`✗ ${f}`);
      for (const it of issues) console.log(`  - ${it}`);
    } else {
      console.log(`✓ ${f}`);
    }
  }
  console.log(ok ? `✓ ${files.length} 个平台规则文件结构一致` : '✗ 存在结构违规');
  process.exit(ok ? 0 : 1);
}

main();
