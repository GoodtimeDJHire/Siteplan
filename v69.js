// SitePlan V69: mobile-first planner navigation and tighter phone layouts
(()=>{
const style=document.createElement('style');
style.textContent=`
@media(max-width:900px){
  body.mobile-planner-open .workspace{display:block!important;padding-bottom:74px!important}
  body.mobile-planner-open .map-wrap,body.mobile-planner-open .sidebar,body.mobile-planner-open .inspector{display:none!important}
  body.mobile-planner-open[data-mobile-planner-view="map"] .map-wrap{display:block!important;height:calc(100dvh - 210px)!important;min-height:430px!important}
  body.mobile-planner-open[data-mobile-planner-view="tools"] .sidebar{display:block!important;min-height:calc(100dvh - 210px)!important;border-top:0!important}
  body.mobile-planner-open[data-mobile-planner-view="details"] .inspector{display:block!important;min-height:calc(100dvh - 210px)!important;border-top:0!important}
  .sp-mobile-planner-nav{position:fixed;left:10px;right:10px;bottom:calc(10px + env(safe-area-inset-bottom));z-index:260;display:none;grid-template-columns:repeat(3,1fr);gap:6px;padding:7px;background:rgba(13,17,22,.96);border:1px solid var(--line);border-radius:16px;box-shadow:0 10px 34px rgba(0,0,0,.42);backdrop-filter:blur(12px)}
  body.mobile-planner-open .sp-mobile-planner-nav{display:grid}
  .sp-mobile-planner-nav button{border:1px solid var(--line);background:var(--panel2);color:var(--muted);border-radius:11px;min-height:48px;font-weight:900;font-size:12px}
  .sp-mobile-planner-nav button.active{background:var(--green);border-color:var(--green);color:#0b0d10}
  .sp-mobile-planner-head{display:flex!important;align-items:center!important;gap:8px!important;margin:0 0 10px!important;padding:10px 12px!important;background:#0f1419!important;border-bottom:1px solid var(--line)!important;position:sticky!important;top:0!important;z-index:40!important}
  .sp-mobile-planner-head .sp-back{flex:none!important}.sp-mobile-planner-head .sp-event-label{min-width:0!important;flex:1!important}.sp-mobile-planner-head b{display:block!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;font-size:14px!important}.sp-mobile-planner-head small{display:block!important;color:var(--muted)!important;margin-top:2px!important}
  body.mobile-planner-open header{display:none!important}
  body.mobile-planner-open .module:not(.hidden){padding-top:0!important}
  body.mobile-planner-open .map-tip{top:12px!important}
  .sidebar .section-title,.inspector .section-title{font-size:12px!important;margin-top:8px!important}
  .sidebar .tool-list{grid-template-columns:repeat(2,minmax(0,1fr))!important;display:grid!important}.sidebar .tool{min-height:48px!important}
  .inspector .mini-actions{display:grid!important;grid-template-columns:1fr 1fr!important}.inspector .mini-actions .btn{width:100%!important}
}
@media(max-width:560px){
  body.mobile-planner-open[data-mobile-planner-view="map"] .map-wrap{height:calc(100dvh - 145px)!important;min-height:390px!important}
  .sp-mobile-planner-nav{left:8px;right:8px;bottom:calc(8px + env(safe-area-inset-bottom));padding:6px;border-radius:14px}
  .sp-mobile-planner-nav button{min-height:46px;font-size:11px}
}
`;
document.head.appendChild(style);

const isMobile=()=>window.matchMedia('(max-width:900px)').matches;
let mobileView='map';

function plannerVisible(){
 const workspace=document.querySelector('.workspace');
 if(!workspace)return false;
 const module=workspace.closest('.module');
 return !module || !module.classList.contains('hidden');
}

function ensurePlannerNav(){
 if(document.querySelector('.sp-mobile-planner-nav'))return;
 const nav=document.createElement('div');
 nav.className='sp-mobile-planner-nav';
 nav.innerHTML='<button type="button" data-view="map">Map</button><button type="button" data-view="tools">Add & tools</button><button type="button" data-view="details">Details</button>';
 document.body.appendChild(nav);
 nav.addEventListener('click',e=>{const btn=e.target.closest('button[data-view]');if(!btn)return;setMobilePlannerView(btn.dataset.view)});
}

function ensurePlannerHead(){
 const workspace=document.querySelector('.workspace');if(!workspace||workspace.previousElementSibling?.classList?.contains('sp-mobile-planner-head'))return;
 const head=document.createElement('div');head.className='sp-mobile-planner-head';
 head.innerHTML='<button type="button" class="btn sp-back">← Events</button><div class="sp-event-label"><b>Site plan</b><small>Map · tools · details</small></div>';
 workspace.parentNode.insertBefore(head,workspace);
 head.querySelector('.sp-back').onclick=()=>{
   const dashboardTab=[...document.querySelectorAll('.nav-tab')].find(x=>/dashboard|events/i.test(x.textContent||''));
   if(dashboardTab){dashboardTab.click();return}
   const fn=window.showDashboard||window.openDashboard;if(typeof fn==='function')fn();
 };
}

function refreshHead(){
 const head=document.querySelector('.sp-mobile-planner-head');if(!head)return;
 const label=head.querySelector('b');
 const active=(typeof activeEvent==='function'?activeEvent():null);
 const input=document.querySelector('.event-name');
 label.textContent=active?.name||input?.value||'Site plan';
}

function setMobilePlannerView(view){
 mobileView=['map','tools','details'].includes(view)?view:'map';
 document.body.dataset.mobilePlannerView=mobileView;
 document.querySelectorAll('.sp-mobile-planner-nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===mobileView));
 if(mobileView==='map'&&window.map&&google?.maps?.event){setTimeout(()=>google.maps.event.trigger(map,'resize'),80)}
 window.scrollTo({top:0,behavior:'instant'});
}

function syncMobilePlanner(){
 ensurePlannerNav();ensurePlannerHead();refreshHead();
 const on=isMobile()&&plannerVisible();
 document.body.classList.toggle('mobile-planner-open',on);
 if(on)setMobilePlannerView(mobileView);
}

// When an event is opened on mobile, start on Map but provide permanent navigation out of it.
if(typeof window.openEvent==='function'){
 const oldOpenEvent=window.openEvent;
 window.openEvent=function(){const r=oldOpenEvent.apply(this,arguments);if(isMobile()){mobileView='map';setTimeout(syncMobilePlanner,80)}return r};
}

// Keep state correct when the app swaps modules/tabs.
const observer=new MutationObserver(()=>syncMobilePlanner());
observer.observe(document.body,{subtree:true,attributes:true,attributeFilter:['class']});
window.addEventListener('resize',syncMobilePlanner,{passive:true});
window.addEventListener('orientationchange',()=>setTimeout(syncMobilePlanner,150),{passive:true});
setTimeout(syncMobilePlanner,100);
})();
