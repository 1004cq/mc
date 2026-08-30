/**
 * mc.cq.je — 触屏中文聊天（默认收起，少挡快捷栏）
 * 点右下角「中文」或游戏聊天气泡 → 展开输入框
 */
(function () {
  "use strict";
  if (window.__mcCnChat) return;
  window.__mcCnChat = true;

  var wrap, panel, toggleBtn, input, sendBtn, closeBtn, statusEl;
  var expanded = false;
  var composing = false;
  var sending = false;
  var chatHooked = false;

  function isTouchDevice() {
    if (window.matchMedia && window.matchMedia("(pointer: coarse)").matches) return true;
    if (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) return true;
    return /iPad|iPhone|iPod|Android|Mobile/i.test(navigator.userAgent || "");
  }

  if (!isTouchDevice()) return;

  function uname() {
    if (window.__MC_USERNAME) return window.__MC_USERNAME;
    try {
      return localStorage.getItem("mc_user") || "player";
    } catch (e) {
      return "player";
    }
  }

  function setStatus(msg, err) {
    if (!statusEl) return;
    statusEl.textContent = msg || "";
    statusEl.style.color = err ? "#ffb4b4" : "#aaa";
  }

  function fireKey(type, key, code) {
    var opts = { key: key, code: code, keyCode: code, which: code, bubbles: true, cancelable: true };
    [window, document, document.body, document.querySelector("canvas")].forEach(function (t) {
      if (t) t.dispatchEvent(new KeyboardEvent(type, opts));
    });
  }

  function closeGameChat() {
    fireKey("keydown", "Escape", 27);
    fireKey("keyup", "Escape", 27);
  }

  function focusOurInput() {
    if (!input) return;
    setTimeout(function () {
      try {
        input.focus({ preventScroll: true });
      } catch (e) {
        input.focus();
      }
    }, 100);
  }

  function expand() {
    expanded = true;
    if (panel) panel.classList.add("open");
    if (toggleBtn) toggleBtn.classList.add("open");
  }

  function collapse() {
    expanded = false;
    if (panel) panel.classList.remove("open");
    if (toggleBtn) toggleBtn.classList.remove("open");
    if (input) input.blur();
    setStatus("", false);
  }

  function onGameChatRequested() {
    closeGameChat();
    expand();
    focusOurInput();
  }

  function sendMessage() {
    if (!input || composing || sending) return;
    var text = (input.value || "").replace(/\r?\n/g, " ").trim();
    if (!text) {
      focusOurInput();
      return;
    }

    sending = true;
    sendBtn.disabled = true;
    setStatus("发送中…", false);

    fetch("/api/mc-chat", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user: uname(), text: text })
    })
      .then(function (res) {
        if (!res.ok) throw new Error("http " + res.status);
        return res.text();
      })
      .then(function () {
        input.value = "";
        setStatus("已发送", false);
        setTimeout(collapse, 800);
      })
      .catch(function (e) {
        setStatus("发送失败", true);
        console.error("[cn-chat]", e.message || e);
      })
      .finally(function () {
        sending = false;
        sendBtn.disabled = false;
      });
  }

  function stopToGame(e) {
    e.stopPropagation();
    e.stopImmediatePropagation();
  }

  function buildUi() {
    if (wrap) return;

    var style = document.createElement("style");
    style.textContent =
      "#mc-cn-wrap{position:fixed;z-index:2147483647;pointer-events:none;touch-action:manipulation}" +
      "#mc-cn-toggle{position:fixed;right:12px;bottom:max(12px,env(safe-area-inset-bottom));" +
      "pointer-events:auto;height:40px;padding:0 14px;border:0;border-radius:20px;" +
      "background:rgba(0,0,0,0.55);color:#fff;font:15px/1 -apple-system,sans-serif;font-weight:600;" +
      "box-shadow:0 2px 8px rgba(0,0,0,0.35)}" +
      "#mc-cn-toggle.open{display:none}" +
      "#mc-cn-panel{position:fixed;left:10px;right:10px;" +
      "bottom:max(72px,calc(12px + env(safe-area-inset-bottom) + 56px));" +
      "display:none;flex-direction:column;gap:4px;pointer-events:auto;" +
      "background:rgba(0,0,0,0.72);border-radius:12px;padding:8px 10px;" +
      "box-shadow:0 4px 16px rgba(0,0,0,0.4)}" +
      "#mc-cn-panel.open{display:flex}" +
      "#mc-cn-panel .row{display:flex;gap:6px;align-items:center}" +
      "#mc-cn-panel input{flex:1;height:42px;border:0;border-radius:10px;padding:0 12px;" +
      "font-size:16px;background:#fff;color:#111;outline:none;-webkit-user-select:text}" +
      "#mc-cn-panel .send{height:42px;padding:0 14px;border:0;border-radius:10px;" +
      "background:#3d8bfd;color:#fff;font-size:16px;font-weight:700;flex-shrink:0}" +
      "#mc-cn-panel .close{height:42px;padding:0 10px;border:0;border-radius:10px;" +
      "background:rgba(255,255,255,0.15);color:#fff;font-size:14px;flex-shrink:0}" +
      "#mc-cn-status{font:12px/1.3 -apple-system,sans-serif;color:#aaa;min-height:12px;padding:0 2px}";
    document.documentElement.appendChild(style);

    wrap = document.createElement("div");
    wrap.id = "mc-cn-wrap";

    toggleBtn = document.createElement("button");
    toggleBtn.id = "mc-cn-toggle";
    toggleBtn.type = "button";
    toggleBtn.textContent = "中文";

    panel = document.createElement("div");
    panel.id = "mc-cn-panel";

    var row = document.createElement("div");
    row.className = "row";

    input = document.createElement("input");
    input.type = "text";
    input.lang = "zh-CN";
    input.inputMode = "text";
    input.enterKeyHint = "send";
    input.autocomplete = "off";
    input.autocorrect = "off";
    input.autocapitalize = "off";
    input.spellcheck = false;
    input.placeholder = "这里打中文";

    sendBtn = document.createElement("button");
    sendBtn.type = "button";
    sendBtn.className = "send";
    sendBtn.textContent = "发送";

    closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "close";
    closeBtn.textContent = "收起";

    statusEl = document.createElement("div");
    statusEl.id = "mc-cn-status";

    [panel, toggleBtn].forEach(function (el) {
      ["touchstart", "touchmove", "touchend", "mousedown", "mouseup", "pointerdown", "pointerup", "click"].forEach(function (ev) {
        el.addEventListener(ev, stopToGame, true);
      });
    });

    input.addEventListener("keydown", function (e) {
      e.stopPropagation();
      if (composing) return;
      if (e.key === "Enter") {
        e.preventDefault();
        sendMessage();
      }
    }, true);
    input.addEventListener("keyup", function (e) { e.stopPropagation(); }, true);
    input.addEventListener("compositionstart", function () { composing = true; });
    input.addEventListener("compositionend", function () { composing = false; });

    toggleBtn.addEventListener("click", function (e) {
      e.preventDefault();
      expand();
      focusOurInput();
    });

    sendBtn.addEventListener("click", function (e) {
      e.preventDefault();
      sendMessage();
    });

    closeBtn.addEventListener("click", function (e) {
      e.preventDefault();
      collapse();
    });

    row.appendChild(input);
    row.appendChild(sendBtn);
    row.appendChild(closeBtn);
    panel.appendChild(row);
    panel.appendChild(statusEl);
    wrap.appendChild(toggleBtn);
    wrap.appendChild(panel);
    document.documentElement.appendChild(wrap);
  }

  function hookGameChat() {
    if (chatHooked) return;
    chatHooked = true;

    var prev = window.__mcScreenChanged;
    window.__mcScreenChanged = function (screenName) {
      if (screenName === "GuiChat") onGameChatRequested();
      if (typeof prev === "function") prev(screenName);
    };

    var obs = new MutationObserver(function () {
      var nodes = document.querySelectorAll("button,div,span,a");
      for (var i = 0; i < nodes.length; i++) {
        var t = (nodes[i].textContent || "").trim();
        if (t === "Exit Chat" || t === "退出聊天") {
          onGameChatRequested();
          return;
        }
      }
    });
    obs.observe(document.documentElement, { childList: true, subtree: true, characterData: true });

    document.addEventListener("keydown", function (e) {
      if (e.target === input) return;
      if (e.key === "t" || e.key === "T") {
        e.stopImmediatePropagation();
        e.preventDefault();
        onGameChatRequested();
      }
    }, true);
  }

  function init() {
    buildUi();
    hookGameChat();
    showGuiHintOnce();
  }

  function showGuiHintOnce() {
    try {
      if (sessionStorage.getItem("mc_gui_hint_shown")) return;
      sessionStorage.setItem("mc_gui_hint_shown", "1");
    } catch (e) {
      return;
    }
    var hint = document.createElement("div");
    hint.textContent = "键位太大：暂停→选项→视频→GUI规模改为1";
    hint.style.cssText =
      "position:fixed;left:8%;right:8%;top:12%;z-index:2147482000;" +
      "padding:10px 14px;border-radius:10px;background:rgba(0,0,0,0.75);color:#fff;" +
      "text-align:center;font:15px/1.4 -apple-system,sans-serif;pointer-events:none;" +
      "opacity:1;transition:opacity 1s ease";
    document.documentElement.appendChild(hint);
    setTimeout(function () { hint.style.opacity = "0"; }, 6000);
    setTimeout(function () { if (hint.parentNode) hint.parentNode.removeChild(hint); }, 7500);
  }

  if (document.body) init();
  else document.addEventListener("DOMContentLoaded", init);
})();
