import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import session from "express-session";
import bcrypt from "bcryptjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.join(__dirname, "users.json");
const GAME_URL = process.env.GAME_URL || "https://mc.cq.je/";
const PORT = Number(process.env.PORT || 3099);

function loadUsers() {
  if (!fs.existsSync(DATA)) return [];
  try { return JSON.parse(fs.readFileSync(DATA, "utf8")); } catch { return []; }
}
function saveUsers(list) {
  fs.writeFileSync(DATA, JSON.stringify(list, null, 2));
}
function validName(s) {
  return /^[A-Za-z0-9_]{3,16}$/.test(s || "");
}

const app = express();
app.set("trust proxy", 1);
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(session({
  name: "mc_sid",
  secret: process.env.SESSION_SECRET || "change-me-mc-cq-je",
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 * 30, sameSite: "lax", httpOnly: true, secure: true }
}));
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/me", (req, res) => {
  if (!req.session.user) return res.json({ ok: false });
  res.json({ ok: true, user: req.session.user });
});

app.post("/api/register", async (req, res) => {
  const user = String(req.body.user || "").trim();
  const pass = String(req.body.pass || "");
  if (!validName(user)) return res.status(400).json({ ok: false, msg: "用户名只能 3–16 位字母数字下划线" });
  if (pass.length < 6) return res.status(400).json({ ok: false, msg: "密码至少 6 位" });
  const list = loadUsers();
  if (list.some((u) => u.user.toLowerCase() === user.toLowerCase())) {
    return res.status(400).json({ ok: false, msg: "这个用户名已被注册" });
  }
  list.push({ user, pass: await bcrypt.hash(pass, 10), created: Date.now() });
  saveUsers(list);
  req.session.user = user;
  res.json({ ok: true, user, game: GAME_URL });
});

app.post("/api/login", async (req, res) => {
  const user = String(req.body.user || "").trim();
  const pass = String(req.body.pass || "");
  const row = loadUsers().find((u) => u.user.toLowerCase() === user.toLowerCase());
  if (!row || !(await bcrypt.compare(pass, row.pass))) {
    return res.status(400).json({ ok: false, msg: "用户名或密码错误" });
  }
  req.session.user = row.user;
  res.json({ ok: true, user: row.user, game: GAME_URL });
});

app.post("/api/logout", (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.listen(PORT, "127.0.0.1", () => {
  console.log("auth on 127.0.0.1:" + PORT);
});
