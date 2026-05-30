#!/usr/bin/env bun
/**
 * lumilab-idea-to-landing orchestrator helper.
 *
 * The pipeline itself is LLM-driven (see SKILL.md). This script handles the
 * deterministic parts: venture creation, token detection, scaffolding.
 *
 * Usage:
 *   orchestrate.ts init "<one-sentence idea>"   建 venture + 检测 token
 *   orchestrate.ts status <venture-dir>          报告流水线进度
 *   orchestrate.ts --help
 *
 * `init` 输出 JSON：{ slug, venture_dir, source, has_tikhub, has_tavily, next }
 *   source = real-api（有 TikHub/Tavily token）| host-llm-knowledge（无）
 */
import { existsSync, mkdirSync, writeFileSync, readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";
import { homedir } from "os";

const HELP = `lumilab-idea-to-landing orchestrator
  orchestrate.ts init "<one-sentence idea>"   create venture + detect tokens
  orchestrate.ts status <venture-dir>          report pipeline progress
  orchestrate.ts coach-brief <venture> --positioning .. --icp .. --hook .. --risk .. --test ..
                                               写 yc_brief.md（教练梳理结论）+ 种风险假设`;

function slugify(idea: string): string {
  // 中文 idea：取前几个词做 ascii slug，不行就用 hash
  const ascii = idea.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
  if (ascii.length >= 4) return ascii;
  // 全中文 → 短 hash
  let h = 0;
  for (let i = 0; i < idea.length; i++) h = (h * 31 + idea.charCodeAt(i)) >>> 0;
  return "venture-" + h.toString(36);
}

function lumilabHome(): string {
  return process.env.LUMILAB_HOME ?? join(homedir(), ".lumilab");
}

function hasToken(name: string): boolean {
  if (process.env[name]) return true;
  // keychain
  const keychainScript = join(import.meta.dir, "..", "..", "lumilab-config", "scripts", "keychain.ts");
  if (existsSync(keychainScript)) {
    const r = Bun.spawnSync(["bun", "run", keychainScript, "get", name], { stdout: "pipe", stderr: "pipe" });
    if (r.exitCode === 0 && (r.stdout?.toString().trim() ?? "")) return true;
  }
  // plaintext secrets.json
  const secretsPath = join(lumilabHome(), "secrets.json");
  if (existsSync(secretsPath)) {
    try {
      const s = JSON.parse(readFileSync(secretsPath, "utf-8"));
      const lc = name.toLowerCase();
      if (s[name] || s[lc]) return true;
    } catch { /* ignore */ }
  }
  return false;
}

function venturesRoot(): string {
  // venture 数据永远在 ~/.lumilab/data/ventures/，跟 cwd / 谁调用无关。
  return join(lumilabHome(), "data", "ventures");
}

function cmdInit(idea: string) {
  if (!idea || !idea.trim()) {
    console.error(JSON.stringify({ ok: false, code: "E_NOIDEA", error: 'usage: orchestrate.ts init "<idea>"' }));
    process.exit(2);
  }
  idea = idea.trim();
  const root = venturesRoot();
  let slug = slugify(idea);

  // 去重：同名 idea 复用，不同 idea 同 slug 则加后缀
  let ventureDir = join(root, slug);
  if (existsSync(ventureDir)) {
    const briefPath = join(ventureDir, "project_brief.md");
    const sameIdea = existsSync(briefPath) && readFileSync(briefPath, "utf-8").includes(idea);
    if (!sameIdea) {
      let i = 2;
      while (existsSync(join(root, `${slug}-${i}`))) i++;
      slug = `${slug}-${i}`;
      ventureDir = join(root, slug);
    }
  }

  mkdirSync(join(ventureDir, "reports"), { recursive: true });
  mkdirSync(join(ventureDir, "research"), { recursive: true });
  mkdirSync(join(ventureDir, "landing"), { recursive: true });

  const now = new Date().toISOString();
  const briefPath = join(ventureDir, "project_brief.md");
  if (!existsSync(briefPath)) {
    writeFileSync(briefPath, `# ${slug}\n\n> **${idea}**\n\n## 基本信息\n\n- 创建时间: ${now}\n- 入口: lumilab-idea-to-landing\n- 当前阶段: phase-0-intake\n\n## 一句话 idea\n\n${idea}\n\n## Intake（Phase 0 补充，可空）\n\n- 目标用户: （待补充 / 推断）\n- 期望用户完成: （待补充 / 推断）\n- 想验证的点: （待补充 / 推断）\n`);
  }

  const decisionsPath = join(ventureDir, "decisions.yaml");
  if (!existsSync(decisionsPath)) {
    writeFileSync(decisionsPath, `# decisions.yaml — 决策时间线\n- id: d-001\n  decision: "venture created via idea-to-landing"\n  rationale: "user provided one-sentence idea"\n  by: user\n  type: mechanical\n  at: "${now}"\n  related: []\n  superseded_by: null\n`);
  }

  const hasTikhub = hasToken("TIKHUB_API_KEY");
  const hasTavily = hasToken("TAVILY_API_KEY");
  const source = hasTikhub || hasTavily ? "real-api" : "host-llm-knowledge";

  // 新建 venture 后：先渲染它自己的 studio（否则 home 点进去 404），再 re-render home。
  renderVentureStudio(ventureDir);
  rerenderHome();

  console.log(JSON.stringify({
    ok: true,
    slug,
    venture_dir: ventureDir,
    idea,
    source,
    has_tikhub: hasTikhub,
    has_tavily: hasTavily,
    next: source === "real-api"
      ? "Phase 1 走真实 API（TikHub/Tavily）"
      : "Phase 1 用宿主 LLM 知识分析（无 token，不阻塞）",
  }, null, 2));
}

// 写时更新：best-effort 重渲 home dashboard。失败不影响主流程。
function rerenderHome(): void {
  try {
    const homeScript = join(import.meta.dir, "..", "..", "lumilab-home", "scripts", "home.ts");
    if (!existsSync(homeScript)) return;
    Bun.spawnSync(["bun", "run", homeScript, "render"], { stdout: "ignore", stderr: "ignore" });
  } catch { /* best-effort */ }
}

// 新建 venture 后立刻渲染它的 studio，保证 home 卡片点进去不 404。失败不影响主流程。
function renderVentureStudio(ventureDir: string): void {
  try {
    const renderScript = join(import.meta.dir, "..", "..", "lumilab-studio", "scripts", "render.ts");
    if (!existsSync(renderScript)) return;
    Bun.spawnSync(["bun", "run", renderScript, ventureDir], { stdout: "ignore", stderr: "ignore" });
  } catch { /* best-effort */ }
}

function cmdStatus(ventureDir: string) {
  if (!ventureDir || !existsSync(ventureDir)) {
    console.error(JSON.stringify({ ok: false, code: "E_NODIR", error: `venture dir not found: ${ventureDir}` }));
    process.exit(2);
  }
  const has = (p: string) => existsSync(join(ventureDir, p));
  const landingVersions = has("landing")
    ? readdirSync(join(ventureDir, "landing")).filter((d) => {
        try { return statSync(join(ventureDir, "landing", d)).isDirectory(); } catch { return false; }
      })
    : [];
  const phases = {
    "0-intake": has("project_brief.md"),
    "1-analysis": has("market_analysis.json"),
    "2-report": has("reports/market-report.html"),
    "3-direction": has("decisions.yaml") && readFileSync(join(ventureDir, "decisions.yaml"), "utf-8").includes("direction"),
    "4-landing": landingVersions.length > 0,
  };
  const done = Object.values(phases).filter(Boolean).length;
  console.log(JSON.stringify({
    ok: true,
    venture_dir: ventureDir,
    phases,
    progress: `${done}/5`,
    landing_versions: landingVersions,
    next: !phases["1-analysis"] ? "跑 Phase 1 自主分析"
        : !phases["2-report"] ? "渲染 Phase 2 HTML 报告"
        : !phases["3-direction"] ? "Phase 3 方向选择门"
        : !phases["4-landing"] ? "Phase 4 生成 landing"
        : "完成 — 可 lumilab deploy",
  }, null, 2));
}

// ── coach-brief：把 coach-yc 轻量一轮的 5 字段结论确定性落成 yc_brief.md ──
// 格式与 lumilab-studio/render.ts parseCoachBrief 对齐 → 想法澄清页直接渲染「教练梳理结论」。
// 同时把「最高风险假设 + 第一个验证动作」种进 hypotheses.yaml（best-effort），让下游闭环更准。
function flag(rest: string[], name: string): string | undefined {
  const i = rest.indexOf(name);
  return i >= 0 ? rest[i + 1] : undefined;
}

function cmdCoachBrief(rest: string[]) {
  const ventureDir = rest.find((a) => !a.startsWith("--") && (a.includes("/") || existsSync(join(venturesRoot(), a))));
  const slug = rest.find((a) => !a.startsWith("--"));
  const dir = ventureDir && ventureDir.includes("/") ? ventureDir : join(venturesRoot(), slug ?? "");
  if (!dir || !existsSync(dir)) {
    console.error(JSON.stringify({ ok: false, code: "E_NODIR", error: `venture 不存在：${dir}` }));
    process.exit(2);
  }
  const positioning = flag(rest, "--positioning");
  const icp = flag(rest, "--icp");
  const hook = flag(rest, "--hook");
  const risk = flag(rest, "--risk");
  const test = flag(rest, "--test");
  if (!positioning && !icp && !hook && !risk && !test) {
    console.error('用法：orchestrate.ts coach-brief <venture> --positioning "..." --icp "..." --hook "..." --risk "..." --test "..."');
    process.exit(2);
  }
  const now = new Date().toISOString();
  const lines = [
    `# YC Brief — ${dir.split("/").filter(Boolean).pop()}`,
    "",
    "> coach-yc 轻量一轮（YC 6 forcing questions）的结论。想法澄清页据此渲染「教练梳理结论」。",
    "",
    positioning ? `**一句话定位**：${positioning}` : "",
    icp ? `**目标用户**：${icp}` : "",
    hook ? `**核心钩子**：${hook}` : "",
    risk ? `**最高风险假设**：${risk}` : "",
    test ? `**第一个验证动作**：${test}` : "",
    "",
    `_生成：${now}_`,
  ].filter((l) => l !== "");
  writeFileSync(join(dir, "yc_brief.md"), lines.join("\n") + "\n");

  // best-effort 种一条「最高风险假设」进 hypotheses.yaml（已存在同 fact 则跳过）
  let seeded = false;
  if (risk) {
    try {
      const hp = join(dir, "hypotheses.yaml");
      const prev = existsSync(hp) ? readFileSync(hp, "utf-8") : "";
      if (!prev.includes(risk.slice(0, 24))) {
        const id = `h-coach-${Date.now().toString(36).slice(-4)}`;
        const entry = [
          `- id: ${id}`,
          `  fact: ${JSON.stringify(risk)}`,
          `  status: active`,
          `  test_status: untested`,
          `  confidence: low`,
          `  source: coach-yc`,
          test ? `  test_method: ${JSON.stringify(test)}` : `  test_method: ""`,
          `  created_at: "${now}"`,
          "",
        ].join("\n");
        writeFileSync(hp, (prev.trimEnd() ? prev.trimEnd() + "\n" : "") + entry);
        seeded = true;
      }
    } catch { /* hypotheses 种子 best-effort，不阻塞 */ }
  }

  // 重渲 studio，让澄清页立刻显示教练结论
  try {
    const renderScript = join(import.meta.dir, "..", "..", "lumilab-studio", "scripts", "render.ts");
    if (existsSync(renderScript)) Bun.spawnSync(["bun", "run", renderScript, dir], { stdout: "ignore", stderr: "ignore" });
  } catch { /* best-effort */ }

  console.log(JSON.stringify({ ok: true, wrote: join(dir, "yc_brief.md"), hypothesis_seeded: seeded }, null, 2));
}

const [, , cmd, ...rest] = process.argv;
if (cmd === "--help" || cmd === "-h" || !cmd) {
  console.log(HELP);
  process.exit(0);
}
switch (cmd) {
  case "init": cmdInit(rest.join(" ")); break;
  case "status": cmdStatus(rest[0]); break;
  case "coach-brief": cmdCoachBrief(rest); break;
  default:
    console.error(JSON.stringify({ ok: false, code: "E_CMD", error: `unknown command: ${cmd}` }));
    console.error(HELP);
    process.exit(2);
}
