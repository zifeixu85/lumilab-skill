#!/usr/bin/env bun
/**
 * Anti-slop linter for lumilab-weekly-sop-runner.
 * Scans GENERATED OUTPUT for banned words / visual patterns.
 * Idempotent. Exit 0 = clean, 1 = issues found.
 *
 * Usage:
 *   bun run scripts/anti-slop-lint.ts <file-or-dir>
 *
 * Scope: this linter targets generated venture artifacts (landing HTML/CSS,
 * content .md, studio HTML). It SKIPS skill documentation by design:
 *   - SKILL.md (legitimately discusses banned words as rules)
 *   - references/ and tests/ dirs
 *   - itself (anti-slop-lint.ts)
 * Point it at a venture dir to scan everything that matters.
 * Negation-aware lines (不用 / 禁 / 避免 / ❌ / no / avoid) are skipped as rule-text.
 */
import { readFileSync, statSync, readdirSync } from 'fs';
import { join, extname, basename } from 'path';

const BANNED_CN = ['赋能', '打造', '闭环', '赛道', '矩阵', '抓手', '心智', '颗粒度', '数智', '链路', '用户画像'];
const BANNED_EN = [/\bdelve\b/i, /\brobust\b/i, /\bcrucial\b/i, /\bcomprehensive\b/i, /\bnuanced\b/i, /\bleverage\b/i];
const BANNED_VIS = [/\bInter\b/, /\bRoboto\b/, /\bArial\b/, /#000\b/, /#fff\b/, /linear-gradient[^;]*purple/i];
const NEGATION = /(不用|禁用|禁止|禁|避免|不要|不能|別用|别用|替换|→|❌|no |avoid|never|don't|forbidden)/i;
const SKIP_FILES = new Set(['anti-slop-lint.ts', 'validate-output.ts', 'SKILL.md']);
const SKIP_DIRS = new Set(['node_modules', 'tests', 'references']);

let issues = 0;
function lintFile(p: string) {
  if (SKIP_FILES.has(basename(p))) return;
  if (!['.md', '.ts', '.tsx', '.html', '.css', '.js'].includes(extname(p))) return;
  let text: string;
  try { text = readFileSync(p, 'utf-8'); } catch { return; }
  const findings: string[] = [];
  text.split(/\r?\n/).forEach((line, i) => {
    if (NEGATION.test(line)) return;
    for (const w of BANNED_CN) if (line.includes(w)) findings.push(`L${i + 1} CN ${w}`);
    for (const r of BANNED_EN) if (r.test(line)) findings.push(`L${i + 1} EN ${r.source}`);
    for (const r of BANNED_VIS) if (r.test(line)) findings.push(`L${i + 1} VIS ${r.source}`);
  });
  if (findings.length) { console.log(p); for (const f of findings) console.log('  ✗', f); issues++; }
}
function walk(p: string) {
  const st = statSync(p);
  if (st.isFile()) return lintFile(p);
  for (const e of readdirSync(p)) {
    if (e.startsWith('.') || SKIP_DIRS.has(e)) continue;
    walk(join(p, e));
  }
}
const target = process.argv[2] || '.';
walk(target);
if (issues === 0) console.log('✓ anti-slop clean');
process.exit(issues > 0 ? 1 : 0);
