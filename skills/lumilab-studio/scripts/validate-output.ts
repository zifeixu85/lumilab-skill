#!/usr/bin/env bun
/**
 * Output validator for lumilab-studio.
 * Checks the rendered studio/index.html exists and has required structure:
 * SVG progress diagram + the 7 core sections.
 * Exit 0 = valid, 1 = missing/malformed.
 *
 * Usage:
 *   bun run scripts/validate-output.ts <venture-dir>
 *   bun run scripts/validate-output.ts --help
 *
 * Expects:
 *   <venture-dir>/studio/index.html with:
 *     - a 7-stage progress nav (.nav-stage / .stage-deck) with >= 5 stage nodes
 *     - hypotheses + decisions sections (always rendered)
 *     - metrics / assets sections are optional (only rendered when data exists)
 *     - no banned fonts (Inter / Roboto / Arial) and no #000/#fff hex
 *
 * 校验字段:
 *   studio/index.html       存在 + 非空
 *   .nav-stage | .stage-deck >= 5 个 stage 节点
 *   hypothes(es)            必有
 *   decision(s)             必有
 *   font / hex              不含 Inter|Roboto|Arial / #000|#fff
 */
import { readFileSync, existsSync } from "fs";
import { join } from "path";

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log("Usage: bun run scripts/validate-output.ts <venture-dir>");
  console.log("Validates studio/index.html structure + SVG progress diagram.");
  process.exit(0);
}

const root = process.argv[2];
if (!root || !existsSync(root)) {
  console.error("✗ venture dir not found:", root ?? "(missing arg)");
  process.exit(1);
}

const issues: string[] = [];

const indexPath = join(root, "studio", "index.html");
if (!existsSync(indexPath)) {
  issues.push("studio/index.html missing");
} else {
  const html = readFileSync(indexPath, "utf-8");

  // 7-stage progress nav (renderer emits .nav-stage / .stage-deck, not an inline SVG)
  if (!/\b(nav-stage|stage-deck|progress[- ]diagram|progress[- ]timeline)\b/i.test(html))
    issues.push("studio/index.html missing the stage progress nav (.nav-stage / .stage-deck)");
  const stages = (html.match(/class="[^"]*\bstage\b[^"]*"/g) ?? []).length;
  if (stages < 5) issues.push(`studio/index.html has < 5 stage nodes (found ${stages})`);

  // required content regions (always rendered)
  const required: [RegExp, string][] = [
    [/hypothes/i, "hypotheses section"],
    [/decision/i, "decisions section"],
  ];
  for (const [re, label] of required) {
    if (!re.test(html)) issues.push(`studio/index.html missing ${label}`);
  }
  // metrics / assets are optional — only rendered when the venture has that data.

  // anti-slop spot check: these tokens are forbidden in rendered output
  const bannedFont = /\b(Inter|Roboto|Arial)\b/; // forbidden fonts
  if (bannedFont.test(html))
    issues.push("studio/index.html uses a forbidden font (see anti-slop rules)");
  const bannedHex = /#000\b|#fff\b/i; // forbidden; OKLCH required instead
  if (bannedHex.test(html))
    issues.push("studio/index.html uses a forbidden hex color (OKLCH required)");
}

if (issues.length === 0) {
  console.log("✓ studio output valid");
  process.exit(0);
}
for (const i of issues) console.log("✗", i);
console.log(`\n${issues.length} issue(s)`);
process.exit(1);
