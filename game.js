// ===== ИНИЦИАЛИЗАЦИЯ TELEGRAM =====
const tg = window.Telegram?.WebApp;
const isTelegram = tg && tg.platform && tg.platform !== 'unknown';

if (isTelegram) {
  tg.ready();
  tg.expand();
  if (tg.disableVerticalSwipes) tg.disableVerticalSwipes();
  if (tg.setHeaderColor) tg.setHeaderColor('#E3F2FD');
  if (tg.setBackgroundColor) tg.setBackgroundColor('#E3F2FD');
  document.body.classList.add('telegram-mode');
}

function haptic(type) {
  if (isTelegram && tg.HapticFeedback) {
    if (type === 'jump') tg.HapticFeedback.impactOccurred('light');
    if (type === 'eat') tg.HapticFeedback.notificationOccurred('success');
    if (type === 'crash') tg.HapticFeedback.notificationOccurred('error');
    if (type === 'buy') tg.HapticFeedback.impactOccurred('medium');
  }
}

// ===== ЗВУКИ (Web Audio API) =====
let audioCtx = null;
let soundEnabled = true;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function playSound(type) {
  if (!soundEnabled || !audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);

  const now = audioCtx.currentTime;
  if (type === 'jump') {
    osc.type = 'sine'; osc.frequency.setValueAtTime(400, now); osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
    gain.gain.setValueAtTime(0.1, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    osc.start(now); osc.stop(now + 0.1);
  } else if (type === 'eat') {
    osc.type = 'square'; osc.frequency.setValueAtTime(600, now); osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
    gain.gain.setValueAtTime(0.1, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    osc.start(now); osc.stop(now + 0.1);
  } else if (type === 'crash') {
    osc.type = 'sawtooth'; osc.frequency.setValueAtTime(200, now); osc.frequency.exponentialRampToValueAtTime(50, now + 0.3);
    gain.gain.setValueAtTime(0.2, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    osc.start(now); osc.stop(now + 0.3);
  } else if (type === 'click') {
    osc.type = 'triangle'; osc.frequency.setValueAtTime(300, now);
    gain.gain.setValueAtTime(0.1, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
    osc.start(now); osc.stop(now + 0.05);
  } else if (type === 'record') {
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C E G C
    notes.forEach((freq, i) => {
      const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
      o.connect(g); g.connect(audioCtx.destination);
      o.type = 'sine'; o.frequency.setValueAtTime(freq, now + i * 0.1);
      g.gain.setValueAtTime(0.15, now + i * 0.1); g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.2);
      o.start(now + i * 0.1); o.stop(now + i * 0.1 + 0.2);
    });
  }
}

// ===== ИГРА =====
(() => {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  
  // Сплэш-экран
  const splash = document.getElementById('splashScreen');
  setTimeout(() => {
    splash.classList.add('fade-out');
    setTimeout(() => splash.remove(), 500);
  }, 1500);

  // DOM элементы
  const fullscreenBtn = document.getElementById('fullscreenBtn');
  const fsIconExpand = document.getElementById('fsIconExpand');
  const fsIconCollapse = document.getElementById('fsIconCollapse');
  const hud = document.getElementById('hud');
  const hudHigh = document.getElementById('hudHigh');
  const hudScore = document.getElementById('hudScore');
  const hudBones = document.getElementById('hudBones');
  const tapHint = document.getElementById('tapHint');
  const speedBarContainer = document.getElementById('speedBarContainer');
  const speedBar = document.getElementById('speedBar');
  
  const menuScreen = document.getElementById('menuScreen');
  const recordsScreen = document.getElementById('recordsScreen');
  const upgradesScreen = document.getElementById('upgradesScreen');
  const achievementsScreen = document.getElementById('achievementsScreen');
  const settingsScreen = document.getElementById('settingsScreen');
  const gameoverScreen = document.getElementById('gameoverScreen');
  const confirmDialog = document.getElementById('confirmDialog');
  
  const recordsList = document.getElementById('recordsList');
  const upgradesList = document.getElementById('upgradesList');
  const skinsList = document.getElementById('skinsList');
  const achievementsList = document.getElementById('achievementsList');
  const upgradesBones = document.getElementById('upgradesBones');
  const goScore = document.getElementById('goScore');
  const goHigh = document.getElementById('goHigh');
  const goBones = document.getElementById('goBones');
  const newRecordText = document.getElementById('newRecordText');
  const btnSound = document.getElementById('btnSound');
  const achievementPopup = document.getElementById('achievementPopup');
  const achPopupIcon = document.getElementById('achPopupIcon');
  const achPopupName = document.getElementById('achPopupName');

  // Fullscreen
  function isFullscreen() { return !!(document.fullscreenElement || document.webkitFullscreenElement); }
  function updateFullscreenIcon() {
    if (isFullscreen()) { fsIconExpand.style.display = 'none'; fsIconCollapse.style.display = 'block'; }
    else { fsIconExpand.style.display = 'block'; fsIconCollapse.style.display = 'none'; }
  }
  function toggleFullscreen() {
    if (isFullscreen()) { if (document.exitFullscreen) document.exitFullscreen(); }
    else { if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen(); }
  }
  ['fullscreenchange', 'webkitfullscreenchange'].forEach(evt => {
    document.addEventListener(evt, () => { updateFullscreenIcon(); setTimeout(resizeCanvas, 100); });
  });

  // Ориентация
  let isPortraitMode = window.matchMedia("(orientation: portrait)").matches;
  const portraitQuery = window.matchMedia("(orientation: portrait)");
  const updateOrientation = () => { isPortraitMode = portraitQuery.matches; };
  if (portraitQuery.addEventListener) portraitQuery.addEventListener("change", updateOrientation);
  window.addEventListener('orientationchange', () => setTimeout(updateOrientation, 100));

  // Размеры
  let W = window.innerWidth, H = window.innerHeight, GROUND_Y = H * 0.8;
  function resizeCanvas() {
    const oldGroundY = GROUND_Y;
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W; canvas.height = H;
    GROUND_Y = H * 0.8;
    if (!dino.jumping) dino.y = GROUND_Y;
    if (typeof groundDots !== 'undefined') groundDots.forEach(d => { d.y = GROUND_Y + 6 + Math.random() * 20; });
    if (typeof obstacles !== 'undefined') obstacles.forEach(o => { o.y = GROUND_Y; });
    if (typeof birds !== 'undefined') { const dY = GROUND_Y - oldGroundY; birds.forEach(b => { b.y += dY; }); }
    if (typeof powerUps !== 'undefined') { const dY = GROUND_Y - oldGroundY; powerUps.forEach(p => { p.y += dY; }); }
  }

  // Константы
  const GRAVITY = 0.75;
  const JUMP_FORCE = -12.6;
  const DINO_SCALE_GAME = 1.8;
  const DINO_SCALE_MENU = 3.0;
  const BIRD_SCALE_GAME = 0.9;
  const BIRD_SCALE_MENU = 1.2;
  const BASE_SPEED = 3.5;
  const MAX_SPEED_BONUS = 4.5;

  // Скины
  const SKINS = [
    { id: 'default', name: 'Зелёный', cost: 0, body: '#4CAF50', outline: '#1B5E20', belly: '#A5D6A7', claw: '#FFF', eye: '#FFF' },
    { id: 'fire', name: 'Огненный', cost: 50, body: '#F44336', outline: '#B71C1C', belly: '#FFCDD2', claw: '#FFE082', eye: '#FFF' },
    { id: 'ice', name: 'Ледяной', cost: 100, body: '#2196F3', outline: '#0D47A1', belly: '#BBDEFB', claw: '#E1F5FE', eye: '#FFF' },
    { id: 'gold', name: 'Золотой', cost: 200, body: '#FFC107', outline: '#FF6F00', belly: '#FFECB3', claw: '#FFF', eye: '#FFF' }
  ];

  // Улучшения
  const UPGRADES = [
    { id: 'jump', icon: '🦘', name: 'Прыжок', desc: 'Сила прыжка', maxLevel: 5, costs: [10, 30, 60, 100, 150] },
    { id: 'magnet', icon: '🧲', name: 'Магнит', desc: 'Притяжение птиц', maxLevel: 2, costs: [15, 40] },
    { id: 'doubleBones', icon: '✨', name: 'Двойные кости', desc: '+1 кость за птицу', maxLevel: 2, costs: [25, 75] }
  ];

  // Достижения
  const ACHIEVEMENTS_DEF = [
    { id: 'first_run', icon: '👟', name: 'Первый шаг', desc: 'Сыграть первую игру' },
    { id: 'score_500', icon: '⭐', name: 'Новичок', desc: 'Набрать 500 очков' },
    { id: 'score_2000', icon: '🌟', name: 'Профи', desc: 'Набрать 2000 очков' },
    { id: 'birds_10', icon: '🦅', name: 'Охотник', desc: 'Съесть 10 птиц за игру' },
    { id: 'bones_100', icon: '💰', name: 'Богач', desc: 'Накопить 100 костей' }
  ];

  // Сохранение
  const SAVE_KEY = 'trex_color_save_v1';
  function defaultSave() { return { highScore: 0, bones: 0, games: [], upgrades: { jump: 0, magnet: 0, doubleBones: 0 }, achievements: {}, currentSkin: 'default', unlockedSkins: ['default'] }; }
  let save = (() => { try { const raw = localStorage.getItem(SAVE_KEY); return raw ? { ...defaultSave(), ...JSON.parse(raw) } : defaultSave(); } catch { return defaultSave(); } })();
  function writeSave() { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); }

  // Состояние
  let gameState = 'menu';
  let score = 0, speed = BASE_SPEED, frame = 0, lastTime = 0, spawnTimer = 0, shakeTime = 0, sessionBones = 0;
  let currentTheme = 'day'; // day / night
  let isRaining = false;
  let powerUpActive = null; // { type, timer }
  let birdsEatenThisGame = 0;

  const dino = { x: 60, y: GROUND_Y, scale: DINO_SCALE_GAME, vy: 0, jumping: false, ducking: false, jumpsLeft: 1 };
  let obstacles = [], birds = [], particles = [], bonesFlying = [], powerUps = [], rainDrops = [], floatingTexts = [];

  // === ЦВЕТОВЫЕ ПАЛИТРЫ ===
  const THEMES = {
    day: {
      skyTop: '#64B5F6', skyBot: '#E3F2FD',
      mountainFar: '#90CAF9', mountainNear: '#A5D6A7',
      ground: '#8BC34A', groundLine: '#33691E', dirt: '#795548',
      cactus: '#388E3C', cactusLight: '#4CAF50',
      cloud: '#FFFFFF', bird: '#37474F'
    },
    night: {
      skyTop: '#1A237E', skyBot: '#311B92',
      mountainFar: '#283593', mountainNear: '#1B5E20',
      ground: '#33691E', groundLine: '#1B5E20', dirt: '#3E2723',
      cactus: '#1B5E20', cactusLight: '#2E7D32',
      cloud: '#B0BEC5', bird: '#ECEFF1'
    }
  };

  function getDinoColors() {
    const skin = SKINS.find(s => s.id === save.currentSkin) || SKINS[0];
    return skin;
  }

  // --- Отрисовка ---
  function uRect(u, v, w, h, color, scale = dino.scale) {
    ctx.fillStyle = color;
    ctx.fillRect(u * scale, v * scale, w * scale, h * scale);
  }

  function drawTRexStanding(phase, dead, scale = dino.scale) {
    const c = getDinoColors();
    const tailSegments = 14;
    for (let i = 0; i < tailSegments; i++) {
      const t = i / (tailSegments - 1);
      const u = t * 15; const vBase = 10 + (1 - t) * 5; const thickness = 1 + t * 4;
      uRect(u, vBase, 1.2, thickness, c.body, scale);
      uRect(u, vBase + thickness - 0.7, 1.2, 0.7, c.outline, scale);
    }
    uRect(0, 15, 1.2, 1, c.outline, scale);
    uRect(13, 8, 14, 11, c.body, scale); uRect(13, 8, 14, 1, c.outline, scale);
    uRect(14, 17, 12, 2, c.belly, scale); uRect(14, 19, 12, 0.8, c.outline, scale);
    uRect(15, 9, 10, 0.7, c.belly, scale);
    uRect(23, 6, 5, 6, c.body, scale); uRect(23, 6, 5, 1, c.outline, scale);
    uRect(24, 7, 3, 0.6, c.belly, scale);
    uRect(24, 1, 9, 6, c.body, scale); uRect(24, 1, 9, 1, c.outline, scale);
    uRect(24, 1, 1, 6, c.outline, scale); uRect(26, 2, 5, 0.7, c.belly, scale);
    
    // Челюсть
    uRect(30, 3, 4, 2.5, c.body, scale); uRect(30, 3, 4, 0.8, c.outline, scale);
    uRect(33, 4, 0.8, 0.8, '#000', scale); // ноздря
    uRect(30, 6.5, 4, 1.5, c.body, scale); uRect(30, 5.5, 4, 1, '#D32F2F', scale); // пасть
    for (let i = 0; i < 3; i++) uRect(30.5 + i, 5.8, 0.6, 0.7, '#FFF', scale);
    for (let i = 0; i < 3; i++) uRect(30.8 + i, 5.2, 0.5, 0.6, '#FFF', scale);
    uRect(30, 7.5, 4, 0.5, c.outline, scale);

    // Глаз
    if (dead) { uRect(27, 2.5, 1, 1, c.outline, scale); uRect(27.2, 2.7, 0.6, 0.6, c.eye, scale); }
    else { 
      uRect(27, 2.5, 1.5, 1.5, c.eye, scale); 
      uRect(27.8, 2.8, 0.7, 0.9, '#000', scale); 
      uRect(27.2, 2.6, 0.4, 0.4, '#FFF', scale); 
    }
    uRect(26.8, 2.1, 2.2, 0.5, c.outline, scale); // бровь

    // Лапки
    uRect(26, 11, 2.5, 1.2, c.outline, scale); uRect(27.5, 11.5, 2, 0.9, c.outline, scale);
    uRect(28.8, 12, 1.8, 0.9, c.outline, scale); uRect(30, 12.3, 1.2, 0.8, c.outline, scale);
    uRect(31, 12, 0.6, 0.5, c.claw, scale); uRect(31, 12.7, 0.6, 0.5, c.claw, scale);
    uRect(26, 12, 2.5, 0.4, c.outline, scale);

    // Ноги
    uRect(15, 17, 5, 4, c.body, scale); uRect(15, 17, 5, 0.7, c.belly, scale);
    uRect(15, 17, 0.7, 4, c.outline, scale);
    if (phase === 0) {
      uRect(16, 20, 2.5, 4.5, c.body, scale); uRect(16, 20, 0.7, 4.5, c.outline, scale);
      uRect(16, 23.5, 3.5, 1.2, c.outline, scale);
      uRect(21, 20, 2.5, 3, c.body, scale); uRect(21, 20, 0.7, 3, c.outline, scale);
      uRect(21, 22.5, 3.5, 1.2, c.outline, scale);
    } else {
      uRect(16, 20, 2.5, 3, c.body, scale); uRect(16, 20, 0.7, 3, c.outline, scale);
      uRect(16, 22.5, 3.5, 1.2, c.outline, scale);
      uRect(21, 20, 2.5, 4.5, c.body, scale); uRect(21, 20, 0.7, 4.5, c.outline, scale);
      uRect(21, 23.5, 3.5, 1.2, c.outline, scale);
    }
  }

  function drawTRexDucking(scale = dino.scale) {
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
    uRect(15, 11, 4, 3, c.body, scale); uRect(15, 11, 4, 0.6, c.belly, scale);
    uRect(15, 11, 0.6, 3, c.outline, scale); uRect(15, 13, 5, 1.3, c.outline, scale);
    uRect(21, 11, 4, 3, c.body, scale); uRect(21, 11, 4, 0.6, c.belly, scale);
    uRect(21, 11, 0.6, 3, c.outline, scale); uRect(21, 13, 5, 1.3, c.outline, scale);
  }

  function drawDinoAt(x, y, ducking, jumping, phase, dead, scale = dino.scale) {
    let spriteH = ducking && !jumping ? 15 : 25;
    const spriteW = 35;
    const dx = x - 8 * scale;
    const dy = y - spriteH * scale;
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath(); ctx.ellipse(dx + spriteW * scale * 0.55, y + 3, spriteW * scale * 0.3, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.translate(dx, dy);
    if (ducking && !jumping) drawTRexDucking(scale);
    else drawTRexStanding(jumping ? 0 : phase, dead, scale);
    ctx.restore();
  }

  function drawDino() {
    const isDead = gameState === 'gameover';
    drawDinoAt(dino.x, dino.y, dino.ducking, dino.jumping, Math.floor(frame / 6) % 2, isDead, dino.scale);
    // Аура щита
    if (powerUpActive && powerUpActive.type === 'shield') {
      ctx.strokeStyle = 'rgba(33,150,243,0.8)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(dino.x + 30, dino.y - 30, 45, 0, Math.PI * 2); ctx.stroke();
    }
  }

  function drawCactus(o, scale = dino.scale) {
    const x = o.x, y = o.y, h = o.h, w = o.w, s = scale;
    const theme = THEMES[currentTheme];
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath(); ctx.ellipse(x + w * s / 2, y + 3, w * s * 0.4, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = theme.cactus;
    if (o.type === 'cactus_small') {
      const stemW = 4; const stemX = x + (w / 2 - stemW / 2) * s;
      ctx.fillRect(stemX, y - h * s, stemW * s, h * s);
      const b1Y = y - h * s + h * 0.4 * s;
      ctx.fillRect(stemX - 4 * s, b1Y, 4 * s, 3 * s); ctx.fillRect(stemX - 4 * s, b1Y - 6 * s, 3 * s, 8 * s);
      const b2Y = y - h * s + h * 0.55 * s;
      ctx.fillRect(stemX + stemW * s, b2Y, 4 * s, 3 * s); ctx.fillRect(stemX + stemW * s + 1 * s, b2Y - 5 * s, 3 * s, 7 * s);
      ctx.fillStyle = theme.cactusLight;
      ctx.fillRect(stemX + 1 * s, y - h * s + 2 * s, 1 * s, h * s - 4 * s);
    } else {
      const stemW = 6; const stemX = x + (w / 2 - stemW / 2) * s;
      ctx.fillRect(stemX, y - h * s, stemW * s, h * s);
      const b1Y = y - h * s + h * 0.3 * s;
      ctx.fillRect(stemX - 6 * s, b1Y, 6 * s, 4 * s); ctx.fillRect(stemX - 6 * s, b1Y - 8 * s, 4 * s, 10 * s);
      const b2Y = y - h * s + h * 0.45 * s;
      ctx.fillRect(stemX + stemW * s, b2Y, 6 * s, 4 * s); ctx.fillRect(stemX + stemW * s + 2 * s, b2Y - 8 * s, 4 * s, 10 * s);
      ctx.fillStyle = theme.cactusLight;
      ctx.fillRect(stemX + 1.5 * s, y - h * s + 2 * s, 1.5 * s, h * s - 4 * s);
    }
  }

  function drawBird(b, scale = BIRD_SCALE_GAME) {
    const x = b.x, y = b.y; const wingUp = Math.floor(frame / 8) % 2 === 0;
    const theme = THEMES[currentTheme];
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(x + 20 * scale, GROUND_Y + 3, 20 * scale, 3, 0, 0, Math.PI * 2); ctx.fill();
    if (b.magnetized) { ctx.fillStyle = 'rgba(100,180,255,0.35)'; ctx.beginPath(); ctx.arc(x + 20 * scale, y, 40 * scale, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = theme.bird;
    ctx.fillRect(x + 10 * scale, y - 6 * scale, 26 * scale, 8 * scale); ctx.fillRect(x + 32 * scale, y - 10 * scale, 10 * scale, 8 * scale); ctx.fillRect(x + 40 * scale, y - 8 * scale, 6 * scale, 3 * scale);
    ctx.fillStyle = '#FFF'; ctx.fillRect(x + 36 * scale, y - 8 * scale, 3 * scale, 3 * scale);
    ctx.fillStyle = '#000'; ctx.fillRect(x + 37 * scale, y - 7 * scale, 1 * scale, 1 * scale);
    ctx.fillStyle = theme.bird; ctx.fillRect(x + 2 * scale, y - 4 * scale, 10 * scale, 6 * scale);
    if (wingUp) { ctx.fillRect(x + 8 * scale, y - 24 * scale, 20 * scale, 18 * scale); ctx.fillRect(x + 6 * scale, y - 28 * scale, 6 * scale, 8 * scale); ctx.fillRect(x + 16 * scale, y - 30 * scale, 6 * scale, 10 * scale); ctx.fillRect(x + 26 * scale, y - 26 * scale, 6 * scale, 8 * scale); }
    else { ctx.fillRect(x + 8 * scale, y + 2 * scale, 20 * scale, 14 * scale); ctx.fillRect(x + 6 * scale, y + 14 * scale, 6 * scale, 6 * scale); ctx.fillRect(x + 16 * scale, y + 16 * scale, 6 * scale, 8 * scale); ctx.fillRect(x + 26 * scale, y + 12 * scale, 6 * scale, 8 * scale); }
  }

  function drawPowerUp(p) {
    const x = p.x, y = p.y;
    ctx.save();
    ctx.translate(x, y);
    ctx.shadowColor = p.color; ctx.shadowBlur = 15;
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(0, 0, 15, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#FFF'; ctx.font = 'bold 16px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(p.icon, 0, 2);
    ctx.restore();
  }

  let clouds = [{ x: 500, y: 60, s: 1, speed: 0.2 }, { x: 750, y: 90, s: 0.8, speed: 0.3 }];
  let groundDots = []; for (let i = 0; i < 50; i++) groundDots.push({ x: Math.random() * W, y: GROUND_Y + 6 + Math.random() * 20, r: Math.random() * 1.5 + 0.5 });

  function drawBackground() {
    const theme = THEMES[currentTheme];
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, theme.skyTop); grad.addColorStop(1, theme.skyBot);
    ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);

    if (currentTheme === 'night') {
      ctx.fillStyle = '#FFF';
      for (let i = 0; i < 30; i++) {
        let sx = (i * 137 + frame * 0.05) % W;
        let sy = (i * 71) % (GROUND_Y - 100) + 20;
        if (Math.sin(frame * 0.05 + i) > 0.5) ctx.fillRect(sx, sy, 2, 2);
      }
    }

    clouds.forEach(c => {
      const s = c.s; ctx.fillStyle = theme.cloud; ctx.globalAlpha = currentTheme === 'night' ? 0.3 : 0.8;
      ctx.beginPath(); ctx.ellipse(c.x + 20 * s, c.y + 5 * s, 25 * s, 12 * s, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(c.x + 10 * s, c.y, 15 * s, 10 * s, 0, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    });

    ctx.fillStyle = theme.mountainFar; ctx.beginPath(); ctx.moveTo(0, GROUND_Y); 
    const offset = (frame * 0.1) % 400;
    for (let i = -1; i < 4; i++) { const bx = i * 300 - offset; ctx.lineTo(bx + 80, GROUND_Y - 90); ctx.lineTo(bx + 160, GROUND_Y - 30); ctx.lineTo(bx + 220, GROUND_Y - 110); ctx.lineTo(bx + 300, GROUND_Y); }
    ctx.lineTo(W, GROUND_Y); ctx.lineTo(W, GROUND_Y + 2); ctx.lineTo(0, GROUND_Y + 2); ctx.closePath(); ctx.fill();

    ctx.fillStyle = theme.mountainNear; ctx.beginPath(); ctx.moveTo(0, GROUND_Y);
    const offset2 = (frame * 0.25) % 500;
    for (let i = -1; i < 3; i++) { const bx = i * 400 - offset2; ctx.lineTo(bx + 100, GROUND_Y - 50); ctx.lineTo(bx + 200, GROUND_Y - 15); ctx.lineTo(bx + 300, GROUND_Y - 60); ctx.lineTo(bx + 400, GROUND_Y); }
    ctx.lineTo(W, GROUND_Y); ctx.closePath(); ctx.fill();
  }

  function drawGround() {
    const theme = THEMES[currentTheme];
    ctx.fillStyle = theme.ground; ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);
    ctx.strokeStyle = theme.groundLine; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, GROUND_Y); ctx.lineTo(W, GROUND_Y); ctx.stroke();
    ctx.fillStyle = theme.dirt;
    groundDots.forEach(d => { ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2); ctx.fill(); });
    ctx.strokeStyle = theme.groundLine; ctx.lineWidth = 1.5;
    for (let i = 0; i < 30; i++) { const gx = (i * 50 - (frame * speed) % 50); ctx.beginPath(); ctx.moveTo(gx, GROUND_Y + 4); ctx.lineTo(gx + 2, GROUND_Y - 6); ctx.stroke(); }
  }

  // Частицы и дождь
  function updateParticles() { particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += 0.15; p.life -= 0.04; }); particles = particles.filter(p => p.life > 0); }
  function updateBonesFlying() { bonesFlying.forEach(b => { b.x += b.vx; b.y += b.vy; b.vy += 0.3; b.rot += 0.2; b.life -= 0.02; }); bonesFlying = bonesFlying.filter(b => b.life > 0); }
  function updateRain() {
    if (!isRaining) return;
    rainDrops.forEach(r => { r.x += r.vx; r.y += r.vy; if (r.y > H || r.x < 0) { r.y = -20; r.x = Math.random() * W; } });
  }
  function drawRain() {
    if (!isRaining) return;
    ctx.strokeStyle = 'rgba(150,200,255,0.6)'; ctx.lineWidth = 1.5;
    rainDrops.forEach(r => { ctx.beginPath(); ctx.moveTo(r.x, r.y); ctx.lineTo(r.x + r.vx * 3, r.y + r.vy * 3); ctx.stroke(); });
  }

  function drawBoneShape(x, y, size = 14) {
    ctx.save(); ctx.translate(x, y);
    const w = size, h = size * 0.5;
    ctx.fillStyle = '#FFF8E1'; ctx.strokeStyle = '#FFB300'; ctx.lineWidth = 2;
    ctx.fillRect(-w/2, -h/4, w, h/2); ctx.strokeRect(-w/2, -h/4, w, h/2);
    ctx.beginPath(); ctx.arc(-w/2, -h/3, h/2, 0, Math.PI * 2); ctx.arc(-w/2, h/3, h/2, 0, Math.PI * 2); ctx.arc(w/2, -h/3, h/2, 0, Math.PI * 2); ctx.arc(w/2, h/3, h/2, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke(); ctx.restore();
  }

  function spawnFloatingText(x, y, text) {
    const el = document.createElement('div');
    el.className = 'floating-text'; el.textContent = text;
    el.style.left = x + 'px'; el.style.top = y + 'px';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1000);
  }

  // Логика
  function reset() {
    obstacles = []; birds = []; particles = []; bonesFlying = []; powerUps = []; floatingTexts = []; rainDrops = [];
    dino.y = GROUND_Y; dino.vy = 0; dino.jumping = false; dino.ducking = false; dino.jumpsLeft = 1;
    score = 0; sessionBones = 0; speed = BASE_SPEED; frame = 0; spawnTimer = 40;
    dino.scale = DINO_SCALE_GAME; currentTheme = 'day'; isRaining = false;
    gameState = 'playing'; hideAllScreens(); 
    hud.classList.remove('hidden'); speedBarContainer.classList.add('active');
    fullscreenBtn.classList.remove('hidden');
    tapHint.classList.remove('hidden'); setTimeout(() => tapHint.classList.add('hidden'), 2000);
    updateHUD(); initAudio();
  }

  function jump() {
    if (gameState !== 'playing' || dino.ducking) return;
    if (dino.jumping && dino.jumpsLeft > 0) {
      dino.vy = JUMP_FORCE; dino.jumpsLeft--; haptic('jump'); playSound('jump');
      spawnDust(dino.x + 30, dino.y, 6, 3);
    } else if (!dino.jumping) {
      dino.vy = JUMP_FORCE - (save.upgrades.jump * 1.08); dino.jumping = true; dino.jumpsLeft = 1; haptic('jump'); playSound('jump');
      spawnDust(dino.x + 30, GROUND_Y, 6, 3);
    }
  }

  function duck(on) {
    if (gameState !== 'playing' || dino.jumping) return;
    dino.ducking = on;
  }

  function spawnObstacle() {
    const r = Math.random();
    if (r < 0.45) {
      const big = Math.random() < 0.5; const h = big ? 30 : 20; const w = big ? 12 : 8;
      obstacles.push({ x: W + 20, y: GROUND_Y, w, h, type: big ? 'cactus_big' : 'cactus_small' });
    } else if (r < 0.85) {
      const heights = [GROUND_Y - 40, GROUND_Y - 90, GROUND_Y - 168]; const y = heights[Math.floor(Math.random() * heights.length)];
      birds.push({ x: W + 20, y, w: 10, h: 10, type: 'bird', magnetized: false });
    } else {
      const types = [
        { type: 'shield', icon: '🛡', color: '#2196F3', duration: 300 },
        { type: 'slowmo', icon: '⏱', color: '#9C27B0', duration: 240 },
        { type: 'doubleJump', icon: '🦘', color: '#FF9800', duration: 400 }
      ];
      const pu = types[Math.floor(Math.random() * types.length)];
      powerUps.push({ x: W + 20, y: GROUND_Y - 80 + Math.random() * 40, ...pu });
    }
  }

  function spawnDust(x, y, count, spread) { for (let i = 0; i < count; i++) particles.push({ x: x + (Math.random() - 0.5) * 10, y: y, vx: -speed * 0.3 - Math.random() * 2, vy: -Math.random() * spread, life: 1, r: Math.random() * 2 + 1 }); }

  function update() {
    if (isPortraitMode) return;
    frame++;
    if (gameState === 'playing') {
      score += 0.1 * (speed / BASE_SPEED);
      let currentMaxSpeed = BASE_SPEED + MAX_SPEED_BONUS;
      if (powerUpActive && powerUpActive.type === 'slowmo') currentMaxSpeed *= 0.5;
      speed = BASE_SPEED + Math.min(MAX_SPEED_BONUS, score / 400);
      if (powerUpActive && powerUpActive.type === 'slowmo') speed *= 0.5;
      
      speedBar.style.width = Math.min(100, ((speed - BASE_SPEED) / MAX_SPEED_BONUS) * 100) + '%';

      if (score > 500 && currentTheme === 'day' && Math.random() < 0.005) { currentTheme = 'night'; isRaining = Math.random() < 0.5; if (isRaining) initRain(); }
      if (score > 500 && currentTheme === 'night' && Math.random() < 0.002) { currentTheme = 'day'; isRaining = false; }

      if (dino.jumping) {
        dino.vy += GRAVITY; dino.y += dino.vy;
        if (dino.y >= GROUND_Y) { dino.y = GROUND_Y; dino.vy = 0; dino.jumping = false; dino.jumpsLeft = 1; spawnDust(dino.x + 30, GROUND_Y, 5, 2); }
      } else if (frame % 8 === 0) { spawnDust(dino.x + 10, GROUND_Y, 1, 1); }

      spawnTimer -= 1;
      if (spawnTimer <= 0) {
        spawnObstacle();
        const minGap = 110, maxGap = 180;
        spawnTimer = minGap + Math.random() * (maxGap - minGap) - speed * 4;
        if (spawnTimer < 60) spawnTimer = 60;
      }

      obstacles.forEach(o => o.x -= speed); obstacles = obstacles.filter(o => o.x + o.w > -20);
      powerUps.forEach(p => p.x -= speed); powerUps = powerUps.filter(p => p.x > -20);
      updateRain();

      // Птицы
      birds.forEach(b => {
        let effSpeed = speed * 0.5;
        if (save.upgrades.magnet > 0) {
          const mRange = 122.5 + save.upgrades.magnet * 49;
          const tx = dino.x + 15 * dino.scale; const ty = dino.y - 12 * dino.scale;
          const dx = tx - (b.x + 20 * BIRD_SCALE_GAME); const dy = ty - b.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if (dist < mRange && b.x > dino.x - 50) {
            b.magnetized = true; const pullSpeed = 1.4 * save.upgrades.magnet;
            if (dist > pullSpeed) { b.x += (dx / dist) * pullSpeed; b.y += (dy / dist) * pullSpeed; } else { b.x += dx; b.y += dy; }
            effSpeed = 0.2;
          } else { b.magnetized = false; }
        }
        b.x -= effSpeed;
      });
      birds = birds.filter(b => b.x + b.w > -20);

      // Коллизии
      let dinoBox = dino.ducking && !dino.jumping ? { x: dino.x + 6 * dino.scale, y: dino.y - 14 * dino.scale, w: 18 * dino.scale, h: 14 * dino.scale } : { x: dino.x + 6 * dino.scale, y: dino.y - 24 * dino.scale, w: 18 * dino.scale, h: 24 * dino.scale };

      // Бонусы
      for (let i = powerUps.length - 1; i >= 0; i--) {
        const p = powerUps[i];
        if (rectCollide(dinoBox, { x: p.x - 15, y: p.y - 15, w: 30, h: 30 })) {
          powerUpActive = { type: p.type, timer: p.duration, icon: p.icon, color: p.color };
          if (p.type === 'doubleJump') dino.jumpsLeft = 2;
          playSound('record'); haptic('eat');
          powerUps.splice(i, 1);
        }
      }
      if (powerUpActive) {
        powerUpActive.timer--;
        if (powerUpActive.timer <= 0) powerUpActive = null;
      }

      // Кактусы
      if (!powerUpActive || powerUpActive.type !== 'shield') {
        for (const o of obstacles) {
          let oBox = o.type === 'cactus_small' ? { x: o.x - 0.5 * dino.scale, y: o.y - o.h * dino.scale, w: 11 * dino.scale, h: o.h * dino.scale } : { x: o.x, y: o.y - o.h * dino.scale, w: 20 * dino.scale, h: o.h * dino.scale };
          if (rectCollide(dinoBox, oBox)) { gameOver(); return; }
        }
      }

      // Птицы
      for (let i = birds.length - 1; i >= 0; i--) {
        const b = birds[i];
        const bBox = { x: b.x + 2 * BIRD_SCALE_GAME, y: b.y - 20 * BIRD_SCALE_GAME, w: 38 * BIRD_SCALE_GAME, h: 24 * BIRD_SCALE_GAME };
        if (rectCollide(dinoBox, bBox)) {
          let bonesEarned = 1 + (save.upgrades.doubleBones || 0);
          sessionBones += bonesEarned; birdsEatenThisGame++;
          haptic('eat'); playSound('eat');
          for (let j = 0; j < bonesEarned; j++) bonesFlying.push({ x: b.x + 20 * BIRD_SCALE_GAME, y: b.y, vy: -4, vx: 1, life: 1, rot: 0 });
          spawnFloatingText(b.x + 20 * BIRD_SCALE_GAME, b.y - 20, `+${bonesEarned} 🦴`);
          spawnDust(b.x + 20 * BIRD_SCALE_GAME, b.y, 8, 4); birds.splice(i, 1);
          updateHUD();
        }
      }

      if (score > save.highScore) { save.highScore = score; writeSave(); }
      clouds.forEach(c => { c.x -= c.speed; if (c.x < -80) { c.x = W + Math.random() * 200; c.y = 40 + Math.random() * 60; } });
      groundDots.forEach(d => { d.x -= speed; if (d.x < 0) { d.x = W; d.y = GROUND_Y + 6 + Math.random() * 20; } });
      
      updateHUD();
    }
    updateParticles(); updateBonesFlying();
    if (shakeTime > 0) shakeTime--;
  }

  function initRain() {
    rainDrops = [];
    for (let i = 0; i < 50; i++) {
      rainDrops.push({ x: Math.random() * W, y: Math.random() * H, vx: -3, vy: 10 + Math.random() * 5 });
    }
  }

  function updateHUD() {
    hudHigh.textContent = String(Math.floor(save.highScore)).padStart(5, '0');
    hudScore.textContent = String(Math.floor(score)).padStart(5, '0');
    hudBones.textContent = save.bones + sessionBones;
  }

  function rectCollide(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }

  function gameOver() {
    gameState = 'gameover'; shakeTime = 15; haptic('crash'); playSound('crash');
    spawnDust(dino.x + 30, dino.y - 20, 15, 5); 
    
    const earnedThisGame = sessionBones;
    save.bones += sessionBones; sessionBones = 0;
    const finalScore = Math.floor(score);
    
    const isNewRecord = finalScore > save.highScore;
    if (isNewRecord) { save.highScore = finalScore; playSound('record'); newRecordText.classList.remove('hidden'); }
    else { newRecordText.classList.add('hidden'); }

    save.games.push({ score: finalScore, date: Date.now() }); save.games.sort((a, b) => b.score - a.score); save.games = save.games.slice(0, 10);
    
    // Проверка достижений
    checkAchievements(finalScore);
    
    writeSave(); updateHUD();
    goScore.textContent = finalScore; goHigh.textContent = Math.floor(save.highScore); goBones.textContent = `+${earnedThisGame} 🦴`;
    
    gameoverScreen.classList.remove('hidden');
    fullscreenBtn.classList.add('hidden');
    speedBarContainer.classList.remove('active');
  }

  function checkAchievements(score) {
    if (!save.achievements.first_run) unlockAch('first_run');
    if (score >= 500 && !save.achievements.score_500) unlockAch('score_500');
    if (score >= 2000 && !save.achievements.score_2000) unlockAch('score_2000');
    if (birdsEatenThisGame >= 10 && !save.achievements.birds_10) unlockAch('birds_10');
    if (save.bones >= 100 && !save.achievements.bones_100) unlockAch('bones_100');
  }

  function unlockAch(id) {
    save.achievements[id] = true;
    const def = ACHIEVEMENTS_DEF.find(a => a.id === id);
    if (def) {
      achPopupIcon.textContent = def.icon; achPopupName.textContent = def.name;
      achievementPopup.classList.remove('hidden'); achievementPopup.classList.add('show');
      setTimeout(() => { achievementPopup.classList.remove('show'); setTimeout(() => achievementPopup.classList.add('hidden'), 400); }, 3000);
      playSound('record');
    }
  }

  function render() {
    let shakeX = 0, shakeY = 0;
    if (shakeTime > 0) { shakeX = (Math.random() - 0.5) * shakeTime * 0.6; shakeY = (Math.random() - 0.5) * shakeTime * 0.6; }
    ctx.save(); ctx.translate(shakeX, shakeY);
    ctx.clearRect(-20, -20, W + 40, H + 40);
    
    drawBackground();
    drawGround();
    
    particles.forEach(p => { ctx.fillStyle = `rgba(255,255,255,${p.life * 0.8})`; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill(); });
    
    if (gameState === 'playing' || gameState === 'gameover') {
      obstacles.forEach(o => drawCactus(o, dino.scale));
      birds.forEach(b => drawBird(b, BIRD_SCALE_GAME));
      powerUps.forEach(drawPowerUp);
      drawRain();
      bonesFlying.forEach(b => { ctx.globalAlpha = b.life; ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.rot); drawBoneShape(0, 0, 16); ctx.restore(); ctx.globalAlpha = 1; });
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
    const birdX = W * 0.4 + Math.sin(frame * 0.03) * 100; const birdY = H * 0.25 + Math.cos(frame * 0.02) * 40;
    drawBird({ x: birdX, y: birdY, w: 10, h: 10, type: 'bird', magnetized: false }, BIRD_SCALE_MENU);
  }

  function loop(ts) {
    const dt = ts - lastTime; lastTime = ts;
    const steps = Math.min(3, Math.max(1, Math.round(dt / 16.67)));
    for (let i = 0; i < steps; i++) update();
    render(); requestAnimationFrame(loop);
  }

  // UI функции
  function hideAllScreens() {
    menuScreen.classList.add('hidden'); recordsScreen.classList.add('hidden'); upgradesScreen.classList.add('hidden');
    achievementsScreen.classList.add('hidden'); settingsScreen.classList.add('hidden'); gameoverScreen.classList.add('hidden'); confirmDialog.classList.add('hidden');
  }
  function showMainMenu() {
    gameState = 'menu'; hideAllScreens(); hud.classList.remove('hidden'); fullscreenBtn.classList.remove('hidden');
    tapHint.classList.add('hidden'); menuScreen.classList.remove('hidden'); menuScreen.scrollTop = 0;
    speedBarContainer.classList.remove('active'); updateHUD();
  }
  function showRecords() { gameState = 'records'; hideAllScreens(); fullscreenBtn.classList.add('hidden'); recordsScreen.classList.remove('hidden'); renderRecords(); }
  function showUpgrades() { gameState = 'upgrades'; hideAllScreens(); fullscreenBtn.classList.add('hidden'); upgradesScreen.classList.remove('hidden'); renderUpgrades(); }
  function showAchievements() { gameState = 'achievements'; hideAllScreens(); fullscreenBtn.classList.add('hidden'); achievementsScreen.classList.remove('hidden'); renderAchievements(); }
  function showSettings() { gameState = 'settings'; hideAllScreens(); fullscreenBtn.classList.add('hidden'); settingsScreen.classList.remove('hidden'); }

  function renderRecords() {
    recordsList.innerHTML = '';
    if (save.games.length === 0) { recordsList.innerHTML = '<div class="empty-records">Пока нет рекордов</div>'; return; }
    save.games.forEach((g, i) => {
      const row = document.createElement('div'); row.className = 'record-row';
      if (i === 0) row.classList.add('top1'); else if (i === 1) row.classList.add('top2'); else if (i === 2) row.classList.add('top3');
      const date = new Date(g.date); const dateStr = `${date.getDate()}.${String(date.getMonth()+1).padStart(2,'0')}.${String(date.getFullYear()).slice(2)}`;
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`;
      row.innerHTML = `<span class="rank">${medal}</span><span class="score">${g.score}</span><span class="date">${dateStr}</span>`;
      recordsList.appendChild(row);
    });
  }

  let activeTab = 'upg';
  document.getElementById('tabUpg').addEventListener('click', () => { activeTab = 'upg'; document.getElementById('tabUpg').classList.add('active'); document.getElementById('tabSkins').classList.remove('active'); renderUpgrades(); });
  document.getElementById('tabSkins').addEventListener('click', () => { activeTab = 'skins'; document.getElementById('tabSkins').classList.add('active'); document.getElementById('tabUpg').classList.remove('active'); renderUpgrades(); });

  function renderUpgrades() {
    upgradesBones.textContent = save.bones;
    upgradesList.innerHTML = ''; skinsList.innerHTML = '';
    
    if (activeTab === 'upg') {
      upgradesList.classList.remove('hidden'); skinsList.classList.add('hidden');
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
          <button class="upgrade-buy ${isMax ? 'maxed' : ''}" ${isMax || !canAfford ? 'disabled' : ''}>
            ${isMax ? '✓ MAX' : `${cost} 🦴`}
          </button>
        `;
        if (!isMax) card.querySelector('.upgrade-buy').addEventListener('pointerdown', (e) => { e.stopPropagation(); buyUpgrade(upg.id); });
        upgradesList.appendChild(card);
      });
    } else {
      upgradesList.classList.add('hidden'); skinsList.classList.remove('hidden');
      SKINS.forEach(skin => {
        const isUnlocked = save.unlockedSkins.includes(skin.id);
        const isEquipped = save.currentSkin === skin.id;
        const card = document.createElement('div'); card.className = 'upgrade-card'; if (isEquipped) card.classList.add('equipped');
        card.innerHTML = `
          <div class="upgrade-icon" style="color:${skin.body}">🦖</div>
          <div class="upgrade-info">
            <div class="upgrade-name">${skin.name}</div>
            <div class="upgrade-desc">${isEquipped ? 'Экипирован' : isUnlocked ? 'Разблокирован' : 'Не куплен'}</div>
          </div>
          <button class="upgrade-buy ${isEquipped ? 'maxed' : ''}" ${isEquipped || (!isUnlocked && save.bones < skin.cost) ? 'disabled' : ''}>
            ${isEquipped ? '✓ НАДЕТ' : isUnlocked ? 'НАДЕТЬ' : `${skin.cost} 🦴`}
          </button>
        `;
        if (!isEquipped) {
          card.querySelector('.upgrade-buy').addEventListener('pointerdown', (e) => {
            e.stopPropagation();
            if (isUnlocked) { save.currentSkin = skin.id; writeSave(); renderUpgrades(); haptic('click'); }
            else if (save.bones >= skin.cost) { save.bones -= skin.cost; save.unlockedSkins.push(skin.id); save.currentSkin = skin.id; writeSave(); renderUpgrades(); haptic('buy'); playSound('eat'); }
          });
        }
        skinsList.appendChild(card);
      });
    }
  }

  function buyUpgrade(id) {
    const upg = UPGRADES.find(u => u.id === id); if (!upg) return;
    const level = save.upgrades[id] || 0; if (level >= upg.maxLevel) return;
    const cost = upg.costs[level]; if (save.bones < cost) return;
    save.bones -= cost; save.upgrades[id] = level + 1; writeSave(); renderUpgrades(); haptic('buy'); playSound('click');
  }

  function renderAchievements() {
    achievementsList.innerHTML = '';
    ACHIEVEMENTS_DEF.forEach(ach => {
      const unlocked = !!save.achievements[ach.id];
      const row = document.createElement('div'); row.className = 'upgrade-card'; if (unlocked) row.classList.add('equipped');
      row.style.opacity = unlocked ? '1' : '0.5';
      row.innerHTML = `
        <div class="upgrade-icon">${ach.icon}</div>
        <div class="upgrade-info">
          <div class="upgrade-name">${ach.name}</div>
          <div class="upgrade-desc">${ach.desc}</div>
        </div>
        <div style="font-size:24px;">${unlocked ? '✅' : '🔒'}</div>
      `;
      achievementsList.appendChild(row);
    });
  }

  // Управление
  document.addEventListener('pointerdown', (e) => {
    const btn = e.target.closest('[data-action]');
    if (btn) {
      e.preventDefault(); e.stopPropagation(); initAudio(); playSound('click');
      const action = btn.dataset.action;
      if (action === 'fullscreen') toggleFullscreen();
      else if (action === 'start') reset();
      else if (action === 'records') showRecords();
      else if (action === 'upgrades') showUpgrades();
      else if (action === 'achievements') showAchievements();
      else if (action === 'settings') showSettings();
      else if (action === 'back') showMainMenu();
      else if (action === 'reset') confirmDialog.classList.remove('hidden');
      else if (action === 'reset-no') confirmDialog.classList.add('hidden');
      else if (action === 'reset-yes') {
        save = defaultSave(); writeSave(); updateHUD(); renderUpgrades(); renderRecords(); confirmDialog.classList.add('hidden'); showMainMenu();
      } else if (action === 'toggle-sound') {
        soundEnabled = !soundEnabled;
        btn.textContent = soundEnabled ? '🔊 ЗВУК: ВКЛ' : '🔇 ЗВУК: ВЫКЛ';
      }
      return;
    }
    
    // Прыжок / присед по тапу на экран
    if (gameState === 'playing' && !isPortraitMode) {
      jump();
    }
  });

  // Клавиатура
  document.addEventListener('keydown', (e) => {
    if (gameState !== 'playing' || isPortraitMode) return;
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') { e.preventDefault(); jump(); }
    if (e.code === 'ArrowDown' || e.code === 'KeyS') { e.preventDefault(); duck(true); }
  });
  document.addEventListener('keyup', (e) => { if (e.code === 'ArrowDown' || e.code === 'KeyS') duck(false); });

  // Свайпы для мобильных
  let touchStartY = null; let touchMoved = false;
  document.addEventListener('touchstart', (e) => {
    if (e.target.closest('button') || gameState !== 'playing' || isPortraitMode) return;
    touchStartY = e.changedTouches[0].clientY; touchMoved = false;
  }, { passive: true });
  document.addEventListener('touchmove', (e) => {
    if (touchStartY === null || e.target.closest('button')) return;
    const dy = e.changedTouches[0].clientY - touchStartY;
    if (dy > 30 && gameState === 'playing' && !dino.jumping) { duck(true); touchMoved = true; }
  }, { passive: true });
  document.addEventListener('touchend', (e) => {
    if (touchStartY === null) return;
    const dy = e.changedTouches[0].clientY - touchStartY;
    if (dy > 30) { duck(false); }
    touchStartY = null;
  }, { passive: true });

  // Запуск
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  window.addEventListener('orientationchange', () => setTimeout(resizeCanvas, 100));
  if (isTelegram && tg.onEvent) tg.onEvent('viewportChanged', () => setTimeout(resizeCanvas, 100));
  
  updateHUD(); showMainMenu(); requestAnimationFrame(loop);
})();
