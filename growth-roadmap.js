(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.NoodleRoadmap=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const Growth=typeof module==='object'&&module.exports?require('./growth.js'):globalThis.NoodleGrowth;
  const STAGES=[
    {key:'starter',name:'站稳小店',copy:'累计实际履约 12 碗，并完成 1 个合计正利润的完整营业日。',reward:'2 研发点',points:2,action:'先按预测备货，完成一个完整营业日，减少缺货与报废。'},
    {key:'steady',name:'稳定盈利',copy:'累计完成 3 个合计正利润的完整营业日。',reward:'2 研发点 · 精研招牌配方',points:2,action:'先控制生鲜备货与运营费，再争取下一个完整盈利日。'},
    {key:'neighbors',name:'熟悉街坊',copy:'让 3 位居民达到熟悉或常客：至少消费 3 次，好感至少 60。',reward:'2 研发点 · 1 张装修券',points:2,action:'查看居民关系，优先满足常来街坊的预算与出餐时间。'},
    {key:'commission',name:'街坊托付',copy:'完成 1 份居民委托，所有餐点按时交付并收款。',reward:'3 研发点 · 街坊好店称号',points:3,action:'营业前查看居民委托，按预算和交付窗口备齐食材再接单。'},
    {key:'chain',name:'双店掌柜',copy:'主店和营业分店连续 2 个完整营业日都获得正利润。',reward:'3 研发点 · 1 张装修券 · 双店掌柜称号',points:3,action:'先分别查看双店日结，按区域偏好备货，争取两店连续盈利。'}
  ];
  const clone=v=>JSON.parse(JSON.stringify(v)),int=(n,a=0,b=1e9)=>Number.isInteger(n)&&n>=a&&n<=b;
  const total=s=>(s.totalServed||0)+(s.branch?.totalServed||0),familiar=s=>(s.relationships?.people||[]).filter(p=>p.visits>=3&&p.score>=60).length;
  const title=r=>r?.claimed.includes('chain')?'双店掌柜':r?.claimed.includes('commission')?'街坊好店':'';
  const result=(ok,message)=>({ok,message});
  function create(s){return {version:1,startDay:s.day,lastDay:s.day-1,lastFullDay:false,baselineServed:total(s),settledDays:0,fullDays:0,served:0,profitDays:0,commissions:0,dualStreak:0,bestDualStreak:0,claimed:[],earned:[],vouchers:0,usedVouchers:[]};}
  function nextDay(s){if(s.roadmap===undefined)s.roadmap=create(s);}
  function conditionRows(r,key,people){
    if(key==='starter')return [{label:'实际履约',value:r.served,target:12},{label:'完整盈利日',value:r.profitDays,target:1}];
    if(key==='steady')return [{label:'完整盈利日',value:r.profitDays,target:3}];
    if(key==='neighbors')return [{label:'熟悉或常客',value:people,target:3}];
    if(key==='commission')return [{label:'已完成居民委托',value:r.commissions,target:1}];
    return [{label:'最佳双店连续盈利',value:r.bestDualStreak,target:2}];
  }
  function stage(r,key,people){const i=STAGES.findIndex(t=>t.key===key);if(i<0)return null;const t=STAGES[i],conditions=conditionRows(r,key,people);return {...t,value:conditions[0].value,target:conditions[0].target,conditions,ready:conditions.every(c=>c.value>=c.target),claimed:r.claimed.includes(key),locked:i>r.claimed.length};}
  function progress(s,key){return s.roadmap?stage(s.roadmap,key,familiar(s)):null;}
  function view(s){
    const r=s.roadmap;if(!r)return {active:false,current:null,stages:[],tip:'成长路线将在下一营业日启用，历史经营不会重复结算。',completed:0,title:'',vouchers:0,refined:false,startDay:null};
    const stages=STAGES.map(t=>stage(r,t.key,familiar(s))),current=stages[r.claimed.length]||null;
    const tip=s.town?.terminal?'本局已结束，可在成长手册回看已完成阶段。':!current?'五阶段已完成，继续经营你的小镇。':current.ready?`${current.name}已达成，营业前或日结时领取：${current.reward}。`:`当前目标：${current.name}。${current.action} 奖励：${current.reward}。`;
    return {active:true,current,stages,tip,completed:r.claimed.length,title:title(r),vouchers:r.vouchers,refined:r.claimed.includes('steady'),startDay:r.startDay};
  }
  function report(s){if(!s.roadmap)return undefined;return {version:1,day:s.day,fullDay:s.roadmap.lastFullDay,state:clone(s.roadmap),familiar:familiar(s),stages:view(s).stages};}
  function syncReport(s){if(s.phase!=='report'||s.lastReport?.day!==s.day||s.roadmap?.lastDay!==s.day)return;s.lastReport.roadmap=report(s);const index=s.history?.findIndex(r=>r.day===s.day)??-1;if(index>=0)s.history[index]=clone(s.lastReport);}
  function settle(s){
    const r=s.roadmap,x=s.lastReport;if(!r||s.phase!=='report'||!x||x.day!==s.day||s.day<r.startDay||r.lastDay>=s.day)return;
    const full=s.elapsed>=89.999,profit=(x.totalProfit??x.profit)>0,dual=full&&x.profit>0&&x.branch?.enabled===true&&x.branch.profit>0;
    r.served=Math.min(1e9,r.served+(x.totalServed??x.served));r.settledDays++;if(full)r.fullDays++;if(full&&profit)r.profitDays++;
    if(x.commissions?.selected?.status==='completed'&&x.commissions.selected.rewardPaid===true)r.commissions++;
    r.dualStreak=dual&&r.lastDay===s.day-1?r.dualStreak+1:dual?1:0;r.bestDualStreak=Math.max(r.bestDualStreak,r.dualStreak);r.lastDay=s.day;r.lastFullDay=full;
    x.roadmap=report(s);
  }
  function claim(s,key){
    const r=s.roadmap;if(!r||!['prep','report'].includes(s.phase)||s.town?.terminal)return result(false,'请在营业前或日结时领取成长奖励。');
    const t=STAGES[r.claimed.length];if(!t||t.key!==key||!progress(s,key).ready)return result(false,'请先完成并领取当前阶段，奖励只能领取一次。');
    const g=Growth.ensure(s);if(!int(g.points,0,1e7-t.points))return result(false,'研发点已达上限，请先安排研发。');
    const evidence={key,day:s.day,served:r.served,profitDays:r.profitDays,familiar:familiar(s),commissions:r.commissions,bestDualStreak:r.bestDualStreak};r.claimed.push(key);r.earned.push(evidence);g.points+=t.points;
    if(['neighbors','chain'].includes(key))r.vouchers++;
    syncReport(s);return result(true,`${t.name}已完成：${t.reward}。`);
  }
  function decorate(s,key){
    const r=s.roadmap,g=Growth.ensure(s);if(!r||s.phase!=='prep'||s.town?.terminal||r.vouchers<1||!Object.hasOwn(Growth.DECOR,key)||g.decor[key])return result(false,'营业前用装修券兑换尚未拥有的装饰。');
    r.vouchers--;r.usedVouchers.push({key,day:s.day});g.decor[key]=true;return result(true,`已用 1 张装修券布置${Growth.DECOR[key].name}，无需现金。`);
  }
  function validSnapshot(r,day){
    if(!r||Array.isArray(r)||r.version!==1||!int(r.startDay,1,day)||!int(r.lastDay,r.startDay-1,day)||typeof r.lastFullDay!=='boolean'||!int(r.baselineServed,0,1.1e10)||!int(r.settledDays,0,1e6)||r.settledDays!==r.lastDay-r.startDay+1||r.settledDays===0&&r.lastFullDay)return false;
    if(!int(r.served)||!int(r.fullDays,0,r.settledDays)||!int(r.profitDays,0,r.fullDays)||!int(r.commissions,0,r.settledDays)||!int(r.dualStreak,0,r.fullDays)||!int(r.bestDualStreak,r.dualStreak,r.fullDays))return false;
    if(!Array.isArray(r.claimed)||r.claimed.length>STAGES.length||r.claimed.some((k,i)=>k!==STAGES[i].key)||!Array.isArray(r.earned)||r.earned.length!==r.claimed.length)return false;
    for(let i=0;i<r.earned.length;i++){
      const e=r.earned[i];if(!e||e.key!==r.claimed[i]||!int(e.day,r.startDay,day)||i>0&&e.day<r.earned[i-1].day||!int(e.served,0,r.served)||!int(e.profitDays,0,r.profitDays)||!int(e.familiar,0,18)||!int(e.commissions,0,r.commissions)||!int(e.bestDualStreak,0,r.bestDualStreak)||!conditionRows(e,e.key,e.familiar).every(c=>c.value>=c.target))return false;
      if(i>0&&['served','profitDays','commissions','bestDualStreak'].some(k=>e[k]<r.earned[i-1][k]))return false;
    }
    const issued=r.earned.filter(e=>['neighbors','chain'].includes(e.key)),earnedVouchers=issued.length;
    if(!Array.isArray(r.usedVouchers)||r.usedVouchers.length>earnedVouchers||new Set(r.usedVouchers.map(x=>x?.key)).size!==r.usedVouchers.length||r.usedVouchers.some((x,i)=>!x||!Object.hasOwn(Growth.DECOR,x.key)||!int(x.day,issued[i].day,day)||i>0&&x.day<r.usedVouchers[i-1].day)||!int(r.vouchers,0,2)||r.vouchers!==earnedVouchers-r.usedVouchers.length)return false;
    return true;
  }
  function validReport(x,day){
    if(x===undefined)return true;
    if(!x||x.version!==1||x.day!==day||!validSnapshot(x.state,day)||x.state.lastDay!==day||typeof x.fullDay!=='boolean'||x.fullDay!==x.state.lastFullDay||!int(x.familiar,0,18)||!Array.isArray(x.stages))return false;
    const expected=STAGES.map(t=>stage(x.state,t.key,x.familiar));return JSON.stringify(expected)===JSON.stringify(x.stages);
  }
  function validFacts(base,previous){
    const x=base.roadmap,r=x.state,full=x.fullDay,paid=base.commissions?.selected?.status==='completed'&&base.commissions.selected.rewardPaid===true,profit=full&&(base.totalProfit??base.profit)>0,dual=full&&base.profit>0&&base.branch?.enabled===true&&base.branch.profit>0,served=base.totalServed??base.served;
    if(!int(served,0,1e10))return false;
    const prior=base.day===r.startDay?{settledDays:0,fullDays:0,served:0,profitDays:0,commissions:0,dualStreak:0,bestDualStreak:0}:previous?.day===base.day-1?previous.state:null;
    if(prior){const streak=dual?prior.dualStreak+1:0;return r.settledDays===prior.settledDays+1&&r.fullDays===prior.fullDays+Number(full)&&r.served===Math.min(1e9,prior.served+served)&&r.profitDays===prior.profitDays+Number(profit)&&r.commissions===prior.commissions+Number(paid)&&r.dualStreak===streak&&r.bestDualStreak===Math.max(prior.bestDualStreak,streak);}
    // The oldest retained report may follow discarded history; its own day still constrains the totals.
    return r.served>=Math.min(1e9,served)&&r.fullDays>=Number(full)&&r.fullDays<=r.settledDays-Number(!full)&&r.profitDays>=Number(profit)&&r.profitDays<=r.fullDays-Number(full&&!profit)&&r.commissions>=Number(paid)&&r.commissions<=r.settledDays-Number(!paid)&&(dual?r.dualStreak>=1:r.dualStreak===0);
  }
  function valid(s){
    const r=s.roadmap;if(r===undefined)return true;
    if(!validSnapshot(r,s.day)||!int(s.day,1,1e6)||r.served!==Math.min(1e9,total(s)-r.baselineServed)||r.usedVouchers.some(x=>s.growth?.decor?.[x.key]!==true))return false;
    if(s.phase==='prep'&&r.lastDay!==s.day-1)return false;
    if(s.phase==='report'&&(r.lastDay!==s.day||!validReport(s.lastReport?.roadmap,s.day)||JSON.stringify(s.lastReport.roadmap)!==JSON.stringify(report(s))))return false;
    if(s.phase==='report'&&(s.history||[]).some(x=>x.day===s.day&&JSON.stringify(x.roadmap)!==JSON.stringify(s.lastReport.roadmap)))return false;
    const enclosing=[...(s.history||[])];if(s.lastReport&&!enclosing.some(x=>x.day===s.lastReport.day))enclosing.push(s.lastReport);
    if(enclosing.some(x=>x.day>=r.startDay&&x.roadmap===undefined))return false;
    const reports=[];for(const base of enclosing){if(base.roadmap===undefined)continue;if(!validReport(base.roadmap,base.day)||!validFacts(base,reports.at(-1)))return false;reports.push(base.roadmap);}
    const latest=reports.at(-1),counterKeys=['lastDay','lastFullDay','settledDays','fullDays','served','profitDays','commissions','dualStreak','bestDualStreak'];
    if(r.settledDays>0){if(!latest||latest.day!==r.lastDay||counterKeys.some(k=>r[k]!==latest.state[k]))return false;}
    else if(latest||r.lastDay!==r.startDay-1||r.lastFullDay||['fullDays','served','profitDays','commissions','dualStreak','bestDualStreak'].some(k=>r[k]!==0))return false;
    for(let i=0;i<reports.length;i++){const x=reports[i];if(!validReport(x,x.day)||x.state.startDay!==r.startDay||x.state.baselineServed!==r.baselineServed||['served','profitDays','commissions','bestDualStreak','fullDays','settledDays'].some(k=>x.state[k]>r[k])||x.state.claimed.some((key,j)=>r.claimed[j]!==key)||x.state.earned.some((e,j)=>JSON.stringify(e)!==JSON.stringify(r.earned[j])))return false;if(i>0){const p=reports[i-1];if(x.day<=p.day||['served','profitDays','commissions','bestDualStreak','fullDays','settledDays'].some(k=>x.state[k]<p.state[k])||p.state.claimed.some((key,j)=>x.state.claimed[j]!==key))return false;}}
    return true;
  }
  return {STAGES,create,nextDay,settle,progress,view,claim,decorate,valid,validReport,report};
});
