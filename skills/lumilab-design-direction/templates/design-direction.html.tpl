<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>设计方向 · {{VENTURE_SLUG}}</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@300..700&family=JetBrains+Mono:wght@400..600&family=Fraunces:ital,wght@0,400..700;1,400..700&family=Cabinet+Grotesk:wght@500;700&display=swap" rel="stylesheet" />
<style>
  :root {
    --color-bg:        oklch(97% 0.012 80);
    --color-bg-2:      oklch(95% 0.014 80);
    --color-surface:   oklch(99.5% 0.006 80);
    --color-ink:       oklch(18% 0.018 60);
    --color-ink-2:     oklch(35% 0.015 60);
    --color-mute:      oklch(58% 0.012 60);
    --color-hairline:  oklch(86% 0.012 60);
    --color-accent:    oklch(42% 0.16 28);
    --color-accent-2:  oklch(95% 0.04 28);
    --font-sans:   "Geist", ui-sans-serif, system-ui, sans-serif;
    --font-mono:   "JetBrains Mono", ui-monospace, monospace;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { height: 100%; }
  body {
    font-family: var(--font-sans);
    background: var(--color-bg);
    color: var(--color-ink);
    min-height: 100dvh;
    display: grid;
    grid-template-columns: minmax(380px, 460px) 1fr;
    font-size: 0.9rem;
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
  }

  aside.controls {
    border-right: 1px solid var(--color-hairline);
    overflow-y: auto;
    height: 100dvh;
    padding: 1rem 1.25rem 0;
    background: var(--color-surface);
    display: flex;
    flex-direction: column;
  }

  main.preview {
    position: sticky;
    top: 0;
    height: 100dvh;
    display: grid;
    place-content: center;
    padding: 2rem;
    background: var(--color-bg);
  }

  .preview-frame {
    width: min(900px, 88vw);
    height: 80vh;
    border: 1px solid var(--color-hairline);
    background: white;
    box-shadow: 0 1px 0 var(--color-hairline);
  }

  .head {
    font-family: var(--font-mono);
    font-size: 0.7rem;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--color-mute);
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 0.85rem;
    border-bottom: 1px solid var(--color-hairline);
  }
  .head .title { color: var(--color-ink); }
  .head .venture { color: var(--color-accent); }

  .group {
    border-top: 1px solid var(--color-hairline);
    padding: 1rem 0;
  }
  .group:first-of-type {
    border-top: 0;
    padding-top: 1rem;
  }

  .group-label {
    font-family: var(--font-mono);
    font-size: 0.68rem;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--color-mute);
    margin-bottom: 0.75rem;
  }

  .preset-row {
    display: grid;
    grid-template-columns: 1.25rem 5.5rem 1fr;
    gap: 0.6rem;
    align-items: center;
    padding: 0.45rem 0.5rem;
    cursor: pointer;
    transition: background 100ms;
  }
  .preset-row:hover { background: var(--color-bg-2); }
  .preset-row.selected { background: var(--color-accent-2); }
  .preset-row .dot {
    width: 10px; height: 10px; border-radius: 50%;
    border: 1px solid var(--color-mute);
    background: transparent;
    transition: all 100ms;
  }
  .preset-row.selected .dot {
    background: var(--color-accent);
    border-color: var(--color-accent);
    box-shadow: 0 0 0 3px var(--color-accent-2);
  }
  .preset-row .name {
    font-family: var(--font-mono);
    font-size: 0.82rem;
    color: var(--color-ink);
  }
  .preset-row .desc {
    font-size: 0.78rem;
    color: var(--color-mute);
  }

  .dial { margin-bottom: 0.95rem; }
  .dial:last-child { margin-bottom: 0; }
  .dial-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 0.3rem;
  }
  .dial-label {
    font-size: 0.82rem;
    font-weight: 500;
    color: var(--color-ink);
  }
  .dial-value {
    font-family: var(--font-mono);
    font-size: 0.85rem;
    color: var(--color-accent);
    font-weight: 500;
    min-width: 1.5em;
    text-align: right;
  }
  .dial input[type="range"] {
    width: 100%;
    margin: 0;
    accent-color: var(--color-accent);
    height: 4px;
    cursor: pointer;
  }
  .dial-ends {
    display: flex;
    justify-content: space-between;
    font-family: var(--font-mono);
    font-size: 0.65rem;
    letter-spacing: 0.08em;
    color: var(--color-mute);
    margin-top: 0.2rem;
  }

  .palette-row { margin-bottom: 0.5rem; }
  .palette-row:last-child { margin-bottom: 0; }
  .palette-row-label {
    font-size: 0.78rem;
    color: var(--color-ink-2);
    margin-bottom: 0.35rem;
  }
  .palette {
    display: flex;
    gap: 0.55rem;
    align-items: center;
  }
  .palette-dot {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    cursor: pointer;
    border: 2px solid transparent;
    transition: transform 100ms, border-color 100ms;
    padding: 0;
  }
  .palette-dot:hover { transform: scale(1.12); }
  .palette-dot.selected { border-color: var(--color-ink); }
  .palette-dot[disabled] { cursor: not-allowed; opacity: 0.35; }
  .palette-dot[disabled]:hover { transform: none; }
  .palette-value {
    font-family: var(--font-mono);
    font-size: 0.72rem;
    color: var(--color-mute);
    margin-top: 0.4rem;
    user-select: all;
  }
  .palette-names {
    font-family: var(--font-mono);
    font-size: 0.65rem;
    letter-spacing: 0.06em;
    color: var(--color-mute);
    margin-top: 0.2rem;
  }
  .palette-locked {
    font-family: var(--font-mono);
    font-size: 0.7rem;
    color: oklch(50% 0.18 28);
    margin-top: 0.35rem;
    letter-spacing: 0.04em;
  }
  .palette-locked.hidden { display: none; }

  .typo-row {
    display: grid;
    grid-template-columns: 4.2rem 1fr;
    gap: 0.5rem;
    align-items: center;
    margin-bottom: 0.45rem;
    font-size: 0.8rem;
  }
  .typo-row:last-child { margin-bottom: 0; }
  .typo-row .lbl {
    font-family: var(--font-mono);
    font-size: 0.72rem;
    color: var(--color-mute);
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .typo-choices {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
  }
  .typo-choice {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.25rem 0.55rem;
    border: 1px solid var(--color-hairline);
    background: var(--color-surface);
    cursor: pointer;
    font-size: 0.78rem;
    transition: all 100ms;
    user-select: none;
  }
  .typo-choice:hover { border-color: var(--color-mute); }
  .typo-choice.selected {
    background: var(--color-ink);
    color: var(--color-bg);
    border-color: var(--color-ink);
  }

  .meta {
    font-family: var(--font-mono);
    font-size: 0.7rem;
    color: var(--color-mute);
    padding: 0.85rem 0 1rem;
    border-top: 1px solid var(--color-hairline);
    margin-top: auto;
  }
  .meta-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.3rem;
  }

  .save-status {
    font-family: var(--font-mono);
    font-size: 0.74rem;
    color: var(--color-mute);
    padding: 0.4rem 0;
    min-height: 1.6rem;
  }
  .save-status.ok { color: var(--color-accent); }
  .save-status.err { color: oklch(50% 0.18 28); }

  .actions {
    position: sticky;
    bottom: 0;
    background: var(--color-surface);
    border-top: 1px solid var(--color-hairline);
    padding: 0.75rem 1.25rem;
    display: flex;
    gap: 0.6rem;
    justify-content: flex-end;
    align-items: center;
    margin: 0 -1.25rem;
  }
  button {
    font-family: var(--font-sans);
    font-size: 0.85rem;
    padding: 0 1rem;
    border-radius: 0;
    cursor: pointer;
    height: 36px;
    font-weight: 500;
    transition: all 100ms;
  }
  button.primary {
    background: var(--color-ink);
    color: var(--color-bg);
    border: 1px solid var(--color-ink);
  }
  button.primary:hover { background: var(--color-ink-2); }
  button.primary:active { transform: translateY(1px); }
  button.primary:disabled { opacity: 0.5; cursor: wait; }
  button.ghost {
    background: transparent;
    color: var(--color-ink);
    border: 1px solid var(--color-hairline);
  }
  button.ghost:hover { border-color: var(--color-mute); }

  @media (max-width: 900px) {
    body { grid-template-columns: 1fr; }
    aside.controls { height: auto; border-right: 0; border-bottom: 1px solid var(--color-hairline); }
    main.preview { position: static; height: 70vh; }
    .preview-frame { height: 60vh; width: 100%; }
  }

  :focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }
  input[type="range"]:focus-visible { outline-offset: 4px; }
</style>
</head>
<body>

<aside class="controls">

  <div class="head">
    <span class="title">设计方向</span>
    <span class="venture">{{VENTURE_SLUG}}</span>
  </div>

  <div class="group">
    <div class="group-label">美学预设</div>
    <div id="presets" role="radiogroup" aria-label="预设"></div>
  </div>

  <div class="group">
    <div class="group-label">调节器</div>
    <div class="dial">
      <div class="dial-header">
        <span class="dial-label">差异度</span>
        <span class="dial-value" id="val-variance">6</span>
      </div>
      <input type="range" min="1" max="10" step="1" id="dial-variance" />
      <div class="dial-ends"><span>对称</span><span>不对称</span></div>
    </div>
    <div class="dial">
      <div class="dial-header">
        <span class="dial-label">动感强度</span>
        <span class="dial-value" id="val-motion">5</span>
      </div>
      <input type="range" min="1" max="10" step="1" id="dial-motion" />
      <div class="dial-ends"><span>静态</span><span>电影感</span></div>
    </div>
    <div class="dial">
      <div class="dial-header">
        <span class="dial-label">信息密度</span>
        <span class="dial-value" id="val-density">4</span>
      </div>
      <input type="range" min="1" max="10" step="1" id="dial-density" />
      <div class="dial-ends"><span>留白多</span><span>紧凑</span></div>
    </div>
  </div>

  <div class="group">
    <div class="group-label">主题色</div>
    <div class="palette-row">
      <div class="palette-row-label">主题色</div>
      <div class="palette" id="palette-accent"></div>
      <div class="palette-value" id="palette-accent-value">oklch(42% 0.16 28)</div>
      <div class="palette-names" id="palette-names">9 色覆盖红 / 橙 / 绿 / 蓝 / 紫 / 中性</div>
      <div class="palette-locked hidden" id="palette-locked">粗野主义不可调色 · 固定纯黄 + 纯黑</div>
    </div>
  </div>

  <div class="group">
    <div class="group-label">字体</div>
    <div class="typo-row">
      <span class="lbl">标题字</span>
      <div class="typo-choices" data-typo="display"></div>
    </div>
    <div class="typo-row">
      <span class="lbl">正文字</span>
      <div class="typo-choices" data-typo="body"></div>
    </div>
    <div class="typo-row">
      <span class="lbl">等宽字</span>
      <div class="typo-choices" data-typo="mono"></div>
    </div>
  </div>

  <div class="meta">
    <div class="meta-row"><span>保存时间</span><span id="meta-decided">—</span></div>
    <div class="meta-row"><span>预设</span><span id="meta-preset">—</span></div>
  </div>

  <div class="save-status" id="save-status">&nbsp;</div>

  <div class="actions">
    <button class="ghost" id="btn-cancel" type="button">取消</button>
    <button class="primary" id="btn-save" type="button">保存并继续 &rarr;</button>
  </div>

</aside>

<main class="preview">
  <iframe id="preview" class="preview-frame" sandbox="allow-same-origin" title="实时预览"></iframe>
</main>

<script>
(function () {
  "use strict";

  const VENTURE = {{CURRENT_JSON}};
  const VENTURE_SLUG = "{{VENTURE_SLUG}}";

  const PRESETS = [
    { id: "editorial",   name: "编辑磁带",   desc: "衬线 + 暖纸色" },
    { id: "minimalist",  name: "极简主义",   desc: "黑白 + 网格" },
    { id: "brutalist",   name: "粗野主义",   desc: "高对比 + 棱角" },
    { id: "soft",        name: "柔和米色",   desc: "浅色 + 圆角" },
  ];

  const ACCENT_PALETTE = [
    { id: "oxblood",  label: "牛血红",   value: "oklch(42% 0.16 28)"   },
    { id: "crimson",  label: "正红",     value: "oklch(50% 0.22 25)"   },
    { id: "amber",    label: "琥珀",     value: "oklch(65% 0.16 75)"   },
    { id: "moss",     label: "苔绿",     value: "oklch(40% 0.10 145)"  },
    { id: "forest",   label: "森林绿",   value: "oklch(35% 0.14 155)"  },
    { id: "sea",      label: "深海蓝",   value: "oklch(40% 0.13 245)"  },
    { id: "royal",    label: "皇家蓝",   value: "oklch(38% 0.20 265)"  },
    { id: "plum",     label: "梅紫",     value: "oklch(38% 0.15 320)"  },
    { id: "charcoal", label: "炭黑",     value: "oklch(22% 0.01 60)"   },
  ];

  // 粗野主义固定色：纯黄底 + 纯黑前景，accent 不可调
  const BRUTALIST_FIXED_ACCENT = "oklch(8% 0 0)";
  const BRUTALIST_BG = "oklch(85% 0.18 95)";

  const TYPO_OPTIONS = {
    display: ["Geist", "Fraunces", "Cabinet Grotesk"],
    body:    ["Geist", "Fraunces", "system"],
    mono:    ["JetBrains Mono", "Geist Mono", "system"],
  };

  const state = {
    preset: "minimalist",
    dials: { variance: 6, motion: 5, density: 4 },
    palette: {
      primary: "oklch(18% 0.018 60)",
      accent: "oklch(42% 0.16 28)",
      neutral: "oklch(97% 0.012 80)",
    },
    typography: { display: "Geist", body: "Geist", mono: "JetBrains Mono" },
    decided_at: null,
  };

  if (VENTURE && typeof VENTURE === "object") {
    if (VENTURE.preset) state.preset = VENTURE.preset;
    if (VENTURE.dials) state.dials = Object.assign({}, state.dials, VENTURE.dials);
    if (VENTURE.palette) state.palette = Object.assign({}, state.palette, VENTURE.palette);
    if (VENTURE.typography) state.typography = Object.assign({}, state.typography, VENTURE.typography);
    if (VENTURE.decided_at) state.decided_at = VENTURE.decided_at;
  }

  const $ = (id) => document.getElementById(id);
  const presetsEl = $("presets");
  const paletteEl = $("palette-accent");
  const paletteValueEl = $("palette-accent-value");
  const previewEl = $("preview");
  const saveStatus = $("save-status");
  const btnSave = $("btn-save");
  const btnCancel = $("btn-cancel");

  function renderPresets() {
    presetsEl.innerHTML = "";
    PRESETS.forEach((p) => {
      const row = document.createElement("div");
      row.className = "preset-row" + (p.id === state.preset ? " selected" : "");
      row.setAttribute("role", "radio");
      row.setAttribute("tabindex", "0");
      row.setAttribute("aria-checked", p.id === state.preset ? "true" : "false");
      row.dataset.preset = p.id;
      row.innerHTML =
        '<span class="dot"></span>' +
        '<span class="name">' + p.name + '</span>' +
        '<span class="desc">' + p.desc + '</span>';
      row.addEventListener("click", () => selectPreset(p.id));
      row.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          selectPreset(p.id);
        }
      });
      row.addEventListener("mouseenter", () => previewHover(p.id));
      row.addEventListener("mouseleave", () => previewHover(null));
      presetsEl.appendChild(row);
    });
  }

  function selectPreset(id) {
    state.preset = id;
    if (id === "editorial") {
      state.typography = { display: "Fraunces", body: "Fraunces", mono: "JetBrains Mono" };
    } else if (id === "minimalist") {
      state.typography = { display: "Geist", body: "Geist", mono: "JetBrains Mono" };
    } else if (id === "brutalist") {
      state.typography = { display: "Cabinet Grotesk", body: "Geist", mono: "JetBrains Mono" };
    } else if (id === "soft") {
      state.typography = { display: "Geist", body: "Geist", mono: "Geist Mono" };
    }
    renderAll();
    schedulePreview();
  }

  function renderPalette() {
    const isBrutalist = state.preset === "brutalist";
    const lockedEl = $("palette-locked");
    const namesEl = $("palette-names");
    if (lockedEl) lockedEl.classList.toggle("hidden", !isBrutalist);
    if (namesEl) namesEl.style.opacity = isBrutalist ? "0.35" : "";

    paletteEl.innerHTML = "";
    ACCENT_PALETTE.forEach((p) => {
      const b = document.createElement("button");
      b.type = "button";
      const isSelected = (!isBrutalist) && (p.value === state.palette.accent);
      b.className = "palette-dot" + (isSelected ? " selected" : "");
      b.style.background = p.value;
      b.title = (p.label || p.id) + " · " + p.value;
      b.setAttribute("aria-label", p.label || p.id);
      if (isBrutalist) {
        b.disabled = true;
        b.setAttribute("disabled", "true");
      } else {
        b.addEventListener("click", () => {
          state.palette = Object.assign({}, state.palette, { accent: p.value });
          renderPalette();
          paletteValueEl.textContent = p.value;
          schedulePreview();
        });
      }
      paletteEl.appendChild(b);
    });
    paletteValueEl.textContent = isBrutalist
      ? BRUTALIST_FIXED_ACCENT + " (固定)"
      : state.palette.accent;
  }

  function fontStack(name) {
    if (name === "system") return "ui-sans-serif, system-ui, sans-serif";
    if (name === "Geist Mono") return '"JetBrains Mono", ui-monospace, monospace';
    if (name === "JetBrains Mono") return '"JetBrains Mono", ui-monospace, monospace';
    if (name === "Fraunces") return '"Fraunces", ui-serif, Georgia, serif';
    if (name === "Cabinet Grotesk") return '"Cabinet Grotesk", "Geist", system-ui, sans-serif';
    return '"Geist", ui-sans-serif, system-ui, sans-serif';
  }

  function renderTypography() {
    document.querySelectorAll(".typo-choices").forEach((wrap) => {
      const role = wrap.getAttribute("data-typo");
      const opts = TYPO_OPTIONS[role] || [];
      wrap.innerHTML = "";
      opts.forEach((font) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "typo-choice" + (state.typography[role] === font ? " selected" : "");
        b.textContent = font;
        b.style.fontFamily = fontStack(font);
        b.addEventListener("click", () => {
          state.typography = Object.assign({}, state.typography, { [role]: font });
          renderTypography();
          schedulePreview();
        });
        wrap.appendChild(b);
      });
    });
  }

  function renderDials() {
    ["variance", "motion", "density"].forEach((k) => {
      const inp = $("dial-" + k);
      const val = $("val-" + k);
      inp.value = String(state.dials[k]);
      val.textContent = String(state.dials[k]);
      inp.oninput = () => {
        const n = parseInt(inp.value, 10);
        state.dials = Object.assign({}, state.dials, { [k]: n });
        val.textContent = String(n);
        schedulePreview();
      };
    });
  }

  function renderMeta() {
    $("meta-decided").textContent = state.decided_at
      ? new Date(state.decided_at).toISOString().replace("T", " ").slice(0, 16)
      : "—";
    const presetMeta = PRESETS.find((p) => p.id === state.preset);
    $("meta-preset").textContent = presetMeta ? presetMeta.name : state.preset;
  }

  function renderAll() {
    renderPresets();
    renderPalette();
    renderTypography();
    renderDials();
    renderMeta();
  }

  let previewQueued = false;
  let hoverOverride = null;

  function schedulePreview() {
    if (previewQueued) return;
    previewQueued = true;
    requestAnimationFrame(() => {
      previewQueued = false;
      writePreview();
    });
  }

  function previewHover(presetId) {
    hoverOverride = presetId;
    schedulePreview();
  }

  function buildPreviewSrc() {
    const preset = hoverOverride || state.preset;
    const isBrutalist = preset === "brutalist";
    const accent = isBrutalist ? BRUTALIST_FIXED_ACCENT : state.palette.accent;
    const variance = state.dials.variance;   // 1..10
    const motion = state.dials.motion;       // 1..10
    const density = state.dials.density;     // 1..10
    const display = fontStack(state.typography.display);
    const body = fontStack(state.typography.body);
    const mono = fontStack(state.typography.mono);

    // ── dial → CSS variable values（明显可见的差异）──────────────────────────
    // variance: 1 完全居中 → 10 大幅左偏 30%
    const variancePct = ((variance - 1) / 9) * 30;            // 0..30 %
    const titleAlign = variance <= 2 ? "center" : "left";
    const heroAlign  = variance <= 2 ? "center" : "flex-start";
    // density: 1 巨大留白 → 10 极端紧凑
    const padRem  = (8 - (density - 1) * (7 / 9)).toFixed(2); // 8..1 rem
    const gapRem  = (2.4 - (density - 1) * (2.0 / 9)).toFixed(2); // 2.4..0.4 rem
    const lineH   = (2.0 - (density - 1) * (0.9 / 9)).toFixed(2); // 2.0..1.1
    // motion: 1 完全静止 → 10 入场 + 持续浮动
    const motionDur  = motion <= 1 ? "0ms" : ((11 - motion) * 90).toFixed(0) + "ms";
    const motionRise = motion <= 1 ? "0px" : (motion * 2).toFixed(1) + "px";
    const motionFloatPx = motion <= 4 ? 0 : (motion - 4) * 1.5; // 0..9
    const stagger = motion >= 8 ? 1 : 0;

    // ── preset 主题 CSS（每个 preset 视觉强分化）──────────────────────────
    let presetCSS = "";
    let bodyMarkup = "";
    let extraHead = "";

    if (preset === "editorial") {
      // 编辑磁带：暖奶白 + 衬线 + 非对称两栏 + hairline + 衬线箭头按钮
      const editorialFont = '"Fraunces", ui-serif, Georgia, serif';
      presetCSS = `
        body { background: oklch(96% 0.014 80); color: oklch(16% 0.02 60); }
        .stage {
          display: grid;
          grid-template-columns: 1fr 1fr;
          grid-template-rows: auto 1fr auto;
          gap: 0.4rem 2rem;
          width: 100%;
          max-width: 880px;
        }
        .masthead {
          grid-column: 1 / -1;
          display: flex; justify-content: space-between; align-items: baseline;
          padding-bottom: 0.6rem;
          border-bottom: 1px solid oklch(70% 0.012 60);
          font-family: ${mono};
          font-size: 0.68rem; letter-spacing: 0.22em; text-transform: uppercase;
          color: oklch(40% 0.015 60);
        }
        .masthead .nº { color: var(--accent); }
        .kicker {
          grid-column: 1 / 2;
          font-family: ${mono}; letter-spacing: 0.22em; text-transform: uppercase;
          font-size: 0.7rem; color: var(--accent); margin-top: 0.6rem;
        }
        .title {
          grid-column: 1 / 2;
          font-family: ${editorialFont}; font-weight: 600;
          font-size: clamp(3.5rem, 4vw + 2rem, 8rem);
          line-height: 0.98; letter-spacing: -0.02em;
          color: oklch(14% 0.02 60);
        }
        .deck {
          grid-column: 2 / 3;
          align-self: end;
          font-family: ${editorialFont}; font-style: italic; font-weight: 400;
          font-size: 1.15rem; line-height: 1.45;
          color: oklch(34% 0.015 60);
          max-width: 28em;
        }
        .cta-wrap { grid-column: 1 / -1; margin-top: 1.2rem; }
        .cta {
          font-family: ${editorialFont}; font-style: italic;
          background: transparent; border: 0; padding: 0; cursor: pointer;
          font-size: 1.1rem; color: var(--accent);
          border-bottom: 1px solid var(--accent);
          padding-bottom: 2px;
        }
        .cta:hover { letter-spacing: 0.02em; }
      `;
      bodyMarkup = `
        <section class="stage hero">
          <div class="masthead"><span>Nº 01 · 2026.05</span><span class="nº">${VENTURE_SLUG}</span></div>
          <span class="kicker">第 0 天 · 创刊号</span>
          <h1 class="title">值得上线的名字</h1>
          <p class="deck">一句话定位，让用户在读完<br/>之前就理解价值。</p>
          <div class="cta-wrap"><button class="cta">开始阅读 →</button></div>
        </section>
      `;
    } else if (preset === "minimalist") {
      // 极简：纯白 + Geist 极细 + 居中 + 8pt 网格 + 零装饰 + 方角反白按钮
      presetCSS = `
        body { background: oklch(99.5% 0.001 80); color: oklch(15% 0 0); }
        .stage {
          width: 100%; max-width: 640px;
          padding: 64px 32px;
          display: flex; flex-direction: column;
          align-items: center; text-align: center;
          gap: 32px;
        }
        .kicker {
          font-family: ${mono};
          font-size: 0.7rem; letter-spacing: 0.24em; text-transform: lowercase;
          color: oklch(40% 0 0); font-weight: 400;
        }
        .title {
          font-family: ${display}; font-weight: 300;
          font-size: clamp(2.8rem, 3vw + 1.8rem, 5rem);
          line-height: 1.05; letter-spacing: -0.03em;
          color: oklch(10% 0 0);
        }
        .deck {
          font-family: ${body}; font-weight: 400;
          font-size: 1rem; line-height: 1.5;
          color: oklch(35% 0 0); max-width: 32em;
        }
        .cta {
          font-family: ${body}; font-weight: 400;
          text-transform: lowercase;
          background: transparent;
          border: 1px solid oklch(15% 0 0);
          color: oklch(15% 0 0);
          padding: 12px 24px;
          font-size: 0.88rem;
          cursor: pointer;
          border-radius: 0;
        }
        .cta:hover { background: oklch(15% 0 0); color: oklch(99% 0 0); }
      `;
      bodyMarkup = `
        <section class="stage hero">
          <span class="kicker">${VENTURE_SLUG} / day 0</span>
          <h1 class="title">值得上线的名字</h1>
          <p class="deck">一句话定位，让用户在读完之前就理解价值。</p>
          <button class="cta">开始 →</button>
        </section>
      `;
    } else if (preset === "brutalist") {
      // 粗野：纯黄底 + 等宽粗体 ALL CAPS + 4px 黑边 + 重阴影 + glitch
      presetCSS = `
        body { background: ${BRUTALIST_BG}; color: oklch(8% 0 0); }
        .stage {
          max-width: 760px;
          padding: 1.5rem;
          border: 4px solid oklch(8% 0 0);
          background: ${BRUTALIST_BG};
          box-shadow: 10px 10px 0 oklch(8% 0 0);
          display: flex; flex-direction: column;
          align-items: flex-start;
          gap: 0.9rem;
        }
        .kicker {
          font-family: ${mono}; font-weight: 800;
          letter-spacing: 0em; text-transform: uppercase;
          font-size: 0.78rem;
          background: oklch(8% 0 0); color: ${BRUTALIST_BG};
          padding: 0.25rem 0.55rem;
        }
        .title {
          font-family: ${mono}; font-weight: 800;
          text-transform: uppercase;
          font-size: clamp(3rem, 4vw + 1.5rem, 6rem);
          line-height: 0.95; letter-spacing: -0.05em;
          color: oklch(8% 0 0);
        }
        .deck {
          font-family: ${mono}; font-weight: 500;
          text-transform: uppercase; letter-spacing: 0.02em;
          font-size: 1rem; line-height: 1.35;
          color: oklch(8% 0 0); max-width: 32em;
        }
        .cta {
          font-family: ${mono}; font-weight: 800;
          text-transform: uppercase; letter-spacing: 0.05em;
          background: oklch(8% 0 0); color: ${BRUTALIST_BG};
          padding: 0.9rem 1.4rem;
          border: 4px solid oklch(8% 0 0);
          box-shadow: 6px 6px 0 ${BRUTALIST_BG}, 6px 6px 0 4px oklch(8% 0 0);
          font-size: 0.95rem; cursor: pointer; border-radius: 0;
        }
        .cta:active { transform: translate(4px, 4px); box-shadow: 2px 2px 0 ${BRUTALIST_BG}, 2px 2px 0 4px oklch(8% 0 0); }
        @keyframes glitch {
          0%   { transform: translateX(0); }
          20%  { transform: translate(-4px, 2px); }
          40%  { transform: translate(3px, -1px); }
          60%  { transform: translate(-2px, 0); }
          100% { transform: translateX(0); }
        }
        ${motion > 1 ? ".title { animation: glitch 320ms steps(4, end) 1 both; }" : ""}
      `;
      bodyMarkup = `
        <section class="stage hero">
          <span class="kicker">${VENTURE_SLUG} // DAY 0</span>
          <h1 class="title">值得上线的名字</h1>
          <p class="deck">一句话定位，让用户在读完之前就理解价值。</p>
          <button class="cta">START NOW →</button>
        </section>
      `;
    } else {
      // soft：粉米渐变 + Geist 中等 + 居中 + 圆角卡 + pill 按钮 + 持续 micro-float
      const softAccentDesat = accent; // 用户色，CSS 里降饱和已不可逆，这里只做视觉处理
      presetCSS = `
        body {
          background: linear-gradient(135deg, oklch(95% 0.02 30), oklch(94% 0.02 60));
          color: oklch(26% 0.02 30);
        }
        .stage {
          width: 100%; max-width: 620px;
          padding: 3rem 2.5rem;
          background: oklch(99% 0.008 60 / 0.85);
          border-radius: 24px;
          box-shadow: 0 4px 24px oklch(20% 0 0 / 0.06),
                      0 1px 0 oklch(100% 0 0) inset;
          display: flex; flex-direction: column;
          align-items: center; text-align: center;
          gap: 1.1rem;
        }
        ${motion > 1 ? `body { animation: floaty ${(7 - motion * 0.3).toFixed(1)}s ease-in-out infinite; }` : ""}
        .kicker {
          font-family: ${mono}; font-weight: 500;
          letter-spacing: 0.16em; text-transform: uppercase;
          font-size: 0.68rem;
          color: var(--accent);
          opacity: 0.7;
        }
        .title {
          font-family: ${display}; font-weight: 500;
          font-size: clamp(2.6rem, 3vw + 1.6rem, 4.5rem);
          line-height: 1.08; letter-spacing: -0.025em;
          color: oklch(22% 0.02 30);
        }
        .deck {
          font-family: ${body}; font-weight: 400;
          font-size: 1.05rem; line-height: 1.6;
          color: oklch(40% 0.018 30); max-width: 28em;
        }
        .cta {
          font-family: ${body}; font-weight: 500;
          background: oklch(96% 0.025 30);
          color: oklch(28% 0.04 30);
          padding: 0.85rem 1.8rem;
          border: 1px solid oklch(86% 0.025 30);
          border-radius: 9999px;
          font-size: 0.92rem; cursor: pointer;
          transition: all 200ms ease;
        }
        .cta:hover {
          background: var(--accent);
          color: oklch(98% 0.005 60);
          border-color: var(--accent);
        }
        @keyframes floaty {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-6px); }
        }
      `;
      bodyMarkup = `
        <section class="stage hero">
          <span class="kicker">${VENTURE_SLUG} · 第 0 天</span>
          <h1 class="title">值得上线的名字</h1>
          <p class="deck">一句话定位，让用户在读完之前就理解价值。</p>
          <button class="cta">开始体验</button>
        </section>
      `;
    }

    // motion 控制：入场动画 + 持续浮动幅度 + 字母 stagger
    const motionCSS = `
      .stage.hero {
        animation-name: reveal;
        animation-duration: ${motionDur};
        animation-timing-function: cubic-bezier(0.2, 0.7, 0.2, 1);
        animation-fill-mode: both;
      }
      ${motion <= 1 ? ".stage.hero { animation: none !important; }" : ""}
      ${stagger ? `
        .title { animation: wordstagger 600ms ease-out both; }
        @keyframes wordstagger {
          from { opacity: 0; letter-spacing: 0.08em; filter: blur(4px); }
          to   { opacity: 1; letter-spacing: -0.02em; filter: blur(0); }
        }
      ` : ""}
      @keyframes reveal {
        from { opacity: 0; transform: translateY(${motionRise}); }
        to   { opacity: 1; transform: translateY(0); }
      }
    `;

    return `<!doctype html><html><head><meta charset="utf-8"/>
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@300..700&family=JetBrains+Mono:wght@400..600&family=Fraunces:ital,wght@0,400..700;1,400..700&family=Cabinet+Grotesk:wght@500;700&display=swap" rel="stylesheet"/>
${extraHead}
<style>
  :root {
    --accent: ${accent};
    --variance-shift: ${variancePct.toFixed(1)}%;
    --pad: ${padRem}rem;
    --gap: ${gapRem}rem;
    --line: ${lineH};
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { height: 100%; }
  body {
    display: grid;
    place-content: center;
    padding: var(--pad);
    overflow: hidden;
    font-family: ${body};
    line-height: var(--line);
  }
  .stage {
    text-align: ${titleAlign};
    align-items: ${heroAlign};
    margin-left: var(--variance-shift);
  }
  ${presetCSS}
  /* density 强制覆盖 preset gap / line-height，让旋钮立刻可见 */
  .stage { gap: var(--gap) !important; }
  .deck  { line-height: var(--line) !important; }
  ${motionCSS}
</style></head>
<body>
  ${bodyMarkup}
</body></html>`;
  }

  function writePreview() {
    previewEl.setAttribute("srcdoc", buildPreviewSrc());
  }

  function setStatus(msg, kind) {
    saveStatus.textContent = msg || " ";
    saveStatus.className = "save-status" + (kind ? " " + kind : "");
  }

  async function save() {
    btnSave.disabled = true;
    setStatus("保存中…", "");
    try {
      const payload = {
        venture: VENTURE_SLUG,
        preset: state.preset,
        dials: state.dials,
        palette: state.palette,
        typography: state.typography,
      };
      const r = await fetch("/api/design-direction", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.error || "保存失败");
      state.decided_at = new Date().toISOString();
      renderMeta();
      setStatus("✓ 已保存 · 即将关闭浏览器返回终端…", "ok");
      setTimeout(async () => {
        try { await fetch("/api/done", { method: "POST" }); } catch (_) {}
        setTimeout(() => {
          try { window.close(); } catch (_) {}
          setStatus("✓ 已保存 · 可以关闭此标签页了", "ok");
        }, 800);
      }, 1500);
    } catch (e) {
      btnSave.disabled = false;
      setStatus("错误：" + (e && e.message ? e.message : String(e)), "err");
    }
  }

  btnSave.addEventListener("click", save);
  btnCancel.addEventListener("click", () => {
    setStatus("已取消 · 关闭此标签页即可中止", "err");
  });

  renderAll();
  schedulePreview();
  presetsEl.addEventListener("mouseleave", () => previewHover(null));
})();
</script>

</body>
</html>
