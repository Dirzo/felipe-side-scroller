function aimedVelocity(x,y,targetX,targetY,speed,angleOffset=0){
  const angle=Math.atan2(targetY-y,targetX-x)+angleOffset;
  return {vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed};
}

function circleRectHit(projectile,target,pad=0){
  const radius=projectile.r+pad;
  const cx=projectile.cx;
  const cy=projectile.cy;
  const nearestX=Math.max(target.x,Math.min(cx,target.x+target.w));
  const nearestY=Math.max(target.y,Math.min(cy,target.y+target.h));
  const dx=cx-nearestX;
  const dy=cy-nearestY;
  return dx*dx+dy*dy<=radius*radius;
}

class Enemy extends Entity {
  constructor(type,x){
    const defs={
      rock:{w:48,h:42,hp:38,speed:120,damage:11,xp:18,color:'#828e95'},
      grease:{w:46,h:62,hp:54,speed:165,damage:13,xp:24,color:'#7dd18f'},
      forklift:{w:102,h:64,hp:170,speed:100,damage:22,xp:70,color:'#f7b955'},
      froth:{w:54,h:54,hp:48,speed:145,damage:12,xp:22,color:'#d6ecf2'},
      sample:{w:42,h:58,hp:60,speed:105,damage:14,xp:28,color:'#b278db'},
      spark:{w:38,h:38,hp:44,speed:210,damage:12,xp:24,color:'#68dfff'},
      stator:{w:164,h:168,hp:720,speed:86,damage:24,xp:300,color:'#cc6b54'}
    };
    const d=defs[type];
    super(x,FLOOR-d.h,d.w,d.h);
    Object.assign(this,{
      type,maxHp:d.hp,hp:d.hp,speed:d.speed,damage:d.damage,xp:d.xp,color:d.color,
      attackCd:Math.random()*.8,stun:0,slow:0,phase:0
    });
  }
  update(dt){
    if(this.dead) return;
    this.stun=Math.max(0,this.stun-dt);
    this.slow=Math.max(0,this.slow-dt);
    this.attackCd=Math.max(0,this.attackCd-dt);
    if(this.stun>0) return;

    const p=state.player;
    const dir=Math.sign(p.cx-this.cx)||1;
    const dist=Math.abs(p.cx-this.cx);
    const mult=this.slow>0?.45:1;
    const verticalClose=Math.abs(p.cy-this.cy)<(p.h+this.h)*.43;

    if(this.type==='stator'){
      this.updateBoss(dt,dir,dist,verticalClose);
      return;
    }

    if(this.type==='sample' && dist<430 && this.attackCd<=0){
      const shot=aimedVelocity(this.cx,this.cy-10,p.cx,p.cy,410);
      state.projectiles.push(new Projectile(this.cx,this.cy-10,shot.vx,shot.vy,12,'enemy','#c490f0',9));
      this.attackCd=1.65;
      return;
    }

    if(this.type==='spark' && dist<400 && this.attackCd<=0){
      const shot=aimedVelocity(this.cx,this.cy,p.cx,p.cy,545);
      state.projectiles.push(new Projectile(this.cx,this.cy,shot.vx,shot.vy,10,'enemy','#79e7ff',7));
      this.attackCd=1.18;
      return;
    }

    const meleeRange=this.w*.55+p.w*.55+10;
    if(dist>meleeRange || !verticalClose){
      this.x += dir*this.speed*mult*dt;
    }else if(this.attackCd<=0){
      p.hurt(this.damage,dir*140);
      this.attackCd=this.type==='forklift'?1.45:1.05;
    }
  }
  updateBoss(dt,dir,dist,verticalClose){
    const p=state.player;
    this.phase += dt;
    if(this.hp<this.maxHp*.55) this.speed=125;

    if(this.attackCd<=0){
      if(dist<175 && verticalClose){
        p.hurt(this.damage,dir*240);
        this.attackCd=1.1;
        state.shake=10;
      }else if(Math.random()<.5){
        for(const offset of [-.13,0,.13]){
          const shot=aimedVelocity(this.cx,this.cy-20,p.cx,p.cy,465,offset);
          state.projectiles.push(new Projectile(this.cx,this.cy-20,shot.vx,shot.vy,15,'enemy','#ff9b69',13));
        }
        this.attackCd=this.hp<this.maxHp*.55?1.35:1.62;
      }else{
        const currentState=state;
        const bx=p.cx;
        state.effects.push({type:'warning',x:bx,y:FLOOR-16,t:.65,color:'#ff5d62'});
        setTimeout(()=>{
          if(state!==currentState||!state||state.gameEnded) return;
          state.effects.push({type:'blast',x:bx,y:FLOOR-12,t:.4,color:'#ff9d39'});
          const nearBlast=Math.abs(state.player.cx-bx)<92;
          const nearGround=state.player.y+state.player.h>FLOOR-64;
          if(nearBlast&&nearGround){
            const knock=state.player.cx<bx?-180:180;
            state.player.hurt(20,knock);
          }
        },580);
        this.attackCd=this.hp<this.maxHp*.55?1.5:1.85;
      }
    }

    if(dist>145 || !verticalClose){
      this.x += dir*this.speed*dt;
    }
  }
  hurt(amount,knock=0){
    if(this.dead) return;
    this.hp-=amount;
    this.x+=knock*.035;
    this.stun=Math.max(this.stun,.08);
    state.shake=Math.max(state.shake,3);
    state.effects.push({type:'hit',x:this.cx,y:this.cy,t:.15,color:'#ffffff'});
    if(this.hp<=0){
      this.dead=true;
      state.player.gainXp(this.xp);
      state.player.score+=Math.round(this.xp*(1+state.player.combo*.08));
      state.player.combo++;
      state.player.comboTimer=2.1;
      if(Math.random()<.2 && this.type!=='stator'){
        state.pickups.push(new Pickup(this.cx,this.y,'health'));
      }
      if(this.type==='stator'){
        state.pickups.push(new Pickup(this.cx,this.y,'golden'));
      }
      state.effects.push({type:'burst',x:this.cx,y:this.cy,t:.45,color:this.color});
    }
  }
}

class Projectile extends Entity {
  constructor(x,y,vx,vy,damage,owner,color,r){
    super(x-r,y-r,r*2,r*2);
    Object.assign(this,{vx,vy,damage,owner,color,r,life:2.2});
  }
  update(dt){
    this.life-=dt;
    this.x+=this.vx*dt;
    this.y+=this.vy*dt;
    this.vy += (this.owner==='enemy'?50:0)*dt;

    if(this.life<=0||this.x<-80||this.x>W+80||this.y<-80||this.y>H+80){
      this.dead=true;
      return;
    }

    if(this.owner==='player'){
      for(const e of state.enemies){
        if(!e.dead&&circleRectHit(this,e,5)){
          e.hurt(this.damage,Math.sign(this.vx)*180);
          this.dead=true;
          break;
        }
      }
    }else if(circleRectHit(this,state.player,2)){
      state.player.hurt(this.damage,Math.sign(this.vx)*130);
      this.dead=true;
    }
  }
}

class Pickup extends Entity {
  constructor(x,y,type){
    super(x-16,y-22,32,32);
    this.type=type;
    this.vy=-260;
    this.life=10;
  }
  update(dt){
    this.life-=dt;
    this.vy+=900*dt;
    this.y+=this.vy*dt;
    if(this.y>FLOOR-30){
      this.y=FLOOR-30;
      this.vy=0;
    }
    if(overlap(this,state.player)){
      if(this.type==='health'){
        state.player.heal(24);
        showBanner('+24 HP // FIRST AID KIT',600);
      }else{
        state.player.heal(999);
        state.player.special=100;
        showBanner('GOLDEN STATOR BEARING ACQUIRED',1100);
      }
      this.dead=true;
    }
    if(this.life<=0) this.dead=true;
  }
}
