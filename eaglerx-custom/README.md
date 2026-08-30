# EaglercraftX 1.8 二改覆盖层

本目录**不是** Eaglercraft 源码，而是对子模块 `eaglerx/`（[EaglercraftX-1.8-workspace](https://github.com/Eaglercraft-Archive/EaglercraftX-1.8-workspace)）的**二改清单**。

在线成品站（如 play.mc.js.cool、eaglercraft.com）仅作运行效果对照，**不要**从它们下载 `classes.js` 推进本仓库。二改只基于 workspace 编译。

## 二改项

| 项 | 文件 | 说明 |
| --- | --- | --- |
| 默认服务器 | `target_teavm_javascript/javascript/index.html`<br>`target_teavm_wasm_gc/javascript_dist/index.html` | `servers: [{ addr: "wss://mc.cq.je", name: "CQ 生存" }]` |
| 窗口标题 | 同上 + `src/.../EaglercraftVersion.java` | 浏览器 `<title>` 与游戏内主菜单品牌 |
| 中文聊天 | 同上 HTML | `<script src="/cn-chat.js"></script>` |

配置常量见 `config.sh`。应用方式：

```bash
./scripts/apply-eaglerx-custom.sh   # 覆盖到 eaglerx/ 子模块（不提交编译产物）
./scripts/build-eaglerx.sh          # 编译并复制到 web/js、web/wasm
```

## 不要改

- Paper 插件、`ai-player/`、视距、JVM、世界存档相关文档
- 不要提交 `classes.js`、`assets.epk`、`assets.epw` 等大文件
