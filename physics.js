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
  if (['stump','poisonFlower','iceSpike','snowBoulder','obsidian','lavaVent'].includes(o.type)) return { x: o.x + 2 * s, y: o.y - o.h * s, w: Math.max(8, o.w - 4) * s, h: o.h * s };
  return o.type === 'cactus_small'
    ? { x: o.x - 0.5 * s, y: o.y - o.h * s, w: 11 * s, h: o.h * s }
    : { x: o.x, y: o.y - o.h * s, w: 16 * s, h: o.h * s };
}

function getBirdBox(b) {
  const s = BIRD_SCALE_GAME;
  if (b.kind === 'predator' && b.altitude === 'medium') {
    // Средний хищник проходит над присевшим динозавром, но задевает стоящего.
    return { x: b.x + 4 * s, y: b.y - 10 * s, w: 34 * s, h: 8 * s };
  }
  if (b.kind === 'predator' && b.altitude === 'high') {
    return { x: b.x + 4 * s, y: b.y - 16 * s, w: 34 * s, h: 13 * s };
  }
  return { x: b.x + 2 * s, y: b.y - 18 * s, w: 42 * s, h: 22 * s };
}

function spawnPterodactyl() {
  const roll = Math.random();
  if (roll < 0.64) {
    const altitudeRoll = Math.random();
    const altitude = altitudeRoll < 0.65 ? 'high' : altitudeRoll < 0.9 ? 'medium' : 'low';
    const y = GROUND_Y - (altitude === 'high' ? 168 : altitude === 'medium' ? 108 : 62);
    birds.push({ kind: 'peaceful', altitude, x: -55, y, w: 44, h: 24,
      speedFactor: 0.48, dropChance: altitude === 'high' ? 1 : altitude === 'medium' ? 0.4 : 0.15,
      id: `ptero-${frame}-${Math.floor(Math.random() * 100000)}`, magnetized: false, wasClose: false });
    return;
  }
  const altitude = Math.random() < 0.58 ? 'medium' : 'high';
  const biome = getBiomeState(distance).current.id;
  const playerChance = ({ desert: 0.2, forest: 0.4, snow: 0.6, volcano: 0.8 })[biome] || 0.2;
  const targetPlayer = altitude === 'high' && Math.random() < playerChance;
  const target = altitude === 'high' && !targetPlayer ? birds.find(x => x.kind === 'peaceful' && x.x > W * 0.25) : null;
  birds.push({ kind: 'predator', altitude, x: W + 35,
    y: GROUND_Y - (altitude === 'high' ? 178 : 18), w: 44, h: 24,
    speedFactor: 1.28, targetPlayer, targetId: target ? target.id : null,
    diveStarted: false, magnetized: false, id: `hunter-${frame}-${Math.floor(Math.random() * 100000)}` });
}

function spawnBonusPterodactyl() {
  birds.push({ kind: 'bonus', altitude: 'high', x: W + 40, y: GROUND_Y - 195,
    w: 46, h: 25, speedFactor: 1.65, eggDropped: false, magnetized: false,
    id: `gold-${frame}-${Math.floor(Math.random() * 100000)}` });
}

function spawnGroundBone(x, amount) {
  groundBones.push({ x, y: GROUND_Y - 7, amount: Math.max(1, amount || 1), phase: Math.random() * 6 });
}

function resolveGoldenEgg() {
  const roll = Math.random();
  if (roll < 0.6) {
    cactusGuardHits += 5;
    guardPulse = 1;
    spawnFloatingText(W * 0.55, GROUND_Y - 75, '🛡 ЗАЩИТА: +5 УДАРОВ!');
  } else if (roll < 0.9) {
    passiveBoneTimer = 20; passiveBoneTick = 1;
    spawnFloatingText(W * 0.55, GROUND_Y - 75, '🦴 +1 КОСТЬ / СЕК');
  } else {
    let count = 0;
    birds = birds.filter(b => {
      if (b.kind && b.x > -60 && b.x < W + 60) {
        spawnGroundBone(Math.max(dino.x + 55, b.x), 1 + (save.upgrades.doubleBones || 0));
        count++; return false;
      }
      return true;
    });
    spawnFloatingText(W * 0.55, GROUND_Y - 75, `💥 ${count} ПТЕРОДАКТИЛЕЙ!`);
  }
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
    } else if (r < 0.94) spawnPterodactyl();
    else spawnGroundPowerUp();
    return;
  }

  if (biome === 'forest') {
    if (r < 0.42) {
      const h = 12 + Math.random() * 12, w = 16 + Math.random() * 8;
      obstacles.push({ x: W + 20, y: GROUND_Y, w, h, type: 'stump' });
    } else if (r < 0.56) obstacles.push({ x: W + 20, y: GROUND_Y, w: 17, h: 10, type: 'poisonFlower' });
    else if (r < 0.90) spawnPterodactyl();
    else spawnGroundPowerUp();
    return;
  }

  if (biome === 'snow') {
    if (r < 0.34) {
      const h = 22 + Math.random() * 17, w = 16 + Math.random() * 9;
      obstacles.push({ x: W + 20, y: GROUND_Y, w, h, type: 'iceSpike' });
    } else if (r < 0.58) {
      const h = 13 + Math.random() * 8, w = 22 + Math.random() * 12;
      obstacles.push({ x: W + 20, y: GROUND_Y, w, h, type: 'snowBoulder' });
    } else if (r < 0.88) spawnPterodactyl();
    else spawnGroundPowerUp();
    return;
  }

  // Вулкан: острые обсидиановые осколки и опасные лавовые жерла.
  if (r < 0.34) {
    const h = 24 + Math.random() * 18, w = 15 + Math.random() * 8;
    obstacles.push({ x: W + 20, y: GROUND_Y, w, h, type: 'obsidian' });
  } else if (r < 0.56) {
    obstacles.push({ x: W + 20, y: GROUND_Y, w: 25, h: 17 + Math.random() * 6, type: 'lavaVent' });
  } else if (r < 0.88) spawnPterodactyl();
  else spawnGroundPowerUp();
}

function spawnGroundPowerUp() {
  const types = [
    { type: 'shield', icon: '🛡', color: '#2196F3', duration: 5 },
    { type: 'doubleJump', icon: '🦘', color: '#FF9800', duration: 7 }
  ];
  const pu = types[Math.floor(Math.random() * types.length)];
  powerUps.push({ x: W + 20, y: GROUND_Y - 30 - Math.random() * 12, ...pu });
}

function spawnDust(x, y, count, spread) {
  for (let i = 0; i < count; i++) {
    particles.push({ x: x + (Math.random() - 0.5) * 10, y: y, vx: -speed * 0.3 - Math.random() * 2, vy: -Math.random() * spread, life: 1, r: Math.random() * 2 + 1 });
  }
}
