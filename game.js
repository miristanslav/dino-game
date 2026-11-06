// ===== ИНИЦИАЛИЗАЦИЯ TELEGRAM =====
let isTelegram = false;
let tgApp = null;
try {
  tgApp = window.Telegram?.WebApp;
  isTelegram = tgApp && tgApp.platform && tgApp.platform !== 'unknown';
  if (isTelegram) {
    tgApp.ready();
    tgApp.expand();
    if (tgApp.disableVerticalSwipes) tgApp.disableVerticalSwipes();
    if (tgApp.setHeaderColor) tgApp.setHeaderColor('#E3F2FD');
    if (tgApp.setBackgroundColor) tgApp.setBackgroundColor('#E3F2FD');
    document.body.classList.add('telegram-mode');
  }
} catch (e) {}

function removeSplash() {
  const splash = document.getElementById('splashScreen');
  if (splash) {
    splash.classList.add('fade-out');
    setTimeout(() => { if (splash.parentNode) splash.parentNode.removeChild(splash); }, 500);
  }
}
window.addEventListener('load', () => setTimeout(removeSplash, 1000));
setTimeout(removeSplash, 2000);

function haptic(type) {
  if (isTelegram && tgApp?.HapticFeedback) {
    try {
      const hf = tgApp.HapticFeedback;
      if (type === 'jump') hf.impactOccurred('light');
      if (type === 'eat') hf.notificationOccurred('success');
      if (type === 'crash') hf.notificationOccurred('error');
      if (type === 'buy') hf.impactOccurred('medium');
    } catch (e) {}
  }
}

// ===== ЗВУКИ =====
let audioCtx = null;
let soundEnabled = true;
let musicEnabled = true;
let musicInterval = null;
let musicIndex = 0;
// === ПАТЧ 17: новая мелодия + бас ===
const MUSIC_MELODY = [
  523.25, 587.33, 659.25, 587.33,
  523.25, 659.25, 783.99, 659.25,
  698.46, 659.25, 587.33, 523.25,
  587.33, 523.25, 392.00, 0
];
const MUSIC_BASS = [
  130.81, 0, 146.83, 0,
  164.81, 0, 130.81, 0,
  174.61, 0, 146.83, 0,
  130.81, 0, 196.00, 0
];
const MUSIC_VOLUME = 0.14;

function initAudio() {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
  } catch (e) {}
}

// === ПАТЧ 17: усиленная мелодия с басом ===
function startMusic() {
  if (!musicEnabled || musicInterval) return;
  let step = 0;
  musicInterval = setInterval(() => {
    if (!musicEnabled || gameState !== 'playing' || !audioCtx) return;
    try {
      const now = audioCtx.currentTime;
      const melodyFreq = MUSIC_MELODY[step % MUSIC_MELODY.length];
      const bassFreq = MUSIC_BASS[step % MUSIC_BASS.length];

      if (melodyFreq > 0) {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(melodyFreq, now);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(MUSIC_VOLUME, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
        osc.start(now); osc.stop(now + 0.35);
      }

      if (bassFreq > 0) {
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.connect(gain2); gain2.connect(audioCtx.destination);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(bassFreq, now);
        gain2.gain.setValueAtTime(0, now);
        gain2.gain.linearRampToValueAtTime(MUSIC_VOLUME * 0.7, now + 0.05);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
        osc2.start(now); osc2.stop(now + 0.4);
      }

      step++;
    } catch (e) {}
  }, 380);
}

function stopMusic() {
  if (musicInterval) { clearInterval(musicInterval); musicInterval = null; }
}

function playSound(type) {
  if (!soundEnabled || !audioCtx) return;
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
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
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, i) => {
        const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
        o.connect(g); g.connect(audioCtx.destination);
        o.type = 'sine'; o.frequency.setValueAtTime(freq, now + i * 0.1);
        g.gain.setValueAtTime(0.15, now + i * 0.1); g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.2);
        o.start(now + i * 0.1); o.stop(now + i * 0.1 + 0.2);
      });
    }
  } catch (e) {}
}

function playThunder() {
  if (!soundEnabled || !audioCtx) return;
  try {
    const bufferSize = audioCtx.sampleRate * 2;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
    }
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 250;
    filter.Q.value = 1;
    const gain = audioCtx.createGain();
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);
    noise.start(now);
    noise.stop(now + 2);
  } catch (e) {}
}

// ===== УТИЛИТЫ =====
function lerpColor(a, b, t) {
  const ah = parseInt(a.slice(1), 16);
  const bh = parseInt(b.slice(1), 16);
  const ar = (ah >> 16) & 0xFF, ag = (ah >> 8) & 0xFF, ab = ah & 0xFF;
  const br = (bh >> 16) & 0xFF, bg = (bh >> 8) & 0xFF, bb = bh & 0xFF;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `rgb(${r},${g},${bl})`;
}

// ===== ВЕРСИЯ И CHANGELOG =====
const CURRENT_VERSION = 17;
function formatVersion(v) {
  const thousands = Math.floor(v / 1000);
  const hundreds = Math.floor((v % 1000) / 100);
  const tens = v % 100;
  return `${thousands}.${hundreds}.${tens}`;
}

const CHANGELOG = [
  {
    version: 17,
    changes: [
      'Патч 17: музыка теперь слышна!',
      'Громкость мелодии увеличена в ~3.5 раза (0.04 → 0.14)',
      'Волна sine заменена на triangle — звук ярче и заметнее',
      'Добавлена басовая партия — мелодия стала полнее',
      'Новая мелодия из 16 нот (вместо 8)',
      'Плавная атака нот — нет щелчков в начале звука'
    ]
  },
  {
    version: 16,
    changes: [
      'Патч 16: стабильность и настройки',
      'Исправлен невидимый символ в кнопке «Сбросить прогресс» (HTML)',
      'Кнопка «Музыка» теперь работает: включает/выключает фоновую мелодию',
      'Синхронизирована версия JS с HTML (0.0.16)',
      'Оптимизация: рекорд сохраняется раз в ~5 сек вместо каждого кадра — меньше лагов на телефоне',
      'Исправлена очистка canvas при тряске экрана (устранён «шлейф» по краям)'
    ]
  },
  {
    version: 15,
    changes: [
      'Комбо-система: съел 3 птицы подряд → x2 кости',
      'Съел 6 птиц подряд → x3 кости (таймер 5 сек)',
      'Near-miss: пролетел впритык от кактуса → +5 очков',
      'Near-miss: пролетел впритык от птицы → +1 кость',
      'Пропустил птицу — комбо сбрасывается',
      'Индикатор комбо с таймером сверху экрана'
    ]
  },
  {
    version: 14,
    changes: [
      'Исправлено отображение версии (только в главном меню)',
      'Клик по версии открывает список обновлений',
      'Луна стала мягче — без яркого свечения',
      'Молния в виде зигзага на горизонте',
      'Добавлен звук удара грома (тихий)'
    ]
  },
  {
    version: 13,
    changes: [
      'Плавная смена дня и ночи с восходом и закатом',
      'Красивые цвета неба: рассвет, полдень, закат, сумерки',
      'Солнце и луна движутся по небу и уходят за горизонт',
      'Улучшена видимость ночью (яркие цвета объектов)',
      'Добавлено отображение версии игры'
    ]
  },
  {
    version: 12,
    changes: [
      'Переработана система времени суток (плавная)',
      'Добавлены солнце и луна с движением по дуге',
      'Улучшены цвета ночи для читаемости препятствий',
      'Таймеры погоды переведены в секунды'
    ]
  },
  {
    version: 11,
    changes: [
      'Новый дизайн птеродактиля (длинный клюв, гребень)',
      'Уменьшены размеры больших кактусов',
      'Добавлены вспышки молний во время дождя',
      'Скорректированы хитбоксы под новые размеры'
    ]
  },
  {
    version: 10,
    changes: [
      'Исправлен баг двойного прыжка',
      'Таймеры бонусов переведены в секунды',
      'Оптимизировано обновление таймера бонусов'
    ]
  },
  {
    version: 9,
    changes: [
      'HUD перемещён в центр экрана',
      'Уменьшены иконки костей в HUD',
      'Исправлено исчезновение HUD в меню'
    ]
  },
  {
    version: 8,
    changes: [
      'Добавлен полноэкранный режим в Telegram',
      'Исправлено растягивание на весь экран',
      'Улучшена адаптация под горизонтальный режим'
    ]
  },
  {
    version: 7,
    changes: [
      'Полноцветный мир (зелёные кактусы, коричневая земля)',
      'Детализированный T-Rex с хвостом и челюстью',
      'Добавлены скины (Огненный, Ледяной, Золотой)',
      'Добавлены достижения и бонусы (Щит, Двойной прыжок)',
      'Добавлены звуки (Web Audio API) и погода'
    ]
  }
];

// ===== ИГРА =====
(() => {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  let fullscreenRequested = false;
  function requestTgFullscreen() {
    if (!isTelegram || fullscreenRequested) return;
    try {
      if (tgApp && tgApp.requestFullscreen) {
        tgApp.requestFullscreen();
        fullscreenRequested = true;
        setTimeout(resizeCanvas, 300);
      }
    } catch (e) {}
  }
  if (isTelegram) {
    setTimeout(requestTgFullscreen, 50);
    document.addEventListener('pointerdown', function firstTap() {
      requestTgFullscreen();
      document.removeEventListener('pointerdown', firstTap);
    });
  }

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
  const powerUpHud = document.getElementById('powerUpHud');
  const versionBtn = document.getElementById('versionBtn');
  const versionNumber = document.getElementById('versionNumber');
  const changelogDialog = document.getElementById('changelogDialog');
  const changelogContent = document.getElementById('changelogContent');
  
  const comboHud = document.getElementById('comboHud');
  const comboMult = document.getElementById('comboMult');
  const comboTimerFill = document.getElementById('comboTimerFill');

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
  const btnMusic = document.getElementById('btnMusic');
  const achievementPopup = document.getElementById('achievementPopup');
  const achPopupIcon = document.getElementById('achPopupIcon');
  const achPopupName = document.getElementById('achPopupName');

  versionNumber.textContent = formatVersion(CURRENT_VERSION);

  function showChangelog() {
    changelogContent.innerHTML = '';
    CHANGELOG.forEach((entry, i) => {
      const div = document.createElement('div');
      div.className = 'changelog-entry' + (i === 0 ? ' current' : '');
      let html = `<h3>Версия ${formatVersion(entry.version)}</h3><ul>`;
      entry.changes.forEach(change => { html += `<li>${change}</li>`; });
      html += '</ul>';
      div.innerHTML = html;
      changelogContent.appendChild(div);
    });
    changelogDialog.style.display = 'flex';
  }
  
  versionBtn.addEventListener('click', (e) => {
    e.preventDefault(); e.stopPropagation();
    initAudio(); playSound('click');
    showChangelog();
  });

  function isFullscreen() { return !!(document.fullscreenElement || document.webkitFullscreenElement); }
  function updateFullscreenIcon() {
    if (isFullscreen()) { fsIconExpand.style.display = 'none'; fsIconCollapse.style.display = 'block'; }
    else { fsIconExpand.style.display = 'block'; fsIconCollapse.style.display = 'none'; }
  }
  function toggleFullscreen() {
    try {
      if (isFullscreen()) { if (document.exitFullscreen) document.exitFullscreen(); }
      else { if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen(); }
    } catch (e) {}
  }
  ['fullscreenchange', 'webkitfullscreenchange'].forEach(evt => {
    document.addEventListener(evt, () => { updateFullscreenIcon(); setTimeout(resizeCanvas, 100); });
  });

  let isPortraitMode = window.matchMedia("(orientation: portrait)").matches;
  const portraitQuery = window.matchMedia("(orientation: portrait)");
  const updateOrientation = () => { isPortraitMode = portraitQuery.matches; };
  if (portraitQuery.addEventListener) portraitQuery.addEventListener("change", updateOrientation);
  window.addEventListener('orientationchange', () => { setTimeout(updateOrientation, 100); setTimeout(resizeCanvas, 200); });

  let W = window.innerWidth, H = window.innerHeight, GROUND_Y = H * 0.8;
  function resizeCanvas() {
    const oldGroundY = GROUND_Y;
    const vv = window.visualViewport;
    W = vv ? vv.width : window.innerWidth;
    H = vv ? vv.height : window.innerHeight;
    canvas.width = W; canvas.height = H;
    GROUND_Y = H * 0.8;
    if (!dino.jumping) dino.y = GROUND_Y;
    if (typeof groundDots !== 'undefined') groundDots.forEach(d => { d.y = GROUND_Y + 6 + Math.random() * 20; });
    if (typeof obstacles !== 'undefined') obstacles.forEach(o => { o.y = GROUND_Y; });
    if (typeof birds !== 'undefined') { const dY = GROUND_Y - oldGroundY; birds.forEach(b => { b.y += dY; }); }
    if (typeof powerUps !== 'undefined') { const dY = GROUND_Y - oldGroundY; powerUps.forEach(p => { p.y += dY; }); }
    if (typeof lightning !== 'undefined' && lightning) lightning = null;
  }

  const GRAVITY = 0.75;
  const JUMP_FORCE = -12.6;
  const DINO_SCALE_GAME = 1.8;
  const DINO_SCALE_MENU = 3.0;
  const BIRD_SCALE_GAME = 0.9;
  const BIRD_SCALE_MENU = 1.2;
  const BASE_SPEED = 3.5;
  const MAX_SPEED_BONUS = 4.5;

  const DAY_NIGHT_CYCLE = 75;
  const CLEAR_DURATION = 20;
  const RAIN_DURATION = 15;

  const SKINS = [
    { id: 'default', name: 'Зелёный', cost: 0, body: '#4CAF50', outline: '#1B5E20', belly: '#A5D6A7', claw: '#FFF', eye: '#FFF' },
    { id: 'fire', name: 'Огненный', cost: 50, body: '#F44336', outline: '#B71C1C', belly: '#FFCDD2', claw: '#FFE082', eye: '#FFF' },
    { id: 'ice', name: 'Ледяной', cost: 100, body: '#2196F3', outline: '#0D47A1', belly: '#BBDEFB', claw: '#E1F5FE', eye: '#FFF' },
    { id: 'gold', name: 'Золотой', cost: 200, body: '#FFC107', outline: '#FF6F00', belly: '#FFECB3', claw: '#FFF', eye: '#FFF' }
  ];

  const UPGRADES = [
    { id: 'jump', icon: '🦘', name: 'Прыжок', desc: 'Сила прыжка', maxLevel: 5, costs: [10, 30, 60, 100, 150] },
    { id: 'magnet', icon: '🧲', name: 'Магнит', desc: 'Притяжение птиц', maxLevel: 2, costs: [15, 40] },
    { id: 'doubleBones', icon: '✨', name: 'Двойные кости', desc: '+1 кость за птицу', maxLevel: 2, costs: [25, 75] }
  ];

  const ACHIEVEMENTS_DEF = [
    { id: 'first_run', icon: '👟', name: 'Первый шаг', desc: 'Сыграть первую игру' },
    { id: 'score_500', icon: '⭐', name: 'Новичок', desc: 'Набрать 500 очков' },
    { id: 'score_2000', icon: '🌟', name: 'Профи', desc: 'Набрать 2000 очков' },
    { id: 'birds_10', icon: '🦅', name: 'Охотник', desc: 'Съесть 10 птиц за игру' },
    { id: 'bones_100', icon: '💰', name: 'Богач', desc: 'Накопить 100 костей' }
  ];

  const SAVE_KEY = 'trex_color_save_v1';
  function defaultSave() { return { highScore: 0, bones: 0, games: [], upgrades: { jump: 0, magnet: 0, doubleBones: 0 }, achievements: {}, currentSkin: 'default', unlockedSkins: ['default'] }; }
  let save = (() => { try { const raw = localStorage.getItem(SAVE_KEY); return raw ? { ...defaultSave(), ...JSON.parse(raw) } : defaultSave(); } catch { return defaultSave(); } })();
  function writeSave() { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); }

  let gameState = 'menu';
  let score = 0, speed = BASE_SPEED, frame = 0, lastTime = 0, spawnTimer = 0, shakeTime = 0, sessionBones = 0;
  
  let dayNightTime = 0.5 * DAY_NIGHT_CYCLE;
  let weatherTime = 0;
  let isRaining = false;
  let lightning = null;
  let lightningAmbient = 0;
  
  let powerUpActive = null;
  let lastPowerUpSecond = -1;
  let birdsEatenThisGame = 0;

  let comboCount = 0;
  let comboTimer = 0;
  const COMBO_TIMEOUT = 5;

  const dino = { x: 60, y: GROUND_Y, scale: DINO_SCALE_GAME, vy: 0, jumping: false, ducking: false, jumpsLeft: 1 };
  let obstacles = [], birds = [], particles = [], bonesFlying = [], powerUps = [], rainDrops = [];
  
  let stars = [];
  for (let i = 0; i < 80; i++) {
    stars.push({ 
      x: Math.random(), 
      y: Math.random() * 0.65, 
      size: Math.random() * 1.5 + 0.5, 
      phase: Math.random() * Math.PI * 2,
      brightness: Math.random() * 0.5 + 0.5
    });
  }

  function getComboMultiplier() {
    if (comboCount >= 6) return 3;
    if (comboCount >= 3) return 2;
    return 1;
  }

  function updateComboHUD(pulse = false) {
    const mult = getComboMultiplier();
    if (mult > 1) {
      comboMult.textContent = `🔥 x${mult}`;
      comboHud.classList.remove('hidden');
      if (pulse) {
        comboHud.classList.remove('pulse');
        void comboHud.offsetWidth;
        comboHud.classList.add('pulse');
      }
    } else {
      comboHud.classList.add('hidden');
    }
  }

  function resetCombo() {
    if (comboCount > 0) {
      comboCount = 0;
      comboTimer = 0;
      updateComboHUD();
    }
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
    return o.type === 'cactus_small'
      ? { x: o.x - 0.5 * dino.scale, y: o.y - o.h * dino.scale, w: 11 * dino.scale, h: o.h * dino.scale }
      : { x: o.x, y: o.y - o.h * dino.scale, w: 16 * dino.scale, h: o.h * dino.scale };
  }
  function getBirdBox(b) {
    return { x: b.x + 2 * BIRD_SCALE_GAME, y: b.y - 18 * BIRD_SCALE_GAME, w: 42 * BIRD_SCALE_GAME, h: 22 * BIRD_SCALE_GAME };
  }

  const TIME_KEYS = [
    { t: 0.00, top: '#0A0E1A', bot: '#1A1F35' },
    { t: 0.10, top: '#0F1432', bot: '#252A4A' },
    { t: 0.16, top: '#2E1A47', bot: '#6B3B7C' },
    { t: 0.22, top: '#E8A598', bot: '#FFD89B' },
    { t: 0.28, top: '#FFB88C', bot: '#FFE8B0' },
    { t: 0.38, top: '#87CEEB', bot: '#E3F2FD' },
    { t: 0.50, top: '#4AA3DF', bot: '#B3E5FC' },
    { t: 0.65, top: '#FFC947', bot: '#FFE082' },
    { t: 0.72, top: '#FF8A65', bot: '#FFAB91' },
    { t: 0.78, top: '#FF6B6B', bot: '#FFA451' },
    { t: 0.84, top: '#8B2E5F', bot: '#E85D75' },
    { t: 0.92, top: '#3D1E5C', bot: '#6B3B8C' },
    { t: 0.97, top: '#0A0E1A', bot: '#1A1F35' },
    { t: 1.00, top: '#0A0E1A', bot: '#1A1F35' },
  ];

  function getSkyColors(t) {
    for (let i = 0; i < TIME_KEYS.length - 1; i++) {
      if (t >= TIME_KEYS[i].t && t <= TIME_KEYS[i+1].t) {
        const lt = (t - TIME_KEYS[i].t) / (TIME_KEYS[i+1].t - TIME_KEYS[i].t);
        return {
          top: lerpColor(TIME_KEYS[i].top, TIME_KEYS[i+1].top, lt),
          bot: lerpColor(TIME_KEYS[i].bot, TIME_KEYS[i+1].bot, lt),
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

  function getObjectColors(t) {
    const nightness = 1 - getLightLevel(t);
    return {
      cactus: lerpColor('#388E3C', '#4CAF50', nightness * 0.4),
      cactusLight: lerpColor('#4CAF50', '#66BB6A', nightness * 0.4),
      ground: lerpColor('#8BC34A', '#558B2F', nightness * 0.8),
      groundLine: lerpColor('#33691E', '#1B5E20', nightness * 0.5),
      dirt: lerpColor('#795548', '#5D4037', nightness * 0.5),
      bird: lerpColor('#37474F', '#CFD8DC', nightness),
      cloud: lerpColor('#FFFFFF', '#90A4AE', nightness),
      mountainFar: lerpColor('#90CAF9', '#3949AB', nightness),
      mountainNear: lerpColor('#A5D6A7', '#1B5E20', nightness),
    };
  }

  function getDinoColors() { return SKINS.find(s => s.id === save.currentSkin) || SKINS[0]; }

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
    uRect(30, 3, 4, 2.5, c.body, scale); uRect(30, 3, 4, 0.8, c.outline, scale);
    uRect(33, 4, 0.8, 0.8, '#000', scale);
    uRect(30, 6.5, 4, 1.5, c.body, scale); uRect(30, 5.5, 4, 1, '#D32F2F', scale);
    for (let i = 0; i < 3; i++) uRect(30.5 + i, 5.8, 0.6, 0.7, '#FFF', scale);
    for (let i = 0; i < 3; i++) uRect(30.8 + i, 5.2, 0.5, 0.6, '#FFF', scale);
    uRect(30, 7.5, 4, 0.5, c.outline, scale);
    if (dead) { uRect(27, 2.5, 1, 1, c.outline, scale); uRect(27.2, 2.7, 0.6, 0.6, c.eye, scale); }
    else { uRect(27, 2.5, 1.5, 1.5, c.eye, scale); uRect(27.8, 2.8, 0.7, 0.9, '#000', scale); uRect(27.2, 2.6, 0.4, 0.4, '#FFF', scale); }
    uRect(26.8, 2.1, 2.2, 0.5, c.outline, scale);
    uRect(26, 11, 2.5, 1.2, c.outline, scale); uRect(27.5, 11.5, 2, 0.9, c.outline, scale);
    uRect(28.8, 12, 1.8, 0.9, c.outline, scale); uRect(30, 12.3, 1.2, 0.8, c.outline, scale);
    uRect(31, 12, 0.6, 0.5, c.claw, scale); uRect(31, 12.7, 0.6, 0.5, c.claw, scale);
    uRect(26, 12, 2.5, 0.4, c.outline, scale);
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
    if (powerUpActive && powerUpActive.type === 'shield') {
      ctx.strokeStyle = 'rgba(33,150,243,0.8)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(dino.x + 30, dino.y - 30, 45, 0, Math.PI * 2); ctx.stroke();
    }
  }

  function drawCactus(o, colors, scale = dino.scale) {
    const x = o.x, y = o.y, h = o.h, w = o.w, s = scale;
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath(); ctx.ellipse(x + w * s / 2, y + 3, w * s * 0.4, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = colors.cactus;
    if (o.type === 'cactus_small') {
      const stemW = 4; const stemX = x + (w / 2 - stemW / 2) * s;
      ctx.fillRect(stemX, y - h * s, stemW * s, h * s);
      const b1Y = y - h * s + h * 0.4 * s;
      ctx.fillRect(stemX - 4 * s, b1Y, 4 * s, 3 * s); ctx.fillRect(stemX - 4 * s, b1Y - 6 * s, 3 * s, 8 * s);
      const b2Y = y - h * s + h * 0.55 * s;
      ctx.fillRect(stemX + stemW * s, b2Y, 4 * s, 3 * s); ctx.fillRect(stemX + stemW * s + 1 * s, b2Y - 5 * s, 3 * s, 7 * s);
      ctx.fillStyle = colors.cactusLight;
      ctx.fillRect(stemX + 1 * s, y - h * s + 2 * s, 1 * s, h * s - 4 * s);
    } else {
      const stemW = 6; const stemX = x + (w / 2 - stemW / 2) * s;
      ctx.fillRect(stemX, y - h * s, stemW * s, h * s);
      const b1Y = y - h * s + h * 0.3 * s;
      ctx.fillRect(stemX - 6 * s, b1Y, 6 * s, 4 * s); ctx.fillRect(stemX - 6 * s, b1Y - 8 * s, 4 * s, 10 * s);
      const b2Y = y - h * s + h * 0.45 * s;
      ctx.fillRect(stemX + stemW * s, b2Y, 6 * s, 4 * s); ctx.fillRect(stemX + stemW * s + 2 * s, b2Y - 8 * s, 4 * s, 10 * s);
      ctx.fillStyle = colors.cactusLight;
      ctx.fillRect(stemX + 1.5 * s, y - h * s + 2 * s, 1.5 * s, h * s - 4 * s);
    }
  }

  function drawBird(b, colors, scale = BIRD_SCALE_GAME) {
    const x = b.x, y = b.y; 
    const wingUp = Math.floor(frame / 8) % 2 === 0;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; 
    ctx.beginPath(); 
    ctx.ellipse(x + 20 * scale, GROUND_Y + 3, 20 * scale, 3, 0, 0, Math.PI * 2); 
    ctx.fill();
    if (b.magnetized) { 
      ctx.fillStyle = 'rgba(100,180,255,0.35)'; 
      ctx.beginPath(); 
      ctx.arc(x + 20 * scale, y, 40 * scale, 0, Math.PI * 2); 
      ctx.fill(); 
    }
    ctx.fillStyle = colors.bird;
    ctx.fillRect(x + 12 * scale, y - 2 * scale, 16 * scale, 4 * scale);
    ctx.fillRect(x + 6 * scale, y, 6 * scale, 2 * scale);
    ctx.fillRect(x + 4 * scale, y + 2 * scale, 2 * scale, 2 * scale);
    ctx.fillRect(x + 28 * scale, y - 5 * scale, 6 * scale, 5 * scale);
    ctx.fillRect(x + 34 * scale, y - 4 * scale, 2 * scale, 4 * scale); 
    ctx.fillRect(x + 36 * scale, y - 3 * scale, 8 * scale, 2 * scale);
    ctx.fillRect(x + 36 * scale, y - 1 * scale, 5 * scale, 1 * scale);
    ctx.fillRect(x + 26 * scale, y - 10 * scale, 3 * scale, 5 * scale);
    ctx.fillRect(x + 23 * scale, y - 8 * scale, 3 * scale, 3 * scale);
    ctx.fillStyle = '#FFF'; ctx.fillRect(x + 30 * scale, y - 3 * scale, 2 * scale, 2 * scale);
    ctx.fillStyle = '#000'; ctx.fillRect(x + 31 * scale, y - 3 * scale, 1 * scale, 1 * scale);
    ctx.fillStyle = colors.bird;
    if (wingUp) {
      ctx.beginPath();
      ctx.moveTo(x + 14 * scale, y - 2 * scale);
      ctx.lineTo(x + 4 * scale, y - 22 * scale);
      ctx.lineTo(x + 10 * scale, y - 20 * scale);
      ctx.lineTo(x + 20 * scale, y - 12 * scale);
      ctx.lineTo(x + 28 * scale, y - 2 * scale);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.beginPath();
      ctx.moveTo(x + 10 * scale, y - 8 * scale);
      ctx.lineTo(x + 14 * scale, y - 18 * scale);
      ctx.lineTo(x + 22 * scale, y - 8 * scale);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.moveTo(x + 14 * scale, y + 2 * scale);
      ctx.lineTo(x + 4 * scale, y + 22 * scale);
      ctx.lineTo(x + 10 * scale, y + 20 * scale);
      ctx.lineTo(x + 20 * scale, y + 12 * scale);
      ctx.lineTo(x + 28 * scale, y + 2 * scale);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.beginPath();
      ctx.moveTo(x + 10 * scale, y + 8 * scale);
      ctx.lineTo(x + 14 * scale, y + 18 * scale);
      ctx.lineTo(x + 22 * scale, y + 8 * scale);
      ctx.fill();
    }
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
    
    const bodyR = Math.round(240 + (255-240) * warmth);
    const bodyG = Math.round(244 + (242-244) * warmth);
    const bodyB = Math.round(255 + (214-255) * warmth);
    
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
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
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

  function drawBackground(timeOfDay, showCelestial = true) {
    const colors = getObjectColors(timeOfDay);
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
      drawSun(getSunPos(timeOfDay), timeOfDay);
      drawMoon(getMoonPos(timeOfDay), timeOfDay);
      ctx.restore();
    }

    clouds.forEach(c => {
      const s = c.s; 
      ctx.fillStyle = colors.cloud; ctx.globalAlpha = 0.8;
      ctx.beginPath(); ctx.ellipse(c.x + 20 * s, c.y + 5 * s, 25 * s, 12 * s, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(c.x + 10 * s, c.y, 15 * s, 10 * s, 0, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    });

    ctx.fillStyle = colors.mountainFar; 
    ctx.beginPath(); ctx.moveTo(0, GROUND_Y); 
    const offset = (frame * 0.1) % 400;
    for (let i = -1; i < 4; i++) { 
      const bx = i * 300 - offset; 
      ctx.lineTo(bx + 80, GROUND_Y - 90); ctx.lineTo(bx + 160, GROUND_Y - 30);
      ctx.lineTo(bx + 220, GROUND_Y - 110); ctx.lineTo(bx + 300, GROUND_Y); 
    }
    ctx.lineTo(W, GROUND_Y); ctx.lineTo(W, GROUND_Y + 2); ctx.lineTo(0, GROUND_Y + 2); ctx.closePath(); ctx.fill();

    ctx.fillStyle = colors.mountainNear; 
    ctx.beginPath(); ctx.moveTo(0, GROUND_Y);
    const offset2 = (frame * 0.25) % 500;
    for (let i = -1; i < 3; i++) { 
      const bx = i * 400 - offset2; 
      ctx.lineTo(bx + 100, GROUND_Y - 50); ctx.lineTo(bx + 200, GROUND_Y - 15); 
      ctx.lineTo(bx + 300, GROUND_Y - 60); ctx.lineTo(bx + 400, GROUND_Y); 
    }
    ctx.lineTo(W, GROUND_Y); ctx.closePath(); ctx.fill();
  }

  function drawGround(timeOfDay) {
    const colors = getObjectColors(timeOfDay);
    ctx.fillStyle = colors.ground; ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);
    ctx.strokeStyle = colors.groundLine; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, GROUND_Y); ctx.lineTo(W, GROUND_Y); ctx.stroke();
    ctx.fillStyle = colors.dirt;
    groundDots.forEach(d => { ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2); ctx.fill(); });
    ctx.strokeStyle = colors.groundLine; ctx.lineWidth = 1.5;
    for (let i = 0; i < 30; i++) { 
      const gx = (i * 50 - (frame * speed) % 50); 
      ctx.beginPath(); ctx.moveTo(gx, GROUND_Y + 4); ctx.lineTo(gx + 2, GROUND_Y - 6); ctx.stroke(); 
    }
  }

  function updateParticles() { particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += 0.15; p.life -= 0.04; }); particles = particles.filter(p => p.life > 0); }
  function updateBonesFlying() { bonesFlying.forEach(b => { b.x += b.vx; b.y += b.vy; b.vy += 0.3; b.rot += 0.2; b.life -= 0.02; }); bonesFlying = bonesFlying.filter(b => b.life > 0); }
  
  function initRain() {
    rainDrops = [];
    for (let i = 0; i < 70; i++) {
      rainDrops.push({ x: Math.random() * W, y: Math.random() * H, vx: -speed * 0.5 - 2, vy: 15 + Math.random() * 10 });
    }
  }

  function updateRain(dt) {
    if (!isRaining) return;
    rainDrops.forEach(r => { 
      r.x += r.vx; r.y += r.vy; 
      if (r.y > H || r.x < 0) { r.y = -20; r.x = Math.random() * W + W * 0.2; } 
    });
    if (!lightning && Math.random() < 0.008) triggerLightning();
  }
  
  function drawRain() {
    if (!isRaining) return;
    ctx.strokeStyle = 'rgba(150, 200, 255, 0.5)'; 
    ctx.lineWidth = 2; ctx.lineCap = 'round';
    rainDrops.forEach(r => { 
      ctx.beginPath(); ctx.moveTo(r.x, r.y); ctx.lineTo(r.x - r.vx * 0.5, r.y - r.vy * 0.5); ctx.stroke(); 
    });
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

  function reset() {
    requestTgFullscreen();
    obstacles = []; birds = []; particles = []; bonesFlying = []; powerUps = []; rainDrops = [];
    lightning = null; lightningAmbient = 0;
    dino.y = GROUND_Y; dino.vy = 0; dino.jumping = false; dino.ducking = false; dino.jumpsLeft = 1;
    score = 0; sessionBones = 0; speed = BASE_SPEED; frame = 0; spawnTimer = 40;
    dino.scale = DINO_SCALE_GAME; powerUpActive = null;
    
    comboCount = 0; comboTimer = 0; updateComboHUD();
    
    dayNightTime = 0.25 * DAY_NIGHT_CYCLE;
    weatherTime = 0; isRaining = false;
    birdsEatenThisGame = 0; lastPowerUpSecond = -1;
    gameState = 'playing'; hideAllScreens(); 
    hud.classList.remove('hidden'); speedBarContainer.classList.add('active'); powerUpHud.classList.add('hidden');
    fullscreenBtn.classList.remove('hidden');
    versionBtn.style.display = 'none';
    tapHint.classList.remove('hidden'); setTimeout(() => tapHint.classList.add('hidden'), 2000);
    updateHUD(); initAudio();
    startMusic();
                                           }
    function jump() {
    if (gameState !== 'playing' || dino.ducking || isPortraitMode) return;
    const hasDoubleJump = powerUpActive && powerUpActive.type === 'doubleJump';
    if (!dino.jumping) {
      dino.vy = JUMP_FORCE - (save.upgrades.jump * 1.08);
      dino.jumping = true;
      dino.jumpsLeft = hasDoubleJump ? 1 : 0;
      haptic('jump'); playSound('jump');
      spawnDust(dino.x + 30, GROUND_Y, 6, 3);
    } else if (dino.jumpsLeft > 0) {
      dino.vy = JUMP_FORCE * 0.9;
      dino.jumpsLeft--;
      haptic('jump'); playSound('jump');
      spawnDust(dino.x + 30, dino.y, 6, 3);
    }
  }

  function duck(on) {
    if (gameState !== 'playing' || dino.jumping || isPortraitMode) return;
    dino.ducking = on;
  }

  function spawnObstacle() {
    const r = Math.random();
    if (r < 0.45) {
      const big = Math.random() < 0.5; 
      const h = big ? 25 : 20; const w = big ? 10 : 8; 
      obstacles.push({ x: W + 20, y: GROUND_Y, w, h, type: big ? 'cactus_big' : 'cactus_small' });
    } else if (r < 0.85) {
      const heights = [GROUND_Y - 40, GROUND_Y - 90, GROUND_Y - 168]; const y = heights[Math.floor(Math.random() * heights.length)];
      birds.push({ x: W + 20, y, w: 10, h: 10, type: 'bird', magnetized: false });
    } else {
      const types = [
        { type: 'shield', icon: '🛡', color: '#2196F3', duration: 5 },
        { type: 'doubleJump', icon: '🦘', color: '#FF9800', duration: 7 }
      ];
      const pu = types[Math.floor(Math.random() * types.length)];
      powerUps.push({ x: W + 20, y: GROUND_Y - 80 + Math.random() * 40, ...pu });
    }
  }

  function spawnDust(x, y, count, spread) { for (let i = 0; i < count; i++) particles.push({ x: x + (Math.random() - 0.5) * 10, y: y, vx: -speed * 0.3 - Math.random() * 2, vy: -Math.random() * spread, life: 1, r: Math.random() * 2 + 1 }); }

  function update(dt) {
    if (isPortraitMode) return;
    frame++;
    if (gameState === 'playing') {
      score += 0.1 * (speed / BASE_SPEED) * (dt * 60);
      speed = BASE_SPEED + Math.min(MAX_SPEED_BONUS, score / 400);
      speedBar.style.width = Math.min(100, ((speed - BASE_SPEED) / MAX_SPEED_BONUS) * 100) + '%';

      if (comboCount > 0) {
        comboTimer -= dt;
        if (comboTimer <= 0) {
          resetCombo();
        } else {
          comboTimerFill.style.width = Math.min(100, (comboTimer / COMBO_TIMEOUT) * 100) + '%';
        }
      }

      dayNightTime += dt;
      if (dayNightTime >= DAY_NIGHT_CYCLE) dayNightTime -= DAY_NIGHT_CYCLE;
      
      weatherTime += dt;
      const currentWeatherDuration = isRaining ? RAIN_DURATION : CLEAR_DURATION;
      if (weatherTime >= currentWeatherDuration) {
        isRaining = !isRaining;
        weatherTime = 0;
        if (isRaining) initRain();
      }
      updateLightning(dt);

      if (dino.jumping) {
        dino.vy += GRAVITY * (dt * 60); 
        dino.y += dino.vy * (dt * 60);
        if (dino.y >= GROUND_Y) { 
          dino.y = GROUND_Y; dino.vy = 0; dino.jumping = false; 
          const hasDoubleJump = powerUpActive && powerUpActive.type === 'doubleJump';
          dino.jumpsLeft = hasDoubleJump ? 1 : 0;
          spawnDust(dino.x + 30, GROUND_Y, 5, 2); 
        }
      } else if (frame % 8 === 0) { spawnDust(dino.x + 10, GROUND_Y, 1, 1); }

      spawnTimer -= 1;
      if (spawnTimer <= 0) {
        spawnObstacle();
        const minGap = 110, maxGap = 180;
        spawnTimer = minGap + Math.random() * (maxGap - minGap) - speed * 4;
        if (spawnTimer < 60) spawnTimer = 60;
      }

      obstacles.forEach(o => o.x -= speed);
      powerUps.forEach(p => p.x -= speed); powerUps = powerUps.filter(p => p.x > -20);
      
      const dinoBox = getDinoBox();
      
      for (let i = obstacles.length - 1; i >= 0; i--) {
        const o = obstacles[i];
        const oBox = getCactusBox(o);
        
        if (!dino.jumping && !o.wasClose) {
          const dist = boxDistance(dinoBox, oBox);
          if (dist > 0 && dist < 15) o.wasClose = true;
        }
        
        if (oBox.x + oBox.w < dinoBox.x - 15) {
          if (o.wasClose) {
            score += 5;
            spawnFloatingText(o.x + o.w * dino.scale / 2, o.y - o.h * dino.scale - 25, 'NICE! +5');
          }
          obstacles.splice(i, 1);
        }
      }

      updateRain(dt);

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
      
      for (let i = birds.length - 1; i >= 0; i--) {
        const b = birds[i];
        const bBox = getBirdBox(b);
        
        if (!b.wasClose) {
          const dist = boxDistance(dinoBox, bBox);
          if (dist > 0 && dist < 12) b.wasClose = true;
        }
        
        if (b.x + b.w * BIRD_SCALE_GAME < dino.x - 15) {
          if (b.wasClose) {
            sessionBones += 1;
            spawnFloatingText(b.x + 20 * BIRD_SCALE_GAME, b.y - 20, '+1 🦴');
            updateHUD();
          }
          resetCombo();
          birds.splice(i, 1);
        }
      }

      for (let i = powerUps.length - 1; i >= 0; i--) {
        const p = powerUps[i];
        if (rectCollide(dinoBox, { x: p.x - 15, y: p.y - 15, w: 30, h: 30 })) {
          powerUpActive = { type: p.type, timer: p.duration, maxTimer: p.duration, icon: p.icon, color: p.color };
          if (p.type === 'doubleJump') dino.jumpsLeft = Math.max(dino.jumpsLeft, 1);
          playSound('record'); haptic('eat');
          powerUps.splice(i, 1);
        }
      }
      
      if (powerUpActive) {
        powerUpActive.timer -= dt;
        const secondsLeft = Math.ceil(powerUpActive.timer);
        if (secondsLeft !== lastPowerUpSecond) {
          lastPowerUpSecond = secondsLeft;
          powerUpHud.innerHTML = `${powerUpActive.icon} ${Math.max(0, secondsLeft)}s`;
        }
        if (powerUpActive.timer <= 0) {
          powerUpActive = null;
          powerUpHud.classList.add('hidden');
        } else {
          powerUpHud.classList.remove('hidden');
        }
      }

      if (!powerUpActive || powerUpActive.type !== 'shield') {
        for (const o of obstacles) {
          if (rectCollide(dinoBox, getCactusBox(o))) { gameOver(); return; }
        }
      }

      for (let i = birds.length - 1; i >= 0; i--) {
        const b = birds[i];
        const bBox = getBirdBox(b);
        if (rectCollide(dinoBox, bBox)) {
          comboCount++;
          comboTimer = COMBO_TIMEOUT;
          const mult = getComboMultiplier();
          
          let baseBones = 1 + (save.upgrades.doubleBones || 0);
          let bonesEarned = baseBones * mult;
          
          sessionBones += bonesEarned; birdsEatenThisGame++;
          haptic('eat'); playSound('eat');
          
          const bonesForAnim = Math.min(bonesEarned, 6);
          for (let j = 0; j < bonesForAnim; j++) {
            bonesFlying.push({ x: b.x + 20 * BIRD_SCALE_GAME, y: b.y, vy: -4 - Math.random() * 2, vx: 1 + Math.random(), life: 1, rot: 0 });
          }
          
          let text = `+${bonesEarned} 🦴`;
          if (mult > 1) text += ` (x${mult})`;
          spawnFloatingText(b.x + 20 * BIRD_SCALE_GAME, b.y - 20, text);
          
          spawnDust(b.x + 20 * BIRD_SCALE_GAME, b.y, 8, 4); 
          birds.splice(i, 1);
          
          updateComboHUD(true);
          updateHUD();
        }
      }

      if (score > save.highScore) { save.highScore = score; }
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
    gameState = 'gameover'; shakeTime = 15; haptic('crash'); playSound('crash');
    spawnDust(dino.x + 30, dino.y - 20, 15, 5); 
    
    stopMusic();
    
    comboCount = 0; comboTimer = 0; updateComboHUD();
    
    const earnedThisGame = sessionBones;
    save.bones += sessionBones; sessionBones = 0;
    const finalScore = Math.floor(score);
    const isNewRecord = finalScore > save.highScore;
    if (isNewRecord) { save.highScore = finalScore; playSound('record'); newRecordText.classList.remove('hidden'); }
    else { newRecordText.classList.add('hidden'); }
    save.games.push({ score: finalScore, date: Date.now() }); save.games.sort((a, b) => b.score - a.score); save.games = save.games.slice(0, 10);
    checkAchievements(finalScore);
    writeSave(); updateHUD();
    goScore.textContent = finalScore; goHigh.textContent = Math.floor(save.highScore); goBones.textContent = `+${earnedThisGame} 🦴`;
    gameoverScreen.classList.remove('hidden');
    fullscreenBtn.classList.add('hidden');
    versionBtn.style.display = 'none';
    speedBarContainer.classList.remove('active');
    powerUpHud.classList.add('hidden');
    hud.classList.add('hidden');
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
    ctx.clearRect(0, 0, W, H);
    ctx.save(); ctx.translate(shakeX, shakeY);
    
    const isMenu = gameState === 'menu' || gameState === 'records' || gameState === 'upgrades' || gameState === 'achievements' || gameState === 'settings';
    const timeOfDay = (gameState === 'playing' || gameState === 'gameover') ? dayNightTime / DAY_NIGHT_CYCLE : 0.5;
    const colors = getObjectColors(timeOfDay);
    
    drawBackground(timeOfDay, !isMenu);
    if (isRaining && !isMenu) drawLightning();
    drawGround(timeOfDay);
    
    particles.forEach(p => { ctx.fillStyle = `rgba(255,255,255,${p.life * 0.8})`; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill(); });
    
    if (gameState === 'playing' || gameState === 'gameover') {
      obstacles.forEach(o => drawCactus(o, colors, dino.scale));
      birds.forEach(b => drawBird(b, colors, BIRD_SCALE_GAME));
      powerUps.forEach(drawPowerUp);
      drawRain();
      bonesFlying.forEach(b => { ctx.globalAlpha = b.life; ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.rot); drawBoneShape(0, 0, 16); ctx.restore(); ctx.globalAlpha = 1; });
      drawDino();
    } else {
      drawMenuScene(colors);
    }
    ctx.restore();
  }

  function drawMenuScene(colors) {
    const menuDinoX = W * 0.15 + Math.sin(frame * 0.02) * 30;
    drawDinoAt(menuDinoX, GROUND_Y, false, false, Math.floor(frame / 6) % 2, false, DINO_SCALE_MENU);
    drawCactus({ x: W * 0.8, y: GROUND_Y, w: 8, h: 20, type: 'cactus_small' }, colors, 2);
    drawCactus({ x: W * 0.9, y: GROUND_Y, w: 10, h: 25, type: 'cactus_big' }, colors, 2);
    const birdX = W * 0.4 + Math.sin(frame * 0.03) * 100; 
    const birdY = H * 0.25 + Math.cos(frame * 0.02) * 40;
    drawBird({ x: birdX, y: birdY, w: 10, h: 10, type: 'bird', magnetized: false }, colors, BIRD_SCALE_MENU);
  }

  function loop(ts) {
    const dt = ts - lastTime; lastTime = ts;
    const dtSeconds = Math.min(0.05, dt / 1000);
    const steps = Math.min(3, Math.max(1, Math.round(dt / 16.67)));
    for (let i = 0; i < steps; i++) update(dtSeconds / steps);
    if (gameState === 'playing' && frame % 300 === 0) writeSave();
    render(); requestAnimationFrame(loop);
  }

  function hideAllScreens() {
    menuScreen.classList.add('hidden'); recordsScreen.classList.add('hidden'); upgradesScreen.classList.add('hidden');
    achievementsScreen.classList.add('hidden'); settingsScreen.classList.add('hidden'); gameoverScreen.classList.add('hidden'); 
    confirmDialog.classList.add('hidden'); changelogDialog.style.display = 'none';
    versionBtn.style.display = 'none';
    comboHud.classList.add('hidden');
  }
  
  function showMainMenu() {
    gameState = 'menu'; hideAllScreens(); hud.classList.remove('hidden'); fullscreenBtn.classList.remove('hidden');
    versionBtn.style.display = 'flex';
    tapHint.classList.add('hidden'); menuScreen.classList.remove('hidden'); menuScreen.scrollTop = 0;
    speedBarContainer.classList.remove('active'); powerUpHud.classList.add('hidden'); updateHUD();
    isRaining = false; lightning = null; lightningAmbient = 0; 
    dayNightTime = 0.5 * DAY_NIGHT_CYCLE; weatherTime = 0;
    stopMusic();
  }
  
  function showRecords() { gameState = 'records'; hideAllScreens(); hud.classList.add('hidden'); fullscreenBtn.classList.add('hidden'); recordsScreen.classList.remove('hidden'); renderRecords(); }
  function showUpgrades() { gameState = 'upgrades'; hideAllScreens(); hud.classList.add('hidden'); fullscreenBtn.classList.add('hidden'); upgradesScreen.classList.remove('hidden'); renderUpgrades(); }
  function showAchievements() { gameState = 'achievements'; hideAllScreens(); hud.classList.add('hidden'); fullscreenBtn.classList.add('hidden'); achievementsScreen.classList.remove('hidden'); renderAchievements(); }
  function showSettings() { gameState = 'settings'; hideAllScreens(); hud.classList.add('hidden'); fullscreenBtn.classList.add('hidden'); settingsScreen.classList.remove('hidden'); }

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
          <div class="upgrade-icon">
            <div class="skin-circle" style="background:${skin.body}; box-shadow: inset 0 0 10px ${skin.outline};">🦖</div>
          </div>
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
      else if (action === 'changelog-close') changelogDialog.style.display = 'none';
      else if (action === 'reset') confirmDialog.classList.remove('hidden');
      else if (action === 'reset-no') confirmDialog.classList.add('hidden');
      else if (action === 'reset-yes') {
        save = defaultSave(); writeSave(); updateHUD(); renderUpgrades(); renderRecords(); confirmDialog.classList.add('hidden'); showMainMenu();
      } else if (action === 'toggle-sound') {
        soundEnabled = !soundEnabled;
        btn.textContent = soundEnabled ? '🔊 ЗВУКИ: ВКЛ' : '🔇 ЗВУКИ: ВЫКЛ';
      } else if (action === 'toggle-music') {
        musicEnabled = !musicEnabled;
        btn.textContent = musicEnabled ? '🎵 МУЗЫКА: ВКЛ' : '🔇 МУЗЫКА: ВЫКЛ';
        if (!musicEnabled) stopMusic();
        else if (gameState === 'playing') startMusic();
      }
      return;
    }
    if (gameState === 'playing' && !isPortraitMode) {
      jump();
    }
  });

  changelogDialog.addEventListener('click', (e) => {
    if (e.target === changelogDialog) changelogDialog.style.display = 'none';
  });

  document.addEventListener('keydown', (e) => {
    if (gameState !== 'playing' || isPortraitMode) return;
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') { e.preventDefault(); jump(); }
    if (e.code === 'ArrowDown' || e.code === 'KeyS') { e.preventDefault(); duck(true); }
  });
  document.addEventListener('keyup', (e) => { if (e.code === 'ArrowDown' || e.code === 'KeyS') duck(false); });

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

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', resizeCanvas);
  }
  window.addEventListener('orientationchange', () => setTimeout(resizeCanvas, 200));
  if (isTelegram && tgApp?.onEvent) {
    try { tgApp.onEvent('viewportChanged', () => setTimeout(resizeCanvas, 100)); } catch(e) {}
  }
  
  updateHUD(); showMainMenu(); requestAnimationFrame(loop);
})();
