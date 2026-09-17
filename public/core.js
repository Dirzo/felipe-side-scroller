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
    label: 'METALLURGIST', color: '#47d7ff', accent:'#b9ff4a', maxHp: 92, speed: 330,
    attackCooldown: .27, damage: 19, range: 250, specialName:'MASS BALANCE MELTDOWN'
  },
  operator: {
    label: 'OPERATOR', color: '#ffcf4a', accent:'#ff9d39', maxHp: 128, speed: 290,
    attackCooldown: .39, damage: 29, range: 88, specialName:'LINEOUT AUTHORITY'
  },
  mechanic: {
    label: 'MILL MECHANIC', color: '#ff7a7d', accent:'#d9e5ea', maxHp: 108, speed: 320,
    attackCooldown: .24, damage: 22, range: 96, specialName:'PERCUSSIVE MAINTENANCE'
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
    this.kind=kind;
    this.classData=c;
    this.maxHp=c.maxHp;
    this.hp=c.maxHp;
    this.level=1;
    this.xp=0;
    this.nextXp=100;
    this.attackTimer=0;
    this.attackBuffer=0;
    this.meleeStep=0;
    this.meleeWindow=0;
    this.special=100;
    this.specialCooldown=0;
    this.dodgeTimer=0;
    this.dodgeCooldown=0;
    this.invuln=0;
    this.facing=1;
    this.grounded=true;
    this.combo=0;
    this.comboTimer=0;
    this.score=0;
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
      this.vy=-680;
      this.grounded=false;
    }
    this.vy += 1650*dt;
    this.y += this.vy*dt;
    if(this.y>=FLOOR-this.h){
      this.y=FLOOR-this.h;
      this.vy=0;
      this.grounded=true;
    }

    this.attackTimer=Math.max(0,this.attackTimer-dt);
    this.attackBuffer=Math.max(0,this.attackBuffer-dt);
    this.meleeWindow=Math.max(0,this.meleeWindow-dt);
    this.specialCooldown=Math.max(0,this.specialCooldown-dt);
    this.dodgeTimer=Math.max(0,this.dodgeTimer-dt);
    this.dodgeCooldown=Math.max(0,this.dodgeCooldown-dt);
    this.invuln=Math.max(0,this.invuln-dt);
    this.comboTimer=Math.max(0,this.comboTimer-dt);
    if(this.comboTimer<=0) this.combo=0;
    this.special=Math.min(100,this.special+7*dt);

    if(justPressed.has('KeyJ')) this.attackBuffer=.14;
    if(this.attackBuffer>0 && this.attackTimer<=0) this.attack();
    if(justPressed.has('KeyK')) this.useSpecial();

    const dodgePressed=justPressed.has('ShiftLeft')||justPressed.has('ShiftRight')||justPressed.has('KeyL');
    if(dodgePressed && this.dodgeCooldown<=0){
      this.dodgeTimer=.20;
      this.dodgeCooldown=.52;
      this.invuln=Math.max(this.invuln,.32);
      this.x=Math.max(35,Math.min(W-90,this.x+this.facing*58));
    }
  }
  attack(){
    if(this.attackTimer>0 || state.dialogueActive) return;
    this.attackBuffer=0;

    if(this.kind==='metallurgist'){
      this.attackTimer=this.classData.attackCooldown;
      const shotY=this.y+this.h*.68;
      state.projectiles.push(new Projectile(
        this.cx+this.facing*30,
        shotY,
        this.facing*720,
        0,
        this.classData.damage,
        'player',
        '#47d7ff',
        12
      ));
      state.shake=Math.max(state.shake,1.5);
      return;
    }

    if(this.meleeWindow>0) this.meleeStep=(this.meleeStep+1)%3;
    else this.meleeStep=0;
    this.meleeWindow=.52;

    const finisher=this.meleeStep===2;
    const reach=this.classData.range+(this.kind==='mechanic'&&!this.grounded?30:0)+(finisher?16:0);
    const damageMult=this.meleeStep===0?1:(this.meleeStep===1?1.15:1.45);
    const cooldownMult=finisher?1.12:.88;
    this.attackTimer=this.classData.attackCooldown*cooldownMult;

    this.x=Math.max(35,Math.min(W-90,this.x+this.facing*(finisher?18:10)));
    const box={
      x:this.facing>0?this.x+this.w-4:this.x-reach+4,
      y:this.y+8,
      w:reach,
      h:this.h-14
    };
    let hit=false;
    for(const e of state.enemies){
      if(!e.dead && overlap(box,e)){
        let mult=damageMult;
        if(this.kind==='mechanic'&&!this.grounded) mult*=1.4;
        e.hurt(this.classData.damage*mult,this.facing*(finisher?330:190));
        hit=true;
      }
    }
    if(hit) state.shake=Math.max(state.shake,finisher?8:4);
  }
  useSpecial(){
    if(this.special<100 || this.specialCooldown>0 || state.dialogueActive) return;
    this.special=0;
    this.specialCooldown=.7;
    showBanner(this.classData.specialName,900);
    if(this.kind==='metallurgist'){
      for(const e of state.enemies){
        if(!e.dead){
          e.hurt(32,(e.cx<this.cx?-1:1)*260);
          e.slow=1.5;
        }
      }
      this.heal(18);
      state.effects.push({type:'ring',x:this.cx,y:this.cy,r:20,max:520,t:.55,color:'#47d7ff'});
    }
    if(this.kind==='operator'){
      this.invuln=1.1;
      for(const e of state.enemies){
        if(!e.dead && Math.abs(e.cx-this.cx)<270){
          e.hurt(48,(e.cx<this.cx?-1:1)*340);
          e.stun=.65;
        }
      }
      state.effects.push({type:'ring',x:this.cx,y:this.cy,r:20,max:330,t:.45,color:'#ffcf4a'});
    }
    if(this.kind==='mechanic'){
      this.vy=-260;
      for(const e of state.enemies){
        if(!e.dead && Math.abs(e.cx-this.cx)<230){
          e.hurt(42,(e.cx<this.cx?-1:1)*420);
          e.stun=.45;
        }
      }
      state.effects.push({type:'ring',x:this.cx,y:FLOOR-14,r:20,max:360,t:.38,color:'#ff7a7d'});
      state.shake=12;
    }
  }
  hurt(amount, knock=0){
    if(this.invuln>0 || state.gameEnded) return;
    this.hp-=amount;
    this.invuln=.7;
    this.meleeWindow=0;
    this.meleeStep=0;
    this.vx=knock;
    this.x=Math.max(35,Math.min(W-90,this.x+Math.sign(knock)*18));
    state.shake=8;
    state.effects.push({type:'hit',x:this.cx,y:this.cy,t:.22,color:'#ff5d62'});
    if(this.hp<=0){
      this.hp=0;
      endGame(false);
    }
  }
  heal(amount){
    this.hp=Math.min(this.maxHp,this.hp+amount);
  }
  gainXp(amount){
    this.xp+=amount;
    this.special=Math.min(100,this.special+amount*.35);
    while(this.xp>=this.nextXp){
      this.xp-=this.nextXp;
      this.level++;
      this.nextXp=Math.floor(this.nextXp*1.28);
      this.maxHp+=10;
      this.hp=this.maxHp;
      this.classData.damage+=3;
      showBanner(`LEVEL ${this.level} // +10 HP // +3 DAMAGE`,1200);
    }
  }
}
