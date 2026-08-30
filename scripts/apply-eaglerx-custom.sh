#!/usr/bin/env bash
# 将 eaglerx-custom/ 二改覆盖层复制到 eaglerx 子模块（编译前 / 编译后均可调用）
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CUSTOM="$ROOT/eaglerx-custom"
EAGLERX="$ROOT/eaglerx"

if [[ ! -f "$EAGLERX/gradlew" ]]; then
  echo "缺少子模块 eaglerx/，请先执行：git submodule update --init --recursive" >&2
  exit 1
fi

if [[ ! -d "$CUSTOM" ]]; then
  echo "缺少 eaglerx-custom/ 目录" >&2
  exit 1
fi

# shellcheck source=/dev/null
source "$CUSTOM/config.sh"

echo "==> 应用二改覆盖层到 eaglerx/"

copy_overlay() {
  local rel="$1"
  local src="$CUSTOM/$rel"
  local dst="$EAGLERX/$rel"
  if [[ -f "$src" ]]; then
    mkdir -p "$(dirname "$dst")"
    cp "$src" "$dst"
    echo "    $rel"
  fi
}

copy_overlay "src/main/java/net/lax1dude/eaglercraft/v1_8/EaglercraftVersion.java"
copy_overlay "target_teavm_javascript/javascript/index.html"
copy_overlay "target_teavm_wasm_gc/javascript_dist/index.html"

echo "==> 完成（默认服 ${MC_SERVER_ADDR}，标题 ${MC_PAGE_TITLE_JS}）"
