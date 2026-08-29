/** 把登录名写进浏览器，尽量让 Eaglercraft 用同一个名字 */
(function () {
  var q = new URLSearchParams(location.search).get("user");
  var name = q || localStorage.getItem("mc_user") || "";
  if (!name) return;
  localStorage.setItem("mc_user", name);
  try {
    localStorage.setItem("username", name);
    localStorage.setItem("eaglercraftUsername", name);
    localStorage.setItem("eaglercraft.username", name);
  } catch (e) {}
  window.eaglercraftXOpts = window.eaglercraftXOpts || {};
  window.eaglercraftXOpts.username = name;
})();
