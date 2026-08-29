/**
 * Eaglercraft 手机控制：左侧触摸位置出现圆形摇杆走路，右侧滑屏转头。
 * 没有跳跃键。不是 Three.js。
 */
(function () {
  if (window.__mcJoy) return;

  var KEYS = {
    w: { key: "w", code: "KeyW", keyCode: 87 },
    a: { key: "a", code: "KeyA", keyCode: 65 },
    s: { key: "s", code: "KeyS", keyCode: 83 },
    d: { key: "d", code: "KeyD", keyCode: 68 },
    shift: { key: "Shift", code: "ShiftLeft", keyCode: 16 }
  };

  var RADIUS = 52;
  var DEAD = 0.16;
  var SPRINT = 0.86;
  var LOOK_SENS = 1.8;
  var LEFT_RATIO = 0.46;

  var held = {};
  var stick = { x: 0, y: 0 };
  var moveId = null;
  var lookId = null;
  var lastLook = null;

  function fireKey(type, def) {
    var ev = new KeyboardEvent(type, {
      key: def.key,
      code: def.code,
      keyCode: def.keyCode,
      which: def.keyCode,
      bubbles: true,
      cancelable: true
    });
    try { Object.defineProperty(ev, "keyCode", { get: function () { return def.keyCode; } }); } catch (e) {}
    window.dispatchEvent(ev);
    document.dispatchEvent(ev);
    var c = document.querySelector("canvas");
    if (c) c.dispatchEvent(ev);
  }

  function setKey(name, on) {
    if (!!held[name] === !!on) return;
    held[name] = on;
    fireKey(on ? "keydown" : "keyup", KEYS[name]);
  }

  function releaseMoveKeys() {
    setKey("w", false);
    setKey("a", false);
    setKey("s", false);
    setKey("d", false);
    setKey("shift", false);
  }

  function applyStick() {
    var mag = Math.hypot(stick.x, stick.y);
    if (mag < DEAD) {
      releaseMoveKeys();
      return;
    }
    setKey("w", stick.y < -0.28);
    setKey("s", stick.y > 0.28);
    setKey("a", stick.x < -0.28);
    setKey("d", stick.x > 0.28);
    setKey("shift", mag >= SPRINT);
  }

  var style = document.createElement("style");
  style.textContent =
    "#mc-joy{position:fixed;width:128px;height:128px;margin:-64px 0 0 -64px;" +
    "border-radius:50%;background:rgba(255,255,255,.10);" +
    "border:2px solid rgba(255,255,255,.32);z-index:999999;" +
    "pointer-events:none;display:none;touch-action:none}" +
    "#mc-joy-knob{position:absolute;left:50%;top:50%;width:58px;height:58px;" +
    "margin:-29px 0 0 -29px;border-radius:50%;background:rgba(255,255,255,.48)}";
  document.documentElement.appendChild(style);

  var joy = document.createElement("div");
  joy.id = "mc-joy";
  joy.innerHTML = '<div id="mc-joy-knob"></div>';
  document.documentElement.appendChild(joy);
  var knob = joy.firstChild;

  function showJoy(x, y) {
    joy.style.display = "block";
    joy.style.left = x + "px";
    joy.style.top = y + "px";
  }

  function hideJoy() {
    joy.style.display = "none";
    knob.style.transform = "translate(0,0)";
    stick.x = 0;
    stick.y = 0;
    releaseMoveKeys();
  }

  function setKnob(dx, dy) {
    var len = Math.hypot(dx, dy);
    if (len > RADIUS) {
      dx = dx / len * RADIUS;
      dy = dy / len * RADIUS;
    }
    knob.style.transform = "translate(" + dx + "px," + dy + "px)";
    var nx = dx / RADIUS;
    var ny = dy / RADIUS;
    var m = Math.hypot(nx, ny);
    if (m < DEAD) {
      stick.x = 0;
      stick.y = 0;
    } else {
      var scale = (m - DEAD) / (1 - DEAD);
      stick.x = nx / m * scale;
      stick.y = ny / m * scale;
    }
    applyStick();
  }

  function fireLook(mx, my) {
    mx *= LOOK_SENS;
    my *= LOOK_SENS;
    var opts = { bubbles: true, cancelable: true, clientX: 0, clientY: 0 };
    var ev = new MouseEvent("mousemove", opts);
    try {
      Object.defineProperty(ev, "movementX", { get: function () { return mx; } });
      Object.defineProperty(ev, "movementY", { get: function () { return my; } });
    } catch (e) {}
    window.dispatchEvent(ev);
    document.dispatchEvent(ev);
    var c = document.querySelector("canvas");
    if (c) c.dispatchEvent(ev);
  }

  function onDown(e) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    var x = e.clientX;
    var y = e.clientY;
    if (moveId == null && x < window.innerWidth * LEFT_RATIO) {
      moveId = e.pointerId;
      showJoy(x, y);
      setKnob(0, 0);
      e.preventDefault();
      return;
    }
    if (lookId == null && moveId !== e.pointerId) {
      lookId = e.pointerId;
      lastLook = { x: x, y: y };
      e.preventDefault();
    }
  }

  function onMove(e) {
    if (e.pointerId === moveId) {
      var r = joy.getBoundingClientRect();
      setKnob(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2));
      e.preventDefault();
      return;
    }
    if (e.pointerId === lookId && lastLook) {
      fireLook(e.clientX - lastLook.x, e.clientY - lastLook.y);
      lastLook = { x: e.clientX, y: e.clientY };
      e.preventDefault();
    }
  }

  function onUp(e) {
    if (e.pointerId === moveId) {
      moveId = null;
      hideJoy();
    }
    if (e.pointerId === lookId) {
      lookId = null;
      lastLook = null;
    }
  }

  window.addEventListener("pointerdown", onDown, { passive: false });
  window.addEventListener("pointermove", onMove, { passive: false });
  window.addEventListener("pointerup", onUp);
  window.addEventListener("pointercancel", onUp);
  window.addEventListener("blur", function () {
    moveId = null;
    lookId = null;
    lastLook = null;
    hideJoy();
  });

  window.__mcJoy = { stick: stick };
})();
