# AI 玩家

速度：「过来 / 跟着我 / 停」当帧执行，不等模型。模型 4 秒超时，2.5 秒限流，最多 80 token。
能力：走到你身边、跟随、停、看你、跳一下、报背包；被叫名才闲聊。

```bash
cd ai-player
cp .env.example .env   # 填 AI_API_KEY
npm install
set -a && source .env && set +a && node index.mjs
```
