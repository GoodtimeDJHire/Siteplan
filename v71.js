// SitePlan V71: isolated mobile-only event navigation (no core data overrides)
(()=>{
const mobile=()=>matchMedia('(max-width:900px)').matches;
const css=document.createElement('style');css.textContent=`
.sp-mobile-eventbar{display:none}
@media(max-width:900px){
  body.sp-mobile-in-event{padding-bottom:78px!important}
  body.sp-mobile-in-event .sp-mobile-eventbar{display:grid!important}
  .sp-mobile-eventbar{position:fixed;z-index:245;left:8px;right:8px;bottom:calc(8px + env(safe-area-inset-bottom));grid-template-columns:repeat(4,1fr);gap:5px;padding:6px;background:rgba(12,16,20,.97);border:1px solid var(--line);border-radius:15px;box-shadow:0 10px 35px rgba(0,0,0,.45)}
  .sp-mobile-eventbar button{min-width:0;min-height:48px;border:1px solid var(--line);border-radius:10px;background:var(--panel2);color:var(--text);font-size:11px;font-weight:900;padding:6px 3px}
  .sp-mobile-eventbar button.sp-home{color:var(--muted)}
  .sp-mobile-eventbar button.active{background:var(--green)!important;border-color:var(--green)!important;color:#0b0d10!important}
  body.sp-mobile-in-event #plannerModule{padding-bottom:76px!important}
}
`;document.head.appendChild(css);

const bar=document.createElement('div');bar.className='sp-mobile-eventbar';bar.innerHTML=`<button class="sp-home" data-go="dashboard">← Events</button><button data-go="planner">Map</button><button data-go="tenders">Tenders</button><button data-go="budget">Budget</button>`;document.body.appendChild(bar);

function moduleOpen(name){const el=document.getElementById(name+'Module');return !!(el&&!el.classList.contains('hidden'))}
function activeModule(){for(const n of ['dashboard','planner','tenders','budget','suppliers'])if(moduleOpen(n))return n;return ''}
function paintActive(){const current=activeModule();bar.querySelectorAll('button[data-go]').forEach(b=>b.classList.toggle('active',b.dataset.go===current))}
function go(name){
  if(typeof window.switchModule==='function') window.switchModule(name);
  else {
    const t=document.querySelector(`.nav-tab[data-module="${name}"]`);
    if(t) t.click();
  }
  if(name==='planner') setTimeout(()=>{try{if(window.map&&window.google?.maps?.event){window.google.maps.event.trigger(window.map,'resize')}}catch(e){}},80);
  setTimeout(()=>{sync();paintActive()},0);
}
bar.addEventListener('click',e=>{const b=e.target.closest('button[data-go]');if(!b)return;e.preventDefault();e.stopPropagation();go(b.dataset.go)});

function sync(){
 if(!mobile()){document.body.classList.remove('sp-mobile-in-event');paintActive();return}
 const current=activeModule();
 document.body.classList.toggle('sp-mobile-in-event',['planner','tenders','budget','suppliers'].includes(current));
 paintActive();
}

const observer=new MutationObserver(()=>requestAnimationFrame(sync));
['dashboardModule','plannerModule','tendersModule','budgetModule','suppliersModule'].forEach(id=>{const el=document.getElementById(id);if(el)observer.observe(el,{attributes:true,attributeFilter:['class']})});
document.addEventListener('click',()=>setTimeout(sync,0),true);
window.addEventListener('resize',sync,{passive:true});
setTimeout(sync,250);
})();
