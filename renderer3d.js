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

  let renderer, scene, camera, ground, worldRoot, decorMeshes=[], actors=new Map();
  let width=innerWidth,height=innerHeight,ready=false;
  const MAP_HALF=420, MAP_LIMIT=11400, WORLD_UNIT=.035;
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
    const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=false;m.receiveShadow=false;parent.add(m);return m;
  }
  function makeDino(kind,isPlayer=false){
    const root=new THREE.Group(), body=new THREE.Group();root.add(body);
    const skin=isPlayer?materials.player:(kind==='grazer'?materials.grazer:kind==='territorial'?materials.territorial:kind==='brute'?materials.brute:materials.hunter);
    mesh(sphere,skin,body,0,.64,0,.72,.48,.42);
    const neck=mesh(sphere,isPlayer?materials.playerLight:skin,body,.42,.98,0,.27,.48,.25);
    const head=mesh(sphere,skin,body,.76,1.3,0,.43,.3,.29);
    const snout=mesh(sphere,isPlayer?materials.playerLight:skin,body,1.02,1.18,0,.28,.17,.23);
    const tailPivot=new THREE.Group();tailPivot.position.set(-.48,.66,0);body.add(tailPivot);
    mesh(cone,skin,tailPivot,-.43,0,0,.2,.95,.2).rotation.z=-Math.PI/2;
    mesh(sphere,materials.belly,body,.05,.39,0,.48,.15,.34);
    for(let i=0;i<5;i++){
      const spike=mesh(cone,isPlayer?materials.playerLight:materials.claw,body,-.35+i*.19,1.08-Math.abs(i-2)*.035,0,.12,.28,.12);
      spike.rotation.z=Math.PI;
    }
    // Give each species a readable silhouette instead of relying on color alone.
    if(!isPlayer){
      if(kind==='grazer'){
        body.scale.set(1.12,1.02,1.05);
        neck.scale.set(.24,.55,.24);
        head.scale.set(.34,.25,.25);
        snout.scale.set(.25,.14,.19);
        for(const side of [-1,1]){
          const horn=mesh(cone,materials.claw,body,.83,1.48,side*.17,.075,.2,.075);
          horn.rotation.z=-.32;
        }
      }else if(kind==='territorial'){
        body.scale.set(1.04,1.04,1.06);
        head.scale.set(.46,.32,.34);
        for(const side of [-1,1]){
          const horn=mesh(cone,materials.claw,body,.98,1.48,side*.22,.095,.27,.09);
          horn.rotation.z=-Math.PI/2.8;
        }
      }else if(kind==='hunter'){
        body.scale.set(1.12,.9,.92);
        neck.scale.set(.24,.42,.22);
        head.scale.set(.48,.25,.24);
        snout.scale.set(.34,.12,.17);
        const jaw=mesh(sphere,materials.belly,body,1.04,1.08,0,.27,.055,.17);
        jaw.rotation.z=-.08;
      }else if(kind==='brute'){
        body.scale.set(1.24,1.12,1.15);
        head.scale.set(.49,.36,.37);
        snout.scale.set(.32,.2,.27);
        for(const side of [-1,1]){
          const brow=mesh(sphere,skin,body,.83,1.52,side*.2,.24,.12,.16);
          brow.rotation.z=-.12;
          const tusk=mesh(cone,materials.claw,body,1.08,1.12,side*.2,.085,.22,.08);
          tusk.rotation.z=-Math.PI/2;
        }
      }
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
    body.traverse(node=>{if(node.isMesh)node.castShadow=true;});
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
  function hash2(x,z){let n=(Math.imul(x|0,374761393)+Math.imul(z|0,668265263))|0;n=Math.imul(n^(n>>>13),1274126177);return (n^(n>>>16))>>>0;}
  function riverCenter(x){return Math.sin(x*.0085)*48+Math.sin(x*.019)*13-18;}
  function terrainHeight(x,z){
    const broad=Math.sin(x*.012)*.65+Math.cos(z*.014)*.52+Math.sin((x+z)*.009)*.38;
    const ridgeA=Math.max(0,1-Math.abs(z-(145+Math.sin(x*.012)*24))/72);
    const ridgeB=Math.max(0,1-Math.abs(z-(-205+Math.cos(x*.01)*18))/58);
    const river=Math.abs(z-riverCenter(x));
    return broad+ridgeA*2.1+ridgeB*1.45-Math.max(0,1-river/10)*.34;
  }
  function makeTerrain(){
    const segments=168,size=MAP_HALF*2,positions=[],colors=[],indices=[];
    const low=new THREE.Color('#304d32'),mid=new THREE.Color('#456b3d'),high=new THREE.Color('#68734a'),bank=new THREE.Color('#786d4b');
    for(let iz=0;iz<=segments;iz++)for(let ix=0;ix<=segments;ix++){
      const x=-MAP_HALF+size*ix/segments,z=-MAP_HALF+size*iz/segments,h=terrainHeight(x,z);
      positions.push(x,h,z);
      const riverDist=Math.abs(z-riverCenter(x));
      const t=THREE.MathUtils.clamp((h+1.8)/5,0,1);
      const c=low.clone().lerp(mid,t*.72).lerp(high,Math.max(0,t-.55)*.65);
      if(riverDist<15)c.lerp(bank,Math.max(0,1-riverDist/15)*.55);
      const variation=(hash2(ix,iz)%100)/1000;c.offsetHSL(0,0,variation-.045);
      colors.push(c.r,c.g,c.b);
      if(ix<segments&&iz<segments){const a=iz*(segments+1)+ix,b=a+1,c0=a+segments+1,d=c0+1;indices.push(a,c0,b,b,c0,d);}
    }
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.setIndex(indices);g.computeVertexNormals();
    ground=new THREE.Mesh(g,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,flatShading:true}));ground.receiveShadow=true;worldRoot.add(ground);
  }
  function makeRiver(){
    const positions=[],indices=[],steps=180;
    for(let i=0;i<=steps;i++){const x=-MAP_HALF+i*(MAP_HALF*2/steps),z=riverCenter(x),w=7.5+Math.sin(i*.19)*1.1,y=terrainHeight(x,z)+.12;positions.push(x,y,z-w,x,y,z+w);if(i<steps){const a=i*2;indices.push(a,a+1,a+2,a+1,a+3,a+2);}}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();
    const water=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:'#477f83',roughness:.42,metalness:.08,side:THREE.DoubleSide}));worldRoot.add(water);
    const lake=new THREE.Mesh(new THREE.CircleGeometry(24,40),new THREE.MeshStandardMaterial({color:'#477f83',roughness:.4,metalness:.08}));lake.rotation.x=-Math.PI/2;lake.position.set(128,terrainHeight(128,-128)+.13,-128);lake.scale.set(1.35,.78,1);worldRoot.add(lake);
  }
  function makeForest(){
    const trunkGeo=new THREE.CylinderGeometry(.16,.25,1.9,5),crownGeo=new THREE.ConeGeometry(1.15,2.9,6),trunkMat=mat('#594832'),crownMats=[mat('#345b35'),mat('#416b3b'),mat('#4b7540')];
    const centers=[[-280,-245,115],[-115,-250,100],[235,-255,115],[-300,30,105],[290,35,110],[-210,260,95],[80,270,105],[300,245,95],[-15,-55,70],[205,155,65]];
    const treeData=[],rocks=[];
    for(let i=0;i<420;i++){
      const h=hash2(i,71),angle=(h%100000)/100000*Math.PI*2,rad=18+((h>>>8)%10000)/10000*105;
      const ci=centers[i%centers.length],x=ci[0]+Math.cos(angle)*rad,z=ci[1]+Math.sin(angle)*rad;
      if(Math.hypot(x,z)>MAP_HALF-18||Math.abs(z-riverCenter(x))<17)continue;
      const clearings=[[-30,-25,47],[130,-125,35],[-210,125,34],[250,170,32]];
      if(clearings.some(c=>Math.hypot(x-c[0],z-c[1])<c[2]))continue;
      treeData.push({x,z,scale:.72+((h>>>19)%1000)/1000*.75,variant:(h>>>4)%3});
    }
    const dummy=new THREE.Object3D();
    const trunkBatch=new THREE.InstancedMesh(trunkGeo,trunkMat,treeData.length);
    const crownBatches=crownMats.map(m=>new THREE.InstancedMesh(crownGeo,m,treeData.filter(t=>t.variant===crownMats.indexOf(m)).length));
    const crownCounts=[0,0,0];
    for(const t of treeData){
      const y=terrainHeight(t.x,t.z);dummy.position.set(t.x,y+.9*t.scale,t.z);dummy.scale.setScalar(t.scale);dummy.rotation.set(0,0,0);dummy.updateMatrix();trunkBatch.setMatrixAt(crownCounts.reduce((a,b)=>a+b,0),dummy.matrix);
      dummy.position.set(t.x,y+2.65*t.scale,t.z);dummy.updateMatrix();const batch=crownBatches[t.variant];batch.setMatrixAt(crownCounts[t.variant]++,dummy.matrix);
    }
    trunkBatch.instanceMatrix.needsUpdate=true;worldRoot.add(trunkBatch);
    for(const batch of crownBatches){batch.instanceMatrix.needsUpdate=true;worldRoot.add(batch);}
    const rockGeo=new THREE.DodecahedronGeometry(1,0),rockMat=materials.stone;
    const rockBatch=new THREE.InstancedMesh(rockGeo,rockMat,95),rockDummy=new THREE.Object3D();let rockCount=0;
    for(let i=0;i<95;i++){
      const h=hash2(i,991),x=-MAP_HALF+((h%100000)/100000)*(MAP_HALF*2),z=-MAP_HALF+(((h>>>8)%100000)/100000)*(MAP_HALF*2);
      if(Math.abs(z-riverCenter(x))<18)continue;
      const sc=.8+((h>>>18)%1000)/1000*2.1;rockDummy.position.set(x,terrainHeight(x,z)+sc*.28,z);rockDummy.scal    const ridgeBatch=new THREE.InstancedMesh(rockGeo,rockMat,180),ridgeDummy=new THREE.Object3D();
    for(let i=0;i<180;i++){
      const a=i/180*Math.PI*2,x=Math.cos(a)*(MAP_HALF-9),z=Math.sin(a)*(MAP_HALF-9),sc=3.5+(hash2(i,414)%1000)/1000*5;
      ridgeDummy.position.set(x,terrainHeight(x,z)+sc*.32,z);ridgeDummy.scale.set(sc,sc*1.1,sc*1.25);ridgeDummy.rotation.set(0,a,0);ridgeDummy.updateMatrix();ridgeBatch.setMatrixAt(i,ridgeDummy.matrix);
    }
    ridgeBatch.instanceMatrix.needsUpdate=true;worldRoot.add(ridgeBatch);
  }
  function isMobile(){return window.matchMedia('(max-width: 700px), (pointer: coarse)').matches;}
  function init(){
    try{
      renderer=new THREE.WebGLRenderer({canvas,antialias:false,alpha:false,powerPreference:'low-power'});
      renderer.setPixelRatio(Math.min(isMobile()?1.25:1.5,window.devicePixelRatio||1));
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
      sun.shadow.mapSize.set(isMobile()?512:1024,isMobile()?512:1024);sun.shadow.camera.left=-22;sun.shadow.camera.right=22;sun.shadow.camera.top=22;sun.shadow.camera.bottom=-22;sun.shadow.bias=-.0004;scene.add(sun);
      worldRoot=new THREE.Group();scene.add(worldRoot);
      makeTerrain();
      makeRiver();
      makeForest();
      ready=true;sourceCanvas.style.visibility='hidden';resize();
    }catch(err){console.warn('3D renderer unavailable; keeping 2D fallback.',err);canvas.remove();}
  }
  function resize(){
    width=innerWidth;height=innerHeight;
    if(!ready||!renderer)return;
    renderer.setPixelRatio(Math.min(isMobile()?1.25:1.5,window.devicePixelRatio||1));renderer.setSize(width,height,false);
    camera.aspect=width/height;camera.updateProjectionMatrix();
  }
  function actor(id,kind,isPlayer=false){
    let a=actors.get(id);if(a)return a;
    a=makeDino(kind,isPlayer);scene.add(a.root);actors.set(id,a);return a;
  }
  function render(data){
    if(!ready)return;
    const p=data.player||{x:0,y:0,dx:1,dy:0};
    const px=p.x||0,pz=p.y||0,unit=WORLD_UNIT;
    worldRoot.position.set(-px*unit,0,-pz*unit);
    const aspect=width/Math.max(1,height),portraitZoom=aspect<1.15?Math.min(1.78,1+(1.15-aspect)*1.05):1;
    camera.position.set(0,18.5*portraitZoom,16.5*portraitZoom);camera.lookAt(0,0,0);
    // Re-center a persistent jungle set around the moving player; avoid creating objects per frame.
    const playerActor=actor('player','player',true);
    playerActor.root.position.set(0,terrainHeight(px*unit,pz*unit),0);
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
      const e=data.enemies[i],id='enemy'+(e.id??i);active.add(id);
      const a=actor(id,e.brute?'brute':e.behavior,false);
      a.root.visible=true;a.root.position.set((e.x-px)*unit,terrainHeight(e.x*unit,e.y*unit),(e.y-pz)*unit);
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
    for(const [id,a] of actors){if(id.startsWith('enemy')&&!active.has(id)){scene.remove(a.root);actors.delete(id);}}
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