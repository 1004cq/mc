/**
 * EaglercraftX 1.8.8 手机触控（mc.cq.je）
 * 左半屏按下 → 手指处浮现圆形摇杆（W/A/S/D + Shift 疾跑），松手消失
 * 右半屏滑动 → 转视角
 * 无「跳」按钮；与游戏自带灰色方向键分离（配合 remember-user 隐藏自带触控）
 */
(function () {
  "use strict";
  if (window.__mcJoy) return;

  var LOOK_SENS = 1.85;
  var JOY_SIZE = 140;
  var KNOB_SIZE = 62;
  var RADIUS = 48;
  var DEAD = 0.10;
  var SPRINT = 0.78;
  var AXIS = 0.17;
  var LOOK_SPLIT = 0.50;

  var KEYS = {
    w: { key: "w", code: "KeyW", keyCode: 87 },
    a: { key: "a", code: "KeyA", keyCode: 65 },
    s: { key: "s", code: "KeyS", keyCode: 83 },
    d: { key: "d", code: "KeyD", keyCode: 68 },
    shift: { key: "Shift", code: "ShiftLeft", keyCode: 16 },
    f5: { key: "F5", code: "F5", keyCode: 116 }
  };

  var held = {};
  var stick = { x: 0, y: 0 };
  var joyDragging = false;
  var joyPointerId = null;
  var joyCenterX = 0;
  var joyCenterY = 0;

  var lookPointerId = null;
  var lookLastX = 0;
  var lookLastY = 0;
  var f5Sent = false;

  function screenMidX() {
    return window.innerWidth * LOOK_SPLIT;
  }

  function isLeftHalf(x) {
    return x < screenMidX();
  }

  function getTargets() {
    var list = [window, document];
    if (document.body) list.push(document.body);
    var canvas = document.querySelector("canvas");
    if (canvas) list.push(canvas);
    var frame = document.getElementById("game_frame");
    if (frame && list.indexOf(frame) < 0) list.push(frame);
    return list;
  }

  function fireKey(type, def) {
    var opts = {
      key: def.key,
      code: def.code,
      keyCode: def.keyCode,
      which: def.keyCode,
      bubbles: true,
      cancelable: true
    };
    getTargets().forEach(function (target) {
      var ev = new KeyboardEvent(type, opts);
      try {
        Object.defineProperty(ev, "keyCode", { get: function () { return def.keyCode; } });
        Object.defineProperty(ev, "which", { get: function () { return def.keyCode; } });
      } catch (e) { /* 旧浏览器 */ }
      target.dispatchEvent(ev);
    });
  }

  function fireMouseMove(mdx, mdy, clientX, clientY) {
    getTargets().forEach(function (target) {
      var ev = new MouseEvent("mousemove", {
        bubbles: true,
        cancelable: true,
        clientX: clientX,
        clientY: clientY,
        screenX: clientX,
        screenY: clientY,
        view: window
      });
      try {
        Object.defineProperty(ev, "movementX", { get: function () { return mdx; } });
        Object.defineProperty(ev, "movementY", { get: function () { return mdy; } });
      } catch (e) { /* 只读时忽略 */ }
      target.dispatchEvent(ev);
    });
  }

  function setKey(name, on) {
    if (!!held[name] === !!on) return;
    held[name] = on;
    fireKey(on ? "keydown" : "keyup", KEYS[name]);
  }

  function releaseAll() {
    ["w", "a", "s", "d", "shift"].forEach(function (k) {
      setKey(k, false);
    });
  }

  function endLook(e) {
    if (e && e.pointerId != null && e.pointerId !== lookPointerId) return;
    lookPointerId = null;
  }

  function applyStick() {
    var x = stick.x;
    var y = stick.y;
    var mag = Math.hypot(x, y);
    if (mag < 1e-5) {
      setKey("w", false);
      setKey("a", false);
      setKey("s", false);
      setKey("d", false);
      setKey("shift", false);
      return;
    }
    setKey("w", y < -AXIS);
    setKey("s", y > AXIS);
    setKey("a", x < -AXIS);
    setKey("d", x > AXIS);
    setKey("shift", mag >= SPRINT);
  }

  function readJoyCenter() {
    var r = joy.getBoundingClientRect();
    joyCenterX = r.left + r.width / 2;
    joyCenterY = r.top + r.height / 2;
  }

  function setKnobFromClient(clientX, clientY) {
    var dx = clientX - joyCenterX;
    var dy = clientY - joyCenterY;
    var len = Math.hypot(dx, dy);
    if (len > RADIUS && len > 0) {
      dx = (dx / len) * RADIUS;
      dy = (dy / len) * RADIUS;
    }
    knob.style.transform = "translate(" + dx + "px," + dy + "px)";

    var nx = dx / RADIUS;
    var ny = dy / RADIUS;
    var rawX = nx;
    var rawY = -ny;
    var m = Math.hypot(rawX, rawY);
    if (m < DEAD) {
      stick.x = 0;
      stick.y = 0;
    } else {
      var scaled = (m - DEAD) / (1 - DEAD);
      var k = scaled / m;
      stick.x = rawX * k;
      stick.y = rawY * k;
    }
    applyStick();
  }

  function resetKnob() {
    knob.style.transform = "translate(0px,0px)";
    stick.x = 0;
    stick.y = 0;
    applyStick();
  }

  function tryThirdPersonOnce() {
    if (f5Sent) return;
    if (!document.querySelector("canvas")) return;
    f5Sent = true;
    fireKey("keydown", KEYS.f5);
    fireKey("keyup", KEYS.f5);
  }

  var wrap = document.createElement("div");
  wrap.id = "mc-joy-wrap";
  wrap.innerHTML = '<div id="mc-joy" aria-label="移动摇杆"><div id="mc-joy-knob"></div></div>';

  var style = document.createElement("style");
  style.textContent =
    "#mc-joy-wrap{position:fixed;display:none;z-index:999999;" +
    "width:" + JOY_SIZE + "px;height:" + JOY_SIZE + "px;" +
    "-webkit-user-select:none;user-select:none;touch-action:none;" +
    "pointer-events:none}" +
    "#mc-joy{width:100%;height:100%;border-radius:50%;" +
    "background:rgba(0,0,0,.36);border:2px solid rgba(255,255,255,.32);" +
    "box-sizing:border-box;position:relative;touch-action:none;" +
    "pointer-events:auto;box-shadow:0 4px 16px rgba(0,0,0,.3)}" +
    "#mc-joy-knob{position:absolute;left:50%;top:50%;width:" + KNOB_SIZE + "px;height:" + KNOB_SIZE + "px;" +
    "margin:" + (-KNOB_SIZE / 2) + "px 0 0 " + (-KNOB_SIZE / 2) + "px;border-radius:50%;" +
    "background:rgba(255,255,255,.48);border:2px solid rgba(255,255,255,.4);" +
    "pointer-events:none;will-change:transform}";

  document.documentElement.appendChild(style);
  document.documentElement.appendChild(wrap);

  var joy = document.getElementById("mc-joy");
  var knob = document.getElementById("mc-joy-knob");

  function showJoyAt(clientX, clientY) {
    wrap.style.display = "block";
    wrap.style.left = (clientX - JOY_SIZE / 2) + "px";
    wrap.style.top = (clientY - JOY_SIZE / 2) + "px";
    knob.style.transform = "translate(0px,0px)";
    readJoyCenter();
  }

  function hideJoy() {
    wrap.style.display = "none";
    resetKnob();
  }

  function startJoy(e) {
    joyDragging = true;
    joyPointerId = e.pointerId != null ? e.pointerId : e.identifier;
    showJoyAt(e.clientX, e.clientY);
    setKnobFromClient(e.clientX, e.clientY);
    try {
      if (e.pointerId != null) joy.setPointerCapture(e.pointerId);
    } catch (err) { /* 忽略 */ }
  }

  function moveJoy(e) {
    if (!joyDragging) return;
    if (e.pointerId != null && e.pointerId !== joyPointerId) return;
    if (e.identifier != null && e.identifier !== joyPointerId) return;
    setKnobFromClient(e.clientX, e.clientY);
    if (e.cancelable) e.preventDefault();
  }

  function endJoyDrag(e) {
    if (!joyDragging) return;
    if (e && e.pointerId != null && e.pointerId !== joyPointerId) return;
    if (e && e.identifier != null && e.identifier !== joyPointerId) return;
    joyDragging = false;
    joyPointerId = null;
    try {
      if (e && e.pointerId != null) joy.releasePointerCapture(e.pointerId);
    } catch (err) { /* 忽略 */ }
    hideJoy();
  }

  window.addEventListener("pointerdown", function (e) {
    if (e.pointerType === "mouse" && e.buttons !== 1) return;

    if (isLeftHalf(e.clientX)) {
      if (joyDragging) return;
      startJoy(e);
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    if (lookPointerId != null || joyDragging) return;
    lookPointerId = e.pointerId;
    lookLastX = e.clientX;
    lookLastY = e.clientY;
    e.preventDefault();
  }, { passive: false, capture: true });

  window.addEventListener("pointermove", function (e) {
    if (joyDragging && e.pointerId === joyPointerId) {
      moveJoy(e);
      return;
    }
    if (e.pointerId !== lookPointerId) return;
    var dx = e.clientX - lookLastX;
    var dy = e.clientY - lookLastY;
    lookLastX = e.clientX;
    lookLastY = e.clientY;
    if (dx !== 0 || dy !== 0) {
      fireMouseMove(dx * LOOK_SENS, dy * LOOK_SENS, e.clientX, e.clientY);
    }
    e.preventDefault();
  }, { passive: false, capture: true });

  window.addEventListener("pointerup", function (e) {
    if (e.pointerId === joyPointerId) endJoyDrag(e);
    endLook(e);
  }, { capture: true });

  window.addEventListener("pointercancel", function (e) {
    if (e.pointerId === joyPointerId) endJoyDrag(e);
    endLook(e);
  }, { capture: true });

  joy.addEventListener("touchstart", function (e) {
    if (joyDragging || !e.changedTouches || !e.changedTouches.length) return;
    var t = e.changedTouches[0];
    startJoy({ clientX: t.clientX, clientY: t.clientY, identifier: t.identifier });
    e.preventDefault();
  }, { passive: false });

  joy.addEventListener("touchmove", function (e) {
    if (!joyDragging || !e.changedTouches) return;
    for (var i = 0; i < e.changedTouches.length; i++) {
      var t = e.changedTouches[i];
      if (t.identifier === joyPointerId) {
        moveJoy({ clientX: t.clientX, clientY: t.clientY, identifier: t.identifier });
        break;
      }
    }
    e.preventDefault();
  }, { passive: false });

  joy.addEventListener("touchend", function (e) {
    if (!e.changedTouches) return;
    for (var i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === joyPointerId) {
        endJoyDrag({ identifier: joyPointerId });
        break;
      }
    }
  }, { passive: false });

  window.addEventListener("blur", function () {
    endLook(null);
    endJoyDrag(null);
    releaseAll();
  });

  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState !== "visible") {
      endLook(null);
      endJoyDrag(null);
      releaseAll();
    }
  });

  var worldObs = new MutationObserver(function () {
    tryThirdPersonOnce();
  });
  worldObs.observe(document.documentElement, { childList: true, subtree: true });
  setTimeout(tryThirdPersonOnce, 3000);
  setTimeout(tryThirdPersonOnce, 8000);
  setTimeout(function () { worldObs.disconnect(); }, 120000);

  window.__mcJoy = {
    stick: stick,
    releaseAll: releaseAll,
    setKey: setKey
  };
})();
