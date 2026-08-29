/**
 * Eaglercraft 中文聊天
 * 游戏自带聊天框不吃输入法，用网页输入框收字，再模拟键入游戏。
 */
(function () {
  if (window.__mcCnChat) return;
  window.__mcCnChat = true;

  var style = document.createElement("style");
  style.textContent =
    "#mc-cn{position:fixed;left:50%;bottom:max(12px,env(safe-area-inset-bottom));" +
    "transform:translateX(-50%);z-index:1000000;display:flex;gap:8px;" +
    "width:min(560px,calc(100vw - 24px));pointer-events:auto}" +
    "#mc-cn input{flex:1;height:44px;border:0;border-radius:12px;padding:0 12px;" +
    "font-size:16px;background:rgba(0,0,0,.72);color:#fff;outline:none}" +
    "#mc-cn button{height:44px;padding:0 14px;border:0;border-radius:12px;" +
    "background:#3d8;color:#111;font-weight:700}";
  document.documentElement.appendChild(style);

  var box = document.createElement("div");
  box.id = "mc-cn";
  box.innerHTML = '<input id="mc-cn-in" type="text" lang="zh-CN" autocomplete="off" autocorrect="off" placeholder="这里打中文，回车发送"><button type="button" id="mc-cn-send">发送</button>';
  document.documentElement.appendChild(box);

  var input = document.getElementById("mc-cn-in");
  var sendBtn = document.getElementById("mc-cn-send");

  function fireKey(target, type, def) {
    var ev = new KeyboardEvent(type, {
      key: def.key,
      code: def.code,
      keyCode: def.keyCode,
      which: def.keyCode,
      bubbles: true,
      cancelable: true
    });
    try { Object.defineProperty(ev, "keyCode", { get: function () { return def.keyCode; } }); } catch (e) {}
    target.dispatchEvent(ev);
  }

  function targets() {
    var list = [window, document];
    var c = document.querySelector("canvas");
    if (c) list.push(c);
    return list;
  }

  function key(def) {
    targets().forEach(function (t) {
      fireKey(t, "keydown", def);
      fireKey(t, "keyup", def);
    });
  }

  function typeChar(ch) {
    var code = ch.charCodeAt(0);
    targets().forEach(function (t) {
      var ev = new KeyboardEvent("keypress", {
        key: ch,
        charCode: code,
        which: code,
        keyCode: code,
        bubbles: true,
        cancelable: true
      });
      try {
        Object.defineProperty(ev, "charCode", { get: function () { return code; } });
        Object.defineProperty(ev, "which", { get: function () { return code; } });
      } catch (e) {}
      t.dispatchEvent(ev);
      try {
        t.dispatchEvent(new InputEvent("beforeinput", {
          bubbles: true,
          cancelable: true,
          inputType: "insertText",
          data: ch
        }));
      } catch (e2) {}
    });
  }

  function send(text) {
    text = String(text || "").trim();
    if (!text) return;
    input.blur();
    var T = { key: "t", code: "KeyT", keyCode: 84 };
    var ENTER = { key: "Enter", code: "Enter", keyCode: 13 };
    key(T);
    setTimeout(function () {
      for (var i = 0; i < text.length; i++) typeChar(text.charAt(i));
      setTimeout(function () { key(ENTER); }, 40);
    }, 80);
  }

  function go() {
    send(input.value);
    input.value = "";
  }

  sendBtn.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();
    go();
  });
  input.addEventListener("keydown", function (e) {
    e.stopPropagation();
    if (e.key === "Enter") {
      e.preventDefault();
      go();
    }
  });
  input.addEventListener("keyup", function (e) { e.stopPropagation(); });
  input.addEventListener("keypress", function (e) { e.stopPropagation(); });
  ["pointerdown", "pointerup", "touchstart"].forEach(function (n) {
    box.addEventListener(n, function (e) { e.stopPropagation(); }, true);
  });
})();
