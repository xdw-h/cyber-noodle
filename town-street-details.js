import * as T from 'three';
import {M,box,cyl,mesh,canvasTexture} from './model-kit.js?v=055';
let plaqueMaterial;
function plate(g,number,x,y,z){
  plaqueMaterial??=new T.MeshStandardMaterial({map:canvasTexture((c,n)=>{const w=n/4,h=n/8;for(let i=0;i<32;i++){const x=i%4*w,y=Math.floor(i/4)*h;c.fillStyle='#466b5e';c.fillRect(x,y,w,h);c.strokeStyle='#d4c9a5';c.lineWidth=1;c.strokeRect(x+2,y+2,w-4,h-4);c.fillStyle='#fff1cd';c.font='bold 19px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(String(i+1).padStart(2,'0'),x+w/2,y+h/2);}},256),roughness:.85});
  const i=Math.max(0,Math.min(31,number-1)),u=i%4/4,v=1-Math.floor(i/4)/8,geometry=new T.PlaneGeometry(.36,.18),uv=geometry.attributes.uv;for(let j=0;j<uv.count;j++)uv.setXY(j,u+uv.getX(j)/4,v-(1-uv.getY(j))/8);mesh(g,geometry,plaqueMaterial,x,y,z);
}
const leafGeometry=new T.IcosahedronGeometry(1,0);
function shrub(g,x,y,z,s=.25){const o=mesh(g,leafGeometry,M.leafLight,x,y,z);o.scale.set(s,s*.65,s*.85);return o;}
export function buildStreetDetails(g,buildings){
  let plates=0,yards=0,curbs=0;
  for(const b of buildings){const index=Number(b.id.split('-').at(-1)),apartment=/([123]) 号楼/.exec(b.name),number=apartment?Number(apartment[1]):index+1;plate(g,number,b.x+.65,.95,b.z+b.depth/2+.145);plates++;
    box(g,b.kind==='home'?1.2:b.width+.2,.06,1.1,b.x,-.16,b.z+b.depth/2+.55,M.stoneLight,.003);
    if(b.kind==='home'){const x=b.x+b.width/2+.45;box(g,.3,.19,1.7,x,-.21,b.z-.25,M.wood,.006);box(g,.24,.02,1.6,x,-.105,b.z-.25,M.soil,0);for(let i=0;i<4;i++)shrub(g,x,.03,b.z-.84+i*.39,.17);for(const dz of [-.85,.35])cyl(g,.022,.49,x+.19,.04,b.z+dz,M.iron,.022,6);box(g,.028,.035,1.22,x+.19,.22,b.z-.25,M.iron,0);yards++;}
  }
  const horizontal=[-31,-18,26,36],vertical=[-46,-25,25,46];
  for(const z of horizontal)for(const side of [-1,1])for(let x=-45;x<46;x+=2.2){if(vertical.some(v=>Math.abs(x-v)<3.4))continue;box(g,1.9,.065,.11,x,-.16,z+side*1.67,M.stoneLight,0);curbs++;}
  for(const x of vertical)for(const side of [-1,1])for(let z=-30;z<36;z+=2.2){if(horizontal.some(v=>Math.abs(z-v)<3.6))continue;box(g,.11,.065,1.9,x+side*1.67,-.16,z,M.stoneLight,0);curbs++;}
  // Low shrubs replace the front tree row so the existing park seats stay readable.
  for(const x of [-42.5,-37,-31.5,-27]){box(g,1.1,.15,.42,x,-.11,22.1,M.stoneDark,.008);for(let i=0;i<3;i++)shrub(g,x+(i-1)*.3,.18,22.1,.29);}
  return {plates,yards,curbs,plaqueAtlas:256,parkFront:'low-shrubs'};
}
export function pedestrianGround(x,z,buildings){
  for(const b of buildings)if(Math.abs(x-b.x)<(b.kind==='home'?.6:b.width/2+.1)&&z>=b.z+b.depth/2&&z<=b.z+b.depth/2+1.1)return -.13;
  if(x>-22&&x<22&&z>-14&&z<22)return .22;
  if(x>=-43.5&&x<=-26.5&&z>=13.5&&z<=22.5)return -.195;
  if(Math.abs(x)<=10&&z>=25.5&&z<=34.5)return -.12;
  if(Math.abs(x)>21&&Math.abs(x)<=47){if(Math.abs(z-10.2)<=1.55)return -.14;if(Math.abs(Math.abs(z-10.2)-1.85)<=.3)return -.07;}
  if((Math.abs(x+7)<=1.3&&z>=-31.5&&z<=-12.5)||((Math.abs(x+6)<=1.3||Math.abs(x-8)<=1.3)&&z>=19.9&&z<=29.9))return -.14;
  const horizontal=[-31,-18,26,36],vertical=[-46,-25,25,46];
  if((Math.abs(x)<=48&&horizontal.some(v=>Math.abs(Math.abs(z-v)-2.1)<=.425))||(z>=-33&&z<=37&&vertical.some(v=>Math.abs(Math.abs(x-v)-2.1)<=.425)))return -.16;
  if((Math.abs(x)<=48&&horizontal.some(v=>Math.abs(z-v)<=1.6))||(z>=-33&&z<=37&&vertical.some(v=>Math.abs(x-v)<=1.6)))return -.23;
  return -.345;
}
