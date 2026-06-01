---
name: lumilab-next-actions
description: |
  下一步行动决策引擎 —— 把「本轮实验信号」收敛成「现在该做什么」。读全量 venture 数据（市场分析/假设/决策/复盘/指标/付款），对照 R6 信号基线打 level+tier+一句解读，产出逻辑严明、**多方向**的推进建议（同一 idea 的不同岔路：换定位/换渠道/改价/换受众/补证据），落成 studio/next-actions.json（3 列看板 + 脑图大纲）。**信号→解读→候选动作，你来选，不替你拍板。** Use when 复盘后想知道下一步、用户说「然后呢/下一步做什么/帮我理一下该干嘛」，或 idea-to-landing / weekly-sop-runner 复盘环节路由到行动规划。
  关键词：下一步行动 / next actions / 看板 / kanban / 脑图 / mindmap / 决策引擎 / 多方向 / 推进岔路 / 信号解读 / R6 基线 / 复盘 / 待验证 / 进行中 / 已学到 / 可打印
version: 0.2.0
metadata:
  hermes:
    tags: [next-actions, kanban, mindmap, retro, decision]
  lumilab:
    tier: core
    requires_browser: false
    chat_only_ok: true
  category: agent
  agent: next_actions
  upstream:
    - "personal/idea-insight (IdeaData = mindmap + todoBlocks + kanbanColumns)"
    - "~/.claude/skills/autoplan (decision framework)"
    - "lumilab-weekly-sop-runner (复盘四桶，本 skill 的上游信号源)"
  outputs:
    - "data/ventures/<name>/studio/next-actions.json (3 列看板 + source_signals + mindmap_md)"
  reads:
    - "data/ventures/<name>/market_analysis.json (idea + 多方向 directions)"
    - "data/ventures/<name>/hypotheses.yaml (要验证什么 / 已验证什么)"
    - "data/ventures/<name>/decisions.yaml (已做的决策)"
    - "data/ventures/<name>/research/retro-*.yaml (本轮复盘四桶信号)"
    - "data/ventures/<name>/payment/summary.json (真实付款信号 · W3)"
    - "skills/lumilab-metrics/assets/baselines.yaml (R6 信号基线 A/B/C 置信层)"
license: AGPL-3.0-or-later
platforms: [macos, linux]
prerequisites:
  env_vars: []
  commands: [bun]
compatibility: "Claude Code, OpenClaw 2026.4.25+, Hermes Agent v0.13.0+, Cursor, Codex"
---

# lumilab-next-actions · 下一步行动决策引擎

**一句话价值（decision_support）**：复盘完一堆零散信号、卡在「然后呢」时，把信号收敛成 2-4 条**针对同一 idea 的推进岔路**候选，每条说清「为什么是它 · 验证什么 · 第一步做什么」——给方向盘，不替你踩油门。

## 目标用户

刚跑完一轮验证（发了落地页 / 收了付款 / 做了复盘）的**单人创始人 / 独立开发者 / 副业人（OPC）**，手上有数据但不知道下一步该继续、调整还是放弃。不面向团队协作或已 PMF 的成熟产品。

## 北极星对齐

让用户把**一个** idea **持续验证下去、跑通闭环**，不是生成多方案。「多方向」= 同一 idea 的不同推进岔路（换定位/换渠道/改价/换受众/补证据），**不是生成新 idea**。

## 何时调用

- 复盘后（`lumilab retro` 之后）用户想知道「然后呢 / 下一步做什么 / 现在该继续还是调整」。
- idea-to-landing Phase 5 收数后、weekly-sop-runner 复盘后的行动规划环节。

## 差异化与抗替代

- **vs 现有替代**：idea checker / Validator.ai 给个分就结束、通用 todo 工具不懂验证语境——本 skill 的产物是**对照量化基线的多方向候选 + 可拖拽持久化看板**，落地到「现在做什么」。
- **为什么不是通用 LLM**：信号 level 来自 `baselines.yaml` 的**确定性查表**（机械、可追溯），不是凭感觉；产物写进 studio 看板/脑图并跨轮回写假设——纯 LLM 给不出基线校准 + 持久化 + 数据沉淀。
- **沉淀**：`next-actions.json` 随每轮信号累积、回写 hypothesis evidence，数据越积越厚，可升格为 portfolio 级推进模式。

## 工作流程（怎么跑）

确定性骨架（baseline 查表 = 机械查找，非推理），断网/无 LLM 也能出内容（离线兜底）：

```bash
bun run scripts/next-actions.ts generate <venture-dir>
```

host LLM 再按下方 EXECUTION CONTRACT **在此基础上增强**多方向判断与文案，增强后重跑 `validate-output.ts` 确认仍合法。

### EXECUTION CONTRACT（硬约束）

1. **读全量再下结论**：`market_analysis.json` / `hypotheses.yaml` / `decisions.yaml` / `research/retro-*.yaml`（最新）/ 指标 / `payment/summary.json`（若有）。
2. **每个有数指标 → 查 `lumilab-metrics/assets/baselines.yaml`（R6）**：定 `level`(dead/weak/normal/strong/excellent) + `tier`(A/B/C) + 一句中文解读 → `source_signals`。**C 层必附「经验基线，以自测为准」**（validator 会卡）。
3. 产出 **2-4 条多方向候选**，每条说清「为什么是它 · 验证什么 · 第一步」→ `tasks`。
4. **不替用户拍板**：方向是候选，用户选一条往下走。
5. 写 `next-actions.json` + `mindmap_md` → 跑 `validate-output.ts` → 触发 studio 重渲。

## 用法 · 示例

```bash
# 生成（确定性）
bun run scripts/next-actions.ts generate ~/.lumilab/data/ventures/lumilab-meta
# 校验 schema（columns / tasks / signals / mindmap）
bun run scripts/validate-output.ts ~/.lumilab/data/ventures/lumilab-meta
# → ✓ next-actions output valid (7 tasks, 1 signals)
```

更多见 `tests/smoke.md`。呈现（看板拖拽 + 脑图 + 打印）在 `lumilab-studio` 复盘阶段查看。

## 输出 · studio/next-actions.json

字段：`venture` / `generated_at` / `source_signals[]`(metric·value·level·tier·interpretation) / `columns[]`(固定三列 to_validate·in_progress·learned) / `tasks[]`(id·column·title·detail·priority·linked_hypothesis·source) / `mindmap_md`。

```jsonc
{
  "venture": "<slug>", "generated_at": "...",
  "source_signals": [{ "metric": "payment_any", "value": 7, "level": "strong", "tier": "A", "interpretation": "7 笔真实付款……比留资强。" }],
  "columns": [{ "id": "to_validate", "title": "待验证" }, { "id": "in_progress", "title": "进行中" }, { "id": "learned", "title": "已学到" }],
  "tasks": [{ "id": "t-001", "column": "to_validate", "title": "落地页发 3 个社群，UV≥100", "priority": "high", "linked_hypothesis": "h-003", "source": "signal:uv_too_low" }],
  "mindmap_md": "# <idea>\n## 强信号\n- ...\n## 待验证\n- ..."
}
```

`linked_hypothesis` 可空；非空时 studio 看板卡片可点跳该假设。`source` 标注动作从哪个信号/假设/方向推出（可追溯）。

## 异常路径 · 幂等 · 边界

- **幂等**：`generate` 对同一份 venture 数据确定性产出、覆盖写，重复运行结果一致、可 diff。
- **数据缺失**：无 payment/retro/指标时只出确定性骨架 + 空 `source_signals`，**不报错**；`validate-output.ts` 把无 next-actions.json 的 venture 视为合法。
- **输出校验**：`validate-output.ts` 强制校验 columns/tasks/signals/mindmap schema，C 层信号缺免责声明即 fail；anti-slop-lint 兜禁词。
- **边界**：无任何 venture 数据 → 最小合法骨架；信号矛盾 → 给「补证据/再攒一轮」候选而非硬下结论。

## 依赖与成本

仅 `bun` + `js-yaml` + 同仓 `lumilab-metrics/assets/baselines.yaml`；**无网络、无外部 API、无 LLM 调用**（确定性骨架）。SKILL.md 体积小、按需加载 scripts/，每次调用上下文成本低。

## 安全与隐私

只读 venture 本地数据、只写一个 `next-actions.json`，**不外传、纯本地**；不处理 PII/密钥。

## 反面例子（不要这样）

- ❌ 只看一个指标就喊「成功/失败」——必须读全量、给信号温度而非判决。
- ❌ 生成一个**新 idea** 当「方向」——方向是同一 idea 的岔路。
- ❌ 替用户拍板「你应该放弃」——给候选 + 解读，决定权在用户。
- ❌ C 层国内社媒经验值当硬基准——必须标「以自测为准」。

## Changelog

- **0.2.0**：补目标用户 / 差异化 / 异常·幂等·边界 / 依赖 / 安全 章节；文档对齐 W2 看板+脑图+打印。
- **0.1.0**：首版 —— 确定性决策引擎骨架 + 三件套（validate-output / anti-slop / tests）。
