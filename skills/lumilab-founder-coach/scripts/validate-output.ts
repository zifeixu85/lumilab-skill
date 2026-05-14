#!/usr/bin/env bun
/**
 * Output validator for lumilab-founder-coach.
 * Validates <venture-dir>/coach_session_<ts>.md has the required sections.
 * Exit 0 = valid, 1 = missing/malformed.
 *
 * Usage:
 *   bun run scripts/validate-output.ts <venture-dir>
 *   bun run scripts/validate-output.ts --help
 *
 * Checks the most recent coach_session_*.md:
 *   - H1 title line `# Coach Session @ ...`
 *   - bold field `**Layer**:` with value L1|L2|L3
 *   - sections: ## Conversation, ## Outputs, ## Next suggested action
 *   - Next suggested action section is non-empty
 */
import { readFileSync, existsSync, readdirSync } from "fs";
import { join } from "path";

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log("Usage: bun run scripts/validate-output.ts <venture-dir>");
  console.log("Validates coach_session_<ts>.md has Layer + Conversation/Outputs/Next sections.");
  process.exit(0);
}

const root = process.argv[2];
if (!root || !existsSync(root)) {
  console.error("✗ venture dir not found:", root ?? "(missing arg)");
  process.exit(1);
}

const issues: string[] = [];

const sessions = readdirSync(root)
  .filter((f) => /^coach_session_.*\.md$/.test(f))
  .sort();

if (sessions.length === 0) {
  issues.push("no coach_session_<ts>.md found in venture dir");
} else {
  const latest = sessions[sessions.length - 1];
  const md = readFileSync(join(root, latest), "utf-8");

  if (!/^#\s+Coach Session\s+@/m.test(md))
    issues.push(`${latest}: missing H1 \`# Coach Session @ <timestamp>\``);

  const layerM = md.match(/^\*\*Layer\*\*\s*:\s*\{?(L[123])\}?/m);
  if (!layerM) issues.push(`${latest}: missing \`**Layer**:\` field with L1|L2|L3`);

  for (const sec of ["Conversation", "Outputs", "Next suggested action"]) {
    if (!new RegExp(`^##\\s*${sec.replace(/ /g, "\\s")}`, "im").test(md))
      issues.push(`${latest}: missing section \`## ${sec}\``);
  }

  const nextPart = md.split(/^##\s*Next suggested action/im)[1] ?? "";
  if (nextPart.replace(/[#\s]/g, "").length === 0)
    issues.push(`${latest}: \`## Next suggested action\` section is empty`);
}

if (issues.length === 0) {
  console.log("✓ founder-coach session output valid");
  process.exit(0);
}
for (const i of issues) console.log("✗", i);
console.log(`\n${issues.length} issue(s)`);
process.exit(1);
