(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.NoodleEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const Growth = typeof module === 'object' && module.exports ? require('./growth.js') : globalThis.NoodleGrowth;
  const Dining = typeof module === 'object' && module.exports ? require('./dining.js') : globalThis.NoodleDining;
  const District = typeof module === 'object' && module.exports ? require('./district.js') : globalThis.NoodleDistrict;
  const Branch = typeof module === 'object' && module.exports ? require('./branch.js') : globalThis.NoodleBranch;
  const Town = typeof module === 'object' && module.exports ? require('./town-play.js') : globalThis.NoodleTownPlay;
  const Residents = typeof module === 'object' && module.exports ? require('./resident-life.js') : globalThis.NoodleResidents;
  const Sources = typeof module === 'object' && module.exports ? require('./source-ledger.js') : globalThis.NoodleSources;
  const Relationships = typeof module === 'object' && module.exports ? require('./resident-relationships.js') : globalThis.NoodleRelationships;
  const Commissions = typeof module === 'object' && module.exports ? require('./resident-commissions.js') : globalThis.NoodleCommissions;
  const Events = typeof module === 'object' && module.exports ? require('./town-events.js') : globalThis.NoodleTownEvents;
  const INGREDIENTS = {
    noodles: { name: '鲜米粉', price: 2, perishable: false, color: '#e9c785' },
    greens: { name: '时令青菜', price: 1, perishable: true, color: '#78a87c' },
    egg: { name: '鸡蛋', price: 2, perishable: false, color: '#edb854' },
    beef: { name: '鲜切牛肉', price: 5, perishable: true, color: '#c98776' }
  };
  const MENU = {
    plain: { name: '招牌原味炒粉', short: '原味', base: 12, recipe: { noodles: 1, greens: 1 }, color: '#d39542' },
    egg: { name: '金黄鸡蛋炒粉', short: '鸡蛋', base: 15, recipe: { noodles: 1, greens: 1, egg: 1 }, color: '#e6ad36' },
    beef: { name: '招牌牛肉炒粉', short: '牛肉', base: 20, recipe: { noodles: 1, greens: 1, beef: 1 }, color: '#bc7765' }
  };
  const ROUTES = {
    park: { name: '科技园', seconds: 6, battery: 20, fee: 3, premium: 6, x: 135, y: 80 },
    community: { name: '创客社区', seconds: 9, battery: 28, fee: 4, premium: 9, x: 820, y: 135 },
    camp: { name: '江畔营地', seconds: 12, battery: 36, fee: 5, premium: 12, x: 65, y: 320 }
  };
  Branch.configure(INGREDIENTS, MENU);
  Events.configure(MENU,ROUTES);
  const SUPPLIES = { basic: { name: '米粉青菜包', basket: { noodles: 8, greens: 8 } }, protein: { name: '鸡蛋牛肉包', basket: { egg: 4, beef: 4 } } };
  const EXTRA_LEDGER = { rewards: 0, aiCost: 0, shipping: 0, repairs: 0, delivered: 0, deliveryRevenue: 0, droneFlights: 0, aiAssignments: 0, late: 0, unfulfilled: 0, plainServed: 0, eggServed: 0, beefServed: 0, districtDelivered:0,districtRewards:0,commissionRewards:0,dineInServed:0, dineInRevenue:0, diningGuests:0, diningAbandoned:0, diningLate:0, tablesCleaned:0 };
  const clone = value => JSON.parse(JSON.stringify(value));
  const ok = (message) => ({ ok: true, message: message || '' });
  const no = message => ({ ok: false, message });
  const money = n => Math.round(n * 100) / 100;
  function ledger(cash) {
    return { startCash: cash, revenue: 0, cogs: 0, waste: 0, operating: 0, purchases: 0, equipment: 0, served: 0, lost: 0, shortage: 0, ...EXTRA_LEDGER };
  }
  function createState(seed) {
    const state = { version: 1, day: 1, cash: 800, reputation: 80, inventory: { noodles: 0, greens: 0, egg: 0, beef: 0 },
      prices: { plain: 12, egg: 15, beef: 20 }, robot: false, phase: 'prep', elapsed: 0, paused: false,
      orders: [], current: null, sequence: 0, seed: (seed >>> 0) || 23571, arrivalIn: 1.2,
      event: null, stats: ledger(800), history: [], totalServed: 0, lastReport: null, achievementDay: null,
      branch: null, future: false, aiMode: 'manual', aiLog: [], robotMode: 'standard', robotHealth: 100, robotLevel: 1,
      drone: { owned: false, level: 1, battery: 100, auto: false, mission: null }, readyDeliveries: [], totalDelivered: 0,
      remoteIn: 4, weather: 'clear', growth: Growth.initial(), dining: Dining.create(), district: District.initial() };
    state.businessVersion=1;state.sourceLedger=Sources.create(state.day);state.residentLife=Residents.create();state.relationships=Relationships.create(state);Town.ensure(state);state.commissions=Commissions.create(state);state.townEvents=Events.create(state); return state;
  }
  function enableFuture(s) {
    if(Town.ensure(s).terminal)return no('本局已结束。');
    s.future = true; s.robot = true; s.aiMode = s.aiMode === 'manual' ? 'balanced' : s.aiMode;
    s.drone.owned = true; s.achievementDay = s.achievementDay || s.day;
    Dining.ensure(s).enabled=true;
    return ok('科技试运营已接入：基础机器人、AI 调度和无人机就绪，原资产全部保留。');
  }
  function createFutureState(seed) { const s = createState(seed); enableFuture(s); return s; }
  function analyzeDemand(text) {
    const clean = String(text || '').slice(0, 160);
    const noBeef = /不要牛肉|不吃牛肉|不加牛肉/.test(clean);
    const type = /牛肉/.test(clean) && !noBeef ? 'beef' : /鸡蛋|蛋粉/.test(clean) ? 'egg' : 'plain';
    const recipe = { ...MENU[type].recipe }, tags = [];
    if (/鸡蛋加量|多加.*蛋|双蛋/.test(clean)) { recipe.egg = (recipe.egg || 0) + 1; tags.push('鸡蛋加量'); }
    if (/多加青菜|青菜加量/.test(clean)) { recipe.greens++; tags.push('青菜加量'); }
    if (/不辣|不要辣/.test(clean)) tags.push('不辣'); else if (/少辣|微辣/.test(clean)) tags.push('少辣');
    const urgent = /赶时间|着急|快一点|加急/.test(clean); if (urgent) tags.push('加急');
    if (noBeef) tags.push('不加牛肉');
    return { type, recipe, tags, urgent, text: clean };
  }
  const recipeFor = order => order.recipe || MENU[order.type].recipe;
  const ingredientCost = recipe => Object.entries(recipe).reduce((sum, [k, n]) => sum + INGREDIENTS[k].price * n, 0);
  function logAI(s, message) { s.aiLog.unshift(message); s.aiLog = s.aiLog.slice(0, 5); }
  function setAIMode(s, mode) {
    if(Town.ensure(s).terminal)return no('本局已结束。');
    if (!['manual', 'balanced', 'profit', 'speed'].includes(mode)) return no('请选择有效的 AI 调度策略。');
    if (mode !== 'manual' && ['open', 'closing'].includes(s.phase) && !s.stats.aiCost) {
      if (s.cash < 12) return no('启用 AI 需要 ¥12 当日算力费用。');
      s.cash -= 12; s.stats.aiCost += 12; s.stats.operating += 12;
    }
    s.aiMode = mode; logAI(s, `已切换为${{manual:'手动接单',balanced:'均衡调度',profit:'利润优先',speed:'时效优先'}[mode]}`); return ok('AI 调度策略已更新。');
  }
  function forecast(s) {
    const r = s.lastReport, historical = r && r.served >= 6;
    const counts = historical ? [r.plainServed || 0, r.eggServed || 0, r.beefServed || 0] : [1, 1, 1];
    const total = counts.reduce((a,b) => a+b,0) || 3;
    const target = s.future ? Math.min(36, Math.max(27, historical ? Math.ceil(r.served * 1.12) : 30)) : 21;
    const demand = Object.fromEntries(Object.keys(MENU).map((k, i) => [k, Math.max(2, Math.round(target * (counts[i] || 1) / total))]));
    const desired = { noodles: Object.values(demand).reduce((a,b)=>a+b,0), greens: Object.values(demand).reduce((a,b)=>a+b,0), egg: demand.egg+2, beef: demand.beef };
    const basket = Object.fromEntries(Object.entries(desired).map(([k,n])=>[k,Math.max(0,n-s.inventory[k])]));
    return { demand, basket, target, cost: ingredientCost(basket), basis: historical ? `按第 ${r.day} 天已履约餐品结构，增加 12% 需求余量` : '冷启动预测：覆盖现场与三个远程点位，后续按真实销量调整', confidence: historical ? '有历史数据' : '冷启动估计' };
  }
  function setRobotMode(s, mode) {
    if(Town.ensure(s).terminal)return no('本局已结束。');
    if (s.phase !== 'prep') return no('机器人模式在营业前设置，下一批次开店生效。');
    if (!['standard','turbo','eco'].includes(mode)) return no('请选择有效的机器人模式。');
    s.robotMode = mode; return ok('机器人工作模式已更新。');
  }
  function repairRobot(s) {
    if(Town.ensure(s).terminal)return no('本局已结束。');
    if (!s.robot || s.robotHealth >= 100) return no('机器人状态良好，无需维修。');
    if (s.phase === 'report') return no('先准备下一天，再进行维修。');
    if (s.cash < 35) return no('维修需要 ¥35，请留足现金。');
    s.cash -= 35; s.stats.repairs += 35; s.stats.operating += 35; s.robotHealth = 100;
    return ok('保养完成，机器人耐久恢复到 100%。');
  }
  function upgradeRobot(s) {
    if(Town.ensure(s).terminal)return no('本局已结束。');
    if (s.phase !== 'prep' || !s.robot || s.robotLevel >= 2) return no('请在营业前升级尚未达到 Pro 的机器人。');
    if (s.cash < 600) return no('升级机器人 Pro 需要 ¥600。');
    s.cash -= 600; s.stats.equipment += 600; s.robotLevel = 2; Town.ensure(s).paidRobotUpgrade=true; return ok('机器人 Pro 已就绪，制作速度提升 25%。');
  }
  function upgradeDrone(s) {
    if(Town.ensure(s).terminal)return no('本局已结束。');
    if (s.phase !== 'prep' || !s.drone.owned || s.drone.level >= 2) return no('请在营业前升级尚未达到 Pro 的无人机。');
    if (s.cash < 500) return no('升级无人机 Pro 需要 ¥500。');
    s.cash -= 500; s.stats.equipment += 500; s.drone.level = 2; Town.ensure(s).paidDroneUpgrade=true; return ok('无人机 Pro 已就绪，航时缩短 25%、任务耗电减少 20%。');
  }
  function random(s) { s.seed = (Math.imul(1664525, s.seed) + 1013904223) >>> 0; return s.seed / 4294967296; }
  function purchase(s, basket) {
    if(Town.ensure(s).terminal)return no('本局已结束。');
    if (s.phase !== 'prep') return no('营业前才能采购，先完成今天的营业吧。');
    if (!basket || typeof basket !== 'object' || Array.isArray(basket)) return no('采购数量不正确。');
    const entries = Object.entries(basket);
    if (!entries.length || entries.some(([k, v]) => !Object.hasOwnProperty.call(INGREDIENTS, k) || !Number.isInteger(v) || v < 0 || v > 999)) return no('请输入 0–999 的整数份数。');
    const cost = entries.reduce((sum, [k, v]) => sum + INGREDIENTS[k].price * v, 0);
    if (cost <= 0) return no('先选择要采购的食材。');
    if (cost > s.cash) return no('现金不足，减少一些采购数量吧。');
    s.cash = money(s.cash - cost); s.stats.purchases += cost;
    entries.forEach(([k, v]) => { s.inventory[k] += v; });
    return ok(`食材已送达，支出 ¥${cost}`);
  }
  function setPrice(s, type, price) {
    if(Town.ensure(s).terminal)return no('本局已结束。');
    if (s.phase !== 'prep') return no('营业期间价格已锁定，明天再调整。');
    const item = MENU[type];
    if (!item || !Number.isInteger(price) || price < Math.ceil(item.base * .8) || price > Math.floor(item.base * 1.2)) return no('售价超出了菜单允许范围。');
    s.prices[type] = price; return ok();
  }
  function openingFees(s) {
    const robotExtra = s.robot && s.future ? (s.robotMode === 'turbo' ? 30 : s.robotMode === 'eco' ? -10 : 0) + (s.robotLevel > 1 ? 10 : 0) : 0;
    const aiFee = s.aiMode !== 'manual' ? 12 : 0;
    const main = (s.robot ? 80 : 60) + robotExtra + aiFee, branch=Branch.fee(s);
    return {main, branch, total:main+branch, aiFee};
  }
  function openDay(s) {
    if(Town.ensure(s).terminal)return no('本局已完成破产清算，请开始新游戏。');
    if (s.phase !== 'prep') return no('今天已经开店了。');
    if(Town.ensure(s).branchSold&&s.branch)s.branch.enabled=false;
    if(!Town.solvency(s).viable){Town.liquidate(s);return no('资产回收后仍无法营业，本局已完成清算。');}
    const {main:fee,total:totalFee,aiFee}=openingFees(s);
    if (s.cash < totalFee) return no(`开店需要预留 ¥${totalFee} 运营费（主店 ¥${fee}，分店 ¥${Branch.fee(s)}），请减少采购或安排分店休息。`);
    if (s.inventory.noodles < 1 || s.inventory.greens < 1) return no('先采购鲜米粉和青菜，再开始营业。');
    Branch.open(s);
    s.cash -= fee; s.stats.operating += fee; s.stats.aiCost += aiFee; s.phase = 'open'; s.elapsed = 0; s.paused = false;
    Dining.reset(s);
      s.orders = []; s.current = null; s.arrivalIn = 1.2; s.closingElapsed = 0;
    s.readyDeliveries = []; s.remoteIn = 4; s.weather = s.day % 5 === 0 ? 'storm' : s.day % 3 === 0 ? 'gust' : 'clear';
    Sources.open(s);
    Commissions.open(s);
    Events.open(s);
    if(s.town.reservation.day===s.day)for(const p of s.town.reservation.profiles||[])Relationships.begin(s,{...p,patience:30},true);
    s.event = !s.townEvents && s.day > 1 && s.day % 3 !== 1 ? {
      kind: s.day % 3 === 2 ? 'rush' : 'influencer', title: s.day % 3 === 2 ? '午餐高峰' : '网红探店',
      description: s.day % 3 === 2 ? '附近公司午休啦，接下来顾客来得更快！' : '有人推荐了你的小店，口碑提升，顾客也更多了！', start: 25, end: 55
    } : null;
    return ok(s.future ? '空地联动已启动！AI 派单、机器人制作，远程餐请在无人机控制台派送。' : '开门大吉！点击左侧订单，就能开始炒粉。');
  }
  function available(s, key) {
    return s.inventory[key] - s.orders.filter(o => o.status === 'queued').reduce((v, o) => v + (recipeFor(o)[key] || 0), 0);
  }
  function canMake(s, type) {
    return !!MENU[type] && Object.entries(MENU[type].recipe).every(([k, n]) => available(s, k) >= n);
  }
  function canMakeOrder(s, order) { return Object.entries(recipeFor(order)).every(([k,n]) => available(s,k) >= n); }
  function enqueue(s, id) {
    if (s.phase !== 'open' || s.paused) return no(s.paused ? '先继续营业，再接单。' : '现在不在营业时间。');
    const order = s.orders.find(o => o.id === id);
    if (!order || order.status !== 'waiting') return no('这张订单已经安排了。');
    if (!canMakeOrder(s, order)) {
      if (!order.shortageSeen) { order.shortageSeen = true; s.stats.shortage++; }
      return no('食材不足，无法制作这份餐。下次开店前多备一点吧。');
    }
    order.status = 'queued'; return ok('已安排制作');
  }
  function startCooking(s) {
    if (s.current) return;
    const at = s.orders.findIndex(o => o.status === 'queued');
    if (at < 0) return;
    const order = s.orders.splice(at, 1)[0];
    for (const [k, n] of Object.entries(recipeFor(order))) {
      s.inventory[k] -= n; s.stats.cogs += n * INGREDIENTS[k].price;
    }
    const robotUsed = s.robot && s.robotHealth > 0;
    let duration = robotUsed ? ({standard:2,turbo:1.2,eco:3}[s.robotMode] || 2) * (s.robotLevel > 1 ? .75 : 1) : 4;
    s.current = { ...order, status: 'cooking', progress: 0, duration, robotUsed, wear: s.robotMode === 'turbo' ? 3 : s.robotMode === 'eco' ? .5 : 1 };
  }
  function collect(s, order, remote) {
    let price = order.price || s.prices[order.type];
    const growth = Growth.ensure(s);
    if(!order.lockedPrice && s.future && growth.special === order.type) price += 1;
    if(!order.lockedPrice && s.future && order.preferenceMatch && s.aiMode!=='manual') price += growth.research.ai;
    if(order.channel==='dinein')price=money(price*(order.serviceDiscount||1));
    if (remote && s.elapsed + (s.closingElapsed || 0) - (order.createdAt || 0) > (order.deadline || 42) + (growth.decor.warmer ? 8 : 0)) { price = money(price * .8); s.stats.late++; s.reputation = Math.max(0,s.reputation-1); }
    if(!Sources.paid(s,order,price))return;
    s.cash = money(s.cash + price); s.stats.revenue = money(s.stats.revenue + price);
    s.stats.served++; s.totalServed++; s.stats[`${order.type}Served`]++;
    Town.served(s,order,remote);
    if(!remote){Residents.served(s,order);Relationships.paid(s,order,price);}
    Commissions.paid(s,order,price);
    if (remote) { s.stats.delivered++; s.totalDelivered++; s.stats.deliveryRevenue = money(s.stats.deliveryRevenue+price); }
    if(order.channel==='dinein'){s.stats.dineInServed++;s.stats.dineInRevenue=money(s.stats.dineInRevenue+price);if(order.serviceDiscount<1)s.reputation=Math.max(0,money(s.reputation-.8));}
    s.reputation = Math.min(100, money(s.reputation + .25));
  }
  function completeCooking(s) {
    const order = s.current;
    if (!order) return;
    if (order.robotUsed) s.robotHealth = Math.max(0, money(s.robotHealth - order.wear * (1 - Growth.ensure(s).research.robot * .2)));
    if (order.channel === 'delivery') s.readyDeliveries.push({ ...order, status: 'ready', readyAt: s.elapsed });
    else if(order.channel==='dinein')Dining.ready(s,order);
    else collect(s,order,false);
    s.current = null;
  }
  function routeInfo(s, destination) {
    const route = ROUTES[destination] || ROUTES.park, wind = s.weather === 'gust' ? 1.4 : 1;
    return { ...route, destination, seconds: money(route.seconds * wind * (s.drone.level > 1 ? .75 : 1)), battery: Math.ceil(route.battery * (s.weather === 'gust' ? 1.25 : 1) * (s.drone.level > 1 ? .8 : 1)) };
  }
  function chargeTransport(s, fee) { s.cash -= fee; s.stats.shipping += fee; s.stats.operating += fee; }
  function dispatchDrone(s, id) {
    if(Town.ensure(s).terminal)return no('本局已结束。');
    if (!['open','closing'].includes(s.phase)) return no('请在营业期间派送。');
    if (!s.drone.owned) return no('无人机尚未接入。');
    if (s.drone.mission) return no('无人机正在执行任务，请等待返航。');
    if (s.weather === 'storm') return no('雷雨停飞，请选择地面配送。');
    const at = s.readyDeliveries.findIndex(o => o.id === id); if (at < 0) return no('这份餐尚未做好，或已经派送。');
    const order = s.readyDeliveries[at], route = routeInfo(s,order.destination);
    if (s.drone.battery < route.battery) return no(`电量不足，本次往返需要 ${route.battery}%，待机可自动充电。`);
    if (s.cash < route.fee) return no('现金不足以支付本次配送费。');
    chargeTransport(s,route.fee); s.drone.battery = money(s.drone.battery-route.battery); s.stats.droneFlights++;
    s.readyDeliveries.splice(at,1); s.drone.mission = { kind:'delivery', order, destination:order.destination, progress:0, outbound:route.seconds, duration:route.seconds*1.5, delivered:false, vehicle:'drone' };
    return ok(`无人机已飞往${route.name}，约 ${route.seconds} 秒送达。`);
  }
  function dispatchGround(s, id) {
    if(Town.ensure(s).terminal)return no('本局已结束。');
    if (!['open','closing'].includes(s.phase)) return no('请在营业期间派送。');
    if (s.drone.mission) return no('当前运输任务尚未完成，请稍后安排备用配送。');
    const at = s.readyDeliveries.findIndex(o=>o.id===id); if(at<0) return no('没有这份待配送餐食。');
    if (s.cash<8) return no('地面配送需要 ¥8。');
    const order=s.readyDeliveries.splice(at,1)[0]; chargeTransport(s,8);
    s.drone.mission={kind:'delivery',order,destination:order.destination,progress:0,outbound:18,duration:18,delivered:false,vehicle:'ground'};
    return ok('已安排地面备用配送：18 秒送达，费用 ¥8。');
  }
  function requestSupply(s, pack) {
    if(Town.ensure(s).terminal)return no('本局已结束。');
    if (s.phase !== 'open') return no('应急补货在营业期间使用，开店前可直接采购。');
    if (!SUPPLIES[pack]) return no('请选择有效的补货包。');
    if (!s.drone.owned || s.drone.mission) return no('无人机未就绪或正在执行其他任务。');
    if (s.weather === 'storm') return no('雷雨停飞，无法发起空中补货。');
    const battery=s.drone.level>1?16:20, cost=ingredientCost(SUPPLIES[pack].basket);
    if(s.drone.battery<battery) return no('电量不足，应急补货需要等待充电。');
    if(s.cash<cost+3) return no('资金不足以购买食材并支付 ¥3 运费。');
    s.cash-=cost; s.stats.purchases+=cost; chargeTransport(s,3); s.drone.battery-=battery; s.stats.droneFlights++;
    s.drone.mission={kind:'supply',pack,progress:0,duration:(s.drone.level>1?6:8)*(s.weather==='gust'?1.4:1),vehicle:'drone',destination:'kitchen'};
    return ok('中央厨房已出库，食材在无人机到达后入仓。');
  }
  function transportStep(s,dt) {
    const mission=s.drone.mission;
    if(!mission){s.drone.battery=Math.min(100,money(s.drone.battery+dt*(5+Growth.ensure(s).research.drone*2)));return;}
    mission.progress+=dt;
    if(mission.kind==='delivery' && !mission.delivered && mission.progress+.000001>=mission.outbound){collect(s,mission.order,true);District.onDelivered(s,mission.order,mission.vehicle);mission.delivered=true;logAI(s,`${ROUTES[mission.destination].name}订单送达，完成回款`);}
    if(mission.progress+.000001>=mission.duration){
      if(mission.kind==='supply') for(const[k,n]of Object.entries(SUPPLIES[mission.pack].basket))s.inventory[k]+=n;
      s.drone.mission=null;
    }
  }
  function autoDispatch(s,closing) {
    if(s.drone.mission || !s.readyDeliveries.length)return;
    if(!closing && !s.drone.auto)return;
    const sorted=s.readyDeliveries.slice().sort((a,b)=> s.aiMode==='profit' ? (b.price-ROUTES[b.destination].fee)-(a.price-ROUTES[a.destination].fee) : a.readyAt-b.readyAt);
    if(District.active(s))sorted.sort((a,b)=>Number(b.districtContract===District.contractId(s))-Number(a.districtContract===District.contractId(s)));
    const result=dispatchDrone(s,sorted[0].id);
    if(!result.ok && (closing || s.weather==='storm')){
      const fallback=dispatchGround(s,sorted[0].id);
      if(!fallback.ok && closing){s.readyDeliveries.shift();s.stats.unfulfilled++;s.stats.lost++;}
    }
  }
  function settle(s) {
    if (s.phase === 'report') return;
    for (const [k, item] of Object.entries(INGREDIENTS)) {
      if (item.perishable) { s.stats.waste += s.inventory[k] * item.price; s.inventory[k] = 0; }
    }
    Branch.settle(s);
    s.phase = 'report'; s.paused = false; s.orders = []; District.settle(s);
    s.lastReport = { day: s.day, ...clone(s.stats), profit: money(s.stats.revenue - s.stats.cogs - s.stats.waste - s.stats.operating),
      endCash: s.cash, cashFlow: money(s.cash - s.stats.startCash) };
    s.lastReport.branch = s.branch ? clone(s.branch.lastReport) : null;
    s.lastReport.totalProfit = money(s.lastReport.profit + (s.lastReport.branch?.profit || 0));
    s.lastReport.totalRevenue = money(s.lastReport.revenue + (s.lastReport.branch?.revenue || 0));
    s.lastReport.totalServed = s.lastReport.served + (s.lastReport.branch?.served || 0);
    Town.settled(s);
    Commissions.finish(s);const commissions=Commissions.report(s);if(commissions)s.lastReport.commissions=commissions;
    Relationships.finish(s);const relationships=Relationships.report(s);if(relationships)s.lastReport.relationships=relationships;
    Sources.finish(s);const sources=Sources.report(s);if(sources){s.lastReport.sources=sources;s.stats.lost=sources.rows.slice(0,5).reduce((n,r)=>n+r.lost,0);s.lastReport.lost=s.stats.lost;}
    Events.finish(s);const townEvents=Events.report(s);if(townEvents)s.lastReport.townEvents=townEvents;
    s.history.push(clone(s.lastReport)); if (s.history.length > 30) s.history.shift();
    if(!Town.solvency(s).viable)Town.liquidate(s);
  }
  function closeDay(s) {
    if (!['open', 'closing'].includes(s.phase)) return no('今天尚未开始营业，或已经结算。');
    s.phase = 'closing'; s.paused = false;for(const o of s.orders){Sources.lost(s,o,'closed');Relationships.fail(s,o,'closed');Commissions.lost(s,o);}Dining.close(s); Branch.close(s); s.orders = [];
    autoDispatch(s,true);
    if (!s.current && !s.drone.mission && !s.readyDeliveries.length && !Dining.hasWork(s) && !Branch.hasWork(s)) settle(s);
    return ok('正在完成锅里这一份，随后收摊结算。');
  }
  function arrive(s) {
    if (s.orders.length >= 5) { s.stats.lost++;Sources.reject(s,'street','queue');return; }
    if(s.future){
      const profile=Growth.CUSTOMERS[Math.floor(random(s)*4)],resident=s.sequence%2===0?Residents.choose(s):null,type=resident?resident.type:random(s)<.75?profile.type:Object.keys(MENU)[Math.floor(random(s)*3)];
      const markup=s.prices[type]/MENU[type].base-1;
      const priceRejected=random(s)>Math.max(.45,1-markup*1.8);
      if(priceRejected&&!resident){Sources.reject(s,'street','price');return;}
      const offer={id:++s.sequence,type,status:'waiting',age:0,patience:profile.patience+(Growth.ensure(s).decor.bench?5:0),price:s.prices[type],person:Growth.CUSTOMERS.indexOf(profile),customer:profile.name,text:profile.line,preferenceMatch:type===profile.type,tags:[profile.name,type===profile.type?'偏好餐品':'换个口味']};
      if(resident){const total=s.prices[type]+(Growth.ensure(s).special===type?1:0)+(s.aiMode!=='manual'?Growth.ensure(s).research.ai:0);if(total>resident.budget){Sources.reject(s,Sources.classify({residentId:resident.id}),'price');Relationships.fail(s,{residentId:resident.id,type},'price');return;}Object.assign(offer,{residentId:resident.id,customer:resident.name,person:resident.id%4,patience:resident.patience,text:resident.role+' · '+resident.purpose,tags:[resident.role,'小镇居民'],preferenceMatch:true});Relationships.begin(s,offer);}
      if(Dining.ensure(s).enabled&&offer.id%4!==1)Dining.arrive(s,offer,resident?'solo':undefined);else{Sources.track(s,offer);s.orders.push({...offer,channel:'takeout'});}
      return;
    }
    const types = Object.keys(MENU), type = types[Math.floor(random(s) * types.length)];
    const markup = s.prices[type] / MENU[type].base - 1;
    if (random(s) > Math.max(.45, 1 - markup * 1.8)){Sources.reject(s,'street','price');return;}
    const offer={ id: ++s.sequence, type, status: 'waiting', age: 0, patience: 22 + random(s) * 10,
      price: s.prices[type], person: Math.floor(random(s) * 5) };Sources.track(s,offer);s.orders.push(offer);
  }
  function remoteArrive(s) {
    if(s.orders.filter(o=>o.channel==='delivery').length+s.readyDeliveries.length>=4){Sources.reject(s,'delivery','queue');return;}
    const randomDestination=Object.keys(ROUTES)[Math.floor(random(s)*3)],commission=District.active(s)&&!s.district.group,destination=commission?s.district.selected:randomDestination;
    const requests=['原味炒粉，少辣','来份鸡蛋炒粉，鸡蛋加量','我赶时间，牛肉炒粉微辣','不要牛肉，来份鸡蛋炒粉','原味炒粉，多加青菜'];
    const parsed=analyzeDemand(requests[Math.floor(random(s)*requests.length)]);
    const extras=ingredientCost(parsed.recipe)-ingredientCost(MENU[parsed.type].recipe);
    const order={id:++s.sequence,...parsed,channel:'delivery',destination,districtContract:commission?District.contractId(s):null,status:'waiting',age:0,patience:parsed.urgent?22:32,deadline:parsed.urgent?32:45,createdAt:s.elapsed,price:s.prices[parsed.type]+ROUTES[destination].premium+extras+ (extras>0?1:0)};
    Sources.track(s,order);s.orders.push(order);if(s.aiMode!=='manual')logAI(s,`识别「${parsed.text}」→ ${MENU[parsed.type].short}粉${parsed.tags.length?' · '+parsed.tags.join(' / '):''}`);
  }
  function aiQueue(s) {
    if(s.aiMode==='manual')return;
    s.orders.sort((a,b)=>{
      if(s.aiMode==='profit')return ((b.price||s.prices[b.type])-ingredientCost(recipeFor(b)))-((a.price||s.prices[a.type])-ingredientCost(recipeFor(a)));
      if(s.aiMode==='speed')return (a.patience-a.age)-(b.patience-b.age);
      return b.age-a.age;
    });
    for(const o of s.orders)if(o.status==='waiting' && canMakeOrder(s,o)){o.status='queued';s.stats.aiAssignments++;}
  }
  function step(s, dt) {
    if (s.phase === 'closing') s.closingElapsed = (s.closingElapsed || 0) + dt;
    if (s.phase === 'open') {
      s.elapsed = Math.min(90, s.elapsed + dt);
      if (s.elapsed >= 90) closeDay(s);
    }
    if (!['open', 'closing'].includes(s.phase)) return;
    Commissions.step(s);
    Branch.step(s,dt);
    transportStep(s,dt);
    if (s.phase === 'open') {
      s.orders.forEach(o => { o.age += dt; });
      const lost = s.orders.filter(o => o.age >= o.patience).length;
      s.orders.filter(o=>o.age>=o.patience).forEach(o=>{Sources.lost(s,o,'timeout');Relationships.fail(s,o,'timeout');Commissions.lost(s,o);});
      s.orders.filter(o=>o.age>=o.patience&&o.channel==='dinein').forEach(o=>Dining.cancelOrder(s,o.id));
      s.orders = s.orders.filter(o => o.age < o.patience);
      if (lost) { s.stats.lost += lost; s.reputation = Math.max(0, money(s.reputation - lost * 1.2)); }
      s.arrivalIn -= dt;
      Town.arrivals(s,dt);
      District.arrivals(s);
      Commissions.arrivals(s);
      Events.arrivals(s);
      if (s.arrivalIn <= 0) {
        arrive(s);
        const eventOn = s.event && s.elapsed >= s.event.start && s.elapsed < s.event.end;
        s.arrivalIn = (3.15 + random(s) * 1.1) * (eventOn ? .68 : 1) * Events.streetFactor(s) * (Growth.ensure(s).decor.sign ? .9 : 1);
      }
      if(s.future && s.drone.owned){s.remoteIn-=dt;if(s.remoteIn<=0){remoteArrive(s);s.remoteIn=11+random(s)*3;}}
      aiQueue(s);
      if (s.robot && s.aiMode === 'manual' && !s.future) {
        for (const order of s.orders) if (order.status === 'waiting' && canMakeOrder(s, order)) order.status = 'queued';
      }
    }
    if (!s.current && s.phase === 'open') startCooking(s);
    if (s.current) {
      s.current.progress = Math.min(s.current.duration, s.current.progress + dt);
      if (s.current.progress + .000001 >= s.current.duration) completeCooking(s);
    }
    Dining.step(s,dt,order=>collect(s,order,false));
    autoDispatch(s,s.phase==='closing');
    if (s.phase === 'closing' && !s.current && !s.drone.mission && !s.readyDeliveries.length && !Dining.hasWork(s) && !Branch.hasWork(s)) settle(s);
  }
  function tick(s, dt, quantum = .05) {
    if(Town.ensure(s).terminal)return;
    if (s.paused || !['open', 'closing'].includes(s.phase) || !Number.isFinite(dt) || dt <= 0) return;
    let remaining = Math.min(dt, 120);
    while (remaining > .000001 && ['open', 'closing'].includes(s.phase)) {
      const size = Math.min(quantum === .1 ? .1 : .05, remaining); step(s, size); remaining -= size;
    }
  }
  function nextDay(s) {
    if(Town.ensure(s).terminal)return no('本局已完成清算，请开始新游戏。');
    if (s.phase !== 'report') return no('先结束今天的营业。');
    s.businessVersion=1;s.day++; District.nextDay(s); s.phase = 'prep'; s.elapsed = 0; s.paused = false; s.current = null; s.orders = []; s.event = null; s.readyDeliveries=[];s.drone.mission=null;
    s.closingElapsed = 0; s.weather = s.day % 5 === 0 ? 'storm' : s.day % 3 === 0 ? 'gust' : 'clear'; Growth.ensure(s).claimed = {};
    Branch.nextDay(s);
    Town.nextDay(s);
    Residents.nextDay(s);
    Relationships.nextDay(s);
    Commissions.nextDay(s);
    s.sourceLedger=Sources.create(s.day);
    Events.nextDay(s);
    s.stats = ledger(s.cash); return ok(`第 ${s.day} 天，准备开店！`);
  }
  function buyRobot(s) {
    if(Town.ensure(s).terminal)return no('本局已结束。');
    if (s.phase !== 'prep') return no('机器人需要在营业前安装。');
    if (s.robot) return no('炒粉机器人已经安装。');
    if (s.cash < 1200) return no(`还差 ¥${money(1200 - s.cash)}，继续经营攒一点吧。`);
    s.cash -= 1200; s.stats.equipment += 1200; s.robot = true; s.achievementDay = s.day;
    Town.ensure(s).paidRobot=true;
    return ok('炒粉机器人已安装！现在每份只需 2 秒，还会自动接单。');
  }
  function advice(s) {
    const last = s.lastReport;
    if(s.future){
      if(s.robotHealth<=15)return '机器人耐久偏低，及时保养；损坏后会退回人工制作，可能拖慢远程交付。';
      if(s.weather==='storm' && s.phase==='open')return '雷雨停飞。切换地面备用配送，费用较高，可先安排利润更足的远程订单。';
      if(s.readyDeliveries.length)return `有 ${s.readyDeliveries.length} 份餐等待配送。打开无人机控制台派送，送达后才能收款。`;
      if(s.phase==='open' && s.inventory.greens<4)return '青菜即将用完。可从中央厨房发起应急补货，但会占用无人机，暂缓送餐。';
      return s.aiMode==='manual'?'当前手动接单，机器人仍会按顺序制作。开启 AI 可识别口味并按利润或时效重新排产。':`AI 正按${{balanced:'均衡',profit:'利润',speed:'时效'}[s.aiMode]}策略排产。机器人负责制作，你可以调度无人机、查看需求预测并安排维修。`;
    }
    if (s.cash < (s.robot ? 100 : 80)) return '现金有点紧张，下一次采购要先留足开店费用。';
    if (s.phase === 'prep' && !s.inventory.noodles) return '先备一点米粉和青菜吧。首次推荐按 21 份准备，别忘了生鲜当天用完哦。';
    if (last && last.shortage >= 2) return '昨天有顾客因为缺料没吃上粉。明天优先补齐卖得好的配料。';
    if (last && last.waste > 35) return `昨天报废了 ¥${last.waste} 食材。青菜和牛肉可以少买一些，鸡蛋和米粉可以留到明天。`;
    if (last && last.lost >= 3) return '排队流失有点多。尽早安排订单，攒够现金后升级机器人，提高出餐速度。';
    if (s.robot) return '机器人已经会自动接单了！你可以把精力放在备料、价格和店铺经营上。';
    if (s.phase === 'open') return '点击左侧“安排制作”接单。留意顾客耐心，排入队列也要等锅空下来才能开炒。';
    return '小店的秘诀：食材够用、出餐及时、价格合适。先把每一天经营好，再慢慢扩张。';
  }
  function encodeSave(safe, wasOpen) { return JSON.stringify({ version: 1, wasOpen: !!wasOpen, state: safe }); }
  function decodeSave(raw) {
    try {
      const data = JSON.parse(raw), s = data.state;
      const number = (v, min, max) => typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;
      const int = (v, min, max) => Number.isInteger(v) && number(v, min, max);
      if (data.version !== 1 || !s || s.version !== 1 || typeof data.wasOpen !== 'boolean' || !['prep', 'report'].includes(s.phase)) throw Error();
      if(s.businessVersion!==undefined&&s.businessVersion!==1)throw Error();
        if (!Growth.valid(s)) throw Error();
      if(s.stats)s.stats={...EXTRA_LEDGER,...s.stats};
      if(Array.isArray(s.history))s.history=s.history.map(r=>({...EXTRA_LEDGER,...r}));
      if(s.lastReport)s.lastReport={...EXTRA_LEDGER,...s.lastReport};
      const defaults=createState(s.seed);for(const key of ['future','aiMode','aiLog','robotMode','robotHealth','robotLevel','drone','readyDeliveries','totalDelivered','remoteIn','weather'])if(s[key]===undefined)s[key]=clone(defaults[key]);
      if(s.dining===undefined)s.dining=Dining.create(!!s.future);if(!Dining.valid(s.dining))throw Error();Dining.reset(s);
      if(!District.valid(s))throw Error();
      if(!Branch.valid(s))throw Error();
      if(!Town.valid(s))throw Error();
      if(!Residents.valid(s))throw Error();
      if(!Relationships.valid(s))throw Error();
      if(!Commissions.valid(s))throw Error();
      if(!Events.valid(s))throw Error();
      if (!int(s.day, 1, 1000000) || !number(s.cash, 0, 1e10) || !number(s.reputation, 0, 100) || typeof s.robot !== 'boolean' || !int(s.seed, 0, 4294967295)) throw Error();
      if (!s.inventory || Object.keys(INGREDIENTS).some(k => !int(s.inventory[k], 0, 1e7))) throw Error();
      if (!s.prices || Object.entries(MENU).some(([k, v]) => !int(s.prices[k], Math.ceil(v.base * .8), Math.floor(v.base * 1.2)))) throw Error();
      if (!s.stats || Object.keys(ledger(0)).some(k => !number(s.stats[k], 0, 1e10))) throw Error();
      if (!Array.isArray(s.history) || s.history.length > 30 || !int(s.totalServed, 0, 1e9) || !int(s.sequence, 0, 1e10)) throw Error();
      if (s.achievementDay !== null && !int(s.achievementDay, 1, s.day)) throw Error();
      if(typeof s.future!=='boolean'||!['manual','balanced','profit','speed'].includes(s.aiMode)||!['standard','turbo','eco'].includes(s.robotMode)||!number(s.robotHealth,0,100)||!int(s.robotLevel,1,2))throw Error();
      if(!s.drone||typeof s.drone.owned!=='boolean'||typeof s.drone.auto!=='boolean'||!int(s.drone.level,1,2)||!number(s.drone.battery,0,100)||s.drone.mission!==null||!int(s.totalDelivered,0,1e9))throw Error();
      if(!Array.isArray(s.aiLog)||s.aiLog.length>5||s.aiLog.some(v=>typeof v!=='string'||v.length>300)||!['clear','gust','storm'].includes(s.weather))throw Error();
      const validReport = r => r && int(r.day, 1, s.day) && Object.keys(ledger(0)).every(k => number(r[k], 0, 1e10)) && number(r.profit, -1e10, 1e10) && number(r.endCash, 0, 1e10) && number(r.cashFlow, -1e10, 1e10) && (r.branch == null || Branch.validReport(r.branch,r.day)) && (r.totalProfit === undefined || number(r.totalProfit,-1e10,1e10) && Math.abs(r.totalProfit-money(r.profit+(r.branch?.profit||0)))<.001) && (r.totalRevenue === undefined || number(r.totalRevenue,0,1e10) && Math.abs(r.totalRevenue-money(r.revenue+(r.branch?.revenue||0)))<.001) && (r.totalServed === undefined || int(r.totalServed,0,1e10) && r.totalServed===r.served+(r.branch?.served||0));
      if (s.history.some(r => !validReport(r)) || (s.lastReport !== null && !validReport(s.lastReport)) || (s.phase === 'report' && !s.lastReport)) throw Error();
      if(s.history.concat(s.lastReport?[s.lastReport]:[]).some(r=>!Relationships.validReport(r.relationships,r.day)))throw Error();
      if(s.history.concat(s.lastReport?[s.lastReport]:[]).some(r=>!Commissions.validReport(r.commissions,r.day)))throw Error();
      if(s.history.concat(s.lastReport?[s.lastReport]:[]).some(r=>!Events.validReport(r.townEvents,r.day)||r.townEvents&&(r.townEvents.revenue>r.revenue||r.townEvents.served>r.served)))throw Error();
      if(s.history.concat(s.lastReport?[s.lastReport]:[]).some(r=>{const e=r.townEvents;if(!e||e.kind==='quiet')return false;const source=r.sources?.rows?.find(x=>x.key===({rain:'residential',overtime:'tech',market:'park'}[e.kind]));return !source||e.requested>source.demand||e.served>source.served||e.revenue>source.revenue+.001||e.lost+e.missed>source.lost;}))throw Error();
      if(s.history.concat(s.lastReport?[s.lastReport]:[]).some(r=>{const c=r.commissions?.selected,reward=c?.rewardPaid?c.reward:0;return r.commissionRewards!==reward||r.rewards<reward||c&&c.revenue>r.revenue;}))throw Error();
      if(s.history.concat(s.lastReport?[s.lastReport]:[]).some(r=>!Sources.validReport(r.sources,r.totalServed??r.served,r.totalRevenue??r.revenue))||!Sources.valid(s))throw Error();
      // New dual-shop reports must agree with both stores' ledgers. Old reports retain their original shape.
      const newReports=s.history.concat(s.lastReport?[s.lastReport]:[]).filter(r=>r.totalProfit!==undefined);
      if(newReports.some(r=>Math.abs(r.profit-money(r.revenue-r.cogs-r.waste-r.operating))>.001))throw Error();
      if(s.phase==='report'&&s.branch){
        const report=s.lastReport.branch,branch=s.branch.lastReport;
        if(!report||!branch||Object.keys(branch).some(k=>report[k]!==branch[k]))throw Error();
      }
      s.orders = []; s.current = null; s.paused = false; s.elapsed = 0; s.arrivalIn = 1.2; s.event = null; s.readyDeliveries=[];
      return { ok: true, state: clone(s), wasOpen: data.wasOpen };
    } catch (_) { return { ok: false, message: '存档内容损坏或版本不兼容。可以下载原存档备份，再开始新游戏。' }; }
  }
  return { Growth, Dining, District, Branch, Town, Residents, Sources, Relationships, Commissions, Events, INGREDIENTS, MENU, ROUTES, SUPPLIES, clone, createState, createFutureState, enableFuture, analyzeDemand, forecast, setAIMode, setRobotMode, repairRobot, upgradeRobot, upgradeDrone, requestSupply, routeInfo, dispatchDrone, dispatchGround, purchase, setPrice, openingFees, openDay, available, canMake, enqueue, tick, closeDay, nextDay, buyRobot, advice, encodeSave, decodeSave };
});
