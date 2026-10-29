(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.NoodleStorage=api;})(globalThis,function(){
  'use strict';
  function formatDate(value){if(value===null||value===undefined||value==='')return '-';const d=new Date(value);if(!Number.isFinite(d.getTime()))return '-';const p=n=>String(n).padStart(2,'0');return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;}
  function create(storage,E){
    const key=i=>'cyber-noodle-slot-v1-'+i,valid=i=>Number.isInteger(i)&&i>=0&&i<3;
    function read(i){if(!valid(i))return {ok:false,message:'请选择有效存档位。'};try{const raw=storage.getItem(key(i));if(!raw)return {ok:false,empty:true,message:'这个档位还没有存档。'};const row=JSON.parse(raw);if(typeof row.name!=='string'||row.name.length>24||typeof row.savedAt!=='string'||!Number.isFinite(Date.parse(row.savedAt))||typeof row.raw!=='string')throw Error();const result=E.decodeSave(row.raw);if(!result.ok)return result;return {...result,name:row.name,savedAt:row.savedAt};}catch(_){return {ok:false,message:'存档不可读取或浏览器存储未开放。'};}}
    function write(i,name,state,wasOpen){if(!valid(i))return {ok:false,message:'请选择有效存档位。'};try{const raw=E.encodeSave(state,!!wasOpen);if(!E.decodeSave(raw).ok)return {ok:false,message:'当前检查点无法保存，请先导出备份。'};const row={name:String(name||'我的小店').trim().slice(0,24)||'我的小店',savedAt:new Date().toISOString(),raw};storage.setItem(key(i),JSON.stringify(row));return {ok:true,message:'已保存安全检查点。'};}catch(_){return {ok:false,message:'保存失败，存储空间不足或权限受限，请导出备份。'};}}
    function list(){return Array.from({length:3},(_,i)=>{const row=read(i);return {index:i,...row};});}
    return {read,write,list};
  }
  return {create,formatDate};
});
