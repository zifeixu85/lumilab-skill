# Lumi Lab 上手指南

> 版本：v1.0 · 更新时间：2026-05

![](./assets/screenshot-01.png)

## 0. 这是什么 / 不是什么

**Lumi Lab 是什么**

Lumi Lab 是一组开源 Skill 包，帮独立开发者把一个 idea 从「脑子里」走到「能验证」「能上线」「能跑首批用户」。它把 Mom Test、Lean Canvas、Sean Ellis 40%、JTBD、April Dunford Positioning 等 13 套创业方法论，拆成可以被 AI Agent 直接调用的可执行步骤；同时内置了小红书、公众号、抖音、朋友圈、X 五个平台的最新发布规则。

跑一次 venture 的完整路径：
`new`（建项目）→ `coach`（六问拷打）→ `research`（市场 + 竞品 + 客户访谈）→ `build-assets`（落地页 / 文案 / 邮件 / 平台内容）→ `studio`（看板 + 数据 + 复盘）。

**Lumi Lab 不是什么**

- 不是 SaaS。没有云端控制台、没有账号体系。所有上下文都在你本地的 workspace 目录里。
- 不是「一键生成商业计划书」的玩具。每一步都要你亲自做决策、亲自跟用户聊。
- 不是只跑海外。中文 / 国内平台是一等公民，方法论同时给中英文版本。

## 1. 三种宿主三种路径

Lumi Lab 不绑定 Agent 框架。你可以在三种宿主里跑同一份 Skill。

### 1.1 Claude Code / Cursor / Codex 路径

适合：自己写代码、熟悉命令行的独立开发者。

```bash
# 安装
git clone https://github.com/zifeixu85/lumilab.git ~/lumilab
cd ~/lumilab
./install.sh

# 验证（应该能看到 13 个 lumilab-* skill）
ls ~/.claude/skills | grep lumilab
```

进入任意项目目录后直接问 Claude Code：

```text
帮我用 lumilab 起一个新项目，主题是「给小红书博主做的爆款选题工具」
```

Skill 会自动接管，先调 `lumilab-venture-new` 建目录，再让 `lumilab-founder-coach` 用 6 个 forcing question 拷打你。

Cursor、Codex CLI 用法一致，把 `~/.claude/skills` 软链到对应 skill 目录即可。

![](./assets/screenshot-02.png)

### 1.2 OpenClaw 路径（含飞书 bot 段）

适合：希望把 Lumi Lab 接进飞书 / 企业内部 IM 的团队。

```bash
# 安装
openclaw skills install lumilab

# 配置飞书 bot（一次性）
openclaw bot bind feishu --workspace lumilab
```

绑定后，在飞书群里 @ 机器人：

```text
@lumi 帮我起一个 venture，叫「面向小白的家庭收纳 SaaS」
```

OpenClaw 会把对话路由到对应 Skill，运行结果以飞书卡片形式回传。重要节点（六问完成 / PMF 测试结果 / 内容发布前确认）会通过飞书消息卡片要求人工确认。

### 1.3 Hermes Agent 路径（含 /skills install URL 段）

适合：浏览器场景为主、希望 Agent 帮自己刷小红书 / X 的用户。

在 Hermes 客户端的输入框：

```text
/skills install https://github.com/zifeixu85/lumilab
```

安装完成后：

```text
/lumilab new
```

Hermes 会打开一个带 Lumi Lab 上下文的标签页，把 venture 进展持久化到浏览器本地，下一次打开浏览器还能继续。

![](./assets/screenshot-03.png)

## 2. 你的第一个 venture（10 分钟跑通）

下面以 Claude Code 为例。OpenClaw / Hermes 的命令名一致。

**Step 1 · new（30 秒）**

```text
lumilab new
```

回答两个问题：venture 名字、一句话假设。Skill 会建好 `~/ventures/<name>/` 目录，写入 `README.md`、`assumptions.md`、`canvas.md` 三份模板。

**Step 2 · coach（3 分钟）**

```text
lumilab coach
```

按顺序问你 6 个 YC office hours 风格的 forcing question：

1. 你的目标用户是谁？具体一点，不要说「所有人」。
2. 他们现在怎么解决这个问题？
3. 你比现有方案好在哪里？
4. 你怎么找到第一个 10 个用户？
5. 他们为什么会付钱？
6. 你最大的风险假设是什么？

回答都会沉淀进 `coach-session-01.md`，作为后续 research 的输入。

**Step 3 · research（5 分钟）**

```text
lumilab research
```

调用三个子 Skill：

- `lumilab-market-scan`：拉竞品、市场规模、关键词热度（可选 Exa）
- `lumilab-interview-prep`：按 Mom Test 5 原则生成 10 道访谈问题
- `lumilab-platform-rules`：拉取小红书 / 公众号 / 抖音 / 朋友圈 / X 的最新规则（含 2025–2026 更新）

输出到 `research/` 子目录。

**Step 4 · build-assets（1 分钟）**

```text
lumilab build-assets
```

按你选的渠道生成：
- 落地页骨架（HTML + Tailwind）
- 邮件序列（首封 + 跟进 3 封）
- 小红书 5 篇笔记草稿（带封面文字、标签、self-check 段）
- X 串推草稿

所有平台内容都会先过 `references/platform-rules/<platform>.md` 的硬约束（标题字数 / 违禁词 / 标签数等）。

**Step 5 · studio（30 秒）**

```text
lumilab studio
```

打开本地看板（默认 `http://localhost:7788`），展示这个 venture 的：当前阶段、最新 6 个动作、关键指标（访谈数 / 落地页转化率 / 内容曝光）、下一步建议。

![](./assets/screenshot-04.png)

## 3. 飞书入门 demo（5 步）

适合不想装命令行工具、纯飞书办公的用户。

1. **拉机器人入群**：搜索「Lumi Lab Bot」并 @ 它发送 `绑定 workspace`。
2. **首次配置**：机器人会回卡片，让你填 venture 名字 + 一句话假设。
3. **起新项目**：在群里发 `@lumi new`，机器人创建 venture 并回传文档链接（飞书文档）。
4. **跑教练对话**：发 `@lumi coach`，机器人按顺序提问，你直接在群里回答。
5. **导出资产**：发 `@lumi export`，机器人把落地页 + 内容草稿打包成飞书文档 / 多维表格。

整个流程不写一行代码，团队成员也能围观、评论。

## 4. 配置（可选）— Cloudflare / Exa / TikHub

Lumi Lab 默认零配置即可跑。以下三项是可选增强。

### Cloudflare（落地页一键部署）

```bash
# 把 Cloudflare API Token 写到本地配置（不会上传任何地方）
lumilab config set cloudflare.token <your_token>
lumilab config set cloudflare.account_id <your_account_id>
```

之后 `build-assets` 生成的落地页可以直接 `lumilab deploy landing`，5 秒内拿到 Cloudflare Pages 链接。

### Exa（深度网络研究）

```bash
lumilab config set exa.api_key <your_key>
```

配置后 `research` 阶段会用 Exa 做深度搜索而非默认的轻量搜索，竞品分析的覆盖度显著提升。

### TikHub（小红书 / 抖音 / X 数据）

```bash
lumilab config set tikhub.api_key <your_key>
```

用于实时拉取目标账号的爆款笔记 / 视频元数据，辅助 `lumilab-content-coach` 做选题。

所有 key 仅写在 `~/.lumilab/config.json`，不会上传到任何远端。

## 5. 常见问题 / FAQ

**Q1：我必须装 Claude Code 吗？**
不必。OpenClaw、Hermes、Cursor、Codex CLI 都可以。Skill 是纯文件，宿主只是「调用器」。

**Q2：Lumi Lab 会读我本地的别的项目吗？**
不会。Skill 只在你显式 cd 进入 venture 目录、或在飞书群里被 @ 之后才会工作。`~/ventures/` 目录之外不会被读写。

**Q3：方法论太多了，我用不过来怎么办？**
默认只跑 Mom Test + Lean Canvas + Sean Ellis 40% 三件套。其他 10 个方法论是按需引用，`lumilab-founder-coach` 会根据你回答的内容自动决定要不要拉出来用。

**Q4：平台规则会过期吗？多久更新一次？**
`references/platform-rules/*.md` 每个文件含「2025–2026 规则更新」段，列明发布时间和来源。我们维护频率：小红书 / 抖音每季度一次，公众号 / 朋友圈 / X 每半年一次。重要算法变化会单独发 release note。

**Q5：能不能用国产模型？**
Skill 本身只是 Markdown + 脚本，跟模型解耦。Claude / GPT / Qwen / Kimi / DeepSeek 都跑得动，模型由宿主决定。中文场景下 Qwen-Max + Lumi Lab Skill 的实测效果与 Sonnet 接近。

**Q6：我能贡献新方法论 / 新平台规则吗？**
可以。在 `releases/lumilab/skills/lumilab-playbook-cn/` 下加方法论、在 `references/platform-rules/` 下加新平台文件，发 PR 即可。每个新方法论需给出：一句话定义 + 5–10 个核心点 + 至少一个真实 venture 案例。

## 6. 下一步

- 跑通第一个 venture 后，读 `docs/ARCHITECTURE.md` 理解 Skill 之间的调用关系。
- 加入社群（README.md 底部链接），看其他人怎么用同一套 Skill 跑出自己的 venture。
- 把你 venture 的复盘写进 `~/ventures/<name>/retro.md`，下次起新项目时 `lumilab coach` 会自动参考你过去的经验。

祝你跑通第一个 venture。
