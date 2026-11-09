function getDinoColors() { return SKINS.find(s => s.id === save.currentSkin) || SKINS[0]; }

function uRect(u, v, w, h, color, scale) {
  if (scale === undefined) scale = dino.scale;
  ctx.fillStyle = color;
  ctx.fillRect(u * scale, v * scale, w * scale, h * scale);
}

function drawTRexStanding(phase, dead, scale) {
  if (scale === undefined) scale = dino.scale;
  const c = getDinoColors();
  const step = ((Math.floor(phase) % 4) + 4) % 4;
  const bob = dead ? 0 : [0, -0.25, -0.6, -0.25][step];
  const tailBob = dead ? 0 : [0, -0.45, -0.8, 0][step];

  // Polygon helper keeps the character in the same 46x30 sprite space.
  const poly = (points, fill, stroke, lineWidth) => {
    ctx.beginPath();
    ctx.moveTo(points[0][0] * scale, points[0][1] * scale);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0] * scale, points[i][1] * scale);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = (lineWidth || 1.15) * scale;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.stroke();
    }
  };

  // Hind legs are drawn first: broad thighs, angled shins and planted three-toed feet.
  const legPoses = [
    {rear:[[16,17],[22,18],[22,23],[19,26],[14,27],[13,24]], rearFoot:[[14,25],[20,25],[23,27],[22,28],[13,28]], front:[[24,17],[29,18],[28,23],[26,26],[22,25]], frontFoot:[[23,24],[28,24],[31,26],[30,27],[22,27]]},
    {rear:[[16,17],[22,18],[22,22],[19,24],[15,23],[14,20]], rearFoot:[[15,22],[20,22],[22,24],[20,25],[13,24]], front:[[24,17],[29,18],[30,22],[31,25],[27,26],[24,23]], frontFoot:[[28,24],[32,25],[34,27],[32,28],[27,27]]},
    {rear:[[16,17],[22,18],[21,22],[18,25],[14,24],[13,21]], rearFoot:[[14,23],[18,23],[20,25],[18,26],[12,25]], front:[[24,17],[29,18],[27,22],[24,24],[21,22]], frontFoot:[[21,22],[25,22],[27,24],[25,25],[20,24]]},
    {rear:[[16,17],[22,18],[23,22],[21,25],[17,26],[14,23]], rearFoot:[[16,24],[21,24],[24,26],[22,27],[15,27]], front:[[24,17],[29,18],[29,23],[27,25],[23,24]], frontFoot:[[24,23],[29,23],[31,25],[29,26],[23,26]]}
  ];
  const pose = dead ? legPoses[0] : legPoses[step];
  const legY = bob;
  poly(pose.rear.map(([x,y]) => [x,y+legY]), c.outline, null);
  poly(pose.rear.map(([x,y]) => [x+0.7,y+0.55+legY]), c.body, null);
  poly(pose.rearFoot.map(([x,y]) => [x,y+legY]), c.outline, null);
  poly(pose.rearFoot.map(([x,y]) => [x+0.5,y-0.55+legY]), c.body, null);
  poly(pose.front.map(([x,y]) => [x,y+legY]), c.outline, null);
  poly(pose.front.map(([x,y]) => [x+0.65,y+0.55+legY]), c.belly, null);
  poly(pose.frontFoot.map(([x,y]) => [x,y+legY]), c.outline, null);
  poly(pose.frontFoot.map(([x,y]) => [x+0.5,y-0.55+legY]), c.body, null);

  // Long counterbalancing tail: thick at the hip and sharply tapered at the tip.
  poly([[2,18+tailBob],[5,16+tailBob],[10,15+tailBob],[15,13.5+tailBob],[19,14+tailBob],[20,16+tailBob],[16,18+tailBob],[11,19.5+tailBob],[6,20+tailBob],[3,20+tailBob]], c.outline, null);
  poly([[3,18+tailBob],[7,16.8+tailBob],[12,15.8+tailBob],[16,14.7+tailBob],[18,15+tailBob],[15,17+tailBob],[10,18.5+tailBob],[6,19+tailBob]], c.body, null);
  poly([[4,18.7+tailBob],[9,18+tailBob],[13,17+tailBob],[16,16+tailBob],[12,18.2+tailBob],[7,19+tailBob]], c.belly, null);

  // Torso silhouette: deep chest, narrow waist and sloping back instead of a box.
  poly([[12,17+bob],[14,13+bob],[18,10+bob],[22,8.5+bob],[26,8.5+bob],[30,11+bob],[32,14+bob],[31,18+bob],[28,21+bob],[23,22+bob],[18,21+bob],[14,19+bob]], c.outline, null);
  poly([[13,16.5+bob],[15,13.5+bob],[19,11+bob],[23,9.7+bob],[27,10+bob],[30,12+bob],[31,15+bob],[29,18.5+bob],[26,20+bob],[22,20.5+bob],[18,19.8+bob],[15,18.5+bob]], c.body, null);
  // Warm underside follows the rib cage and narrows into the abdomen.
  poly([[15,17.5+bob],[18,17+bob],[22,18+bob],[26,17.5+bob],[29,16.5+bob],[28,19+bob],[25,20+bob],[21,20+bob],[17,19.2+bob]], c.belly, null);
  // Shoulder and chest planes create visible volume without changing the head.
  poly([[22,10.5+bob],[26,10+bob],[29,12+bob],[30,15+bob],[27,16+bob],[23,14.5+bob]], c.body, null);
  poly([[18,12+bob],[21,10.8+bob],[24,11+bob],[22,13+bob],[19,14+bob]], c.belly, null);
  poly([[16,14+bob],[19,12.5+bob],[20,13.5+bob],[18,16+bob]], c.belly, null);

  // Neck joins the chest naturally; the successful head artwork below is preserved.
  poly([[25,12+bob],[27,9+bob],[31,8+bob],[34,10+bob],[34,14+bob],[30,16+bob],[26,15+bob]], c.outline, null);
  poly([[26,12+bob],[28,10+bob],[31,9.5+bob],[33,11+bob],[32,14+bob],[29,15+bob],[27,14+bob]], c.body, null);

  // Original head and face details retained.
  uRect(27,5+bob,12,7,c.outline,scale);
  uRect(29,4+bob,10,7,c.outline,scale);
  uRect(31,5+bob,13,5,c.outline,scale);
  uRect(33,6+bob,12,4,c.body,scale);
  uRect(30,5+bob,9,5,c.body,scale);
  uRect(29,8+bob,13,4,c.body,scale);
  uRect(35,9+bob,10,2,c.body,scale);
  uRect(31,11+bob,13,3,c.outline,scale);
  uRect(33,11+bob,10,1,c.body,scale);
  uRect(35,12+bob,7,1,c.belly,scale);
  uRect(34,10+bob,10,1,"#45272A",scale);
  uRect(36,10+bob,1,2,"#FFF0D2",scale);
  uRect(40,10+bob,1,2,"#FFF0D2",scale);
  uRect(44,9+bob,1,1,c.outline,scale);
  uRect(32,5+bob,7,2,c.outline,scale);
  uRect(34,6+bob,3,1,c.eye,scale);
  uRect(35,6+bob,1,1,"#17212A",scale);
  uRect(31,4+bob,6,1,c.outline,scale);

  // Small tucked forearms with distinct elbows and claws.
  poly([[25,14+bob],[27,13+bob],[29,14+bob],[30,16+bob],[28,17+bob],[26,16+bob]], c.outline, null);
  poly([[26,14.5+bob],[27,14+bob],[29,15+bob],[28,16+bob],[27,15.8+bob]], c.body, null);
  uRect(29,16+bob,2,1,c.claw,scale);
  uRect(31,15.5+bob,1.5,0.8,c.claw,scale);

  // Subtle dorsal scutes and highlights.
  uRect(17,11+bob,2,0.8,c.belly,scale);
  uRect(20,9.8+bob,2,0.8,c.belly,scale);
  uRect(23,9.2+bob,2,0.7,c.belly,scale);
  uRect(18,18+bob,5,0.7,c.body,scale);

  if (dead) {
    uRect(34,6,3,1,c.outline,scale);
    uRect(35,5,1,3,c.outline,scale);
  }
}
function drawTRexDucking(scale) {
  if (scale === undefined) scale = dino.scale;
  const c = getDinoColors();
  const tailSegments = 14;
  for (let i = 0; i < tailSegments; i++) {
    const t = i / (tailSegments - 1);
    const u = t * 15; const vBase = 7 + (1 - t) * 4; const thickness = 1 + t * 3.5;
    uRect(u, vBase, 1.2, thickness, c.body, scale); uRect(u, vBase + thickness - 0.6, 1.2, 0.6, c.outline, scale);
  }
  uRect(0, 10.5, 1.2, 1, c.outline, scale);
  uRect(13, 5, 14, 8, c.body, scale); uRect(13, 5, 14, 0.8, c.outline, scale);
  uRect(13, 5, 0.8, 8, c.outline, scale); uRect(14, 12, 12, 1, c.outline, scale);
  uRect(15, 6, 10, 0.6, c.belly, scale);
  uRect(23, 4, 5, 4, c.body, scale); uRect(23, 4, 5, 0.8, c.outline, scale);
  uRect(24, 4.8, 3, 0.5, c.belly, scale);
  uRect(24, 0.5, 9, 5, c.body, scale); uRect(24, 0.5, 9, 0.8, c.outline, scale);
  uRect(24, 0.5, 0.8, 5, c.outline, scale); uRect(26, 1.3, 5, 0.6, c.belly, scale);
  uRect(30, 2, 4, 2, c.body, scale); uRect(30, 2, 4, 0.7, c.outline, scale);
  uRect(33, 2.8, 0.8, 0.8, '#000', scale);
  uRect(30, 5, 4, 1.3, c.body, scale); uRect(30, 4.3, 4, 0.8, '#D32F2F', scale);
  for (let i = 0; i < 3; i++) uRect(30.5 + i, 4.5, 0.6, 0.6, '#FFF', scale);
  for (let i = 0; i < 3; i++) uRect(30.8 + i, 4.0, 0.5, 0.5, '#FFF', scale);
  uRect(30, 5.7, 4, 0.4, c.outline, scale);
  uRect(27, 1.8, 1.5, 1.5, c.eye, scale); uRect(27.8, 2.1, 0.7, 0.9, '#000', scale);
  uRect(27.2, 1.9, 0.4, 0.4, '#FFF', scale); uRect(26.8, 1.4, 2.2, 0.5, c.outline, scale);
  uRect(26, 7.5, 2.5, 1, c.outline, scale); uRect(27.8, 8, 1.8, 0.8, c.outline, scale);
  uRect(29.2, 8.3, 1.2, 0.7, c.outline, scale); uRect(30.2, 8, 0.6, 0.4, c.claw, scale);
  uRect(30.2, 8.6, 0.6, 0.4, c.claw, scale); uRect(26, 8.3, 2.5, 0.3, c.outline, scale);
  uRect(15, 11, 4, 3, c.body, scale); uRect(15, 11, 4, 0.6, c.belly, scale); uRect(15, 11, 0.6, 3, c.outline, scale); uRect(15, 13, 5, 1.3, c.outline, scale);
  uRect(21, 11, 4, 3, c.body, scale); uRect(21, 11, 4, 0.6, c.belly, scale); uRect(21, 11, 0.6, 3, c.outline, scale); uRect(21, 13, 5, 1.3, c.outline, scale);
}

function drawDinoAt(x, y, ducking, jumping, phase, dead, scale) {
  if (scale === undefined) scale = dino.scale;
  const spriteH = ducking && !jumping ? 15 : 30; const spriteW = 46; const dx = x - 8 * scale; const dy = y - spriteH * scale;
  ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(dx + spriteW * scale * 0.55, y + 3, spriteW * scale * 0.3, 4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.save(); ctx.translate(dx, dy + (!jumping && !dead ? Math.sin(phase * Math.PI / 2) * 0.6 * scale : 0)); if (ducking && !jumping) drawTRexDucking(scale); else drawTRexStanding(jumping ? 0 : phase, dead, scale); ctx.restore();
}

function drawDino() {
  drawDinoAt(dino.x, dino.y, dino.ducking, dino.jumping, Math.floor(frame / 4) % 4, gameState === 'gameover', dino.scale);
  if (activePowerUps.some(a => a.type === 'shield')) {
    ctx.strokeStyle = 'rgba(33,150,243,0.8)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(dino.x + 30, dino.y - 30, 45, 0, Math.PI * 2); ctx.stroke();
  }
}

function drawCactus(o, colors, scale) {
  if (scale === undefined) scale = dino.scale;
  const x = o.x, y = o.y, h = o.h, w = o.w, s = scale;
  ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(x + w * s / 2, y + 3, w * s * 0.4, 4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = colors.cactus;
  if (o.type === 'cactus_small') {
    const stemW = 4; const stemX = x + (w / 2 - stemW / 2) * s; ctx.fillRect(stemX, y - h * s, stemW * s, h * s);
    const b1Y = y - h * s + h * 0.4 * s; ctx.fillRect(stemX - 4 * s, b1Y, 4 * s, 3 * s); ctx.fillRect(stemX - 4 * s, b1Y - 6 * s, 3 * s, 8 * s);
    const b2Y = y - h * s + h * 0.55 * s; ctx.fillRect(stemX + stemW * s, b2Y, 4 * s, 3 * s); ctx.fillRect(stemX + stemW * s + 1 * s, b2Y - 5 * s, 3 * s, 7 * s);
    ctx.fillStyle = colors.cactusLight; ctx.fillRect(stemX + 1 * s, y - h * s + 2 * s, 1 * s, h * s - 4 * s);
  } else {
    const stemW = 6; const stemX = x + (w / 2 - stemW / 2) * s; ctx.fillRect(stemX, y - h * s, stemW * s, h * s);
    const b1Y = y - h * s + h * 0.3 * s; ctx.fillRect(stemX - 6 * s, b1Y, 6 * s, 4 * s); ctx.fillRect(stemX - 6 * s, b1Y - 8 * s, 4 * s, 10 * s);
    const b2Y = y - h * s + h * 0.45 * s; ctx.fillRect(stemX + stemW * s, b2Y, 6 * s, 4 * s); ctx.fillRect(stemX + stemW * s + 2 * s, b2Y - 8 * s, 4 * s, 10 * s);
    ctx.fillStyle = colors.cactusLight; ctx.fillRect(stemX + 1.5 * s, y - h * s + 2 * s, 1.5 * s, h * s - 4 * s);
  }
}

function drawBird(b, colors, scale) {
  if (scale === undefined) scale = BIRD_SCALE_GAME;
  const x = b.x, y = b.y; const wingUp = Math.floor(frame / 8) % 2 === 0;
  let birdColor = colors.bird;
  if (b.isGolden) { birdColor = '#FFD700'; ctx.shadowColor = '#FF8F00'; ctx.shadowBlur = 15; }
  ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(x + 20 * scale, GROUND_Y + 3, 20 * scale, 3, 0, 0, Math.PI * 2); ctx.fill();
  if (b.magnetized) { ctx.fillStyle = 'rgba(100,180,255,0.35)'; ctx.beginPath(); ctx.arc(x + 20 * scale, y, 40 * scale, 0, Math.PI * 2); ctx.fill(); }
  ctx.fillStyle = birdColor;
  ctx.fillRect(x + 12 * scale, y - 2 * scale, 16 * scale, 4 * scale); ctx.fillRect(x + 6 * scale, y, 6 * scale, 2 * scale);
  ctx.fillRect(x + 4 * scale, y + 2 * scale, 2 * scale, 2 * scale); ctx.fillRect(x + 28 * scale, y - 5 * scale, 6 * scale, 5 * scale);
  ctx.fillRect(x + 34 * scale, y - 4 * scale, 2 * scale, 4 * scale); ctx.fillRect(x + 36 * scale, y - 3 * scale, 8 * scale, 2 * scale);
  ctx.fillRect(x + 36 * scale, y - 1 * scale, 5 * scale, 1 * scale); ctx.fillRect(x + 26 * scale, y - 10 * scale, 3 * scale, 5 * scale);
  ctx.fillRect(x + 23 * scale, y - 8 * scale, 3 * scale, 3 * scale);
  ctx.fillStyle = '#FFF'; ctx.fillRect(x + 30 * scale, y - 3 * scale, 2 * scale, 2 * scale);
  ctx.fillStyle = '#000'; ctx.fillRect(x + 31 * scale, y - 3 * scale, 1 * scale, 1 * scale);
  ctx.fillStyle = birdColor;
  if (wingUp) {
    ctx.beginPath(); ctx.moveTo(x + 14 * scale, y - 2 * scale); ctx.lineTo(x + 4 * scale, y - 22 * scale); ctx.lineTo(x + 10 * scale, y - 20 * scale); ctx.lineTo(x + 20 * scale, y - 12 * scale); ctx.lineTo(x + 28 * scale, y - 2 * scale); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.moveTo(x + 10 * scale, y - 8 * scale); ctx.lineTo(x + 14 * scale, y - 18 * scale); ctx.lineTo(x + 22 * scale, y - 8 * scale); ctx.fill();
  } else {
    ctx.beginPath(); ctx.moveTo(x + 14 * scale, y + 2 * scale); ctx.lineTo(x + 4 * scale, y + 22 * scale); ctx.lineTo(x + 10 * scale, y + 20 * scale); ctx.lineTo(x + 20 * scale, y + 12 * scale); ctx.lineTo(x + 28 * scale, y + 2 * scale); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.moveTo(x + 10 * scale, y + 8 * scale); ctx.lineTo(x + 14 * scale, y + 18 * scale); ctx.lineTo(x + 22 * scale, y + 8 * scale); ctx.fill();
  }
  ctx.shadowBlur = 0;
}

function drawMeteor(m) {
  ctx.save();
  m.trail.forEach((t, i) => {
    const alpha = (i / m.trail.length) * 0.8;
    ctx.fillStyle = `rgba(255, 100, 0, ${alpha})`;
    ctx.beginPath(); ctx.arc(t.x, t.y, m.r * (i / m.trail.length), 0, Math.PI * 2); ctx.fill();
  });
  const gradient = ctx.createRadialGradient(m.x, m.y, 2, m.x, m.y, m.r);
  gradient.addColorStop(0, '#FFF9C4'); gradient.addColorStop(0.4, '#FF9800'); gradient.addColorStop(1, '#D84315');
  ctx.shadowColor = '#FF5722'; ctx.shadowBlur = 20; ctx.fillStyle = gradient;
  ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawPet() {
  if (save.currentPet === 'none') return;
  const petType = save.currentPet; const px = petX; const py = petY;
  ctx.save(); ctx.translate(px, py);
  if (petType === 'ptero') {
    const wingUp = Math.floor(frame / 8) % 2 === 0;
    ctx.fillStyle = '#6A1B9A';
    ctx.beginPath(); if (wingUp) { ctx.moveTo(0, 0); ctx.lineTo(-15, -10); ctx.lineTo(-5, 5); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(15, -10); ctx.lineTo(5, 5); ctx.closePath(); ctx.fill(); } else { ctx.moveTo(0, 0); ctx.lineTo(-15, 10); ctx.lineTo(-5, -5); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(15, 10); ctx.lineTo(5, -5); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = '#4A148C'; ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#FFF'; ctx.fillRect(-3, -2, 2, 2); ctx.fillRect(1, -2, 2, 2);
  } else if (petType === 'ghost') {
    ctx.globalAlpha = 0.8; ctx.fillStyle = '#E0E0E0';
    ctx.beginPath(); ctx.arc(0, -5, 10, Math.PI, 0); ctx.lineTo(10, 5); ctx.lineTo(6, 10); ctx.lineTo(2, 5); ctx.lineTo(-2, 10); ctx.lineTo(-6, 5); ctx.lineTo(-10, 10); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(-4, -5, 2, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(4, -5, 2, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
  } else if (petType === 'flame') {
    ctx.shadowColor = '#FF5722'; ctx.shadowBlur = 15;
    const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, 12);
    grad.addColorStop(0, '#FFEB3B'); grad.addColorStop(0.5, '#FF9800'); grad.addColorStop(1, 'rgba(255, 87, 34, 0)');
    ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(0, 0, 12 + Math.sin(frame * 0.2) * 2, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
  }
  ctx.restore();
}

function drawPowerUp(p) {
  ctx.save(); ctx.translate(p.x, p.y); ctx.shadowColor = p.color; ctx.shadowBlur = 15;
  ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(0, 0, 15, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#FFF'; ctx.font = 'bold 16px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(p.icon, 0, 2); ctx.restore();
}

function drawBoneShape(x, y, size) {
  if (size === undefined) size = 14;
  ctx.save(); ctx.translate(x, y); const w = size, h = size * 0.5;
  ctx.fillStyle = '#FFF8E1'; ctx.strokeStyle = '#FFB300'; ctx.lineWidth = 2;
  ctx.fillRect(-w/2, -h/4, w, h/2); ctx.strokeRect(-w/2, -h/4, w, h/2);
  ctx.beginPath(); ctx.arc(-w/2, -h/3, h/2, 0, Math.PI * 2); ctx.arc(-w/2, h/3, h/2, 0, Math.PI * 2); ctx.arc(w/2, -h/3, h/2, 0, Math.PI * 2); ctx.arc(w/2, h/3, h/2, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke(); ctx.restore();
}

function spawnFloatingText(x, y, text) {
  const el = document.createElement('div'); el.className = 'floating-text'; el.textContent = text; el.style.left = x + 'px'; el.style.top = y + 'px';
  document.body.appendChild(el); setTimeout(() => el.remove(), 1000);
    }
