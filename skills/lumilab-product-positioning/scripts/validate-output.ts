#!/usr/bin/env bun
/**
 * Output validator for lumilab-product-positioning.
 * Checks positioning.md (April Dunford 5-step) and positioning_statement.md.
 * Exit 0 = valid, 1 = missing/malformed.
 *
 * Usage:
 *   bun run scripts/validate-output.ts <venture-dir>
 *   bun run scripts/validate-output.ts --help
 *
 * Expects in <venture-dir>:
 *   positioning.md           — Steps 1-6 sections + Validation + Linked hypotheses
 *   positioning_statement.md — non-empty statement, no "better X" anti-pattern
 *   competitive_alternatives.md — >= 3 listed alternatives
 */
import { readFileSync, existsSync } from "fs";
import { join } from "path";

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log("Usage: bun run scripts/validate-output.ts <venture-dir>");
  console.log("Validates positioning.md + positioning_statement.md structure.");
  process.exit(0);
}

const root = process.argv[2];
if (!root || !existsSync(root)) {
  console.error("✗ venture dir not found:", root ?? "(missing arg)");
  process.exit(1);
}

const issues: string[] = [];

const posPath = join(root, "positioning.md");
if (!existsSync(posPath)) {
  issues.push("positioning.md missing");
} else {
  const md = readFileSync(posPath, "utf-8");
  for (let step = 1; step <= 6; step++) {
    if (!new RegExp(`Step\\s*${step}`, "i").test(md))
      issues.push(`positioning.md missing Step ${step}`);
  }
  if (!/Validation/i.test(md)) issues.push("positioning.md missing Validation section");
  if (!/Linked hypotheses/i.test(md))
    issues.push("positioning.md missing Linked hypotheses section");
}

const stmtPath = join(root, "positioning_statement.md");
if (!existsSync(stmtPath)) {
  issues.push("positioning_statement.md missing");
} else {
  const s = readFileSync(stmtPath, "utf-8");
  const body = s.replace(/^#.*$/gm, "").trim();
  if (body.length < 20) issues.push("positioning_statement.md too short / empty");
  if (/(更好的|better than|更强的)\s*\S/i.test(body))
    issues.push("positioning_statement.md uses 'better X' anti-pattern");
}

const altPath = join(root, "competitive_alternatives.md");
if (!existsSync(altPath)) {
  issues.push("competitive_alternatives.md missing");
} else {
  const alts = (readFileSync(altPath, "utf-8").match(/^\s*[-*]\s+\S/gm) ?? []).length;
  if (alts < 3) issues.push(`competitive_alternatives.md needs >= 3 alternatives (found ${alts})`);
}

if (issues.length === 0) {
  console.log("✓ product-positioning output valid");
  process.exit(0);
}
for (const i of issues) console.log("✗", i);
console.log(`\n${issues.length} issue(s)`);
process.exit(1);
