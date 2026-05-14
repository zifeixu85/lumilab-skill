---
name: lumilab-coach-yc
description: |
  YC office-hours 6 forcing questions + Paul Graham heuristics + Lean Startup loop. 把一个模糊 idea 逼成一句话 + 一群人 + 一个钩子 + 一个验证动作。Use when 用户说"我有个 idea"、"我想做个 SaaS"、"帮我看看这个产品方向"，或在 founder-coach Layer 1 路由到方法论教练时被调用。
  关键词：coach-yc / YC application / Paul Graham / 6 forcing questions / schlep blindness / default alive / make something people want / 一句话产品定位 / 创业 idea 澄清
version: 1.1.0
metadata:
  hermes:
    tags: [yc, office-hours, paul-graham, forcing-questions]
  lumilab:
    tier: overlay
    requires_browser: false
    chat_only_ok: true
  category: agent
  agent: coach
  authors: [vst-team]
  upstream:
    - "kit4some/office-hours (YC 6 forcing questions)"
    - "getagentseal/lean-startup (Eric Ries build-measure-learn)"
    - "askroundtable/expert-graham (Paul Graham heuristics)"
    - "YC Startup School curriculum"
    - "Paul Graham essays: How to Get Startup Ideas, Schlep Blindness, Default Alive or Default Dead"
  outputs:
    - "data/ventures/<name>/yc_brief.md (6 forcing questions 答案)"
    - "data/ventures/<name>/hypotheses.yaml (3-5 初始假设)"
    - "data/ventures/<name>/coach_session_<ts>.md (每轮逼问 session 记录)"
  reads:
    - "data/ventures/<name>/project_brief.md"
    - "MEMORY.md"
license: Apache-2.0
platforms: [macos, linux]
prerequisites:
  env_vars: []
  commands: [bun]
compatibility: "Claude Code, OpenClaw 2026.4.25+, Hermes Agent v0.13.0+, Cursor, Codex"
---

# coach-yc — YC 风格 idea 逼问

## 何时调用

**触发**：
- 用户首次说出一个 idea（不论一行字还是十段话），需要把它逼成"一句话讲清楚"
- 用户在 founder-coach 选 Layer 1 方法论
- 用户已经在做产品但说不清"给谁 / 为什么 / 怎么找到"
- 准备投 YC application、申请加速器、做对外 pitch
- 任何"我有个想法"开场

**反触发**（这些场景请走别的 skill）：
- 用户已经有 ≥3 个真实付费用户 → 走 lumilab-research-interview 做 PMF 访谈
- 用户假设刚 failed 情绪低落 → 走 lumilab-founder-coach Layer 3
- 用户想做的是文案/着陆页 → 走 lumilab-copy / lumilab-landing-mvp
- 用户问"哪个赛道好" → 拒答；YC 不回答这种问题，Paul Graham 也不回答

## 方法论核心

### 一、YC 6 forcing questions（office hours 标准开场）

来自 YC 合伙人（Garry Tan / Michael Seibel / Dalton Caldwell）在 office hours 反复用的 6 个问题。
顺序固定，**前一个答不出来就不准跳下一个**。

```
1. What are you doing?        — 一句话讲清你在做什么（不超过 30 词）
2. Who is it for?             — 给具体一群人，不是"用户"也不是"所有开发者"
3. Why do they want it?       — 他们现在怎么解决的？为什么现在的方式让他们痛？
4. How will you reach them?   — 你能不能在 24h 内联系到 10 个这样的人？
5. How will you make money?   — 单价 × 频次 × 留存 = ?
6. Why now? Why you?          — 为什么 2026 年（不是 2020 或 2030）？为什么是你？
```

**Michael Seibel 名言**："如果你 30 秒讲不清 1 和 2，剩下的都白搭。"

### 二、Paul Graham 三把刀

#### 1. Schlep blindness（杂活盲视）

人会下意识屏蔽那些"听起来很烦、要打很多电话、要处理人际、要做合规、要谈合同"的 idea。
**这正是机会所在**——因为别人也会屏蔽。Stripe 就是 PG 举的例子：处理支付看起来杂活满满，所以多年没人碰。

**追问**：你这个 idea 是不是太"干净"了？干净意味着别人也想得到。

#### 2. Live in the future, then build what's missing

PG 的找 idea 公式：**生活在未来 → 注意到一个洞 → 把那个洞填上**。

**追问**：你这个 idea，是你自己在用真实生活里发现的洞，还是你"觉得别人需要"？
有机 idea（organic）vs 拼凑 idea（made-up）的区别。

#### 3. Make something people want

YC 的官方座右铭。不是 make something people might want / could want / should want。
**只有当至少 10 个真实的人愿意现在就掏钱或现在就用，才算"want"**。

### 三、Default Alive vs Default Dead（PG 2015）

如果按当前增长曲线 + 当前烧钱速度推下去，你的现金会先耗光还是先达到正向现金流？

- **Default Alive**：先到正现金流 → 继续 build
- **Default Dead**：先耗光 → 要么大幅 pivot，要么找钱，要么 archive

对独立开发者翻译：你的副业收入会先超过最低生活成本，还是你的存款会先耗光？

### 四、Be relentlessly resourceful（PG）

PG 形容好 founder 的唯一一个词组。不是聪明、不是有经验、不是有人脉，是 **resourceful 到无情**——
碰到墙就绕、绕不过就拆、拆不了就改路线。

**问自己**：上周遇到的最大障碍，你绕了几种方法？只试 1 种 = 不够 resourceful。

## 工作流程

### 步骤 0 · 状态识别（1 行）

```
✓ venture: {name} · Day {N}
✓ 已有产物：{project_brief.md 有/无} · {hypotheses.yaml 有/无}
✓ 路由：第一次 YC 6Q（重新开始）/ 续问 / 修订 yc_brief
```

### 步骤 1 · HARD-GATE 模式逐题逼问

**关键纪律**：一次只问一题。用户答完一题，复述确认 → 再问下一题。

#### Question 1 of 6

```
VST: 一句话讲清楚你在做什么。
     规则：
     - ≤30 个汉字
     - 不能用"赋能 / 打造 / 一站式 / 平台"
     - 一个动词 + 一个对象 + 一个结果

     举个反例（不准这么写）：
       "为中小企业打造一站式 AI 营销解决方案"
     举个正例：
       "帮独立开发者把官网在 2 小时内上线"

     你的一句话是？
```

#### Question 2 of 6

```
VST: 给谁用？我要听到一个具体到能在脑子里画出脸的人。
     不准答：所有人 / 用户 / 开发者 / 企业 / 创业者

     准答：
     - 在小红书有 500-5000 粉丝、靠副业卖手作的女性博主
     - 用 Notion 管理客户、月营收 1-5 万的咨询顾问
     - 上海某互联网大厂裸辞 6 个月内、想做独立产品的 P7 工程师

     你的具体那群人是？
```

#### Question 3 of 6 — 为什么想要

```
VST: 这群人现在是怎么解决这件事的？
     （Mom Test：谈过去和具体，不谈未来和泛泛）

     具体一点：
     - 他们现在用什么工具 / 流程 / 人？
     - 上一次他们因为这件事不爽，是什么时候、发生了什么？
     - 他们已经为此付过钱吗？给谁付？多少？
```

#### Question 4 of 6 — 怎么找到

```
VST: 24 小时内，你能联系到 10 个这样的人吗？说出他们的名字或具体在哪。

     ○ 能，名单已经有 → 进 Q5
     ○ 能，我知道在哪找（具体平台/社群） → 列出来
     ○ 不能，但我可以冷启动找 → 你需要 2 周，先暂停 YC 6Q，去做 lumilab-research-interview
     ○ 不能，不知道在哪 → 这是个红灯。要么换 audience，要么这个 idea 就不该做
```

#### Question 5 of 6 — 怎么挣钱

```
VST: 算一笔账（不算就不准过）：
     - 单次/单月收多少钱？为什么是这个数？
     - 他们多久付一次？
     - 留存到第 6 个月还剩多少 %（猜也要猜）？

     LTV ≈ 单价 × 频次 × 留存月数
     CAC ≈ 你触达 1 个付费用户花多少钱/时间

     LTV/CAC < 3 → 商业模式有问题，回去改 Q2 或 Q3
```

#### Question 6 of 6 — Why now / Why you

```
VST: Why now：5 年前为什么做不了？5 年后为什么晚了？
     （技术变了？平台变了？人群变了？政策变了？）

     Why you：你身上有什么是别人没有的？
     ○ 我有这个领域 5+ 年从业经验（domain）
     ○ 我有触达这群人的独家渠道（distribution）
     ○ 我自己就是用户（founder-user fit）
     ○ 我有技术壁垒（technical moat）
     ○ 都没有 → 那你需要更强的 schlep willingness（你愿意干别人不愿干的活）
```

### 步骤 2 · 三把刀复查

逐条问：
- Schlep blindness 检查：这 idea 里有没有让你皱眉的杂活？没有 → 警惕过于"干净"
- Organic 检查：这洞是你生活里撞见的，还是你脑补的？
- Default Alive 检查：按现在计划，先到正现金流还是先耗光存款？

### 步骤 3 · 输出 yc_brief.md + 3 条初始假设

把答案落成可执行产物（见输出 schema）。每条假设必须有 falsifiable 指标。

### 步骤 4 · 把 brief 套进 YC application 格式（可选）

如果用户表示想真投 YC：
- Company: <一句话>
- What does your company do? <Q1+Q2 合并，≤50 词>
- Why did you pick this idea? <Q3+Q6 Why you 合并>
- What is the size of the market? <Q2 群体规模 × Q5 LTV 估算>
- How do you make money? <Q5>
- How will you get users? <Q4>

## 真实示例 / Worked Example

**用户初始 idea**："我想做一个 AI 工具帮中小企业做营销"

```
VST Q1: 一句话，≤30 字。不准用"赋能 / 一站式 / 打造"。
用户: "用 AI 帮中小企业自动生成小红书爆款笔记"
VST: 缩 → "帮线下美容店每周自动写 7 条小红书笔记"（更具体，把"中小企业"换成一类）
用户确认 → 落地

VST Q2: 给谁？要能画出脸。
用户: "线下小店老板"
VST: 太宽。火锅店？理发店？美甲店？三选一最先打的那个。
用户: "上海 / 杭州 / 成都的美甲店老板，30-40 岁女性，店面 2-4 个工位，月营业额 5-15 万"
VST: 好。这是 ICP。

VST Q3: 她们现在怎么做小红书？上一次发笔记是什么时候？
用户: "大部分自己拍自己写，断更率很高，问过 3 个老板都说'懒得想文案'"
VST: 谁付过钱？付给谁？多少？
用户: "有 1 个老板每月 800 给同行学徒代写，但不满意"
VST: 锚定。$800/月 = 现存替代品价格。

VST Q4: 24h 内能联系到 10 个吗？
用户: "我自己开过美甲店，朋友圈有 30+ 老板"
VST: founder-user fit + distribution。✓

VST Q5: 算账。
- 单价 ¥299/月（低于替代品 800） · 频次月付 · 假设 6 月留存 40%
- LTV ≈ 299 × 6 × 0.4 = ¥718（保守）
- CAC：朋友圈冷启动几乎为 0，规模化后估 ¥200
- LTV/CAC ≈ 3.6 ✓ 模式 OK

VST Q6: Why now：2024 年小红书算法重视图文 + LLM 文案质量过线。
        Why you：自己开过美甲店 + 朋友圈是种子用户池。✓

Schlep 检查：要不要打电话教老板用？要。
        要不要根据她们店调风格？要。这些是 schlep ✓ 别人会嫌烦不做。

Default Alive 检查：用户月入 0，目标 6 月内 50 付费用户 = ¥15k MRR，
        覆盖当前生活成本 ¥10k → Default Alive ✓
```

**输出 yc_brief.md（节选）**：
```markdown
# YC Brief — meilab-xiaohongshu

## One-liner
帮上海/杭州/成都美甲店老板每周自动生成 7 条小红书笔记。

## Who
30-40 岁、店面 2-4 工位、月营业额 5-15 万的美甲店女老板。

## Why they want it
现在自己写断更率高；同行学徒代写 ¥800/月不满意。

## How to reach
Founder 自己开过美甲店，朋友圈 30+ 老板即冷启动种子。

## Money
¥299/月，预估 LTV ¥718，CAC ¥200 起步，LTV/CAC ≈ 3.6。

## Why now / why you
小红书图文权重 + LLM 文案过线 + founder 是前从业者。

## Schlep tax
人工调店风格、电话教老板使用 — 必须接受。
```

## 输出 schema

写入 `data/ventures/<name>/yc_brief.md`（结构如上例）。

同步写 `data/ventures/<name>/hypotheses.yaml`（初始 3 条 falsifiable）：

```yaml
hypotheses:
  - id: h-001
    statement: "上海美甲店老板愿意为每周 7 条 AI 小红书笔记付 ¥299/月"
    falsifier: "联系 20 人，<5 人愿意预付 ¥99 排队"
    status: pending
    test_owner: founder
    test_by: 2026-05-28
  - id: h-002
    statement: "AI 生成的笔记 30 天阅读量中位数 ≥ 老板自写水平"
    falsifier: "AB 测 10 篇 vs 老板原稿，AI 中位数低于原稿"
    status: pending
  - id: h-003
    statement: "店主每周愿意花 ≤15min 配合（提供照片/事件）"
    falsifier: "前 5 个种子用户中 ≥3 个流程脱手"
    status: pending
```

## 反 Slop 自检

- ❌ "你这个想法很有潜力" — 拒答。给数据或给质疑，不给安慰
- ❌ 一次抛 6 题让用户挑着答 — 必须 HARD-GATE 单题
- ❌ 用户答"所有创业者" / "广大用户" 时点头放过 — 必须打回
- ❌ 在 Q1 出现"赋能 / 一站式 / 打造 / 闭环 / 赛道 / 心智" — 强制重写
- ❌ 在 Q5 跳过算账直接说"应该可行" — 不算 = 不过
- ❌ 套话 "让我们一起探讨" / "这是一个很棒的方向" — 全部删除
- ✅ 每题答完 1 行复述："你说的是 X，我理解对了吗？"
- ✅ 输出之前过一次"换成一个陌生人来读，能不能复述出 Q1+Q2"

## Chat-only fallback

如果运行环境是飞书机器人 / 微信对话 / 纯命令行，没有浏览器表单：
逐题用纯文本发 6 个问题，每题等用户回一条消息再发下一题；
最后把 yc_brief 用 markdown 整段输出到对话里，附 hypotheses.yaml 代码块，
由用户自行复制粘贴到 venture 仓库；不要尝试模拟多选 UI（用户在手机上选不动），
改成"请直接回 A/B/C 或写新答案"。所有"24h 内能联系到 10 人"这种验证动作，
由 VST 在 7 天后主动 ping 用户复盘，不依赖 Studio 提醒。

## 关联

- 上游：YC office hours, Paul Graham essays（见 metadata.upstream）
- 配套调用：`lumilab-hypothesis-ledger` 落假设、`lumilab-research-interview` 跑 Q4 验证
- 下游消费：`lumilab-landing-mvp`（用 Q1 做 hero copy）、`lumilab-copy`（用 Q2/Q3 提炼 VoC）
- 升级：当 venture 跑出 ≥10 付费用户，本 brief 升格为 portfolio-level pitch

## 分支决策

| if 条件 | then 走哪条路径 |
|---|---|
| 用户首次说一个 idea | 步骤 1 HARD-GATE 从 Question 1 of 6 逐题逼问 |
| 用户已有 ≥3 真实付费用户 | 反触发 — 走 lumilab-research-interview 做 PMF 访谈 |
| 用户假设刚 failed、情绪低落 | 反触发 — 走 lumilab-founder-coach Layer 3 |
| 用户问「哪个赛道好」 | 拒答 — YC / Paul Graham 都不回答这类问题 |
| Q4 回答「不能 24h 内联系 10 人」 | 暂停 6Q，先去做 lumilab-research-interview 冷启动 |
| Q5 LTV/CAC < 3 | 回 Q2 或 Q3 重做，不准过 |
| 用户表示想真投 YC | 加跑步骤 4：把 brief 套进 YC application 格式 |

## Output validation

`scripts/validate-output.ts` 是确定性校验器，强制 SKILL.md「输出 schema」「反 Slop 自检」里的结构规则。

校验字段（`yc_brief.md`）：必有章节 `One-liner` / `Who` / `Why they want it` / `How to reach` / `Money` / `Why now`（全部必填）· `One-liner` 内容 ≤30 字且无禁词。校验字段（`hypotheses.yaml`）：`hypotheses[]` 长度 3-5 · 每条 `id` / `statement` / `falsifier` / `status`（必填）· `status`（enum：pending | supported | refuted）。`coach_session_<ts>.md` 内容非空。

```bash
bun run scripts/validate-output.ts data/ventures/<name>/
# exit 0 = 合规，exit 1 = 逐条列出违规
```

## Dependencies

| 依赖 | 类型 | 是否付费 | 单次调用约成本 | 说明 |
|---|---|---|---|---|
| bun | CLI runtime | 免费 | free | ≥1.0，必需 |
| host LLM | 宿主提供 | 取决于宿主 | ~3-7k tokens / 一轮 6Q 逼问 | 逐题逼问 + 三把刀复查复用宿主 |

## Outputs

`data/ventures/<slug>/yc_brief.md`（6 forcing questions 答案）· `data/ventures/<slug>/hypotheses.yaml`（3-5 初始假设）· `data/ventures/<slug>/coach_session_<ts>.md`

## Example

见 SKILL.md「真实示例」段

## Tests

`tests/smoke.md` — 该 skill 的最小冒烟测试约定：让 host LLM 在对话中跑通 SKILL.md「真实示例」段即视为通过。E2E 真集成见 `docs/TUTORIAL.zh.md`。

## Idempotency

`yc_brief.md` 每次重跑写新章节追加（`## Round <n>`），保留历史回答；`hypotheses.yaml` 覆盖最新；`coach_session_<ts>.md` 按时间戳新建，永不覆盖。

## Privacy

本地文件；YC 6 forcing questions 模板来自公开 office hours 录音整理，无版权风险。

## Cache

6 个 forcing questions 是常量；用户回答缓存到 `yc_brief.md`，下次重跑可读历史避免重复问。

## Failure modes

若用户回答全部 < 30 字 → 触发 follow-up "give me one concrete user"，防泛泛而谈。

## Edge cases

"Talk to users" 维度若回答 0 用户 → 直接判 default dead；"Be obsessed" 若 < 4 小时/周 → 警示。

## Alternatives

用户现在可能用什么替代方案，以及 Lumi Lab 为什么不一样：

- **读 YC 文章 / 看 office hours 录像**：单向，不针对你的 idea 追问。
- **通用 LLM 模拟 YC 合伙人**：会即兴发挥，不严格按 6 forcing questions 逐个 gate。

Lumi Lab 的差异：6 个 forcing questions 严格逐个过，回答太短触发 follow-up，0 用户直接判 default dead。

## Moat（复利护城河）

`yc_brief.md` 每轮追加，你能看到自己对同一个 forcing question 的回答如何随时间变具体——这是成长轨迹。

## Changelog

- **1.0.0-rc4** — 新增 `scripts/validate-output.ts`（yc_brief.md 6 forcing question 章节 + One-liner ≤30 字无禁词，hypotheses.yaml 3-5 条 + id/statement/falsifier/status 枚举）+ Output validation 段；新增 分支决策 if-then 表；Dependencies 表加单次调用约成本列；统一 outputs 文件名（Outputs / Idempotency / Cache / Moat 全部从 yc_drill.md 改回 frontmatter 的 yc_brief.md；移除 frontmatter 中未实际写出的 audience.md）。
- **1.0.0-rc1** — 初版：YC 6 forcing questions + Paul Graham 三把刀 + Default Alive。

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
