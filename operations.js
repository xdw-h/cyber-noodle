(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.NoodleOperations=api;})(globalThis,function(){
  function alerts(s){if(!['open','closing'].includes(s.phase))return [];const items=[],names={noodles:'米粉',greens:'青菜',egg:'鸡蛋',beef:'牛肉'};
    const low=Object.keys(names).filter(k=>(s.inventory[k]||0)<(k==='noodles'||k==='greens'?4:2));if(low.length)items.push({id:'stock',action:'drone',title:low.map(k=>`${names[k]} ${s.inventory[k]||0}`).join(' · '),detail:'库存偏低，查看中央厨房补给；补货与送餐共用无人机。'});
    const dirty=s.dining.tables.reduce((n,t)=>n+t.dirty.filter(Boolean).length,0),waiting=s.dining.parties.filter(p=>p.phase==='reception').reduce((n,p)=>n+p.size,0);if(dirty)items.push({id:'tables',action:'dining',title:`${dirty} 份空碗待清${waiting?` · ${waiting} 位等座`:''}`,detail:waiting?'清桌可释放座位，打开堂食服务安排。':'查看清桌进度和自动清桌设置。'});
    if(s.readyDeliveries.length)items.push({id:'delivery',action:'drone',title:`${s.readyDeliveries.length} 份热餐待配送`,detail:s.weather==='storm'?'雷雨停飞，可查看地面备用配送。':s.drone.mission?'无人机正在执行任务，查看运力与自动派送。':'打开物流调度，送达后才回款。'});
    return items;
  }
  function review(r){if(!r)return [];const out=[];
    if(r.shortage>0)out.push(`记录到 ${r.shortage} 次订单缺料；明天先核对配方库存，再参考销量备货。缺料次数不等于失客人数。`);
    if(r.waste>0)out.push(`生鲜报废 ¥${r.waste}；明天适当减少青菜、牛肉采购，营业中按需补给。`);
    if(r.diningAbandoned>0)out.push(`${r.diningAbandoned} 位堂食客未等到座位；明天检查自动接待、清桌设置与座位周转。`);
    if(r.late>0||r.diningLate>0)out.push(`外卖超时 ${r.late||0} 份，堂食迟送 ${r.diningLate||0} 份；明天检查配送调度与送餐优先级。`);
    if(r.unfulfilled>0)out.push(`收摊未履约 ${r.unfulfilled} 份；临近收摊先处理已有订单，预留配送时间。`);
    if(r.lost>0&&!r.diningAbandoned)out.push(`流失 ${r.lost} 位顾客；记录未逐一归因，可先检查排队长度和接单节奏。`);
    if(r.profit<0)out.push(`本店餐食收入 ¥${r.revenue}，耗材 ¥${r.cogs}、报废 ¥${r.waste}、运营费 ¥${r.operating}；经营利润 ¥${r.profit}，采购及设备投资另列现金流。`);
    if(!out.length)out.push(`本店履约 ${r.served} 碗，未记录缺料、报废或迟送；明天参考本日销量备货，先预留运营费用。`);
    return out;
  }
  return {alerts,review};
});
