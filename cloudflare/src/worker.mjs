import {replay,initialState,RULE_VERSION,TICK_SECONDS,ACTIONS} from './replay.mjs';
class HttpError extends Error{constructor(status,code){super(code);this.status=status;}}
const fail=(status,code)=>{throw new HttpError(status,code);};
const hash=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),x=>x.toString(16).padStart(2,'0')).join('');
const json=(data,status=200,headers={})=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...headers}});
const version=env=>env.RULE_VERSION||RULE_VERSION;
function displayName(value){const name=typeof value==='string'?value.trim().normalize('NFC'):'';if([...name].length<2||[...name].length>12||/[\p{Cc}\p{Cf}<>]/u.test(name))fail(400,'invalid_name');return name;}
async function body(request){
  if(!request.headers.get('Content-Type')?.includes('application/json'))fail(415,'json_required');
  if(Number(request.headers.get('Content-Length')||0)>65536)fail(413,'body_too_large');
  const reader=request.body?.getReader();if(!reader)fail(400,'invalid_json');
  const chunks=[];let length=0;
  for(;;){const {done,value}=await reader.read();if(done)break;length+=value.byteLength;if(length>65536){await reader.cancel();fail(413,'body_too_large');}chunks.push(value);}
  const bytes=new Uint8Array(length);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
  try{const value=JSON.parse(new TextDecoder().decode(bytes));if(!value||typeof value!=='object'||Array.isArray(value))fail(400,'invalid_json');return value;}catch{fail(400,'invalid_json');}
}
async function quota(db,bucket,limit,expires){
  const r=await db.prepare('INSERT INTO quotas(bucket,count,expires_at) VALUES(?,1,?) ON CONFLICT(bucket) DO UPDATE SET count=count+1 WHERE count < ? RETURNING count').bind(bucket,expires,limit).first();
  if(!r)fail(429,'rate_limited');
}
async function authenticate(request,env,now){
  const token=request.headers.get('Authorization')?.match(/^Bearer ([a-f0-9]{64})$/)?.[1];if(!token)fail(401,'session_required');
  const player=await env.DB.prepare('SELECT id,name,expires_at FROM players WHERE token_hash=?').bind(await hash(token)).first();
  if(!player||player.expires_at<=now)fail(401,'session_expired');return player;
}
const runResponse=run=>({runId:run.id,seq:run.seq,state:typeof run.state==='string'?JSON.parse(run.state):run.state,ruleVersion:run.rule_version,tickSeconds:TICK_SECONDS,wealth:run.wealth,survivalDays:run.survival_days,highestCash:run.highest_cash||0,totalRevenue:run.total_revenue||0,terminal:!!run.terminal});
async function route(request,env,ctx){
  const url=new URL(request.url),now=Date.now(),date=new Date(now).toISOString().slice(0,10),path=url.pathname;
  if(path==='/v1/status'&&request.method==='GET'){
    await env.DB.prepare('SELECT 1 AS ok').first();return json({ok:true,ruleVersion:version(env),tickSeconds:TICK_SECONDS,actions:ACTIONS});
  }
  if(path==='/v1/rankings'&&request.method==='GET'){
    const board=url.searchParams.get('board')||'wealth';if(!['wealth','survival'].includes(board))fail(400,'invalid_board');
    const cacheKey=new Request(`${url.origin}/v1/rankings?board=${board}&rule=${version(env)}`),cache=globalThis.caches?.default;
    const cached=await cache?.match(cacheKey);if(cached)return cached;
    const order=board==='wealth'?'wealth DESC,survival_days DESC,updated_at ASC,id ASC':'survival_days DESC,wealth DESC,updated_at ASC,id ASC';
    const outerOrder=order.split(',').map(part=>'b.'+part).join(',');
    const rows=await env.DB.prepare(`WITH best AS (SELECT r.*,ROW_NUMBER() OVER(PARTITION BY player_id ORDER BY ${order}) AS place FROM runs r WHERE rule_version=? AND seq>0) SELECT b.id,b.wealth,b.survival_days,b.highest_cash,b.total_revenue,b.terminal,p.name FROM best b JOIN players p ON p.id=b.player_id WHERE place=1 ORDER BY ${outerOrder} LIMIT 50`).bind(version(env)).all();
    const response=json({ruleVersion:version(env),board,entries:rows.results.map((r,i)=>({rank:i+1,runId:r.id,name:r.name,wealth:r.wealth,survivalDays:r.survival_days,highestCash:r.highest_cash,totalRevenue:r.total_revenue,terminal:!!r.terminal})),updatedAt:new Date(now).toISOString()},200,{'Cache-Control':'public, max-age=30'});
    if(cache&&ctx?.waitUntil)ctx.waitUntil(cache.put(cacheKey,response.clone()));return response;
  }
  if(path==='/v1/session'&&request.method==='POST'){
    const input=await body(request),name=displayName(input.name);
    const ip=request.headers.get('CF-Connecting-IP')||'local',ipHash=await hash(`${date}:${ip}`);
    await quota(env.DB,`sessions:${date}:${ipHash}`,10,now+86400000);
    const token=crypto.randomUUID().replaceAll('-','')+crypto.randomUUID().replaceAll('-',''),id=crypto.randomUUID(),expiresAt=now+30*86400000;
    await env.DB.prepare('INSERT INTO players(id,name,token_hash,created_at,expires_at) VALUES(?,?,?,?,?)').bind(id,name,await hash(token),now,expiresAt).run();
    return json({token,playerId:id,name,expiresAt:new Date(expiresAt).toISOString(),ruleVersion:version(env)},201);
  }
  const player=await authenticate(request,env,now);
  if(path==='/v1/profile'&&request.method==='POST'){
    const input=await body(request),name=displayName(input.name);
    await quota(env.DB,`renames:${date}:${player.id}`,10,now+86400000);
    await env.DB.prepare('UPDATE players SET name=? WHERE id=?').bind(name,player.id).run();
    return json({playerId:player.id,name,expiresAt:new Date(player.expires_at).toISOString(),ruleVersion:version(env)});
  }
  if(path==='/v1/runs'&&request.method==='POST'){
    await quota(env.DB,`newruns:${date}:${player.id}`,5,now+86400000);
    const seed=crypto.getRandomValues(new Uint32Array(1))[0]||23571,state=initialState(seed),id=crypto.randomUUID();
    await env.DB.prepare('INSERT INTO runs(id,player_id,rule_version,state,highest_cash,created_at,updated_at) VALUES(?,?,?,?,?,?,?)').bind(id,player.id,version(env),JSON.stringify(state),state.cash,now,now).run();
    return json(runResponse({id,state,seq:0,rule_version:version(env),wealth:0,survival_days:0,highest_cash:state.cash}),201);
  }
  const match=path.match(/^\/v1\/runs\/([a-f0-9-]{36})(\/days)?$/);if(!match)fail(404,'not_found');
  const run=await env.DB.prepare('SELECT * FROM runs WHERE id=? AND player_id=?').bind(match[1],player.id).first();if(!run)fail(404,'run_not_found');
  if(run.rule_version!==version(env))fail(409,'rule_version_changed');
  if(!match[2]&&request.method==='GET')return json(runResponse(run));
  if(match[2]&&request.method==='POST'){
    const input=await body(request);
    if(!Number.isInteger(input.seq)||input.seq<1||typeof input.requestId!=='string'||!/^[a-zA-Z0-9_-]{8,80}$/.test(input.requestId))fail(400,'invalid_submission');
    const digest=await hash(JSON.stringify(input));
    const receipt=await env.DB.prepare('SELECT digest,response FROM receipts WHERE run_id=? AND request_id=?').bind(run.id,input.requestId).first();
    if(receipt){if(receipt.digest!==digest)fail(409,'request_id_reused');return new Response(receipt.response,{headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});}
    if(input.seq!==run.seq+1)fail(409,'stale_sequence');
    await quota(env.DB,`submissions:${Math.floor(now/60000)}:${player.id}`,10,now+120000);
    let result;try{result=replay(JSON.parse(run.state),input);}catch(error){fail(400,['ranked_day_requires_90_seconds','incomplete_day','inactive_tick','invalid_ticks','invalid_events','invalid_event_time','invalid_action','invalid_next_day','invalid_open_day','run_finished','invalid_result'].includes(error.message)?error.message:'invalid_journal');}
    if(now-run.updated_at < Math.max(0,result.activeTicks*TICK_SECONDS*1000/3-2000))fail(429,'simulation_too_fast');
    const wealth=Math.max(run.wealth,result.wealth),survivalDays=run.survival_days+(result.completedDay?1:0),highestCash=Math.max(run.highest_cash,result.cash),totalRevenue=run.total_revenue+result.revenue;
    const response=JSON.stringify({runId:run.id,seq:input.seq,state:result.state,ruleVersion:run.rule_version,tickSeconds:TICK_SECONDS,wealth,survivalDays,highestCash,totalRevenue,terminal:result.terminal});
    const batch=await env.DB.batch([
      env.DB.prepare('UPDATE runs SET state=?,seq=?,ticks=ticks+?,wealth=?,survival_days=?,highest_cash=?,total_revenue=?,terminal=?,updated_at=?,last_request=? WHERE id=? AND player_id=? AND seq=?').bind(JSON.stringify(result.state),input.seq,result.activeTicks,wealth,survivalDays,highestCash,totalRevenue,result.terminal?1:0,now,input.requestId,run.id,player.id,run.seq),
      env.DB.prepare('INSERT OR IGNORE INTO receipts(run_id,request_id,digest,seq,response) SELECT id,?,?,?,? FROM runs WHERE id=? AND seq=? AND last_request=?').bind(input.requestId,digest,input.seq,response,run.id,input.seq,input.requestId)
    ]);
    if(!batch[0].meta.changes){const saved=await env.DB.prepare('SELECT digest,response FROM receipts WHERE run_id=? AND request_id=?').bind(run.id,input.requestId).first();if(saved?.digest===digest)return new Response(saved.response,{headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});fail(409,'stale_sequence');}
    return new Response(response,{headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
  }
  fail(405,'method_not_allowed');
}
export default {
  async fetch(request,env,ctx){
    const origin=request.headers.get('Origin'),allowed=(env.ALLOWED_ORIGINS||'https://xdw-h.github.io').split(',').map(x=>x.trim()),cors={};
    if(origin&&!allowed.includes(origin))return json({error:'origin_not_allowed'},403);
    if(origin){cors['Access-Control-Allow-Origin']=origin;cors.Vary='Origin';}
    cors['Access-Control-Allow-Methods']='GET,POST,OPTIONS';cors['Access-Control-Allow-Headers']='Authorization,Content-Type';cors['Access-Control-Max-Age']='86400';
    if(request.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
    let response;try{response=await route(request,env,ctx);}catch(error){response=json({error:error instanceof HttpError?error.message:'service_unavailable'},error instanceof HttpError?error.status:503);}
    const headers=new Headers(response.headers);for(const[k,v]of Object.entries(cors))headers.set(k,v);headers.set('X-Content-Type-Options','nosniff');
    return new Response(response.body,{status:response.status,headers});
  },
  async scheduled(_event,env){await env.DB.batch([env.DB.prepare('DELETE FROM quotas WHERE expires_at<?').bind(Date.now()),env.DB.prepare('DELETE FROM receipts WHERE run_id IN (SELECT id FROM runs WHERE updated_at<?)').bind(Date.now()-90*86400000)]);}
};
