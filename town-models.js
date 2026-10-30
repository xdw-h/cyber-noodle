import * as T from 'three';
import {M,group,box,cyl,sphere,link,label,batch,colorMat,canvasTexture} from './model-kit.js';
import './town-cycle.js';
import {buildHouseholdFigures,poseHouseholdFigures} from './household-models.js?v=053';
const windowMaterial=new T.MeshStandardMaterial({color:'#abc5bd',emissive:'#ffcf7b',emissiveIntensity:0,roughness:.45}),lampMaterial=new T.MeshStandardMaterial({color:'#fff0c6',emissive:'#ffd08a',emissiveIntensity:0});
const grass=colorMat('#abb88c'),road=colorMat('#707b76'),roofMaterials=['#a76e54','#708579','#b39c75','#727f96'].map(colorMat),walls=['#e8d8b7','#c9d6c8','#dcc8ae','#d2d7d7'].map(colorMat);
export function buildTown(world){
  const root=group(world,'春日里小镇 · 104 × 80'),ground=group(root,'扩建道路与公共空间'),architecture=group(root,'小镇建筑'),fixtures=group(root,'街道设施'),lamps=[],buildings=[],zones={},lifeAPI=globalThis.NoodleBuildingLife;
  const dwellingMaterial=new T.MeshStandardMaterial({color:'#ffd39a',emissive:'#ffc36a',emissiveIntensity:.2,roughness:.6}),dynamic=group(root,'独立住户窗灯与商铺橱窗'),windowSlots=[],shopSlots=[];
  box(ground,104,.5,80,0,-.68,3,M.stoneDark,.3);box(ground,103.8,.09,79.8,0,-.39,3,grass,.15);
  const horizontal=[-31,-18,26,36],vertical=[-46,-25,25,46];
  for(const z of horizontal){box(ground,96,.08,3.2,0,-.27,z,road,.02);for(const side of [-1,1])box(ground,96,.08,.85,0,-.2,z+side*2.1,M.stoneLight,.02);for(let x=-46;x<=46;x+=3)box(ground,1.15,.015,.07,x,-.219,z,M.cream,.001);}
  for(const x of vertical){box(ground,3.2,.08,70,x,-.27,2,road,.02);for(const side of [-1,1])box(ground,.85,.08,70,x+side*2.1,-.2,2,M.stoneLight,.02);for(let z=-31;z<=36;z+=3)box(ground,.07,.015,1.15,x,-.219,z,M.cream,.001);}
  for(const x of [-46,-25,25,46])for(const z of horizontal)for(let i=0;i<6;i++){box(ground,.2,.02,2.7,x-1.2+i*.48,-.21,z+3,M.cream,.001);box(ground,2.7,.02,.2,x+3,-.21,z-1.2+i*.48,M.cream,.001);}
  // The old east-west avenue now joins the perimeter streets.
  for(const side of [-1,1]){box(ground,26,.08,3.1,side*34,-.18,10.2,road,.02);for(const dz of [-1.85,1.85])box(ground,26,.1,.6,side*34,-.12,10.2+dz,M.stoneLight,.02);}
  box(ground,2.6,.08,19,-7,-.18,-22,road,.02);box(ground,2.6,.08,10,-6,-.18,24.9,road,.02);box(ground,2.6,.08,10,8,-.18,24.9,road,.02);
  function house(x,z,w,d,h,index,name,kind='home'){
    const zone=z<-15?'town-north':z>22?'town-river':x<0?'town-west':'town-east';if(!zones[zone]){zones[zone]=group(architecture,zone);zones[zone].userData={view:zone,title:'小镇街区 · 点击探索'};}const g=group(zones[zone],name,x,0,z);buildings.push({name,x,z,width:w,depth:d});
    const id='town-building-'+index,apartment=lifeAPI.APARTMENTS.find(a=>a.buildingId===id),action=name==='小镇超市'?'town-supermarket':kind==='home'?'town-residents':'town-venue';if(apartment)name=apartment.name;Object.assign(buildings[buildings.length-1],{id,name,kind,action,height:h});
    const proxy=new T.Mesh(new T.BoxGeometry(w,h+1,d),new T.MeshBasicMaterial({visible:false}));proxy.position.set(x,(h+1)/2,z);proxy.userData={action,value:id,title:name,buildingId:id};root.add(proxy);
    box(g,w+.6,.13,d+.6,0,-.15,0,M.stoneLight,.03);box(g,w,h,d,0,.04+h/2,0,walls[index%4],.09);
    if(kind==='home'){const roof=box(g,w*.66,.18,d+.6,-w*.22,h+.55,0,roofMaterials[index%4],.02);roof.rotation.z=.48;const other=box(g,w*.66,.18,d+.6,w*.22,h+.55,0,roofMaterials[index%4],.02);other.rotation.z=-.48;cyl(g,.16,.75,w*.23,h+.6,-d*.23,M.stoneDark);}
    else{box(g,w+.35,.2,d+.35,0,h+.15,0,roofMaterials[index%4],.025);box(g,w-.2,.1,d-.2,0,h+.3,0,M.stoneLight,.02);}
    for(let y=1;y<h-.2;y+=1.05)for(let dx=-w/2+.6;dx<w/2-.3;dx+=1.1){if(!apartment){box(g,.61,.65,.04,dx,y,d/2+.03,windowMaterial,.025);box(g,.7,.06,.16,dx,y-.35,d/2+.08,M.cream,.01);}for(const side of [-1,1])box(g,.04,.65,.61,side*(w/2+.03),y,dx*(d/w),windowMaterial,.025);}
    if(apartment){for(const home of lifeAPI.HOMES.filter(a=>a.buildingId===id)){const dx=home.window.column===0?-.95:.95,y=.85+home.window.floor*.9;box(g,.78,.65,.05,dx,y,d/2+.035,windowMaterial,.015);box(g,.92,.07,.16,dx,y-.37,d/2+.08,M.cream,.01);windowSlots.push({residentId:home.residentId,buildingId:id,address:home.address,x:x+dx,y,z:z+d/2+.07});}label(g,name,w-.1,.29,0,h+.16,d/2+.13,{bg:'#f4e8c9',color:'#526b5b'});}
    box(g,.72,1.1,.05,0,.45,d/2+.05,M.darkwood,.02);box(g,.46,.5,.055,0,.68,d/2+.09,windowMaterial,.01);sphere(g,.04,.24,.42,d/2+.13,M.metal);
    if(kind!=='home'){box(g,w+.15,.12,1,0,1.58,d/2+.3,roofMaterials[index%4],.03);label(g,name,w-.15,.35,0,2.03,d/2+.08,{bg:'#f4e8c9',color:'#526b5b'});}
    if(kind!=='home')shopSlots.push({buildingId:id,x,y:.86,z:z+d/2+.13,width:w*.62});
    if(index%3===0){box(g,.6,.1,.6,-w*.28,h+.38,0,M.screen,.01);}
    return g;
  }
  // Each strip is filled with streets, distinct buildings and public space, not scaled copies of the old district.
  let n=0;for(const z of [-25,-9,1,18,31])for(const x of [-39,-31,32,40]){
    if(z===18&&x<0)continue;const shop=z===1||z===31,labels=z===1?['面包房','书店','鲜花铺','小镇超市']:['手作工坊','理发店','早餐铺','杂货铺'];house(x,z,4.4+(n%2)*.7,4.3,shop?2.7:3.1+(n%3)*1.05,n,shop?labels[n%4]:'邻里住宅 '+(n+1),shop?'shop':'home');n++;
  }
  for(const x of [-17,-9,9,17])house(x,-25,5.2,5,3.8+(n%2)*1.1,n++,'北街住宅 '+n);
  house(-16,31,6,5,4.5,n++,'春日里图书馆','public');house(16,31,6,5,3.4,n++,'小镇诊所','public');
  // Civic square south of the old river, reached by both existing bridges.
  box(ground,20,.12,9,0,-.18,30,M.stoneLight,.05);cyl(fixtures,2.1,.25,0,.02,30,M.stoneDark,2.1,40);cyl(fixtures,1.85,.03,0,.17,30,colorMat('#79b6b9'),1.85,40);cyl(fixtures,.23,1.1,0,.65,30,M.cream);cyl(fixtures,.72,.12,0,1.2,30,M.cream);
  const clock=group(fixtures,'广场钟楼',0,0,-25);box(clock,3.5,6,3.2,0,2.8,0,M.plaster,.08);box(clock,4,.3,3.7,0,6,0,M.tileDark,.02);cyl(clock,1,.1,0,4.7,1.66,M.cream).rotation.x=Math.PI/2;link(clock,[0,4.7,1.73],[0,5.35,1.73],.035,M.iron);link(clock,[0,4.7,1.73],[.48,4.7,1.73],.035,M.iron);label(clock,'春日里',2.6,.45,0,3.1,1.65,{color:'#516e59'});
  function tree(x,z,i){cyl(fixtures,.09,1.7,x,.62,z,M.darkwood);sphere(fixtures,.95,x,2.15,z,i%2?M.leaf:M.leafLight,[.85,1.18,.9]);sphere(fixtures,.65,x+.5,1.85,z+.1,M.leaf,[1,1,1]);}
  function bench(x,z){box(fixtures,1.65,.12,.55,x,.45,z,M.wood);box(fixtures,1.65,.4,.1,x,.78,z-.25,M.wood);for(const dx of [-.62,.62])box(fixtures,.07,.55,.4,x+dx,.12,z,M.iron,.01);}
  for(let x=-44;x<=44;x+=5.5){tree(x,-35,Math.round(x));tree(x,40,Math.round(x));if(Math.abs(x)>23)tree(x,22,1);}
  for(let z=-25;z<38;z+=7){tree(-50,z,0);tree(50,z,1);}
  for(const x of [-10,-5,5,10]){bench(x,33);tree(x,35,1);}for(const x of [-42,-28,28,42])for(const z of [-14,5,23])bench(x,z);
  for(const [x,z,index]of [[-40,-17,0],[-31,9,1],[32,-17,2],[40,25,3]]){const car=group(fixtures,'路边停靠车辆',x,0,z),paint=roofMaterials[index];box(car,1.1,.46,2,0,.18,0,paint,.12);box(car,.92,.5,1.05,0,.64,-.1,paint,.09);box(car,.8,.3,.035,0,.69,.44,M.glass,.02);box(car,.8,.3,.035,0,.69,-.65,M.glass,.02);for(const dx of [-.55,.55])for(const dz of [-.61,.65]){const wheel=cyl(car,.22,.12,dx,.02,dz,M.rubber);wheel.rotation.z=Math.PI/2;}for(const dx of [-.36,.36])box(car,.2,.1,.025,dx,.28,1.02,lampMaterial,.01);}
  for(const x of [-24,24]){const stop=group(fixtures,'镇内公交候车亭',x,0,3);box(stop,2.4,.12,1.4,0,2,0,M.tileDark,.03);for(const dx of [-1,1])cyl(stop,.035,2,dx,.95,-.4,M.iron);box(stop,2.1,1.4,.035,0,1,-.43,M.glass,.02);box(stop,1.7,.09,.4,0,.45,0,M.wood,.02);label(stop,'春日里 · 环镇公交',2,.27,0,1.76,.72,{bg:'#426d5c',color:'#fff0cb'});}
  for(const x of [-42,-28,28,42])for(const z of [-14,23]){cyl(fixtures,.18,.55,x+.9,.08,z,M.tileDark);cyl(fixtures,.21,.05,x+.9,.37,z,M.iron);}
  // Park and play area beside the western extension of the river.
  box(ground,17,.05,9,-35,-.22,18,colorMat('#95ad80'),.1);for(const x of [-40,-34,-28]){tree(x,16,1);bench(x,20);}for(const x of [-36,-33]){link(fixtures,[x,.1,18],[x,2.4,18],.05,M.red);link(fixtures,[x,.1,20],[x,2.4,18],.05,M.red);}link(fixtures,[-36,2.4,18],[-33,2.4,18],.06,M.iron);for(const x of [-35.3,-33.7]){link(fixtures,[x,2.3,18],[x,.7,18],.012,M.iron);box(fixtures,.6,.08,.35,x,.65,18,M.wood);}
  function lamp(x,z){cyl(fixtures,.075,3.4,x,1.45,z,M.iron);cyl(fixtures,.21,.12,x,-.12,z,M.iron);box(fixtures,.45,.1,.62,x,3.16,z,M.iron);box(fixtures,.36,.04,.5,x,3.08,z,lampMaterial,.015);lamps.push(new T.Vector3(x,3,z));}
  for(const z of horizontal)for(let x=-43;x<=43;x+=9)lamp(x,z+2.55);for(const x of [-25,25,-46,46])for(let z=-23;z<=32;z+=9)lamp(x+2.55,z);
  for(const [x,z]of [[-9,7.7],[-3,12.8],[5,7.7],[17,12.8],[-18,12.8],[4,-10],[-6,22],[8,22],[-10,29],[10,29],[0,35]])lamp(x,z);
  for(const [x,z,name]of [[-34,-16,'榆树住宅街'],[35,7,'东街 · 商店街'],[-34,24,'河岸公园'],[0,37,'春日里 · 镇民广场']]){label(fixtures,name,5,.5,x,.03,z,{color:'#536c57',bg:'#f2e8d2'}).rotation.x=-Math.PI/2;}
  const parkProxy=new T.Mesh(new T.BoxGeometry(17,.3,9),new T.MeshBasicMaterial({visible:false}));parkProxy.position.set(-35,0,18);parkProxy.userData={action:'town-park',value:'town-park',title:'河岸公园'};root.add(parkProxy);
  architecture.traverse(o=>{if(o.isMesh)o.castShadow=false;});batch(architecture);for(const zone of Object.values(zones))delete zone.userData.view;batch(ground);batch(fixtures);
  const poolTexture=canvasTexture((ctx,n)=>{const gradient=ctx.createRadialGradient(n/2,n/2,0,n/2,n/2,n/2);gradient.addColorStop(0,'rgba(255,206,121,.38)');gradient.addColorStop(.45,'rgba(255,201,112,.15)');gradient.addColorStop(1,'rgba(255,190,90,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,n,n);},64),poolMaterial=new T.MeshBasicMaterial({map:poolTexture,transparent:true,depthWrite:false,opacity:0,blending:T.AdditiveBlending});
  const pools=new T.InstancedMesh(new T.PlaneGeometry(5,5),poolMaterial,lamps.length),dummy=new T.Object3D();lamps.forEach((p,i)=>{dummy.position.set(p.x,-.105,p.z);dummy.rotation.x=-Math.PI/2;dummy.updateMatrix();pools.setMatrixAt(i,dummy.matrix);});pools.name='路灯地面光池';pools.frustumCulled=false;root.add(pools);
  const lights=Array.from({length:8},()=>{const light=new T.PointLight('#ffd093',0,9,2);world.add(light);return light;});
  const clockLabel=document.createElement('div');clockLabel.className='town-clock';clockLabel.setAttribute('role','timer');document.getElementById('scene-wrap').append(clockLabel);
  lifeAPI.configure(buildings);
  const dwellingWindows=new T.InstancedMesh(new T.BoxGeometry(.7,.57,.025),dwellingMaterial,windowSlots.length),shopWindows=new T.InstancedMesh(new T.BoxGeometry(1,.5,.025),dwellingMaterial,shopSlots.length);
  dwellingWindows.name='18 户独立亮窗';shopWindows.name='按营业时段亮起的橱窗';for(const mesh of [dwellingWindows,shopWindows]){mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);mesh.frustumCulled=false;dynamic.add(mesh);}const windowDummy=new T.Object3D();windowDummy.scale.setScalar(0);windowDummy.updateMatrix();for(let i=0;i<windowSlots.length;i++)dwellingWindows.setMatrixAt(i,windowDummy.matrix);for(let i=0;i<shopSlots.length;i++)shopWindows.setMatrixAt(i,windowDummy.matrix);
  const householdFigures=buildHouseholdFigures(dynamic,windowSlots);
  return {root,lamps,lights,buildings,poolMaterial,clockLabel,windowMaterial,lampMaterial,dwellingMaterial,dwellingWindows,shopWindows,windowSlots,shopSlots,windowDummy,householdFigures,buildingLife:null,lifeSignature:''};
}
const dayColor=new T.Color('#f0e8d5'),duskColor=new T.Color('#c89588'),darkColor=new T.Color('#18263d'),floorNight=new T.Color('#263b57'),hemiDay=new T.Color('#fff3d6');
export function poseTown(town,s,scene,camera,controls,sun,hemisphere,fill,floor,living,time=0,reduced=false){
  const c=globalThis.NoodleTownCycle.daylight(s),changed=!town.cycle||Math.abs(town.cycle.hour-c.hour)>.002;town.cycle=c;const night=c.night;
  if(changed){scene.background.copy(dayColor).lerp(duskColor,Math.sin(night*Math.PI)*.55).lerp(darkColor,night);floor.material.color.copy(dayColor).lerp(floorNight,night);sun.intensity=3.1*(1-night)+.08;sun.color.set(night>.1?'#ffd0a0':'#ffdfa4');sun.position.set(-28+56*c.progress,12+27*c.sun,20);hemisphere.intensity=1.4*(1-night)+.22;hemisphere.color.set('#8aaada').lerp(hemiDay,1-night);fill.intensity=.8*(1-night)+.12;scene.environmentIntensity=.32*(1-night)+.07;}
  town.windowMaterial.emissiveIntensity=0;town.dwellingMaterial.emissiveIntensity=.25+night*1.45;town.lampMaterial.emissiveIntensity=night*3;town.poolMaterial.opacity=night;document.getElementById('scene-wrap').dataset.night=night>.5?'true':'false';
  if(s){const signature=s.day+'|'+s.phase+'|'+Math.floor((s.elapsed||0)*10)+'|'+(living||[]).map(r=>r.home?1:0).join('');if(signature!==town.lifeSignature){town.lifeSignature=signature;town.buildingLife=globalThis.NoodleBuildingLife.snapshot(s,living);const d=town.windowDummy;town.windowSlots.forEach((slot,i)=>{const lit=town.buildingLife.households[slot.residentId].lit;d.position.set(slot.x,slot.y,slot.z);d.scale.setScalar(lit?1:0);d.updateMatrix();town.dwellingWindows.setMatrixAt(i,d.matrix);});town.shopSlots.forEach((slot,i)=>{const open=town.buildingLife.buildings.find(b=>b.id===slot.buildingId)?.open;d.position.set(slot.x,slot.y,slot.z);d.scale.set(open?slot.width:0,open?1:0,open?1:0);d.updateMatrix();town.shopWindows.setMatrixAt(i,d.matrix);});town.dwellingWindows.instanceMatrix.needsUpdate=true;town.shopWindows.instanceMatrix.needsUpdate=true;}}
  poseHouseholdFigures(town.householdFigures,town.buildingLife,time,reduced);
  if(!town.lightTarget||town.lightTarget.distanceToSquared(controls.target)>1){town.lightTarget=controls.target.clone();town.nearby=town.lamps.map(p=>({p,d:p.distanceToSquared(controls.target)})).sort((a,b)=>a.d-b.d);town.lights.forEach((light,i)=>light.position.copy(town.nearby[i].p));}town.lights.forEach(light=>{light.intensity=night*14;});const text=`日照 ${c.clock} · ${c.phase}${c.mode==='manual'?' · 手动':''}${s?.paused?' · 暂停':''}`;if(town.clockLabel.textContent!==text)town.clockLabel.textContent=text;
}
