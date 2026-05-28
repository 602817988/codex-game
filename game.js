const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const levelNoEl = document.querySelector("#levelNo");
const levelNameEl = document.querySelector("#levelName");
const powerStatusEl = document.querySelector("#powerStatus");
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
const GRAVITY = 0.82;
const keys = { left: false, right: false, jump: false, dash: false };
let cameraX = 0;
let lastTime = 0;
let running = false;
let currentLevelIndex = 0;
let activeLevel = null;
let dashLatch = false;

const levelDefs = [
  {
    name: "第一关：星光草坡",
    intro: "热身关，熟悉跳跃、冲刺和道具节奏。",
    worldW: 3600,
    start: { x: 74, y: 510 },
    goal: { x: 3440, y: 552, w: 92, h: 148 },
    platforms: [
      { x: 0, y: 640, w: 920, h: 90, kind: "ground" },
      { x: 1040, y: 640, w: 620, h: 90, kind: "ground" },
      { x: 1800, y: 640, w: 720, h: 90, kind: "ground" },
      { x: 2660, y: 640, w: 940, h: 90, kind: "ground" },
      { x: 390, y: 506, w: 230, h: 26, kind: "glass" },
      { x: 740, y: 432, w: 220, h: 26, kind: "glass" },
      { x: 1210, y: 506, w: 260, h: 26, kind: "glass" },
      { x: 2010, y: 500, w: 260, h: 26, kind: "glass" },
      { x: 2850, y: 486, w: 290, h: 26, kind: "glass" },
    ],
    coins: [[430, 460], [540, 460], [790, 386], [900, 386], [1260, 458], [1400, 458], [2060, 452], [2200, 452], [2900, 438], [3040, 438], [3340, 590]],
    enemies: [
      { x: 1340, y: 588, w: 52, h: 52, vx: -1.0, min: 1120, max: 1580 },
      { x: 2240, y: 588, w: 52, h: 52, vx: 1.1, min: 1880, max: 2480 },
    ],
    hazards: [
      { x: 970, y: 616, w: 54, h: 24 },
      { x: 1710, y: 616, w: 54, h: 24 },
    ],
    powerups: [
      { x: 760, y: 384, type: "shield" },
      { x: 2420, y: 590, type: "dash" },
    ],
  },
  {
    name: "第二关：霓虹断桥",
    intro: "开始出现连续断桥和更多敌人，但仍然给你足够空间。",
    worldW: 4300,
    start: { x: 74, y: 510 },
    goal: { x: 4150, y: 552, w: 92, h: 148 },
    platforms: [
      { x: 0, y: 640, w: 700, h: 90, kind: "ground" },
      { x: 840, y: 640, w: 500, h: 90, kind: "ground" },
      { x: 1510, y: 640, w: 460, h: 90, kind: "ground" },
      { x: 2130, y: 640, w: 560, h: 90, kind: "ground" },
      { x: 2850, y: 640, w: 430, h: 90, kind: "ground" },
      { x: 3450, y: 640, w: 850, h: 90, kind: "ground" },
      { x: 360, y: 500, w: 210, h: 26, kind: "glass" },
      { x: 960, y: 468, w: 180, h: 26, kind: "glass" },
      { x: 1260, y: 388, w: 180, h: 26, kind: "glass" },
      { x: 1760, y: 492, w: 200, h: 26, kind: "glass" },
      { x: 2320, y: 430, w: 220, h: 26, kind: "glass" },
      { x: 3020, y: 500, w: 180, h: 26, kind: "glass" },
      { x: 3360, y: 412, w: 190, h: 26, kind: "glass" },
      { x: 3760, y: 480, w: 260, h: 26, kind: "glass" },
    ],
    coins: [[410, 452], [520, 452], [1010, 420], [1100, 420], [1300, 340], [1400, 340], [1810, 444], [1910, 444], [2380, 382], [2490, 382], [3060, 452], [3160, 452], [3410, 364], [3510, 364], [3830, 432], [3950, 432], [4080, 590]],
    enemies: [
      { x: 1150, y: 588, w: 52, h: 52, vx: 1.25, min: 880, max: 1310 },
      { x: 2440, y: 588, w: 52, h: 52, vx: -1.35, min: 2180, max: 2660 },
      { x: 3710, y: 588, w: 52, h: 52, vx: 1.45, min: 3510, max: 4240 },
    ],
    hazards: [
      { x: 700, y: 612, w: 140, h: 28 },
      { x: 1360, y: 612, w: 150, h: 28 },
      { x: 1985, y: 612, w: 140, h: 28 },
      { x: 2700, y: 612, w: 150, h: 28 },
      { x: 3290, y: 612, w: 150, h: 28 },
    ],
    powerups: [
      { x: 1268, y: 340, type: "spring" },
      { x: 2260, y: 590, type: "shield" },
      { x: 3350, y: 364, type: "slow" },
    ],
  },
  {
    name: "第三关：逆星炼狱",
    intro: "变态难度。冲刺、护盾和耐心，一个都不能少。",
    worldW: 5200,
    start: { x: 74, y: 510 },
    goal: { x: 5065, y: 552, w: 92, h: 148 },
    platforms: [
      { x: 0, y: 640, w: 520, h: 90, kind: "ground" },
      { x: 700, y: 640, w: 250, h: 90, kind: "ground" },
      { x: 1120, y: 640, w: 230, h: 90, kind: "ground" },
      { x: 1540, y: 640, w: 260, h: 90, kind: "ground" },
      { x: 1980, y: 640, w: 260, h: 90, kind: "ground" },
      { x: 2480, y: 640, w: 230, h: 90, kind: "ground" },
      { x: 2980, y: 640, w: 260, h: 90, kind: "ground" },
      { x: 3480, y: 640, w: 240, h: 90, kind: "ground" },
      { x: 3980, y: 640, w: 260, h: 90, kind: "ground" },
      { x: 4560, y: 640, w: 640, h: 90, kind: "ground" },
      { x: 430, y: 500, w: 130, h: 24, kind: "glass" },
      { x: 820, y: 456, w: 118, h: 24, kind: "glass" },
      { x: 1030, y: 374, w: 110, h: 24, kind: "glass" },
      { x: 1330, y: 500, w: 120, h: 24, kind: "glass" },
      { x: 1750, y: 432, w: 118, h: 24, kind: "glass" },
      { x: 2150, y: 360, w: 112, h: 24, kind: "glass" },
      { x: 2660, y: 486, w: 116, h: 24, kind: "glass" },
      { x: 3180, y: 410, w: 112, h: 24, kind: "glass" },
      { x: 3690, y: 332, w: 112, h: 24, kind: "glass" },
      { x: 4210, y: 476, w: 118, h: 24, kind: "glass" },
      { x: 4480, y: 392, w: 126, h: 24, kind: "glass" },
      { x: 4760, y: 500, w: 170, h: 24, kind: "glass" },
    ],
    coins: [[450, 452], [830, 408], [1050, 326], [1350, 452], [1780, 384], [2180, 312], [2680, 438], [3200, 362], [3710, 284], [4240, 428], [4510, 344], [4800, 452], [4900, 452], [5010, 590]],
    enemies: [
      { x: 760, y: 588, w: 52, h: 52, vx: 2.1, min: 710, max: 940 },
      { x: 1180, y: 588, w: 52, h: 52, vx: -2.2, min: 1130, max: 1340 },
      { x: 1610, y: 588, w: 52, h: 52, vx: 2.25, min: 1550, max: 1790 },
      { x: 2050, y: 588, w: 52, h: 52, vx: -2.35, min: 1990, max: 2230 },
      { x: 3030, y: 588, w: 52, h: 52, vx: 2.35, min: 2990, max: 3230 },
      { x: 4630, y: 588, w: 52, h: 52, vx: 2.55, min: 4580, max: 5180 },
    ],
    hazards: [
      { x: 520, y: 608, w: 180, h: 32 },
      { x: 950, y: 608, w: 170, h: 32 },
      { x: 1350, y: 608, w: 190, h: 32 },
      { x: 1800, y: 608, w: 180, h: 32 },
      { x: 2240, y: 608, w: 240, h: 32 },
      { x: 2710, y: 608, w: 270, h: 32 },
      { x: 3240, y: 608, w: 240, h: 32 },
      { x: 3720, y: 608, w: 260, h: 32 },
      { x: 4240, y: 608, w: 320, h: 32 },
      { x: 4338, y: 452, w: 120, h: 24 },
    ],
    powerups: [
      { x: 430, y: 452, type: "dash" },
      { x: 1750, y: 384, type: "shield" },
      { x: 3160, y: 362, type: "spring" },
      { x: 4480, y: 344, type: "slow" },
    ],
  },
];

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
  lives: 4,
  invincible: 0,
  shield: 0,
  spring: 0,
  slow: 0,
  dashCooldown: 0,
};

function hydrateLevel(def) {
  return {
    ...def,
    platforms: def.platforms.map((item) => ({ ...item })),
    coins: def.coins.map(([x, y]) => ({ x, y, r: 15, taken: false })),
    enemies: def.enemies.map((enemy) => ({ ...enemy, startX: enemy.x, startVx: enemy.vx, alive: true })),
    hazards: def.hazards.map((item) => ({ ...item })),
    powerups: def.powerups.map((item) => ({ ...item, r: 18, taken: false })),
  };
}

function loadLevel(index, keepProgress = true) {
  currentLevelIndex = index;
  activeLevel = hydrateLevel(levelDefs[index]);
  Object.assign(player, {
    x: activeLevel.start.x,
    y: activeLevel.start.y,
    vx: 0,
    vy: 0,
    onGround: false,
    face: 1,
    invincible: keepProgress ? 100 : 0,
    shield: 0,
    spring: 0,
    slow: 0,
    dashCooldown: 0,
  });
  cameraX = 0;
  dashLatch = false;
  updateHud();
}

function resetGame() {
  Object.assign(player, {
    score: 0,
    coins: 0,
    lives: 4,
  });
  loadLevel(0, false);
  updateHud();
}

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function updateHud() {
  levelNoEl.textContent = currentLevelIndex + 1;
  levelNameEl.textContent = activeLevel ? activeLevel.name : levelDefs[0].name;
  scoreEl.textContent = player.score;
  coinsEl.textContent = player.coins;
  livesEl.textContent = player.lives;

  const effects = [];
  if (player.shield > 0) effects.push("护盾");
  if (player.spring > 0) effects.push("高跳");
  if (player.slow > 0) effects.push("缓速");
  if (player.dashCooldown <= 0) effects.push("冲刺就绪");
  powerStatusEl.textContent = effects.length ? effects.join(" / ") : "无道具效果";
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

function absorbHit() {
  if (player.shield > 0) {
    player.shield = 0;
    player.invincible = 120;
    player.vy = -11;
    player.vx = -player.face * 5;
    updateHud();
    return true;
  }
  return false;
}

function respawn() {
  if (player.invincible > 0 || absorbHit()) return;
  player.lives -= 1;
  updateHud();
  if (player.lives <= 0) {
    running = false;
    showOverlay("挑战结束", "星光碎了", "第三关尤其不讲武德。记住道具位置，再冲一次。");
    return;
  }
  const startX = Math.max(activeLevel.start.x, Math.min(player.x - 120, activeLevel.worldW - 520));
  player.x = startX;
  player.y = 350;
  player.vx = 0;
  player.vy = 0;
  player.invincible = 140;
}

function collectPowerup(powerup) {
  powerup.taken = true;
  player.score += 180;
  if (powerup.type === "shield") player.shield = 1;
  if (powerup.type === "spring") player.spring = 720;
  if (powerup.type === "slow") player.slow = 600;
  if (powerup.type === "dash") player.dashCooldown = 0;
  updateHud();
}

function finishLevel() {
  running = false;
  player.score += 1000 + currentLevelIndex * 500;
  updateHud();
  if (currentLevelIndex < levelDefs.length - 1) {
    showOverlay(
      `第 ${currentLevelIndex + 1} 关完成`,
      "光门开启",
      `下一关：${levelDefs[currentLevelIndex + 1].name}。当前 ${player.coins} 星，${player.score} 分。`,
      "进入下一关",
    );
    startBtn.dataset.nextLevel = String(currentLevelIndex + 1);
    return;
  }
  showOverlay("三关全破", "星芽封神", `你收集了 ${player.coins} 颗星，最终得分 ${player.score}。`, "再玩一局");
  startBtn.dataset.nextLevel = "0";
}

function update() {
  if (!running) return;

  const maxSpeed = player.spring > 0 ? 8.0 : 7.2;
  const jumpPower = player.spring > 0 ? -19.6 : -17.2;
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
  player.vx = Math.max(-maxSpeed, Math.min(maxSpeed, player.vx));

  if (keys.jump && player.onGround) {
    player.vy = jumpPower;
    player.onGround = false;
  }

  if (keys.dash && !dashLatch && player.dashCooldown <= 0) {
    player.vx = player.face * 15.5;
    player.dashCooldown = 70;
    player.invincible = Math.max(player.invincible, 16);
  }
  dashLatch = keys.dash;

  player.vy += GRAVITY;
  player.vy = Math.min(player.vy, 18);

  player.x += player.vx;
  for (const platform of activeLevel.platforms) {
    if (!rectsOverlap(player, platform)) continue;
    if (player.vx > 0) player.x = platform.x - player.w;
    if (player.vx < 0) player.x = platform.x + platform.w;
    player.vx = 0;
  }

  player.y += player.vy;
  player.onGround = false;
  for (const platform of activeLevel.platforms) {
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

  player.x = Math.max(0, Math.min(activeLevel.worldW - player.w, player.x));
  if (player.y > H + 120) respawn();
  if (player.invincible > 0) player.invincible -= 1;
  if (player.spring > 0) player.spring -= 1;
  if (player.slow > 0) player.slow -= 1;
  if (player.dashCooldown > 0) player.dashCooldown -= 1;

  for (const hazard of activeLevel.hazards) {
    if (rectsOverlap(player, hazard)) respawn();
  }

  for (const coin of activeLevel.coins) {
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

  for (const powerup of activeLevel.powerups) {
    if (powerup.taken) continue;
    const dx = player.x + player.w / 2 - powerup.x;
    const dy = player.y + player.h / 2 - powerup.y;
    if (Math.hypot(dx, dy) < powerup.r + 34) collectPowerup(powerup);
  }

  const enemySpeedScale = player.slow > 0 ? 0.45 : 1;
  for (const enemy of activeLevel.enemies) {
    if (!enemy.alive) continue;
    enemy.x += enemy.vx * enemySpeedScale;
    if (enemy.x < enemy.min || enemy.x + enemy.w > enemy.max) enemy.vx *= -1;

    if (rectsOverlap(player, enemy)) {
      const stomp = player.vy > 0 && player.y + player.h - enemy.y < 26;
      if (stomp) {
        enemy.alive = false;
        player.vy = -12.5;
        player.score += 250;
        updateHud();
      } else {
        respawn();
      }
    }
  }

  if (rectsOverlap(player, activeLevel.goal)) finishLevel();
  cameraX = Math.max(0, Math.min(activeLevel.worldW - W, player.x - W * 0.42));
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
  for (let i = 0; i < 10; i++) {
    const x = i * 560 + 80;
    drawCloud(x, 96 + (i % 3) * 56, 1 + (i % 2) * 0.22);
  }
  ctx.restore();

  ctx.save();
  ctx.translate(-cameraX * 0.36, 0);
  for (let i = 0; i < 14; i++) {
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
  for (let i = 0; i < 72; i++) {
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

function drawHazard(hazard, t) {
  const x = hazard.x - cameraX;
  const teeth = Math.max(3, Math.floor(hazard.w / 24));
  ctx.fillStyle = "#ff6f9e";
  ctx.beginPath();
  ctx.moveTo(x, hazard.y + hazard.h);
  for (let i = 0; i <= teeth; i++) {
    const px = x + (hazard.w / teeth) * i;
    ctx.lineTo(px - hazard.w / teeth / 2, hazard.y + 2 + Math.sin(t / 130 + i) * 2);
    ctx.lineTo(px, hazard.y + hazard.h);
  }
  ctx.closePath();
  ctx.fill();
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

function drawPowerup(powerup, t) {
  if (powerup.taken) return;
  const x = powerup.x - cameraX;
  const y = powerup.y + Math.sin(t / 180 + powerup.x) * 5;
  const colors = {
    shield: ["#72f2a5", "盾"],
    spring: ["#46e2ff", "跳"],
    slow: ["#b9a7ff", "缓"],
    dash: ["#ffd66b", "冲"],
  };
  const [color, label] = colors[powerup.type];
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(0, 0, powerup.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.75)";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = "#07111f";
  ctx.font = "900 16px 'Noto Sans SC', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, 0, 1);
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
  if (player.shield > 0) {
    ctx.strokeStyle = "rgba(114, 242, 165, 0.85)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(0, 0, 34, 42, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = player.spring > 0 ? "#72f2a5" : "#46e2ff";
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
  const x = activeLevel.goal.x + activeLevel.goal.w / 2 - cameraX;
  const y = activeLevel.goal.y + activeLevel.goal.h / 2;
  ctx.save();
  ctx.translate(x, y);
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
  for (const platform of activeLevel.platforms) drawPlatform(platform);
  for (const hazard of activeLevel.hazards) drawHazard(hazard, t);
  for (const coin of activeLevel.coins) drawCoin(coin, t);
  for (const powerup of activeLevel.powerups) drawPowerup(powerup, t);
  for (const enemy of activeLevel.enemies) drawEnemy(enemy, t);
  drawGoal(t);
  drawPlayer(t);

  ctx.fillStyle = "rgba(255,255,255,0.62)";
  ctx.font = "800 18px Inter, 'Noto Sans SC', sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(`${activeLevel.name}   A/D 移动  W/空格 跳跃  Shift 冲刺`, 28, 42);
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
  if (["ShiftLeft", "ShiftRight", "KeyJ"].includes(event.code)) {
    setControl("dash", true);
    event.preventDefault();
  }
});

window.addEventListener("keyup", (event) => {
  if (["ArrowLeft", "KeyA"].includes(event.code)) setControl("left", false);
  if (["ArrowRight", "KeyD"].includes(event.code)) setControl("right", false);
  if (["ArrowUp", "KeyW", "Space"].includes(event.code)) setControl("jump", false);
  if (["ShiftLeft", "ShiftRight", "KeyJ"].includes(event.code)) setControl("dash", false);
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
  const nextLevel = Number(startBtn.dataset.nextLevel || 0);
  if (nextLevel > 0 && nextLevel < levelDefs.length) {
    loadLevel(nextLevel, true);
  } else {
    resetGame();
  }
  startBtn.dataset.nextLevel = "0";
  running = true;
  window.scrollTo({ top: 0, behavior: "smooth" });
  hideOverlay();
});

resetGame();
showOverlay("准备出发", "星芽冒险", "方向键或 A/D 移动，空格或 W 跳跃，Shift/J 冲刺。手机端用屏幕按钮，收集护盾、高跳、缓速和冲刺道具。", "开始游戏");
render(0);
requestAnimationFrame(loop);
