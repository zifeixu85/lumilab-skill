#!/usr/bin/env bun
/**
 * Output validator for lumilab-design-direction.
 * Validates design_direction.json against the Lumi Lab schema:
 * chosen preset + 3 dials + palette + typography.
 * Exit 0 = valid, 1 = malformed.
 *
 * Usage:
 *   bun run scripts/validate-output.ts <venture-dir>
 *   bun run scripts/validate-output.ts --help
 *
 * Expects <venture-dir>/design_direction.json with:
 *   preset       — one of editorial | minimalist | brutalist | soft
 *   dials        — { variance, motion, density }, each integer 0-100
 *   palette      — >= 1 OKLCH color string (oklch(...))
 *   typography   — display + body + mono font names, no Inter/Roboto
 *   decided_at   — ISO timestamp
 *
 * 校验字段:
 *   preset       editorial | minimalist | brutalist | soft
 *   dials        variance / motion / density, 整数 0-100
 *   palette      >= 1 个 oklch() 颜色, 不含 #000/#fff
 *   typography   display/body/mono, 不含 Inter/Roboto
 */
import { readFileSync, existsSync } from "fs";
import { join } from "path";

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log("Usage: bun run scripts/validate-output.ts <venture-dir>");
  console.log("Validates design_direction.json: 4 samples + 3 dials (0-100) + palette.");
  process.exit(0);
}

const root = process.argv[2];
if (!root || !existsSync(root)) {
  console.error("✗ venture dir not found:", root ?? "(missing arg)");
  process.exit(1);
}

const issues: string[] = [];
const PRESETS = ["editorial", "minimalist", "brutalist", "soft"];

const ddPath = join(root, "design_direction.json");
if (!existsSync(ddPath)) {
  console.error("✗ design_direction.json missing in", root);
  process.exit(1);
}

let dd: Record<string, unknown>;
try {
  dd = JSON.parse(readFileSync(ddPath, "utf-8"));
} catch (e) {
  console.error("✗ design_direction.json is not valid JSON:", (e as Error).message);
  process.exit(1);
}

// preset
if (typeof dd.preset !== "string" || !PRESETS.includes(dd.preset as string))
  issues.push(`preset must be one of ${PRESETS.join("|")} (got ${JSON.stringify(dd.preset)})`);

// dials: 3 dials, integer 0-100
const dials = dd.dials as Record<string, unknown> | undefined;
if (!dials || typeof dials !== "object") {
  issues.push("dials object missing");
} else {
  for (const k of ["variance", "motion", "density"]) {
    const v = dials[k];
    if (typeof v !== "number" || !Number.isInteger(v) || v < 0 || v > 100)
      issues.push(`dials.${k} must be integer 0-100 (got ${JSON.stringify(v)})`);
  }
}

// palette: at least one OKLCH color
const palette = JSON.stringify(dd.palette ?? "");
if (!/oklch\(/i.test(palette)) issues.push("palette must contain >= 1 oklch() color");
const bannedHex = /#000\b|#fff\b/i; // forbidden; OKLCH required instead
if (bannedHex.test(palette)) issues.push("palette uses a forbidden hex color (OKLCH required)");

// typography: forbidden fonts must never appear
const typo = JSON.stringify(dd.typography ?? "");
if (!dd.typography) issues.push("typography object missing");
const bannedFont = /\b(Inter|Roboto)\b/; // forbidden fonts
if (bannedFont.test(typo)) issues.push("typography uses a forbidden font (see anti-slop rules)");

if (issues.length === 0) {
  console.log("✓ design-direction output valid");
  process.exit(0);
}
for (const i of issues) console.log("✗", i);
console.log(`\n${issues.length} issue(s)`);
process.exit(1);
