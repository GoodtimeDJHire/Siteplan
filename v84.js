// SitePlan V84: simplify tender header actions
(()=>{
'use strict';
function tidyTenderHeader(){
  const module=document.getElementById('tendersModule');
  const head=module?.querySelector('.page-head');
  if(!head)return;
  [...head.querySelectorAll('button')].forEach(btn=>{
    const text=String(btn.textContent||'').replace(/\s+/g,' ').trim().replace(/^\+\s*/,'');
    if(/^New Tender$/i.test(text)){
      btn.style.display='none';
      btn.setAttribute('aria-hidden','true');
    }
  });
}
const observer=new MutationObserver(tidyTenderHeader);
observer.observe(document.documentElement,{childList:true,subtree:true});
document.addEventListener('click',e=>{
  if(e.target.closest('[data-module="tenders"],#navTenders,.mobile-nav-tenders'))setTimeout(tidyTenderHeader,0);
},true);
tidyTenderHeader();
setTimeout(tidyTenderHeader,250);
})();
