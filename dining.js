(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.NoodleDining=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const Routes=typeof module==='object'&&module.exports?require('./travel-routes.js'):globalThis.NoodleTravel;
  const Sources=typeof module==='object'&&module.exports?require('./source-ledger.js'):globalThis.NoodleSources;
  const Relationships=typeof module==='object'&&module.exports?require('./resident-relationships.js'):globalThis.NoodleRelationships;
  const SEATS=[];
  for(const z of [5.25,7.65])for(const x of [-2.4,.8])for(const side of [-1,1])SEATS.push({x:x+side*.83,z,facing:side<0?Math.PI/2:-Math.PI/2,tableX:x,tableZ:z});
  const HOME=[-.65,3.5],EXIT=[[-.65,4.05],...Routes.exit()],POLICIES=['balanced','serve','clean'];
  const result=(ok,message)=>({ok,message});
  const stamp=s=>s.elapsed+(s.closingElapsed||0);
  const queueTarget=(i,j=0)=>i<3?[-2.4-j*.55,1.85+i*.9]:[-4.5-j*.55,1.85+(i-2)*.9];
  function create(enabled=false){return {enabled,autoSeat:true,autoClean:true,allowSharing:true,policy:'balanced',serverLevel:1,sequence:0,parties:[],readyMeals:[],tables:Array.from({length:4},(_,i)=>({id:i,seats:[null,null],dirty:[false,false],cleaning:false,requested:false,dirtyAt:0})),server:{x:HOME[0],z:HOME[1],facing:Math.PI,phase:'idle',job:null,path:[],timer:0,load:null},journal:[],departed:0};}
  function ensure(s){if(!s.dining)s.dining=create(!!s.future);return s.dining;}
  function valid(d){return !!d&&typeof d==='object'&&!Array.isArray(d)&&['enabled','autoSeat','autoClean','allowSharing'].every(k=>typeof d[k]==='boolean')&&POLICIES.includes(d.policy)&&[1,2].includes(d.serverLevel);}
  function reset(s){const old=ensure(s),d=create(old.enabled);for(const k of ['autoSeat','autoClean','allowSharing','policy','serverLevel'])d[k]=old[k];s.dining=d;return d;}
  function note(s,text){const d=ensure(s);d.journal.unshift({second:Math.floor(stamp(s)),text});d.journal=d.journal.slice(0,8);}
  function phase(p,next){p.phase=next;p.timer=0;for(const m of p.members)m.phaseTime=0;}
  function move(m,target,dt,speed=3.2){const dx=target[0]-m.x,dz=target[1]-m.z,d=Math.hypot(dx,dz),distance=Math.min(d,dt*speed);if(d>.001){m.x+=dx/d*distance;m.z+=dz/d*distance;m.facing=Math.atan2(dx,dz);m.walk=(m.walk||0)+distance;}return d<=distance+.001;}
  function follow(m,dt,speed){if(!m.path.length)return true;if(move(m,m.path[0],dt,speed))m.path.shift();return !m.path.length;}
  function arrive(s,offer,kind){
    const d=ensure(s);if(!d.enabled||s.phase!=='open')return null;
    if(d.parties.filter(p=>['arriving','reception'].includes(p.phase)).length>=5){s.stats.lost++;s.stats.diningAbandoned++;Sources.lost(s,offer,'queue');Relationships.fail(s,offer,'queue');return null;}
    const id=++d.sequence;kind=kind||['solo','friends','family','solo'][(id-1)%4];if(!['solo','friends','family'].includes(kind))return null;
    const size=kind==='solo'?1:2,p={id,kind,size,table:null,phase:'arriving',timer:0,age:0,patience:offer.patience+8,offer:{...offer},members:[]};
    for(let i=0;i<size;i++){const child=kind==='family'&&i===1,type=i===1?'egg':offer.type,entry=Routes.enter(i);p.members.push({id:id*10+i,profile:i===1?0:offer.person||0,name:child?'小朋友':i?'同伴':offer.customer||'食客',child,type,orderId:null,paid:false,cancelled:false,seat:null,phaseTime:0,x:entry[0][0],z:entry[0][1],facing:0,walk:0,path:entry.slice(1)});}
    for(const m of p.members)m.sourceId=Sources.demand(s,Sources.classify(offer));d.parties.push(p);s.stats.diningGuests+=size;return p;
  }
  function freeSlots(s,t,size){const d=ensure(s);if(t.cleaning||!d.allowSharing&&(t.seats.some(x=>x!==null)||t.dirty.some(Boolean)))return [];return t.seats.map((v,i)=>v===null&&!t.dirty[i]?i:-1).filter(i=>i>=0).slice(0,size);}
  function seatParty(s,id,tableId){
    const d=ensure(s),p=d.parties.find(p=>p.id===Number(id)),t=d.tables[Number(tableId)];
    if(s.phase!=='open'||!p||p.phase!=='reception'||!Number.isInteger(Number(tableId))||!t)return result(false,'请为到达接待台的客人选择有效桌位。');
    const slots=freeSlots(s,t,p.size);if(slots.length<p.size)return result(false,'这张桌的干净空位不足，双人客需要同桌两个座位。');
    p.table=t.id;p.members.forEach((m,i)=>{const slot=slots[i];t.seats[slot]=p.id;m.seat=t.id*2+slot;const seat=SEATS[m.seat];m.path=[[-3.05-i*.25,1.85],[-3.05-i*.25,3.95],[-.65,3.95],[-.65,seat.z-.8],[seat.x,seat.z-.8],[seat.x,seat.z]];});phase(p,'seating');note(s,`${p.size} 位${{solo:'食客',friends:'结伴客',family:'亲子客'}[p.kind]}安排到 ${t.id+1} 号桌`);return result(true,`已安排 ${t.id+1} 号桌，落座后点单。`);
  }
  function release(s,p){const d=ensure(s),t=d.tables[p.table];if(t)for(const m of p.members){if(m.seat===null)continue;const slot=m.seat%2;if(t.seats[slot]===p.id)t.seats[slot]=null;if(m.paid){t.dirty[slot]=true;t.dirtyAt=stamp(s);}}
    p.members.forEach(m=>{const seat=m.seat===null?null:SEATS[m.seat];m.path=seat?[[seat.x,seat.z+.8],[-.65,seat.z+.8],...EXIT.map(x=>x.slice())]:Routes.exit();});phase(p,'leaving');}
  function cancelOrder(s,id){const d=ensure(s);for(const p of d.parties)for(const m of p.members)if(m.orderId===id&&!m.paid)m.cancelled=true;}
  function ready(s,order){const d=ensure(s),p=d.parties.find(p=>p.id===order.partyId),m=p?.members.find(m=>m.orderId===order.id);if(!m||m.cancelled){s.stats.unfulfilled++;return;}d.readyMeals.push({...order,readyAt:stamp(s)});note(s,`${p.table+1} 号桌餐点出锅，等待服务机器人`);}
  function requestClean(s,id){const d=ensure(s),t=d.tables[Number(id)];if(!['open','closing'].includes(s.phase)||!Number.isInteger(Number(id))||!t||t.cleaning||!t.dirty.some(Boolean))return result(false,'这张桌暂时没有待清理餐具。');t.requested=true;return result(true,`已安排清理 ${t.id+1} 号桌。`);}
  function setPolicy(s,policy){if(!POLICIES.includes(policy))return result(false,'请选择均衡、送餐优先或清桌优先。');ensure(s).policy=policy;return result(true,'服务机器人策略已更新。');}
  function toggle(s,key){if(!['autoSeat','autoClean','allowSharing'].includes(key))return result(false,'没有这项服务设置。');ensure(s)[key]=!ensure(s)[key];return result(true,'堂食服务设置已更新。');}
  function upgradeServer(s){const d=ensure(s);if(s.phase!=='prep'||d.serverLevel>=2)return result(false,'服务机器人只能在营业前升级一次。');if(s.cash<220)return result(false,'升级服务机器人需要 ¥220。');s.cash-=220;s.stats.equipment+=220;d.serverLevel=2;return result(true,'服务机器人 Pro 就绪：移动更快，清桌由 4.2 秒缩短至 2.6 秒。');}
  function jobPath(table){const seat=SEATS[table*2];return [[-.65,3.95],[-.65,seat.z-.8],[seat.tableX,seat.z-.8]];}
  function startJob(s){
    const d=ensure(s),r=d.server;if(r.job)return;
    const dirty=d.tables.filter(t=>!t.cleaning&&t.dirty.some(Boolean)&&(d.autoClean||t.requested||s.phase==='closing')).sort((a,b)=>a.dirtyAt-b.dirtyAt);
    const cleaning=dirty.length&&(!d.readyMeals.length||d.policy==='clean'||d.policy==='balanced'&&stamp(s)-dirty[0].dirtyAt>9);
    if(cleaning){const t=dirty[0];t.cleaning=true;t.requested=false;r.job={kind:'clean',table:t.id,slots:t.dirty.map((v,i)=>v?i:-1).filter(i=>i>=0)};r.path=jobPath(t.id);r.phase='out';r.timer=0;r.load=null;}
    else if(d.readyMeals.length){const order=d.readyMeals.shift();r.job={kind:'deliver',order,table:order.tableId};r.path=[[-.65,1.75]];r.phase='pickup';r.timer=0;r.load=null;}
  }
  function serverStep(s,dt,onServed){
    const d=ensure(s),r=d.server;startJob(s);if(!r.job)return;
    const speed=d.serverLevel>1?4.5:3.4;
    if(['pickup','out','return'].includes(r.phase)){
      if(follow(r,dt,speed)){r.timer=0;if(r.phase==='pickup')r.phase='loading';else if(r.phase==='out')r.phase='working';else{r.job=null;r.phase='idle';r.load=null;r.facing=Math.PI;}}
    }else if(r.phase==='loading'){
      r.timer+=dt;if(r.timer>=.65){r.load='food';r.path=jobPath(r.job.table);r.phase='out';r.timer=0;}
    }else if(r.phase==='working'){
      r.timer+=dt;const duration=r.job.kind==='deliver'?.55:d.serverLevel>1?2.6:4.2;
      if(r.timer>=duration){
        if(r.job.kind==='deliver'){
          const o=r.job.order,p=d.parties.find(p=>p.id===o.partyId),m=p?.members.find(m=>m.orderId===o.id);
          if(m&&!m.paid&&!m.cancelled){const late=stamp(s)-o.diningAt>25;onServed({...o,serviceDiscount:late?.9:1});m.paid=true;m.phaseTime=0;if(late)s.stats.diningLate++;note(s,`${o.tableId+1} 号桌送达收款${late?' · 迟送九折':''}`);}r.load=null;
        }else{const t=d.tables[r.job.table];for(const slot of r.job.slots)t.dirty[slot]=false;t.cleaning=false;s.stats.tablesCleaned++;r.load='dirty';note(s,`${t.id+1} 号桌清理完成，可再次接待`);}
        r.path=jobPath(r.job.table).slice(0,-1).reverse().concat([HOME.slice()]);r.phase='return';r.timer=0;
      }
    }
  }
  function placeOrders(s,p){
    for(const m of p.members){if(m.cancelled)continue;m.orderId=++s.sequence;const o={...p.offer,sourceId:m.sourceId,id:m.orderId,type:m.type,person:m.profile,customer:m.name,price:s.prices[m.type],channel:'dinein',partyId:p.id,memberId:m.id,tableId:p.table,status:'waiting',age:0,patience:p.offer.patience+10,diningAt:stamp(s),tags:[`${p.table+1}号桌`,p.kind==='family'?'亲子同桌':p.kind==='friends'?'结伴同桌':'堂食']};Relationships.begin(s,o);s.orders.push(o);}phase(p,'waitingMeal');note(s,`${p.table+1} 号桌已点 ${p.size} 份炒粉`);
  }
  function step(s,dt,onServed){
    const d=ensure(s);if(!d.enabled)return;
    const reception=d.parties.filter(p=>['arriving','reception'].includes(p.phase));
    for(const p of [...d.parties]){
      p.timer+=dt;p.age+=dt;p.members.forEach(m=>m.phaseTime+=dt);
      if(['arriving','reception'].includes(p.phase)&&p.age>p.patience){for(const m of p.members)Sources.lost(s,m,'timeout');Relationships.fail(s,p.offer,'seating');s.stats.lost+=p.size;s.stats.diningAbandoned+=p.size;s.reputation=Math.max(0,Math.round((s.reputation-p.size*.8)*100)/100);note(s,`${p.size} 位客人等位过久离开`);release(s,p);continue;}
      if(p.phase==='arriving'){if(p.members.map(m=>follow(m,dt)).every(Boolean))phase(p,'reception');}
      else if(p.phase==='reception'){
        const i=reception.indexOf(p);const at=p.members.map((m,j)=>move(m,queueTarget(i,j),dt,2.6)).every(Boolean);p.members.forEach(m=>{if(at)m.facing=Math.PI;});
        if(d.autoSeat&&at&&s.phase==='open'){const tables=d.tables.slice().sort((a,b)=>Number(b.seats.some(x=>x!==null))-Number(a.seats.some(x=>x!==null)));const t=tables.find(t=>freeSlots(s,t,p.size).length>=p.size);if(t)seatParty(s,p.id,t.id);}
      }else if(p.phase==='seating'){
        if(p.members.map(m=>follow(m,dt,2.8)).every(Boolean)){p.members.forEach(m=>m.facing=SEATS[m.seat].facing);phase(p,'sitting');}
      }else if(p.phase==='sitting'&&p.timer>=.7)phase(p,'ordering');
      else if(p.phase==='ordering'&&p.timer>=1.4){if(s.phase==='open')placeOrders(s,p);else release(s,p);}
      else if(p.phase==='waitingMeal'&&p.members.every(m=>m.paid||m.cancelled)){
        if(p.members.some(m=>m.paid))phase(p,'eating');else release(s,p);
      }else if(p.phase==='eating'&&p.timer>=14+(p.kind==='family'?5:p.kind==='friends'?3:0))phase(p,'standing');
      else if(p.phase==='standing'&&p.timer>=.7)release(s,p);
      else if(p.phase==='leaving'&&p.members.map(m=>follow(m,dt)).every(Boolean)){d.parties.splice(d.parties.indexOf(p),1);d.departed+=p.size;}
    }
    serverStep(s,dt,onServed);
  }
  function close(s){const d=ensure(s),keep=new Set(d.readyMeals.map(o=>o.id));if(s.current?.channel==='dinein')keep.add(s.current.id);if(d.server.job?.kind==='deliver')keep.add(d.server.job.order.id);
    for(const p of d.parties){if(p.phase==='leaving'||p.phase==='eating'||p.phase==='standing')continue;for(const m of p.members)if(!m.paid&&!keep.has(m.orderId)){if(m.orderId)s.stats.unfulfilled++;m.cancelled=true;}if(p.members.every(m=>m.cancelled&&!m.paid))release(s,p);else if(['seating','sitting','ordering'].includes(p.phase))phase(p,'waitingMeal');}
  }
  function hasWork(s){const d=ensure(s);return d.enabled&&(d.parties.length>0||d.readyMeals.length>0||!!d.server.job||d.tables.some(t=>t.dirty.some(Boolean)));}
  function counts(s){const d=ensure(s);return {queue:d.parties.filter(p=>['arriving','reception'].includes(p.phase)).reduce((n,p)=>n+p.size,0),seated:d.parties.filter(p=>['sitting','ordering','waitingMeal','eating','standing'].includes(p.phase)).reduce((n,p)=>n+p.size,0),occupied:d.tables.reduce((n,t)=>n+t.seats.filter(x=>x!==null).length,0),dirty:d.tables.reduce((n,t)=>n+t.dirty.filter(Boolean).length,0),capacity:8,waitingMeals:d.readyMeals.length,departed:d.departed};}
  function people(s){const d=ensure(s);return d.parties.flatMap(p=>p.members.map(m=>({...m,phase:p.phase==='reception'?'queue':p.phase==='seating'?'toSeat':p.phase,group:p.kind,partyId:p.id,ready:m.paid,waiting:p.phase==='waitingMeal',mood:['arriving','reception'].includes(p.phase)&&p.age>p.patience*.65||p.phase==='waitingMeal'&&p.timer>18?'impatient':p.phase==='eating'?'happy':'calm'})));}
  return {SEATS,queueTarget,create,ensure,valid,reset,arrive,seatParty,ready,cancelOrder,requestClean,setPolicy,toggle,upgradeServer,step,close,hasWork,counts,people};
});
