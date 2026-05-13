#!/usr/bin/env bash
# Lumi Lab · 安装 skills bundle 到 ~/.claude/skills/
#
# 用法：
#   ./install.sh                   # 交互模式
#   ./install.sh --yes             # 非交互（不提问）
#   ./install.sh --target DIR      # 自定义安装目录（默认 ~/.claude/skills）

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_DIR="$SCRIPT_DIR/skills"
TARGET_DIR="${HOME}/.claude/skills"
ASSUME_YES=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --yes|-y) ASSUME_YES=1; shift ;;
    --target) TARGET_DIR="$2"; shift 2 ;;
    -h|--help)
      grep -E "^# " "$0" | sed 's/^# \?//'
      exit 0
      ;;
    *) echo "未知参数：$1" >&2; exit 2 ;;
  esac
done

VERSION="$(cat "$SCRIPT_DIR/VERSION" 2>/dev/null || echo "?")"

echo "──────────────────────────────────────────────"
echo "  Lumi Lab v${VERSION} · skills bundle · 安装器"
echo "──────────────────────────────────────────────"
echo "  来源：$SOURCE_DIR"
echo "  目标：$TARGET_DIR"
echo

if [[ ! -d "$SOURCE_DIR" ]]; then
  echo "✗ skills/ 目录不存在：$SOURCE_DIR" >&2
  exit 1
fi

# 检查 bun（CLI + skill 脚本必需）
if ! command -v bun >/dev/null 2>&1; then
  echo "✗ 未找到 bun。请先安装：curl -fsSL https://bun.sh/install | bash" >&2
  exit 1
fi
BUN_VER=$(bun --version)
echo "✓ bun ${BUN_VER}"

# 可选：wrangler 用于部署（仅警告）
if ! command -v wrangler >/dev/null 2>&1; then
  echo "⚠ 未安装 wrangler — \`lumilab deploy\` 暂时不能用。需要时执行："
  echo "    npm install -g wrangler"
fi

mkdir -p "$TARGET_DIR"

# 统计将要安装的 skill 数
SKILL_COUNT=$(find "$SOURCE_DIR" -mindepth 1 -maxdepth 1 -type d | wc -l | tr -d ' ')
echo "  将安装 ${SKILL_COUNT} 个 skill："
for d in "$SOURCE_DIR"/*/; do
  name=$(basename "$d")
  status="新增"
  if [[ -d "$TARGET_DIR/$name" ]]; then
    status="\033[33m覆盖\033[0m"
  fi
  printf "    · %-32s [%b]\n" "$name" "$status"
done
echo

if [[ $ASSUME_YES -ne 1 ]]; then
  read -r -p "继续？[y/N] " ans
  case "$ans" in [yY]*) ;; *) echo "已取消。"; exit 0 ;; esac
fi

# 优先用 rsync，没有就 cp
if command -v rsync >/dev/null 2>&1; then
  rsync -a --delete \
    --exclude='__pycache__' --exclude='*.pyc' --exclude='.DS_Store' \
    --exclude='node_modules' --exclude='bun.lock' \
    --exclude='_RESULT.md' --exclude='_MANAGE_RESULT.md' \
    "$SOURCE_DIR/" "$TARGET_DIR/"
else
  for d in "$SOURCE_DIR"/*/; do
    name=$(basename "$d")
    rm -rf "$TARGET_DIR/$name"
    cp -R "$d" "$TARGET_DIR/$name"
    find "$TARGET_DIR/$name" -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
    find "$TARGET_DIR/$name" -name "node_modules" -type d -exec rm -rf {} + 2>/dev/null || true
    rm -f "$TARGET_DIR/$name/_RESULT.md" "$TARGET_DIR/$name/_MANAGE_RESULT.md" 2>/dev/null || true
  done
fi
echo "✓ skills 已复制到 $TARGET_DIR"

# 提示 CLI 入口位置
LAUNCHER="$SCRIPT_DIR/scripts/lumilab"
if [[ -x "$LAUNCHER" ]]; then
  echo
  echo "  CLI 位置：$LAUNCHER"
  echo "  在任意目录使用，可创建符号链接到 PATH："
  echo "      ln -sf \"$LAUNCHER\" /usr/local/bin/lumilab"
fi

# 状态目录
mkdir -p "${HOME}/.lumilab"
chmod 700 "${HOME}/.lumilab" 2>/dev/null || true
echo "✓ 状态目录就绪：~/.lumilab/"

echo
echo "──────────────────────────────────────────────"
echo "  ✓ Lumi Lab 安装完成。"
echo
echo "  下一步："
echo "    1) 配置（可选）："
echo "         $LAUNCHER config"
echo "    2) 看自指 demo："
echo "         $LAUNCHER list"
echo "         $LAUNCHER studio lumilab-meta"
echo "    3) 新建你自己的 venture（然后回到你的 AI 宿主里用）："
echo "         $LAUNCHER new \"你的想法\""
echo
echo "  在 Claude Code / OpenClaw / Cursor 中，对话式调用 skill："
echo "    「用 lumilab-founder-coach 第 1 层（方法论模式）帮我澄清这个 idea」"
echo "──────────────────────────────────────────────"
