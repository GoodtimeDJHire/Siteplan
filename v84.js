// SitePlan V84: keep tender header actions grouped and visible
(()=>{
'use strict';
function tidyTenderHeader(){
  const module=document.getElementById('tendersModule');
  const head=module?.querySelector('.page-head');
  if(!head)return;

  let actions=head.querySelector('.sp-tender-head-actions');
  const newTender=document.getElementById('newTenderBtn');
  const brief=head.querySelector('[data-event-brief]');
  if(!actions){
    actions=document.createElement('div');
    actions.className='sp-tender-head-actions';
    head.appendChild(actions);
  }
  if(newTender&&newTender.parentElement!==actions)actions.appendChild(newTender);
  if(brief&&brief.parentElement!==actions)actions.appendChild(brief);
  if(brief){brief.classList.add('btn','primary','sp-brief-btn');brief.style.display=''}
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
