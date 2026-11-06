// ============================================================
// UI.JS — все экраны меню, changelog, рендер списков, попапы
// Использует: все DOM refs, save, writeSave, SKINS, UPGRADES,
//             ACHIEVEMENTS_DEF, CHANGELOG, CURRENT_VERSION,
//             haptic, playSound, initAudio
// ============================================================

function updateHUD() {
  hudHigh.textContent = String(Math.floor(save.highScore)).padStart(5, '0');
  hudScore.textContent = String(Math.floor(score)).padStart(5, '0');
  hudBones.textContent = save.bones + sessionBones;
}

function hideAllScreens() {
  menuScreen.classList.add('hidden');
  recordsScreen.classList.add('hidden');
  upgradesScreen.classList.add('hidden');
  achievementsScreen.classList.add('hidden');
  settingsScreen.classList.add('hidden');
  gameoverScreen.classList.add('hidden');
  confirmDialog.classList.add('hidden');
  changelogDialog.style.display = 'none';
  versionBtn.style.display = 'none';
  comboHud.classList.add('hidden');
}

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

function renderRecords() {
  recordsList.innerHTML = '';
  if (save.games.length === 0) {
    recordsList.innerHTML = '<div class="empty-records">Пока нет рекордов</div>';
    return;
  }
  save.games.forEach((g, i) => {
    const row = document.createElement('div');
    row.className = 'record-row';
    if (i === 0) row.classList.add('top1');
    else if (i === 1) row.classList.add('top2');
    else if (i === 2) row.classList.add('top3');
    const date = new Date(g.date);
    const dateStr = `${date.getDate()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getFullYear()).slice(2)}`;
    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`;
    row.innerHTML = `<span class="rank">${medal}</span><span class="score">${g.score}</span><span class="date">${dateStr}</span>`;
    recordsList.appendChild(row);
  });
}

function renderUpgrades() {
  upgradesBones.textContent = save.bones;
  upgradesList.innerHTML = '';
  skinsList.innerHTML = '';
  if (activeTab === 'upg') {
    upgradesList.classList.remove('hidden');
    skinsList.classList.add('hidden');
    UPGRADES.forEach(upg => {
      const level = save.upgrades[upg.id] || 0;
      const isMax = level >= upg.maxLevel;
      const cost = isMax ? null : upg.costs[level];
      const canAfford = !isMax && save.bones >= cost;
      const card = document.createElement('div');
      card.className = 'upgrade-card';
      if (isMax) card.classList.add('maxed');
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
      if (!isMax) {
        card.querySelector('.upgrade-buy').addEventListener('pointerdown', (e) => {
          e.stopPropagation();
          buyUpgrade(upg.id);
        });
      }
      upgradesList.appendChild(card);
    });
  } else {
    upgradesList.classList.add('hidden');
    skinsList.classList.remove('hidden');
    SKINS.forEach(skin => {
      const isUnlocked = save.unlockedSkins.includes(skin.id);
      const isEquipped = save.currentSkin === skin.id;
      const card = document.createElement('div');
      card.className = 'upgrade-card';
      if (isEquipped) card.classList.add('equipped');
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
          if (isUnlocked) {
            save.currentSkin = skin.id;
            writeSave();
            renderUpgrades();
            haptic('click');
          } else if (save.bones >= skin.cost) {
            save.bones -= skin.cost;
            save.unlockedSkins.push(skin.id);
            save.currentSkin = skin.id;
            writeSave();
            renderUpgrades();
            haptic('buy');
            playSound('eat');
          }
        });
      }
      skinsList.appendChild(card);
    });
  }
}

function buyUpgrade(id) {
  const upg = UPGRADES.find(u => u.id === id);
  if (!upg) return;
  const level = save.upgrades[id] || 0;
  if (level >= upg.maxLevel) return;
  const cost = upg.costs[level];
  if (save.bones < cost) return;
  save.bones -= cost;
  save.upgrades[id] = level + 1;
  writeSave();
  renderUpgrades();
  haptic('buy');
  playSound('click');
}

function renderAchievements() {
  achievementsList.innerHTML = '';
  ACHIEVEMENTS_DEF.forEach(ach => {
    const unlocked = !!save.achievements[ach.id];
    const row = document.createElement('div');
    row.className = 'upgrade-card';
    if (unlocked) row.classList.add('equipped');
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

function checkAchievements(currentScore) {
  if (!save.achievements.first_run) unlockAch('first_run');
  if (currentScore >= 500 && !save.achievements.score_500) unlockAch('score_500');
  if (currentScore >= 2000 && !save.achievements.score_2000) unlockAch('score_2000');
  if (birdsEatenThisGame >= 10 && !save.achievements.birds_10) unlockAch('birds_10');
  if (save.bones >= 100 && !save.achievements.bones_100) unlockAch('bones_100');
}

function unlockAch(id) {
  save.achievements[id] = true;
  const def = ACHIEVEMENTS_DEF.find(a => a.id === id);
  if (def) {
    achPopupIcon.textContent = def.icon;
    achPopupName.textContent = def.name;
    achievementPopup.classList.remove('hidden');
    achievementPopup.classList.add('show');
    setTimeout(() => {
      achievementPopup.classList.remove('show');
      setTimeout(() => achievementPopup.classList.add('hidden'), 400);
    }, 3000);
    playSound('record');
  }
}

function showMainMenu() {
  gameState = 'menu';
  hideAllScreens();
  hud.classList.remove('hidden');
  fullscreenBtn.classList.remove('hidden');
  versionBtn.style.display = 'flex';
  tapHint.classList.add('hidden');
  menuScreen.classList.remove('hidden');
  menuScreen.scrollTop = 0;
  speedBarContainer.classList.remove('active');
  powerUpHud.classList.add('hidden');
  updateHUD();
  isRaining = false;
  lightning = null;
  lightningAmbient = 0;
  dayNightTime = 0.5 * DAY_NIGHT_CYCLE;
  weatherTime = 0;
  stopMusic();
}

function showRecords() {
  gameState = 'records';
  hideAllScreens();
  hud.classList.add('hidden');
  fullscreenBtn.classList.add('hidden');
  recordsScreen.classList.remove('hidden');
  renderRecords();
}

function showUpgrades() {
  gameState = 'upgrades';
  hideAllScreens();
  hud.classList.add('hidden');
  fullscreenBtn.classList.add('hidden');
  upgradesScreen.classList.remove('hidden');
  renderUpgrades();
}

function showAchievements() {
  gameState = 'achievements';
  hideAllScreens();
  hud.classList.add('hidden');
  fullscreenBtn.classList.add('hidden');
  achievementsScreen.classList.remove('hidden');
  renderAchievements();
}

function showSettings() {
  gameState = 'settings';
  hideAllScreens();
  hud.classList.add('hidden');
  fullscreenBtn.classList.add('hidden');
  settingsScreen.classList.remove('hidden');
}

// ===== Tab switching для улучшений/скинов =====
tabUpg.addEventListener('click', () => {
  activeTab = 'upg';
  tabUpg.classList.add('active');
  tabSkins.classList.remove('active');
  renderUpgrades();
});

tabSkins.addEventListener('click', () => {
  activeTab = 'skins';
  tabSkins.classList.add('active');
  tabUpg.classList.remove('active');
  renderUpgrades();
});

// ===== Кнопка версии → changelog =====
versionBtn.addEventListener('click', (e) => {
  e.preventDefault();
  e.stopPropagation();
  initAudio();
  playSound('click');
  showChangelog();
});

// ===== Закрытие changelog по клику на фон =====
changelogDialog.addEventListener('click', (e) => {
  if (e.target === changelogDialog) changelogDialog.style.display = 'none';
});

// ===== Начальная установка версии в UI =====
versionNumber.textContent = formatVersion(CURRENT_VERSION);
