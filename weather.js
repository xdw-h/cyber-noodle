(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.NoodleWeather=api;})(globalThis,function(){
  'use strict';
  const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
  function hour(s){return s?.phase==='report'?22:s?.phase==='prep'?7:7+Math.max(0,Math.min(90,s?.elapsed||0))/6;}
  function schedule(day){const n=(Math.max(1,Math.floor(day)||1)-1)%3;return n===0?{start:11.5,end:14.5}:n===1?{start:16,end:19}:{start:8.5,end:10.5};}
  function describe(s,view){const h=hour(s),plan=schedule(s?.day),mode=['clear','cloudy','rain'].includes(view?.mode)?view.mode:'auto',rain=mode==='rain'?1:mode!=='auto'?0:smooth((h-plan.start)/.4)*(1-smooth((h-(plan.end-.4))/.4)),cloud=mode==='rain'||mode==='cloudy'?1:mode==='clear'?0:smooth((h-(plan.start-1))/.8)*(1-smooth((h-plan.end)/1.2)),kind=rain>.03?'rain':cloud>.25?'cloudy':'clear';return {mode,hour:h,rain,cloud,kind,label:kind==='rain'?'小雨':kind==='cloudy'?'阴天':'晴天',plan};}
  function roofs(buildings){const rows=(buildings||[]).map(b=>({x:b.x,z:b.z,w:b.width/2+.2,d:b.depth/2+.2,y:b.height+.7}));for(const b of buildings||[])if(b.kind!=='home')rows.push({x:b.x,z:b.z+b.depth/2+.8,w:b.width/2+.1,d:1,y:2.25});rows.push({x:-.75,z:-2.35,w:3.45,d:1,y:4.1},{x:-13.7,z:-7.8,w:3.2,d:1.9,y:3.9},{x:11,z:-7.6,w:1.85,d:2,y:6.5},{x:14.1,z:-8.8,w:1.3,d:1.6,y:4.7},{x:12.7,z:2.2,w:2.85,d:1.85,y:5.1},{x:-15,z:8.5,w:1.1,d:1.15,y:2.2},{x:-11.5,z:7.8,w:1.1,d:1.15,y:2.2},{x:-24,z:3,w:1.2,d:.7,y:2},{x:24,z:3,w:1.2,d:.7,y:2});return rows;}
  function roofAt(x,z,rows){let y=-Infinity;for(const r of rows)if(Math.abs(x-r.x)<=r.w&&Math.abs(z-r.z)<=r.d)y=Math.max(y,r.y);return y;}
  function covered(x,z,rows){return roofAt(x,z,rows)>-Infinity;}
  function shelter(r){if(!r?.arrived||r.home||r.inside||r.greeting||r.companion||r.activity||!['waiting','completed','rejected'].includes(r.commerceStage))return null;const api=typeof module==='object'&&module.exports?require('./town-commerce.js'):globalThis.NoodleCommerce,v=api?.VENUES.find(v=>v.id===r.commerceVenue);if(!v)return null;return {x:v.x+(r.id%3-1)*.65,z:v.z-.35,facing:0};}
  return {hour,schedule,describe,roofs,roofAt,covered,shelter};
});
