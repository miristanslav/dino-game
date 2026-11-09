// ============================================================
// BACKGROUND.JS — фон: небо, солнце, луна, звёзды, горы, земля
// Патч 26: biomeScore передаётся явно (фикс залипания биома в меню)
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
  return { x: W / 2 + Math.sin(angle) * W * 0.4, y: GROUND_Y - Math.cos(angle) * H * 0.5 };
}

function getMoonPos(t) {
  let localT;
  if (t >= 0.82) localT = (t - 0.82) / 0.36;
  else if (t <= 0.18) localT = (t + 0.18) / 0.36;
  else return null;
  if (localT < 0 || localT > 1) return null;
  const angle = -Math.PI / 2 + localT * Math.PI;
  return { x: W / 2 + Math.sin(angle) * W * 0.4, y: GROUND_Y - Math.cos(angle) * H * 0.5 };
}

// ПАТЧ 26: biomeScore — явный параметр (по умолчанию текущий score).
// В меню передаём 0, чтобы фон не «залипал» в позднем биоме после игры.
function getObjectColors(t, biomeScore) {
  if (biomeScore === undefined) biomeScore = score;
  const nightness = 1 - getLightLevel(t);
  const biomeState = getBiomeState(biomeScore);
  const b1 = biomeState.current;
  const b2 = biomeState.next || b1;
  const mixT = biomeState.transitionT;

  const baseGround = mixBiomeColor(b1.ground, b2.ground, mixT);
  const baseGroundLine = mixBiomeColor(b1.groundLine, b2.groundLine, mixT);
  const baseDirt = mixBiomeColor(b1.dirt, b2.dirt, mixT);
  const baseMountainFar = mixBiomeColor(b1.mountainFar, b2.mountainFar, mixT);
  const baseMountainNear = mixBiomeColor(b1.mountainNear, b2.mountainNear, mixT);
  const baseCactus = mixBiomeColor(b1.cactus, b2.cactus, mixT);
  const baseCactusLight = mixBiomeColor(b1.cactusLight, b2.cactusLight, mixT);
  const baseBird = mixBiomeColor(b1.bird, b2.bird, mixT);
  const baseCloud = mixBiomeColor(b1.cloud, b2.cloud, mixT);

  const toNight = (hex, maxDark = 0.85) => lerpColor(hex, '#0A0E1A', nightness * maxDark);

  return {
    cactus: toNight(baseCactus, 0.7),
    cactusLight: toNight(baseCactusLight, 0.7),
    ground: toNight(baseGround, 0.8),
    groundLine: toNight(baseGroundLine, 0.9),
    dirt: toNight(baseDirt, 0.9),
    bird: toNight(baseBird, 0.8),
    cloud: toNight(baseCloud, 0.7),
    mountainFar: toNight(baseMountainFar, 0.8),
    mountainNear: toNight(baseMountainNear, 0.8),
  };
}

function drawSun(pos, t) {
  if (!pos) return;
  const isLowSun = (t >= 0.18 && t <= 0.32) || (t >= 0.68 && t <= 0.82);
  let sunColor1, sunColor2, sunColor3, glowColor;
  if (isLowSun) { sunColor1 = '#FF7043'; sunColor2 = '#FFB74D'; sunColor3 = '#FFE0B2'; glowColor = 'rgba(255, 152, 0, 0.5)'; }
  else { sunColor1 = '#FFD54F'; sunColor2 = '#FFEB3B'; sunColor3 = '#FFF9C4'; glowColor = 'rgba(255, 235, 59, 0.5)'; }
  const halo = ctx.createRadialGradient(pos.x, pos.y, 20, pos.x, pos.y, 100);
  halo.addColorStop(0, glowColor); halo.addColorStop(1, 'rgba(255, 200, 80, 0)');
  ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(pos.x, pos.y, 100, 0, Math.PI * 2); ctx.fill();
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
  ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(pos.x, pos.y, glowRadius, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = `rgb(${bodyR}, ${bodyG}, ${bodyB})`; ctx.beginPath(); ctx.arc(pos.x, pos.y, 22, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(150, 140, 130, 0.18)';
  ctx.beginPath(); ctx.arc(pos.x - 6, pos.y - 4, 5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(pos.x + 8, pos.y + 6, 7, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(pos.x - 2, pos.y + 10, 3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(pos.x + 2, pos.y - 12, 2, 0, Math.PI * 2); ctx.fill();
}

function drawDesertLandscape(colors) {
  const farOffset = (frame * 0.12) % 520;
  ctx.fillStyle = colors.mountainFar;
  ctx.beginPath(); ctx.moveTo(0, GROUND_Y);
  for (let i = -1; i < 3; i++) {
    const x = i * 520 - farOffset;
    ctx.quadraticCurveTo(x + 130, GROUND_Y - 105, x + 260, GROUND_Y - 65);
    ctx.quadraticCurveTo(x + 390, GROUND_Y - 25, x + 520, GROUND_Y - 90);
  }
  ctx.lineTo(W, GROUND_Y); ctx.closePath(); ctx.fill();

  const nearOffset = (frame * 0.28) % 430;
  ctx.fillStyle = colors.mountainNear;
  ctx.beginPath(); ctx.moveTo(0, GROUND_Y);
  for (let i = -1; i < 4; i++) {
    const x = i * 430 - nearOffset;
    ctx.lineTo(x + 70, GROUND_Y - 42);
    ctx.quadraticCurveTo(x + 190, GROUND_Y - 118, x + 300, GROUND_Y - 55);
    ctx.lineTo(x + 430, GROUND_Y);
  }
  ctx.lineTo(W, GROUND_Y); ctx.closePath(); ctx.fill();

  // Дальние каньоны — мягкие уступы, не горные пики.
  ctx.fillStyle = colors.dirt;
  ctx.globalAlpha = 0.22;
  for (let i = -1; i < 3; i++) {
    const x = i * 560 - (frame * 0.08) % 560;
    ctx.fillRect(x + 90, GROUND_Y - 54, 115, 54);
    ctx.fillRect(x + 120, GROUND_Y - 76, 58, 22);
  }
  ctx.globalAlpha = 1;
}

function drawForestLandscape(colors) {
  function treeRow(baseY, spacing, scale, offset, color, alpha) {
    ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = color;
    for (let i = -2; i < Math.ceil(W / spacing) + 2; i++) {
      const x = i * spacing - offset;
      const h = 100 * scale, width = 62 * scale;
      ctx.fillRect(x - 4 * scale, baseY - 18 * scale, 8 * scale, 22 * scale);
      ctx.beginPath();
      ctx.moveTo(x, baseY - h);
      ctx.lineTo(x - width / 2, baseY - h * 0.35);
      ctx.lineTo(x - width * 0.27, baseY - h * 0.35);
      ctx.lineTo(x - width * 0.62, baseY - h * 0.05);
      ctx.lineTo(x + width * 0.62, baseY - h * 0.05);
      ctx.lineTo(x + width * 0.27, baseY - h * 0.35);
      ctx.lineTo(x + width / 2, baseY - h * 0.35);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }
  treeRow(GROUND_Y + 8, 105, 0.95, (frame * 0.16) % 105, colors.mountainFar, 0.85);
  treeRow(GROUND_Y + 5, 145, 1.35, (frame * 0.32) % 145, colors.mountainNear, 0.95);
}


function drawSnowLandscape(colors) {
  const farOffset = (frame * 0.09) % 420;
  ctx.fillStyle = '#A9C9D8'; ctx.beginPath(); ctx.moveTo(0, GROUND_Y);
  for (let i = -1; i < 4; i++) {
    const x = i * 420 - farOffset;
    ctx.lineTo(x + 90, GROUND_Y - 125); ctx.lineTo(x + 160, GROUND_Y - 58);
    ctx.lineTo(x + 265, GROUND_Y - 175); ctx.lineTo(x + 345, GROUND_Y - 75); ctx.lineTo(x + 420, GROUND_Y);
  }
  ctx.lineTo(W, GROUND_Y); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#F4FBFF'; ctx.globalAlpha = 0.92;
  for (let i = -1; i < 4; i++) {
    const x = i * 420 - farOffset;
    ctx.beginPath(); ctx.moveTo(x + 160, GROUND_Y - 58); ctx.lineTo(x + 265, GROUND_Y - 175);
    ctx.lineTo(x + 242, GROUND_Y - 105); ctx.lineTo(x + 220, GROUND_Y - 120); ctx.lineTo(x + 198, GROUND_Y - 84); ctx.closePath(); ctx.fill();
  }
  ctx.globalAlpha = 1;
  const offset = (frame * 0.22) % 170;
  for (let i = -2; i < Math.ceil(W / 170) + 2; i++) {
    const x = i * 170 - offset, base = GROUND_Y + 3, height = 62 + (i % 3) * 12;
    ctx.fillStyle = '#315F78'; ctx.fillRect(x - 4, base - 24, 8, 28);
    ctx.beginPath(); ctx.moveTo(x, base - height); ctx.lineTo(x - 34, base - 14); ctx.lineTo(x - 15, base - 18); ctx.lineTo(x, base - 5); ctx.lineTo(x + 15, base - 18); ctx.lineTo(x + 34, base - 14); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#E9F7FF'; ctx.beginPath(); ctx.moveTo(x, base - height); ctx.lineTo(x - 13, base - height + 25); ctx.lineTo(x, base - height + 19); ctx.lineTo(x + 13, base - height + 25); ctx.closePath(); ctx.fill();
  }
}

function drawVolcanoLandscape(colors) {
  const offset = (frame * 0.075) % 560;
  ctx.fillStyle = '#432C35'; ctx.beginPath(); ctx.moveTo(0, GROUND_Y);
  for (let i = -1; i < 3; i++) {
    const x = i * 560 - offset;
    ctx.lineTo(x + 75, GROUND_Y - 52); ctx.lineTo(x + 190, GROUND_Y - 185);
    ctx.lineTo(x + 260, GROUND_Y - 132); ctx.lineTo(x + 365, GROUND_Y - 220);
    ctx.lineTo(x + 475, GROUND_Y - 62); ctx.lineTo(x + 560, GROUND_Y);
  }
  ctx.lineTo(W, GROUND_Y); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#FF5722'; ctx.lineWidth = 4; ctx.globalAlpha = 0.8;
  for (let i = -1; i < 3; i++) {
    const x = i * 560 - offset;
    ctx.beginPath(); ctx.moveTo(x + 190, GROUND_Y - 185); ctx.quadraticCurveTo(x + 230, GROUND_Y - 120, x + 300, GROUND_Y - 80); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + 365, GROUND_Y - 220); ctx.quadraticCurveTo(x + 390, GROUND_Y - 140, x + 440, GROUND_Y - 95); ctx.stroke();
  }
  ctx.globalAlpha = 1;
  // Светящиеся кратеры и дымовые облака над дальними конусами.
  for (let i = -1; i < 3; i++) {
    const x = i * 560 - offset + 365, y = GROUND_Y - 218;
    ctx.fillStyle = 'rgba(255,87,34,0.75)'; ctx.beginPath(); ctx.ellipse(x, y + 5, 19, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(72,58,58,0.55)';
    for (let j = 0; j < 3; j++) {
      const drift = (frame * (0.12 + j * 0.025) + j * 17) % 42;
      ctx.beginPath(); ctx.arc(x + Math.sin(frame * 0.012 + j) * 8, y - 15 - drift, 7 + j * 3, 0, Math.PI * 2); ctx.fill();
    }
  }
}

function drawDesertHerd() {
  ctx.save(); ctx.fillStyle = '#51483D'; ctx.globalAlpha = 0.48;
  const count = 4;
  for (let i = 0; i < count; i++) {
    const span = W + 130;
    const x = ((i * (W / count) - frame * 0.72) % span + span) % span - 65;
    const y = GROUND_Y - 8 - (i % 2) * 4;
    const scale = 0.28 + (i % 2) * 0.035;
    const leg = Math.sin(frame * 0.22 + i * 1.7) * 7 * scale;
    ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
    ctx.beginPath(); ctx.ellipse(0, -23, 30, 13, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(18, -27); ctx.lineTo(32, -43); ctx.lineTo(49, -46); ctx.lineTo(53, -36); ctx.lineTo(39, -31); ctx.lineTo(31, -17); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-25, -24); ctx.lineTo(-52, -34); ctx.lineTo(-48, -27); ctx.lineTo(-25, -17); ctx.fill();
    ctx.fillRect(27, -48, 20, 4);
    ctx.fillRect(-17, -15, 6, 17 + leg);
    ctx.fillRect(4, -15, 6, 17 - leg);
    ctx.fillRect(17, -15, 6, 17 - leg);
    ctx.restore();
  }
  ctx.restore();
}

function drawBackground(timeOfDay, showCelestial, biomeScore) {
  if (showCelestial === undefined) showCelestial = true;
  const colors = getObjectColors(timeOfDay, biomeScore);
  const skyColors = getSkyColors(timeOfDay);
  const lightLevel = getLightLevel(timeOfDay);
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, skyColors.top); grad.addColorStop(1, skyColors.bot);
  ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);

  if (lightLevel < 0.7) {
    const starAlpha = Math.max(0, 1 - lightLevel * 1.5);
    stars.forEach(star => {
      const twinkle = 0.6 + Math.sin(frame * 0.03 + star.phase) * 0.4;
      const alpha = starAlpha * star.brightness * twinkle;
      if (alpha > 0.05) {
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.beginPath(); ctx.arc(star.x * W, star.y * H, star.size, 0, Math.PI * 2); ctx.fill();
      }
    });
  }

  if (showCelestial) {
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, GROUND_Y); ctx.clip();
    drawSun(getSunPos(timeOfDay), timeOfDay); drawMoon(getMoonPos(timeOfDay), timeOfDay);
    ctx.restore();
  }

  clouds.forEach(c => {
    const s = c.s; ctx.fillStyle = colors.cloud; ctx.globalAlpha = 0.8;
    ctx.beginPath(); ctx.ellipse(c.x + 20 * s, c.y + 5 * s, 25 * s, 12 * s, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(c.x + 10 * s, c.y, 15 * s, 10 * s, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  });

  const activeBiome = getBiomeState(biomeScore === undefined ? distance : biomeScore).current;
  if (activeBiome.id === 'desert') {
    drawDesertLandscape(colors);
    drawDesertHerd();
  } else if (activeBiome.id === 'forest') {
    drawForestLandscape(colors);
  } else if (activeBiome.id === 'snow') {
    drawSnowLandscape(colors);
  } else {
    drawVolcanoLandscape(colors);
  }
}

function drawGround(timeOfDay, biomeScore) {
  const colors = getObjectColors(timeOfDay, biomeScore);
  const farY = GROUND_Y - 18;
  const nearLeft = -W * 0.12, nearRight = W * 1.12;
  // Плоскость дорожки расширяется к переднему краю: ракурс сбоку-сверху.
  const plane = ctx.createLinearGradient(0, farY, 0, H);
  plane.addColorStop(0, colors.ground);
  plane.addColorStop(0.55, colors.dirt);
  plane.addColorStop(1, colors.ground);
  ctx.fillStyle = plane;
  ctx.beginPath(); ctx.moveTo(0, farY); ctx.lineTo(W, farY);
  ctx.lineTo(nearRight, H + 2); ctx.lineTo(nearLeft, H + 2); ctx.closePath(); ctx.fill();

  ctx.strokeStyle = colors.groundLine; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(0, farY); ctx.lineTo(W, farY); ctx.stroke();

  ctx.save();
  ctx.globalAlpha = 0.24; ctx.strokeStyle = colors.groundLine; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(W * 0.18, farY); ctx.lineTo(nearLeft + W * 0.22, H); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(W * 0.82, farY); ctx.lineTo(nearRight - W * 0.22, H); ctx.stroke();

  ctx.globalAlpha = 0.17; ctx.strokeStyle = colors.dirt; ctx.lineWidth = 1;
  const vanishX = W * 0.5, depth = Math.max(1, H - farY);
  const drift = (frame * GROUND_SCROLL_SPEED * 0.72) % 92;
  for (let i = -6; i <= 6; i++) {
    const bottomX = vanishX + i * W * 0.2 - drift;
    ctx.beginPath(); ctx.moveTo(vanishX, farY); ctx.lineTo(bottomX, H); ctx.stroke();
  }
  for (let i = 1; i <= 9; i++) {
    const t = i / 9, y = farY + depth * t * t, halfWidth = W * (0.5 + 0.12 * t);
    ctx.beginPath(); ctx.moveTo(W / 2 - halfWidth, y); ctx.lineTo(W / 2 + halfWidth, y); ctx.stroke();
  }
  ctx.restore();

  ctx.save(); ctx.globalAlpha = 0.35; ctx.strokeStyle = colors.groundLine; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(nearLeft, H - 2); ctx.lineTo(nearRight, H - 2); ctx.stroke(); ctx.restore();

  ctx.save();
  ctx.beginPath(); ctx.moveTo(0, farY); ctx.lineTo(W, farY); ctx.lineTo(nearRight, H);
  ctx.lineTo(nearLeft, H); ctx.closePath(); ctx.clip();
  ctx.fillStyle = colors.dirt;
  groundDots.forEach(d => { ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2); ctx.fill(); });
  ctx.strokeStyle = colors.groundLine; ctx.lineWidth = 1.5;
  for (let i = 0; i < 30; i++) {
    const gx = (i * 50 - (frame * GROUND_SCROLL_SPEED) % 50);
    ctx.beginPath(); ctx.moveTo(gx, GROUND_Y + 5); ctx.lineTo(gx + 2, GROUND_Y - 8); ctx.stroke();
  }
  ctx.restore();
}
