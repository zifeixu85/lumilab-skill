#!/usr/bin/env bun
/**
 * Output validator for lumilab-home.
 * Validates <data-dir>/_home/home.html exists, is non-empty, and contains
 * the 3 required section markers. Exit 0 = valid, 1 = missing/malformed.
 *
 * Usage:
 *   bun run scripts/validate-output.ts <data-dir>
 *   bun run scripts/validate-output.ts --help
 *
 * 校验字段:
 *   _home/home.html      存在 + 非空
 *   区块标记 · 工具       含「工具」（Nº 01 工具集成）
 *   区块标记 · venture    含「venture」（Nº 02 我的 venture）
 *   区块标记 · 下一步     含「下一步」（Nº 03 下一步）
 */
import { readFileSync, existsSync } from "fs";
import { join } from "path";

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log("Usage: bun run scripts/validate-output.ts <data-dir>");
  console.log("Validates <data-dir>/_home/home.html against the lumilab-home dashboard contract.");
  process.exit(0);
}

const root = process.argv[2];
if (!root || !existsSync(root)) {
  console.error("✗ data dir not found:", root ?? "(missing arg)");
  process.exit(1);
}

const htmlPath = join(root, "_home", "home.html");
if (!existsSync(htmlPath)) {
  console.error("✗ _home/home.html missing in", root);
  process.exit(1);
}

const issues: string[] = [];
let html: string;
try {
  html = readFileSync(htmlPath, "utf-8");
} catch (e) {
  console.error("✗ _home/home.html unreadable:", (e as Error).message);
  process.exit(1);
}

if (html.trim().length === 0) issues.push("_home/home.html is empty");
if (!html.includes("工具")) issues.push("missing section marker 「工具」");
if (!html.includes("venture")) issues.push("missing section marker 「venture」");
if (!html.includes("下一步")) issues.push("missing section marker 「下一步」");

if (issues.length === 0) {
  console.log(`✓ home output valid (${html.length} bytes, 3 section markers present)`);
  process.exit(0);
}
for (const i of issues) console.log("✗", i);
console.log(`\n${issues.length} issue(s)`);
process.exit(1);
