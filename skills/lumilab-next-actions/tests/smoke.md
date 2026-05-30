# lumilab-next-actions · smoke test

确定性骨架的最小验证。前提：一个已有 `market_analysis.json` + `hypotheses.yaml` 的 venture（demo 即可）。

```bash
# 1) 生成 next-actions.json
bun run scripts/next-actions.ts generate ~/.lumilab/data/ventures/lumilab-meta

# 2) 校验 schema（columns / tasks / signals / mindmap）
bun run scripts/validate-output.ts ~/.lumilab/data/ventures/lumilab-meta
#   期望：✓ next-actions output valid (...)

# 3) anti-slop 干净
bun run scripts/anti-slop-lint.ts ~/.lumilab/data/ventures/lumilab-meta/studio/next-actions.json
#   期望：✓ anti-slop clean
```

期望产物 `studio/next-actions.json`：

- `columns` = 待验证 / 进行中 / 已学到 三列
- `tasks` 至少 3 条，每条有 id / column / title / priority / source
- `mindmap_md` 含「## 强信号 / ## 待验证 / ## 已学到」
- 任何 tier=C 的 `source_signals` 解读里带「经验基线，以自测为准」

呈现（看板 + 脑图 + 打印）在 lumilab-studio 复盘阶段验证：

```bash
lumilab serve start
lumilab studio lumilab-meta     # 复盘阶段 → 「下一步」→ 看板可拖拽、脑图渲染、🖨 可打印
```
