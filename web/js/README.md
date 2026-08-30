# 普通版客户端（EaglercraftX 1.8.8 JS）

本目录**不包含**完整游戏资源。请自行把**你编译好的** EaglercraftX **1.8.8** JS 静态文件放到这里（`index.html`、资源包、脚本等）。不要加入 1.12 / 1.21，也不要从不明来源拷 exe 或商业离线包进 Git。

对照运行效果：https://play.mc.js.cool/1.8

## 放置文件

把编译产物覆盖本目录（会替换占位 `index.html`）。站点通过 Nginx 以 `/js/` 对外提供。

## 默认服务器改为本服

打开本目录游戏页的 `index.html`（或官方模板里配置 `eaglercraftXOpts` / 默认服务器列表的位置），把默认服改成 `web/launcher/servers.json` 里的地址：

- 名称：`CQ 生存`
- 地址：`wss://mc.cq.je`

常见写法示例（字段名以你这份客户端模板为准）：

```javascript
window.eaglercraftXOpts = Object.assign(window.eaglercraftXOpts || {}, {
  servers: [{ addr: "wss://mc.cq.je", name: "CQ 生存" }]
});
```

若现网网关不在根路径，以启动器 `servers.json` 和 `web/launcher/README.md` 的【待填】为准，不要自编子路径。

## 保留中文聊天脚本

若本页就是游戏页，在 `index.html` **末尾**（`</body>` 前）保留：

```html
<script src="/cn-chat.js"></script>
```

按需还可保留站点已有的 `/joystick-eagler.js`、`/remember-user.js`。不要删除仓库里这些脚本。
