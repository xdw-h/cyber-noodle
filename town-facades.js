import * as T from 'three';
import {M,box,cyl,mesh,link,colorMat} from './model-kit.js?v=055';
const lowGeometry=new T.IcosahedronGeometry(1,0);
const low=(g,x,y,z,r,mat,scale=[1,1,1])=>{const m=mesh(g,lowGeometry,mat,x,y,z);m.scale.set(r*scale[0],r*scale[1],r*scale[2]);return m;};
const palettes={book:['#d8ddd0','#557b76'],flowers:['#d8ddd0','#91a276'],bakery:['#ecdbb9','#b77c56'],barber:['#d8ddd0','#557b76'],clinic:['#e0e5d8','#557b76'],library:['#ecdbb9','#557b76'],market:['#ecdbb9','#91a276'],workshop:['#ecdbb9','#b77c56']};
export function facadeStyle(name,kind,index){
  const key=kind==='home'?['cottage','townhouse','terrace'][index%3]:name.includes('书店')?'book':name.includes('鲜花')?'flowers':name.includes('面包')||name.includes('早餐')?'bakery':name.includes('理发')?'barber':name.includes('诊所')?'clinic':name.includes('图书馆')?'library':name.includes('超市')||name.includes('杂货')?'market':'workshop';
  const palette=palettes[key]||[['#e4d5b9','#aa795f'],['#d7dfd2','#758b7c'],['#ddd5c8','#8e9390']][index%3];return {key,roof:key==='terrace'?'terrace':kind==='home'?'gable':'flat',wall:colorMat(palette[0]),trim:colorMat(palette[1])};
}
export function buildTownRoof(g,w,d,h,index,style){
  if(style.roof==='gable'){for(const side of [-1,1]){const panel=box(g,w*.66,.18,d+.6,side*w*.22,h+.55,0,style.trim,.015);panel.rotation.z=-side*.48;}box(g,.14,.13,d+.68,0,h+.98,0,style.trim,.01);cyl(g,.13,.62,w*.24,h+.6,-d*.23,M.stoneDark,.13,8);return h+1.35;}
  box(g,w+.3,.16,d+.3,0,h+.12,0,style.trim,.012);box(g,w-.2,.07,d-.2,0,h+.25,0,M.stoneLight,0);
  if(style.roof==='terrace'){for(const side of [-1,1]){box(g,w+.1,.26,.11,0,h+.32,side*(d/2+.04),style.trim,.008);box(g,.11,.26,d+.1,side*(w/2+.04),h+.32,0,style.trim,.008);}box(g,w*.43,.06,d*.45,-w*.15,h+.32,-d*.15,M.lightwood,0);for(const x of [-.6,.6])cyl(g,.035,.9,x,h+.75,-.55,M.iron,.035,6);box(g,1.5,.08,.9,0,h+1.2,-.55,M.canvas,.01);return h+1.28;}return h+.4;
}
function books(g,x,y,z,width){for(let i=0;i<6;i++){const mat=[M.red,M.blue,M.tileDark,M.lightwood][i%4],height=.23+(i%3)*.05;box(g,.1,height,.12,x-width/2+.12+i*(width-.2)/6,y+height/2,z,mat,.003);}box(g,width,.045,.27,x,y-.02,z,M.wood,.003);}
function blooms(g,x,y,z){cyl(g,.12,.22,x,y+.1,z,M.red,.15,7);for(let i=0;i<3;i++){const dx=(i-1)*.085,top=y+.36+i%2*.08;link(g,[x+dx,y+.2,z],[x+dx,top,z],.012,M.leaf);for(let j=0;j<5;j++){const a=j*Math.PI*2/5;low(g,x+dx+Math.cos(a)*.044,top+Math.sin(a)*.044,z+.02,.039,i%2?M.cream:M.pink);}low(g,x+dx,top,z+.04,.025,M.noodle);}}
function shopIcon(g,key,x,y,z){
  box(g,.58,.7,.09,x,y,z,M.darkwood,.015);box(g,.5,.62,.025,x,y,z+.055,M.canvas,.008);
  if(key==='book'||key==='library'){for(const side of [-1,1]){const cover=box(g,.18,.31,.05,x+side*.095,y,z+.09,M.tileDark,.008);cover.rotation.z=side*.12;}box(g,.015,.3,.06,x,y,z+.1,M.lightwood,0);}
  else if(key==='flowers'){for(let j=0;j<5;j++){const a=j*Math.PI*2/5;low(g,x+Math.cos(a)*.11,y+Math.sin(a)*.11,z+.1,.075,M.pink,[1,1,.4]);}low(g,x,y,z+.13,.065,M.noodle,[1,1,.4]);}
  else if(key==='bakery'){const bread=low(g,x,y,z+.11,.18,M.lightwood,[.63,1.4,.35]);bread.rotation.z=-.4;for(let i=0;i<3;i++)box(g,.12,.015,.013,x-.035+i*.035,y-.09+i*.09,z+.17,M.cream,0);}
  else if(key==='clinic'){box(g,.11,.37,.04,x,y,z+.1,M.tileDark,.004);box(g,.36,.11,.04,x,y,z+.11,M.tileDark,.004);}
  else if(key==='barber'){cyl(g,.11,.43,x,y,z+.1,M.cream,.11,10);for(let i=0;i<3;i++){const stripe=box(g,.2,.035,.06,x,y-.12+i*.12,z+.2,i%2?M.blue:M.red,0);stripe.rotation.z=.25;}}
  else{for(let i=0;i<3;i++)box(g,.25,.055,.08,x,y-.12+i*.12,z+.1,i%2?M.tileDark:M.lightwood,.003);}
}
export function buildFacade(g,w,d,h,index,style,apartment){
  const front=d/2;
  box(g,w+.06,.2,d+.06,0,.12,0,style.trim,.008);for(const side of [-1,1])box(g,.1,h-.2,.11,side*(w/2-.12),h/2+.12,front+.035,style.trim,0);
  if(['cottage','townhouse','terrace'].includes(style.key)){
    box(g,1.25,.1,.5,0,1.28,front+.2,style.trim,.012);for(const side of [-1,1])box(g,.075,1.24,.16,side*.54,.65,front+.09,M.cream,.005);
    if(style.key==='townhouse'){for(const y of [1.35,2.4])if(y<h-.25){box(g,w+.1,.075,.15,0,y,front+.07,M.cream,.004);for(const side of [-1,1]){box(g,.45,.08,1.3,side*(w/2+.16),y,.1,style.trim,.008);for(const z of [-.45,.65])link(g,[side*(w/2+.38),y+.03,z],[side*(w/2+.38),y+.48,z],.018,M.iron);box(g,.03,.035,1.2,side*(w/2+.38),y+.48,.1,M.iron,0);}}}
    else if(style.key==='terrace'){for(const side of [-1,1])for(let y=1;y<h-.3;y+=1.05)box(g,.07,.18,d-.3,side*(w/2+.045),y-.4,0,M.cream,0);}
    if(!apartment)for(const side of [-1,1]){box(g,.38,.32,.18,side*(w*.28),.58,front+.14,style.trim,.008);for(let j=0;j<3;j++)low(g,side*w*.28+(j-1)*.1,.82,front+.16,.08,M.leafLight,[1,.65,.6]);}
    return [];
  }
  const windowWidth=w*.29,centers=[-w*.3,w*.3];
  for(const x of centers){box(g,windowWidth+.14,1.22,.08,x,.94,front+.08,M.lightwood,.005);box(g,windowWidth,1.08,.025,x,1,front+.135,M.screen,.002);box(g,windowWidth+.15,.1,.32,x,.39,front+.2,style.trim,.006);box(g,.04,1.1,.05,x,1,front+.19,M.cream,0);}
  for(let i=0;i<8;i++)box(g,w/8*.93,.025,1.92,-w/2+(i+.5)*w/8,2.32,front+.8,i%2?M.canvas:style.trim,0);
  box(g,w+.12,.27,.09,0,2.15,front+1.83,style.trim,.005);
  const z=front+.25;
  if(style.key==='book'||style.key==='library'){for(const x of centers){books(g,x,.62,z,windowWidth-.1);books(g,x,1.05,z,windowWidth-.1);}box(g,.68,.42,.045,w/2-.35,.31,front+.45,M.darkwood,.005);}
  else if(style.key==='flowers'){for(const x of centers)blooms(g,x,.48,z);}
  else if(style.key==='bakery'){for(const x of centers)for(let i=0;i<3;i++){low(g,x+(i-1)*.25,.68,z,.15,M.lightwood,[.8,.65,.55]);box(g,.13,.012,.015,x+(i-1)*.25,.76,z+.06,M.cream,0);}for(const x of centers)box(g,windowWidth-.1,.05,.28,x,.5,z,M.wood,.003);}
  else if(style.key==='barber'){for(const x of centers){box(g,.48,.54,.03,x,1.03,z,M.glass,.004);cyl(g,.11,.28,x,.55,z,M.metal,.11,8);box(g,.45,.08,.32,x,.73,z+.03,style.trim,.008);}}
  else if(style.key==='clinic'){for(const x of centers){box(g,.6,.12,.23,x,.58,z,M.cream,.003);box(g,.09,.33,.04,x,.96,z,M.tileDark,.003);box(g,.31,.09,.04,x,.96,z+.01,M.tileDark,.003);}}
  else{for(const x of centers)for(let i=0;i<3;i++)box(g,.18,.25+i%2*.1,.16,x+(i-1)*.23,.65,z,[M.tileDark,M.red,M.lightwood][i],.003);}
  shopIcon(g,style.key,-w/2-.33,1.8,front+.19);
  return centers.map(x=>({x,width:windowWidth,height:2.05}));
}
