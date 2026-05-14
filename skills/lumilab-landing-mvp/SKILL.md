---
name: lumilab-landing-mvp
description: |
  Production-quality Landing Page generator for venture validation. Generates HTML5 + standalone styles.css with email capture, payment intent CTA (P1), and FAQ. Enforces 6-phase non-skippable pipeline (Research → Content Extraction → Image Catalog → Build → Verify → Deploy-ready). Anti-Slop 17 banned words + 8 banned visual patterns + 6-rule quality gate. Output reflects design_direction.json (preset/dials/palette/typography). Use when user types /lumilab build-assets or /lumilab landing, after design-direction page submitted.
  关键词：landing page / 落地页 / 销售页 / HTML 落地页 / 邮件收集 / CTA / hero / 价值主张 / 转化 / Anti-Slop / awwwards / editorial / brutalist / 暖色 luxury
version: 1.0.1
metadata:
  hermes:
    tags: [landing-page, anti-slop, copywriting]
  lumilab:
    tier: core
    requires_browser: false
    chat_only_ok: true
  category: agent
  agent: landing
  authors: [vst-team]
  upstream:
    - "github.com/Aston1690/claude-skill-landing-page (★ Anti-Slop + 6-phase 流水线金标准)"
    - "github.com/ooiyeefei/landing-page-gtm (GTM 定位 + Feature→Benefit)"
    - "github.com/eng0ai/awwwards-landing-page (高设计美学)"
    - "github.com/dani-z/frontend-design-skill-benchmark (6 条质量断言)"
    - "github.com/johndoeblocks/copy-skill (Ogilvy + Handley 文案)"
    - "github.com/dominikmartn/nothing-design-skill (减法决策)"
  outputs:
    - "data/ventures/<name>/landing/v<n>/index.html"
    - "data/ventures/<name>/landing/v<n>/styles.css"
    - "data/ventures/<name>/landing/v<n>/copy.md"
    - "data/ventures/<name>/landing/v<n>/image_catalog.md"
    - "data/ventures/<name>/landing/v<n>/email_collection_config.md"
    - "data/ventures/<name>/landing/v<n>/anti-slop-checklist.md"
    - "data/ventures/<name>/studio/preview/landing.html (Studio 预览版)"
  reads:
    - "data/ventures/<name>/design_direction.json (必读 - 风格)"
    - "data/ventures/<name>/product_definition.md (必读 - 定位/价值主张)"
    - "data/ventures/<name>/audience.md (必读 - 目标用户)"
    - "data/ventures/<name>/painpoints.md (必读 - 用户痛点)"
    - "data/ventures/<name>/pricing_hypothesis.md (定价信息)"
license: Apache-2.0
platforms: [macos, linux]
prerequisites:
  env_vars: []
  commands: [bun]
compatibility: "Claude Code, OpenClaw 2026.4.25+, Hermes Agent v0.13.0+, Cursor, Codex"
---

# Landing MVP — 可部署 Landing Page 生成器

## 用途

把 venture 的定位 + 用户 + 痛点 + 定价 + 设计方向，生成**可直接部署**的 Landing Page。

**输出特征**：
- 语义化 HTML5（不是 div soup）
- 独立 `styles.css`（CSS custom properties + @keyframes）
- Image catalog 作为第一产物（"images are content, not decoration"）
- 邮件捕获表单（Phase 0 写到本地 JSON / Phase 1 接 Resend）
- 通过 6 条 frontend-design 自检 gate

## 工作流程：6 阶段不可跳步流水线（来自 Aston1690）

```
Phase 1: Research        - 读 product_definition / audience / painpoints / pricing
Phase 2: Content Extract - 把读到的内容提炼成 hero / pain / solution / features / CTA / FAQ
Phase 3: Image Catalog   - 先建图片清单（含 URL / 描述 / 尺寸 / 分类 / 用途），再写 HTML
Phase 4: Build           - 生成 HTML + styles.css
Phase 5: Verify          - 跑 6 条质量自检 gate + Anti-Slop scan
Phase 6: Deploy-ready    - 输出最终产物 + 给出本地预览 link
```

**严格规则**：每个 Phase 依赖前一个，**不可并行偷懒**。如果用户跳过 design_direction.json，先去触发 design-direction.html 浏览器交互页。

## 3 条 Golden Rules（来自 Aston1690）

```
1. Images are content, not decoration
   → 不能用 generic stock photo，每张图都要服务于内容
2. CSS goes in styles.css, not in the HTML
   → 不内联 style，不用 Tailwind utility 在 HTML
3. Never invent content
   → 只用 product_definition / audience / painpoints 里有的事实，不编造
```

## Landing Page 结构（语义化）

```html
<header>
  <nav aria-label="Main navigation">...</nav>
</header>

<main>
  <section id="hero" aria-labelledby="hero-h1">
    <h1 id="hero-h1">{positioning_one_liner}</h1>
    <p class="subhead">{value_proposition_short}</p>
    <p class="cta-group">
      <a href="#email-capture" class="cta-primary">{primary_cta}</a>
      <a href="#features" class="cta-secondary">{secondary_cta}</a>
    </p>
    <figure class="hero-visual">...</figure>
  </section>

  <section id="painpoints" aria-labelledby="pain-h2">
    <h2 id="pain-h2">{painpoint_section_title}</h2>
    {painpoint_cards}
  </section>

  <section id="solution" aria-labelledby="solution-h2">
    <h2 id="solution-h2">{solution_section_title}</h2>
    {solution_modules}
  </section>

  <section id="features" aria-labelledby="features-h2">
    <h2 id="features-h2">Features / Modules</h2>
    {feature_grid}  <!-- ≠ 3 列卡片，用 split-screen 或 zig-zag -->
  </section>

  <section id="social-proof">
    {testimonials_OR_logos_OR_数据}
  </section>

  <section id="pricing" aria-labelledby="pricing-h2">
    <h2 id="pricing-h2">Pricing</h2>
    {pricing_tiers}  <!-- 来自 pricing_hypothesis.md -->
  </section>

  <section id="email-capture">
    {email_form}
  </section>

  <section id="faq">
    {faq_accordion}
  </section>
</main>

<footer>...</footer>
```

## 设计 token（必须从 design_direction.json 读）

```css
:root {
  /* 来自 design_direction.json.palette */
  --color-surface: oklch(98% 0 0);
  --color-text: oklch(18% 0 0);
  --color-accent: oklch(45% 0.18 12);
  --color-muted: oklch(60% 0.005 60);

  /* 来自 design_direction.json.typography */
  --font-display: 'Cabinet Grotesk', system-ui, sans-serif;
  --font-body: 'Geist', system-ui, sans-serif;
  --font-mono: 'Geist Mono', monospace;

  /* 来自 design_direction.json.dials */
  /* DESIGN_VARIANCE → 决定 layout 对称性 */
  /* MOTION_INTENSITY → 决定动画强度 */
  /* VISUAL_DENSITY → 决定间距大小 */

  --text-base: clamp(1rem, 0.92rem + 0.4vw, 1.125rem);
  --text-hero: clamp(3rem, 1rem + 7vw, 8rem);
  --space-section: clamp(4rem, 3rem + 5vw, 10rem);

  --duration-fast: 150ms;
  --duration-normal: 300ms;
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
}
```

## Anti-Slop 三层规则（必须落地）

### 文案禁用（17 词）

详见 IMPLEMENTATION_PLAN.md §6.1。Top 必删：

英文：`revolutionize / transform / unleash / leverage / empower / cutting-edge / seamlessly / elevate / next-gen / robust / pivotal`

中文：`赋能 / 抓手 / 闭环 / 范式 / 第一性原理 / 行业领先 / 颠覆性 / 红海 / 蓝海`

### 视觉禁用（8 模式）

```
❌ Inter / Roboto / Arial → 用 Cabinet Grotesk / Geist / Outfit / Satoshi
❌ Hero 紫蓝渐变 mesh
❌ #000000 / #FFFFFF → 用 OKLCH 带 chroma 0.005-0.01
❌ 居中 H1 + 3 列卡片
❌ 通用握手 stock photo
❌ 圆角 > 1.5rem + 重阴影
❌ 紫色按钮 glow
❌ Lucide user "egg" 头像
```

### 代码禁用

```
❌ h-screen → min-h-[100dvh]
❌ flex 百分比 calc → CSS Grid
❌ 动 top/left/width/height → transform/opacity
❌ inline style
❌ emoji 在 markup/alt text
```

## 6 条质量自检 Gate（Phase 5 必跑）

```
1. ✅ 不用 Inter/Roboto/Arial
2. ✅ hero 不用紫色渐变
3. ✅ 布局不是「居中 + 3 列卡片」（用 split-screen / zig-zag / asymmetric）
4. ✅ 用 CSS custom properties (--color-* / --space-*)
5. ✅ 至少一个非 hover 的 @keyframes
6. ✅ 鲜明美学 POV（editorial / brutalist / swiss / minimal-luxury 至少一个）
```

**全部通过才能进 Phase 6**。否则回 Phase 4 改。

## Image Catalog（Phase 3，先于 HTML 生成）

```markdown
# Image Catalog — {venture}

## Hero
- file: hero-main.webp
- size: 1600×900
- alt: "{descriptive}"
- source: {generated by gemini-image OR picsum.photos}
- purpose: convey {value proposition concept}

## Section / Painpoints
- file: pain-1.webp
- size: 800×600
- alt: ...

## Section / Solution
...

## Section / Features
...

## Logos / Social Proof
- file: logo-customer-1.svg
- ...
```

**禁用图片来源**：
- ❌ Unsplash（链接可能失效）
- ❌ Pexels 通用 stock
- ✅ picsum.photos（占位时）
- ✅ AI 生成（gemini-image / fal-ai-media）

## 邮件捕获（Phase 0 简化版）

```html
<form id="email-capture-form"
      action="/api/email-capture"
      method="POST"
      data-collect-to="data/ventures/{slug}/email_captures.jsonl">
  <label for="email">{cta_label}</label>
  <input type="email" id="email" name="email" required>
  <button type="submit">{submit_label}</button>
  <p class="privacy">{privacy_microcopy}</p>
</form>
```

Phase 0：表单 submit 写到本地 `email_captures.jsonl`（一行一记录）。  
Phase 1：接 Resend / Loops 真发邮件。

## 输出文件清单

产物字段：`index.html`（语义化 HTML5）、`styles.css`（CSS custom properties + @keyframes）、`copy.md`（文案源）、`image_catalog.md`（图片清单：file / size / alt / source / purpose 字段）、`email_collection_config.md`、`anti-slop-checklist.md`（≥6 行勾选项）。由 `scripts/validate-output.ts` 强制校验。

每次完成写到递增版本目录 `landing/v<n>/`（上一版保留，便于 A/B 对比）：

```
data/ventures/<name>/
├── landing/v<n>/
│   ├── index.html                ← 主页面
│   ├── styles.css                ← 独立 CSS
│   ├── copy.md                   ← 所有文案的源（便于改）
│   ├── image_catalog.md          ← 图片清单（Phase 3 产物）
│   ├── email_collection_config.md
│   └── anti-slop-checklist.md    ← 6 条质量 gate 自检结果
└── studio/preview/
    └── landing.html              ← Studio 内嵌预览（带 self-check 段）
```

## Studio Preview 增强

`studio/preview/landing.html` 在原 landing 基础上加：
- 顶部 banner: "Preview · Last updated {ts}"
- 6 条 self-check gate 状态显示
- 「下载 zip」「复制 HTML」「跳转到部署」按钮
- 移动端尺寸切换器（375 / 768 / 1024 / 1440）

## 跨 runtime user-input 协议

```yaml
user_input:
  - mode: terminal
    method: "AskUserQuestion (Phase 4 关键设计取舍)"
  - mode: browser
    method: "studio/decisions/04-design-direction.html (必须先完成)"
    method: "studio/decisions/05-review-landing.html (Phase 1，模块标注)"
```

## 必做约束（Self-Check）

```
✓ design_direction.json 已读
✓ 6 阶段全部跑完，无跳过
✓ Image catalog 先于 HTML 生成
✓ CSS 独立文件，无内联 style
✓ 6 条质量 gate 全过
✓ Anti-Slop 文案 / 视觉 / 代码三层扫过
✓ 语义化 HTML5（用 <header> / <main> / <section> / <footer>）
✓ Accessibility：aria-label / heading hierarchy
✓ 移动端 min-h-[100dvh] 不是 h-screen
```

## Anti-Slop 完整违例 demo

错误示例：
```html
<!-- ❌ 全错 -->
<div class="hero" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); height: 100vh;">
  <h1 style="font-family: 'Inter'; color: white; text-align: center;">
    Revolutionize Your Business with Cutting-Edge AI
  </h1>
  <p>Seamlessly empower your team to unleash next-gen productivity</p>
  <button>Get Started →</button>
</div>
```

正确示例：
```html
<section id="hero" class="hero">
  <div class="hero-content">
    <h1>变现期博主的风格保持型内容工厂</h1>
    <p class="subhead">保留你原帖的语气和措辞，10 分钟搞定一周内容</p>
    <a href="#email" class="cta-primary">免费试用 7 天</a>
  </div>
  <figure class="hero-visual">
    <img src="/hero-main.webp" alt="..." width="1600" height="900" loading="eager" fetchpriority="high">
  </figure>
</section>
```

```css
.hero {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: var(--space-section);
  min-height: 100dvh;
  align-items: center;
  padding: var(--space-section) clamp(1rem, 5vw, 4rem);
}

.hero h1 {
  font-family: var(--font-display);
  font-size: var(--text-hero);
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.05;
}

@keyframes hero-reveal {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.hero h1 { animation: hero-reveal 600ms var(--ease-out-expo) both; }
.hero .subhead { animation: hero-reveal 600ms 100ms var(--ease-out-expo) both; }
```

## 引用

- 上游：reference/skills/group-b-landing-content-design/claude-skill-landing-page/（Anti-Slop + 6-phase）
- 配套：lumilab-design-direction（提供风格）
- 配套：lumilab-copy（提供文案）
- 配套：lumilab-content-repurpose（同 hero 文字可改写到各平台）
- 配套：lumilab-studio（preview）

## 分支决策

| 条件 | 动作 |
|---|---|
| `design_direction.json` 缺失 | HALT，先触发 lumilab-design-direction 交互页 |
| product_definition / audience / painpoints 任一缺失 | HALT，回 lumilab-product-positioning 补齐 |
| 6 阶段中任一阶段未完成 | 不可跳步，回到未完成阶段 |
| Phase 5 的 6 条质量 gate 挂 ≥ 2 条 | 拒绝输出 HTML，回 Phase 4 改文案/布局 |
| 字体未安装 | 退化到 system serif/mono，但保留 OKLCH 配色 |
| 同一 venture 再次生成 | 写新 `landing/v<n>/`，旧版保留 |
| 用户要上线 | 转 lumilab-deploy（Cloudflare Pages） |

## Output validation

`scripts/validate-output.ts` 取最新 `landing/v<n>/`，确定性校验 `index.html` + `styles.css` + `anti-slop-checklist.md`（≥6 行勾选项），并跑 6 条质量 gate：无 Inter/Roboto/Arial、无紫色 hero 渐变、非「居中 H1 + 3 列卡片」、用 CSS custom properties、≥1 个 `@keyframes`、语义化 HTML5 标签齐全；外加 `#000`/`#fff` 抽检。

```bash
bun run skills/lumilab-landing-mvp/scripts/validate-output.ts data/ventures/<slug>
# exit 0 = 6 条 gate 全过；exit 1 = 列出挂掉的 gate
bun run skills/lumilab-landing-mvp/scripts/validate-output.ts --help
```

Phase 5 必跑；exit 0 才能进 Phase 6 Deploy-ready。

## Dependencies

| 依赖 | 类型 | 是否付费 | 单次调用成本 | 说明 |
|---|---|---|---|---|
| bun | CLI runtime | 免费 | $0（本地执行 + 校验） | ≥1.0，必需 |
| host LLM | 由 Claude Code / OpenClaw / Cursor / Hermes 提供 | 取决于宿主 | 约 $0.03–0.08（6 阶段流水线 + HTML/CSS 生成，复用宿主额度） | Lumi Lab 本身不直连 LLM，复用宿主 |
| 图片生成（gemini-image / fal-ai-media） | 可选外部 skill | 付费 | 约 $0.01–0.04/张（仅当 catalog 用 AI 生成图，picsum 占位则 $0） | Phase 3 图片清单，可用占位图跳过 |

## Outputs

`data/ventures/<slug>/landing/v<n>/index.html` · `styles.css` · `copy.md` · `image_catalog.md` · `email_collection_config.md` · `anti-slop-checklist.md`

## Example

`@bot 用 lumilab-landing-mvp 生成 landing` → 6 阶段流水线 → HTML（OKLCH / Fraunces / 无 Inter / 无 #000#fff）+ 6 条 Anti-Slop 自检日志。

## Tests

`tests/smoke.md` — 该 skill 的最小冒烟测试约定：让 host LLM 在对话中跑通 SKILL.md「真实示例」段即视为通过。E2E 真集成见 `docs/TUTORIAL.zh.md`。

## Idempotency

同一 venture 多次跑会写到 `landing/v<n>/`（递增版本号），上一版保留，方便对比。Anti-Slop checklist 每次重跑都附在新版本里，文件不混。

## Privacy

HTML / 文案完全本地生成；不上传任何文案到外部 LLM 之外的服务（host LLM 已在用户自己 host 上）。Cloudflare 部署是用户主动调 lumilab-deploy 才发生。

## Cache

配色 / 字体 / 排版 token 来自 `design_direction.json`，hash 不变就复用上次渲染；文案文本变了才重写 HTML。

## Failure modes

若 `design_direction.json` 缺 → 调 lumilab-design-direction 引导；若 Anti-Slop 6 条门挂 ≥ 2 → 拒绝输出 HTML，先修文案；若字体未安装 → 退化到 system serif/mono 但保留 OKLCH。

## Edge cases

中文标题超过 38 字时切 H1 + 副标题；H1 等 viewport 宽度 < 360px 时自动降字号；CTA 数量 > 2 触发 Anti-Slop 警告。

## Alternatives

用户现在可能用什么替代方案，以及 Lumi Lab 为什么不一样：

- **v0 / bolt / lovable**：生成快但默认 AI slop 审美（Inter / 居中三列 / 紫渐变），没有平台规则约束。
- **Framer / Webflow 模板**：好看但同质化，不接 venture 的假设上下文。
- **通用 LLM 写 landing**：HTML 能跑，但不过 Anti-Slop 6 条门、不读 design_direction.json。

Lumi Lab 的差异：6 阶段流水线 + 强制 Anti-Slop 自检（禁 Inter / #000#fff / 居中三列）+ 读 venture 的 hypothesis 和 design direction。

## Moat（复利护城河）

`landing/v<n>/` 版本递增，每次迭代都留档，A/B 对比有数据。design direction 一旦定下，后续所有 venture 的 landing 风格一致——这是单次生成工具做不到的品牌沉淀。

## Changelog

- 1.0.0-rc1：6 阶段不可跳步流水线 + Anti-Slop 三层规则 + 6 条质量 gate；新增 validate-output.ts（确定性跑 6 条 gate）、分支决策表、依赖成本列、package.json；统一产物路径为 landing/v<n>/。

## 环境自检（首次运行前）

本 skill 的 `scripts/` 用 **bun ≥ 1.0** 运行。宿主里第一次调用 Lumi Lab 任意 skill 前，先做一次环境自检——缺 bun 就自动装（装在 `~/.bun/`，无需 root，约 30 秒）：

```bash
command -v bun >/dev/null 2>&1 || { [ -x "$HOME/.bun/bin/bun" ] && export PATH="$HOME/.bun/bin:$PATH"; }
command -v bun >/dev/null 2>&1 || curl -fsSL https://bun.sh/install | bash
export PATH="$HOME/.bun/bin:$PATH"   # 当前 shell 立即可用
```

宿主 agent（Claude Code / OpenClaw / Hermes）能跑 shell，应在首次调用前自动执行上面这段。纯方法论用法（不跑脚本、只读 SKILL.md 做对话）不需要 bun。
