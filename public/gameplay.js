function initGame(kind){
  const p=new Player(kind);
  state={
    player:p,enemies:[],projectiles:[],pickups:[],effects:[],stage:0,wave:-1,
    waveDelay:0,stageCleared:false,paused:false,gameEnded:false,shake:0,time:0,
    dialogueQueue:[],dialogueActive:false,bgScroll:0,bannerTimer:0,objectivePulse:0
  };
  classLabel.textContent=CLASSES[kind].label;
  menu.classList.add('hidden');
  gamePanel.classList.remove('hidden');
  gameOver.classList.add('hidden');
  startStage(0);
  updateHud();
}

function startStage(index){
  state.stage=index;
  state.wave=-1;
  state.enemies=[];
  state.projectiles=[];
  state.pickups=[];
  state.stageCleared=false;
  state.waveDelay=0;
  objectiveLabel.textContent=STAGES[index].objective.toUpperCase();
  showBanner(`AREA ${index+1}: ${STAGES[index].name}`,1400);
  state.dialogueQueue=[...STAGES[index].intro];
  nextDialogue();
}

function nextDialogue(){
  if(!state.dialogueQueue.length){
    state.dialogueActive=false;
    dialogue.classList.add('hidden');
    if(state.stageCleared){
      startStage(state.stage+1);
    }else{
      state.waveDelay=.65;
    }
    return;
  }
  const [name,text]=state.dialogueQueue.shift();
  state.dialogueActive=true;
  dialogue.classList.remove('hidden');
  speaker.textContent=name;
  dialogueText.textContent=text;
}

function spawnWave(){
  const stage=STAGES[state.stage];
  state.wave++;
  if(state.wave>=stage.waves.length){
    if(state.stage>=STAGES.length-1){
      endGame(true);
      return;
    }
    state.stageCleared=true;
    state.dialogueQueue=[
      ['RADIO','Area clear. Which obviously means something worse has happened somewhere else.'],
      ['YOU','Naturally.'],
      ['RADIO',`Proceed to ${STAGES[state.stage+1].name}.`]
    ];
    nextDialogue();
    return;
  }
  showBanner(`WAVE ${state.wave+1}`,650);
  let slot=0;
  for(const group of stage.waves[state.wave]){
    for(let i=0;i<group.count;i++){
      const side=(slot++%2===0)?1:-1;
      const x=side>0?W+50+i*64:-140-i*64;
      state.enemies.push(new Enemy(group.type,x));
    }
  }
}

function updateEffects(dt){
  for(const fx of state.effects){
    fx.t-=dt;
    if(fx.type==='ring') fx.r+=(fx.max-fx.r)*Math.min(1,dt*9);
  }
  state.effects=state.effects.filter(f=>f.t>0);
}

function update(dt){
  if(!state||state.paused||state.gameEnded) return;
  state.time+=dt;
  state.shake=Math.max(0,state.shake-28*dt);
  state.objectivePulse=Math.max(0,state.objectivePulse-dt);

  if(state.dialogueActive){
    if(justPressed.has('KeyE')||justPressed.has('Enter')) nextDialogue();
    return;
  }

  state.player.update(dt);
  state.bgScroll+=state.player.vx*dt*.13;

  for(const e of state.enemies) e.update(dt);
  for(const p of state.projectiles) p.update(dt);
  for(const p of state.pickups) p.update(dt);
  updateEffects(dt);

  state.enemies=state.enemies.filter(e=>!e.dead);
  state.projectiles=state.projectiles.filter(p=>!p.dead);
  state.pickups=state.pickups.filter(p=>!p.dead);

  if(!state.enemies.length){
    if(state.waveDelay>0){
      state.waveDelay-=dt;
      if(state.waveDelay<=0) spawnWave();
    }else if(state.wave>=0 && !state.stageCleared){
      state.waveDelay=.8;
    }
  }

  updateHud();
}

function updateHud(){
  if(!state) return;
  const p=state.player;
  classLabel.textContent=p.classData.label;
  levelLabel.textContent=`LV ${p.level}`;
  hpFill.style.width=`${Math.max(0,p.hp/p.maxHp*100)}%`;
  hpText.textContent=`${Math.ceil(p.hp)} / ${p.maxHp}`;
  xpFill.style.width=`${Math.min(100,p.xp/p.nextXp*100)}%`;
  xpText.textContent=`${Math.floor(p.xp)} / ${p.nextXp}`;
  specialFill.style.width=`${p.special}%`;
  specialText.textContent=p.special>=100?'READY':`${Math.floor(p.special)}%`;
}

function showBanner(text,ms=900){
  banner.textContent=text;
  banner.classList.remove('hidden');
  clearTimeout(showBanner.timer);
  showBanner.timer=setTimeout(()=>banner.classList.add('hidden'),ms);
}

function endGame(win){
  if(!state||state.gameEnded) return;
  state.gameEnded=true;
  gameOver.classList.remove('hidden');
  if(win){
    gameOverTitle.textContent='SHIFT SURVIVED';
    gameOverText.textContent=`You somehow restored order to the mill. Final score: ${state.player.score.toLocaleString()}. Management has rewarded you with another shift.`;
  }else{
    gameOverTitle.textContent='SHIFT ENDED';
    gameOverText.textContent=`You were defeated by routine operational circumstances. Score: ${state.player.score.toLocaleString()}. The radio is still calling.`;
  }
}

function restartCurrent(){
  if(!selectedClass) return;
  initGame(selectedClass);
}

function overlap(a,b){
  return a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y;
}
