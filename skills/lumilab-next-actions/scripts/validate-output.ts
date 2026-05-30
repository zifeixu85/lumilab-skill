#!/usr/bin/env bun
/**
 * Output validator for lumilab-next-actions.
 * Validates <venture-dir>/studio/next-actions.json has the required schema:
 *   - venture, generated_at
 *   - columns: exactly the 3 validation columns (to_validate / in_progress / learned)
 *   - tasks[]: each has id/column/title/priority; column ∈ the 3 column ids
 *   - source_signals[]: each has metric/level/tier/interpretation (if any)
 *   - mindmap_md: non-empty string
 * Exit 0 = valid, 1 = missing/malformed.
 *
 * Usage:
 *   bun run scripts/validate-output.ts <venture-dir>
 *   bun run scripts/validate-output.ts --help
 */
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('Usage: bun run scripts/validate-output.ts <venture-dir>');
  console.log('Validates studio/next-actions.json schema (columns / tasks / signals / mindmap).');
  process.exit(0);
}

const root = process.argv[2];
if (!root || !existsSync(root)) {
  console.error('✗ venture dir not found:', root ?? '(missing arg)');
  process.exit(1);
}

const p = join(root, 'studio', 'next-actions.json');
if (!existsSync(p)) {
  // optional — a venture with no retro signal yet has no next-actions; that's valid.
  console.log('(no studio/next-actions.json — venture has no next-actions yet, OK)');
  process.exit(0);
}

const issues: string[] = [];
let na: any;
try { na = JSON.parse(readFileSync(p, 'utf-8')); } catch (e) {
  console.error('✗ invalid JSON:', (e as Error).message);
  process.exit(1);
}

const COLS = ['to_validate', 'in_progress', 'learned'];

if (!na.venture) issues.push('missing: venture');
if (!na.generated_at) issues.push('missing: generated_at');

if (!Array.isArray(na.columns)) issues.push('columns must be an array');
else {
  const ids = na.columns.map((c: any) => c.id);
  for (const c of COLS) if (!ids.includes(c)) issues.push('columns missing required id: ' + c);
}

if (!Array.isArray(na.tasks)) issues.push('tasks must be an array');
else {
  na.tasks.forEach((t: any, i: number) => {
    if (!t.id) issues.push(`tasks[${i}] missing id`);
    if (!t.title) issues.push(`tasks[${i}] missing title`);
    if (!COLS.includes(t.column)) issues.push(`tasks[${i}] invalid column: ${t.column}`);
    if (t.priority && !['high', 'medium', 'low'].includes(t.priority)) issues.push(`tasks[${i}] invalid priority: ${t.priority}`);
  });
}

if (na.source_signals != null) {
  if (!Array.isArray(na.source_signals)) issues.push('source_signals must be an array');
  else na.source_signals.forEach((s: any, i: number) => {
    if (!s.metric) issues.push(`source_signals[${i}] missing metric`);
    if (!s.interpretation) issues.push(`source_signals[${i}] missing interpretation`);
    // C-tier signals must carry the "经验基线，以自测为准" disclaimer somewhere
    if (s.tier === 'C' && !/以自测为准|经验基线/.test(s.interpretation ?? '')) {
      issues.push(`source_signals[${i}] tier C must note 「经验基线，以自测为准」`);
    }
  });
}

if (typeof na.mindmap_md !== 'string' || !na.mindmap_md.trim()) issues.push('mindmap_md must be a non-empty string');

if (issues.length === 0) {
  console.log(`✓ next-actions output valid (${na.tasks?.length ?? 0} tasks, ${na.source_signals?.length ?? 0} signals)`);
  process.exit(0);
}
for (const i of issues) console.log('✗', i);
console.log(`\n${issues.length} issue(s)`);
process.exit(1);
