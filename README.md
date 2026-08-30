# mc

网页版我的世界联机部署（Eaglercraft Docker）

- 游戏网址：https://mc.cq.je
- 手机圆形摇杆：`web/joystick-eagler.js`
- 接法说明：`web/README-摇杆.md`

## 启动器

一个域名、两套 **Minecraft 1.8** 网页客户端，连同一台服。玩家打开根路径先看启动页，再手动选版本（不自动跳转）。仓库**不**分发完整游戏资源，客户端文件由你自己编译后放到对应目录。

### 1. 三个路径

| 路径 | 目录 | 说明 |
| --- | --- | --- |
| `/` | `web/launcher/` | 中文启动页 |
| `/js/` | `web/js/` | 普通 JS 客户端（推荐；iPad/手机） |
| `/wasm/` | `web/wasm/` | 高性能 WASM 客户端（电脑 Chrome 可试） |

部署说明：`web/launcher/README.md`。放置编译产物：`web/js/README.md`、`web/wasm/README.md`。默认服列表：`web/launcher/servers.json`（CQ 生存 / `wss://mc.cq.je`）。

### 2. Nginx 示例

`/api/mc-chat` 与游戏 **WebSocket（wss）** 保持现网原样，不要为了启动器去改它们。下面只补静态入口。站点根路径请改成你机器上的真实目录。

```nginx
# 启动页（站点根）
location = / {
    alias /var/www/mc/web/launcher/index.html;
}
location / {
    root /var/www/mc/web/launcher;
    try_files $uri $uri/ /index.html;
}

# 可选：仓库路径 /launcher/ 也能打开同一套启动页
location /launcher/ {
    alias /var/www/mc/web/launcher/;
}

# 普通 JS 客户端
location /js/ {
    alias /var/www/mc/web/js/;
}

# 高性能 WASM 客户端
location /wasm/ {
    alias /var/www/mc/web/wasm/;
}

# 中文聊天等站点脚本（保持可从根路径加载）
location = /cn-chat.js { alias /var/www/mc/web/cn-chat.js; }
location = /joystick-eagler.js { alias /var/www/mc/web/joystick-eagler.js; }
location = /remember-user.js { alias /var/www/mc/web/remember-user.js; }

# 中文聊天 HTTP 接口：保持原反代，勿改逻辑
# location /api/mc-chat { ... 现网原样 ... }

# 游戏网关 wss：保持原样（默认按根路径 wss://mc.cq.je）
# location / { 若现网已对 upgrade 做了独立 location，继续用那一段，不要猜子路径 }
```

注意：若现有配置已经用 `location /` 做 WebSocket 升级，不要直接整段替换；把启动器静态文件和 `upgrade` 规则按现网拆开，**wss 路径保持原样**。网关若不在根路径，把真实地址写入 `web/launcher/servers.json`（README 里标了【待填】），不要自编子路径。

### 3. WASM 的 Content-Type

`.wasm` 必须是 `application/wasm`：

```nginx
types {
    application/wasm wasm;
}
```

或：

```nginx
location ~* \.wasm$ {
    default_type application/wasm;
    add_header Content-Type application/wasm;
}
```

### 4. 和屏幕插件、AI 的关系

启动器只提供网页入口。**不修改** `ai-player/`、`plugin-screen/`、`screen-capture/` 的逻辑，与视距、JVM、世界存档运行参数无关。屏幕插件和 AI 玩家继续按原方式工作，互不影响。

