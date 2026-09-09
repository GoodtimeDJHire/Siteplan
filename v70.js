// SitePlan V70: mobile tender opening + planner state isolation
(()=>{
const isMobile=()=>window.matchMedia('(max-width:900px)').matches;
const visible=el=>!!(el&&getComputedStyle(el).display!=='none'&&!el.classList.contains('hidden'));

const style=document.createElement('style');
style.textContent=`
@media(max-width:900px){
  body.sp-mobile-nonplanner .sp-mobile-planner-nav,body.sp-mobile-nonplanner .sp-mobile-planner-head{display:none!important}
  #quoteModal:not(.hidden),.modal:not(.hidden){z-index:1200!important;align-items:flex-start!important;overflow-y:auto!important;-webkit-overflow-scrolling:touch!important}
  #quoteModal:not(.hidden) .modal-card,.modal:not(.hidden) .modal-card{width:calc(100vw - 16px)!important;max-width:calc(100vw - 16px)!important;max-height:none!important;margin:8px auto 90px!important;overflow:visible!important}
  .tender{cursor:pointer!important}
  .tender:active{transform:scale(.995)}
  .tender-actions{position:relative!important;z-index:3!important}
}
`;
document.head.appendChild(style);

function procurementIsVisible(){
  const procure=document.querySelector('.procure');
  if(!procure)return false;
  const mod=procure.closest('.module');
  return visible(procure)&&(!mod||visible(mod));
}
function anyModalOpen(){return [...document.querySelectorAll('.modal')].some(m=>visible(m));}
function leavePlannerMode(){
  document.body.classList.remove('mobile-planner-open');
  document.body.classList.add('sp-mobile-nonplanner');
}
function syncMode(){
  if(!isMobile()){
    document.body.classList.remove('sp-mobile-nonplanner');
    return;
  }
  if(procurementIsVisible()||anyModalOpen())leavePlannerMode();
  else document.body.classList.remove('sp-mobile-nonplanner');
}

// Make tender cards themselves openable on phones, while preserving the existing buttons.
document.addEventListener('click',e=>{
  if(!isMobile())return;
  const card=e.target.closest('.tender');
  if(!card)return;
  if(e.target.closest('button,a,input,select,textarea,label'))return;
  const view=[...card.querySelectorAll('button')].find(b=>/^view$/i.test((b.textContent||'').trim()));
  if(view){
    leavePlannerMode();
    view.click();
  }
},true);

// Before any tender action opens a modal, remove planner-only mobile chrome.
document.addEventListener('pointerdown',e=>{
  if(!isMobile())return;
  const btn=e.target.closest('.tender-actions button');
  if(btn)leavePlannerMode();
},true);

// Explicitly isolate non-planner tabs from the mobile planner shell.
document.addEventListener('click',e=>{
  if(!isMobile())return;
  const tab=e.target.closest('.nav-tab');
  if(!tab)return;
  const text=(tab.textContent||'').toLowerCase();
  if(/procure|tender|supplier|dashboard|event/.test(text))setTimeout(leavePlannerMode,0);
},true);

// Ensure a tender modal always becomes the active mobile surface.
if(typeof window.openTenderView==='function'){
  const oldOpenTenderView=window.openTenderView;
  window.openTenderView=function(){
    if(isMobile())leavePlannerMode();
    const r=oldOpenTenderView.apply(this,arguments);
    if(isMobile())setTimeout(()=>{
      leavePlannerMode();
      const modal=document.getElementById('quoteModal');
      if(modal){modal.classList.remove('hidden');modal.scrollTop=0;}
      window.scrollTo(0,0);
    },0);
    return r;
  };
}

const observer=new MutationObserver(syncMode);
observer.observe(document.body,{subtree:true,attributes:true,attributeFilter:['class']});
window.addEventListener('resize',syncMode,{passive:true});
setTimeout(syncMode,100);
})();
