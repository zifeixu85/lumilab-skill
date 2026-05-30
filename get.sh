#!/usr/bin/env bash
# Lumi Lab · 一键安装引导（curl|bash 入口）
#
# 用法（终端一条命令）：
#   curl -fsSL https://get.lumiclaw.ai | bash
#
# 自定义（测试 / 私有镜像）：
#   LUMILAB_BASE_URL=https://你的镜像 curl -fsSL https://get.lumiclaw.ai | bash
#   LUMILAB_VERSION=1.10.2           curl -fsSL https://get.lumiclaw.ai | bash
#
# 它做什么：检测系统 → 下载版本化 tarball → 解包 → 跑里面的 install.sh --yes
# 不需要 git、不暴露源码仓库。用户数据（~/.lumilab/data 等）由 install.sh 保留。

set -euo pipefail

BASE_URL="${LUMILAB_BASE_URL:-https://get.lumiclaw.ai}"
REQ_VERSION="${LUMILAB_VERSION:-latest}"

c_err(){ printf "\033[31m%s\033[0m\n" "$1" >&2; }
c_ok(){ printf "\033[32m%s\033[0m\n" "$1"; }

echo "──────────────────────────────────────────────"
echo "  Lumi Lab · 一键安装"
echo "──────────────────────────────────────────────"

# 1. 系统检测
OS="$(uname -s 2>/dev/null || echo unknown)"
case "$OS" in
  Darwin|Linux) ;;
  *) c_err "✗ 不支持的系统：${OS}（需要 macOS 或 Linux；Windows 请用 WSL）"; exit 1 ;;
esac

# 2. 必备工具
for tool in curl tar; do
  command -v "$tool" >/dev/null 2>&1 || { c_err "✗ 缺少 ${tool}，请先安装后重试。"; exit 1; }
done

# 3. 解析版本
if [[ "$REQ_VERSION" == "latest" ]]; then
  REQ_VERSION="$(curl -fsSL "$BASE_URL/VERSION" 2>/dev/null | tr -d '\n' || true)"
  [[ -n "$REQ_VERSION" ]] || { c_err "✗ 无法获取最新版本号（$BASE_URL/VERSION）。检查网络或 LUMILAB_BASE_URL。"; exit 1; }
fi
TARBALL="lumilab-${REQ_VERSION}.tar.gz"
URL="$BASE_URL/$TARBALL"
echo "  版本：v${REQ_VERSION}"
echo "  来源：$URL"

# 4. 下载到临时目录（带清理）
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
echo "  下载中…"
if ! curl -fsSL "$URL" -o "$TMP/$TARBALL"; then
  c_err "✗ 下载失败：$URL"
  c_err "  确认版本存在，或设 LUMILAB_BASE_URL 指向可用镜像。"
  exit 1
fi

# 5. 校验（如果服务端提供 .sha256）
if curl -fsSL "$URL.sha256" -o "$TMP/$TARBALL.sha256" 2>/dev/null; then
  EXPECT="$(awk '{print $1}' "$TMP/$TARBALL.sha256")"
  if command -v shasum >/dev/null 2>&1; then ACTUAL="$(shasum -a 256 "$TMP/$TARBALL" | awk '{print $1}')";
  elif command -v sha256sum >/dev/null 2>&1; then ACTUAL="$(sha256sum "$TMP/$TARBALL" | awk '{print $1}')"; else ACTUAL=""; fi
  if [[ -n "$ACTUAL" && -n "$EXPECT" && "$ACTUAL" != "$EXPECT" ]]; then
    c_err "✗ 校验失败（sha256 不匹配）。下载可能损坏或被篡改，已中止。"; exit 1
  fi
  [[ -n "$ACTUAL" ]] && c_ok "  ✓ 校验通过"
fi

# 6. 解包
echo "  解包中…"
tar -xzf "$TMP/$TARBALL" -C "$TMP" || { c_err "✗ 解包失败（tarball 损坏？）"; exit 1; }
PKG_DIR="$(find "$TMP" -maxdepth 2 -name install.sh -type f | head -1 | xargs dirname 2>/dev/null || true)"
[[ -n "$PKG_DIR" && -f "$PKG_DIR/install.sh" ]] || { c_err "✗ tarball 里找不到 install.sh"; exit 1; }

# 7. 交给 install.sh（非交互；它会判断全新/升级并保留数据）
echo "  开始安装…"; echo
bash "$PKG_DIR/install.sh" --yes
