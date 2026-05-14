#!/usr/bin/env bun
/**
 * Output validator for lumilab-product-mvp.
 * Checks mvp_plan.md and riskiest_assumptions.yaml have required sections/keys.
 * Exit 0 = valid, 1 = missing/malformed.
 *
 * Usage:
 *   bun run scripts/validate-output.ts <venture-dir>
 *   bun run scripts/validate-output.ts --help
 *
 * Expects in <venture-dir>:
 *   mvp_plan.md             — sections: Riskiest assumption, MVP type,
 *                             Build scope, Success criteria, Decision tree
 *   riskiest_assumptions.yaml — top-level `ranked:` list, each item with
 *                             id / likelihood_wrong / impact_wrong / risk_score
 */
import { readFileSync, existsSync } from "fs";
import { join } from "path";

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log("Usage: bun run scripts/validate-output.ts <venture-dir>");
  console.log("Validates mvp_plan.md + riskiest_assumptions.yaml structure.");
  process.exit(0);
}

const root = process.argv[2];
if (!root || !existsSync(root)) {
  console.error("✗ venture dir not found:", root ?? "(missing arg)");
  process.exit(1);
}

const issues: string[] = [];

const planPath = join(root, "mvp_plan.md");
if (!existsSync(planPath)) {
  issues.push("mvp_plan.md missing");
} else {
  const md = readFileSync(planPath, "utf-8");
  const required = [
    /^##\s*Riskiest assumption/im,
    /^##\s*MVP type/im,
    /^##\s*Build scope/im,
    /^##\s*Success criteria/im,
    /^##\s*Decision tree/im,
  ];
  const labels = ["Riskiest assumption", "MVP type", "Build scope", "Success criteria", "Decision tree"];
  required.forEach((re, i) => {
    if (!re.test(md)) issues.push(`mvp_plan.md missing section: ## ${labels[i]}`);
  });
  // success criteria must contain at least one measurable threshold
  const sc = md.split(/^##\s*Success criteria/im)[1] ?? "";
  if (!/[≥>]=?\s*\d/.test(sc) && !/\d+\s*%/.test(sc))
    issues.push("mvp_plan.md Success criteria has no measurable threshold");
}

const yamlPath = join(root, "riskiest_assumptions.yaml");
if (!existsSync(yamlPath)) {
  issues.push("riskiest_assumptions.yaml missing");
} else {
  const y = readFileSync(yamlPath, "utf-8");
  if (!/^ranked\s*:/m.test(y)) issues.push("riskiest_assumptions.yaml missing top-level `ranked:`");
  const items = y.match(/^\s*-\s*id\s*:/gm) ?? [];
  if (items.length === 0) issues.push("riskiest_assumptions.yaml has no ranked items with `id:`");
  for (const key of ["likelihood_wrong", "impact_wrong", "risk_score"]) {
    if (!new RegExp(`^\\s*${key}\\s*:`, "m").test(y))
      issues.push(`riskiest_assumptions.yaml missing key: ${key}`);
  }
}

if (issues.length === 0) {
  console.log("✓ product-mvp output valid");
  process.exit(0);
}
for (const i of issues) console.log("✗", i);
console.log(`\n${issues.length} issue(s)`);
process.exit(1);
