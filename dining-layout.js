(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.NoodleDiningLayout=api;})(globalThis,function(){
  'use strict';
  const LEVELS=Object.freeze([{tables:4,cost:0,fee:0,right:3.7},{tables:6,cost:400,fee:8,right:5.2},{tables:8,cost:800,fee:16,right:8}].map(Object.freeze));
  const SEATS=[];
  function column(x,z){for(const side of [-1,1])SEATS.push(Object.freeze({x:x+side*.83,z,facing:side<0?Math.PI/2:-Math.PI/2,tableX:x,tableZ:z}));}
  for(const z of [5.25,7.65])for(const x of [-2.4,.8])column(x,z);
  for(const x of [3.6,6.4])for(const z of [5.25,7.65])column(x,z);
  const level=d=>d?.expansionLevel??0,fee=d=>LEVELS[level(d)]?.fee??0;
  return {LEVELS,SEATS:Object.freeze(SEATS),level,fee};
});
