# EaglercraftX 1.8 二改覆盖层

对子模块 `eaglerx/` 的定制，**不**修改上游仓库。不要从 play.mc.js.cool 等成品站爬 JS。

官方源码参考：https://gitflic.ru/project/lax1dude/eaglercraft-1_8  
Workspace 子模块：https://github.com/Eaglercraft-Archive/EaglercraftX-1.8-workspace

## 二改项

| 项 | 值 |
| --- | --- |
| 默认服务器 | `wss://mc.cq.je/`（现网已核对） |
| 服名 | CQ 创造服 |
| 页面标题 | CQ 网页版 Minecraft 1.8 / WASM |
| 站点脚本 | `/remember-user.js`、`/joystick-eagler.js`、`/cn-chat.js` |

## 使用

```bash
./scripts/apply-eaglerx-custom.sh   # 覆盖到 eaglerx/
./scripts/build-eaglerx.sh            # 编译并复制到 web/js、web/wasm
```

修改常量：编辑 `config.sh` 后重新 apply + build。
