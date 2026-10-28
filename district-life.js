import {M,group,box,cyl,sphere,link,label,torus,batch,colorMat} from './model-kit.js';

function person(world,name,color){
  const root=group(world,name),shirt=colorMat(color),body=group(root,'上身',0,.82,0);
  box(body,.39,.5,.28,0,.23,0,shirt,.09);box(body,.24,.3,.04,0,.2,.16,M.canvas,.02);batch(body);
  const head=group(root,'面孔',0,1.52,0);sphere(head,.22,0,0,0,M.skin,[.95,1.03,.9]);sphere(head,.225,0,.09,-.025,M.hair,[1,.72,.9]);for(const x of [-.075,.075])sphere(head,.017,x,-.02,.2,M.hair);link(head,[-.035,-.1,.18],[.035,-.1,.18],.006,M.hair);batch(head);
  const arms=[],legs=[];for(const side of [-1,1]){const arm=group(root,'签收手臂',side*.245,1.24,0);link(arm,[0,0,0],[side*.025,-.3,.02],.06,shirt);sphere(arm,.06,side*.025,-.32,.02,M.skin);batch(arm);arms.push(arm);const leg=group(root,'行走腿',side*.115,.83,0);link(leg,[0,0,0],[0,-.53,0],.075,M.pants);box(leg,.17,.09,.27,0,-.55,.08,M.iron,.04);batch(leg);legs.push(leg);}
  return {root,body,head,arms,legs};
}

export function buildDistrictLife(world,destinations){
  const locations={park:{x:14.9,z:-3.55,desk:[13.7,1.0,-4.04],color:'#8ca8b4',name:'前台小林'},community:{x:12.4,z:7.25,desk:[11.7,.98,7.05],color:'#b4947c',name:'邻居阿禾'},camp:{x:-11.55,z:12.65,desk:[-11.7,.98,11.8],color:'#8a9c70',name:'营地主理人小鹿'}};
  const residents={};
  for(const [key,p]of Object.entries(locations)){
    const npc=person(world,p.name,p.color);npc.root.position.set(p.x,.24,p.z);npc.root.rotation.y=.2;npc.root.userData={action:'district-'+key,title:p.name+' · 查看街区委托'};
    const desk=group(world,p.name+'的签收台',...p.desk);if(key!=='park'){box(desk,1,.08,.65,0,-.05,0,M.wood);for(const x of [-.38,.38])for(const z of [-.22,.22])link(desk,[x,-.08,z],[x,-.71,z],.025,M.iron);}label(desk,'好好热餐 · 签收',.82,.16,0,-.18,.34,{color:'#60795a',bg:'#fff1d3'});batch(desk);
    const parcel=group(world,key+'真实送达餐盒');box(parcel,.4,.24,.37,0,.13,0,M.lightwood,.03);box(parcel,.06,.245,.38,0,.13,0,M.canvas,.005);label(parcel,'好好炒粉',.3,.1,0,.14,.19,{color:'#8d6744'});batch(parcel);parcel.visible=false;
    const bubble=group(world,key+'签收状态'),captions=['等待热餐','无人机正在送来','热餐已签收！','地面配送途中'].map(text=>{const o=label(bubble,text,1.7,.34,0,0,0,{color:'#59724f',bg:'#fff6dd'});o.material.depthTest=false;o.material.depthWrite=false;o.renderOrder=50;o.visible=false;return o;});
    const pad=destinations[key],ring=torus(world,.94,.025,pad.x,.43,pad.z,M.amber);ring.visible=false;
    const companion=person(world,key+'的邻里居民',key==='park'?'#baa28f':key==='camp'?'#b59476':'#9ea8b8');companion.root.scale.setScalar(key==='community'?.7:.9);
    residents[key]={...p,npc,parcel,bubble,captions,ring,companion};
  }
  const warehouse=person(world,'中央厨房仓管员','#91a392');warehouse.root.position.set(-10.85,.24,-5.45);warehouse.root.rotation.y=.3;warehouse.root.userData={action:'district-kitchen',title:'中央厨房 · 库存与补给'};
  const clipboard=group(warehouse.root,'出库清单',0,1.05,.35);box(clipboard,.3,.4,.035,0,0,0,M.darkwood,.015);box(clipboard,.25,.34,.012,0,0,.025,M.canvas,.008);for(let i=0;i<4;i++)box(clipboard,.17,.012,.005,0,.1-i*.06,.034,M.tileDark,.002);batch(clipboard);
  const crates=[];for(let i=0;i<4;i++){const g=group(world,'原料出库传送箱 '+i);box(g,.5,.4,.5,0,0,0,M.lightwood);box(g,.065,.41,.51,0,0,0,M.canvas,.004);label(g,'原料',.3,.12,0,.02,.26,{color:'#906e42'});batch(g);crates.push(g);}
  return {residents,warehouse,crates};
}

export function poseDistrictLife(life,s,time,camera,dt=1/60,reduced=false){
  if(s.paused)return;
  const motion=globalThis.NoodleMotion,ease=(a,b)=>motion.damp(a,b,14,dt);
  const d=s.district,mission=s.drone.mission,clock=s.elapsed+(s.closingElapsed||0);
  for(const [key,p]of Object.entries(life.residents)){
    const receipt=d.arrivals.find(x=>x.destination===key),age=receipt?clock-receipt.at:999,received=age>=0&&age<7,inbound=mission?.kind==='delivery'&&mission.destination===key&&!mission.delivered;
    p.npc.head.rotation.x=ease(p.npc.head.rotation.x,received&&!reduced?Math.sin(time*3)*.09:.02);p.npc.head.rotation.y=ease(p.npc.head.rotation.y,inbound?-.4:reduced?0:Math.sin(time*.6)*.08);
    p.npc.arms.forEach((arm,i)=>{arm.rotation.x=ease(arm.rotation.x,received?-1.05:inbound&&i===1?-2.2+(reduced?0:Math.sin(time*6)*.2):0);arm.rotation.z=ease(arm.rotation.z,inbound&&i===1?-.25:0);});
    p.parcel.visible=received;if(received){const t=Math.min(1,Math.max(0,age-1)/1.4);p.parcel.position.set(p.desk[0]+(p.x-p.desk[0])*t,p.desk[1]+(1.25-p.desk[1])*t,p.desk[2]+(p.z+.33-p.desk[2])*t);}
    p.bubble.position.set(p.x,2.5,p.z);p.bubble.quaternion.copy(camera.quaternion);p.bubble.visible=inbound||received||d.selected===key&&d.status==='active';p.captions.forEach((c,i)=>c.visible=i===(received?2:inbound?mission.vehicle==='ground'?3:1:0));
    p.bubble.userData={anchor:{x:p.x,y:2.5,z:p.z},wanted:p.bubble.visible,priority:inbound?5:received?4:2,order:0};
    p.ring.visible=inbound||d.selected===key&&d.status==='active';p.ring.scale.setScalar(1+Math.sin(time*2)*.035);
    const a=time*.24+key.length,g={x:p.x+1.55+Math.sin(a)*.35,z:p.z+.6+Math.cos(a)*.15,facing:Math.atan2(Math.cos(a)*.35,-Math.sin(a)*.15)};
    p.motion=motion.advance(p.motion,g,dt);p.companion.root.position.set(p.motion.x,.24,p.motion.z);p.companion.root.rotation.y=p.motion.yaw;const gait=motion.stroll(p.motion.distance,p.motion.amount);p.companion.legs.forEach((leg,i)=>leg.rotation.x=gait.legs[i]);p.companion.arms.forEach((arm,i)=>arm.rotation.x=gait.arms[i]);
  }
  const supplying=mission?.kind==='supply';life.warehouse.head.rotation.x=supplying?.12:0;life.warehouse.arms.forEach(arm=>arm.rotation.x=-.9);
  life.crates.forEach((g,i)=>g.position.set(-14+(i*.8+(supplying?time*.6:0))%3.3,1.16,-4.8));
}
