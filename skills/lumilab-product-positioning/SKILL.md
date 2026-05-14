---
name: lumilab-product-positioning
description: |
  April Dunford 5-step positioning (competitive alternatives → unique attributes → value → customers who care → market category). Lumi-Lab overlay with Anti-Slop and platform constraints. Use when the user asks how to introduce their product, has a landing page with high bounce, is stuck on "what market am I in", or growth has stalled and positioning is suspected.
  关键词：product-positioning / 产品定位 / 市场定位 / April Dunford / Obviously Awesome / 竞争性替代品 / 市场类别 / 定位陈述 / VST overlay
version: 1.0.0
metadata:
  hermes:
    tags: [positioning, april-dunford, obviously-awesome]
  lumilab:
    tier: overlay
    requires_browser: false
    chat_only_ok: true
  category: agent
  agent: product
  upstream:
    - "alirezarezvani/product-discovery + product-strategist"
    - "April Dunford《Obviously Awesome》"
    - "April Dunford《Sales Pitch》"
  status: P0-overlay-minimal
  full_overlay_in: phase_1
  outputs:
    - "data/ventures/<name>/positioning.md"
    - "data/ventures/<name>/positioning_statement.md"
    - "data/ventures/<name>/competitive_alternatives.md"
  reads:
    - "data/ventures/<name>/audience.md"
    - "data/ventures/<name>/hypotheses.yaml"
    - "data/ventures/<name>/project_brief.md"
license: Apache-2.0
platforms: [macos, linux]
prerequisites:
  env_vars: []
  commands: [bun]
compatibility: "Claude Code, OpenClaw 2026.4.25+, Hermes Agent v0.13.0+, Cursor, Codex"
---

# product-positioning — VST Overlay

## 用途

帮独立开发者 / OPC 在不进入「我们做了个更好的 X」这种陷阱的前提下，把产品放到一个对的市场类别里，让目标用户用 5 秒就「啊原来你是这个」。

不是 logo、不是 slogan、不是 brand voice。**Positioning = context-setting**。

## 何时调用

**触发**：
- 用户问「我怎么跟别人介绍我的产品」
- 用户写了 landing 但跳出率高 / 转化奇差
- 用户卡在「市场到底是什么」
- founder-coach 在 Layer 1 完成 audience.md 后 chain 过来
- 用户产品已存在 6+ 月但增长停滞，怀疑是定位问题

**不要调用**：
- idea 还没成型 → 先去 lumilab-founder-coach
- 产品 0 用户 0 访谈 → 先去 lumilab-product-pmf 的访谈阶段
- 只是想要个 tagline → 那是 copywriting，不是 positioning

## 方法论核心

### April Dunford 5 步（《Obviously Awesome》）

```
Step 1. Competitive alternatives  → 用户「不用你」的时候用什么
Step 2. Unique attributes        → 你独有 / 显著更强的能力
Step 3. Value (so what)          → 这些能力给用户带来什么实际价值
Step 4. Customers who care a lot → 谁会**特别**在乎这些价值
Step 5. Market category          → 把你放进这群人脑子里已有的格子
```

关键 insight（很多人漏）：
- competitive alternatives 通常**不是同类产品**。是 Excel、是「忍着不做」、是「外包」、是「写个脚本」。
- market category 不是你拍脑袋发明的——是**用户脑子里已经存在的那个抽屉**。你不教育市场，你借用已有认知。
- "Better X" 是死亡陷阱：用户已经用 X 凑合活着，没动力换。

### 反例 vs 正例

❌ "我们是更好的 Notion" → 死。Notion 用户没动力切换。
✅ "我们是给中文独立开发者的 launch checklist 工具" → 活。新格子，谁在乎一目了然。

❌ "AI 驱动的智能写作助手" → 哪一类？AI 工具？写作工具？哪个职业？
✅ "给小红书博主的爆款标题打分器" → 抽屉清晰。

## 工作流程

HARD-GATE 模式：一次一题，等用户回答再下一题。

### Step 0 · 读取上下文

```
读 audience.md → 拿到 archetype
读 project_brief.md → 拿到产品当前描述
读 hypotheses.yaml → 看 positioning 相关假设有没有立项
```

### Step 1 · 列竞争性替代品（不是同类对手）

问用户：

> Q1：如果你的产品**今晚消失**，你那群目标用户明天早上会用什么继续做这件事？
>
> 至少列 3 个。可以是：
> ○ 同类竞品（如 Notion、Cal.com）
> ○ 通用工具凑合（Excel / Google Docs / Telegram 群）
> ○ 人肉方法（手抄 / 外包给助理 / 老板亲自做）
> ○ "什么都不做，忍着"
>
> 你列：[___]

**追问**：每一个替代品，让用户写一句话「为什么用户现在勉强用它」+「它哪里让用户难受」。

### Step 2 · 找独有 / 显著更强的属性

```
Q2：对比你列的所有替代品，你的产品独有 / 或显著做得更好的能力是什么？
    （能力，不是 value。这一步只列「我有什么」）

    例：
    ○ 内置 5 平台合规规则（小红书/抖音/快手/视频号/B站）
    ○ 中文 prompt 本地化
    ○ 5 秒生成
    ○ 不需要登录
    
    最多列 5 条，每条加一句「替代品 A/B/C 哪个有 / 没有」。
```

### Step 3 · 把 attribute 翻译成 value（so what）

```
Q3：对每一条 attribute，问 3 遍 "so what"。
    
    [attribute] → 用户能做什么 → 用户能少做什么 → 用户能多挣 / 少亏什么
    
    例：内置 5 平台合规 → 不用每个平台查规则 → 不用为了 30 字标题查 1h → 多发 4 篇内容 / 周
```

### Step 4 · 找「特别在乎」的那群人

```
Q4：上一步列出的 value，**谁特别在乎**？不是「都会喜欢」，是「会为此付钱 / 推荐 / 用得停不下来」。
    
    给 specific 描述：
    ○ 行业 / 职业
    ○ 阶段（早期 / 成熟）
    ○ 一个可识别的痛点信号（"每周加班 X 小时做 Y"）
    
    例：每周发 ≥5 篇小红书 + 已被限流过 1 次以上的内容创作者
```

⚠️ 如果用户答「所有内容创作者」→ HALT，告诉他这就是 positioning 失败的根因。回 Step 4 收窄。

### Step 5 · 选 market category

```
Q5：你目标用户**脑子里已经有的那个抽屉**叫什么？
    
    候选（提供 3-5 个，让用户选）：
    ○ "小红书爆款工具"（已存在的格子）
    ○ "内容合规检查器"（半存在）
    ○ "AI 标题打分器"（新格子，需要轻教育）
    ○ "创作者运营助手"（很大，竞争激烈）
    
    选 1 个。如果都不对，列你自己想的。
```

**判定原则**：
- 优先选「用户已经在搜的关键词」（去看小红书 / 知乎 / 微信指数）
- 如果新格子，必须能用 1 句话教育（"这是个 X，但专门做 Y"）

### Step 6 · 合成 positioning statement

```
模板（April Dunford 版）：

For [target customer]
who [pain / context],
[product] is a [market category]
that [unique value].
Unlike [primary alternative],
we [key differentiator].
```

中文模板：

```
[产品] 是给 [谁] 的 [品类]，
帮他们 [核心价值]。
和 [主要替代品] 不一样的是，[关键差异]。
```

让用户填，VST 给 critique。

## 真实示例

**Venture**: 小红书爆款标题打分器 "TitleHero"

**Step 1 · 替代品**：
- ChatGPT（凑合用，但不懂小红书规则）
- 5118 / 新红（贵 + 偏数据分析非生成）
- 自己抄爆款（最常见，效率低）
- "忍着发，看天意"

**Step 2 · Unique attributes**：
- 内置小红书 2026 最新违禁词库 + 限流词
- 中文中性偏种草语气模型
- 输入选题 5 秒出 10 个标题 + 各自爆款分

**Step 3 · Value**：
- 不用每次自己抄 30 篇爆款找规律
- 不用担心被限流（已避开违禁词）
- 一个选题能 A/B 测 10 个标题

**Step 4 · Who cares a lot**：
- 每周发 ≥5 篇 + 商单 ≥3 万/月 + 被限流过 ≥1 次的腰部博主

**Step 5 · Market category**：
- "小红书爆款工具"（已有抽屉，搜索词存在）

**Step 6 · Positioning statement**：

> TitleHero 是给商单月入 3 万 + 的小红书腰部博主用的爆款工具，5 秒给一个选题打出 10 个不会被限流的标题。和你自己手抄爆款不一样的是，我们内置 2026 最新违禁词库，发出去的标题不会废稿。

## 输出 schema

`positioning.md` 字段：Step 1 Competitive alternatives（≥3，必含 1 个人肉/凑合方法）/ Step 2 Unique attributes / Step 3 Value / Step 4 Customers who care a lot（具体行为信号，禁「所有 X 用户」）/ Step 5 Market category / Step 6 Positioning statement / Validation / Linked hypotheses。`positioning_statement.md` 字段：一行版 + 一段版 + landing hero 版，禁「更好的 X」。`competitive_alternatives.md` 字段：≥3 条替代品列表。由 `scripts/validate-output.ts` 强制校验。

写 `data/ventures/<name>/positioning.md`：

```markdown
# Positioning · <venture-name>

## Step 1 — Competitive alternatives
- ChatGPT — 凑合，不懂小红书规则
- 5118 / 新红 — 贵 + 偏分析
- 手抄爆款 — 慢
- 不做 — 看天意

## Step 2 — Unique attributes
- 内置 2026 违禁词库
- 中文种草语气
- 5 秒 10 个标题

## Step 3 — Value
...

## Step 4 — Customers who care a lot
每周 ≥5 篇 + 商单 ≥3 万/月 + 被限流过 ≥1 次的腰部博主

## Step 5 — Market category
"小红书爆款工具"（已有抽屉）

## Step 6 — Positioning statement
<完整一段>

## Validation
- 测试 5 个目标用户，让他们读完后 1 句话复述产品
- 通过：≥3 个能准确说出 category + who it's for
- failed: ≤2 → 回 Step 4/5 调

## Linked hypotheses
- h-007: 目标用户脑子里的 category 是「小红书爆款工具」而非「AI 写作」
- h-008: 「2026 违禁词库」是 top-3 attribute
```

并写 `positioning_statement.md`（一行版 + 一段版 + landing hero 版）。

## 反 Slop 自检

- [ ] competitive alternatives 至少包含 1 个「人肉方法 / 凑合」（不是只有同类产品）
- [ ] market category 不是「AI 驱动的 XX」「智能 XX」「下一代 XX」
- [ ] target customer 有可识别的行为信号（不是「所有 X 用户」）
- [ ] unique attribute 至少 1 条是替代品**真的没有**的（不是「我们做得更好」）
- [ ] positioning statement 读出来 ≤ 25 秒
- [ ] 没出现：赋能 / 打造 / 心智 / 抓手 / 链路 / 用户画像

## Chat-only fallback

无浏览器 / 无 file UI 时（飞书 chat / 微信 / 终端）：

```
VST 在 chat 里走 6 题 HARD-GATE。每题用编号选项让用户回 "Q1: 2,3" 这种格式。
最后把 positioning statement 直接贴在 chat 里，让用户复制走。
不写 file，但提示用户："建议把这段贴到 data/ventures/<name>/positioning.md，
下次 landing-mvp / launch-strategy 会读。"
```

## VST 上下文叠加

- **产物路径**：data/ventures/<name>/positioning*.md
- **关联记忆**：market category + competitive alternatives 写入 memory/resources/categories/
- **下游消费**：lumilab-landing-mvp（hero copy）/ lumilab-launch-strategy（PR） / lumilab-content-repurpose（一致口径）
- **平台约束**：若 launch 涉及小红书 / 抖音 / 视频号，读 memory/resources/platform-rules/<platform>.md 确认 category 措辞不违规

## 必做约束

```
✓ HARD-GATE 一次一题
✓ Step 1 强制包含「人肉方法 / 凑合」选项
✓ Step 4 不允许「所有 X 用户」泛化
✓ 输出过 Anti-Slop
✓ positioning_statement.md 落盘（landing-mvp 必读）
✓ 不替用户拍板 category（user_challenge surface）
```

## 引用

- April Dunford《Obviously Awesome》(2019)
- April Dunford《Sales Pitch》(2023)
- 上游：alirezarezvani/product-discovery
- 配套：lumilab-founder-coach（前置）/ lumilab-landing-mvp（下游）/ lumilab-launch-strategy（下游）

## 分支决策

| 条件 | 动作 |
|---|---|
| idea 还没成型 | HALT，回 lumilab-founder-coach |
| 产品 0 用户 0 访谈 | HALT，先做用户访谈再回来 |
| 用户只想要 tagline | 转 lumilab-copy，positioning ≠ copywriting |
| Step 4 用户答「所有 X 用户」 | HALT 在 Step 4，强制收窄到可识别行为信号 |
| unique attributes 列出 < 2 条 | 回 Step 2 再深挖，不进 Step 3 |
| positioning statement 含「更好的 X」 | 拒绝定稿，回 Step 5 重选 category |
| 5 步走完且 validation ≥3/5 通过 | 落盘，路由到 lumilab-landing-mvp / lumilab-content-repurpose |

## Output validation

`scripts/validate-output.ts` 确定性校验 `positioning.md`（必含 Step 1-6 + Validation + Linked hypotheses）、`positioning_statement.md`（非空、不含「更好的 X」反模式）、`competitive_alternatives.md`（≥3 个替代品）。

```bash
bun run skills/lumilab-product-positioning/scripts/validate-output.ts data/ventures/<slug>
# exit 0 = 5 步完整 + 无 better-X 反模式；exit 1 = 列出缺失项
bun run skills/lumilab-product-positioning/scripts/validate-output.ts --help
```

定稿前必跑；自动拦截「跳步」和「更好的 X」死亡陷阱。

## Dependencies

| 依赖 | 类型 | 是否付费 | 单次调用成本 | 说明 |
|---|---|---|---|---|
| bun | CLI runtime | 免费 | $0（本地执行） | ≥1.0，必需 |
| host LLM | 由 Claude Code / OpenClaw / Cursor / Hermes 提供 | 取决于宿主 | 约 $0.01–0.03（6 题 HARD-GATE 对话 + critique，复用宿主额度） | Lumi Lab 本身不直连 LLM，复用宿主 |

## Outputs

`data/ventures/<slug>/positioning.md` · `positioning_statement.md` · `competitive_alternatives.md`

## Example

见 SKILL.md「真实示例」段

## Tests

`tests/smoke.md` — 该 skill 的最小冒烟测试约定：让 host LLM 在对话中跑通 SKILL.md「真实示例」段即视为通过。E2E 真集成见 `docs/TUTORIAL.zh.md`。

## Idempotency

`positioning.md` 重跑写到 `positioning.v<n>.md`；April Dunford 5 步每次都写完整一遍，方便对比。

## Privacy

本地文件，无外部依赖。

## Cache

5 步模板常量；竞品列表读 `competitor.md`，同一 mtime 直接复用。

## Failure modes

若 unique attributes 列出 < 2 → 提示再深挖；market category 与 alternatives 矛盾 → 警告。

## Edge cases

反 "better X" 检测：positioning statement 含 "the only" / "the first" 才通过；"who cares a lot" 必须是具体 segment。

## Alternatives

用户现在可能用什么替代方案，以及 Lumi Lab 为什么不一样：

- **通用 LLM「帮我定位」**：容易写成"更好的 X"。
- **定位类书 / 课**：知道方法但不针对你的产品逐步走。

Lumi Lab 的差异：April Dunford 5 步严格走完，反"better X"检测（必须有 "the only" / "the first"），"who cares a lot" 必须是具体 segment。

## Moat（复利护城河）

positioning.v<n>.md 版本对比能看到定位如何收窄。一旦定位确定，下游 copy / landing / launch 全部继承，一致性是品牌资产。

## Changelog

- 1.0.0-rc1：April Dunford 5 步 HARD-GATE 流程 + 反 better-X 检测；新增 validate-output.ts 校验器、分支决策表、依赖成本列、package.json。
