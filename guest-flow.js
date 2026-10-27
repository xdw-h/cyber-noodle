(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.NoodleGuestFlow=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const Routes=typeof module==='object'&&module.exports?require('./travel-routes.js'):globalThis.NoodleTravel;
  const SEATS=[];
  for(const z of [5.25,7.65])for(const x of [-2.4,.8])for(const side of [-1,1])SEATS.push({x:x+side*.83,z,facing:side<0?Math.PI/2:-Math.PI/2,tableX:x,tableZ:z});
  const EXIT=Routes.exit();
  function create(){return {day:null,localServed:0,previous:new Map(),previousCurrent:null,guests:new Map(),seats:SEATS.map(()=>null),finished:0,clock:0};}
  function leave(g){const seat=g.seat===null?null:SEATS[g.seat];g.phase='leaving';g.path=seat?[[seat.x,seat.z+.8],[-.65,seat.z+.8],[-.65,4.05],...EXIT.map(p=>p.slice())]:EXIT.map(p=>p.slice());g.phaseTime=0;g.seat=null;}
  function seatPath(seat){const p=SEATS[seat];return [[-.65,4.05],[-.65,p.z-.8],[p.x,p.z-.8],[p.x,p.z]];}
  function sync(f,s){
    const local=s.stats.served-(s.stats.delivered||0);
    if(f.day!==s.day||local<f.localServed){f.day=s.day;f.guests.clear();f.seats.fill(null);f.previous.clear();f.previousCurrent=null;f.localServed=local;f.finished=0;}
    const active=new Map(s.orders.filter(o=>o.channel!=='delivery').map(o=>[o.id,o]));
    if(s.current&&s.current.channel!=='delivery')active.set(s.current.id,s.current);
    let completed=Math.max(0,local-f.localServed);
    const vanished=[...f.previous.keys()].filter(id=>!active.has(id));
    vanished.sort((a,b)=>(a===f.previousCurrent?-1:b===f.previousCurrent?1:0));
    for(const id of vanished){const g=f.guests.get(id);if(!g)continue;if(completed>0){g.ready=true;completed--;}else if(!g.ready&&['arriving','queue'].includes(g.phase))leave(g);}
    for(const [id,o] of active){if(!f.guests.has(id)){const entry=Routes.enter();f.guests.set(id,{id,profile:o.person||0,name:o.customer||'街角食客',type:o.type,takeaway:o.channel==='takeout',phase:'arriving',phaseTime:0,x:entry[0][0],z:entry[0][1],facing:0,ready:false,seat:null,path:entry.slice(1),walk:0});}}
    f.localServed=local;f.previous=active;f.previousCurrent=s.current?.id;
  }
  function move(g,target,dt,speed=3.2){const dx=target[0]-g.x,dz=target[1]-g.z,d=Math.hypot(dx,dz);if(d<.035){g.x=target[0];g.z=target[1];return true;}const step=Math.min(d,dt*speed);g.x+=dx/d*step;g.z+=dz/d*step;g.facing=Math.atan2(dx,dz);g.walk+=step;return step===d;}
  function tick(f,dt,paused=false){
    if(paused||!Number.isFinite(dt)||dt<=0)return;
    if(dt>.25){for(let remaining=Math.min(dt,1);remaining>.00001;remaining-=.2)tick(f,Math.min(.2,remaining));return;}f.clock+=dt;
    const queue=[...f.guests.values()].filter(g=>['arriving','queue'].includes(g.phase));
    for(const g of [...f.guests.values()]){
      g.phaseTime+=dt;
      if(g.phase==='arriving'){
        if(g.path.length){if(move(g,g.path[0],dt))g.path.shift();}
        else{g.phase='queue';g.phaseTime=0;}
      }else if(g.phase==='queue'){
        const index=queue.indexOf(g),target=index<3?[-2.4,1.85+index*.72]:[-5.1,1.85+(index-3)*.72];
        if(move(g,target,dt,2.6)){g.facing=Math.PI;if(g.ready&&index===0&&g.phaseTime>1.2){if(g.takeaway){leave(g);continue;}const seat=f.seats.indexOf(null);if(seat>=0){g.seat=seat;f.seats[seat]=g.id;g.phase='toSeat';g.path=seatPath(seat);g.phaseTime=0;}else{g.phase='waitingSeat';g.phaseTime=0;}}}
      }else if(g.phase==='waitingSeat'){
        move(g,[-4.2,4.4+(g.id%3)*.5],dt);
        const seat=f.seats.indexOf(null);if(seat>=0){g.seat=seat;f.seats[seat]=g.id;g.phase='toSeat';g.path=seatPath(seat);g.phaseTime=0;}
      }else if(g.phase==='toSeat'){
        if(g.path.length){if(move(g,g.path[0],dt,2.5))g.path.shift();}else{g.phase='sitting';g.phaseTime=0;g.facing=SEATS[g.seat].facing;}
      }else if(g.phase==='sitting'&&g.phaseTime>.7){g.phase='eating';g.phaseTime=0;
      }else if(g.phase==='eating'&&g.phaseTime>14+(g.id%4)*2){g.phase='standing';g.phaseTime=0;
      }else if(g.phase==='standing'&&g.phaseTime>.7){f.seats[g.seat]=null;leave(g);
      }else if(g.phase==='leaving'){
        if(g.path.length){if(move(g,g.path[0],dt))g.path.shift();}else{f.guests.delete(g.id);f.finished++;}
      }
    }
  }
  function counts(f){const all=[...f.guests.values()];return {queue:all.filter(g=>['arriving','queue'].includes(g.phase)).length,seated:all.filter(g=>['sitting','eating','standing'].includes(g.phase)).length,waitingSeat:all.filter(g=>g.phase==='waitingSeat').length,occupied:f.seats.filter(x=>x!==null).length,capacity:SEATS.length,finished:f.finished};}
  return {SEATS,create,sync,tick,counts};
});
