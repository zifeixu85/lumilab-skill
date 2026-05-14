#!/usr/bin/env bun
/**
 * Output validator for lumilab-deploy.
 * Validates <venture-dir>/deploy/manifest.json shape.
 * Exit 0 = valid, 1 = missing/malformed.
 *
 * Usage:
 *   bun run scripts/validate-output.ts <venture-dir>
 *   bun run scripts/validate-output.ts --help
 *
 * Checks deploy/manifest.json:
 *   - top-level `versions` is a non-empty array
 *   - each version has: url, deployed_at, encryption{algorithm,kdf,iterations}, public(boolean)
 *   - encryption.algorithm === "AES-GCM", kdf === "PBKDF2", iterations >= 100000
 *   - url looks like https://...
 */
import { readFileSync, existsSync } from "fs";
import { join } from "path";

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log("Usage: bun run scripts/validate-output.ts <venture-dir>");
  console.log("Validates deploy/manifest.json version history + encryption params.");
  process.exit(0);
}

const root = process.argv[2];
if (!root || !existsSync(root)) {
  console.error("✗ venture dir not found:", root ?? "(missing arg)");
  process.exit(1);
}

const manifestPath = join(root, "deploy", "manifest.json");
if (!existsSync(manifestPath)) {
  console.error("✗ deploy/manifest.json missing in", root);
  process.exit(1);
}

const issues: string[] = [];

interface Encryption {
  algorithm?: unknown;
  kdf?: unknown;
  iterations?: unknown;
}
interface Version {
  url?: unknown;
  deployed_at?: unknown;
  public?: unknown;
  encryption?: Encryption;
}

let doc: { versions?: unknown };
try {
  doc = JSON.parse(readFileSync(manifestPath, "utf-8"));
} catch (e) {
  console.error("✗ manifest.json invalid JSON:", e instanceof Error ? e.message : String(e));
  process.exit(1);
}

if (!Array.isArray(doc.versions) || doc.versions.length === 0) {
  issues.push("manifest.json `versions` must be a non-empty array");
} else {
  (doc.versions as Version[]).forEach((v, i) => {
    const where = `versions[${i}]`;
    if (typeof v.url !== "string" || !/^https:\/\//.test(v.url))
      issues.push(`${where}: url must be an https:// string`);
    if (typeof v.deployed_at !== "string" || !v.deployed_at)
      issues.push(`${where}: deployed_at must be a non-empty string (ISO-8601)`);
    if (typeof v.public !== "boolean")
      issues.push(`${where}: public must be a boolean`);
    if (v.public === true) return; // public deploys carry no encryption block
    const enc = v.encryption;
    if (!enc || typeof enc !== "object") {
      issues.push(`${where}: encryption block missing (required for non-public)`);
      return;
    }
    if (enc.algorithm !== "AES-GCM")
      issues.push(`${where}: encryption.algorithm must be "AES-GCM", got ${JSON.stringify(enc.algorithm)}`);
    if (enc.kdf !== "PBKDF2")
      issues.push(`${where}: encryption.kdf must be "PBKDF2", got ${JSON.stringify(enc.kdf)}`);
    const iter = Number(enc.iterations);
    if (!Number.isFinite(iter) || iter < 100000)
      issues.push(`${where}: encryption.iterations must be >= 100000, got ${JSON.stringify(enc.iterations)}`);
  });
}

if (issues.length === 0) {
  const n = Array.isArray(doc.versions) ? doc.versions.length : 0;
  console.log(`✓ deploy manifest.json valid (${n} version(s))`);
  process.exit(0);
}
for (const i of issues) console.log("✗", i);
console.log(`\n${issues.length} issue(s)`);
process.exit(1);
