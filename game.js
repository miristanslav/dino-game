// ===== TELEGRAM WEB APP INIT =====
const tg = window.Telegram?.WebApp;
// Проверяем, что мы ДЕЙСТВИТЕЛЬНО внутри Telegram, а не в обычном браузере
const isTelegram = tg && tg.platform && tg.platform !== 'unknown';

if (isTelegram) {
  tg.ready();
  tg.expand();
  if (tg.disableVerticalSwipes) tg.disableVerticalSwipes();
  if (tg.setHeaderColor) tg.setHeaderColor('#f7f7f7');
  if (tg.setBackgroundColor) tg.setBackgroundColor('#f7f7f7');
  document.body.classList.add('telegram-mode');
}

// Функция для вибрации (работает только в Telegram)
function haptic(type) {
  if (isTelegram && tg.HapticFeedback) {
    if (type === 'jump') tg.HapticFeedback.impactOccurred('light');
    if (type === 'eat') tg.HapticFeedback.notificationOccurred('success');
    if (type === 'crash') tg.HapticFeedback.notificationOccurred('error');
  }
}

// ===== ИГРА =====
(() => {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  const fullscreenBtn = document.getElementById('fullscreenBtn');
  const fsIconExpand = document.getElementById('fsIconExpand');
  const fsIconCollapse = document.getElementById('fsIconCollapse');

  function isFullscreen() {
    return !!(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
  }

  function updateFullscreenIcon() {
    if (isFullscreen()) {
      fsIconExpand.style.display = 'none';
      fsIconCollapse.style.display = 'block';
      fullscreenBtn.title = 'Выйти из полноэкранного режима';
    } else {
      fsIconExpand.style.display = 'block';
      fsIconCollapse.style.display = 'none';
      fullscreenBtn.title = 'На весь экран';
    }
  }

  function toggleFullscreen() {
    const el = document.documentElement;
    if (isFullscreen()) {
      if (document.exitFullscreen) document.exitFullscreen().catch(e => console.log(e));
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      else if (document.msExitFullscreen) document.msExitFullscreen();
    } else {
      if (el.requestFullscreen) el.requestFullscreen().catch(e => console.log(e));
      else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
      else if (el.msRequestFullscreen) el.msRequestFullscreen();
    }
  }

  ['fullscreenchange', 'webkitfullscreenchange', 'msfullscreenchange'].forEach(evt => {
    document.addEventListener(evt, () => {
      updateFullscreenIcon();
      setTimeout(resizeCanvas, 100);
    });
  });

  let isPortraitMode = window.matchMedia("(orientation: portrait)").matches;
  function updateOrientation() {
    isPortraitMode = window.matchMedia("(orientation: portrait)").matches;
  }
  const portraitQuery = window.matchMedia("(orientation: portrait)");
  if (portraitQuery.addEventListener) {
    portraitQuery.addEventListener("change", updateOrientation);
  } else if (portraitQuery.addListener) {
    portraitQuery.addListener(updateOrientation);
  }
  window.addEventListener('orientationchange', () => setTimeout(updateOrientation, 100));

  let W = window.innerWidth;
  let H = window.innerHeight;
  let GROUND_Y = H * 0.8; 

  function resizeCanvas() {
    const oldGroundY = GROUND_Y;
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W;
    canvas.height = H;
    GROUND_Y = H * 0.8;
    
    if (!dino.jumping) dino.y = GROUND_Y;
    
    if (typeof groundDots !== 'undefined' && groundDots.length > 0) {
      groundDots.forEach(d => {
        d.y = GROUND_Y + 6 + Math.random() * 20;
      });
    }
    
    if (typeof obstacles !== 'undefined' && obstacles.length > 0) {
      obstacles.forEach(o => { o.y = GROUND_Y; });
    }
    
    if (typeof birds !== 'undefined' && birds.length > 0) {
      const deltaY = GROUND_Y - oldGroundY;
      birds.forEach(b => { b.y += deltaY; });
    }
  }

  const GRAVITY = 0.75;
  const JUMP_FORCE = -12.6;
  
  const DINO_SCALE_GAME = 1.8;   
  const DINO_SCALE_MENU = 3.0;   
  const BIRD_SCALE_GAME = 0.9;   
  const BIRD_SCALE_MENU = 1.2;   

  const BASE_SPEED = 3.5;       
  const MAX_SPEED_BONUS = 4.5;  

  const hud = document.getElementById('hud');
  const hudHigh = document.getElementById('hudHigh');
  const hudScore = document.getElementById('hudScore');
  const hudBones = document.getElementById('hudBones');
  const tapHint = document.getElementById('tapHint');
  
  const menuScreen = document.getElementById('menuScreen');
  const recordsScreen = document.getElementById('recordsScreen');
  const upgradesScreen = document.getElementById('upgradesScreen');
  const settingsScreen = document.getElementById('settingsScreen');
  const gameoverScreen = document.getElementById('gameoverScreen');
  const confirmDialog = document.getElementById('confirmDialog');
  
  const recordsList = document.getElementById('recordsList');
  const upgradesList = document.getElementById('upgradesList');
  const upgradesBones = document.getElementById('upgradesBones');
  const goScore = document.getElementById('goScore');
  const goHigh = document.getElementById('goHigh');
  const goBones = document.getElementById('goBones');

  let gameState = 'menu';
  let score = 0;
  let speed = BASE_SPEED;
  let frame = 0;
  let lastTime = 0;
  let spawnTimer = 0;
  let shakeTime = 0;
  let sessionBones = 0;

  const SAVE_KEY = 'trex_save_v1';
  function loadSave() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return defaultSave();
      const data = JSON.parse(raw);
      return {
        highScore: data.highScore || 0,
        bones: data.bones || 0,
        games: Array.isArray(data.games) ? data.games : [],
        upgrades: data.upgrades || { jump: 0, magnet: 0, doubleBones: 0 }
      };
    } catch { return defaultSave(); }
  }
  function defaultSave() { return { highScore: 0, bones: 0, games: [], upgrades: { jump: 0, magnet: 0, doubleBones: 0 } }; }
  function writeSave(save) { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); }
  let save = loadSave();

  const UPGRADES = [
    { id: 'jump', icon: '🦘', name: 'Прыжок', desc: 'Увеличивает силу прыжка', maxLevel: 5, costs: [10, 30, 60, 100, 150] },
    { id: 'magnet', icon: '🧲', name: 'Магнит', desc: 'Притягивает птиц', maxLevel: 2, costs: [15, 40] },
    { id: 'doubleBones', icon: '✨', name: 'Двойные кости', desc: '+1 кость за птицу', maxLevel: 2, costs: [25, 75] }
  ];

  const dino = { x: 60, y: GROUND_Y, scale: DINO_SCALE_GAME, vy: 0, jumping: false, ducking: false };
  
  const COLOR_DARK  = '#3a3a3a'; const COLOR_MID   = '#5a5a5a';
  const COLOR_LIGHT = '#8a8a8a'; const COLOR_EYE   = '#ffffff';
  const COLOR_MOUTH = '#1a1a1a'; const COLOR_TOOTH = '#f0f0f0';
  const COLOR_ARM   = '#2e2e2e'; const COLOR_CLAW  = '#f5f5f5';
  const COLOR_BONE  = '#f0e0b0';

  function uRect(u, v, w, h, color, scale = dino.scale) {
    ctx.fillStyle = color;
    ctx.fillRect(u * scale, v * scale, w * scale, h * scale);
  }

  function drawTRexStanding(phase, dead, scale = dino.scale) {
    const tailSegments = 14;
    for (let i = 0; i < tailSegments; i++) {
      const t = i / (tailSegments - 1);
      const u = t * 15; const vBase = 10 + (1 - t) * 5; const thickness = 1 + t * 4;
      uRect(u, vBase, 1.2, thickness, COLOR_MID, scale);
      uRect(u, vBase + thickness - 0.7, 1.2, 0.7, COLOR_DARK, scale);
      if (t > 0.5) uRect(u, vBase, 1.2, 0.6, COLOR_LIGHT, scale);
    }
    uRect(0, 15, 1.2, 1, COLOR_DARK, scale);
    uRect(13, 8, 14, 11, COLOR_MID, scale); uRect(13, 8, 14, 1, COLOR_DARK, scale);
    uRect(14, 17, 12, 2, COLOR_MID, scale); uRect(14, 19, 12, 0.8, COLOR_DARK, scale);
    uRect(15, 9, 10, 0.7, COLOR_LIGHT, scale);
    uRect(23, 6, 5, 6, COLOR_MID, scale); uRect(23, 6, 5, 1, COLOR_DARK, scale);
    uRect(24, 7, 3, 0.6, COLOR_LIGHT, scale);
    uRect(24, 1, 9, 6, COLOR_MID, scale); uRect(24, 1, 9, 1, COLOR_DARK, scale);
    uRect(24, 1, 1, 6, COLOR_DARK, scale); uRect(26, 2, 5, 0.7, COLOR_LIGHT, scale);
    uRect(30, 3, 4, 2.5, COLOR_MID, scale); uRect(30, 3, 4, 0.8, COLOR_DARK, scale);
    uRect(33, 4, 0.8, 0.8, COLOR_MOUTH, scale);
    uRect(30, 6.5, 4, 1.5, COLOR_MID, scale); uRect(30, 5.5, 4, 1, COLOR_MOUTH, scale);
    for (let i = 0; i < 3; i++) uRect(30.5 + i, 5.8, 0.6, 0.7, COLOR_TOOTH, scale);
    for (let i = 0; i < 3; i++) uRect(30.8 + i, 5.2, 0.5, 0.6, COLOR_TOOTH, scale);
    uRect(30, 7.5, 4, 0.5, COLOR_DARK, scale);
    if (dead) { uRect(27, 2.5, 1, 1, COLOR_DARK, scale); uRect(27.2, 2.7, 0.6, 0.6, COLOR_EYE, scale); }
    else { uRect(27, 2.5, 1.5, 1.5, COLOR_EYE, scale); uRect(27.8, 2.8, 0.7, 0.9, COLOR_DARK, scale); uRect(27.2, 2.6, 0.4, 0.4, '#ffffff', scale); }
    uRect(26.8, 2.1, 2.2, 0.5, COLOR_DARK, scale);
    uRect(26, 11, 2.5, 1.2, COLOR_ARM, scale); uRect(27.5, 11.5, 2, 0.9, COLOR_ARM, scale);
    uRect(28.8, 12, 1.8, 0.9, COLOR_ARM, scale); uRect(30, 12.3, 1.2, 0.8, COLOR_ARM, scale);
    uRect(31, 12, 0.6, 0.5, COLOR_CLAW, scale); uRect(31, 12.7, 0.6, 0.5, COLOR_CLAW, scale);
    uRect(26, 12, 2.5, 0.4, COLOR_DARK, scale);
    uRect(15, 17, 5, 4, COLOR_MID, scale); uRect(15, 17, 5, 0.7, COLOR_LIGHT, scale);
    uRect(15, 17, 0.7, 4, COLOR_DARK, scale);
    if (phase === 0) {
      uRect(16, 20, 2.5, 4.5, COLOR_MID, scale); uRect(16, 20, 0.7, 4.5, COLOR_DARK, scale);
      uRect(16, 23.5, 3.5, 1.2, COLOR_DARK, scale);
      uRect(21, 20, 2.5, 3, COLOR_MID, scale); uRect(21, 20, 0.7, 3, COLOR_DARK, scale);
      uRect(21, 22.5, 3.5, 1.2, COLOR_DARK, scale);
    } else {
      uRect(16, 20, 2.5, 3, COLOR_MID, scale); uRect(16, 20, 0.7, 3, COLOR_DARK, scale);
      uRect(16, 22.5, 3.5, 1.2, COLOR_DARK, scale);
      uRect(21, 20, 2.5, 4.5, COLOR_MID, scale); uRect(21, 20, 0.7, 4.5, COLOR_DARK, scale);
      uRect(21, 23.5, 3.5, 1.2, COLOR_DARK, scale);
    }
  }

  function drawTRexDucking(scale = dino.scale) {
    const tailSegments = 14;
    for (let i = 0; i < tailSegments; i++) {
      const t = i / (tailSegments - 1);
      const u = t * 15; const vBase = 7 + (1 - t) * 4; const thickness = 1 + t * 3.5;
      uRect(u, vBase, 1.2, thickness, COLOR_MID, scale);
      uRect(u, vBase + thickness - 0.6, 1.2, 0.6, COLOR_DARK, scale);
      if (t > 0.5) uRect(u, vBase, 1.2, 0.5, COLOR_LIGHT, scale);
    }
    uRect(0, 10.5, 1.2, 1, COLOR_DARK, scale);
    uRect(13, 5, 14, 8, COLOR_MID, scale); uRect(13, 5, 14, 0.8, COLOR_DARK, scale);
    uRect(13, 5, 0.8, 8, COLOR_DARK, scale); uRect(14, 12, 12, 1, COLOR_DARK, scale);
    uRect(15, 6, 10, 0.6, COLOR_LIGHT, scale);
    uRect(23, 4, 5, 4, COLOR_MID, scale); uRect(23, 4, 5, 0.8, COLOR_DARK, scale);
    uRect(24, 4.8, 3, 0.5, COLOR_LIGHT, scale);
    uRect(24, 0.5, 9, 5, COLOR_MID, scale); uRect(24, 0.5, 9, 0.8, COLOR_DARK, scale);
    uRect(24, 0.5, 0.8, 5, COLOR_DARK, scale); uRect(26, 1.3, 5, 0.6, COLOR_LIGHT, scale);
    uRect(30, 2, 4, 2, COLOR_MID, scale); uRect(30, 2, 4, 0.7, COLOR_DARK, scale);
    uRect(33, 2.8, 0.8, 0.8, COLOR_MOUTH, scale);
    uRect(30, 5, 4, 1.3, COLOR_MID, scale); uRect(30, 4.3, 4, 0.8, COLOR_MOUTH, scale);
    for (let i = 0; i < 3; i++) uRect(30.5 + i, 4.5, 0.6, 0.6, COLOR_TOOTH, scale);
    for (let i = 0; i < 3; i++) uRect(30.8 + i, 4.0, 0.5, 0.5, COLOR_TOOTH, scale);
    uRect(30, 5.7, 4, 0.4, COLOR_DARK, scale);
    uRect(27, 1.8, 1.5, 1.5, COLOR_EYE, scale); uRect(27.8, 2.1, 0.7, 0.9, COLOR_DARK, scale);
    uRect(27.2, 1.9, 0.4, 0.4, '#ffffff', scale); uRect(26.8, 1.4, 2.2, 0.5, COLOR_DARK, scale);
    uRect(26, 7.5, 2.5, 1, COLOR_ARM, scale); uRect(27.8, 8, 1.8, 0.8, COLOR_ARM, scale);
    uRect(29.2, 8.3, 1.2, 0.7, COLOR_ARM, scale); uRect(30.2, 8, 0.6, 0.4, COLOR_CLAW, scale);
    uRect(30.2, 8.6, 0.6, 0.4, COLOR_CLAW, scale); uRect(26, 8.3, 2.5, 0.3, COLOR_DARK, scale);
    uRect(15, 11, 4, 3, COLOR_MID, scale); uRect(15, 11, 4, 0.6, COLOR_LIGHT, scale);
    uRect(15, 11, 0.6, 3, COLOR_DARK, scale); uRect(15, 13, 5, 1.3, COLOR_DARK, scale);
    uRect(21, 11, 4, 3, COLOR_MID, scale); uRect(21, 11, 4, 0.6, COLOR_LIGHT, scale);
    uRect(21, 11, 0.6, 3, COLOR_DARK, scale); uRect(21, 13, 5, 1.3, COLOR_DARK, scale);
  }

  function drawDinoAt(x, y, ducking, jumping, phase, dead, scale = dino.scale) {
    let spriteH = ducking && !jumping ? 15 : 25;
    const spriteW = 35;
    const dx = x - 8 * scale;
    const dy = y - spriteH * scale;
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.beginPath(); ctx.ellipse(dx + spriteW * scale * 0.55, y + 3, spriteW * scale * 0.3, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.translate(dx, dy);
    if (ducking && !jumping) drawTRexDucking(scale);
    else drawTRexStanding(jumping ? 0 : phase, dead, scale);
    ctx.restore();
  }

  function drawDino() {
    const isDead = gameState === 'gameover';
    drawDinoAt(dino.x, dino.y, dino.ducking, dino.jumping, Math.floor(frame / 6) % 2, isDead, dino.scale);
  }

  let obstacles = []; let birds = []; let particles = []; let bonesFlying = [];
  
  function drawCactus(o, scale = dino.scale) {
    const x = o.x, y = o.y, h = o.h;
    const w = o.w;
    const s = scale;
    
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.beginPath();
    ctx.ellipse(x + w * s / 2, y + 3, w * s * 0.4, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = COLOR_DARK;
    
    if (o.type === 'cactus_small') {
      const stemW = 4;
      const stemX = x + (w / 2 - stemW / 2) * s;
      ctx.fillRect(stemX, y - h * s, stemW * s, h * s);
      const b1Y = y - h * s + h * 0.4 * s;
      ctx.fillRect(stemX - 4 * s, b1Y, 4 * s, 3 * s);
      ctx.fillRect(stemX - 4 * s, b1Y - 6 * s, 3 * s, 8 * s);
      const b2Y = y - h * s + h * 0.55 * s;
      ctx.fillRect(stemX + stemW * s, b2Y, 4 * s, 3 * s);
      ctx.fillRect(stemX + stemW * s + 1 * s, b2Y - 5 * s, 3 * s, 7 * s);
      ctx.fillStyle = COLOR_MID;
      ctx.fillRect(stemX + 1 * s, y - h * s + 2 * s, 1 * s, h * s - 4 * s);
    } else {
      const stemW = 6;
      const stemX = x + (w / 2 - stemW / 2) * s;
      ctx.fillRect(stemX, y - h * s, stemW * s, h * s);
      const b1Y = y - h * s + h * 0.3 * s;
      ctx.fillRect(stemX - 6 * s, b1Y, 6 * s, 4 * s);
      ctx.fillRect(stemX - 6 * s, b1Y - 8 * s, 4 * s, 10 * s);
      const b2Y = y - h * s + h * 0.45 * s;
      ctx.fillRect(stemX + stemW * s, b2Y, 6 * s, 4 * s);
      ctx.fillRect(stemX + stemW * s + 2 * s, b2Y - 8 * s, 4 * s, 10 * s);
      ctx.fillStyle = COLOR_MID;
      ctx.fillRect(stemX + 1.5 * s, y - h * s + 2 * s, 1.5 * s, h * s - 4 * s);
    }
  }

  function drawBird(b, scale = BIRD_SCALE_GAME) {
    const x = b.x, y = b.y; 
    const wingUp = Math.floor(frame / 8) % 2 === 0;
    ctx.fillStyle = 'rgba(0,0,0,0.10)'; 
    ctx.beginPath(); 
    ctx.ellipse(x + 20 * scale, GROUND_Y + 3, 20 * scale, 3, 0, 0, Math.PI * 2); 
    ctx.fill();
    if (b.magnetized) { 
      ctx.fillStyle = 'rgba(100,180,255,0.35)'; 
      ctx.beginPath(); 
      ctx.arc(x + 20 * scale, y, 40 * scale, 0, Math.PI * 2); 
      ctx.fill(); 
    }
    ctx.fillStyle = COLOR_DARK; 
    ctx.fillRect(x + 10 * scale, y - 6 * scale, 26 * scale, 8 * scale); 
    ctx.fillRect(x + 32 * scale, y - 10 * scale, 10 * scale, 8 * scale); 
    ctx.fillRect(x + 40 * scale, y - 8 * scale, 6 * scale, 3 * scale);
    ctx.fillStyle = COLOR_EYE; ctx.fillRect(x + 36 * scale, y - 8 * scale, 3 * scale, 3 * scale);
    ctx.fillStyle = COLOR_DARK; ctx.fillRect(x + 37 * scale, y - 7 * scale, 1 * scale, 1 * scale); 
    ctx.fillRect(x + 2 * scale, y - 4 * scale, 10 * scale, 6 * scale);
    if (wingUp) { 
      ctx.fillRect(x + 8 * scale, y - 24 * scale, 20 * scale, 18 * scale); 
      ctx.fillRect(x + 6 * scale, y - 28 * scale, 6 * scale, 8 * scale); 
      ctx.fillRect(x + 16 * scale, y - 30 * scale, 6 * scale, 10 * scale); 
      ctx.fillRect(x + 26 * scale, y - 26 * scale, 6 * scale, 8 * scale); 
    } else { 
      ctx.fillRect(x + 8 * scale, y + 2 * scale, 20 * scale, 14 * scale); 
      ctx.fillRect(x + 6 * scale, y + 14 * scale, 6 * scale, 6 * scale); 
      ctx.fillRect(x + 16 * scale, y + 16 * scale, 6 * scale, 8 * scale); 
      ctx.fillRect(x + 26 * scale, y + 12 * scale, 6 * scale, 8 * scale); 
    }
  }

  let clouds = [ { x: 500, y: 60, s: 1, speed: 0.2 }, { x: 750, y: 90, s: 0.8, speed: 0.3 }, { x: 200, y: 45, s: 0.6, speed: 0.15 } ];
  let groundDots = []; 
  for (let i = 0; i < 50; i++) groundDots.push({ x: Math.random() * W, y: GROUND_Y + 6 + Math.random() * 20, r: Math.random() * 1.5 + 0.5, shade: Math.random() > 0.5 ? '#999' : '#bbb' });

  function drawClouds() {
    clouds.forEach(c => {
      const s = c.s; ctx.fillStyle = '#e0e0e0';
      ctx.beginPath(); ctx.ellipse(c.x + 20 * s * dino.scale, c.y + 5 * s, 22 * s * dino.scale, 8 * s, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(c.x + 12 * s * dino.scale, c.y, 12 * s * dino.scale, 7 * s, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(c.x + 30 * s * dino.scale, c.y, 10 * s * dino.scale, 6 * s, 0, 0, Math.PI * 2); ctx.fill();
    });
  }

  function drawMountains() {
    ctx.fillStyle = '#ededed'; ctx.beginPath(); ctx.moveTo(0, GROUND_Y); const offset = (frame * 0.1) % 400;
    for (let i = -1; i < 4; i++) { const bx = i * 300 - offset; ctx.lineTo(bx + 80, GROUND_Y - 80 * dino.scale); ctx.lineTo(bx + 160, GROUND_Y - 30 * dino.scale); ctx.lineTo(bx + 220, GROUND_Y - 100 * dino.scale); ctx.lineTo(bx + 300, GROUND_Y); }
    ctx.lineTo(W, GROUND_Y); ctx.lineTo(W, GROUND_Y + 1); ctx.lineTo(0, GROUND_Y + 1); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e4e4e4'; ctx.beginPath(); ctx.moveTo(0, GROUND_Y); const offset2 = (frame * 0.2) % 500;
    for (let i = -1; i < 3; i++) { const bx = i * 400 - offset2; ctx.lineTo(bx + 100, GROUND_Y - 40 * dino.scale); ctx.lineTo(bx + 200, GROUND_Y - 15 * dino.scale); ctx.lineTo(bx + 300, GROUND_Y - 50 * dino.scale); ctx.lineTo(bx + 400, GROUND_Y); }
    ctx.lineTo(W, GROUND_Y); ctx.closePath(); ctx.fill();
  }

  function drawGround() {
    ctx.strokeStyle = COLOR_DARK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, GROUND_Y + 1); ctx.lineTo(W, GROUND_Y + 1); ctx.stroke();
    groundDots.forEach(d => { ctx.fillStyle = d.shade; ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2); ctx.fill(); });
    ctx.strokeStyle = '#aaa'; ctx.lineWidth = 1.5;
    for (let i = 0; i < 25; i++) { const gx = (i * 60 - (frame * speed) % 60); ctx.beginPath(); ctx.moveTo(gx, GROUND_Y + 3); ctx.lineTo(gx + 3, GROUND_Y - 5); ctx.stroke(); }
  }

  function spawnDust(x, y, count = 3, spread = 2) { for (let i = 0; i < count; i++) particles.push({ x: x + (Math.random() - 0.5) * 10, y: y, vx: -speed * 0.3 - Math.random() * 2, vy: -Math.random() * spread, life: 1, r: Math.random() * 2 + 1 }); }
  function spawnBone(x, y) { bonesFlying.push({ x, y, vy: -4, vx: 1, life: 1, rot: 0 }); }
  function updateParticles() { particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += 0.15; p.life -= 0.04; }); particles = particles.filter(p => p.life > 0); }
  function updateBonesFlying() { bonesFlying.forEach(b => { b.x += b.vx; b.y += b.vy; b.vy += 0.3; b.rot += 0.2; b.life -= 0.02; }); bonesFlying = bonesFlying.filter(b => b.life > 0); }
  function drawParticles() { particles.forEach(p => { ctx.fillStyle = `rgba(150,150,150,${p.life * 0.6})`; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill(); }); }
  function drawBoneShape(x, y, size = 14) { 
    ctx.save(); ctx.translate(x, y); ctx.fillStyle = COLOR_BONE; 
    const w = size, h = size * 0.5; 
    ctx.fillRect(-w/2, -h/4, w, h/2); 
    ctx.beginPath(); 
    ctx.arc(-w/2, -h/3, h/2, 0, Math.PI * 2); 
    ctx.arc(-w/2, h/3, h/2, 0, Math.PI * 2); 
    ctx.arc(w/2, -h/3, h/2, 0, Math.PI * 2); 
    ctx.arc(w/2, h/3, h/2, 0, Math.PI * 2); 
    ctx.fill(); ctx.restore(); 
  }
  function drawBonesFlying() { bonesFlying.forEach(b => { ctx.globalAlpha = b.life; ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.rot); drawBoneShape(0, 0, 16); ctx.restore(); ctx.globalAlpha = 1; }); }

  function reset() {
    obstacles = []; birds = []; particles = []; bonesFlying = [];
    dino.y = GROUND_Y; dino.vy = 0; dino.jumping = false; dino.ducking = false;
    score = 0; sessionBones = 0; 
    speed = BASE_SPEED; 
    frame = 0; spawnTimer = 40;
    dino.scale = DINO_SCALE_GAME; 
    gameState = 'playing'; 
    hideAllScreens(); 
    hud.classList.remove('hidden');
    fullscreenBtn.classList.remove('hidden');
    tapHint.classList.remove('hidden'); 
    setTimeout(() => tapHint.classList.add('hidden'), 1500);
    updateHUD();
  }

  function jump() {
    if (gameState !== 'playing' || dino.jumping || dino.ducking) return;
    haptic('jump');
    const jumpBonus = save.upgrades.jump * 1.08;
    dino.vy = JUMP_FORCE - jumpBonus; dino.jumping = true;
    spawnDust(dino.x + 30, GROUND_Y, 6, 3);
  }

  function duck(on) {
    if (gameState !== 'playing' || dino.jumping) return;
    dino.ducking = on;
  }

  function spawnObstacle() {
    if (Math.random() < 0.55) {
      const big = Math.random() < 0.5; 
      const h = big ? 30 : 20; 
      const w = big ? 12 : 8;
      obstacles.push({ x: W + 20, y: GROUND_Y, w, h, type: big ? 'cactus_big' : 'cactus_small' });
    } else {
      const heights = [GROUND_Y - 40, GROUND_Y - 90, GROUND_Y - 168]; 
      const y = heights[Math.floor(Math.random() * heights.length)];
      birds.push({ x: W + 20, y, w: 10, h: 10, type: 'bird', magnetized: false });
    }
  }

  function update() {
    if (isPortraitMode) return;
    
    frame++;
    if (gameState === 'playing') {
      score += 0.1 * (speed / BASE_SPEED); 
      speed = BASE_SPEED + Math.min(MAX_SPEED_BONUS, score / 400); 
      
      if (dino.jumping) {
        dino.vy += GRAVITY; dino.y += dino.vy;
        if (dino.y >= GROUND_Y) { dino.y = GROUND_Y; dino.vy = 0; dino.jumping = false; spawnDust(dino.x + 30, GROUND_Y, 5, 2); }
      } else if (frame % 8 === 0) { spawnDust(dino.x + 10, GROUND_Y, 1, 1); }
      
      spawnTimer -= 1;
      if (spawnTimer <= 0) {
        spawnObstacle(); 
        const minGap = 110, maxGap = 180;
        spawnTimer = minGap + Math.random() * (maxGap - minGap) - speed * 4;
        if (spawnTimer < 60) spawnTimer = 60;
      }
      
      obstacles.forEach(o => o.x -= speed); 
      obstacles = obstacles.filter(o => o.x + o.w > -20);
      
      birds.forEach(b => {
        let effectiveSpeed = speed * 0.5;
        if (save.upgrades.magnet > 0) {
          const magnetRange = 122.5 + save.upgrades.magnet * 49;
          const targetX = dino.x + 15 * dino.scale;
          const targetY = dino.y - 12 * dino.scale;
          const dx = targetX - (b.x + 20 * BIRD_SCALE_GAME);
          const dy = targetY - b.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if (dist < magnetRange && b.x > dino.x - 50) { 
            b.magnetized = true; 
            const pullSpeed = 1.4 * save.upgrades.magnet; 
            if (dist > pullSpeed) {
              b.x += (dx / dist) * pullSpeed;
              b.y += (dy / dist) * pullSpeed;
            } else {
              b.x += dx;
              b.y += dy;
            }
            effectiveSpeed = 0.2; 
          } else { b.magnetized = false; }
        }
        b.x -= effectiveSpeed;
      });
      birds = birds.filter(b => b.x + b.w > -20);
      
      let dinoBox;
      if (dino.ducking && !dino.jumping) {
        dinoBox = { x: dino.x + 6 * dino.scale, y: dino.y - 14 * dino.scale, w: 18 * dino.scale, h: 14 * dino.scale };
      } else {
        dinoBox = { x: dino.x + 6 * dino.scale, y: dino.y - 24 * dino.scale, w: 18 * dino.scale, h: 24 * dino.scale };
      }
      
      for (const o of obstacles) {
        let oBox;
        if (o.type === 'cactus_small') {
          oBox = { x: o.x - 0.5 * dino.scale, y: o.y - o.h * dino.scale, w: 11 * dino.scale, h: o.h * dino.scale };
        } else {
          oBox = { x: o.x, y: o.y - o.h * dino.scale, w: 20 * dino.scale, h: o.h * dino.scale };
        }
        if (rectCollide(dinoBox, oBox)) { gameOver(); return; }
      }
      
      for (let i = birds.length - 1; i >= 0; i--) {
        const b = birds[i]; 
        const bBox = { x: b.x + 2 * BIRD_SCALE_GAME, y: b.y - 20 * BIRD_SCALE_GAME, w: 38 * BIRD_SCALE_GAME, h: 24 * BIRD_SCALE_GAME };
        if (rectCollide(dinoBox, bBox)) {
          let bonesEarned = 1 + (save.upgrades.doubleBones || 0);
          sessionBones += bonesEarned;
          haptic('eat');
          for (let j = 0; j < bonesEarned; j++) spawnBone(b.x + 20 * BIRD_SCALE_GAME, b.y, j);
          spawnDust(b.x + 20 * BIRD_SCALE_GAME, b.y, 8, 4); 
          birds.splice(i, 1); 
          updateHUD();
        }
      }
      
      if (score > save.highScore) { save.highScore = score; writeSave(save); }
      clouds.forEach(c => { c.x -= c.speed; if (c.x < -80) { c.x = W + Math.random() * 200; c.y = 40 + Math.random() * 60; } });
      groundDots.forEach(d => { d.x -= speed; if (d.x < 0) { d.x = W; d.y = GROUND_Y + 6 + Math.random() * 20; } });
      updateHUD();
    }
    updateParticles(); updateBonesFlying();
    if (shakeTime > 0) shakeTime--;
  }

  function updateHUD() {
    hudHigh.textContent = String(Math.floor(save.highScore)).padStart(5, '0');
    hudScore.textContent = String(Math.floor(score)).padStart(5, '0');
    hudBones.textContent = save.bones + sessionBones;
  }

  function rectCollide(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }

  function gameOver() {
    gameState = 'gameover'; 
    shakeTime = 15; 
    haptic('crash');
    spawnDust(dino.x + 30, dino.y - 20, 15, 5); 
    
    const earnedThisGame = sessionBones;
    save.bones += sessionBones;
    sessionBones = 0;
    
    const finalScore = Math.floor(score);
    save.games.push({ score: finalScore, date: Date.now() }); 
    save.games.sort((a, b) => b.score - a.score); 
    save.games = save.games.slice(0, 10);
    if (finalScore > save.highScore) save.highScore = finalScore; 
    writeSave(save);
    
    updateHUD();
    goScore.textContent = finalScore; 
    goHigh.textContent = Math.floor(save.highScore); 
    goBones.textContent = `+${earnedThisGame} 🦴`;
    gameoverScreen.classList.remove('hidden');
    fullscreenBtn.classList.add('hidden');
  }

  function render() {
    let shakeX = 0, shakeY = 0;
    if (shakeTime > 0) { shakeX = (Math.random() - 0.5) * shakeTime * 0.6; shakeY = (Math.random() - 0.5) * shakeTime * 0.6; }
    ctx.save(); ctx.translate(shakeX, shakeY); ctx.clearRect(-20, -20, W + 40, H + 40);
    drawClouds(); drawMountains(); drawGround(); drawParticles(); 
    if (gameState === 'playing' || gameState === 'gameover') {
      obstacles.forEach(o => drawCactus(o, dino.scale)); 
      birds.forEach(b => drawBird(b, BIRD_SCALE_GAME));
      drawBonesFlying();
      drawDino();
    } else {
      drawMenuScene();
    }
    ctx.restore();
  }

  function drawMenuScene() {
    const menuDinoX = W * 0.15 + Math.sin(frame * 0.02) * 30;
    drawDinoAt(menuDinoX, GROUND_Y, false, false, Math.floor(frame / 6) % 2, false, DINO_SCALE_MENU);
    drawCactus({ x: W * 0.55, y: GROUND_Y, w: 8, h: 20, type: 'cactus_small' }, 2);
    drawCactus({ x: W * 0.75, y: GROUND_Y, w: 12, h: 30, type: 'cactus_big' }, 2);
    const birdX = W * 0.4 + Math.sin(frame * 0.03) * 100;
    const birdY = H * 0.25 + Math.cos(frame * 0.02) * 40;
    drawBird({ x: birdX, y: birdY, w: 10, h: 10, type: 'bird', magnetized: false }, BIRD_SCALE_MENU);
    const bird2X = W * 0.7 + Math.sin(frame * 0.025 + 1) * 80;
    const bird2Y = H * 0.35 + Math.cos(frame * 0.02 + 1) * 30;
    drawBird({ x: bird2X, y: bird2Y, w: 10, h: 10, type: 'bird', magnetized: false }, BIRD_SCALE_MENU);
  }

  function loop(ts) {
    const dt = ts - lastTime; lastTime = ts;
    const steps = Math.min(3, Math.max(1, Math.round(dt / 16.67)));
    for (let i = 0; i < steps; i++) update();
    render(); requestAnimationFrame(loop);
  }

  function hideAllScreens() { 
    menuScreen.classList.add('hidden'); 
    recordsScreen.classList.add('hidden'); 
    upgradesScreen.classList.add('hidden'); 
    settingsScreen.classList.add('hidden');
    gameoverScreen.classList.add('hidden'); 
    confirmDialog.classList.add('hidden');
  }
  
  function showMainMenu() { 
    gameState = 'menu'; 
    hideAllScreens(); 
    hud.classList.remove('hidden');
    fullscreenBtn.classList.remove('hidden');
    tapHint.classList.add('hidden'); 
    menuScreen.classList.remove('hidden'); 
    menuScreen.scrollTop = 0; 
    updateHUD();
  }
  
  function showRecords() { 
    gameState = 'records'; 
    hideAllScreens(); 
    fullscreenBtn.classList.add('hidden');
    recordsScreen.classList.remove('hidden'); 
    recordsScreen.scrollTop = 0; 
    renderRecords(); 
  }
  
  function showUpgrades() { 
    gameState = 'upgrades'; 
    hideAllScreens(); 
    fullscreenBtn.classList.add('hidden');
    upgradesScreen.classList.remove('hidden'); 
    upgradesScreen.scrollTop = 0; 
    renderUpgrades(); 
  }

  function showSettings() {
    gameState = 'settings'; 
    hideAllScreens(); 
    fullscreenBtn.classList.add('hidden');
    settingsScreen.classList.remove('hidden'); 
    settingsScreen.scrollTop = 0; 
  }

  function renderRecords() {
    recordsList.innerHTML = '';
    if (save.games.length === 0) { recordsList.innerHTML = '<div class="empty-records">Пока нет рекордов<br>Сыграй первую игру! 🦖</div>'; return; }
    save.games.forEach((g, i) => {
      const row = document.createElement('div'); row.className = 'record-row';
      if (i === 0) row.classList.add('top1'); else if (i === 1) row.classList.add('top2'); else if (i === 2) row.classList.add('top3');
      const date = new Date(g.date); const dateStr = `${date.getDate()}.${String(date.getMonth()+1).padStart(2,'0')}.${String(date.getFullYear()).slice(2)}`;
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`;
      row.innerHTML = `<span class="rank">${medal}</span><span class="score">${g.score}</span><span class="date">${dateStr}</span>`;
      recordsList.appendChild(row);
    });
  }

  function renderUpgrades() {
    upgradesBones.textContent = save.bones; upgradesList.innerHTML = '';
    UPGRADES.forEach(upg => {
      const level = save.upgrades[upg.id] || 0; const isMax = level >= upg.maxLevel;
      const cost = isMax ? null : upg.costs[level]; const canAfford = !isMax && save.bones >= cost;
      const card = document.createElement('div'); card.className = 'upgrade-card'; if (isMax) card.classList.add('maxed');
      card.innerHTML = `
        <div class="upgrade-icon">${upg.icon}</div>
        <div class="upgrade-info">
          <div class="upgrade-name">${upg.name}</div>
          <div class="upgrade-desc">${upg.desc}</div>
          <div class="upgrade-level">Уровень ${level}/${upg.maxLevel}</div>
        </div>
        <button class="upgrade-buy ${isMax ? 'maxed' : ''} ${canAfford ? 'buyable' : ''}" ${isMax || !canAfford ? 'disabled' : ''}>
          ${isMax ? '✓ MAX' : `${cost} 🦴`}
        </button>
      `;
      if (!isMax) card.querySelector('.upgrade-buy').addEventListener('pointerdown', (e) => { e.stopPropagation(); buyUpgrade(upg.id); });
      upgradesList.appendChild(card);
    });
  }

  function buyUpgrade(id) {
    const upg = UPGRADES.find(u => u.id === id); if (!upg) return;
    const level = save.upgrades[id] || 0; if (level >= upg.maxLevel) return;
    const cost = upg.costs[level]; if (save.bones < cost) return;
    save.bones -= cost; save.upgrades[id] = level + 1; writeSave(save); renderUpgrades();
  }

  document.addEventListener('pointerdown', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();

    const action = btn.dataset.action;
    
    if (action === 'fullscreen') { toggleFullscreen(); return; }
    if (action === 'start') { reset(); }
    else if (action === 'records') { showRecords(); }
    else if (action === 'upgrades') { showUpgrades(); }
    else if (action === 'settings') { showSettings(); }
    else if (action === 'back') { showMainMenu(); }
    else if (action === 'reset') { confirmDialog.classList.remove('hidden'); }
    else if (action === 'reset-no') { confirmDialog.classList.add('hidden'); }
    else if (action === 'reset-yes') {
      save = defaultSave();
      writeSave(save);
      updateHUD();
      renderUpgrades();
      renderRecords();
      confirmDialog.classList.add('hidden');
      showMainMenu();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (gameState !== 'playing' || isPortraitMode) { 
      if (e.code === 'Escape') { 
        if (gameState === 'records' || gameState === 'upgrades' || gameState === 'settings') showMainMenu(); 
        else if (gameState === 'gameover') showMainMenu(); 
      } 
      return; 
    }
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') { e.preventDefault(); jump(); }
    if (e.code === 'ArrowDown' || e.code === 'KeyS') { e.preventDefault(); duck(true); }
  });
  document.addEventListener('keyup', (e) => { if (e.code === 'ArrowDown' || e.code === 'KeyS') duck(false); });

  let touchStartY = null; let touchMoved = false; let touchStartTime = 0;
  document.addEventListener('touchstart', (e) => {
    if (e.target.closest('button') || gameState !== 'playing' || isPortraitMode) return;
    touchStartY = e.changedTouches[0].clientY; touchMoved = false; touchStartTime = performance.now();
  }, { passive: true });
  document.addEventListener('touchmove', (e) => {
    if (touchStartY === null || e.target.closest('button')) return;
    const dy = e.changedTouches[0].clientY - touchStartY;
    if (dy > 25 && gameState === 'playing' && !dino.jumping) { duck(true); touchMoved = true; }
  }, { passive: true });
  document.addEventListener('touchend', (e) => {
    if (touchStartY === null) return;
    const dy = e.changedTouches[0].clientY - touchStartY; const dt = performance.now() - touchStartTime;
    if (dy > 25) { duck(false); } else if (!touchMoved && dt < 500) { if (gameState === 'playing') jump(); }
    touchStartY = null;
  }, { passive: true });

  // ===== ИНИЦИАЛИЗАЦИЯ =====
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  window.addEventListener('orientationchange', () => setTimeout(resizeCanvas, 100));
  
  // Telegram: доп. ресайзы после разворота Mini App
  if (window.Telegram?.WebApp) {
    const _tg = window.Telegram.WebApp;
    if (_tg.onEvent) {
      _tg.onEvent('viewportChanged', () => setTimeout(resizeCanvas, 100));
    }
    setTimeout(resizeCanvas, 300);
  }
  
  updateHUD(); 
  showMainMenu(); 
  requestAnimationFrame(loop);
})();
