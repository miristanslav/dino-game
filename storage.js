// ===== СОХРАНЕНИЕ ПРОГРЕССА =====
const SAVE_KEY = 'trex_color_save_v1';

function defaultSave() {
  return {
    highScore: 0,
    bones: 0,
    games: [],
    upgrades: { jump: 0, magnet: 0, doubleBones: 0 },
    achievements: {},
    currentSkin: 'default',
    unlockedSkins: ['default']
  };
}

let save = (() => {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? { ...defaultSave(), ...JSON.parse(raw) } : defaultSave();
  } catch { return defaultSave(); }
})();

function writeSave() {
  localStorage.setItem(SAVE_KEY, JSON.stringify(save));
}
