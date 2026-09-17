import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

function makeClassList(){
  const values=new Set();
  return {
    add(...items){ for(const item of items) values.add(item); },
    remove(...items){ for(const item of items) values.delete(item); },
    toggle(item,force){
      if(force===true){ values.add(item); return true; }
      if(force===false){ values.delete(item); return false; }
      if(values.has(item)){ values.delete(item); return false; }
      values.add(item); return true;
    },
    contains(item){ return values.has(item); }
  };
}

function makeElement(){
  return {
    classList:makeClassList(),
    style:{},
    textContent:'',
    disabled:false,
    addEventListener(){},
    closest(){ return null; }
  };
}

const elements=new Map();
const canvas=makeElement();
canvas.width=1280;
canvas.height=720;
canvas.getContext=()=>({});
elements.set('game',canvas);

const document={
  getElementById(id){
    if(!elements.has(id)) elements.set(id,makeElement());
    return elements.get(id);
  },
  querySelectorAll(){ return []; }
};

const context=vm.createContext({
  console,
  document,
  performance:{now:()=>0},
  setTimeout,
  clearTimeout,
  Math,
  globalThis:null
});
context.globalThis=context;

for(const file of ['public/core.js','public/entities.js','public/gameplay.js']){
  const source=fs.readFileSync(new URL(`../${file}`,import.meta.url),'utf8');
  vm.runInContext(source,context,{filename:file});
}

const testSource=`
(function(){
  const results=[];
  function test(name,fn){
    try{ fn(); results.push({name,ok:true}); }
    catch(error){ results.push({name,ok:false,error:error.message}); }
  }
  function quietGame(kind){
    initGame(kind);
    state.dialogueQueue=[];
    state.dialogueActive=false;
    dialogue.classList.add('hidden');
    state.enemies=[];
    state.projectiles=[];
    return state.player;
  }
  function fireUntilResolved(enemyType){
    const p=quietGame('metallurgist');
    p.x=180; p.y=FLOOR-p.h; p.facing=1;
    const e=new Enemy(enemyType,390);
    state.enemies=[e];
    p.attackTimer=0;
    p.attack();
    for(let i=0;i<90 && state.projectiles.length;i++){
      for(const shot of state.projectiles) shot.update(1/60);
      state.projectiles=state.projectiles.filter(shot=>!shot.dead);
    }
    return {e,p};
  }

  test('metallurgist projectile hits rocks',()=>{
    const {e}=fireUntilResolved('rock');
    if(!(e.hp<e.maxHp)) throw new Error('rock took no damage');
  });

  test('metallurgist projectile hits sparks',()=>{
    const {e}=fireUntilResolved('spark');
    if(!(e.hp<e.maxHp)) throw new Error('spark took no damage');
  });

  test('jumping over melee enemies avoids contact damage',()=>{
    const p=quietGame('operator');
    p.x=180; p.y=300; p.grounded=false;
    const e=new Enemy('rock',220);
    e.attackCd=0;
    state.enemies=[e];
    const hp=p.hp;
    e.update(1/60);
    if(p.hp!==hp) throw new Error('airborne player was hit by ground melee');
  });

  test('dodge cannot be chained into permanent invulnerability',()=>{
    const p=quietGame('mechanic');
    p.x=300;
    justPressed.add('ShiftLeft');
    p.update(1/60);
    justPressed.clear();
    const firstX=p.x;
    p.update(.21);
    justPressed.add('ShiftLeft');
    p.update(1/60);
    justPressed.clear();
    if(Math.abs(p.x-firstX)>1) throw new Error('second dodge fired before cooldown ended');
    if(!(p.dodgeCooldown>0)) throw new Error('dodge cooldown not active');
  });

  test('melee chain rewards the third hit',()=>{
    const p=quietGame('operator');
    p.x=180; p.y=FLOOR-p.h; p.facing=1;
    const e=new Enemy('forklift',260);
    state.enemies=[e];
    const hits=[];
    for(let i=0;i<3;i++){
      e.x=260;
      const before=e.hp;
      p.attackTimer=0;
      p.attack();
      hits.push(before-e.hp);
    }
    if(!(hits[1]>hits[0] && hits[2]>hits[1])) throw new Error('combo damage did not scale: '+hits.join(','));
  });

  test('clearing a wave restores a small amount of health and special',()=>{
    const p=quietGame('operator');
    p.hp=p.maxHp-20;
    p.special=50;
    state.wave=0;
    state.waveRewarded=-1;
    rewardWaveClear();
    if(!(p.hp>p.maxHp-20)) throw new Error('wave clear did not heal');
    if(p.special!==60) throw new Error('wave clear special reward incorrect');
  });

  globalThis.__results=results;
})();
`;

vm.runInContext(testSource,context,{filename:'smoke-tests'});
const results=context.__results;
for(const result of results){
  console.log(`${result.ok?'PASS':'FAIL'}  ${result.name}${result.error?` — ${result.error}`:''}`);
}
assert.equal(results.every(result=>result.ok),true,'one or more gameplay smoke tests failed');
console.log(`\n${results.length} gameplay smoke tests passed.`);
