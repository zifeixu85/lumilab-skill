---
name: lumilab-research-icp
description: |
  Ideal Customer Profile 精准建模。Bob Moesta JTBD switch interview + Sean Ellis 40% PMF survey + April Dunford segment-of-one。把"目标用户"逼成"一个具体的人 + 一个具体的挣扎瞬间 + 一个具体的替代品"。Use when 用户说"我的用户是 X"但 X 太宽（开发者/中小企业/年轻人/创业者），或在做 landing / copy / cold outreach 前需要锁定第一波打谁。
  关键词：ICP / ideal customer profile / 精准用户 / JTBD / Jobs to be Done / switch interview / struggling moment / Sean Ellis 40% / 必备问题 / 反"所有人"
version: 1.2.0
metadata:
  hermes:
    tags: [icp, jtbd, segment, customer-profile]
  lumilab:
    tier: overlay
    requires_browser: false
    chat_only_ok: true
  category: agent
  agent: research
  authors: [vst-team]
  upstream:
    - "openclaudia/icp-builder"
    - "Bob Moesta — Demand-Side Sales / The Re-Wired Group"
    - "Sean Ellis — 40% must-have PMF survey"
    - "April Dunford — Obviously Awesome (segment-of-one positioning)"
    - "Clayton Christensen — Jobs To Be Done"
  outputs:
    - "data/ventures/<name>/icp.yaml"
    - "data/ventures/<name>/icp.md (human-readable)"
    - "data/ventures/<name>/jtbd_struggling_moments.md"
  reads:
    - "data/ventures/<name>/yc_brief.md (如有)"
    - "data/ventures/<name>/interviews/*.md (访谈转录)"
license: Apache-2.0
platforms: [macos, linux]
prerequisites:
  env_vars: []
  commands: [bun]
compatibility: "Claude Code, OpenClaw 2026.4.25+, Hermes Agent v0.13.0+, Cursor, Codex"
---

# research-icp — 精准 ICP 建模

## 何时调用

**触发**：
- 用户答 YC Q2 仍然给出"开发者 / 中小企业 / 年轻人 / 创业者"等宽泛人群
- 准备做冷启动外联、想列出"前 50 个要打的人"
- 准备写 landing page hero / cold email，但不知道对谁说话
- 已经有 ≥5 个用户/访谈，需要从中提炼出"高密度的 1 个 segment"
- 重新做定位 / pivot 后需要刷新 ICP

**反触发**：
- 用户连 idea 都没讲清楚 → 先走 `lumilab-coach-yc`
- 用户没做过任何访谈也没有任何用户 → 先走 `lumilab-research-interview` 拿到 5-8 个再回来
- 用户想要的是竞品对比 → 走 `lumilab-research-competitor`
- 用户要做画像贴卡片（性别/年龄/星座）→ 拒做，这不是 ICP，是 slop

## 方法论核心

ICP ≠ persona ≠ "用户画像"。

**ICP** = 一个 segment，描述"哪种公司/个人买你产品会闭着眼买、留得最久、口碑最好"，
颗粒要细到能用一行 SQL/筛选条件圈出来。

**Persona** = 这个 ICP 内部的一个虚拟代表人，用来在文案/产品决策时"对一个人说话"。

### 一、五维 ICP 模型

| 维度 | 字段 | 例 |
|---|---|---|
| Demographic | 年龄、性别、地域、收入、教育 | 28-38 女、上海/杭州、月薪 1.5-3 万 |
| Firmographic（B2B） | 行业、规模、营收、员工数、技术栈 | SaaS、10-50 人、ARR ¥500k-5M |
| Psychographic | 价值观、身份认同、焦虑、向往 | 想脱离打工身份、怕"伪独立"自欺 |
| Behavioral | 用什么工具、关注什么 KOL、信息源、消费节奏 | 看 indiehackers / v2ex / xhs，月订阅支出 ¥500+ |
| JTBD | 在什么情境下"雇佣"你的产品，要"开除"哪个替代品 | 周日晚上焦虑下周内容时，开除"自己强写" |

JTBD 是 ICP 的灵魂。其他四维是骨架。

### 二、Bob Moesta JTBD Switch Interview

Moesta 的核心洞察：**人买东西不是因为属性，是因为在某个具体瞬间 "fired" 了原来的方案，"hired" 了你的方案**。

四种"力"决定 switch：
- **Push of the current situation**（现状的推力——"我受够了"）
- **Pull of the new solution**（新方案的拉力——"听说有更好的"）
- **Anxiety of the new**（对新方案的焦虑——"会不会更糟"）
- **Habit of the present**（旧习惯的惯性——"算了就这样吧"）

**只有 push + pull > anxiety + habit，用户才会真正切换**。

### 三、Sean Ellis 40% PMF Survey

唯一一个值得做的 PMF 量化问题：

> "如果明天就不能用这个产品了，你会怎么感觉？"
> A. 非常失望  B. 有点失望  C. 不失望  D. 我已经不用了

**≥40% 选 A 的那一群人 = 你的真 ICP**。
把这群人单独切出来看：他们是谁？怎么形容产品？还有谁像他们？—— 这就是 ICP 提炼路径。

### 四、April Dunford — Segment of One

Dunford 在 _Obviously Awesome_ 反复讲："如果你不能定位到只服务一个 segment 都能让公司活下来的细分，你的定位就太宽。"

做 ICP 时强迫自己回答：
> 如果只能服务这一个 segment 6 个月，公司能活吗？如果不能，segment 太窄；如果能，太好了，先聚焦它。

### 五、五个陷阱（必须主动反）

1. **"All developers"** — 没有所有开发者；前端/后端/独立/大厂工程师消费逻辑完全不同
2. **"Everyone who 想 X"** — 想 ≠ 会做 ≠ 会付费
3. **"小红书博主"** — 涨粉期 vs 变现期 vs MCN 签约，三种生物
4. **"中小企业"** — 中国 4800 万家中小企业，10 人和 200 人天差地别
5. **"创业者"** — 拿融资的、独立开发者、自媒体、咨询，根本不是一类人

## 工作流程

### 步骤 0 · 输入收集

```
✓ 读 yc_brief.md / project_brief.md
✓ 读 data/ventures/<name>/interviews/*.md（如有访谈转录）
✓ 用户现在描述的 "目标用户" 原话
```

### 步骤 1 · 宽度审判（HARD-GATE）

```
VST: 你刚才说"{用户原话目标人群}"。我用 ICP 宽度审判：
     - 这群人在中国/全球大概有多少？(>1000 万 = 太宽)
     - 他们用什么具体工具、上什么具体社群？
     - 你能不能此刻打开手机说出 5 个具体名字 + 联系方式？

     ○ 我说不出 → 必须缩窄
     ○ 我说得出，但是是朋友 → 你的 ICP 是"我的朋友"？不行，缩窄
     ○ 我能说出 5 个非熟人具体名字 → ✓ 进步骤 2
```

### 步骤 2 · 五维填表（一次填一维，HARD-GATE）

每填一维，VST 复述并问：**这个维度的颗粒度，能不能在 LinkedIn / 小红书 / 即刻 上用一个筛选条件圈出来？** 不能 → 重填。

### 步骤 3 · JTBD struggling moment 挖掘

```
VST: 现在我要你讲一个具体的故事。
     上周 / 上个月，你认识的这群人里，有谁因为这个问题做了一个明显的动作？
     （搜索了什么、问了谁、买了什么、放弃了什么）

     不要讲"他们通常会..."。要讲一个具体的人在一个具体的时间做的一个具体的事。
```

把这个故事写进 `jtbd_struggling_moments.md`，提取：
- 触发瞬间（trigger）
- 旧方案（fired）
- 焦虑点（anxiety）
- 期望结果（progress they want to make）

### 步骤 4 · Segment-of-One 测试

```
VST: 如果未来 6 个月你只服务"{填好的 ICP}"这一个 segment，公司能活吗？

     ○ 能 → ✓ ICP 确认
     ○ 算了下不能 → segment 太窄，往上回一层（不是放回"所有人"，而是合并一个相邻群）
     ○ 算了下能但用户量 < 1000 → 警告，需要确认是不是利基 niche 策略
```

### 步骤 5 · Sean Ellis 40% 设题（若已有 ≥30 用户）

输出一个可发的问卷模板，待用户群体 ≥30 时跑：
- 必备问题：如果明天不能用了你会怎么感觉？
- 补充：你会向哪种人推荐？
- 补充：产品给你带来的最大好处？

### 步骤 6 · 输出 icp.yaml + icp.md + struggling_moments.md

## 真实示例 / Worked Example

**用户原始描述**："我做一个帮自由职业者管账的 App"

```
步骤 1 宽度审判：
VST: "自由职业者"中国估 5000 万+，太宽。
     是设计师？翻译？程序员？咨询师？心理咨询师？UP 主？
用户: "主要是独立设计师"
VST: 平面设计 / UI / 插画 / 摄影？月单数 1-3 个 vs 10+ 个？接 B 端还是 C 端？
用户: "主要是接 B 端长期甲方的独立 UI / 插画师，月单 2-5 个，月收入 1.5-5 万"

步骤 2 五维（节选）：
- Demographic: 25-35 岁，一线/新一线，男女比 4:6，本科以上
- Firmographic: 个体工商户/无照，年收入 ¥20w-60w
- Psychographic: 怕被甲方拖款、怕报税出错、不愿请会计、想"专业但不像公司"
- Behavioral: 用即刻 / 站酷 / 小红书 / 飞书文档，订阅 Figma + Notion + 1Password
- JTBD: 季度报税前 2 周焦虑爆发，开除"Excel + 微信收据截图"

步骤 3 struggling moment（真实故事）：
"上个月 4 月 28 日，我朋友（27 岁，上海独立 UI 设计师）周日晚上 11 点
在即刻发了一条：'报税材料怎么这么乱，光找 Q1 的合同就找了 3 小时。'
她那一刻搜了'自由职业 报税 工具'，下载了 3 个 App，
全部因为要绑公司账号放弃，最后又回 Excel。"

→ trigger: 季度报税倒数 2 周
→ fired: Excel + 微信截图
→ anxiety: 新工具要绑公司账号 / 数据不安全
→ progress: "我想 5 分钟搞定 Q1 合同收据归档"

步骤 4 Segment-of-One:
中国独立 UI/插画师 估 30-50 万人 → 渗透 1% = 3000-5000 付费用户
× ¥39/月 = 月 MRR ¥117k-¥195k → 一人公司活得很好 ✓

步骤 5 Sean Ellis 40% 待跑（等 30 用户）
```

## 输出 schema

`data/ventures/<name>/icp.yaml`：

```yaml
icp:
  name: "独立 UI/插画师 - B 端长期甲方型"
  segment_size_estimate: "中国 30-50 万人"
  segment_of_one_test: pass

  demographic:
    age: [25, 35]
    gender_ratio: "4M : 6F"
    location: ["一线", "新一线"]
    income_monthly: [15000, 50000]
    education: "本科及以上"

  firmographic:
    legal_status: ["个体工商户", "无照"]
    annual_revenue: [200000, 600000]
    client_type: "B 端长期甲方为主"

  psychographic:
    fears: ["甲方拖款", "报税出错", "财务不专业感"]
    aspirations: ["专业但不像开公司", "时间换钱比 < 0.5h/¥1k"]
    identity: "我是创作者不是会计"

  behavioral:
    tools: ["Figma", "Notion", "1Password", "微信"]
    communities: ["即刻", "站酷", "小红书"]
    info_sources: ["即刻头部设计师", "公众号 UI 中国"]
    subscription_budget_monthly: [200, 800]

  jtbd:
    trigger: "季度报税前 2 周"
    fired_solution: "Excel + 微信截图 + 手动归档"
    anxiety: "新工具要绑公司账号 + 财务数据不愿离手机"
    progress_wanted: "Q1 合同收据 5 分钟内归档完毕"
    forces:
      push: 8       # 1-10
      pull: 7
      anxiety: 5
      habit: 6
    net_switch_force: +4   # (push+pull) - (anxiety+habit)

  reach:
    first_50_list: "见 data/ventures/<name>/cold_outreach_list.md"
    channels: ["即刻话题 #独立设计师 日常", "小红书报税 SEO"]

  pmf_survey_pending:
    trigger_when: "用户 ≥ 30"
    question: "如果明天起不能用了你会怎么感觉？"
```

## 反 Slop 自检

- ❌ 出现"用户画像 / 颗粒度 / 心智 / 赛道 / 抓手" — 强制改写
- ❌ ICP 写成"对生活有追求的 25-35 岁年轻人" — 这是化妆品广告语，不是 ICP
- ❌ 五维全填了但 JTBD struggling moment 是编的（没有具体日期/人名/动作）— 打回
- ❌ Segment-of-One 测试没做 — 不准出 yaml
- ❌ 用 emoji 装饰人物卡片 — 删
- ✅ 每一条字段都能在一个真实平台上写成筛选条件
- ✅ struggling moment 必须有具体时间锚（"上个月 28 号"，"上周三晚上"）
- ✅ 五维交叉后估出一个具体的 segment size 数字（哪怕是范围）

## Chat-only fallback

飞书 / 微信对话内运行：把"五维填表"拆成 5 条问题逐条发，每条问完等用户回再发下一条；
struggling moment 让用户用语音转文字讲 3-5 分钟，VST 听完再问追问。
最终 icp.yaml 用代码块整段粘出，让用户自行存进仓库。Sean Ellis 问卷部分给出 Tally/腾讯问卷模板链接占位符
（VST 不直接发问卷，由用户复制问题去自建表单）。绝不在对话里硬塞表格——
中文输入法 + 手机端表格阅读体验差，统一用纵向列表。

## 关联

- 上游引用：见 metadata.upstream
- 前置依赖：`lumilab-coach-yc`（Q2 答案是 ICP 的种子）
- 平行依赖：`lumilab-research-interview`（访谈记录为 ICP 提供素材）
- 下游消费：`lumilab-copy`（VoC 提炼基于 ICP psychographic + JTBD）、`lumilab-landing-mvp` hero 文案、`lumilab-research-competitor`（确认替代品池）
- 升级：当某 segment 在 ≥3 个 venture 中复用，把它升格到 `memory/resources/icp-library/`

## 分支决策

| if 条件 | then 走哪条路径 |
|---|---|
| 用户答案是 "all developers / everyone / 创业者" 类泛化 | 拒绝写 yaml，回步骤 1 宽度审判强制 narrow |
| 用户连 idea 都没讲清 | 反触发 — 先走 lumilab-coach-yc |
| 用户没有任何访谈也没有用户 | 反触发 — 先走 lumilab-research-interview 拿 5-8 个再回来 |
| 用户已有 ≥30 付费用户 | 步骤 5 直接出 Sean Ellis 40% 问卷模板 |
| Segment-of-One 测试结果为「不能活」 | segment 太窄，往上合并一个相邻群，不退回「所有人」 |
| 同一 idea 重跑且与上版相似度 >70% | 提示用户是否合并，不无脑覆盖 |

## Output validation

`scripts/validate-output.ts` 是确定性校验器，强制 SKILL.md「输出 schema」「反 Slop 自检」「Edge cases」里的结构规则。

校验字段：`icp.name`（string，必填）· `segment_size_estimate`（string，必填）· `segment_of_one_test`（enum：pass | fail）· 五维 `demographic` / `firmographic` / `psychographic` / `behavioral` / `jtbd`（object，全部必填）· `jtbd.{trigger,fired_solution,anxiety,progress_wanted}`（string，必填）· `jtbd.forces.{push,pull,anxiety,habit}`（number 1-10）· 全文不含 slop 词。

```bash
bun run scripts/validate-output.ts data/ventures/<name>/
# exit 0 = 合规，exit 1 = 逐条列出违规
```

## Dependencies

| 依赖 | 类型 | 是否付费 | 单次调用约成本 | 说明 |
|---|---|---|---|---|
| bun | CLI runtime | 免费 | free | ≥1.0，必需 |
| host LLM | 宿主提供 | 取决于宿主 | ~3-6k tokens / 一次 ICP 建模 | 五维填表 + JTBD 挖掘复用宿主 |

## Outputs

`data/ventures/<slug>/icp.yaml` · `data/ventures/<slug>/icp.md` · `data/ventures/<slug>/jtbd_struggling_moments.md`

## Example

见 SKILL.md「真实示例」段

## Tests

`tests/smoke.md` — 该 skill 的最小冒烟测试约定：让 host LLM 在对话中跑通 SKILL.md「真实示例」段即视为通过。E2E 真集成见 `docs/TUTORIAL.zh.md`。

## Idempotency

`icp.yaml` 重跑写新版本到 `icp.v<n>.yaml`，上一版保留；segment-of-one 不允许覆盖。

## Privacy

所有 demographic / psychographic / firmographic 字段只本地存储；JTBD 访谈原文若上传需用户显式同意。

## Cache

segment 模板缓存；同一 idea 重跑 ICP 输出有相似度（>70%）则提示用户是否合并。

## Failure modes

若 "all developers" / "everyone" 类泛化回答 → 拒绝写 YAML，要求用户 narrow 到 segment-of-one。

## Edge cases

至少 1 个 JTBD struggling moment（具体场景 + 时间 + 当下情绪）才算 valid ICP。

## Alternatives

用户现在可能用什么替代方案，以及 Lumi Lab 为什么不一样：

- **通用 LLM「我的目标用户是谁」**：会给"25–35 岁一二线城市"这种泛画像。
- **市场调研报告**：贵、慢、不针对你的 idea。
- **「用户画像」模板**：填了一堆字段但没有 JTBD struggling moment。

Lumi Lab 的差异：拒绝"all developers / everyone"，强制 narrow 到 segment-of-one + 至少 1 个具体 JTBD struggling moment（场景 + 时间 + 情绪）。

## Moat（复利护城河）

`icp.v<n>.yaml` 版本累积，你能看到 ICP 如何随访谈收窄。多个 venture 的 ICP 横向对比能发现"我总是吸引同一类用户"。

## Changelog

- **1.0.0-rc4** — 新增 `scripts/validate-output.ts`（icp.yaml 五维齐全 + segment_of_one_test 枚举 + JTBD 四要素 + forces 各项 1-10 + segment_size_estimate + 禁词扫描）+ Output validation 段；新增 分支决策 if-then 表；Dependencies 表加单次调用约成本列；统一 outputs 文件名（Outputs 段补齐 frontmatter 的 icp.yaml / icp.md / jtbd_struggling_moments.md 三件）。
- **1.0.0-rc1** — 初版：五维 ICP 模型 + JTBD switch + Sean Ellis 40% + segment-of-one。

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
