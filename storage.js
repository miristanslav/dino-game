const SAVE_KEY = 'trex_color_save_v1';

function defaultSave() {
  return {
    highScore: 0, bones: 0, games: [],
    upgrades: { jump: 0, magnet: 0, doubleBones: 0, lives: 0 },
    achievements: {}, currentSkin: 'default', unlockedSkins: ['default'],
    currentPet: 'none', unlockedPets: ['none'],
    xp: 0, playerLevel: 1, lastPlayDate: null, streak: 0, dailyQuest: null,
    // ПАТЧ 26: настройки звука сохраняются
    soundEnabled: true,
    musicEnabled: true
  };
}

let save = (() => {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? { ...defaultSave(), ...JSON.parse(raw) } : defaultSave();
  } catch { return defaultSave(); }
})();

// Совместимость старых сохранений: новые уровни не должны сбрасывать прежние.
save.upgrades = { ...defaultSave().upgrades, ...(save.upgrades || {}) };
for (const key of ['jump', 'magnet', 'doubleBones', 'lives']) {
  const value = Number(save.upgrades[key]);
  save.upgrades[key] = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}
// ПАТЧ 26: нормализация старых сейвов
// 1) highScore мог быть дробным (баг версий до 0.0.27)
if (typeof save.highScore === 'number' && !Number.isInteger(save.highScore)) {
  save.highScore = Math.floor(save.highScore);
}
// 2) синхронизация звуковых флагов (audio.js загружен раньше)
//    (глобальные переменные soundEnabled / musicEnabled объявлены в audio.js)
try {
  soundEnabled = save.soundEnabled !== false;
  musicEnabled = save.musicEnabled !== false;
} catch (e) {}

function writeSave() {
  localStorage.setItem(SAVE_KEY, JSON.stringify(save));
}
