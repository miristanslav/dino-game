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
  const bob = dead ? 0 : [0, -0.2, -0.55, -0.2][step];
  const tailLift = dead ? 0 : [0, -0.35, -0.7, 0][step];

  const poly = (points, fill) => {
    ctx.beginPath();
    ctx.moveTo(points[0][0] * scale, points[0][1] * scale);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0] * scale, points[i][1] * scale);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
  };
  const line = (points, color, width) => {
    ctx.beginPath();
    ctx.moveTo(points[0][0] * scale, points[0][1] * scale);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0] * scale, points[i][1] * scale);
    ctx.strokeStyle = color;
    ctx.lineWidth = width * scale;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  };

  // Tail: keep the approved silhouette, but extend its root into the pelvis and lengthen the taper.
  // Curved contours make the tail read as one continuous extension of the spine, with a softly rounded tip.
  const tailPath = (fill, commands) => {
    ctx.beginPath();
    ctx.moveTo(commands[0][0] * scale, commands[0][1] * scale);
    for (let i = 1; i < commands.length; i++) {
      const p = commands[i];
      if (p[0] === 'Q') ctx.quadraticCurveTo(p[1] * scale, p[2] * scale, p[3] * scale, p[4] * scale);
      else ctx.lineTo(p[0] * scale, p[1] * scale);
    }
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
  };
  tailPath(c.outline, [
    [19,14.2+tailLift],
    ['Q',15,14.5+tailLift,11,15.8+tailLift],
    ['Q',6,17.1+tailLift,0,17.9+tailLift],
    ['Q',-5,18.6+tailLift,-10,18.9+tailLift],
    ['Q',-12,19.35+tailLift,-11.2,19.85+tailLift],
    ['Q',-8.5,20.65+tailLift,-3,20.85+tailLift],
    ['Q',5,21.4+tailLift,11,20.6+tailLift],
    ['Q',16,19.9+tailLift,20,19.35+tailLift],
    ['Q',22,17.2+tailLift,19,14.2+tailLift]
  ]);
  tailPath(c.body, [
    [17.5,15+tailLift],
    ['Q',13,15.5+tailLift,8,16.8+tailLift],
    ['Q',2,18.1+tailLift,-4,18.7+tailLift],
    ['Q',-10.1,19.55+tailLift,-9.8,19.95+tailLift],
    ['Q',-7.5,20.35+tailLift,-3,20.55+tailLift],
    ['Q',5,20.4+tailLift,11,19.7+tailLift],
    ['Q',15.5,19.2+tailLift,19,18.7+tailLift],
    [17.5,15+tailLift]
  ]);
  // Subtle underside shading follows the same curve and preserves the existing skin palette.
  tailPath(c.belly, [
    [5,18.5+tailLift],
    ['Q',10,17.9+tailLift,15,17.8+tailLift],
    ['Q',17,18+tailLift,18,18.2+tailLift],
    ['Q',13,19.5+tailLift,8,20+tailLift],
    ['Q',3,20.5+tailLift,-1,20.5+tailLift],
    ['Q',2,18.9+tailLift,5,18.5+tailLift]
  ]);
  line([[4,17.5+tailLift],[8,16.7+tailLift],[12,15.8+tailLift],[16,15.1+tailLift]], c.belly, 0.55);

  // Far leg: visible hip, bent knee, narrow ankle and three toes.
  const farLegs = [
    [[15,17],[20,17.5],[21,21],[18,24],[15,23],[13,20]],
    [[15,17],[20,18],[21,21],[20,23],[16,23],[14,20]],
    [[15,17],[20,18],[20,21],[17,24],[14,22],[13,19]],
    [[15,17],[20,17.5],[22,21],[20,24],[16,24],[14,21]]
  ];
  const farFeet = [
    [[15,22],[18,22],[20,24],[19,25],[14,25]],
    [[16,22],[20,22],[22,24],[20,25],[15,25]],
    [[14,21],[18,22],[20,24],[18,25],[13,24]],
    [[16,23],[20,23],[22,25],[20,26],[15,26]]
  ];
  const pose = dead ? 0 : step;
  const shift = bob;
  const move = pts => pts.map(([x,y])=>[x,y+shift]);
  poly(move(farLegs[pose]), c.outline);
  poly(move(farLegs[pose].map(([x,y])=>[x+0.65,y+0.45])), c.body);
  poly(move(farFeet[pose]), c.outline);
  poly(move(farFeet[pose].map(([x,y])=>[x+0.4,y-0.45])), c.body);
  line([[16,19+shift],[18,21+shift],[17,23+shift]], c.belly, 0.7);

  // Main torso: elongated, muscular rib cage with a lifted belly and a defined chest.
  // The silhouette is deliberately asymmetrical: sloping back, deep chest, tighter waist.
  poly([[12,17+bob],[13.5,14.2+bob],[17,11.8+bob],[21,9.8+bob],[25,9.3+bob],[28,10.2+bob],[30.5,12.5+bob],[32,15.5+bob],[31,18.5+bob],[28.5,20.2+bob],[24.5,20.8+bob],[20.5,20.2+bob],[16.5,19.3+bob],[13,18.5+bob]], c.outline);
  poly([[13.2,16.7+bob],[15,14.2+bob],[18,12.2+bob],[21.5,10.8+bob],[25,10.3+bob],[27.8,11.1+bob],[29.8,13.1+bob],[30.8,15.7+bob],[30,18+bob],[27.8,19.2+bob],[24.5,19.7+bob],[20.5,19.2+bob],[17,18.5+bob],[14.2,18+bob]], c.body);

  // Hide the internal overlap line at the pelvis: tail and torso share one continuous body surface.
  // The patch stays inside the silhouette, preserving the approved outer torso contour.
  poly([[12.7,15.0+bob],[14.4,14.35+bob],[16.8,14.35+bob],[19.1,14.9+bob],[20.0,16.3+bob],[19.8,18.55+bob],[17.2,19.05+bob],[14.3,18.55+bob],[12.8,17.35+bob]], c.body);

  // Subtle planes describe the shoulder, rib cage and underside without a round belly.
  poly([[21.5,11+bob],[25,10.5+bob],[28,11.6+bob],[30,14.1+bob],[29.5,16.5+bob],[27,17.2+bob],[24,15.8+bob],[22,13.8+bob]], c.body);
  poly([[15,15.2+bob],[17.5,12.9+bob],[20.5,11.7+bob],[22.5,12.5+bob],[20.5,15.2+bob],[17.5,16.8+bob]], c.belly);
  poly([[17,17.1+bob],[20,16.2+bob],[23,16.8+bob],[26.5,16.6+bob],[29.5,16.2+bob],[28.5,18.2+bob],[25.5,19.1+bob],[22,19.1+bob],[18.5,18.5+bob]], c.belly);
  line([[16.2,15.1+bob],[18.5,13.3+bob],[21,12.5+bob]], c.body, 0.8);
  line([[18.5,18+bob],[21.5,18.4+bob],[24.5,18.2+bob]], c.body, 0.65);

  // Near leg overlaps the belly: thick thigh narrows through a clear knee and shin.
  const nearLegs = [
    [[20,17+bob],[25,17.5+bob],[27,20+bob],[26,23+bob],[23,25+bob],[19,23+bob],[18,20+bob]],
    [[20,17+bob],[25,17.5+bob],[27,20+bob],[28,23+bob],[26,25+bob],[22,24+bob],[20,21+bob]],
    [[20,17+bob],[25,17.5+bob],[26,20+bob],[24,23+bob],[21,24+bob],[18,22+bob]],
    [[20,17+bob],[25,17.5+bob],[27,20+bob],[26,23+bob],[23,25+bob],[19,23+bob]]
  ];
  const nearFeet = [
    [[22,23+bob],[26,23+bob],[29,25+bob],[29,26.5+bob],[26,26+bob],[24,27+bob],[20,26+bob]],
    [[25,23+bob],[29,24+bob],[32,26+bob],[31,27+bob],[27,27+bob],[24,26+bob]],
    [[19,22+bob],[23,22+bob],[26,24+bob],[25,25+bob],[22,25+bob],[18,24+bob]],
    [[22,23+bob],[26,23+bob],[29,25+bob],[28,26+bob],[24,26+bob],[20,25+bob]]
  ];
  poly(nearLegs[pose], c.outline);
  poly(nearLegs[pose].map(([x,y])=>[x+0.75,y+0.55]), c.body);
  line([[22,19+bob],[24,21+bob],[24,23+bob]], c.belly, 0.8);
  poly(nearFeet[pose], c.outline);
  poly(nearFeet[pose].map(([x,y])=>[x+0.45,y-0.5]), c.body);
  // Three separated toes and small dark claws make the foot read clearly.
  line([[23,25+bob],[24,26+bob],[25,26+bob]], c.belly, 0.55);
  poly([[27,25+bob],[28.5,25.2+bob],[29,25.8+bob],[27.5,25.7+bob]], c.claw);
  poly([[24,26+bob],[25.5,26.2+bob],[26,26.8+bob],[24.5,26.7+bob]], c.claw);
  poly([[21,25+bob],[22.5,25.2+bob],[23,25.8+bob],[21.5,25.7+bob]], c.claw);

  // Neck slopes forward from the chest; head artwork below remains untouched.
  poly([[25,13+bob],[26,10+bob],[29,8.5+bob],[33,9+bob],[35,12+bob],[33,15+bob],[29,16+bob],[26,15+bob]], c.outline);
  poly([[26,13+bob],[27.5,10.8+bob],[30,9.6+bob],[33,10.2+bob],[34,12.2+bob],[32,14.2+bob],[29,15+bob],[27,14.5+bob]], c.body);
  poly([[27,14+bob],[30,14+bob],[32,13.2+bob],[31,14.8+bob],[28,15+bob]], c.belly);

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

  // Tiny forearms stay tucked under the chest, with visible elbow and hooked fingers.
  poly([[25,14+bob],[27,13+bob],[29,14+bob],[30,16+bob],[28,17+bob],[26,16+bob]], c.outline);
  poly([[26,14.5+bob],[27.3,14+bob],[29,15+bob],[28,16+bob],[27,15.8+bob]], c.body);
  line([[28,16+bob],[29,17+bob],[30,16.5+bob]], c.claw, 0.8);
  line([[27,16+bob],[28,17+bob],[29,16.8+bob]], c.claw, 0.65);

  // A few restrained dorsal scutes connect the silhouette along the spine.
  poly([[16,11.5+bob],[17,10.6+bob],[18,11.2+bob],[17.5,12+bob]], c.outline);
  poly([[19,10.2+bob],[20,9.5+bob],[21,10.1+bob],[20.5,10.8+bob]], c.outline);
  poly([[22,9.3+bob],[23,8.8+bob],[24,9.4+bob],[23.5,10+bob]], c.outline);

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
