#!/usr/bin/env bash
# 编译 EaglercraftX 1.8 JS / WASM，并复制产物到 web/js、web/wasm（不提交大文件）
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
EAGLERX="$ROOT/eaglerx"
WEB_JS="$ROOT/web/js"
WEB_WASM="$ROOT/web/wasm"

BUILD_JS=1
BUILD_WASM=1
DEPLOY=1

usage() {
  cat <<'EOF'
用法: ./scripts/build-eaglerx.sh [选项]

  --js-only       只编译普通 JS 客户端
  --wasm-only     只编译 WASM 客户端
  --no-deploy     只编译，不复制到 web/js、web/wasm
  -h, --help      显示帮助

前置：JDK 17+、git submodule update --init --recursive
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --js-only) BUILD_WASM=0 ;;
    --wasm-only) BUILD_JS=0 ;;
    --no-deploy) DEPLOY=0 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "未知参数: $1" >&2; usage; exit 1 ;;
  esac
  shift
done

if [[ ! -x "$EAGLERX/gradlew" ]]; then
  echo "缺少 eaglerx/gradlew，请先：git submodule update --init --recursive" >&2
  exit 1
fi

if ! command -v java >/dev/null 2>&1; then
  echo "未找到 java，请安装 JDK 17 或更高版本" >&2
  exit 1
fi

JAVA_VER="$(java -version 2>&1 | head -1 | sed -n 's/.*"\([0-9][0-9]*\).*/\1/p')"
if [[ -z "$JAVA_VER" || "$JAVA_VER" -lt 17 ]]; then
  echo "需要 JDK 17+，当前: $(java -version 2>&1 | head -1)" >&2
  exit 1
fi

echo "==> 应用二改（默认服 wss://mc.cq.je、标题、/cn-chat.js）"
"$ROOT/scripts/apply-eaglerx-custom.sh"

cd "$EAGLERX"
chmod +x gradlew

if [[ "$BUILD_JS" -eq 1 ]]; then
  echo "==> 编译普通 JS 客户端（Gradle: target_teavm_javascript:makeMainOfflineDownload）"
  ./gradlew target_teavm_javascript:makeMainOfflineDownload
  # 编译可能覆盖 HTML，再次应用页面级二改
  "$ROOT/scripts/apply-eaglerx-custom.sh"
fi

if [[ "$BUILD_WASM" -eq 1 ]]; then
  echo "==> 编译 WASM 客户端（Gradle: target_teavm_wasm_gc:makeMainWasmClientBundle）"
  ./gradlew target_teavm_wasm_gc:makeMainWasmClientBundle
  "$ROOT/scripts/apply-eaglerx-custom.sh"
fi

if [[ "$DEPLOY" -eq 0 ]]; then
  echo "==> 跳过部署（--no-deploy）"
  exit 0
fi

deploy_dir() {
  local src="$1"
  local dst="$2"
  local label="$3"
  if [[ ! -d "$src" ]]; then
    echo "编译输出不存在: $src" >&2
    exit 1
  fi
  echo "==> 复制 $label -> $dst"
  mkdir -p "$dst"
  if command -v rsync >/dev/null 2>&1; then
    rsync -a --delete \
      --exclude='.gitignore' \
      --exclude='README.md' \
      "$src/" "$dst/"
  else
    find "$dst" -mindepth 1 -maxdepth 1 ! -name 'README.md' ! -name '.gitignore' -exec rm -rf {} + 2>/dev/null || true
    cp -a "$src"/. "$dst"/
  fi
}

if [[ "$BUILD_JS" -eq 1 ]]; then
  deploy_dir \
    "$EAGLERX/target_teavm_javascript/javascript" \
    "$WEB_JS" \
    "JS 客户端"
fi

if [[ "$BUILD_WASM" -eq 1 ]]; then
  deploy_dir \
    "$EAGLERX/target_teavm_wasm_gc/javascript_dist" \
    "$WEB_WASM" \
    "WASM 客户端"
fi

echo "==> 完成。启动页: web/launcher/  普通版: web/js/  WASM: web/wasm/"
echo "    编译产物仅在服务器本地，请勿 git add classes.js / assets.epk / assets.epw 等大文件。"
