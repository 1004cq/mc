import http from "http";

export function startChatRelay(bot, port) {
  const p = Number(port || process.env.CHAT_PORT || 3101);
  const srv = http.createServer((req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") { res.writeHead(204); res.end(); return; }
    if (req.method !== "POST" || req.url !== "/chat") {
      res.writeHead(404); res.end("no"); return;
    }
    let raw = "";
    req.on("data", (c) => { raw += c; if (raw.length > 2000) req.destroy(); });
    req.on("end", () => {
      let data = {};
      try { data = JSON.parse(raw || "{}"); } catch (e) {}
      const user = String(data.user || "player").replace(/[^\w\u4e00-\u9fff]/g, "").slice(0, 16) || "player";
      const text = String(data.text || "").replace(/["\\]/g, "").slice(0, 80);
      if (!text) { res.writeHead(400); res.end("empty"); return; }
      try {
        bot.chat("/tellraw @a {\"text\":\"<" + user + "> " + text + "\"}");
      } catch (e) {
        try { bot.chat("[" + user + "] " + text); } catch (e2) {}
      }
      res.writeHead(200); res.end("ok");
    });
  });
  srv.listen(p, "127.0.0.1", () => console.log("chat-relay 127.0.0.1:" + p));
}
