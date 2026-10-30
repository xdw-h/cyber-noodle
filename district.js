(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.NoodleDistrict=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const CONTRACTS={
    park:{name:'科技园',title:'午间办公餐',client:'创客中心 · 前台小林',need:3,cash:60,points:2,color:'#7d9eaa',description:'同事们的午餐想吃点热乎的。今天向科技园送达 3 份委托餐，前台会逐份确认。',preference:'短航线 · 多份需求',icon:'▥'},
    community:{name:'创客社区',title:'邻里暖心餐',client:'社区驿站 · 邻居阿禾',need:2,cash:45,points:1,color:'#b5916c',description:'楼下驿站为晚归的邻居收餐。今天向社区送达 2 份委托餐，给邻里留一口锅气。',preference:'中航线 · 轻量目标',icon:'⌂'},
    camp:{name:'江畔营地',title:'河畔野餐时光',client:'营地主理人 · 小鹿',need:2,cash:65,points:2,color:'#81946a',description:'河边的小队等着开饭。今天向营地送达 2 份委托餐；距离更远，需要提前安排运力。',preference:'长航线 · 更高奖励',icon:'△'}
  };
  const own=k=>typeof k==='string'&&Object.hasOwn(CONTRACTS,k),result=(ok,message)=>({ok,message}),money=n=>Math.round(n*100)/100;
  function initial(day=1){return {day,selected:null,status:'none',deliveries:[],arrivals:[],completedTotal:0,rewardTotal:0};}
  function ensure(s){if(s.district===undefined)s.district=initial(s.day);return s.district;}
  function contractId(s){const d=ensure(s);return d.selected?`${d.day}:${d.selected}`:null;}
  function active(s){const d=ensure(s);return d.day===s.day&&d.status==='active'&&own(d.selected);}
  function accept(s,key){const d=ensure(s);if(!s.future||s.phase!=='prep')return result(false,'请在科技小店营业前选择今日委托，开店后锁定。');if(!own(key))return result(false,'请选择科技园、社区或营地。');if(d.selected===key)return result(false,'今日已接取这份委托。');d.selected=key;d.status='active';d.deliveries=[];delete d.group;if(s.businessVersion===1&&key==='park')d.group={rows:['plain','egg','beef'].map(type=>({type,price:s.prices[type],id:0})),missed:0};return result(true,d.group?'午餐团单已确认：11:00–13:00 下单，送达后按接单时菜单价收款。':`已接取「${CONTRACTS[key].title}」。开门后将优先收到该地区的远程需求。`);}
  function clear(s){if(s.phase!=='prep')return result(false,'今日委托已锁定，明天可重新选择。');const d=ensure(s);d.selected=null;d.status='none';d.deliveries=[];delete d.group;return result(true,'今日自由经营，不接街区委托。');}
  function arrivals(s){const d=ensure(s),g=d.group;if(!g||!active(s)||s.phase!=='open')return;if(s.elapsed>36){g.missed=g.rows.filter(r=>!r.id).length;return;}const i=g.rows.findIndex(r=>!r.id);if(i<0||s.elapsed<24+i*4||s.orders.length>=5||s.orders.filter(o=>o.channel==='delivery').length+s.readyDeliveries.length>=4)return;const r=g.rows[i];r.id=++s.sequence;s.orders.push({id:r.id,sourceId:r.sourceId,type:r.type,price:r.price,channel:'delivery',destination:'park',districtContract:contractId(s),status:'waiting',age:0,patience:32,deadline:45,createdAt:s.elapsed,customer:'科技园午餐团单',text:'午餐团单 · 第 '+(i+1)+' 份',tags:['午餐团单']});}
  function groupSummary(s){const d=ensure(s),rows=d.group?.rows||['plain','egg','beef'].map(type=>({type,price:s.prices[type],id:0}));return {rows,expected:money(rows.reduce((n,r)=>n+r.price,0)),ingredients:{noodles:3,greens:3,egg:1,beef:1},issued:rows.filter(r=>r.id).length,missed:d.group?.missed||0,delivered:d.deliveries.length};}
  function onDelivered(s,order,vehicle){
    const d=ensure(s);if(order.channel!=='delivery'||!own(order.destination)||!Number.isInteger(order.id)||order.id<1)return;
    if(d.arrivals.some(x=>x.id===order.id))return;
    const row={id:order.id,destination:order.destination,at:money(s.elapsed+(s.closingElapsed||0)),vehicle:vehicle==='ground'?'ground':'drone'};
    d.arrivals.unshift(row);d.arrivals=d.arrivals.slice(0,9);
    if(!active(s)||order.destination!==d.selected||order.districtContract!==contractId(s)||d.deliveries.some(x=>x.id===order.id)||d.group&&!d.group.rows.some(r=>r.id===order.id))return;
    d.deliveries.push({...row});s.stats.districtDelivered=(s.stats.districtDelivered||0)+1;
    if(d.deliveries.length>=CONTRACTS[d.selected].need){d.status='completed';d.completedTotal++;}
  }
  function settle(s){const d=ensure(s);if(d.group)d.group.missed=d.group.rows.filter(r=>!r.id).length;if(d.status==='active')d.status='expired';}
  function nextDay(s){const old=ensure(s);s.district={...initial(s.day),completedTotal:old.completedTotal,rewardTotal:old.rewardTotal};}
  function claim(s){const d=ensure(s);if(d.day!==s.day||d.status!=='completed'||!own(d.selected))return result(false,'委托尚未完成，或奖励已经领取。');const c=CONTRACTS[d.selected];d.status='claimed';d.rewardTotal+=c.cash;s.cash=money(s.cash+c.cash);s.growth.points+=c.points;s.stats.rewards=(s.stats.rewards||0)+c.cash;s.stats.districtRewards=(s.stats.districtRewards||0)+c.cash;
    if(s.phase==='report'&&s.lastReport){Object.assign(s.lastReport,{rewards:s.stats.rewards,districtRewards:s.stats.districtRewards,endCash:s.cash,cashFlow:money(s.cash-s.stats.startCash)});if(s.history.length)s.history[s.history.length-1]={...s.lastReport};}
    return result(true,`${c.name}委托完成：+¥${c.cash}，+${c.points} 研发点！`);
  }
  function valid(s){
    const d=ensure(s),int=(n,a,b)=>Number.isInteger(n)&&n>=a&&n<=b,rows=a=>Array.isArray(a)&&a.length<=9&&a.every(x=>x&&int(x.id,1,1e10)&&own(x.destination)&&typeof x.at==='number'&&Number.isFinite(x.at)&&x.at>=0&&x.at<=1e7&&['drone','ground'].includes(x.vehicle))&&new Set(a.map(x=>x.id)).size===a.length;
    if(!d||!int(d.day,1,1e6)||d.day!==s.day||!int(d.completedTotal,0,1e6)||!int(d.rewardTotal,0,1e9)||!rows(d.deliveries)||!rows(d.arrivals)||!['none','active','completed','claimed','expired'].includes(d.status))return false;
    if(d.group!==undefined){const g=d.group;if(s.businessVersion!==1||d.selected!=='park'||!g||!Array.isArray(g.rows)||g.rows.length!==3||!int(g.missed,0,3)||g.rows.some((r,i)=>!r||r.type!==['plain','egg','beef'][i]||!int(r.price,[10,12,16][i],[14,18,24][i])||!int(r.id,0,s.sequence))||new Set(g.rows.filter(r=>r.id).map(r=>r.id)).size!==g.rows.filter(r=>r.id).length||g.missed>g.rows.filter(r=>!r.id).length||d.deliveries.some(r=>!g.rows.some(x=>x.id===r.id)))return false;}
    if(d.status==='none')return d.selected===null&&d.deliveries.length===0;
    if(!own(d.selected)||d.deliveries.some(x=>x.destination!==d.selected)||d.deliveries.length>CONTRACTS[d.selected].need)return false;
    const done=d.deliveries.length===CONTRACTS[d.selected].need;
    return ['completed','claimed'].includes(d.status)?done&&d.completedTotal>0&&(d.status!=='claimed'||d.rewardTotal>=CONTRACTS[d.selected].cash):!done;
  }
  return {CONTRACTS,initial,ensure,contractId,active,accept,clear,arrivals,groupSummary,onDelivered,settle,nextDay,claim,valid};
});
