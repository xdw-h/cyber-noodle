(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.NoodleTownCycle=api;})(globalThis,function(){
  const bounds={old:{width:44,depth:35},town:{width:104,depth:80}};
  const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
  function daylight(s){const progress=s?.phase==='report'?1:s?.phase==='prep'?0:Math.max(0,Math.min(1,(s?.elapsed||0)/90)),hour=7+15*progress,night=smooth((hour-17)/3),sun=Math.max(0,Math.sin((hour-6)/12*Math.PI));const minutes=Math.floor(hour*60);return {progress,hour,night,sun,clock:String(Math.floor(minutes/60)).padStart(2,'0')+':'+String(minutes%60).padStart(2,'0'),phase:hour<16.5?'白天':hour<19?'黄昏':'夜晚'};}
  return {bounds,areaRatio:bounds.town.width*bounds.town.depth/(bounds.old.width*bounds.old.depth),daylight};
});
