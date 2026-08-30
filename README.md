# mc

网页版我的世界联机部署（EaglercraftX 1.8）

- 游戏网址：https://mc.cq.je
- 启动页：`web/launcher/`（普通版 / WASM 两个入口）
- 手机圆形摇杆：`web/joystick-eagler.js`
- 接法说明：`web/README-摇杆.md`

## 启动器

一个域名、两套 **Minecraft 1.8** 网页客户端，连同一台服。玩家打开根路径先看启动页，再手动选版本（不自动跳转）。

| 路径 | 目录 | 说明 |
| --- | --- | --- |
| `/` | `web/launcher/` | 中文启动页 |
| `/js/` | `web/js/` | 普通 JS 客户端（推荐；iPad/手机） |
| `/wasm/` | `web/wasm/` | 高性能 WASM 客户端（电脑 Chrome 可试） |

默认服：`web/launcher/servers.json` → CQ 生存 / `wss://mc.cq.je`

**说明**：play.mc.js.cool、eaglercraft.com 等在线地址是**已编译成品**，仅作运行效果对照；**不要**从它们下载 `classes.js` 推进本仓库。客户端二改与编译只基于子模块 `eaglerx/`（EaglercraftX-1.8-workspace）。

### Nginx 示例

`/api/mc-chat` 与游戏 **WebSocket（wss）** 保持现网原样。

```nginx
location = / {
    alias /var/www/mc/web/launcher/index.html;
}
location / {
    root /var/www/mc/web/launcher;
    try_files $uri $uri/ /index.html;
}
location /js/ { alias /var/www/mc/web/js/; }
location /wasm/ { alias /var/www/mc/web/wasm/; }
location = /cn-chat.js { alias /var/www/mc/web/cn-chat.js; }
location = /joystick-eagler.js { alias /var/www/mc/web/joystick-eagler.js; }
location = /remember-user.js { alias /var/www/mc/web/remember-user.js; }
```

WASM 需设置 `.wasm` 的 Content-Type 为 `application/wasm`（详见下方编译部署）。

### 与屏幕插件、AI 的关系

启动器与 `ai-player/`、屏幕插件互不影响；**不修改** Paper 插件、AI、视距、JVM、世界存档相关配置。

---

## 编译 EaglercraftX 1.8 客户端

源码在 Git 子模块 **`eaglerx/`**：

```bash
git submodule update --init --recursive
```

上游：[Eaglercraft-Archive/EaglercraftX-1.8-workspace](https://github.com/Eaglercraft-Archive/EaglercraftX-1.8-workspace)

### 前置要求

- **JDK 17 或更高**（workspace README 要求）
- 网络（首次 `./gradlew` 会拉 Gradle 与 Maven 依赖）
- WASM 完整构建若需 loader，可能还要 Emscripten（见 `eaglerx/README.md`）；日常 Web 部署以 `makeMainWasmClientBundle` 产出为准

### 一键编译并部署到 web/js、web/wasm

```bash
./scripts/build-eaglerx.sh
```

脚本会：

1. 执行 `./scripts/apply-eaglerx-custom.sh`，把 `eaglerx-custom/` 二改覆盖到子模块
2. 编译 JS：`./gradlew target_teavm_javascript:makeMainOfflineDownload`（等同 `target_teavm_javascript/MakeOfflineDownload.sh`）
3. 编译 WASM：`./gradlew target_teavm_wasm_gc:makeMainWasmClientBundle`（等同 `target_teavm_wasm_gc/MakeWASMClientBundle.sh`）
4. 复制产物到 `web/js/`、`web/wasm/`（**不提交**大文件）

只编一种客户端：

```bash
./scripts/build-eaglerx.sh --js-only
./scripts/build-eaglerx.sh --wasm-only
```

### 编译产物位置

| 客户端 | Gradle 任务 | 输出目录（子模块内） | 部署到 |
| --- | --- | --- | --- |
| 普通 JS | `target_teavm_javascript:makeMainOfflineDownload` | `eaglerx/target_teavm_javascript/javascript/` | `web/js/` → 站点 `/js/` |
| WASM | `target_teavm_wasm_gc:makeMainWasmClientBundle` | `eaglerx/target_teavm_wasm_gc/javascript_dist/` | `web/wasm/` → 站点 `/wasm/` |

主要文件：`index.html`、`classes.js` + `assets.epk`（JS）或 `bootstrap.js` + `assets.epw`（WASM）等。

### 二改清单（eaglerx-custom/）

在 **`eaglerx-custom/`** 维护，由 `apply-eaglerx-custom.sh` 覆盖到子模块后再编译：

| 项 | 位置 |
| --- | --- |
| 默认服务器 `wss://mc.cq.je` | `target_teavm_javascript/javascript/index.html`<br>`target_teavm_wasm_gc/javascript_dist/index.html` |
| 窗口 / 标签标题 | 同上 HTML + `EaglercraftVersion.java` |
| 游戏页引入中文聊天 | 同上 HTML：`<script src="/cn-chat.js"></script>` |

详见 `eaglerx-custom/README.md`。

### 服务器部署目录

编译完成后，把以下目录同步到 mc.cq.je（**不要**把 `classes.js`、`assets.epk`、`assets.epw` 等大文件 commit 进 Git）：

```bash
rsync -a web/launcher/  服务器:/var/www/mc/web/launcher/
rsync -a web/js/       服务器:/var/www/mc/web/js/      # 编译后才有完整客户端
rsync -a web/wasm/     服务器:/var/www/mc/web/wasm/
rsync -a web/cn-chat.js web/joystick-eagler.js web/remember-user.js  服务器:/var/www/mc/web/
```

### WASM Content-Type

```nginx
types { application/wasm wasm; }
# 或
location ~* \.wasm$ {
    default_type application/wasm;
}
```

部分 WASM 构建还需 COOP/COEP 响应头以启用 SharedArrayBuffer；若浏览器控制台报错，按 `eaglerx` 文档调整。
