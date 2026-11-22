/* Dino Game — integrated low-poly 3D world renderer.
   Gameplay remains owned by game.js; this module only renders its live state. */
(() => {
  'use strict';
  const sourceCanvas = document.getElementById('gameCanvas');
  if (!sourceCanvas || !window.THREE) return;
  const THREE = window.THREE;
  const canvas = document.createElement('canvas');
  canvas.id = 'game3dCanvas';
  canvas.setAttribute('aria-hidden', 'true');
  sourceCanvas.parentNode.insertBefore(canvas, sourceCanvas.nextSibling);

  let renderer, scene, camera, ground, groundTiles=[], decorMeshes=[], actors=new Map();
  let width=innerWidth,height=innerHeight,ready=false,lastDecorKey='';
  const clock=new THREE.Clock();
  const mat=(color,roughness=.92)=>new THREE.MeshStandardMaterial({color,roughness,flatShading:true});
  const materials={
    ground:[mat('#294c31'),mat('#31583a'),mat('#355d3d'),mat('#28472f')],
    soil:mat('#3c5737'),fern:mat('#527b3e'),fernLight:mat('#79a653'),wood:mat('#594a32'),
    stone:mat('#69745e'),stoneLight:mat('#89927a'),eye:mat('#fff0c2'),pupil:mat('#172018'),
    player:mat('#83bd57'),playerLight:mat('#b0d878'),playerDark:mat('#527b3c'),belly:mat('#c7d99a'),
    grazer:mat('#9bbd72'),territorial:mat('#c0a06a'),hunter:mat('#bb7654'),brute:mat('#944f40'),
    claw:mat('#e5dfc4'),health:mat('#df6857'),xp:mat('#f5d77c'),leaf:mat('#426d3c')
  };
  const sphere=new THREE.SphereGeometry(1,8,6), cone=new THREE.ConeGeometry(1,1,5), box=new THREE.BoxGeometry(1,1,1);
  function mesh(geometry,material,parent,x=0,y=0,z=0,sx=1,sy=1,sz=1){
    const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
  }
  function makeDino(kind,isPlayer=false){
    const root=new THREE.Group(), body=new THREE.Group();root.add(body);
    const skin=isPlayer?materials.player:(kind==='grazer'?materials.grazer:kind==='territorial'?materials.territorial:kind==='brute'?materials.brute:materials.hunter);
    mesh(sphere,skin,body,0,.64,0,.72,.48,.42);
    mesh(sphere,isPlayer?materials.playerLight:skin,body,.42,.98,0,.27,.48,.25);
    mesh(sphere,skin,body,.76,1.3,0,.43,.3,.29);
    mesh(sphere,isPlayer?materials.playerLight:skin,body,1.02,1.18,0,.28,.17,.23);
    const tailPivot=new THREE.Group();tailPivot.position.set(-.48,.66,0);body.add(tailPivot);
    mesh(cone,skin,tailPivot,-.43,0,0,.2,.95,.2).rotation.z=-Math.PI/2;
    mesh(sphere,materials.belly,body,.05,.39,0,.48,.15,.34);
    for(let i=0;i<5;i++){
      const spike=mesh(cone,isPlayer?materials.playerLight:materials.claw,body,-.35+i*.19,1.08-Math.abs(i-2)*.035,0,.12,.28,.12);
      spike.rotation.z=Math.PI;
    }
    const eyeL=mesh(sphere,materials.eye,body,.93,1.39,-.205,.095,.105,.055);
    mesh(sphere,materials.pupil,body,.965,1.39,-.25,.043,.055,.028);
    mesh(sphere,materials.eye,body,.93,1.39,.205,.095,.105,.055);
    mesh(sphere,materials.pupil,body,.965,1.39,.25,.043,.055,.028);
    const legs=[],arms=[];
    for(const side of [-1,1]){
      const leg=new THREE.Group();leg.position.set(-.12,.48,side*.24);body.add(leg);
      mesh(sphere,skin,leg,0,-.18,0,.17,.34,.16);
      mesh(box,materials.claw,leg,.08,-.38,.025,.34,.09,.22);
      legs.push(leg);
      const armGroup=new THREE.Group();armGroup.position.set(.43,.67,side*.25);body.add(armGroup);
      const arm=mesh(sphere,skin,armGroup,0,-.04,0,.12,.23,.11);arm.rotation.z=-.35;
      arms.push(armGroup);
    }
    const healthGroup=new THREE.Group();root.add(healthGroup);
    const healthBack=mesh(new THREE.BoxGeometry(.8,.075,.04),materials.playerDark,healthGroup,0,1.95,0);
    const healthFill=mesh(new THREE.BoxGeometry(1,.055,.05),materials.health,healthGroup,0,1.96,.03);
    healthGroup.visible=false;
    return {root,body,legs,arms,tailPivot,healthGroup,healthFill,kind,isPlayer};
  }
  function addFern(x,z,s=1){
    const g=new THREE.Group();scene.add(g);g.position.set(x,0,z);g.scale.setScalar(s);
    mesh(box,materials.wood,g,0,.28,0,.07,.55,.07);
    for(let i=0;i<5;i++){
      const leaf=mesh(sphere,i%2?materials.fern:materials.fernLight,g,(i-2)*.16,.42+i*.035,0,.28,.055,.11);
      leaf.rotation.z=(i-2)*-.22;
      const leaf2=mesh(sphere,materials.fern,g,(i-2)*.16,.42+i*.035,.13,.22,.045,.09);
      leaf2.rotation.z=(i-2)*-.22;
    }
    decorMeshes.push({group:g,x,z});
  }
  function addRock(x,z,s=1){
    const g=new THREE.Group();scene.add(g);g.position.set(x,0,z);
    const rock=mesh(new THREE.DodecahedronGeometry(.42,0),materials.stone,g,0,.22,0,s,.55*s,.8*s);
    rock.rotation.set(.2,.5,.15);
    mesh(new THREE.DodecahedronGeometry(.18,0),materials.stoneLight,g,-.15,.48,-.1,s*.65,.45*s,s*.55);
    decorMeshes.push({group:g,x,z});
  }
  function init(){
    try{
      renderer=new THREE.WebGLRenderer({canvas,antialias:false,alpha:false,powerPreference:'low-power'});
      renderer.setPixelRatio(Math.min(1.5,window.devicePixelRatio||1));
      renderer.setSize(width,height,false);
      renderer.shadowMap.enabled=true;
      renderer.shadowMap.type=THREE.PCFSoftShadowMap;
      renderer.outputColorSpace=THREE.SRGBColorSpace;
      renderer.toneMapping=THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure=1.12;
      scene=new THREE.Scene();scene.background=new THREE.Color('#263f2c');scene.fog=new THREE.FogExp2('#263f2c',.026);
      camera=new THREE.PerspectiveCamera(43,width/height,.1,120);
      camera.position.set(0,19,17);camera.lookAt(0,0,0);
      const hemi=new THREE.HemisphereLight('#d9edc4','#263b29',2.0);scene.add(hemi);
      const sun=new THREE.DirectionalLight('#fff0c8',2.25);sun.position.set(-9,18,10);sun.castShadow=true;
      sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-22;sun.shadow.camera.right=22;sun.shadow.camera.top=22;sun.shadow.camera.bottom=-22;sun.shadow.bias=-.0004;scene.add(sun);
      ground=new THREE.Group();scene.add(ground);
      const tileGeo=new THREE.PlaneGeometry(8,8);
      for(let z=-4;z<=4;z++)for(let x=-4;x<=4;x++){
        const m=new THREE.Mesh(tileGeo,materials.ground[0]);
        m.userData={ox:x,oz:z};m.rotation.x=-Math.PI/2;m.position.set(x*8,-.035,z*8);m.receiveShadow=true;ground.add(m);groundTiles.push(m);
      }
      const ambientPatch=mesh(new THREE.CircleGeometry(2.2,12),materials.soil,scene,0,-.02,0,1,1,1);
      ambientPatch.rotation.x=-Math.PI/2;ambientPatch.material=materials.soil;ambientPatch.material.transparent=true;ambientPatch.material.opacity=.13;ambientPatch.receiveShadow=true;
      for(let i=0;i<46;i++){
        const a=i*2.399,d=4.5+(i%9)*1.8,x=Math.cos(a)*d,z=Math.sin(a)*d;
        if(i%3===0)addRock(x,z,.65+(i%4)*.15);else addFern(x,z,.65+(i%5)*.14);
      }
      ready=true;sourceCanvas.style.visibility='hidden';resize();
    }catch(err){console.warn('3D renderer unavailable; keeping 2D fallback.',err);canvas.remove();}
  }
  function resize(){
    width=innerWidth;height=innerHeight;
    if(!ready||!renderer)return;
    renderer.setPixelRatio(Math.min(1.5,window.devicePixelRatio||1));renderer.setSize(width,height,false);
    camera.aspect=width/height;camera.updateProjectionMatrix();
  }
  function actor(id,kind,isPlayer=false){
    let a=actors.get(id);if(a)return a;
    a=makeDino(kind,isPlayer);scene.add(a.root);actors.set(id,a);return a;
  }
  function render(data){
    if(!ready)return;
    const p=data.player||{x:0,y:0,dx:1,dy:0};
    const px=p.x||0,pz=p.y||0,unit=.035;
    const aspect=width/Math.max(1,height),portraitZoom=aspect<1.15?Math.min(1.78,1+(1.15-aspect)*1.05):1;
    camera.position.set(0,18.5*portraitZoom,16.5*portraitZoom);camera.lookAt(0,0,0);
    const worldX=px*unit,worldZ=pz*unit,baseTileX=Math.floor(worldX/8),baseTileZ=Math.floor(worldZ/8);
    for(const tile of groundTiles){const tx=baseTileX+tile.userData.ox,tz=baseTileZ+tile.userData.oz;let hash=(tx*374761393+tz*668265263)|0;hash=(hash^(hash>>>13))*1274126177;hash=(hash^(hash>>>16))>>>0;tile.material=materials.ground[hash%materials.ground.length];tile.position.set(tx*8-worldX,-.035,tz*8-worldZ);}
    for(const d of decorMeshes){
      const wrap=(v,span)=>((v+span/2)%span+span)%span-span/2;
      d.group.position.set(wrap(d.x-px*unit,44),0,wrap(d.z-pz*unit,44));
    }
    // Re-center a persistent jungle set around the moving player; avoid creating objects per frame.
    const playerActor=actor('player','player',true);
    playerActor.root.position.set(0,0,0);
    playerActor.root.rotation.y=-Math.atan2(p.dy||0,p.dx||1);
    const moving=Math.hypot(data.moveX||0,data.moveY||0)>.08;
    const playerPhase=data.time*10.5;
    const playerStride=moving?Math.sin(playerPhase):0;
    playerActor.body.position.y=moving?Math.abs(Math.sin(playerPhase))*.045:Math.sin(data.time*1.8)*.008;
    playerActor.body.rotation.z=moving?Math.sin(playerPhase*2)*.018:Math.sin(data.time*1.3)*.008;
    playerActor.legs.forEach((leg,i)=>{leg.rotation.z=playerStride*(i===0?-.48:.48);});
    playerActor.arms.forEach((arm,i)=>{arm.rotation.z=playerStride*(i===0?.16:-.16);});
    playerActor.tailPivot.rotation.y=Math.sin(data.time*4.2)*.13;
    const active=new Set(['player']);
    for(let i=0;i<(data.enemies||[]).length;i++){
      const e=data.enemies[i],id='enemy'+i;active.add(id);
      const a=actor(id,e.brute?'brute':e.behavior,false);
      a.root.visible=true;a.root.position.set((e.x-px)*unit,0,(e.y-pz)*unit);
      const dx=px-e.x,dy=pz-e.y;a.root.rotation.y=-Math.atan2(dy,dx);
      const enemyMoving=!!(e.alerted||e.hostile||e.fleeing);
      const gait=data.time*(enemyMoving?8.5:2.2)+i*.7;
      a.body.position.y=e.hit>0?.06:enemyMoving?Math.abs(Math.sin(gait))*.025:Math.sin(gait)*.008;
      a.body.rotation.z=e.hit>0?-.035:Math.sin(gait*.5)*.008;
      a.legs.forEach((leg,j)=>{leg.rotation.z=enemyMoving?Math.sin(gait+j*Math.PI)*.34:Math.sin(gait+j*Math.PI)*.025;});
      a.arms.forEach((arm,j)=>{arm.rotation.z=enemyMoving?Math.sin(gait+j*Math.PI)*.12:0;});
      a.tailPivot.rotation.y=Math.sin(gait*.55)*.11;
      if(e.hostile||e.alerted||e.hit>0){
        const ratio=Math.max(0,Math.min(1,e.hp/e.maxHp));
        a.healthFill.scale.x=ratio;
        a.healthFill.position.x=-.4+.4*ratio;
        a.healthGroup.visible=true;
      }else a.healthGroup.visible=false;
    }
    for(const [id,a] of actors){if(id!=='player'&&!active.has(id)){scene.remove(a.root);actors.delete(id);}}
    for(let i=0;i<(data.orbs||[]).length;i++){
      const o=data.orbs[i],id='orb'+i;active.add(id);let orb=actors.get(id);
      if(!orb){const group=new THREE.Group();mesh(new THREE.IcosahedronGeometry(.16,1),materials.xp,group);scene.add(group);orb={root:group};actors.set(id,orb);}
      orb.root.position.set((o.x-px)*unit,.3+Math.sin(data.time*5+i)*.08,(o.y-pz)*unit);orb.root.rotation.y=data.time*2;
    }
    for(const [id,a] of actors){if(id.startsWith('orb')&&!active.has(id)){scene.remove(a.root);actors.delete(id);}}
    renderer.render(scene,camera);
  }
  window.addEventListener('resize',resize);
  window.Dino3D={render,resize,get ready(){return ready;}};
  if(window.THREE) init();
})();