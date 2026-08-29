(function () {
  if (window.__mcCnChat) return;
  window.__mcCnChat = true;

  var style = document.createElement("style");
  style.textContent =
    "#mc-cn{position:fixed;left:8px;right:8px;bottom:max(10px,env(safe-area-inset-bottom));" +
    "z-index:2147483647;display:flex;gap:8px;pointer-events:auto}" +
    "#mc-cn input{flex:1;height:46px;border:0;border-radius:12px;padding:0 12px;" +
    "font-size:16px;background:#111;color:#fff;outline:none;-webkit-user-select:text}" +
    "#mc-cn button{height:46px;padding:0 16px;border:0;border-radius:12px;" +
    "background:#3d8;color:#111;font-weight:700;flex-shrink:0}";
  document.documentElement.appendChild(style);

  var box = document.createElement("div");
  box.id = "mc-cn";
  box.innerHTML = '<input id="mc-cn-in" type="text" inputmode="text" lang="zh-CN" placeholder="这里打中文，不要用游戏聊天框"><button type="button" id="mc-cn-send">发送</button>';
  document.documentElement.appendChild(box);

  var input = document.getElementById("mc-cn-in");
  var btn = document.getElementById("mc-cn-send");

  function uname() {
    try {
      return localStorage.getItem("mc_user") || "ipad";
    } catch (e) {
      return "ipad";
    }
  }

  async function send() {
    var text = (input.value || "").trim();
    if (!text) return;
    btn.disabled = true;
    try {
      var res = await fetch("/api/mc-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user: uname(), text: text })
      });
      if (!res.ok) throw new Error("bad");
      input.value = "";
    } catch (e) {
      input.placeholder = "发送失败，检查 /api/mc-chat";
    }
    btn.disabled = false;
    input.focus();
  }

  btn.onclick = function (e) {
    e.preventDefault();
    e.stopPropagation();
    send();
  };
  input.addEventListener("keydown", function (e) {
    e.stopPropagation();
    if (e.key === "Enter") {
      e.preventDefault();
      send();
    }
  });
  ["keyup", "keypress", "pointerdown", "touchstart"].forEach(function (n) {
    box.addEventListener(n, function (e) { e.stopPropagation(); }, true);
  });
})();
