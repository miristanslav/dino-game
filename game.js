function removeSplash() { const splash = document.getElementById('splashScreen'); if (splash) { splash.classList.add('fade-out'); setTimeout(() => { if (splash.parentNode) splash.parentNode.removeChild(splash); }, 500); } }
window.addEventListener('load', () => setTimeout(removeSplash, 1000)); setTimeout(removeSplash, 2000);

function haptic(type) { if (isTelegram && tgApp?.HapticFeedback) { try { const hf = tgApp.HapticFeedback; if (type === 'jump') hf.impactOccurred('light'); if (type === 'eat') hf.notificationOccurred('success'); if (type === 'crash') hf.notificationOccurred('error'); if (type === 'buy') hf.impactOccurred('medium'); } catch (e) {} } }

let fullscreenRequested = false;
function requestTgFullscreen() { if (!isTelegram || fullscreenRequested) return; try { if (tgApp && tgApp.requestFullscreen) { tgApp.requestFullscreen(); fullscreenRequested = true; setTimeout(() => resizeCanvas(), 300); } } catch (e) {} }
if (isTelegram) { setTimeout(requestTgFullscreen, 50); document.addEventListener('pointerdown', function firstTap() { requestTgFullscreen(); document.removeEventListener('pointerdown', firstTap); }); }

function resizeCanvas() {
  const oldGroundY = GROUND_Y; const vv = window.visualViewport;
  W = vv ? vv.width : window.innerWidth; H = vv ? vv.height : window.innerHeight;
  canvas.width = W; canvas.height = H; GROUND_Y = H * 0.8;
  if (!dino.jumping) dino.y = GROUND_Y;
  groundDots.forEach(d => { d.y = GROUND_Y + 6 + Math.random() * 20; }); obstacles.forEach(o => { o.y = GROUND_Y; });
  const dY = GROUND_Y - oldGroundY; birds.forEach(b => { b.y += dY; }); powerUps.forEach(p => { p.y += dY; });
  if (lightning) lightning = null;
}
window.addEventListener('resize', () => resizeCanvas());
if (window.visualViewport) window.visualViewport.addEventListener('resize', () => resizeCanvas());
window.addEventListener('orientationchange', () => setTimeout(() => resizeCanvas(), 200));
if (isTelegram && tgApp?.onEvent) { try { tgApp.onEvent('viewportChanged', () => setTimeout(() => resizeCanvas(), 100)); } catch (e) {} }

function getComboMultiplier() { if (comboCount >= 6) return 3; if (comboCount >= 3) return 2; return 1; }
function updateComboHUD(pulse) {
  const mult = getComboMultiplier();
  if (mult > 1) { comboMult.textContent = `🔥 x${mult}`; comboHud.classList.remove('hidden'); if (pulse) { comboHud.classList.remove('pulse'); void comboHud.offsetWidth; comboHud.classList.add('pulse'); } }
  else comboHud.classList.add('hidden');
}
function resetCombo() { if (comboCount > 0) { comboCount = 0; comboTimer = 0; updateComboHUD(); } }

function pauseGame() {
  if (gameState !== 'playing') return;
  gameState = 'paused';
  dino.ducking = false;
  pauseScreen.classList.remove('hidden');
  pauseBtn.classList.add('hidden');
  stopMusic();
}

function resumeGame() {
  if (gameState !== 'paused') return;
  gameState = 'playing';
  pauseScreen.classList.add('hidden');
  pauseBtn.classList.remove('hidden');
  lastTime = performance.now();
  if (musicEnabled) startMusic();
}

function jump() {
  if (gameState !== 'playing' || dino.ducking || isPortraitMode) return;
  duckTimer = 0;
  const hasDoubleJump = activePowerUps.some(a => a.type === 'doubleJump');
  if (!dino.jumping) {
    dino.vy = JUMP_FORCE - (save.upgrades.jump * 1.08); dino.jumping = true; dino.jumpsLeft = hasDoubleJump ? 1 : 0;
    haptic('jump'); playSound('jump'); spawnDust(dino.x + 30, GROUND_Y, 6, 3);
  } else if (dino.jumpsLeft > 0) {
    dino.vy = JUMP_FORCE * 0.9; dino.jumpsLeft--; haptic('jump'); playSound('jump'); spawnDust(dino.x + 30, dino.y, 6, 3);
  }
}
function duck(on, duration) {
  if (gameState !== 'playing' || dino.jumping || isPortraitMode) return;
  dino.ducking = on;
  duckTimer = on ? (Number.isFinite(duration) ? Math.max(0, duration) : Infinity) : 0;
}

// ПАТЧ 26: вынесено из reset() — используется и при сбросе прогресса
function takeDamage() {
  if (damageCooldown > 0 || gameState !== 'playing') return false;
  currentLives = Math.max(0, currentLives - 1);
  damageCooldown = 1.1;
  shakeTime = 10;
  haptic('crash'); playSound('crash');
  spawnFloatingText(dino.x + 20, dino.y - 55, '-1 ❤️');
  updateHUD();
  if (currentLives <= 0) { gameOver(); return false; }
  return true;
}

function clearRoundState() {
  obstacles = []; birds = []; particles = []; bonesFlying = []; powerUps = []; rainDrops = []; snowflakes = []; activePowerUps = []; meteors = []; lightning = null; lightningAmbient = 0;
  dino.y = GROUND_Y; dino.vy = 0; dino.jumping = false; dino.ducking = false; duckTimer = 0; dino.jumpsLeft = 1;
  score = 0; distance = 0; sessionBones = 0; currentLives = 1 + (save.upgrades.lives || 0); damageCooldown = 0; poisonOverlayTimer = 0; speed = BASE_SPEED; frame = 0; spawnTimer = 40; meteorTimer = 15; dino.scale = DINO_SCALE_GAME;
  ghostUsed = false; petX = dino.x - 40; petY = GROUND_Y - 60;
  comboCount = 0; comboTimer = 0; updateComboHUD();
  dayNightTime = 0.25 * DAY_NIGHT_CYCLE; weatherTime = 0; isRaining = false; birdsEatenThisGame = 0; lastPowerUpSecond = -1;
  updatePowerUpHUD();
}

function reset() {
  requestTgFullscreen();
  clearRoundState();
  gameState = 'playing';
  hideAllScreens();
  pauseBtn.classList.remove('hidden');
  hud.classList.remove('hidden');
  xpBarContainer.classList.remove('hidden');
  speedBarContainer.classList.add('active');
  fullscreenBtn.classList.remove('hidden');
  versionBtn.style.display = 'none';
  tapHint.classList.remove('hidden');
  setTimeout(() => tapHint.classList.add('hidden'), 2000);
  updateHUD();
  initAudio();
  startMusic();
}

function gameOver() {
  gameState = 'gameover'; shakeTime = 15; haptic('crash'); playSound('crash'); spawnDust(dino.x + 30, dino.y - 20, 15, 5); stopMusic();
  comboCount = 0; comboTimer = 0; updateComboHUD();
  const earnedThisGame = sessionBones; save.bones += sessionBones; sessionBones = 0;
  const finalScore = Math.floor(score); const isNewRecord = finalScore > save.highScore;
  if (isNewRecord) { save.highScore = finalScore; playSound('record'); newRecordText.classList.remove('hidden'); } else { newRecordText.classList.add('hidden'); }

  // ПАТЧ 25: отправляем рекорд в облако (ПАТЧ 26: добавили .catch для защиты)
  if (finalScore > 0) submitScoreToCloud(finalScore).catch((e) => console.warn('submitScore error', e));

  save.games.push({ score: finalScore, date: Date.now() }); save.games.sort((a, b) => b.score - a.score); save.games = save.games.slice(0, 10);
  checkAchievements(finalScore);
  if (save.dailyQuest && !save.dailyQuest.claimed) {
    const q = save.dailyQuest; if (q.type === 'score') q.progress = Math.max(q.progress, finalScore); else if (q.type === 'birds') q.progress += birdsEatenThisGame; else if (q.type === 'bones') q.progress += earnedThisGame;
    if (q.progress >= q.target) { q.progress = q.target; q.completed = true; }
  }
  const xpGained = Math.floor(finalScore / 10) + earnedThisGame * 2; const oldLevel = getLevelFromXp(save.xp).level;
  save.xp += xpGained; const newInfo = getLevelFromXp(save.xp); let totalLevelReward = 0;
  if (newInfo.level > oldLevel) { for (let lv = oldLevel + 1; lv <= newInfo.level; lv++) totalLevelReward += xpLevelReward(lv); save.bones += totalLevelReward; save.playerLevel = newInfo.level; }
  writeSave(); updateHUD();
  updateDailyBadge(); // ПАТЧ 26: бейдж ежедневки обновляется сразу после игры
  goScore.textContent = finalScore; goHigh.textContent = Math.floor(save.highScore); goBones.textContent = `+${earnedThisGame} 🦴`; goXp.textContent = `+${xpGained} XP`;
  gameoverScreen.classList.remove('hidden'); pauseBtn.classList.add('hidden'); pauseScreen.classList.add('hidden'); fullscreenBtn.classList.add('hidden'); xpBarContainer.classList.add('hidden'); versionBtn.style.display = 'none'; speedBarContainer.classList.remove('active'); powerUpHud.classList.add('hidden'); hud.classList.add('hidden');
  if (newInfo.level > oldLevel) setTimeout(() => showLevelUpPopup(newInfo.level, totalLevelReward), 900);
}

function update(dt) {
  if (isPortraitMode || gameState === 'paused') return;
  frame++;
  if (gameState === 'playing') {
    damageCooldown = Math.max(0, damageCooldown - dt);
    if (duckTimer !== Infinity && duckTimer > 0) { duckTimer = Math.max(0, duckTimer - dt); if (duckTimer === 0) dino.ducking = false; }
    poisonOverlayTimer = Math.max(0, poisonOverlayTimer - dt);
    const skinBonus = getCurrentSkin().bonus; const petBonus = getCurrentPet().bonus;
    let scoreBonusMult = 1; if (skinBonus.type === 'score') scoreBonusMult *= skinBonus.value; if (petBonus.type === 'score') scoreBonusMult *= petBonus.value;
    score += 0.1 * (speed / BASE_SPEED) * (dt * 60) * scoreBonusMult;
    distance += speed * (dt * 60);
    speed = BASE_SPEED + Math.min(MAX_SPEED_BONUS, score / 400); speedBar.style.width = Math.min(100, ((speed - BASE_SPEED) / MAX_SPEED_BONUS) * 100) + '%';

    if (save.currentPet !== 'none') {
      const targetX = dino.x - 40; const targetY = dino.y - 60 + Math.sin(frame * 0.1) * 10;
      petX += (targetX - petX) * 0.1; petY += (targetY - petY) * 0.1;
    }

    if (comboCount > 0) { comboTimer -= dt; if (comboTimer <= 0) resetCombo(); else comboTimerFill.style.width = Math.min(100, (comboTimer / COMBO_TIMEOUT) * 100) + '%'; }
    dayNightTime += dt; if (dayNightTime >= DAY_NIGHT_CYCLE) dayNightTime -= DAY_NIGHT_CYCLE;
    const biomeInfo = getBiomeState(distance);
    if (biomeInfo.current.hasSnow || (biomeInfo.next && biomeInfo.next.hasSnow && biomeInfo.transitionT > 0.5)) { isRaining = false; updateSnow(dt); }
    else { weatherTime += dt; const currentWeatherDuration = isRaining ? RAIN_DURATION : CLEAR_DURATION; if (weatherTime >= currentWeatherDuration) { isRaining = !isRaining; weatherTime = 0; if (isRaining) initRain(); } updateLightning(dt); updateRain(dt); }

    if (dino.jumping) {
      dino.vy += GRAVITY * (dt * 60); dino.y += dino.vy * (dt * 60);
      if (dino.y >= GROUND_Y) { dino.y = GROUND_Y; dino.vy = 0; dino.jumping = false; const hasDoubleJump = activePowerUps.some(a => a.type === 'doubleJump'); dino.jumpsLeft = hasDoubleJump ? 1 : 0; spawnDust(dino.x + 30, GROUND_Y, 5, 2); }
    } else if (frame % 8 === 0) spawnDust(dino.x + 10, GROUND_Y, 1, 1);

    meteorTimer -= dt; if (meteorTimer <= 0) { spawnMeteor(); meteorTimer = 20 + Math.random() * 15; }
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i]; m.trail.push({ x: m.x, y: m.y }); if (m.trail.length > 10) m.trail.shift();
      m.x += m.vx * (dt * 60); m.y += m.vy * (dt * 60);
      if (m.y >= GROUND_Y - m.r) { shakeTime = 15; spawnDust(m.x, GROUND_Y, 30, 8); playSound('crash'); haptic('crash'); sessionBones += 10; spawnFloatingText(m.x, GROUND_Y - 60, '+10 🦴'); updateHUD(); meteors.splice(i, 1); continue; }
      const meteorShield = activePowerUps.some(a => a.type === 'shield');
      if (!meteorShield && damageCooldown <= 0 && rectCollide(getDinoBox(), { x: m.x - m.r, y: m.y - m.r, w: m.r * 2, h: m.r * 2 })) { meteors.splice(i, 1); takeDamage(); if (gameState !== 'playing') return; continue; }
      if (m.x < -100 || m.y > H + 100) meteors.splice(i, 1);
    }

    spawnTimer -= dt * 60; if (spawnTimer <= 0) { spawnObstacle(); const difficultyFactor = Math.min(1, score / 2000); let baseGap = Math.max(45, 100 - difficultyFactor * 40); const minFrames = baseGap / (speed / BASE_SPEED); const maxFrames = (baseGap + 60) / (speed / BASE_SPEED); spawnTimer = Math.max(30, minFrames + Math.random() * (maxFrames - minFrames)); }

    obstacles.forEach(o => o.x -= speed); powerUps.forEach(p => p.x -= speed); powerUps = powerUps.filter(p => p.x > -20);
    const dinoBox = getDinoBox();

    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i]; const oBox = getCactusBox(o);
      if (!dino.jumping && !o.wasClose) { const dist = boxDistance(dinoBox, oBox); if (dist > 0 && dist < 15) o.wasClose = true; }
      if (oBox.x + oBox.w < dinoBox.x - 15) { if (o.wasClose) { score += 5 * scoreBonusMult; spawnFloatingText(o.x + o.w * dino.scale / 2, o.y - o.h * dino.scale - 25, 'NICE! +5'); } obstacles.splice(i, 1); }
    }

    birds.forEach(b => {
      let effSpeed = speed * 0.5;
      if (save.upgrades.magnet > 0) { const mRange = 122.5 + save.upgrades.magnet * 49; const tx = dino.x + 15 * dino.scale; const ty = dino.y - 12 * dino.scale; const dx = tx - (b.x + 20 * BIRD_SCALE_GAME); const dy = ty - b.y; const dist = Math.sqrt(dx * dx + dy * dy); if (dist < mRange && b.x > dino.x - 50) { b.magnetized = true; const pullSpeed = 1.4 * save.upgrades.magnet; if (dist > pullSpeed) { b.x += (dx / dist) * pullSpeed; b.y += (dy / dist) * pullSpeed; } else { b.x += dx; b.y += dy; } effSpeed = 0.2; } else { b.magnetized = false; } }
      b.x -= effSpeed;
    });

    for (let i = birds.length - 1; i >= 0; i--) {
      const b = birds[i]; const bBox = getBirdBox(b);
      if (!b.wasClose) { const dist = boxDistance(dinoBox, bBox); if (dist > 0 && dist < 12) b.wasClose = true; }
      if (b.x + b.w * BIRD_SCALE_GAME < dino.x - 15) { if (b.wasClose) { sessionBones += 1; spawnFloatingText(b.x + 20 * BIRD_SCALE_GAME, b.y - 20, '+1 🦴'); updateHUD(); } resetCombo(); birds.splice(i, 1); }
    }

    for (let i = powerUps.length - 1; i >= 0; i--) {
      const p = powerUps[i];
      if (rectCollide(dinoBox, { x: p.x - 15, y: p.y - 15, w: 30, h: 30 })) {
        const puBonusDur = (skinBonus.type === 'powerup') ? skinBonus.value : 0; const totalDuration = p.duration + puBonusDur;
        let existing = activePowerUps.find(a => a.type === p.type);
        if (existing) { existing.timer = Math.max(existing.timer, totalDuration); existing.maxTimer = existing.timer; } else { activePowerUps.push({ type: p.type, timer: totalDuration, maxTimer: totalDuration, icon: p.icon, color: p.color }); }
        if (p.type === 'doubleJump') dino.jumpsLeft = Math.max(dino.jumpsLeft, 1);
        playSound('record'); haptic('eat'); powerUps.splice(i, 1); updatePowerUpHUD();
      }
    }

    let powerUpChanged = false;
    for (let i = activePowerUps.length - 1; i >= 0; i--) { activePowerUps[i].timer -= dt; if (activePowerUps[i].timer <= 0) { activePowerUps.splice(i, 1); powerUpChanged = true; } }
    if (powerUpChanged) updatePowerUpHUD();

    const cactusShield = activePowerUps.some(a => a.type === 'shield');
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      if (!rectCollide(dinoBox, getCactusBox(o))) continue;
      if (o.type === 'poisonFlower') { poisonOverlayTimer = 5; obstacles.splice(i, 1); continue; }
      if (cactusShield || damageCooldown > 0) continue;
      if (save.currentPet === 'ghost' && !ghostUsed) { ghostUsed = true; spawnFloatingText(dino.x + 20, dino.y - 60, 'СПАСЕНИЕ! 👻'); obstacles.splice(i, 1); shakeTime = 10; haptic('eat'); playSound('record'); continue; }
      obstacles.splice(i, 1);
      takeDamage();
      if (gameState !== 'playing') return;
    }

    for (let i = birds.length - 1; i >= 0; i--) {
      const b = birds[i]; const bBox = getBirdBox(b);
      if (rectCollide(dinoBox, bBox)) {
        comboCount++; comboTimer = COMBO_TIMEOUT; const mult = getComboMultiplier();
        const birdBonesBonus = (skinBonus.type === 'bones') ? skinBonus.value : 0;
        let baseBones = 1 + (save.upgrades.doubleBones || 0) + birdBonesBonus;
        if (b.isGolden) baseBones = 10 + (save.upgrades.doubleBones || 0) + birdBonesBonus;
        const bonesEarned = baseBones * mult;
        sessionBones += bonesEarned; birdsEatenThisGame++; haptic('eat'); playSound('eat');
        const bonesForAnim = Math.min(bonesEarned, 12); for (let j = 0; j < bonesForAnim; j++) bonesFlying.push({ x: b.x + 20 * BIRD_SCALE_GAME, y: b.y, vy: -4 - Math.random() * 2, vx: 1 + Math.random(), life: 1, rot: 0 });
        let text = `+${bonesEarned} 🦴`; if (mult > 1) text += ` (x${mult})`; spawnFloatingText(b.x + 20 * BIRD_SCALE_GAME, b.y - 20, text);
        spawnDust(b.x + 20 * BIRD_SCALE_GAME, b.y, 8, 4); birds.splice(i, 1); updateComboHUD(true); updateHUD();
      }
    }

    // ПАТЧ 26: highScore хранится как int (был баг с float)
    const scoreFloored = Math.floor(score);
    if (scoreFloored > save.highScore) save.highScore = scoreFloored;

    clouds.forEach(c => { c.x -= c.speed; if (c.x < -80) { c.x = W + Math.random() * 200; c.y = 40 + Math.random() * 60; } });
    groundDots.forEach(d => { d.x -= GROUND_SCROLL_SPEED; if (d.x < 0) { d.x = W; d.y = GROUND_Y + 6 + Math.random() * 20; } });
    updateHUD();
  }
  updateParticles(); updateBonesFlying(); if (shakeTime > 0) shakeTime--;
}

function drawMenuScene(colors) {
  const menuDinoX = W * 0.15 + Math.sin(frame * 0.02) * 30; drawDinoAt(menuDinoX, GROUND_Y, false, false, Math.floor(frame / 6) % 12, false, DINO_SCALE_MENU);
  drawCactus({ x: W * 0.8, y: GROUND_Y, w: 8, h: 20, type: 'cactus_small' }, colors, 2); drawCactus({ x: W * 0.9, y: GROUND_Y, w: 10, h: 25, type: 'cactus_big' }, colors, 2);
  const birdX = W * 0.4 + Math.sin(frame * 0.03) * 100; const birdY = H * 0.25 + Math.cos(frame * 0.02) * 40;
  drawBird({ x: birdX, y: birdY, w: 10, h: 10, type: 'bird', magnetized: false }, colors, BIRD_SCALE_MENU);
}

function render() {
  let shakeX = 0, shakeY = 0; if (shakeTime > 0) { shakeX = (Math.random() - 0.5) * shakeTime * 0.6; shakeY = (Math.random() - 0.5) * shakeTime * 0.6; }
  ctx.clearRect(0, 0, W, H); ctx.save(); ctx.translate(shakeX, shakeY);
  const isMenu = gameState === 'menu' || gameState === 'daily' || gameState === 'records' || gameState === 'upgrades' || gameState === 'achievements' || gameState === 'settings';
  const timeOfDay = (gameState === 'playing' || gameState === 'paused' || gameState === 'gameover') ? dayNightTime / DAY_NIGHT_CYCLE : 0.5;
  // ПАТЧ 26: в меню используем biomeScore=0 — иначе фон залипал в позднем биоме
  const biomeScore = isMenu ? 0 : distance;
  const colors = getObjectColors(timeOfDay, biomeScore);
  drawBackground(timeOfDay, !isMenu, biomeScore); drawLightning(); drawGround(timeOfDay, biomeScore); drawParticles();
  if (gameState === 'playing' || gameState === 'paused' || gameState === 'gameover') {
    obstacles.forEach(o => drawCactus(o, colors, dino.scale)); birds.forEach(b => drawBird(b, colors, BIRD_SCALE_GAME)); powerUps.forEach(drawPowerUp); meteors.forEach(drawMeteor); drawRain(); drawSnow(); drawBonesFlying(); drawDino(); drawPet();
  } else { drawMenuScene(colors); }
  if (poisonOverlayTimer > 0) {
    const poison = ctx.createLinearGradient(0, 0, W, H);
    poison.addColorStop(0, 'rgba(255, 35, 0, 0.5)');
    poison.addColorStop(1, 'rgba(255, 205, 0, 0.5)');
    ctx.fillStyle = poison; ctx.fillRect(0, 0, W, H);
  }
  ctx.restore();
}

function loop(ts) {
  const dt = ts - lastTime; lastTime = ts; const dtSeconds = Math.min(0.05, dt / 1000); const steps = Math.min(3, Math.max(1, Math.round(dt / 16.67)));
  for (let i = 0; i < steps; i++) update(dtSeconds / steps);
  if (gameState === 'playing' && frame % 300 === 0) writeSave(); render(); requestAnimationFrame(loop);
}

resizeCanvas(); checkDailyAndStreak(); updateHUD(); showMainMenu(); requestAnimationFrame(loop);
