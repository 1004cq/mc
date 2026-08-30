#!/usr/bin/env bash
# 同步启动器与已编译客户端到网站目录；不删除现网 Docker 游戏根文件（/play、/classes.js 等）
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WEB_ROOT="${WEB_ROOT:-/var/www/mc/web}"
LAUNCHER_AT_ROOT="${LAUNCHER_AT_ROOT:-1}"

usage() {
  cat <<'EOF'
用法: WEB_ROOT=/var/www/mc/web ./scripts/deploy-server.sh

环境变量:
  WEB_ROOT          网站静态根目录（默认 /var/www/mc/web）
  LAUNCHER_AT_ROOT  1=启动页文件放到 WEB_ROOT 根（配合 Nginx / → launcher）
                    0=只同步到 WEB_ROOT/launcher/

不会删除 WEB_ROOT 下已有的 classes.js、play/、index.html 等 Docker 游戏文件。
仅当 web/js 已编译（存在 classes.js）时才同步 /js/；
仅当 web/wasm 已编译（存在 bootstrap.js 或 assets.epw）时才同步 /wasm/。
EOF
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

mkdir -p "$WEB_ROOT"

has_js=0
has_wasm=0
[[ -f "$ROOT/web/js/classes.js" ]] && has_js=1
[[ -f "$ROOT/web/wasm/bootstrap.js" || -f "$ROOT/web/wasm/assets.epw" ]] && has_wasm=1

echo "==> 写入启动器 config.json（JS 已编译=$has_js, WASM 可用=$has_wasm）"
cat > "$ROOT/web/launcher/config.json" <<EOF
{
  "js": {
    "url": "/js/",
    "fallbackUrl": "/play/",
    "label": "普通版（推荐）",
    "compiled": $( [[ "$has_js" -eq 1 ]] && echo true || echo false )
  },
  "wasm": {
    "url": "/wasm/",
    "label": "高性能版 WASM",
    "available": $( [[ "$has_wasm" -eq 1 ]] && echo true || echo false )
  },
  "server": {
    "name": "CQ 创造服",
    "address": "wss://mc.cq.je/"
  }
}
EOF

echo "==> 同步站点脚本（中文聊天 / 摇杆 / 记住用户名）"
for f in cn-chat.js joystick-eagler.js remember-user.js; do
  if [[ -f "$ROOT/web/$f" ]]; then
    cp "$ROOT/web/$f" "$WEB_ROOT/$f"
    echo "    $f"
  fi
done

sync_dir() {
  local src="$1"
  local dst="$2"
  mkdir -p "$dst"
  if command -v rsync >/dev/null 2>&1; then
    rsync -a "$src" "$dst"
  else
    cp -a "$src"/. "$dst"/
  fi
}

if [[ "$LAUNCHER_AT_ROOT" == "1" ]]; then
  echo "==> 同步启动页到 $WEB_ROOT/ （根路径）"
  sync_dir "$ROOT/web/launcher" "$WEB_ROOT"
else
  echo "==> 同步启动页到 $WEB_ROOT/launcher/"
  sync_dir "$ROOT/web/launcher" "$WEB_ROOT/launcher"
fi

if [[ "$has_js" -eq 1 ]]; then
  echo "==> 同步已编译 JS 客户端 -> $WEB_ROOT/js/"
  sync_dir "$ROOT/web/js" "$WEB_ROOT/js"
else
  echo "==> 跳过 /js/（web/js/classes.js 不存在；启动页普通版按钮将指向 /play/）"
fi

if [[ "$has_wasm" -eq 1 ]]; then
  echo "==> 同步已编译 WASM 客户端 -> $WEB_ROOT/wasm/"
  sync_dir "$ROOT/web/wasm" "$WEB_ROOT/wasm"
else
  echo "==> 跳过 /wasm/（尚未编译；启动页 WASM 按钮显示「暂未部署」）"
fi

echo "==> 完成。未改动 $WEB_ROOT 下已有 Docker 游戏文件（/play、根目录 classes.js 等）。"
echo "    请确认 Nginx：/ → 启动页，/js/ /wasm/ → 客户端，wss 与 /api/mc-chat 保持原样。"
