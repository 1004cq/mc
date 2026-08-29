import mineflayer from "mineflayer";
import pkg from "mineflayer-pathfinder";
const { pathfinder, Movements, goals } = pkg;

const HOST = process.env.MC_HOST || "127.0.0.1";
const PORT = Number(process.env.MC_PORT || 25565);
const USER = process.env.MC_USER || "AiQing";
const VERSION = process.env.MC_VERSION || "1.8.8";
const AI_BASE = (process.env.AI_BASE_URL || "https://api.deepseek.com/v1").replace(/\/$/, "");
const AI_KEY = process.env.AI_API_KEY || "";
const AI_MODEL = process.env.AI_MODEL || "deepseek-chat";

const SYSTEM = `\u4f60\u662f\u6211\u7684\u4e16\u754c\u91cc\u7684 AI \u73a9\u5bb6\uff0c\u540d\u5b57 ${USER}\uff0c\u7528\u7b80\u4f53\u4e2d\u6587\u77ed\u53e5\u56de\u590d\u3002\n\u53ea\u80fd\u8f93\u51fa\u4e00\u6bb5 JSON\uff0c\u4e0d\u8981 markdown\u3002\u683c\u5f0f\uff1a\n{"say":"\u5bf9\u73a9\u5bb6\u8bf4\u7684\u8bdd","action":"idle|follow|stop|come|chat"}\n\n\u89c4\u5219\uff1a\n- come/follow\uff1a\u8d70\u5230\u6216\u8ddf\u968f\u53d1\u8a00\u73a9\u5bb6\n- stop\uff1a\u505c\u4e0b\n- chat/idle\uff1a\u53ea\u8bf4\u8bdd\u4e0d\u8d70\n- say \u63a7\u5236\u5728 40 \u5b57\u4ee5\u5185`};

let following = null;
let bot;

function chat(text) {
  if (!text) return;
  const t = String(text).slice(0, 80);
  try { bot.chat(t); } catch (e) {}
}

async function think(username, message) {
  if (!AI_KEY) {
    return rule(username, message);
  }
  try {
    const res = await fetch(AI_BASE + "/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + AI_KEY
      },
      body: JSON.stringify({
        model: AI_MODEL,
        temperature: 0.4,
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: username + "\u8bf4\uff1a" + message }
        ]
      })
    });
    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content || "";
    const json = raw.match(/\{[\s\S]*\}/);
    if (!json) return rule(username, message);
    return JSON.parse(json[0]);
  } catch (e) {
    console.error("AI", e.message || e);
    return rule(username, message);
  }
}

function rule(username, message) {
  const m = message.trim();
  if (/\u8fc7\u6765|\u6765\u8fd9|come|\u8ddf/i.test(m)) return { say: "\u6765\u4e86", action: "come" };
  if (/\u8ddf\u7740|follow/i.test(m)) return { say: "\u6211\u8ddf\u4f60", action: "follow" };
  if (/\u505c|stop|\u522b\u8ddf/i.test(m)) return { say: "\u597d", action: "stop" };
  return { say: "\u6536\u5230\u3002\u53ef\u4ee5\u8bf4\u300c\u8fc7\u6765\u300d\u300c\u8ddf\u7740\u6211\u300d\u300c\u505c\u300d", action: "chat" };
}

function walkTo(playerName, follow) {
  const p = bot.players[playerName]?.entity;
  if (!p) {
    chat("\u627e\u4e0d\u5230\u4f60");
    return;
  }
  following = follow ? playerName : null;
  const mcData = bot.registry;
  bot.pathfinder.setMovements(new Movements(bot, mcData));
  bot.pathfinder.setGoal(new goals.GoalFollow(p, 2), follow);
}

function stopWalk() {
  following = null;
  bot.pathfinder.setGoal(null);
}

async function handle(username, message) {
  if (username === bot.username) return;
  const out = await think(username, message);
  if (out.say) chat(out.say);
  if (out.action === "come") walkTo(username, false);
  else if (out.action === "follow") walkTo(username, true);
  else if (out.action === "stop") stopWalk();
}

bot = mineflayer.createBot({
  host: HOST,
  port: PORT,
  username: USER,
  version: VERSION,
  auth: "offline"
});

bot.loadPlugin(pathfinder);

bot.once("spawn", () => {
  console.log("AI \u5df2\u8fdb\u670d", USER, HOST + ":" + PORT);
  chat("AI \u5728\u7ebf，\u8bf4\u300c\u8fc7\u6765\u300d\u300c\u8ddf\u7740\u6211\u300d\u300c\u505c\u300d");
});

bot.on("chat", (username, message) => {
  handle(username, message).catch((e) => console.error(e));
});

bot.on("error", (e) => console.error("error", e.message || e));
bot.on("kicked", (r) => console.error("kicked", r));
bot.on("end", () => {
  console.log("\u6389\u7ebf\uff0c5 \u79d2\u540e\u91cd\u8fde");
  setTimeout(() => process.exit(1), 5000);
});
