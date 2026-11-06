// ============================================================
// BACKGROUND.JS — фон: небо, солнце, луна, звёзды, горы, земля
// Патч 22: цвета берутся из текущего биома + плавный переход
// ============================================================

function getSkyColors(t) {
  for (let i = 0; i < TIME_KEYS.length - 1; i++) {
    if (t >= TIME_KEYS[i].t && t <= TIME_KEYS[i + 1].t) {
      const lt = (t - TIME_KEYS[i].t) / (TIME_KEYS[i + 1].t - TIME_KEYS[i].t);
      return {
        top: lerpColor(TIME_KEYS[i].top, TIME_KEYS[i + 1].top, lt),
        bot: lerpColor(TIME_KEYS[i].bot, TIME_KEYS[i + 1].bot, lt),
      };
    }
  }
  return { top: TIME_KEYS[0].top, bot: TIME_KEYS[0].bot };
}

function getLightLevel(t) {
  if (t >= 0.32 && t <= 0.68) return 1.0;
  if (t >= 0.92 || t <= 0.08) return 0.0;
  if (t > 0.08 && t < 0.32) return (t - 0.08) / 0.24;
  if (t > 0.68 && t < 0.92) return 1.0 - (t - 0.68) / 0.24;
  return 0.5;
}

function getSunPos(t) {
  if (t < 0.18 || t > 0.82) return null;
  const localT = (t - 0.18) / 0.64;
  const angle = -Math.PI / 2 + localT * Math.PI;
  return {
    x: W / 2 + Math.sin(angle) * W * 0.4,
    y: GROUND_Y - Math.cos(angle) * H * 0.5
  };
}

function getMoonPos(t) {
  let localT;
  if (t >= 0.82) localT = (t - 0.82) / 0.36;
  else if (t <= 0.18) localT = (t + 0.18) / 0.36;
  else return null;

  if (localT < 0 || localT > 1) return null;
  const angle = -Math.PI / 2 + localT * Math.PI;
  return {
    x: W / 2 + Math.sin(angle) * W * 0.4,
    y: GROUND_Y - Math.cos(angle) * H * 0.5
  };
}

// ===== ПАТЧ 22: цвета берутся из биома =====
function getObjectColors(t) {
  const nightness = 1 - getLightLevel(t);
  
  // Получаем текущий биом и переход
  const biomeState = getBiomeState(score);
  const b1 = biomeState.current;
  const b2 = biomeState.next || b1; // если следующего нет, смешиваем с самим собой
  const mixT = biomeState.transitionT;

  // Смешиваем цвета биомов
  const baseGround = mixBiomeColor(b1.ground, b2.ground, mixT);
  const baseGroundLine = mixBiomeColor(b1.groundLine, b2.groundLine, mixT);
  const baseDirt = mixBiomeColor(b1.dirt, b2.dirt, mixT);
  const baseMountainFar = mixBiomeColor(b1.mountainFar, b2.mountainFar, mixT);
  const baseMountainNear = mixBiomeColor(b1.mountainNear, b2.mountainNear, mixT);
  const baseCactus = mixBiomeColor(b1.cactus, b2.cactus, mixT);
  const baseCactusLight = mixBiomeColor(b1.cactusLight, b2.cactusLight, mixT);
  const baseBird = mixBiomeColor(b1.bird, b2.bird, mixT);
  const baseCloud = mixBiomeColor(b1.cloud, b2.cloud, mixT);

  // Применяем затемнение от ночи
  return {
    cactus: lerpColor(baseCactus, '#4CAF50', nightness * 0.4), // можно оставить ночное осветление
    cactusLight: lerpColor(baseCactusLight, '#66BB6A', nightness * 0.4),
    ground: lerpColor(baseGround, '#558B2F', nightness * 0.8),
    groundLine: lerpColor(baseGroundLine, '#1B5E20', nightness * 0.5),
    dirt: lerpColor(baseDirt, '#5D4037', nightness * 0.5),
    bird: lerpColor(baseBird, '#CFD8DC', nightness),
    cloud: lerpColor(baseCloud, '#90A4AE', nightness),
    mountainFar: lerpColor(baseMountainFar, '#3949AB', nightness),
    mountainNear: lerpColor(baseMountainNear, '#1B5E20', nightness),
  };
}

function drawSun(pos, t) {
  if (!pos) return;
  const isLowSun = (t >= 0.18 && t <= 0.32) || (t >= 0.68 && t <= 0.82);
  let sunColor1, sunColor2, sunColor3, glowColor;
  if (isLowSun) {
    sunColor1 = '#FF7043'; sunColor2 = '#FFB74D'; sunColor3 = '#FFE0B2'; glowColor = 'rgba(255, 152, 0, 0.5)';
  } else {
    sunColor1 = '#FFD54F'; sunColor2 = '#FFEB3B'; sunColor3 = '#FFF9C4'; glowColor = 'rgba(255, 235, 59, 0.5)';
  }
  const halo = ctx.createRadialGradient(pos.x, pos.y, 20, pos.x, pos.y, 100);
  halo.addColorStop(0, glowColor);
  halo.addColorStop(1, 'rgba(255, 200, 80, 0)');
  ctx.fillStyle = halo;
  ctx.beginPath(); ctx.arc(pos.x, pos.y, 100, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = sunColor1; ctx.beginPath(); ctx.arc(pos.x, pos.y, 32, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = sunColor2; ctx.beginPath(); ctx.arc(pos.x, pos.y, 24, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = sunColor3; ctx.beginPath(); ctx.arc(pos.x, pos.y, 12, 0, Math.PI * 2); ctx.fill();
}

function drawMoon(pos, t) {
  if (!pos) return;
  let warmth = 0;
  if (t >= 0.78 && t <= 0.90) warmth = 1 - (t - 0.78) / 0.12;
  else if (t >= 0.10 && t <= 0.22) warmth = (t - 0.10) / 0.12;
  warmth = Math.max(0, Math.min(1, warmth));

  const bodyR = Math.round(240 + (255 - 240) * warmth);
  const bodyG = Math.round(244 + (242 - 244) * warmth);
  const bodyB = Math.round(255 + (214 - 255) * warmth);

  const glowRadius = 38;
  const halo = ctx.createRadialGradient(pos.x, pos.y, 22, pos.x, pos.y, glowRadius);
  halo.addColorStop(0, `rgba(${bodyR}, ${bodyG}, ${bodyB}, 0.15)`);
  halo.addColorStop(0.6, `rgba(${bodyR}, ${bodyG}, ${bodyB}, 0.04)`);
  halo.addColorStop(1, `rgba(${bodyR}, ${bodyG}, ${bodyB}, 0)`);
  ctx.fillStyle = halo;
  ctx.beginPath(); ctx.arc(pos.x, pos.y, glowRadius, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = `rgb(${bodyR}, ${bodyG}, ${bodyB})`;
  ctx.beginPath(); ctx.arc(pos.x, pos.y, 22, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = 'rgba(150, 140, 130, 0.18)';
  ctx.beginPath(); ctx.arc(pos.x - 6, pos.y - 4, 5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(pos.x + 8, pos.y + 6, 7, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(pos.x - 2, pos.y + 10, 3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(pos.x + 2, pos.y - 12, 2, 0, Math.PI * 2); ctx.fill();
}

function drawBackground(timeOfDay, showCelestial) {
  if (showCelestial === undefined) showCelestial = true;
  const colors = getObjectColors(timeOfDay);
  const skyColors = getSkyColors(timeOfDay);
  const lightLevel = getLightLevel(timeOfDay);

  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, skyColors.top);
  grad.addColorStop(1, skyColors.bot);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  if (lightLevel < 0.7) {
    const starAlpha = Math.max(0, 1 - lightLevel * 1.5);
    stars.forEach(star => {
      const twinkle = 0.6 + Math.sin(frame * 0.03 + star.phase) * 0.4;
      const alpha = starAlpha * star.brightness * twinkle;
      if (alpha > 0.05) {
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(star.x * W, star.y * H, star.size, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }

  if (showCelestial) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, W, GROUND_Y);
    ctx.clip();
    drawSun(getSunPos(timeOfDay), timeOfDay);
    drawMoon(getMoonPos(timeOfDay), timeOfDay);
    ctx.restore();
  }

  clouds.forEach(c => {
    const s = c.s;
    ctx.fillStyle = colors.cloud;
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.ellipse(c.x + 20 * s, c.y + 5 * s, 25 * s, 12 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(c.x + 10 * s, c.y, 15 * s, 10 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  });

  ctx.fillStyle = colors.mountainFar;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y);
  const offset = (frame * 0.1) % 400;
  for (let i = -1; i < 4; i++) {
    const bx = i * 300 - offset;
    ctx.lineTo(bx + 80, GROUND_Y - 90);
    ctx.lineTo(bx + 160, GROUND_Y - 30);
    ctx.lineTo(bx + 220, GROUND_Y - 110);
    ctx.lineTo(bx + 300, GROUND_Y);
  }
  ctx.lineTo(W, GROUND_Y);
  ctx.lineTo(W, GROUND_Y + 2);
  ctx.lineTo(0, GROUND_Y + 2);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = colors.mountainNear;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y);
  const offset2 = (frame * 0.25) % 500;
  for (let i = -1; i < 3; i++) {
    const bx = i * 400 - offset2;
    ctx.lineTo(bx + 100, GROUND_Y - 50);
    ctx.lineTo(bx + 200, GROUND_Y - 15);
    ctx.lineTo(bx + 300, GROUND_Y - 60);
    ctx.lineTo(bx + 400, GROUND_Y);
  }
  ctx.lineTo(W, GROUND_Y);
  ctx.closePath();
  ctx.fill();
}

function drawGround(timeOfDay) {
  const colors = getObjectColors(timeOfDay);
  ctx.fillStyle = colors.ground;
  ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);
  ctx.strokeStyle = colors.groundLine;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y);
  ctx.lineTo(W, GROUND_Y);
  ctx.stroke();

  ctx.fillStyle = colors.dirt;
  groundDots.forEach(d => {
    ctx.beginPath();
    ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.strokeStyle = colors.groundLine;
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 30; i++) {
    const gx = (i * 50 - (frame * speed) % 50);
    ctx.beginPath();
    ctx.moveTo(gx, GROUND_Y + 4);
    ctx.lineTo(gx + 2, GROUND_Y - 6);
    ctx.stroke();
  }
      }
