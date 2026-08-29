# AI 玩家（第三种：大模型 + Mineflayer）

网页玩家在 mc.cq.je 进同一个世界会看见 `AiQing`。

## 启动

```bash
cd ai-player
cp .env.example .env
# 填 AI_API_KEY
set -a && source .env && set +a
npm install
node index.mjs
```

机器人必须能连到游戏服 **Java 端口 25565**（不要连 wss://mc.cq.je）。
Docker 若没映射 25565，需要加 `127.0.0.1:25565:25565`，或把这个进程放进同一个 compose 网络。

默认 API 走 DeepSeek，可改成任何兼容 OpenAI 格式的地址。

游戏里聊天：过来 / 跟着我 / 停
没有 API Key 时只走这三条命令，不调模型。
