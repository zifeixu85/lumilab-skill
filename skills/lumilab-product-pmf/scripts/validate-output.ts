#!/usr/bin/env bun
/**
 * Output validator for lumilab-product-pmf.
 * Checks pmf_score.md required sections and pmf_survey_<date>.csv shape.
 * Exit 0 = valid, 1 = missing/malformed.
 *
 * Usage:
 *   bun run scripts/validate-output.ts <venture-dir>
 *   bun run scripts/validate-output.ts --help
 *
 * Expects in <venture-dir>:
 *   pmf_score.md            — sections: Sean Ellis Score, HXC Archetype,
 *                             Bridge analysis, Recommended roadmap,
 *                             Leading indicators
 *                           — sample size >= 40 stated
 *   pmf_survey_<date>.csv    — header row + >= 1 response row
 */
import { readFileSync, existsSync, readdirSync } from "fs";
import { join } from "path";

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log("Usage: bun run scripts/validate-output.ts <venture-dir>");
  console.log("Validates pmf_score.md + pmf_survey_<date>.csv structure.");
  process.exit(0);
}

const root = process.argv[2];
if (!root || !existsSync(root)) {
  console.error("✗ venture dir not found:", root ?? "(missing arg)");
  process.exit(1);
}

const issues: string[] = [];

const scorePath = join(root, "pmf_score.md");
if (!existsSync(scorePath)) {
  issues.push("pmf_score.md missing");
} else {
  const md = readFileSync(scorePath, "utf-8");
  const sections = [
    [/Sean Ellis Score/i, "Sean Ellis Score"],
    [/HXC Archetype/i, "HXC Archetype"],
    [/Bridge analysis/i, "Bridge analysis"],
    [/Recommended roadmap/i, "Recommended roadmap"],
    [/Leading indicators/i, "Leading indicators"],
  ] as const;
  for (const [re, label] of sections) {
    if (!re.test(md)) issues.push(`pmf_score.md missing section: ${label}`);
  }
  // sample size must be stated and >= 40
  const sample = md.match(/(?:sample|样本|\/)\s*=?\s*(\d{1,4})/i);
  const sizes = [...md.matchAll(/\/\s*(\d{2,4})\s*=/g)].map((m) => Number(m[1]));
  const maxSize = sizes.length ? Math.max(...sizes) : sample ? Number(sample[1]) : 0;
  if (maxSize < 40) issues.push(`pmf_score.md sample size < 40 or not stated (got ${maxSize})`);
  // very disappointed percentage must appear
  if (!/very disappointed|非常失望/i.test(md))
    issues.push("pmf_score.md missing 'very disappointed' breakdown");
}

const csvs = existsSync(root)
  ? readdirSync(root).filter((f) => /^pmf_survey_.*\.csv$/.test(f))
  : [];
if (csvs.length === 0) {
  issues.push("no pmf_survey_<date>.csv found");
} else {
  const csv = readFileSync(join(root, csvs[0]), "utf-8");
  const rows = csv.split(/\r?\n/).filter((l) => l.trim());
  if (rows.length < 2) issues.push(`${csvs[0]} needs header + >= 1 response row`);
  if (rows[0] && rows[0].split(",").length < 2)
    issues.push(`${csvs[0]} header must have >= 2 columns`);
}

if (issues.length === 0) {
  console.log("✓ product-pmf output valid");
  process.exit(0);
}
for (const i of issues) console.log("✗", i);
console.log(`\n${issues.length} issue(s)`);
process.exit(1);
