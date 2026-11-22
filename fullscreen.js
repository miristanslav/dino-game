/* Browser and Telegram Mini App fullscreen bridge. */
(() => {
  'use strict';
  const button=document.getElementById('fullscreenBtn');
  if(!button) return;
  const tg=window.Telegram&&window.Telegram.WebApp?window.Telegram.WebApp:null;
  if(tg){try{tg.ready();tg.expand()}catch(_){}}
  const isTelegram=!!tg;
  const refresh=()=>{
    const active=!!(document.fullscreenElement||(tg&&tg.isFullscreen));
    button.textContent=active?'×':'⛶';
    button.setAttribute('aria-label',active?'Выйти из полноэкранного режима':'Полноэкранный режим');
    button.title=active?'Выйти из полноэкранного режима':'Полноэкранный режим';
    button.classList.toggle('is-active',active);
  };
  button.addEventListener('click',async()=>{
    try{
      if(isTelegram){
        if(tg.isFullscreen&&typeof tg.exitFullscreen==='function') await tg.exitFullscreen();
        else if(typeof tg.requestFullscreen==='function') await tg.requestFullscreen();
        else if(typeof tg.expand==='function') tg.expand();
      }else if(document.fullscreenElement){
        if(document.exitFullscreen) await document.exitFullscreen();
      }else if(document.documentElement.requestFullscreen){
        await document.documentElement.requestFullscreen();
      }else if(typeof screen!=='undefined'&&screen.orientation&&screen.orientation.lock){
        await screen.orientation.lock('portrait').catch(()=>{});
      }
    }catch(error){
      if(isTelegram&&typeof tg.expand==='function'){try{tg.expand()}catch(_){}}
    }
    refresh();
  });
  document.addEventListener('fullscreenchange',refresh);
  if(tg&&typeof tg.onEvent==='function'){
    tg.onEvent('fullscreenChanged',refresh);
    tg.onEvent('fullscreenFailed',refresh);
  }
  refresh();
})();