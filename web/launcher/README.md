# 启动器（部署到 mc.cq.je）

玩家打开站点根路径先看到本目录的启动页，再自己点「普通版」或「高性能版 WASM」进游戏。页面**不会**自动跳转。

对照站（只作对照，不要把官方完整离线包塞进本仓库）：

- 普通 JS：https://play.mc.js.cool/1.8
- WASM：https://play.mc.js.cool/1.8wasm
- 官方入口：https://eaglercraft.com/play

## 目录怎么放到服务器

在仓库根目录把 `web/` 整棵拷到站点静态目录（示例路径请按现网修改）：

```bash
# 示例：站点根为 /var/www/mc
rsync -a web/launcher/ /var/www/mc/web/launcher/
# 客户端本体不在 Git 里，请按 web/js/README.md、web/wasm/README.md 自行放入：
# rsync -a /你编译好的/eagler-js/  /var/www/mc/web/js/
# rsync -a /你编译好的/eagler-wasm/ /var/www/mc/web/wasm/
# 现有脚本保持站点根可访问：
#   /cn-chat.js  /joystick-eagler.js  /remember-user.js
```

Nginx 把 `/` 指到本启动器目录，`/js/`、`/wasm/` 指到两套客户端。完整示例见仓库根 `README.md` 的「启动器」一节。

## 默认服务器

`servers.json` 当前为：

```json
{
  "name": "CQ 生存",
  "address": "wss://mc.cq.je"
}
```

这是按「游戏网关在站点根路径」写的。把编译好的客户端放进 `web/js/`、`web/wasm/` 时，把该地址写进客户端的默认服务器列表（做法见对应 README）。

**【待填】若现网网关 WebSocket 不是根路径**（例如实际是 `wss://mc.cq.je/某个真实路径`），不要猜子路径：把真实 `wss://` 地址改到 `servers.json` 的 `address`，并同步改两套客户端的默认服。未确认前保持 `wss://mc.cq.je`。

## 启动页链接

- 普通版：相对路径 `../js/`（站点上即 `/js/`）
- WASM：相对路径 `../wasm/`（站点上即 `/wasm/`）

不要改 `ai-player/`、`plugin-screen/`、`screen-capture/` 的逻辑；启动器只提供网页入口。
