// ============================================================
// CONFIG.JS — константы, глобальное состояние, DOM refs
// Загружается ПЕРВЫМ. Все остальные файлы используют эти данные.
// ============================================================

// ===== TELEGRAM ФЛАГИ (инициализируются в game.js) =====
let isTelegram = false;
let tgApp = null;

// ===== ГЛОБАЛЬНОЕ ИГРОВОЕ СОСТОЯНИЕ =====
let gameState = 'menu';
let isPortraitMode = window.matchMedia("(orientation: portrait)").matches;
const portraitQuery = window.matchMedia("(orientation: portrait)");

// ===== ВЕРСИЯ =====
const CURRENT_VERSION = 19;
function formatVersion(v) {
  const thousands = Math.floor(v / 1000);
  const hundreds = Math.floor((v % 1000) / 100);
  const tens = v % 100;
  return `${thousands}.${hundreds}.${tens}`;
}

// ===== CHANGELOG =====
const CHANGELOG = [
  {
    version: 19,
    changes: [
      'Патч 19: чистый код — разделение на 10 файлов',
      'game.js разбит на: config.js, physics.js, sprites.js, background.js, weather.js, ui.js, input.js',
      'game.js теперь ~180 строк вместо 1000 — только update и loop',
      'Все переменные состояния перенесены в config.js глобально',
      'DOM-ссылки собраны в одном месте (config.js)',
      'Никаких изменений в поведении игры — только структура'
    ]
  },
  {
    version: 18,
    changes: [
      'Патч 18: музыка теперь реально играет!',
      'Исправлена ошибка: startMusic/stopMusic не видели gameState (ReferenceError каждый тик)',
      'gameState вынесена в глобальную область (config.js)',
      'Файл game.js разделён на 4 части: config.js, audio.js, storage.js, game.js',
      'Удалена неиспользуемая переменная musicIndex'
    ]
  },
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

// ===== ИГРОВЫЕ КОНСТАНТЫ =====
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
const COMBO_TIMEOUT = 5;

// ===== МУЗЫКА =====
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

// ===== СКИНЫ =====
const SKINS = [
  { id: 'default', name: 'Зелёный', cost: 0, body: '#4CAF50', outline: '#1B5E20', belly: '#A5D6A7', claw: '#FFF', eye: '#FFF' },
  { id: 'fire', name: 'Огненный', cost: 50, body: '#F44336', outline: '#B71C1C', belly: '#FFCDD2', claw: '#FFE082', eye: '#FFF' },
  { id: 'ice', name: 'Ледяной', cost: 100, body: '#2196F3', outline: '#0D47A1', belly: '#BBDEFB', claw: '#E1F5FE', eye: '#FFF' },
  { id: 'gold', name: 'Золотой', cost: 200, body: '#FFC107', outline: '#FF6F00', belly: '#FFECB3', claw: '#FFF', eye: '#FFF' }
];

// ===== УЛУЧШЕНИЯ =====
const UPGRADES = [
  { id: 'jump', icon: '🦘', name: 'Прыжок', desc: 'Сила прыжка', maxLevel: 5, costs: [10, 30, 60, 100, 150] },
  { id: 'magnet', icon: '🧲', name: 'Магнит', desc: 'Притяжение птиц', maxLevel: 2, costs: [15, 40] },
  { id: 'doubleBones', icon: '✨', name: 'Двойные кости', desc: '+1 кость за птицу', maxLevel: 2, costs: [25, 75] }
];

// ===== ДОСТИЖЕНИЯ =====
const ACHIEVEMENTS_DEF = [
  { id: 'first_run', icon: '👟', name: 'Первый шаг', desc: 'Сыграть первую игру' },
  { id: 'score_500', icon: '⭐', name: 'Новичок', desc: 'Набрать 500 очков' },
  { id: 'score_2000', icon: '🌟', name: 'Профи', desc: 'Набрать 2000 очков' },
  { id: 'birds_10', icon: '🦅', name: 'Охотник', desc: 'Съесть 10 птиц за игру' },
  { id: 'bones_100', icon: '💰', name: 'Богач', desc: 'Накопить 100 костей' }
];

// ===== ЦВЕТА НЕБА =====
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

// ===== CANVAS =====
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ===== РАЗМЕРЫ ЭКРАНА И ЗЕМЛИ =====
let W = window.innerWidth;
let H = window.innerHeight;
let GROUND_Y = H * 0.8;

// ===== СОСТОЯНИЕ ИГРЫ =====
let score = 0;
let speed = BASE_SPEED;
let frame = 0;
let lastTime = 0;
let spawnTimer = 0;
let shakeTime = 0;
let sessionBones = 0;

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

// ===== ИГРОВЫЕ ОБЪЕКТЫ =====
const dino = { x: 60, y: GROUND_Y, scale: DINO_SCALE_GAME, vy: 0, jumping: false, ducking: false, jumpsLeft: 1 };
let obstacles = [];
let birds = [];
let particles = [];
let bonesFlying = [];
let powerUps = [];
let rainDrops = [];
let activeTab = 'upg';

// ===== ФОНОВЫЕ ЭЛЕМЕНТЫ =====
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

let clouds = [
  { x: 500, y: 60, s: 1, speed: 0.2 },
  { x: 750, y: 90, s: 0.8, speed: 0.3 }
];

let groundDots = [];
for (let i = 0; i < 50; i++) {
  groundDots.push({
    x: Math.random() * W,
    y: GROUND_Y + 6 + Math.random() * 20,
    r: Math.random() * 1.5 + 0.5
  });
}

// ===== DOM REFS =====
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
const tabUpg = document.getElementById('tabUpg');
const tabSkins = document.getElementById('tabSkins');

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
