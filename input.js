// ============================================================
// INPUT.JS — управление: кнопки, клавиатура, тач, fullscreen
// Патч 21: + обработка кнопок daily и claim-daily
// ============================================================

// ===== FULLSCREEN =====
function isFullscreen() {
  return !!(document.fullscreenElement || document.webkitFullscreenElement);
}

function updateFullscreenIcon() {
  if (isFullscreen()) {
    fsIconExpand.style.display = 'none';
    fsIconCollapse.style.display = 'block';
  } else {
    fsIconExpand.style.display = 'block';
    fsIconCollapse.style.display = 'none';
  }
}

function toggleFullscreen() {
  try {
    if (isFullscreen()) {
      if (document.exitFullscreen) document.exitFullscreen();
    } else {
      if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen();
    }
  } catch (e) {}
}

['fullscreenchange', 'webkitfullscreenchange'].forEach(evt => {
  document.addEventListener(evt, () => {
    updateFullscreenIcon();
    setTimeout(() => resizeCanvas(), 100);
  });
});

// ===== ORIENTATION =====
function updateOrientation() {
  isPortraitMode = portraitQuery.matches;
}

if (portraitQuery.addEventListener) {
  portraitQuery.addEventListener("change", updateOrientation);
}
window.addEventListener('orientationchange', () => {
  setTimeout(updateOrientation, 100);
  setTimeout(() => resizeCanvas(), 200);
});

// ===== ОБРАБОТЧИК [data-action] =====
document.addEventListener('pointerdown', (e) => {
  const btn = e.target.closest('[data-action]');
  if (btn) {
    // Если кнопка заблокирована — игнорируем
    if (btn.disabled) return;
    
    e.preventDefault();
    e.stopPropagation();
    initAudio();
    playSound('click');
    const action = btn.dataset.action;
    
    if (action === 'fullscreen') toggleFullscreen();
    else if (action === 'start') reset();
    else if (action === 'daily') {
  if (typeof showDaily === 'function') {
    try {
      showDaily();
    } catch (err) {
      const dbg = document.createElement('div');
      dbg.style.cssText = 'position:fixed;top:50px;left:10px;right:10px;background:red;color:white;padding:15px;z-index:999999;font-size:14px;border-radius:8px;';
      dbg.textContent = 'ОШИБКА в showDaily: ' + err.message;
      document.body.appendChild(dbg);
    }
  } else {
    const dbg = document.createElement('div');
    dbg.style.cssText = 'position:fixed;top:50px;left:10px;right:10px;background:red;color:white;padding:15px;z-index:999999;font-size:14px;border-radius:8px;';
    dbg.textContent = 'ОШИБКА: функция showDaily не найдена! Проверь ui.js';
    document.body.appendChild(dbg);
  }
    }
    else if (action === 'claim-daily') claimDailyReward();
    else if (action === 'records') showRecords();
    else if (action === 'upgrades') showUpgrades();
    else if (action === 'achievements') showAchievements();
    else if (action === 'settings') showSettings();
    else if (action === 'back') showMainMenu();
    else if (action === 'changelog-close') changelogDialog.style.display = 'none';
    else if (action === 'reset') confirmDialog.classList.remove('hidden');
    else if (action === 'reset-no') confirmDialog.classList.add('hidden');
    else if (action === 'reset-yes') {
      save = defaultSave();
      writeSave();
      checkDailyAndStreak(); // Сброс стрика, генерация новой ежедневки
      updateHUD();
      renderUpgrades();
      renderRecords();
      confirmDialog.classList.add('hidden');
      showMainMenu();
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

// ===== КЛАВИАТУРА =====
document.addEventListener('keydown', (e) => {
  if (gameState !== 'playing' || isPortraitMode) return;
  if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
    e.preventDefault();
    jump();
  }
  if (e.code === 'ArrowDown' || e.code === 'KeyS') {
    e.preventDefault();
    duck(true);
  }
});

document.addEventListener('keyup', (e) => {
  if (e.code === 'ArrowDown' || e.code === 'KeyS') duck(false);
});

// ===== TOUCH =====
let touchStartY = null;
let touchMoved = false;

document.addEventListener('touchstart', (e) => {
  if (e.target.closest('button') || gameState !== 'playing' || isPortraitMode) return;
  touchStartY = e.changedTouches[0].clientY;
  touchMoved = false;
}, { passive: true });

document.addEventListener('touchmove', (e) => {
  if (touchStartY === null || e.target.closest('button')) return;
  const dy = e.changedTouches[0].clientY - touchStartY;
  if (dy > 30 && gameState === 'playing' && !dino.jumping) {
    duck(true);
    touchMoved = true;
  }
}, { passive: true });

document.addEventListener('touchend', (e) => {
  if (touchStartY === null) return;
  const dy = e.changedTouches[0].clientY - touchStartY;
  if (dy > 30) duck(false);
  touchStartY = null;
}, { passive: true });
