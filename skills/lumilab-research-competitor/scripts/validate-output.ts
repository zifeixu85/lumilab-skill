#!/usr/bin/env bun
/**
 * Output validator for lumilab-research-competitor.
 * Validates <venture-dir>/positioning.yaml + competitor_landscape.md structure.
 * Exit 0 = valid, 1 = missing/malformed.
 *
 * Usage:
 *   bun run scripts/validate-output.ts <venture-dir>
 *   bun run scripts/validate-output.ts --help
 *
 * Checks positioning.yaml:
 *   - `positioning:` block with for_who, not_for_who, market_frame
 *   - `alternatives:` with direct/indirect/forced_choice/status_quo
 *   - `primary_enemy:` declared (April Dunford rule — usually status_quo)
 *   - disruption_path in {low-end, new-market, sustaining}
 * Checks competitor_landscape.md:
 *   - exists and contains the 8-dim columns native_pain + anti_positioning
 *   - is NOT a feature matrix (Dunford-banned): reject if it has a wide
 *     "功能/feature" comparison table header
 */
import { readFileSync, existsSync } from "fs";
import { join } from "path";

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log("Usage: bun run scripts/validate-output.ts <venture-dir>");
  console.log("Validates positioning.yaml + competitor_landscape.md (no feature matrix).");
  process.exit(0);
}

const root = process.argv[2];
if (!root || !existsSync(root)) {
  console.error("✗ venture dir not found:", root ?? "(missing arg)");
  process.exit(1);
}

const issues: string[] = [];

const posPath = join(root, "positioning.yaml");
if (!existsSync(posPath)) {
  issues.push("positioning.yaml missing");
} else {
  const y = readFileSync(posPath, "utf-8");
  if (!/^positioning\s*:/m.test(y)) issues.push("positioning.yaml missing top-level `positioning:`");
  for (const key of ["for_who", "not_for_who", "market_frame"]) {
    if (!new RegExp(`^\\s+${key}\\s*:`, "m").test(y))
      issues.push(`positioning.yaml missing key: ${key}`);
  }
  if (!/^\s+alternatives\s*:/m.test(y)) {
    issues.push("positioning.yaml missing `alternatives:` block");
  } else {
    for (const k of ["direct", "indirect", "forced_choice", "status_quo"]) {
      if (!new RegExp(`^\\s+${k}\\s*:`, "m").test(y))
        issues.push(`positioning.yaml alternatives missing: ${k}`);
    }
  }
  if (!/primary_enemy\s*:/m.test(y))
    issues.push("positioning.yaml missing `primary_enemy:` (Dunford: must be named)");
  const dp = y.match(/disruption_path\s*:\s*["']?([a-z-]+)/);
  if (!dp || !["low-end", "new-market", "sustaining"].includes(dp[1]))
    issues.push("positioning.yaml disruption_path must be low-end|new-market|sustaining");
}

const landPath = join(root, "competitor_landscape.md");
if (!existsSync(landPath)) {
  issues.push("competitor_landscape.md missing");
} else {
  const md = readFileSync(landPath, "utf-8");
  if (!/native[_\s]pain/i.test(md))
    issues.push("competitor_landscape.md missing native_pain dimension");
  if (!/anti[_\s-]?positioning/i.test(md))
    issues.push("competitor_landscape.md missing anti_positioning dimension");
  // Dunford-banned feature matrix: a table whose header row lists "功能" / "feature"
  // across many columns. Heuristic: a markdown table header containing 功能/feature
  // with >= 5 pipe-separated cells.
  for (const line of md.split(/\r?\n/)) {
    if (/\|/.test(line) && /(功能|feature)/i.test(line)) {
      const cells = line.split("|").filter((c) => c.trim()).length;
      if (cells >= 5) {
        issues.push("competitor_landscape.md looks like a feature matrix (Dunford-banned)");
        break;
      }
    }
  }
}

if (issues.length === 0) {
  console.log("✓ research-competitor output valid");
  process.exit(0);
}
for (const i of issues) console.log("✗", i);
console.log(`\n${issues.length} issue(s)`);
process.exit(1);
