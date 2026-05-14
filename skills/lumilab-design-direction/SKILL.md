---
name: lumilab-design-direction
description: |
  Design direction picker for venture validation — 4 aesthetic presets (editorial / minimalist / brutalist / soft) + 3 dials (variance / motion / density, 0-100) + brand palette, with iframe live preview. Outputs design_direction.json that landing-mvp / studio / copy all inherit for visual consistency. Lumi-Lab Anti-Slop enforced: OKLCH only, no Inter/Roboto, no purple-gradient. Use when user types /lumilab design-direction, or asks to pick a visual style / aesthetic / color palette / typography before building landing or studio pages.
  关键词：设计方向 / 美学 / 配色 / 字体 / 视觉风格 / 旋钮 / 实时预览 / design direction / aesthetic / color palette / typography / visual style / editorial / minimalist / brutalist / soft / Lumi Lab overlay
version: 1.4.1
metadata:
  hermes:
    tags: [design-direction, aesthetic, dials, live-preview, interactive-card]
  lumilab:
    tier: utility
    requires_browser: true
    chat_only_ok: true
  category: agent
  agent: design
  upstream:
    - "Leonxlnx/taste-skill + pbakaus/impeccable"
  outputs:
    - "data/ventures/<name>/design_direction.json (4 样本 + 3 旋钮 + 调色板 + 字体)"
  status: P0-ready
  full_overlay_in: phase_1
  interactive_page:
    script: scripts/serve.ts
    template: templates/design-direction.html.tpl
    port: 7777
license: Apache-2.0
platforms: [macos, linux]
prerequisites:
  env_vars: []
  commands: [bun]
compatibility: "Claude Code, OpenClaw 2026.4.25+, Hermes Agent v0.13.0+, Cursor, Codex"
---

# design-direction — Lumi Lab Overlay (Minimal P0)

## 用途

提供 `Design direction - 4 presets + 3 dials + register` 能力。P0 极简 overlay 策略：frontmatter + 触发词 + 引用上游 + Lumi Lab 规则叠加。

## 上游引用

- Leonxlnx/taste-skill + pbakaus/impeccable

完整内容（已下载）：
- `/Users/cheche/workspace/skills-fun/Lumi Lab/reference/skills/`
- `/Users/cheche/workspace/skills/01_active_research/lumi-lab/collected_skills/`

## Lumi Lab 上下文叠加

- **产物路径**：data/ventures/<name>/ 对应文件
- **关联记忆**：相关 entity 写入 memory/resources/
- **Anti-Slop**：产物被 landing-mvp / content-repurpose 消费前必扫（见 IMPLEMENTATION_PLAN §6）
- **平台约束**：涉及 5 平台时必读 memory/resources/platform-rules/<platform>.md

## 风格由 idea 驱动（被 idea-to-landing 调用时的核心原则）

当 `lumilab-idea-to-landing` 在 Phase 4 自动调用本 skill 时，**设计风格必须由这个 idea 的产品特征 + 人群特征推导**，不是直接套用户首次引导选的全局预设：

1. **主依据 = idea 特征**：产品调性（工具/内容/社交/高客单价/快消/B 端/潮流）+ 人群（年龄、审美、所在平台、对设计感的敏感度）→ 映射到具体 preset 倾向 + OKLCH 配色 + 字体 + 3 旋钮。
   - 「给宝妈的育儿记录 app」→ soft、低饱和暖色、圆角、克制动效
   - 「给开发者的 CLI 工具」→ minimalist/brutalist、高对比、等宽字体、近零动效
2. **全局 `default_design_preset` 只作兜底** —— 仅当 idea 特征不足以判断时才退回它。它是用户口味基线，不是「每个 idea 都套同一个」。
3. 把推导依据写进 `design_direction.json` 的 `rationale` 字段（一句话）。

用户**显式**调 `/lumilab design-direction`（不是被流水线调）时，仍走浏览器 4 选 1 + 旋钮的交互页 —— 那是用户主动定制。

## Phase 1 深度 overlay

- 重写关键 references/
- 中文本地化加深
- 跨 venture portfolio 沉淀（已验证 ≥3 次的 takeaway 升格到 resources/）

## 交互页（P0-ready）

5 步：选样本 → 调 3 旋钮（variance/motion/density，取值 0–100，step 10）→ 选品牌色 → live preview → 提交。
产物：`data/ventures/<venture>/design_direction.json`。

```bash
bun run skills/lumilab-design-direction/scripts/serve.ts <venture-slug>
# → 自动打开 http://localhost:7777/<venture>/design-direction
# → 提交后 server 自动关闭，可继续在终端进行后续 Skill
```

四套样本：`editorial` | `minimalist` | `brutalist` | `soft`，均符合 IMPLEMENTATION_PLAN §6 Anti-Slop（禁 Inter / 禁 #000#fff / 禁居中三列卡片）。

## 必做约束

```
✓ 产物结构遵守 Lumi Lab schema（ARCHITECTURE.md §10.3）
✓ 输出过 Anti-Slop
✓ 不替用户决策（user_challenge 类必 surface）
```

## Chat-only fallback (LUMILAB_CHANNEL != local)

`LUMILAB_CHANNEL=feishu` / `telegram` 等环境下浏览器 7777 不可用，自动切换 **interactive card 模式**（OpenClaw / Hermes 都支持卡片按钮路由为 COMMAND 事件）：

1. agent 发出一张卡片含 4 个按钮：`editorial` / `minimalist` / `brutalist` / `soft`
2. 用户点一个 → 卡片更新为 3 个旋钮（variance / motion / density）每个 ±10 按钮 + 当前值
3. 调完点「生成预览」→ agent 调 `lumilab-deploy` 输出 HTML 文件附件发回 chat
4. 用户在飞书内点击 HTML 附件即可在系统浏览器查看

card 不支持时降级为纯文本编号：

```
Bot: 选风格 [1=editorial 2=minimalist 3=brutalist 4=soft]
User: 1
Bot: variance (0-100, 默认 40)?
...
```

输出写入 `data/ventures/<slug>/design_direction.json`，与浏览器模式 schema 完全一致，下游 skill（landing-mvp / studio）无需改动。

## 分支决策

| 条件 | 动作 |
|---|---|
| `LUMILAB_CHANNEL=local` 且浏览器可用 | 启 `localhost:7777`，5 步交互页 |
| `LUMILAB_CHANNEL=feishu` / `telegram` | 切 interactive card 模式（4 按钮 + 旋钮 ±10） |
| runtime 不支持卡片按钮 | 降级为纯文本编号交互 |
| 端口 7777 被占 | 顺延 7778 / 7779 / 7780 |
| 同时关闭 motion + 高 density | 警示对比度不足，要求用户复核 |
| iframe live preview 渲染失败 | 退化为静态 4 样本图片 |
| `design_direction.json` 已存在 | 覆盖写入；旧版可手动归档为 `design_direction.v<n>.json` |

## Output validation

`scripts/validate-output.ts` 确定性校验 `design_direction.json` 是否符合 Lumi Lab schema：`preset` 为 editorial/minimalist/brutalist/soft 之一、`samples` 恰好 4 个且 id 合法、`dials` 含 variance/motion/density 三项且均为 0-100 整数、`palette` 至少 1 个 `oklch()` 颜色且无 `#000`/`#fff`、`typography` 不含 Inter/Roboto。

```bash
bun run skills/lumilab-design-direction/scripts/validate-output.ts data/ventures/<slug>
# exit 0 = schema 合法；exit 1 = 列出每条违例
bun run skills/lumilab-design-direction/scripts/validate-output.ts --help
```

用户提交后必跑；schema 不合法直接 exit 1，阻止下游 landing-mvp / studio 消费坏数据。

## Dependencies

| 依赖 | 类型 | 是否付费 | 单次调用成本 | 说明 |
|---|---|---|---|---|
| bun | CLI runtime | 免费 | $0（本地 HTTP server + 校验） | ≥1.0，必需 |
| host LLM | 由 Claude Code / OpenClaw / Cursor / Hermes 提供 | 取决于宿主 | $0（交互页纯前端，不调 LLM）；chat fallback 约 $0.005 | 浏览器模式不耗 LLM，仅 chat 编号模式有少量对话 |

## Outputs

`data/ventures/<slug>/design_direction.json` 字段：`preset`（editorial|minimalist|brutalist|soft）、`samples`（恰好 4 项，每项 `id` 属预设集）、`dials`（`variance`/`motion`/`density`，均为 int 0-100）、`palette`（≥1 个 `oklch()` 颜色，禁 `#000`/`#fff`）、`typography`（display + body 字体名，禁 Inter/Roboto）。由 `scripts/validate-output.ts` 强制校验。

## Changelog

- 1.0.0-rc1：4 预设 + 3 旋钮 + 实时预览交互页 + chat-only 卡片降级；新增 validate-output.ts schema 校验器、分支决策表、依赖成本列、package.json；补全 description 触发关键词。

## Example

`lumilab design-direction <venture>` → 浏览器 7777；chat 模式 interactive card

## Tests

`tests/smoke.md` — 该 skill 的最小冒烟测试约定：让 host LLM 在对话中跑通 SKILL.md「真实示例」段即视为通过。E2E 真集成见 `docs/TUTORIAL.zh.md`。

## Idempotency

`design_direction.json` 每次提交覆盖；旧版本可手动归档到 `design_direction.v<n>.json`。

## Privacy

4 样本 HTML 完全本地；旋钮调整不发送任何分析数据。

## Cache

4 样本 + 3 旋钮 token 静态化；preview 渲染按 token hash 缓存。

## Failure modes

iframe live preview 失败时退化为静态 4 样本图片；浏览器不可用时切 interactive card / 文本编号 fallback。

## Edge cases

variance / motion / density 旋钮取值 0–100 各 step 10；同时关闭 motion + 高 density → 警示对比度不足。

## Alternatives

用户现在可能用什么替代方案，以及 Lumi Lab 为什么不一样：

- **通用 LLM「给我个设计风格」**：给文字描述，无法实时预览、无法量化调节。
- **Figma / Dribbble 找灵感**：要人工翻译成 token，不沉淀。

Lumi Lab 的差异：4 套美学样本 + 3 旋钮（variance / motion / density）+ iframe 实时预览，输出 design_direction.json 下游直接消费。

## Moat（复利护城河）

design_direction.json 一旦定下，landing / studio / copy 全部继承同一审美。跨 venture 复用形成你的设计语言。

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

## 写时更新（产物变了就刷新 home / studio）

Lumi Lab 用「写时更新」保持 home dashboard 和 venture Studio 是最新的 —— 没有常驻进程做实时同步，所以**谁改了数据，谁负责顺手刷新**。

这个 skill 只要**创建或更新了某个 venture 的文件**（写了 `market_analysis.json` / `reports/` / `landing/` / `decisions.yaml` / `design_direction.json` / retro YAML 等），做完后**必须**：

1. 重渲这个 venture 的 Studio：`bun run ../lumilab-studio/scripts/render.ts ~/.lumilab/data/ventures/<slug>`
2. 重渲 home dashboard：`bun run ../lumilab-home/scripts/home.ts render`

这样用户回到 home 或 Studio 就能立刻看到这一步的产物，不用手动说「刷新」。如果只是读、没写 venture 数据，不用刷新。

CLI 入口（`lumilab idea` / `config` / `deploy`）已经内置了写时更新；**对话式调用时由你（宿主 agent）负责补这两步**。
