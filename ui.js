function updateHUD() {
  hudHigh.textContent = String(Math.floor(save.highScore)).padStart(5, '0');
  hudScore.textContent = String(Math.floor(score)).padStart(5, '0');
  hudBones.textContent = save.bones + sessionBones;
  if (xpLevel && xpBarFill) {
    const info = getLevelFromXp(save.xp);
    xpLevel.textContent = `Lv.${info.level}`;
    const pct = info.xpToNext > 0 ? (info.currentXp / info.xpToNext) * 100 : 0;
    xpBarFill.style.width = Math.min(100, pct) + '%';
  }
}

function updatePowerUpHUD() {
  const container = document.getElementById('powerUpHudContainer');
  if (!container) return;
  if (activePowerUps.length === 0) { container.classList.add('hidden'); return; }
  container.classList.remove('hidden');
  let html = '';
  activePowerUps.forEach(a => { html += `<div class="powerup-badge" style="border-color: ${a.color}">${a.icon} ${Math.max(0, Math.ceil(a.timer))}s</div>`; });
  container.innerHTML = html;
}

function updateDailyBadge() {
  if (save.dailyQuest && !save.dailyQuest.claimed) dailyBadge.classList.remove('hidden');
  else dailyBadge.classList.add('hidden');
}

function hideAllScreens() {
  menuScreen.classList.add('hidden'); dailyScreen.classList.add('hidden'); recordsScreen.classList.add('hidden');
  upgradesScreen.classList.add('hidden'); achievementsScreen.classList.add('hidden'); settingsScreen.classList.add('hidden');
  gameoverScreen.classList.add('hidden'); confirmDialog.classList.add('hidden'); changelogDialog.style.display = 'none';
  versionBtn.style.display = 'none'; comboHud.classList.add('hidden'); levelUpPopup.classList.remove('show');
}

function showChangelog() {
  changelogContent.innerHTML = '';
  CHANGELOG.forEach((entry, i) => {
    const div = document.createElement('div');
    div.className = 'changelog-entry' + (i === 0 ? ' current' : '');
    let html = `<h3>Версия ${formatVersion(entry.version)}</h3><ul>`;
    entry.changes.forEach(change => { html += `<li>${change}</li>`; });
    html += '</ul>'; div.innerHTML = html; changelogContent.appendChild(div);
  });
  changelogDialog.style.display = 'flex';
}

function renderDaily() {
  if (!save.dailyQuest) return;
  const q = save.dailyQuest;
  dailyStreak.textContent = save.streak || 0; dailyIcon.textContent = q.icon; dailyTitle.textContent = q.title;
  dailyProgressText.textContent = q.progress; dailyTargetText.textContent = q.target;
  dailyProgressFill.style.width = Math.min(100, (q.progress / q.target) * 100) + '%';
  const boneReward = 50 + (save.streak || 0) * 5; const xpReward = 100 + (save.streak || 0) * 10;
  dailyBoneReward.textContent = boneReward; dailyXpReward.textContent = xpReward;
  if (q.claimed) { btnClaimDaily.textContent = '✓ ПОЛУЧЕНО'; btnClaimDaily.disabled = true; btnClaimDaily.style.background = '#4CAF50'; btnClaimDaily.style.boxShadow = 'none'; }
  else if (q.completed) { btnClaimDaily.textContent = 'ЗАБРАТЬ НАГРАДУ'; btnClaimDaily.disabled = false; btnClaimDaily.style.background = '#4CAF50'; btnClaimDaily.style.boxShadow = '0 4px 0 #2E7D32'; }
  else { btnClaimDaily.textContent = 'ВЫПОЛНИТЕ ЗАДАНИЕ'; btnClaimDaily.disabled = true; btnClaimDaily.style.background = '#CFD8DC'; btnClaimDaily.style.boxShadow = 'none'; }
}

function claimDailyReward() {
  if (!save.dailyQuest || !save.dailyQuest.completed || save.dailyQuest.claimed) return;
  const boneReward = 50 + (save.streak || 0) * 5; const xpReward = 100 + (save.streak || 0) * 10;
  save.bones += boneReward;
  const oldLevel = getLevelFromXp(save.xp).level; save.xp += xpReward;
  const newInfo = getLevelFromXp(save.xp); let totalLevelReward = 0;
  if (newInfo.level > oldLevel) { for (let lv = oldLevel + 1; lv <= newInfo.level; lv++) totalLevelReward += xpLevelReward(lv); save.bones += totalLevelReward; save.playerLevel = newInfo.level; }
  save.dailyQuest.claimed = true; writeSave(); haptic('eat'); playSound('record');
  renderDaily(); updateHUD(); updateDailyBadge();
  if (newInfo.level > oldLevel) setTimeout(() => showLevelUpPopup(newInfo.level, totalLevelReward), 500);
}

function renderRecords() {
  fetchGlobalLeaderboard(); // ПАТЧ 25: Загружаем рейтинг из облака
}

function renderUpgrades() {
  upgradesBones.textContent = save.bones;
  upgradesList.innerHTML = ''; skinsList.innerHTML = ''; if (petsList) petsList.innerHTML = '';

  if (activeTab === 'upg') {
    upgradesList.classList.remove('hidden'); skinsList.classList.add('hidden'); if (petsList) petsList.classList.add('hidden');
    UPGRADES.forEach(upg => {
      const level = save.upgrades[upg.id] || 0; const isMax = level >= upg.maxLevel; const cost = isMax ? null : upg.costs[level]; const canAfford = !isMax && save.bones >= cost;
      const card = document.createElement('div'); card.className = 'upgrade-card'; if (isMax) card.classList.add('maxed');
      card.innerHTML = `<div class="upgrade-icon">${upg.icon}</div><div class="upgrade-info"><div class="upgrade-name">${upg.name}</div><div class="upgrade-desc">${upg.desc}</div><div class="upgrade-level">Уровень ${level}/${upg.maxLevel}</div></div><button class="upgrade-buy ${isMax ? 'maxed' : ''}" ${isMax || !canAfford ? 'disabled' : ''}>${isMax ? '✓ MAX' : `${cost} 🦴`}</button>`;
      if (!isMax) card.querySelector('.upgrade-buy').addEventListener('pointerdown', (e) => { e.stopPropagation(); buyUpgrade(upg.id); });
      upgradesList.appendChild(card);
    });
  } else if (activeTab === 'skins') {
    upgradesList.classList.add('hidden'); skinsList.classList.remove('hidden'); if (petsList) petsList.classList.add('hidden');
    SKINS.forEach(skin => {
      const isUnlocked = save.unlockedSkins.includes(skin.id); const isEquipped = save.currentSkin === skin.id;
      const card = document.createElement('div'); card.className = 'upgrade-card'; if (isEquipped) card.classList.add('equipped');
      const bonusText = (skin.bonus && skin.bonus.type !== 'none') ? `<div class="skin-bonus">${skin.bonus.desc}</div>` : '';
      card.innerHTML = `<div class="upgrade-icon"><div class="skin-circle" style="background:${skin.body}; box-shadow: inset 0 0 10px ${skin.outline};">🦖</div></div><div class="upgrade-info"><div class="upgrade-name">${skin.name}</div><div class="upgrade-desc">${isEquipped ? 'Экипирован' : isUnlocked ? 'Разблокирован' : 'Не куплен'}</div>${bonusText}</div><button class="upgrade-buy ${isEquipped ? 'maxed' : ''}" ${isEquipped || (!isUnlocked && save.bones < skin.cost) ? 'disabled' : ''}>${isEquipped ? '✓ НАДЕТ' : isUnlocked ? 'НАДЕТЬ' : `${skin.cost} 🦴`}</button>`;
      if (!isEquipped) card.querySelector('.upgrade-buy').addEventListener('pointerdown', (e) => { e.stopPropagation(); if (isUnlocked) { save.currentSkin = skin.id; writeSave(); renderUpgrades(); haptic('click'); } else if (save.bones >= skin.cost) { save.bones -= skin.cost; save.unlockedSkins.push(skin.id); save.currentSkin = skin.id; writeSave(); renderUpgrades(); haptic('buy'); playSound('eat'); } });
      skinsList.appendChild(card);
    });
  } else if (activeTab === 'pets' && petsList) {
    upgradesList.classList.add('hidden'); skinsList.classList.add('hidden'); petsList.classList.remove('hidden');
    PETS.forEach(pet => {
      const isUnlocked = save.unlockedPets.includes(pet.id); const isEquipped = save.currentPet === pet.id;
      const card = document.createElement('div'); card.className = 'upgrade-card'; if (isEquipped) card.classList.add('equipped');
      const bonusText = (pet.bonus && pet.bonus.desc) ? `<div class="skin-bonus">${pet.bonus.desc}</div>` : '';
      card.innerHTML = `<div class="upgrade-icon" style="font-size:28px;">${pet.icon}</div><div class="upgrade-info"><div class="upgrade-name">${pet.name}</div><div class="upgrade-desc">${isEquipped ? 'Экипирован' : isUnlocked ? 'Разблокирован' : 'Не куплен'}</div>${bonusText}</div><button class="upgrade-buy ${isEquipped ? 'maxed' : ''}" ${isEquipped || (!isUnlocked && save.bones < pet.cost) ? 'disabled' : ''}>${isEquipped ? '✓ НАДЕТ' : isUnlocked ? 'НАДЕТЬ' : `${pet.cost} 🦴`}</button>`;
      if (!isEquipped) card.querySelector('.upgrade-buy').addEventListener('pointerdown', (e) => { e.stopPropagation(); if (isUnlocked) { save.currentPet = pet.id; writeSave(); renderUpgrades(); haptic('click'); } else if (save.bones >= pet.cost) { save.bones -= pet.cost; save.unlockedPets.push(pet.id); save.currentPet = pet.id; writeSave(); renderUpgrades(); haptic('buy'); playSound('eat'); } });
      petsList.appendChild(card);
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
    const row = document.createElement('div'); row.className = 'upgrade-card'; if (unlocked) row.classList.add('equipped'); row.style.opacity = unlocked ? '1' : '0.5';
    row.innerHTML = `<div class="upgrade-icon">${ach.icon}</div><div class="upgrade-info"><div class="upgrade-name">${ach.name}</div><div class="upgrade-desc">${ach.desc}</div></div><div style="font-size:24px;">${unlocked ? '✅' : '🔒'}</div>`;
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
    achPopupIcon.textContent = def.icon; achPopupName.textContent = def.name;
    achievementPopup.classList.remove('hidden'); achievementPopup.classList.add('show');
    setTimeout(() => { achievementPopup.classList.remove('show'); setTimeout(() => achievementPopup.classList.add('hidden'), 400); }, 3000);
    playSound('record');
  }
}

function showLevelUpPopup(level, reward) {
  levelUpName.textContent = `Lv.${level}`; levelUpReward.textContent = `+${reward} 🦴`;
  levelUpPopup.classList.add('show'); playSound('record');
  setTimeout(() => { levelUpPopup.classList.remove('show'); }, 3000);
}

function showMainMenu() {
  gameState = 'menu'; hideAllScreens(); hud.classList.remove('hidden'); xpBarContainer.classList.remove('hidden');
  fullscreenBtn.classList.remove('hidden'); versionBtn.style.display = 'flex'; tapHint.classList.add('hidden');
  menuScreen.classList.remove('hidden'); menuScreen.scrollTop = 0; speedBarContainer.classList.remove('active');
  powerUpHud.classList.add('hidden'); updateHUD(); updateDailyBadge();
  isRaining = false; lightning = null; lightningAmbient = 0; dayNightTime = 0.5 * DAY_NIGHT_CYCLE; weatherTime = 0; stopMusic();
  startPresenceTracking(); // ПАТЧ 25: Начинаем отслеживать онлайн
}

function showDaily() {
  gameState = 'daily'; hideAllScreens(); hud.classList.add('hidden'); xpBarContainer.classList.add('hidden');
  fullscreenBtn.classList.add('hidden'); dailyScreen.classList.remove('hidden'); renderDaily();
}

function showRecords() {
  gameState = 'records'; hideAllScreens(); hud.classList.add('hidden'); xpBarContainer.classList.add('hidden');
  fullscreenBtn.classList.add('hidden'); recordsScreen.classList.remove('hidden'); renderRecords();
}

function showUpgrades() {
  gameState = 'upgrades'; hideAllScreens(); hud.classList.add('hidden'); xpBarContainer.classList.add('hidden');
  fullscreenBtn.classList.add('hidden'); upgradesScreen.classList.remove('hidden'); renderUpgrades();
}

function showAchievements() {
  gameState = 'achievements'; hideAllScreens(); hud.classList.add('hidden'); xpBarContainer.classList.add('hidden');
  fullscreenBtn.classList.add('hidden'); achievementsScreen.classList.remove('hidden'); renderAchievements();
}

function showSettings() {
  gameState = 'settings'; hideAllScreens(); hud.classList.add('hidden'); xpBarContainer.classList.add('hidden');
  fullscreenBtn.classList.add('hidden'); settingsScreen.classList.remove('hidden');
}

if (tabUpg) tabUpg.addEventListener('click', () => { activeTab = 'upg'; tabUpg.classList.add('active'); if(tabSkins) tabSkins.classList.remove('active'); if(tabPets) tabPets.classList.remove('active'); renderUpgrades(); });
if (tabSkins) tabSkins.addEventListener('click', () => { activeTab = 'skins'; tabSkins.classList.add('active'); if(tabUpg) tabUpg.classList.remove('active'); if(tabPets) tabPets.classList.remove('active'); renderUpgrades(); });
if (tabPets) tabPets.addEventListener('click', () => { activeTab = 'pets'; tabPets.classList.add('active'); if(tabUpg) tabUpg.classList.remove('active'); if(tabSkins) tabSkins.classList.remove('active'); renderUpgrades(); });

versionBtn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); initAudio(); playSound('click'); showChangelog(); });
changelogDialog.addEventListener('click', (e) => { if (e.target === changelogDialog) changelogDialog.style.display = 'none'; });
versionNumber.textContent = formatVersion(CURRENT_VERSION);
