import {M,group,box,cyl,sphere,bowl,link,label,batch} from './model-kit.js';
export function buildService(world,seats){
  for(let i=0;i<4;i++){const s=seats[i*2],plaque=group(world,'堂食桌号 '+(i+1),s.tableX,1.055,s.z-.29);const sign=label(plaque,String(i+1).padStart(2,'0'),.27,.17,0,0,0,{color:'#476e58',bg:'#fff5d9'});sign.rotation.x=-Math.PI/2;batch(plaque);}
  const root=group(world,'小满 · 送餐清桌机器人');root.userData={action:'dining',title:'小满 · 送餐与清桌'};
  cyl(root,.31,.18,0,.12,0,M.robotTrim);cyl(root,.24,.5,0,.44,0,M.robot);
  for(const x of [-.23,.23]){const wheel=cyl(root,.13,.09,x,.12,0,M.rubber);wheel.rotation.z=Math.PI/2;}
  box(root,.44,.3,.25,0,.84,0,M.robotTrim,.09);box(root,.34,.18,.025,0,.87,.14,M.screen,.04);
  for(const x of [-.08,.08])sphere(root,.026,x,.88,.16,M.cyan);
  link(root,[-.07,.82,.16],[.07,.82,.16],.008,M.cyan);
  for(const y of [.55,1.07])box(root,.66,.045,.48,0,y,.13,M.robotTrim,.05);
  for(const x of [-.27,.27])link(root,[x,.52,-.08],[x,1.08,-.08],.024,M.metal);
  label(root,'小满',.28,.1,0,.4,.25,{color:'#365e51'});batch(root);
  const food=group(root,'热餐托盘',0,1.1,.14);bowl(food,0,0,0,.19);batch(food);
  const dirty=group(root,'回收餐具',0,.59,.14);for(let i=0;i<2;i++){const stack=group(dirty,'回收碗 '+i,i*.03,i*.06,0);bowl(stack,0,0,0,.19,false);batch(stack);}
  const arm=group(root,'擦桌机械臂',.25,.78,0);link(arm,[0,0,0],[.13,.2,.3],.035,M.metal);box(arm,.25,.045,.18,.13,.2,.36,M.canvas,.02);batch(arm);
  const servingArm=group(root,'伸缩托送臂',0,.99,.14);box(servingArm,.045,.045,1,0,0,.5,M.metal,.012);box(servingArm,.22,.025,.12,0,0,1,M.robotTrim,.012);batch(servingArm);servingArm.visible=false;
  const dishes=seats.map((s,i)=>{const g=group(world,'待清空碗 '+(i+1),s.tableX+(s.x<s.tableX?-.2:.2),1.07,s.z);bowl(g,0,0,0,.19,false);link(g,[-.05,.02,0],[.16,.06,.3],.008,M.darkwood);batch(g);return g;});
  const dock=group(world,'服务机器人充电标记',-.65,.235,3.5);cyl(dock,.38,.025,0,0,0,M.tileDark);label(dock,'小满',.4,.14,0,.015,0,{color:'#ffffff'}).rotation.x=-Math.PI/2;batch(dock);
  return {root,food,dirty,arm,servingArm,dishes,seats};
}
export function poseService(model,s,time,dt=1/60,reduced=false){
  if(s.paused&&model.motion)return;
  const d=s.dining,r=d.server;model.motion=globalThis.NoodleMotion.advance(model.motion,r,dt,s.paused);model.root.position.set(model.motion.x,.22,model.motion.z);model.root.rotation.y=model.motion.yaw;
  const loading=r.phase==='loading'&&r.job?.kind==='deliver';
  model.food.visible=r.load==='food'||loading;model.food.scale.setScalar(loading?Math.max(.001,globalThis.NoodleMotion.smooth(r.timer/.65)):1);model.food.position.set(0,1.1,.14);model.dirty.visible=r.load==='dirty';
  model.servingArm.visible=false;model.transfer=null;
  if(r.phase==='working'&&r.job?.kind==='deliver'&&r.load==='food'){
    const member=d.parties.flatMap(p=>p.members).find(m=>m.id===r.job.order.memberId),seat=model.seats[member?.seat];
    if(seat){const yaw=model.root.rotation.y,sin=Math.sin(yaw),cos=Math.cos(yaw),from={x:model.root.position.x+sin*.14,y:1.32,z:model.root.position.z+cos*.14},to={x:seat.tableX+(seat.x<seat.tableX?-.2:.2),y:1.07,z:seat.z},point=globalThis.NoodleMotion.handoff(from,to,r.timer,reduced),dx=point.x-model.root.position.x,dz=point.z-model.root.position.z;
      model.food.position.set(cos*dx-sin*dz,point.y-.22,sin*dx+cos*dz);
      const local=model.food.position,ax=local.x,ay=local.y-.99,az=local.z-.14,horizontal=Math.hypot(ax,az);model.servingArm.visible=true;model.servingArm.rotation.set(Math.atan2(-ay,horizontal),Math.atan2(ax,az),0,'YXZ');model.retractLength=Math.max(.01,Math.hypot(ax,ay,az));model.servingArm.scale.z=model.retractLength;
      model.transfer={memberId:member.id,seconds:r.timer,point,to,paid:member.paid};
    }
  }
  model.arm.visible=r.phase==='working'&&r.job?.kind==='clean';model.arm.rotation.y=Math.sin(time*8)*.3;
  model.dirty.children.forEach((g,i)=>g.visible=i<(r.job?.slots?.length||0));model.collection=[];
  model.dishes.forEach((g,i)=>{const seat=model.seats[i],from={x:seat.tableX+(seat.x<seat.tableX?-.2:.2),y:1.07,z:seat.z};g.position.set(from.x,from.y,from.z);g.visible=!!d.tables[Math.floor(i/2)].dirty[i%2];
    if(g.visible&&r.phase==='working'&&r.job?.kind==='clean'&&r.job.table===Math.floor(i/2)){
      const index=r.job.slots.indexOf(i%2);if(index<0)return;const progress=globalThis.NoodleFeedback.collection(r.timer,d.serverLevel>1?2.6:4.2,index,r.job.slots.length),yaw=model.root.rotation.y,lx=index*.03,lz=.14,to={x:model.root.position.x+Math.cos(yaw)*lx+Math.sin(yaw)*lz,y:.81+index*.06,z:model.root.position.z-Math.sin(yaw)*lx+Math.cos(yaw)*lz};
      g.position.set(from.x+(to.x-from.x)*progress,from.y+(to.y-from.y)*progress+(reduced?0:Math.sin(progress*Math.PI)*.16),from.z+(to.z-from.z)*progress);model.collection.push({seat:i,progress,position:g.position.toArray()});
    }
  });
  const carried=model.collection.find(c=>c.progress>0&&c.progress<1);
  model.cleanReach=null;
  if(carried){const [x,y,z]=carried.position,yaw=model.root.rotation.y,dx=x-model.root.position.x,dz=z-model.root.position.z,ax=Math.cos(yaw)*dx-Math.sin(yaw)*dz,ay=y-.22-.99-.045,az=Math.sin(yaw)*dx+Math.cos(yaw)*dz-.14;model.retractLength=Math.max(.01,Math.hypot(ax,ay,az));model.servingArm.visible=true;model.servingArm.rotation.set(Math.atan2(-ay,Math.hypot(ax,az)),Math.atan2(ax,az),0,'YXZ');model.servingArm.scale.z=model.retractLength;model.cleanReach={seat:carried.seat,position:[x,y-.045,z]};}
  if(!model.transfer&&!carried&&model.retractLength>.02){model.retractLength=globalThis.NoodleMotion.damp(model.retractLength,.01,14,dt);model.servingArm.scale.z=model.retractLength;model.servingArm.visible=model.retractLength>.02;}
}
