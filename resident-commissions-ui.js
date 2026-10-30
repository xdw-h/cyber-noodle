(function(){
  'use strict';
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const number=v=>Number.isFinite(Number(v))?Number(v):0;
  const money=v=>'¥'+number(v).toLocaleString('zh-CN',{maximumFractionDigits:2});
  const clock=t=>{const minutes=Math.round((7+number(t)/6)*60);return String(Math.floor(minutes/60)).padStart(2,'0')+':'+String(minutes%60).padStart(2,'0');};
  const statuses={accepted:'已接单 · 等待开门',active:'正在履约',completed:'已按时完成',failed:'未按时完成',cancelled:'已撤销'};
  const ingredients={noodles:'米粉',greens:'青菜',egg:'鸡蛋',beef:'牛肉'};
  function meal(app,type){return esc(app.E.MENU?.[type]?.name||type||'餐品');}
  function button(action,label,value,disabled){return `<button class="${action==='commission-accept'?'primary':'secondary'}-button" data-action="${action}" data-value="${esc(value)}"${disabled?' disabled':''}>${esc(label)}</button>`;}
  function metrics(items){return '<dl class="commission-metrics">'+items.map(([label,value])=>`<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join('')+'</dl>';}
  function progress(app,c,live){
    const rows=c.rows||[],paid=rows.filter(x=>x.status==='paid').length,issued=rows.filter(x=>x.id!==null&&x.id!==undefined).length;
    const state=app.state,active=live&&['accepted','active'].includes(c.status),remaining=Math.max(0,number(c.deadline)-number(state.elapsed)-number(state.closingElapsed));
    let timing='';
    if(active){
      timing=state.phase==='prep'?'开门后按营业时钟开始履约。':remaining>0?`距离截止还有 ${Math.ceil(remaining)} 营业秒${state.paused?'（已暂停）':''}。`:'已到截止时间，截止后付款不计入按时交付。';
    }
    return `<article class="commission-card commission-selected"><div class="commission-card-head"><h3>${esc(c.title)}</h3><span class="commission-status">${esc(statuses[c.status]||c.status)}</span></div><p>${esc(c.name||app.E.Residents?.PEOPLE?.[c.residentId]?.name||'居民')} · ${meal(app,c.type)} × ${esc(c.count)} · ${clock(c.start)}—${clock(c.deadline)}</p>${metrics([['已投入',issued+' / '+number(c.count)],['按时交付',number(c.onTimeCount)+' / '+number(c.count)],['全部实际交付',paid+' / '+number(c.count)],['实际餐费',money(c.revenue)],['锁定单价',money(c.unitPrice)],['额外奖励',c.rewardPaid?'已到账 '+money(c.reward):'未发放 '+money(c.reward)]])}${timing?`<p class="commission-note" role="status">${esc(timing)}</p>`:''}${c.reason?`<p class="commission-note">${esc(c.reason)}</p>`:''}${live&&state.phase==='prep'&&c.status==='accepted'?button('commission-cancel','撤销委托（当天不可另接）','',false):''}</article>`;
  }
  function content(app,focus){
    const summary=app.E.Commissions.summary(app.state);
    if(!summary.enabled)return '<p class="commission-empty">这份旧存档将在下一个营业日启用居民委托，今天不会补造任务或扣除好感。</p>';
    if(summary.selected)return progress(app,summary.selected,true);
    if(summary.used)return '<p class="commission-empty">今天的委托名额已使用。撤销后当天不能更换委托，明天再看看居民的新计划。</p>';
    const offers=summary.offers||[],matching=focus===null?offers:offers.filter(c=>String(c.residentId)===String(focus));
    const note=focus!==null&&!matching.length?'<p class="commission-note">这位居民今天没有可承接的委托。以下是今天的全部候选。</p>':'';
    if(!offers.length)return '<p class="commission-empty">今天还没有居民委托。居民至少实际消费 3 次、好感达到 60 后成为“熟悉”；同日已有晚餐预约的居民不会再发起委托。</p>'+button('resident-list','查看居民关系','',false);
    const rows=matching.length?matching:offers;
    return note+rows.map(c=>{const reason=c.reason||(app.state.phase!=='prep'?'仅能在营业前接单':'');return `<article class="commission-card"><div class="commission-card-head"><h3>${esc(c.title)}</h3><span>${esc(c.name)} · ${esc(app.E.Relationships.detail(app.state,c.residentId)?.label||'熟悉')}</span></div><p>${meal(app,c.type)} × ${esc(c.count)} · 下单 ${clock(c.start)} · 截止 ${clock(c.deadline)}</p>${metrics([['每份预算',money(c.budget)],['总预算',money(number(c.budget)*number(c.count))],['锁定单价',money(c.unitPrice)],['预计餐费',money(c.totalPrice??number(c.unitPrice)*number(c.count))],['额外奖励',money(c.reward)]])}<p>食材需求：${Object.entries(c.ingredients||{}).map(([key,value])=>esc(ingredients[key]||key)+' × '+esc(value)).join('、')||'暂无'}</p>${reason?`<p class="commission-note">${esc(reason)}</p>`:''}${button('commission-accept','接下这份委托',c.residentId,!c.eligible||app.state.phase!=='prep')}</article>`;}).join('')+'<p class="commission-note">每天最多一份，仅实际交付收取餐费。全部按时交付才发放额外奖励；食材通过现有制作流程消耗。</p>'+(focus!==null&&matching.length?button('resident-commissions','查看今天全部委托','',false):'');
  }
  function open(app,residentId){
    const focus=residentId===undefined||residentId===null||residentId===''?null:residentId;
    app.openModal('resident-commissions',app.modalHead('居民委托','营业前接单，按时送上一份热乎的心意。')+`<section class="commission-panel" data-resident="${esc(focus??'')}">${content(app,focus)}</section>`);
  }
  function refresh(app){
    if(app.modal!=='resident-commissions')return;
    const panel=document.querySelector('#modal-content .commission-panel');if(!panel)return;
    const html=content(app,panel.dataset.resident||null);if(panel.innerHTML!==html)panel.innerHTML=html;
  }
  function report(app,r){
    const saved=r?.commissions||(r?.version===1&&'selected' in r?r:null);
    if(!saved)return '';
    return '<section class="commission-report"><h3>居民委托日结</h3>'+(saved.selected?progress(app,saved.selected,false):'<p>今天未承接居民委托，不影响居民好感。</p>')+'</section>';
  }
  function bind(app){
    Object.assign(app.actions,{
      'resident-commissions'(b){open(app,b?.dataset?.value);},
      'commission-accept'(b){app.transaction(app.E.Commissions.accept(app.state,Number(b.dataset.value)));open(app);},
      'commission-cancel'(){app.transaction(app.E.Commissions.cancel(app.state));open(app);}
    });
  }
  window.NoodleCommissionUI={open,refresh,report,bind};
})();
