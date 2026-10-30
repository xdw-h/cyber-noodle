(function(){
  'use strict';
  const E=window.NoodleEngine,R=E.Roadmap,G=E.Growth;
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const button=(action,text,key,disabled=false)=>`<button class="growth-button" data-action="${action}" data-value="${esc(key)}" ${disabled?'disabled':''}>${esc(text)}</button>`;
  const canClaim=s=>['prep','report'].includes(s.phase)&&!s.town?.terminal;
  let cachedSignature='',cachedView,cachedState;
  function summary(s){
    const r=s.roadmap,key=[s.day,s.phase,r?.lastDay,r?.claimed?.length,r?.vouchers,r?.usedVouchers?.length,s.town?.terminal].join('|');
    if(r!==cachedState||key!==cachedSignature||!cachedView){cachedState=r;cachedSignature=key;cachedView=R.view(s);}
    return cachedView;
  }
  function conditions(stage){
    const rows=stage.conditions?.length?stage.conditions:[{label:'实际进度',value:stage.value,target:stage.target}];
    return `<ul class="roadmap-conditions">${rows.map(row=>{const ratio=Math.max(0,Math.min(100,row.target?row.value/row.target*100:0));return `<li><span>${esc(row.label)}<b>${esc(row.value)} / ${esc(row.target)}</b></span><i aria-hidden="true"><em style="width:${ratio}%"></em></i></li>`;}).join('')}</ul>`;
  }
  function stageCard(s,stage,index){
    const state=stage.claimed?'已领取':stage.locked?'后续阶段':stage.ready?'可以领取':'当前目标';
    return `<article class="roadmap-stage ${stage.claimed?'is-claimed':stage.locked?'is-locked':'is-current'}"><div class="roadmap-step" aria-hidden="true">${stage.claimed?'✓':String(index+1).padStart(2,'0')}</div><div class="roadmap-stage-body"><header><h4>${esc(stage.name)}</h4><span>${state}</span></header><p>${esc(stage.copy)}</p>${conditions(stage)}<p class="roadmap-reward">解锁 · ${esc(stage.reward)}</p>${stage.claimed?'<small class="roadmap-stage-status">奖励已永久保存</small>':stage.locked?'<small class="roadmap-stage-status">先完成前一阶段；真实经营成绩可以提前积累。</small>':button('roadmap-claim',stage.ready?'领取阶段奖励':'继续经营，日结后查看',stage.key,!stage.ready||!canClaim(s))}</div></article>`;
  }
  function vouchers(s,view){
    const available=Object.entries(G.DECOR).filter(([key])=>!s.growth.decor[key]);
    return `<section class="roadmap-vouchers"><header><h4>把成长布置进小店</h4><strong>装修券 ${view.vouchers} 张</strong></header><p>准备期可用 1 张券免费布置一件未拥有的装饰。原有付费购买仍然可用。</p>${available.length?`<div class="roadmap-voucher-actions">${available.map(([key,item])=>button('roadmap-decorate',`${item.name} · 1 张券`,key,s.phase!=='prep'||!!s.town?.terminal||view.vouchers<1)).join('')}</div>`:'<p class="roadmap-empty">现有装饰已全部拥有，装修券将保留。</p>'}</section>`;
  }
  function panel(s){
    const view=R.view(s);
    if(!view.active)return `<section class="roadmap-panel"><div class="growth-intro"><span>长期经营目标</span><h3>从一间小店，到小镇的老朋友。</h3><p>这份旧存档将在下一营业日启用成长路线。当天保持原规则，历史盈利与委托不会补算。</p></div><p class="roadmap-next">${esc(view.tip)}</p></section>`;
    return `<section class="roadmap-panel"><div class="growth-intro"><span>长期经营目标 · ${view.completed} / 5</span><h3>${view.title?esc(view.title):'让每一天的经营，都有下一步。'}</h3><p>按顺序领取五个阶段奖励；每日目标继续单独领奖。完整营业 90 秒后，正利润日和双店连胜才会计入；提前收摊会中断双店连胜。</p></div><div class="roadmap-next"><span>${view.current?'今天先做这一件':'成长路线已完成'}</span><strong>${view.current?esc(view.current.name):'继续经营你的小镇'}</strong><p>${esc(view.tip)}</p>${view.current?`<small>本阶段奖励：${esc(view.current.reward)}</small>`:''}</div><div class="roadmap-stages">${view.stages.map((stage,index)=>stageCard(s,stage,index)).join('')}</div>${vouchers(s,view)}<p class="roadmap-footnote">成长奖励提供研发点、经营能力与装修，不发现金，不计入餐费利润。锁价委托、事件套餐与分店售价保持各自规则。</p></section>`;
  }
  function recommendation(s){
    const view=R.view(s);
    return `<section class="roadmap-recommendation"><div><small>${view.current?'当前成长目标':'小店成长'}</small><strong>${esc(view.current?.name||view.title||'成长路线')}</strong><p>${esc(view.tip)}</p>${view.current?`<span>完成解锁：${esc(view.current.reward)}</span>`:''}</div><button class="growth-button" data-action="growth">查看成长路线 →</button></section>`;
  }
  function report(s,r){
    const snapshot=r.roadmap;
    if(!snapshot)return '<section class="roadmap-report"><h3>小店成长</h3><p>这份历史日结未记录成长路线；旧存档从下一营业日开始记录。</p></section>';
    const state=snapshot.state,stages=snapshot.stages||[],claimed=state.claimed||[],next=stages.find(stage=>!stage.claimed&&!stage.locked),title=claimed.includes('chain')?'双店掌柜':claimed.includes('commission')?'街坊好店':'继续积累经营经验';
    const current=s.day===r.day&&s.phase==='report';
    return `<section class="roadmap-report"><header><h3>小店成长 · 今日记录</h3><strong>${claimed.length} / 5 阶段已领取</strong></header><div class="roadmap-report-metrics"><span>已获称号<b>${title}</b></span><span>可用装修券<b>${state.vouchers??0} 张</b></span><span>主店招牌配方<b>${claimed.includes('steady')?'精研 · 普通招牌 +¥2':'经典 · 普通招牌 +¥1'}</b></span></div>${next?`<p>${esc(next.name)} · ${esc(next.ready?'条件已达成，可以领取奖励':next.copy)}</p>${conditions(next)}<p class="roadmap-reward">解锁 · ${esc(next.reward)}</p>${current?button('roadmap-claim',next.ready?'领取成长奖励':'日结条件尚未达成',next.key,!next.ready||!canClaim(s)):''}`:'<p>本日成长奖励已全部领取，继续经营可以积累后续条件。</p>'}<p class="roadmap-footnote">以上使用本日结算快照；领取阶段奖励只增加研发点与解锁，不改变本日经营利润。</p></section>`;
  }
  window.NoodleRoadmapUI={panel,recommendation,report,summary};
})();
