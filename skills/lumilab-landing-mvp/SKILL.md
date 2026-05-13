---
name: lumilab-landing-mvp
description: |
  Production-quality Landing Page generator for venture validation. Generates HTML5 + standalone styles.css with email capture, payment intent CTA (P1), and FAQ. Enforces 6-phase non-skippable pipeline (Research → Content Extraction → Image Catalog → Build → Verify → Deploy-ready). Anti-Slop 17 banned words + 8 banned visual patterns + 6-rule quality gate. Output reflects design_direction.json (preset/dials/palette/typography). Use when user types /lumilab build-assets or /lumilab landing, after design-direction page submitted.
  关键词：landing page / 落地页 / 销售页 / HTML 落地页 / 邮件收集 / CTA / hero / 价值主张 / 转化 / Anti-Slop / awwwards / editorial / brutalist / 暖色 luxury
version: 1.0.0-rc1
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
    - "data/ventures/<name>/landing_page.html"
    - "data/ventures/<name>/styles.css"
    - "data/ventures/<name>/landing_copy.md"
    - "data/ventures/<name>/image_catalog.md"
    - "data/ventures/<name>/email_collection_config.md"
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

## 6 阶段不可跳步流水线（来自 Aston1690）

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

每次完成：

```
data/ventures/<name>/
├── landing_page.html        ← 主页面
├── styles.css                ← 独立 CSS
├── landing_copy.md           ← 所有文案的源（便于改）
├── image_catalog.md          ← 图片清单（Phase 3 产物）
├── email_collection_config.md
└── studio/preview/
    └── landing.html          ← Studio 内嵌预览（带 self-check 段）
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

## Dependencies

| 依赖 | 类型 | 是否付费 | 说明 |
|---|---|---|---|
| bun | CLI runtime | 免费 | ≥1.0，必需 |
| host LLM | 由 Claude Code / OpenClaw / Cursor / Hermes 提供 | 取决于宿主 | Lumi Lab 本身不直连 LLM，复用宿主 |

## Outputs

`data/ventures/<slug>/landing/index.html` · `landing/copy.md` · `landing/anti-slop-checklist.md`

## Example

`@bot 用 lumilab-landing-mvp 生成 landing` → 6 阶段流水线 → HTML（OKLCH / Fraunces / 无 Inter / 无 #000#fff）+ 6 条 Anti-Slop 自检日志。

## Tests

`tests/smoke.md` — 该 skill 的最小冒烟测试约定：让 host LLM 在对话中跑通 SKILL.md「真实示例」段即视为通过。E2E 真集成见 `docs/TUTORIAL.zh.md`。
