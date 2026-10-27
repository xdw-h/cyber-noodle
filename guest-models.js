import {M,group,box,sphere,link,bowl,batch,colorMat,label} from './model-kit.js';
import './character-motion.js';
import './guest-feedback.js';
const motion=globalThis.NoodleMotion;
export function buildGuest(world,id,profile=0){
  const root=group(world,`顾客 #${id}`),shirt=colorMat(['#8caa97','#c58c60','#ac9498','#859cb5'][profile%4]);root.scale.setScalar(.9);
  const torso=group(root,'上身',0,.85,0);box(torso,.38,.48,.27,0,.24,0,shirt,.1);box(torso,.27,.26,.08,0,.24,-.19,M.darkwood,.04);batch(torso);
  const head=group(root,'面部',0,1.56,0);sphere(head,.225,0,0,0,M.skin,[.95,1.05,.88]);sphere(head,.23,0,.09,-.02,M.hair,[1,.75,.9]);const eyes=[-.075,.075].map(x=>{const eye=sphere(head,.017,x,-.02,.19,M.hair);eye.userData.dynamic=true;return eye;});link(head,[-.04,-.1,.18],[.04,-.1,.18],.007,M.hair);if(profile%4===0){box(head,.46,.06,.35,0,.2,0,M.tileDark,.05);box(head,.29,.025,.21,0,.18,.18,M.tileDark,.02);}batch(head);
  const legs=[],arms=[];
  for(const side of [-1,1]){const leg=group(root,'大腿',side*.115,.85,0);link(leg,[0,0,0],[0,-.33,0],.075,M.pants);batch(leg);const knee=group(leg,'膝盖',0,-.33,0);link(knee,[0,0,0],[0,-.32,0],.065,M.pants);batch(knee);const ankle=group(knee,'脚掌',0,-.32,0);box(ankle,.17,.09,.27,0,0,.08,M.iron,.04);batch(ankle);legs.push({hip:leg,knee,ankle});const arm=group(root,'手臂',side*.24,1.24,0);link(arm,[0,0,0],[side*.03,-.27,.035],.065,shirt);sphere(arm,.065,side*.03,-.29,.04,M.skin);batch(arm);arms.push(arm);}
  const tray=group(root,'端餐托盘',0,.91,.4);box(tray,.52,.025,.39,0,0,0,M.darkwood,.03);bowl(tray,0,.02,0,.17);batch(tray);tray.visible=false;
  const meal=group(world,`顾客 #${id} 的餐碗`),dish=bowl(meal,0,0,0,.19),mealFood=group(meal,'逐渐吃完的炒粉');for(const child of [...dish.children].slice(3))mealFood.add(child);batch(mealFood);mealFood.removeFromParent();for(const dx of [-.03,.03])link(meal,[dx,.17,-.06],[dx+.03,.27,.33],.009,M.darkwood);batch(meal);meal.add(mealFood);meal.visible=false;
  const phone=group(arms[1],'手机',-.025,-.29,.09);box(phone,.12,.2,.025,0,0,0,M.iron,.015);box(phone,.095,.16,.008,0,0,.018,M.cyan,.01);batch(phone);
  const chopsticks=group(arms[0],'夹粉筷子',0,-.29,.07);for(const dx of [-.025,.025])link(chopsticks,[dx,0,0],[dx,-.02,.33],.008,M.darkwood);batch(chopsticks);
  const bubble=group(world,'食客心情');const messages=['等位中…','先看看菜单','粉怎么还没来？','好香呀！','我们一起吃','少辣，谢谢','打包带走','下次还来！'];
  const captions=messages.map(text=>{const o=label(bubble,text,1.3,.32,0,0,0,{color:'#355b4d',bg:'#fff9e9'});o.material.depthTest=false;o.material.depthWrite=false;o.renderOrder=50;o.visible=false;return o;});
  root.visible=false;return {root,torso,head,eyes,legs,arms,tray,meal,mealFood,phone,chopsticks,bubble,captions};
}
export function poseGuest(model,g,seats,time,camera,dt=1/60,paused=false,reduced=false){
  if(paused&&model.motion)return;
  const previousDistance=model.motion?.distance||0;
  model.motion=motion.advance(model.motion,g,dt,paused);const visual=model.motion,turn=motion.turn(visual.yaw,g.facing||0);
  const seated=['sitting','ordering','waitingMeal','eating','standing'].includes(g.phase);
  const targetBlend=motion.smooth(g.phase==='sitting'?g.phaseTime/.7:g.phase==='standing'?1-g.phaseTime/.7:seated?1:0);
  model.seatBlend=motion.seatBlend(model.seatBlend??targetBlend,targetBlend,turn.error,dt);const blend=model.seatBlend;
  const walking=visual.amount*(1-blend),cosmetic=reduced?0:1;
  const gesture=globalThis.NoodleFeedback.gesture(g,reduced);model.gesture=gesture;
  const ease=(a,b)=>motion.damp(a,b,16,dt);
  const scale=g.child?.62:.9;model.root.scale.setScalar(scale);
  visual.gaitDistance=(visual.gaitDistance||0)+Math.max(0,visual.distance-previousDistance)/scale/turn.stride;const step=visual.gaitDistance*Math.PI*2/.8;
  const base=motion.baseHeight(scale),bob=Math.abs(Math.sin(step))*.006*walking*cosmetic;
  model.root.visible=true;model.root.position.set(visual.x,base*(1-blend)+(.02+(g.child?.24:0))*blend+bob,visual.z);model.root.rotation.y=visual.yaw;
  model.head.rotation.x=ease(model.head.rotation.x,g.phase==='eating'?.07+gesture.bite*.06+gesture.chew:g.phase==='waitingMeal'?.17:0);
  model.head.rotation.y=ease(model.head.rotation.y,seated?(g.group!=='solo'?Math.sin(time*.8+g.id)*.12*cosmetic:0):turn.look*cosmetic+gesture.look);
  model.eyes.forEach(eye=>eye.scale.y=!reduced&&Math.sin(time*1.15+g.id)> .992?.12:1);
  model.torso.rotation.x=blend*.08;model.torso.rotation.z=Math.sin(step)*.025*walking*cosmetic;
  model.legs.forEach((leg,i)=>{const foot=motion.foot(visual.gaitDistance,i,visual.amount*turn.stride),pose=motion.leg(foot.z,.61-foot.lift+bob/scale);leg.hip.rotation.x=pose.hip*(1-blend)-blend*Math.PI/2;leg.knee.rotation.x=pose.knee*(1-blend)+blend*Math.PI/2;leg.ankle.rotation.x=pose.ankle*(1-blend);});
  const carrying=g.ready&&(['queue','waitingSeat','toSeat'].includes(g.phase)||g.takeaway&&g.phase==='leaving');model.tray.visible=carrying;
  model.tray.position.y=.91-bob/scale;
  const phone=(g.phase==='queue'||g.phase==='waitingMeal')&&!g.child&&!carrying;
  model.arms.forEach((arm,i)=>{let target=i===1&&phone?-1.15:seated?(i===0&&g.phase==='eating'?-.85-gesture.bite*1.45:-.9):carrying?-.95:-Math.sin(step+i*Math.PI)*.28*walking;if(i===1&&gesture.wave>0)target=target*(1-gesture.wave)-1.8*gesture.wave;arm.rotation.x=ease(arm.rotation.x,target);arm.rotation.z=ease(arm.rotation.z,seated?(i===0?.15:-.15):i===1?-gesture.wave*(.3+Math.sin((g.phaseTime||0)*9)*.1):0);});
  model.phone.visible=phone;model.chopsticks.visible=g.phase==='eating'&&g.ready;
  if(g.child&&g.phase==='eating')model.legs.forEach((leg,i)=>leg.knee.rotation.x+=Math.sin(time*4+i)*.16*cosmetic);
  model.meal.visible=seated&&(g.paid===undefined||g.paid);
  const remaining=globalThis.NoodleFeedback.remaining(g);model.mealFood.visible=remaining>.015;model.mealFood.scale.set(Math.sqrt(Math.max(.001,remaining)),.3+.7*remaining,Math.sqrt(Math.max(.001,remaining)));model.mealFood.position.y=.04*(1-remaining);model.remaining=remaining;
  if(seated){const seat=seats[g.seat];model.meal.position.set(seat.tableX+(seat.x<seat.tableX?-.2:.2),1.07,seat.z);}
  model.bubble.position.set(visual.x,g.child?2.05:2.55,visual.z);if(camera)model.bubble.quaternion.copy(camera.quaternion);
  const message=g.mood==='impatient'?2:g.phase==='queue'?0:g.phase==='ordering'?1:g.phase==='eating'?(g.child?5:g.group==='friends'?4:3):g.phase==='leaving'&&(g.ready||g.paid)&&(g.phaseTime||0)<1.8?7:g.takeaway&&g.ready?6:-1;
  model.bubble.userData={anchor:{x:visual.x,y:g.child?2.05:2.55,z:visual.z},wanted:message>=0&&(Math.floor(time/4)+g.id)%3!==0,priority:message===2?5:message===1?4:message===7?3:message>=3?2:1,order:(g.id+Math.floor(time/4))%11};
  model.bubble.visible=model.bubble.userData.wanted;model.captions.forEach((o,i)=>o.visible=i===message);
}
