const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const scoreEl = document.querySelector("#score");
const coinsEl = document.querySelector("#coins");
const livesEl = document.querySelector("#lives");
const overlay = document.querySelector("#overlay");
const overlayKicker = document.querySelector("#overlayKicker");
const overlayTitle = document.querySelector("#overlayTitle");
const overlayText = document.querySelector("#overlayText");
const startBtn = document.querySelector("#startBtn");

const W = canvas.width;
const H = canvas.height;
const WORLD_W = 4300;
const GRAVITY = 0.82;
const keys = { left: false, right: false, jump: false };
let cameraX = 0;
let lastTime = 0;
let running = false;
let won = false;

const level = {
  platforms: [
    { x: 0, y: 640, w: 900, h: 90, kind: "ground" },
    { x: 1010, y: 640, w: 520, h: 90, kind: "ground" },
    { x: 1660, y: 640, w: 660, h: 90, kind: "ground" },
    { x: 2460, y: 640, w: 650, h: 90, kind: "ground" },
    { x: 3260, y: 640, w: 1040, h: 90, kind: "ground" },
    { x: 360, y: 506, w: 210, h: 26, kind: "glass" },
    { x: 690, y: 420, w: 190, h: 26, kind: "glass" },
    { x: 1160, y: 496, w: 250, h: 26, kind: "glass" },
    { x: 1510, y: 390, w: 170, h: 26, kind: "glass" },
    { x: 1900, y: 500, w: 240, h: 26, kind: "glass" },
    { x: 2220, y: 414, w: 170, h: 26, kind: "glass" },
    { x: 2660, y: 492, w: 260, h: 26, kind: "glass" },
    { x: 3080, y: 405, w: 180, h: 26, kind: "glass" },
    { x: 3430, y: 512, w: 260, h: 26, kind: "glass" },
    { x: 3820, y: 430, w: 220, h: 26, kind: "glass" },
  ],
  coins: [
    [430, 460], [530, 460], [730, 374], [830, 374], [1210, 448], [1320, 448],
    [1544, 342], [1630, 342], [1960, 452], [2070, 452], [2260, 366], [2345, 366],
    [2720, 444], [2840, 444], [3125, 358], [3210, 358], [3500, 464], [3610, 464],
    [3870, 382], [3970, 382], [4110, 590],
  ].map(([x, y]) => ({ x, y, r: 15, taken: false })),
  enemies: [
    { x: 780, y: 588, w: 52, h: 52, vx: 1.1, min: 650, max: 875, alive: true },
    { x: 1350, y: 588, w: 52, h: 52, vx: -1.15, min: 1080, max: 1490, alive: true },
    { x: 2040, y: 588, w: 52, h: 52, vx: 1.2, min: 1760, max: 2285, alive: true },
    { x: 2890, y: 588, w: 52, h: 52, vx: -1.18, min: 2530, max: 3050, alive: true },
    { x: 3620, y: 588, w: 52, h: 52, vx: 1.28, min: 3330, max: 4180, alive: true },
  ],
};

const player = {
  x: 74,
  y: 510,
  w: 48,
  h: 62,
  vx: 0,
  vy: 0,
  onGround: false,
  face: 1,
  score: 0,
  coins: 0,
  lives: 3,
  invincible: 0,
};

function resetGame() {
  Object.assign(player, {
    x: 74, y: 510, vx: 0, vy: 0, onGround: false, face: 1,
    score: 0, coins: 0, lives: 3, invincible: 0,
  });
  level.coins.forEach((coin) => (coin.taken = false));
  level.enemies.forEach((enemy, i) => {
    enemy.alive = true;
    enemy.x = [780, 1350, 2040, 2890, 3620][i];
    enemy.vx = Math.abs(enemy.vx) * (i % 2 ? -1 : 1);
  });
  cameraX = 0;
  won = false;
  updateHud();
}

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function updateHud() {
  scoreEl.textContent = player.score;
  coinsEl.textContent = player.coins;
  livesEl.textContent = player.lives;
}

function showOverlay(kicker, title, text, button = "再来一次") {
  overlayKicker.textContent = kicker;
  overlayTitle.textContent = title;
  overlayText.textContent = text;
  startBtn.textContent = button;
  overlay.classList.remove("is-hidden");
}

function hideOverlay() {
  overlay.classList.add("is-hidden");
}

function respawn() {
  player.lives -= 1;
  updateHud();
  if (player.lives <= 0) {
    running = false;
    showOverlay("挑战结束", "差一点点", "星光还在路上。调整节奏，下一次可以踩得更漂亮。");
    return;
  }
  player.x = Math.max(74, cameraX + 70);
  player.y = 360;
  player.vx = 0;
  player.vy = 0;
  player.invincible = 120;
}

function update() {
  if (!running) return;

  const accel = player.onGround ? 0.88 : 0.55;
  const friction = player.onGround ? 0.8 : 0.93;
  if (keys.left) {
    player.vx -= accel;
    player.face = -1;
  }
  if (keys.right) {
    player.vx += accel;
    player.face = 1;
  }
  if (!keys.left && !keys.right) player.vx *= friction;
  player.vx = Math.max(-7.2, Math.min(7.2, player.vx));

  if (keys.jump && player.onGround) {
    player.vy = -17.2;
    player.onGround = false;
  }

  player.vy += GRAVITY;
  player.vy = Math.min(player.vy, 18);

  player.x += player.vx;
  for (const platform of level.platforms) {
    if (!rectsOverlap(player, platform)) continue;
    if (player.vx > 0) player.x = platform.x - player.w;
    if (player.vx < 0) player.x = platform.x + platform.w;
    player.vx = 0;
  }

  player.y += player.vy;
  player.onGround = false;
  for (const platform of level.platforms) {
    if (!rectsOverlap(player, platform)) continue;
    if (player.vy > 0) {
      player.y = platform.y - player.h;
      player.vy = 0;
      player.onGround = true;
    } else if (player.vy < 0) {
      player.y = platform.y + platform.h;
      player.vy = 0;
    }
  }

  player.x = Math.max(0, Math.min(WORLD_W - player.w, player.x));
  if (player.y > H + 120) respawn();
  if (player.invincible > 0) player.invincible -= 1;

  for (const coin of level.coins) {
    if (coin.taken) continue;
    const dx = player.x + player.w / 2 - coin.x;
    const dy = player.y + player.h / 2 - coin.y;
    if (Math.hypot(dx, dy) < coin.r + 34) {
      coin.taken = true;
      player.coins += 1;
      player.score += 100;
      updateHud();
    }
  }

  for (const enemy of level.enemies) {
    if (!enemy.alive) continue;
    enemy.x += enemy.vx;
    if (enemy.x < enemy.min || enemy.x + enemy.w > enemy.max) enemy.vx *= -1;

    if (rectsOverlap(player, enemy)) {
      const stomp = player.vy > 0 && player.y + player.h - enemy.y < 26;
      if (stomp) {
        enemy.alive = false;
        player.vy = -12;
        player.score += 250;
        updateHud();
      } else if (player.invincible <= 0) {
        respawn();
      }
    }
  }

  if (player.x > 4105 && player.y > 420) {
    won = true;
    running = false;
    player.score += 1000;
    updateHud();
    showOverlay("通关成功", "抵达光门", `你收集了 ${player.coins} 颗星，拿到 ${player.score} 分。`, "再玩一局");
  }

  cameraX = Math.max(0, Math.min(WORLD_W - W, player.x - W * 0.42));
}

function drawBackground(t) {
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, "#10253d");
  sky.addColorStop(0.55, "#182a45");
  sky.addColorStop(1, "#07111f");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  ctx.translate(-cameraX * 0.16, 0);
  for (let i = 0; i < 9; i++) {
    const x = i * 560 + 80;
    drawCloud(x, 96 + (i % 3) * 56, 1 + (i % 2) * 0.22);
  }
  ctx.restore();

  ctx.save();
  ctx.translate(-cameraX * 0.36, 0);
  for (let i = 0; i < 12; i++) {
    const x = i * 420 - 50;
    ctx.fillStyle = i % 2 ? "#203a52" : "#263f5a";
    roundedRect(x, 430 - (i % 4) * 36, 260, 260, 8);
    ctx.fill();
    ctx.fillStyle = "rgba(114, 242, 165, 0.18)";
    for (let y = 460 - (i % 4) * 36; y < 610; y += 48) {
      ctx.fillRect(x + 26, y, 30, 10);
      ctx.fillRect(x + 118, y + 18, 42, 10);
    }
  }
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = "#46e2ff";
  for (let i = 0; i < 60; i++) {
    const x = ((i * 173 - cameraX * 0.08) % W + W) % W;
    const y = (i * 71) % 390 + 32;
    ctx.fillRect(x, y + Math.sin(t / 900 + i) * 3, 2, 2);
  }
  ctx.restore();
}

function drawCloud(x, y, scale) {
  ctx.fillStyle = "rgba(234, 248, 255, 0.12)";
  ctx.beginPath();
  ctx.ellipse(x, y, 58 * scale, 24 * scale, 0, 0, Math.PI * 2);
  ctx.ellipse(x + 48 * scale, y + 8 * scale, 72 * scale, 28 * scale, 0, 0, Math.PI * 2);
  ctx.ellipse(x + 98 * scale, y, 48 * scale, 22 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
}

function roundedRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawPlatform(platform) {
  const x = platform.x - cameraX;
  const grad = ctx.createLinearGradient(0, platform.y, 0, platform.y + platform.h);
  if (platform.kind === "ground") {
    grad.addColorStop(0, "#42d9a6");
    grad.addColorStop(0.18, "#2ba976");
    grad.addColorStop(0.19, "#283348");
    grad.addColorStop(1, "#131d2c");
  } else {
    grad.addColorStop(0, "#b9f7ff");
    grad.addColorStop(1, "#4cc9f0");
  }
  ctx.fillStyle = grad;
  roundedRect(x, platform.y, platform.w, platform.h, 8);
  ctx.fill();
  ctx.strokeStyle = platform.kind === "ground" ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.55)";
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawCoin(coin, t) {
  if (coin.taken) return;
  const pulse = Math.sin(t / 140 + coin.x) * 0.18 + 1;
  const x = coin.x - cameraX;
  ctx.save();
  ctx.translate(x, coin.y);
  ctx.scale(pulse, 1);
  ctx.fillStyle = "#ffd66b";
  ctx.beginPath();
  ctx.arc(0, 0, coin.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff2a6";
  ctx.beginPath();
  ctx.arc(-5, -5, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawEnemy(enemy, t) {
  if (!enemy.alive) return;
  const x = enemy.x - cameraX;
  const wobble = Math.sin(t / 130 + enemy.x) * 3;
  ctx.fillStyle = "#2a1630";
  roundedRect(x, enemy.y + wobble, enemy.w, enemy.h, 8);
  ctx.fill();
  ctx.fillStyle = "#ff6f9e";
  ctx.beginPath();
  ctx.arc(x + 16, enemy.y + 20 + wobble, 5, 0, Math.PI * 2);
  ctx.arc(x + 36, enemy.y + 20 + wobble, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 111, 158, 0.6)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x + 8, enemy.y + 10 + wobble);
  ctx.lineTo(x - 6, enemy.y - 2 + wobble);
  ctx.moveTo(x + 44, enemy.y + 10 + wobble);
  ctx.lineTo(x + 58, enemy.y - 2 + wobble);
  ctx.stroke();
}

function drawPlayer(t) {
  const x = player.x - cameraX;
  const blink = player.invincible > 0 && Math.floor(t / 80) % 2 === 0;
  if (blink) return;

  ctx.save();
  ctx.translate(x + player.w / 2, player.y + player.h / 2);
  ctx.scale(player.face, 1);
  ctx.fillStyle = "#46e2ff";
  roundedRect(-22, -22, 44, 46, 8);
  ctx.fill();
  ctx.fillStyle = "#ff6f9e";
  ctx.fillRect(-18, -31, 36, 16);
  ctx.fillStyle = "#101623";
  ctx.beginPath();
  ctx.arc(8, -8, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#101623";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-8, 10);
  ctx.quadraticCurveTo(3, 17, 15, 9);
  ctx.stroke();
  ctx.fillStyle = "#ffd66b";
  ctx.fillRect(-19, 21, 14, 9);
  ctx.fillRect(7, 21, 14, 9);
  ctx.restore();
}

function drawGoal(t) {
  const x = 4180 - cameraX;
  ctx.save();
  ctx.translate(x, 560);
  ctx.strokeStyle = "#72f2a5";
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.ellipse(0, 0, 46 + Math.sin(t / 200) * 4, 84, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "rgba(114, 242, 165, 0.18)";
  ctx.beginPath();
  ctx.ellipse(0, 0, 39, 75, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f8fbff";
  ctx.font = "800 18px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("GO", 0, 6);
  ctx.restore();
}

function render(t = 0) {
  drawBackground(t);
  ctx.save();
  for (const platform of level.platforms) drawPlatform(platform);
  for (const coin of level.coins) drawCoin(coin, t);
  for (const enemy of level.enemies) drawEnemy(enemy, t);
  drawGoal(t);
  drawPlayer(t);
  ctx.restore();

  ctx.fillStyle = "rgba(255,255,255,0.58)";
  ctx.font = "700 18px Inter, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("A/D 或 ←/→ 移动   W/空格 跳跃", 28, 42);
}

function loop(t) {
  const dt = t - lastTime;
  lastTime = t;
  if (dt < 80) update();
  render(t);
  requestAnimationFrame(loop);
}

function setControl(name, active) {
  keys[name] = active;
}

window.addEventListener("keydown", (event) => {
  if (["ArrowLeft", "KeyA"].includes(event.code)) setControl("left", true);
  if (["ArrowRight", "KeyD"].includes(event.code)) setControl("right", true);
  if (["ArrowUp", "KeyW", "Space"].includes(event.code)) {
    setControl("jump", true);
    event.preventDefault();
  }
});

window.addEventListener("keyup", (event) => {
  if (["ArrowLeft", "KeyA"].includes(event.code)) setControl("left", false);
  if (["ArrowRight", "KeyD"].includes(event.code)) setControl("right", false);
  if (["ArrowUp", "KeyW", "Space"].includes(event.code)) setControl("jump", false);
});

document.querySelectorAll("[data-control]").forEach((button) => {
  const control = button.dataset.control;
  const on = (event) => {
    event.preventDefault();
    setControl(control, true);
  };
  const off = (event) => {
    event.preventDefault();
    setControl(control, false);
  };
  button.addEventListener("pointerdown", on);
  button.addEventListener("pointerup", off);
  button.addEventListener("pointerleave", off);
  button.addEventListener("pointercancel", off);
});

startBtn.addEventListener("click", () => {
  resetGame();
  running = true;
  window.scrollTo({ top: 0, behavior: "smooth" });
  hideOverlay();
});

resetGame();
render(0);
requestAnimationFrame(loop);
