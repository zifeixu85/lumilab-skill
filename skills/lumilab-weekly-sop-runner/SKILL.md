---
name: lumilab-weekly-sop-runner
description: |
  7-day standard operating procedure (SOP) generator for venture validation experiments. Generates Day 0-7 blueprint with self-contained cold-start brief per day, content publishing calendar, data collection table, decision thresholds. Registers paperclip routines (P0 structure only, P1 enables actual cron). Use when user types /lumilab launch or /lumilab sop, after content is generated.
  关键词：7 天 SOP / 增长实验 / launch plan / 冷启动 / cron / blueprint / 发布日历 / 数据回收 / 决策阈值 / paperclip routines / OKR / Pirate metrics
version: 1.0.0-rc1
metadata:
  hermes:
    tags: [sop, growth, 7-day, retro]
  lumilab:
    tier: core
    requires_browser: false
    chat_only_ok: true
  category: agent
  agent: sop_growth
  upstream:
    - "github.com/wshobson/startup-metrics-framework (6.3K 安装最多)"
    - "github.com/ognjengt/{go-to-market-plan,sop-creator,outreach-specialist}"
    - "github.com/skenetechnologies/growth-experimentation"
    - "github.com/aitytech/launch-strategy (PH + waitlist + beta 顺序)"
    - "~/.claude/skills/blueprint (5-phase pipeline)"
    - "~/.claude/skills/paperclip (heartbeat + routines)"
    - "~/.claude/skills/autoplan (decision framework)"
  outputs:
    - "data/ventures/<name>/growth_sop.md (7 日 blueprint)"
    - "data/ventures/<name>/content_calendar.md (发布日历)"
    - "data/ventures/<name>/validation_metrics.csv (数据回收表)"
    - "data/ventures/<name>/decision_thresholds.md (决策阈值)"
    - "data/ventures/<name>/task_list.md (每日任务清单)"
  reads:
    - "data/ventures/<name>/content/*.md (各平台已生成的内容)"
    - "data/ventures/<name>/hypotheses.yaml (要验证什么)"
    - "data/ventures/<name>/metrics.md (Primary / Guardrail / Secondary 指标)"
    - "memory/resources/platform-rules/*.md (各平台发布时机)"
license: Apache-2.0
platforms: [macos, linux]
prerequisites:
  env_vars: []
  commands: [bun]
compatibility: "Claude Code, OpenClaw 2026.4.25+, Hermes Agent v0.13.0+, Cursor, Codex"
---

# Weekly SOP Runner — 7 日实验编排

## 用途

把 venture 的产物（landing + 5 平台内容 + 价值假设）变成 **7 天可执行作战计划**：
- 每天的具体任务（Day 0 cold-start brief 自包含）
- 跨平台发布日历
- 数据回收表
- 决策阈值表
- paperclip routines 注册（P0 不真跑 cron，P1 启用）

## 何时触发

- 用户输入 `/lumilab launch` —— 主流程
- 用户输入 `/lumilab sop` —— 单独生成
- VST 检测到内容已生成但还没 SOP → 主动提示

## 7 日标准结构

```
Day 0 (周一)  Launch Day
  - 发首日内容到所有平台
  - 开启邮件捕获
  - 设置基线指标

Day 1 (周二) Engage
  - 回复评论 / 私信
  - 发当日内容
  - 记 D0 数据

Day 2 (周三) Iterate
  - 看 D0+D1 数据
  - 微调最弱平台
  - 发当日内容

Day 3 (周四) Double Down
  - 强信号平台加大投入
  - 弱信号平台试新钩子

Day 4 (周五) Mid-week Check ★
  - 数据中期 review
  - 调整发布频次
  - 决定周末是否冲刺

Day 5 (周六) Engage + Test
  - 试新内容类型
  - 回复深度评论
  
Day 6 (周日) Synthesize + Retro
  - 周复盘准备
  - 触发 /lumilab review

Day 7 (下周一) Decide
  - 看复盘结论
  - 决定继续 / 调整 / 放弃
  - 启动下一周 SOP（如果继续）
```

## 每日 brief（自包含，Cold-start 友好）

每天的 brief 都是**独立的**，下一个会话不读历史也能干。

格式：

```markdown
## Day {N} ({weekday}) — {phase}

### 昨日产出
- {platform_1}: {data_point}
- {platform_2}: {data_point}

### 距离阈值
- {metric_1}: {current} / {target} ({percent}%)
- {metric_2}: ...

### 今日任务
- [ ] 发布 {platform} 内容 #{N}（hook: {variant}）
- [ ] 回复 {N} 条评论 / 私信
- [ ] 收集邮件订阅数据
- [ ] 记录 metrics 到 validation_metrics.csv

### 今日决策点
- {decision_required_if_any} → 提示用户选

### 数据回收方式
{具体怎么记/在哪记}

### 如有空闲
{additional_low_priority_tasks}
```

## 发布日历

`content_calendar.md`：

```markdown
# Content Calendar - {venture}

| Day | Time | Platform | Content | Hook Variant | Status |
|---|---|---|---|---|---|
| 0 (Mon) | 09:00 | XHS | xhs.md #1 | "3 步" | ☐ |
| 0 (Mon) | 19:30 | 公众号 | wechat.html | "为什么..." | ☐ |
| 0 (Mon) | 22:00 | X | x.md #1 | "Stop using..." | ☐ |
| 1 (Tue) | 09:00 | XHS | xhs.md #2 | "对比" | ☐ |
| 1 (Tue) | 21:00 | 朋友圈 | moments.md #1 | personal | ☐ |
| ...
| 6 (Sun) | 19:00 | 全平台总结 | retro post | - | ☐ |
```

**发布时间建议**（基于平台 know-how）：
- XHS：9:00 / 12:00 / 19:00（黄金三段）
- 公众号：19:00-22:00（订阅号最高打开）
- 抖音：20:00-22:00（晚高峰）
- X：8-10 AM EDT = 中国 20-22:00 双高峰
- 朋友圈：12:00-13:00 / 21:00（午休 / 睡前）

## 数据回收表

`validation_metrics.csv`：

```csv
date,platform,metric,value,target,notes
2026-05-13,xhs,likes,412,500,首日测试图 #1
2026-05-13,xhs,comments,23,30,评论中 7 条提到价格
2026-05-13,xhs,private_msg,7,10,3 条问报价
2026-05-13,wechat,views,1850,2000,
2026-05-13,wechat,reads_in_看,32,50,
2026-05-13,email,subscribes,12,15,
2026-05-13,landing,visits,234,200,
2026-05-13,landing,email_capture_rate,0.05,0.15,弱信号
2026-05-13,landing,pay_click_rate,0.023,0.05,弱信号
```

格式说明：
- 一行一个 metric
- value 当前，target 目标
- notes 解释 / observed_pattern

## 决策阈值表

`decision_thresholds.md`：

```markdown
| 指标 | 阈值 | 决策 |
|---|---|---|
| 小红书点赞 ≥ 500 + 询价 ≥ 5 | 强信号 | 继续这个 hook |
| 邮件收集率 > 15% | 强 | 继续优化 funnel |
| 邮件收集率 8-15% | 中 | 改 CTA 文案再测 1 轮 |
| 邮件收集率 < 8% | 弱 | 重做 hero（不要继续优化文案） |
| 付款意向点击 > 5% | 强 PMF 信号 | 进 Day 8 做真产品 |
| 评论里负面 > 40% | 警告 | h-X 失败，进 pivot |
| 7 日总曝光 < 1000 | 弱 | 渠道选错，pivot 渠道 |
```

来源：wshobson-startup-metrics-framework + Pirate Metrics (AARRR) + 用户实际目标。

## paperclip Routines 注册（P0 结构，P1 启用）

P0：注册 7 条 routine 到 `~/.lumilab/routines.json`（不真跑 cron）

```json
{
  "routines": [
    {
      "id": "{venture}-day-1-brief",
      "schedule": "0 9 * * 2",
      "task": "show-daily-brief",
      "venture": "{venture}",
      "day": 1,
      "concurrencyPolicy": "coalesce_if_active",
      "catchUpPolicy": "skip_missed",
      "enabled": false   // P0 false, P1 true
    },
    ...
  ]
}
```

P1：启用真 cron，每天到点 push 通知给用户。

## 跨 runtime user-input 协议

```yaml
user_input:
  - mode: terminal
    method: "AskUserQuestion (确认 launch + 选时间)"
  - mode: browser
    method: "studio/decisions/07-confirm-launch.html (审阅 7 天日历)"
```

## 必做约束

```
✓ 每个 Day brief 自包含（不依赖前一天对话）
✓ 发布日历严格遵守平台时间窗
✓ 不替用户按发布键（永远 manual confirm）
✓ 决策阈值表基于 metrics.md，不凭感觉
✓ paperclip routines P0 disabled（避免误触发）
✓ 数据回收方式具体（在哪记、怎么记）
```

## Anti-Slop

❌ Day brief 写「努力做内容」「保持节奏」（空话）
❌ 决策阈值写「适度优化」「持续观察」（无具体动作）
❌ 发布时间写「白天发」（不具体）
❌ 数据回收写「记一下数据」（在哪记？）

✅ Day brief 每一项都是 1 个可勾选 todo
✅ 阈值写具体数字 + 具体决策
✅ 发布时间精确到分钟
✅ 数据回收指向具体表格的具体列

## 引用

- 上游：见 metadata.upstream
- 配套：lumilab-content-repurpose（内容来源）
- 配套：lumilab-hypothesis-ledger（验证什么）
- 配套：lumilab-metrics（指标定义）

## Weekly Retro 交互页（M5）

```bash
bun run scripts/weekly-retro.ts <venture-dir>
# → http://127.0.0.1:7779/  四桶填写表（强信号 / 中信号 / 弱信号 / 已迭代）
# → 保存：data/ventures/<v>/research/retro-<ISO>.yaml
```

YAML schema：

```yaml
venture: my-venture
day: "Day 7 / 7"
next_direction: "放大「找模板」假设"
key_decision: "persevere（继续验证）"
strong:   ["...", "..."]
mid:      ["..."]
weak:     ["..."]
iterated: ["..."]
created_at: 2026-05-14T...
```

后续 `coach` / `hypothesis-ledger` 可读这份 YAML 做 supersede 判断。

## Chat-only fallback (LUMILAB_CHANNEL != local)

脚本检测到 `LUMILAB_CHANNEL` 非 `local` 时不开浏览器，改为打印四桶结构化模板到 stdout，agent 在 chat 内引导用户逐桶贴：

```
## 强信号（放大）
- ...
## 中信号（观察）
- ...
## 弱信号（噪音但记录）
- ...
## 已迭代（本周已动手）
- ...
```

agent 收齐后调 `keychain.ts` 风格的写文件 helper 落 YAML，与浏览器路径产出一致。

## Dependencies

| 依赖 | 类型 | 是否付费 | 说明 |
|---|---|---|---|
| bun | CLI runtime | 免费 | ≥1.0，必需 |
| host LLM | 由 Claude Code / OpenClaw / Cursor / Hermes 提供 | 取决于宿主 | Lumi Lab 本身不直连 LLM，复用宿主 |

## Outputs

`data/ventures/<slug>/sop_day_<n>.md`（Day 0–7）· `data/ventures/<slug>/research/retro-<ISO>.yaml`（周复盘）

## Example

`lumilab retro <venture>` → 浏览器四桶填写 → YAML 落地；chat 模式打印结构化模板。

## Tests

`tests/smoke.md` — 该 skill 的最小冒烟测试约定：让 host LLM 在对话中跑通 SKILL.md「真实示例」段即视为通过。E2E 真集成见 `docs/TUTORIAL.zh.md`。
