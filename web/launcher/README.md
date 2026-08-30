# 启动器

玩家打开站点根路径看到中文启动页，手动选版本（**不自动跳转**）。

- **iPad / 手机**：点「普通版（推荐）」
- **电脑 Chrome**：编译部署 WASM 后可试「高性能版 WASM」

## 按钮逻辑（config.json）

`scripts/deploy-server.sh` 会根据编译状态写入 `config.json`：

| 条件 | 普通版按钮 | WASM 按钮 |
| --- | --- | --- |
| `web/js/classes.js` 已存在 | `/js/` | — |
| 未编译 JS | **`/play/`**（现网已有游戏页） | — |
| `web/wasm/bootstrap.js` 或 `assets.epw` 存在 | — | `/wasm/` |
| WASM 未编译 | — | **暂未部署**（灰色不可点） |

## 默认服务器

已核对现网：`wss://mc.cq.je/`（同域根路径，与 `/play/` 一致）。见 `servers.json`。

## 部署

```bash
WEB_ROOT=/var/www/mc/web ./scripts/deploy-server.sh
```

不会删除服务器上 Docker 提供的 `/play/`、`/classes.js` 等现有文件。
