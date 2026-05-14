---
name: lumilab-studio
description: |
  HTML rendering engine + interactive decision pages for venture Studio. Renders MD/YAML data layer into spatial HTML (Thariq "values reading" pattern). Generates index.html with SVG progress diagram, decisions/* interactive pages (clarify, design-direction, retro, manage), and preview/* asset previews. Supports dual mode (file:// static read + localhost:7777 interactive). Auto re-renders on data change. Use when the user types /lumilab studio, when any data/ventures/ file changes and the dashboard needs re-rendering, or when an interactive decision page (config / manage / retro) must open.
  关键词：studio / 作战室 / 项目网页 / html dashboard / svg progress / 交互页 / 渲染引擎 / dual mode / file 协议 / localhost / 数据驱动渲染
version: 1.0.1
metadata:
  hermes:
    tags: [studio, html, editorial, progress, venture-journal]
  lumilab:
    tier: utility
    requires_browser: false
    chat_only_ok: true
  category: foundation
  agent: infrastructure
  upstream:
    - "Thariq Shihipar: HTML effectiveness patterns"
    - "Web Crypto / Web APIs"
  outputs:
    - "data/ventures/<name>/studio/index.html (作战室主页 + SVG progress)"
    - "data/ventures/<name>/studio/decisions/02-clarify-hypotheses.html"
    - "data/ventures/<name>/studio/decisions/04-design-direction.html (★ 旋钮 + Live Preview)"
    - "data/ventures/<name>/studio/decisions/08-weekly-retro.html"
    - "data/ventures/<name>/studio/preview/{landing,content-xhs,content-wechat,...}.html"
  reads:
    - "data/ventures/<name>/* (所有数据)"
    - "design_direction.json (视觉 token)"
license: Apache-2.0
platforms: [macos, linux]
prerequisites:
  env_vars: []
  commands: [bun]
compatibility: "Claude Code, OpenClaw 2026.4.25+, Hermes Agent v0.13.0+, Cursor, Codex"
---

# Studio — HTML 渲染引擎 + 交互页

## 用途

把 venture 的 MD/YAML 数据**渲染**成「值得读」的 HTML（Thariq 启发）。

3 类输出：
1. **index.html** — 作战室主页，永久可访问，含 SVG progress diagram
2. **decisions/*** — 关键决策交互页（4 个 P0，5 个 P1）
3. **preview/*** — 资产预览（landing + 5 平台内容）

## 双模式

| 模式 | 何时 | 实现 |
|---|---|---|
| **本地交互** | Setup Wizard / design-direction / clarify / retro / manage | `localhost:7777` bun HTTP server |
| **本地只读** | 看 index / preview | `file://` 直接打开 |
| **公网部署** | `/lumilab deploy` 后 | Cloudflare Pages + 客户端加密 + 密码门 |

## 何时触发

- Agent 写入 `data/ventures/<name>/` 任何文件 → auto-rerender 对应 HTML
- 用户 `/lumilab studio [venture]` → 浏览器打开 index
- 用户 `/lumilab design-direction` → 启动 localhost + 打开 design-direction.html
- 用户 `/lumilab config` / `/lumilab manage` → 启动 localhost + 打开 setup/manage

## 渲染流程

```
1. 读 data/ventures/<name>/*（MD/YAML 数据底层）
2. 解析 design_direction.json → 注入 tokens.css
3. renderIndex → index.html（含 SVG progress）
4. renderDecisions → decisions/*.html（交互页）
5. renderPreview → preview/*.html（资产预览）
6. validate-output.ts 校验结构 → 通过才算完成
```

数据变化触发 auto-rerender，重复步骤 2-6。

## 渲染引擎

### 技术栈

- **bun** 运行时（无框架，零依赖最小化）
- **string template** + **YAML/JSON 解析**（js-yaml）
- **Marked**（MD → HTML）
- **highlight.js** 可选（代码高亮）

### 入口

```ts
// scripts/render.ts
import { renderIndex, renderDecisions, renderPreview } from './renderers';

export async function renderStudio(venturePath: string) {
  await renderIndex(venturePath);
  await renderDecisions(venturePath);
  await renderPreview(venturePath);
}

// Watch mode（P1）
// 文件变化自动 rerender
```

### 模板组织

```
skills/lumilab-studio/
├── SKILL.md
├── templates/
│   ├── base.html.tpl              # 公共 layout（head / nav / footer）
│   ├── index.html.tpl             # 作战室主页
│   ├── components/
│   │   ├── progress-diagram.svg.tpl   # ★ 9 阶段 SVG（Thariq 加强 1）
│   │   ├── hypothesis-card.html.tpl
│   │   ├── hypothesis-diff.html.tpl   # ★ supersede diff（Thariq 加强 2）
│   │   ├── metric-card.html.tpl
│   │   ├── decision-timeline.html.tpl
│   │   ├── task-list.html.tpl
│   │   └── asset-cards.html.tpl
│   ├── decisions/
│   │   ├── 02-clarify-hypotheses.html.tpl
│   │   ├── 04-design-direction.html.tpl   # ★ 旋钮 + Live Preview
│   │   ├── 08-weekly-retro.html.tpl
│   │   └── (P1 add 5 more)
│   ├── preview/
│   │   ├── landing.html.tpl
│   │   ├── content-xhs.html.tpl
│   │   ├── content-wechat.html.tpl
│   │   └── content-{douyin,moments,x}.html.tpl
│   ├── storytelling-explainer.html.tpl   # ★ deploy 版第一屏（Thariq 加强）
│   └── styles/
│       ├── tokens.css             # 来自 design_direction.json
│       ├── studio.css             # Studio 自身样式
│       └── components.css
├── scripts/
│   ├── render.ts
│   ├── render-index.ts
│   ├── render-decisions.ts
│   ├── render-preview.ts
│   ├── render-storytelling.ts
│   ├── serve.ts                   # localhost HTTP server
│   ├── watch.ts                   # 文件变化重渲染（P1）
│   └── shutdown.ts
└── references/
    └── template-syntax.md
```

## index.html 结构

渲染产物 `studio/index.html` 必含字段：`<svg class="progress-diagram">`（≥5 个 `.stage` 节点）、progress timeline / hypotheses / metrics / decisions / assets 五个区块、且不含禁用字体与 `#000`/`#fff`。由 `scripts/validate-output.ts` 强制校验。详见 PRODUCT_DESIGN §5.5.1。关键区块：

```
1. Header（venture name + day count + 设置）
2. Progress Timeline (SVG ★)
   - 9 阶段节点（Idea / Coach / Research / Product / Build / Launch / Retro）
   - 当前位置高亮
   - 已完成节点可点击下钻
3. Today's Brief（当日任务卡）
4. Hypotheses（3-5 个 active 假设 ledger，含 diff view 触发）
5. Live Metrics（4 个核心指标可视化）
6. Recent Decisions Timeline（最近 5 条决策）
7. Assets Cards（landing / content / sop / metrics 卡片）
```

### SVG Progress Diagram（Thariq 加强 1）

```svg
<svg viewBox="0 0 800 120" class="progress-diagram">
  <!-- 9 节点 + 连线 + 当前位置 -->
  <g class="stages">
    <circle class="stage done" cx="50" cy="60" r="20" data-stage="idea"/>
    <circle class="stage done" cx="140" cy="60" r="20" data-stage="coach"/>
    <circle class="stage done" cx="230" cy="60" r="20" data-stage="research"/>
    <circle class="stage done" cx="320" cy="60" r="20" data-stage="product"/>
    <circle class="stage current" cx="410" cy="60" r="22" data-stage="build"/>
    <circle class="stage pending" cx="500" cy="60" r="20" data-stage="launch"/>
    <circle class="stage pending" cx="590" cy="60" r="20" data-stage="retro"/>
    <!-- ... -->
  </g>
  <g class="labels">
    <text x="50" y="100">Idea</text>
    ...
  </g>
</svg>
```

CSS：
- `done` → 主色填充
- `current` → 脉冲动画 + 大一圈
- `pending` → 灰色 outline
- 点击 → 下钻到该阶段产物

### Hypothesis Diff View（Thariq 加强 2）

详见 hypothesis-ledger SKILL.md §「★ Diff View」。

## decisions/04-design-direction.html（★ 关键交互页）

```
- 4 套样本卡片（Editorial / Minimalist / Brutalist / Soft），可点选
- 3 个旋钮（VARIANCE / MOTION / DENSITY 1-10），实时调
- 5 套品牌色，可选
- Live Preview 区块（实时渲染 Hero block 反映当前选择）
- 提交按钮 → POST localhost:7777/api/design-direction → 写 design_direction.json
```

Live Preview 实现：
- 内嵌 `<iframe srcdoc="...">` 或 dynamic `<style>` 注入
- 改旋钮 → JS 修改 CSS custom properties → Hero 区块实时变化

## decisions/08-weekly-retro.html（★ 决策卡）

详见 PRODUCT_DESIGN §5.5.3。3 选项卡（继续 / 调整 / 暂停归档）+ 自由输入。

## preview/* 资产预览

每个资产 HTML 顶部带：
- 「Preview · Last updated {ts}」banner
- 自检 gate 状态显示
- 「复制 / 下载 / 部署」按钮
- 移动端尺寸切换器（375 / 768 / 1024 / 1440）

## storytelling-explainer.html.tpl（★ deploy 第一屏）

详见 PRODUCT_DESIGN §10。Deploy 版的第一屏不是 dashboard，而是 storytelling：

```
- Hero：venture 一句话定位 + 一张主图
- 痛点：用户当前的问题（来自 painpoints.md）
- 解决方案：venture 的回应
- 验证状态：当前实验的关键指标 + 假设状态
- 关键产物：1-2 个最强 asset 链接
- 「查看完整作战室」按钮 → 跳 dashboard
```

## HTTP Server（scripts/serve.ts）

```ts
import { serve } from 'bun';

export function startServer(workspacePath: string, port = 7777) {
  return serve({
    port,
    async fetch(req) {
      const url = new URL(req.url);
      
      // POST API endpoints
      if (req.method === 'POST') {
        if (url.pathname === '/api/design-direction') {
          const data = await req.json();
          await writeDesignDirection(workspacePath, data);
          return Response.json({ ok: true });
        }
        if (url.pathname === '/api/hypotheses') {
          // ... 
        }
        // ...
      }
      
      // GET static files
      return serveStatic(workspacePath, url.pathname);
    }
  });
}
```

端口冲突 → 7778 / 7779 / 7780 顺延。

## Anti-Slop（Studio 自己也必须遵守）

Studio 是 VST 给用户的第一印象。**自己长得不能像 AI 做的**。

- 字体：Cabinet Grotesk / Geist Mono（不 Inter）
- 颜色：OKLCH 中性 + 单一 accent（用户 design_direction 决定）
- 布局：split-screen 或 zig-zag（不居中 + 3 列卡片）
- 动画：staggered reveal + spring physics
- 数字：用 Geist Mono 显示，monospace 排版

## 跨 runtime user-input 协议

```yaml
user_input:
  - mode: browser
    method: "localhost:7777/* HTML POST"
  - 自动 spawn bun process（用户不感知）
```

## 必做约束

```
✓ 数据底层 MD/YAML 不变，HTML 是呈现层
✓ 任何 data 变化自动 rerender HTML
✓ 双模式清晰（file:// vs localhost vs deploy）
✓ 端口冲突自动顺延
✓ Studio 自己过 Anti-Slop 6 条 gate
✓ SVG progress 节点可点击下钻
✓ Hypothesis diff view 旧/新并排 + 高亮变化
```

## 引用

- 上游：见 metadata.upstream
- 配套：所有 Skill（消费它们的输出）
- 配套：lumilab-deploy（消费 Studio 产物）

## 分支决策

| 条件 | 动作 |
|---|---|
| Agent 写入 `data/ventures/<name>/` 任何文件 | auto-rerender 对应 HTML，数据底层不变 |
| 用户 `/lumilab studio` 且只看 index/preview | `file://` 直接打开，不启 server |
| 用户 `/lumilab design-direction` 或 config/manage | 启 `localhost:7777`，交互页 POST 回写 |
| 端口 7777 被占 | 顺延 7778 / 7779 / 7780 |
| YAML 解析失败 | 不破坏旧 HTML，输出 `studio/index.error.html` 含诊断 |
| hypothesis 数 > 50 | SVG progress 自动分组渲染 |
| 用户 `/lumilab deploy` | 转 lumilab-deploy，Cloudflare Pages + 加密 + 密码门 |

## Output validation

`scripts/validate-output.ts` 确定性校验渲染后的 `studio/index.html`：必含 `<svg class="progress-diagram">` 且 ≥5 个 `.stage` 节点、必含 progress timeline / hypotheses / metrics / decisions / assets 五个区块、且不含禁用字体（Inter/Roboto/Arial）和 `#000`/`#fff`。

```bash
bun run skills/lumilab-studio/scripts/validate-output.ts data/ventures/<slug>
# exit 0 = 结构完整且过 Anti-Slop 抽检；exit 1 = 列出缺失区块 / 违例
bun run skills/lumilab-studio/scripts/validate-output.ts --help
```

每次 render 后必跑；确保 HTML 呈现层结构完整、Studio 自身不长成 AI slop。

## Dependencies

| 依赖 | 类型 | 是否付费 | 单次调用成本 | 说明 |
|---|---|---|---|---|
| bun | CLI runtime | 免费 | $0（本地渲染 + HTTP server） | ≥1.0，必需 |
| host LLM | 由 Claude Code / OpenClaw / Cursor / Hermes 提供 | 取决于宿主 | $0（纯模板渲染，不调 LLM） | Studio 是确定性渲染引擎，不直连 LLM |

## Outputs

`data/ventures/<slug>/studio/index.html`（含 SVG 进度 + 假设卡 + 决策时间线）· `studio/decisions/*.html` · `studio/preview/*.html`

## Example

`lumilab render <venture>` → 打开 file:///.../studio/index.html

## Tests

`tests/smoke.md` — 该 skill 的最小冒烟测试约定：让 host LLM 在对话中跑通 SKILL.md「真实示例」段即视为通过。E2E 真集成见 `docs/TUTORIAL.zh.md`。

## Idempotency

`studio/index.html` 每次重渲覆盖；hypothesis / decision 数据来自 YAML，YAML 不动 HTML 不动。

## Privacy

HTML 完全本地；只有用户主动 `lumilab deploy` 才上传 Cloudflare（且加密）。

## Cache

YAML mtime + content hash 决定是否重渲；模板（Fraunces / JetBrains Mono / SVG progress）静态化。

## Failure modes

YAML 解析错误 → 不破坏老 HTML，输出 `studio/index.error.html` 含诊断信息。

## Edge cases

hypothesis 数 > 50 时 SVG progress 自动分组；中文长标题自动换行；OKLCH 不被 sRGB 覆盖。

## Alternatives

用户现在可能用什么替代方案，以及 Lumi Lab 为什么不一样：

- **Notion / 飞书文档**：能记录但不渲染 SVG 进度图、不渲染假设 supersede diff。
- **v0 / 通用 LLM 生成 dashboard**：默认 AI slop 审美，不接 venture YAML。
- **Figma**：要手动画，不自动从数据生成。

Lumi Lab 的差异：MD/YAML → 编辑磁带式 HTML（Fraunces + OKLCH + SVG 9 阶段进度 + 假设 ledger + 决策时间线），数据驱动自动渲染。

## Moat（复利护城河）

每个 venture 一个 Studio，跨 venture 的 Studio 横向看就是你的创业作品集。数据变 HTML 自动变，永远不过时。

## Changelog

- 1.0.0-rc1：MD/YAML → 编辑磁带式 HTML 渲染引擎 + 双模式 + SVG 9 阶段进度图；新增 validate-output.ts 校验器、分支决策表、依赖成本列。

## 环境自检（首次运行前）

本 skill 的 `scripts/` 用 **bun ≥ 1.0** 运行。宿主里第一次调用 Lumi Lab 任意 skill 前，先做一次环境自检——缺 bun 就自动装（装在 `~/.bun/`，无需 root，约 30 秒）：

```bash
command -v bun >/dev/null 2>&1 || { [ -x "$HOME/.bun/bin/bun" ] && export PATH="$HOME/.bun/bin:$PATH"; }
command -v bun >/dev/null 2>&1 || curl -fsSL https://bun.sh/install | bash
export PATH="$HOME/.bun/bin:$PATH"   # 当前 shell 立即可用
```

宿主 agent（Claude Code / OpenClaw / Hermes）能跑 shell，应在首次调用前自动执行上面这段。纯方法论用法（不跑脚本、只读 SKILL.md 做对话）不需要 bun。
