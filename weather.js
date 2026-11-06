// ============================================================
// WEATHER.JS — дождь, снег, молния, частицы (пыль), кости
// Патч 22: добавлен снегопад для снежного биома
// ============================================================

function initRain() {
  rainDrops = [];
  for (let i = 0; i < 70; i++) {
    rainDrops.push({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: -speed * 0.5 - 2,
      vy: 15 + Math.random() * 10
    });
  }
}

function updateRain(dt) {
  if (!isRaining) return;
  rainDrops.forEach(r => {
    r.x += r.vx;
    r.y += r.vy;
    if (r.y > H || r.x < 0) {
      r.y = -20;
      r.x = Math.random() * W + W * 0.2;
    }
  });
  if (!lightning && Math.random() < 0.008) triggerLightning();
}

function drawRain() {
  if (!isRaining) return;
  ctx.strokeStyle = 'rgba(150, 200, 255, 0.5)';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  rainDrops.forEach(r => {
    ctx.beginPath();
    ctx.moveTo(r.x, r.y);
    ctx.lineTo(r.x - r.vx * 0.5, r.y - r.vy * 0.5);
    ctx.stroke();
  });
}

// ===== ПАТЧ 22: Снегопад =====
function initSnow() {
  snowflakes = [];
  for (let i = 0; i < 80; i++) {
    snowflakes.push({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 2 + 1,
      vx: -speed * 0.3 - Math.random() * 0.5,
      vy: 1 + Math.random() * 2,
      phase: Math.random() * Math.PI * 2
    });
  }
}

function updateSnow(dt) {
  const biomeInfo = getBiomeState(score);
  const isSnowBiome = biomeInfo.current.hasSnow || (biomeInfo.next && biomeInfo.next.hasSnow && biomeInfo.transitionT > 0.5);
  
  if (!isSnowBiome) {
    snowflakes = [];
    return;
  }
  
  if (snowflakes.length === 0) initSnow();
  
  snowflakes.forEach(s => {
    s.x += s.vx;
    s.y += s.vy;
    s.phase += 0.05;
    s.x += Math.sin(s.phase) * 0.5; // Легкое покачивание
    
    if (s.y > H || s.x < -10) {
      s.y = -10;
      s.x = Math.random() * W;
    }
  });
}

function drawSnow() {
  if (snowflakes.length === 0) return;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  snowflakes.forEach(s => {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  });
}

function triggerLightning() {
  const startX = 50 + Math.random() * (W - 100);
  const segments = [{ x: startX, y: 0 }];
  let x = startX, y = 0;
  const endY = GROUND_Y - 60;
  while (y < endY) {
    const step = 25 + Math.random() * 30;
    y = Math.min(y + step, endY);
    x += (Math.random() - 0.5) * 70;
    segments.push({ x, y });
  }
  lightning = { segments, life: 1 };
  lightningAmbient = 0.3;
  playThunder();
}

function updateLightning(dt) {
  if (lightning) {
    lightning.life -= dt * 3;
    if (lightning.life <= 0) lightning = null;
  }
  if (lightningAmbient > 0) {
    lightningAmbient = Math.max(0, lightningAmbient - dt * 1.5);
  }
}

function drawLightning() {
  if (lightningAmbient > 0) {
    ctx.fillStyle = `rgba(180, 210, 255, ${lightningAmbient * 0.25})`;
    ctx.fillRect(0, 0, W, GROUND_Y);
  }
  if (!lightning) return;
  const alpha = Math.max(0, lightning.life);
  ctx.save();
  ctx.shadowColor = `rgba(180, 220, 255, ${alpha})`;
  ctx.shadowBlur = 15;
  ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  const segs = lightning.segments;
  ctx.moveTo(segs[0].x, segs[0].y);
  for (let i = 1; i < segs.length; i++) ctx.lineTo(segs[i].x, segs[i].y);
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = `rgba(220, 240, 255, ${alpha * 0.9})`;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
}

function updateParticles() {
  particles.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.15;
    p.life -= 0.04;
  });
  particles = particles.filter(p => p.life > 0);
}

function updateBonesFlying() {
  bonesFlying.forEach(b => {
    b.x += b.vx;
    b.y += b.vy;
    b.vy += 0.3;
    b.rot += 0.2;
    b.life -= 0.02;
  });
  bonesFlying = bonesFlying.filter(b => b.life > 0);
}

function drawParticles() {
  particles.forEach(p => {
    ctx.fillStyle = `rgba(255,255,255,${p.life * 0.8})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawBonesFlying() {
  bonesFlying.forEach(b => {
    ctx.globalAlpha = b.life;
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(b.rot);
    drawBoneShape(0, 0, 16);
    ctx.restore();
    ctx.globalAlpha = 1;
  });
}
