#!/usr/bin/env bun
/**
 * Output validator for lumilab-config.
 * Validates the JSON files this skill writes under ~/.lumilab/:
 *   - config.json    user prefs + default password
 *   - secrets.json   tool tokens + venture passwords (NEVER LLM keys)
 *   - shares.json    deployed venture manifest
 *
 * Enforces SKILL.md hard constraints (## Hard constraints / ## Secrets abstraction):
 *   - secrets.json MUST NOT contain any LLM API key field
 *     (anthropic_api_key / openai_api_key / dashscope_api_key / gemini_api_key ...)
 *   - venture_passwords values are 6-digit numeric strings
 *   - config.json default share password is 6-digit numeric if present
 *   - shares.json is an array/object of deployed venture entries with url
 *
 * Usage:
 *   bun run scripts/validate-output.ts [<~/.lumilab dir or file> ...]   default: ~/.lumilab
 *   bun run scripts/validate-output.ts --help
 *
 * Exit 0 = valid, 1 = violations (LLM-key leak = always a violation).
 */
import { readFileSync, existsSync, statSync, readdirSync } from 'fs';
import { join, basename } from 'path';
import { homedir } from 'os';

const HELP = `validate-output.ts — lumilab-config output validator

Usage:
  bun run scripts/validate-output.ts [<dir|file> ...]   default: ~/.lumilab

Validates config.json / secrets.json / shares.json.
HARD: secrets.json must contain NO LLM API key.
Exit 0 = valid, 1 = violations.`;

const LLM_KEY_PATTERNS = [
  /anthropic[_-]?api[_-]?key/i,
  /openai[_-]?api[_-]?key/i,
  /dashscope[_-]?api[_-]?key/i,
  /gemini[_-]?api[_-]?key/i,
  /\bllm[_-]?key/i,
  /claude[_-]?api[_-]?key/i,
];

function deepKeys(obj: unknown, acc: string[] = []): string[] {
  if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      acc.push(k);
      deepKeys(v, acc);
    }
  }
  return acc;
}

function validateSecrets(o: Record<string, unknown>): string[] {
  const issues: string[] = [];
  const keys = deepKeys(o);
  for (const k of keys) {
    for (const pat of LLM_KEY_PATTERNS) {
      if (pat.test(k)) issues.push(`secrets.json 含 LLM key 字段 "${k}" — 违反核心约束（host 才管 LLM key）`);
    }
  }
  const vp = o.venture_passwords;
  if (vp && typeof vp === 'object') {
    for (const [slug, pw] of Object.entries(vp as Record<string, unknown>)) {
      if (typeof pw !== 'string' || !/^\d{6}$/.test(pw)) {
        issues.push(`venture_passwords["${slug}"] 不是 6 位数字`);
      }
    }
  }
  return issues;
}

function validateConfig(o: Record<string, unknown>): string[] {
  const issues: string[] = [];
  const pw = o.default_share_password ?? o.default_password
    ?? (o.deploy as Record<string, unknown> | undefined)?.default_password;
  if (pw !== undefined && (typeof pw !== 'string' || !/^\d{6}$/.test(pw as string))) {
    issues.push('config.json 默认分享密码不是 6 位数字');
  }
  return issues;
}

function validateShares(parsed: unknown): string[] {
  const issues: string[] = [];
  const entries: unknown[] = Array.isArray(parsed)
    ? parsed
    : typeof parsed === 'object' && parsed !== null
      ? Object.values(parsed as Record<string, unknown>)
      : [];
  if (entries.length === 0 && !Array.isArray(parsed) && typeof parsed !== 'object') {
    issues.push('shares.json 顶层既不是 array 也不是 object');
  }
  entries.forEach((e, i) => {
    if (e && typeof e === 'object' && !('url' in (e as object))) {
      issues.push(`shares 第 ${i + 1} 条缺少 url 字段`);
    }
  });
  return issues;
}

function validateFile(path: string): boolean {
  const name = basename(path);
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(path, 'utf-8'));
  } catch (e) {
    console.log(`✗ ${path}\n  无法解析 JSON: ${(e as Error).message}`);
    return false;
  }
  let issues: string[] = [];
  if (name === 'secrets.json') issues = validateSecrets(parsed as Record<string, unknown>);
  else if (name === 'config.json') issues = validateConfig(parsed as Record<string, unknown>);
  else if (name === 'shares.json') issues = validateShares(parsed);
  else { console.log(`- ${path} (跳过：非 config skill 产物)`); return true; }

  if (issues.length) {
    console.log(`✗ ${path}`);
    for (const it of issues) console.log(`  - ${it}`);
    return false;
  }
  console.log(`✓ ${path}`);
  return true;
}

function collect(target: string): string[] {
  if (!existsSync(target)) return [];
  const st = statSync(target);
  if (st.isFile()) return [target];
  const want = new Set(['config.json', 'secrets.json', 'shares.json']);
  return readdirSync(target).filter(f => want.has(f)).map(f => join(target, f));
}

function main(): void {
  const argv = process.argv.slice(2);
  if (argv.includes('--help') || argv.includes('-h')) {
    console.log(HELP);
    process.exit(0);
  }
  const targets = argv.length ? argv : [join(homedir(), '.lumilab')];
  const files = targets.flatMap(collect);
  if (files.length === 0) {
    console.log('没有找到 config.json / secrets.json / shares.json（首次运行前为空属正常）');
    process.exit(0);
  }
  let ok = true;
  for (const f of files) if (!validateFile(f)) ok = false;
  console.log(ok ? `✓ ${files.length} 个文件全部通过校验` : '✗ 存在违规');
  process.exit(ok ? 0 : 1);
}

main();
