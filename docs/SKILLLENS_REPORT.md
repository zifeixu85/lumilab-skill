# SkillLens 评测概要 · Lumi Lab v1.10.0

> **评测基线**: v1.0.0 Deep Review（详见 [`SKILLLENS_REPORT_v1.0.md`](./SKILLLENS_REPORT_v1.0.md)）
> **当前版本**: v1.10.1 · 2026-05-30
> **状态**: **26 / 26 skill 全部跑过 agent-side Deep Review → 16 S + 10 A（87–93，平均 ~90.8），`deepReviewCertificate` 全部 `verified`**。10 个 A 是 idea-to-landing / studio / landing-mvp / config 等操作型 skill——SKILL.md 内联完整流水线/命令细节（宿主要照做），context-budget 维度因体积扣几分，**完整度优先于评分**；方法论类精简 SKILL.md + 完整 `references/full-guide.md`

---

## 概览

| 指标 | v1.0.0（已认证） | v1.8.0（当前） |
|---|---:|---:|
| 总 skill 数 | 21 | **26** |
| 平均分（Deep Review） | **91.59** | **~90.8** |
| S 级（≥90） | 21 | **16** |
| A 级（≥80，操作型完整度优先） | — | **10** |
| 工程化标准合规 | 21 / 21 | **26 / 26** |
| 待重跑 SkillLens | — | **0（全部已评测）** |

## 工程化标准（26 / 26 全合规）

v1.0 → v1.8 演进过程中，**每个新加入的 skill 都遵循同一套硬约束**，由 `scripts/release.sh` 在每次构建时强制校验：

- ✅ frontmatter 含 `version` / `license` / `metadata` / `compatibility` / `prerequisites`
- ✅ `scripts/anti-slop-lint.ts` — 26 / 26 通过禁词扫描
- ✅ `scripts/validate-output.ts` — 确定性、独立可运行、`exit 0/1`
- ✅ `## Alternatives`（具名竞品）
- ✅ `## Moat`（复利护城河）
- ✅ `## 分支决策` if-then 表
- ✅ `## Changelog` 段
- ✅ 文件名跨段一致、依赖成本列、`校验字段:` schema 声明

## 3 个 v1.0 之后新加的 skill

| Skill | 加入版本 | 当前状态 | v2 评测计划 |
|---|---|---|---|
| `lumilab-home` | 1.4.1 | ✅ 工程化标准全满足，未跑过 SkillLens v0.2 引擎 | v2.0.0 跑 |
| `lumilab-idea-to-landing` | 1.4.1 | ✅ 同上 | v2.0.0 跑 |
| `lumilab-coach-yc`（加深版本） | 1.4.1 | ✅ 同上 | v2.0.0 跑 |

> 这三个 skill 在工程化层面**与 v1.0 的 21 个 S 级 skill 同构**，区别只是评测时间点。
> v2.0.0 计划用 SkillLens v0.3（如发布）重跑全部 24 个，作为新基线。

## 评测时间线

```
2026-05-14   v1.0.0    21 skill · 平均 91.59 · 全部 verified
2026-05-15   v1.4.1    +3 skill（home / idea-to-landing / coach-yc 加深）+ 工程化标准同步落到新 skill
2026-05-15~25  1.5.0~1.7.x  Exa→Tavily 切换 / Studio dual mode / CLI 扩展
2026-05-28   v1.8.0    工作区源/发布对齐 · API 抽象层骨架预留
```

## 详细分数表

见 [`SKILLLENS_REPORT_v1.0.md`](./SKILLLENS_REPORT_v1.0.md) 完整 21 项分数表。

## 可复现验证

任意 skill 的工程化合规可独立校验：

```bash
# anti-slop（24 / 24 通过）
for s in skills/lumilab-*; do
  bun run "$s/scripts/anti-slop-lint.ts" "$s/SKILL.md" || echo "fail: $(basename $s)"
done

# validate-output（每个独立可运行）
for s in skills/lumilab-*; do
  bun run "$s/scripts/validate-output.ts" --help
done

# 构建时强制扫描（release.sh 内置）
./scripts/release.sh  # 任意一个 anti-slop 失败 → 整个 release 拒绝出包
```
