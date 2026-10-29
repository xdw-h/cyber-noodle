export function renderPolicy({mobile=false,dpr=1,quality=false,fps=45}={}){
  return {pixelRatio:Math.min(Math.max(1,dpr),mobile?1:1.25),fpsLimit:quality?(fps===60?60:45):30,shadows:!!quality};
}
export function frameDue(now,lastRendered,fpsLimit){return now-lastRendered>=1000/fpsLimit-.5;}
