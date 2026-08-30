# 启动器（部署到 mc.cq.je）

玩家打开站点根路径先看到本目录的启动页，再自己点「普通版」或「高性能版 WASM」进游戏。页面**不会**自动跳转。

## 客户端从哪来

游戏客户端**不在 Git 里**，需基于子模块 `eaglerx/` 编译：

```bash
git submodule update --init --recursive
./scripts/build-eaglerx.sh
```

编译结果复制到 `web/js/`、`web/wasm/` 后再同步到服务器。不要从 play.mc.js.cool 等成品站扒 `classes.js`。

## 目录怎么放到服务器

```bash
rsync -a web/launcher/ /var/www/mc/web/launcher/
rsync -a web/js/       /var/www/mc/web/js/       # 须先编译
rsync -a web/wasm/     /var/www/mc/web/wasm/     # 须先编译
```

Nginx 示例见仓库根 `README.md`。

## 默认服务器

`servers.json`：

```json
{ "name": "CQ 生存", "address": "wss://mc.cq.je" }
```

与 `eaglerx-custom/` 二改、`web/js/`、`web/wasm/` 编译配置一致。

**【待填】** 若现网 WebSocket 网关不在根路径，把真实 `wss://` 写入 `servers.json` 并同步改 `eaglerx-custom/config.sh`，不要猜子路径。

## 启动页链接

- 普通版：`../js/`（站点 `/js/`）
- WASM：`../wasm/`（站点 `/wasm/`）

不要改 `ai-player/`、Paper 插件、视距与存档相关配置。
