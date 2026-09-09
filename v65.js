// SitePlan V65: tender history wording, rebuilt quote comparison, organiser quote notifications
(()=>{
function relabelTenderHistory(){
  document.querySelectorAll('.section-title').forEach(el=>{
    const text=(el.textContent||'').trim().toLowerCase();
    if(text==='past event tender history') el.textContent='Other Event Tenders';
  });
}

const style=document.createElement('style');
style.textContent=`
#quoteModal .modal-card{width:min(1120px,96vw)!important;max-height:92vh!important}
#quoteModal .quote-table-wrap,#quoteModal .quote-table{display:none!important}
.quote-card-list{display:grid;gap:12px;margin-top:10px}
.quote-card{border:1px solid var(--line);border-radius:14px;background:#10151a;padding:16px;display:grid;grid-template-columns:minmax(210px,1.15fr) minmax(270px,1.25fr) minmax(240px,1fr);gap:18px;align-items:start}
.quote-card.best{background:rgba(168,255,53,.055);border-color:#41542a}
.quote-supplier h3{margin:0 0 3px;font-size:17px}.quote-supplier small{display:block;color:var(--muted);line-height:1.4;overflow-wrap:anywhere}.quote-best{color:var(--green);font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.08em;margin:4px 0 8px}
.quote-price-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.quote-price{border:1px solid var(--line);border-radius:10px;padding:10px;background:#0d1116}.quote-price span{display:block;color:var(--muted);font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:.08em}.quote-price b{display:block;font-size:17px;margin-top:3px}.quote-details{margin-top:10px;color:var(--text);font-size:12px;line-height:1.45}.quote-details div+div{margin-top:5px}.quote-details strong{color:var(--muted)}
.quote-decision{display:grid;gap:10px}.quote-decision-head{display:flex;align-items:center;justify-content:space-between;gap:8px}.quote-decision .quote-status-actions{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}.quote-decision .quote-status-actions .btn{padding:8px 7px;font-size:10px;white-space:nowrap;width:100%}.quote-submitted{color:var(--muted);font-size:10px}.quote-empty{border:1px dashed var(--line);border-radius:12px;padding:18px;color:var(--muted)}
@media(max-width:900px){.quote-card{grid-template-columns:1fr 1fr}.quote-decision{grid-column:1/-1}.quote-decision .quote-status-actions{grid-template-columns:repeat(3,1fr)}}
@media(max-width:620px){#quoteModal .modal-card{width:96vw!important;padding:14px!important}.quote-card{grid-template-columns:1fr;gap:12px;padding:13px}.quote-decision{grid-column:auto}.quote-price-grid{grid-template-columns:repeat(3,1fr)}.quote-decision .quote-status-actions{grid-template-columns:1fr}.quote-decision .quote-status-actions .btn{font-size:11px}}
`;
document.head.appendChild(style);

relabelTenderHistory();
const oldRenderTenders=renderTenders;
renderTenders=function(){const result=oldRenderTenders.apply(this,arguments);relabelTenderHistory();return result};

openTenderView=function(id){
 const t=tenders.find(x=>x.id===id);if(!t)return;
 const qs=t.quotes||[],priced=qs.filter(q=>Number(q.total)>0),lowest=priced.length?Math.min(...priced.map(q=>Number(q.total))):0,highest=priced.length?Math.max(...priced.map(q=>Number(q.total))):0,awarded=qs.find(q=>q.status==='awarded');
 const quoteCards=qs.map(q=>{
   const best=lowest&&Number(q.total)===lowest;
   const submitted=q.submitted?new Date(q.submitted).toLocaleString('en-NZ',{dateStyle:'medium',timeStyle:'short'}):'';
   return `<div class="quote-card ${best?'best':''}">
    <div class="quote-supplier"><h3>${esc(q.company)}</h3>${best?'<div class="quote-best">Lowest quote</div>':''}<small>${esc(q.contact||'No contact name')}</small><small>${esc(q.email||'')}</small>${submitted?`<div class="quote-submitted" style="margin-top:8px">Submitted ${esc(submitted)}</div>`:''}</div>
    <div><div class="quote-price-grid"><div class="quote-price"><span>Net</span><b>${q.net?money(q.net):'—'}</b></div><div class="quote-price"><span>GST</span><b>${q.gstAmount?money(q.gstAmount):'—'}</b></div><div class="quote-price"><span>Total</span><b>${q.total?money(q.total):'—'}</b></div></div><div class="quote-details"><div><strong>Includes:</strong> ${esc(q.inclusions||'—')}</div><div><strong>Notes:</strong> ${esc(q.notes||'—')}</div></div></div>
    <div class="quote-decision"><div class="quote-decision-head"><span class="pill ${q.status==='awarded'?'awarded':'open'}">${esc(q.status||'submitted')}</span></div><div class="quote-status-actions"><button class="btn primary" onclick="setCloudQuoteStatus('${t.id}','${q.id}','awarded')">Award</button><button class="btn" onclick="setCloudQuoteStatus('${t.id}','${q.id}','shortlisted')">Shortlist</button><button class="btn danger" onclick="setCloudQuoteStatus('${t.id}','${q.id}','declined')">Decline</button></div></div>
   </div>`;
 }).join('');
 const link=publicLinkFor(t);
 const statusButtons=['Draft','Open','Closed'].map(st=>`<button class="btn ${t.status===st?'active':''}" onclick="setTenderStatus('${t.id}','${st}')">${st}</button>`).join('');
 byId('quoteModalContent').innerHTML=`<div class="modal-head"><div><h2>${esc(t.title)}</h2><small>${esc(t.eventName||'Event')} · ${esc(t.category)} · ${esc(t.region||'No region')}</small></div><button class="btn" onclick="byId('quoteModal').classList.add('hidden')">×</button></div><div class="tender-status-bar"><span class="label">Tender status</span>${statusButtons}${t.status==='Awarded'?'<span class="pill awarded">Awarded</span>':''}</div><p style="color:var(--muted)">${esc(t.brief||'No additional brief.')}</p><div class="section-title">Supplier link</div><div class="copy-link-box">${esc(link)}</div><div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap"><button class="btn primary" onclick="copyTenderLink('${t.id}')">Copy Tender Link</button><button class="btn" onclick="window.open('${link}','_blank')">Preview supplier form</button><button class="btn" onclick="refreshCloudTenders().then(()=>openTenderView('${t.id}'))">Refresh quotes</button></div><div class="section-title" style="margin-top:22px">Requirements</div>${(t.requirements||[]).map(r=>`<div class="summary-row"><span>${esc(r.name)}</span><strong>${esc(r.qty)} ${esc(r.unit)}</strong></div>`).join('')||'<div class="empty">No itemised requirements.</div>'}<div class="section-title" style="margin-top:22px">Quote comparison</div><div class="quote-summary-grid"><div class="quote-summary-card"><span>Quotes received</span><b>${qs.length}</b></div><div class="quote-summary-card"><span>Lowest</span><b>${lowest?money(lowest):'—'}</b></div><div class="quote-summary-card"><span>Range</span><b>${priced.length>1?money(highest-lowest):'—'}</b></div><div class="quote-summary-card"><span>Awarded</span><b>${awarded?esc(awarded.company):'—'}</b></div></div><div class="quote-card-list">${quoteCards||'<div class="quote-empty">No supplier quotes received yet.</div>'}</div><div class="section-title" style="margin-top:22px">Attachments</div><div id="tenderAttachments" class="attachment-list"><div class="empty">Checking supplier attachments…</div></div><div style="display:flex;gap:8px;margin-top:18px;flex-wrap:wrap"><button class="btn primary" onclick="editTender('${t.id}')">Edit Tender</button><button class="btn danger" onclick="deleteTender('${t.id}')">Delete tender</button></div>`;
 byId('quoteModal').classList.remove('hidden');
 loadTenderAttachments(t.id);
};

submitDemoQuote=async function(id){
 const t=tenders.find(x=>x.id===id);if(!t)return;const btn=byId('publicSubmitBtn');
 const company=byId('qCompany')?.value.trim(),email=byId('qEmail')?.value.trim();if(!company||!email){toast('Company and email are required');return}
 const contact=byId('qContact')?.value.trim()||'',phone=byId('qPhone')?.value.trim()||'',availability=byId('qAvailability')?.value.trim()||'',notes=byId('qNotes')?.value.trim()||'',inclusions=byId('qInclusions')?.value.trim()||'';
 const net=Number(byId('qNet')?.value)||0,gst=Number(byId('qGstAmount')?.value)||0,total=Number(byId('qPrice')?.value)||0;
 btn.disabled=true;btn.textContent='Submitting…';
 try{
  const d=await publicTenderRequest(t.publicToken||t.id,'POST',{company_name:company,contact_name:contact,email,phone,price:total||null,gst_included:!!byId('qGST')?.checked,availability,notes,inclusions,exclusions:'',answers:{net,gst_amount:gst}});
  const f=byId('qFile')?.files?.[0];
  if(f){const fd=new FormData();fd.append('upload_token',d.upload_token);fd.append('file',f);const r=await fetch(`${SITEPLAN_SUPABASE_URL}/functions/v1/tender-file-upload`,{method:'POST',headers:{'Authorization':`Bearer ${SITEPLAN_EDGE_ANON}`,'apikey':SITEPLAN_EDGE_ANON},body:fd});const u=await r.json().catch(()=>({}));if(!r.ok)throw new Error(u.error||'Quote submitted but file upload failed')}
  fetch('/api/notify-quote',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:t.publicToken||t.id,company,contact,email,net,gst,total,inclusions,notes})}).then(async r=>{if(!r.ok){const x=await r.json().catch(()=>({}));console.warn('Quote notification',x.error||r.status)}}).catch(e=>console.warn('Quote notification',e));
  byId('quoteModalContent').innerHTML=`<div class="public-card" style="text-align:center;padding:42px"><div style="font-size:38px">✓</div><h2>Quote submitted</h2><p class="muted">Your private response has been sent to the event organiser.</p></div>`;toast('Private quote submitted');
 }catch(e){toast(e.message);btn.disabled=false;btn.textContent='Submit Private Quote'}
};
})();
