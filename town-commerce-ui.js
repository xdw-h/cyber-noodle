(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;else root.NoodleCommerceUI=api;})(typeof window==='object'?window:globalThis,function(root){
  'use strict';
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const number=v=>Number.isFinite(Number(v))?Number(v):0;
  const money=v=>'¥'+number(v).toLocaleString('zh-CN',{maximumFractionDigits:2});
  const engine=()=>root.NoodleEngine;
  const commerce=()=>engine()?.Commerce;
  const name=id=>engine()?.Residents?.PEOPLE?.[id]?.name||'居民';
  const definitions=()=>commerce()?.VENUES||[];
  const find=id=>definitions().find(v=>v.id===id);
  const goods=v=>['bakery','book','flowers'].includes(v.key)||['town-building-8','town-building-9','town-building-10'].includes(v.id);
  const benefits={bakery:'居民实际买到早餐后，部分居民午间会因饱腹而减少自然来店用餐；已确认的预约与委托仍照常履约。',book:'居民实际买书后积累阅读兴趣，可以聊读书话题；熟悉居民提出委托时也会参考兴趣。',flowers:'居民实际买花后积累园艺兴趣，可以聊种植话题；熟悉居民提出委托时也会参考兴趣。',barber:'居民在门口排队，轮到后进店理发。服务完成后，本日与次日的用餐耐心增加 2 秒。',clinic:'居民在门口排队，轮到后进店接受日常照护。服务完成后，本日与次日的用餐耐心增加 3 秒。'};
  const key=v=>v.key||({'town-building-8':'bakery','town-building-9':'book','town-building-10':'flowers','town-building-17':'barber','town-building-23':'clinic'})[v.id];
  function button(action,label,value,disabled=false){return `<button class="secondary-button" data-action="${action}" data-value="${esc(value??'')}"${disabled?' disabled':''}>${esc(label)}</button>`;}
  function metrics(items){return '<dl class="commerce-metrics">'+items.map(([label,value])=>`<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join('')+'</dl>';}
  function receipts(rows,withVenue=false){
    return '<ul class="commerce-receipts">'+rows.map(r=>`<li><span>第 ${esc(r.day)} 天 · ${esc(r.name||name(r.residentId))}${withVenue?' · '+esc(find(r.venueId)?.name||'街区商铺'):''}</span><strong>${esc(money(r.price))}</strong></li>`).join('')+'</ul>';
  }
  function venueContent(s,id){
    const v=commerce()?.venue(s,id);if(!v)return '';
    if(!v.active)return '<p class="commerce-empty">这份旧存档将在下一营业日启用居民商店街。今天不补记消费，也不改变居民的钱包。</p>';
    const queue=v.queued||[],serving=v.serving?{...v.serving,progress:number(v.serving.progress)/Math.max(.1,number(v.duration)||1)}:null,paid=v.receipts||[];
    const hours=root.NoodleBuildingLife?.building(s,id)?.hours;
    return `<article class="commerce-venue"><div class="commerce-heading"><h3>${esc(v.name)}</h3><span>${v.open?'营业中':'已打烊'}${hours?' · '+esc(hours):''}</span></div>${metrics([['单次价格',money(v.price)],['今日成交',number(v.customers)+' 人'],['实际收款',money(v.revenue)],[goods(v)?'剩余商品':'服务席位',goods(v)?number(v.stock)+' / 8':serving?'1 / 1 使用中':'0 / 1 使用中']])}<p>${esc(benefits[key(v)]||'居民按日程到店消费，服务完成后才付款。')}</p><section class="commerce-service" aria-label="当前服务"><h4>${goods(v)?'柜台服务':'当前服务'}</h4>${serving?`<p><strong>${esc(serving.name||name(serving.id))}</strong> · ${goods(v)?'正在结账':'正在店内接受服务'}</p><progress max="1" value="${Math.max(0,Math.min(1,number(serving.progress)))}" aria-label="服务进度"></progress>`:'<p>当前没有居民接受服务。</p>'}<h4>门口排队 · ${queue.length} / 3</h4>${queue.length?'<ol class="commerce-queue">'+queue.map(p=>`<li>${esc(p.name||name(p.id))} · 等候叫号</li>`).join('')+'</ol>':'<p>门口暂时无人等候。</p>'}</section><h4>今日实际付款</h4>${paid.length?receipts(paid):'<p class="commerce-empty">今天尚未完成交易；路过、排队和服务中都不记收入。</p>'}</article><p class="commerce-note">这些是居民自营商铺。付款来自居民钱包，不计入玩家现金、炒粉店营业额或排行榜资产。居民按日获得生活额度，只有实际成交才支出；门口满员或未能在时段内完成服务的居民不扣款。</p>`;
  }
  function building(app,id){
    const v=app.E.Commerce?.venue(app.state,id);if(!v)return false;
    app.openModal('town-commerce',app.modalHead(v.name,'居民到店、排队和付款都跟随营业时钟；打开面板时经营暂停。')+`<section class="commerce-panel" data-venue="${esc(id)}">${venueContent(app.state,id)}</section>`);return true;
  }
  function resident(s,id){
    const p=commerce()?.person(s,id);if(!p)return '<p class="commerce-note">居民钱包与商铺消费将在下一营业日启用。</p>';
    const recent=p.recent||[],talk=p.reading>0||p.gardening>0;
    return `<section class="commerce-resident"><h3>街坊生活 · 钱包与兴趣</h3>${metrics([['生活钱包',money(p.wallet)],['累计商铺支出',money(p.spent)],['阅读兴趣',number(p.reading)],['园艺兴趣',number(p.gardening)],['交流熟悉度',number(p.rapport)+' / 3'],['用餐耐心加成',number(p.patience)+' 秒']])}<p>生活额度用于居民在街区的消费，与玩家经营资金分开。${p.patience?'服务带来的耐心加成仅在有效天数内生效。':'理发或完成诊所照护后，可短期改善用餐耐心。'}</p>${talk?`<p>可聊话题：${p.reading>0?'读书':''}${p.reading>0&&p.gardening>0?'、':''}${p.gardening>0?'园艺':''}。交流每天一次，熟悉度最多 3 级，可提高自然来店意愿。</p>${button('commerce-chat',p.chatAvailable?'聊聊最近的生活':p.rapport>=3?'交流熟悉度已满':p.lastChatDay===s.day?'今天已经聊过':'营业前或日结后再聊',id,!p.chatAvailable)}`:'<p>还没有形成阅读或园艺话题。居民实际买书、买花后再来聊聊。</p>'}<h4>最近商铺消费 · 最多五条</h4>${recent.length?receipts(recent,true):'<p class="commerce-empty">还没有实际商铺消费记录。</p>'}</section>`;
  }
  function directory(s){
    return '<section class="commerce-directory"><h3>商店街 · 居民的一天</h3><div class="commerce-shops">'+definitions().map(v=>{const live=commerce().venue(s,v.id);return `<article><strong>${esc(v.name)}</strong><span>${money(v.price)} / 次 · ${live?.active?'今日成交 '+number(live.customers)+' 人':'下一营业日启用'}</span>${button('commerce-building','查看商铺',v.id)}</article>`;}).join('')+'</div><p class="commerce-note">居民会去买早餐、书和鲜花，也会排队理发、接受日常照护。商铺收款独立记账。</p></section>';
  }
  function report(input){
    const saved=input?.phase?commerce()?.report(input):input?.commerce||(input?.version===1&&input.separate===true&&Array.isArray(input.venues)?input:undefined);if(!saved)return '';
    return `<section class="commerce-report"><h3>居民商铺日结</h3>${metrics([['实际成交',number(saved.customers)+' 人次'],['商铺实际收款',money(saved.revenue)]])}<div class="commerce-report-rows">${(saved.venues||[]).map(v=>`<p><strong>${esc(v.name||find(v.id)?.name||'街区商铺')}</strong><span>${number(v.customers)} 人次 · ${money(v.revenue)}</span></p>`).join('')}</div><p class="commerce-note">这是居民自营商铺的独立账目，不计入玩家现金、炒粉店利润或排行榜资产。只记录已完成并付款的交易。</p></section>`;
  }
  function refresh(app){
    if(app.modal!=='town-commerce')return;const panel=document.querySelector('#modal-content .commerce-panel');if(!panel)return;const html=venueContent(app.state,panel.dataset.venue);if(panel.innerHTML!==html)panel.innerHTML=html;
  }
  function bind(app){
    app.actions['commerce-building']=b=>building(app,b?.dataset?.value);
    app.actions['commerce-chat']=b=>{const id=Number(b?.dataset?.value);if(app.transaction(app.E.Commerce.chat(app.state,id)))app.actions['resident-detail']?.({dataset:{value:String(id)}});};
  }
  return {building,resident,directory,report,bind,refresh};
});
