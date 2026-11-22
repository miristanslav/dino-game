(() => {
'use strict';
const canvas=document.getElementById('gameCanvas');
const $=id=>document.getElementById(id);
const ui={menu:$('menu'),hud:$('hud'),controls:$('mobileControls'),pause:$('pauseScreen'),level:$('levelScreen'),over:$('gameOverScreen'),changelog:$('changelog'),hint:$('worldHint')};
const SAVE_KEY='dino_game_rpg_save_v1';
const saved=(()=>{try{return JSON.parse(localStorage.getItem(SAVE_KEY)||'{}')}catch{return {}}})();
const defaultProfile={dna:0,runs:0,totalKills:0,stats:{vitality:0,power:0,agility:0,armor:0,haste:0,instinct:0}};
saved.profile={...defaultProfile,...(saved.profile||{}),stats:{...defaultProfile.stats,...(saved.profile?.stats||{})}};
let W=480,H=800,scale=1,last=0,raf=0,state='menu',worldTime=0,shake=0;
let player,enemies=[],orbs=[],particles=[],decor=[],kills=0,spawnClock=0,elapsed=0,levelChoices=[],keys={},joy={x:0,y:0,active:false},pointerId=null,nextEnemyId=1;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),rand=(a,b)=>a+Math.random()*(b-a),dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function resize(){const tg=window.Telegram&&window.Telegram.WebApp?window.Telegram.WebApp:null,vv=window.visualViewport;W=Math.round((tg&&tg.viewportWidth)||(vv&&vv.width)||window.innerWidth);H=Math.round((tg&&tg.viewportHeight)||(vv&&vv.height)||window.innerHeight);if(window.Dino3D&&window.Dino3D.resize)window.Dino3D.resize()}
window.addEventListener('resize',resize);if(window.visualViewport)window.visualViewport.addEventListener('resize',resize);resize();
function freshPlayer(){
const st=saved.profile.stats;
const maxHp=100+st.vitality*10;
return{x:0,y:0,r:13,hp:maxHp,maxHp,speed:145*(1+st.agility*.03),damage:14+st.power*1.5,attackRate:.72*Math.pow(.975,st.haste),attackCooldown:0,attackWindup:0,attackVisual:0,attackAngle:0,level:1,xp:0,nextXp:35,range:190+st.instinct*8,specialCd:0,dashCd:0,dashTime:0,dx:0,dy:0,invuln:0,armor:st.armor}}
let runReward=0,runSaved=false;
function saveProgress(){
try{
saved.bestKills=Math.max(saved.bestKills||0,kills);
saved.lastLevel=player?.level||1;
localStorage.setItem(SAVE_KEY,JSON.stringify(saved));
}catch{}
}
function awardRunProgress(){
if(runSaved)return;
runSaved=true;
const earned=Math.max(0,Math.floor(kills/5)+Math.floor(Math.max(0,(player?.level||1)-1)/3));
runReward=earned;
saved.profile.dna+=earned;
saved.profile.runs++;
saved.profile.totalKills+=kills;
saveProgress();
renderProfile();
}
function show(name){Object.values(ui).forEach(x=>x.classList.add('hidden'));if(name&&ui[name])ui[name].classList.remove('hidden');ui.controls.classList.toggle('hidden',name!=='hud');$('pauseBtn').classList.toggle('hidden',name!=='hud')}
function start(){if(!window.Dino3D||!window.Dino3D.ready){const reason=window.Dino3D?.error?.message||'3D-рендерер ещё не готов';alert('Не удалось запустить 3D-мир Dino Game. '+reason+' Обнови страницу и попробуй снова.');return}player=freshPlayer();runReward=0;runSaved=false;enemies=[];orbs=[];particles=[];decor=[];kills=0;spawnClock=.7;elapsed=0;worldTime=0;state='playing';for(let i=0;i<45;i++)decor.push({x:rand(-500,500),y:rand(-650,650),type:Math.random()<.55?'fern':'rock',s:rand(.65,1.5)});show('hud');ui.hud.classList.remove('hidden');ui.controls.classList.remove('hidden');$('pauseBtn').classList.remove('hidden');ui.hint.classList.remove('hidden');setTimeout(()=>ui.hint.classList.add('hidden'),2800);updateHud();last=performance.now();cancelAnimationFrame(raf);raf=requestAnimationFrame(loop)}
function pause(){if(state!=='playing')return;state='paused';show('pause');$('pauseBtn').classList.add('hidden')}
function resume(){if(state!=='paused')return;state='playing';show('hud');ui.hud.classList.remove('hidden');ui.controls.classList.remove('hidden');$('pauseBtn').classList.remove('hidden');last=performance.now();raf=requestAnimationFrame(loop)}
function endRun(){state='over';awardRunProgress();$('runSummary').textContent='Побеждено хищников: '+kills+' · Уровень: '+player.level+' · ДНК получено: '+runReward;show('over')}
function updateHud(){$('healthFill').style.width=(player.hp/player.maxHp*100)+'%';$('healthText').textContent=Math.ceil(player.hp)+' / '+player.maxHp;$('xpFill').style.width=(player.xp/player.nextXp*100)+'%';$('levelText').textContent='УРОВЕНЬ '+player.level;$('killText').textContent='ПОБЕДЫ: '+kills}
const permanentStats=[
{id:'vitality',name:'Живучесть',desc:'+10 к максимальному здоровью за уровень',base:100,step:10},
{id:'power',name:'Сила',desc:'+1,5 к урону основной атаки за уровень',base:14,step:1.5},
{id:'agility',name:'Ловкость',desc:'+3% к скорости передвижения за уровень',base:145,step:3},
{id:'armor',name:'Природная броня',desc:'−1 к получаемому урону за уровень',base:0,step:1},
{id:'haste',name:'Скорость атаки',desc:'+2,5% к частоте атак за уровень',base:0,step:2.5},
{id:'instinct',name:'Инстинкт',desc:'+8 к радиусу подбора опыта за уровень',base:190,step:8}
];
function renderProfile(){
const p=saved.profile;
$('dnaCount').textContent=p.dna;
$('profileMeta').textContent='Забегов: '+p.runs+' · Побед: '+p.totalKills;
const box=$('permanentStats');box.innerHTML='';
permanentStats.forEach(st=>{
const level=p.stats[st.id]||0;
const row=document.createElement('div');row.className='stat-row';
const info=document.createElement('div');info.className='stat-info';
const name=document.createElement('b');name.textContent=st.name+' · '+level;
const desc=document.createElement('small');desc.textContent=st.desc;
info.append(name,desc);
const buy=document.createElement('button');buy.className='stat-buy';buy.textContent='+';buy.disabled=p.dna<1;buy.setAttribute('aria-label','Улучшить: '+st.name);
buy.addEventListener('click',()=>buyPermanentStat(st.id));
row.append(info,buy);box.appendChild(row);
});
}
function buyPermanentStat(id){
const st=permanentStats.find(x=>x.id===id);
if(!st||saved.profile.dna<1)return;
saved.profile.dna--;saved.profile.stats[id]=(saved.profile.stats[id]||0)+1;
saveProgress();renderProfile();
}
const upgrades=[{name:'Усиленные когти',desc:'Урон основной атаки +25%',apply:p=>p.damage=Math.round(p.damage*1.25)},{name:'Быстрая реакция',desc:'Скорость атаки +20%',apply:p=>p.attackRate*=.8},{name:'Крепкая чешуя',desc:'Максимальное здоровье +25 и лечение',apply:p=>{p.maxHp+=25;p.hp=Math.min(p.maxHp,p.hp+35)}},{name:'Охотничий инстинкт',desc:'Дальность автоматической атаки +20%',apply:p=>p.range*=1.2},{name:'Мускулистые лапы',desc:'Скорость передвижения +12%',apply:p=>p.speed*=1.12},{name:'Природная броня',desc:'Получаемый урон снижается на 2',apply:p=>p.armor+=2}];
function levelUp(){state='level';const picks=[...upgrades].sort(()=>Math.random()-.5).slice(0,3);const box=$('upgradeChoices');box.innerHTML='';picks.forEach(u=>{const b=document.createElement('button');b.className='upgrade-choice';b.innerHTML=u.name+'<small>'+u.desc+'</small>';b.addEventListener('click',()=>{u.apply(player);state='playing';show('hud');ui.hud.classList.remove('hidden');ui.controls.classList.remove('hidden');$('pauseBtn').classList.remove('hidden');updateHud();last=performance.now();raf=requestAnimationFrame(loop)},{once:true});box.appendChild(b)});show('level')}
function gainXp(n){player.xp+=n;if(player.xp>=player.nextXp){player.xp-=player.nextXp;player.level++;player.nextXp=Math.round(player.nextXp*1.32+12);updateHud();levelUp()}else updateHud()}
function spawnEnemy(){const a=rand(0,Math.PI*2),d=rand(300,420),x=player.x+Math.cos(a)*d,y=player.y+Math.sin(a)*d,roll=Math.random(),behavior=roll<.58?'grazer':roll<.82?'territorial':'hunter',brute=behavior==='hunter'&&Math.random()<Math.min(.2,.04+elapsed/260),hp=brute?58:behavior==='hunter'?30:behavior==='territorial'?38:24;enemies.push({id:nextEnemyId++,x,y,homeX:x,homeY:y,r:brute?17:behavior==='grazer'?11:12,hp,maxHp:hp,speed:behavior==='grazer'?rand(24,34):behavior==='territorial'?rand(26,36):brute?40:50,damage:brute?13:behavior==='hunter'?8:6,brute,behavior,hostile:false,alerted:false,alertTime:0,alertCooldown:0,fleeing:false,fleeCooldown:0,fleeAngle:rand(0,Math.PI*2),vx:0,vy:0,wanderAngle:rand(0,Math.PI*2),wanderTimer:rand(.5,2.5),hit:0,attack:rand(.2,.8)})}
function burst(x,y,color,n=8){for(let i=0;i<n;i++){const a=rand(0,Math.PI*2),s=rand(25,105);particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,t:rand(.2,.55),life:.55,color})}}
function special(){if(state!=='playing'||player.specialCd>0)return;player.specialCd=8;const radius=112;burst(player.x,player.y,'#a8e6ff',28);for(const e of enemies){const d=dist(player,e);if(d<radius+e.r){e.hp-=player.damage*2.1;e.hit=.2;const dx=e.x-player.x,dy=e.y-player.y,l=Math.hypot(dx,dy)||1;e.x+=dx/l*34;e.y+=dy/l*34;if(e.hp<=0)killEnemy(e)}}enemies=enemies.filter(e=>e.hp>0);updateHud()}
function dash(){if(state!=='playing'||player.dashCd>0)return;let dx=joy.x+(keys.ArrowRight||keys.d?1:0)-(keys.ArrowLeft||keys.a?1:0),dy=joy.y+(keys.ArrowDown||keys.s?1:0)-(keys.ArrowUp||keys.w?1:0),l=Math.hypot(dx,dy);if(l<.1){dx=player.dx||1;dy=player.dy||0;l=Math.hypot(dx,dy)||1}player.dx=dx/l;player.dy=dy/l;player.dashTime=.18;player.dashCd=2.4;player.invuln=.35;burst(player.x,player.y,'#c4e99a',7)}
function killEnemy(e){if(e.dead)return;e.dead=true;kills++;orbs.push({x:e.x,y:e.y,r:5,value:e.brute?15:9});burst(e.x,e.y,e.brute?'#e4a76c':'#a8ce72',12);updateHud()}
function update(dt){elapsed+=dt;worldTime+=dt;player.specialCd=Math.max(0,player.specialCd-dt);player.dashCd=Math.max(0,player.dashCd-dt);player.invuln=Math.max(0,player.invuln-dt);player.dashTime=Math.max(0,player.dashTime-dt);
let mx=joy.x+(keys.ArrowRight||keys.d?1:0)-(keys.ArrowLeft||keys.a?1:0),my=joy.y+(keys.ArrowDown||keys.s?1:0)-(keys.ArrowUp||keys.w?1:0),l=Math.hypot(mx,my);if(l>1){mx/=l;my/=l}DinoCombat.update(player,enemies,dt,burst,killEnemy);if(Math.hypot(mx,my)>.1){player.dx=mx;player.dy=my}
const boost=player.dashTime>0?3.5:1;player.x=clamp(player.x+mx*player.speed*boost*dt,-11400,11400);player.y=clamp(player.y+my*player.speed*boost*dt,-11400,11400);
spawnClock-=dt;if(spawnClock<=0&&enemies.length<Math.min(22,5+Math.floor(elapsed/18))){spawnEnemy();spawnClock=Math.max(.55,1.8-elapsed*.006)}
for(const e of enemies){e.hit=Math.max(0,(e.hit||0)-dt);e.alertCooldown=Math.max(0,(e.alertCooldown||0)-dt);const dx=player.x-e.x,dy=player.y-e.y,d=Math.hypot(dx,dy)||1,homeDistance=Math.hypot(e.x-(e.homeX??e.x),e.y-(e.homeY??e.y));e.wanderTimer-=dt;if(e.behavior==='hunter'){if(!e.alerted&&e.alertCooldown<=0&&d<185){e.alerted=true;e.alertTime=0}if(e.alerted){e.alertTime=(e.alertTime||0)+dt;if(d>300||homeDistance>230||e.alertTime>7){e.alerted=false;e.alertCooldown=6}else{e.x=clamp(e.x+dx/d*e.speed*dt,-11350,11350);e.y=clamp(e.y+dy/d*e.speed*dt,-11350,11350)}}else{if(e.wanderTimer<=0){e.wanderAngle=rand(0,Math.PI*2);e.wanderTimer=rand(1.5,3.8)}e.x=clamp(e.x+Math.cos(e.wanderAngle)*e.speed*.34*dt,-11350,11350);e.y=clamp(e.y+Math.sin(e.wanderAngle)*e.speed*.34*dt,-11350,11350)}}else if(e.behavior==='territorial'){if(!e.alerted&&e.alertCooldown<=0&&d<115){e.alerted=true;e.alertTime=0}if(e.alerted){e.alertTime=(e.alertTime||0)+dt;if(d>180||homeDistance>125||e.alertTime>4.5){e.alerted=false;e.alertCooldown=4}else{e.x+=dx/d*e.speed*dt;e.y+=dy/d*e.speed*dt}}else{if(e.wanderTimer<=0){e.wanderAngle+=rand(-1.7,1.7);e.wanderTimer=rand(1.2,3.2)}e.x=clamp(e.x+Math.cos(e.wanderAngle)*e.speed*.38*dt,-11350,11350);e.y=clamp(e.y+Math.sin(e.wanderAngle)*e.speed*.38*dt,-11350,11350)}}else{
if(!e.fleeing&&e.fleeCooldown<=0&&d<175){e.fleeing=true;e.fleeAngle=Math.atan2(e.y-player.y,e.x-player.x)+rand(-.28,.28)}
if(e.fleeing){
if(d>245){e.fleeing=false;e.fleeCooldown=3.2;e.wanderTimer=rand(.8,1.8)}
else{
const away=Math.atan2(e.y-player.y,e.x-player.x);
let delta=Math.atan2(Math.sin(away-e.fleeAngle),Math.cos(away-e.fleeAngle));
e.fleeAngle+=clamp(delta,-2.2*dt,2.2*dt);
const side=Math.sin(e.fleeAngle-away);
e.x+=(Math.cos(e.fleeAngle)*e.speed*1.35-side* Math.sin(e.fleeAngle)*e.speed*.18)*dt;
e.y+=(Math.sin(e.fleeAngle)*e.speed*1.35+side* Math.cos(e.fleeAngle)*e.speed*.18)*dt;
}
}else{
e.fleeCooldown=Math.max(0,e.fleeCooldown-dt);
if(e.wanderTimer<=0){e.wanderAngle+=rand(-1.15,1.15);e.wanderTimer=rand(1.8,4.2)}
e.vx=Math.cos(e.wanderAngle)*e.speed*.42;e.vy=Math.sin(e.wanderAngle)*e.speed*.42;
e.x=clamp(e.x+e.vx*dt,-11350,11350);e.y=clamp(e.y+e.vy*dt,-11350,11350);
}
}e.attack-=dt;if((e.hostile||e.alerted)&&d<player.r+e.r+3&&e.attack<=0&&player.invuln<=0){player.hp=Math.max(0,player.hp-Math.max(1,e.damage-player.armor));player.invuln=.55;e.attack=.9;shake=5;burst(player.x,player.y,'#e66d58',6);updateHud();if(player.hp<=0){endRun();return}}}
enemies=enemies.filter(e=>!e.dead);
for(const o of orbs){const dx=player.x-o.x,dy=player.y-o.y,d=Math.hypot(dx,dy);if(d<player.range*.72&&d>.001){o.x+=dx/d*220*dt;o.y+=dy/d*220*dt}if(d<player.r+o.r+4){o.got=true;gainXp(o.value)}}orbs=orbs.filter(o=>!o.got);
for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.t-=dt;p.vx*=.94;p.vy*=.94}particles=particles.filter(p=>p.t>0);decor.forEach(d=>{if(d.x-player.x>620)d.x-=1240;if(d.x-player.x< -620)d.x+=1240;if(d.y-player.y>780)d.y-=1560;if(d.y-player.y< -780)d.y+=1560})}
function loop(now){if(state!=='playing')return;const dt=Math.min(.033,(now-last)/1000||0);last=now;update(dt);if(state==='playing'){render();raf=requestAnimationFrame(loop)}}
function render(){window.Dino3D.render({player,enemies,orbs,time:worldTime,moveX:joy.x,moveY:joy.y});if(shake>0)shake=Math.max(0,shake-1)}
function loop(now){if(state!=='playing')return;const dt=Math.min(.033,(now-last)/1000||0);last=now;update(dt);if(state==='playing'){render();raf=requestAnimationFrame(loop)}}
function bindHold(id,fn){const el=$(id);el.addEventListener('pointerdown',e=>{e.preventDefault();fn();el.setPointerCapture?.(e.pointerId)})}
const joyEl=$('joystick'),stick=$('stick');function joyMove(e){const r=joyEl.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,dx=e.clientX-cx,dy=e.clientY-cy,max=42,l=Math.hypot(dx,dy),k=l>max?max/l:1;joy.x=dx*k/max;joy.y=dy*k/max;stick.style.transform='translate('+dx*k+'px,'+dy*k+'px)'}
joyEl.addEventListener('pointerdown',e=>{e.preventDefault();pointerId=e.pointerId;joy.active=true;joyEl.setPointerCapture(e.pointerId);joyMove(e)});joyEl.addEventListener('pointermove',e=>{if(joy.active&&e.pointerId===pointerId)joyMove(e)});function joyEnd(e){if(e.pointerId!==pointerId)return;joy.active=false;pointerId=null;joy.x=joy.y=0;stick.style.transform='translate(0,0)'}joyEl.addEventListener('pointerup',joyEnd);joyEl.addEventListener('pointercancel',joyEnd);
bindHold('specialBtn',special);bindHold('dashBtn',dash);$('pauseBtn').addEventListener('click',pause);$('resumeBtn').addEventListener('click',resume);$('menuBtn').addEventListener('click',()=>{state='menu';show('menu');$('pauseBtn').classList.add('hidden');saveProgress()});$('retryBtn').addEventListener('click',start);$('gameOverMenuBtn').addEventListener('click',()=>{state='menu';show('menu')});$('startBtn').addEventListener('click',start);$('continueBtn').addEventListener('click',()=>{renderProfile();show('profile')});$('closeProfile').addEventListener('click',()=>show('menu'));$('versionBtn').addEventListener('click',()=>show('changelog'));$('closeChangelog').addEventListener('click',()=>show('menu'));$('closeChangelogBtn').addEventListener('click',()=>show('menu'));
window.addEventListener('keydown',e=>{keys[e.key]=true;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();if(e.key==='Escape'||e.key==='p')pause();if(e.key===' '||e.key==='Shift')dash();if(e.key==='e'||e.key==='E')special()});window.addEventListener('keyup',e=>keys[e.key]=false);
$('continueBtn').classList.remove('hidden');
renderProfile();
show('menu');render();
})();