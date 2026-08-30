# 高性能版客户端（EaglercraftX 1.8.8 WASM）

本目录**不包含**完整游戏资源。请自行把**你编译好的** EaglercraftX **1.8.8** WASM 静态文件放到这里。不要加入 1.12 / 1.21，也不要分发来路不明的完整商业资源。

对照运行效果：https://play.mc.js.cool/1.8wasm

电脑 Chrome 可试本目录；iPad / 手机请用普通 JS 版（`/js/`）。

## 放置文件

把编译产物（含 `.wasm` 以及游戏页 `index.html`）覆盖本目录。站点通过 Nginx 以 `/wasm/` 对外提供。

Nginx 必须把 `.wasm` 的 **Content-Type** 设为 `application/wasm`，否则浏览器无法实例化模块。示例见仓库根 README「启动器」一节。部分 WASM 构建还需要 `Cross-Origin-Opener-Policy` / `Cross-Origin-Embedder-Policy` 才能使用 `SharedArrayBuffer`；若控制台报相关错误，按你这份客户端文档加上对应响应头。

## 默认服务器改为本服

与 JS 版相同，把默认服改成 `web/launcher/servers.json`：

- 名称：`CQ 生存`
- 地址：`wss://mc.cq.je`

```javascript
window.eaglercraftXOpts = Object.assign(window.eaglercraftXOpts || {}, {
  servers: [{ addr: "wss://mc.cq.je", name: "CQ 生存" }]
});
```

网关路径若不是根，见 `web/launcher/README.md` 的【待填】，不要猜路径。

## 保留中文聊天脚本

若本页就是游戏页，在 `index.html` **末尾**保留：

```html
<script src="/cn-chat.js"></script>
```
