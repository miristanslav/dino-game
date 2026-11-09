function getDinoColors() { return SKINS.find(s => s.id === save.currentSkin) || SKINS[0]; }

function uRect(u, v, w, h, color, scale) {
  if (scale === undefined) scale = dino.scale;
  ctx.fillStyle = color;
  ctx.fillRect(u * scale, v * scale, w * scale, h * scale);
}

function drawTRexStanding(phase, dead, scale) {
  if (scale === undefined) scale = dino.scale;
  const c = getDinoColors();
  const step = ((Math.floor(phase) % 12) + 12) % 12;
  // Eight evenly spaced poses make the stride smoother while preserving the approved silhouette.
  // Two alternating steps per 12-phase cycle: the body is lowest when
  // the legs are maximally split (phases 0 and 6), and highest as they pass
  // close together beneath the pelvis (phases 3 and 9).
  const bob = dead ? 0 : [0.72,0.48,0.12,-0.42,-0.58,-0.24,0.72,0.48,0.12,-0.42,-0.58,-0.24][step];
  const tailLift = dead ? 0 : [0.34,0.22,0.06,-0.18,-0.25,-0.10,0.34,0.22,0.06,-0.18,-0.25,-0.10][step];

  const poly = (points, fill) => {
    ctx.beginPath();
    ctx.moveTo(points[0][0] * scale, points[0][1] * scale);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0] * scale, points[i][1] * scale);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
  };
  const line = (points, color, width) => {
    ctx.beginPath();
    ctx.moveTo(points[0][0] * scale, points[0][1] * scale);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0] * scale, points[i][1] * scale);
    ctx.strokeStyle = color;
    ctx.lineWidth = width * scale;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  };

  // Articulate the original hind-leg artwork without redrawing its anatomy.
  // Every contour below uses the same control points as the approved Patch 90 leg.
  const drawArticulatedLeg = (phase, far) => {
    // One complete stride: the foot reaches forward, plants, pushes backward,
    // then folds and swings forward again. Positive hip rotation moves the knee
    // backward in screen space, so the cycle begins in the forward-swing position.
    // The opposite leg uses phase + 6, keeping the two legs in counterphase.
    const poses = [
      [-0.30, 0.34,-0.20],
      [-0.27, 0.40,-0.24],
      [-0.18, 0.32,-0.18],
      [-0.05, 0.18,-0.08],
      [ 0.12,-0.04, 0.08],
      [ 0.25,-0.22, 0.18],
      [ 0.30,-0.30, 0.20],
      [ 0.25,-0.22, 0.14],
      [ 0.12,-0.04, 0.02],
      [-0.05, 0.18,-0.10],
      [-0.18, 0.32,-0.18],
      [-0.27, 0.40,-0.22]
    ];
    const strideStep=((Math.floor(phase)%12)+12)%12;
    const [hipAngle,kneeAngle,ankleAngle]=poses[strideStep];
    // The planted foot travels backward relative to the pelvis during stance;
    // the quick return arc lifts it and carries it forward for the next contact.
    const footTravel=[2.4,1.8,1.1,0.3,-0.6,-1.5,-2.1,-1.6,-0.3,1.0,2.0,2.5][strideStep];
    const footLift=[0,0,0,0,0,0,0.08,0.62,1.28,1.48,1.02,0.38][strideStep];
    const map=p=>far?[18.9+(p[0]-24)*0.90,29.5+(p[1]-29.5)*0.98]:[p[0],p[1]];
    const rotate=(p,pivot,a)=>{
      const x=p[0]-pivot[0],y=p[1]-pivot[1],co=Math.cos(a),si=Math.sin(a);
      return [pivot[0]+x*co-y*si,pivot[1]+x*si+y*co];
    };
    const smooth=(a,b,v)=>{
      const t=Math.max(0,Math.min(1,(v-a)/(b-a)));
      return t*t*(3-2*t);
    };
    const hip=map([22,18]), knee=map([25.0,21.5]), hock=map([22.4,25.8]);
    const kneeAfterHip=rotate(knee,hip,hipAngle);
    const hockAfterHip=rotate(hock,hip,hipAngle);
    const hockAfterKnee=rotate(hockAfterHip,kneeAfterHip,kneeAngle);
    // Subdivide only the straight edges already present in the approved paths.
    // At zero joint angles this is geometrically identical to the original polygons.
    const smoothPath=points=>{
      const out=[];
      for(let i=0;i<points.length;i++){
        const a=points[i],b=points[(i+1)%points.length];
        for(let j=0;j<6;j++){
          const t=j/6;
          out.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]);
        }
      }
      return out;
    };
    const deform=source=>{
      const p=map(source);
      const afterHip=rotate(p,hip,hipAngle);
      const kneeWeight=smooth(20.5,25.5,source[1]);
      const afterKnee=rotate(afterHip,kneeAfterHip,kneeAngle*kneeWeight);
      const ankleWeight=smooth(25.5,28.5,source[1]);
      const articulated=rotate(afterKnee,hockAfterKnee,ankleAngle*ankleWeight);
      // Keep the toe/foot trajectory distinct from a simple knee lift:
      // planted phases sweep rearward; swing phases rise and recover forward.
      const footWeight=smooth(23.5,27.5,source[1]);
      return [
        articulated[0]+footTravel*footWeight,
        articulated[1]-footLift*footWeight
      ];
    };
    const drawPoly=(points,fill)=>poly(smoothPath(points).map(deform),fill);
    const drawLine=(points,color,width)=>line(smoothPath(points).map(deform),color,width);
    const outline=[[18.2,16.5],[20.8,15.9],[23.8,16.0],[25.7,17.0],[26.7,18.5],[26.9,19.9],[26.3,21.2],[25.4,22.0],[24.7,23.0],[24.0,24.0],[23.4,25.0],[22.7,25.9],[21.7,26.2],[21.3,25.6],[21.8,24.5],[22.5,23.2],[22.5,22.1],[20.6,21.0],[19.0,19.6],[18.0,18.1]];
    const inner=[[19.0,17.1],[21.2,16.6],[23.7,16.7],[25.2,17.6],[26.0,18.8],[26.1,19.9],[25.5,21.0],[24.7,21.8],[24.0,22.9],[23.3,24.1],[22.7,25.2],[22.0,25.6],[21.8,25.2],[22.4,24.0],[23.1,22.6],[22.8,21.8],[20.9,20.7],[19.5,19.4],[18.7,18.1]];
    const calf=[[25.2,20.4],[26.1,20.8],[25.8,22.0],[25.1,22.9],[24.5,24.0],[23.9,25.1],[23.1,26.0],[22.1,26.1],[21.9,25.7],[22.5,24.8],[23.2,23.7],[23.9,22.5],[24.5,21.5]];
    const metatarsus=[[21.6,25.5],[22.5,25.3],[23.2,25.9],[24.1,26.7],[25.2,27.5],[26.4,28.4],[27.2,29.2],[27.3,29.7],[26.7,30],[25.8,29.8],[24.9,30],[24.0,29.8],[23.1,29.6],[22.1,28.9],[21.3,27.9],[20.9,26.8]];
    const metatarsusInner=[[22.2,25.8],[22.8,25.8],[23.4,26.5],[24.3,27.2],[25.4,28.0],[26.5,28.9],[26.8,29.3],[26.2,29.3],[25.2,29.0],[24.3,28.7],[23.4,28.1],[22.5,27.3],[21.7,26.5]];
    const toeOutline=[[25.0,28.3],[26.4,28.6],[27.8,29.1],[28.4,29.6],[28.3,29.9],[27.7,30],[26.7,29.8],[25.8,30],[24.9,29.8],[24.5,29.2]];
    const toeInner=[[25.5,28.7],[26.5,28.9],[27.5,29.3],[27.8,29.6],[27.1,29.6],[26.1,29.8],[25.2,29.5]];
    drawPoly(outline,c.outline); drawPoly(inner,c.body); drawPoly(calf,c.body);
    drawLine([[25.4,21.1],[24.7,22.5],[24.0,23.9],[23.1,25.2],[22.2,25.8]],c.belly,0.6);
    drawPoly(metatarsus,c.outline); drawPoly(metatarsusInner,c.body);
    drawLine([[23.3,27.0],[24.5,27.9],[25.8,28.8]],c.belly,0.5);
    drawPoly(toeOutline,c.outline); drawPoly(toeInner,c.body);
    drawPoly([[27.6,29.1],[28.5,29.5],[28.9,29.9],[28.8,30],[28.0,29.8]],c.claw);
    drawPoly([[25.4,29.1],[26.3,29.4],[26.7,29.9],[26.6,30],[25.8,29.8]],c.claw);
    drawPoly([[24.0,28.7],[24.8,29.1],[25.1,29.6],[25.0,29.8],[24.3,29.5]],c.claw);
  };
  // Tail: preserve the approved silhouette and lift it slightly to follow the spine.
  // A small vertical offset adjusts its placement without changing the approved proportions.
  const tailY = tailLift - 0.95;
  const tailPath = (fill, commands) => {
    ctx.beginPath();
    ctx.moveTo(commands[0][0] * scale, commands[0][1] * scale);
    for (let i = 1; i < commands.length; i++) {
      const p = commands[i];
      if (p[0] === 'Q') ctx.quadraticCurveTo(p[1] * scale, p[2] * scale, p[3] * scale, p[4] * scale);
      else ctx.lineTo(p[0] * scale, p[1] * scale);
    }
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
  };
  tailPath(c.outline, [
    [19,14.2+tailY],
    ['Q',15,14.5+tailY,11,15.8+tailY],
    ['Q',6,17.1+tailY,0,17.9+tailY],
    ['Q',-5,18.6+tailY,-10,18.9+tailY],
    ['Q',-12,19.35+tailY,-11.2,19.85+tailY],
    ['Q',-8.5,20.65+tailY,-3,20.85+tailY],
    ['Q',5,21.4+tailY,11,20.6+tailY],
    ['Q',16,19.9+tailY,20,19.35+tailY],
    ['Q',22,17.2+tailY,19,14.2+tailY]
  ]);
  tailPath(c.body, [
    [17.5,15+tailY],
    ['Q',13,15.5+tailY,8,16.8+tailY],
    ['Q',2,18.1+tailY,-4,18.7+tailY],
    ['Q',-10.1,19.55+tailY,-9.8,19.95+tailY],
    ['Q',-7.5,20.35+tailY,-3,20.55+tailY],
    ['Q',5,20.4+tailY,11,19.7+tailY],
    ['Q',15.5,19.2+tailY,19,18.7+tailY],
    [17.5,15+tailY]
  ]);
  // Subtle underside shading follows the same curve and preserves the existing skin palette.
  tailPath(c.belly, [
    [5,18.5+tailY],
    ['Q',10,17.9+tailY,15,17.8+tailY],
    ['Q',17,18+tailY,18,18.2+tailY],
    ['Q',13,19.5+tailY,8,20+tailY],
    ['Q',3,20.5+tailY,-1,20.5+tailY],
    ['Q',2,18.9+tailY,5,18.5+tailY]
  ]);
  // Restore the dark-green dorsal ridge line, matching the spine contour on the torso.
  line([[4,17.5+tailY],[8,16.7+tailY],[12,15.8+tailY],[16,15.1+tailY]], c.outline, 0.55);

  // Original far-leg artwork, articulated behind the torso.
  drawArticulatedLeg(phase, true);

  // The pelvis and torso shift subtly over the supporting leg to transfer weight.
  const bodyShift=[-0.28,-0.18,-0.02,0.16,0.27,0.20,0.02,-0.16,-0.27,-0.18,0.02,0.22][step];
  ctx.translate((dead?0:bodyShift)*scale,0);

  // Main torso: elongated, muscular rib cage with a lifted belly and a defined chest.
  // The silhouette is deliberately asymmetrical: sloping back, deep chest, tighter waist.
  poly([[12,17+bob],[13.5,14.2+bob],[17,11.8+bob],[21,9.8+bob],[25,9.3+bob],[28,10.2+bob],[30.5,12.5+bob],[32,15.5+bob],[31,18.5+bob],[28.5,20.2+bob],[24.5,20.8+bob],[20.5,20.2+bob],[16.5,19.3+bob],[13,18.5+bob]], c.outline);
  poly([[13.2,16.7+bob],[15,14.2+bob],[18,12.2+bob],[21.5,10.8+bob],[25,10.3+bob],[27.8,11.1+bob],[29.8,13.1+bob],[30.8,15.7+bob],[30,18+bob],[27.8,19.2+bob],[24.5,19.7+bob],[20.5,19.2+bob],[17,18.5+bob],[14.2,18+bob]], c.body);

  // Broaden the body-colour bridge at the pelvis so the tail root disappears into the torso.
  // It masks the former internal edge without changing the approved outer tail silhouette.
  poly([[11.8,14.35+bob],[13.4,13.55+bob],[15.8,13.45+bob],[18.0,13.85+bob],[19.7,14.65+bob],[20.0,16.15+bob],[19.7,18.45+bob],[17.0,19.0+bob],[14.0,18.45+bob],[12.0,17.15+bob]], c.body);
  // The back contour now flows continuously from the torso onto the raised tail root.
  line([[13.5,14.2+bob],[15.1,13.9+bob],[16.8,13.55+bob],[18.4,13.35+tailY],[19.7,13.45+tailY]], c.outline, 0.8);

  // Subtle planes describe the shoulder, rib cage and underside without a round belly.
  poly([[21.5,11+bob],[25,10.5+bob],[28,11.6+bob],[30,14.1+bob],[29.5,16.5+bob],[27,17.2+bob],[24,15.8+bob],[22,13.8+bob]], c.body);
  poly([[15,15.2+bob],[17.5,12.9+bob],[20.5,11.7+bob],[22.5,12.5+bob],[20.5,15.2+bob],[17.5,16.8+bob]], c.belly);
  poly([[17,17.1+bob],[20,16.2+bob],[23,16.8+bob],[26.5,16.6+bob],[29.5,16.2+bob],[28.5,18.2+bob],[25.5,19.1+bob],[22,19.1+bob],[18.5,18.5+bob]], c.belly);
  line([[16.2,15.1+bob],[18.5,13.3+bob],[21,12.5+bob]], c.body, 0.8);
  line([[18.5,18+bob],[21.5,18.4+bob],[24.5,18.2+bob]], c.body, 0.65);

  // Original foreground leg artwork, six phases out of step with the far leg.
  drawArticulatedLeg(dead ? 0 : phase + 6, false);

  // Neck extended upward and forward to support the repositioned skull.
  poly([[25,13+bob],[26,10+bob],[29,7.8+bob],[32,7+bob],[34.8,8.2+bob],[36,11.2+bob],[34,14.8+bob],[29,16+bob],[26,15+bob]], c.outline);
  poly([[26,13+bob],[27.5,10.5+bob],[30,8.4+bob],[32.7,7.8+bob],[34.2,8.8+bob],[35,11.4+bob],[33,14+bob],[29,15+bob],[27,14.5+bob]], c.body);
  // Broad rounded body-colour blend hides the neck/chest overlap seam.
  ctx.beginPath();
  ctx.moveTo(24.7*scale,12.95*scale+bob*scale);
  ctx.quadraticCurveTo(26.3*scale,12.65*scale+bob*scale,28.5*scale,13.55*scale+bob*scale);
  ctx.quadraticCurveTo(30.3*scale,14.35*scale+bob*scale,30.8*scale,15.75*scale+bob*scale);
  ctx.quadraticCurveTo(30.2*scale,17.0*scale+bob*scale,28.1*scale,17.15*scale+bob*scale);
  ctx.quadraticCurveTo(25.7*scale,16.8*scale+bob*scale,24.7*scale,15.35*scale+bob*scale);
  ctx.quadraticCurveTo(24.1*scale,14.0*scale+bob*scale,24.7*scale,12.95*scale+bob*scale);
  ctx.closePath(); ctx.fillStyle=c.body; ctx.fill();
  poly([[27,14+bob],[30,14+bob],[33,12.9+bob],[32,14.8+bob],[28,15+bob]], c.belly);

  // Massive tyrannosaur skull: deep cranium and broad, softly squared maxilla.
  const headPath = (fill, draw) => { ctx.beginPath(); draw(); ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); };
  const headLine = (draw, color, width) => { ctx.beginPath(); draw(); ctx.strokeStyle = color; ctx.lineWidth = width * scale; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke(); };
  // Narrow the complete skull by 10% around its rear hinge, then shift it up and forward.
  // The front of the snout stays nearly in place while the rear moves to meet the longer neck.
  ctx.save();
  ctx.translate(4.68*scale, -1.2*scale);
  ctx.scale(0.9, 1);
  // Upper skull: tall braincase, heavy brow and deep blunt maxilla.
  headPath(c.outline, () => {
    ctx.moveTo(28.8*scale,10.72*scale+bob*scale);
    ctx.quadraticCurveTo(28.15*scale,9.38*scale+bob*scale,29.05*scale,7.82*scale+bob*scale);
    ctx.quadraticCurveTo(29.72*scale,6.48*scale+bob*scale,31.35*scale,5.72*scale+bob*scale);
    ctx.quadraticCurveTo(32.35*scale,4.55*scale+bob*scale,33.82*scale,3.92*scale+bob*scale);
    ctx.quadraticCurveTo(35.72*scale,3.18*scale+bob*scale,37.42*scale,3.92*scale+bob*scale);
    ctx.quadraticCurveTo(39.02*scale,4.62*scale+bob*scale,39.38*scale,5.82*scale+bob*scale);
    ctx.quadraticCurveTo(40.52*scale,5.35*scale+bob*scale,42.12*scale,5.78*scale+bob*scale);
    ctx.quadraticCurveTo(44.12*scale,6.02*scale+bob*scale,46.18*scale,6.48*scale+bob*scale);
    ctx.quadraticCurveTo(48.02*scale,6.92*scale+bob*scale,48.22*scale,8.12*scale+bob*scale);
    ctx.quadraticCurveTo(48.42*scale,9.28*scale+bob*scale,47.12*scale,10.02*scale+bob*scale);
    ctx.quadraticCurveTo(45.72*scale,10.68*scale+bob*scale,43.48*scale,10.88*scale+bob*scale);
    ctx.quadraticCurveTo(38.18*scale,11.38*scale+bob*scale,32.52*scale,11.18*scale+bob*scale);
    ctx.quadraticCurveTo(30.12*scale,11.12*scale+bob*scale,28.8*scale,10.72*scale+bob*scale);
  });
  headPath(c.body, () => {
    ctx.moveTo(29.82*scale,10.02*scale+bob*scale);
    ctx.quadraticCurveTo(29.42*scale,8.92*scale+bob*scale,30.22*scale,7.98*scale+bob*scale);
    ctx.quadraticCurveTo(31.02*scale,6.82*scale+bob*scale,32.42*scale,6.22*scale+bob*scale);
    ctx.quadraticCurveTo(33.28*scale,5.12*scale+bob*scale,34.42*scale,4.78*scale+bob*scale);
    ctx.quadraticCurveTo(36.18*scale,4.22*scale+bob*scale,37.42*scale,5.02*scale+bob*scale);
    ctx.quadraticCurveTo(38.38*scale,5.62*scale+bob*scale,38.72*scale,6.62*scale+bob*scale);
    ctx.quadraticCurveTo(40.18*scale,6.12*scale+bob*scale,42.02*scale,6.58*scale+bob*scale);
    ctx.quadraticCurveTo(44.42*scale,6.82*scale+bob*scale,46.62*scale,7.42*scale+bob*scale);
    ctx.quadraticCurveTo(47.52*scale,7.78*scale+bob*scale,47.42*scale,8.58*scale+bob*scale);
    ctx.quadraticCurveTo(47.32*scale,9.42*scale+bob*scale,45.92*scale,9.88*scale+bob*scale);
    ctx.quadraticCurveTo(42.72*scale,10.52*scale+bob*scale,38.62*scale,10.58*scale+bob*scale);
    ctx.quadraticCurveTo(33.52*scale,10.72*scale+bob*scale,30.72*scale,10.38*scale+bob*scale);
    ctx.quadraticCurveTo(30.08*scale,10.28*scale+bob*scale,29.82*scale,10.02*scale+bob*scale);
  });
  headPath("rgba(35,55,39,0.25)", () => {
    ctx.moveTo(36.72*scale,6.42*scale+bob*scale);
    ctx.quadraticCurveTo(38.22*scale,5.92*scale+bob*scale,39.58*scale,6.52*scale+bob*scale);
    ctx.quadraticCurveTo(40.82*scale,7.08*scale+bob*scale,41.42*scale,8.12*scale+bob*scale);
    ctx.quadraticCurveTo(40.02*scale,7.82*scale+bob*scale,38.62*scale,8.38*scale+bob*scale);
    ctx.quadraticCurveTo(37.42*scale,8.78*scale+bob*scale,36.42*scale,8.22*scale+bob*scale);
    ctx.quadraticCurveTo(36.12*scale,7.18*scale+bob*scale,36.72*scale,6.42*scale+bob*scale);
  });
  headLine(() => {
    ctx.moveTo(38.42*scale,5.72*scale+bob*scale);
    ctx.quadraticCurveTo(40.82*scale,5.92*scale+bob*scale,43.02*scale,6.72*scale+bob*scale);
    ctx.quadraticCurveTo(45.02*scale,7.22*scale+bob*scale,46.42*scale,7.82*scale+bob*scale);
  }, c.belly, 0.34);
  // Deep lower jaw with a broad rounded chin and strong rear joint.
  headPath(c.outline, () => {
    ctx.moveTo(30.42*scale,10.62*scale+bob*scale);
    ctx.quadraticCurveTo(29.72*scale,11.72*scale+bob*scale,31.12*scale,12.62*scale+bob*scale);
    // The lower edge rises gently through the middle instead of sagging downward.
    ctx.quadraticCurveTo(33.22*scale,14.02*scale+bob*scale,36.72*scale,14.48*scale+bob*scale);
    ctx.quadraticCurveTo(41.22*scale,14.88*scale+bob*scale,44.62*scale,13.92*scale+bob*scale);
    ctx.quadraticCurveTo(46.72*scale,13.38*scale+bob*scale,47.12*scale,12.58*scale+bob*scale);
    ctx.quadraticCurveTo(47.22*scale,11.42*scale+bob*scale,45.82*scale,10.72*scale+bob*scale);
    ctx.quadraticCurveTo(43.72*scale,11.42*scale+bob*scale,41.02*scale,11.62*scale+bob*scale);
    ctx.quadraticCurveTo(36.82*scale,11.92*scale+bob*scale,33.42*scale,11.42*scale+bob*scale);
    ctx.quadraticCurveTo(31.52*scale,11.12*scale+bob*scale,30.42*scale,10.62*scale+bob*scale);
  });
  headPath(c.body, () => {
    ctx.moveTo(31.62*scale,11.62*scale+bob*scale);
    ctx.quadraticCurveTo(34.02*scale,12.82*scale+bob*scale,37.12*scale,13.12*scale+bob*scale);
    ctx.quadraticCurveTo(41.42*scale,13.42*scale+bob*scale,44.32*scale,12.92*scale+bob*scale);
    ctx.quadraticCurveTo(45.72*scale,12.52*scale+bob*scale,46.02*scale,11.92*scale+bob*scale);
    ctx.quadraticCurveTo(42.72*scale,12.42*scale+bob*scale,39.42*scale,12.42*scale+bob*scale);
    ctx.quadraticCurveTo(35.12*scale,12.32*scale+bob*scale,31.62*scale,11.62*scale+bob*scale);
  });
  headLine(() => {
    ctx.moveTo(34.12*scale,12.42*scale+bob*scale);
    ctx.quadraticCurveTo(38.62*scale,13.42*scale+bob*scale,43.02*scale,12.92*scale+bob*scale);
  }, c.belly, 0.40);
  headPath("#402629", () => {
    // Keep the rear start aligned with the eye, but shorten the opening at the snout.
    ctx.moveTo(35.24*scale,10.94*scale+bob*scale);
    ctx.quadraticCurveTo(36.02*scale,11.12*scale+bob*scale,38.72*scale,11.02*scale+bob*scale);
    ctx.quadraticCurveTo(42.12*scale,10.88*scale+bob*scale,44.72*scale,10.22*scale+bob*scale);
    ctx.quadraticCurveTo(44.62*scale,10.58*scale+bob*scale,43.62*scale,10.86*scale+bob*scale);
    ctx.quadraticCurveTo(40.82*scale,11.34*scale+bob*scale,38.02*scale,11.42*scale+bob*scale);
    ctx.quadraticCurveTo(36.57*scale,11.40*scale+bob*scale,35.24*scale,11.20*scale+bob*scale);
    ctx.quadraticCurveTo(35.24*scale,11.08*scale+bob*scale,35.24*scale,10.94*scale+bob*scale);
  });
  const drawHeadTooth = (x, baseY, w, h, pointsUp) => {
    headPath("#F0E3C6", () => {
      if (!pointsUp) {
        ctx.moveTo(x*scale,baseY*scale+bob*scale);
        ctx.quadraticCurveTo((x+w*0.48)*scale,(baseY+0.02)*scale+bob*scale,(x+w)*scale,baseY*scale+bob*scale);
        ctx.quadraticCurveTo((x+w*0.82)*scale,(baseY+h*0.72)*scale+bob*scale,(x+w*0.42)*scale,(baseY+h)*scale+bob*scale);
        ctx.quadraticCurveTo((x+w*0.12)*scale,(baseY+h*0.62)*scale+bob*scale,x*scale,baseY*scale+bob*scale);
      } else {
        ctx.moveTo(x*scale,baseY*scale+bob*scale);
        ctx.quadraticCurveTo((x+w*0.5)*scale,(baseY-0.02)*scale+bob*scale,(x+w)*scale,baseY*scale+bob*scale);
        ctx.quadraticCurveTo((x+w*0.82)*scale,(baseY-h*0.72)*scale+bob*scale,(x+w*0.42)*scale,(baseY-h)*scale+bob*scale);
        ctx.quadraticCurveTo((x+w*0.12)*scale,(baseY-h*0.62)*scale+bob*scale,x*scale,baseY*scale+bob*scale);
      }
    });
  };
  // Upper-jaw teeth are rendered after the lower-jaw fills so they sit in the foreground.
  // Their tips extend clearly past the lower-jaw silhouette; the lower jaw stays behind them and toothless.
  [[39.55,10.88,0.9338,1.22],[41.25,10.76,0.8694,1.1584],[42.72,10.62,0.805,1.0618],[44.02,10.42,0.6762,0.933]].forEach(t=>drawHeadTooth(t[0],t[1],t[2],t[3],false));
  // Compact eye beneath the massive brow.
  ctx.fillStyle = "rgba(30,45,33,0.76)";
  ctx.beginPath(); ctx.ellipse(35.18*scale,7.52*scale+bob*scale,1.08*scale,0.82*scale,-0.08,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = c.eye;
  ctx.beginPath(); ctx.ellipse(35.24*scale,7.48*scale+bob*scale,0.62*scale,0.52*scale,-0.08,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = "#18211B";
  ctx.beginPath(); ctx.ellipse(35.46*scale,7.48*scale+bob*scale,0.23*scale,0.40*scale,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = "#F8E8C8";
  ctx.beginPath(); ctx.arc(34.96*scale,7.22*scale+bob*scale,0.14*scale,0,Math.PI*2); ctx.fill();
  headLine(() => {
    ctx.moveTo(32.12*scale,6.02*scale+bob*scale);
    ctx.quadraticCurveTo(33.82*scale,5.22*scale+bob*scale,35.52*scale,5.62*scale+bob*scale);
    ctx.quadraticCurveTo(36.72*scale,5.92*scale+bob*scale,38.22*scale,5.42*scale+bob*scale);
  }, c.outline, 0.92);
  // Nostrils on the front half of the blunt snout.
  ctx.fillStyle = c.outline;
  ctx.beginPath(); ctx.ellipse(46.12*scale,7.98*scale+bob*scale,0.68*scale,0.40*scale,-0.08,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = c.belly;
  ctx.beginPath(); ctx.ellipse(46.00*scale,7.82*scale+bob*scale,0.27*scale,0.12*scale,-0.08,0,Math.PI*2); ctx.fill();
  headLine(() => {
    ctx.moveTo(30.62*scale,9.52*scale+bob*scale);
    ctx.quadraticCurveTo(30.22*scale,10.28*scale+bob*scale,31.02*scale,10.92*scale+bob*scale);
  }, c.outline, 0.64);
  headLine(() => {
    ctx.moveTo(39.02*scale,9.28*scale+bob*scale);
    ctx.quadraticCurveTo(42.62*scale,9.62*scale+bob*scale,45.02*scale,9.22*scale+bob*scale);
  }, c.belly, 0.36);
  ctx.restore();

  // Blend the rear skull into the neck, covering only the internal overlap seam.
  ctx.save();
  ctx.translate(4.68*scale, -1.2*scale);
  ctx.scale(0.9, 1);
  ctx.beginPath();
  ctx.moveTo(28.65*scale,10.45*scale+bob*scale);
  ctx.quadraticCurveTo(29.9*scale,10.85*scale+bob*scale,31.6*scale,11.02*scale+bob*scale);
  ctx.quadraticCurveTo(33.1*scale,11.18*scale+bob*scale,34.45*scale,10.95*scale+bob*scale);
  ctx.quadraticCurveTo(33.0*scale,11.58*scale+bob*scale,31.25*scale,11.55*scale+bob*scale);
  ctx.quadraticCurveTo(29.45*scale,11.42*scale+bob*scale,28.65*scale,10.45*scale+bob*scale);
  ctx.closePath(); ctx.fillStyle=c.body; ctx.fill();
  ctx.restore();

  // Compact, powerful T-Rex forelimb shifted farther forward.
  // The upper arm stays close to the chest; the elbow bends and the short forearm
  // leads into a small wrist, palm and two separate clawed digits.
  ctx.save();
  ctx.translate(5.7*scale, 0);
  // Continuous outer silhouette: rounded shoulder, tucked elbow and tapered forearm.
  poly([[23.75,12.9+bob],[24.55,12.25+bob],[25.8,12.18+bob],
        [27.0,12.65+bob],[27.95,13.45+bob],[28.45,14.25+bob],
        [29.1,14.38+bob],[29.8,14.65+bob],[30.02,15.08+bob],
        [29.62,15.48+bob],[28.95,15.35+bob],[28.55,15.92+bob],
        [27.75,16.15+bob],[26.9,15.78+bob],[26.05,15.88+bob],
        [25.15,15.42+bob],[24.35,14.72+bob],[24.05,13.85+bob]], c.outline);
  // Inner mass follows the same muscle direction without a human-like long arm.
  poly([[24.55,13.02+bob],[25.05,12.62+bob],[25.85,12.58+bob],
        [26.85,13.02+bob],[27.62,13.72+bob],[28.12,14.42+bob],
        [28.85,14.68+bob],[29.42,14.82+bob],[29.55,15.08+bob],
        [29.12,15.18+bob],[28.62,15.12+bob],[28.12,15.62+bob],
        [27.62,15.82+bob],[26.98,15.42+bob],[26.1,15.5+bob],
        [25.35,14.98+bob],[24.75,14.35+bob]], c.body);
  // Shoulder and triceps planes clarify the joint and the tucked upper arm.
  poly([[24.82,12.92+bob],[25.75,12.72+bob],[26.72,13.22+bob],
        [27.52,14.05+bob],[27.15,14.42+bob],[26.35,13.95+bob],
        [25.55,13.68+bob]], c.belly);
  line([[26.05,14.35+bob],[26.82,14.92+bob],[27.55,15.08+bob]], c.outline, 0.42);
  // Short wrist and palm; two digits emerge separately from the palm.
  poly([[28.75,14.48+bob],[29.45,14.38+bob],[30.05,14.72+bob],
        [30.18,15.12+bob],[29.82,15.48+bob],[29.22,15.35+bob],
        [28.72,15.08+bob]], c.outline);
  poly([[29.02,14.65+bob],[29.52,14.62+bob],[29.82,14.85+bob],
        [29.92,15.08+bob],[29.55,15.22+bob],[29.08,15.02+bob]], c.body);
  // Upper digit: thick at the knuckle, narrowing into a hooked claw.
  poly([[29.55,14.62+bob],[30.25,14.35+bob],[31.05,14.38+bob],
        [31.62,14.68+bob],[31.72,15.02+bob],[31.35,15.22+bob],
        [30.82,15.02+bob],[30.22,15.05+bob],[29.72,14.92+bob]], c.outline);
  poly([[29.82,14.68+bob],[30.38,14.48+bob],[31.02,14.52+bob],
        [31.42,14.75+bob],[31.45,14.9+bob],[30.92,14.82+bob],
        [30.32,14.82+bob]], c.body);
  // Lower digit is offset down and slightly forward, with its own knuckle.
  poly([[29.48,15.02+bob],[30.12,15.02+bob],[30.82,15.28+bob],
        [31.32,15.72+bob],[31.28,16.08+bob],[30.92,16.22+bob],
        [30.52,15.88+bob],[30.05,15.55+bob],[29.55,15.48+bob]], c.outline);
  poly([[29.72,15.18+bob],[30.18,15.2+bob],[30.72,15.48+bob],
        [31.02,15.78+bob],[30.88,15.92+bob],[30.42,15.62+bob],
        [29.98,15.42+bob]], c.body);
  // Distinct pale keratin claws curve forward and down from the two digits.
  poly([[31.52,14.68+bob],[32.18,14.72+bob],[31.92,15.22+bob],
        [31.62,15.18+bob],[31.48,14.98+bob]], c.claw);
  poly([[31.12,15.82+bob],[31.78,16.12+bob],[31.38,16.62+bob],
        [31.12,16.45+bob],[31.0,16.12+bob]], c.claw);
  ctx.restore();

  // Upright dorsal spikes: lift the tail-side run slightly, lower the neck-side run
  // so every base sits against the back silhouette rather than appearing suspended.
  const seamY = (tailY + bob) * 0.5;
  poly([[-9.7,18.90+tailY],[-9.05,18.00+tailY],[-8.35,18.55+tailY]], c.outline);
  poly([[-7.1,18.60+tailY],[-6.25,17.60+tailY],[-5.35,18.25+tailY]], c.outline);
  poly([[-4.5,18.30+tailY],[-3.55,17.10+tailY],[-2.55,17.9+tailY]], c.outline);
  poly([[-1.7,17.90+tailY],[-0.65,16.55+tailY],[0.45,17.5+tailY]], c.outline);
  poly([[1.2,17.50+tailY],[2.35,15.90+tailY],[3.55,17.1+tailY]], c.outline);
  poly([[4.2,17.00+tailY],[5.45,15.20+tailY],[6.7,16.6+tailY]], c.outline);
  poly([[7.2,16.40+tailY],[8.5,14.50+tailY],[9.8,15.95+tailY]], c.outline);
  poly([[10.1,15.70+tailY],[11.45,13.80+tailY],[12.85,15.25+tailY]], c.outline);
  poly([[13.0,14.70+seamY],[14.35,12.85+seamY],[15.7,14.35+seamY]], c.outline);
  poly([[15.4,13.45+bob],[16.8,11.35+bob],[18.2,13.0+bob]], c.outline);
  poly([[17.7,11.75+bob],[19.25,9.25+bob],[20.8,11.35+bob]], c.outline);
  poly([[20.0,10.30+bob],[21.5,7.60+bob],[23.0,9.95+bob]], c.outline);
  poly([[22.1,9.90+bob],[23.25,8.20+bob],[24.4,9.55+bob]], c.outline);
  poly([[24.0,10.10+bob],[25.0,8.80+bob],[26.0,9.8+bob]], c.outline);
  poly([[25.5,10.15+bob],[26.25,9.20+bob],[27.0,9.85+bob]], c.outline);

  if (dead) {
    uRect(34,6,3,1,c.outline,scale);
    uRect(35,5,1,3,c.outline,scale);
  }
}
function drawTRexDucking(scale) {
  if (scale === undefined) scale = dino.scale;
  const c = getDinoColors();
  const tailSegments = 14;
  for (let i = 0; i < tailSegments; i++) {
    const t = i / (tailSegments - 1);
    const u = t * 15; const vBase = 7 + (1 - t) * 4; const thickness = 1 + t * 3.5;
    uRect(u, vBase, 1.2, thickness, c.body, scale); uRect(u, vBase + thickness - 0.6, 1.2, 0.6, c.outline, scale);
  }
  uRect(0, 10.5, 1.2, 1, c.outline, scale);
  uRect(13, 5, 14, 8, c.body, scale); uRect(13, 5, 14, 0.8, c.outline, scale);
  uRect(13, 5, 0.8, 8, c.outline, scale); uRect(14, 12, 12, 1, c.outline, scale);
  uRect(15, 6, 10, 0.6, c.belly, scale);
  uRect(23, 4, 5, 4, c.body, scale); uRect(23, 4, 5, 0.8, c.outline, scale);
  uRect(24, 4.8, 3, 0.5, c.belly, scale);
  uRect(24, 0.5, 9, 5, c.body, scale); uRect(24, 0.5, 9, 0.8, c.outline, scale);
  uRect(24, 0.5, 0.8, 5, c.outline, scale); uRect(26, 1.3, 5, 0.6, c.belly, scale);
  uRect(30, 2, 4, 2, c.body, scale); uRect(30, 2, 4, 0.7, c.outline, scale);
  uRect(33, 2.8, 0.8, 0.8, '#000', scale);
  uRect(30, 5, 4, 1.3, c.body, scale); uRect(30, 4.3, 4, 0.8, '#D32F2F', scale);
  for (let i = 0; i < 3; i++) uRect(30.5 + i, 4.5, 0.6, 0.6, '#FFF', scale);
  for (let i = 0; i < 3; i++) uRect(30.8 + i, 4.0, 0.5, 0.5, '#FFF', scale);
  uRect(30, 5.7, 4, 0.4, c.outline, scale);
  uRect(27, 1.8, 1.5, 1.5, c.eye, scale); uRect(27.8, 2.1, 0.7, 0.9, '#000', scale);
  uRect(27.2, 1.9, 0.4, 0.4, '#FFF', scale); uRect(26.8, 1.4, 2.2, 0.5, c.outline, scale);
  uRect(26, 7.5, 2.5, 1, c.outline, scale); uRect(27.8, 8, 1.8, 0.8, c.outline, scale);
  uRect(29.2, 8.3, 1.2, 0.7, c.outline, scale); uRect(30.2, 8, 0.6, 0.4, c.claw, scale);
  uRect(30.2, 8.6, 0.6, 0.4, c.claw, scale); uRect(26, 8.3, 2.5, 0.3, c.outline, scale);
  uRect(15, 11, 4, 3, c.body, scale); uRect(15, 11, 4, 0.6, c.belly, scale); uRect(15, 11, 0.6, 3, c.outline, scale); uRect(15, 13, 5, 1.3, c.outline, scale);
  uRect(21, 11, 4, 3, c.body, scale); uRect(21, 11, 4, 0.6, c.belly, scale); uRect(21, 11, 0.6, 3, c.outline, scale); uRect(21, 13, 5, 1.3, c.outline, scale);
}

function drawDinoAt(x, y, ducking, jumping, phase, dead, scale) {
  if (scale === undefined) scale = dino.scale;
  const spriteH = ducking && !jumping ? 15 : 30; const spriteW = 46; const dx = x - 8 * scale; const dy = y - spriteH * scale;
  ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(dx + spriteW * scale * 0.55, y + 3, spriteW * scale * 0.3, 4, 0, 0, Math.PI * 2); ctx.fill();
  // Standing gait bob is synchronized inside drawTRexStanding so the feet
  // stay grounded while the pelvis, torso, neck and head rise and fall together.
  ctx.save(); ctx.translate(dx, dy); if (ducking && !jumping) drawTRexDucking(scale); else drawTRexStanding(jumping ? 0 : phase, dead, scale); ctx.restore();
}

function drawDino() {
  drawDinoAt(dino.x, dino.y, dino.ducking, dino.jumping, Math.floor(frame / 2) % 12, gameState === 'gameover', dino.scale);
  if (activePowerUps.some(a => a.type === 'shield')) {
    ctx.strokeStyle = 'rgba(33,150,243,0.8)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(dino.x + 30, dino.y - 30, 45, 0, Math.PI * 2); ctx.stroke();
  }
}

function drawCactus(o, colors, scale) {
  if (scale === undefined) scale = dino.scale;
  const x = o.x, y = o.y, h = o.h, w = o.w, s = scale;
  ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(x + w * s / 2, y + 3, w * s * 0.4, 4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = colors.cactus;
  if (o.type === 'cactus_small') {
    const stemW = 4; const stemX = x + (w / 2 - stemW / 2) * s; ctx.fillRect(stemX, y - h * s, stemW * s, h * s);
    const b1Y = y - h * s + h * 0.4 * s; ctx.fillRect(stemX - 4 * s, b1Y, 4 * s, 3 * s); ctx.fillRect(stemX - 4 * s, b1Y - 6 * s, 3 * s, 8 * s);
    const b2Y = y - h * s + h * 0.55 * s; ctx.fillRect(stemX + stemW * s, b2Y, 4 * s, 3 * s); ctx.fillRect(stemX + stemW * s + 1 * s, b2Y - 5 * s, 3 * s, 7 * s);
    ctx.fillStyle = colors.cactusLight; ctx.fillRect(stemX + 1 * s, y - h * s + 2 * s, 1 * s, h * s - 4 * s);
  } else {
    const stemW = 6; const stemX = x + (w / 2 - stemW / 2) * s; ctx.fillRect(stemX, y - h * s, stemW * s, h * s);
    const b1Y = y - h * s + h * 0.3 * s; ctx.fillRect(stemX - 6 * s, b1Y, 6 * s, 4 * s); ctx.fillRect(stemX - 6 * s, b1Y - 8 * s, 4 * s, 10 * s);
    const b2Y = y - h * s + h * 0.45 * s; ctx.fillRect(stemX + stemW * s, b2Y, 6 * s, 4 * s); ctx.fillRect(stemX + stemW * s + 2 * s, b2Y - 8 * s, 4 * s, 10 * s);
    ctx.fillStyle = colors.cactusLight; ctx.fillRect(stemX + 1.5 * s, y - h * s + 2 * s, 1.5 * s, h * s - 4 * s);
  }
}

function drawBird(b, colors, scale) {
  if (scale === undefined) scale = BIRD_SCALE_GAME;
  const x = b.x, y = b.y; const wingUp = Math.floor(frame / 8) % 2 === 0;
  let birdColor = colors.bird;
  if (b.isGolden) { birdColor = '#FFD700'; ctx.shadowColor = '#FF8F00'; ctx.shadowBlur = 15; }
  ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(x + 20 * scale, GROUND_Y + 3, 20 * scale, 3, 0, 0, Math.PI * 2); ctx.fill();
  if (b.magnetized) { ctx.fillStyle = 'rgba(100,180,255,0.35)'; ctx.beginPath(); ctx.arc(x + 20 * scale, y, 40 * scale, 0, Math.PI * 2); ctx.fill(); }
  ctx.fillStyle = birdColor;
  ctx.fillRect(x + 12 * scale, y - 2 * scale, 16 * scale, 4 * scale); ctx.fillRect(x + 6 * scale, y, 6 * scale, 2 * scale);
  ctx.fillRect(x + 4 * scale, y + 2 * scale, 2 * scale, 2 * scale); ctx.fillRect(x + 28 * scale, y - 5 * scale, 6 * scale, 5 * scale);
  ctx.fillRect(x + 34 * scale, y - 4 * scale, 2 * scale, 4 * scale); ctx.fillRect(x + 36 * scale, y - 3 * scale, 8 * scale, 2 * scale);
  ctx.fillRect(x + 36 * scale, y - 1 * scale, 5 * scale, 1 * scale); ctx.fillRect(x + 26 * scale, y - 10 * scale, 3 * scale, 5 * scale);
  ctx.fillRect(x + 23 * scale, y - 8 * scale, 3 * scale, 3 * scale);
  ctx.fillStyle = '#FFF'; ctx.fillRect(x + 30 * scale, y - 3 * scale, 2 * scale, 2 * scale);
  ctx.fillStyle = '#000'; ctx.fillRect(x + 31 * scale, y - 3 * scale, 1 * scale, 1 * scale);
  ctx.fillStyle = birdColor;
  if (wingUp) {
    ctx.beginPath(); ctx.moveTo(x + 14 * scale, y - 2 * scale); ctx.lineTo(x + 4 * scale, y - 22 * scale); ctx.lineTo(x + 10 * scale, y - 20 * scale); ctx.lineTo(x + 20 * scale, y - 12 * scale); ctx.lineTo(x + 28 * scale, y - 2 * scale); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.moveTo(x + 10 * scale, y - 8 * scale); ctx.lineTo(x + 14 * scale, y - 18 * scale); ctx.lineTo(x + 22 * scale, y - 8 * scale); ctx.fill();
  } else {
    ctx.beginPath(); ctx.moveTo(x + 14 * scale, y + 2 * scale); ctx.lineTo(x + 4 * scale, y + 22 * scale); ctx.lineTo(x + 10 * scale, y + 20 * scale); ctx.lineTo(x + 20 * scale, y + 12 * scale); ctx.lineTo(x + 28 * scale, y + 2 * scale); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.moveTo(x + 10 * scale, y + 8 * scale); ctx.lineTo(x + 14 * scale, y + 18 * scale); ctx.lineTo(x + 22 * scale, y + 8 * scale); ctx.fill();
  }
  ctx.shadowBlur = 0;
}

function drawMeteor(m) {
  ctx.save();
  m.trail.forEach((t, i) => {
    const alpha = (i / m.trail.length) * 0.8;
    ctx.fillStyle = `rgba(255, 100, 0, ${alpha})`;
    ctx.beginPath(); ctx.arc(t.x, t.y, m.r * (i / m.trail.length), 0, Math.PI * 2); ctx.fill();
  });
  const gradient = ctx.createRadialGradient(m.x, m.y, 2, m.x, m.y, m.r);
  gradient.addColorStop(0, '#FFF9C4'); gradient.addColorStop(0.4, '#FF9800'); gradient.addColorStop(1, '#D84315');
  ctx.shadowColor = '#FF5722'; ctx.shadowBlur = 20; ctx.fillStyle = gradient;
  ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawPet() {
  if (save.currentPet === 'none') return;
  const petType = save.currentPet; const px = petX; const py = petY;
  ctx.save(); ctx.translate(px, py);
  if (petType === 'ptero') {
    const wingUp = Math.floor(frame / 8) % 2 === 0;
    ctx.fillStyle = '#6A1B9A';
    ctx.beginPath(); if (wingUp) { ctx.moveTo(0, 0); ctx.lineTo(-15, -10); ctx.lineTo(-5, 5); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(15, -10); ctx.lineTo(5, 5); ctx.closePath(); ctx.fill(); } else { ctx.moveTo(0, 0); ctx.lineTo(-15, 10); ctx.lineTo(-5, -5); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(15, 10); ctx.lineTo(5, -5); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = '#4A148C'; ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#FFF'; ctx.fillRect(-3, -2, 2, 2); ctx.fillRect(1, -2, 2, 2);
  } else if (petType === 'ghost') {
    ctx.globalAlpha = 0.8; ctx.fillStyle = '#E0E0E0';
    ctx.beginPath(); ctx.arc(0, -5, 10, Math.PI, 0); ctx.lineTo(10, 5); ctx.lineTo(6, 10); ctx.lineTo(2, 5); ctx.lineTo(-2, 10); ctx.lineTo(-6, 5); ctx.lineTo(-10, 10); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(-4, -5, 2, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(4, -5, 2, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
  } else if (petType === 'flame') {
    ctx.shadowColor = '#FF5722'; ctx.shadowBlur = 15;
    const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, 12);
    grad.addColorStop(0, '#FFEB3B'); grad.addColorStop(0.5, '#FF9800'); grad.addColorStop(1, 'rgba(255, 87, 34, 0)');
    ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(0, 0, 12 + Math.sin(frame * 0.2) * 2, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
  }
  ctx.restore();
}

function drawPowerUp(p) {
  ctx.save(); ctx.translate(p.x, p.y); ctx.shadowColor = p.color; ctx.shadowBlur = 15;
  ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(0, 0, 15, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#FFF'; ctx.font = 'bold 16px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(p.icon, 0, 2); ctx.restore();
}

function drawBoneShape(x, y, size) {
  if (size === undefined) size = 14;
  ctx.save(); ctx.translate(x, y); const w = size, h = size * 0.5;
  ctx.fillStyle = '#FFF8E1'; ctx.strokeStyle = '#FFB300'; ctx.lineWidth = 2;
  ctx.fillRect(-w/2, -h/4, w, h/2); ctx.strokeRect(-w/2, -h/4, w, h/2);
  ctx.beginPath(); ctx.arc(-w/2, -h/3, h/2, 0, Math.PI * 2); ctx.arc(-w/2, h/3, h/2, 0, Math.PI * 2); ctx.arc(w/2, -h/3, h/2, 0, Math.PI * 2); ctx.arc(w/2, h/3, h/2, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke(); ctx.restore();
}

function spawnFloatingText(x, y, text) {
  const el = document.createElement('div'); el.className = 'floating-text'; el.textContent = text; el.style.left = x + 'px'; el.style.top = y + 'px';
  document.body.appendChild(el); setTimeout(() => el.remove(), 1000);
    }
