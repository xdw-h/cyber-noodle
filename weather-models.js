import * as T from 'three';
const W=globalThis.NoodleWeather;
const hidden=new T.Matrix4().makeScale(0,0,0),colors=['#719790','#cc9674','#8b96b2','#b5a16e'];
const roadDry=new T.Color('#707b76'),roadWet=new T.Color('#53676b');
export function buildWeather(scene,town,mobile){
  const capacity=mobile?110:240,positions=new Float32Array(capacity*6),geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.BufferAttribute(positions,3).setUsage(T.DynamicDrawUsage));
  const rain=new T.LineSegments(geometry,new T.LineBasicMaterial({color:'#c6d9dd',transparent:true,opacity:0,depthWrite:false}));rain.name='镜头附近轻量雨丝';rain.frustumCulled=false;scene.add(rain);
  const puddles=new T.InstancedMesh(new T.CircleGeometry(1,14),new T.MeshStandardMaterial({color:'#7e9598',transparent:true,opacity:0,roughness:.24,metalness:.25,depthWrite:false}),18),dummy=new T.Object3D();puddles.name='固定街道浅水洼';puddles.frustumCulled=false;scene.add(puddles);
  const points=[[-39,10.2],[-31,10.2],[32,10.2],[40,10.2],[-46,-18],[-25,-18],[25,-18],[46,-18],[-46,26],[-25,26],[25,26],[46,26],[-7,-22],[-6,25],[8,25],[-14,1],[14,10.2],[0,-18]];
  points.forEach(([x,z],i)=>{dummy.position.set(x,(i<4?-.13:-.215),z);dummy.rotation.set(-Math.PI/2,0,i*1.7);dummy.scale.set(.45+i%3*.15,1.1+i%2*.2,1);dummy.updateMatrix();puddles.setMatrixAt(i,dummy.matrix);});puddles.instanceMatrix.needsUpdate=true;
  const reflections=new T.InstancedMesh(new T.CircleGeometry(1,12),new T.MeshBasicMaterial({color:'#ffd398',transparent:true,opacity:0,depthWrite:false,blending:T.AdditiveBlending}),8);reflections.name='雨夜路灯水面光斑';reflections.frustumCulled=false;scene.add(reflections);
  const canopy=new T.InstancedMesh(new T.SphereGeometry(.65,10,4,0,Math.PI*2,0,Math.PI/2),new T.MeshStandardMaterial({roughness:.85,side:T.DoubleSide}),96),shaft=new T.InstancedMesh(new T.CylinderGeometry(.014,.014,1,5),new T.MeshStandardMaterial({color:'#544f46',roughness:.7}),96);
  for(const [mesh,name]of [[canopy,'居民共享伞面'],[shaft,'居民共享伞柄']]){mesh.name=name;mesh.frustumCulled=false;mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);for(let i=0;i<96;i++)mesh.setMatrixAt(i,hidden);scene.add(mesh);}for(let i=0;i<96;i++)canopy.setColorAt(i,new T.Color(colors[i%4]));
  return {rain,puddles,reflections,canopy,shaft,dummy,matrix:new T.Matrix4(),capacity,positions,roofs:W.roofs(town.buildings),wet:0,intensity:0,cloud:0,clock:0,people:[],lastKey:'',dropsVisible:0};
}
// Only adjust an already completed arrival's doorstep pause; never write resident state.
export function weatherTarget(weather,model,r,target,dt,paused){
  if(paused)return target;
  const shelter=weather.intensity>.08?W.shelter(r):null,v=model.weatherVisual??={open:0,shelter:false};v.shelter=!!shelter;
  if(!shelter)return target;
  const visual=model.motion;if(!visual)return target;
  const distance=Math.hypot(shelter.x-visual.x,shelter.z-visual.z),limit=Math.min(1.9,Math.max(0,dt)*12);
  return distance>limit&&distance>0?{x:visual.x+(shelter.x-visual.x)/distance*limit,z:visual.z+(shelter.z-visual.z)/distance*limit,facing:shelter.facing}:shelter;
}
export function poseWeather(weather,s,models,target,town,dt,paused,reduced){
  dt=Math.max(0,Math.min(.2,dt));const description=W.describe(s,globalThis.NoodleWeatherView),key=description.mode,preview=weather.lastKey!==key;
  if(!paused){weather.intensity=description.rain;weather.cloud=description.cloud;weather.wet+=((description.rain>.03?1:0)-weather.wet)*Math.min(1,dt/(description.rain>.03?1.6:10));if(!reduced)weather.clock+=dt;}
  if(preview){weather.lastKey=key;weather.intensity=description.rain;weather.cloud=description.cloud;if(description.mode==='rain')weather.wet=1;}
  weather.description=description;const rain=weather.intensity,wet=weather.wet,clock=weather.clock;
  weather.rain.visible=rain>.01&&!reduced;weather.rain.material.opacity=rain*.55;weather.puddles.visible=wet>.01;weather.puddles.material.opacity=wet*.34;
  town.weatherRoad.color.copy(roadDry).lerp(roadWet,wet*.7);town.weatherRoad.roughness=.95-wet*.4;
  const positions=weather.positions,count=Math.floor(weather.capacity*rain);weather.rain.geometry.setDrawRange(0,count*2);weather.dropsVisible=weather.rain.visible?count:0;
  if(weather.rain.visible&&(!paused||preview)){for(let i=0;i<count;i++){const x=target.x+(((i*73.17)%44)-22),z=target.z+(((i*31.73)%44)-22),y=((i*1.734-clock*8)%11+11)%11-.15,roof=W.roofAt(x,z,weather.roofs),offset=i*6;positions[offset]=x;positions[offset+1]=y<=roof+.45?-10:y;positions[offset+2]=z;positions[offset+3]=x+.06;positions[offset+4]=y<=roof+.45?-10:y-.42;positions[offset+5]=z+.025;}weather.rain.geometry.attributes.position.needsUpdate=true;}
  const night=town.cycle?.night||0;weather.reflections.visible=wet*night>.01;weather.reflections.material.opacity=wet*night*.22;
  town.lights.forEach((lamp,i)=>{const d=weather.dummy;d.position.set(lamp.position.x,-.155,lamp.position.z+.7);d.rotation.set(-Math.PI/2,0,0);d.scale.set(.24,1.15,1);d.updateMatrix();weather.reflections.setMatrixAt(i,d.matrix);});weather.reflections.instanceMatrix.needsUpdate=true;
  weather.people=[];let umbrellaCount=0;
  models.slice(0,96).forEach((entry,i)=>{const model=entry.model||entry,r=entry.resident,v=model.weatherVisual??={open:0,shelter:false},root=model.root,x=root.position.x,z=root.position.z,underRoof=W.covered(x,z,weather.roofs),wanted=rain>.08&&root.visible&&!underRoof&&!(model.seatBlend>.1)&&!model.tray?.visible&&!model.householdVisual?.bench;
    if(!paused||preview)v.open=paused||reduced?Number(wanted):Math.max(0,Math.min(1,v.open+(wanted?1:-1)*dt/.4));
    const show=root.visible&&v.open>.001&&!underRoof;if(show){if((!paused||preview)&&model.arms?.[0]){v.armBefore??={};v.armBefore.x=model.arms[0].rotation.x;v.armBefore.z=model.arms[0].rotation.z;model.arms[0].rotation.x=-.95;model.arms[0].rotation.z=.12;model.arms[0].updateWorldMatrix(true,false);}root.updateWorldMatrix(true,false);const d=weather.dummy;d.position.set(-.3,2.05,.24);d.rotation.set(0,0,!reduced?Math.sin(clock*1.8+i)*.025:0);d.scale.set(v.open,.55+.45*v.open,v.open);d.updateMatrix();weather.matrix.multiplyMatrices(root.matrixWorld,d.matrix);weather.canopy.setMatrixAt(i,weather.matrix);d.position.y=1.55;d.scale.set(v.open,1,v.open);d.updateMatrix();weather.matrix.multiplyMatrices(root.matrixWorld,d.matrix);weather.shaft.setMatrixAt(i,weather.matrix);}else{weather.canopy.setMatrixAt(i,hidden);weather.shaft.setMatrixAt(i,hidden);}
    if(!show&&paused&&preview&&v.armBefore&&model.arms?.[0]){model.arms[0].rotation.x=v.armBefore.x;model.arms[0].rotation.z=v.armBefore.z;}
    if(show)umbrellaCount++;weather.people.push({id:r?.id??entry.id??i,open:v.open,visible:show,covered:underRoof,shelter:!!v.shelter,position:[x,z]});
  });for(let i=models.length;i<96;i++){weather.canopy.setMatrixAt(i,hidden);weather.shaft.setMatrixAt(i,hidden);}weather.canopy.instanceMatrix.needsUpdate=true;weather.shaft.instanceMatrix.needsUpdate=true;
  weather.canopy.visible=weather.shaft.visible=umbrellaCount>0;
}
