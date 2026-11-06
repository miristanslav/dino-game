// ============================================================
// PHYSICS.JS — коллизии, хитбоксы, спавн препятствий и частиц
// Использует: dino, W, GROUND_Y, speed, obstacles, birds, powerUps, particles
// ============================================================

function rectCollide(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function boxDistance(a, b) {
  const dx = Math.max(0, Math.max(a.x - (b.x + b.w), b.x - (a.x + a.w)));
  const dy = Math.max(0, Math.max(a.y - (b.y + b.h), b.y - (a.y + a.h)));
  return Math.sqrt(dx * dx + dy * dy);
}

function getDinoBox() {
  return dino.ducking && !dino.jumping
    ? { x: dino.x + 6 * dino.scale, y: dino.y - 14 * dino.scale, w: 18 * dino.scale, h: 14 * dino.scale }
    : { x: dino.x + 6 * dino.scale, y: dino.y - 24 * dino.scale, w: 18 * dino.scale, h: 24 * dino.scale };
}

function getCactusBox(o) {
  return o.type === 'cactus_small'
    ? { x: o.x - 0.5 * dino.scale, y: o.y - o.h * dino.scale, w: 11 * dino.scale, h: o.h * dino.scale }
    : { x: o.x, y: o.y - o.h * dino.scale, w: 16 * dino.scale, h: o.h * dino.scale };
}

function getBirdBox(b) {
  return {
    x: b.x + 2 * BIRD_SCALE_GAME,
    y: b.y - 18 * BIRD_SCALE_GAME,
    w: 42 * BIRD_SCALE_GAME,
    h: 22 * BIRD_SCALE_GAME
  };
}

function spawnObstacle() {
  const r = Math.random();
  if (r < 0.45) {
    const big = Math.random() < 0.5;
    const h = big ? 25 : 20;
    const w = big ? 10 : 8;
    obstacles.push({ x: W + 20, y: GROUND_Y, w, h, type: big ? 'cactus_big' : 'cactus_small' });
  } else if (r < 0.85) {
    const heights = [GROUND_Y - 40, GROUND_Y - 90, GROUND_Y - 168];
    const y = heights[Math.floor(Math.random() * heights.length)];
    birds.push({ x: W + 20, y, w: 10, h: 10, type: 'bird', magnetized: false });
  } else {
    const types = [
      { type: 'shield', icon: '🛡', color: '#2196F3', duration: 5 },
      { type: 'doubleJump', icon: '🦘', color: '#FF9800', duration: 7 }
    ];
    const pu = types[Math.floor(Math.random() * types.length)];
    powerUps.push({ x: W + 20, y: GROUND_Y - 80 + Math.random() * 40, ...pu });
  }
}

function spawnDust(x, y, count, spread) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x: x + (Math.random() - 0.5) * 10,
      y: y,
      vx: -speed * 0.3 - Math.random() * 2,
      vy: -Math.random() * spread,
      life: 1,
      r: Math.random() * 2 + 1
    });
  }
                     }
