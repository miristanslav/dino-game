// ============================================================
// PHYSICS.JS — коллизии, хитбоксы, спавн препятствий
// Патч 22.1: Увеличен спавн птиц
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
  const s = dino.scale;
  if (o.type === 'rock') return { x: o.x + 2 * s, y: o.y - o.h * s * 0.8, w: Math.max(12, o.w - 4) * s, h: o.h * s * 0.8 };
  if (o.type === 'stump') return { x: o.x + 2 * s, y: o.y - o.h * s, w: (o.w - 4) * s, h: o.h * s };
  if (o.type === 'poisonFlower') return { x: o.x + 2 * s, y: o.y - o.h * s, w: (o.w - 4) * s, h: o.h * s };
  return o.type === 'cactus_small'
    ? { x: o.x - 0.5 * s, y: o.y - o.h * s, w: 11 * s, h: o.h * s }
    : { x: o.x, y: o.y - o.h * s, w: 16 * s, h: o.h * s };
}

function getBirdBox(b) {
  return { x: b.x + 2 * BIRD_SCALE_GAME, y: b.y - 18 * BIRD_SCALE_GAME, w: 42 * BIRD_SCALE_GAME, h: 22 * BIRD_SCALE_GAME };
}

function spawnObstacle() {
  const biome = getBiomeState(distance).current.id;
  const r = Math.random();
  if (biome === 'desert') {
    if (r < 0.55) {
      const h = 14 + Math.random() * 7;
      obstacles.push({ x: W + 20, y: GROUND_Y, w: 8, h, type: 'cactus_small' });
    } else if (r < 0.82) {
      const h = 7 + Math.random() * 5, w = 13 + Math.random() * 9;
      obstacles.push({ x: W + 20, y: GROUND_Y, w, h, type: 'rock' });
    } else if (r < 0.94) {
      const heights = [GROUND_Y - 42, GROUND_Y - 92, GROUND_Y - 164];
      birds.push({ x: W + 20, y: heights[Math.floor(Math.random() * heights.length)], w: 10, h: 10, type: 'bird', isGolden: false, magnetized: false });
    } else {
      spawnGroundPowerUp();
    }
    return;
  }
  if (biome === 'forest') {
    if (r < 0.42) {
      const h = 12 + Math.random() * 12, w = 16 + Math.random() * 8;
      obstacles.push({ x: W + 20, y: GROUND_Y, w, h, type: 'stump' });
    } else if (r < 0.56) {
      obstacles.push({ x: W + 20, y: GROUND_Y, w: 17, h: 10, type: 'poisonFlower' });
    } else if (r < 0.90) {
      const heights = [GROUND_Y - 42, GROUND_Y - 92, GROUND_Y - 164];
      birds.push({ x: W + 20, y: heights[Math.floor(Math.random() * heights.length)], w: 10, h: 10, type: 'bird', isGolden: false, magnetized: false });
    } else {
      spawnGroundPowerUp();
    }
    return;
  }
  if (r < 0.35) {
    const big = Math.random() < 0.5, h = big ? 25 : 20, w = big ? 10 : 8;
    obstacles.push({ x: W + 20, y: GROUND_Y, w, h, type: big ? 'cactus_big' : 'cactus_small' });
  } else if (r < 0.90) {
    const heights = [GROUND_Y - 40, GROUND_Y - 90, GROUND_Y - 168];
    birds.push({ x: W + 20, y: heights[Math.floor(Math.random() * heights.length)], w: 10, h: 10, type: 'bird', isGolden: false, magnetized: false });
  } else {
    spawnGroundPowerUp();
  }
}

function spawnGroundPowerUp() {
  const types = [
    { type: 'shield', icon: '🛡', color: '#2196F3', duration: 5 },
    { type: 'doubleJump', icon: '🦘', color: '#FF9800', duration: 7 }
  ];
  const pu = types[Math.floor(Math.random() * types.length)];
  powerUps.push({ x: W + 20, y: GROUND_Y - 30 - Math.random() * 12, ...pu });
}

// ===== ПАТЧ 23: Спавн метеорита =====
function spawnMeteor() {
  meteors.push({
    x: W + 100,
    y: -100,
    vx: -5 - Math.random() * 3, // Летит влево
    vy: 4 + Math.random() * 3,  // Летит вниз
    r: 15,
    trail: [],
    hit: false
  });
  playThunder(); // Звук гула
}

function spawnDust(x, y, count, spread) {
  for (let i = 0; i < count; i++) {
    particles.push({ x: x + (Math.random() - 0.5) * 10, y: y, vx: -speed * 0.3 - Math.random() * 2, vy: -Math.random() * spread, life: 1, r: Math.random() * 2 + 1 });
  }
}
