#!/usr/bin/env bun
/**
 * Output validator for lumilab-launch-strategy.
 * Validates <venture-dir>/launch_calendar.yaml + launch_plan.md structure.
 * Exit 0 = valid, 1 = missing/malformed.
 *
 * Usage:
 *   bun run scripts/validate-output.ts <venture-dir>
 *   bun run scripts/validate-output.ts --help
 *
 * Checks launch_calendar.yaml:
 *   - keys: launch_window, type
 *   - `weeks:` list with at least 4 entries
 *   - every week entry has channel + target
 * Checks launch_plan.md:
 *   - exists and has a Readiness gate section
 */
import { readFileSync, existsSync } from "fs";
import { join } from "path";

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log("Usage: bun run scripts/validate-output.ts <venture-dir>");
  console.log("Validates launch_calendar.yaml weeks[] + launch_plan.md structure.");
  process.exit(0);
}

const root = process.argv[2];
if (!root || !existsSync(root)) {
  console.error("✗ venture dir not found:", root ?? "(missing arg)");
  process.exit(1);
}

const issues: string[] = [];

const calPath = join(root, "launch_calendar.yaml");
if (!existsSync(calPath)) {
  issues.push("launch_calendar.yaml missing");
} else {
  const y = readFileSync(calPath, "utf-8");
  if (!/^launch_window\s*:/m.test(y)) issues.push("launch_calendar.yaml missing `launch_window:`");
  if (!/^type\s*:/m.test(y)) issues.push("launch_calendar.yaml missing `type:`");
  if (!/^weeks\s*:/m.test(y)) {
    issues.push("launch_calendar.yaml missing `weeks:`");
  } else {
    const weekBlocks = y.split(/^\s*-\s*week\s*:/m).slice(1);
    if (weekBlocks.length < 4)
      issues.push(`launch_calendar.yaml has ${weekBlocks.length} week entries; expected >= 4`);
    weekBlocks.forEach((b, i) => {
      if (!/channel\s*:/.test(b)) issues.push(`launch_calendar.yaml week[${i}] missing channel`);
      if (!/target\s*:/.test(b)) issues.push(`launch_calendar.yaml week[${i}] missing target`);
    });
  }
}

const planPath = join(root, "launch_plan.md");
if (!existsSync(planPath)) {
  issues.push("launch_plan.md missing");
} else {
  const md = readFileSync(planPath, "utf-8");
  if (!/readiness gate/i.test(md))
    issues.push("launch_plan.md missing a Readiness gate section");
}

if (issues.length === 0) {
  console.log("✓ launch-strategy output valid");
  process.exit(0);
}
for (const i of issues) console.log("✗", i);
console.log(`\n${issues.length} issue(s)`);
process.exit(1);
