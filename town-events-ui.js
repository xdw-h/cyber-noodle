(function(){
  'use strict';
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const num=v=>Number.isFinite(Number(v))?Math.max(0,Number(v)):0;
  const clock=t=>{const m=Math.round((7+num(t)/6)*60);return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');};
  const names={quiet:'平常日',rain:'雨天',overtime:'科技园加班',market:'周末集市'};
  const counts={quiet:0,rain:2,overtime:3,market:4};
  const ingredients={noodles:'米粉',greens:'青菜',egg:'鸡蛋',beef:'牛肉'};
  const money=v=>'¥'+num(v).toLocaleString('zh-CN',{maximumFractionDigits:2});
  function metrics(r){return '<dl class="town-event-metrics">'+[['额外需求',num(r.requested)],['已接入',num(r.issued)],['已付款',num(r.served)],['实际餐费',money(r.revenue)],['未接入',num(r.missed)],['接入后未完成',num(r.lost)]].map(([k,v])=>`<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')+'</dl>';}
  function timing(day){return day.kind==='quiet'?'全天正常营业':day.time||`${clock(day.start)}—${clock(day.end)}`;}
  function forecast(day){return `<article class="town-event-future"><strong>第 ${esc(day.day)} 天 · ${esc(day.title||names[day.kind]||'小镇事件')}</strong><span>${esc(timing(day))} · 额外需求 ${esc(day.requested??counts[day.kind]??0)} 份</span></article>`;}
  function prep(app,summary){
    const day=summary.today,types={};
    for(const slot of day.slots||[])if(slot.type)types[slot.type]=(types[slot.type]||0)+1;
    const mealText=Object.entries(types).map(([type,count])=>`${app.E.MENU?.[type]?.short||type} × ${count}`).join('、');
    const ingredientText=Object.entries(summary.ingredients||{}).filter(([,n])=>num(n)>0).map(([key,n])=>`${ingredients[key]||key} × ${num(n)}`).join('、');
    return `<section class="town-event-prep"><h3>备货与运力</h3>${mealText?`<p>额外餐型：${esc(mealText)}。</p>`:''}${ingredientText?`<p>全部事件需求的配方用量：${esc(ingredientText)}。与普通订单、居民预约及委托合并备货；这不是需要再买的数量，请先核对库存。</p>`:''}<p>${esc(day.advice||'按正常客流备货，留意库存与队列。')}</p>${day.kind==='rain'?'<p class="town-event-warning">沿用雷雨停飞：送餐需地面备用，每次运费 ¥8；两份都使用地面配送时共 ¥16。无人机紧急补货也不可用，请开门前准备食材。</p><p>普通街区到店间隔变为原来的 1.3 倍；这是节奏规则，不推算少来了多少顾客。</p>':''}${day.kind==='market'?'<p>周末集市无需筹备费，与玩家付费筹备的公园活动分别记账。</p>':''}<p class="town-event-note">事件打包客为匿名顾客；居民关系仍由具名居民的实际消费改变。</p></section>`;
  }
  function content(app){
    const summary=app.E.Events.summary(app.state),day=summary.today;
    const today=!summary.enabled?'<p class="town-event-empty">这份旧存档的小镇事件次日启用。今天不补造额外需求，也不补记事件收入。</p>':`<article class="town-event-today"><div class="town-event-heading"><h3>第 ${esc(day.day)} 天 · ${esc(day.title||names[day.kind])}</h3><span>${esc(timing(day))}</span></div><p>${esc(day.description||'')}</p>${day.kind==='quiet'?'<p class="town-event-empty">今天没有小镇事件额外需求，按正常节奏经营即可。</p>':`<p>计划额外需求 ${esc(day.requested??counts[day.kind]??0)} 份。队列满时仅在下单窗口内等待，截止后不再补入。</p>${metrics(summary.progress)}${prep(app,summary)}`}</article>`;
    return today+'<section class="town-event-upcoming"><h3>未来两天预告</h3>'+ (summary.upcoming||[]).map(forecast).join('')+'</section><p class="town-event-note">营业中仍在等待或履约的需求不计入失败，未接入与未完成以已结束的结果为准。仅实际付款记录餐费，制作耗材、运费与折扣沿用原规则。上述结果不代表相较平常日的净增收入或净利润。</p>';
  }
  function open(app){app.openModal('town-events',app.modalHead('小镇事件','先看天气与街区安排，再准备今天的热粉。')+`<section class="town-event-panel">${content(app)}</section>`);}
  function refresh(app){if(app.modal!=='town-events')return;const panel=document.querySelector('#modal-content .town-event-panel');if(!panel)return;const html=content(app);if(panel.innerHTML!==html)panel.innerHTML=html;}
  function report(app,r){
    const saved=r?.townEvents||(r?.version===1&&'kind' in r&&'requested' in r?r:null);
    if(!saved)return '';
    return `<section class="town-event-report"><h3>小镇事件 · ${esc(names[saved.kind]||saved.kind)}</h3>${saved.kind==='quiet'?'<p class="town-event-empty">今天为平常日，没有事件额外需求。</p>':metrics(saved)}<p class="town-event-note">来自带事件标签订单的真实付款。未接入指窗口内未进入队列；接入后未完成指已进入队列但未付款。餐费不等于净增收入或净利润，事件顾客不会自动变成熟客。</p></section>`;
  }
  function bind(app){app.actions['town-events']=()=>open(app);}
  window.NoodleEventUI={bind,open,refresh,report};
})();
