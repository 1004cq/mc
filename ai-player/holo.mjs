let text = "AI";
let lastCmd = 0;

function safe(s) {
  return String(s || "AI").replace(/["\\]/g, "").slice(0, 16);
}

export function setHolo(next) {
  text = safe(next);
}

export function tickHolo(bot) {
  if (!bot.entity) return;
  const now = Date.now();
  if (now - lastCmd < 400) return;
  lastCmd = now;
  const p = bot.entity.position.offset(0, 2.15, 0);
  const x = p.x.toFixed(2);
  const y = p.y.toFixed(2);
  const z = p.z.toFixed(2);
  try {
    bot.chat("/entitydata @e[type=ArmorStand,r=4] {CustomName:\"" + text + "\",CustomNameVisible:1,Invisible:1,NoGravity:1}");
    bot.chat("/tp @e[type=ArmorStand,r=5,c=1] " + x + " " + y + " " + z);
  } catch (e) {}
}

export function spawnHolo(bot) {
  if (!bot.entity) return;
  const p = bot.entity.position.offset(0, 2.15, 0);
  try {
    bot.chat(
      "/summon ArmorStand " +
        p.x.toFixed(2) + " " + p.y.toFixed(2) + " " + p.z.toFixed(2) +
        " {CustomName:\"AI\",CustomNameVisible:1,Invisible:1,NoGravity:1,Small:1,Invulnerable:1}"
    );
  } catch (e) {}
}
