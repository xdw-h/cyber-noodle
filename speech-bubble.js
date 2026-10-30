import * as T from 'three';

export function speechLabel(g,text,w=2.8,h=.78){const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=Math.round(1024*h/w);drawSpeechBubble(canvas.getContext('2d'),text);const tex=new T.CanvasTexture(canvas);tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=4;const material=new T.MeshBasicMaterial({map:tex,transparent:true,toneMapped:false,side:T.DoubleSide,depthTest:false,depthWrite:false});const o=new T.Mesh(new T.PlaneGeometry(w,h),material);g.add(o);o.renderOrder=51;return o;}

// Draw once at load time. Transparent padding keeps the rounded silhouette intact.
export function drawSpeechBubble(c,text){
  const w=c.canvas.width,h=c.canvas.height,pad=12,left=pad,top=pad,right=w-pad,bottom=h-42,r=48,mid=w*.5;
  c.clearRect(0,0,w,h);
  c.beginPath();c.moveTo(left+r,top);c.lineTo(right-r,top);c.quadraticCurveTo(right,top,right,top+r);
  c.lineTo(right,bottom-r);c.quadraticCurveTo(right,bottom,right-r,bottom);
  c.lineTo(mid+24,bottom);c.quadraticCurveTo(mid+17,bottom+15,mid-8,bottom+27);c.lineTo(mid-8,bottom);
  c.lineTo(left+r,bottom);c.quadraticCurveTo(left,bottom,left,bottom-r);c.lineTo(left,top+r);c.quadraticCurveTo(left,top,left+r,top);c.closePath();
  c.fillStyle='#fff9eb';c.shadowColor='rgba(44,65,49,.18)';c.shadowBlur=9;c.shadowOffsetY=5;c.fill();
  c.shadowColor='transparent';c.strokeStyle='#9aaa89';c.lineWidth=3;c.stroke();
  c.fillStyle='#304b3b';c.textAlign='center';c.textBaseline='middle';
  let size=64;c.font=`600 ${size}px "Microsoft YaHei",sans-serif`;
  const maxWidth=w-112,measured=c.measureText(text).width;
  if(measured>maxWidth){size*=maxWidth/measured;c.font=`600 ${size}px "Microsoft YaHei",sans-serif`;}
  c.fillText(text,mid,(top+bottom)*.5+2);
}
