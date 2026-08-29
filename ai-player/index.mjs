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

const SYSTEM = `\u4f60\u662f MC AI ${USER}\u3002\u53ea\u8f93\u51fa JSON\uff1a{"say":"\u226440\u5b57","action":"chat|come|follow|stop|look|jump|inv"}\ncome=\u8d70\u5230\u5bf9\u65b9 follow=\u8ddf\u968f stop=\u505c look=\u770b\u5411\u4ed6 jump=\u8df3 inv=\u62a5\u80cc\u5305`;

let following = null;
let lastAi = 0;
let pendingAi = false;
const mem = [];
let bot;

function chat(text) {
  if (!text) return;
  try { bot.chat(String(text).slice(0, 40)); } catch (e) {}
}

function named(msg) {
  return new RegExp(USER, "i").test(msg);
}

function parseIntent(message) {
  const m = String(message || "");
  if (/\u505c\u4e0b|\u505c\u6b62|\u522b\u8ddf|\u522b\u8d70|stop/i.test(m)) return "stop";
  if (/\u8ddf\u7740|\u8ddf\u6211|follow/i.test(m)) return "follow";
  if (/\u8fc7\u6765|\u6765\u8fd9|\u6765\u6211\u8fd9|come/i.test(m)) return "come";
  if (/\u770b\u6211|\u770b\u8fd9|look/i.test(m)) return "look";
  if (/\u8df3/i.test(m)) return "jump";
  if (/\u80cc\u5305|\u4f60\u6709\u4ec0\u4e48/i.test(m)) return "inv";
  return null;
}

function playerEnt(name) {
  return bot.players[name]?.entity || null;
}

function setupMove() {
  const mv = new Movements(bot, bot.registry);
  mv.allowSprinting = true;
  bot.pathfinder.setMovements(mv);
}

function walkTo(playerName, follow) {
  const p = playerEnt(playerName);
  if (!p) { chat("\u627e\u4e0d\u5230\u4f60"); return; }
  const d = bot.entity.position.distanceTo(p.position);
  if (d > 72) { chat("\u592a\u8fdc\u4e86"); return; }
  following = follow ? playerName : null;
  setupMove();
  bot.pathfinder.setGoal(new goals.GoalFollow(p, follow ? 2.5 : 1.8), follow);
}

function stopWalk() {
  following = null;
  bot.pathfinder.setGoal(null);
}

function lookAt(name) {
  const p = playerEnt(name);
  if (!p) return;
  bot.lookAt(p.position.offset(0, 1.6, 0)).catch(() => {});
}

function jumpOnce() {
  bot.setControlState("jump", true);
  setTimeout(() => bot.setControlState("jump", false), 350);
}

function invSay() {
  const items = bot.inventory.items();
  if (!items.length) { chat("\u80cc\u5305\u662f\u7a7a\u7684"); return; }
  chat(items.slice(0, 5).map((i) => i.name.replace("minecraft:", "") + i.count).join(","));
}

function doAction(action, username) {
  if (action === "come") walkTo(username, false);
  else if (action === "follow") walkTo(username, true);
  else if (action === "stop") stopWalk();
  else if (action === "look") lookAt(username);
  else if (action === "jump") jumpOnce();
  else if (action === "inv") invSay();
}

async function think(username, message) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 4000);
  try {
    const res = await fetch(AI_BASE + "/chat/completions", {
      method: "POST",
      signal: ctrl.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + AI_KEY
      },
      body: JSON.stringify({
        model: AI_MODEL,
        temperature: 0.2,
        max_tokens: 80,
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: mem.slice(-4).join("\n") + "\n" + username + ":" + message }
        ]
      })
    });
    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content || "";
    const json = raw.match(/\{[\s\S]*\}/);
    if (!json) return null;
    return JSON.parse(json[0]);
  } catch (e) {
    return null;
  } finally {
    clearTimeout(t);
  }
}

async function handle(username, message) {
  if (!bot.username || username === bot.username) return;
  mem.push(username + ":" + message);
  if (mem.length > 8) mem.shift();

  const intent = parseIntent(message);
  const talkToMe = named(message) || intent;
  if (!talkToMe) return;

  if (intent) {
    doAction(intent, username);
    const quick = { come: "\u6765\u4e86", follow: "\u8ddf\u4f60", stop: "\u505c\u4e86", look: "\u5728\u770b", jump: "\u8df3", inv: "" };
    if (quick[intent]) chat(quick[intent]);
  }

  if (!AI_KEY) return;
  if (intent && !named(message)) return;
  const now = Date.now();
  if (pendingAi || now - lastAi < 2500) return;
  pendingAi = true;
  lastAi = now;
  try {
    const out = await think(username, message);
    if (!out) return;
    if (out.say && !intent) chat(out.say);
    if (!intent && out.action && out.action !== "chat") doAction(out.action, username);
  } finally {
    pendingAi = false;
  }
}

bot = mineflayer.createBot({
  host: HOST,
  port: PORT,
  username: USER,
  version: VERSION,
  auth: "offline",
  hideErrors: true,
  checkTimeoutInterval: 30000
});

bot.loadPlugin(pathfinder);

bot.once("spawn", () => {
  console.log("AI online", USER, HOST + ":" + PORT);
  chat("\u5728");
});

bot.on("chat", (username, message) => {
  handle(username, message).catch(() => {});
});

bot.on("physicTick", () => {
  if (!following) return;
  const p = playerEnt(following);
  if (!p) return;
  if (bot.entity.position.distanceTo(p.position) > 80) stopWalk();
});

bot.on("error", (e) => console.error("error", e.message || e));
bot.on("kicked", (r) => console.error("kicked", r));
bot.on("end", () => setTimeout(() => process.exit(1), 4000));
