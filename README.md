# mc

网页版我的世界（EaglercraftX）Docker 联机部署方案。

基于 [yangchuansheng/eaglerXserver](https://github.com/yangchuansheng/eaglerXserver) 官方镜像，一键启动浏览器可玩的 Minecraft 1.8 / 1.12 服务器，支持多人联机、世界持久化和管理面板。

## 功能

- 浏览器直接游玩，无需安装客户端或正版账号
- 支持 Paper **1.8.8** 与 **1.12.2**（通过环境变量切换）
- 端口 **5200**：游戏 Web 客户端与联机入口
- 端口 **5201**：管理面板（RCON）
- 世界、插件与配置持久化到本地 `data/` 目录

## 前置要求

- Linux / macOS / Windows（WSL2）
- [Docker](https://docs.docker.com/get-docker/) 与 Docker Compose v2

## 快速开始

```bash
# 1. 克隆仓库
git clone https://github.com/1004cq/mc.git
cd mc

# 2. 复制并编辑配置
cp .env.example .env
# 编辑 .env，至少修改 RCON_PASSWORD

# 3. 启动（二选一）
./scripts/deploy.sh
# 或
docker compose up -d
```

启动完成后：

| 用途 | 地址 |
| --- | --- |
| 游戏入口 | http://localhost:5200 |
| 管理面板 | http://localhost:5201/admin |

管理面板登录密码为 `.env` 中的 `RCON_PASSWORD`。

## 配置说明

复制 `.env.example` 为 `.env` 后可修改以下变量：

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `IMAGE_TAG` | `2.2.3` | Docker 镜像版本 |
| `MINECRAFT_VERSION` | `1.12` | `1.8` 或 `1.12` |
| `RCON_PASSWORD` | （必填） | 管理面板密码 |
| `GAME_PORT` | `5200` | 游戏端口（宿主机） |
| `ADMIN_PORT` | `5201` | 管理面板端口（宿主机） |
| `DATA_DIR` | `./data` | 世界数据目录 |

## 联机方式

### 局域网

1. 在浏览器打开 `http://<服务器IP>:5200`
2. 输入任意用户名，进入多人游戏
3. 其他玩家同样访问该地址即可加入

### 公网部署

若需从互联网访问，建议：

1. 在云服务器安全组/防火墙放行 `GAME_PORT` 与 `ADMIN_PORT`
2. 使用 Nginx/Caddy 配置 HTTPS 与 WebSocket 反代（Eaglercraft 使用 WebSocket 通信）
3. 联机菜单添加服务器时使用 `wss://你的域名`（5200 对应端点）

> 公网直连 HTTP 可用，但 WebSocket 在部分网络环境下更稳定；生产环境推荐 WSS。

## 常用命令

```bash
# 查看日志
docker compose logs -f

# 停止
docker compose down

# 重启
docker compose restart

# 更新镜像
docker compose pull && docker compose up -d
```

## 同时运行两个版本

若需 1.8 与 1.12 并存，复制一份 compose 并修改端口与数据目录，例如：

```bash
GAME_PORT=5300 ADMIN_PORT=5301 DATA_DIR=./data-1.8 MINECRAFT_VERSION=1.8 \
  docker compose -p eagler-18 up -d
```

## 目录结构

```text
mc/
├── docker-compose.yml   # 服务定义
├── .env.example         # 配置模板
├── scripts/
│   └── deploy.sh        # 一键部署脚本
├── data/                # 世界数据（运行时生成，已 gitignore）
└── README.md
```

## 故障排查

**容器启动后立即退出**

- 检查 `MINECRAFT_VERSION` 是否为 `1.8` 或 `1.12`

**管理面板无法登录**

- 确认 `.env` 中设置了 `RCON_PASSWORD`，且映射了 `5201` 端口

**重启后世界丢失**

- 确认 `DATA_DIR` 目录存在且已正确挂载

**首次启动较慢**

- 容器需初始化世界与启动 Paper/Bungee，通常 1–3 分钟；可通过 `docker compose logs -f` 观察进度

## 致谢

- [EaglercraftX](https://github.com/lax1dude/eaglercraft) — lax1dude
- [eaglerXserver Docker 镜像](https://github.com/yangchuansheng/eaglerXserver) — yangchuansheng

## 许可证

MIT
