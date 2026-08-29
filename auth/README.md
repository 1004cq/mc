# 账号系统

注册一次，以后用同一用户名进游戏。换名就会变成新角色、空背包。

## 启动

```bash
cd auth
npm install
SESSION_SECRET='自己换一串长密钥' GAME_URL='https://mc.cq.je/' node server.mjs
```

Nginx 把 `/login` `/register.html` `/api/` 反代到 `127.0.0.1:3099`。
游戏首页在客户端 JS 之前加：

```html
<script src="/remember-user.js"></script>
```

用户名只能 `A-Z a-z 0-9 _`，3–16 位，不能中文。
