/* Telegram Mini App + browser viewport and fullscreen controls. */
(() => {
  'use strict';
  const button = document.getElementById('fullscreenBtn');
  if (!button) return;

  const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
  const root = document.documentElement;
  const px = value => Math.max(0, Number(value) || 0) + 'px';

  function syncTelegramLayout() {
    if (!tg) return;
    const safe = tg.safeAreaInset || {};
    const content = tg.contentSafeAreaInset || {};
    root.style.setProperty('--tg-safe-top', px(safe.top));
    root.style.setProperty('--tg-safe-right', px(safe.right));
    root.style.setProperty('--tg-safe-bottom', px(safe.bottom));
    root.style.setProperty('--tg-safe-left', px(safe.left));
    root.style.setProperty('--tg-content-safe-top', px(content.top));
    root.style.setProperty('--tg-content-safe-right', px(content.right));
    root.style.setProperty('--tg-content-safe-bottom', px(content.bottom));
    root.style.setProperty('--tg-content-safe-left', px(content.left));
    if (Number(tg.viewportHeight) > 0) {
      root.style.setProperty('--tg-viewport-height', px(tg.viewportHeight));
    }
    if (Number(tg.viewportWidth) > 0) {
      root.style.setProperty('--tg-viewport-width', px(tg.viewportWidth));
    }
    window.dispatchEvent(new Event('resize'));
  }

  if (tg) {
    try {
      tg.ready();
      tg.expand();
      if (typeof tg.setHeaderColor === 'function') tg.setHeaderColor('#17251b');
      if (typeof tg.setBackgroundColor === 'function') tg.setBackgroundColor('#17251b');
    } catch (_) {}
    ['safeAreaChanged', 'contentSafeAreaChanged', 'viewportChanged', 'fullscreenChanged'].forEach(eventName => {
      if (typeof tg.onEvent === 'function') tg.onEvent(eventName, syncTelegramLayout);
    });
  }

  const refresh = () => {
    const active = !!(document.fullscreenElement || (tg && tg.isFullscreen));
    button.textContent = active ? '×' : '⛶';
    button.setAttribute('aria-label', active ? 'Выйти из полноэкранного режима' : 'Полноэкранный режим');
    button.title = active ? 'Выйти из полноэкранного режима' : 'Полноэкранный режим';
    button.classList.toggle('is-active', active);
    button.classList.toggle('telegram-mode', !!tg);
  };

  button.addEventListener('click', async () => {
    try {
      if (tg) {
        if (tg.isFullscreen && typeof tg.exitFullscreen === 'function') {
          await tg.exitFullscreen();
        } else if (typeof tg.requestFullscreen === 'function') {
          await tg.requestFullscreen();
        } else if (typeof tg.expand === 'function') {
          tg.expand();
        }
      } else if (document.fullscreenElement) {
        if (document.exitFullscreen) await document.exitFullscreen();
      } else if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch (_) {
      if (tg && typeof tg.expand === 'function') {
        try { tg.expand(); } catch (_) {}
      }
    }
    syncTelegramLayout();
    refresh();
  });

  document.addEventListener('fullscreenchange', refresh);
  if (tg && typeof tg.onEvent === 'function') {
    tg.onEvent('fullscreenChanged', () => { syncTelegramLayout(); refresh(); });
    tg.onEvent('fullscreenFailed', refresh);
  }
  window.addEventListener('resize', syncTelegramLayout);
  if (window.visualViewport) window.visualViewport.addEventListener('resize', syncTelegramLayout);
  syncTelegramLayout();
  refresh();
})();