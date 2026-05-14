---
name: lumilab-research-competitor
description: |
  Competitor / alternative landscape 真的有用的那种。不做 feature matrix。基于 April Dunford 竞争定位框架 + Clayton Christensen disruption theory + "alternatives to nothing" 思维。把"竞品"扩展为：直接竞品 / 间接替代品 / status quo（什么都不做） / forced-choice 替代。Use when 用户准备做定位、写 landing、要回答"为什么选你不选 X"，或在 pivot 前想看清楚周围地形。
  关键词：competitor / 竞品分析 / 替代品 / alternatives / April Dunford / positioning / disruption / 反 feature matrix / status quo
version: 1.1.0
metadata:
  hermes:
    tags: [competitor, positioning, april-dunford, christensen]
  lumilab:
    tier: overlay
    requires_browser: false
    chat_only_ok: true
  category: agent
  agent: research
  authors: [vst-team]
  upstream:
    - "alirezarezvani/competitive-intel"
    - "alter123/idea-validator-zh"
    - "April Dunford — Obviously Awesome, Sales Pitch"
    - "Clayton Christensen — Innovator's Dilemma, Disruptive Innovation"
    - "Andy Raskin — Greatest Sales Deck (strategic narrative)"
  outputs:
    - "data/ventures/<name>/competitor_landscape.md"
    - "data/ventures/<name>/positioning.yaml"
    - "data/ventures/<name>/alternatives_quadrant.md"
  reads:
    - "data/ventures/<name>/icp.yaml"
    - "data/ventures/<name>/yc_brief.md"
license: Apache-2.0
platforms: [macos, linux]
prerequisites:
  env_vars: []
  commands: [bun]
compatibility: "Claude Code, OpenClaw 2026.4.25+, Hermes Agent v0.13.0+, Cursor, Codex"
---

# research-competitor — 真有用的竞品地形

## 何时调用

**触发**：
- 用户准备写 landing page 但说不清"为什么选我们"
- 用户在 cold outreach / 销售对话里被反复问"那你们和 X 有什么区别"
- 准备做定位 / messaging / pricing 调整
- pivot 前想看清楚 idea 邻接生态
- 投资人 / 加速器 / 客户问"你的市场是谁主导，你能切下哪块"

**反触发**：
- 用户连 ICP 都没定 → 先走 `lumilab-research-icp`
- 用户实际要找的是"行业研究" / market sizing → 这不是竞品 skill 的范围
- 用户要做的是"功能对比表给销售看" → 那是销售工具不是定位工具；本 skill 拒绝产出 feature matrix
- 用户想知道"哪个竞品融了多少钱" → 走 lumilab-research-market（独立 skill）

## 方法论核心

### 一、April Dunford — 竞品 ≠ 看起来像你的产品

Dunford 在 _Obviously Awesome_ 中明确：**你的真竞品是用户脑子里那个"如果不选你，会选什么"的清单**。
这个清单 90% 的情况下，**第一名是"什么都不做" / "维持现状" / "拿个 Excel 凑合"**。

定位的本质：让用户在这个清单里，把你排到第一。

**Dunford 5-step positioning**：
1. List your true competitive alternatives（含 status quo）
2. Isolate your unique attributes（你有他们没有的）
3. Map those to value（这些 attribute 解决了什么真痛）
4. Find who cares the most（这价值对哪个 segment 最值钱）
5. Pick a market frame（你要让用户脑子里把你归到哪一类）

### 二、Clayton Christensen — Disruption Theory 简化版

- **Sustaining innovation**：在主流维度做得更好（更快/更便宜/更智能）
- **Low-end disruption**：从在位者看不上的低端切入（够用 + 便宜）
- **New-market disruption**：服务"非消费者"——之前根本没在用任何方案的人

对 OPC / 独立开发者，**几乎只能走 low-end + new-market**。
你不要和 Notion / Salesforce 在功能完备上拼，你要找"Notion 用起来太重 / Salesforce 买不起"的人。

### 三、Alternatives Quadrant（本 skill 核心产物）

```
         主动找替代          被动接受
       ┌──────────────┬──────────────┐
高频   │ A 直接竞品    │ B 间接替代品  │
       │              │              │
       ├──────────────┼──────────────┤
低频   │ C forced-     │ D status quo │
       │   choice      │   /什么都不做 │
       └──────────────┴──────────────┘
```

- **A 直接竞品**：用户主动搜过、和你目标接近的产品
- **B 间接替代品**：用户在用但不是为同一个 job 设计的（Excel、Notion、人工）
- **C forced-choice**：用户偶尔被逼用一次（找熟人代做、Fiverr 临时找一次）
- **D status quo**：根本不做 / 拖着 / 接受现状

**关键洞察**：90% 的中国独立产品死于忽视 D。你的真敌人是"用户继续摆烂"。

### 四、八维评估（替代旧 feature matrix）

每个竞品 / 替代品在 8 维上打 1-5 分（不是越高越好，是描述）：

1. **Job fit** — 多大程度解决目标 JTBD？
2. **Cost (full)** — 钱 + 时间 + 学习曲线 + 切换成本
3. **Trust / brand familiarity** — 用户敢不敢用
4. **Distribution reach** — 用户多容易遇到它
5. **Lock-in** — 用户离开它有多痛
6. **Iteration speed** — 它更新有多快
7. **Native pain (the schlep they refuse to do)** — 它不愿做但用户需要的事
8. **Anti-positioning surface** — 你可以从哪一角度反它（"X 太重，我们轻"）

**第 7、8 维最关键**——是你能赢的地方。

### 五、Strategic Narrative（Andy Raskin）

最终竞品分析要能回答：
1. 世界发生了什么变化？
2. 这个变化让谁输了？谁会赢？
3. 在新世界里，"赢家"长什么样？
4. 我们就是那条通往"赢家"的路。

定位是一个故事，不是一张表。

## 工作流程

### 步骤 0 · 输入

```
✓ 读 icp.yaml（必须有，否则不能开始）
✓ 读 yc_brief.md
✓ 询问用户：现在 ICP 用户被问"如果不用你，会用什么？"时回答什么？
```

### 步骤 1 · 列 alternatives（不是列竞品）

```
VST: 不要先想竞品。我们先想——你的 ICP 用户今天不用你的产品时，他们的一天是怎么过的？
     列 ≥ 8 个替代方案，包含：
     - 看起来像你产品的（直接竞品）
     - 八竿子打不着但用户实际在用的（间接：Excel、微信群、Notion、人）
     - 偶尔逼一次的临时方案
     - "拖着不解决"
```

### 步骤 2 · 落入 2x2

每个替代方案问两个问题：
- 用户多主动地选它？（主动找 vs 被动接受）
- 用户多频繁地用它？（高频 vs 低频）

落格。结果通常会震惊用户——他真正要打的不是 A 格，是 D 格（status quo）。

### 步骤 3 · 八维打分（只对 A、B 格做；C、D 简写即可）

打分 + 一行评语。重点是第 7、8 维。

### 步骤 4 · Anti-positioning 提炼

```
VST: 看每个 A/B 格替代品的第 8 维。你能从哪个角度反它？
     - 反"太贵" / 反"太重" / 反"太通用" / 反"太工程师向"
     - 反"中心化" / 反"要绑账号" / 反"学习曲线高"

     给我 1 个最锋利的 anti-positioning 句子：
     "X 是给 {他们的 ICP} 的，我们是给 {你的 ICP} 的。"
```

### 步骤 5 · Disruption 路径选择

```
VST: 选一个：
     ○ Low-end disruption（够用便宜，吃在位者看不上的人）
     ○ New-market disruption（吃从来没用过这类产品的人）
     ○ Sustaining（你确定要和大厂拼功能？小心）
```

### 步骤 6 · Strategic narrative 一段话产出

回答 Andy Raskin 4 问，落成一段 < 150 字的故事。

### 步骤 7 · 输出三件产物

## 真实示例 / Worked Example

**Venture**：帮独立 UI/插画师管账 App（接前一个 ICP 案例）

```
步骤 1 alternatives 列表：
1. 一木记账 / 鲨鱼记账（个人记账 App）
2. 金蝶 / 用友（中小企业财务）
3. Excel + 微信收据截图 — 90% 用户在用
4. 飞书 + Notion 自建模板
5. 找会计代理记账（¥500-2000/月）
6. 找朋友帮忙（forced）
7. "拖到报税前 2 周熬夜手算"（status quo）
8. 直接放弃报税 / 找人挂靠

步骤 2 2x2：
A (主动+高频): 一木记账（但对发票/合同处理弱）
B (被动+高频): Excel + 微信截图，飞书+Notion 自建
C (主动+低频): 找会计代理、Fiverr 临时
D (status quo): 拖到报税前 — ★ 真敌人 ★

步骤 3 八维打分（节选 D / Excel）：
D status quo（拖到报税前熬夜手算）：
  job_fit=2 cost=time-heavy trust=5 distribution=NA lock-in=0
  iteration=0 native_pain=0 anti_positioning_surface=
  "你不是懒，是工具不会读你的合同；我们 5 分钟搞定。"

B Excel + 截图：
  job_fit=3 cost=3 trust=5 distribution=NA lock-in=2
  iteration=0 native_pain=4（Excel 不会读合同 PDF）
  anti_positioning_surface=
  "Excel 不知道你今年接了几个甲方；我们知道。"

A 一木记账：
  job_fit=3 cost=2 trust=4 distribution=4 lock-in=3
  iteration=3 native_pain=4（不处理 B 端合同 / 发票链路）
  anti_positioning_surface=
  "一木是给上班族管工资的，我们是给独立设计师管甲方的。"

步骤 4 Anti-positioning：
"一木记账是给打工人的。我们是给独立设计师的。
 我们读合同、跟甲方、出报税包——不是另一个流水账 App。"

步骤 5 Disruption 路径：
new-market disruption — 独立设计师从来不被记账软件正经服务过。

步骤 6 Strategic narrative：
"中国 30-50 万独立设计师过去 5 年靠 Excel 和微信截图撑着报税。
甲方拖款 / 季度报税让她们每 3 个月失眠一次。
通用记账 App 把她们当上班族，企业财务又把她们当公司。
独立设计师值得一个为她们而生的财务伙伴——读合同、催甲方、自动出报税包。
这就是我们。"
```

## 输出 schema

`data/ventures/<name>/positioning.yaml`：

```yaml
positioning:
  market_frame: "为独立设计师而生的财务伙伴"
  for_who: "中国独立 UI/插画师 - B 端长期甲方型"
  not_for_who: "上班族 / 中小公司 / 自由职业全行业"
  unlike: "一木记账（给打工人）/ 金蝶（给公司）"
  we: "读合同、跟甲方、自动出报税包"

  alternatives:
    direct: ["一木记账", "鲨鱼记账"]
    indirect: ["Excel + 微信截图", "飞书 + Notion 自建"]
    forced_choice: ["代理记账", "找朋友"]
    status_quo: ["拖到报税前熬夜", "干脆放弃报税"]
    primary_enemy: status_quo  # ★ 关键 ★

  disruption_path: "new-market"

  anti_positioning_line: "一木是给打工人的。我们是给独立设计师的。"

  strategic_narrative: |
    中国 30-50 万独立设计师过去 5 年靠 Excel 和微信截图撑着报税。
    甲方拖款 / 季度报税让她们每 3 个月失眠一次。
    通用记账 App 把她们当上班族，企业财务又把她们当公司。
    独立设计师值得一个为她们而生的财务伙伴。
```

`data/ventures/<name>/alternatives_quadrant.md` 含 2x2 ASCII + 每格说明。
`data/ventures/<name>/competitor_landscape.md` 含八维评估表 + anti-positioning 候选。

## 反 Slop 自检

- ❌ 出现 feature matrix（一长条表格列谁有什么功能）— 拒绝产出。Dunford 明确禁止
- ❌ 把 status quo 漏掉 — 必须出现在 2x2 D 格
- ❌ "我们要做 X 领域的颠覆者 / 赛道领导者" — 删
- ❌ 用"打造护城河" / "构建壁垒" — 改成具体 lock-in 机制
- ❌ Anti-positioning 写成"我们更好 / 我们更便宜 / 我们更智能" — 拒，这不是定位
- ❌ Strategic narrative 超过 200 字 — 砍
- ✅ 必须命名 primary_enemy（且通常是 status quo）
- ✅ 八维评估必须包含 native_pain + anti_positioning_surface 两列
- ✅ "for who / not for who" 双向都要明确

## Chat-only fallback

聊天环境下：把步骤 1 的"列 8 个 alternatives"做成 1 条消息，让用户语音/文字回；
2x2 落格用纯文本 ASCII 画出来（不用图）；八维评估只对 A、B 格做，每个竞品给 3 行评分而不是表格。
最终输出 strategic narrative 段落直接发到对话里供用户复制；yaml 用代码块跟在后面。
不要在聊天里推 PDF / 图表，所有产物 markdown 化。

## 关联

- 上游：见 metadata.upstream
- 前置：`lumilab-research-icp`（必须先有 ICP）
- 配套：`lumilab-research-interview`（访谈里挖"如果没有这个 你会用什么"问题）
- 下游：`lumilab-copy` hero / FAQ "我们和 X 有什么不同"、`lumilab-landing-mvp` positioning band
- 升级：positioning.yaml 进入 `memory/resources/positioning-library/` 当跨 ≥3 venture 复用

## 分支决策

| 条件 | 动作 |
|---|---|
| `icp.yaml` 不存在 | 拒绝开始，先走 `lumilab-research-icp` |
| 用户列出 alternatives < 3 个 | 提示补「alternatives to nothing」，回步骤 1 |
| 用户要「功能对比表给销售看」 | 拒绝产出 feature matrix（Dunford 明确禁止） |
| 用户问「竞品融了多少钱」 | 转 `lumilab-research-market`，不在本 skill 范围 |
| 2x2 落格后 D 格（status quo）为空 | 强制回步骤 2 补全，D 格通常是真敌人 |
| 用户问「哪个竞品更好」 | 不答优劣，转为八维描述性打分 + anti-positioning |

## Dependencies

| 依赖 | 类型 | 是否付费 | 单次调用成本 | 说明 |
|---|---|---|---|---|
| bun | CLI runtime | 免费 | free（本地执行） | ≥1.0，必需 |
| host LLM | 由 Claude Code / OpenClaw / Cursor / Hermes 提供 | 取决于宿主 | ~6-10K tokens / 次完整分析 | Lumi Lab 本身不直连 LLM，复用宿主 |

## Output validation

`scripts/validate-output.ts`（bun，确定性校验）检查 `positioning.yaml`（`for_who` / `not_for_who` / `market_frame`、`alternatives` 四类齐全、`primary_enemy` 已命名、`disruption_path ∈ {low-end,new-market,sustaining}`）与 `competitor_landscape.md`（含 `native_pain` + `anti_positioning` 两维，且不是被禁的 feature matrix）。

```bash
bun run scripts/validate-output.ts data/ventures/<slug>/   # exit 0 = valid, 1 = invalid
bun run scripts/validate-output.ts --help
```

校验字段:
- `positioning.yaml` → `positioning`: object（必含 `for_who` / `not_for_who` / `market_frame`，均为 string）
- `positioning.yaml` → `positioning.alternatives`: object（必含 `direct` / `indirect` / `forced_choice` / `status_quo` 四类）
- `positioning.yaml` → `primary_enemy`: string（必须命名，April Dunford 规则）
- `positioning.yaml` → `disruption_path`: enum（`low-end` | `new-market` | `sustaining`）
- `competitor_landscape.md` → 必含 `native_pain` + `anti_positioning` 两维；禁止 ≥5 列的 feature matrix 表头

## Outputs

- `data/ventures/<slug>/competitor_landscape.md`（八维评估表 + anti-positioning 候选）
- `data/ventures/<slug>/positioning.yaml`（Dunford 5-step 定位结构）
- `data/ventures/<slug>/alternatives_quadrant.md`（2x2 ASCII + 每格说明）

## Example

见 SKILL.md「真实示例」段

## Tests

`tests/smoke.md` — 该 skill 的最小冒烟测试约定：让 host LLM 在对话中跑通 SKILL.md「真实示例」段即视为通过。E2E 真集成见 `docs/TUTORIAL.zh.md`。

## Idempotency

`competitor_landscape.md` 表格追加新行，旧行保留并标 `last_checked: <date>`。

## Privacy

只读公开信息（产品页 / 定价页），不爬取内部数据；引用统一标 URL + 访问日期。

## Cache

竞品页面快照按 URL hash 缓存到 `research/competitor-snapshots/`，30 天复用一次。`competitor_landscape.md` 带 `last_checked` 时间戳，未过期不重抓。

## Failure modes

若用户列 < 3 个 alternatives → 提示考虑 "alternatives to nothing"；feature matrix 不超过 8 行（防过度比较）。

## Edge cases

Christensen disruption 分类需用户主动指认（不自动判断）；forced-choice 类竞品需注明触发场景。

## Alternatives

用户现在可能用什么替代方案，以及 Lumi Lab 为什么不一样：

- **通用 LLM「列竞品」**：给 feature matrix，不分替代品 / 直接竞品 / forced-choice。
- **G2 / Capterra**：只有同类直接竞品，看不到"alternatives to nothing"。

Lumi Lab 的差异：April Dunford 竞争框架 + Christensen disruption 分类 + "用户现在不用任何工具"也算竞争对手。

## Moat（复利护城河）

`competitor_landscape.md` 带 `last_checked` 时间戳，竞品快照缓存到 `research/competitor-snapshots/`。跑得越久越能看到竞品演化轨迹。

## Changelog

- **1.0.0-rc1** — 加 `## Changelog` / `scripts/package.json` / `校验字段:` 显式 schema 声明；Dependencies 表补单次调用成本列。
- **0.3.0** — `validate-output.ts` 加 `disruption_path` 枚举校验 + feature matrix 检测（Dunford-banned）；`anti-slop-lint.ts` 接入。
- **0.2.0** — 补 `## 分支决策` if-then 表、`primary_enemy` 强制命名、八维评估表加 `native_pain` + `anti_positioning`。
- **0.1.0-p0** — 初版：April Dunford 5-step 定位 + Christensen disruption 分类 + alternatives 四象限。

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
