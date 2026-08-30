# mc

网页版 Minecraft 1.8 联机（mc.cq.je）

- 游戏网址：https://mc.cq.je
- 启动页：`web/launcher/`（普通版 JS / 高性能 WASM）
- 源码工作区：Git 子模块 `eaglerx/`（[EaglercraftX-1.8-workspace](https://github.com/Eaglercraft-Archive/EaglercraftX-1.8-workspace)）
- 官方源码参考：https://gitflic.ru/project/lax1dude/eaglercraft-1_8
- 中文聊天 / 摇杆：`web/cn-chat.js`、`web/joystick-eagler.js`

**重要**：`git pull` 不会自带可玩的完整客户端（`classes.js` 等大文件不进 Git）。必须在服务器上编译后部署。

---

## 服务器部署清单

在 **mc.cq.je 服务器**上按顺序执行：

```bash
# 1. 拉取合并版 main
cd /path/to/mc          # 例如 /opt/mc 或你现有的仓库目录
git fetch origin
git checkout main
git pull origin main

# 2. 初始化 EaglercraftX 源码子模块
git submodule update --init --recursive

# 3. 编译客户端（需要 JDK 17+，首次较慢）
./scripts/build-eaglerx.sh
# 若只编普通版：./scripts/build-eaglerx.sh --js-only
# 若编译失败，仍可部署启动页（普通版按钮会指向已有 /play/）

# 4. 同步到网站目录
WEB_ROOT=/var/www/mc/web ./scripts/deploy-server.sh
```

### 前置要求

| 项 | 说明 |
| --- | --- |
| JDK | **17 或更高**（`java -version` 检查） |
| Git 子模块 | `eaglerx/` 约几百 MB 源码，首次 `submodule update` 需网络 |
| 磁盘 | 编译临时文件 + 产物各需数 GB 空间 |
| 不提交 | 不要把 `classes.js`、`assets.epk`、`assets.epw` push 到 GitHub |

### 编译产物目录

| 客户端 | Gradle 任务 | 仓库内目录 | 网站路径 |
| --- | --- | --- | --- |
| 普通 JS | `target_teavm_javascript:makeMainOfflineDownload` | `web/js/` | `/js/` |
| WASM | `target_teavm_wasm_gc:makeMainWasmClientBundle` | `web/wasm/` | `/wasm/` |

编译脚本：`./scripts/build-eaglerx.sh`（内部调用 `./scripts/apply-eaglerx-custom.sh` 应用二改）

### 二改内容（eaglerx-custom/）

- 默认多人：**`wss://mc.cq.je/`**（已核对现网 `/play/` 与 `/index.html` 均用同域根路径 WebSocket）
- 服名：CQ 创造服
- 游戏页挂载：`/remember-user.js`、`/joystick-eagler.js`、`/cn-chat.js`
- 窗口标题：CQ 网页版 Minecraft 1.8

**不要**从 play.mc.js.cool、eaglercraft.com 爬成品 `classes.js` 推进仓库。

---

## Nginx 配置要点

在**不破坏**现有 `wss`、`/api/mc-chat`、`/play/`、登录、`/classes.js`（Docker 游戏根文件）的前提下，增加启动器与客户端路径：

```nginx
# 启动页（站点根；登录 /play /api 等更具体的 location 应写在前面或单独 server）
location = / {
    try_files /index.html =404;
    root /var/www/mc/web;          # deploy-server.sh LAUNCHER_AT_ROOT=1 时 launcher 文件在此
}
location /launcher/ {
    alias /var/www/mc/web/launcher/;
}

# 编译后的客户端（未编译时可不配 /js/，启动页会回退到 /play/）
location /js/ {
    alias /var/www/mc/web/js/;
}
location /wasm/ {
    alias /var/www/mc/web/wasm/;
}

# 站点脚本（与现网一致，保持可从根路径加载）
location = /cn-chat.js       { alias /var/www/mc/web/cn-chat.js; }
location = /joystick-eagler.js { alias /var/www/mc/web/joystick-eagler.js; }
location = /remember-user.js { alias /var/www/mc/web/remember-user.js; }

# 以下保持现网原样，不要改：
# - WebSocket 升级（wss://mc.cq.je/ 游戏网关）
# - /api/mc-chat 中文聊天 HTTP
# - /play/、/login/、auth 反代
# - Docker 提供的 /classes.js、/assets.epk 等根路径游戏文件
```

### WASM Content-Type

```nginx
types { application/wasm wasm; }
# 或
location ~* \.wasm$ {
    default_type application/wasm;
}
```

---

## 编译失败 / 尚未编译时怎么办

| 情况 | 行为 |
| --- | --- |
| `web/js/classes.js` 不存在 | `./scripts/deploy-server.sh` **不同步** `/js/`；启动页「普通版」按钮指向已有 **`/play/`**（现网可玩） |
| `web/wasm/` 未编译 | WASM 按钮显示 **「高性能版 WASM（暂未部署）」**，不可点 |
| 启动页 | 始终可部署；`config.json` 由 deploy 脚本按编译状态自动生成 |

现网已有 Docker/EaglerX 提供的 `/play/`、`/classes.js` 等**不会被 deploy 脚本删除**。

---

## 启动器路径

| 网站路径 | 仓库目录 | 说明 |
| --- | --- | --- |
| `/` | `web/launcher/` | 中文启动页；iPad 用普通版，电脑可试 WASM |
| `/js/` | `web/js/` | 普通 JS 1.8.8（编译后） |
| `/wasm/` | `web/wasm/` | WASM 1.8.8（编译后） |

---

## 验收标准

- [ ] GitHub **main** 分支能看到 `web/launcher/`、`eaglerx/` 子模块、编译与部署脚本
- [ ] `git clone --recurse-submodules` 后能看到 EaglercraftX 源码工作区
- [ ] 仅 `git pull` **不能**直接玩；执行 `./scripts/build-eaglerx.sh` 并 `deploy-server.sh` 后，「普通版」才指向 `/js/`
- [ ] 编译前启动页可开，普通版回退 `/play/`，WASM 显示暂未部署
- [ ] 屏幕墙插件、AI 玩家、中文聊天、摇杆**互不影响**（未改 `ai-player/`、`plugin-screen/`、视距/JVM/存档）

---

## 其他组件

| 目录 | 说明 |
| --- | --- |
| `ai-player/` | 大模型 AI 玩家（未改） |
| `auth/` | 账号登录（`/play/` 使用 `remember-user.js`） |
| `web/cn-chat.js` | iPad 中文聊天输入框 |
| `web/joystick-eagler.js` | 手机圆形摇杆 |

详细：`web/launcher/README.md`、`eaglerx-custom/README.md`、`web/js/README.md`、`web/wasm/README.md`
