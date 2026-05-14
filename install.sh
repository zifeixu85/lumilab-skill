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

# 检查 bun（CLI + skill 脚本必需）；缺失时自动安装
ensure_bun() {
  if command -v bun >/dev/null 2>&1; then return 0; fi
  # bun 可能已装但不在当前 PATH（~/.bun/bin）
  if [[ -x "${HOME}/.bun/bin/bun" ]]; then
    export PATH="${HOME}/.bun/bin:${PATH}"
    command -v bun >/dev/null 2>&1 && return 0
  fi
  echo "⚙ 未找到 bun，正在自动安装（~/.bun/，无需 root，约 30 秒）…"
  if ! command -v curl >/dev/null 2>&1; then
    echo "✗ 需要 curl 来安装 bun。请先装 curl，或手动安装 bun：https://bun.sh" >&2
    exit 1
  fi
  if [[ $ASSUME_YES -ne 1 ]]; then
    read -r -p "  执行 curl -fsSL https://bun.sh/install | bash ？[Y/n] " ans
    case "$ans" in [nN]*) echo "已取消。手动安装后重跑本脚本。"; exit 1 ;; esac
  fi
  curl -fsSL https://bun.sh/install | bash || {
    echo "✗ bun 自动安装失败。请手动安装：https://bun.sh" >&2
    exit 1
  }
  export PATH="${HOME}/.bun/bin:${PATH}"
  if ! command -v bun >/dev/null 2>&1; then
    echo "✗ bun 安装后仍不可用。把 ~/.bun/bin 加入 PATH 后重试。" >&2
    exit 1
  fi
  echo "✓ bun 已安装"
}
ensure_bun
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

# 把 CLI launcher 复制到稳定位置，不依赖 repo 目录（repo 可能在 /tmp 被清理）
LAUNCHER="$SCRIPT_DIR/scripts/lumilab"
STABLE_BIN="${HOME}/.lumilab/bin"
STABLE_LAUNCHER="$STABLE_BIN/lumilab"
if [[ -f "$LAUNCHER" ]]; then
  mkdir -p "$STABLE_BIN"
  cp "$LAUNCHER" "$STABLE_LAUNCHER"
  chmod +x "$STABLE_LAUNCHER"
  # CLI 会自动探测 skills 目录（已装的 ~/.claude/skills/）；
  # venture / home 数据统一在 ~/.lumilab/data/。不依赖 repo 位置。
fi

# 状态目录
mkdir -p "${HOME}/.lumilab"
chmod 700 "${HOME}/.lumilab" 2>/dev/null || true
echo "✓ 状态目录就绪：~/.lumilab/"
[[ -f "$STABLE_LAUNCHER" ]] && echo "✓ CLI 已装到稳定位置：$STABLE_LAUNCHER"

echo
echo "──────────────────────────────────────────────"
echo "  ✓ Lumi Lab 安装完成 · 23+ skill 已就位"
echo "──────────────────────────────────────────────"
echo
echo "  ▶ 入口（推荐）：在你的 AI 宿主里直接说一句"
echo "      「打开 lumilab」              → 首次会引导你配置，之后看 home dashboard"
echo "      「用 lumilab 验证这个想法：<你的一句话 idea>」  → 直接跑验证流水线"
echo
echo "  ▶ 或用 CLI："
if [[ -f "$STABLE_LAUNCHER" ]]; then
echo "      $STABLE_LAUNCHER            # 门面：首次引导 / home dashboard"
echo "      $STABLE_LAUNCHER idea \"你的想法\""
echo "    把它加进 PATH 更顺手："
echo "      ln -sf \"$STABLE_LAUNCHER\" /usr/local/bin/lumilab"
else
echo "      $LAUNCHER"
fi
echo
echo "  首次建议先跑一遍引导（选界面风格 / 可选工具 token，全部可跳过）："
echo "    说「打开 lumilab」，或 CLI 跑 \`lumilab config\`"
echo "──────────────────────────────────────────────"
