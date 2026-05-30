#!/usr/bin/env bun
/**
 * render-xhs-card.ts — 小红书配图「第一步」：把文案填进 HTML 模板 → 截图成 3:4 PNG（0 崩字、可控）。
 *
 * 这是两步配图流程的第 1 步（确认文案）：HTML 渲染，免费、中文 100% 可靠。
 * 第 2 步（确认后 AI 出底图，EvoLink gpt-image-2）由 imagegen 适配位负责，本脚本不碰。
 *
 * 用法：
 *   bun run render-xhs-card.ts --venture <slug> --template swiss-data --in card.json [--out card-1] [--no-shot]
 *   cat card.json | bun run render-xhs-card.ts --venture <slug> --template editorial
 *
 * card.json = 模板占位的取值表，例（swiss-data）：
 *   { "KICKER":"FAKE-DOOR 验证", "TITLE":"...", "HERO_NUM":"5", "HERO_LABEL":"...",
 *     "R1_LABEL":"访问","R1_VALUE":"1,203","R1_PCT":"100", ... , "META":"Lumi Lab" }
 *
 * 行为：
 *   1. 读 assets/xhs-templates/<template>.html，填 {{KEY}}（未填的占位清空，并在 stderr 列出）。
 *   2. 注入 venture 的 design_direction.json 配色（accent/neutral/primary → --accent/--paper/--ink）。
 *   3. 写 content/xhs/<out>.html，并用系统 Chrome 截图 → content/xhs/<out>.png（600×800 @1.8 = 1080×1440）。
 *      无浏览器时只写 HTML，提示宿主自行截图（best-effort，不崩）。
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { spawnSync } from 'child_process';

interface Args { venture?: string; template: string; in?: string; out?: string; shot: boolean; ratio: string; }

// 画布比例 → CSS 尺寸（宽固定 600，× 1.8 导出）。3:4=小红书；1:1=朋友圈方图；4:5/9:16 备用。
const RATIO_SIZE: Record<string, [number, number]> = {
  '3:4': [600, 800],   // 小红书默认 → 1080×1440
  '1:1': [600, 600],   // 朋友圈方图  → 1080×1080
  '4:5': [600, 750],   // IG/朋友圈竖 → 1080×1350
  '9:16': [600, 1067], // 故事/竖屏   → 1080×1920
  'long': [600, 0],    // 活动长图：高随内容（两步测高再截），0 = auto
};

function parseArgs(argv: string[]): Args {
  const a: Args = { template: 'swiss-data', shot: true, ratio: '3:4' };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (k === '--venture') a.venture = argv[++i];
    else if (k === '--template') a.template = argv[++i];
    else if (k === '--in') a.in = argv[++i];
    else if (k === '--out') a.out = argv[++i];
    else if (k === '--ratio') a.ratio = argv[++i];
    else if (k === '--no-shot') a.shot = false;
  }
  if (!RATIO_SIZE[a.ratio]) { console.error(`✗ --ratio 仅支持 ${Object.keys(RATIO_SIZE).join('/')}`); process.exit(2); }
  return a;
}

function readSlots(path?: string): Record<string, string> {
  let raw = '';
  if (path) {
    if (!existsSync(path)) { console.error(`✗ --in 不存在：${path}`); process.exit(2); }
    raw = readFileSync(path, 'utf-8');
  } else {
    try { raw = readFileSync(0, 'utf-8'); } catch { raw = ''; }
  }
  raw = raw.trim();
  if (!raw) { console.error('✗ 没有占位取值（--in <card.json> 或 stdin）'); process.exit(2); }
  try {
    const o = JSON.parse(raw);
    if (o && typeof o === 'object' && !Array.isArray(o)) {
      const m: Record<string, string> = {};
      for (const [k, v] of Object.entries(o)) m[k] = v == null ? '' : String(v);
      return m;
    }
  } catch (e) { console.error(`✗ card.json 不是合法对象：${(e as Error).message}`); process.exit(2); }
  console.error('✗ card.json 必须是 {KEY: value} 对象'); process.exit(2);
}

// design_direction.json: { palette:{accent,neutral,primary} } 或顶层 {accent,neutral,primary}
function colorOverride(ventureDir: string): string {
  const p = join(ventureDir, 'design_direction.json');
  if (!existsSync(p)) return '';
  try {
    const dd = JSON.parse(readFileSync(p, 'utf-8'));
    const pal = dd.palette ?? dd;
    const map: Record<string, string> = {};
    if (pal.accent) map['--accent'] = pal.accent;
    if (pal.neutral) map['--paper'] = pal.neutral;
    if (pal.primary) map['--ink'] = pal.primary;
    const decls = Object.entries(map).map(([k, v]) => `${k}:${v}`).join(';');
    return decls ? `:root{${decls}}` : '';
  } catch { return ''; }
}

// 导出态：去掉预览用的 body 深底/内边距 + 卡片圆角/阴影，让窗口截图 = 纯卡片（满血出血）。
const EXPORT_CSS = `html,body{margin:0;padding:0;background:#fff}body{display:block!important}.card{border-radius:0!important;box-shadow:none!important}`;

function fill(tpl: string, slots: Record<string, string>): { html: string; missing: string[] } {
  let html = tpl;
  const used = new Set<string>();
  for (const [k, v] of Object.entries(slots)) {
    const re = new RegExp('\\{\\{' + k + '\\}\\}', 'g');
    if (re.test(html)) used.add(k);
    html = html.replace(re, v);
  }
  // 收集仍未填充的占位 → 列出 + 清空（绝不让 {{X}} 出现在成图上）
  const missing = Array.from(new Set((html.match(/\{\{([A-Z0-9_]+)\}\}/g) ?? []).map((s) => s.slice(2, -2))));
  html = html.replace(/\{\{[A-Z0-9_]+\}\}/g, '');
  return { html, missing };
}

function injectHead(html: string, css: string): string {
  if (!css) return html;
  const tag = `<style data-injected>${css}</style>`;
  return html.includes('</head>') ? html.replace('</head>', tag + '\n</head>') : tag + html;
}

function findBrowser(): string | null {
  const candidates = [
    process.env.LUMILAB_CHROME,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  ].filter(Boolean) as string[];
  for (const c of candidates) if (existsSync(c)) return c;
  for (const name of ['google-chrome', 'chromium', 'chromium-browser', 'chrome']) {
    const r = spawnSync('command', ['-v', name], { shell: true, encoding: 'utf-8' });
    if (r.status === 0 && r.stdout.trim()) return r.stdout.trim();
  }
  return null;
}

function screenshot(browser: string, htmlPath: string, pngPath: string, cssW: number, cssH: number): boolean {
  // CSS 尺寸 × 1.8 → 导出分辨率（如 600×800 → 1080×1440）
  spawnSync(browser, [
    '--headless=new', '--hide-scrollbars', '--no-sandbox',
    '--force-device-scale-factor=1.8', `--window-size=${cssW},${cssH}`,
    '--default-background-color=00000000', '--virtual-time-budget=1500',
    `--screenshot=${pngPath}`, `file://${htmlPath}`,
  ], { encoding: 'utf-8', timeout: 60000 });
  return existsSync(pngPath);
}

// 活动长图：第一步 --dump-dom 读模板写进 <title> 的卡片真实高度，第二步按该高度截整图。
function measureCardHeight(browser: string, htmlPath: string, cssW: number): number {
  const r = spawnSync(browser, [
    '--headless=new', '--no-sandbox', `--window-size=${cssW},1200`,
    '--virtual-time-budget=1500', '--dump-dom', `file://${htmlPath}`,
  ], { encoding: 'utf-8', timeout: 60000, maxBuffer: 32 * 1024 * 1024 });
  const m = (r.stdout || '').match(/H:(\d+)/);
  return m ? parseInt(m[1], 10) : 0;
}

function screenshotLong(browser: string, htmlPath: string, pngPath: string, cssW: number): { ok: boolean; cssH: number } {
  let cssH = measureCardHeight(browser, htmlPath, cssW);
  if (!cssH || cssH < 200) cssH = 2200; // 测高失败兜底
  screenshot(browser, htmlPath, pngPath, cssW, cssH);
  return { ok: existsSync(pngPath), cssH };
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const tplPath = join(import.meta.dir, '..', 'assets', 'xhs-templates', `${args.template}.html`);
  if (!existsSync(tplPath)) { console.error(`✗ 模板不存在：${args.template}（见 assets/xhs-templates/catalog.json）`); process.exit(2); }
  const slots = readSlots(args.in);

  const home = process.env.LUMILAB_HOME ?? join(homedir(), '.lumilab');
  if (!args.venture) { console.error('✗ 缺 --venture'); process.exit(2); }
  const ventureDir = join(home, 'data', 'ventures', args.venture);
  const outDir = join(ventureDir, 'content', 'xhs');
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

  const [cssW, cssH] = RATIO_SIZE[args.ratio];
  const isLong = args.ratio === 'long';
  // 长图只锁宽、高随内容；固定比例锁宽高。
  const sizeCss = isLong ? `.card{width:${cssW}px!important}` : `.card{width:${cssW}px!important;height:${cssH}px!important}`;
  const tpl = readFileSync(tplPath, 'utf-8');
  const { html: filled, missing } = fill(tpl, slots);
  const withHead = injectHead(filled, [colorOverride(ventureDir), EXPORT_CSS, sizeCss].filter(Boolean).join('\n'));

  const base = args.out ?? `${args.template}-1`;
  const htmlPath = join(outDir, `${base}.html`);
  const pngPath = join(outDir, `${base}.png`);
  writeFileSync(htmlPath, withHead);

  if (missing.length) console.error(`⚠️  未填充的占位（已清空，请补全后重渲）：${missing.join(', ')}`);

  if (!args.shot) { console.log(`✓ 已写 HTML（--no-shot）→ ${htmlPath}`); return; }
  const browser = findBrowser();
  if (!browser) {
    console.log(`✓ 已写 HTML → ${htmlPath}`);
    console.error('⚠️  未找到系统 Chrome/Chromium/Edge —— 跳过截图。设 LUMILAB_CHROME=<浏览器路径> 或让宿主对该 HTML 截图（视口 600×800，scale 1.8 → 1080×1440）。');
    return;
  }
  const r = isLong ? screenshotLong(browser, htmlPath, pngPath, cssW) : { ok: screenshot(browser, htmlPath, pngPath, cssW, cssH), cssH };
  if (r.ok) {
    const label = isLong ? `活动长图 ${Math.round(cssW * 1.8)}×${Math.round(r.cssH * 1.8)}（高随内容）` : `封面 ${Math.round(cssW * 1.8)}×${Math.round(cssH * 1.8)}，${args.ratio}`;
    console.log(`✓ 已生成 → ${pngPath}（${label}）`);
    if (!isLong) console.log(`  文案确认无误后，可对此图跑第二步 AI 出底图（EvoLink gpt-image-2）。`);
  } else {
    console.log(`✓ 已写 HTML → ${htmlPath}`);
    console.error('✗ 截图失败（浏览器返回异常）。可手动对 HTML 截图。');
    process.exit(1);
  }
}

main();
