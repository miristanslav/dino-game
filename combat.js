/* Dino Game — natural close-combat system. No default ranged projectiles. */
(() => {
  'use strict';
  const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  window.DinoCombat={
    update(player,enemies,dt,burst,killEnemy){
      player.attackCooldown=Math.max(0,player.attackCooldown-dt);
      player.attackVisual=Math.max(0,player.attackVisual-dt);
      let target=null,nearest=150;
      for(const enemy of enemies){
        if(enemy.dead || enemy.hp<=0) continue;
        const d=distance(player,enemy);
        if(d<nearest){nearest=d;target=enemy}
      }
      if(!target) return null;
      const dx=target.x-player.x,dy=target.y-player.y,d=Math.hypot(dx,dy)||1;
      const angle=Math.atan2(dy,dx);
      if(d<=player.r+target.r+22&&player.attackCooldown<=0&&player.attackWindup<=0){
        player.attackCooldown=player.attackRate;
        player.attackWindup=.075;
        player.attackVisual=.24;
        player.attackAngle=angle;
      }
      if(player.attackWindup>0){
        player.attackWindup=Math.max(0,player.attackWindup-dt);
        if(player.attackWindup===0){
          for(const enemy of enemies){
            if(enemy.dead) continue;
            const ex=enemy.x-player.x,ey=enemy.y-player.y,ed=Math.hypot(ex,ey)||1;
            const facing=(ex/ed)*Math.cos(player.attackAngle)+(ey/ed)*Math.sin(player.attackAngle);
            if(ed<=player.r+enemy.r+30&&facing>.38){
              enemy.hp-=player.damage;
              enemy.hit=.2;
              enemy.x+=ex/ed*18;enemy.y+=ey/ed*18;
              burst(enemy.x,enemy.y,'#d8efa0',5);
              if(enemy.hp<=0) killEnemy(enemy);
            }
          }
        }
      }
      // Combat targeting and automatic attacks never steer the player.
      // Movement is controlled exclusively by the joystick or keyboard.
      return null;
    }
  };
})();