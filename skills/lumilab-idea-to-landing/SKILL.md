---
name: lumilab-idea-to-landing
description: |
  One-sentence idea → autonomous market analysis → direction proposals → a fake-door validation landing page that measures real purchase intent. The default Lumi Lab entry point for validating C-end startup ideas. An autoplan-style orchestrator: it runs the whole pipeline autonomously, asks the user AT MOST twice (one optional intake, one direction-pick gate), and delivers visual HTML artifacts the user actually sees — not silent .md files. Use when the user gives a startup idea, says "帮我看看这个想法 / 验证一下 / 做个 landing", or wants to go from idea to a testable landing page fast.
  关键词：idea 验证 / 一句话想法 / 市场分析 / 竞品分析 / 方向建议 / landing 生成 / SEO / GEO / orchestrator / 自动流水线 / idea to landing / 想法落地 / 轻量验证
version: 1.4.1
license: Apache-2.0
platforms: [macos, linux]
prerequisites:
  env_vars: []
  commands: [bun]
compatibility: "Claude Code, OpenClaw 2026.4.25+, Hermes Agent v0.13.0+, Cursor, Codex"
metadata:
  lumilab:
    tier: core
    requires_browser: false
    chat_only_ok: true
  hermes:
    tags: [idea-to-landing, orchestrator, market-analysis, landing-page, seo, geo, validation]
  category: orchestrator
  agent: idea_pipeline
  authors: [lumilab]
  upstream:
    - "gstack/autoplan (one-command auto-decision pipeline, surface only taste gates)"
    - "gstack/office-hours (decision-brief AskUserQuestion format, smart stage routing)"
  outputs:
    - "~/.lumilab/data/ventures/<slug>/project_brief.md (idea + 极简 intake)"
    - "~/.lumilab/data/ventures/<slug>/market_analysis.json (自动分析结果，喂给报告渲染器)"
    - "~/.lumilab/data/ventures/<slug>/reports/market-report.html (图文并茂分析报告，主动交付给用户)"
    - "~/.lumilab/data/ventures/<slug>/landing/ (最终 landing page，带 SEO/GEO)"
    - "~/.lumilab/data/ventures/<slug>/decisions.yaml (方向选择记录)"
  reads:
    - "~/.lumilab/secrets.json 或 keychain (判断有没有 TikHub/Exa token → 真 API vs 宿主 LLM 知识)"
    - "MEMORY.md (用户偏好)"
---

# Idea → Landing — Lumi Lab 默认入口

## ⚠️ EXECUTION CONTRACT —— 先读这个，这是硬约束

**这个 SKILL.md 是一条可执行流水线，不是「思考建议」。** 你（宿主 agent）被调用时，必须按 Phase 0→5 一步步执行，跑脚本、写文件、交付产物。下面是不可违反的硬约束：

1. **必须跑脚本。** Phase 里写了 `bun run scripts/...` 的，就真的去跑。不要「假装跑了」或跳过。
2. **分析写进文件，不堆在 chat 里。** Phase 1 的市场/竞品/人群分析**必须**写进 `market_analysis.json`。**禁止**把分析当成大段文字直接发在对话里 —— 那是这个产品最大的失败模式。
3. **必须交付 HTML。** Phase 2 的市场报告、Phase 4 的验证页，**必须**生成 HTML 文件并主动交付给用户（本地开浏览器 / chat 发文件附件）。chat 里只能贴**简短摘要**，不能贴全文。
4. **最多问用户 2 次。** 一次是 Phase 0 的可选 intake（能跳过就跳过），一次是 Phase 3 的方向选择门（用 AskUserQuestion，结构化选项）。**其余 phase 0 提问。**
5. **过了 Phase 3 决策门，必须一路跑到 Phase 5 产出验证页，中间不准停、不准再问。** 不准说「要不要我继续」「你回复一句继续」。决策门之后就是自动执行。
6. **结尾不准是开放问题。** Phase 5 结尾给的是**具体路径选项**（部署 / 调方向 / 看其它方向），不是「你想怎么办」这种开放式审问。
7. **不准在分析阶段回头追问。** Phase 1-2 不准向用户提问。缺信息就推断 —— 推断不出来也先用最合理的假设往下走，在报告里标「（推断）」。

**如果你发现自己在 chat 里写了三段以上的分析文字、或者还没产出任何 HTML 文件就停下来问用户问题 —— 你跑偏了。回到流水线。**

## 这个 skill 是什么

**Lumi Lab 是 C 端创业 idea 的「快速验证」工具。** 这个 skill 是默认入口：

**一句话 idea 进 → 自动市场分析 → 方向建议 → 用户选方向 → 生成「验证工具」（一个能测购买意愿的 fake-door 落地页）。**

注意定位：最终产出的 landing page **不是营销页，是验证仪器**。它的工作是测量一个数字 —— 搜到关键词的人里，有多少人点了「立即购买」、留了邮箱。那个数字就是需求信号。

整条流水线**只在两个地方**停下来问用户：
1. Phase 0：**一次**可选的极简补充（能跳过）
2. Phase 3：**一次**方向选择（3-5 个具体方向 + 推荐，用户选一个 / 说自己的 / 说「你来定」）

其余全自动。用户要的是「帮我判断 + 帮我做出验证工具」，不是「陪我聊」。

> 如果用户**明确说**想被深度追问、想一步步梳理思路 —— 那才转 `lumilab-founder-coach` 深度模式。

## 何时触发

- 用户给一个创业想法 / 产品点子（哪怕只有一句话）
- 用户说「帮我看看这个想法行不行」「验证一下」「做个 landing」「我想做个 X」
- 用户输入 `lumilab idea "<一句话>"`
- 任何「从 idea 到落地 / 验证」的诉求

**不要**因为用户给的 idea「太模糊」就开始一连串追问。模糊是常态 —— 模糊正是这个 skill 要解决的问题。

## 核心原则（来自 gstack）

- **Boil the lake**：AI 边际成本趋零，就把完整的事一次做完。不要因为「可以问用户」就把活推回给用户。
- **Autoplan 式编排**：自动决策，只在真正的品味分叉点停下来。每个 STOP 点都是一个真实的、用户比你更懂的决策。
- **决策简报式提问**：要问的时候，给推荐 + 利弊，用户选就行 —— 不是开放式审问。
- **主动交付**：每个用户该看的产物，都用 HTML 图文并茂呈现并主动推给用户。不要把 .md 静默落盘就完事。

## 反例 —— 这些就是跑偏（实测踩过的坑）

❌ 把市场分析、竞品列表、方向建议**当成大段文字直接发在 chat 里** —— 应该写进 `market_analysis.json` + 渲染成 HTML 报告交付。
❌ 分析做完了，结尾说「你回复一句：继续，我就帮你收窄定位」 —— 这是开放式审问 + 停在半路。应该用 Phase 3 的 AskUserQuestion 决策门，然后**自动继续**。
❌ 跑完分析就停，**没有生成任何 HTML、没有跑到验证页** —— 必须一路跑到 Phase 5。
❌ 在 Phase 1 回头问用户「你的目标用户具体是谁」 —— Phase 1 不准提问，推断。
❌ 读了 SKILL.md 就开始自由发挥地「咨询式对话」 —— 这是可执行流水线，跑脚本、写文件、交付产物。
❌ Phase 2/4 只在 chat 里描述「我帮你做了个 landing，它长这样……」却没有真的生成 HTML 文件 —— 必须有真文件并交付。

---

## Phase 0 · 极简 Intake（最多 1 次提问）

### 0.1 建 venture

从用户的一句话 idea 起一个 venture：

```bash
bun run scripts/orchestrate.ts init "<用户的一句话 idea>"
# → 创建 ~/.lumilab/data/ventures/<slug>/，写 project_brief.md
# → 输出 venture slug + 检测到的 token 状态（决定后面走真 API 还是宿主 LLM 知识）
```

### 0.2 判断要不要问

读用户那句话。**如果已经包含「做什么 + 给谁」两点 → 直接跳到 Phase 1，0 提问。**

只有缺关键信息时，发**一次** AskUserQuestion（决策简报式，全部可跳过），最多 3 个字段：

```
我准备帮你跑一轮市场分析。你可以补充几点，也可以直接跳过 —— 跳过我就自己推断。

· 目标用户大概是谁？（一句话，或「你来推断」）
· 你希望用户用它完成什么？（或「你来推断」）
· 有没有特别想验证的点？（或「没有，你来定」）
```

用 AskUserQuestion 时，每个选项给「我自己推断」作为一等选项，并标为推荐。**不要逼用户打字。**

> 关键：这一次问完就够了。后面 Phase 1-2 不准再回头问。

---

## Phase 1 · 自主分析（0 提问）

**不问任何问题。** 自动跑三路分析，结果写进 `market_analysis.json`。

### 1.1 判断数据源

`orchestrate.ts init` 已经报了 token 状态：
- 有 `TIKHUB_API_KEY` / `EXA_API_KEY` / DataForSEO / Keywords Everywhere → 走真实 API
- 没有 → 用**宿主 LLM 自己的知识**做分析（宿主提供 LLM，这是它该干的）。不要因为没 token 就停下来让用户去配 —— 那违背「轻量」。

### 1.2 四路分析

**市场（market）**
- 有 Exa token：`bun run ../lumilab-research-platforms/scripts/web_exa.ts "<idea 相关查询>" --venture <slug>`
- 无 token：宿主 LLM 基于自身知识写市场概况、规模/增长信号、3 条趋势

**竞品（competitors）**
- 调 `lumilab-research-competitor` 的方法论：直接竞品 / 替代品 / 现状方案（「用户现在用什么凑合」）三类
- 每个竞品记 `what_they_do` + `gap`（他们没做好的）+ `type`
- 至少 3 个，其中至少 1 个是「现状方案 / 不用任何工具」

**人群（audience）**
- 调 `lumilab-research-icp` 的方法论：拒绝「所有人」，收窄到 2-3 个具体细分人群
- 每个人群记 `segment` + `jtbd`（什么场景下挣扎）+ `where_they_are`（在哪找到他们）+ `willingness`（付费意愿信号）

**搜索需求（keywords）—— 定量验证**
- 调 `lumilab-research-keywords`：把 idea 的产品关键词反查 Google 搜索需求（搜索量 / KD / 趋势 / 红蓝海）
  - 有 DataForSEO / Keywords Everywhere token：`bun run ../lumilab-research-keywords/scripts/research.ts --seed="<idea 关键词>" --venture <slug>`
  - 无 token：`--mock`，或宿主 LLM 基于自身知识给定性的搜索需求判断（哪些方向像蓝海、哪些像红海）
- 这是和「市场/竞品/人群」互补的**定量**维度：竞品/人群回答「用户在抱怨什么」，关键词回答「有多少人在主动搜、竞争多激烈」
- 产出 `keyword_landscape.md` + `keyword_metrics.csv`，并把红蓝海 top 关键词摘要进 `market_analysis.json` 的 `keywords` 段

**方向建议（directions）—— 最重要**
- 基于上面三路分析，生成 **3-5 个具体方向**
- 每个方向：`title` + `angle`（定位切口）+ `segment`（针对哪个人群）+ `why_it_works` + `risk`
- 给其中 1 个标 `recommended: true`（你的判断 —— 哪个最值得先验证）
- 方向之间要**真的不同**（不同切口 / 不同人群 / 不同价值主张），不是同一个方向换三种说法

### 1.3 写 market_analysis.json

按 `scripts/orchestrate.ts` 的 schema 写 `~/.lumilab/data/ventures/<slug>/market_analysis.json`。schema 见本文件末尾「## market_analysis.json schema」。

写完跑校验：
```bash
bun run scripts/validate-output.ts ~/.lumilab/data/ventures/<slug>
```

---

## Phase 2 · HTML 分析报告（主动交付）

把 `market_analysis.json` 渲染成图文并茂的 HTML，**主动推给用户**：

```bash
bun run ../lumilab-studio/scripts/market-report.ts ~/.lumilab/data/ventures/<slug>
# → 生成 ~/.lumilab/data/ventures/<slug>/reports/market-report.html
```

然后**交付给用户**（这一步不能省）：
- **本地（LUMILAB_CHANNEL=local 或未设）**：脚本会自动用浏览器打开
- **飞书 / Telegram chat**：把 `reports/market-report.html` 作为**文件附件**发给用户。明确告诉用户「这是市场分析报告，打开看看」
- chat 里同时贴一段**纯文字摘要**：市场一句话 + 竞争一句话 + 3-5 个方向的标题列表（让用户不打开附件也能有概念）

---

## Phase 3 · 方向选择（唯一的决策门）

这是整条流水线**唯一**的品味决策点（autoplan 的 final approval gate）。

用 AskUserQuestion，决策简报式，把 `directions` 里的方向作为选项：

```
D1 — 选一个方向先做 landing 验证
你的 idea：<idea>
分析做完了（见刚才的报告）。我推荐先验证「<recommended 方向的 title>」。

A) <方向1 title>（推荐）
   ✅ <why_it_works>
   ❌ <risk>
B) <方向2 title>
   ✅ <why_it_works>
   ❌ <risk>
...（3-5 个方向）

另外：你也可以直接说你自己的方向，或说「你来定」我就用推荐的那个。
```

- 把 `recommended: true` 的方向放第一个、标「（推荐）」
- 用户选了 → 用那个方向
- 用户说自己的想法 → 用用户的，但快速对照分析结果给一句判断
- 用户说「你来定」 → 用推荐的那个
- 把选择记进 `decisions.yaml`

**用户一选定，立刻进 Phase 4，不要停、不要确认、不要问「要不要我开始做」。** 决策门已经过了，剩下是自动执行。

---

## Phase 4 · 自动生成验证工具（0 提问，不准停）

**过了 Phase 3 决策门，这里开始全自动，一口气跑到 Phase 5。不准问任何问题，不准中途停下来确认。**

用选定的方向，生成一个 **fake-door 验证页** —— 它不是营销页，是验证仪器，工作是测量购买意愿。

### 4.1 自动定设计方向

不要为了设计去开浏览器、不要问用户。基于方向的调性，**自动**定一套 design direction（preset + 配色 + 字体），写 `design_direction.json`：
- **先读全局默认风格**：`~/.lumilab/config.json` 的 `default_design_preset`（用户首次引导时选的）。有就用它作为基准。
- 没有全局默认，或方向调性明显更适合别的 preset → 调 `lumilab-design-direction` 的方法论自动选，**不走**它的浏览器 UI
- 4 个 preset（editorial / minimalist / brutalist / soft）按 idea 调性自动挑

### 4.2 生成 fake-door 验证页

调 `lumilab-landing-mvp`（它已经是 fake-door 验证页生成器，见该 skill 的 `## Fake-door 验证机制` 段）：
- **必须有真实、显眼的主 CTA**：「立即购买」/「立即预订」/「￥XX 抢先体验」—— 真实价格、真实按钮
- **点击主 CTA → fake-door modal**：「即将上线，留个邮箱第一时间通知你」+ 邮箱输入。点击 = 意愿信号，留邮箱 = 强意愿信号
- **内嵌转化追踪 JS**：记录 `cta_click` / `email_submit` 事件
- **必须带 SEO + GEO**（见 `lumilab-landing-mvp` 的 `## SEO + GEO` 段）—— 被搜到才能验证
- 文案调 `lumilab-copy` 方法论；过 Anti-Slop + SEO/GEO + fake-door 质量 gate

### 4.3 校验

```bash
bun run ../lumilab-landing-mvp/scripts/validate-output.ts ~/.lumilab/data/ventures/<slug>
```

没过 gate 就先补齐，不要交付一个残缺的验证页。

---

## Phase 5 · 交付 + 怎么跑这个验证

把验证页**主动交付**给用户，并明确告诉用户**怎么用它做验证、跑完回来报什么数字**：

### 5.1 交付验证页

- **landing HTML**：本地浏览器打开 / chat 发文件附件
- 一段简短摘要（不超过 5 行）：这个验证页主打哪个方向、主 CTA 是什么、怎么测意愿

### 5.2 告诉用户怎么验证（这一步不能省）

```
这是一个验证页，不是成品。它的工作是测「有没有人愿意买」。

怎么用：
1. 部署上线：lumilab deploy <slug>（加密可选，公开验证就别加密）
2. 把链接发到目标人群在的地方（小红书 / 即刻 / 相关社群 / 搜索投放）
3. 跑 3-7 天，回收三个数字：访问量 UV / 主 CTA 点击率 / 邮箱留资率

跑完回来把数字告诉我，我帮你判断这是强信号还是弱信号、要不要继续。
（判断基准见验证页生成时附带的 validation_setup.md）
```

### 5.3 下一步路径（给选项，不是开放问题）

```
接下来你可以：
· 现在就部署：说「部署」，我跑 lumilab deploy
· 想调方向：说方向编号，我重跑 Phase 4
· 想要社媒验证素材：说「来一份小红书/推特」，我生成测意愿的社媒素材
```

如果用户配了 Cloudflare token，可以用 AskUserQuestion 直接问一次「要现在部署吗？」（A=部署 / B=先不）—— 这是决策简报式，不算开放问题。

---

## 分支决策

| 条件 | 走哪条 |
|---|---|
| 用户一句话已含「做什么+给谁」 | 跳过 Phase 0.2 提问，直接 Phase 1 |
| 缺关键信息 | Phase 0.2 发 1 次 AskUserQuestion（可全跳过） |
| 有 TikHub/Exa token | Phase 1 走真实 API |
| 无 token | Phase 1 用宿主 LLM 知识，不停下来让用户配 |
| 用户在 Phase 3 说「你来定」 | 用 `recommended: true` 的方向 |
| 用户在 Phase 3 给了自己的方向 | 用用户的，对照分析给一句判断 |
| 用户明确要「一步步深聊」 | 转 `lumilab-founder-coach` 深度模式 |
| LUMILAB_CHANNEL != local | HTML 产物走文件附件交付 + chat 文字摘要 |
| 用户配了 Cloudflare token | Phase 5 末尾问一次「要现在部署吗」 |

## 何时 NOT 用这个 skill

- 用户**明确**说想被深度追问、想一步步梳理 → `lumilab-founder-coach`
- 用户已有成熟 venture、只想改 landing 某一块 → 直接 `lumilab-landing-mvp`
- 用户只想跑周复盘 / SOP → `lumilab-weekly-sop-runner`

## market_analysis.json schema

```json
{
  "idea": "用户的一句话 idea",
  "slug": "venture-slug",
  "generated_at": "2026-05-14T...",
  "source": "host-llm-knowledge | real-api",
  "intake": {
    "target_user": "用户补充的 或 推断的",
    "job_to_do": "...",
    "validation_focus": "..."
  },
  "market": {
    "summary": "2-3 句市场概况",
    "size_signal": "规模/增长信号（定性也行）",
    "trends": ["趋势1", "趋势2", "趋势3"]
  },
  "competitors": [
    { "name": "...", "what_they_do": "...", "gap": "他们没做好的", "type": "direct|alternative|status-quo" }
  ],
  "audience": [
    { "segment": "细分人群", "jtbd": "什么场景下挣扎", "where_they_are": "在哪找到", "willingness": "付费意愿信号" }
  ],
  "keywords": {
    "source": "dataforseo | keywordseverywhere | host-llm-knowledge | mock",
    "summary": "1-2 句：这个 idea 的搜索需求整体处于什么位置",
    "blue_ocean": [ { "keyword": "...", "volume": 1300, "difficulty": 18, "trend": "↗ +22%" } ],
    "red_ocean":  [ { "keyword": "...", "volume": 40500, "difficulty": 76, "differentiation": "建议的差异化切口" } ],
    "landscape_file": "research/keyword_landscape.md"
  },
  "directions": [
    { "id": "d1", "title": "方向名", "angle": "定位切口", "segment": "针对人群", "why_it_works": "为什么可能成", "risk": "最大风险", "recommended": true }
  ]
}
```

> `keywords` 段可选 —— 完全没有任何调研 token 且宿主 LLM 也没把握时可省略；但有 token 或能给定性判断时应填，让方向建议有定量支撑。

## Output validation

`scripts/validate-output.ts <venture-dir>` 校验：

校验字段:
- `market_analysis.json` 存在且合法 JSON
- `idea` / `slug` / `source` 非空；`source` ∈ {host-llm-knowledge, real-api}
- `market.summary` 非空，`market.trends` ≥ 2 条
- `competitors` ≥ 3 个，每个有 name/what_they_do/gap/type；type ∈ {direct, alternative, status-quo}；至少 1 个 status-quo 或 alternative
- `audience` ≥ 2 个，每个有 segment/jtbd/where_they_are/willingness
- `keywords`（可选）：若存在，需有 `source` + `summary`；`blue_ocean` / `red_ocean` 为数组
- `directions` 3-5 个，每个有 id/title/angle/segment/why_it_works/risk；**恰好 1 个** recommended=true

## Dependencies

| 依赖 | 类型 | 单次成本 | 说明 |
|---|---|---|---|
| bun | CLI runtime | free | ≥1.0 |
| host LLM | 宿主提供 | 取决于宿主 | 分析 + 文案的推理 |
| TikHub API | 可选 HTTP | ~$0.01/次 | 有则 Phase 1 走真实小红书数据 |
| Exa API | 可选 HTTP | ~$0.005/次 | 有则 Phase 1 走真实 Web 搜索 |
| lumilab-research-{platforms,competitor,icp} | 同 bundle skill | free | Phase 1 方法论 |
| lumilab-studio/market-report.ts | 同 bundle 脚本 | free | Phase 2 HTML 报告 |
| lumilab-landing-mvp + lumilab-copy + lumilab-design-direction | 同 bundle skill | free | Phase 4 |

## Outputs

- `~/.lumilab/data/ventures/<slug>/project_brief.md` — idea + intake
- `~/.lumilab/data/ventures/<slug>/market_analysis.json` — 自动分析结果
- `~/.lumilab/data/ventures/<slug>/reports/market-report.html` — 图文并茂分析报告（主动交付）
- `~/.lumilab/data/ventures/<slug>/design_direction.json` — 自动选的设计方向
- `~/.lumilab/data/ventures/<slug>/landing/` — 最终 landing page（含 SEO/GEO）
- `~/.lumilab/data/ventures/<slug>/decisions.yaml` — 方向选择记录

## Example（完整流水线，注意 agent 全程在跑脚本/写文件，不是在 chat 里聊）

```
User（飞书）: 我想做一个帮自由职业者管理多个客户项目的工具
Bot: [跑 orchestrate.ts init] → venture: freelancer-project-hub，token 状态已检测
     [Phase 0.2] idea 已含「做什么+给谁」→ 跳过提问
     [Phase 1] 分析市场/竞品/人群 → 写进 market_analysis.json（不在 chat 里堆文字）
     [跑 validate-output.ts] → 校验通过
     [Phase 2] 跑 market-report.ts → 生成 market-report.html
     → 飞书发 HTML 文件附件 + chat 里只贴 5 行摘要
     [Phase 3] AskUserQuestion：3 个方向，推荐「按客户分账的轻量看板」
User: A
Bot: [Phase 4 立刻开始，不问「要不要继续」]
     自动定 design direction → 跑 landing-mvp 生成 fake-door 验证页
     （真实「立即购买」CTA + fake-door modal + 转化追踪 JS + SEO/GEO）
     [跑 validate-output.ts] → 校验通过
     [Phase 5] 飞书发验证页 HTML 附件 + 5 行摘要
     + 告诉用户「怎么跑这个验证、回收哪 3 个数字」
     + 给路径选项（部署 / 调方向 / 要社媒素材）
```

**反例对照**：如果 Bot 在 Phase 1 把竞品列表、市场分析、方向建议全部当成大段文字发在 chat 里，然后说「你回复『继续』我就帮你收窄」—— 那就是跑偏了。正确做法是上面那样：分析进 JSON，报告是 HTML 附件，决策门用 AskUserQuestion，选完自动跑到验证页。

## Tests

`tests/smoke.md` — 最小冒烟：给一句 idea，确认 5 个 phase 跑通、market_analysis.json 过校验、两个 HTML 产物生成并被交付。

## 环境自检（首次运行前）

本 skill 的 `scripts/` 用 **bun ≥ 1.0** 运行。宿主里第一次调用 Lumi Lab 任意 skill 前，先做一次环境自检——缺 bun 就自动装（装在 `~/.bun/`，无需 root，约 30 秒）：

```bash
command -v bun >/dev/null 2>&1 || { [ -x "$HOME/.bun/bin/bun" ] && export PATH="$HOME/.bun/bin:$PATH"; }
command -v bun >/dev/null 2>&1 || curl -fsSL https://bun.sh/install | bash
export PATH="$HOME/.bun/bin:$PATH"
```

## Idempotency

`orchestrate.ts init` 同名 idea 会复用已有 venture slug，不重复建。`market_analysis.json` 重跑覆盖（分析是可重放的）；`reports/market-report.html` 重渲覆盖；landing 重跑写 `landing/v<n>/` 递增版本，旧版保留。`decisions.yaml` 追加方向选择，不删历史。

## Privacy

idea、分析、landing 全部本地 `~/.lumilab/data/ventures/<slug>/`。无遥测。只有用户显式 `lumilab deploy` 才上传 Cloudflare（且加密）。TikHub/Exa token 走 keychain，不入仓库。

## Cache

`market_analysis.json` 按 idea + intake 内容 hash 缓存——同一 idea 重跑且 intake 没变，可复用上次分析直接进 Phase 2。真实 API 抓取结果按 `lumilab-research-platforms` 的 24h 缓存策略。

## Failure modes

- `orchestrate.ts init` 缺 idea 参数 → 报错 exit 2
- Phase 1 真实 API `E_401/E_429` → 自动降级到宿主 LLM 知识模式，不阻塞，在报告里标 `source` 降级
- `market_analysis.json` 写出来不过校验 → 不进 Phase 2，先修数据
- Phase 4 landing 没过 SEO/GEO gate → 不交付，先补齐
- 用户在 Phase 3 一直不回 → 不催；下次 session 从 `decisions.yaml` 看进度续上

## Edge cases

- idea 是纯技术 infra（没有直接 C 端用户）→ Phase 1 的 audience 用「采购决策者 / 集成方」，directions 偏「最小可演示」
- idea 已经很成熟（用户其实想直接做 landing）→ Phase 1 仍快速跑一遍，但 Phase 3 可以直接推荐「就按你说的做」
- 用户一次给多个 idea → 让用户先选一个（决策简报式），不要并行跑
- 同一秒并发 init 同 idea → slug 去重

## Alternatives

用户现在可能用什么替代方案，以及 Lumi Lab 为什么不一样：

- **通用 LLM「帮我分析这个 idea」**：会给一坨文字分析，但不结构化、不生成 landing、不主动交付 HTML、容易顺着用户说。
- **找人做 landing（外包 / 自己写）**：慢、贵，且不带市场分析的判断。
- **v0 / bolt / lovable**：直接生成页面，但跳过了「这个 idea 行不行、该主打哪个方向」的判断，默认 AI slop 审美，无 SEO/GEO。
- **Notion 创业模板 / 各类「商业计划书生成器」**：静态填空，不做真实分析，不产出可部署的东西。

Lumi Lab 的差异：**一句话进，分析 + 方向判断 + 设计 + SEO/GEO landing 一次出**，全程最多问两次，产物图文并茂主动交付。

## Moat（复利护城河）

跑得越多越值钱：`~/.lumilab/data/ventures/` 下每个 venture 的 `market_analysis.json` + `decisions.yaml` 累积成你的「想法决策库」——下一个 idea 可以对照「我是不是又在追同一类人群」「上次这个方向的风险后来真的发生了吗」。单次分析工具给不了这种跨 venture 的复利。

## Changelog

- **1.2.0** (2026-05-14) — 加硬性 EXECUTION CONTRACT + 反例清单（修 Hermes 实测「分析堆 chat、不出 HTML、结尾问开放问题」的跑偏）。reframe 为 C 端 idea 验证：Phase 4 产出 fake-door 验证页（测购买意愿），Phase 5 加「怎么跑验证 + 回收数据」。
- **1.1.0** (2026-05-14) — 新建。Lumi Lab 默认入口，autoplan 式 orchestrator。

## 主动交付（不要静默落盘）

这个 skill 产出的任何**用户该看的东西**，都要主动交付给用户 —— 不能写完文件就完事。

- **优先 HTML 图文并茂**：分析报告、landing、Studio、周复盘等用户要「看」的产物，渲染成 HTML，本地自动开浏览器，chat 环境（`LUMILAB_CHANNEL != local`）作为**文件附件**发给用户。
- **.md / .yaml 产物**：在 chat 里贴一段**纯文字摘要** + 告诉用户文件路径；用户要细节再发完整文件。不要假设用户会自己去翻 `~/.lumilab/data/ventures/` 目录。
- **每个 phase 结束**：用一两句话告诉用户「这一步做了什么、产出在哪、下一步是什么」。
- **判断「用户该看」的标准**：如果这个产物影响用户的下一个决策，或者用户花了输入成本期待一个结果 —— 就必须主动交付，不能等用户问。
