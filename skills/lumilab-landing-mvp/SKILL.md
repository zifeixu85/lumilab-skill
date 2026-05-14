---
name: lumilab-landing-mvp
description: |
  Fake-door validation page generator for C-end venture ideas. The landing is NOT a marketing page — it is a validation instrument that measures real purchase intent: a real, visible buy-style CTA → fake-door modal → email capture, with lightweight conversion tracking (cta_click / email_submit). Generates semantic HTML5 + standalone styles.css + inline tracking JS + validation_setup.md. Enforces 6-phase non-skippable pipeline (Research → Content Extraction → Image Catalog → Build → Verify → Deploy-ready). Anti-Slop banned words + banned visual patterns + 8-rule quality gate (incl. fake-door gate + SEO/GEO gate). Output reflects design_direction.json. Use when user types /lumilab build-assets or /lumilab landing, after design-direction page submitted.
  关键词：fake-door / 验证页 / 假门 / 购买意愿 / landing page / 落地页 / 邮件收集 / 立即购买 / CTA / 转化追踪 / cta_click / 价值主张 / Anti-Slop / editorial / brutalist
version: 1.3.0
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
    - "data/ventures/<name>/landing/v<n>/index.html (含 fake-door modal + 内嵌转化追踪 JS)"
    - "data/ventures/<name>/landing/v<n>/styles.css"
    - "data/ventures/<name>/landing/v<n>/copy.md"
    - "data/ventures/<name>/landing/v<n>/image_catalog.md"
    - "data/ventures/<name>/landing/v<n>/email_collection_config.md"
    - "data/ventures/<name>/landing/v<n>/validation_setup.md (怎么部署 / 怎么接邮箱端点 / 怎么回收数字)"
    - "data/ventures/<name>/landing/v<n>/anti-slop-checklist.md"
    - "data/ventures/<name>/landing/v<n>/sitemap.xml"
    - "data/ventures/<name>/landing/v<n>/robots.txt"
    - "data/ventures/<name>/landing/v<n>/llms.txt"
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

# Landing MVP — Fake-door 验证页生成器

## 用途

把 venture 的定位 + 用户 + 痛点 + 定价 + 设计方向，生成一个**可直接部署的 fake-door 验证页**。

**这个页面是一个验证仪器，不是营销页。它的产出是一个数字：有多少人表达了购买意愿。**

它的工作方式：人搜相关关键词 → 落到这个页面 → 页面测量他们会不会点「立即购买」、会不会留邮箱。那些点击 + 邮箱**就是需求信号**。所以：

- 不是「页面好不好看」——好看只是为了不让访客在第一屏跳出。
- 不是「营销转化」——这里没有真实交易，产品可能还不存在。
- 是「有多少真实的人，在看到真实价格和真实购买按钮后，表达了购买意愿」。

**输出特征**：
- 语义化 HTML5（不是 div soup）
- 独立 `styles.css`（CSS custom properties + @keyframes）
- Image catalog 作为第一产物（"images are content, not decoration"）
- **一个真实、显眼的主 CTA（「立即购买」类）+ fake-door modal + 邮箱捕获**
- **内嵌轻量转化追踪 JS**：记录 `cta_click` / `email_submit` 两个事件
- `validation_setup.md`：告诉用户怎么部署、怎么接邮箱端点、怎么回收数字
- 通过 8 条质量自检 gate（含 fake-door gate + SEO/GEO gate）

## Fake-door 验证机制（核心）

这一版 landing 是**验证页**，主 CTA 必须能产生**可计数的意愿信号**。页面 MUST 满足下面五点。

### 1. 一个真实、显眼的主 CTA

主 CTA 文案必须是**购买类**动作，带真实价格：「立即购买」/「立即预订」/「￥XX 抢先体验」/「￥XX 预订」。
不能是「了解更多」「免费试用」「加入等待列表」这种弱意愿按钮——弱按钮测不出购买意愿。
价格用 `pricing_hypothesis.md` 里的真实定价假设，不要编。

### 2. 点击主 CTA → fake-door modal

点击主 CTA 不跳支付，而是弹出一个 fake-door modal：
「即将上线 / 名额有限，留个邮箱第一时间通知你」+ 一个邮箱输入框。
**点击主 CTA 本身就是强意愿信号；在 modal 里留下邮箱是更强的信号。**

### 3. 转化追踪

页面内嵌一段轻量 JS，记录两个事件到 `localStorage`（+ 可选上报到表单端点）：
- `cta_click` —— 访客点了主购买按钮
- `email_submit` —— 访客在 modal 里留了邮箱

因为部署是 Cloudflare Pages 静态站（没有后端），邮箱提交走一个**可配置的表单端点**：
Formspree / 用户自己的 endpoint / 或先用 `localStorage` 兜底（部署后再换）。
具体内嵌 JS 见下方 [Fake-door modal + 追踪 JS worked example](#fake-door-modal--追踪-js-worked-example)。

### 4. 页面顶部隐性定位（给 skill 看的）

写 HTML 时，skill 自己要记住：这一版是验证页，不是成品页。主 CTA 必须能产生可计数的意愿信号，
modal 和追踪 JS 是页面的**核心功能**，不是附加项。不一定要把这句话显示给访客。

### 5. 诚实边界

fake-door 不能骗钱、不能假装能买：
- modal 文案用「即将上线」「抢先体验名额」，**不要**写「立即支付」「下单成功」这种假装能交易的话。
- 用户留邮箱后，modal 必须明确告知「产品还在验证阶段，上线会第一时间通知你」——给访客一个诚实的预期。
- 全程不收款、不要信用卡。这是验证意愿，不是收钱。

## 验证指标（这个页面要产出什么数字）

这个页面跑一段时间（建议至少一周、有真实流量）后，用户该回收这几个数字：

| 指标 | 算法 | 含义 |
|---|---|---|
| 访问量 UV | 独立访客数 | 分母，没流量就没信号 |
| 主 CTA 点击率 | `cta_click` / UV | **核心意愿信号**——有多少人想买 |
| 邮箱留资率 | `email_submit` / UV | **强意愿信号**——愿意留下联系方式等上线 |

**判断基准（经验值，不是定律，按品类调整）**：
- 主 CTA 点击率 **> 8%** 算强意愿信号；3%–8% 算中性，需要看别的桶；< 3% 偏弱。
- 邮箱留资率 **> 3%** 算强意愿信号；1%–3% 中性；< 1% 偏弱。
- 注意：这些是冷启动验证页的经验区间，不同品类（高客单价 vs 低客单价、冲动消费 vs 决策型）差异很大，
  标注为**经验值**，第一次跑完后用自己的数据校准。

这些数字怎么解读、要不要继续做这个 venture —— 不在这个 skill 里下结论。把数字喂给
`lumilab-weekly-sop-runner` 的**周复盘四桶**，在那里结合获客成本、留存等一起判断。这个 skill 只负责
**产出可信的意愿数字**。

## 工作流程：6 阶段不可跳步流水线（来自 Aston1690）

```
Phase 0: Fake-door 装配  - 配主 CTA（真实价格购买按钮）+ fake-door modal + 转化追踪 JS + 邮箱端点
Phase 1: Research        - 读 product_definition / audience / painpoints / pricing
Phase 2: Content Extract - 把读到的内容提炼成 hero / pain / solution / features / CTA / FAQ
Phase 3: Image Catalog   - 先建图片清单（含 URL / 描述 / 尺寸 / 分类 / 用途），再写 HTML
Phase 4: Build           - 生成 HTML（含 fake-door modal + 内嵌追踪 JS）+ styles.css
Phase 5: Verify          - 跑 8 条质量自检 gate（含 fake-door gate）+ Anti-Slop scan
Phase 6: Deploy-ready    - 输出最终产物 + validation_setup.md + 给出本地预览 link
```

**Phase 0 不是「简化版邮件捕获」**——它是 fake-door 机制的装配步：确定主 CTA 用哪个真实价格、
modal 文案怎么写（诚实）、邮箱提交走哪个端点（Formspree / 自有 / localStorage 兜底）、追踪 JS 上报到哪。
Phase 4 把这些写进 HTML，Phase 5 的 fake-door gate 校验。

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
      <!-- 主 CTA：真实购买类文案 + 真实价格，点击打开 fake-door modal -->
      <button type="button" class="cta-primary" data-cta="primary"
              aria-haspopup="dialog" aria-controls="fakedoor">{primary_cta_buy}</button>
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

  <section id="faq">
    {faq_accordion}
  </section>
</main>

<footer>...</footer>

<!-- fake-door modal：默认 hidden，点主 CTA 打开（见 worked example） -->
<div id="fakedoor" class="fakedoor" role="dialog" aria-modal="true" hidden>...</div>

<!-- 内嵌转化追踪 JS：记录 cta_click / email_submit（见 worked example） -->
<script>/* tracking */</script>
```

邮箱捕获不再是独立 section——它在 fake-door modal 里。主 CTA 是购买按钮，不是「了解更多」。

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

## 8 条质量自检 Gate（Phase 5 必跑）

```
1. ✅ 不用 Inter/Roboto/Arial
2. ✅ hero 不用紫色渐变
3. ✅ 布局不是「居中 + 3 列卡片」（用 split-screen / zig-zag / asymmetric）
4. ✅ 用 CSS custom properties (--color-* / --space-*)
5. ✅ 至少一个非 hover 的 @keyframes
6. ✅ 鲜明美学 POV（editorial / brutalist / swiss / minimal-luxury 至少一个）
7. ✅ SEO+GEO gate：<title> ≤ 60 字符、有 <meta name="description">、≥1 个 application/ld+json
      JSON-LD、FAQ section 存在、所有 <img> 带 alt、sitemap.xml / robots.txt / llms.txt 都生成
8. ✅ fake-door gate：主 CTA 是真实购买类按钮（文案含 立即购买/立即预订/抢先体验/预订）、
      有 fake-door modal、有转化追踪 JS（含 cta_click + email_submit 事件）、modal 文案诚实
      （「即将上线」类，不假装能买，不出现「立即支付」「下单成功」等）
```

**全部通过才能进 Phase 6**。否则回 Phase 4 改。

## SEO + GEO（Phase 5.5，HTML 生成时必做）

Landing page 生成出来还得被人和 AI 找到。Phase 4 写 HTML 时就要把下面这些一并写进去，Phase 5 校验。

### SEO（传统搜索引擎）

- `<title>` ≤ 60 字符，含核心关键词，别堆砌
- `<meta name="description">` 控制在 150–160 字符，一句话说清页面价值
- Open Graph 全套：`og:title` `og:description` `og:image` `og:url` `og:type` `og:locale`（`zh_CN`）
- Twitter Card：`twitter:card`（`summary_large_image`）`twitter:title` `twitter:description` `twitter:image`
- `<link rel="canonical">` 指向页面正式 URL
- 语义化 heading 层级：全页只有一个 `<h1>`，`<h2>`/`<h3>` 逻辑嵌套，不跳级
- `<html lang="zh-CN">`
- 所有 `<img>` 的 `alt` 必填，描述图片内容（不放 emoji、不堆关键词）
- `sitemap.xml` + `robots.txt` 一并生成到 landing 输出目录
- 性能即 SEO：内联首屏关键 CSS、图片带 `loading="lazy"`/`width`/`height`、字体 `font-display: swap`

### GEO（生成式引擎优化 — 让 AI 搜索引擎能抓取并引用）

GEO 是 2024–2025 新兴的优化方向。核心：AI 搜索引擎（ChatGPT search / Perplexity / Claude / 文心一言等）抓取页面后，需要能**清晰提取实体、事实、结构化答案**来引用。要点：

- **JSON-LD 结构化数据**：内联 `<script type="application/ld+json">`，按页面性质选 schema.org 类型——`Organization`（venture 主体）/ `Product` 或 `SoftwareApplication`（产品）/ `FAQPage`（FAQ）/ `BreadcrumbList`（导航层级）
- **FAQ 区块**：landing 必含一个真实的 FAQ section（5–8 问），同时渲染为可见 HTML + `FAQPage` JSON-LD——AI 引擎最爱引用 FAQ
- **明确的实体声明**：第一屏就用一句话清楚说明「这是什么、给谁、解决什么」，别让 AI 引擎自己推断
- **事实密度**：写具体数字、具体场景、具体对比，不是形容词堆砌——AI 引擎引用具体事实，不引用「很棒的体验」
- **可提取的结构**：用 `<dl>` 定义列表、清晰的小标题、要点列表——让 AI 容易切片
- **`llms.txt`**：在 landing 输出目录生成一个 `llms.txt`（新兴标准，类似 robots.txt 但写给 LLM 看），列出页面核心事实摘要
- **作者/可信度信号**：`<meta name="author">`、发布/更新日期（`article:published_time` 或可见日期）、真实联系方式

### Worked example（虚构 venture：「碳记」个人碳足迹追踪 app）

`<head>` 块：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>碳记 — 上班族的个人碳足迹追踪 app</title>
  <meta name="description" content="碳记帮上班族记录通勤、外卖、网购的碳排放，每周给一份可执行的减排建议。已有 3,200 名用户，平均 6 周减少 18% 个人碳足迹。">
  <meta name="author" content="碳记团队">
  <link rel="canonical" href="https://tanji.app/">

  <meta property="og:type" content="website">
  <meta property="og:locale" content="zh_CN">
  <meta property="og:url" content="https://tanji.app/">
  <meta property="og:title" content="碳记 — 上班族的个人碳足迹追踪 app">
  <meta property="og:description" content="记录通勤、外卖、网购的碳排放，每周一份可执行的减排建议。">
  <meta property="og:image" content="https://tanji.app/og-cover.webp">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="碳记 — 上班族的个人碳足迹追踪 app">
  <meta name="twitter:description" content="记录通勤、外卖、网购的碳排放，每周一份可执行的减排建议。">
  <meta name="twitter:image" content="https://tanji.app/og-cover.webp">

  <link rel="stylesheet" href="styles.css">
</head>
```

FAQPage JSON-LD（可见 FAQ section 之外，再内联一份）：

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "碳记怎么计算碳排放？",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "碳记用中国生态环境部发布的排放因子，把你录入的通勤距离、外卖订单、网购包裹换算成 CO₂ 当量，数据来源公开可查。"
      }
    },
    {
      "@type": "Question",
      "name": "需要手动记录吗？",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "通勤可以连地图 app 自动同步，外卖和网购支持账单截图识别，平均每天手动操作不到 1 分钟。"
      }
    },
    {
      "@type": "Question",
      "name": "碳记收费吗？",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "基础记录和周报永久免费，高级版每月 18 元，含年度报告和减排目标拆解。"
      }
    }
  ]
}
</script>
```

`llms.txt`（放 landing 输出目录根）：

```text
# 碳记 (tanji.app)

> 碳记是一款面向中国上班族的个人碳足迹追踪 app，记录通勤、外卖、网购三类高频日常消费的碳排放，每周生成一份可执行的减排建议。

## 核心事实
- 产品类型：移动端 app（iOS / Android）
- 目标用户：一二线城市 22–40 岁上班族
- 解决的问题：想减碳但不知道自己排了多少、从哪减
- 数据来源：中国生态环境部公开排放因子
- 用户规模：3,200 名注册用户（2026-05）
- 实测效果：平均 6 周减少 18% 个人碳足迹
- 定价：基础版免费；高级版 18 元/月
- 联系方式：hello@tanji.app

## 关键页面
- 首页：https://tanji.app/
- 定价：https://tanji.app/#pricing
- FAQ：https://tanji.app/#faq
```

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

## Fake-door modal + 追踪 JS worked example

主 CTA、fake-door modal、转化追踪 JS —— Phase 4 把这三段一并写进 `index.html`。

### 主 CTA（hero 里，真实购买类文案 + 真实价格）

```html
<button type="button" class="cta-primary" data-cta="primary"
        aria-haspopup="dialog" aria-controls="fakedoor">
  ￥39 立即购买
</button>
```

### Fake-door modal（默认 hidden，点主 CTA 打开；文案诚实）

```html
<div id="fakedoor" class="fakedoor" role="dialog" aria-modal="true"
     aria-labelledby="fakedoor-title" hidden>
  <div class="fakedoor-panel">
    <button type="button" class="fakedoor-close" data-fd-close aria-label="关闭">×</button>

    <!-- 默认视图：还没留邮箱 -->
    <div data-fd-view="form">
      <h2 id="fakedoor-title">即将上线，名额有限</h2>
      <p>产品还在最后打磨。留个邮箱，上线第一时间通知你，并锁定抢先体验名额。</p>
      <form id="fakedoor-form" novalidate>
        <label for="fd-email">邮箱</label>
        <input type="email" id="fd-email" name="email" required
               autocomplete="email" placeholder="you@example.com">
        <button type="submit">锁定名额</button>
      </form>
    </div>

    <!-- 留完邮箱：诚实告知验证阶段 -->
    <div data-fd-view="done" hidden>
      <h2>已记下你的邮箱</h2>
      <p>说句实话：这个产品还在验证阶段，我们正在确认有多少人真的想要它。
         一旦决定做下去并上线，你会第一个收到通知。感谢你愿意参与。</p>
    </div>
  </div>
</div>
```

### 转化追踪 JS（内嵌 `<script>`，记录 cta_click / email_submit）

`ENDPOINT` 在 Phase 0 配置：Formspree 表单 URL、或用户自有 endpoint；留空则只走 localStorage 兜底。

```html
<script>
(function () {
  var ENDPOINT = ""; // Phase 0 配置：Formspree / 自有端点；留空 = 仅 localStorage 兜底
  var KEY = "lumilab_validation_events";

  function track(event, detail) {
    var rec = { event: event, ts: new Date().toISOString(), detail: detail || null };
    try {
      var log = JSON.parse(localStorage.getItem(KEY) || "[]");
      log.push(rec);
      localStorage.setItem(KEY, JSON.stringify(log));
    } catch (e) { /* localStorage 不可用时静默降级 */ }
    if (ENDPOINT) {
      fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rec)
      }).catch(function () { /* 上报失败不阻塞用户 */ });
    }
  }

  var modal = document.getElementById("fakedoor");
  var openBtn = document.querySelector('[data-cta="primary"]');
  var form = document.getElementById("fakedoor-form");

  openBtn && openBtn.addEventListener("click", function () {
    track("cta_click", { cta: "primary" });          // 强意愿信号：点了购买
    modal.hidden = false;
    var input = document.getElementById("fd-email");
    input && input.focus();
  });

  modal && modal.addEventListener("click", function (e) {
    if (e.target === modal || e.target.hasAttribute("data-fd-close")) modal.hidden = true;
  });

  form && form.addEventListener("submit", function (e) {
    e.preventDefault();
    var email = document.getElementById("fd-email").value.trim();
    if (!email) return;
    track("email_submit", { email: email });          // 更强意愿信号：留了邮箱
    modal.querySelector('[data-fd-view="form"]').hidden = true;
    modal.querySelector('[data-fd-view="done"]').hidden = false;
  });
})();
</script>
```

### 数字怎么回收

部署后访客产生的事件存在他们浏览器的 `localStorage`（兜底）+ 你的端点（如配了）。
配了 Formspree / 自有端点时，`cta_click` 和 `email_submit` 会直接进你的收件箱 / 数据库，
按 [验证指标](#验证指标这个页面要产出什么数字) 算点击率和留资率。完整部署步骤见 `validation_setup.md`。

## 输出文件清单

产物字段：`index.html`（语义化 HTML5，**含 fake-door modal + 内嵌转化追踪 JS**）、`styles.css`（CSS custom properties + @keyframes）、`copy.md`（文案源）、`image_catalog.md`（图片清单：file / size / alt / source / purpose 字段）、`email_collection_config.md`、`validation_setup.md`（怎么部署 / 怎么接邮箱端点 / 怎么回收 cta_click + email_submit 数字）、`anti-slop-checklist.md`（≥6 行勾选项）、`sitemap.xml`、`robots.txt`、`llms.txt`（SEO+GEO 产物）。由 `scripts/validate-output.ts` 强制校验。

每次完成写到递增版本目录 `landing/v<n>/`（上一版保留，便于 A/B 对比）：

```
data/ventures/<name>/
├── landing/v<n>/
│   ├── index.html                ← 验证页（含 fake-door modal + 转化追踪 JS）
│   ├── styles.css                ← 独立 CSS
│   ├── copy.md                   ← 所有文案的源（便于改）
│   ├── image_catalog.md          ← 图片清单（Phase 3 产物）
│   ├── email_collection_config.md
│   ├── validation_setup.md       ← 部署 / 接邮箱端点 / 回收数字（Phase 6 产物）
│   ├── anti-slop-checklist.md    ← 8 条质量 gate 自检结果
│   ├── sitemap.xml               ← SEO（Phase 5.5 产物）
│   ├── robots.txt                ← SEO（Phase 5.5 产物）
│   └── llms.txt                  ← GEO（Phase 5.5 产物，给 AI 搜索引擎看）
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
✓ 6 阶段全部跑完，无跳过（Phase 0 fake-door 装配不可省）
✓ Image catalog 先于 HTML 生成
✓ CSS 独立文件，无内联 style
✓ 8 条质量 gate 全过（含 fake-door gate）
✓ 主 CTA 是真实购买类按钮 + 有 fake-door modal + 有 cta_click/email_submit 追踪 JS
✓ modal 文案诚实（「即将上线」，留邮箱后告知验证阶段，不假装能买）
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
| Phase 5 的 8 条质量 gate 挂 ≥ 2 条 | 拒绝输出 HTML，回 Phase 4 改文案/布局 |
| fake-door gate 挂（无真实购买主 CTA / 无 modal / 无追踪 JS / modal 文案不诚实） | 单独阻断，回 Phase 0 + Phase 4 修 |
| 字体未安装 | 退化到 system serif/mono，但保留 OKLCH 配色 |
| 同一 venture 再次生成 | 写新 `landing/v<n>/`，旧版保留 |
| 用户要上线 | 转 lumilab-deploy（Cloudflare Pages） |

## Output validation

`scripts/validate-output.ts` 取最新 `landing/v<n>/`，确定性校验 `index.html` + `styles.css` + `anti-slop-checklist.md`（≥6 行勾选项），并跑 8 条质量 gate：无 Inter/Roboto/Arial、无紫色 hero 渐变、非「居中 H1 + 3 列卡片」、用 CSS custom properties、≥1 个 `@keyframes`、语义化 HTML5 标签齐全、SEO+GEO（`<title>` / `<meta name="description">` / ≥1 个 `application/ld+json` / FAQ section / 所有 `<img>` 带 alt / `sitemap.xml` + `robots.txt` + `llms.txt` 存在）、fake-door（真实购买类主 CTA、fake-door modal、转化追踪 JS 含 `cta_click` + `email_submit`、modal 文案诚实不出现「立即支付」「下单成功」）；外加 `#000`/`#fff` 抽检。

```bash
bun run skills/lumilab-landing-mvp/scripts/validate-output.ts data/ventures/<slug>
# exit 0 = 8 条 gate 全过；exit 1 = 列出挂掉的 gate
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

`data/ventures/<slug>/landing/v<n>/index.html`（含 fake-door modal + 内嵌转化追踪 JS）· `styles.css` · `copy.md` · `image_catalog.md` · `email_collection_config.md` · `validation_setup.md` · `anti-slop-checklist.md` · `sitemap.xml` · `robots.txt` · `llms.txt`

## Example

`@bot 用 lumilab-landing-mvp 生成 landing` → 6 阶段流水线 → fake-door 验证页（真实购买类主 CTA + fake-door modal + cta_click/email_submit 追踪 JS，OKLCH / 无 Inter / 无 #000#fff）+ 8 条质量 gate 自检日志。

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

- 1.2.0：产品方向调整——从「营销 landing 生成器」重构为「fake-door 验证页生成器」。landing 不再是营销页，而是一个测量真实购买意愿的**验证仪器**：真实购买类主 CTA（「立即购买」/「￥XX 抢先体验」）→ fake-door modal（诚实文案，「即将上线」，留邮箱后明确告知验证阶段）→ 内嵌轻量转化追踪 JS（记录 `cta_click` / `email_submit` 到 localStorage + 可选上报到 Formspree/自有端点）。新增「Fake-door 验证机制（核心）」「验证指标（这个页面要产出什么数字）」两章；用途章重写为「验证仪器，不是营销页」；6 阶段流水线 Phase 0 升级为 fake-door 装配步（不再是简化版邮件捕获）；质量 gate 从 7 条扩到 8 条（加 fake-door gate）；新增 `validation_setup.md` 产物（部署 / 接邮箱端点 / 回收数字）；validate-output.ts 扩展 fake-door 校验（真实购买主 CTA、fake-door modal、追踪 JS 含 cta_click + email_submit、modal 文案诚实）；含完整 fake-door modal HTML + 追踪 JS worked example；指标解读指向 lumilab-weekly-sop-runner 周复盘四桶。
- 1.0.2：新增 SEO + GEO 章节（Phase 5.5）——传统搜索引擎（title / meta / OG / Twitter Card / canonical / sitemap.xml / robots.txt）+ 生成式引擎优化（JSON-LD 结构化数据、FAQPage、实体声明、事实密度、llms.txt、可信度信号），含完整 `<head>` / FAQPage JSON-LD / llms.txt worked example；质量 gate 从 6 条扩到 7 条（加 SEO+GEO gate）；validate-output.ts 扩展校验 `<title>` / meta description / JSON-LD / FAQ section / sitemap.xml / robots.txt / llms.txt；输出清单加 sitemap.xml / robots.txt / llms.txt。
- 1.0.0-rc1：6 阶段不可跳步流水线 + Anti-Slop 三层规则 + 6 条质量 gate；新增 validate-output.ts（确定性跑 6 条 gate）、分支决策表、依赖成本列、package.json；统一产物路径为 landing/v<n>/。

## 环境自检（首次运行前）

本 skill 的 `scripts/` 用 **bun ≥ 1.0** 运行。宿主里第一次调用 Lumi Lab 任意 skill 前，先做一次环境自检——缺 bun 就自动装（装在 `~/.bun/`，无需 root，约 30 秒）：

```bash
command -v bun >/dev/null 2>&1 || { [ -x "$HOME/.bun/bin/bun" ] && export PATH="$HOME/.bun/bin:$PATH"; }
command -v bun >/dev/null 2>&1 || curl -fsSL https://bun.sh/install | bash
export PATH="$HOME/.bun/bin:$PATH"   # 当前 shell 立即可用
```

宿主 agent（Claude Code / OpenClaw / Hermes）能跑 shell，应在首次调用前自动执行上面这段。纯方法论用法（不跑脚本、只读 SKILL.md 做对话）不需要 bun。

## 主动交付（不要静默落盘）

这个 skill 产出的任何**用户该看的东西**，都要主动交付给用户 —— 不能写完文件就完事。

- **优先 HTML 图文并茂**：分析报告、landing、Studio、周复盘等用户要「看」的产物，渲染成 HTML，本地自动开浏览器，chat 环境（`LUMILAB_CHANNEL != local`）作为**文件附件**发给用户。
- **.md / .yaml 产物**：在 chat 里贴一段**纯文字摘要** + 告诉用户文件路径；用户要细节再发完整文件。不要假设用户会自己去翻 `data/ventures/` 目录。
- **每个 phase 结束**：用一两句话告诉用户「这一步做了什么、产出在哪、下一步是什么」。
- **判断「用户该看」的标准**：如果这个产物影响用户的下一个决策，或者用户花了输入成本期待一个结果 —— 就必须主动交付，不能等用户问。
