import Engine from '../../engine.js';
export const RULE_VERSION = 'v049';
export const TICK_SECONDS = .1;
const actionNames = ['setPrice','purchase','setAIMode','setRobotMode','repairRobot','upgradeRobot','upgradeDrone','requestSupply','dispatchDrone','dispatchGround','openDay','closeDay','enqueue','nextDay','buyRobot'];
const actions = Object.fromEntries(actionNames.map(k=>[k,Engine[k]]));
actions.setAuto=(s,value)=>{assert(typeof value==='boolean','invalid_action');s.drone.auto=value;};
for (const [group,names] of Object.entries({Growth:['claim','research','decorate','special'],Roadmap:['claim','decorate'],District:['accept','clear','claim'],Branch:['establish','purchase','setEnabled','setMenu'],Dining:['seatParty','requestClean','setPolicy','toggle','upgradeServer'],Town:['activity','reserve','sellAssets'],Commerce:['chat']})) {
  for(const name of names) actions[`${group}.${name}`]=(s,...args)=>Engine[group][name](s,...args);
}
actions['Town.liquidate']=s=>{assert(!Engine.Town.solvency(s).viable,'still_solvent');return Engine.Town.liquidate(s);};
for(const name of ['accept','cancel'])actions['Commissions.'+name]=(s,...args)=>Engine.Commissions[name](s,...args);
export const ACTIONS = Object.freeze(Object.keys(actions));
export const initialState = seed => Engine.createFutureState(seed);
function assert(ok,message){if(!ok)throw new Error(message);}
function safeValue(v,depth=0){
  if(depth>2)return false;
  if(v===null||typeof v==='boolean')return true;
  if(typeof v==='string')return v.length<=80&&!['__proto__','constructor','prototype'].includes(v);
  if(typeof v==='number')return Number.isFinite(v)&&Math.abs(v)<=1e7;
  if(Array.isArray(v))return v.length<=16&&v.every(x=>safeValue(x,depth+1));
  return !!v&&typeof v==='object'&&Object.keys(v).length<=8&&Object.entries(v).every(([k,x])=>!['__proto__','constructor','prototype'].includes(k)&&safeValue(x,depth+1));
}
export function replay(checkpoint,input){
  assert(Number.isInteger(input.ticks)&&input.ticks>=0&&input.ticks<=2400,'invalid_ticks');
  assert(Array.isArray(input.events)&&input.events.length>0&&input.events.length<=256,'invalid_events');
  const s=Engine.clone(checkpoint),startingDay=s.day;
  assert(!s.town?.terminal,'run_finished');
  assert(s.day<=365&&['prep','report'].includes(s.phase),'run_finished');
  let prior=0,opened=false,nextCount=0,index=0,activeTicks=0;
  for(const e of input.events){
    assert(e&&Number.isInteger(e.at)&&e.at>=prior&&e.at<=input.ticks,'invalid_event_time');prior=e.at;
    assert(Object.hasOwn(actions,e.action)&&Array.isArray(e.args)&&e.args.length<=3&&e.args.every(v=>safeValue(v)),'invalid_action');
    if(e.action==='nextDay'){assert(checkpoint.phase==='report'&&!opened&&e.at===0&&nextCount++===0,'invalid_next_day');}
    if(e.action==='openDay'){assert(!opened&&e.at===0,'invalid_open_day');opened=true;}
    index++;
  }
  let cursor=0;
  for(let tick=0;tick<=input.ticks;tick++){
    while(cursor<input.events.length&&input.events[cursor].at===tick){const e=input.events[cursor++];assert(!s.town?.terminal,'run_finished');if(e.action==='closeDay')assert(s.elapsed>=89.999,'ranked_day_requires_90_seconds');actions[e.action](s,...e.args);}
    if(tick<input.ticks){assert(['open','closing'].includes(s.phase),'inactive_tick');Engine.tick(s,TICK_SECONDS,TICK_SECONDS);activeTicks++;}
  }
  const completedDay=opened&&s.phase==='report'&&s.elapsed>=89.999&&s.day===startingDay+(checkpoint.phase==='report'?1:0);
  const terminalOnly=!opened&&input.ticks===0&&s.town?.terminal&&s.day===startingDay+(nextCount?1:0);
  assert(completedDay||terminalOnly,'incomplete_day');
  assert((terminalOnly||s.lastReport?.day===s.day)&&Number.isFinite(s.cash)&&s.cash>=0&&s.cash<=1e9,'invalid_result');
  return {state:s,activeTicks,wealth:Engine.Town.solvency(s).netAssets,completedDay:!!completedDay,terminal:!!s.town?.terminal,cash:s.cash,revenue:completedDay?(s.lastReport.totalRevenue??s.lastReport.revenue):0};
}
