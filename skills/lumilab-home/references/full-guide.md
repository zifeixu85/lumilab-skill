# lumilab-home · 完整操作指南（原始详版）

> 这是精简版 SKILL.md 的**完整操作参考**：详细流程、表格、边界、示例、分支决策。
> 宿主执行该 skill 的流水线时按需加载本文；SKILL.md 只保留路由与核心。

---

# Lumi Lab Home —— 门面 / 入口

## 这个 skill 是什么

**「我装好了 Lumi Lab，然后呢？」—— 这个 skill 就是那个「然后」。**

用户第一次接触 Lumi Lab、或者隔了一阵子回来想看「我有哪些 venture、配到哪了、该干啥」时，调这个 skill。它做两件事之一：

- **首次使用** → 引导用户走一遍首次配置（选界面风格、可选工具 token）
- **已配置过** → 渲染一个 home dashboard：工具状态、所有 venture + 各自进度、下一步建议

## 何时触发

- 用户说「打开 lumilab」「lumilab home」「lumilab dashboard」「开始用 lumilab」「lumilab 主页 / 总览」
- 用户刚装完 Lumi Lab，问「然后呢」「怎么开始」「从哪开始」
- 用户输入 `lumilab home` 或裸 `lumilab`
- 用户问「我有哪些 venture」「我的项目进度」「现在什么情况」

## ⚠️ EXECUTION CONTRACT

和 `lumilab-idea-to-landing` 一样，这是可执行流程不是建议：

1. **先判断 onboarded 状态**，再决定走引导还是 dashboard —— 不要两个都做、也不要跳过判断。
2. **dashboard 必须是 HTML 文件并主动交付** —— 本地开浏览器，chat 环境发文件附件 + 贴文字摘要。
3. **结尾给具体动作选项**，不是开放式提问。

## 流程

### Step 0 · 判断状态

```bash
bun run scripts/home.ts status
# → 输出 JSON：{ onboarded, has_config, tools_configured[], ventures[], channel }
```

### Step 1A · 首次使用（onboarded = false）

用户还没配置过。**引导他走首次配置**：

- **本地环境**（`LUMILAB_CHANNEL` 未设或 = local）：
  ```bash
  bun run ../lumilab-config/scripts/wizard.ts
  ```
  浏览器自动打开 6 步引导页（欢迎 → 界面风格 → 身份 → 偏好 → 工具 token → 完成）。
  跟用户说：「我帮你打开了首次引导页，6 步走完（工具 token 都可跳过），完成后回来我给你看 dashboard。」

- **chat 环境**（飞书 / Telegram，`LUMILAB_CHANNEL != local`）：
  ```bash
  bun run ../lumilab-config/scripts/wizard.ts --chat-onboard
  ```
  拿到引导脚本 JSON，在 chat 里跟用户走：介绍产品 → 让选界面风格（`--chat-onboard-preset <id>`）→ 按需配 token（`--chat-set <provider> <token>`）→ 收尾（`--chat-onboard-done`）。

引导完，**继续 Step 1B 给他看 dashboard**（这时就是 onboarded 了）。

### Step 1B · 已配置过（onboarded = true）→ 渲染 dashboard

```bash
bun run scripts/home.ts render
# → 生成 ~/.lumilab/data/_home/home.html
# → 本地自动开浏览器；chat 环境打印路径
```

**主动交付**：
- 本地：脚本自动开浏览器
- chat：把 `~/.lumilab/data/_home/home.html` 作为文件附件发给用户 + 贴一段文字摘要（已配 N 个工具 / M 个 venture / 最该做的下一件事）

dashboard 上有：
- **工具状态**：9 个工具逐个 ✓/—
- **venture 列表**：每个 venture 的名字、idea、流水线进度（intake / 分析 / 报告 / 选方向 / landing 各阶段 ✓）、最近活动
- **下一步建议**：基于状态给具体动作（「`venture-x` 分析做完了，去选个方向」「还没有 venture，说一句 idea 开始」「`venture-y` 的 landing 好了，可以 `lumilab deploy`」）

### Step 2 · 结尾给动作选项

不要开放式问「你想干嘛」。给具体路径：

```
接下来你可以：
· 新 idea：直接说一句话想法，我用 lumilab-idea-to-landing 跑完整条流水线
· 继续某个 venture：说 venture 名字，我接着上次的进度往下走
· 改配置：说「lumilab config」重开引导页
```

## 分支决策

| 条件 | 走哪条 |
|---|---|
| `onboarded = false` | Step 1A 引导（本地浏览器 / chat 文本） |
| `onboarded = true` | Step 1B 渲染 dashboard |
| 引导刚走完 | 接着 Step 1B 给 dashboard |
| `LUMILAB_CHANNEL != local` | wizard 走 `--chat-onboard`；dashboard 走文件附件 |
| 没有任何 venture | dashboard 仍渲染，但下一步建议是「说一句 idea 开始第一个」 |

## Output validation

`scripts/validate-output.ts <data-dir>` 校验 `_home/home.html` 存在且含必要区块（工具状态 / venture 列表 / 下一步）。

校验字段:
- `_home/home.html` 存在 + 非空
- 含「工具」「venture」「下一步」三个区块标记

## Dependencies

| 依赖 | 类型 | 单次成本 | 说明 |
|---|---|---|---|
| bun | CLI runtime | free | ≥1.0 |
| host LLM | 宿主提供 | 取决于宿主 | 引导对话 / 下一步建议的措辞 |
| lumilab-config/scripts/wizard.ts | 同 bundle | free | 首次引导 |

## Outputs

- `~/.lumilab/data/_home/home.html` —— bundle 总览 dashboard（主动交付）

## Example

```
User（刚装完）: 我装好 lumilab 了，然后呢？
Bot: [跑 home.ts status] → onboarded=false
     [本地] 打开 wizard.ts → 浏览器 6 步引导页
     「我帮你打开了首次引导页，6 步走完回来」
User: 走完了
Bot: [跑 home.ts render] → 生成 home.html → 开浏览器
     「这是你的 Lumi Lab 主页：已配 2 个工具，还没有 venture。
      下一步：说一句你的想法，我帮你跑第一个验证。」
```

## Tests

`tests/smoke.md` —— 最小冒烟：`home.ts status` 输出合法 JSON；onboarded 后 `home.ts render` 生成 home.html 且过校验。

## 环境自检（首次运行前）

本 skill 的 `scripts/` 用 **bun ≥ 1.0** 运行。宿主里第一次调用前先做环境自检——缺 bun 就自动装：

```bash
command -v bun >/dev/null 2>&1 || { [ -x "$HOME/.bun/bin/bun" ] && export PATH="$HOME/.bun/bin:$PATH"; }
command -v bun >/dev/null 2>&1 || curl -fsSL https://bun.sh/install | bash
export PATH="$HOME/.bun/bin:$PATH"
```

## Idempotency

`home.ts render` 每次覆盖 `~/.lumilab/data/_home/home.html`（dashboard 是当前状态的快照，重渲即最新）。`status` 只读不写。引导只在 `onboarded=false` 时触发，已 onboarded 不会重复打扰。

## Privacy

只读 `~/.lumilab/config.json`（不回显 token 值，只看 has_* 标志）和本地 `~/.lumilab/data/ventures/`。dashboard HTML 留在本地。无遥测。

## Cache

`status` 是即时读取，不缓存（状态要准）。`home.html` 按 venture 目录 mtime 决定是否需要重渲。

## Failure modes

- `~/.lumilab/config.json` 不存在 → 视为 `onboarded=false`，走引导
- `config.json` 损坏 → 报错并建议重跑 `lumilab config`
- `~/.lumilab/data/ventures/` 不存在 → dashboard 正常渲染，venture 列表为空 + 引导用户开第一个
- wizard.ts 不可用（缺文件）→ 提示用户检查安装完整性

## Edge cases

- 用户在引导中途退出 → 下次调 home 仍是 `onboarded=false`，重新引导（不强制，可跳过）
- 同时几十个 venture → dashboard 按最近活动排序，默认展示前 10 + 「查看全部」
- venture 目录被手动删了一半文件 → 进度按现存文件判断，缺的标「未完成」

## Alternatives

用户现在可能怎么办，以及为什么这个 skill 更好：

- **装完自己翻 `~/.claude/skills/` 目录** —— 24 个 skill 不知道从哪个开始。
- **直接问宿主 LLM「lumilab 怎么用」** —— LLM 会泛泛介绍，但不知道用户**当前**配到哪、有哪些 venture。
- **记住一堆命令** —— 不可能。

`lumilab-home` 的差异：一个固定的「门面」入口，知道你当前的真实状态，告诉你**此刻**该做什么。

## Moat（复利护城河）

跑得越久，dashboard 越有价值：它累积展示你所有 venture 的验证轨迹。一眼看到「我验证过 5 个 idea，3 个 pivot 了、1 个在跑、1 个待部署」—— 这是单个 venture 工具给不了的全局视角。

## 主动交付（不要静默落盘）

这个 skill 的产物 `home.html` 是**用户该看的东西** —— 必须主动交付：本地自动开浏览器，chat 环境作为文件附件发给用户，并在 chat 里贴一段文字摘要（已配几个工具 / 几个 venture / 最该做的下一步）。不能写完文件就完事。

## Changelog

- **1.4.0** (2026-05-14) — 新建。Lumi Lab 的门面 / 入口 skill —— 解决「装完不知道从哪开始」「首次没引导」「没有 home/dashboard」三个缺口。

## 写时更新（产物变了就刷新 home / studio）

Lumi Lab 用「写时更新」保持 home dashboard 和 venture Studio 是最新的 —— 没有常驻进程做实时同步，所以**谁改了数据，谁负责顺手刷新**。

这个 skill 只要**创建或更新了某个 venture 的文件**（写了 `market_analysis.json` / `reports/` / `landing/` / `decisions.yaml` / `design_direction.json` / retro YAML 等），做完后**必须**：

1. 重渲这个 venture 的 Studio：`bun run ../lumilab-studio/scripts/render.ts ~/.lumilab/data/ventures/<slug>`
2. 重渲 home dashboard：`bun run ../lumilab-home/scripts/home.ts render`

这样用户回到 home 或 Studio 就能立刻看到这一步的产物，不用手动说「刷新」。如果只是读、没写 venture 数据，不用刷新。

CLI 入口（`lumilab idea` / `config` / `deploy`）已经内置了写时更新；**对话式调用时由你（宿主 agent）负责补这两步**。
