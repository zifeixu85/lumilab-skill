---
name: lumilab-coach-yc
description: |
  YC office-hours 6 forcing questions + Paul Graham heuristics + Lean Startup loop. 把一个模糊 idea 逼成一句话 + 一群人 + 一个钩子 + 一个验证动作。是 lumilab-idea-to-landing 流水线的「想法澄清」步，不是终点：梳理完**必须**用 orchestrate.ts coach-brief 把结论落进 venture（写 yc_brief.md + 种假设）并接回 idea-to-landing 跑调研，绝不停在对话里。Use when 用户说"我有个 idea"、"我想做个 SaaS"、"帮我看看这个产品方向" 且想先想清楚切口，或经 idea-to-landing Phase 0 教练岔路 / founder-coach Layer 1 路由进来。想直接「从 idea 一路到 landing」则入口是 lumilab-idea-to-landing（它会在 Phase 0 提供可选的教练岔路）。
  关键词：coach-yc / YC application / Paul Graham / 6 forcing questions / schlep blindness / default alive / make something people want / 一句话产品定位 / 创业 idea 澄清
version: 1.6.0
metadata:
  hermes:
    tags: [yc, office-hours, paul-graham, forcing-questions]
  lumilab:
    tier: overlay
    requires_browser: false
    chat_only_ok: true
  category: agent
  agent: coach
  authors: [lumilab]
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
license: AGPL-3.0-or-later
platforms: [macos, linux]
prerequisites:
  env_vars: []
  commands: [bun]
compatibility: "Claude Code, OpenClaw 2026.4.25+, Hermes Agent v0.13.0+, Cursor, Codex"
---


# coach-yc · YC office-hours 创业方法论教练

**一句话价值（learning）**：把一个模糊 idea 逼成「一句话 + 一群人 + 一个钩子 + 一个验证动作」，用 YC office-hours 的 6 个 forcing questions 强制产出结论，不是陪聊。

## 目标用户

想把模糊想法澄清成可验证方向的**早期独立创业者 / 副业人**。不面向已 PMF 的成熟团队、或只想要执行清单的人。

## 方法论核心

- **YC 6 forcing questions**：① 你在为谁解决什么问题？② 这群人现在怎么凑合解决（替代品）？③ 为什么是现在？④ 你怎么拿到前 100 个用户？⑤ 最大的未验证假设是什么？⑥ 下一步具体做什么、怎么算成功？
- **Paul Graham 启发式**：make something people want；schlep blindness（最脏最难的活往往是机会）；default alive（先算清能不能自己活下来）。
- **Lean loop**：build → measure → learn，每轮只验一个最高风险假设。

## 何时调用

两种入口，**两种都必须收尾接回流水线**（见下「收尾」段，这是不可跳过的硬步骤）：
- **经 `lumilab-idea-to-landing` 的 Phase 0 岔路**：用户选了「先用教练梳理一轮」→ 跑本 skill → 回到 idea-to-landing 调研。
- **被直接命中**：用户说「我有个 idea / 想做个 SaaS / 帮我看看这个方向」。这时本 skill 是**流水线的澄清入口，不是终点**——梳理完照样要建 venture、存结论、接调研。

> ⚠️ 最常见的错误：把 6 问当成一次性「陪聊」，给完结论就停手。**那是错的。** 教练的产出必须落进 venture 并接回 idea-to-landing，否则用户拿不到调研/落地页，整个验证闭环断在这里。

## 工作流程与用法

1. 用 6 问逐项逼问，空泛回答必追问到具体（谁、哪个挣扎瞬间、什么替代品）。
2. 收敛成「一句话定位 + ICP + 核心钩子 + 最高风险假设 + 第一个验证动作」。
3. **收尾（必做，三步，不可省）**：

```bash
# ① 若还没有 venture，用这句 idea 建一个（已有就跳过，复用其 slug）
bun run ../lumilab-idea-to-landing/scripts/orchestrate.ts init "<用户那句 idea>"

# ② 把刚梳理出的 5 字段确定性落盘 —— 写 yc_brief.md + 把最高风险假设种进 hypotheses.yaml
#    （Studio 想法澄清页会立刻渲染「教练梳理结论」卡片）
bun run ../lumilab-idea-to-landing/scripts/orchestrate.ts coach-brief <slug> \
  --positioning "一句话定位" --icp "目标用户" --hook "核心钩子" \
  --risk "最高风险假设" --test "第一个验证动作"
```

4. **③ 接回流水线（必做）**：明确把控制权交回 `lumilab-idea-to-landing` 的 Phase 1，问一句让用户决定：
   > 切口已经梳理清楚、存进 venture 了。接下来我帮你跑一轮**市场 / 竞品 / 小红书 / 关键词调研**来验证这个方向（即使没配 API key 也能用我自己的能力跑真实数据），然后产出假门落地页。开始吗？
   用户点头 → 直接进 idea-to-landing Phase 1（调研），**不要**让用户重新描述一遍 idea（venture 里已经有了）。

示例：用户「我想做个帮人记账的 app」→ 追问到「给刚开店的个体户、月底对不上账那一刻、现在用微信账单截图凑」→ `coach-brief` 落盘 → 接 idea-to-landing 跑调研。

## 输出

字段：一句话定位 / 目标用户(ICP) / 核心钩子 / 最高风险假设 / 第一个验证动作。**经 `orchestrate.ts coach-brief` 确定性写 `data/ventures/<slug>/yc_brief.md` + 种 `hypotheses.yaml`**，Studio 想法澄清页据此渲染「教练梳理结论」，再接回 idea-to-landing 调研——不是停在对话里。

## 差异化与抗替代

- **vs 现有替代**：泛泛的「创业建议」AI 给鸡汤、读不完的方法论书不强制行动。
- **为什么不是通用 LLM**：把 YC 6 问 + PG 启发式固化成**不可跳过的追问序列**，强制每次产出结构化结论而非发散闲聊；并接入 lumilab 的假设账本/下一步引擎形成闭环。
- **沉淀**：每次澄清产出可追溯的 idea 定位，跨轮复用、随证据迭代。

## 异常路径 · 幂等 · 边界

输入空泛时回到 6 问逐项逼问，不放过空话；信息不足不硬下定位、给「先去验证 X」。只给候选定位，**不替用户拍板做不做**。

## 依赖与成本

纯知识叠加，无外部依赖、无网络、无脚本调用；SKILL.md 精简，单次上下文成本低、可缓存。

## 安全与隐私

纯本地对话、不外传、不处理 PII、不评判。

## 深入参考

完整操作细节（详细流程 / 表格 / 边界 / 分支决策）见 `references/full-guide.md`，宿主执行流水线时按需加载。

## Changelog

- 1.6.0：补上**接回流水线的硬收尾**——梳理完必须 `orchestrate.ts init`(无 venture 时) + `coach-brief`(落 yc_brief.md + 种假设) + 接回 idea-to-landing 调研，修复「教练跑完就停手、不接产品流程」的断链。description 标明它是流水线的澄清步而非终点。
- 1.5.0：精简至 ≤6000 字、补齐 rubric 维度（目标用户/差异化与抗替代/异常·幂等·边界/依赖/安全），强化「为什么不是通用 LLM」。
