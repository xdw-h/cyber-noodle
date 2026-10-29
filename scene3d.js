import * as T from 'three';
import {OrbitControls} from './vendor/addons/controls/OrbitControls.js';
import {RoomEnvironment} from './vendor/addons/environments/RoomEnvironment.js';
import {GLTFExporter} from './vendor/addons/exporters/GLTFExporter.js';
import {EffectComposer} from './vendor/addons/postprocessing/EffectComposer.js';
import {SSAOPass} from './vendor/addons/postprocessing/SSAOPass.js';
import {OutputPass} from './vendor/addons/postprocessing/OutputPass.js';
import {RenderPass} from './vendor/addons/postprocessing/RenderPass.js';
import {M,group,box,cyl,sphere,label,link,planter,batch} from './model-kit.js';
import {buildArchitecture,buildKitchen,buildCounter,buildRobot,buildStove,buildTerminal,buildPerson,buildDrone,buildHelipad,buildGarden,buildTree,buildDecor} from './shop-models.js';
import {buildDistrict,PLACES,DESTINATIONS} from './district-models.js';
import {buildGuest,poseGuest} from './guest-models.js';
import {buildService,poseService} from './service-models.js';
import {buildDistrictLife,poseDistrictLife} from './district-life.js';
import {buildBranch,poseBranch} from './branch-models.js';

const host=document.getElementById('scene-wrap'),loading=document.getElementById('three-loading');
let renderer;
try{renderer=new T.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance',preserveDrawingBuffer:true});}
catch(error){loading.innerHTML='<strong>3D 场景需要 WebGL 2</strong><span>请使用 Chrome / Edge 并开启浏览器图形加速，然后刷新页面。经营存档仍然保留。</span>';throw error;}
renderer.domElement.id='three-canvas';renderer.domElement.setAttribute('aria-label','可拖动旋转和滚轮缩放的真实3D炒粉小店');renderer.domElement.setAttribute('role','img');host.prepend(renderer.domElement);
renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
const scene=new T.Scene();scene.background=new T.Color('#f0e8d5');
const environment=new RoomEnvironment(),pmrem=new T.PMREMGenerator(renderer);scene.environment=pmrem.fromScene(environment,.04).texture;scene.environmentIntensity=.32;environment.dispose();pmrem.dispose();
const camera=new T.OrthographicCamera(-7,7,5,-5,.1,100);camera.position.set(11,10,14);
const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,1,0);controls.enableDamping=true;controls.dampingFactor=.075;controls.minPolarAngle=.34;controls.maxPolarAngle=Math.PI*.46;controls.minZoom=.5;controls.maxZoom=4;controls.enablePan=true;controls.maxTargetRadius=40;controls.update();
const hemisphere=new T.HemisphereLight('#fff3d6','#8b9582',1.5);scene.add(hemisphere);
const sun=new T.DirectionalLight('#ffdfa4',3.2);sun.position.set(-16,32,14);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-28,right:28,top:28,bottom:-28,near:1,far:85});sun.shadow.bias=-.00015;sun.shadow.normalBias=.035;sun.shadow.radius=3;scene.add(sun);
const fill=new T.DirectionalLight('#ddebea',.8);fill.position.set(7,5,-7);scene.add(fill);
const floor=new T.Mesh(new T.PlaneGeometry(200,200),new T.MeshStandardMaterial({color:'#f0e7d1',roughness:1}));floor.rotation.x=-Math.PI/2;floor.position.y=-.33;floor.receiveShadow=true;scene.add(floor);
const world=group(scene,'好好炒粉 · 3D game diorama');
buildDistrict(world);
const branchModels=buildBranch(world);
const districtLife=buildDistrictLife(world,DESTINATIONS);
buildArchitecture(world);buildKitchen(world);buildCounter(world);buildGarden(world);buildHelipad(world);buildTree(world,-4.12,-2.48,1.04);buildTree(world,3.75,-2.68,1.13);
const robot=buildRobot(world),stove=buildStove(world),terminal=buildTerminal(world),drone=buildDrone(world),decor=buildDecor(world);
const chef=buildPerson(world,'chef');chef.root.position.set(.74,.38,-.23);chef.root.rotation.y=.12;
const guestFlow=window.NoodleGuestFlow,guests=guestFlow.create(),guestModels=new Map();
const dining=window.NoodleDining,service=buildService(world,dining.SEATS);
const pedestrians=[];for(let i=0;i<6;i++)pedestrians.push(buildGuest(world,1000+i,i));
const kitchenSupply=group(world,'Central kitchen dispatch',-3.2,.28,-3.43);box(kitchenSupply,.58,.5,.45,0,.25,0,M.lightwood);label(kitchenSupply,'厨房补给',.51,.22,0,.29,.237,{color:'#80643c'});batch(kitchenSupply);
const routeMaterial=new T.LineDashedMaterial({color:'#679f94',dashSize:.13,gapSize:.09,transparent:true,opacity:.7});let routeLine;
const composer=new EffectComposer(renderer),aoPass=new SSAOPass(scene,camera,512,512,16);aoPass.kernelRadius=.36;aoPass.minDistance=.0001;aoPass.maxDistance=.018;composer.addPass(new RenderPass(scene,camera));composer.addPass(aoPass);composer.addPass(new OutputPass());let highQuality=innerWidth>740;
const targetPoints=DESTINATIONS;let activePlace='overview';
const pad=new T.Vector3(3.24,.93,1.86);let state=null,time=0,previous=performance.now(),missionKey='',frames=0,lastInfo=0;let focusedObject=null;
const reducedMotion=matchMedia('(prefers-reduced-motion:reduce)');
function sync(s){state=s;poseBranch(branchModels,s,time);robot.base.visible=s.robot;for(const k of Object.keys(decor))decor[k].visible=!!s.growth.decor[k];
  guestFlow.sync(guests,{...s,orders:s.orders.filter(o=>o.channel!=='dinein'),current:s.current?.channel==='dinein'?null:s.current,stats:{...s.stats,served:s.stats.served-(s.stats.dineInServed||0)}});
  const current=s.current,active=!!current&&!s.paused;stove.fire.visible=!!current;stove.steam.visible=active;terminal.visible=s.aiMode!=='manual';
  const m=s.drone.mission,key=m?`${m.kind}:${m.destination}:${m.order?.id||m.pack}`:'';
  if(key!==missionKey){missionKey=key;if(routeLine){world.remove(routeLine);routeLine.geometry.dispose();routeLine=null;}if(m&&m.vehicle==='drone'){const end=targetPoints[m.destination]||targetPoints.kitchen;const points=Array.from({length:65},(_,i)=>{const t=i/64;return pad.clone().lerp(end,t).add(new T.Vector3(0,Math.sin(t*Math.PI)*6,0));});routeLine=new T.Line(new T.BufferGeometry().setFromPoints(points),routeMaterial);routeLine.computeLineDistances();routeLine.name='Active flight path';world.add(routeLine);}}
  document.getElementById('three-live').textContent=m?m.kind==='supply'?'原料运输中':m.delivered?'返航充电中':m.vehicle==='ground'?'地面配送中':'无人机送餐中':current?'机器人炒粉中':s.phase==='prep'?'开店前 · 自由查看场景':s.phase==='report'?'今日营业结束':'小店营业中';
  document.getElementById('three-state').textContent=`${Math.round(s.drone.battery)}% 电量 · ${Math.round(s.robotHealth)}% 耐久`;
}
function resize(){const rect=host.getBoundingClientRect(),w=Math.max(1,rect.width),h=Math.max(1,rect.height);renderer.setSize(w,h,false);composer.setSize(w,h);const aspect=w/h,base=PLACES[activePlace].size,view=Math.max(base,base*1.12/aspect);camera.left=-view*aspect/2;camera.right=view*aspect/2;camera.top=view/2;camera.bottom=-view/2;camera.updateProjectionMatrix();}
new ResizeObserver(resize).observe(host);resize();
function view(name){activePlace=PLACES[name]?name:'overview';const p=PLACES[activePlace];controls.target.set(...p.target);camera.position.set(...p.target).add(new T.Vector3(...p.offset));camera.zoom=1;resize();controls.update();document.getElementById('district-name').textContent=p.name;document.getElementById('district-copy').textContent=p.copy;const button=document.getElementById('district-action');button.hidden=!p.action;button.textContent=p.button||'';if(p.action)button.dataset.action=p.action;else delete button.dataset.action;document.querySelectorAll('[data-camera]').forEach(b=>b.classList.toggle('selected',b.dataset.camera===activePlace));}
view('overview');
let bubbleLayout=[];
const bubblePoint=new T.Vector3(),bubbleRight=new T.Vector3(),bubbleUp=new T.Vector3();
function arrangeBubbles(){
  const width=host.clientWidth,height=host.clientHeight,items=[];
  const add=(id,bubble,w,h)=>{const data=bubble.userData;bubble.visible=false;if(!data.wanted||!data.anchor)return;bubble.position.set(data.anchor.x,data.anchor.y,data.anchor.z);bubble.quaternion.copy(camera.quaternion);bubblePoint.copy(bubble.position).project(camera);if(bubblePoint.z< -1||bubblePoint.z>1)return;const projected=w*camera.zoom/(camera.right-camera.left)*width,scale=globalThis.NoodleFeedback.labelScale(projected,width);bubble.scale.setScalar(scale);items.push({id,x:(bubblePoint.x+1)*width/2,y:(1-bubblePoint.y)*height/2,w:projected*scale,h:h*camera.zoom/(camera.top-camera.bottom)*height*scale,priority:data.priority,order:data.order,bubble,anchor:data.anchor});};
  for(const [id,m]of guestModels)add(id,m.bubble,1.3,.32);
  for(const [id,p]of Object.entries(districtLife.residents))add(id,p.bubble,1.7,.34);
  const placed=globalThis.NoodleFeedback.layout(items,width,height,width<600?2:4);
  bubbleRight.set(1,0,0).applyQuaternion(camera.quaternion);bubbleUp.set(0,1,0).applyQuaternion(camera.quaternion);
  bubbleLayout=[];
  for(const p of placed){p.bubble.visible=true;p.bubble.position.set(p.anchor.x,p.anchor.y,p.anchor.z).addScaledVector(bubbleRight,p.dx*(camera.right-camera.left)/camera.zoom/width).addScaledVector(bubbleUp,-p.dy*(camera.top-camera.bottom)/camera.zoom/height);
    if(!p.bubble.pointer){const pointer=new T.Mesh(new T.CylinderGeometry(.008,.008,1,5),new T.MeshBasicMaterial({color:'#6e9883',transparent:true,opacity:.8,depthTest:false,depthWrite:false}));pointer.renderOrder=49;p.bubble.add(pointer);p.bubble.pointer=pointer;}
    const target=new T.Vector3(p.anchor.x,p.anchor.y-.3,p.anchor.z);p.bubble.updateWorldMatrix(true,false);p.bubble.worldToLocal(target);target.z=0;const localWidth=p.w/width*(camera.right-camera.left)/camera.zoom/p.bubble.scale.x,localHeight=p.h/height*(camera.top-camera.bottom)/camera.zoom/p.bubble.scale.y,clip=globalThis.NoodleFeedback.pointerEdge(target.x,target.y,localWidth,localHeight),edge=new T.Vector3(clip.x,clip.y,0),delta=target.clone().sub(edge),length=delta.length();const pointer=p.bubble.pointer;pointer.visible=clip.visible&&length>.03;pointer.position.copy(edge).addScaledVector(delta,.5);pointer.scale.set(1,length,1);if(length>.001)pointer.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());
    bubblePoint.copy(p.bubble.position).project(camera);bubbleLayout.push({id:p.id,x:(bubblePoint.x+1)*width/2,y:(1-bubblePoint.y)*height/2,w:p.w,h:p.h,priority:p.priority});}
}
function animate(now){requestAnimationFrame(animate);const dt=Math.min(.2,(now-previous)/1000);previous=now;if(document.hidden)return;
  if(!state?.paused&&!reducedMotion.matches)time+=dt;
  const s=state,m=s?.drone.mission,cooking=!!s?.current&&!s?.paused;
  if(cooking&&!reducedMotion.matches){robot.arm.rotation.x=Math.sin(time*7)*.12;robot.arm.rotation.z=Math.sin(time*5)*.08;robot.head.rotation.y=Math.sin(time*2)*.05;stove.wok.rotation.z=Math.sin(time*6)*.045;stove.steam.children.forEach((p,i)=>{p.position.y=1.4+((time*.35+i*.16)%.95);p.scale.setScalar(.55+(p.position.y-1.4)*.8);});}else{robot.arm.rotation.set(0,0,0);stove.wok.rotation.set(0,0,0);}
  if(m&&m.vehicle==='drone'){let progress=m.kind==='supply'?1-m.progress/m.duration:m.progress<=m.outbound?m.progress/m.outbound:1-(m.progress-m.outbound)/(m.duration-m.outbound);progress=T.MathUtils.clamp(progress,0,1);const end=targetPoints[m.destination]||targetPoints.kitchen;drone.root.position.copy(pad).lerp(end,progress);drone.root.position.y+=Math.sin(progress*Math.PI)*6;drone.root.rotation.y=Math.atan2(end.x-pad.x,end.z-pad.z);if(!s.paused&&!reducedMotion.matches)drone.rotors.forEach((r,i)=>r.rotation.y=time*45*(i%2?1:-1));}else{drone.root.position.copy(pad);drone.root.rotation.y=.15;}
  const gameSpeed=Number.parseInt(document.getElementById('speed-button').textContent,10)||1;
  guestFlow.tick(guests,dt*gameSpeed,!!s?.paused);
  const people=new Map([...guests.guests].map(([id,g])=>['t'+id,g]));if(s)for(const g of dining.people(s))people.set('d'+g.id,g);
  const crowd=globalThis.NoodleMotion.crowd([...people].map(([key,g])=>({...g,key})).concat(s?[{...s.dining.server,key:'server',phase:'robot'}]:[]));
  for(const g of crowd){const key=g.key;if(key==='server')continue;if(!guestModels.has(key)){const model=buildGuest(world,g.id,g.profile);if(key.startsWith('d'))model.root.userData={action:'dining-guest',value:g.id,title:g.child?'亲子小朋友':g.name};guestModels.set(key,model);}poseGuest(guestModels.get(key),g,dining.SEATS,time,camera,dt*gameSpeed,!!s?.paused,reducedMotion.matches);}
  for(const [id,model] of guestModels)if(!people.has(id)){for(const object of [model.root,model.meal,model.bubble]){object.traverse(o=>{if(o.isMesh){if(!o.userData.dynamic)o.geometry.dispose();if(o===model.bubble.pointer)o.material.dispose();if(o.material.map?.isCanvasTexture&&object===model.bubble){o.material.map.dispose();o.material.dispose();}}});object.removeFromParent();}guestModels.delete(id);}
  if(s){poseBranch(branchModels,s,time);poseDistrictLife(districtLife,s,time,camera,dt,reducedMotion.matches);poseService(service,s,time,dt*gameSpeed,reducedMotion.matches);const c=dining.counts(s);document.getElementById('guest-status').textContent=`等位 ${c.queue} · 就座 ${c.occupied}/8 · 空碗 ${c.dirty} · 自取 ${guests.guests.size}`;}
  pedestrians.forEach((p,i)=>{const a=time*.035+i*Math.PI/3,x=19*Math.sin(a),z=12.65+.5*Math.cos(a);poseGuest(p,{id:1000+i,x,z,facing:Math.atan2(19*Math.cos(a),-.5*Math.sin(a)),phase:'leaving',group:'solo',walk:0},[],time,camera,dt,!!s?.paused,reducedMotion.matches);});
  const evening=s&&(s.elapsed>=50||s.phase==='report');const goal=evening?1.1:1.5;hemisphere.intensity=T.MathUtils.lerp(hemisphere.intensity,goal,.02);sun.intensity=T.MathUtils.lerp(sun.intensity,evening?2.8:3.2,.02);
  controls.update();camera.updateMatrixWorld();arrangeBubbles();if(highQuality)composer.render();else renderer.render(scene,camera);frames++;
  if(now-lastInfo>2000){document.getElementById('three-quality').textContent=highQuality?'精细光照 ⇄':'流畅模式 ⇄';lastInfo=now;}
}
requestAnimationFrame(animate);
const raycaster=new T.Raycaster(),pointer=new T.Vector2(),tooltip=document.getElementById('three-tooltip');let down;
function pick(event){const r=renderer.domElement.getBoundingClientRect();pointer.set((event.clientX-r.left)/r.width*2-1,-(event.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,camera);for(const hit of raycaster.intersectObject(world,true)){let node=hit.object;while(node&&node!==world){if(node.userData.action||node.userData.view)return node;node=node.parent;}}return null;}
renderer.domElement.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY};});
renderer.domElement.addEventListener('pointermove',e=>{if(e.buttons){tooltip.hidden=true;return;}focusedObject=pick(e);renderer.domElement.style.cursor=focusedObject?'pointer':'grab';tooltip.hidden=!focusedObject;if(focusedObject){tooltip.textContent=focusedObject.userData.title+' ↗';}});
renderer.domElement.addEventListener('pointerleave',()=>{tooltip.hidden=true;});
renderer.domElement.addEventListener('pointerup',e=>{if(!down||Math.hypot(e.clientX-down.x,e.clientY-down.y)>5)return;const object=pick(e);if(object){if(object.userData.view){view(object.userData.view);return;}const button=document.createElement('button');button.dataset.action=object.userData.action;if(object.userData.value!==undefined)button.dataset.value=object.userData.value;button.hidden=true;document.body.appendChild(button);button.click();button.remove();}});
document.querySelectorAll('[data-camera]').forEach(b=>b.addEventListener('click',()=>view(b.dataset.camera)));
document.getElementById('three-zoom-in').addEventListener('click',()=>{camera.zoom=Math.min(3,camera.zoom*1.17);camera.updateProjectionMatrix();});
document.getElementById('three-zoom-out').addEventListener('click',()=>{camera.zoom=Math.max(.65,camera.zoom/1.17);camera.updateProjectionMatrix();});
document.getElementById('three-expand').addEventListener('click',()=>{const expanded=document.body.classList.toggle('scene-expanded');document.getElementById('three-expand').textContent=expanded?'收起场景 ↙':'放大场景 ↗';setTimeout(resize,80);});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.body.classList.contains('scene-expanded')){document.body.classList.remove('scene-expanded');document.getElementById('three-expand').textContent='放大场景 ↗';resize();}});
async function exportModel(){const button=document.getElementById('three-export');button.disabled=true;button.textContent='正在导出…';try{const exportRoot=world.clone(true);exportRoot.traverse(o=>{if(o.name.startsWith('Purchased'))o.visible=true;});const data=await new GLTFExporter().parseAsync(exportRoot,{binary:true,onlyVisible:true,maxTextureSize:1024});const url=URL.createObjectURL(new Blob([data],{type:'model/gltf-binary'})),a=document.createElement('a');a.href=url;a.download='赛博炒粉-3D场景.glb';a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);}catch(error){console.error(error);document.getElementById('three-live').textContent='模型导出失败，请重试';}finally{button.disabled=false;button.textContent='导出模型 ↓';}}
document.getElementById('three-export').addEventListener('click',exportModel);
document.getElementById('three-quality').addEventListener('click',()=>{highQuality=!highQuality;lastInfo=0;});
function branchDiagnostics(){const branch=state?.branch,model=branchModels[branch?.place];return {place:branch?.place??null,visible:!!model?.root.visible,cooking:!!model?.root.visible&&model.stove.fire.visible,served:branch?.stats?.served??0};}
window.Noodle3D={sync,view,exportModel,diagnostics:()=>({webgl:renderer.getContext() instanceof WebGL2RenderingContext,frames,camera:camera.position.toArray(),zoom:camera.zoom,place:activePlace,places:Object.keys(PLACES),revision:T.REVISION,scene:world.name,drone:drone.root.position.toArray(),cooking:stove.fire.visible,branch:branchDiagnostics(),district:state?structuredClone(state.district):null,dining:state?{...dining.counts(state),server:structuredClone(state.dining.server),tables:structuredClone(state.dining.tables),ledger:structuredClone(state.stats),people:dining.people(state),settings:{autoSeat:state.dining.autoSeat,autoClean:state.dining.autoClean}}:null,guests:guestFlow.counts(guests),people:[...guests.guests.values()].map(g=>({id:g.id,phase:g.phase,x:g.x,z:g.z,seat:g.seat})),decor:Object.fromEntries(Object.entries(decor).map(([k,v])=>[k,v.visible]))})};
loading.hidden=true;document.body.classList.add('three-ready');
window.Noodle3D.animationSnapshot=()=>({paused:!!state?.paused,reduced:reducedMotion.matches,guests:[...guestModels].map(([id,m])=>({id,position:m.root.position.toArray(),yaw:m.root.rotation.y,legs:m.legs.map(l=>l.hip.rotation.x),motion:{...m.motion}})),street:pedestrians.map(m=>({position:m.root.position.toArray(),yaw:m.root.rotation.y,legs:m.legs.map(l=>l.hip.rotation.x)}))});
window.Noodle3D.contactSnapshot=()=>({phase:state?.phase,elapsed:state?.elapsed,guests:[...guestModels].map(([id,m])=>({id,position:m.root.position.toArray(),feet:m.legs.map(l=>l.ankle.localToWorld(new T.Vector3(0,-.045,.08)).toArray()),tray:m.tray.visible,phone:m.phone.visible})),people:state?dining.people(state):[]});
window.Noodle3D.polishSnapshot=()=>({guests:[...guestModels].map(([id,m])=>({id,seatBlend:m.seatBlend,headYaw:m.head.rotation.y,yaw:m.motion?.yaw,tray:m.tray.visible,trayHeight:m.root.position.y+m.root.scale.y*m.tray.position.y,bodyHeight:m.root.position.y})),renderCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles});
window.Noodle3D.handoffSnapshot=()=>({transfer:service.transfer?structuredClone(service.transfer):null,foodVisible:service.food.visible,armVisible:service.servingArm.visible,meals:[...guestModels].filter(([id,m])=>m.meal.visible).map(([id])=>id)});
window.Noodle3D.feedbackSnapshot=()=>({width:host.clientWidth,height:host.clientHeight,bubbles:structuredClone(bubbleLayout),gestures:[...guestModels].map(([id,m])=>({id,...m.gesture,arms:m.arms.map(a=>a.rotation.x)}))});
window.Noodle3D.cleanArmSnapshot=()=>({target:service.cleanReach?structuredClone(service.cleanReach):null,tip:service.servingArm.localToWorld(new T.Vector3(0,0,1)).toArray(),visible:service.servingArm.visible});
window.Noodle3D.residentSnapshot=()=>Object.entries(districtLife.residents).map(([id,p])=>({id,position:p.companion.root.position.toArray(),legs:p.companion.legs.map(l=>l.hip.rotation.x),knees:p.companion.legs.map(l=>l.knee.rotation.x),feet:p.companion.legs.map(l=>l.ankle.localToWorld(new T.Vector3(0,-.045,.08)).toArray()),arms:p.companion.arms.map(a=>a.rotation.x)}));
window.Noodle3D.finishingSnapshot=()=>({paused:!!state?.paused,collection:structuredClone(service.collection||[]),stack:service.dirty.visible?service.dirty.children.filter(g=>g.visible).length:0,meals:[...guestModels].filter(([id,m])=>m.meal.visible).map(([id,m])=>({id,remaining:m.remaining,foodVisible:m.mealFood.visible})),pointers:[...guestModels].filter(([id,m])=>m.bubble.visible).map(([id,m])=>({id,visible:!!m.bubble.pointer?.visible,length:m.bubble.pointer?.scale.y}))});
