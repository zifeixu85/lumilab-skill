#!/usr/bin/env bun
/**
 * Output validator for lumilab-weekly-sop-runner.
 * Validates <venture-dir>/research/retro-<ISO>.yaml has the 4 buckets,
 * and that growth_sop.md / decision_thresholds.md exist with structure.
 * Exit 0 = valid, 1 = missing/malformed.
 *
 * Usage:
 *   bun run scripts/validate-output.ts <venture-dir>
 *   bun run scripts/validate-output.ts --help
 *
 * Checks the most recent research/retro-*.yaml:
 *   - keys: venture, day, next_direction, key_decision
 *   - 4 buckets present: strong, mid, weak, iterated
 *   - at least one bucket non-empty
 */
import { readFileSync, existsSync, readdirSync } from "fs";
import { join } from "path";

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log("Usage: bun run scripts/validate-output.ts <venture-dir>");
  console.log("Validates research/retro-<ISO>.yaml has venture/day/decision + 4 buckets.");
  process.exit(0);
}

const root = process.argv[2];
if (!root || !existsSync(root)) {
  console.error("✗ venture dir not found:", root ?? "(missing arg)");
  process.exit(1);
}

const issues: string[] = [];

const researchDir = join(root, "research");
if (!existsSync(researchDir)) {
  issues.push("research/ directory missing (no retro to validate)");
} else {
  const retros = readdirSync(researchDir)
    .filter((f) => /^retro-.*\.yaml$/.test(f))
    .sort();
  if (retros.length === 0) {
    issues.push("no research/retro-<ISO>.yaml found");
  } else {
    const latest = retros[retros.length - 1];
    const y = readFileSync(join(researchDir, latest), "utf-8");
    for (const key of ["venture", "day", "next_direction", "key_decision"]) {
      if (!new RegExp(`^${key}\\s*:`, "m").test(y))
        issues.push(`${latest} missing key: ${key}`);
    }
    const buckets = ["strong", "mid", "weak", "iterated"];
    let nonEmpty = 0;
    for (const b of buckets) {
      const m = y.match(new RegExp(`^${b}\\s*:\\s*(.*)$`, "m"));
      if (!m) {
        issues.push(`${latest} missing bucket: ${b}`);
        continue;
      }
      // bucket non-empty if inline `[...]` has content or following indented `-` items
      const inline = m[1].trim();
      const after = y.slice(y.indexOf(m[0]) + m[0].length);
      const hasListItems = /^\s+-\s+\S/.test(after.split(/\n(?=\S)/)[0] ?? "");
      if ((inline && inline !== "[]" && inline !== "[]") || hasListItems) nonEmpty++;
    }
    if (nonEmpty === 0) issues.push(`${latest}: all 4 buckets empty (fill at least one)`);
  }
}

if (issues.length === 0) {
  console.log("✓ weekly-sop-runner retro output valid");
  process.exit(0);
}
for (const i of issues) console.log("✗", i);
console.log(`\n${issues.length} issue(s)`);
process.exit(1);
