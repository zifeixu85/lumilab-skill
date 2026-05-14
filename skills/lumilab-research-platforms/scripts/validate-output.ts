#!/usr/bin/env bun
/**
 * Output validator for lumilab-research-platforms.
 * Validates the JSON research artifacts this skill writes:
 *   - research/xhs_raw.json   (XHS adapter output)
 *   - research/web_exa.json   (Web Exa adapter output)
 *
 * Checks schema shape, required keys, types, and enum values so downstream
 * skills (hypothesis-ledger, studio) can consume with 0 changes.
 *
 * Usage:
 *   bun run scripts/validate-output.ts <file.json> [<file2.json> ...]
 *   bun run scripts/validate-output.ts data/ventures/<name>/research/
 *   bun run scripts/validate-output.ts --help
 *
 * Exit 0 = all valid, 1 = at least one schema violation.
 */
import { readFileSync, statSync, readdirSync } from 'fs';
import { join, basename } from 'path';

const HELP = `validate-output.ts — research-platforms JSON schema validator

Usage:
  bun run scripts/validate-output.ts <file.json|dir> [...]

Validates xhs_raw.json / web_exa.json against the documented schema.
Exit 0 = valid, 1 = violations found.`;

const SOURCE_ENUM = ['tikhub', 'exa', 'mock'];

type Issue = string;

function isStr(v: unknown): boolean { return typeof v === 'string'; }
function isNum(v: unknown): boolean { return typeof v === 'number'; }
function isArr(v: unknown): boolean { return Array.isArray(v); }

function validateCommon(o: Record<string, unknown>, issues: Issue[]): void {
  if (!isStr(o.fetched_at)) issues.push('fetched_at: 缺失或非 string');
  if (!isStr(o.source)) issues.push('source: 缺失或非 string');
  else if (!SOURCE_ENUM.includes(o.source as string)) {
    issues.push(`source: "${o.source}" 不在枚举 ${SOURCE_ENUM.join('|')}`);
  }
  if (o.notice !== undefined && !isStr(o.notice)) issues.push('notice: 存在但非 string');
}

function validateXhs(o: Record<string, unknown>, issues: Issue[]): void {
  if (!isStr(o.keyword)) issues.push('keyword: 缺失或非 string');
  if (!isArr(o.notes)) { issues.push('notes: 缺失或非 array'); return; }
  (o.notes as unknown[]).forEach((n, i) => {
    if (typeof n !== 'object' || n === null) { issues.push(`notes[${i}]: 非 object`); return; }
    const note = n as Record<string, unknown>;
    if (!isStr(note.id)) issues.push(`notes[${i}].id: 缺失或非 string`);
    if (!isStr(note.title)) issues.push(`notes[${i}].title: 缺失或非 string`);
    if (!isStr(note.url)) issues.push(`notes[${i}].url: 缺失或非 string`);
    for (const m of ['likes', 'comments'] as const) {
      if (note[m] !== undefined && !isNum(note[m])) issues.push(`notes[${i}].${m}: 存在但非 number`);
    }
  });
}

function validateWeb(o: Record<string, unknown>, issues: Issue[]): void {
  if (!isStr(o.query)) issues.push('query: 缺失或非 string');
  if (!isArr(o.results)) { issues.push('results: 缺失或非 array'); return; }
  (o.results as unknown[]).forEach((r, i) => {
    if (typeof r !== 'object' || r === null) { issues.push(`results[${i}]: 非 object`); return; }
    const res = r as Record<string, unknown>;
    if (!isStr(res.url)) issues.push(`results[${i}].url: 缺失或非 string`);
    if (!isStr(res.title)) issues.push(`results[${i}].title: 缺失或非 string`);
    if (res.score !== undefined && !isNum(res.score)) issues.push(`results[${i}].score: 存在但非 number`);
  });
}

function validateFile(path: string): boolean {
  const issues: Issue[] = [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(path, 'utf-8'));
  } catch (e) {
    console.log(`✗ ${path}\n  无法解析 JSON: ${(e as Error).message}`);
    return false;
  }
  if (typeof parsed !== 'object' || parsed === null) {
    console.log(`✗ ${path}\n  顶层不是 object`);
    return false;
  }
  const o = parsed as Record<string, unknown>;
  validateCommon(o, issues);
  const name = basename(path);
  if (name.includes('xhs') || 'notes' in o) validateXhs(o, issues);
  else if (name.includes('web') || 'results' in o) validateWeb(o, issues);
  else issues.push('无法判定文件类型（既无 notes 也无 results 字段）');

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
    .filter(f => f.endsWith('.json'))
    .map(f => join(target, f));
}

function main(): void {
  const argv = process.argv.slice(2);
  if (argv.length === 0 || argv.includes('--help') || argv.includes('-h')) {
    console.log(HELP);
    process.exit(argv.length === 0 ? 1 : 0);
  }
  const files = argv.flatMap(collect);
  if (files.length === 0) {
    console.log('没有找到 .json 文件');
    process.exit(1);
  }
  let ok = true;
  for (const f of files) if (!validateFile(f)) ok = false;
  console.log(ok ? `✓ ${files.length} 个文件全部通过 schema 校验` : '✗ 存在 schema 违规');
  process.exit(ok ? 0 : 1);
}

main();
