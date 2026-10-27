(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.NoodleMotion=api;})(globalThis,function(){
  const damp=(a,b,rate,dt)=>a+(b-a)*(-Math.expm1(-rate*Math.max(0,dt)));
  const angle=(a,b,dt)=>a+Math.atan2(Math.sin(b-a),Math.cos(b-a))*(-Math.expm1(-14*Math.max(0,dt)));
  const smooth=v=>{v=Math.max(0,Math.min(1,v));return v*v*(3-2*v);};
  function advance(s,g,dt,paused=false){
    if(!s||Math.hypot(g.x-s.x,g.z-s.z)>3)return {x:g.x,z:g.z,yaw:g.facing||0,distance:0,amount:0};
    if(paused||dt<=0)return s;
    const x=damp(s.x,g.x,24,dt),z=damp(s.z,g.z,24,dt),d=Math.hypot(x-s.x,z-s.z);
    s.x=x;s.z=z;s.yaw=angle(s.yaw,g.facing||0,dt);s.distance+=d;
    s.amount=damp(s.amount,Math.min(1,d/Math.max(dt,.001)/.8),d>.0001?14:10,dt);
    return s;
  }
  const baseHeight=scale=>.22-scale*(.85-.61-.045);
  function foot(distance,index,amount){
    const phase=((distance/.8+index*.5)%1+1)%1;
    const t=phase<.5?phase*2:(phase-.5)*2;
    return {z:(phase<.5?.2-.4*t:-.2+.4*smooth(t))*amount,lift:phase<.5?0:Math.sin(t*Math.PI)**2*.085*amount};
  }
  function leg(z,down){
    const d=Math.min(.64999,Math.hypot(z,down)),clamp=v=>Math.max(-1,Math.min(1,v));
    const knee=Math.acos(clamp((d*d-.33**2-.32**2)/(2*.33*.32)));
    const hip=Math.atan2(-z,down)-Math.acos(clamp((.33**2+d*d-.32**2)/(2*.33*d)));
    return {hip,knee,ankle:-hip-knee};
  }
  const movable=g=>['arriving','queue','waitingSeat','toSeat','leaving'].includes(g.phase);
  function turn(yaw,target){const error=Math.atan2(Math.sin(target-yaw),Math.cos(target-yaw));return {error,stride:1-.6*smooth(Math.abs(error)/(Math.PI*.75)),look:Math.max(-.25,Math.min(.25,error*.32))};}
  function seatBlend(previous,target,error,dt){const aligned=1-smooth(Math.max(0,Math.abs(error)-.15)/.65);return damp(previous,target>previous?target*aligned:target,18,dt);}
  function handoff(from,to,seconds,reduced=false){const t=smooth(seconds/.45);if(t===0)return {...from};if(t===1)return {...to};return {x:from.x+(to.x-from.x)*t,y:from.y+(to.y-from.y)*t+(reduced?0:Math.sin(t*Math.PI)*.06),z:from.z+(to.z-from.z)*t};}
  function crowd(people){
    const out=people.map(g=>({...g}));
    let nearby=null;
    if(out.length>=32){
      nearby=out.map(()=>[]);const sorted=out.map((g,i)=>i).sort((a,b)=>out[a].x-out[b].x);
      // Original positions plus both maximum offsets bound all possible contacts.
      for(let a=0;a<sorted.length;a++)for(let b=a+1;b<sorted.length;b++){const i=sorted[a],j=sorted[b];if(out[j].x-out[i].x>1.3)break;if(Math.abs(out[j].z-out[i].z)>1.3)continue;nearby[i].push(j);nearby[j].push(i);}
      for(const indices of nearby)indices.sort((a,b)=>a-b);
    }
    for(let pass=0;pass<4;pass++){
    for(let i=0;i<out.length;i++){
      const a=out[i],original=people[i];if(!movable(a))continue;
      const neighbors=nearby?nearby[i]:null;
      const count=neighbors?neighbors.length:out.length;
      for(let k=0;k<count;k++){const j=neighbors?neighbors[k]:k;if(i===j)continue;const b=out[j],dx=a.x-b.x,dz=a.z-b.z,gap=b.phase==='robot'?.65:.48;if(Math.abs(dx)>=gap||Math.abs(dz)>=gap)continue;const d=Math.hypot(dx,dz);
        if(d>=gap)continue;const direction=i<j?-1:1,ux=d>.0001?dx/d:direction,uz=d>.0001?dz/d:0,weight=movable(b)?.5:1;
        a.x+=ux*(gap-d)*weight;a.z+=uz*(gap-d)*weight;
        const ox=a.x-original.x,oz=a.z-original.z,offset=Math.hypot(ox,oz);if(offset>.32){a.x=original.x+ox/offset*.32;a.z=original.z+oz/offset*.32;}
      }
      let dx=a.x-original.x,dz=a.z-original.z,d=Math.hypot(dx,dz);if(d>.32){a.x=original.x+dx/d*.32;a.z=original.z+dz/d*.32;}
      if(d<1e-10)continue;
      // Reject side steps whose segment would enter a tabletop footprint.
      let blocked=false;for(const x of [-2.4,.8])for(const z of [5.25,7.65])for(let t=0;t<=1;t+=.25){const px=original.x+(a.x-original.x)*t,pz=original.z+(a.z-original.z)*t;if(Math.abs(px-x)<.74&&Math.abs(pz-z)<.57)blocked=true;}
      if(blocked){a.x=original.x;a.z=original.z;}
    }
    }
    return out;
  }
  return {damp,angle,smooth,advance,foot,leg,baseHeight,crowd,turn,seatBlend,handoff};
});
