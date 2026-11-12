/* The three frames share the same film and one playback control. */
(()=>{
const primary=document.getElementById('heroVideo')||document.getElementById('homeVideo');
const mirrors=[...document.querySelectorAll('.lux-video.mirror')];const control=document.getElementById('pause'),fallback=document.getElementById('playFallback');
const wide=matchMedia('(min-width:761px)'),reduce=matchMedia('(prefers-reduced-motion: reduce)');let userPaused=reduce.matches;
primary.muted=true;primary.defaultMuted=true;primary.playsInline=true;
function setPausedFlag(value){userPaused=value;if(typeof paused!=='undefined')paused=value}
function update(){const stopped=primary.paused;control.textContent=stopped?'▷':'II';control.setAttribute('aria-label',stopped?'Riprendi i video':'Metti in pausa i video')}
function pauseMirrors(){mirrors.forEach(v=>v.pause())}
function sync(v){if(primary.readyState>0&&v.readyState>0&&Math.abs(v.currentTime-primary.currentTime)>.2){try{v.currentTime=primary.currentTime}catch{}}}
function resumeMirrors(){if(!wide.matches||primary.paused)return;mirrors.forEach(v=>{v.muted=true;v.defaultMuted=true;sync(v);v.play().catch(()=>{})})}
function configureMirrors(){mirrors.forEach(v=>{if(wide.matches&&!v.getAttribute('src')){v.src=v.dataset.src;v.load()}if(!wide.matches){v.pause();v.removeAttribute('src');v.load()}});resumeMirrors()}
async function resume(){if(userPaused||document.hidden||document.getElementById('modal')?.open)return;primary.muted=true;try{await primary.play();fallback.hidden=true;resumeMirrors()}catch{fallback.hidden=false}update()}
function start(){setPausedFlag(false);if(primary.error)primary.load();resume()}
control.onclick=()=>{if(primary.paused){start()}else{setPausedFlag(true);primary.pause();pauseMirrors();fallback.hidden=false;update()}};fallback.onclick=start;
primary.addEventListener('playing',()=>{fallback.hidden=true;resumeMirrors();update()});
primary.addEventListener('pause',()=>{pauseMirrors();update();if(!document.getElementById('modal')?.open&&!document.hidden)fallback.hidden=false});
primary.addEventListener('timeupdate',()=>{if(wide.matches&&!primary.paused)mirrors.forEach(sync)});
primary.addEventListener('seeking',()=>mirrors.forEach(sync));
primary.addEventListener('error',()=>{fallback.hidden=false;update()});
for(const event of ['loadeddata','canplay'])primary.addEventListener(event,resume);
mirrors.forEach(v=>v.addEventListener('loadeddata',()=>{sync(v);resumeMirrors()}));
window.addEventListener('pageshow',resume);document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseMirrors();else resume()});
document.addEventListener('pointerdown',()=>{if(!userPaused&&primary.paused)resume()},{once:true});
wide.addEventListener('change',configureMirrors);reduce.addEventListener('change',e=>{if(e.matches){setPausedFlag(true);primary.pause();pauseMirrors();fallback.hidden=false;update()}});
window.luxMedia={resume,pause:()=>{primary.pause();pauseMirrors()},start};
configureMirrors();if(userPaused){primary.removeAttribute('autoplay');primary.pause();fallback.hidden=false}else resume();update();
})();
