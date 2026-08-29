/**
 * Eaglercraft 手机圆形摇杆
 * 迭在游戏页上，把圆形方向转成 W/A/S/D 键盘事件。
 * 不是 Three.js，不要和 playerMove.js 混用。
 */
(function () {
  if (window.__mcJoy) return;

  var KEYS = {
    w: { key: "w", code: "KeyW", keyCode: 87 },
    a: { key: "a", code: "KeyA", keyCode: 65 },
    s: { key: "s", code: "KeyS", keyCode: 83 },
    d: { key: "d", code: "KeyD", keyCode: 68 },
    shift: { key: "Shift", code: "ShiftLeft", keyCode: 16 },
    space: { key: " ", code: "Space", keyCode: 32 }
  };

  var held = {};
  var stick = { x: 0, y: 0 };
  var dragging = false;
  var pointerId = null;
  var RADIUS = 40;
  var DEAD = 0.18;
  var SPRINT = 0.82;

  function fire(type, def) {
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
  }

  function setKey(name, on) {
    if (!!held[name] === !!on) return;
    held[name] = on;
    fire(on ? "keydown" : "keyup", KEYS[name]);
  }

  function applyStick() {
    var x = stick.x;
    var y = stick.y;
    var mag = Math.hypot(x, y);
    if (mag < DEAD) {
      setKey("w", false);
      setKey("a", false);
      setKey("s", false);
      setKey("d", false);
      setKey("shift", false);
      return;
    }
    // 圆形 8 向：y 向上为前（W）
    setKey("w", y < -0.32);
    setKey("s", y > 0.32);
    setKey("a", x < -0.32);
    setKey("d", x > 0.32);
    setKey("shift", mag >= SPRINT);
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

  var wrap = document.createElement("div");
  wrap.id = "mc-joy-wrap";
  wrap.innerHTML =
    '<div id="mc-joy"><div id="mc-joy-knob"></div></div>' +
    '<button type="button" id="mc-joy-jump">跳</button>';

  var style = document.createElement("style");
  style.textContent =
    "#mc-joy-wrap{position:fixed;left:max(12px,env(safe-area-inset-left));" +
    "bottom:max(16px,env(safe-area-inset-bottom));z-index:999999;" +
    "display:flex;align-items:flex-end;gap:14px;pointer-events:none}" +
    "#mc-joy{width:132px;height:132px;border-radius:50%;" +
    "background:rgba(0,0,0,.28);border:2px solid rgba(255,255,255,.28);" +
    "position:relative;pointer-events:auto;touch-action:none}" +
    "#mc-joy-knob{position:absolute;left:50%;top:50%;width:58px;height:58px;" +
    "margin:-29px 0 0 -29px;border-radius:50%;background:rgba(255,255,255,.42);" +
    "pointer-events:none}" +
    "#mc-joy-jump{pointer-events:auto;width:56px;height:56px;border-radius:50%;" +
    "border:2px solid rgba(255,255,255,.35);background:rgba(0,0,0,.32);" +
    "color:#fff;font-size:16px}";

  document.documentElement.appendChild(style);
  document.documentElement.appendChild(wrap);

  var joy = document.getElementById("mc-joy");
  var knob = document.getElementById("mc-joy-knob");
  var jump = document.getElementById("mc-joy-jump");

  function localXY(e) {
    var r = joy.getBoundingClientRect();
    return {
      x: e.clientX - (r.left + r.width / 2),
      y: e.clientY - (r.top + r.height / 2)
    };
  }

  joy.addEventListener("pointerdown", function (e) {
    dragging = true;
    pointerId = e.pointerId;
    try { joy.setPointerCapture(e.pointerId); } catch (err) {}
    var p = localXY(e);
    setKnob(p.x, p.y);
    e.preventDefault();
    e.stopPropagation();
  });

  joy.addEventListener("pointermove", function (e) {
    if (!dragging || e.pointerId !== pointerId) return;
    var p = localXY(e);
    setKnob(p.x, p.y);
    e.preventDefault();
    e.stopPropagation();
  });

  function endDrag(e) {
    if (!dragging) return;
    if (e && pointerId != null && e.pointerId !== pointerId) return;
    dragging = false;
    pointerId = null;
    setKnob(0, 0);
  }

  joy.addEventListener("pointerup", endDrag);
  joy.addEventListener("pointercancel", endDrag);

  function jumpOn(e) {
    setKey("space", true);
    e.preventDefault();
    e.stopPropagation();
  }
  function jumpOff(e) {
    setKey("space", false);
    e.preventDefault();
    e.stopPropagation();
  }
  jump.addEventListener("pointerdown", jumpOn);
  jump.addEventListener("pointerup", jumpOff);
  jump.addEventListener("pointercancel", jumpOff);

  window.addEventListener("blur", function () {
    endDrag();
    setKey("space", false);
  });

  window.__mcJoy = { stick: stick, setKey: setKey };
})();
