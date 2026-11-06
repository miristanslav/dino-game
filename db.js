// ============================================================
// DB.JS — Подключение к Firebase, Онлайн, Рейтинг
// ============================================================

let fbApp, db, rtdb;
try {
  fbApp = firebase.initializeApp(firebaseConfig);
  db = firebase.firestore();
  rtdb = firebase.database();
} catch (e) {
  console.warn("Firebase не настроен. Рейтинг не работает.");
}

let playerUser = { id: 'guest', name: 'Гость', photo: '' };
try {
  if (isTelegram && tgApp.initDataUnsafe?.user) {
    const u = tgApp.initDataUnsafe.user;
    playerUser.id = String(u.id);
    playerUser.name = u.first_name + (u.last_name ? ' ' + u.last_name : '');
    playerUser.photo = u.photo_url || '';
  } else {
    let savedId = localStorage.getItem('guestId');
    if (!savedId) {
      savedId = 'guest_' + Math.floor(Math.random() * 100000);
      localStorage.setItem('guestId', savedId);
    }
    playerUser.id = savedId;
    playerUser.name = 'Гость_' + savedId.split('_')[1];
  }
} catch (e) {}

function startPresenceTracking() {
  if (!rtdb) return;
  
  const userStatusRef = rtdb.ref('/status/' + playerUser.id);
  const isOfflineForRTDB = { state: firebase.database.ServerValue.TIMESTAMP, status: 'offline' };
  const isOnlineForRTDB = { state: firebase.database.ServerValue.TIMESTAMP, status: 'online' };

  rtdb.ref('.info/connected').on('value', (snapshot) => {
    if (snapshot.val() === false) return;
    userStatusRef.onDisconnect().set(isOfflineForRTDB).then(() => {
      userStatusRef.set(isOnlineForRTDB);
    });
  });

  rtdb.ref('/status').on('value', (snap) => {
    let count = 0;
    snap.forEach(child => {
      if (child.val().status === 'online') count++;
    });
    const onlineCountEl = document.getElementById('onlineCount');
    if (onlineCountEl) onlineCountEl.textContent = count;
  });
}

async function submitScoreToCloud(finalScore) {
  if (!db) return;
  try {
    const playerRef = db.collection('leaderboard').doc(playerUser.id);
    const doc = await playerRef.get();
    
    if (!doc.exists || finalScore > doc.data().highScore) {
      await playerRef.set({
        name: playerUser.name,
        photo: playerUser.photo,
        highScore: finalScore,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    }
  } catch (e) {
    console.warn("Ошибка отправки рейтинга: ", e);
  }
}

async function fetchGlobalLeaderboard() {
  const listEl = document.getElementById('recordsList');
  if (!db) {
    listEl.innerHTML = '<div style="text-align:center; padding: 20px; color: #D32F2F;">База данных не подключена</div>';
    return;
  }

  listEl.innerHTML = '<div style="text-align:center; padding: 20px; color: #666;">Загрузка...</div>';

  try {
    const snapshot = await db.collection('leaderboard')
      .orderBy('highScore', 'desc')
      .limit(50)
      .get();

    if (snapshot.empty) {
      listEl.innerHTML = '<div style="text-align:center; padding: 20px; color: #666;">Пока нет рекордов. Стань первым!</div>';
      return;
    }

    listEl.innerHTML = '';
    let rank = 1;
    snapshot.forEach((doc) => {
      const data = doc.data();
      const isMe = doc.id === playerUser.id;
      
      const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
      
      const photoHtml = (data.photo && data.photo.startsWith('http')) 
        ? `<img src="${data.photo}" onerror="this.parentNode.innerHTML='👤'">` 
        : '👤';

      const row = document.createElement('div');
      row.className = 'global-record-row' + (isMe ? ' is-me' : '');
      
      row.innerHTML = `
        <div style="width: 40px; font-weight: bold; color: #78909C; font-size: 14px;">${medal}</div>
        <div class="player-info">
          <div class="player-avatar">${photoHtml}</div>
          <div class="player-name">${data.name} ${isMe ? '(Вы)' : ''}</div>
        </div>
        <div style="font-weight: 900; color: #1976D2; font-size: 16px;">${data.highScore}</div>
      `;
      listEl.appendChild(row);
      rank++;
    });
  } catch (e) {
    console.error(e);
    listEl.innerHTML = '<div style="text-align:center; padding: 20px; color: #D32F2F;">Ошибка загрузки рейтинга</div>';
  }
}
