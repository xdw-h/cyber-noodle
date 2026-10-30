(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.NoodleBranch=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const SITES={
    park:{name:'科技园店',cost:600,fee:45,target:16,interval:5.5,icon:'▥',copy:'午间办公客流密集，适合稳定快速出餐。',mix:['beef','egg','plain']},
    community:{name:'社区店',cost:700,fee:35,target:13,interval:7,icon:'⌂',copy:'邻里客流均衡，日常经营更从容。',mix:['egg','plain','beef']},
    camp:{name:'营地店',cost:800,fee:30,target:10,interval:9,icon:'△',copy:'河畔自取小站，客流较疏、日固定费较低。',mix:['plain','beef','egg']}
  };
  let ingredients,menu;
  const configure=(i,m)=>{ingredients=i;menu=m;},own=k=>typeof k==='string'&&Object.hasOwn(SITES,k);
  const money=n=>Math.round(n*100)/100,result=(ok,message='')=>({ok,message}),clone=v=>JSON.parse(JSON.stringify(v));
  const ledger=()=>({revenue:0,cogs:0,waste:0,operating:0,purchases:0,equipment:0,served:0,lost:0,shortage:0});
  const costOf=basket=>Object.entries(basket).reduce((sum,[k,n])=>sum+ingredients[k].price*n,0);
  const profit=b=>money(b.stats.revenue-b.stats.cogs-b.stats.waste-b.stats.operating);
  function ensure(s){if(s.branch===undefined)s.branch=null;return s.branch;}
  function establish(s,place){
    if(s.phase!=='prep'||!s.future)return result(false,'请在科技小店营业前安排分店。');
    if(ensure(s))return result(false,'已拥有第二家店，本轮最多经营两家店。');
    if(!own(place))return result(false,'请选择科技园、社区或营地。');
    const site=SITES[place];if(s.cash<site.cost)return result(false,`开设${site.name}需要 ¥${site.cost}，还需预留两店备货与运营费。`);
    s.branch={place,enabled:true,day:s.day,openedDay:0,inventory:Object.fromEntries(Object.keys(ingredients).map(k=>[k,0])),stats:ledger(),orders:[],current:null,receipts:[],arrivalIn:2,sequence:0,seed:((s.seed^0x93be12)>>>0)||913,totalServed:0,lastReport:null};
    s.cash=money(s.cash-site.cost);s.branch.stats.equipment=site.cost;
    return result(true,`${site.name}已开设！先为分店备货，开门后机器人自动经营。`);
  }
  function purchase(s,basket){
    const b=ensure(s);if(!b||s.phase!=='prep')return result(false,'请在营业前为已开设的分店采购。');
    if(!basket||typeof basket!=='object'||Array.isArray(basket))return result(false,'采购数量无效。');
    const entries=Object.entries(basket);
    if(!entries.length||entries.some(([k,n])=>!Object.hasOwn(ingredients,k)||!Number.isInteger(n)||n<0||n>10000||b.inventory[k]+n>1e7))return result(false,'数量须为 0–10000 的整数，且不能超过库存上限。');
    const cost=costOf(basket);if(cost<=0)return result(false,'请至少选购一份食材。');if(s.cash<cost)return result(false,'共享现金不足，无法采购分店食材。');
    s.cash=money(s.cash-cost);b.stats.purchases=money(b.stats.purchases+cost);for(const[k,n]of entries)b.inventory[k]+=n;
    return result(true,`分店食材已入库，支出 ¥${cost}；主店库存不变。`);
  }
  function recommend(s){
    const b=ensure(s);if(!b)return {target:0,basket:{},cost:0};
    const target=SITES[b.place].target,desired={noodles:target,greens:target,egg:Math.ceil(target/3),beef:Math.ceil(target/3)};
    const basket=Object.fromEntries(Object.entries(desired).map(([k,n])=>[k,Math.max(0,n-b.inventory[k])]));
    return {target,basket,cost:costOf(basket)};
  }
  function setEnabled(s,enabled){const b=ensure(s);if(!b||s.phase!=='prep'||typeof enabled!=='boolean')return result(false,'分店营业安排只能在开门前修改。');b.enabled=enabled;return result(true,enabled?'分店将随主店一起营业。':'分店今日休息，不收分店日费；生鲜仍在收摊时清空。');}
  function fee(s){const b=ensure(s);return b&&b.enabled?SITES[b.place].fee:0;}
  function open(s){const b=ensure(s);if(!b||!b.enabled||b.openedDay===s.day)return;const charge=fee(s);s.cash=money(s.cash-charge);b.stats.operating=money(b.stats.operating+charge);b.openedDay=s.day;b.orders=[];b.current=null;b.arrivalIn=2;}
  function random(b){b.seed=(Math.imul(1664525,b.seed)+1013904223)>>>0;return b.seed/4294967296;}
  function step(s,dt){
    const b=ensure(s);if(!b||!b.enabled||b.openedDay!==s.day||s.paused||!['open','closing'].includes(s.phase))return;
    if(s.phase==='open'){
      for(const o of b.orders)o.age+=dt;
      const expired=b.orders.filter(o=>o.age>=20);b.stats.lost+=expired.length;b.orders=b.orders.filter(o=>o.age<20);
      b.arrivalIn-=dt;if(b.arrivalIn<=0){
        const site=SITES[b.place],type=site.mix[Math.floor(random(b)*3)];
        const markup=s.prices[type]/menu[type].base-1;
        if(random(b)<=Math.max(.45,1-markup*1.8)){
          if(b.orders.length<4)b.orders.push({id:++b.sequence,type,price:s.prices[type],age:0,shortageSeen:false});else b.stats.lost++;
        }else if(s.sourceLedger)b.stats.lost++;
        b.arrivalIn=site.interval*(.9+random(b)*.2);
      }
      if(!b.current){
        const at=b.orders.findIndex(o=>Object.entries(menu[o.type].recipe).every(([k,n])=>b.inventory[k]>=n));
        for(const o of b.orders)if(!o.shortageSeen&&!Object.entries(menu[o.type].recipe).every(([k,n])=>b.inventory[k]>=n)){o.shortageSeen=true;b.stats.shortage++;}
        if(at>=0){const order=b.orders.splice(at,1)[0];for(const[k,n]of Object.entries(menu[order.type].recipe))b.inventory[k]-=n;b.stats.cogs=money(b.stats.cogs+costOf(menu[order.type].recipe));b.current={...order,progress:0,duration:2};}
      }
    }
    if(b.current){
      b.current.progress=Math.min(b.current.duration,b.current.progress+dt);
      if(b.current.progress+.000001>=b.current.duration){const o=b.current;s.cash=money(s.cash+o.price);b.stats.revenue=money(b.stats.revenue+o.price);b.stats.served++;b.totalServed++;b.receipts.unshift({id:o.id,type:o.type,price:o.price});b.receipts=b.receipts.slice(0,6);b.current=null;}
    }
  }
  function close(s){const b=ensure(s);if(b){if(s.sourceLedger)b.stats.lost+=b.orders.length;b.orders=[];}}
  function hasWork(s){return !!ensure(s)?.current;}
  function settle(s){
    const b=ensure(s);if(!b||b.lastReport?.day===s.day)return;
    for(const[k,item]of Object.entries(ingredients))if(item.perishable){b.stats.waste=money(b.stats.waste+b.inventory[k]*item.price);b.inventory[k]=0;}
    b.orders=[];b.current=null;b.lastReport={day:s.day,place:b.place,enabled:b.enabled,...clone(b.stats),profit:profit(b)};
  }
  function nextDay(s){const b=ensure(s);if(!b)return;b.day=s.day;b.openedDay=0;b.stats=ledger();b.orders=[];b.current=null;b.receipts=[];b.arrivalIn=2;}
  function validReport(r,maxDay){
    const num=(n,a=0,max=1e10)=>typeof n==='number'&&Number.isFinite(n)&&n>=a&&n<=max;
    return !!r&&Number.isInteger(r.day)&&r.day>=1&&r.day<=maxDay&&own(r.place)&&typeof r.enabled==='boolean'&&Object.keys(ledger()).every(k=>num(r[k]))&&['served','lost','shortage'].every(k=>Number.isInteger(r[k]))&&num(r.profit,-1e10)&&Math.abs(r.profit-money(r.revenue-r.cogs-r.waste-r.operating))<.001;
  }
  function valid(s){
    const b=ensure(s);if(b===null)return true;
    const int=(n,a,max)=>Number.isInteger(n)&&n>=a&&n<=max,num=n=>typeof n==='number'&&Number.isFinite(n)&&n>=0&&n<=1e10;
    if(!b||Array.isArray(b)||!own(b.place)||typeof b.enabled!=='boolean'||b.day!==s.day||!int(b.day,1,1e6)||!int(b.openedDay,0,s.day)||!int(b.seed,0,4294967295)||!int(b.sequence,0,1e10)||!int(b.totalServed,0,1e10))return false;
    if(!b.inventory||Object.keys(ingredients).some(k=>!int(b.inventory[k],0,1e7))||!b.stats||Object.keys(ledger()).some(k=>!num(b.stats[k]))||['served','lost','shortage'].some(k=>!Number.isInteger(b.stats[k])))return false;
    if(b.current!==null||!Array.isArray(b.orders)||b.orders.length||!num(b.arrivalIn)||!Array.isArray(b.receipts)||b.receipts.length>6)return false;
    if(b.receipts.some(r=>!r||!int(r.id,1,b.sequence)||!Object.hasOwn(menu,r.type)||!num(r.price))||new Set(b.receipts.map(r=>r.id)).size!==b.receipts.length)return false;
    if(b.totalServed<b.stats.served||b.sequence<b.totalServed||b.receipts.length>b.stats.served)return false;
    if(b.lastReport!==null&&(!validReport(b.lastReport,s.day)||b.lastReport.place!==b.place))return false;
    if(s.phase==='prep'&&(b.openedDay!==0||['served','revenue','operating','cogs','waste','lost','shortage'].some(k=>b.stats[k]!==0)||b.receipts.length||b.lastReport?.day===s.day))return false;
    if(s.phase==='report'&&(!b.lastReport||b.lastReport.day!==s.day||b.lastReport.enabled!==b.enabled||b.lastReport.profit!==profit(b)||Object.keys(ledger()).some(k=>b.lastReport[k]!==b.stats[k])))return false;
    return true;
  }
  return {SITES,configure,ensure,establish,purchase,recommend,setEnabled,fee,open,step,close,hasWork,settle,nextDay,profit,validReport,valid};
});
