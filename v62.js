// SitePlan V62 automatic tender sharing + supplier checkbox alignment
(()=>{
const style=document.createElement('style');
style.textContent=`
  #supplierCategories .check-card,
  #supplierRegions .check-card{
    display:flex!important;
    align-items:center!important;
    justify-content:space-between!important;
    gap:12px!important;
    min-height:38px!important;
    width:100%!important;
    padding:8px 10px!important;
    box-sizing:border-box!important;
  }
  #supplierCategories .check-card span,
  #supplierRegions .check-card span{
    flex:1 1 auto!important;
    min-width:0!important;
    line-height:1.25!important;
  }
  #supplierCategories .check-card input[type="checkbox"],
  #supplierRegions .check-card input[type="checkbox"]{
    order:2!important;
    flex:0 0 auto!important;
    margin:0!important;
    align-self:center!important;
  }
`;
document.head.appendChild(style);

shareTenderToAll=async function(id){
  const t=tenders.find(x=>x.id===id);if(!t)return;
  if(!siteplanCloudUser){openAuthModal();toast('Sign in before sending tenders');return}
  const matches=matchingSuppliers(t);
  if(!matches.length){toast('No matching suppliers for this category and region');return}

  const preview=matches.map(s=>`• ${s.company} — ${s.email}`).join('\n');
  const ok=confirm(`Send this tender to ${matches.length} matching supplier${matches.length===1?'':'s'}?\n\n${preview}`);
  if(!ok)return;

  let session;
  try{session=(await siteplanCloud.auth.getSession()).data?.session}catch(e){}
  const token=session?.access_token;
  if(!token){toast('Your session expired. Please sign in again.');return}

  toast(`Sending tender to ${matches.length} supplier${matches.length===1?'':'s'}…`);
  try{
    const r=await fetch('/api/send-tender',{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`},
      body:JSON.stringify({tenderId:t.id})
    });
    const d=await r.json().catch(()=>({}));
    if(!r.ok)throw new Error(d.error||'Tender email could not be sent');
    toast(`Tender sent successfully to ${d.sent} supplier${d.sent===1?'':'s'}`);
  }catch(e){
    console.error('Tender email',e);
    toast(e.message||'Tender email could not be sent');
  }
};
})();
