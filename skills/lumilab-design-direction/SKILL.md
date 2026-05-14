---
name: lumilab-design-direction
description: |
  Design direction - 4 presets + 3 dials + register. Lightweight overlay over upstream skill(s). Lumi-Lab-specific Anti-Slop and platform constraints applied when output is consumed by other VST Skills.
  关键词：design-direction / VST overlay
version: 1.0.0-rc1
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

# design-direction — VST Overlay (Minimal P0)

## 用途

提供 `Design direction - 4 presets + 3 dials + register` 能力。P0 极简 overlay 策略：frontmatter + 触发词 + 引用上游 + VST 规则叠加。

## 上游引用

- Leonxlnx/taste-skill + pbakaus/impeccable

完整内容（已下载）：
- `/Users/cheche/workspace/skills-fun/Lumi Lab/reference/skills/`
- `/Users/cheche/workspace/skills/01_active_research/lumi-lab/collected_skills/`

## VST 上下文叠加

- **产物路径**：data/ventures/<name>/ 对应文件
- **关联记忆**：相关 entity 写入 memory/resources/
- **Anti-Slop**：产物被 landing-mvp / content-repurpose 消费前必扫（见 IMPLEMENTATION_PLAN §6）
- **平台约束**：涉及 5 平台时必读 memory/resources/platform-rules/<platform>.md

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
✓ 产物结构遵守 VST schema（ARCHITECTURE.md §10.3）
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

## Dependencies

| 依赖 | 类型 | 是否付费 | 说明 |
|---|---|---|---|
| bun | CLI runtime | 免费 | ≥1.0，必需 |
| host LLM | 由 Claude Code / OpenClaw / Cursor / Hermes 提供 | 取决于宿主 | Lumi Lab 本身不直连 LLM，复用宿主 |

## Outputs

`data/ventures/<slug>/design_direction.json`（4 样本 + 3 旋钮）

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
