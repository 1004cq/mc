(function () {
  var defaults = {
    js: { url: "/js/", fallbackUrl: "/play/", label: "普通版（推荐）", compiled: false },
    wasm: { url: "/wasm/", label: "高性能版 WASM", available: false },
    server: { name: "CQ 创造服", address: "wss://mc.cq.je/" }
  };

  function apply(cfg) {
    cfg = cfg || defaults;
    var js = cfg.js || defaults.js;
    var wasm = cfg.wasm || defaults.wasm;
    var server = cfg.server || defaults.server;

    var btnJs = document.getElementById("btn-js");
    var btnWasm = document.getElementById("btn-wasm");
    var btnWasmOff = document.getElementById("btn-wasm-off");
    var buildNote = document.getElementById("build-note");

    // 未编译时绝不链到 /js/（现网 /js/ 为 404）
    var jsHref = js.compiled === true ? (js.url || "/js/") : (js.fallbackUrl || "/play/");
    btnJs.href = jsHref;
    btnJs.textContent = js.label || "普通版（推荐）";

    if (wasm.available === true) {
      btnWasm.href = wasm.url || "/wasm/";
      btnWasm.textContent = wasm.label || "高性能版 WASM";
      btnWasm.classList.remove("hidden");
      btnWasmOff.classList.add("hidden");
    } else {
      btnWasm.classList.add("hidden");
      btnWasmOff.classList.remove("hidden");
    }

    if (buildNote) {
      if (js.compiled === true && wasm.available === true) {
        buildNote.textContent =
          "已检测到编译客户端：普通版 → /js/，高性能 WASM → /wasm/。";
      } else if (js.compiled === true) {
        buildNote.textContent =
          "普通版已切换至 /js/。WASM 尚未部署，高性能按钮仍不可用。";
      } else {
        buildNote.textContent =
          "当前普通版指向现网可玩页面 /play/（含中文聊天与登录）。/js/、/wasm/ 编译部署后会自动切换入口。";
      }
    }

    if (server && server.address) {
      var codes = document.querySelectorAll("[data-server-addr]");
      for (var i = 0; i < codes.length; i++) codes[i].textContent = server.address;
    }
  }

  fetch("config.json", { cache: "no-store" })
    .then(function (r) { return r.ok ? r.json() : defaults; })
    .catch(function () { return defaults; })
    .then(apply);
})();
