function draw(){
  ctx.save();
  ctx.clearRect(0,0,W,H);
  if(!state){
    drawAttractScreen();
    ctx.restore();
    return;
  }

  const sx=(Math.random()-.5)*state.shake;
  const sy=(Math.random()-.5)*state.shake;
  ctx.translate(sx,sy);
  drawBackground(state.stage);
  drawWorldFloor();
  drawPickups();
  drawEnemies();
  drawProjectiles();
  drawPlayer(state.player);
  drawEffects();
  drawWorldHud();
  if(state.paused) drawPause();
  ctx.restore();
}

function drawAttractScreen(){
  const g=ctx.createLinearGradient(0,0,0,H);
  g.addColorStop(0,'#17313d');
  g.addColorStop(1,'#061015');
  ctx.fillStyle=g;
  ctx.fillRect(0,0,W,H);
  ctx.fillStyle='rgba(255,255,255,.045)';
  for(let i=0;i<14;i++) ctx.fillRect(i*110-(performance.now()*.025)%110,390+(i%3)*18,74,180);
  ctx.fillStyle='#b9ff4a';
  ctx.font='900 58px system-ui';
  ctx.textAlign='center';
  ctx.fillText('RED DOG: SHIFT BREAKER',W/2,280);
  ctx.fillStyle='#91a7af';
  ctx.font='700 22px system-ui';
  ctx.fillText('Select a class to begin the least normal normal shift.',W/2,330);
}

function drawBackground(stageIndex){
  const stageColors=[['#173845','#07161d'],['#28384a','#09131b'],['#321d22','#090e12']][stageIndex]||['#173845','#07161d'];
  const g=ctx.createLinearGradient(0,0,0,H);
  g.addColorStop(0,stageColors[0]);
  g.addColorStop(1,stageColors[1]);
  ctx.fillStyle=g;
  ctx.fillRect(-20,-20,W+40,H+40);

  ctx.fillStyle='rgba(180,220,230,.08)';
  ctx.beginPath();
  ctx.moveTo(0,245);
  for(let x=0;x<=W;x+=110){
    const y=180+Math.sin((x+state.bgScroll*.2)*.013)*50+((x/110)%2)*25;
    ctx.lineTo(x,y);
  }
  ctx.lineTo(W,390);
  ctx.lineTo(0,390);
  ctx.closePath();
  ctx.fill();

  if(stageIndex===0) drawCrusherBackground();
  else if(stageIndex===1) drawFlotationBackground();
  else drawIsaBackground();
}

function drawCrusherBackground(){
  ctx.fillStyle='rgba(5,9,12,.72)';
  for(let i=0;i<5;i++){
    const x=80+i*290-(state.bgScroll*.08)%290;
    ctx.fillRect(x,210,28,370);
    ctx.fillRect(x-44,250,116,18);
  }
  ctx.fillStyle='#26343a';
  ctx.fillRect(0,485,W,32);
  ctx.fillStyle='#46575f';
  for(let x=-80;x<W+80;x+=90) ctx.fillRect(x-(state.bgScroll*.35)%90,491,58,9);
  ctx.fillStyle='rgba(255,185,65,.22)';
  ctx.fillRect(940,105,180,255);
  ctx.fillStyle='#0a1115';
  ctx.fillRect(970,145,120,215);
  ctx.fillStyle='#ffbe45';
  ctx.font='900 18px system-ui';
  ctx.fillText('CRUSHER 4',986,180);
}

function drawFlotationBackground(){
  ctx.fillStyle='rgba(7,11,14,.68)';
  for(let i=0;i<5;i++){
    const x=60+i*275-(state.bgScroll*.06)%275;
    ctx.fillRect(x,170,18,410);
    ctx.fillRect(x-35,230,88,12);
  }
  for(let i=0;i<4;i++){
    const x=155+i*305-(state.bgScroll*.18)%305;
    ctx.fillStyle='#26383e';
    ctx.beginPath();
    ctx.ellipse(x,495,105,46,0,0,Math.PI*2);
    ctx.fill();
    ctx.fillStyle='#d9eef0';
    ctx.beginPath();
    ctx.ellipse(x,478,88,30,0,0,Math.PI*2);
    ctx.fill();
    ctx.fillStyle='rgba(82,199,232,.28)';
    ctx.beginPath();
    ctx.ellipse(x,476,75,22,0,0,Math.PI*2);
    ctx.fill();
  }
  ctx.fillStyle='rgba(185,255,74,.13)';
  ctx.fillRect(860,115,250,90);
  ctx.fillStyle='#b9ff4a';
  ctx.font='800 16px system-ui';
  ctx.fillText('RECOVERY: SOMEHOW STILL IN TARGET',885,165);
}

function drawIsaBackground(){
  ctx.fillStyle='rgba(8,10,12,.76)';
  for(let i=0;i<5;i++){
    const x=40+i*300-(state.bgScroll*.05)%300;
    ctx.fillRect(x,145,24,435);
    ctx.fillRect(x-34,205,100,13);
  }
  ctx.fillStyle='#27343a';
  ctx.fillRect(775,238,360,245);
  ctx.strokeStyle='#667983';
  ctx.lineWidth=8;
  ctx.strokeRect(775,238,360,245);
  ctx.fillStyle='#12191d';
  ctx.beginPath();
  ctx.arc(950,358,106,0,Math.PI*2);
  ctx.fill();
  ctx.strokeStyle='#a25c4c';
  ctx.lineWidth=14;
  ctx.stroke();
  ctx.fillStyle='#ff6f57';
  ctx.font='900 17px system-ui';
  ctx.fillText('VFD FAULT: DEFINITELY NOT THE VFD',802,275);
}

function drawWorldFloor(){
  ctx.fillStyle='#111c21';
  ctx.fillRect(-20,FLOOR,W+40,H-FLOOR+20);
  ctx.fillStyle='#26353c';
  ctx.fillRect(-20,FLOOR,W+40,8);
  ctx.strokeStyle='rgba(255,255,255,.055)';
  ctx.lineWidth=2;
  for(let x=-80;x<W+80;x+=80){
    const xx=x-(state.bgScroll*.5)%80;
    ctx.beginPath();
    ctx.moveTo(xx,FLOOR+8);
    ctx.lineTo(xx-38,H);
    ctx.stroke();
  }
  ctx.fillStyle='rgba(185,255,74,.23)';
  for(let x=0;x<W;x+=160) ctx.fillRect(x,646,74,5);
}

function drawPlayer(p){
  const blink=p.invuln>0 && Math.floor(state.time*20)%2===0;
  if(blink) ctx.globalAlpha=.38;
  ctx.save();
  ctx.translate(p.cx,p.y+p.h/2);
  if(p.facing<0) ctx.scale(-1,1);

  ctx.fillStyle='rgba(0,0,0,.32)';
  ctx.beginPath();
  ctx.ellipse(0,p.h/2+3,34,9,0,0,Math.PI*2);
  ctx.fill();

  if(p.kind==='metallurgist'){
    ctx.fillStyle='#183e4f'; ctx.fillRect(-18,-26,36,55);
    ctx.fillStyle=p.classData.color; ctx.fillRect(-14,-38,28,22);
    ctx.fillStyle='#e8f0f2'; ctx.fillRect(-11,-34,22,7);
    ctx.fillStyle='#b9ff4a'; ctx.fillRect(18,-19,25,10);
    ctx.fillStyle='#5cc8e5'; ctx.beginPath(); ctx.arc(43,-14,7,0,Math.PI*2); ctx.fill();
  }else if(p.kind==='operator'){
    ctx.fillStyle='#5a4a1c'; ctx.fillRect(-21,-26,42,57);
    ctx.fillStyle='#f2c84c'; ctx.fillRect(-19,-38,38,21);
    ctx.fillStyle='#111'; ctx.fillRect(-9,-32,28,6);
    ctx.strokeStyle='#c9d6db'; ctx.lineWidth=7; ctx.beginPath(); ctx.moveTo(17,-8); ctx.lineTo(48,16); ctx.stroke();
    ctx.fillStyle='#d4dfe3'; ctx.fillRect(42,10,15,10);
  }else{
    ctx.fillStyle='#5b2527'; ctx.fillRect(-21,-27,42,58);
    ctx.fillStyle='#ff7a7d'; ctx.fillRect(-18,-39,36,21);
    ctx.fillStyle='#d9e5ea'; ctx.fillRect(-11,-34,24,6);
    ctx.strokeStyle='#e4eaed'; ctx.lineWidth=6; ctx.beginPath(); ctx.moveTo(16,-7); ctx.lineTo(48,-24); ctx.stroke();
    ctx.fillStyle='#cad4d8'; ctx.fillRect(44,-31,16,13);
  }

  ctx.fillStyle='#172229';
  ctx.fillRect(-17,28,12,25);
  ctx.fillRect(6,28,12,25);
  ctx.fillStyle='#f8f5cd';
  ctx.fillRect(12,-36,6,5);
  ctx.restore();
  ctx.globalAlpha=1;
}

function drawEnemies(){
  for(const e of state.enemies){
    ctx.save();
    ctx.translate(e.cx,e.cy);
    const dir=Math.sign(state.player.cx-e.cx)||1;
    if(dir<0) ctx.scale(-1,1);
    ctx.fillStyle='rgba(0,0,0,.3)';
    ctx.beginPath();
    ctx.ellipse(0,e.h/2+5,e.w*.45,8,0,0,Math.PI*2);
    ctx.fill();
    drawEnemySprite(e);
    if(e.type==='stator'||e.hp<e.maxHp){
      const bw=Math.max(36,e.w);
      ctx.fillStyle='rgba(0,0,0,.7)';
      ctx.fillRect(-bw/2,-e.h/2-18,bw,7);
      ctx.fillStyle=e.type==='stator'?'#ff704f':'#b9ff4a';
      ctx.fillRect(-bw/2,-e.h/2-18,bw*Math.max(0,e.hp/e.maxHp),7);
    }
    ctx.restore();
  }
}

function drawEnemySprite(e){
  switch(e.type){
    case 'rock':
      ctx.fillStyle='#7f8b92';
      ctx.beginPath();
      ctx.moveTo(-24,15); ctx.lineTo(-18,-13); ctx.lineTo(5,-22); ctx.lineTo(24,-3); ctx.lineTo(19,18); ctx.closePath(); ctx.fill();
      ctx.fillStyle='#171d20'; ctx.fillRect(-10,-3,7,5); ctx.fillRect(8,-5,7,5);
      break;
    case 'grease':
      ctx.fillStyle='#4b9c64'; ctx.beginPath(); ctx.ellipse(0,8,23,28,0,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#a6f2b7'; ctx.fillRect(-13,-13,25,7); ctx.fillStyle='#19231e'; ctx.fillRect(-10,1,7,5); ctx.fillRect(7,1,7,5);
      break;
    case 'forklift':
      ctx.fillStyle='#dc9a32'; ctx.fillRect(-50,-20,72,45); ctx.fillStyle='#171d20'; ctx.fillRect(-12,-42,34,26); ctx.fillStyle='#cbd5da'; ctx.fillRect(-8,-38,25,18);
      ctx.fillStyle='#111'; ctx.beginPath(); ctx.arc(-29,28,13,0,Math.PI*2); ctx.arc(19,28,13,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle='#adb9bf'; ctx.lineWidth=6; ctx.beginPath(); ctx.moveTo(27,-20); ctx.lineTo(48,-20); ctx.lineTo(48,25); ctx.stroke();
      break;
    case 'froth':
      ctx.fillStyle='#d9edf1';
      for(let i=0;i<5;i++){ ctx.beginPath(); ctx.arc(-15+i*8,-4+(i%2)*7,17,0,Math.PI*2); ctx.fill(); }
      ctx.fillStyle='#1d2529'; ctx.fillRect(-10,-5,6,6); ctx.fillRect(8,-5,6,6);
      break;
    case 'sample':
      ctx.fillStyle='#8a5aac'; ctx.fillRect(-17,-23,34,48); ctx.fillStyle='#d7c1e8'; ctx.fillRect(-13,-17,26,14);
      ctx.fillStyle='#16181d'; ctx.fillRect(-8,-10,5,5); ctx.fillRect(6,-10,5,5); ctx.fillStyle='#f0d65a'; ctx.fillRect(18,-8,15,7);
      break;
    case 'spark':
      ctx.strokeStyle='#77e7ff'; ctx.lineWidth=6; ctx.beginPath(); ctx.moveTo(-18,17); ctx.lineTo(-5,-3); ctx.lineTo(-15,-4); ctx.lineTo(9,-22); ctx.lineTo(3,-5); ctx.lineTo(18,-8); ctx.stroke();
      break;
    case 'stator':
      ctx.fillStyle='#843d32'; ctx.beginPath(); ctx.arc(0,0,78,0,Math.PI*2); ctx.fill(); ctx.strokeStyle='#d4795f'; ctx.lineWidth=15; ctx.stroke();
      ctx.fillStyle='#141a1d'; ctx.beginPath(); ctx.arc(0,0,37,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle='#ffb06e'; ctx.lineWidth=5;
      for(let i=0;i<8;i++){ const a=i*Math.PI/4; ctx.beginPath(); ctx.moveTo(Math.cos(a)*42,Math.sin(a)*42); ctx.lineTo(Math.cos(a)*69,Math.sin(a)*69); ctx.stroke(); }
      ctx.fillStyle='#ff704f'; ctx.fillRect(-30,-91,60,16); ctx.fillStyle='#fff'; ctx.font='900 11px system-ui'; ctx.textAlign='center'; ctx.fillText('SCHEDULE DESTROYER',0,-79);
      break;
  }
}

function drawProjectiles(){
  for(const p of state.projectiles){
    ctx.fillStyle=p.color;
    ctx.shadowColor=p.color;
    ctx.shadowBlur=14;
    ctx.beginPath();
    ctx.arc(p.cx,p.cy,p.r,0,Math.PI*2);
    ctx.fill();
    ctx.shadowBlur=0;
  }
}

function drawPickups(){
  for(const p of state.pickups){
    ctx.save();
    ctx.translate(p.cx,p.cy);
    ctx.rotate(state.time*2);
    ctx.fillStyle=p.type==='health'?'#ff6268':'#ffd85c';
    ctx.fillRect(-13,-13,26,26);
    if(p.type==='health'){
      ctx.fillStyle='#fff'; ctx.fillRect(-4,-10,8,20); ctx.fillRect(-10,-4,20,8);
    }else{
      ctx.fillStyle='#5b4710'; ctx.beginPath(); ctx.arc(0,0,7,0,Math.PI*2); ctx.fill();
    }
    ctx.restore();
  }
}

function drawEffects(){
  for(const fx of state.effects){
    ctx.save();
    if(fx.type==='ring'){
      ctx.strokeStyle=fx.color; ctx.globalAlpha=Math.min(1,fx.t*2.2); ctx.lineWidth=8; ctx.beginPath(); ctx.arc(fx.x,fx.y,fx.r,0,Math.PI*2); ctx.stroke();
    }else if(fx.type==='hit'){
      ctx.strokeStyle=fx.color; ctx.lineWidth=5; ctx.globalAlpha=fx.t*5;
      for(let i=0;i<5;i++){ const a=i*1.25+state.time*9; ctx.beginPath(); ctx.moveTo(fx.x,fx.y); ctx.lineTo(fx.x+Math.cos(a)*34,fx.y+Math.sin(a)*34); ctx.stroke(); }
    }else if(fx.type==='burst'){
      ctx.fillStyle=fx.color; ctx.globalAlpha=fx.t*1.7;
      for(let i=0;i<12;i++){ const a=i*Math.PI/6; const d=(.45-fx.t)*170; ctx.fillRect(fx.x+Math.cos(a)*d,fx.y+Math.sin(a)*d,8,8); }
    }else if(fx.type==='warning'){
      ctx.strokeStyle=fx.color; ctx.lineWidth=5; ctx.globalAlpha=.5+.4*Math.sin(state.time*30); ctx.beginPath(); ctx.ellipse(fx.x,fx.y,80,20,0,0,Math.PI*2); ctx.stroke();
    }else if(fx.type==='blast'){
      ctx.fillStyle=fx.color; ctx.globalAlpha=fx.t*2.3; ctx.fillRect(fx.x-65,FLOOR-260,130,260);
    }
    ctx.restore();
  }
}

function drawWorldHud(){
  const p=state.player;
  ctx.save();
  ctx.textAlign='left';
  ctx.font='900 18px system-ui';
  ctx.fillStyle='#eaf0f2';
  ctx.fillText(`SCORE ${p.score.toLocaleString()}`,26,38);
  if(p.combo>1&&p.comboTimer>0){
    ctx.fillStyle='#b9ff4a';
    ctx.font='950 30px system-ui';
    ctx.fillText(`${p.combo}x COMBO`,26,74);
  }
  const boss=state.enemies.find(e=>e.type==='stator');
  if(boss){
    const bw=560,bx=(W-bw)/2,by=42;
    ctx.fillStyle='rgba(0,0,0,.68)'; ctx.fillRect(bx,by,bw,16);
    ctx.fillStyle='#ff704f'; ctx.fillRect(bx,by,bw*(boss.hp/boss.maxHp),16);
    ctx.fillStyle='#fff'; ctx.font='900 14px system-ui'; ctx.textAlign='center'; ctx.fillText('EXCITER STATOR // DESTROYER OF SCHEDULES',W/2,by-8);
  }
  ctx.restore();
}

function drawPause(){
  ctx.fillStyle='rgba(0,0,0,.62)';
  ctx.fillRect(0,0,W,H);
  ctx.fillStyle='#b9ff4a';
  ctx.font='950 64px system-ui';
  ctx.textAlign='center';
  ctx.fillText('PAUSED',W/2,H/2);
  ctx.fillStyle='#91a7af';
  ctx.font='700 20px system-ui';
  ctx.fillText('The mill, regrettably, is not.',W/2,H/2+42);
}
