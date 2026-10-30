import {M,group,box,cyl,sphere,link,planter,label,batch} from './model-kit.js?v=055';
const Layout=globalThis.NoodleDiningLayout;
export function buildDiningTerrace(world){
  const root=group(world,'可扩建花园堂食区');root.userData={view:'dining',title:'花园餐区 · 接待与扩建'};
  const floors=Layout.LEVELS.map((v,level)=>{const g=group(root,'露台边界 '+level),left=-5.3,width=v.right-left,center=(left+v.right)/2;
    box(g,width,.24,4.5,center,.1,6.4,M.stoneLight,.06);box(g,width-.16,.035,4.34,center,.205,6.4,M.lightwood,.02);
    for(let x=left+.2;x<v.right-.1;x+=.45)box(g,.025,.012,4.28,x,.23,6.4,M.darkwood,.004);
    const ends=[-4.7,v.right-.35];for(const x of ends)cyl(g,.04,2.8,x,1.6,8.45,M.iron);
    for(let i=0;i<14;i++){const x=ends[0]+(ends[1]-ends[0])*i/13,y=2.9-Math.sin(i/13*Math.PI)*.35;sphere(g,.055,x,y,8.45,M.amber);if(i<13){const nx=ends[0]+(ends[1]-ends[0])*(i+1)/13,ny=2.9-Math.sin((i+1)/13*Math.PI)*.35;link(g,[x,y,8.45],[nx,ny,8.45],.009,M.iron);}}
    planter(g,-4.5,6.5,.5,2.2);planter(g,v.right-.2,6.5,.24,1.1);
    const title=label(g,`花园餐区 · ${v.tables} 桌 ${v.tables*2} 座`,3.4,.3,center,.26,8.25,{color:'#496d55',bg:'#f8e9c5'});title.rotation.x=-Math.PI/2;batch(g);g.visible=level===0;return g;
  });
  const tables=Layout.SEATS.filter((_,i)=>i%2===0).map((s,i)=>{const {tableX:x,z}=s,g=group(root,'堂食桌椅 '+(i+1));
    cyl(g,.48,.08,x,1.02,z,M.wood);cyl(g,.065,.73,x,.62,z,M.iron);cyl(g,.3,.04,x,.27,z,M.iron);box(g,.14,.12,.12,x,1.12,z,M.cream);
    for(let j=0;j<4;j++)link(g,[x-.04+j*.025,1.16,z],[x-.03+j*.025,1.41,z],.007,M.darkwood);
    for(const side of [-1,1]){const chair=group(g,'座椅',x+side*.83,0,z);box(chair,.45,.07,.45,0,.75,0,M.wood,.04);for(const dx of [-.17,.17])for(const dz of [-.17,.17])link(chair,[dx,.72,dz],[dx,.25,dz],.025,M.iron);box(chair,.055,.44,.47,side*.23,1.01,0,M.tileDark,.03);}
    batch(g);g.visible=i<4;return g;
  });return {root,floors,tables,level:0};
}
export function poseDiningTerrace(model,s){const level=Layout.level(s.dining);if(model.level===level)return;model.level=level;model.floors.forEach((g,i)=>g.visible=i===level);model.tables.forEach((g,i)=>g.visible=i<Layout.LEVELS[level].tables);}
