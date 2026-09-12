// SitePlan V88: quote-card attachments and attachment links in organiser emails
(()=>{
'use strict';
const safe=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const css=document.createElement('style');css.textContent=`
.quote-file-inline{margin-top:10px}.quote-file-state{font-size:11px;color:var(--muted)}
.quote-file-links{display:flex;flex-wrap:wrap;gap:6px}.quote-file-link{display:inline-flex;align-items:center;gap:6px;max-width:100%;padding:7px 9px;border-radius:8px;background:#202a31;border:1px solid #3b4a54;color:#dfffb8;text-decoration:none;font-size:11px;font-weight:850}.quote-file-link span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.quote-file-link:hover{border-color:#a8ff35}.quote-file-error{color:#ff8c98;font-size:11px}
`;document.head.appendChild(css);

function prepareCards(tender){
 const cards=[...document.querySelectorAll('#quoteModalContent .quote-card')];
 cards.forEach((card,i)=>{
  const quote=tender?.quotes?.[i];
  card.dataset.submissionId=String(quote?.id||'');
  const supplier=card.querySelector('.quote-supplier');
  if(supplier&&!supplier.querySelector('.quote-file-inline'))supplier.insertAdjacentHTML('beforeend','<div class="quote-file-inline"><span class="quote-file-state">Loading quote file…</span></div>');
 });
 const oldList=document.getElementById('tenderAttachments');
 if(oldList){oldList.style.display='none';const heading=oldList.previousElementSibling;if(heading?.classList.contains('section-title'))heading.style.display='none'}
 return cards;
}

async function loadCardFiles(tenderId,cards){
 try{
  if(typeof siteplanCloud==='undefined'||!siteplanCloudUser)throw new Error('Sign in again to view quote files');
  const {data:files,error}=await siteplanCloud.from('tender_files').select('submission_id,storage_path,file_name').eq('tender_id',tenderId).order('created_at',{ascending:true});
  if(error)throw error;
  for(const card of cards){
   const host=card.querySelector('.quote-file-inline');if(!host)continue;
   const matches=(files||[]).filter(f=>String(f.submission_id)===card.dataset.submissionId);
   if(!matches.length){host.innerHTML='<span class="quote-file-state">No quote file attached</span>';continue}
   const links=[];
   for(const f of matches){
    const {data,error}=await siteplanCloud.storage.from('tender-files').createSignedUrl(f.storage_path,3600,{download:f.file_name});
    if(error)throw error;
    if(data?.signedUrl)links.push(`<a class="quote-file-link" href="${safe(data.signedUrl)}" target="_blank" rel="noopener"><span>📎 ${safe(f.file_name||'Open quote PDF')}</span></a>`);
   }
   host.innerHTML=links.length?`<div class="quote-file-links">${links.join('')}</div>`:'<span class="quote-file-error">Could not create file link</span>';
  }
 }catch(error){console.error('Load quote files',error);cards.forEach(card=>{const host=card.querySelector('.quote-file-inline');if(host)host.innerHTML=`<span class="quote-file-error">${safe(error?.message||'Could not load quote file')}</span>`})}
}

const originalOpen=window.openTenderView;
if(typeof originalOpen==='function')window.openTenderView=function(id){
 const out=originalOpen.apply(this,arguments);
 const tender=(typeof tenders!=='undefined'?(tenders||[]):[]).find(x=>String(x.id)===String(id));
 const cards=prepareCards(tender);if(cards.length)loadCardFiles(id,cards);return out;
};

// V65 replaced the newer submitter, so keep the upload result and pass its secure URL to the email function.
window.submitDemoQuote=async function(id){
 const t=tenders.find(x=>x.id===id);if(!t)return;const btn=byId('publicSubmitBtn');
 const company=byId('qCompany')?.value.trim(),email=byId('qEmail')?.value.trim();if(!company||!email){toast('Company and email are required');return}
 const contact=byId('qContact')?.value.trim()||'',phone=byId('qPhone')?.value.trim()||'',availability=byId('qAvailability')?.value.trim()||'',notes=byId('qNotes')?.value.trim()||'',inclusions=byId('qInclusions')?.value.trim()||'';
 const net=Number(byId('qNet')?.value)||0,gst=Number(byId('qGstAmount')?.value)||0,total=Number(byId('qPrice')?.value)||0;
 btn.disabled=true;btn.textContent='Submitting…';
 try{
  const d=await publicTenderRequest(t.publicToken||t.id,'POST',{company_name:company,contact_name:contact,email,phone,price:total||null,gst_included:!!byId('qGST')?.checked,availability,notes,inclusions,exclusions:'',answers:{net,gst_amount:gst}});
  let attachmentUrl='',attachmentName='';const f=byId('qFile')?.files?.[0];
  if(f){const fd=new FormData();fd.append('upload_token',d.upload_token);fd.append('file',f);const r=await fetch(`${SITEPLAN_SUPABASE_URL}/functions/v1/tender-file-upload`,{method:'POST',headers:{'Authorization':`Bearer ${SITEPLAN_EDGE_ANON}`,'apikey':SITEPLAN_EDGE_ANON},body:fd});const u=await r.json().catch(()=>({}));if(!r.ok)throw new Error(u.error||'Quote submitted but file upload failed');attachmentUrl=String(u.signed_url||'');attachmentName=String(u.file_name||f.name||'')}
  const nr=await fetch('/api/notify-quote',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:t.publicToken||t.id,company,contact,email,net,gst,total,inclusions,notes,attachmentUrl,attachmentName})});
  if(!nr.ok){const x=await nr.json().catch(()=>({}));console.warn('Quote notification',x.error||nr.status)}
  byId('quoteModalContent').innerHTML='<div class="public-card" style="text-align:center;padding:42px"><div style="font-size:38px">✓</div><h2>Quote submitted</h2><p class="muted">Your private response has been sent to the event organiser.</p></div>';toast('Private quote submitted');
 }catch(e){console.error(e);toast(e.message||'Could not submit quote');btn.disabled=false;btn.textContent='Submit Private Quote'}
};
})();
