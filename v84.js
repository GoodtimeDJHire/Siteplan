// SitePlan V84: simplify tender header actions
(()=>{
'use strict';
function tidyTenderHeader(){
  const module=document.getElementById('tendersModule');
  const head=module?.querySelector('.page-head');
  if(!head)return;

  // V82 could append the email button inside the existing New Tender button.
  // If that happened, move the email button out first, then remove New Tender.
  const brief=head.querySelector('[data-event-brief]');
  if(brief){
    const parent=brief.parentElement;
    if(parent&&parent!==head&&parent.tagName==='BUTTON'){
      head.insertBefore(brief,parent);
      parent.remove();
    }
    brief.classList.add('btn','primary','sp-brief-btn');
    brief.style.display='';
  }

  [...head.querySelectorAll('button')].forEach(btn=>{
    if(btn.matches('[data-event-brief]'))return;
    const text=String(btn.textContent||'').replace(/\s+/g,' ').trim().replace(/^\+\s*/,'');
    if(/^New Tender$/i.test(text))btn.remove();
  });
}
const observer=new MutationObserver(tidyTenderHeader);
observer.observe(document.documentElement,{childList:true,subtree:true});
document.addEventListener('click',e=>{
  if(e.target.closest('[data-module="tenders"],#navTenders,.mobile-nav-tenders'))setTimeout(tidyTenderHeader,0);
},true);
tidyTenderHeader();
setTimeout(tidyTenderHeader,100);
setTimeout(tidyTenderHeader,400);
})();
