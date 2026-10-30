import * as T from 'three';
import {M,box,cyl,sphere,link,colorMat,canvasTexture} from './model-kit.js?v=055';
const styles=['cap','bob','crop','pony','curl','parted'];
export function characterStyle(profile=0){const id=Math.abs(Math.floor(profile))%18,aged=id===7||id===10;return {id,aged,hair:aged?'silver':styles[id%6],hairMaterial:aged?colorMat('#98988a'):id%3===1?colorMat('#6d5341'):M.hair,width:aged?.41:[.37,.35,.39][id%3],outfit:aged?'cardigan':id<6?'jacket':id<12?'knit':'casual'};}
export function detailTorso(torso,style){
  cyl(torso,.075,.08,0,.5,0,M.skin,.075,8);box(torso,.17,.025,.12,0,.47,.07,M.canvas,.006);
  if(style.outfit==='jacket'||style.outfit==='cardigan'){for(const side of [-1,1]){const lapel=box(torso,.075,.22,.025,side*.066,.3,.145,M.canvas,.004);lapel.rotation.z=side*.2;}for(let i=0;i<3;i++)box(torso,.018,.018,.018,0,.11+i*.07,.15,M.brass,0);box(torso,.09,.065,.02,.105,.21,.148,M.darkwood,.003);}
  else if(style.outfit==='knit'){for(let i=0;i<3;i++)box(torso,style.width-.025,.018,.013,0,.18+i*.085,.145,M.canvas,0);}
  else{for(const side of [-1,1])box(torso,.028,.33,.022,side*.115,.27,.145,M.darkwood,.003);box(torso,.1,.07,.025,.08,.15,.15,M.canvas,.003);}
}
export function detailHair(head,style){
  const hair=style.hairMaterial;
  sphere(head,.23,0,.09,-.025,hair,[1,.72,.9]);
  if(style.hair==='bob'){for(const side of [-1,1])box(head,.085,.22,.28,side*.18,-.005,-.025,hair,.025);box(head,.3,.065,.1,0,.1,.135,hair,.015);}
  else if(style.hair==='pony'){sphere(head,.13,0,.02,-.24,hair,[.7,1.3,.8]);sphere(head,.045,0,.05,-.2,M.red,[1,1,.7]);}
  else if(style.hair==='curl'){for(let i=0;i<4;i++)sphere(head,.08,-.15+i*.1,.18,.025,hair,[1,.85,1]);}
  else if(style.hair==='parted'){for(const side of [-1,1]){const lock=box(head,.17,.075,.15,side*.085,.16,.08,hair,.02);lock.rotation.z=side*.2;}}
  else if(style.hair==='cap'){cyl(head,.235,.07,0,.2,0,M.tileDark,.19,10);box(head,.29,.025,.2,0,.18,.18,M.tileDark,.008);}
  if(style.aged||style.id%6===2){for(const side of [-1,1]){box(head,.125,.018,.025,side*.08,.025,.202,M.iron,.003);box(head,.125,.012,.025,side*.08,-.05,.202,M.iron,.002);for(const dx of [-.058,.058])box(head,.012,.08,.025,side*.08+dx,-.012,.202,M.iron,.002);}link(head,[-.02,.004,.21],[.02,.004,.21],.008,M.iron);}
  for(const side of [-1,1])sphere(head,.047,side*.207,-.02,-.005,M.skin,[.6,1,.7]);
}
export function buildContactShadows(scene){
  const texture=canvasTexture((c,n)=>{const g=c.createRadialGradient(n/2,n/2,1,n/2,n/2,n/2);g.addColorStop(0,'rgba(25,39,33,.24)');g.addColorStop(.5,'rgba(25,39,33,.12)');g.addColorStop(1,'rgba(25,39,33,0)');c.fillStyle=g;c.fillRect(0,0,n,n);},32),mesh=new T.InstancedMesh(new T.PlaneGeometry(.72,.44),new T.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1}),18),dummy=new T.Object3D();mesh.name='居民脚下共享柔影';mesh.frustumCulled=false;mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);scene.add(mesh);return {mesh,dummy};
}
export function poseContactShadows(shadows,models){const d=shadows.dummy;models.forEach((m,i)=>{const scale=m.root.visible?m.root.scale.x:0;d.position.set(m.root.position.x,.22+(m.groundOffset||0)+.006,m.root.position.z);d.rotation.set(-Math.PI/2,0,0);d.scale.set(scale,scale,scale);d.updateMatrix();shadows.mesh.setMatrixAt(i,d.matrix);});shadows.mesh.instanceMatrix.needsUpdate=true;}
