#!/usr/bin/env bun
/**
 * Minimal anti-slop linter for lumilab-deploy.
 * Idempotent. Exits 0 if no issues, 1 if any banned word / pattern found.
 *
 * Usage:
 *   bun run scripts/anti-slop-lint.ts <file-or-dir>
 *
 * Banned: 赋能 / 打造 / 闭环 / 赛道 / 矩阵 / 抓手 / 心智 / 颗粒度 / 数智 / 链路 /
 *         用户画像 / delve / robust / crucial / comprehensive / nuanced / leverage /
 *         purple gradient / Inter / Roboto / Arial / #000 / #fff
 */
import { readFileSync, statSync, readdirSync } from 'fs';
import { join, extname } from 'path';

const BANNED_CN = ['赋能','打造','闭环','赛道','矩阵','抓手','心智','颗粒度','数智','链路','用户画像'];
const BANNED_EN = [/\bdelve\b/i, /\brobust\b/i, /\bcrucial\b/i, /\bcomprehensive\b/i, /\bnuanced\b/i, /\bleverage\b/i];
const BANNED_VIS = [/Inter\b/, /Roboto\b/, /Arial\b/, /#000\b/, /#fff\b/, /linear-gradient.*purple/i];

let issues = 0;
function lintFile(p: string) {
  const ext = extname(p);
  if (!['.md', '.ts', '.tsx', '.html', '.css'].includes(ext)) return;
  let text: string;
  try { text = readFileSync(p, 'utf-8'); } catch { return; }
  const findings: string[] = [];
  for (const w of BANNED_CN) if (text.includes(w)) findings.push('CN ' + w);
  for (const r of BANNED_EN) if (r.test(text)) findings.push('EN ' + r.source);
  for (const r of BANNED_VIS) if (r.test(text)) findings.push('VIS ' + r.source);
  if (findings.length) {
    console.log(p);
    for (const f of findings) console.log('  ✗', f);
    issues++;
  }
}

function walk(p: string) {
  const st = statSync(p);
  if (st.isFile()) return lintFile(p);
  for (const e of readdirSync(p)) {
    if (e.startsWith('.') || e === 'node_modules' || e === 'tests') continue;
    walk(join(p, e));
  }
}

const target = process.argv[2] || '.';
walk(target);
process.exit(issues > 0 ? 1 : 0);
