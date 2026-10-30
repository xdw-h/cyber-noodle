(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.NoodleGreetings=api;})(globalThis,function(){
  'use strict';
  const TEXTS=Object.freeze(['早呀，今天也顺顺利利！','早呀，出门逛一逛。','好巧，最近过得怎么样？','挺好的，回头再聊！']);
  const residents=()=>typeof module==='object'&&module.exports?require('./resident-life.js'):globalThis.NoodleResidents;
  const clone=v=>JSON.parse(JSON.stringify(v)),round=v=>Math.round(v*1e6)/1e6;
  const create=s=>({version:1,startDay:s.day,day:s.day,events:[]});
  const safe=p=>Math.abs(p.z-12.05)<.08&&(p.x< -29||p.x> -24&&p.x<24||p.x>29)||Math.abs(p.z-23.9)<.08&&(p.x< -29||p.x> -24&&p.x<24||p.x>29);
  function delay(s,id){return (s.greetings?.events||[]).reduce((n,e)=>n+(e.a===id||e.b===id?Math.max(0,Math.min(e.end??s.elapsed,e.start+e.duration,s.elapsed)-e.start):0),0);}
  function active(s,id){return s.greetings?.events.find(e=>e.status==='active'&&(e.a===id||e.b===id));}
  function person(s,id){const events=s.greetings?.events||[],enrich=e=>({...clone(e),partnerId:e.a===id?e.b:e.a,text:e.a===id?e.textA:e.textB,remaining:Math.max(0,round(e.start+e.duration-(s.elapsed||0)))});return {enabled:!!s.greetings,active:active(s,id)?enrich(active(s,id)):null,today:events.filter(e=>e.a===id||e.b===id).map(enrich)};}
  function eligible(s,p){if(p.home||p.inside||p.atShop||p.commerceVenue||!['office','park','square','market'].includes(p.destination)||!safe(p))return false;
    if(s.greetings.events.some(e=>e.a===p.id||e.b===p.id)||s.orders?.some(o=>o.residentId===p.id)||s.current?.residentId===p.id||s.residentLife?.attempted.includes(p.id)&&!s.residentLife?.served.includes(p.id))return false;
    if(s.town?.reservation?.day===s.day&&s.town.reservation.profiles?.some(r=>r.residentId===p.id)||s.commissions?.selected?.residentId===p.id)return false;
    const outing=s.commerce?.visits.find(r=>r.id===p.id);return !outing?.venueId||outing.status==='completed'||outing.status==='missed'||outing.status==='rejected'||outing.start*6-42>s.elapsed+8;
  }
  function step(s,dt){const g=s.greetings;if(!g||s.phase!=='open'||s.paused||!Number.isFinite(dt)||dt<=0)return;const prior=g.events.find(e=>e.status==='active');if(prior){if(s.elapsed+1e-7>=prior.start+prior.duration){prior.status='completed';prior.end=round(prior.start+prior.duration);}return;}if(s.elapsed<5||s.elapsed>70||g.events.length>=9)return;
    const rows=residents().snapshot(s).filter(p=>eligible(s,p));for(let i=0;i<rows.length;i++)for(let j=i+1;j<rows.length;j++){const a=rows[i],b=rows[j],distance=Math.hypot(a.x-b.x,a.z-b.z);if(a.buildingId!==b.buildingId||distance<.65||distance>2.5||Math.abs(a.z-b.z)>.1)continue;const variant=(a.id+b.id+s.day)%2*2;g.events.push({id:g.events.length+1,a:a.id,b:b.id,start:round(s.elapsed),duration:2+(a.id+b.id+s.day)%3,end:null,status:'active',positionA:{x:a.x,z:a.z},positionB:{x:b.x,z:b.z},textA:TEXTS[variant],textB:TEXTS[variant+1]});return;}
  }
  function finish(s){for(const e of s.greetings?.events||[])if(e.status==='active'){e.end=round(Math.min(s.elapsed,e.start+e.duration));e.status=e.end+1e-7>=e.start+e.duration?'completed':'cancelled';}}
  function nextDay(s){if(!s.greetings)s.greetings=create(s);else if(s.greetings.day!==s.day)s.greetings={...create(s),startDay:s.greetings.startDay};}
  function report(s){return s.greetings?{version:1,day:s.day,events:clone(s.greetings.events)}:undefined;}
  function validEvents(events,final){if(!Array.isArray(events)||events.length>9)return false;const used=new Set();let lastEnd=0;return events.every((e,i)=>{if(!e||e.id!==i+1||!Number.isInteger(e.a)||!Number.isInteger(e.b)||e.a<0||e.b<=e.a||e.b>17||Math.floor(e.a/6)!==Math.floor(e.b/6)||used.has(e.a)||used.has(e.b)||!Number.isFinite(e.start)||e.start<5||e.start>70||e.start<lastEnd||![2,3,4].includes(e.duration)||!['active','completed','cancelled'].includes(e.status)||final&&e.status==='active')return false;
      if(!e.positionA||!e.positionB||![e.positionA,e.positionB].every(p=>Number.isFinite(p.x)&&Math.abs(p.x)<=50&&Number.isFinite(p.z)&&safe(p))||Math.abs(e.positionA.z-e.positionB.z)>.1)return false;const d=Math.hypot(e.positionA.x-e.positionB.x,e.positionA.z-e.positionB.z);if(d<.65||d>2.5)return false;
      if(e.status==='active'?e.end!==null:e.status==='completed'?e.end!==round(e.start+e.duration):!Number.isFinite(e.end)||e.end<e.start||e.end>=e.start+e.duration)return false;
      if(!TEXTS.includes(e.textA)||!TEXTS.includes(e.textB))return false;used.add(e.a);used.add(e.b);lastEnd=e.end??e.start+e.duration;return true;});}
  function validReport(r,day){return r===undefined||!!r&&r.version===1&&r.day===day&&validEvents(r.events,true)&&r.events.every(e=>e.duration===2+(e.a+e.b+day)%3&&e.textA===TEXTS[(e.a+e.b+day)%2*2]&&e.textB===TEXTS[(e.a+e.b+day)%2*2+1]);}
  function valid(s){const g=s.greetings;if(g===undefined)return true;if(!g||g.version!==1||!Number.isInteger(g.startDay)||g.startDay<1||g.startDay>s.day||g.day!==s.day||!validEvents(g.events,s.phase==='report')||s.phase==='prep'&&g.events.length)return false;
    if(g.events.some(e=>e.duration!==2+(e.a+e.b+s.day)%3||e.textA!==TEXTS[(e.a+e.b+s.day)%2*2]||e.textB!==TEXTS[(e.a+e.b+s.day)%2*2+1]))return false;
    if(g.events.filter(e=>e.status==='active').length>1||g.events.some((e,i)=>e.status==='active'&&i!==g.events.length-1||s.phase!=='report'&&(e.start>(s.elapsed||0)+1e-6||e.end!==null&&e.end>(s.elapsed||0)+1e-6)))return false;
    for(let i=0;i<g.events.length;i++){const e=g.events[i],at={...s,phase:'open',elapsed:e.start,greetings:{...g,events:g.events.slice(0,i)}};for(const [id,position]of [[e.a,e.positionA],[e.b,e.positionB]]){const actual=residents().describe(at,id);if(!actual||actual.home||actual.inside||actual.atShop||actual.commerceVenue||!['office','park','square','market'].includes(actual.destination)||Math.hypot(actual.x-position.x,actual.z-position.z)>1e-4)return false;}}
    const retained=[...(s.history||[]),...(s.lastReport?[s.lastReport]:[])].filter(r=>r.day>=g.startDay);if(retained.some(r=>!r.greetings||!validReport(r.greetings,r.day)))return false;
    return s.phase!=='report'||retained.filter(r=>r.day===s.day).length>0&&retained.filter(r=>r.day===s.day).every(r=>JSON.stringify(r.greetings)===JSON.stringify(report(s)));
  }
  return {TEXTS,create,nextDay,step,finish,report,valid,validReport,person,delay,active,safe};
});
