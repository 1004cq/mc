# 启动器

## 现网默认行为

| 按钮 | 链接 | 说明 |
| --- | --- | --- |
| 普通版（推荐） | **`/play/`** | 现网唯一可玩页，默认服 `wss://mc.cq.je/` |
| 高性能版 WASM | **暂未部署** | 禁用，不跳到 `/wasm/`（404） |

**iPad / 手机请用普通版。**

## 部署

```bash
WEB_ROOT=/var/www/mc/web ./scripts/deploy-server.sh
```

默认同步到 `WEB_ROOT/launcher/`，配合 Nginx `location = / { alias .../launcher/index.html; }`，**不覆盖**根目录原有游戏 `index.html`。

## servers.json

```json
{ "name": "CQ 创造服", "address": "wss://mc.cq.je/" }
```

## 编译后自动切换

`deploy-server.sh` 检测 `web/js/classes.js`、`web/wasm/bootstrap.js` 后更新 `config.json`，启动页按钮改为 `/js/`、`/wasm/`。
