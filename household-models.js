import * as T from 'three';

// Fixed window figures: all eighteen households share three low polygon batches.
export function buildHouseholdFigures(parent,slots){
  const material=new T.MeshBasicMaterial({color:'#66503b'}),dummy=new T.Object3D();
  const parts=[{name:'窗内居民头部',geometry:new T.SphereGeometry(.085,7,5)}, {name:'窗内居民上身',geometry:new T.BoxGeometry(.17,.21,.035)}, {name:'窗内餐桌与书本',geometry:new T.BoxGeometry(.28,.035,.05)}];
  for(const p of parts){p.mesh=new T.InstancedMesh(p.geometry,material,slots.length);p.mesh.name=p.name;p.mesh.frustumCulled=false;p.mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);parent.add(p.mesh);}
  return {parts,slots,dummy,activities:Array(slots.length).fill('away')};
}
export function poseHouseholdFigures(figures,life,time,reduced){
  if(!life)return;
  const d=figures.dummy;
  figures.slots.forEach((slot,i)=>{const h=life.households[slot.residentId],activity=h?.activity||'away',show=h?.lit&&['meal','read','rest'].includes(activity);figures.activities[i]=show?activity:'hidden';
    figures.parts.forEach((p,index)=>{const sway=show&&!reduced?Math.sin(time*.8+i)*.008:0;d.position.set(slot.x+(index===2?.06:0),slot.y+(index===0?.11:index===1?-.05:-.16)+sway,slot.z+.023+index*.002);d.rotation.set(0,0,index===2&&activity==='read'?-.16:0);d.scale.setScalar(show?1:0);if(index===2&&activity==='rest')d.scale.setScalar(0);d.updateMatrix();p.mesh.setMatrixAt(i,d.matrix);});
  });
  for(const p of figures.parts)p.mesh.instanceMatrix.needsUpdate=true;
}

export function streetHouseholdTarget(model,resident,dt,paused,reduced){
  dt=Math.max(0,dt);
  const home=globalThis.NoodleBuildingLife.household(resident.id),entrance=home.entrance;
  let v=model.householdVisual;
  if(!v)v=model.householdVisual={inside:!!resident.home,door:resident.home?1:0,bench:0,returning:false,stage:resident.home?'inside':'street'};
  if(paused)return {x:model.motion?.x??resident.x,z:model.motion?.z??resident.z,facing:model.motion?.yaw??resident.facing};
  const visual=model.motion,nearDoor=visual&&Math.hypot(visual.x-entrance.x,visual.z-entrance.z)<.12;
  if(v.inside&&!resident.home){v.inside=false;v.stage='exit';if(model.motion){model.motion.x=entrance.x;model.motion.z=entrance.z;model.motion.amount=0;model.motion.yaw=0;}}
  const entering=resident.home&&nearDoor;
  const amount=Math.min(1,dt/.45);
  if(entering||v.inside){v.door=Math.min(1,v.door+amount);v.stage=v.door>=1?'inside':'enter';if(v.door>=1)v.inside=true;}
  else if(v.door>0){v.door=Math.max(0,v.door-amount);v.stage='exit';}
  else v.stage='street';
  const eligible=resident.destination==='park'&&resident.arrived&&!resident.greeting&&!resident.companion&&!resident.activity&&!resident.commerceVenue;
  const bench={x:-34.6,z:20.08};
  let x=resident.x,z=resident.z,facing=resident.facing;
  if(v.door>0||entering){x=entrance.x;z=entrance.z;facing=v.stage==='exit'?0:Math.PI;}
  const parked=visual&&Math.hypot(visual.x+35,visual.z-20)<.14;
  if(eligible&&(parked||v.bench>0||v.atBench)){v.atBench=true;x=bench.x;z=bench.z;facing=0;const near=Math.hypot(visual.x-bench.x,visual.z-bench.z)<.025&&visual.amount<.06;if(near)v.bench=Math.min(1,v.bench+dt/.45);}
  else if(v.atBench||v.bench>0||v.returning){v.bench=Math.max(0,v.bench-dt/.25);v.returning=true;v.atBench=false;x=v.bench>0?bench.x:-35;z=v.bench>0?bench.z:20;facing=resident.facing;if(v.bench===0&&visual&&Math.hypot(visual.x+35,visual.z-20)<.1)v.returning=false;}
  if(!eligible&&v.returning&&v.bench===0){x=-35;z=20;}
  v.logicalPark=eligible;v.benchPoint=bench;v.reduced=reduced;
  // A delayed doorstep departure cannot trigger advance()'s >3m reset branch.
  if(visual){const distance=Math.hypot(x-visual.x,z-visual.z),limit=Math.min(1.9,Math.max(.025,dt*16));if(distance>limit){x=visual.x+(x-visual.x)/distance*limit;z=visual.z+(z-visual.z)/distance*limit;}}
  return {x,z,facing};
}
export function poseStreetHousehold(model,resident,time,paused,reduced){
  const v=model.householdVisual;if(!v||paused)return;
  // A short retreat stays wholly in the entrance apron, before the wall at z=-6.85.
  model.root.position.z-=v.door*.28;model.root.scale.multiplyScalar(1-v.door);model.root.visible=v.door<.999;
  if(v.bench>0){const blend=v.bench;model.root.position.y-=.52*blend;model.legs.forEach(leg=>{leg.hip.rotation.x=-Math.PI/2*blend;leg.knee.rotation.x=Math.PI/2*blend;leg.ankle.rotation.x=0;});model.arms.forEach(a=>a.rotation.x=-.45*blend);}
  if(resident.greeting&&!v.bench){model.arms[1].rotation.x=-1.8;model.arms[1].rotation.z=-.35+(reduced?0:Math.sin(time*7+resident.id)*.12);}
}
