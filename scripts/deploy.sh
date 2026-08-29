#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if ! command -v docker >/dev/null 2>&1; then
  echo "错误：未找到 docker，请先安装 Docker。" >&2
  exit 1
fi

if [[ ! -f .env ]]; then
  cp .env.example .env
  echo "已创建 .env，请编辑 RCON_PASSWORD 后重新运行。"
  exit 0
fi

if grep -q '^RCON_PASSWORD=change-this-password' .env; then
  echo "请先在 .env 中修改 RCON_PASSWORD，不要使用默认密码。" >&2
  exit 1
fi

mkdir -p "$(grep '^DATA_DIR=' .env | cut -d= -f2- | tr -d '"' || echo './data')"

docker compose pull
docker compose up -d

GAME_PORT="$(grep '^GAME_PORT=' .env | cut -d= -f2- || echo '5200')"
ADMIN_PORT="$(grep '^ADMIN_PORT=' .env | cut -d= -f2- || echo '5201')"

echo
echo "Eaglercraft 已启动。"
echo "  游戏入口: http://localhost:${GAME_PORT}"
echo "  管理面板: http://localhost:${ADMIN_PORT}/admin"
echo
echo "查看日志: docker compose logs -f"
