#!/usr/bin/env bun
/**
 * Output validator for lumilab-idea-to-landing.
 * Validates <venture-dir>/market_analysis.json against the pipeline schema.
 * Exit 0 = valid, 1 = missing/malformed.
 *
 * Usage:
 *   bun run scripts/validate-output.ts <venture-dir>
 *   bun run scripts/validate-output.ts --help
 *
 * 校验字段:
 *   idea / slug          非空字符串
 *   source               host-llm-knowledge | real-api
 *   market.summary       非空
 *   market.trends        >= 2 条
 *   competitors          >= 3 个；每个 name/what_they_do/gap/type；
 *                        type ∈ {direct, alternative, status-quo}；
 *                        至少 1 个 alternative 或 status-quo
 *   audience             >= 2 个；每个 segment/jtbd/where_they_are/willingness
 *   keywords             可选；若存在需有 source + summary，blue_ocean/red_ocean 为数组
 *   directions           3-5 个；每个 id/title/angle/segment/why_it_works/risk；
 *                        恰好 1 个 recommended=true
 */
import { readFileSync, existsSync } from "fs";
import { join } from "path";

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log("Usage: bun run scripts/validate-output.ts <venture-dir>");
  console.log("Validates market_analysis.json against the idea-to-landing pipeline schema.");
  process.exit(0);
}

const root = process.argv[2];
if (!root || !existsSync(root)) {
  console.error("✗ venture dir not found:", root ?? "(missing arg)");
  process.exit(1);
}

const jsonPath = join(root, "market_analysis.json");
if (!existsSync(jsonPath)) {
  console.error("✗ market_analysis.json missing in", root);
  process.exit(1);
}

const issues: string[] = [];
let data: Record<string, unknown>;
try {
  data = JSON.parse(readFileSync(jsonPath, "utf-8"));
} catch (e) {
  console.error("✗ market_analysis.json is not valid JSON:", (e as Error).message);
  process.exit(1);
}

const str = (v: unknown) => typeof v === "string" && v.trim().length > 0;

if (!str(data.idea)) issues.push("idea must be a non-empty string");
if (!str(data.slug)) issues.push("slug must be a non-empty string");
if (data.source !== "host-llm-knowledge" && data.source !== "real-api")
  issues.push(`source must be host-llm-knowledge|real-api (got ${JSON.stringify(data.source)})`);

const market = data.market as Record<string, unknown> | undefined;
if (!market || typeof market !== "object") {
  issues.push("market object missing");
} else {
  if (!str(market.summary)) issues.push("market.summary must be non-empty");
  if (!Array.isArray(market.trends) || market.trends.length < 2)
    issues.push(`market.trends must have >= 2 entries (got ${Array.isArray(market.trends) ? market.trends.length : typeof market.trends})`);
}

const competitors = data.competitors;
const COMPETITOR_TYPES = new Set(["direct", "alternative", "status-quo"]);
if (!Array.isArray(competitors) || competitors.length < 3) {
  issues.push(`competitors must have >= 3 entries (got ${Array.isArray(competitors) ? competitors.length : typeof competitors})`);
} else {
  competitors.forEach((c, i) => {
    const o = c as Record<string, unknown>;
    if (!str(o.name)) issues.push(`competitors[${i}].name missing`);
    if (!str(o.what_they_do)) issues.push(`competitors[${i}].what_they_do missing`);
    if (!str(o.gap)) issues.push(`competitors[${i}].gap missing`);
    if (!COMPETITOR_TYPES.has(o.type as string)) issues.push(`competitors[${i}].type must be direct|alternative|status-quo (got ${JSON.stringify(o.type)})`);
  });
  const hasNonDirect = competitors.some((c) => {
    const t = (c as Record<string, unknown>).type;
    return t === "alternative" || t === "status-quo";
  });
  if (!hasNonDirect) issues.push("competitors must include >= 1 alternative or status-quo (现状方案也是竞争对手)");
}

const audience = data.audience;
if (!Array.isArray(audience) || audience.length < 2) {
  issues.push(`audience must have >= 2 entries (got ${Array.isArray(audience) ? audience.length : typeof audience})`);
} else {
  audience.forEach((a, i) => {
    const o = a as Record<string, unknown>;
    if (!str(o.segment)) issues.push(`audience[${i}].segment missing`);
    if (!str(o.jtbd)) issues.push(`audience[${i}].jtbd missing`);
    if (!str(o.where_they_are)) issues.push(`audience[${i}].where_they_are missing`);
    if (!str(o.willingness)) issues.push(`audience[${i}].willingness missing`);
  });
}

// keywords is OPTIONAL — only validate shape if present
const keywords = data.keywords as Record<string, unknown> | undefined;
if (keywords !== undefined) {
  if (typeof keywords !== "object" || keywords === null) {
    issues.push("keywords must be an object when present");
  } else {
    if (!str(keywords.source)) issues.push("keywords.source must be non-empty when keywords present");
    if (!str(keywords.summary)) issues.push("keywords.summary must be non-empty when keywords present");
    if (keywords.blue_ocean !== undefined && !Array.isArray(keywords.blue_ocean))
      issues.push("keywords.blue_ocean must be an array");
    if (keywords.red_ocean !== undefined && !Array.isArray(keywords.red_ocean))
      issues.push("keywords.red_ocean must be an array");
  }
}

const directions = data.directions;
if (!Array.isArray(directions) || directions.length < 3 || directions.length > 5) {
  issues.push(`directions must have 3-5 entries (got ${Array.isArray(directions) ? directions.length : typeof directions})`);
} else {
  let recommendedCount = 0;
  directions.forEach((d, i) => {
    const o = d as Record<string, unknown>;
    if (!str(o.id)) issues.push(`directions[${i}].id missing`);
    if (!str(o.title)) issues.push(`directions[${i}].title missing`);
    if (!str(o.angle)) issues.push(`directions[${i}].angle missing`);
    if (!str(o.segment)) issues.push(`directions[${i}].segment missing`);
    if (!str(o.why_it_works)) issues.push(`directions[${i}].why_it_works missing`);
    if (!str(o.risk)) issues.push(`directions[${i}].risk missing`);
    if (o.recommended === true) recommendedCount++;
  });
  if (recommendedCount !== 1)
    issues.push(`directions must have exactly 1 recommended=true (got ${recommendedCount})`);
}

if (issues.length === 0) {
  const d = directions as unknown[];
  console.log(`✓ idea-to-landing output valid (${(competitors as unknown[]).length} competitors, ${(audience as unknown[]).length} segments, ${d.length} directions)`);
  process.exit(0);
}
for (const i of issues) console.log("✗", i);
console.log(`\n${issues.length} issue(s)`);
process.exit(1);
