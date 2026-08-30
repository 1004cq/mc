# 普通版客户端（EaglercraftX 1.8.8 JS）

本目录存放**编译后的**普通 JS 客户端静态文件，通过站点 `/js/` 访问。

仓库**不提交** `classes.js`、`assets.epk` 等大文件。请基于子模块 `eaglerx/` 自行编译：

```bash
git submodule update --init --recursive
./scripts/build-eaglerx.sh --js-only
```

## 编译来源

- 子模块：`eaglerx/` → [EaglercraftX-1.8-workspace](https://github.com/Eaglercraft-Archive/EaglercraftX-1.8-workspace)
- Gradle 任务：`target_teavm_javascript:makeMainOfflineDownload`
- 输出：`eaglerx/target_teavm_javascript/javascript/` → 复制到本目录

**不要**从 play.mc.js.cool 等成品站下载 `classes.js` 推进仓库；二改见 `eaglerx-custom/`。

## 已内置的二改

`scripts/apply-eaglerx-custom.sh` 会在编译前写入：

- 默认服务器：`wss://mc.cq.je`（CQ 生存）
- 页面标题：CQ 网页版 Minecraft 1.8
- `<script src="/cn-chat.js"></script>`

按需还可在游戏页加 `/joystick-eagler.js`、`/remember-user.js`（仓库根 `web/` 下已有）。

## 网关路径

默认按根路径 `wss://mc.cq.je`。若现网不是根路径，改 `eaglerx-custom/` 与 `web/launcher/servers.json`，不要猜子路径。
