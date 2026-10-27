(function () {
  'use strict';
  const E = window.NoodleEngine, $ = id => document.getElementById(id);
  const esc = x => String(x).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const aiNames = {manual:'手动接单',balanced:'均衡调度',profit:'利润优先',speed:'耐心优先'};
  const modes = {standard:'标准 · 2秒',turbo:'极速 · 1.2秒 / 日费+¥30',eco:'节能 · 3秒 / 日费−¥10'};
  function button(action,label,value,disabled,selected) { return `<button class="secondary-button tech-choice ${selected?'selected':''}" data-action="${action}" data-value="${value||''}" ${disabled?'disabled':''}>${label}</button>`; }
  function aiPanel(s) {
    const f=E.forecast(s);
    return `<div class="tech-note">AI 将自然语言需求转成配方，并按策略安排机器人。使用游戏内规则模拟，无需外部 AI 服务；启用后算力 ¥12 / 天。当前偏好记忆 ${s.growth.research.ai} 级，命中常客偏好额外 +¥${s.growth.research.ai}。</div><div class="tech-choices">${Object.entries(aiNames).map(([k,v])=>button('ai-mode',v,k,false,s.aiMode===k)).join('')}</div><h3>需求识别实验室</h3><label class="tech-input">顾客怎么说？<input id="demand-text" maxlength="160" value="不要牛肉，鸡蛋加量，少辣，我赶时间"></label>${button('analyze-demand','识别需求')}<p id="demand-result" class="tech-note">试试看：配方、口味和加急标签会被识别。</p><h3>明日备货预测 · ${f.target} 碗</h3><p class="tech-note">${esc(f.basis)}。这是估计，实际销量受价格与库存影响。</p><div class="tech-choices">${Object.entries(f.demand).map(([k,v])=>`<span class="tech-pill">${E.MENU[k].name} ${v}份</span>`).join('')}</div>${button('forecast-purchase',`按预测备货 · ¥${f.cost.toFixed(2)}`,'',s.phase!=='prep')}<h3>决策记录</h3><div class="tech-log">${s.aiLog.length?s.aiLog.map(x=>`<p>${esc(x)}</p>`).join(''):'开店后显示识别、调度与履约记录。'}</div>`;
  }
  function robotPanel(s) { return `<div class="robot-showcase"><span class="robot-portrait"><svg><use href="#i-robot"/></svg></span><div><h3>阿炒 ${s.robotLevel>1?'Pro':'01'} · 自动炒粉</h3><p>AI 排单 → 机器人按配方消耗食材 → 自取结账 / 外卖待飞。</p></div></div><div class="tech-note">耐久 ${Math.round(s.robotHealth)}% · 研发减磨 ${s.growth.research.robot * 20}% · 每次制作产生磨损；耐久归零后由店长以 4 秒速度接手。极速模式磨损更快，Pro 制作时间再缩短 25%。模式只能在开店前更改。</div><div class="tech-choices">${Object.entries(modes).map(([k,v])=>button('robot-mode',v,k,s.phase!=='prep',s.robotMode===k)).join('')}</div><div class="tech-choices">${button('repair-robot','保养 · ¥35','',s.robotHealth>=100||s.phase==='report')}${button('upgrade-robot',s.robotLevel>1?'Pro 已安装':'升级 Pro · ¥600','',s.robotLevel>1||s.phase!=='prep')}</div><p class="tech-note">标准机器人小店基础运营 ¥80 / 天，AI 另计 ¥12；升级 Pro 每天再增加 ¥10。</p>`; }
  function dronePanel(s) { const m=s.drone.mission; return `<div class="tech-note">电量 ${Math.round(s.drone.battery)}% · ${s.drone.level>1?'Pro 航线':'标准航线'} · ${m?`正在${m.kind==='supply'?'从中央厨房补货':m.vehicle==='ground'?'地面配送':m.delivered?'返航':'送餐'}，剩余 ${Math.ceil(m.duration-m.progress)} 秒`:`停机坪待命，每秒充电 ${5 + s.growth.research.drone * 2}%`}<br>打开控制台时暂停经营，关闭后继续飞行。热餐送达才收款。</div><div class="tech-choices">${button('toggle-auto',s.drone.auto?'自动派送：已开启':'自动派送：已关闭','',false,s.drone.auto)}${button('upgrade-drone',s.drone.level>1?'Pro 已安装':'升级 Pro · ¥500','',s.drone.level>1||s.phase!=='prep')}</div><h3>待配送热餐 · ${s.readyDeliveries.length} 份</h3><div class="delivery-list">${s.readyDeliveries.length?s.readyDeliveries.map(o=>{const r=E.routeInfo(s,o.destination);return `<article class="delivery-card"><strong>#${o.id} ${E.MENU[o.type].name} → ${r.name}</strong><p>${esc(o.text||'')} · 航时 ${r.seconds}秒 · 电量 ${r.battery}% · 运费 ¥${r.fee}</p><div class="tech-choices">${button('dispatch-drone','无人机起飞',o.id,!!m||s.weather==='storm')}${button('dispatch-ground','地面备用 · ¥8 / 18秒',o.id,!!m)}</div></article>`;}).join(''):'远程订单炒好后在这里装机，先去开店吧。'}</div><h3>中央厨房 → 小店补货</h3><p class="tech-note">补货和送餐共用运力。先扣食材与 ¥3 运费，到达才入库；雷雨不能起飞。</p><div class="tech-choices">${Object.entries(E.SUPPLIES).map(([k,v])=>button('supply',`${v.name} · ${Object.entries(v.basket).map(([i,n])=>E.INGREDIENTS[i].name+n).join(' / ')}`,k,!!m||s.phase!=='open'||s.weather==='storm')).join('')}</div><h3>三条航线</h3><div class="tech-log">${Object.entries(E.ROUTES).map(([k,r])=>`<p>${r.name} · 基础 ${r.seconds}秒 · 配送溢价 +¥${r.premium}</p>`).join('')}</div>`; }
  function render(s) {
    $('ai-tech-status').textContent=aiNames[s.aiMode];
    $('robot-tech-status').textContent=`耐久 ${Math.round(s.robotHealth)}% · ${s.robotMode==='turbo'?'极速':s.robotMode==='eco'?'节能':'标准'}`;
    $('drone-tech-status').textContent=`${Math.round(s.drone.battery)}% · ${s.drone.mission?'任务中':`待配送 ${s.readyDeliveries.length}`}`;
    $('weather-label').textContent={clear:'晴空 · 适宜飞行',gust:'阵风 · 航时耗电增加',storm:'雷雨 · 无人机停飞'}[s.weather];
    $('delivery-summary').textContent=`远程送达 ${s.stats.delivered} 份 · 待飞 ${s.readyDeliveries.length} 份`;
    const m=s.drone.mission, art=$('drone-art'), path=$('flight-route');
    let x=681,y=528;
    if(m&&m.vehicle==='drone') {
      const dest=m.kind==='supply'?{x:88,y:100}:E.ROUTES[m.destination];
      const ratio=m.kind==='supply'?1-Math.min(1,m.progress/m.duration):m.progress<=m.outbound?m.progress/m.outbound:1-(m.progress-m.outbound)/(m.duration-m.outbound);
      x+= (dest.x-681)*ratio;y+=(dest.y-528)*ratio;
      path.setAttribute('d',`M681 528 L${dest.x} ${dest.y}`);path.style.display='';
    } else path.style.display='none';
    art.setAttribute('transform',`translate(${x} ${y})`);art.classList.toggle('flying',!!m&&m.vehicle==='drone'&&!s.paused);
    $('goal-title').textContent='空地协同 · 配送挑战';$('goal-copy').textContent='让 AI 接单、机器人炒粉、无人机送达 5 份热餐。';
    $('robot-progress').style.width=`${Math.min(100,s.totalDelivered/5*100)}%`;$('goal-saved').textContent=`累计送达 ${s.totalDelivered} 份`;$('goal-cost').textContent=s.totalDelivered>=5?'协同达成 ✓':'目标 5 份';
  }
  window.NoodleTech={aiPanel,robotPanel,dronePanel,render};
})();
