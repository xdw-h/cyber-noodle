(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.NoodleFeedback=api;})(globalThis,function(){
  const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
  const overlap=(a,b)=>Math.abs(a.x-b.x)<(a.w+b.w)/2+6&&Math.abs(a.y-b.y)<(a.h+b.h)/2+6;
  const labelScale=(projected,width)=>projected>0?Math.min(Math.min(160,width-16),Math.max(100,projected))/projected:1;
  function layout(candidates,width,height,max=4){
    const placed=[];
    for(const c of [...candidates].sort((a,b)=>b.priority-a.priority||(a.order||0)-(b.order||0)||String(a.id).localeCompare(String(b.id)))){
      if(placed.length>=max)break;if(c.x<0||c.x>width||c.w>width-16)continue;
      const positions=c.speech?[c.y,...placed.flatMap(p=>[p.y-(p.h+c.h)/2-8,p.y+(p.h+c.h)/2+8]),c.y-c.h-8,c.y+c.h+8]:[c.y,c.y-c.h-8,c.y-2*(c.h+8)];
      for(const y of positions){
        const b={...c,x:Math.max(8+c.w/2,Math.min(width-8-c.w/2,c.x)),y};
        if(b.y-b.h/2<100||b.y+b.h/2>height-(c.speech?100:40)||placed.some(p=>overlap(b,p)))continue;
        placed.push({...b,dx:b.x-c.x,dy:b.y-c.y});break;
      }
    }
    return placed;
  }
  function gesture(g,reduced=false){
    const t=Math.max(0,g.phaseTime||0),cycle=(t+(g.id%7)*.37)%(4.8+(g.id%3)*.4),eating=g.phase==='eating';
    const bite=eating?(reduced?.35:cycle<.8?smooth(cycle/.8):cycle<1.5?1:cycle<2.25?1-smooth((cycle-1.5)/.75):0):0;
    const bye=g.phase==='leaving'&&(g.paid||g.ready)&&t<1.8?Math.sin(t/1.8*Math.PI):0;
    const carrying=g.ready&&(['queue','waitingSeat','toSeat'].includes(g.phase)||g.takeaway&&g.phase==='leaving');
    return {bite,chew:eating&&!reduced&&cycle>1.5&&cycle<3?Math.sin((cycle-1.5)*8)*.018:0,wave:reduced||carrying?0:bye,look:reduced?0:bye*.22*(g.id%2?1:-1)};
  }
  function remaining(g){if(g.phase==='standing'||g.phase==='leaving')return 0;if(g.phase!=='eating')return 1;return 1-smooth((g.phaseTime||0)/(g.group==='family'?19:g.group==='friends'?17:14));}
  function collection(seconds,duration,index,count){return smooth((seconds/duration-.12-index*.24)/(.62-(count-1)*.24));}
  function pointerEdge(x,y,w,h){const ratio=Math.max(Math.abs(x)/(w/2+.025),Math.abs(y)/(h/2+.025));return ratio>1?{x:x/ratio,y:y/ratio,visible:true}:{x:0,y:0,visible:false};}
  return {layout,overlap,gesture,labelScale,remaining,collection,pointerEdge};
});
