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
    var serverAddr = document.getElementById("server-addr");
    var serverName = document.getElementById("server-name");

    var jsHref = js.compiled ? js.url : (js.fallbackUrl || "/play/");
    btnJs.href = jsHref;
    btnJs.textContent = js.label || "普通版（推荐）";

    if (wasm.available) {
      btnWasm.href = wasm.url || "/wasm/";
      btnWasm.textContent = wasm.label || "高性能版 WASM";
      btnWasm.classList.remove("hidden");
      btnWasmOff.classList.add("hidden");
    } else {
      btnWasm.classList.add("hidden");
      btnWasmOff.classList.remove("hidden");
    }

    if (!js.compiled && buildNote) {
      buildNote.classList.remove("hidden");
    }

    if (serverAddr) serverAddr.textContent = server.address || "wss://mc.cq.je/";
    if (serverName) serverName.textContent = server.name || "CQ 创造服";
  }

  fetch("config.json", { cache: "no-store" })
    .then(function (r) {
      return r.ok ? r.json() : defaults;
    })
    .catch(function () {
      return defaults;
    })
    .then(apply);
})();
