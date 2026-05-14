#!/usr/bin/env bun
/**
 * Output validator for lumilab-content-repurpose.
 * Deterministically checks generated platform content against hard platform rules.
 * Exit 0 = all pass, 1 = violations found.
 *
 * Usage:
 *   bun run scripts/validate-output.ts <venture-dir>
 *   bun run scripts/validate-output.ts --help
 *
 * Expects: <venture-dir>/content/<platform>/<slug>.md
 *   platforms: xhs | wechat-mp | x-twitter | douyin | wechat-moments
 *
 * Rules enforced (2026 platform constraints):
 *   xhs            title <= 38 chars, tags 3-10, >= 1 image block, no external links
 *   wechat-mp      title <= 22 chars, paragraphs <= 80 chars
 *   x-twitter      thread 5-7 tweets, each <= 280 chars, hashtags <= 2
 *   douyin         title <= 14 chars, 3-second hook present
 *   wechat-moments <= 6 content lines, no external links
 */
import { readFileSync, existsSync, readdirSync, statSync } from "fs";
import { join } from "path";

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log("Usage: bun run scripts/validate-output.ts <venture-dir>");
  console.log("Validates content/<platform>/<slug>.md against platform hard rules.");
  process.exit(0);
}

const root = process.argv[2];
if (!root || !existsSync(root)) {
  console.error("✗ venture dir not found:", root ?? "(missing arg)");
  process.exit(1);
}

type Issue = { file: string; rule: string };
const issues: Issue[] = [];
const fail = (file: string, rule: string) => issues.push({ file, rule });

// CJK + others count as 1 char each; trims markdown heading markers.
const cleanLen = (s: string) => s.replace(/^#+\s*/, "").trim().length;
const hasExternalLink = (t: string) => /https?:\/\/\S+/.test(t);

function readFirst(dir: string): { path: string; text: string } | null {
  if (!existsSync(dir)) return null;
  const mds = readdirSync(dir).filter((f) => f.endsWith(".md"));
  if (mds.length === 0) return null;
  const p = join(dir, mds[0]);
  return { path: p, text: readFileSync(p, "utf-8") };
}

function sectionBody(text: string, headingRe: RegExp): string {
  const lines = text.split(/\r?\n/);
  const start = lines.findIndex((l) => headingRe.test(l));
  if (start === -1) return "";
  const out: string[] = [];
  for (let i = start + 1; i < lines.length; i++) {
    if (/^#{1,3}\s/.test(lines[i])) break;
    out.push(lines[i]);
  }
  return out.join("\n").trim();
}

function validateXhs(dir: string) {
  const f = readFirst(dir);
  if (!f) return;
  const title = sectionBody(f.text, /^##\s*标题/);
  const firstTitleLine = title.split(/\r?\n/).find((l) => l.trim()) ?? "";
  if (cleanLen(firstTitleLine) > 38) fail(f.path, `xhs title > 38 chars (${cleanLen(firstTitleLine)})`);
  const tagLine = sectionBody(f.text, /^##\s*标签/);
  const tags = (tagLine.match(/#[^\s#]+/g) ?? []).length;
  if (tags < 3 || tags > 10) fail(f.path, `xhs tags must be 3-10 (found ${tags})`);
  if (!/图\s*\d|##\s*\d+\s*图/.test(f.text)) fail(f.path, "xhs missing image storyboard block");
  if (hasExternalLink(f.text)) fail(f.path, "xhs must not contain external links");
}

function validateWechatMp(dir: string) {
  const f = readFirst(dir);
  if (!f) return;
  const title = sectionBody(f.text, /^##\s*标题/) || (f.text.match(/^#\s+(.+)/m)?.[1] ?? "");
  const firstTitle = title.split(/\r?\n/).find((l) => l.trim()) ?? "";
  if (cleanLen(firstTitle) > 22) fail(f.path, `wechat-mp title > 22 chars (${cleanLen(firstTitle)})`);
  f.text.split(/\r?\n/).forEach((l, i) => {
    const body = l.replace(/^[-*>]\s*/, "").trim();
    if (body && !/^#/.test(l) && !/^[`|<]/.test(body) && cleanLen(body) > 80)
      fail(f.path, `wechat-mp L${i + 1} paragraph > 80 chars`);
  });
}

function validateX(dir: string) {
  const f = readFirst(dir);
  if (!f) return;
  const tweets = (f.text.match(/^##\s*\d+\s*\/\s*\d+/gm) ?? []).length;
  if (tweets < 5 || tweets > 7) fail(f.path, `x-twitter thread must be 5-7 tweets (found ${tweets})`);
  const hashtags = (f.text.match(/#\w+/g) ?? []).length;
  if (hashtags > 2) fail(f.path, `x-twitter hashtags must be <= 2 (found ${hashtags})`);
}

function validateDouyin(dir: string) {
  const f = readFirst(dir);
  if (!f) return;
  const title = sectionBody(f.text, /^##\s*标题/);
  const firstTitle = title.split(/\r?\n/).find((l) => l.trim()) ?? "";
  if (cleanLen(firstTitle) > 14) fail(f.path, `douyin title > 14 chars (${cleanLen(firstTitle)})`);
  if (!/前\s*3\s*秒|3s|0-3s/.test(f.text)) fail(f.path, "douyin missing 3-second hook section");
}

function validateMoments(dir: string) {
  const f = readFirst(dir);
  if (!f) return;
  const body = sectionBody(f.text, /^##\s*文案/);
  const lines = body.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length > 6) fail(f.path, `wechat-moments > 6 content lines (found ${lines.length})`);
  if (hasExternalLink(f.text)) fail(f.path, "wechat-moments must not contain external links");
}

const contentDir = join(root, "content");
if (!existsSync(contentDir) || !statSync(contentDir).isDirectory()) {
  console.error("✗ no content/ directory in", root);
  process.exit(1);
}

validateXhs(join(contentDir, "xhs"));
validateWechatMp(join(contentDir, "wechat-mp"));
validateX(join(contentDir, "x-twitter"));
validateDouyin(join(contentDir, "douyin"));
validateMoments(join(contentDir, "wechat-moments"));

if (issues.length === 0) {
  console.log("✓ content-repurpose output valid");
  process.exit(0);
}
for (const i of issues) console.log(`✗ ${i.file}: ${i.rule}`);
console.log(`\n${issues.length} violation(s)`);
process.exit(1);
