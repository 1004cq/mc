# Eaglercraft 手机圆形摇杆

这套是给 **mc.cq.je** 这种 Eaglercraft 网页客户端用的，不是 Three.js。

原理：左下角画一个圆形摇杆 → 按方向模拟按住 W/A/S/D → 游戏里角色移动。
推满还会按 Shift（疾跑）。旁边「跳」按钮 = 空格。

## 怎么接到 mc.cq.je

找到客户端页面（一般是 EaglerWeb 的 `index.html`，或 Nginx 反代的网站目录），在 `</body>` 前加一行：

```html
<script src="/joystick-eagler.js"></script>
```

把 `web/joystick-eagler.js` 放到和游戏首页同域名的目录，例如：

- Nginx 静态目录
- 或 Docker 里 `EaglerWeb/web/`

刷新手机页面后，左下角应出现圆盘。

## 调参数（改 js 顶部常量）

- RADIUS 摇杆半径
- DEAD 死区，太敏感就调大
- SPRINT 推多满开始疾跑

## 和 Three.js 那套的区别

| 文件 | 用途 |
|---|---|
| joystick-eagler.js | 接 Eaglercraft / mc.cq.je |
| joystick.js + playerMove.js | 只接你自己的 Three.js 游戏 |

不要把 playerMove.js 打进 Eaglercraft，没效果。
