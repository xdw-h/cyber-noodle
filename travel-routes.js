(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.NoodleTravel=api;})(globalThis,function(){
  function enter(member=0){const side=Math.max(0,member)*.55;return [[-8.8-side,10.3],[-6.5-side,8.7],[-5.9-side,4.5],[-5.9-side,1.85]];}
  function exit(){return [[-5.1,4.5],[-5.7,8.7],[-8.1,10.4]];}
  return {enter,exit};
});
