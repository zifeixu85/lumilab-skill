#!/usr/bin/env bun
/**
 * lumilab weekly retro — interactive HTML form for the weekly retrospective.
 *
 * Usage:
 *   bun run scripts/weekly-retro.ts <venture-dir>
 *
 * Starts a local server on http://127.0.0.1:7779, opens the page in the default
 * browser, and writes the form output to <venture-dir>/research/retro-<ISO>.yaml.
 *
 * Chat-only fallback (LUMILAB_CHANNEL set and not 'local'): prints a structured
 * text form to stdout instead of launching the browser.
 */
import { writeFileSync, existsSync, mkdirSync, readFileSync } from 'fs';
import { join, resolve } from 'path';
import { spawn } from 'child_process';

const ventureDir = resolve(process.argv[2] ?? '');
if (!ventureDir || !existsSync(ventureDir)) {
  console.error('用法：weekly-retro <venture-dir>');
  process.exit(1);
}

const venture = ventureDir.split('/').pop()!;
const channel = process.env.LUMILAB_CHANNEL ?? 'local';

if (channel !== 'local') {
  // Chat-only fallback: emit structured prompts
  console.log(`# 周复盘 · ${venture}\n`);
  console.log(`本 skill 在 chat 环境运行。请按以下 4 个桶填写，每条独立一行：\n`);
  console.log(`## 强信号（强证据，应放大）`);
  console.log(`- ...\n`);
  console.log(`## 中信号（值得继续观察）`);
  console.log(`- ...\n`);
  console.log(`## 弱信号（数据噪音，但记录）`);
  console.log(`- ...\n`);
  console.log(`## 已迭代（本周已动手调整）`);
  console.log(`- ...\n`);
  console.log(`填完粘给 agent，agent 会写入 ${venture}/research/retro-<ts>.yaml`);
  process.exit(0);
}

const PORT = Number(process.env.LUMILAB_RETRO_PORT ?? 7779);

// Load hypotheses + decisions as context for the page
let hypotheses = '';
let decisions = '';
try { hypotheses = readFileSync(join(ventureDir, 'hypotheses.yaml'), 'utf-8'); } catch {}
try { decisions = readFileSync(join(ventureDir, 'decisions.yaml'), 'utf-8'); } catch {}

const HTML = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<title>周复盘 · ${venture}</title>
<style>
  :root {
    --bg: oklch(96.5% 0.01 80);
    --fg: oklch(22% 0.02 30);
    --muted: oklch(50% 0.02 40);
    --line: oklch(80% 0.02 70);
    --accent: oklch(48% 0.15 25);   /* 牛血色 */
    --strong: oklch(64% 0.16 145);  /* 苔藓绿 */
    --mid: oklch(70% 0.14 85);      /* 沙黄 */
    --weak: oklch(60% 0.04 250);    /* 灰蓝 */
    --iter: oklch(55% 0.12 320);    /* 紫罗兰 */
    --paper: oklch(99% 0.005 80);
    --radius: 10px;
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; background: var(--bg); color: var(--fg); font-family: 'Fraunces', 'Source Han Serif SC', Georgia, serif; }
  body { padding: 40px 28px; max-width: 980px; margin: 0 auto; }
  header { border-bottom: 1px solid var(--line); padding-bottom: 18px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: baseline; }
  h1 { margin: 0; font-size: 28px; font-weight: 500; letter-spacing: -0.01em; }
  .sub { font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 12px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.08em; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  .bucket { background: var(--paper); border: 1px solid var(--line); border-radius: var(--radius); padding: 18px; }
  .bucket header { border-bottom: none; padding: 0 0 10px 0; margin: 0 0 12px 0; display: flex; align-items: center; gap: 10px; }
  .bucket h2 { margin: 0; font-size: 17px; font-weight: 600; font-family: 'JetBrains Mono', ui-monospace, monospace; }
  .dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
  .b-strong { border-left: 4px solid var(--strong); }
  .b-mid    { border-left: 4px solid var(--mid); }
  .b-weak   { border-left: 4px solid var(--weak); }
  .b-iter   { border-left: 4px solid var(--iter); }
  .b-strong .dot { background: var(--strong); }
  .b-mid    .dot { background: var(--mid); }
  .b-weak   .dot { background: var(--weak); }
  .b-iter   .dot { background: var(--iter); }
  .hint { font-size: 12px; color: var(--muted); margin: 0 0 12px 0; line-height: 1.5; }
  textarea {
    width: 100%; min-height: 140px; resize: vertical;
    border: 1px solid var(--line); border-radius: 6px;
    padding: 10px 12px; font-family: 'JetBrains Mono', ui-monospace, monospace;
    font-size: 13px; line-height: 1.55; background: var(--bg); color: var(--fg);
    transition: border-color .15s, box-shadow .15s;
  }
  textarea:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px oklch(48% 0.15 25 / 0.12); }
  .ctx { font-size: 12px; color: var(--muted); white-space: pre-wrap; max-height: 110px; overflow-y: auto;
         font-family: 'JetBrains Mono', ui-monospace, monospace; background: oklch(94% 0.005 80); padding: 10px 12px;
         border-radius: 6px; border: 1px solid var(--line); margin: 8px 0 18px; }
  .meta { margin-top: 30px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; }
  .meta label { font-size: 12px; color: var(--muted); font-family: 'JetBrains Mono', ui-monospace, monospace; text-transform: uppercase; letter-spacing: 0.08em; }
  .meta input { display: block; margin-top: 4px; width: 100%; padding: 8px 10px; border: 1px solid var(--line); border-radius: 6px; font-family: inherit; font-size: 14px; background: var(--bg); }
  .actions { margin-top: 30px; display: flex; gap: 12px; align-items: center; }
  button { font-family: inherit; font-size: 14px; padding: 10px 22px; border-radius: 8px; cursor: pointer; border: none; }
  .primary { background: var(--accent); color: var(--paper); }
  .primary:hover { filter: brightness(0.92); }
  .ghost { background: transparent; border: 1px solid var(--line); color: var(--fg); }
  #status { font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 12px; color: var(--muted); }
  details { margin-bottom: 10px; }
  summary { cursor: pointer; font-size: 12px; color: var(--accent); user-select: none; font-family: 'JetBrains Mono', ui-monospace, monospace; }
</style>
</head>
<body>
  <header>
    <h1>周复盘 · ${venture}</h1>
    <span class="sub">Weekly Retro · ${new Date().toISOString().slice(0,10)}</span>
  </header>

  <details>
    <summary>查看本周假设 / 决策（参考用）</summary>
    <div class="ctx">${escapeHtml(hypotheses || '(无 hypotheses.yaml)')}</div>
    <div class="ctx">${escapeHtml(decisions || '(无 decisions.yaml)')}</div>
  </details>

  <p class="hint">每条独立一行，无需 Markdown。「强信号」= 多源 ≥ 3 个证据；「中信号」= 单源但具体；「弱信号」= 噪音但值得记录；「已迭代」= 本周已动手调整。</p>

  <div class="grid">
    <section class="bucket b-strong">
      <header><span class="dot"></span><h2>强信号 · strong</h2></header>
      <p class="hint">放大它，下周倾斜资源</p>
      <textarea id="strong" placeholder="- 早上 5 个用户访谈中 4 个提到「找模板」是最大阻塞&#10;- ..."></textarea>
    </section>

    <section class="bucket b-mid">
      <header><span class="dot"></span><h2>中信号 · mid</h2></header>
      <p class="hint">继续观察，下周拿到更多证据</p>
      <textarea id="mid" placeholder="- 小红书一条笔记 800 收藏，但样本太少&#10;- ..."></textarea>
    </section>

    <section class="bucket b-weak">
      <header><span class="dot"></span><h2>弱信号 · weak</h2></header>
      <p class="hint">先记录，不投入</p>
      <textarea id="weak" placeholder="- 一个用户提到价格敏感，无法确认是普遍&#10;- ..."></textarea>
    </section>

    <section class="bucket b-iter">
      <header><span class="dot"></span><h2>已迭代 · iterated</h2></header>
      <p class="hint">本周已动手的调整</p>
      <textarea id="iter" placeholder="- Landing 第二屏从「功能列表」改为「3 个真实使用场景」&#10;- ..."></textarea>
    </section>
  </div>

  <div class="meta">
    <div><label>本周 Day</label><input id="day" value="Day 7 / 7"></div>
    <div><label>下周计划方向</label><input id="next" placeholder="放大「找模板」假设"></div>
    <div><label>本周关键决策</label><input id="decision" placeholder="pivot 还是 persevere"></div>
  </div>

  <div class="actions">
    <button class="primary" id="save">保存到 venture</button>
    <button class="ghost" id="copy">复制 YAML</button>
    <span id="status"></span>
  </div>

<script>
  const $ = id => document.getElementById(id);
  function buildYAML() {
    const parse = id => $(id).value.split(/\\r?\\n/).map(l => l.replace(/^[-*]\\s*/, '').trim()).filter(Boolean);
    return {
      venture: ${JSON.stringify(venture)},
      day: $('day').value.trim(),
      next_direction: $('next').value.trim(),
      key_decision: $('decision').value.trim(),
      strong: parse('strong'),
      mid:    parse('mid'),
      weak:   parse('weak'),
      iterated: parse('iter'),
      created_at: new Date().toISOString(),
    };
  }
  function yamlEncode(obj) {
    const lines = [];
    for (const [k, v] of Object.entries(obj)) {
      if (Array.isArray(v)) {
        lines.push(k + ':');
        if (v.length === 0) lines.push('  []');
        else v.forEach(x => lines.push('  - ' + JSON.stringify(x)));
      } else {
        lines.push(k + ': ' + JSON.stringify(v));
      }
    }
    return lines.join('\\n');
  }
  $('save').addEventListener('click', async () => {
    const data = buildYAML();
    const r = await fetch('/save', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(data) });
    const j = await r.json();
    $('status').textContent = j.ok ? '✓ 保存到 ' + j.path : '✗ ' + (j.error || '失败');
  });
  $('copy').addEventListener('click', async () => {
    const data = buildYAML();
    await navigator.clipboard.writeText(yamlEncode(data));
    $('status').textContent = '✓ 已复制 YAML';
  });
</script>
</body></html>`;

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

const server = Bun.serve({
  port: PORT,
  hostname: '127.0.0.1',
  async fetch(req) {
    const url = new URL(req.url);
    if (req.method === 'GET' && url.pathname === '/') {
      return new Response(HTML, { headers: { 'content-type': 'text/html; charset=utf-8' } });
    }
    if (req.method === 'POST' && url.pathname === '/save') {
      const body = await req.json() as any;
      const ts = new Date().toISOString().replace(/[:.]/g, '-');
      const outDir = join(ventureDir, 'research');
      if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
      const outPath = join(outDir, `retro-${ts}.yaml`);
      const yaml = [
        `# weekly retro · ${body.venture} · ${body.created_at}`,
        `venture: ${JSON.stringify(body.venture)}`,
        `day: ${JSON.stringify(body.day)}`,
        `next_direction: ${JSON.stringify(body.next_direction)}`,
        `key_decision: ${JSON.stringify(body.key_decision)}`,
        ...['strong','mid','weak','iterated'].flatMap(k => [
          `${k}:`,
          ...(body[k]?.length ? body[k].map((x:string)=>`  - ${JSON.stringify(x)}`) : ['  []']),
        ]),
      ].join('\n') + '\n';
      writeFileSync(outPath, yaml);
      return Response.json({ ok: true, path: outPath });
    }
    return new Response('Not found', { status: 404 });
  },
});

const url = `http://127.0.0.1:${PORT}/`;
console.log(`✓ 周复盘已就绪：${url}`);
spawn('open', [url]).on('error', () => {});

// graceful exit
process.on('SIGINT', () => { server.stop(); process.exit(0); });
