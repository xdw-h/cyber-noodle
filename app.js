(function () {
  'use strict';
  const E = window.NoodleEngine, $ = id => document.getElementById(id);
  const SAVE_KEY = 'cyber-noodle-save-v1', PREF_KEY = 'cyber-noodle-prefs-v1';
  const icons = name => `<svg aria-hidden="true"><use href="#i-${name}"/></svg>`;
  const money = n => Number(n).toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let state = E.createFutureState(), safe = E.clone(state), corruptRaw = null, storageBlocked = false;
  let sound = false, audioContext, speed = 1, modalKind = null, modalPaused = false, restoreFocus = null;
  let lastOrderSignature = '', lastCustomerSignature = '', lastFrame = performance.now(), renderAt = 0;
  let previousServed = 0, previousPhase = 'prep', eventNotified = false, tutorialSeen = false;
  let pendingImport = null;
  try {
    let pref = {};
    try { pref = JSON.parse(localStorage.getItem(PREF_KEY) || '{}') || {}; } catch (_) { /* 偏好设置损坏不能影响经营存档。 */ }
    sound = pref.sound === true; tutorialSeen = pref.tutorialSeen === true;
  } catch (_) { storageBlocked = true; }
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const result = E.decodeSave(raw);
      if (result.ok) { state = result.state; if (!state.future) { E.enableFuture(state); setTimeout(() => toast('旧存档已接入三科技设备，原现金和库存保留。'), 400); } safe = E.clone(state); if (result.wasOpen) setTimeout(() => toast('已恢复到今天营业前：库存与现金完整，今天可以重新开张。'), 400); }
      else corruptRaw = raw;
    }
  } catch (_) { storageBlocked = true; }
  previousServed = state.stats.served; previousPhase = state.phase;

  function savePrefs() {
    try { localStorage.setItem(PREF_KEY, JSON.stringify({ sound, tutorialSeen })); } catch (_) { storageBlocked = true; }
  }
  function save() {
    if (corruptRaw !== null) return;
    const active = ['open', 'closing'].includes(state.phase);
    if (!active) safe = E.clone(state);
    try {
      localStorage.setItem(SAVE_KEY, E.encodeSave(safe, active));
      $('save-status').innerHTML = '<span class="status-dot"></span>已自动保存'; storageBlocked = false;
    } catch (_) {
      if (!storageBlocked) toast('浏览器暂时无法保存。可在帮助中导出存档，避免进度丢失。', true);
      storageBlocked = true; $('save-status').textContent = '当前未能保存';
    }
  }
  function toast(message, error) {
    const item = document.createElement('div'); item.className = `toast${error ? ' error' : ''}`; item.textContent = message;
    $('toasts').appendChild(item);
    while ($('toasts').children.length > 3) $('toasts').firstChild.remove();
    setTimeout(() => { item.classList.add('toast-exit'); setTimeout(() => item.remove(), 220); }, 3500);
  }
  function tone(kind) {
    if (!sound) return;
    try {
      audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();
      if (audioContext.state === 'suspended') audioContext.resume();
      const notes = kind === 'sale' ? [660, 880] : kind === 'upgrade' ? [440, 554, 660, 880] : [440];
      notes.forEach((hz, i) => {
        const o = audioContext.createOscillator(), gain = audioContext.createGain(), t = audioContext.currentTime + i * .09;
        o.type = 'sine'; o.frequency.value = hz; gain.gain.setValueAtTime(.0001, t); gain.gain.exponentialRampToValueAtTime(.045, t + .012); gain.gain.exponentialRampToValueAtTime(.0001, t + .13);
        o.connect(gain); gain.connect(audioContext.destination); o.start(t); o.stop(t + .15);
      });
    } catch (_) { sound = false; savePrefs(); renderSound(); }
  }
  function dish(type, size) {
    const color = E.MENU[type].color;
    return `<svg viewBox="0 0 80 65" aria-hidden="true"${size ? ` style="width:${size}px"` : ''}><ellipse cx="40" cy="55" rx="27" ry="5" fill="#ccb793" opacity=".25"/><path d="M9 27h62Q67 56 40 57 15 54 9 27" fill="#fff7e6" stroke="#af9470" stroke-width="2.5"/><ellipse cx="40" cy="27" rx="31" ry="13" fill="${color}" stroke="#af9470" stroke-width="2.5"/><path d="M18 26q8-12 17 0t22-2M24 32q5-12 17-3t18-3M27 20q9 8 19-1" stroke="#f9da89" stroke-width="3" fill="none" stroke-linecap="round"/><path d="m21 22 7-4m21 12 8 2m-18-14 4-4" stroke="#739652" stroke-width="4" stroke-linecap="round"/>${type === 'egg' ? '<ellipse cx="48" cy="23" rx="13" ry="9" fill="#fff2cf"/><circle cx="48" cy="23" r="5" fill="#ebbc43"/>' : type === 'beef' ? '<path d="m27 17 12 3-4 9-12-4m28-7 10 5-5 8-11-5" fill="#a76a54" stroke="#bc8269" stroke-width="1.5"/>' : ''}</svg>`;
  }
  function ingredientArt(key) {
    const content = {
      noodles: '<path d="M5 14h30l-4 19H9Z" fill="#eee1ba" stroke="#b99c67" stroke-width="1.5"/><ellipse cx="20" cy="14" rx="15" ry="6" fill="#f8ecc8" stroke="#b99c67" stroke-width="1.5"/><path d="M10 14q5-7 10 0t11-1M12 19q4-6 9-1t8-2M13 10q7 5 14-1" stroke="#ceb480" stroke-width="2" fill="none"/>',
      greens: '<path d="m14 32 8-18m-4 11Q1 25 5 12q13-3 13 13m3-5Q13 2 27 4q13 10-6 16m0 6q16-17 16-3-6 12-16 3" fill="#7ba16a" stroke="#598456" stroke-width="1.5"/><path d="M14 33h12" stroke="#a4ba80" stroke-width="3" stroke-linecap="round"/>',
      egg: '<ellipse cx="13" cy="24" rx="10" ry="12" fill="#eee1c2" stroke="#cbb58c" stroke-width="1.5"/><ellipse cx="26" cy="19" rx="10" ry="13" fill="#f9edcf" stroke="#cbb58c" stroke-width="1.5"/><path d="M21 12q4-4 6-2" stroke="#fff9e3" stroke-width="2" fill="none"/>',
      beef: '<path d="M5 16q0-7 9-7 14 0 20 9 5 9-4 14-13 8-23-3-4-5-2-13" fill="#c78d77" stroke="#a97059" stroke-width="1.5"/><path d="M9 16q10-6 20 7M10 23q10-1 17 6M20 12l-4 14" stroke="#edb8a0" stroke-width="2.5" fill="none"/>'
    };
    return `<svg viewBox="0 0 40 40" aria-hidden="true">${content[key]}</svg>`;
  }
  function renderSound() {
    $('sound-button').innerHTML = `${icons('sound')}${sound ? '' : '<span class="sound-off"></span>'}`;
    $('sound-button').setAttribute('aria-label', sound ? '关闭音效' : '开启音效');
    $('sound-button').title = sound ? '关闭音效' : '开启音效';
    $('sound-button').setAttribute('aria-pressed', String(sound));
  }
  function renderOrders() {
    const all = state.dining.readyMeals.map(o=>({...o,status:'dining-ready'})).concat(state.readyDeliveries.map(o => ({...o,status:'ready'})).concat(state.current ? [state.current] : [], state.orders));
    const signature = all.slice(0, 3).map(o => `${o.id}:${o.status}`).join('|') + `/${all.length}/${state.phase}`;
    if (signature !== lastOrderSignature) {
      lastOrderSignature = signature;
      if (!all.length) {
        $('orders').innerHTML = `<div class="empty-orders"><div class="empty-bowl">${icons('bowl')}</div><strong>${state.phase === 'prep' ? '第一位客人，正在路上' : state.phase === 'report' ? '今天辛苦啦，店长' : '锅气正好，静候客人'}</strong><p>${state.phase === 'prep' ? '备好食材，开门迎接新一天。' : state.phase === 'report' ? '看看今天的小店成绩单吧。' : '顾客进店后，点击订单安排制作。'}</p>${state.phase === 'prep' ? '<button class="text-link" data-action="purchase">先去采购食材 ↗</button>' : ''}</div>`;
      } else {
        $('orders').innerHTML = all.slice(0, 3).map(o => {
            const cooking = o.status === 'cooking', queued = o.status === 'queued';
            if(o.status==='dining-ready') return `<article class="order-card ready"><strong>${E.MENU[o.type].name} · ${o.tableId+1} 号桌</strong><p>小满机器人即将送餐，送达后收款。</p><button class="order-button" data-action="dining">查看堂食服务 ↗</button></article>`;
            if (o.status === 'ready') return `<article class="order-card ready"><strong>${E.MENU[o.type].name} → ${E.ROUTES[o.destination].name}</strong><p>热餐已做好，预计送达收款 ¥${o.price + (state.growth.special === o.type ? 1 : 0)}</p><button class="order-button" data-action="drone">装机配送 ↗</button></article>`;
          return `<article class="order-card ${o.status}" data-order="${o.id}"><div class="order-top"><span class="order-bowl">${dish(o.type)}</span><div class="order-info"><strong>${E.MENU[o.type].name}</strong><span>${o.channel === 'delivery' ? '✈ ' + E.ROUTES[o.destination].name : o.channel==='dinein'?'堂食 · '+(o.tableId+1)+'号桌':'到店自取'} #${String(o.id).padStart(3, '0')}${o.tags && o.tags.length ? ' · ' + esc(o.tags.join(' / ')) : ''}</span></div><span class="order-price">¥${(o.price || state.prices[o.type]) + (state.growth.special === o.type ? 1 : 0) + (o.preferenceMatch && state.aiMode !== 'manual' ? state.growth.research.ai : 0)}</span></div><div class="patience-line"><i data-patience="${o.id}"></i></div><div class="order-bottom"><span data-order-time="${o.id}">${cooking ? '锅气十足，制作中' : queued ? '已排入制作队列' : '耐心等待中'}</span>${cooking || queued ? `<span class="order-button queued-label">${cooking ? '正在炒粉' : '已安排'}</span>` : `<button class="order-button" data-action="enqueue" data-id="${o.id}">安排制作</button>`}</div></article>`;
        }).join('') + (all.length > 3 ? `<p class="more-orders">还有 ${all.length - 3} 位客人在等候，前面的完成后会自动显示</p>` : '');
      }
      if ($('mobile-orders')) $('mobile-orders').innerHTML = $('orders').innerHTML;
    }
    for (const o of all.slice(0, 3)) {
      const cooking = o.status === 'cooking';
      const ratio = cooking ? o.progress / o.duration : Math.max(0, 1 - o.age / o.patience);
      document.querySelectorAll(`[data-patience="${o.id}"]`).forEach(bar => { bar.style.width = `${Math.max(0, Math.min(100, ratio * 100))}%`; bar.classList.toggle('urgent', !cooking && ratio < .3); });
      if (cooking) document.querySelectorAll(`[data-order-time="${o.id}"]`).forEach(text => { text.textContent = `还需 ${Math.ceil(o.duration - o.progress)} 秒`; });
    }
    $('order-count').textContent = all.length; $('mobile-order-count').textContent = all.length;
  }
  function renderCustomers() {
    const people = state.orders.filter(o => o.channel !== 'delivery').slice(0, 5);
    const signature = people.map(o => `${o.id}:${o.status}`).join('|');
    if (signature !== lastCustomerSignature) {
      lastCustomerSignature = signature;
      const positions = [[356, 555], [294, 586], [230, 610], [167, 597], [109, 625]], colors = ['#9bb5bc', '#d6a46e', '#b0accc', '#85aa86', '#cd9385'];
      $('customers').innerHTML = people.map((o, i) => {
        const [x, y] = positions[i], color = colors[(o.person ?? o.id) % colors.length];
        return `<g class="customer-person" transform="translate(${x} ${y})"><use href="#person" x="-25" y="-43" width="50" height="83" color="${color}"/><g transform="translate(7 -82)"><rect width="51" height="36" rx="10" fill="#fffbec" stroke="#c7b58d" stroke-width="1.5"/><path d="m18 35 5 7 5-7" fill="#fffbec" stroke="#c7b58d" stroke-width="1.5"/><svg x="7" y="0" width="38" height="32" viewBox="0 0 80 65">${dish(o.type).replace(/^<svg[^>]*>|<\/svg>$/g, '')}</svg></g></g>`;
      }).join('');
    }
    $('idle-visitor').style.display = ['open', 'closing'].includes(state.phase) ? 'none' : '';
  }
  function render() {
    const active = ['open', 'closing'].includes(state.phase);
    const cashParts = state.cash.toFixed(2).split('.');
    $('cash').innerHTML = `¥${money(Number(cashParts[0]))}<span>.${cashParts[1]}</span>`;
    $('reputation').innerHTML = `${Math.round(state.reputation)}<span>/100</span>`;
    $('day-label').textContent = `第 ${state.day} 天`;
    $('day-phase').textContent = { prep: '准备营业', open: state.paused ? '暂停休息' : '营业中', closing: '收摊服务中', report: '今日收摊' }[state.phase];
    $('day-progress').style.width = `${state.phase === 'report' ? 100 : state.elapsed / 90 * 100}%`;
    $('timeline-text').textContent = state.phase === 'prep' ? '备好食材，迎接第一位客人' : state.phase === 'report' ? '用心经营的每一天，都值得记录' : '锅气升腾，美好正在发生';
    $('day-clock').textContent = active ? `剩余 ${Math.max(0, Math.ceil(90 - state.elapsed))} 秒` : state.phase === 'report' ? '今日营业已完成' : '开店后 90 秒 / 天';
    $('pause-button').disabled = !active;
    $('pause-button').textContent = state.paused ? '▶ 继续' : 'Ⅱ 暂停';
    $('pause-button').setAttribute('aria-pressed', String(state.paused));
    $('speed-button').textContent = `${speed}×`;
    $('shop-status').textContent = { prep: '备货中', open: state.paused ? '休息一下' : '热气腾腾 · 营业中', closing: '正在收摊', report: '明天见' }[state.phase];
    $('shop-status').classList.toggle('live', active && !state.paused);
    $('shop-level').textContent = state.robot ? 'Lv.2 智能小店' : 'Lv.1 手作小店';
    $('shop-scene').classList.toggle('is-cooking', !!state.current && !state.paused);
    $('shop-scene').classList.toggle('robot-installed', state.robot);
    $('robot-slot').style.display = state.robot ? 'none' : '';
    $('robot-art').style.display = state.robot ? '' : 'none';
    $('chef').style.opacity = state.robot ? '.55' : '1';
    $('open-sign').style.display = active && state.orders.length ? 'none' : '';
    $('open-sign-text').textContent = state.phase === 'prep' ? '准备开张啦' : state.phase === 'report' ? '明天也要来哦' : state.paused ? '店长休息中' : '欢迎吃碗热粉';
    $('cooking-meter').setAttribute('visibility', state.current ? 'visible' : 'hidden');
    $('cooking-fill').setAttribute('width', state.current ? (119 * state.current.progress / state.current.duration).toFixed(1) : '0');
    $('cooking-status').textContent = state.current ? `${state.robot ? '机器人' : '店长'}正在制作${E.MENU[state.current.type].name}` : state.phase === 'prep' ? '锅已热好，就等你开张' : state.phase === 'report' ? '收好锅铲，明天继续加油' : state.robot ? '机器人待命中，订单会自动安排' : '等锅不等人，记得点击订单接单';
    $('pause-overlay').hidden = !state.paused || !!modalKind;
    $('served').textContent = state.stats.served; $('served-progress').style.width = `${Math.min(100, state.stats.served / 20 * 100)}%`;
    $('inventory').innerHTML = Object.entries(E.INGREDIENTS).map(([k, v]) => `<div class="ingredient-row"><span class="ingredient-pic">${ingredientArt(k)}</span><span class="ingredient-label">${v.name}${v.perishable ? '<small>当日新鲜 · 收摊清空</small>' : ''}</span><span class="ingredient-qty ${state.inventory[k] < 3 ? 'low' : ''}">${state.inventory[k]}<small>份</small></span></div>`).join('');
    $('goal-title').textContent = state.robot ? '机器人已上岗！' : '解锁炒粉机器人';
    $('goal-copy').textContent = state.robot ? '自动接单，2 秒出餐，小店升级成功。' : '让科技掌勺，让你当个轻松店长。';
    $('robot-progress').style.width = `${state.robot ? 100 : Math.min(100, state.cash / 1200 * 100)}%`;
    $('goal-saved').textContent = state.robot ? `第 ${state.achievementDay} 天达成` : `已攒 ¥${money(state.cash)}`;
    $('goal-cost').textContent = state.robot ? (state.achievementDay <= 7 ? '七日挑战 ✓' : '智能小店 ✓') : '目标 ¥1,200';
    $('ai-advice').textContent = E.advice(state);
    const main = $('open-button');
    main.classList.toggle('service', active);
    main.innerHTML = `${icons(state.phase === 'prep' ? 'sun' : state.phase === 'report' ? 'chart' : 'bowl')}<span>${state.phase === 'prep' ? '开门营业' : state.phase === 'report' ? '查看日结' : state.phase === 'closing' ? '正在收摊…' : '收摊结算'}</span>${icons('arrow')}`;
    main.disabled = state.phase === 'closing';
    const eventOn = state.phase === 'open' && state.event && state.elapsed >= state.event.start && state.elapsed < state.event.end;
    $('event-banner').hidden = !eventOn;
    if (eventOn) {
      $('event-banner').textContent = `✧ ${state.event.title} · 还有 ${Math.ceil(state.event.end - state.elapsed)} 秒`;
      if (!eventNotified) { eventNotified = true; toast(state.event.description); }
    }
    renderOrders(); renderCustomers(); window.NoodleTech.render(state); window.NoodleGrowthUI.render(state); window.NoodleDiningUI.render(state); window.NoodleDistrictUI.render(state); window.NoodleBranchUI.render(state); if(window.Noodle3D) window.Noodle3D.sync(state);
  }

  function modalHead(title, description, icon) {
    return `<div class="modal-head"><div><div class="modal-title-icon">${icons(icon || 'bowl')}</div><h2 id="modal-title">${title}</h2></div><button class="close-modal" data-action="close-modal" aria-label="关闭弹窗">×</button></div>${description ? `<p class="modal-desc">${description}</p>` : ''}`;
  }
  function openModal(kind, html) {
    if (!modalKind) {
      restoreFocus = document.activeElement;
      modalPaused = kind !== 'orders' && ['open', 'closing'].includes(state.phase) && !state.paused;
      if (modalPaused) state.paused = true;
    }
    modalKind = kind; $('modal-content').innerHTML = html; $('modal-backdrop').hidden = false;
    document.body.classList.add('modal-open'); render();
    const focus = $('modal').querySelector('button:not(:disabled), input:not(:disabled)');
    if (focus) focus.focus({ preventScroll: true });
  }
  function closeModal() {
    if (modalKind === 'corrupt') { toast('请先备份或确认新建游戏，原存档尚未覆盖。', true); return; }
    if (modalKind === 'report') { toast('查看结算后，点击“准备下一天”继续。'); return; }
    modalKind = null; $('modal-backdrop').hidden = true; document.body.classList.remove('modal-open');
    if (modalPaused) { state.paused = false; modalPaused = false; }
    lastFrame = performance.now(); render();
    if (restoreFocus && restoreFocus.isConnected) restoreFocus.focus({ preventScroll: true });
  }
  function dismissAll() { modalKind = null; modalPaused = false; $('modal-backdrop').hidden = true; document.body.classList.remove('modal-open'); }
  function showPurchase() {
    const locked = state.phase !== 'prep';
    openModal('purchase', modalHead('新鲜食材，刚刚好', '采购后立即扣款。青菜与牛肉会在当天收摊时报废，先少量备货更稳妥。', 'box') +
      `<div>${Object.entries(E.INGREDIENTS).map(([k, v]) => `<div class="basket-row"><span class="ingredient-pic">${ingredientArt(k)}</span><label class="basket-label" for="buy-${k}">${v.name}<small>¥${v.price} / 份 · 库存 ${state.inventory[k]}${v.perishable ? ' · 当天用完' : ' · 可留至次日'}</small></label><div class="quantity-input"><button data-action="quantity" data-key="${k}" data-delta="-1" aria-label="减少${v.name}" ${locked ? 'disabled' : ''}>−</button><input id="buy-${k}" type="number" inputmode="numeric" min="0" max="999" step="1" value="0" ${locked ? 'disabled' : ''}><button data-action="quantity" data-key="${k}" data-delta="1" aria-label="增加${v.name}" ${locked ? 'disabled' : ''}>+</button></div></div>`).join('')}</div><div class="basket-hint"><span>可用现金 ¥${money(state.cash)} · 开店预留 ¥${state.robot ? (state.aiMode === 'manual' ? 80 : 92) : 60}</span><button class="secondary-button" data-action="recommended" ${locked ? 'disabled' : ''}>AI 预测备货</button></div>${locked ? '<p class="modal-notice">正在营业，采购暂时关闭。完成日结后再补货吧。</p>' : ''}<div class="modal-footer"><div class="basket-total"><span>本次采购合计</span><strong id="basket-total">¥0</strong></div><button class="primary-button" data-action="confirm-purchase" ${locked ? 'disabled' : ''}>确认采购 ${icons('arrow')}</button></div>`);
    const fees=E.openingFees(state);
    $('modal-content').querySelector('.basket-hint>span').textContent=`共享现金 ¥${money(state.cash)} · 两店开门预留 ¥${fees.total}（主店 ${fees.main} / 分店 ${fees.branch}）`;
  }
  function basket() { return Object.fromEntries(Object.keys(E.INGREDIENTS).map(k => [k, Number($(`buy-${k}`).value)])); }
  function updateBasket() {
    const quantities = basket(), cost = Object.entries(quantities).reduce((sum, [k, v]) => sum + (Number.isFinite(v) ? v : 0) * E.INGREDIENTS[k].price, 0);
    $('basket-total').textContent = `¥${money(cost)}`;
  }
  function showMenu() {
    const locked = state.phase !== 'prep';
    openModal('menu', modalHead('一碗粉，也有小讲究', '定价越高，顾客到店的概率越低。营业期间锁定价格，开店前可以随时调整。', 'bowl') +
      Object.entries(E.MENU).map(([k, v]) => `<div class="menu-item"><span class="menu-dish">${dish(k)}</span><label class="menu-info" for="price-${k}"><strong>${v.name}</strong><p>食材成本 ¥${Object.entries(v.recipe).reduce((sum, [key, n]) => sum + E.INGREDIENTS[key].price * n, 0)} / 碗</p><small>允许售价 ¥${Math.ceil(v.base * .8)}–${Math.floor(v.base * 1.2)}</small></label><div class="menu-price">¥<input id="price-${k}" type="number" min="${Math.ceil(v.base * .8)}" max="${Math.floor(v.base * 1.2)}" step="1" value="${state.prices[k]}" ${locked ? 'disabled' : ''}></div></div>`).join('') +
      (locked ? '<p class="modal-notice">今天的菜单已锁定，明天再试试新价格。</p>' : '') + `<div class="modal-footer"><span class="modal-desc" style="margin:0;font-size:10px">好口味，也要有好利润。</span><button class="primary-button" data-action="save-menu" ${locked ? 'disabled' : ''}>保存菜单</button></div>`);
  }
  function showOrders() {
    openModal('orders', modalHead('热粉订单，来啦', '安排制作后，堂食送到桌上收款、自取出餐收款、外卖送达收款。抽屉打开时营业继续。', 'bag') + `<div id="mobile-orders" class="orders-list">${$('orders').innerHTML}</div>`);
  }
  function showUpgrade() {
    openModal('upgrade', modalHead('机器人工作站', '选择速度、磨损与成本之间的平衡。', 'robot') + window.NoodleTech.robotPanel(state));
  }

  function showRoadmap() {
    openModal('roadmap', modalHead('三项科技，今天就营业', '首日已配备孵化器提供的机器人和无人机。', 'drone') + '<div class="tech-log"><p>① AI：需求识别、备货预测、自动排单与策略切换。</p><p>② 机器人：自动制作、三种模式、耐久保养、Pro 升级。</p><p>③ 无人机：三条远程航线、中央厨房补货、电量管理、天气停飞与地面备用。</p><p>④ 成长：每日目标、科技研究、店铺装修、今日招牌与四类常客。</p><p>⑤ 门店经营：三处选址开第二家店，独立库存、自动出餐、双店日结。两店共享现金，营业前预留备货和日费。</p></div>');
  }

  function showDistrict(place) { openModal('district',modalHead('春日里 · 街区经营','把一碗热粉，送进街区的日常。','drone')+window.NoodleDistrictUI.panel(state,place)); }
  function showBranches(place) { openModal('branches',modalHead('一间小店，长成两间','共享现金，独立备货。让第二口锅也热起来。','bowl')+window.NoodleBranchUI.panel(state,place)); }

  function showTutorial() {
    openModal('tutorial', modalHead('一碗粉，三种未来科技', '你经营一家俯视卡通炒粉小店，AI、无人机和机器人从第一天就能协作。', 'drone') + '<div class="tutorial-steps"><div class="tutorial-step"><span><strong>① AI 预测备货</strong><br>采购中点击“AI 预测备货”，确认后开门。默认标准运营 ¥92 / 天，含 AI 算力；售价在菜单调整。</span></div><div class="tutorial-step"><span><strong>② AI 排单，机器人炒粉</strong><br>均衡、利润、耐心三种策略；远程订单支持口味与加量配方。机器人有耐久，速度越快磨损越高。</span></div><div class="tutorial-step"><span><strong>③ 无人机送达才回款</strong><br>炒好外卖后打开低空物流，手动起飞或开启自动派送。补货也占用无人机，雷雨可改走地面。控制台关闭后恢复营业。</span></div><div class="tutorial-step"><span><strong>④ 让小店一点点长大</strong><br>完成每日目标领取现金与研发点，在“成长 · 装修”中研究三科技、布置永久装修、选择今日招牌，认识四类街角常客。</span></div></div><button class="primary-button modal-full-button" data-action="tutorial-start">开启我的科技小店 →</button>');
  }

  function showReport() {
    const r = state.lastReport;
    if (!r) return;
    openModal('report', `<div class="report-top"><div class="modal-title-icon">${icons('sun')}</div><h2 id="modal-title">今天，也认真经营了</h2><p class="modal-desc">第 ${r.day} 天 · 履约 ${r.served} 碗 · 远程送达 ${r.delivered || 0} 份 · 流失 ${r.lost} 位</p></div><div class="report-profit ${r.profit < 0 ? 'negative' : ''}"><span>今日经营利润</span><strong>${r.profit >= 0 ? '+' : '−'} ¥${money(Math.abs(r.profit))}</strong></div><div class="report-lines"><div class="report-line"><span>餐食销售收入</span><strong>+ ¥${money(r.revenue)}</strong></div><div class="report-line"><span>实际使用食材</span><strong>− ¥${money(r.cogs)}</strong></div><div class="report-line"><span>生鲜报废损失</span><strong>− ¥${money(r.waste)}</strong></div><div class="report-line"><span>每日运营费用</span><strong>− ¥${money(r.operating)}</strong></div><div class="report-line extra"><span>运营费内含：AI / 运输 / 保养</span><strong>¥${money(r.aiCost || 0)} / ¥${money(r.shipping || 0)} / ¥${money(r.repairs || 0)}</strong></div><div class="report-line extra"><span>外卖超时 / 收摊未履约</span><strong>${r.late || 0} / ${r.unfulfilled || 0}</strong></div><div class="report-line extra"><span>采购支出 / 设备投资（现金流）</span><strong>¥${money(r.purchases)} / ¥${money(r.equipment)}</strong></div><div class="report-line"><span>当前现金 / 今日现金变化</span><strong>¥${money(r.endCash)} / ${r.cashFlow >= 0 ? '+' : '−'}¥${money(Math.abs(r.cashFlow))}</strong></div></div><p class="report-note">经营利润按实际耗用与报废计算食材成本；采购与设备支出单列。目标和街区委托奖励单独计入现金，不混入餐食利润。</p><div class="modal-notice">${esc(E.advice(state))}</div><button class="primary-button modal-full-button" style="margin-top:20px" data-action="next-day">收好锅铲，准备下一天 ${icons('arrow')}</button>`);
    if(r.branch){
      $('modal-content').querySelector('.report-profit').insertAdjacentHTML('beforebegin',window.NoodleBranchUI.report(r));
      $('modal-content').querySelector('.report-profit span').textContent='主店经营利润 · 明细';
      $('modal-content').querySelector('.report-top .modal-desc').textContent=`第 ${r.day} 天 · 两店履约 ${r.totalServed} 碗 · 主店远程送达 ${r.delivered||0} 份`;
    }
    $('modal-content').insertAdjacentHTML('beforeend', '<div class="report-line extra"><span>街区委托奖励（独立收入）</span><strong>+ ¥'+money(r.districtRewards||0)+'</strong></div>'+ (state.district.status==='completed'?'<button class="primary-button modal-full-button" data-action="district-claim">街区委托已完成 · 领取奖励</button>':''));
    $('modal-content').insertAdjacentHTML('beforeend', `<div class="report-line extra"><span>堂食送达 / 收入 / 清桌</span><strong>${r.dineInServed||0} 份 / ¥${r.dineInRevenue||0} / ${r.tablesCleaned||0} 次</strong></div>`);
    $('modal-content').insertAdjacentHTML('beforeend', '<div class="report-line extra"><span>今日全部奖励（含目标与委托）</span><strong>+ ¥' + money(state.stats.rewards || 0) + '</strong></div><div class="report-quests">' + Object.entries(E.Growth.TASKS).map(([k,t]) => '<button class="growth-button" data-action="claim-task" data-value="'+k+'" '+(state.growth.claimed[k] || E.Growth.progress(state,k)<t.target ? 'disabled' : '')+'>'+t.name+' · '+(state.growth.claimed[k]?'奖励已领取':E.Growth.progress(state,k)>=t.target?'领取 ¥'+t.cash+' + '+t.points+'研发点':'尚未达成')+'</button>').join('') + '</div>');
  }
  function showHelp() {
    openModal('help', modalHead('科技小店经营手册', 'AI 调度 → 机器人出餐 → 无人机配送 → 送达回款。', 'help') + '<div class="tech-log"><p>1 采购，2 菜单，3 机器人，空格暂停。90 秒营业一天，可用 1–3 倍速。</p><p>AI 是游戏内决策与语言规则模拟，没有调用外部大模型。策略会改变排单顺序，预测随历史销量变化。</p><p>成长玩法：每日三项目标奖励现金与研发点。营业前可研究 AI 偏好、机器人减磨与无人机快充；座椅、暖光招牌、保温柜均有可见装修和永久效果。招牌餐每份 +¥1，研发奖励与餐食利润独立列账。</p><p>标准日费 ¥92；极速 +¥30，节能 −¥10，机器人 Pro +¥10。配送运费、AI 算力与保养都计入运营费用。</p><p>无人机有电量、往返时间、天气限制。送餐与补货共用运力；自取即出餐收款，外卖送达后收款。堂食客人落座后点单，服务机器人送到桌上才收款；用餐后留下空碗，清桌才能重新接待。</p><p>营业中刷新恢复到当天开店前。存档仅保存在当前浏览器，请导出备份。所有经营数值均为游戏设定。</p></div><div class="help-actions"><button class="secondary-button" data-action="export-save">导出存档</button><button class="secondary-button" data-action="import-save">导入存档</button><button class="secondary-button" data-action="tutorial">新手引导</button><button class="danger-button" data-action="new-game">重新开始</button></div><input type="file" id="import-file" accept=".json,application/json" hidden>');
  }

  function confirmDialog(kind, title, description, buttonText) {
    openModal(kind, modalHead(title, description, 'help') + `<div class="confirm-actions"><button class="secondary-button" data-action="cancel-confirm">取消，继续经营</button><button class="primary-button" data-action="${kind === 'confirm-close' ? 'confirm-close' : kind === 'confirm-import' ? 'confirm-import' : 'confirm-new'}">${buttonText}</button></div>`);
  }
  function showCorrupt() {
    openModal('corrupt', `<div class="modal-title-icon">${icons('save')}</div><h2 id="modal-title">这份存档暂时读不出来</h2><p class="modal-desc">存档内容损坏或版本不兼容。原始内容仍保留，你可以先导出备份，再创建新游戏。</p><div class="help-actions"><button class="secondary-button" data-action="export-save">备份原存档</button><button class="danger-button" data-action="new-game">确认后新建游戏</button></div>`);
  }
  function download(raw) {
    const blob = new Blob([raw], { type: 'application/json;charset=utf-8' }), url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = `赛博炒粉-第${state.day}天.json`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function transaction(result) {
    if (!result.ok) { toast(result.message, true); render(); return false; }
    save(); render(); if (result.message) toast(result.message); return true;
  }
  const actions = {
    branches(b) { showBranches(b?.dataset.value); },
    'branch-select'(b) { showBranches(b.dataset.value); },
    'branch-preview'() { openModal('branch-confirm',modalHead('确认第二家店的预算','开店投资从共享现金扣除，确认前再看一眼余额。','bowl')+window.NoodleBranchUI.confirmation(state)); },
    'branch-establish'(b) { if(transaction(E.Branch.establish(state,b.dataset.value))) {showBranches();tone('upgrade');} },
    'branch-recommend'() { for(const[k,n]of Object.entries(E.Branch.recommend(state).basket))$('branch-buy-'+k).value=n;window.NoodleBranchUI.updateBasket(); },
    'branch-purchase'() { if(transaction(E.Branch.purchase(state,window.NoodleBranchUI.basket())))showBranches(); },
    'branch-enabled'(b) { if(transaction(E.Branch.setEnabled(state,b.dataset.value==='on')))showBranches(); },
    'branch-refresh'() { showBranches(); },
    'branch-main'() { closeModal();window.Noodle3D?.view('front'); },
    'branch-visit'(b) { closeModal();window.Noodle3D?.view(b.dataset.value); },
    district(b) { showDistrict(b?.dataset.value||'overview'); },
    'district-tab'(b) { showDistrict(b.dataset.value); },
    'district-kitchen'() { showDistrict('kitchen'); },
    'district-park'() { showDistrict('park'); },
    'district-community'() { showDistrict('community'); },
    'district-camp'() { showDistrict('camp'); },
    'district-accept'(b) { if(transaction(E.District.accept(state,b.dataset.value))) showDistrict(b.dataset.value); },
    'district-clear'() { if(transaction(E.District.clear(state))) showDistrict('overview'); },
    'district-claim'() { if(transaction(E.District.claim(state))) { if(modalKind==='report')showReport();else showDistrict(window.NoodleDistrictUI.tab); } },
    'district-auto'() { state.drone.auto=!state.drone.auto;save();render();showDistrict(window.NoodleDistrictUI.tab); },
    'district-supply'(b) { if(transaction(E.requestSupply(state,b.dataset.value)))showDistrict('kitchen'); },
    'district-visit'(b) { closeModal();window.Noodle3D?.view(b.dataset.value==='kitchen'?'logistics':b.dataset.value); },

    dining() { openModal('dining', modalHead('堂食接待与服务', '让每一位食客，都吃上一碗热乎的粉。', 'robot') + window.NoodleDiningUI.panel(state)); },
    'dining-toggle'(b) { if(transaction(E.Dining.toggle(state,b.dataset.value))) actions.dining(); },
    'seat-party'(b) { if(transaction(E.Dining.seatParty(state,Number(b.dataset.value),Number(b.dataset.table)))) actions.dining(); },
    'clean-table'(b) { if(transaction(E.Dining.requestClean(state,Number(b.dataset.value)))) actions.dining(); },
    'service-policy'(b) { if(transaction(E.Dining.setPolicy(state,b.dataset.value))) actions.dining(); },
    'upgrade-service'() { if(transaction(E.Dining.upgradeServer(state))) actions.dining(); },
    'dining-guest'(b) { openModal('dining-guest',modalHead('街角食客','','leaf')+window.NoodleDiningUI.guestPanel(state,Number(b.dataset.value))); },
    growth() { openModal('growth', modalHead('小店成长日记', '', 'leaf') + window.NoodleGrowthUI.panel(state)); },
    'growth-tab'(b) { openModal('growth', modalHead('小店成长日记', '', 'leaf') + window.NoodleGrowthUI.panel(state,b.dataset.value)); },
    'claim-task'(b) { if(transaction(E.Growth.claim(state,b.dataset.value))) { if(modalKind==='growth') actions.growth(); else if(modalKind==='report') showReport(); } },
    research(b) { if(transaction(E.Growth.research(state,b.dataset.value))) actions.growth(); },
    decorate(b) { if(transaction(E.Growth.decorate(state,b.dataset.value))) { closeModal(); } },
    special(b) { if(transaction(E.Growth.special(state,b.dataset.value))) actions.growth(); },
    purchase: showPurchase, menu: showMenu, upgrade: showUpgrade, roadmap: showRoadmap, tutorial: showTutorial, help: showHelp, orders: showOrders,
    ai() { openModal('ai', modalHead('AI 决策中枢', '读懂需求，把合适的订单交给机器人。', 'brain') + window.NoodleTech.aiPanel(state)); },
    drone() { openModal('drone', modalHead('低空物流调度', '热餐与原料，共用一架无人机。', 'drone') + window.NoodleTech.dronePanel(state)); },
    'ai-mode'(b) { if(transaction(E.setAIMode(state,b.dataset.value))) actions.ai(); },
    'robot-mode'(b) { if(transaction(E.setRobotMode(state,b.dataset.value))) showUpgrade(); },
    'repair-robot'() { if(transaction(E.repairRobot(state))) showUpgrade(); },
    'upgrade-robot'() { if(transaction(E.upgradeRobot(state))) showUpgrade(); },
    'upgrade-drone'() { if(transaction(E.upgradeDrone(state))) actions.drone(); },
    'toggle-auto'() { state.drone.auto=!state.drone.auto;save();render();actions.drone(); },
    'dispatch-drone'(b) { if(transaction(E.dispatchDrone(state,Number(b.dataset.value)))) actions.drone(); },
    'dispatch-ground'(b) { if(transaction(E.dispatchGround(state,Number(b.dataset.value)))) actions.drone(); },
    supply(b) { if(transaction(E.requestSupply(state,b.dataset.value))) actions.drone(); },
    'forecast-purchase'() { showPurchase();actions.recommended(); },
    'analyze-demand'() { const d=E.analyzeDemand($('demand-text').value);$('demand-result').textContent=`${E.MENU[d.type].name} · ${d.tags.join(' / ')||'标准口味'} · 配方：${Object.entries(d.recipe).map(([k,n])=>E.INGREDIENTS[k].name+'×'+n).join('、')}`; },
    'close-modal': closeModal,
    sound() { sound = !sound; savePrefs(); renderSound(); if (sound) tone('sale'); toast(sound ? '音效已开启' : '音效已关闭'); },
    pause() {
      if (!['open', 'closing'].includes(state.phase)) return;
      state.paused = !state.paused; lastFrame = performance.now(); render();
    },
    speed() { speed = speed === 1 ? 2 : speed === 2 ? 3 : 1; render(); toast(`经营速度：${speed} 倍`); },
    open() {
      if (state.phase === 'report') { showReport(); return; }
      if (state.phase === 'open') { confirmDialog('confirm-close', '今天，就先营业到这里？', '停止接收新订单，完成正在制作的餐食、送餐、用餐与清桌任务。未开始制作的订单取消，生鲜按收摊规则报废。', '确认收摊'); return; }
      if (state.phase !== 'prep') return;
      const snapshot = E.clone(state), result = E.openDay(state);
      if (!result.ok) { toast(result.message, true); if (!state.inventory.noodles || !state.inventory.greens) showPurchase(); return; }
      safe = snapshot; previousServed = 0; previousPhase = 'open'; eventNotified = false; save(); render(); tone('click'); toast(result.message);
    },
    enqueue(button) { const result = E.enqueue(state, Number(button.dataset.id)); if (!result.ok) toast(result.message, true); else tone('click'); render(); },
    quantity(button) { const input = $(`buy-${button.dataset.key}`); input.value = Math.max(0, Math.min(999, (Number(input.value) || 0) + Number(button.dataset.delta))); updateBasket(); },
    recommended() {
      for (const [k, n] of Object.entries(E.forecast(state).basket)) $(`buy-${k}`).value = n;
      updateBasket();
    },
    'confirm-purchase'() { if (transaction(E.purchase(state, basket()))) { closeModal(); tone('click'); } },
    'save-menu'() {
      const next = E.clone(state);
      for (const key of Object.keys(E.MENU)) { const result = E.setPrice(next, key, Number($(`price-${key}`).value)); if (!result.ok) { toast(result.message, true); return; } }
      state.prices = next.prices; save(); closeModal(); toast('菜单已保存，等顾客来尝尝吧。');
    },
    'buy-robot'() {
      if (transaction(E.buyRobot(state))) { closeModal(); tone('upgrade'); openModal('achievement', `<div class="report-top"><div class="robot-portrait" style="margin:0 auto 18px">${icons('robot')}</div><h2 id="modal-title">小店，向未来迈了一步！</h2><p class="modal-desc">第 ${state.day} 天，你拥有了第一台炒粉机器人。${state.day <= 7 ? '七日小挑战达成！' : '每一次坚持，都算数。'}</p></div><div class="modal-notice">以后开店，阿炒 01 会自动接单，每份 2 秒出餐。记得留足 ¥80 运营费和食材预算。</div><button class="primary-button modal-full-button" style="margin-top:20px" data-action="close-modal">继续经营我的小店</button>`); }
    },
    'tutorial-start'() { tutorialSeen = true; savePrefs(); closeModal(); if (state.phase === 'prep' && !state.inventory.noodles) showPurchase(); },
    'next-day'() { dismissAll(); E.nextDay(state); previousServed = 0; previousPhase = 'prep'; eventNotified = false; save(); render(); toast(`第 ${state.day} 天，新的小目标从一碗粉开始。`); },
    'confirm-close'() { dismissAll(); E.closeDay(state); lastFrame = performance.now(); render(); handleTransitions(); },
    'cancel-confirm'() { if (corruptRaw !== null) showCorrupt(); else if (modalKind === 'confirm-import') showHelp(); else closeModal(); },
    'export-save'() { download(corruptRaw !== null ? corruptRaw : E.encodeSave(safe, ['open', 'closing'].includes(state.phase))); toast('存档备份已导出。'); },
    'import-save'() { $('import-file').click(); },
    'new-game'() { confirmDialog('confirm-new', '重新开始一间小店？', '这会覆盖当前浏览器中的游戏存档。建议先导出备份；取消则保留现有进度。', '确认重新开始'); },
    'confirm-new'() { corruptRaw = null; state = E.createFutureState(); safe = E.clone(state); dismissAll(); previousServed = 0; previousPhase = 'prep'; lastOrderSignature = ''; lastCustomerSignature = ''; speed = 1; eventNotified = false; save(); render(); showTutorial(); },
    'confirm-import'() {
      if (!pendingImport) return;
      state = pendingImport.state; if(!state.future) E.enableFuture(state); safe = E.clone(state); const restored = pendingImport.wasOpen; pendingImport = null; corruptRaw = null;
      previousServed = state.stats.served; previousPhase = state.phase; lastOrderSignature = ''; lastCustomerSignature = ''; eventNotified = false;
      dismissAll(); save(); render(); toast(restored ? '已读取营业前存档，今天可以重新开张。' : '存档已恢复。'); if (state.phase === 'report') showReport();
    }
  };
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-action]');
    if (button && !button.disabled && actions[button.dataset.action]) actions[button.dataset.action](button);
    if (event.target === $('modal-backdrop') && !['report', 'corrupt', 'confirm-new', 'confirm-import', 'confirm-close'].includes(modalKind)) closeModal();
  });
  document.addEventListener('input', event => { if (event.target.id.startsWith('buy-')) updateBasket(); if(event.target.id.startsWith('branch-buy-')) window.NoodleBranchUI.updateBasket(); });
  document.addEventListener('change', async event => {
    if (event.target.id !== 'import-file' || !event.target.files.length) return;
    const file = event.target.files[0]; if (file.size > 1000000) { toast('存档文件过大，请选择本游戏导出的 JSON。', true); return; }
    try {
      const result = E.decodeSave(await file.text());
      if (!result.ok) { toast(result.message, true); event.target.value = ''; return; }
      pendingImport = result; confirmDialog('confirm-import', '读取这份小店存档？', `将切换到第 ${result.state.day} 天、现金 ¥${money(result.state.cash)} 的进度，并覆盖当前本地存档。`, '确认读取');
    } catch (_) { toast('文件读取失败，请重新选择存档。', true); }
  });
  document.addEventListener('keydown', event => {
    if (modalKind) {
      if (event.key === 'Escape') { event.preventDefault(); if (modalKind.startsWith('confirm-')) actions['cancel-confirm'](); else closeModal(); }
      if (event.key === 'Tab') {
        const elements = Array.from($('modal').querySelectorAll('button:not(:disabled), input:not(:disabled):not([hidden])')).filter(el => el.offsetParent !== null);
        if (!elements.length) return;
        const first = elements[0], last = elements[elements.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
      return;
    }
    if (['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A'].includes(event.target.tagName)) return;
    if (event.code === 'Space') { event.preventDefault(); actions.pause(); }
    if (event.key === '1') showPurchase(); if (event.key === '2') showMenu(); if (event.key === '3') showUpgrade();
  });
  document.addEventListener('visibilitychange', () => {
    lastFrame = performance.now();
    if (document.hidden && ['open', 'closing'].includes(state.phase)) { state.paused = true; modalPaused = false; render(); }
  });
  function handleTransitions() {
    if (state.stats.served > previousServed) {
      const diff = state.stats.revenue - (handleTransitions.lastRevenue || 0);
      const float = document.createElement('div'); float.className = 'coin-float'; float.textContent = `+ ¥${money(Math.max(0, diff))}`;
      $('float-layer').appendChild(float); setTimeout(() => float.remove(), 1600); tone('sale'); previousServed = state.stats.served;
    }
    handleTransitions.lastRevenue = state.stats.revenue;
    if (state.phase === 'report' && previousPhase !== 'report') { previousPhase = 'report'; save(); render(); showReport(); }
    else previousPhase = state.phase;
  }
  function frame(now) {
    const dt = Math.min(.2, Math.max(0, (now - lastFrame) / 1000)); lastFrame = now;
    if (!document.hidden) E.tick(state, dt * speed);
    handleTransitions();
    if (now - renderAt >= 140) { render(); renderAt = now; }
    requestAnimationFrame(frame);
  }
  renderSound(); render();
  if (storageBlocked) { $('save-status').textContent = '当前无法写入存档'; setTimeout(() => toast('浏览器未开放本地存储，可在帮助中手动导出存档。', true), 500); }
  if (corruptRaw !== null) showCorrupt();
  else if (state.phase === 'report') showReport();
  else if (!tutorialSeen) showTutorial();
  requestAnimationFrame(frame);
})();
