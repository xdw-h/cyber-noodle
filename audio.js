(function(){
  'use strict';
  let context,master,musicBus,effectBus,analyser,timer,unlocked=false,music=true,effects=true,paused=false,next=0,beat=0;
  const voices=new Set(),melody=[72,76,79,76,74,0,72,67,69,72,76,72,71,0,67,0,69,72,77,76,74,0,72,69,67,71,74,71,72,0,67,0],bass=[48,45,53,43];
  const frequency=n=>440*2**((n-69)/12);
  function note(bus,midi,when,duration,volume,type='sine'){
    const oscillator=context.createOscillator(),gain=context.createGain();oscillator.type=type;oscillator.frequency.value=frequency(midi);gain.gain.setValueAtTime(0,when);gain.gain.linearRampToValueAtTime(volume,when+.015);gain.gain.exponentialRampToValueAtTime(.0001,when+duration);oscillator.connect(gain);gain.connect(bus);voices.add(oscillator);oscillator.onended=()=>{voices.delete(oscillator);oscillator.disconnect();gain.disconnect();};oscillator.start(when);oscillator.stop(when+duration+.02);
  }
  function playing(){return unlocked&&music&&!paused&&!document.hidden&&context?.state==='running';}
  function schedule(){if(!playing())return;if(next<context.currentTime)next=context.currentTime+.04;while(next<context.currentTime+.2){const i=beat%melody.length;if(melody[i])note(musicBus,melody[i],next,.38,.1,'triangle');if(i%4===0)note(musicBus,bass[Math.floor(i/8)],next,.85,.12);if(i%8===0){const root=bass[Math.floor(i/8)]+12;for(const n of [root,root+4,root+7])note(musicBus,n,next,1.1,.025);}next+=.3;beat++;}}
  function levels(){if(!context)return;musicBus.gain.cancelScheduledValues(context.currentTime);musicBus.gain.setTargetAtTime(playing()?.45:0,context.currentTime,.035);effectBus.gain.setTargetAtTime(effects&&!document.hidden?1:0,context.currentTime,.02);if(!playing())next=0;}
  async function unlock(){try{if(!context){context=new (window.AudioContext||window.webkitAudioContext)();master=context.createGain();musicBus=context.createGain();effectBus=context.createGain();analyser=context.createAnalyser();analyser.fftSize=256;master.gain.value=.7;musicBus.gain.value=0;effectBus.gain.value=0;musicBus.connect(master);effectBus.connect(master);master.connect(analyser);analyser.connect(context.destination);timer=setInterval(schedule,100);}if(context.state==='suspended')await context.resume();unlocked=true;levels();schedule();return true;}catch{return false;}}
  function configure(config){effects=!!config.effects;music=!!config.music;paused=!!config.paused;levels();}
  function effect(kind){if(!effects||!unlocked||document.hidden||context?.state!=='running')return;const notes=kind==='sale'?[76,79]:kind==='upgrade'?[60,64,67,72]:[72];notes.forEach((n,i)=>note(effectBus,n,context.currentTime+i*.09,.14,.1));}
  document.addEventListener('pointerdown',()=>{void unlock();},{capture:true});document.addEventListener('keydown',()=>{void unlock();},{capture:true});document.addEventListener('visibilitychange',()=>{levels();if(!document.hidden)schedule();});
  window.NoodleAudio={unlock,configure,effect,snapshot(){let rms=0;if(analyser){const data=new Float32Array(analyser.fftSize);analyser.getFloatTimeDomainData(data);rms=Math.sqrt(data.reduce((a,v)=>a+v*v,0)/data.length);}return {unlocked,music,effects,paused,playing:!!playing(),context:context?.state||'not-started',voices:voices.size,rms};}};
})();
