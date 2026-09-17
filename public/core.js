const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const menu = document.getElementById('menu');
const gamePanel = document.getElementById('gamePanel');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const retryBtn = document.getElementById('retryBtn');
const classGrid = document.getElementById('classGrid');
const classLabel = document.getElementById('classLabel');
const levelLabel = document.getElementById('levelLabel');
const objectiveLabel = document.getElementById('objectiveLabel');
const hpFill = document.getElementById('hpFill');
const hpText = document.getElementById('hpText');
const xpFill = document.getElementById('xpFill');
const xpText = document.getElementById('xpText');
const specialFill = document.getElementById('specialFill');
const specialText = document.getElementById('specialText');
const banner = document.getElementById('banner');
const dialogue = document.getElementById('dialogue');
const speaker = document.getElementById('speaker');
const dialogueText = document.getElementById('dialogueText');
const gameOver = document.getElementById('gameOver');
const gameOverTitle = document.getElementById('gameOverTitle');
const gameOverText = document.getElementById('gameOverText');

const W = canvas.width;
const H = canvas.height;
const FLOOR = 585;
const keys = new Set();
const justPressed = new Set();

let selectedClass = null;
let state = null;
let last = performance.now();

const CLASSES = {
  metallurgist: {
    label: 'METALLURGIST', color: '#47d7ff', accent:'#b9ff4a', maxHp: 88, speed: 330,
    attackCooldown: .29, damage: 18, range: 250, specialName:'MASS BALANCE MELTDOWN'
  },
  operator: {
    label: 'OPERATOR', color: '#ffcf4a', accent:'#ff9d39', maxHp: 125, speed: 285,
    attackCooldown: .42, damage: 29, range: 84, specialName:'LINEOUT AUTHORITY'
  },
  mechanic: {
    label: 'MILL MECHANIC', color: '#ff7a7d', accent:'#d9e5ea', maxHp: 105, speed: 315,
    attackCooldown: .25, damage: 22, range: 94, specialName:'PERCUSSIVE MAINTENANCE'
  }
};

const STAGES = [
  {
    name:'CRUSHER BAY', objective:'Clear the crusher bay',
    intro:[
      ['RADIO', 'Control to whoever is nearest the crusher: the belt is “making a noise.”'],
      ['YOU', 'That is a sentence with absolutely no useful information.'],
      ['RADIO', 'Copy. Also there are rocks moving toward you.']
    ],
    waves:[
      [{type:'rock', count:5}],
      [{type:'rock', count:4},{type:'grease', count:2}],
      [{type:'grease', count:4},{type:'forklift', count:1}]
    ]
  },
  {
    name:'FLOTATION FLOOR', objective:'Save recovery from the froth goblins',
    intro:[
      ['PROCESS RADIO', 'Lead recovery is trending down. Zinc thinks it is funny.'],
      ['YOU', 'Of course it does.'],
      ['PROCESS RADIO', 'Also someone adjusted air without telling anyone. Classic.']
    ],
    waves:[
      [{type:'froth', count:5}],
      [{type:'froth', count:4},{type:'sample', count:3}],
      [{type:'froth', count:5},{type:'sample', count:4}]
    ]
  },
  {
    name:'ISA MILL PLATFORM', objective:'Defeat the exciter stator',
    intro:[
      ['E&I', 'We traced the VFD fault.'],
      ['YOU', 'Finally.'],
      ['E&I', 'It is not the VFD.'],
      ['YOU', 'I knew happiness was temporary.'],
      ['E&I', 'The exciter stator has become... hostile.']
    ],
    waves:[
      [{type:'spark', count:4},{type:'sample', count:2}],
      [{type:'stator', count:1}]
    ]
  }
];

class Entity {
  constructor(x,y,w,h){ Object.assign(this,{x,y,w,h,vx:0,vy:0,dead:false}); }
  get cx(){ return this.x + this.w/2; }
  get cy(){ return this.y + this.h/2; }
}

class Player extends Entity {
  constructor(kind){
    const c = {...CLASSES[kind]};
    super(180,FLOOR-88,54,88);
    this.kind=kind; this.classData=c; this.maxHp=c.maxHp; this.hp=c.maxHp;
    this.level=1; this.xp=0; this.nextXp=100; this.attackTimer=0; this.special=100;
    this.specialCooldown=0; this.dodgeTimer=0; this.invuln=0; this.facing=1; this.grounded=true;
    this.combo=0; this.comboTimer=0; this.score=0;
  }
  update(dt){
    const c=this.classData;
    let dir=0;
    if(keys.has('ArrowLeft')||keys.has('KeyA')) dir--;
    if(keys.has('ArrowRight')||keys.has('KeyD')) dir++;
    if(dir) this.facing=Math.sign(dir);
    const dodgeBoost=this.dodgeTimer>0?1.85:1;
    this.vx=dir*c.speed*dodgeBoost;
    this.x += this.vx*dt;
    this.x=Math.max(35,Math.min(W-90,this.x));

    if((justPressed.has('Space')||justPressed.has('KeyW')||justPressed.has('ArrowUp')) && this.grounded){
      this.vy=-680; this.grounded=false;
    }
    this.vy += 1650*dt;
    this.y += this.vy*dt;
    if(this.y>=FLOOR-this.h){ this.y=FLOOR-this.h; this.vy=0; this.grounded=true; }

    this.attackTimer=Math.max(0,this.attackTimer-dt);
    this.specialCooldown=Math.max(0,this.specialCooldown-dt);
    this.dodgeTimer=Math.max(0,this.dodgeTimer-dt);
    this.invuln=Math.max(0,this.invuln-dt);
    this.comboTimer=Math.max(0,this.comboTimer-dt);
    if(this.comboTimer<=0) this.combo=0;
    this.special=Math.min(100,this.special+7*dt);

    if(justPressed.has('KeyJ')) this.attack();
    if(justPressed.has('KeyK')) this.useSpecial();
    if((justPressed.has('ShiftLeft')||justPressed.has('ShiftRight')||justPressed.has('KeyL')) && this.dodgeTimer<=0){
      this.dodgeTimer=.24; this.invuln=.34; this.x += this.facing*52;
    }
  }
  attack(){
    if(this.attackTimer>0 || state.dialogueActive) return;
    this.attackTimer=this.classData.attackCooldown;
    if(this.kind==='metallurgist'){
      state.projectiles.push(new Projectile(this.cx+this.facing*24,this.cy-8,this.facing*680,0,this.classData.damage,'player','#47d7ff',10));
    } else {
      const reach=this.classData.range + (this.kind==='mechanic'&&!this.grounded?28:0);
      const box={x:this.facing>0?this.x+this.w:this.x-reach,y:this.y+12,w:reach,h:this.h-20};
      let hit=false;
      for(const e of state.enemies){
        if(!e.dead && overlap(box,e)){
          const mult=this.kind==='mechanic'&&!this.grounded?1.45:1;
          e.hurt(this.classData.damage*mult,this.facing*180); hit=true;
        }
      }
      if(hit) state.shake=Math.max(state.shake,4);
    }
  }
  useSpecial(){
    if(this.special<100 || this.specialCooldown>0 || state.dialogueActive) return;
    this.special=0; this.specialCooldown=.7;
    showBanner(this.classData.specialName,900);
    if(this.kind==='metallurgist'){
      for(const e of state.enemies){ if(!e.dead){ e.hurt(32, (e.cx<this.cx?-1:1)*260); e.slow=1.5; } }
      this.heal(18);
      state.effects.push({type:'ring',x:this.cx,y:this.cy,r:20,max:520,t:.55,color:'#47d7ff'});
    }
    if(this.kind==='operator'){
      this.invuln=1.1;
      for(const e of state.enemies){ if(!e.dead && Math.abs(e.cx-this.cx)<270){ e.hurt(48,(e.cx<this.cx?-1:1)*340); e.stun=.65; } }
      state.effects.push({type:'ring',x:this.cx,y:this.cy,r:20,max:330,t:.45,color:'#ffcf4a'});
    }
    if(this.kind==='mechanic'){
      this.vy=-260;
      for(const e of state.enemies){ if(!e.dead && Math.abs(e.cx-this.cx)<230){ e.hurt(42,(e.cx<this.cx?-1:1)*420); e.stun=.45; } }
      state.effects.push({type:'ring',x:this.cx,y:FLOOR-14,r:20,max:360,t:.38,color:'#ff7a7d'});
      state.shake=12;
    }
  }
  hurt(amount, knock=0){
    if(this.invuln>0 || state.gameEnded) return;
    this.hp-=amount; this.invuln=.7; this.vx=knock; this.x+=Math.sign(knock)*18; state.shake=8;
    state.effects.push({type:'hit',x:this.cx,y:this.cy,t:.22,color:'#ff5d62'});
    if(this.hp<=0){ this.hp=0; endGame(false); }
  }
  heal(amount){ this.hp=Math.min(this.maxHp,this.hp+amount); }
  gainXp(amount){
    this.xp+=amount; this.special=Math.min(100,this.special+amount*.35);
    while(this.xp>=this.nextXp){
      this.xp-=this.nextXp; this.level++; this.nextXp=Math.floor(this.nextXp*1.28);
      this.maxHp+=10; this.hp=this.maxHp; this.classData.damage+=3;
      showBanner(`LEVEL ${this.level} // +10 HP // +3 DAMAGE`,1200);
    }
  }
}
