(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.NoodleHouseholdLife=api;})(globalThis,function(){
  'use strict';
  // Derive indoor life from the operating clock and actual arrivals; never save it.
  function hour(s){return s.phase==='report'?22:s.phase==='prep'?7:7+Math.min(90,s.elapsed||0)/6;}
  function describe(s,resident){
    const id=resident?.id??resident?.residentId;
    if(!Number.isInteger(id)||id<0||id>=18)return null;
    const h=hour(s),sleepAt=(211+((id*7)%18)/17*8)/10;
    const home=resident.home===true&&resident.arrived===true;
    const awake=home&&h<sleepAt;
    let activity='away';
    if(home){
      if(!awake)activity='sleep';
      else {
        const offset=(id%6)*.08;
        const meal=h>=7+offset&&h<8+offset||h>=11.3+offset&&h<12.5+offset||h>=18+offset&&h<19.3+offset;
        activity=meal?'meal':h>=19||id%3!==0?'read':'rest';
      }
    }
    return {residentId:id,home,awake,activity,sleepAt,lit:home&&awake};
  }
  function snapshot(s,actualResidents){return (actualResidents||[]).map(r=>describe(s,r)).filter(Boolean);}
  return {hour,describe,snapshot};
});
