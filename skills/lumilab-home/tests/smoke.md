# Smoke test · lumilab-home

# 该 skill 的最小冒烟测试由 host LLM 在对话中跑通即可。
# 真集成测试见 docs/TUTORIAL.zh.md。

# 当 skill 含 scripts/ 时，建议在每个脚本顶部加 `bun test` 或手动 dry-run。


## 验证步骤

1. host LLM 加载 SKILL.md
2. `home.ts status` 输出合法 JSON（无 config 时 onboarded=false，不崩）
3. onboarded 后 `home.ts render` 生成 `data/_home/home.html`
4. `validate-output.ts <data-dir>` 退出 0（含「工具」「venture」「下一步」三个区块）
5. 输出过 `反 Slop 自检`（OKLCH only，无 Inter/Roboto/Arial、无 #000/#fff、无 purple gradient）

## 通过条件

- [ ] SKILL.md frontmatter 校验通过（agentskills.io v1）
- [ ] `home.ts status` 输出合法 JSON
- [ ] `home.ts render` 生成 `_home/home.html` 且过 `validate-output.ts`
- [ ] 反 Slop 自检通过（`anti-slop-lint.ts skills/lumilab-home/` 退出 0）
- [ ] chat-only fallback 路径可达（`LUMILAB_CHANNEL=feishu bun run scripts/home.ts render` 只打印路径不开浏览器）
