---
name: lumilab-research-interview
description: |
  用户访谈脚本与教练。基于 Rob Fitzpatrick The Mom Test 三原则 + Bob Moesta JTBD switch interview + 5 layers of why。生成访谈提纲、识别 8 种访谈反模式、按 saturation 规则（5-8 个达到饱和）判断是否够、把录音转录提炼成可用结构化数据。Use when 用户准备打第一批冷启动电话、准备做 ICP 验证访谈、已经做了几次访谈但拿到的回答全是空话。
  关键词：interview / Mom Test / 用户访谈 / JTBD switch / 5 whys / 访谈脚本 / 访谈反模式 / saturation / 妈妈测试
version: 1.4.1
metadata:
  hermes:
    tags: [mom-test, interview, jtbd-switch, 5-whys]
  lumilab:
    tier: overlay
    requires_browser: false
    chat_only_ok: true
  category: agent
  agent: research
  authors: [lumilab]
  upstream:
    - "paperclipai/interview-script"
    - "phuryn/interview-script"
    - "Rob Fitzpatrick — The Mom Test"
    - "Bob Moesta — Demand-Side Sales (switch interview)"
    - "Erika Hall — Just Enough Research"
    - "Sakichi Toyoda — 5 Whys"
  outputs:
    - "data/ventures/<name>/interview_script.md"
    - "data/ventures/<name>/interviews/<id>.md (单次转录)"
    - "data/ventures/<name>/interview_synthesis.md (≥5 次后聚合)"
  reads:
    - "data/ventures/<name>/icp.yaml"
    - "data/ventures/<name>/hypotheses.yaml"
license: Apache-2.0
platforms: [macos, linux]
prerequisites:
  env_vars: []
  commands: [bun]
compatibility: "Claude Code, OpenClaw 2026.4.25+, Hermes Agent v0.13.0+, Cursor, Codex"
---

# research-interview — Mom Test 访谈教练

## 何时调用

**触发**：
- 用户准备打第一批 5-10 个冷启动用户电话/语音/面谈
- 用户做完几次访谈但说"用户都说好，但没人付钱"——典型 Mom Test 警报
- 假设 ledger 里有 ≥1 条 hypothesis 需要通过访谈验证
- 用户拿到一段录音 / 转录，要从里面提炼信号
- 在 ICP / competitor / yc_brief 阶段需要"先去问 5 个人"

**反触发**：
- 用户没有 5 个具体可联系的人 → 先走 `lumilab-research-icp` 把 ICP 收窄到能列出名字
- 用户想做的是产品可用性测试（点这里点那里）— 那是 usability test，不是这个 skill
- 用户想做的是问卷调查 — 走 lumilab-research-survey（独立 skill）
- 用户已经有 ≥30 付费用户 — 走 Sean Ellis 40% PMF survey（在 icp skill 里）

## 方法论核心

### 一、The Mom Test 三原则（Rob Fitzpatrick）

书名来自一个 idea：**问问题问到让你妈都不会撒谎安慰你**。

1. **谈他们的生活，不谈你的 idea**
   - 错：你觉得这个产品好不好？
   - 对：你上次遇到 X 问题是什么时候？当时怎么处理的？

2. **谈具体的过去，不谈泛泛的未来**
   - 错：你以后会用 AI 工具吗？
   - 对：你最近一次为了写文案熬夜，是什么时候？

3. **少说，多听**
   - 你说话占比 < 30%。用户讲话占比 ≥ 70%。

### 二、八大访谈反模式（必须主动识别 + 打回）

| 反模式 | 用户说什么 | 为什么是雷 | 怎么救 |
|---|---|---|---|
| Compliment | "听起来很棒！" | 是社交礼貌，不是验证 | 问"你最近一次为这种事付过钱吗" |
| Hypothetical | "我应该会用吧" | 未来式没价值 | 问"你上次遇到 X 是什么时候" |
| Generic future | "以后我肯定会试试" | 同上 | 同上 |
| Fluff（赞美） | "这个 idea 很有前景" | VC 套话不要 | 转回他自己的生活 |
| Validation seeking | 你不停问"对吗？是不是？" | 你在引导用户 | 闭嘴 |
| Idea pitching | 你讲了 5 分钟产品 | 你在做销售不是访谈 | 把笔记停笔，重新听 |
| Yes/no question | "你会不会想要 X？" | 答案没信息量 | 改开放式 |
| Single source | 全是朋友 / 自己人 | 样本污染 | 强制 ≥60% 非熟人 |

### 三、Bob Moesta — Switch Interview（最锋利的访谈结构）

围绕一次具体"切换"展开（用户从旧方案换到新方案那一刻）：

```
1. 第一次想到："你第一次想到需要解决这个问题，是什么时候？"
2. 推力（Push）："当时旧方案哪里让你难受？"
3. 拉力（Pull）："你听说 / 看到了什么让你觉得'换一个试试'？"
4. 焦虑（Anxiety）："换的时候担心什么？"
5. 习惯（Habit）："为什么没早点换？什么挡住了？"
6. 第一次试用："换之后第一次用，是什么场景？怎么用的？"
7. 现在评估："今天回头看，值吗？"
```

每个问题都问"具体那一次"——不要让用户进入"通常会..."模式。

### 四、5 Layers of Why（丰田佐吉）

碰到关键回答，连续问 5 层"为什么"。第 3-5 层通常才是真因。

```
用户: "我用 Notion 管客户"
Why 1: 为什么用 Notion？— "因为灵活"
Why 2: 为什么需要灵活？— "每个客户字段都不一样"
Why 3: 为什么字段不一样？— "我做定制咨询，每个客户买的东西不同"
Why 4: 为什么不用 CRM？— "CRM 字段太死，每次都得改 schema 烦"
Why 5: 为什么烦改 schema？— "改一次 1 小时，我宁可凑合用 Notion"
↑ 真正的痛点：schema 改动成本，不是"灵活" 这个表象
```

### 五、Saturation Rule — 5-8 个访谈就够

Erika Hall 在 _Just Enough Research_ 强调：定性研究的"饱和"通常在 5-8 次出现。

```
做完 5 次访谈后停一下：
- 最后 2 次有没有听到新信息？
- 主要痛点 / 替代品 / 触发瞬间是不是开始重复？
  ✓ 是 → 接近饱和，再做 1-2 次确认
  ✗ 否 → 继续到 8 次。如果 8 次还在分散，说明你的 ICP 没收窄好，回去改 ICP
```

不要做 30 个访谈。做 8 个，比做 30 个有用得多。

## 工作流程

### 步骤 0 · Pre-flight check

```
✓ 读 icp.yaml — 必须有，且必须能列出 ≥10 个具体名字
✓ 读 hypotheses.yaml — 这次访谈要验证哪 1-3 条？
✓ 询问用户：你计划做几个？要多少天内完成？
```

### 步骤 1 · 生成访谈脚本（不超过 8 个核心问题）

模板（Mom Test + Switch Interview 融合）：

```
# 访谈脚本 — {venture} {date}

## 暖场（≤2 min）
- 谢谢你的时间，我今天不卖东西，就是想了解你的工作
- 我会问一些具体的问题，你随便聊

## 生活与背景（≤5 min）
Q1: 给我讲一下你现在 {ICP 相关日常} 是怎么做的？一周大概投入多少时间？

Q2: 上一次因为 {目标 JTBD 相关的事} 感到烦，是什么时候？当时具体发生了什么？

## Switch / 旧方案（≤10 min）
Q3: 你现在用什么工具 / 流程 / 人来解决这件事？

Q4: 你是从什么时候开始用 {当前方案} 的？换过几次？为什么换？

Q5: {当前方案} 哪里让你不爽？最近一次让你不爽是什么时候？

## 付费意愿与替代品（≤8 min）
Q6: 你过去为这件事付过钱吗？给谁？多少？为什么觉得值/不值？

Q7: 如果 {当前方案} 明天不能用了，你会做什么？

## Close（≤3 min）
Q8: 我可以把你介绍给跟你类似情况的人吗？有没有 1-2 个朋友我也可以聊？

## 不准问的
- "你觉得 {我的产品 idea} 怎么样？" ✗
- "你会不会用 X？"                   ✗
- "你以后想要 X 吗？"                ✗
```

### 步骤 2 · 把脚本给用户 + 训练用户当访谈员

```
Coach: 在你打第一个电话前，我要你练 3 件事：
     1. 你说话占比 < 30%。计时器开起来
     2. 听到"听起来不错" → 立刻反问"你上次为这种事花过钱吗？"
     3. 用户每给一个理由，问一次"为什么"（最多 5 层）

     准备好了告诉我，我会陪你做第 1 个访谈的复盘。
```

### 步骤 3 · 单次访谈后转录 + 提炼

用户做完每场访谈，调用本 skill 做转录提炼：

```
Coach: 把录音 / 笔记 / 关键对话片段贴给我。我帮你提取：
     - 痛点（用户原话，不要总结）
     - 旧方案（用什么，为什么换/不换）
     - 触发瞬间（具体哪一次）
     - 反模式标记（compliment / hypothetical 等）— 这条标记的回答不计入证据
     - 付费信号（付过 ¥X 给 Y）
     - 推荐链（能否介绍下一个）
```

### 步骤 4 · Saturation check（每 5 次访谈后）

```
Coach: 你已完成 5 次访谈。我对比一下最近 2 次和前 3 次：
     - 痛点重复度：N%
     - 旧方案重复度：N%
     - 触发瞬间重复度：N%

     ≥ 70% 重复 → 接近饱和，建议做 1-2 次"挑战样本"（找个看起来不像 ICP 的人，看会不会推翻）
     < 70% 重复 → 继续。如 8 次还散，回头改 ICP
```

### 步骤 5 · Synthesis（≥5 次后聚合输出）

输出 `interview_synthesis.md`：top 3 痛点（带原话引用 + 出现频次）、top 3 替代品、共同 trigger、付费证据汇总、待验证的反模式。

## 真实示例 / Worked Example

**Venture**：独立设计师财务 App。做了 6 次访谈，第 3 次访谈摘录：

```
受访者：阿桃（28 岁 上海 独立 UI 设计师 月入 2-3 万）
时长：32 分钟
访谈员说话占比：26% ✓

精彩片段：
桃: "我用 Excel 管。"
我: "什么时候开始用 Excel？"     ← Switch Q4
桃: "2022 年。之前是用记事本。"
我: "为什么从记事本换 Excel？"   ← Switch Push
桃: "记事本搜不到，去年 Q4 报税我找一份合同找了 2 小时。" ★ 触发瞬间 ★
我: "Excel 现在有什么不爽？"     ← Switch Q5
桃: "PDF 合同我得手动抄字段。每个甲方一个 sheet 越来越多。"
我: "为什么不抄一次？"           ← Why 1
桃: "甲方每次都给我新合同。"
我: "为什么不用模板？"           ← Why 2
桃: "甲方有自己模板。"
我: "你有没有为这件事付过钱？"   ← Q6 付费信号
桃: "没。但去年报税前我在淘宝搜过'独立设计师 报税'，
     看到一个 ¥299 的服务，差点下单，最后觉得贵。"  ★ 付费锚 ¥299 ★
我: "299 贵 还是 不够好？"
桃: "299 贵。 99 我会试。"      ★ 真实 WTP 信号 ★

反模式扫描：0 个 compliment / 0 个 hypothetical / ✓ 全程具体过去

提炼：
- 痛点（原话）: "PDF 合同我得手动抄字段"
- 旧方案 fired: 记事本（2022 切到 Excel 时）
- 旧方案 currently used: Excel
- 触发瞬间: 2024 Q4 报税前 2 小时找合同
- 付费证据: 差点下单 ¥299，WTP 锚 ¥99
- 推荐链: 给了 2 个朋友联系方式 ✓

6 次访谈饱和检查：
- "Excel + 手抄合同字段" 出现 5/6 次
- "甲方合同 PDF 是关键痛" 出现 6/6 次
- WTP 中位数 ¥79（5 个有效报价：50, 79, 99, 99, 150）
- 触发瞬间集中在"报税前 2 周"

→ 饱和。可以停做访谈，进入产品决策阶段。
```

## 输出 schema

`data/ventures/<name>/interviews/<id>.md`：

```markdown
# Interview #003 — 阿桃

- date: 2026-05-08
- duration_min: 32
- interviewer_talk_ratio: 0.26
- recruited_via: 即刻 DM
- relation: 非熟人 ✓

## 痛点（原话引用）
- "PDF 合同我得手动抄字段"
- "去年 Q4 报税我找一份合同找了 2 小时"

## 当前方案
- in_use: Excel
- fired_before: 记事本（2022）
- fired_reason: 搜不到

## 触发瞬间
- when: 2024 Q4 报税前
- what_happened: 找一份合同找了 2h

## 付费证据
- past_paid: 无
- considered_paid: ¥299（淘宝）
- WTP_stated: ¥99

## 反模式扫描
- compliments: 0
- hypotheticals: 0
- single_source_risk: 否

## 推荐链
- referrals: 2 人（阿楠, 小K）

## 状态对 hypotheses
- h-001（独立设计师愿付 ¥299/月）: 反向证据 ★ WTP < 100 ★
- h-002（PDF 合同是核心痛）: 支持证据
```

`data/ventures/<name>/interview_synthesis.md`（5 次后）含：
- 痛点频次表
- 替代品频次表
- WTP 分布
- 共同 trigger 时间窗
- saturation_score
- 对每条 hypothesis 的支持/反向证据

## 反 Slop 自检

- ❌ 访谈脚本超过 8 个核心问题 — 删
- ❌ 出现 yes/no 问题 — 改开放式
- ❌ 出现"你觉得 X 怎么样" — 删
- ❌ 用户说"听起来不错"被记为"正面反馈" — 标记为 compliment，不计证据
- ❌ 5 次访谈全是熟人 — 标 single_source_risk = 高
- ❌ 转录里只有总结没有原话引用 — 必须带 ≥3 句逐字原话
- ❌ "用户都很认可我们的方向" — 这种总结被禁。只准写"6/6 用户提到 X 痛点"
- ✅ 每次访谈都有 interviewer_talk_ratio < 0.3
- ✅ 每次都有 ≥1 个具体时间锚
- ✅ Saturation 没到 5 次不准给"洞察"

## Chat-only fallback

聊天环境下：先用一条消息发出完整访谈脚本（markdown），让用户复制去打电话；
之后用户每完成一次访谈，把录音转文字或要点贴到对话；
Lumi Lab 在对话内做反模式扫描 + 提取，输出单次结构化 markdown 让用户存档；
不要在聊天里坚持要用户填表单——直接接受流水帐式叙述，Lumi Lab 负责结构化。
Saturation 报告也用对话纯文本输出，附原话引用列表，不画图表。

## 关联

- 上游：见 metadata.upstream
- 前置：`lumilab-research-icp`（必须先有 ICP 才知道找谁）
- 平行：`lumilab-research-competitor`（访谈里 Q7 直接产出 alternatives 信号）
- 下游：`lumilab-copy`（VoC 全部从这里来）、`lumilab-hypothesis-ledger`（更新支持/反向证据）
- 升级：interview_synthesis 中反复出现的痛点升格为 `memory/resources/jtbd-library/`

## 分支决策

| if 条件 | then 走哪条路径 |
|---|---|
| 用户没有 5 个具体可联系的人 | 反触发 — 先走 lumilab-research-icp 把 ICP 收窄到能列名字 |
| 用户已有 ≥30 付费用户 | 反触发 — 走 icp skill 里的 Sean Ellis 40% PMF survey |
| 用户带来一段录音/转录 | 跳过脚本生成，直接走步骤 3 转录提炼 |
| 完成 5 次访谈且重复度 ≥70% | 接近饱和，建议做 1-2 次「挑战样本」后进步骤 5 synthesis |
| 完成 8 次仍发散（重复度 <70%） | 回头改 ICP，不继续加访谈量 |
| 单次访谈 8 反模式触发 >2 个 | 让用户重做该访谈，不计入证据 |
| 5 次访谈全是熟人 | 标 single_source_risk = 高，要求补 ≥60% 非熟人 |

## Output validation

`scripts/validate-output.ts` 是确定性校验器，强制 SKILL.md「输出 schema」「反 Slop 自检」「Edge cases」里的结构规则。

校验字段（`interviews/<id>.md`）：必有章节 `痛点` / `当前方案` / `触发瞬间` / `付费证据` / `反模式扫描` / `推荐链`（string section，全部必填）· `interviewer_talk_ratio`（number，< 0.3）· `痛点` 章节含逐字原话（≥1 句）。校验字段（`interview_synthesis.md`）：痛点频次表（含 N/M 形式）· `saturation`（必填）。

```bash
bun run scripts/validate-output.ts data/ventures/<name>/
# exit 0 = 合规，exit 1 = 逐条列出违规
```

## Dependencies

| 依赖 | 类型 | 是否付费 | 单次调用约成本 | 说明 |
|---|---|---|---|---|
| bun | CLI runtime | 免费 | free | ≥1.0，必需 |
| host LLM | 宿主提供 | 取决于宿主 | ~2-5k tokens / 单次访谈提炼 | 转录提炼 + 反模式扫描复用宿主 |

## Outputs

`data/ventures/<slug>/interview_script.md` · `data/ventures/<slug>/interviews/<id>.md` · `data/ventures/<slug>/interview_synthesis.md`

## Example

见 SKILL.md「真实示例」段

## Tests

`tests/smoke.md` — 该 skill 的最小冒烟测试约定：让 host LLM 在对话中跑通 SKILL.md「真实示例」段即视为通过。E2E 真集成见 `docs/TUTORIAL.zh.md`。

## Idempotency

每个访谈对象一个 `interviews/<participant-id>.md`，永不覆盖；同一对象第二次访谈写到 `interviews/<id>-v2.md`。

## Privacy

访谈对象姓名 / 联系方式由用户决定是否写入；模板默认用 `participant-001` 匿名 ID；录音不上传。

## Cache

8 反模式清单 + Mom Test 三原则常量化到 `references/`。

## Failure modes

若访谈内容 < 200 字 → 警示信息不足；若 8 反模式触发 > 2 → 让用户重做该访谈。

## Edge cases

5 layers of why 至少 3 层；compliments / hypotheticals / generic future 等反模式自动标红高亮。

## Alternatives

用户现在可能用什么替代方案，以及 Lumi Lab 为什么不一样：

- **通用 LLM 帮你设计访谈问题**：会写出引导性问题（"你会不会喜欢…"），违反 Mom Test。
- **问卷工具（Typeform 等）**：拿到的是 hypotheticals，不是过去行为。

Lumi Lab 的差异：Mom Test 三原则 + 8 反模式自动标红 + 5 layers of why + saturation rule（5–8 个访谈饱和）。

## Moat（复利护城河）

`interviews/` 每个对象独立归档，跑过 20+ 访谈后能 grep 出反复出现的 struggling moment——这是质性数据的复利。

## Changelog

- **1.0.0-rc4** — 新增 `scripts/validate-output.ts`（interviews/<id>.md 六大章节 + interviewer_talk_ratio <0.3 + 痛点章节逐字原话，interview_synthesis.md 痛点频次表 + saturation）+ Output validation 段；新增 分支决策 if-then 表；Dependencies 表加单次调用约成本列；统一 outputs 文件名（Outputs 段补齐 frontmatter 的 interview_script.md / interviews/<id>.md / interview_synthesis.md 三件）。
- **1.0.0-rc1** — 初版：Mom Test 三原则 + 8 反模式 + switch interview + saturation rule。

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
