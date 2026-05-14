#!/usr/bin/env bun
/**
 * Output validator for lumilab-hypothesis-ledger.
 * Validates <venture-dir>/hypotheses.yaml against the atomic-fact schema.
 * Exit 0 = valid, 1 = missing/malformed.
 *
 * Usage:
 *   bun run scripts/validate-output.ts <venture-dir>
 *   bun run scripts/validate-output.ts --help
 *
 * Checks hypotheses.yaml:
 *   - each entry has id matching h-NNN, unique
 *   - confidence in {high, medium, low}
 *   - status in {active, superseded}
 *   - evidence[] non-empty ONLY when test_status is passed|failed
 *     (a pending hypothesis legitimately has no evidence yet)
 *   - superseded_by targets an existing id (no orphan)
 *   - supersede chains have no cycles (A->B->A rejected)
 *
 * 校验字段:
 *   id            h-NNN, 唯一
 *   confidence    high | medium | low
 *   status        active | superseded
 *   test_status   passed | failed | pending
 *   evidence[]    test_status=passed|failed 时必须非空
 *   superseded_by 指向存在的 id, 无环
 */
import { readFileSync, existsSync } from "fs";
import { join } from "path";

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log("Usage: bun run scripts/validate-output.ts <venture-dir>");
  console.log("Validates hypotheses.yaml atomic-fact schema + supersede integrity.");
  process.exit(0);
}

const root = process.argv[2];
if (!root || !existsSync(root)) {
  console.error("✗ venture dir not found:", root ?? "(missing arg)");
  process.exit(1);
}

const yamlPath = join(root, "hypotheses.yaml");
if (!existsSync(yamlPath)) {
  console.error("✗ hypotheses.yaml missing in", root);
  process.exit(1);
}

const issues: string[] = [];
const text = readFileSync(yamlPath, "utf-8");

// Split into entry blocks: each starts with a top-level "- id:" line.
const blocks = text.split(/^- /m).slice(1).map((b) => "- " + b);
if (blocks.length === 0) issues.push("hypotheses.yaml has no entries (expected `- id:` blocks)");

const CONFIDENCE = new Set(["high", "medium", "low"]);
const STATUS = new Set(["active", "superseded"]);
const ids = new Set<string>();
const supersededBy = new Map<string, string>();

blocks.forEach((block, i) => {
  const where = `entry[${i}]`;
  const idM = block.match(/^\s*-?\s*id\s*:\s*(\S+)/m);
  const id = idM?.[1] ?? "";
  if (!/^h-\d+$/.test(id)) {
    issues.push(`${where}: id must match h-NNN, got ${id || "(none)"}`);
  } else if (ids.has(id)) {
    issues.push(`${where}: duplicate id ${id}`);
  } else {
    ids.add(id);
  }

  const confM = block.match(/^\s*confidence\s*:\s*(\S+)/m);
  if (!confM || !CONFIDENCE.has(confM[1])) {
    issues.push(`${where} (${id}): confidence must be high|medium|low, got ${confM?.[1] ?? "(none)"}`);
  }

  const statM = block.match(/^\s*status\s*:\s*(\S+)/m);
  const status = statM?.[1] ?? "";
  if (!STATUS.has(status)) {
    issues.push(`${where} (${id}): status must be active|superseded, got ${status || "(none)"}`);
  }

  // evidence must be non-empty ONLY when the hypothesis has been tested
  const testM = block.match(/^\s*test_status\s*:\s*(\S+)/m);
  const testStatus = testM?.[1] ?? "";
  if (testStatus === "passed" || testStatus === "failed") {
    const evM = block.match(/^\s*evidence\s*:\s*$([\s\S]*?)(?=^\s*\w+\s*:|\Z)/m);
    if (!evM || !/^\s*-\s/m.test(evM[1])) {
      issues.push(`${where} (${id}): evidence must be a non-empty list when test_status is '${testStatus}'`);
    }
  }

  const sbM = block.match(/^\s*superseded_by\s*:\s*(\S+)/m);
  const sb = sbM?.[1];
  if (sb && sb !== "null" && sb !== "~") {
    supersededBy.set(id, sb);
    if (status !== "superseded") {
      issues.push(`${where} (${id}): has superseded_by but status is not 'superseded'`);
    }
  }
});

// orphan check
for (const [from, to] of supersededBy) {
  if (!ids.has(to)) issues.push(`${from}: orphan superseded_by -> ${to} (target not found)`);
}

// cycle detection
for (const start of ids) {
  const seen = new Set<string>();
  let cur: string | undefined = start;
  while (cur && supersededBy.has(cur)) {
    if (seen.has(cur)) {
      issues.push(`supersede cycle detected involving ${start}`);
      break;
    }
    seen.add(cur);
    cur = supersededBy.get(cur);
  }
}

if (issues.length === 0) {
  console.log(`✓ hypothesis-ledger output valid (${ids.size} hypotheses)`);
  process.exit(0);
}
for (const i of issues) console.log("✗", i);
console.log(`\n${issues.length} issue(s)`);
process.exit(1);
