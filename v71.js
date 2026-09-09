// SitePlan V71: isolated mobile-only event navigation (no core function overrides)
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
  .sp-mobile-eventbar button.sp-tenders{background:var(--green);border-color:var(--green);color:#0b0d10}
  body.sp-mobile-in-event #plannerModule{padding-bottom:76px!important}
}
`;document.head.appendChild(css);

const bar=document.createElement('div');bar.className='sp-mobile-eventbar';bar.innerHTML=`<button class="sp-home" data-go="dashboard">← Events</button><button data-go="planner">Map</button><button class="sp-tenders" data-go="tenders">Tenders</button><button data-go="budget">Budget</button>`;document.body.appendChild(bar);

function tabFor(name){return document.querySelector(`.nav-tab[data-module="${name}"]`)}
bar.addEventListener('click',e=>{const b=e.target.closest('button[data-go]');if(!b)return;const t=tabFor(b.dataset.go);if(t)t.click()});

function sync(){
 if(!mobile()){document.body.classList.remove('sp-mobile-in-event');return}
 const planner=document.getElementById('plannerModule');
 const dashboard=document.getElementById('dashboardModule');
 const tenders=document.getElementById('tendersModule');
 const budget=document.getElementById('budgetModule');
 const suppliers=document.getElementById('suppliersModule');
 const eventContext=[planner,tenders,budget,suppliers].some(x=>x&&!x.classList.contains('hidden'));
 document.body.classList.toggle('sp-mobile-in-event',eventContext && !!dashboard);
}

document.addEventListener('click',()=>setTimeout(sync,0),true);
window.addEventListener('resize',sync,{passive:true});
setTimeout(sync,250);
})();
