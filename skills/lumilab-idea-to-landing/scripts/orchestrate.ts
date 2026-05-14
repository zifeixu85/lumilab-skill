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
 * `init` 输出 JSON：{ slug, venture_dir, source, has_tikhub, has_exa, next }
 *   source = real-api（有 TikHub/Exa token）| host-llm-knowledge（无）
 */
import { existsSync, mkdirSync, writeFileSync, readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";
import { homedir } from "os";

const HELP = `lumilab-idea-to-landing orchestrator
  orchestrate.ts init "<one-sentence idea>"   create venture + detect tokens
  orchestrate.ts status <venture-dir>          report pipeline progress`;

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
  const hasExa = hasToken("EXA_API_KEY");
  const source = hasTikhub || hasExa ? "real-api" : "host-llm-knowledge";

  console.log(JSON.stringify({
    ok: true,
    slug,
    venture_dir: ventureDir,
    idea,
    source,
    has_tikhub: hasTikhub,
    has_exa: hasExa,
    next: source === "real-api"
      ? "Phase 1 走真实 API（TikHub/Exa）"
      : "Phase 1 用宿主 LLM 知识分析（无 token，不阻塞）",
  }, null, 2));
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

const [, , cmd, ...rest] = process.argv;
if (cmd === "--help" || cmd === "-h" || !cmd) {
  console.log(HELP);
  process.exit(0);
}
switch (cmd) {
  case "init": cmdInit(rest.join(" ")); break;
  case "status": cmdStatus(rest[0]); break;
  default:
    console.error(JSON.stringify({ ok: false, code: "E_CMD", error: `unknown command: ${cmd}` }));
    console.error(HELP);
    process.exit(2);
}
