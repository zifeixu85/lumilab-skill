---
name: lumilab-copy
description: |
  文案不是写出来的，是从用户原话里挖出来的。基于 Joanna Wiebe Copy Hackers VoC mining + Eugene Schwartz 5 awareness stages + 经典 headline 框架（4U / PAS / AIDA / BAB）+ 中文小红书/公众号 hook patterns。强制反 Slop 用词清单（禁"赋能/打造/赛道/闭环/心智/抓手"等）。Use when 用户要写 landing hero、邮件主题、小红书标题、公众号开头、cold outreach 第一句、广告短文案。
  关键词：copy / 文案 / VoC / voice of customer / 5 awareness stages / Joanna Wiebe / Eugene Schwartz / Schwartz / Wiebe / headline / hook / 标题 / 反 Slop
version: 1.4.1
metadata:
  hermes:
    tags: [copywriting, eugene-schwartz, voice-of-customer, 4u, pas, aida]
  lumilab:
    tier: overlay
    requires_browser: false
    chat_only_ok: true
  category: agent
  agent: content
  authors: [lumilab]
  upstream:
    - "johndoeblocks/copy-skill"
    - "shipshitdev/copy-validator"
    - "Joanna Wiebe — Copy Hackers (VoC mining, message hierarchy)"
    - "Eugene Schwartz — Breakthrough Advertising (5 awareness stages)"
    - "David Ogilvy — Ogilvy on Advertising"
    - "Ann Handley — Everybody Writes"
    - "营销百问 / 小马宋 / 半佛仙人（中文 hook 范式）"
  outputs:
    - "data/ventures/<name>/copy_brief.yaml"
    - "data/ventures/<name>/copy_candidates.md (≥5 候选)"
    - "data/ventures/<name>/voc_mining.md"
  reads:
    - "data/ventures/<name>/icp.yaml"
    - "data/ventures/<name>/positioning.yaml"
    - "data/ventures/<name>/interviews/*.md"
    - "data/ventures/<name>/interview_synthesis.md"
license: Apache-2.0
platforms: [macos, linux]
prerequisites:
  env_vars: []
  commands: [bun]
compatibility: "Claude Code, OpenClaw 2026.4.25+, Hermes Agent v0.13.0+, Cursor, Codex"
---

# copy — 文案 = 用户原话 + 结构

## 何时调用

**触发**：
- 准备写 landing hero（H1 + sub + CTA）
- 准备写 cold email / DM 首句
- 写小红书笔记标题 / 公众号开头 100 字
- 写广告位短文案
- 用户说"AI 写的文案没人看"（必然——因为用了 AI 默认 Slop 词）

**反触发**：
- 用户没有 ICP / interviews — 拒做。无 VoC 来源就写不出好 copy
- 用户要的是长文 / 教程 / 知识科普 — 走 lumilab-content-longform
- 用户要做的是品牌 manifesto — 走 lumilab-brand
- 用户要 SEO 文章 — 走 lumilab-seo-write

## 方法论核心

### 一、Joanna Wiebe 的核心命题

**"Don't write copy. Steal it from your customers."**

最好的 H1 通常是某个用户在访谈/评论/工单里的原话。
你的工作不是创作，是 mining + framing。

#### VoC mining 五个矿井

1. 访谈转录（lumilab-research-interview 产出）
2. 应用商店 / 大众点评 / 小红书评论区（关于竞品的）
3. 客服工单 / 退款理由
4. Reddit / 即刻 / 小红书 / 知乎搜索目标 JTBD 关键词
5. 销售对话录音 / 客户邮件

挖什么：
- 用户怎么说自己的痛
- 用户怎么说当前替代品
- 用户怎么说"如果有 X 就好了"
- 用户用什么动词、什么名词、什么形容词

### 二、Eugene Schwartz — 5 Awareness Stages

来自 _Breakthrough Advertising_（广告史上最贵的二手书）。
文案的语气和切入完全取决于用户对问题/方案的认知阶段：

| 阶段 | 用户状态 | 文案该做什么 | 例 |
|---|---|---|---|
| Unaware | 不知道自己有问题 | 制造问题意识，讲故事 | "你以为接私单是自由，其实你每季度多熬 3 个通宵" |
| Problem-aware | 知道有问题，不知有解 | 共情痛 + 暗示有解 | "独立设计师的报税地狱，没人帮你说话" |
| Solution-aware | 知道有类方案，未知你 | 强调差异化 | "Excel 不会读你的 PDF 合同——我们会" |
| Product-aware | 知道你的产品，未买 | 攻克异议 + 紧迫感 | "今天试 14 天，Q2 报税前就能用上" |
| Most-aware | 已知很多，等优惠 | 给具体 offer | "限本周 ¥69 解锁全年财务包" |

**90% 的 AI 默认文案都假设用户在 Solution-aware。这就是它写出来没人看的根因**——
你的真实早期用户多数在 Problem-aware 甚至 Unaware。

### 三、经典 headline 框架（选一，不要混用）

#### 4U（Michael Masterson）

每个 headline 检查 4 项：
- **Useful**（有用）
- **Urgent**（紧迫）
- **Unique**（独特）
- **Ultra-specific**（具体到数字/时间/人）

#### PAS — Problem, Agitate, Solve

```
P: 独立设计师报税前总要熬夜
A: 因为 Excel 不读 PDF、甲方合同永远在微信里、记事本永远找不到
S: 我们把它们自动收齐，5 分钟出报税包
```

#### AIDA — Attention, Interest, Desire, Action

经典广告漏斗。长文案/邮件序列用。

#### BAB — Before, After, Bridge

```
Before: 每季度报税前 2 周失眠
After: 现在 5 分钟出报税包
Bridge: 自动读合同 PDF + 同步微信收据
```

### 四、中文平台 hook patterns

#### 小红书标题（25 字内）

- **数字 + 反常识**："独立设计师月入 3 万，靠的不是接单技巧，是这 1 个表格"
- **身份 + 痛点**："27 岁独立 UI，季度报税前我崩溃了 3 次"
- **过来人警告**："给独立设计师的劝告：别再用 Excel 记账了"
- **对比反差**："上班 3 年 vs 独立 1 年：财务焦虑反而少了"

#### 公众号开头 100 字（钩子段）

- 第一句具体场景（不抽象）
- 第二句冲突 / 反常识 / 数字
- 第三句承诺（这篇你会得到什么）

#### 公众号标题

- **疑问 + 立场**："独立设计师该不该自己学报税？"
- **数字 + 时效**："2026 年 Q2 起，自由职业者税务会怎么变？"
- **故事种子**："那个月入 5 万的独立 UI，今天来还信用卡了"

### 五、Anti-Slop 禁词清单（中文）

强制扫描 + 替换：

```
禁用                    替换思路
赋能 / 助力              → 直接讲做了什么动作（"自动写"）
打造 / 缔造              → "做了" "出了" "建了"
赛道                    → 具体行业名
闭环 / 链路              → "流程" 或拆解成具体动作
心智 / 占领心智          → 砍掉，讲事实
抓手                    → 砍掉
颗粒度                  → "细到 X" 或 "精确到 X"
矩阵                    → 砍掉或换"几个账号"
数智 / 数字化            → 具体讲数字了什么
一站式 / 全方位          → 砍掉，列具体能力 3 条
解决方案                → "工具" / "做法" / 砍掉
赋予 / 让 X 拥有         → 让 X 直接做某事
无缝 / 极致             → 砍掉
delve / robust / crucial / comprehensive → 全部禁用（英文同理）
```

### 六、Ogilvy 老规矩仍然有效

- "On the average, five times as many people read the headline as read the body copy."
  → 80% 时间花在 H1
- 写完读出来，听起来像人话才放过
- 不要让标题里出现你的公司名（除非品牌已知）
- 具体数字胜过形容词（"5 分钟" > "快速"；"30-50 万独立设计师" > "庞大用户群"）

## 工作流程

### 步骤 0 · Pre-flight

```
✓ 读 icp.yaml — 拿 ICP 名 + psychographic + JTBD
✓ 读 positioning.yaml — 拿 market_frame + anti_positioning_line
✓ 读 interviews/ — 提取 ≥10 句用户原话进 voc_mining.md
✓ 询问用户：本次写哪个？
   - landing hero
   - cold email / DM 开场
   - 小红书标题 / 公众号标题
   - 公众号开头钩子段
   - 广告短文案
```

### 步骤 1 · 确定 awareness stage（HARD-GATE）

```
Coach: 你这次要打的人，处于哪个阶段？

     ○ Unaware — 不知道自己有这个问题（教育型文案）
     ○ Problem-aware — 知道烦，不知有解 ★ 早期最常见 ★
     ○ Solution-aware — 知道类方案，要看你不同点
     ○ Product-aware — 知道你，犹豫
     ○ Most-aware — 等价格 / 优惠

     不确定 → 默认 Problem-aware（80% 早期 ICP 在这）
```

### 步骤 2 · VoC mining（从 interviews 抽用户原话）

输出 `voc_mining.md`，列 ≥10 句逐字原话，每句标注：
- 出处（interview #N / 用户 X）
- 类别（pain / fired_solution / desired_outcome / WTP）
- "可改成 H1?" 评分 1-5

### 步骤 3 · 出 ≥5 个 H1 / hook 候选

每个候选必须：
- 用一个具体 VoC 原话或其改写
- 标 framework（4U / PAS / BAB / xhs-数字反常识 等）
- 标 awareness stage 匹配度
- 过 Anti-Slop 词扫描 ✓

不要从空白开始写。从 VoC 句子开始改。

### 步骤 4 · 自审 + 三个测试

每个候选过 3 测：
1. **大声读测试**：读出来像不像人话？
2. **替换测试**：把"我们"换成竞品名，还成立吗？成立 = 不够独特
3. **5 秒测试**：陌生人扫 5 秒能复述 H1 含义吗？

### 步骤 5 · 给用户 2x3 矩阵选

```
推荐 2 个 H1（Lumi Lab 选） + 用户选 1 个或自创 1 个
配 3 个 sub-headline 候选
配 1-2 个 CTA 文案
```

### 步骤 6 · 输出 copy_brief.yaml + copy_candidates.md

## 真实示例 / Worked Example

**Venture**：独立设计师财务 App
**任务**：landing hero
**awareness stage**：Problem-aware

VoC mining（从 6 次访谈摘录）：
```
1. "PDF 合同我得手动抄字段" — 阿桃 / pain / H1?=4
2. "去年 Q4 报税我找一份合同找了 2 小时" — 阿桃 / pain / H1?=5 ★
3. "Excel 不知道我今年接了几个甲方" — 小K / pain / H1?=5 ★
4. "每季度报税前 2 周失眠" — 阿楠 / pain / H1?=4
5. "甲方拖款我都得自己一笔笔记" — 安妮 / pain / H1?=3
6. "我宁可凑合用 Notion 也不学新工具" — 桃 / anxiety / H1?=2
7. "99 我会试，299 太贵" — 阿桃 / WTP / not for H1
8. "我不是会计我是创作者" — 小K / identity / H1?=5 ★
9. "甲方每次都给我新合同模板" — 阿楠 / pain / H1?=3
10. "我想 5 分钟搞定 Q1 合同收据归档" — 阿桃 / desired / H1?=5 ★
```

候选 H1 ≥5（每个标 framework）：

```
A) [BAB / 改自 VoC#10]
   H1: 5 分钟整理一整季的合同和收据
   Sub: 自动读 PDF 合同、同步微信收据、Q2 报税前就能用
   CTA: 免费试用 14 天 →
   stage: problem-aware ✓
   anti-slop: ✓
   独特性测试: 替换"我们" → 一木记账放不进来 ✓

B) [identity-led / 改自 VoC#8]
   H1: 你是创作者，不是会计
   Sub: 把合同、发票、报税都交给我们——你回去做设计
   CTA: 14 天免费 →
   stage: problem-aware ✓
   anti-slop: ✓
   测试: 5 秒读 → 独立设计师立刻共鸣 ✓

C) [4U / 数字 + 时效]
   H1: 独立设计师的 Q2 报税，从 8 小时压到 30 分钟
   Sub: 自动归档合同 + 收据 + 甲方应收
   CTA: 看看怎么压 →
   anti-slop: ✓
   urgent: ✓（Q2 报税）
   ultra-specific: ✓（8h → 30min）

D) [PAS / 痛点直击]
   H1: 不要再每季度为报税熬夜
   Sub: 我们替独立设计师读合同、整收据、算应缴
   CTA: 试试 →
   anti-slop: ✓
   stage: problem-aware ✓

E) [对比 / 反 alternative]
   H1: Excel 不知道你今年接了几个甲方。我们知道
   Sub: 为独立 UI/插画师而生的财务伙伴
   CTA: 14 天免费 →
   anti-slop: ✓
   anti-positioning: ✓（直接反 Excel）
   测试: 独特性 ✓
```

**Lumi Lab 推荐**：B + E 二选一。
- B 更适合首页 hero（身份共鸣强 + 短）
- E 更适合 SEM / 投放（直接反对手）

**最终选定**：B（用户决策）。
配 sub 改为 E 的方向："Excel 不读你的 PDF 合同。我们读。"
CTA：免费试用 14 天 →

## 输出 schema

`data/ventures/<name>/copy_brief.yaml`：

```yaml
copy_brief:
  surface: landing_hero
  awareness_stage: problem_aware
  icp_ref: "独立 UI/插画师 - B 端长期甲方型"
  positioning_ref: "为独立设计师而生的财务伙伴"

  chosen:
    h1: "你是创作者，不是会计"
    sub: "Excel 不读你的 PDF 合同。我们读。把合同、发票、报税都交给我们——你回去做设计。"
    cta_primary: "免费试用 14 天 →"
    cta_secondary: "看 30 秒演示"

  framework: identity_led + anti_positioning
  voc_sources: ["interview #003 - 阿桃", "interview #005 - 小K"]

  anti_slop_pass: true
  forbidden_words_found: []

  tests_passed:
    read_aloud: ✓
    swap_test: ✓ (一木记账放不进来)
    five_second: ✓

  alternatives_for_AB_test:
    - "5 分钟整理一整季的合同和收据"
    - "Excel 不知道你今年接了几个甲方。我们知道"
```

`copy_candidates.md` 含 ≥5 候选（如上示例所示）。
`voc_mining.md` 含 ≥10 句逐字原话 + 标注。

## 反 Slop 自检

- ❌ 出现禁词清单任何一个 — 强制重写
- ❌ H1 是 AI 默认句式（"打造... / 赋能... / 一站式..."）— 重写
- ❌ H1 替换"我们"为竞品名仍成立 — 不够独特，重写
- ❌ 没有 VoC 原话来源 — 拒绝出 copy（这是无源之水）
- ❌ awareness stage 没标注 — 必须标
- ❌ 候选 < 5 — 不准交付（A/B 测试需要素材）
- ❌ H1 > 25 字（中文）或 > 12 词（英文）— 砍
- ❌ 用 emoji 当 hook — 删
- ❌ 标题里有公司名 — 删（除非品牌已知 ≥ 1000 次曝光）
- ✅ 每个候选大声读一遍听起来像人说话
- ✅ 数字胜过形容词："5 分钟"赢过"快速"

## Chat-only fallback

聊天环境：
- VoC mining 直接在对话内列编号原话（不需要 markdown 表格）
- ≥5 候选 H1 用纯文本列表逐条发，每条带 framework + 一行说明
- 不要在对话里搞 A/B 多选 UI — 让用户直接回"我选 B"或"我要改"
- 最终 copy_brief.yaml 用代码块整段贴出，让用户存档
- 如果是小红书 / 公众号标题任务，一次给 ≥8 个候选（短文案需要更多备选）
- 永远问一次"awareness stage" — 哪怕用户不懂这词，Lumi Lab 用大白话翻译："你这次要打的人，已经知道有这类产品了吗？"

## 关联

- 上游：见 metadata.upstream
- 前置：`lumilab-research-icp` + `lumilab-research-interview` + `lumilab-research-competitor`（三个产物全要）
- 平行：`lumilab-landing-mvp` 消费 copy_brief 落地为 HTML
- 下游：`lumilab-content-repurpose`（H1 / hook 衍生到小红书、即刻、公众号、邮件序列）
- 升级：跨 venture 反复 work 的 hook pattern 升格到 `memory/resources/hook-library/`
- 反 Slop 词表升级：发现新 Slop 词 → 加入 `memory/resources/anti-slop-cn.md`

## 分支决策

| if 条件 | then 走哪条路径 |
|---|---|
| 没有 icp.yaml 或 interviews/ | 拒做 — 无 VoC 来源写不出 copy，先回 research-icp / research-interview |
| 用户不确定 awareness stage | 默认 problem_aware（80% 早期 ICP 在这），但仍标注 |
| 任务是小红书 / 公众号标题 | 一次给 ≥8 个候选（短文案需更多备选），跳过 2x3 矩阵 |
| 任务是 landing hero | 出 ≥5 候选 + 2x3 矩阵（2 H1 × 3 sub） |
| 候选 H1 出现禁词清单任一词 | 强制重写该候选，不计入交付数 |
| 运行在 chat 环境（无浏览器） | 走 Chat-only fallback，纯文本编号列表，不搞多选 UI |

## Output validation

`scripts/validate-output.ts` 是确定性校验器，强制 SKILL.md「输出 schema」「反 Slop 自检」里的结构规则。

校验字段（`copy_brief.yaml`）：`surface` / `awareness_stage` / `h1` / `cta_primary`（必填）· `awareness_stage`（enum：unaware | problem_aware | solution_aware | product_aware | most_aware）· `h1`（string，≤25 字，不含禁词）· `anti_slop_pass`（bool，须为 true）· `forbidden_words_found`（array，须为空）。`copy_candidates.md`：候选数 ≥5。`voc_mining.md`：逐字原话 ≥10 句。

```bash
bun run scripts/validate-output.ts data/ventures/<name>/
# exit 0 = 合规，exit 1 = 逐条列出违规
```

## Dependencies

| 依赖 | 类型 | 是否付费 | 单次调用约成本 | 说明 |
|---|---|---|---|---|
| bun | CLI runtime | 免费 | free | ≥1.0，必需 |
| host LLM | 宿主提供 | 取决于宿主 | ~4-10k tokens / 一次 copy 任务 | VoC mining + 候选生成复用宿主 |

## Outputs

`data/ventures/<slug>/copy_brief.yaml` · `data/ventures/<slug>/copy_candidates.md` · `data/ventures/<slug>/voc_mining.md`

## Example

见 SKILL.md「真实示例」段

## Tests

`tests/smoke.md` — 该 skill 的最小冒烟测试约定：让 host LLM 在对话中跑通 SKILL.md「真实示例」段即视为通过。E2E 真集成见 `docs/TUTORIAL.zh.md`。

## Idempotency

`copy_brief.yaml` 重跑覆盖最新决策；`copy_candidates.md` / `voc_mining.md` 追加新轮次（`## Round <n>`），保留历史候选与原话。

## Privacy

Voice-of-customer 原文来自用户提供的访谈，本地保留；不向第三方 LLM 服务上传（host LLM 已是用户自己的）。

## Cache

VoC 短语库 `voc-bank.yaml` 累计，重跑时复用。

## Failure modes

禁词清单触发（赋能 / 打造 / 闭环 / 赛道 / 抓手 / 心智 / 颗粒度 等）→ 拒写 + 高亮；headline > 中文 18 字 / 英文 12 词 → 截断警告。

## Edge cases

4U 框架（urgent / unique / useful / ultra-specific）至少 3U 才算合格；CTA 动词必须是用户语义（"开始" / "试试" 而非 "立即体验"）。

## Alternatives

用户现在可能用什么替代方案，以及 Lumi Lab 为什么不一样：

- **通用 LLM 写文案**：会产出 AI slop（赋能 / 打造 / 闭环），不做 voice-of-customer。
- **文案模板库**：套路化，不针对你的用户语言。

Lumi Lab 的差异：Eugene Schwartz awareness stages + Joanna Wiebe VoC mining + 禁词扫描（赋能 / 打造 / 闭环 / 赛道…直接拒写）。

## Moat（复利护城河）

voc-bank.yaml 累积你用户的真实语言，跑得越久文案越像"用户自己说的话"而不是营销腔。

## Changelog

- **1.0.0-rc4** — 新增 `scripts/validate-output.ts`（copy_brief.yaml 必填键+awareness_stage 枚举+H1 ≤25 字+anti_slop_pass，copy_candidates.md ≥5 候选，voc_mining.md ≥10 句原话）+ Output validation 段；新增 分支决策 if-then 表；Dependencies 表加单次调用约成本列；统一 outputs 文件名（Outputs 段 / Idempotency 段改回 frontmatter 的 copy_brief.yaml / copy_candidates.md / voc_mining.md）。
- **1.0.0-rc1** — 初版：VoC mining + 5 awareness stages + 反 Slop 禁词。

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
