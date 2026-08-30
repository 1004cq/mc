# mc

网页版 Minecraft 1.8 联机（https://mc.cq.je）

## 现网状态（已核对，2026-08）

| 项 | 值 |
| --- | --- |
| WebSocket | **`wss://mc.cq.je/`**（同域根路径） |
| 服名 | **CQ 创造服** |
| 当前可玩入口 | **`/play/`**（含 `cn-chat.js`、`remember-user.js`） |
| `/js/`、`/wasm/` | 尚未部署（404） |

本仓库 **main** 已含合并版启动器。`git pull` **不会**自带 `classes.js` 等大文件，须本地编译后部署。

**现网脚本以线上为准**：`cn-chat.js`、`joystick-eagler.js`、`remember-user.js` 在未确认前不要用 deploy 覆盖；默认 `deploy-server.sh` 只更新启动页。

---

## 快速上线：只部署启动页（不编译）

在服务器上：

```bash
cd /path/to/mc
git fetch origin && git checkout main && git pull origin main
WEB_ROOT=/var/www/mc/web ./scripts/deploy-server.sh
```

然后配置 Nginx 让 **`/` → 启动页**，**`/play/` 保持不变**：

```nginx
# 站点根 = 中文启动页（不覆盖 /play/、/login/、wss、/api/mc-chat）
location = / {
    alias /var/www/mc/web/launcher/index.html;
}
location /launcher/ {
    alias /var/www/mc/web/launcher/;
}

# 以下保持现网原样，不要删改：
# /play/  /login/  /api/mc-chat  WebSocket(wss)  /classes.js  等
```

部署后效果：

- **`/`** → 中文启动页
- **「普通版（推荐）」** → **`/play/`**（现网可玩，默认服 `wss://mc.cq.je/`）
- **「高性能版 WASM（暂未部署）」** → 灰色不可点，**不会**跳到 404 的 `/wasm/`

---

## 按钮何时切换到 /js/、/wasm/

由 `scripts/deploy-server.sh` 检测编译产物并写入 `web/launcher/config.json`：

| 条件 | 普通版按钮 | WASM 按钮 |
| --- | --- | --- |
| 默认（未编译） | **`/play/`** | **暂未部署**（禁用） |
| 存在 `web/js/classes.js` | **`/js/`** | 暂未部署 |
| 存在 `web/wasm/bootstrap.js` 或 `assets.epw` | `/js/` 或 `/play/` | **`/wasm/`** |

切换步骤：

```bash
git submodule update --init --recursive   # 首次需要 JDK 17
./scripts/build-eaglerx.sh                # 或 --js-only / --wasm-only
WEB_ROOT=/var/www/mc/web ./scripts/deploy-server.sh
```

**禁止**在未编译时把普通版链到空的 `/js/`。

---

## 完整部署清单

```bash
cd /path/to/mc
git fetch origin
git checkout main
git pull origin main

git submodule update --init --recursive

# 需要 JDK 17+
./scripts/build-eaglerx.sh
# 编译失败仍可 deploy-server.sh，普通版继续走 /play/

WEB_ROOT=/var/www/mc/web ./scripts/deploy-server.sh
```

### 编译产物

| 客户端 | Gradle 任务 | 仓库目录 | 网站路径 |
| --- | --- | --- | --- |
| 普通 JS | `target_teavm_javascript:makeMainOfflineDownload` | `web/js/` | `/js/` |
| WASM | `target_teavm_wasm_gc:makeMainWasmClientBundle` | `web/wasm/` | `/wasm/` |

源码子模块：`eaglerx/`（[EaglercraftX-1.8-workspace](https://github.com/Eaglercraft-Archive/EaglercraftX-1.8-workspace)）  
官方参考：https://gitflic.ru/project/lax1dude/eaglercraft-1_8  
二改清单：`eaglerx-custom/`（默认服、标题、`cn-chat.js` 等）

**不要**从 play.mc.js.cool、eaglercraft.com 爬成品 `classes.js` 进仓库。

### Nginx 补充（编译 /js/、/wasm/ 后）

```nginx
location /js/   { alias /var/www/mc/web/js/; }
location /wasm/ { alias /var/www/mc/web/wasm/; }

location = /cn-chat.js         { alias /var/www/mc/web/cn-chat.js; }
location = /joystick-eagler.js { alias /var/www/mc/web/joystick-eagler.js; }
location = /remember-user.js   { alias /var/www/mc/web/remember-user.js; }
```

WASM Content-Type：

```nginx
types { application/wasm wasm; }
```

### 编译失败怎么办

- 只跑 `deploy-server.sh`：启动页可开，普通版 → `/play/`，WASM 禁用
- **不删除** 服务器上 Docker 的 `/play/`、`/classes.js` 等现有文件
- 屏幕墙、AI、摇杆、中文聊天逻辑**未改**（`ai-player/`、`plugin-screen/` 等）

---

## 验收标准

- [ ] GitHub **main** 有 `web/launcher/`、编译说明、`scripts/deploy-server.sh`
- [ ] `git pull` 后 deploy → **`/` 是启动页**，普通版 → **`/play/` 能玩**
- [ ] WASM 未部署时**不 404**
- [ ] 编译 + deploy 后按钮自动切到 `/js/`、`/wasm/`
- [ ] 屏幕墙、AI、中文聊天、摇杆仍可用

---

## 其他

| 路径 | 说明 |
| --- | --- |
| `web/cn-chat.js` | iPad 中文聊天 |
| `web/joystick-eagler.js` | 手机摇杆 |
| `web/remember-user.js` | 登录用户名 |
| `auth/`、`ai-player/` | 账号与 AI（未改） |

详见 `web/launcher/README.md`
