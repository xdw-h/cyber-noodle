import * as T from 'three';
import {M,rnd,group,box,cyl,sphere,torus,tube,link,label,bowl,planter,batch,colorMat,mesh} from './model-kit.js';

export function buildArchitecture(world){
  const g=group(world,'Architecture · timber and ceramic');
  box(g,9.7,.38,8.5,0,-.12,0,M.stoneDark,.12);
  box(g,9.48,.08,8.28,0,.09,0,M.grout,.045);
  for(let row=0;row<15;row++)for(let col=0;col<16;col++){const x=-4.48+col*.59+(row%2)*.1,z=-3.97+row*.55;if(x>4.58)continue;box(g,.565,.1,.52,x,.16+(rnd()-.5)*.009,z,rnd()>.65?M.stoneLight:M.stone,.035);}
  for(let i=0;i<17;i++){for(const z of [-4.15,4.15])box(g,.55,.34,.24,-4.55+i*.565,-.08,z,M.stoneDark,.04);}
  for(let i=0;i<14;i++)for(const x of [-4.73,4.73])box(g,.24,.34,.55,x,-.08,-3.8+i*.57,M.stoneDark,.035);
  box(g,6.45,.1,3.9,-.8,.28,-1.24,M.darkwood);
  for(let i=0;i<20;i++)box(g,.3,.06,3.76,-3.8+i*.318,.36,-1.25,i%3===0?M.lightwood:M.wood,.01);
  box(g,6.75,3.05,.2,-.75,1.88,-3.1,M.grout);
  box(g,.22,2.9,3.15,-4.02,1.8,-1.61,M.plaster);
  for(let y=0;y<9;y++)for(let x=0;x<19;x++){box(g,.333,.282,.05,-3.85+x*.344,.53+y*.302,-2.973,[M.tile,M.tileLight,M.tileDark][Math.floor(rnd()*3)],.012);}
  // Low return wall keeps the kitchen readable when viewed from the right.
  box(g,.19,.65,3.3,2.57,.72,-1.53,M.grout);
  for(let i=0;i<9;i++)box(g,.055,.28,.33,2.68,.76,-2.9+i*.35,M.tile,.012);
  for(const x of [-3.84,2.32]){box(g,.2,3.3,.23,x,1.95,-1.75,M.darkwood,.025);box(g,.27,.18,.3,x,.5,-1.75,M.wood);box(g,.3,.18,.32,x,3.37,-1.75,M.wood);}
  box(g,6.5,.22,.25,-.76,3.52,-2.92,M.darkwood);
  box(g,6.5,.2,.25,-.76,3.37,-1.74,M.darkwood);
  for(let x=0;x<24;x++)for(let z=0;z<3;z++){const tile=cyl(g,.146,.6,-3.88+x*.272,3.58+z*.14,-1.85-z*.55,[M.roof,M.roofLight,M.roofDark][Math.floor(rnd()*3)],.146,12);tile.rotation.x=Math.PI/2+.2;}
  for(let i=0;i<27;i++)box(g,.25,.16,.22,-3.96+i*.25,3.92,-2.88,M.stoneDark,.035);
  box(g,5.5,.69,.16,-.76,3.61,-1.65,M.darkwood,.06);
  box(g,5.28,.53,.04,-.76,3.62,-1.547,M.plaster,.035);
  label(g,'好 好 炒 粉',4.55,.44,-.76,3.62,-1.516,{color:'#5c3820'});
  for(const x of [-3.3,1.8])for(const y of [3.36,3.85])sphere(g,.025,x,y,-1.515,M.brass);
  const awning=group(g,'striped linen awning',-.75,3.19,-1.75);awning.rotation.x=.24;
  for(let i=0;i<24;i++){box(awning,.266,.047,1.1,-3.06+i*.266,0,.48,i%2?M.canvas:M.red,.016);box(awning,.266,.19,.045,-3.06+i*.266,-.09,1.04,i%2?M.canvas:M.red,.07);}
  for(const x of [-3.55,2.0]){link(g,[x,3.3,-1.73],[x,3.3,-1.3],.024,M.iron);sphere(g,.05,x,3.29,-1.27,M.iron);const shade=mesh(g,new T.ConeGeometry(.12,.13,20,1,true),M.iron,x,3.23,-1.28);shade.rotation.x=Math.PI;sphere(g,.055,x,3.16,-1.28,M.amber);}
  // Shelving, rails and handmade accessories.
  for(const y of [1.64,2.44]){box(g,2.42,.09,.36,.45,y,-2.74,M.wood,.02);for(const x of [-.55,1.38])link(g,[x,y-.2,-2.92],[x,y-.05,-2.59],.018,M.iron);}
  for(let i=0;i<8;i++){const x=-.58+i*.28;cyl(g,.075,.23,x,2.6,-2.71,[M.red,M.cream,M.iron,M.brass][i%4]);cyl(g,.082,.035,x,2.735,-2.71,M.darkwood);}
  for(let i=0;i<4;i++)for(let j=0;j<3;j++)bowl(g,.13+i*.23,1.69+j*.045,-2.7,.105,false);
  const chop=group(g,'chopping area',-2.89,1.1,-2.38);box(chop,1.35,.95,.72,0,-.28,0,M.darkwood);box(chop,1.39,.09,.77,0,.25,0,M.wood);box(chop,.58,.05,.36,.2,.32,0,M.lightwood);for(let i=0;i<5;i++)box(chop,.07,.02,.18,.02+i*.08,.36,0,M.leaf,.01);box(chop,.04,.03,.3,-.2,.38,.1,M.metal,.01);
  for(let i=0;i<5;i++){bowl(g,-3.35,1.41+i*.05,-1.7,.19,false);}
  const basket=group(g,'fresh ingredients basket',-3.36,.75,-1.2);box(basket,.7,.45,.6,0,0,0,M.wood);for(let i=0;i<10;i++)box(basket,.018,.4,.62,-.34+i*.075,0,0,M.lightwood,.005);for(let i=0;i<11;i++)sphere(basket,.12,(rnd()-.5)*.5,.3,(rnd()-.5)*.4,M.leafLight,[.8,1.1,.7]);
  batch(g);return g;
}

export function buildKitchen(world){
  const g=group(world,'Kitchen · sink and refrigerator');g.userData={action:'purchase',title:'中央厨房与食材采购'};
  box(g,1.23,1.05,.75,1.5,.88,-2.45,M.darkwood);box(g,1.3,.07,.79,1.5,1.44,-2.45,M.metal);
  box(g,.55,.09,.5,1.49,1.48,-2.42,M.iron,.08);box(g,.44,.03,.39,1.49,1.52,-2.42,M.metal,.07);
  tube(g,[[1.7,1.5,-2.69],[1.7,1.85,-2.69],[1.7,1.95,-2.45],[1.7,1.83,-2.35]],.028,M.metal);
  for(const x of [1.09,1.94])box(g,.06,.2,.07,x,1.22,-2.03,M.brass);
  box(g,.88,1.92,.78,2.02,1.32,-1.35,M.metal,.07);box(g,.8,.73,.06,2.02,1.85,-.938,M.metal);box(g,.8,.91,.06,2.02,.98,-.938,M.metal);box(g,.045,.36,.065,1.73,1.81,-.88,M.iron);box(g,.045,.4,.065,1.73,1.03,-.88,M.iron);box(g,.18,.12,.007,2.2,2.03,-.898,M.cream,.005);label(g,'COOL',.15,.08,2.2,2.03,-.89,{color:'#637267'});
  const menu=box(g,.54,.71,.04,-3.77,2.14,-1.91,M.darkwood);menu.rotation.y=Math.PI/2;const board=label(g,'今日现炒',.42,.5,-3.74,2.14,-1.91,{bg:'#3c6050',color:'#eee5b9',vertical:true});board.rotation.y=Math.PI/2;
  batch(g);return g;
}

export function buildCounter(world){
  const g=group(world,'Oak front counter');g.userData={action:'menu',title:'菜单与定价'};
  box(g,5.93,.92,.65,-.74,.85,.87,M.darkwood);
  for(let i=0;i<31;i++)box(g,.18,.87,.035,-3.6+i*.191,.87,1.213,i%4===0?M.lightwood:M.wood,.008);
  box(g,6.08,.15,.91,-.74,1.37,.86,M.wood,.045);box(g,6.07,.035,.06,-.74,1.47,1.27,M.lightwood,.01);
  box(g,2.1,.36,.06,-.76,.91,1.26,M.lightwood,.04);label(g,'好 好 炒 粉',1.94,.26,-.76,.91,1.3,{color:'#90532e'});
  for(let i=0;i<5;i++)bowl(g,-2.8+i*.26,1.47,.66,.16,i>1);
  for(const x of [-1.72,-1.48,1.1]){cyl(g,.06,.21,x,1.58,.66,x<0?M.red:M.iron);cyl(g,.045,.065,x,1.72,.66,M.brass);box(g,.085,.085,.009,x,1.58,.725,M.canvas,.008);}
  const holder=cyl(g,.09,.19,.57,1.56,.61,M.wood);for(let i=0;i<9;i++)link(g,[.57+(rnd()-.5)*.12,1.5,.61+(rnd()-.5)*.1],[.57+(rnd()-.5)*.19,1.94,.61+(rnd()-.5)*.12],.008,M.lightwood);
  box(g,.45,.025,.3,.8,1.46,1.05,M.darkwood,.01);box(g,.4,.015,.26,.8,1.48,1.05,M.canvas,.01);
  batch(g);return g;
}

export function buildRobot(world){
  const base=group(world,'阿炒 · articulated cooking robot',-.9,.4,-1.3);base.userData={action:'upgrade',title:'阿炒机器人工作站'};
  const fixed=group(base,'robot body');cyl(fixed,.34,.22,0,.11,0,M.iron);cyl(fixed,.18,.24,0,.32,0,M.metal);box(fixed,.64,.69,.46,0,.72,0,M.robot,.12);box(fixed,.35,.25,.025,0,.77,.25,M.robotTrim,.05);box(fixed,.16,.035,.035,0,.78,.28,M.cyan);cyl(fixed,.13,.16,0,1.14,0,M.metal);
  const head=group(base,'robot head',0,1.5,0);box(head,.88,.62,.57,0,0,0,M.robotTrim,.15);box(head,.69,.4,.055,0,.01,.302,M.screen,.11);for(const x of [-.17,.17]){tube(head,[[x-.065,.01,.343],[x,.065,.35],[x+.065,.01,.343]],.016,M.cyan);}tube(head,[[-.07,-.08,.346],[0,-.105,.35],[.07,-.08,.346]],.012,M.cyan);cyl(head,.035,.16,0,.39,0,M.metal);sphere(head,.06,0,.49,0,M.amber);for(const x of [-.49,.49]){const side=cyl(head,.13,.11,x,0,0,M.iron);side.rotation.z=Math.PI/2;sphere(head,.07,x*1.06,0,0,M.brass);}
  const arm=group(base,'right shoulder',.39,1.02,0);sphere(arm,.16,0,0,0,M.iron);link(arm,[0,0,0],[.36,-.22,.2],.105,M.robotTrim);sphere(arm,.13,.36,-.22,.2,M.brass);link(arm,[.36,-.22,.2],[.27,-.3,.72],.075,M.iron);sphere(arm,.09,.27,-.3,.72,M.robotTrim);link(arm,[.27,-.3,.72],[-.14,-.21,1.03],.025,M.metal);box(arm,.17,.025,.16,-.14,-.21,1.03,M.metal,.025);
  const left=group(base,'left shoulder',-.39,1.02,0);sphere(left,.15,0,0,0,M.iron);link(left,[0,0,0],[-.36,-.13,.35],.09,M.robotTrim);sphere(left,.12,-.36,-.13,.35,M.brass);link(left,[-.36,-.13,.35],[-.36,-.25,.91],.065,M.iron);box(left,.12,.08,.09,-.36,-.25,.91,M.robotTrim,.025);
  batch(fixed);batch(head);batch(arm);batch(left);return {base,head,arm,left};
}

export function buildStove(world){
  const base=group(world,'Wok and cooking range',-.9,.38,-.18);base.userData={action:'upgrade',title:'机器人正在这口锅里炒粉'};
  box(base,1.3,.73,.93,0,.38,0,M.iron,.08);box(base,1.35,.12,.98,0,.8,0,M.metal,.06);for(let i=0;i<4;i++){const knob=cyl(base,.045,.05,-.38+i*.25,.64,.5,M.iron);knob.rotation.x=Math.PI/2;}
  const fire=group(base,'burner');torus(fire,.34,.04,0,.89,0,M.amber);for(let i=0;i<11;i++){const a=i/11*6.28;sphere(fire,.06,Math.sin(a)*.3,.95,Math.cos(a)*.3,M.amber,[.6,1.7,.6]);}
  const wok=group(base,'black iron wok',0,1,0);
  const profile=[[.06,0],[.16,.015],[.28,.07],[.39,.16],[.46,.24],[.47,.27],[.45,.29],[.41,.21],[.34,.14],[.2,.06],[.06,.045]].map(v=>new T.Vector2(...v));mesh(wok,new T.LatheGeometry(profile,32),M.iron);link(wok,[.4,.2,0],[.84,.28,0],.055,M.darkwood);cyl(wok,.34,.025,0,.14,0,M.noodle);
  for(let i=0;i<22;i++){const a=rnd()*6.28,r=rnd()*.28;tube(wok,[[Math.sin(a)*r,.17,Math.cos(a)*r],[Math.sin(a+.7)*r,.19,Math.cos(a+.7)*r],[Math.sin(a+1.4)*r,.18,Math.cos(a+1.4)*r]],.012,M.noodle);}
  for(let i=0;i<10;i++){const o=box(wok,.075,.025,.035,(rnd()-.5)*.44,.19,(rnd()-.5)*.44,i%3?M.leaf:M.beef,.009);o.rotation.y=rnd()*6.28;}
  const steam=group(base,'animated cooking steam');const steamMat=new T.MeshBasicMaterial({color:'#ffedce',transparent:true,opacity:.15,depthWrite:false});for(let i=0;i<7;i++){sphere(steam,.12,(rnd()-.5)*.4,1.5+i*.13,(rnd()-.5)*.3,steamMat,[1,1.4,1]);}
  batch(wok);return {base,fire,wok,steam};
}

export function buildTerminal(world){
  const g=group(world,'AI order terminal',.1,1.47,.89);g.userData={action:'ai',title:'阿粉 AI · 需求与调度'};
  box(g,.64,.13,.39,0,.06,0,M.iron,.05);box(g,.59,.075,.35,0,.15,0,M.wood,.025);cyl(g,.035,.32,0,.32,0,M.brass);
  const screen=group(g,'hologram screen',0,.52,0);screen.rotation.x=-.12;box(screen,.68,.5,.035,0,0,0,M.cyan,.045);box(screen,.62,.44,.016,0,0,.025,M.screen,.035);label(screen,'AI',.35,.16,0,.06,.04,{color:'#8defd5'});label(screen,'智能点单',.47,.12,0,-.13,.041,{color:'#a2e5d4'});batch(g);return g;
}

export function buildPerson(parent,name='chef',color='#db7650'){
  const root=group(parent,name),shirt=colorMat(color),chef=name==='chef';
  const body=group(root,'body');box(body,.36,.53,.24,0,.72,0,chef?M.white:shirt,.12);box(body,.31,.4,.03,0,.68,.14,chef?M.red:shirt,.025);
  for(const x of [-.11,.11]){link(body,[x,.51,0],[x,.23,.02],.075,M.pants);box(body,.16,.1,.28,x,.14,.06,M.iron,.04);}
  for(const side of [-1,1]){link(body,[side*.2,.9,0],[side*.29,.64,.1],.065,chef?M.white:shirt);sphere(body,.065,side*.29,.62,.11,M.skin);}
  const head=group(root,'face',0,1.18,0);sphere(head,.24,0,0,0,M.skin,[.9,1.05,.86]);sphere(head,.245,0,.075,-.035,M.hair,[.93,.82,.86]);sphere(head,.085,-.15,.12,.1,M.hair,[1,1.5,.7]);for(const x of [-.075,.075])sphere(head,.018,x,-.016,.197,M.hair,[.7,1.3,.5]);sphere(head,.025,0,-.065,.211,M.skin,[.7,.7,1]);tube(head,[[-.035,-.105,.19],[0,-.119,.204],[.035,-.105,.19]],.007,M.hair);
  if(chef){cyl(head,.22,.12,0,.25,0,M.white);for(let i=0;i<5;i++)sphere(head,.13,Math.sin(i*1.25)*.13,.34,Math.cos(i*1.25)*.1,M.white,[1,1,1]);}else{box(body,.26,.31,.13,0,.78,-.2,M.darkwood,.045);for(const x of [-.11,.11])box(body,.035,.3,.035,x,.83,.13,M.darkwood,.01);if(name==='上班族')box(body,.08,.18,.18,.32,.45,.05,M.darkwood,.025);if(name==='学生'){const cap=cyl(head,.25,.06,0,.24,0,colorMat('#637c70'));box(head,.25,.035,.18,0,.23,.2,colorMat('#637c70'));}if(name==='美食客'){const glasses=group(head,'glasses');for(const x of [-.08,.08]){const r=torus(glasses,.057,.009,x,-.015,.21,M.iron,[0,0,0]);}link(glasses,[-.02,-.01,.21],[.02,-.01,.21],.007,M.iron);}}
  batch(body);batch(head);return {root,body,head};
}

export function buildDrone(world){
  const root=group(world,'Parcel quadcopter',3.24,1.8,1.85);root.userData={action:'drone',title:'无人机 · 送餐与空中补货'};
  const body=group(root,'airframe');box(body,.68,.22,.47,0,0,0,M.robotTrim,.1);box(body,.31,.07,.28,0,.13,0,M.robot,.06);label(body,'AIR',.28,.12,0,0,.244,{color:'#376b5a'});
  const rotors=[];
  for(const x of [-1,1])for(const z of [-1,1]){link(body,[x*.2,0,z*.14],[x*.63,0,z*.47],.055,M.iron);cyl(body,.08,.16,x*.63,.07,z*.47,M.brass);torus(body,.28,.022,x*.63,.15,z*.47,M.robotTrim);const rotor=group(root,'propeller',x*.63,.17,z*.47);box(rotor,.5,.014,.048,0,0,0,M.iron,.02);box(rotor,.048,.014,.5,0,0,0,M.iron,.02);rotors.push(rotor);}
  for(const x of [-.24,.24])tube(body,[[x,-.07,-.2],[x,-.3,-.25],[x,-.3,.25],[x,-.07,.2]],.025,M.metal);
  link(body,[0,-.1,0],[0,-.42,0],.018,M.iron);const parcel=box(body,.35,.28,.31,0,-.45,0,M.lightwood,.025);box(body,.055,.285,.318,0,-.45,0,M.canvas,.003);label(body,'好好',.22,.12,0,-.45,.165,{color:'#94633d'});batch(body);return {root,rotors};
}

export function buildHelipad(world){
  const g=group(world,'Low altitude logistics station');g.userData={action:'drone',title:'低空物流 · 电量与航线'};
  cyl(g,1.18,.11,3.24,.3,1.86,M.iron,1.18,64);cyl(g,1.1,.025,3.24,.37,1.86,M.stoneDark,1.1,64);torus(g,.94,.022,3.24,.39,1.86,M.cream);
  box(g,.13,.018,.8,2.99,.4,1.86,M.cream,.008);box(g,.13,.018,.8,3.49,.4,1.86,M.cream,.008);box(g,.52,.018,.13,3.24,.4,1.86,M.cream,.008);
  for(let i=0;i<10;i++){const a=i/10*6.28;const b=box(g,.16,.035,.065,3.24+Math.sin(a)*1.1,.4,1.86+Math.cos(a)*1.1,M.amber,.015);b.rotation.y=a;}
  box(g,.49,1.05,.49,3.8,.82,.13,M.metal,.07);box(g,.24,.52,.03,3.8,.89,.395,M.screen,.025);label(g,'ϟ',.22,.42,3.8,.9,.415,{color:'#8beac7'});box(g,.035,.45,.035,4.058,.92,.2,M.amber);box(g,.62,.1,.62,3.8,.31,.13,M.cream,.06);
  tube(g,[[3.53,.99,.13],[3.29,.7,.17],[3.5,.42,.37],[3.65,.65,.41]],.025,M.rubber);
  const cabinet=group(g,'parcel lockers',4.03,.63,-.92);box(cabinet,.7,.85,.54,0,0,0,M.robotTrim,.06);for(let i=0;i<2;i++)for(let j=0;j<2;j++){box(cabinet,.3,.35,.018,-.17+i*.34,-.2+j*.4,.283,M.metal,.02);box(cabinet,.03,.06,.02,-.08+i*.34,-.2+j*.4,.3,M.iron,.005);}
  batch(g);return g;
}

export function buildGarden(world){
  const g=group(world,'Garden and street furniture');
  for(const [x,z,w,d]of [[-3.9,2.9,1.05,.48],[3.6,4.5,.48,1.2],[2.1,3.5,.95,.4],[4,-2.8,.5,1.5],[-4,-1.8,.4,1.2]])planter(g,x,z,w,d);
  const lamp=group(g,'courtyard lantern',-4.1,.23,1.0);cyl(lamp,.13,.13,0,.07,0,M.iron);cyl(lamp,.046,2.6,0,1.35,0,M.iron);tube(lamp,[[0,2.6,0],[0,2.9,0],[.42,2.95,0],[.55,2.75,0]],.045,M.iron);box(lamp,.35,.43,.31,.55,2.48,0,M.amber,.025);for(const x of [.39,.71])for(const z of [-.14,.14])link(lamp,[x,2.25,z],[x,2.69,z],.018,M.iron);box(lamp,.4,.08,.36,.55,2.23,0,M.iron,.025);mesh(lamp,new T.ConeGeometry(.3,.17,4),M.iron,.55,2.78,0).rotation.y=Math.PI/4;
  const bike=group(g,'bicycle',-3.95,.7,-.1);bike.rotation.y=.3;for(const x of [-.43,.43]){torus(bike,.31,.022,x,0,0,M.rubber,[0,0,0]);torus(bike,.29,.009,x,0,0,M.metal,[0,0,0]);for(let i=0;i<8;i++){const a=i/8*6.28;link(bike,[x,0,0],[x+Math.sin(a)*.29,Math.cos(a)*.29,0],.004,M.metal);}}const bm=colorMat('#536d6e');link(bike,[-.43,0,0],[-.18,.42,0],.019,bm);link(bike,[-.18,.42,0],[.05,0,0],.019,bm);link(bike,[.05,0,0],[-.43,0,0],.019,bm);link(bike,[.05,0,0],[.34,.43,0],.019,bm);link(bike,[.34,.43,0],[-.18,.42,0],.019,bm);link(bike,[.43,0,0],[.3,.6,0],.02,M.metal);box(bike,.23,.04,.12,-.18,.48,0,M.iron,.025);link(bike,[.3,.6,0],[.3,.6,.2],.02,M.iron);
  const cat=group(g,'sleeping ginger cat',1.05,.36,3.04);sphere(cat,.24,0,.08,0,M.orange,[1.5,.65,.9]);sphere(cat,.15,.29,.1,.02,M.orange,[1,1,.9]);for(const x of [.19,.37]){const ear=mesh(cat,new T.ConeGeometry(.065,.15,3),M.orange,x,.27,.015);ear.rotation.y=.4;}tube(cat,[[-.3,.1,0],[-.38,.12,.15],[-.2,.13,.2]],.065,M.orange);for(const x of [.24,.35])link(cat,[x,.105,.15],[x+.03,.1,.155],.008,M.hair);sphere(cat,.07,.29,.04,.13,M.cream,[1.3,.6,.5]);for(let i=0;i<4;i++){const stripe=torus(cat,.16,.018,-.18+i*.08,.13,.01,colorMat('#b57b3e'),[0,Math.PI/2,0]);stripe.scale.y=.6;}
  batch(g);return g;
}

export function buildTree(world,x,z,scale=1){
  const g=group(world,'Garden tree',x,.22,z);g.scale.setScalar(scale);
  const trunk=group(g,'tree trunk');link(trunk,[0,0,0],[.06,2.4,.05],.13,M.darkwood);for(let i=0;i<6;i++){const a=i*2.4;link(trunk,[.03,1.35+i*.12,0],[Math.sin(a)*.6,2.35+(i%2)*.35,Math.cos(a)*.58],.045,M.darkwood);}batch(trunk);
  const leafGeo=new T.SphereGeometry(1,5,4),leafMat=new T.MeshStandardMaterial({color:'#94a65a',roughness:.9,vertexColors:false});const leaves=new T.InstancedMesh(leafGeo,leafMat,780),dummy=new T.Object3D(),col=new T.Color();leaves.castShadow=true;leaves.receiveShadow=true;
  for(let i=0;i<780;i++){const a=rnd()*6.28,v=rnd()*2-1,r=Math.cbrt(rnd());dummy.position.set(Math.cos(a)*Math.sqrt(1-v*v)*r*.96,2.46+v*r*.83,Math.sin(a)*Math.sqrt(1-v*v)*r*.83);dummy.rotation.set(rnd()*3,rnd()*6,rnd()*3);const s=.065+rnd()*.05;dummy.scale.set(s*1.5,s*.5,s);dummy.updateMatrix();leaves.setMatrixAt(i,dummy.matrix);col.setHSL(.19+rnd()*.055,.27+rnd()*.12,.3+rnd()*.18);leaves.setColorAt(i,col);}g.add(leaves);return g;
}

export function buildDecor(world){
  const bench=group(world,'Purchased garden bench',2.5,.23,4.1);bench.userData={action:'growth',title:'花园座椅 · 顾客耐心 +5 秒'};
  for(let i=0;i<4;i++)box(bench,1.55,.055,.11,0,.53,-.22+i*.14,M.wood,.015);for(let i=0;i<3;i++)box(bench,1.55,.11,.06,0,.8+i*.13,-.31,M.wood,.015);for(const x of [-.63,.63]){for(const z of [-.25,.25])link(bench,[x,.5,z],[x,.02,z],.032,M.iron);link(bench,[x,.48,-.3],[x,1.11,-.3],.033,M.iron);}batch(bench);
  const sign=group(world,'Purchased warm sign');for(let i=0;i<22;i++)for(const y of [3.36,3.85])sphere(sign,.027,-3.3+i*.242,y,-1.513,M.amber);batch(sign);
  const warmer=group(world,'Purchased takeaway warming cabinet',1.9,.4,1.43);warmer.userData={action:'growth',title:'保温外卖柜 · 超时宽限 +8 秒'};box(warmer,.7,.76,.52,0,.4,0,M.robot,.04);box(warmer,.61,.48,.035,0,.5,.28,M.glass,.02);box(warmer,.62,.045,.4,0,.28,0,M.metal);for(const x of [-.18,.16])box(warmer,.19,.13,.18,x,.38,.08,M.lightwood,.015);label(warmer,'保温取餐',.57,.12,0,.13,.27,{color:'#f9eccb'});batch(warmer);return {bench,sign,warmer};
}
