// SitePlan V89: owner-only quote deletion
(()=>{
'use strict';
const safe=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const css=document.createElement('style');css.textContent=`
.quote-delete-btn{grid-column:1/-1;border-color:#6b3038!important;color:#ff8c98!important;background:rgba(255,80,95,.05)!important}
.quote-delete-btn:hover{background:rgba(255,80,95,.13)!important}
`;document.head.appendChild(css);

window.deleteTenderQuote=async function(tenderId,submissionId,company,button){
 if(!confirm(`Delete the quote from ${company||'this supplier'}? This permanently removes the submission and its uploaded files.`))return;
 const btn=button instanceof HTMLElement?button:null,label=btn?.textContent||'Delete quote';
 if(btn){btn.disabled=true;btn.textContent='Deleting…'}
 try{
  const session=(await siteplanCloud.auth.getSession()).data?.session;if(!session)throw new Error('Your session expired. Please sign in again.');
  const response=await fetch('/api/delete-quote',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${session.access_token}`},body:JSON.stringify({tenderId,submissionId})});
  const result=await response.json().catch(()=>({}));if(!response.ok)throw new Error(result.error||'Quote could not be deleted');
  await refreshCloudTenders();openTenderView(tenderId);toast(`${result.deletedQuote||'Quote'} deleted`);
 }catch(error){console.error('Delete quote',error);toast(error?.message||'Quote could not be deleted');if(btn){btn.disabled=false;btn.textContent=label}}
};

function addDeleteButtons(){
 document.querySelectorAll('#quoteModalContent .quote-card').forEach(card=>{
  const actions=card.querySelector('.quote-status-actions');if(!actions||actions.querySelector('.quote-delete-btn'))return;
  const decision=actions.querySelector('[onclick*="setCloudQuoteStatus"]')?.getAttribute('onclick')||'';
  const ids=decision.match(/setCloudQuoteStatus\('([^']+)'\s*,\s*'([^']+)'/);if(!ids)return;
  const company=card.querySelector('.quote-supplier h3')?.textContent?.trim()||'this supplier';
  const button=document.createElement('button');button.type='button';button.className='btn danger quote-delete-btn';button.textContent='Delete quote';
  button.onclick=()=>deleteTenderQuote(ids[1],ids[2],company,button);actions.appendChild(button);
 });
}
const host=document.getElementById('quoteModalContent');if(host)new MutationObserver(addDeleteButtons).observe(host,{childList:true,subtree:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(addDeleteButtons,0));else setTimeout(addDeleteButtons,0);
})();

