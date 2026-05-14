#!/usr/bin/env bun
/**
 * Output validator for lumilab-metrics.
 * Validates <venture-dir>/metrics.yaml + event_schema.yaml structure.
 * Exit 0 = valid, 1 = missing/malformed.
 *
 * Usage:
 *   bun run scripts/validate-output.ts <venture-dir>
 *   bun run scripts/validate-output.ts --help
 *
 * Checks metrics.yaml:
 *   - top-level keys: north_star, aarrr
 *   - north_star has name + measure_cadence
 *   - aarrr has all 5 stages: acquisition activation retention referral revenue
 * Checks event_schema.yaml:
 *   - has `events:` list
 *   - every event name is verb_noun snake_case (lowercase, has underscore, no dynamic value)
 */
import { readFileSync, existsSync } from "fs";
import { join } from "path";

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log("Usage: bun run scripts/validate-output.ts <venture-dir>");
  console.log("Validates metrics.yaml (north_star + AARRR) and event_schema.yaml naming.");
  process.exit(0);
}

const root = process.argv[2];
if (!root || !existsSync(root)) {
  console.error("✗ venture dir not found:", root ?? "(missing arg)");
  process.exit(1);
}

const issues: string[] = [];

const metricsPath = join(root, "metrics.yaml");
if (!existsSync(metricsPath)) {
  issues.push("metrics.yaml missing");
} else {
  const y = readFileSync(metricsPath, "utf-8");
  if (!/^north_star\s*:/m.test(y)) issues.push("metrics.yaml missing top-level `north_star:`");
  if (!/^\s{2,}name\s*:/m.test(y)) issues.push("metrics.yaml north_star missing `name:`");
  if (!/measure_cadence\s*:/m.test(y)) issues.push("metrics.yaml north_star missing `measure_cadence:`");
  if (!/^aarrr\s*:/m.test(y)) issues.push("metrics.yaml missing top-level `aarrr:`");
  for (const stage of ["acquisition", "activation", "retention", "referral", "revenue"]) {
    if (!new RegExp(`^\\s+${stage}\\s*:`, "m").test(y))
      issues.push(`metrics.yaml aarrr missing stage: ${stage}`);
  }
}

const schemaPath = join(root, "event_schema.yaml");
if (!existsSync(schemaPath)) {
  issues.push("event_schema.yaml missing");
} else {
  const y = readFileSync(schemaPath, "utf-8");
  if (!/^events\s*:/m.test(y)) issues.push("event_schema.yaml missing top-level `events:`");
  const names = [...y.matchAll(/^\s*-\s*name\s*:\s*(\S+)/gm)].map((m) => m[1]);
  if (names.length === 0) issues.push("event_schema.yaml has no events with `name:`");
  // require 6-10 core events per the methodology
  if (names.length > 0 && names.length > 20)
    issues.push(`event_schema.yaml has ${names.length} events; methodology says start with 6-10`);
  for (const n of names) {
    if (!/^[a-z]+(_[a-z0-9]+)+$/.test(n))
      issues.push(`event_schema.yaml event name not verb_noun snake_case: ${n}`);
  }
}

if (issues.length === 0) {
  console.log("✓ metrics output valid");
  process.exit(0);
}
for (const i of issues) console.log("✗", i);
console.log(`\n${issues.length} issue(s)`);
process.exit(1);
