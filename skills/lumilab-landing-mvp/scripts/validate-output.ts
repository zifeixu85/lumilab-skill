#!/usr/bin/env bun
/**
 * Output validator for lumilab-landing-mvp.
 * Checks the latest landing/v<n>/ build: index.html + styles.css +
 * anti-slop-checklist.md, and runs the 6-rule quality gate deterministically.
 * Exit 0 = valid, 1 = missing/malformed.
 *
 * Usage:
 *   bun run scripts/validate-output.ts <venture-dir>
 *   bun run scripts/validate-output.ts --help
 *
 * Expects:
 *   <venture-dir>/landing/v<n>/index.html
 *   <venture-dir>/landing/v<n>/styles.css
 *   <venture-dir>/landing/v<n>/anti-slop-checklist.md  (6 checklist rows)
 *
 * 8-rule gate on index.html + styles.css:
 *   1 no Inter/Roboto/Arial
 *   2 no purple hero gradient
 *   3 not centered-H1 + 3-col cards (must use grid/split layout)
 *   4 uses CSS custom properties (--color-* / --space-*)
 *   5 >= 1 non-hover @keyframes
 *   6 semantic HTML5 (<header>/<main>/<section>/<footer>)
 *   7 SEO+GEO: <title> <= 60 chars, <meta name="description">, >= 1
 *     application/ld+json, an FAQ section, all <img> have alt, and
 *     sitemap.xml / robots.txt / llms.txt exist in the build dir
 *   8 fake-door: a real buy-style primary CTA (text matches
 *     立即购买|立即预订|抢先体验|预订), a fake-door modal, inline tracking JS
 *     containing the cta_click + email_submit event strings, and the modal
 *     copy stays honest (no 立即支付 / 下单成功 fake-transaction wording)
 */
import { readFileSync, existsSync, readdirSync } from "fs";
import { join } from "path";

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log("Usage: bun run scripts/validate-output.ts <venture-dir>");
  console.log("Validates landing/v<n>/ build + runs the 8-rule quality gate.");
  process.exit(0);
}

const root = process.argv[2];
if (!root || !existsSync(root)) {
  console.error("✗ venture dir not found:", root ?? "(missing arg)");
  process.exit(1);
}

const issues: string[] = [];

const landingDir = join(root, "landing");
if (!existsSync(landingDir)) {
  console.error("✗ no landing/ directory in", root);
  process.exit(1);
}

const versions = readdirSync(landingDir)
  .filter((d) => /^v\d+$/.test(d))
  .sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)));
if (versions.length === 0) {
  console.error("✗ no landing/v<n>/ build found");
  process.exit(1);
}
const vdir = join(landingDir, versions[versions.length - 1]);

const htmlPath = join(vdir, "index.html");
const cssPath = join(vdir, "styles.css");
const checklistPath = join(vdir, "anti-slop-checklist.md");

if (!existsSync(htmlPath)) issues.push(`${versions.at(-1)}/index.html missing`);
if (!existsSync(cssPath)) issues.push(`${versions.at(-1)}/styles.css missing`);
if (!existsSync(checklistPath)) {
  issues.push(`${versions.at(-1)}/anti-slop-checklist.md missing`);
} else {
  const rows = (readFileSync(checklistPath, "utf-8").match(/^\s*[-*]\s*\[.\]/gm) ?? []).length;
  if (rows < 6) issues.push(`anti-slop-checklist.md needs >= 6 checklist rows (found ${rows})`);
}

if (existsSync(htmlPath) && existsSync(cssPath)) {
  const html = readFileSync(htmlPath, "utf-8");
  const css = readFileSync(cssPath, "utf-8");
  const both = html + "\n" + css;

  const bannedFont = /\b(Inter|Roboto|Arial)\b/; // forbidden fonts
  if (bannedFont.test(both)) issues.push("gate1: forbidden font detected (see anti-slop rules)");
  const bannedGradient = /linear-gradient[^;}]*(purple|#6[0-9a-f]{2}|#7[0-9a-f]{2}ea)/i; // forbidden
  if (bannedGradient.test(both)) issues.push("gate2: forbidden purple-ish hero gradient");
  if (/text-align:\s*center/i.test(css) && /repeat\(3,/.test(css))
    issues.push("gate3: centered H1 + 3-col card layout (use split/asymmetric)");
  if (!/--color-[\w-]+/.test(css) || !/--space-[\w-]+/.test(css))
    issues.push("gate4: missing CSS custom properties (--color-* / --space-*)");
  if (!/@keyframes\s+[\w-]+/.test(css)) issues.push("gate5: no @keyframes animation found");
  for (const tag of ["<header", "<main", "<section", "<footer"]) {
    if (!html.includes(tag)) issues.push(`gate6: missing semantic ${tag}>`);
  }
  const bannedHex = /#000\b|#fff\b/i; // forbidden; OKLCH required instead
  if (bannedHex.test(both)) issues.push("anti-slop: forbidden hex color (OKLCH required)");

  // gate7: SEO + GEO
  const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
  if (!titleMatch) {
    issues.push("gate7: missing <title>");
  } else if (titleMatch[1].trim().length > 60) {
    issues.push(`gate7: <title> exceeds 60 chars (found ${titleMatch[1].trim().length})`);
  }
  if (!/<meta\s+name=["']description["']/i.test(html))
    issues.push('gate7: missing <meta name="description">');
  if (!/<script[^>]*type=["']application\/ld\+json["']/i.test(html))
    issues.push("gate7: no JSON-LD (application/ld+json) block");
  if (!/id=["']faq["']|<h\d[^>]*>\s*FAQ/i.test(html))
    issues.push("gate7: no FAQ section found");
  const imgTags = html.match(/<img\b[^>]*>/gi) ?? [];
  if (imgTags.some((t) => !/\balt\s*=/i.test(t)))
    issues.push("gate7: some <img> tags missing alt attribute");
  for (const f of ["sitemap.xml", "robots.txt", "llms.txt"]) {
    if (!existsSync(join(vdir, f))) issues.push(`gate7: ${f} missing in build dir`);
  }

  // gate8: fake-door validation mechanism
  const buyCtaText = /立即购买|立即预订|抢先体验|预订/;
  if (!buyCtaText.test(html))
    issues.push("gate8: no real buy-style primary CTA (need 立即购买|立即预订|抢先体验|预订)");
  const hasModal = /id=["']fakedoor["']/.test(html) || /class=["'][^"']*fakedoor/.test(html);
  if (!hasModal) issues.push("gate8: no fake-door modal found (expected id/class 'fakedoor')");
  if (!html.includes("cta_click") || !html.includes("email_submit"))
    issues.push("gate8: tracking JS missing cta_click / email_submit events");
  const fakeTransaction = /立即支付|下单成功|支付成功|购买成功/;
  if (fakeTransaction.test(html))
    issues.push("gate8: modal copy not honest (fake-transaction wording detected)");
}

if (issues.length === 0) {
  console.log(`✓ landing-mvp output valid (${versions.at(-1)})`);
  process.exit(0);
}
for (const i of issues) console.log("✗", i);
console.log(`\n${issues.length} issue(s)`);
process.exit(1);
