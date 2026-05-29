#!/usr/bin/env bun
/**
 * Design Direction interactive page server.
 *
 * Usage:
 *   bun run skills/lumilab-design-direction/scripts/serve.ts <venture-slug>
 *
 * Opens browser to http://localhost:7777/<venture>/design-direction.
 * User picks preset + dials + palette, submits, JSON written to
 * data/ventures/<venture>/design_direction.json, server shuts down.
 */

import { readFile, writeFile, mkdir, access } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SKILL_ROOT = resolve(__dirname, "..");
const WORKSPACE_ROOT = resolve(SKILL_ROOT, "..", "..");
const TEMPLATE_PATH = resolve(SKILL_ROOT, "templates", "design-direction.html.tpl");

const PORT = 7777;

interface Dials {
  variance: number;
  motion: number;
  density: number;
}

interface Palette {
  primary: string;
  accent: string;
  neutral: string;
}

interface Typography {
  display: string;
  body: string;
  mono: string;
}

interface DesignDirection {
  preset: string;
  dials: Dials;
  palette: Palette;
  typography: Typography;
  decided_at: string;
}

function venturePath(slug: string): string {
  return resolve(WORKSPACE_ROOT, "data", "ventures", slug);
}

function ddPath(slug: string): string {
  return resolve(venturePath(slug), "design_direction.json");
}

async function readCurrent(slug: string): Promise<DesignDirection | null> {
  try {
    const buf = await readFile(ddPath(slug), "utf8");
    return JSON.parse(buf) as DesignDirection;
  } catch {
    return null;
  }
}

async function renderPage(slug: string): Promise<string> {
  const tpl = await readFile(TEMPLATE_PATH, "utf8");
  const current = await readCurrent(slug);
  return tpl
    .replaceAll("{{VENTURE_SLUG}}", slug)
    .replaceAll("{{VENTURE_NAME}}", slug)
    .replaceAll("{{CURRENT_JSON}}", JSON.stringify(current ?? null));
}

function validatePayload(body: unknown): DesignDirection | string {
  if (!body || typeof body !== "object") return "invalid body";
  const b = body as Record<string, unknown>;
  const preset = String(b.preset ?? "");
  if (!["editorial", "minimalist", "brutalist", "soft"].includes(preset))
    return "preset must be one of editorial|minimalist|brutalist|soft";
  const dials = b.dials as Dials | undefined;
  if (
    !dials ||
    typeof dials.variance !== "number" ||
    typeof dials.motion !== "number" ||
    typeof dials.density !== "number"
  )
    return "dials must include variance/motion/density numbers";
  const palette = b.palette as Palette | undefined;
  if (!palette || !palette.primary || !palette.accent || !palette.neutral)
    return "palette incomplete";
  const typography = b.typography as Typography | undefined;
  if (!typography || !typography.display || !typography.body || !typography.mono)
    return "typography incomplete";
  return {
    preset,
    dials: {
      variance: clamp(dials.variance, 1, 10),
      motion: clamp(dials.motion, 1, 10),
      density: clamp(dials.density, 1, 10),
    },
    palette,
    typography,
    decided_at: new Date().toISOString(),
  };
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, Math.round(n)));
}

async function ensureVentureDir(slug: string): Promise<void> {
  const dir = venturePath(slug);
  if (!existsSync(dir)) await mkdir(dir, { recursive: true });
}

async function main(): Promise<void> {
  const slug = process.argv[2];
  if (!slug) {
    console.error("usage: bun serve.ts <venture-slug>");
    process.exit(1);
  }
  try {
    await access(venturePath(slug));
  } catch {
    console.error(`venture dir not found: ${venturePath(slug)}`);
    process.exit(1);
  }

  let shutdownTimer: ReturnType<typeof setTimeout> | null = null;
  const scheduleShutdown = (): void => {
    if (shutdownTimer) return;
    shutdownTimer = setTimeout(() => {
      console.log("\n[design-direction] saved · shutting down");
      server.stop();
      process.exit(0);
    }, 2500);
  };

  const server = Bun.serve({
    port: PORT,
    async fetch(req): Promise<Response> {
      const url = new URL(req.url);
      const path = url.pathname;

      if (req.method === "GET" && path === `/${slug}/design-direction`) {
        const html = await renderPage(slug);
        return new Response(html, {
          headers: { "content-type": "text/html; charset=utf-8" },
        });
      }

      if (req.method === "GET" && path.startsWith("/api/current/")) {
        const s = path.slice("/api/current/".length);
        const current = await readCurrent(s);
        return Response.json(current);
      }

      if (req.method === "POST" && path === "/api/design-direction") {
        try {
          const body = await req.json();
          const result = validatePayload(body);
          if (typeof result === "string") {
            return Response.json({ ok: false, error: result }, { status: 400 });
          }
          const targetSlug = String(
            (body as { venture?: string }).venture ?? slug,
          );
          await ensureVentureDir(targetSlug);
          await writeFile(
            ddPath(targetSlug),
            JSON.stringify(result, null, 2) + "\n",
            "utf8",
          );
          console.log(`[design-direction] wrote ${ddPath(targetSlug)}`);
          // 设计变了 → 立刻重渲染该 venture 的 studio，让看板反映新 token
          const renderScript = resolve(WORKSPACE_ROOT, "skills", "lumilab-studio", "scripts", "render.ts");
          if (existsSync(renderScript)) {
            Bun.spawnSync(["bun", "run", renderScript, venturePath(targetSlug)], { stdout: "ignore", stderr: "ignore" });
          }
          // landing 是 LLM 生成物 → 给明确的重生成 handoff（server 不跑 LLM）
          const handoff = `设计已保存。要让 landing 套用新风格，在 AI 宿主里说：「用 lumilab-landing-mvp 按新的 design_direction 重新生成 ${targetSlug} 的 landing」`;
          console.log(`[design-direction] studio re-rendered · ${handoff}`);
          return Response.json({ ok: true, written: ddPath(targetSlug), studio_rerendered: true, next: handoff });
        } catch (e) {
          return Response.json(
            { ok: false, error: (e as Error).message },
            { status: 500 },
          );
        }
      }

      if (req.method === "POST" && path === "/api/done") {
        scheduleShutdown();
        return Response.json({ ok: true });
      }

      if (path === "/") {
        return Response.redirect(`/${slug}/design-direction`, 302);
      }

      return new Response("not found", { status: 404 });
    },
  });

  const url = `http://localhost:${PORT}/${slug}/design-direction`;
  console.log(`[design-direction] ${url}`);

  // best-effort open browser (macOS / linux / windows)
  const opener = process.platform === "darwin"
    ? "open"
    : process.platform === "win32"
      ? "start"
      : "xdg-open";
  try {
    Bun.spawn([opener, url], { stdout: "ignore", stderr: "ignore" });
  } catch {
    /* user can open manually */
  }
}

await main();
