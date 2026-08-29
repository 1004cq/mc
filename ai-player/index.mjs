import mineflayer from "mineflayer";
import pkg from "mineflayer-pathfinder";
import { Vec3 } from "vec3";
import { startChatRelay } from "./chat-relay.mjs";
import { setHolo, tickHolo, spawnHolo } from "./holo.mjs";
const { pathfinder, Movements, goals } = pkg;

const HOST = process.env.MC_HOST || "127.0.0.1";
const PORT = Number(process.env.MC_PORT || 25565);
const USER = process.env.MC_USER || "AiQing";
const VERSION = process.env.MC_VERSION || "1.8.8";
const AI_BASE = (process.env.AI_BASE_URL || "https://api.deepseek.com/v1").replace(/\/$/, "");
const AI_KEY = process.env.AI_API_KEY || "";
const AI_MODEL = process.env.AI_MODEL || "deepseek-chat";

const SYSTEM = `你是 MC AI ${USER}。只输出 JSON：{"say":"≤40字","action":"chat|come|follow|stop|look|jump|inv|build"}`;

const BLOCK_OK = /planks|wood|log|cobble|dirt|stone|brick|wool|glass/;

let following = null;
let lastAi = 0;
let pendingAi = false;
let building = false;
const mem = [];
let bot;

function chat(text) {
  if (!text) return;
  try { bot.chat(String(text).slice(0, 40)); } catch (e) {}
}

function parseIntent(message) {
  const m = String(message || "");
  if (/停下|停止|停一停|站住|别跟|不要跟|别走|stop/i.test(m)) return "stop";
  if (/跟着我|跟我|一直跟|follow/i.test(m)) return "follow";
  if (/过来|回来|来这|来我这|到我身边|come/i.test(m)) return "come";
  if (/看我|看这|look/i.test(m)) return "look";
  if (/跳一下|跳起来/.test(m) || (/^跳$/.test(m.trim()))) return "jump";
  if (/背包|你有什么/i.test(m)) return "inv";
  if (/建房|盖房|建个房|建屋|建房子|build/i.test(m)) return "build";
  return null;
}

function playerEnt(name) {
  return bot.players[name]?.entity || null;
}

function nearestPlayer() {
  let best = null;
  let bestD = 1e9;
  for (const n of Object.keys(bot.players)) {
    if (n === bot.username) continue;
    const e = bot.players[n]?.entity;
    if (!e) continue;
    const d = bot.entity.position.distanceTo(e.position);
    if (d < bestD) { bestD = d; best = n; }
  }
  return best;
}

function setupMove() {
  const mv = new Movements(bot, bot.registry);
  mv.allowSprinting = true;
  bot.pathfinder.setMovements(mv);
}

function walkTo(playerName, follow) {
  const p = playerEnt(playerName);
  if (!p) { chat("找不到你"); return; }
  const d = bot.entity.position.distanceTo(p.position);
  if (d > 72) { chat("太远了"); return; }
  following = follow ? playerName : null;
  setHolo(follow ? "跟随中" : "过来");
  setupMove();
  bot.pathfinder.setGoal(new goals.GoalFollow(p, follow ? 2.5 : 1.8), follow);
  if (!follow) {
    setTimeout(() => {
      if (!following) {
        bot.pathfinder.setGoal(null);
        setHolo("空闲");
      }
    }, 8000);
  }
}

function stopWalk() {
  following = null;
  building = false;
  setHolo("空闲");
  try { bot.pathfinder.setGoal(null); } catch (e) {}
  bot.clearControlStates();
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
  if (!items.length) { chat("背包是空的"); return; }
  chat(items.slice(0, 5).map((i) => i.name.replace("minecraft:", "") + i.count).join(","));
}

function countBlocks() {
  return bot.inventory.items().reduce((n, i) => n + (BLOCK_OK.test(i.name) ? i.count : 0), 0);
}

function pickBlock() {
  return bot.inventory.items().find((i) => BLOCK_OK.test(i.name)) || null;
}

function houseOffsets() {
  const list = [];
  for (let x = 0; x <= 4; x++) {
    for (let z = 0; z <= 4; z++) list.push(new Vec3(x, 0, z));
  }
  for (let y = 1; y <= 2; y++) {
    for (let x = 0; x <= 4; x++) {
      for (let z = 0; z <= 4; z++) {
        const wall = x === 0 || x === 4 || z === 0 || z === 4;
        const door = y <= 2 && x === 2 && z === 0;
        if (wall && !door) list.push(new Vec3(x, y, z));
      }
    }
  }
  for (let x = 0; x <= 4; x++) {
    for (let z = 0; z <= 4; z++) list.push(new Vec3(x, 3, z));
  }
  return list;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function placeAt(pos) {
  const cur = bot.blockAt(pos);
  if (cur && cur.name !== "air" && cur.boundingBox !== "empty") return true;
  const item = pickBlock();
  if (!item) return false;
  try { await bot.equip(item, "hand"); } catch (e) { return false; }
  const faces = [[0, -1, 0], [0, 1, 0], [1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1]];
  for (const [fx, fy, fz] of faces) {
    const ref = bot.blockAt(pos.offset(fx, fy, fz));
    if (!ref || ref.name === "air" || ref.boundingBox === "empty") continue;
    try {
      await bot.placeBlock(ref, new Vec3(-fx, -fy, -fz));
      return true;
    } catch (e) {}
  }
  return false;
}

async function buildHouse(username) {
  if (building) { chat("正在盖"); return; }
  stopWalk();
  const p = playerEnt(username);
  if (!p) { chat("找不到你"); return; }
  if (countBlocks() < 28) {
    chat("方块不够 28 个，先给我木板或圆石");
    return;
  }
  building = true;
  setHolo("盖房中");
  const origin = p.position.offset(3, 0, 3).floored();
  origin.y = Math.floor(p.position.y);
  chat("开始盖房");
  try {
    setupMove();
    await bot.pathfinder.goto(new goals.GoalNear(origin.x + 2, origin.y, origin.z + 2, 3));
    for (const off of houseOffsets()) {
      if (!building) break;
      if (countBlocks() < 1) { chat("方块用完了"); break; }
      const pos = origin.plus(off);
      await bot.pathfinder.goto(new goals.GoalNear(pos.x, pos.y, pos.z, 3)).catch(() => {});
      await placeAt(pos);
      await sleep(180);
    }
    chat("房子盖好了");
  } catch (e) {
    chat("盖不了");
    console.error("build", e.message || e);
  } finally {
    building = false;
    setHolo("空闲");
    bot.pathfinder.setGoal(null);
  }
}

function doAction(action, username) {
  const who = playerEnt(username) ? username : nearestPlayer();
  if (!who && action !== "stop" && action !== "jump" && action !== "inv") {
    chat("找不到玩家");
    return;
  }
  if (action !== "follow") stopWalk();
  if (action === "come") walkTo(who, false);
  else if (action === "follow") walkTo(who, true);
  else if (action === "stop") { chat("停了"); }
  else if (action === "look") lookAt(who);
  else if (action === "jump") jumpOnce();
  else if (action === "inv") invSay();
  else if (action === "build") buildHouse(who).catch(() => {});
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
        temperature: 0.1,
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
  if (intent) {
    doAction(intent, username);
    const quick = { come: "来了", follow: "跟你", look: "在看", jump: "跳" };
    if (quick[intent]) chat(quick[intent]);
    return;
  }

  if (!AI_KEY) return;
  const now = Date.now();
  if (pendingAi || now - lastAi < 2500) return;
  pendingAi = true;
  lastAi = now;
  try {
    const out = await think(username, message);
    if (!out) return;
    if (out.say) chat(out.say);
    if (out.action && out.action !== "chat" && out.action !== "follow") {
      doAction(out.action, username);
    }
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
  startChatRelay(bot, handle);
  setHolo("空闲");
  spawnHolo(bot);
  chat("在。说停、过来、建房");
});

bot.on("chat", (username, message) => {
  handle(username, message).catch(() => {});
});

bot.on("physicTick", () => {
  tickHolo(bot);
  if (!following) return;
  const p = playerEnt(following);
  if (!p) return;
  if (bot.entity.position.distanceTo(p.position) > 80) stopWalk();
});

bot.on("error", (e) => console.error("error", e.message || e));
bot.on("kicked", (r) => console.error("kicked", r));
bot.on("end", () => setTimeout(() => process.exit(1), 4000));
