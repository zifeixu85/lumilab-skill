#!/usr/bin/env bun
/**
 * Output validator for lumilab-research-keywords.
 * Validates the research artifacts this skill writes:
 *   - research/keyword_metrics.csv     (full-field per-keyword table)
 *   - research/keyword_landscape.md    (★ 红蓝海地图)
 *
 * Checks file presence, CSV required columns, and that the landscape report
 * contains the 红蓝海 sections so downstream skills (hypothesis-ledger, studio)
 * can consume with 0 changes.
 *
 * 校验字段:
 *   keyword_metrics.csv  — header 必含: keyword, provider, volume, cpc,
 *                          competition, keyword_difficulty, trend_slope,
 *                          serp_strong_count, relation, opportunity_score,
 *                          verdict；至少 1 行数据行
 *   keyword_landscape.md — 必含段落: "## 红蓝海地图"、"### 🔵 蓝海方向"、
 *                          "### 🔴 红海方向"、"### 🟡 差异化机会"、
 *                          "### ⚪ 低需求"、"## 综合判断"
 *
 * Usage:
 *   bun run scripts/validate-output.ts <venture-dir>
 *   bun run scripts/validate-output.ts data/ventures/<name>
 *   bun run scripts/validate-output.ts data/ventures/<name>/research
 *   bun run scripts/validate-output.ts --help
 *
 * Exit 0 = all valid, 1 = at least one violation.
 */
import { readFileSync, existsSync, statSync } from 'fs';
import { join } from 'path';

const HELP = `validate-output.ts — research-keywords output validator

Usage:
  bun run scripts/validate-output.ts <venture-dir | research-dir>

Validates keyword_metrics.csv (required columns) and keyword_landscape.md
(红蓝海 sections). Exit 0 = valid, 1 = violations found.`;

const REQUIRED_COLUMNS = [
  'keyword', 'provider', 'volume', 'cpc', 'competition', 'keyword_difficulty',
  'trend_slope', 'serp_strong_count', 'relation', 'opportunity_score', 'verdict',
];

const REQUIRED_SECTIONS = [
  '## 红蓝海地图',
  '### 🔵 蓝海方向',
  '### 🔴 红海方向',
  '### 🟡 差异化机会',
  '### ⚪ 低需求',
  '## 综合判断',
];

type Issue = string;

/** Resolve the research/ dir whether given a venture dir or the research dir itself. */
function resolveResearchDir(target: string): string {
  if (!existsSync(target)) return target;
  if (!statSync(target).isDirectory()) return target;
  const nested = join(target, 'research');
  if (existsSync(nested) && statSync(nested).isDirectory()) return nested;
  return target;
}

function validateCsv(path: string, issues: Issue[]): void {
  if (!existsSync(path)) {
    issues.push(`keyword_metrics.csv: 文件不存在 (${path})`);
    return;
  }
  const text = readFileSync(path, 'utf-8').trim();
  const lines = text.split(/\r?\n/);
  if (lines.length < 2) {
    issues.push('keyword_metrics.csv: 至少需要 header + 1 行数据');
    return;
  }
  const header = lines[0].split(',').map((c) => c.trim());
  for (const col of REQUIRED_COLUMNS) {
    if (!header.includes(col)) issues.push(`keyword_metrics.csv: 缺少必需列 "${col}"`);
  }
}

function validateLandscape(path: string, issues: Issue[]): void {
  if (!existsSync(path)) {
    issues.push(`keyword_landscape.md: 文件不存在 (${path})`);
    return;
  }
  const text = readFileSync(path, 'utf-8');
  for (const section of REQUIRED_SECTIONS) {
    if (!text.includes(section)) issues.push(`keyword_landscape.md: 缺少段落 "${section}"`);
  }
}

function main(): void {
  const argv = process.argv.slice(2);
  if (argv.length === 0 || argv.includes('--help') || argv.includes('-h')) {
    console.log(HELP);
    process.exit(argv.length === 0 ? 1 : 0);
  }
  let ok = true;
  for (const target of argv) {
    const dir = resolveResearchDir(target);
    const issues: Issue[] = [];
    validateCsv(join(dir, 'keyword_metrics.csv'), issues);
    validateLandscape(join(dir, 'keyword_landscape.md'), issues);
    if (issues.length) {
      console.log(`✗ ${dir}`);
      for (const it of issues) console.log(`  - ${it}`);
      ok = false;
    } else {
      console.log(`✓ ${dir}`);
    }
  }
  console.log(ok ? '✓ 全部通过校验' : '✗ 存在校验违规');
  process.exit(ok ? 0 : 1);
}

main();
