#!/usr/bin/env bash
# Lumi Lab · 安装 / 升级 skills bundle 到 ~/.claude/skills/
#
# 用法：
#   ./install.sh                   # 交互模式（全新装 / 升级自动判断）
#   ./install.sh --yes             # 非交互（curl|bash 远程安装走这个）
#   ./install.sh --target DIR      # 自定义 skills 安装目录（默认 ~/.claude/skills）
#   ./install.sh --no-bun          # 不自动装 bun（缺了只警告）
#
# 设计保证：
#   · 只写 ~/.claude/skills/lumilab-* 和 ~/.lumilab/bin/lumilab
#   · 绝不动用户数据：~/.lumilab/data/（venture）/ secrets.json / config.json / .env 全部保留
#   · 升级时自动备份旧 skills 到 ~/.lumilab/backups/，可回滚
#   · 不删除 ~/.claude/skills/ 下别人的其它 skill

set -euo pipefail

# ── 参数 ──
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_DIR="$SCRIPT_DIR/skills"
TARGET_DIR="${HOME}/.claude/skills"
LUMILAB_HOME="${LUMILAB_HOME:-${HOME}/.lumilab}"
ASSUME_YES=0
AUTO_BUN=1

while [[ $# -gt 0 ]]; do
  case "$1" in
    --yes|-y) ASSUME_YES=1; shift ;;
    --target) TARGET_DIR="$2"; shift 2 ;;
    --no-bun) AUTO_BUN=0; shift ;;
    -h|--help) grep -E "^# " "$0" | sed 's/^# \?//'; exit 0 ;;
    *) echo "未知参数：$1" >&2; exit 2 ;;
  esac
done

NEW_VERSION="$(cat "$SCRIPT_DIR/VERSION" 2>/dev/null | tr -d '\n' || echo "?")"
INSTALLED_MARK="$LUMILAB_HOME/.installed-version"

c_dim()  { printf "\033[2m%s\033[0m\n" "$1"; }
c_warn() { printf "\033[33m%s\033[0m\n" "$1"; }
c_err()  { printf "\033[31m%s\033[0m\n" "$1" >&2; }
c_ok()   { printf "\033[32m%s\033[0m\n" "$1"; }

echo "──────────────────────────────────────────────"
echo "  Lumi Lab v${NEW_VERSION} · 安装 / 升级"
echo "──────────────────────────────────────────────"

# ── 1. 环境检测：OS ──
OS="$(uname -s 2>/dev/null || echo unknown)"
case "$OS" in
  Darwin) c_dim "  系统：macOS" ;;
  Linux)
    if grep -qiE "microsoft|wsl" /proc/version 2>/dev/null; then c_dim "  系统：Linux (WSL)"; else c_dim "  系统：Linux"; fi ;;
  *)
    c_err "✗ 不支持的系统：$OS"
    c_err "  Lumi Lab 需要 macOS 或 Linux。Windows 用户请在 WSL 里安装。"
    exit 1 ;;
esac

if [[ ! -d "$SOURCE_DIR" ]]; then
  c_err "✗ skills/ 源目录不存在：${SOURCE_DIR}（bundle 不完整？）"
  exit 1
fi

# ── 2. 已装版本检测 → 全新 / 升级 / 重装 / 降级 ──
MODE="fresh"; OLD_VERSION=""
if [[ -f "$INSTALLED_MARK" ]]; then
  OLD_VERSION="$(cat "$INSTALLED_MARK" 2>/dev/null | tr -d '\n')"
elif [[ -d "$TARGET_DIR/lumilab-home" || -f "$LUMILAB_HOME/bin/lumilab" ]]; then
  OLD_VERSION="unknown"   # 装过但没版本标记（旧安装器）
fi

# 语义版本比较：返回 0 相等 / 1 第一个大 / 2 第二个大
ver_cmp() {
  [[ "$1" == "$2" ]] && return 0
  local IFS=.; local a=($1) b=($2); local i
  for ((i=0; i<${#a[@]} || i<${#b[@]}; i++)); do
    local ai=${a[i]:-0} bi=${b[i]:-0}
    ((10#${ai//[^0-9]/0} > 10#${bi//[^0-9]/0})) && return 1
    ((10#${ai//[^0-9]/0} < 10#${bi//[^0-9]/0})) && return 2
  done
  return 0
}

if [[ -n "$OLD_VERSION" ]]; then
  if [[ "$OLD_VERSION" == "unknown" ]]; then
    MODE="upgrade"; c_warn "  检测到已安装的 Lumi Lab（旧版本，无版本标记）→ 升级到 v${NEW_VERSION}"
  else
    set +e; ver_cmp "$NEW_VERSION" "$OLD_VERSION"; CMP=$?; set -e
    case $CMP in
      0) MODE="reinstall"; c_dim "  已是 v${OLD_VERSION}（最新）→ 重装 / 修复" ;;
      1) MODE="upgrade";   c_ok  "  升级：v${OLD_VERSION} → v${NEW_VERSION}" ;;
      2) MODE="downgrade"; c_warn "  ⚠ 你装的是更新的 v${OLD_VERSION}，这是 v${NEW_VERSION}（降级）" ;;
    esac
  fi
  echo "  ✓ 你的本地数据会完整保留：venture / secrets.json / config.json / .env 都不动"
else
  c_dim "  全新安装"
fi
echo "  目标：$TARGET_DIR"
echo

# ── 3. bun（CLI + skill 脚本必需）──
ensure_bun() {
  if command -v bun >/dev/null 2>&1; then return 0; fi
  if [[ -x "${HOME}/.bun/bin/bun" ]]; then export PATH="${HOME}/.bun/bin:${PATH}"; command -v bun >/dev/null 2>&1 && return 0; fi
  if [[ $AUTO_BUN -ne 1 ]]; then c_warn "⚠ 未找到 bun（--no-bun 已设）。skill 脚本不能跑，纯方法论对话不受影响。"; return 0; fi
  if ! command -v curl >/dev/null 2>&1; then c_err "✗ 需要 curl 装 bun。请先装 curl 或手动装 bun：https://bun.sh"; exit 1; fi
  echo "⚙ 未找到 bun，自动安装到 ~/.bun/（无需 root，约 30 秒）…"
  if [[ $ASSUME_YES -ne 1 ]]; then
    read -r -p "  执行 curl -fsSL https://bun.sh/install | bash ？[Y/n] " ans
    case "$ans" in [nN]*) c_err "已取消。手动装 bun 后重跑。"; exit 1 ;; esac
  fi
  curl -fsSL https://bun.sh/install | bash || { c_err "✗ bun 自动安装失败：https://bun.sh"; exit 1; }
  export PATH="${HOME}/.bun/bin:${PATH}"
  command -v bun >/dev/null 2>&1 || { c_err "✗ bun 装后不可用，把 ~/.bun/bin 加进 PATH 后重试。"; exit 1; }
  c_ok "✓ bun 已安装"
}
ensure_bun
if command -v bun >/dev/null 2>&1; then echo "✓ bun $(bun --version)"; fi

# 可选工具：只警告不阻塞
command -v wrangler >/dev/null 2>&1 || c_warn "⚠ 未装 wrangler — \`lumilab deploy\` 需要它（用时：npm i -g wrangler）"
command -v qrencode >/dev/null 2>&1 || c_dim  "  （可选）未装 qrencode — 部署二维码 PNG 会跳过；Share Manager 内置二维码不受影响"

# ── 4. 检测已装的 agent 宿主 → 装到每一个的 skills 目录 ──
# SKILL.md 是跨 agent 开放标准，同一份文件各家通用。
#   Claude Code ~/.claude/skills · OpenClaw ~/.openclaw/skills
#   Codex ~/.codex/skills · Gemini CLI ~/.gemini/skills
#   Cursor 仅项目级 .cursor/skills（无全局，末尾给指引）
declare -a TARGETS=()
declare -a HOSTLABELS=()
add_target() { TARGETS+=("$1"); HOSTLABELS+=("$2"); }

if [[ "$TARGET_DIR" != "${HOME}/.claude/skills" ]]; then
  # 用户用 --target 显式指定 → 只装这一个
  add_target "$TARGET_DIR" "custom"
else
  add_target "${HOME}/.claude/skills" "Claude Code"   # 主目标（CLI 默认探测这里），始终装
  detect() { # $1=配置目录 $2=可执行名 $3=label $4=skills目录
    if [[ -d "$HOME/$1" ]] || command -v "$2" >/dev/null 2>&1; then add_target "$HOME/$4" "$3"; fi
  }
  detect ".openclaw" "openclaw" "OpenClaw"   ".openclaw/skills"
  detect ".codex"    "codex"    "Codex CLI"  ".codex/skills"
  detect ".gemini"   "gemini"   "Gemini CLI" ".gemini/skills"
fi

# ── 预览 ──
SKILL_COUNT=$(find "$SOURCE_DIR" -mindepth 1 -maxdepth 1 -type d | wc -l | tr -d ' ')
echo "  将安装 ${SKILL_COUNT} 个 skill 到 ${#TARGETS[@]} 个 agent 宿主："
for i in "${!TARGETS[@]}"; do printf "    · %-12s %s\n" "${HOSTLABELS[$i]}" "${TARGETS[$i]}"; done
if [[ $ASSUME_YES -ne 1 ]]; then
  read -r -p "继续？[Y/n] " ans
  case "$ans" in [nN]*) echo "已取消。"; exit 0 ;; esac
fi

# ── 5. 升级前备份旧 skills（可回滚）──
mkdir -p "$LUMILAB_HOME"; chmod 700 "$LUMILAB_HOME" 2>/dev/null || true
if [[ "$MODE" == "upgrade" || "$MODE" == "downgrade" ]]; then
  BACKUP_DIR="$LUMILAB_HOME/backups/skills-${OLD_VERSION}"
  if [[ ! -d "$BACKUP_DIR" ]]; then
    mkdir -p "$BACKUP_DIR"
    for d in "$TARGET_DIR"/lumilab-*/; do
      [[ -d "$d" ]] && cp -R "$d" "$BACKUP_DIR/" 2>/dev/null || true
    done
    c_dim "  已备份旧 skills → ${BACKUP_DIR}（可回滚）"
  fi
fi

# ── 6. 逐个 skill 复制到每个目标宿主（绝不 --delete，不碰用户其它 skill）──
copy_one() { # $1=源 skill 目录  $2=目标 skills 根
  local d="$1" root="$2"; local name dest
  name=$(basename "$d"); dest="$root/$name"; rm -rf "$dest"
  if command -v rsync >/dev/null 2>&1; then
    rsync -a --exclude='__pycache__' --exclude='*.pyc' --exclude='.DS_Store' \
      --exclude='node_modules' --exclude='bun.lock' \
      --exclude='_RESULT.md' --exclude='_MANAGE_RESULT.md' "$d" "$dest/"
  else
    cp -R "$d" "$dest"
    find "$dest" -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
    find "$dest" -name "node_modules" -type d -exec rm -rf {} + 2>/dev/null || true
    rm -f "$dest/_RESULT.md" "$dest/_MANAGE_RESULT.md" 2>/dev/null || true
  fi
}
COPIED=0
for i in "${!TARGETS[@]}"; do
  root="${TARGETS[$i]}"; mkdir -p "$root"; n=0
  for d in "$SOURCE_DIR"/lumilab-*/; do [[ -d "$d" ]] || continue; copy_one "$d" "$root"; n=$((n+1)); done
  c_ok "✓ ${n} 个 skill → ${HOSTLABELS[$i]}（${root}）"
  COPIED=$n
done

# ── 7. demo 模板 + CLI launcher 到稳定位置 ──
[[ -d "$SCRIPT_DIR/demo" ]] && { mkdir -p "$LUMILAB_HOME/demo"; cp -R "$SCRIPT_DIR/demo/." "$LUMILAB_HOME/demo/" 2>/dev/null || true; }

STABLE_BIN="$LUMILAB_HOME/bin"; STABLE_LAUNCHER="$STABLE_BIN/lumilab"
if [[ -f "$SCRIPT_DIR/scripts/lumilab" ]]; then
  mkdir -p "$STABLE_BIN"; cp "$SCRIPT_DIR/scripts/lumilab" "$STABLE_LAUNCHER"; chmod +x "$STABLE_LAUNCHER"
fi

# 尽力把 lumilab 加进 PATH（best-effort，失败不报错）
LINKED=""
for bindir in "/usr/local/bin" "${HOME}/.local/bin"; do
  if [[ -d "$bindir" && -w "$bindir" && -f "$STABLE_LAUNCHER" ]]; then
    ln -sf "$STABLE_LAUNCHER" "$bindir/lumilab" 2>/dev/null && { LINKED="$bindir/lumilab"; break; }
  fi
done

# ── 8. 写版本标记（数据目录本身不动）──
echo "$NEW_VERSION" > "$INSTALLED_MARK"
echo "✓ 状态目录：$LUMILAB_HOME/（数据保留）"

# ── 9. 完成 ──
echo
echo "──────────────────────────────────────────────"
HOSTS_JOINED="$(IFS=、; echo "${HOSTLABELS[*]}")"
case "$MODE" in
  fresh)     c_ok "  ✓ Lumi Lab v${NEW_VERSION} 安装完成 · ${COPIED} 个 skill" ;;
  upgrade)   c_ok "  ✓ 升级完成：v${OLD_VERSION} → v${NEW_VERSION} · 数据已保留" ;;
  reinstall) c_ok "  ✓ 重装完成 v${NEW_VERSION} · ${COPIED} 个 skill" ;;
  downgrade) c_ok "  ✓ 已切到 v${NEW_VERSION} · 数据已保留" ;;
esac
echo "  已装到宿主：${HOSTS_JOINED}"
echo "──────────────────────────────────────────────"
echo
echo "  ▶ 在 AI 宿主里说：「打开 lumilab」 或 「用 lumilab 验证：<你的一句话 idea>」"
if [[ -n "$LINKED" ]]; then
  echo "  ▶ CLI：lumilab            （已加入 PATH：${LINKED}）"
else
  echo "  ▶ CLI：$STABLE_LAUNCHER"
  echo "    加进 PATH：ln -sf \"$STABLE_LAUNCHER\" /usr/local/bin/lumilab"
fi
[[ "$MODE" == "upgrade" || "$MODE" == "downgrade" ]] && echo "  ▶ 回滚：旧版 skills 备份在 $LUMILAB_HOME/backups/"
echo "  ▶ Cursor（仅项目级）：在项目根目录跑"
echo "      mkdir -p .cursor/skills && cp -R \"\$HOME/.claude/skills/\"lumilab-* .cursor/skills/"
echo "──────────────────────────────────────────────"
