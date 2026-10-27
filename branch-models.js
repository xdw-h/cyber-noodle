import {M,group,box,cyl,label,bowl,batch} from './model-kit.js';
import {buildRobot,buildStove} from './shop-models.js';

// Frontage clear of district buildings, delivery pads and their approach paths.
export const BRANCH_SITES={
  park:{name:'科技园分店',position:[15.8,.03,-2.15]},
  community:{name:'社区分店',position:[14,.25,6.6]},
  camp:{name:'营地分店',position:[-16.35,.25,9.6]}
};

function station(world,place,site){
  const root=group(world,`第二家店 · ${site.name}`,...site.position);
  root.userData={action:'branches',value:place,title:`${site.name} · 查看经营`};
  const fixed=group(root,'分店小型炒粉站');
  box(fixed,2.25,.13,1.9,0,.03,0,M.stoneLight,.06);
  box(fixed,2.05,.55,.42,0,.36,-.64,M.tileDark,.06);
  box(fixed,2.15,.08,.5,0,.67,-.64,M.wood);
  for(const x of [-.98,.98])cyl(fixed,.035,1.95,x,1.04,-.72,M.iron);
  box(fixed,2.32,.13,.72,0,2.03,-.66,M.red,.055);
  box(fixed,2.16,.35,.09,0,1.79,-.35,M.tileDark);
  label(fixed,`好好炒粉 · ${site.name}`,2.02,.26,0,1.8,-.295,{color:'#fff1d0'});
  box(fixed,.65,.72,.65,.72,.43,.42,M.tileDark,.06);
  box(fixed,.78,.075,.76,.72,.83,.42,M.lightwood);
  label(fixed,'自取 · 取餐台',.61,.2,.72,.55,.756,{color:'#fff1d0'});
  bowl(fixed,.72,.875,.42,.12,false);
  for(const x of [.51,.7,.89])cyl(fixed,.045,.13,x,.78,-.62,M.cream);
  box(fixed,.48,.28,.3,-.77,.86,-.63,M.lightwood);
  label(fixed,'鲜蔬',.4,.14,-.77,.87,-.471,{color:'#57724a'});
  batch(fixed);
  const robot=buildRobot(root);robot.base.position.set(-.4,.16,-.43);robot.base.scale.setScalar(.58);
  const stove=buildStove(root);stove.base.position.set(-.4,.16,.22);stove.base.scale.setScalar(.58);
  // Inner workstation meshes share the branch action, rather than the main shop upgrade action.
  robot.base.userData={};stove.base.userData={};
  const lamp=box(root,.15,.1,.08,.88,1.78,-.28,M.amber);
  root.visible=false;stove.fire.visible=false;stove.steam.visible=false;
  return {root,robot,stove,lamp};
}

export function buildBranch(world){
  return Object.fromEntries(Object.entries(BRANCH_SITES).map(([place,site])=>[place,station(world,place,site)]));
}

export function poseBranch(model,s,time){
  const branch=s.branch;
  for(const [place,station] of Object.entries(model)){
    const visible=branch?.place===place;station.root.visible=visible;
    if(!visible)continue;
    const cooking=!!branch.current&&branch.enabled!==false&&s.phase!=='prep'&&s.phase!=='report';
    station.lamp.material=branch.enabled?M.cyan:M.amber;
    station.stove.fire.visible=cooking;
    station.stove.steam.visible=cooking;
    // Keep the last articulated pose while paused; shared scene time also stops advancing.
    if(s.paused)continue;
    if(cooking){
      station.robot.arm.rotation.x=Math.sin(time*7)*.12;
      station.robot.arm.rotation.z=Math.sin(time*5)*.08;
      station.robot.head.rotation.y=Math.sin(time*2)*.05;
      station.stove.wok.rotation.z=Math.sin(time*6)*.045;
      station.stove.steam.children.forEach((p,i)=>{p.position.y=1.4+((time*.35+i*.16)%.95);p.scale.setScalar(.55+(p.position.y-1.4)*.8);});
    }else{
      station.robot.arm.rotation.set(0,0,0);station.robot.head.rotation.set(0,0,0);station.stove.wok.rotation.set(0,0,0);
    }
  }
}
