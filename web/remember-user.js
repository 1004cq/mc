/**
 * mc.cq.je — 登录态与固定游戏 ID
 * 须在 classes.js 之前加载；未登录会跳转 /login/
 */
(function () {
  "use strict";

  var NS = "mc_cq_creative_v2";
  var PROFILE_LS_KEY = NS + ".p";
  var SETTINGS_LS_KEY = NS + ".g";
  var PLAY_PREFIX = "/play";

  function onPlayPage() {
    return location.pathname === PLAY_PREFIX || location.pathname.indexOf(PLAY_PREFIX + "/") === 0;
  }

  function redirectLogin() {
    var next = encodeURIComponent(location.pathname + location.search);
    location.replace("/login/?next=" + next);
  }

  function fetchMeSync() {
    try {
      var xhr = new XMLHttpRequest();
      xhr.open("GET", "/api/me", false);
      xhr.withCredentials = true;
      xhr.send(null);
      if (xhr.status === 200) {
        return JSON.parse(xhr.responseText);
      }
    } catch (e) { /* 忽略 */ }
    return null;
  }

  function fetchProfileSync() {
    try {
      var xhr = new XMLHttpRequest();
      xhr.open("GET", "/api/profile", false);
      xhr.withCredentials = true;
      xhr.send(null);
      if (xhr.status === 200) {
        var j = JSON.parse(xhr.responseText);
        if (j && j.ok && j.profileB64) return j.profileB64;
      }
    } catch (e) { /* 忽略 */ }
    return null;
  }

  function fetchSettingsSync() {
    var existing = "";
    try {
      var stored = localStorage.getItem(SETTINGS_LS_KEY);
      if (stored) existing = stored;
    } catch (e) { /* 忽略 */ }
    try {
      var xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/settings", false);
      xhr.withCredentials = true;
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.send(JSON.stringify({ settingsB64: existing }));
      if (xhr.status === 200) {
        var j = JSON.parse(xhr.responseText);
        if (j && j.ok && j.settingsB64) return j.settingsB64;
      }
    } catch (e) { /* 忽略 */ }
    return null;
  }

  function saveSettingsSync(settingsB64) {
    if (!settingsB64) return null;
    try {
      var xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/settings", false);
      xhr.withCredentials = true;
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.send(JSON.stringify({ settingsB64: settingsB64 }));
      if (xhr.status === 200) {
        var j = JSON.parse(xhr.responseText);
        if (j && j.ok && j.settingsB64) return j.settingsB64;
      }
    } catch (e) { /* 忽略 */ }
    return settingsB64;
  }

  function saveProfileSync(profileB64) {
    if (!profileB64) return;
    try {
      var xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/profile", false);
      xhr.withCredentials = true;
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.send(JSON.stringify({ profileB64: profileB64 }));
    } catch (e) { /* 忽略 */ }
  }

  if (!onPlayPage()) return;

  var me = fetchMeSync();
  if (!me || !me.ok || !me.username) {
    redirectLogin();
    return;
  }

  var username = me.username;
  window.__MC_USERNAME = username;
  window.__MC_AUTH_OK = true;

  var profileB64 = fetchProfileSync();
  if (profileB64) {
    window.__MC_PROFILE_B64 = profileB64;
    try {
      localStorage.setItem(PROFILE_LS_KEY, profileB64);
    } catch (e) { /* 隐私模式 */ }
  }

  // 清除曾强制隐藏触控/聊天的设置，恢复 Eagler 自带键位
  var settingsB64 = fetchSettingsSync();
  if (settingsB64) {
    window.__MC_SETTINGS_B64 = settingsB64;
    try {
      localStorage.setItem(SETTINGS_LS_KEY, settingsB64);
    } catch (e) { /* 隐私模式 */ }
  }

  window.__mcStorageLoaded = function (key) {
    if (key === "p" && window.__MC_PROFILE_B64) {
      return window.__MC_PROFILE_B64;
    }
    if (key === "p") {
      try {
        var storedP = localStorage.getItem(PROFILE_LS_KEY);
        if (storedP) return storedP;
      } catch (e) { /* 忽略 */ }
    }
    if (key === "g" && window.__MC_SETTINGS_B64) {
      return window.__MC_SETTINGS_B64;
    }
    return null;
  };

  window.__mcStorageSaved = function (key, data) {
    if (key === "p" && data) {
      window.__MC_PROFILE_B64 = data;
      try {
        localStorage.setItem(PROFILE_LS_KEY, data);
      } catch (e) { /* 忽略 */ }
      saveProfileSync(data);
      return;
    }
    if (key === "g" && data) {
      var patched = saveSettingsSync(data) || data;
      window.__MC_SETTINGS_B64 = patched;
      try {
        localStorage.setItem(SETTINGS_LS_KEY, patched);
      } catch (e) { /* 忽略 */ }
    }
  };

  var editProfileDone = false;
  window.__mcScreenChanged = function (screenName) {
    if (editProfileDone || !username) return;
    if (screenName !== "Edit Profile" && screenName !== "editProfile.title") return;

    var canvas = document.querySelector("canvas");
    if (!canvas) return;

    function fire(type, keyCode, key) {
      var opts = {
        bubbles: true,
        cancelable: true,
        key: key || "",
        code: key ? "Key" + key.toUpperCase() : "",
        keyCode: keyCode,
        which: keyCode,
        charCode: type === "keypress" ? keyCode : 0
      };
      try {
        canvas.dispatchEvent(new KeyboardEvent(type, opts));
      } catch (e) {
        var ev = document.createEvent("Event");
        ev.initEvent(type, true, true);
        ev.keyCode = keyCode;
        ev.which = keyCode;
        canvas.dispatchEvent(ev);
      }
    }

    function typeUsername(idx) {
      if (idx >= username.length) {
        setTimeout(clickDone, 300);
        return;
      }
      var ch = username.charAt(idx);
      var code = ch.toUpperCase().charCodeAt(0);
      fire("keydown", code, ch);
      fire("keypress", ch.charCodeAt(0), ch);
      fire("keyup", code, ch);
      setTimeout(function () { typeUsername(idx + 1); }, 40);
    }

    function clickDone() {
      fire("keydown", 13, "Enter");
      fire("keypress", 13, "Enter");
      fire("keyup", 13, "Enter");
      editProfileDone = true;
    }

    setTimeout(function () {
      try {
        fire("keydown", 65, "a");
        fire("keyup", 65, "a");
      } catch (e) { /* 忽略 */ }
      setTimeout(function () { typeUsername(0); }, 200);
    }, 500);
  };
})();
