/* ---- v60.js ---- */
// SitePlan V60 procurement enhancements
(()=>{
const style=document.createElement('style');style.textContent='\n    /* V60 procurement workspace */\n    .tender-status-bar{display:flex;gap:7px;flex-wrap:wrap;align-items:center;margin:14px 0 18px;padding:12px;background:#0d1116;border:1px solid var(--line);border-radius:12px}.tender-status-bar .label{font-size:11px;color:var(--muted);font-weight:900;text-transform:uppercase;margin-right:4px}.tender-status-bar .btn.active{border-color:var(--green);color:var(--green)}\n    .quote-summary-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:9px;margin:12px 0 16px}.quote-summary-card{border:1px solid var(--line);border-radius:12px;padding:12px;background:#0d1116}.quote-summary-card span{display:block;color:var(--muted);font-size:10px;text-transform:uppercase;font-weight:900}.quote-summary-card b{display:block;font-size:18px;margin-top:4px}.quote-table-wrap{overflow:auto;border:1px solid var(--line);border-radius:12px}.quote-table-wrap .quote-table{margin:0;min-width:1050px}.quote-table tr.best{background:rgba(168,255,53,.055)}.quote-detail{max-width:220px;white-space:normal;line-height:1.35}.attachment-list{display:grid;gap:8px;margin-top:10px}.attachment-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:11px 12px;border:1px solid var(--line);border-radius:10px;background:#0d1116}.attachment-row small{color:var(--muted)}\n    @media(max-width:800px){.quote-summary-grid{grid-template-columns:1fr 1fr}}\n';document.head.appendChild(style);

openTenderView=function(id){
 const t=tenders.find(x=>x.id===id);if(!t)return;
 const qs=t.quotes||[], priced=qs.filter(q=>Number(q.total)>0), lowest=priced.length?Math.min(...priced.map(q=>Number(q.total))):0, highest=priced.length?Math.max(...priced.map(q=>Number(q.total))):0;
 const awarded=qs.find(q=>q.status==='awarded');
 const quotes=qs.map(q=>{const best=lowest&&Number(q.total)===lowest;return `<tr class="${best?'best':''}"><td><b>${esc(q.company)}</b>${best?'<br><small style="color:var(--green);font-weight:900">LOWEST QUOTE</small>':''}<br><small>${esc(q.email||'')}</small></td><td>${esc(q.contact||'—')}</td><td>${q.net?money(q.net):'—'}</td><td>${q.gstAmount?money(q.gstAmount):'—'}</td><td><b>${money(q.total)}</b></td><td class="quote-detail"><b>Includes:</b> ${esc(q.inclusions||'—')}<br><b>Notes:</b> ${esc(q.notes||'—')}</td><td><span class="pill ${q.status==='awarded'?'awarded':'open'}">${esc(q.status||'submitted')}</span></td><td><div class="quote-status-actions"><button class="btn primary" onclick="setCloudQuoteStatus('${t.id}','${q.id}','awarded')">Award</button><button class="btn" onclick="setCloudQuoteStatus('${t.id}','${q.id}','shortlisted')">Shortlist</button><button class="btn danger" onclick="setCloudQuoteStatus('${t.id}','${q.id}','declined')">Decline</button></div></td></tr>`}).join('');
 const link=publicLinkFor(t);
 const statusButtons=['Draft','Open','Closed'].map(st=>`<button class="btn ${t.status===st?'active':''}" onclick="setTenderStatus('${t.id}','${st}')">${st}</button>`).join('');
 byId('quoteModalContent').innerHTML=`<div class="modal-head"><div><h2>${esc(t.title)}</h2><small>${esc(t.eventName||'Event')} · ${esc(t.category)} · ${esc(t.region||'No region')}</small></div><button class="btn" onclick="byId('quoteModal').classList.add('hidden')">×</button></div><div class="tender-status-bar"><span class="label">Tender status</span>${statusButtons}${t.status==='Awarded'?'<span class="pill awarded">Awarded</span>':''}</div><p style="color:var(--muted)">${esc(t.brief||'No additional brief.')}</p><div class="quote-summary-grid"><div class="quote-summary-card"><span>Quotes received</span><b>${qs.length}</b></div><div class="quote-summary-card"><span>Lowest</span><b>${lowest?money(lowest):'—'}</b></div><div class="quote-summary-card"><span>Range</span><b>${priced.length>1?money(highest-lowest):'—'}</b></div><div class="quote-summary-card"><span>Awarded</span><b>${awarded?esc(awarded.company):'—'}</b></div></div><div class="section-title">Supplier link</div><div class="copy-link-box">${esc(link)}</div><div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap"><button class="btn primary" onclick="copyTenderLink('${t.id}')">Copy Tender Link</button><button class="btn" onclick="window.open('${link}','_blank')">Preview supplier form</button><button class="btn" onclick="refreshCloudTenders().then(()=>openTenderView('${t.id}'))">Refresh quotes</button></div><div class="section-title" style="margin-top:22px">Requirements</div>${(t.requirements||[]).map(r=>`<div class="summary-row"><span>${esc(r.name)}</span><strong>${esc(r.qty)} ${esc(r.unit)}</strong></div>`).join('')||'<div class="empty">No itemised requirements.</div>'}<div class="section-title" style="margin-top:22px">Quote comparison</div>${quotes?`<div class="quote-table-wrap"><table class="quote-table"><tr><th>Supplier</th><th>Contact</th><th>Net</th><th>GST</th><th>Total</th><th>Details</th><th>Status</th><th>Decision</th></tr>${quotes}</table></div>`:'<div class="empty">No supplier quotes received yet.</div>'}<div class="section-title" style="margin-top:22px">Attachments</div><div id="tenderAttachments" class="attachment-list"><div class="empty">Checking supplier attachments…</div></div><div style="display:flex;gap:8px;margin-top:18px;flex-wrap:wrap"><button class="btn primary" onclick="editTender('${t.id}')">Edit Tender</button><button class="btn danger" onclick="deleteTender('${t.id}')">Delete tender</button></div>`;
 byId('quoteModal').classList.remove('hidden');
 loadTenderAttachments(t.id);
};

async function setTenderStatus(tenderId,label){
 if(!siteplanCloudUser)return;const map={Draft:'draft',Open:'published',Closed:'closed'};const db=map[label];if(!db)return;
 const {error}=await siteplanCloud.from('tenders').update({status:db}).eq('id',tenderId).eq('owner_id',siteplanCloudUser.id);if(error){toast(error.message);return}
 await refreshCloudTenders();openTenderView(tenderId);toast('Tender '+label.toLowerCase());
}

async function loadTenderAttachments(tenderId){
 const host=byId('tenderAttachments');if(!host||!siteplanCloudUser)return;
 try{
  const {data,error}=await siteplanCloud.from('tender_files').select('*').eq('tender_id',tenderId).order('created_at',{ascending:false});if(error)throw error;
  if(!data?.length){host.innerHTML='<div class="empty">No supplier attachments uploaded.</div>';return}
  const rows=[];for(const f of data){const path=f.storage_path||f.path||f.file_path||f.object_path;let url='';if(path){const r=await siteplanCloud.storage.from('tender-files').createSignedUrl(path,3600);url=r.data?.signedUrl||''}const name=f.file_name||f.filename||String(path||'Supplier attachment').split('/').pop();rows.push(`<div class="attachment-row"><div><b>${esc(name)}</b><br><small>${f.created_at?new Date(f.created_at).toLocaleString():''}</small></div>${url?`<a class="btn" href="${esc(url)}" target="_blank" rel="noopener">View file</a>`:'<small>File unavailable</small>'}</div>`)}host.innerHTML=rows.join('');
 }catch(e){console.warn('Tender attachments',e);host.innerHTML='<div class="empty">No accessible supplier attachments found.</div>'}
}
})();

/* ---- v61.js ---- */
// SitePlan V61 supplier editing
(()=>{
let editingSupplierId='';

function fillChecks(hostId, values){
 const host=byId(hostId); if(!host)return;
 [...host.querySelectorAll('input[type="checkbox"]')].forEach(x=>x.checked=(values||[]).includes(x.value));
}

openSupplierModal=function(id=''){
 editingSupplierId=id||'';
 checkboxCards('supplierCategories',SUPPLIER_CATEGORIES);
 checkboxCards('supplierRegions',SUPPLIER_REGIONS);
 const s=editingSupplierId?suppliers.find(x=>x.id===editingSupplierId):null;
 byId('sCompany').value=s?.company||'';
 byId('sContact').value=s?.contact||'';
 byId('sEmail').value=s?.email||'';
 byId('sPhone').value=s?.phone||'';
 byId('sWebsite').value=s?.website||'';
 byId('sMinimum').value=s?.minimum||'';
 byId('sEventSize').value=s?.eventSize||'';
 byId('sCapabilities').value=s?.capabilities||'';
 byId('sInsurance').value=s?.insurance||'Yes';
 byId('sNotifications').value=s?.notifications||'all';
 fillChecks('supplierCategories',s?.categories||[]);
 fillChecks('supplierRegions',s?.regions||[]);
 const modal=byId('supplierModal');
 const title=modal?.querySelector('.modal-head h2'); if(title)title.textContent=s?'Edit Supplier':'Supplier Registration';
 const save=byId('saveSupplierBtn'); if(save)save.textContent=s?'Save Changes':'Create Supplier Profile';
 modal?.classList.remove('hidden');
};

addSupplier=async function(){
 const company=byId('sCompany').value.trim(),email=byId('sEmail').value.trim();
 if(!company||!email){toast('Add company name and email');return}
 if(!siteplanCloudUser){openAuthModal();return}
 const categories=[...byId('supplierCategories').querySelectorAll('input:checked')].map(x=>x.value),regions=[...byId('supplierRegions').querySelectorAll('input:checked')].map(x=>x.value);
 if(!categories.length||!regions.length){toast('Choose category and region');return}
 const row={company_name:company,contact_name:byId('sContact').value.trim()||null,email,phone:byId('sPhone').value.trim()||null,website:byId('sWebsite').value.trim()||null,categories,regions,minimum:Number(byId('sMinimum').value)||0,event_size:Number(byId('sEventSize').value)||0,capabilities:byId('sCapabilities').value.trim()||null,insurance:byId('sInsurance').value,notifications:byId('sNotifications').value,active:true};
 if(editingSupplierId){
   const {data,error}=await siteplanCloud.from('suppliers').update(row).eq('id',editingSupplierId).eq('owner_id',siteplanCloudUser.id).select().single();
   if(error){toast(error.message);return}
   const updated=cloudSupplierToLocal(data); suppliers=suppliers.map(s=>s.id===editingSupplierId?updated:s);
   localStorage.setItem('siteplan_suppliers',JSON.stringify(suppliers)); editingSupplierId=''; byId('supplierModal').classList.add('hidden'); renderSuppliers();renderTenders();renderSupplierDashboard();toast('Supplier updated');return;
 }
 row.owner_id=siteplanCloudUser.id;
 const {data,error}=await siteplanCloud.from('suppliers').insert(row).select().single();if(error){toast(error.message);return}
 suppliers.unshift(cloudSupplierToLocal(data));localStorage.setItem('siteplan_suppliers',JSON.stringify(suppliers));byId('supplierModal').classList.add('hidden');renderSuppliers();renderTenders();renderSupplierDashboard();toast('Supplier saved to cloud');
};

supplierCard=function(s){return `<div class="tender"><div><h3>${esc(s.company)}</h3><small>${esc(s.contact||'No contact')} · ${esc(s.email)}${s.phone?' · '+esc(s.phone):''}</small></div><span class="pill open">${s.active?'Active':'Paused'}</span><div style="grid-column:span 2"><small>${(s.categories||[]).map(esc).join(' · ')}</small><br><small>${(s.regions||[]).map(esc).join(' · ')} · Insurance: ${esc(s.insurance||'—')}</small></div><div class="tender-actions"><button class="btn" onclick="openSupplierModal('${s.id}')">Edit</button><button class="btn" onclick="useSupplier('${s.id}')">Dashboard</button><button class="btn danger" onclick="deleteSupplier('${s.id}')">Remove</button></div></div>`};

const save=byId('saveSupplierBtn');if(save)save.onclick=addSupplier;
const close=byId('closeSupplierModal');if(close)close.addEventListener('click',()=>{editingSupplierId=''});
renderSuppliers();
})();

/* ---- v62.js ---- */
// SitePlan V62 automatic tender sharing + aligned supplier checkboxes
(()=>{
const style=document.createElement('style');style.textContent=`
#supplierCategories .check-card,#supplierRegions .check-card{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:12px!important;min-height:38px!important;width:100%!important;padding:8px 10px!important;box-sizing:border-box!important}#supplierCategories .check-card span,#supplierRegions .check-card span{flex:1;line-height:1.25!important}#supplierCategories .check-card input,#supplierRegions .check-card input{order:2!important;flex:none!important;margin:0!important}
.sp-send-bg{position:fixed;inset:0;background:rgba(3,8,12,.8);backdrop-filter:blur(4px);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px}.sp-send{width:min(820px,96vw);max-height:90vh;overflow:auto;background:#0d161d;color:#f5f7f8;border:1px solid #344653;border-radius:18px;box-shadow:0 30px 90px #0009}.sp-head{display:flex;gap:16px;align-items:flex-start;padding:26px 28px 18px}.sp-icon{width:48px;height:48px;display:grid;place-items:center;border-radius:11px;background:#a8ff3520;color:#a8ff35;font-size:24px}.sp-title{font-size:24px;font-weight:800;margin-bottom:6px}.sp-sub,.sp-note{color:#aeb9c1;font-size:13px;line-height:1.5}.sp-x{margin-left:auto;border:0;background:none;color:#aeb9c1;font-size:27px;cursor:pointer}.sp-body{padding:0 28px 26px}.sp-box{background:#111d25;border:1px solid #2c3d48;border-radius:12px;padding:16px;margin-bottom:20px}.sp-box b{font-size:17px}.sp-meta{margin-top:7px;color:#aeb9c1;font-size:13px}.sp-label{font-size:16px;font-weight:800;margin-bottom:4px}.sp-list{border:1px solid #2c3d48;border-radius:12px;overflow:hidden;margin:10px 0 20px}.sp-row{display:grid;grid-template-columns:26px 1fr 1.2fr 1fr;gap:10px;align-items:center;padding:12px 14px;border-bottom:1px solid #25343e;font-size:13px}.sp-row:last-child{border-bottom:0}.sp-row input{width:17px;height:17px;accent-color:#a8ff35}.sp-muted{color:#aeb9c1}.sp-preview{font-size:13px;line-height:1.6}.sp-actions{display:flex;justify-content:space-between;gap:12px;margin-top:22px}.sp-btn{padding:12px 17px;border-radius:10px;border:1px solid #344653;background:#15222b;color:#fff;font-weight:750;cursor:pointer}.sp-btn.primary{background:#a8ff35;border-color:#a8ff35;color:#091015}.sp-btn:disabled{opacity:.55}@media(max-width:650px){.sp-head,.sp-body{padding-left:17px;padding-right:17px}.sp-row{grid-template-columns:25px 1fr}.sp-row .hide-mobile{display:none}.sp-title{font-size:20px}}
`;document.head.appendChild(style);
const due=t=>{const v=t.dueAt||t.due_at||t.due;if(!v)return'Not specified';try{return new Date(v).toLocaleDateString('en-NZ',{day:'numeric',month:'short',year:'numeric'})}catch(e){return String(v)}};
shareTenderToAll=async function(id){const t=tenders.find(x=>x.id===id);if(!t)return;if(!siteplanCloudUser){openAuthModal();toast('Sign in before sending tenders');return}const matches=matchingSuppliers(t);if(!matches.length){toast('No matching suppliers for this category and region');return}const ev=(events||[]).find(e=>e.id===(t.eventId||t.event_id));const eventName=ev?.name||'Event';const bg=document.createElement('div');bg.className='sp-send-bg';bg.innerHTML=`<div class="sp-send"><div class="sp-head"><div class="sp-icon">✉</div><div><div class="sp-title">Send Tender to Suppliers</div><div class="sp-sub">Review the matching suppliers below, then send the tender directly from SitePlan.</div></div><button class="sp-x">×</button></div><div class="sp-body"><div class="sp-box"><b>${esc(t.title||'Tender')}</b><div class="sp-meta">Event: ${esc(eventName)} &nbsp; | &nbsp; Category: ${esc(t.category||'Supplier')} &nbsp; | &nbsp; Response due: ${esc(due(t))}</div></div><div class="sp-label">Matched Suppliers (${matches.length})</div><div class="sp-note">Untick anyone you don't want to receive this tender.</div><div class="sp-list">${matches.map(s=>`<label class="sp-row"><input class="sp-pick" type="checkbox" value="${esc(s.id)}" checked><strong>${esc(s.company)}</strong><span class="sp-muted">${esc(s.email)}</span><span class="sp-muted hide-mobile">${esc((s.categories||[]).join(', '))}</span></label>`).join('')}</div><div class="sp-label">Email message</div><div class="sp-note">Suppliers receive the tender details and a private link to submit their quote.</div><div class="sp-box sp-preview"><b>Subject: Tender invitation: ${esc(t.title||'Tender')}</b><br><br>Hi [Supplier],<br><br>You're invited to submit a quote for <b>${esc(t.title||'this tender')}</b> for ${esc(eventName)}.<br><br>Category: ${esc(t.category||'Supplier')}<br>Region: ${esc(t.region||'Not specified')}<br>Quote due: ${esc(due(t))}<br><br><span style="color:#a8ff35;font-weight:800">View tender & submit private quote →</span><br><br><span class="sp-muted">Replies go directly to the event organiser.</span></div><div class="sp-actions"><button class="sp-btn cancel">Cancel</button><button class="sp-btn primary send">Send Tender</button></div></div></div>`;document.body.appendChild(bg);const close=()=>bg.remove();bg.querySelector('.sp-x').onclick=close;bg.querySelector('.cancel').onclick=close;bg.onclick=e=>{if(e.target===bg)close()};bg.querySelector('.send').onclick=async()=>{const selected=[...bg.querySelectorAll('.sp-pick:checked')].map(x=>x.value);if(!selected.length){toast('Select at least one supplier');return}let session;try{session=(await siteplanCloud.auth.getSession()).data?.session}catch(e){}const token=session?.access_token;if(!token){toast('Your session expired. Please sign in again.');return}const btn=bg.querySelector('.send');btn.disabled=true;btn.textContent='Sending…';try{const r=await fetch('/api/send-tender',{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`},body:JSON.stringify({tenderId:t.id,supplierIds:selected})});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'Tender email could not be sent');close();toast(`Tender sent successfully to ${d.sent} supplier${d.sent===1?'':'s'}`)}catch(e){btn.disabled=false;btn.textContent='Send Tender';toast(e.message||'Tender email could not be sent')}}};
})();

/* ---- v63.js ---- */
// SitePlan V63: clearer supplier selection + simple event-linked tender note
(()=>{
const css=document.createElement('style');css.textContent=`
#supplierCategories.check-grid,#supplierRegions.check-grid{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important;max-height:300px;overflow:auto;padding:4px}
#supplierCategories .check-card,#supplierRegions .check-card{display:flex!important;align-items:center!important;justify-content:flex-start!important;gap:10px!important;min-height:44px!important;padding:10px 12px!important;border:1px solid var(--line)!important;border-radius:10px!important;background:var(--panel2)!important;cursor:pointer}
#supplierCategories .check-card:hover,#supplierRegions .check-card:hover{border-color:#59636f!important;background:#20262e!important}
#supplierCategories .check-card input,#supplierRegions .check-card input{order:0!important;margin:0!important;flex:0 0 auto!important;width:17px!important;height:17px!important;accent-color:var(--green)!important}
#supplierCategories .check-card span,#supplierRegions .check-card span{order:1!important;flex:1!important;line-height:1.25!important;white-space:normal!important;font-size:12px!important;font-weight:750!important}
#tenderEventField{grid-column:1/-1}.tender-event-link{display:flex;align-items:center;gap:9px;padding:10px 12px;margin-bottom:2px;border:1px solid #35452b;background:rgba(168,255,53,.06);border-radius:10px;color:var(--muted);font-size:12px}.tender-event-link b{color:var(--text)}.tender-event-link .dot{width:7px;height:7px;border-radius:50%;background:var(--green);box-shadow:0 0 0 3px rgba(168,255,53,.12)}
@media(max-width:650px){#supplierCategories.check-grid,#supplierRegions.check-grid{grid-template-columns:1fr!important;max-height:260px}}
`;document.head.appendChild(css);

function currentTenderEvent(t){
 const id=t?.eventId||t?.event_id||currentEventId;
 return (events||[]).find(e=>e.id===id)||activeEvent?.()||null;
}
function ensureTenderEventNote(t){
 const grid=byId('tenderModal')?.querySelector('.form-grid');if(!grid)return;
 let field=byId('tenderEventField');
 if(!field){field=document.createElement('div');field.className='field full';field.id='tenderEventField';grid.insertBefore(field,grid.firstChild)}
 const evt=currentTenderEvent(t);
 field.innerHTML=`<div class="tender-event-link"><span class="dot"></span><span>This tender will be linked to <b>${esc(evt?.name||'the current event')}</b>${evt?.venue?' · '+esc(evt.venue):''}</span></div>`;
}

const oldOpenTender=openTender;
openTender=function(){oldOpenTender();ensureTenderEventNote(null)};

const oldEditTender=editTender;
editTender=function(id){oldEditTender(id);const t=tenders.find(x=>x.id===id);ensureTenderEventNote(t)};

// The original app bound the New Tender button to the old function reference before V63 loaded.
// Rebind it so Create Tender uses the enhanced wrapper above.
if(byId('newTenderBtn'))byId('newTenderBtn').onclick=openTender;

publishTender=async function(){
 if(!siteplanCloudUser){openAuthModal();authMsg('Sign in before saving a tender.');return}
 const eventId=currentEventId;const evt=(events||[]).find(e=>e.id===eventId)||activeEvent();
 if(!evt){toast('Create or open an event first');return}
 const title=byId('tTitle').value.trim()||byId('tCategory').value+' Tender';
 const requirements=[...document.querySelectorAll('.req-row')].map(r=>({name:r.querySelector('.rname').value,qty:r.querySelector('.rqty').value,unit:r.querySelector('.runit').value})).filter(x=>x.name);
 const row={title,category:byId('tCategory').value,brief:byId('tBrief').value||null,due_at:byId('tDue').value?new Date(byId('tDue').value+'T23:59:59').toISOString():null,region:byId('tRegion').value||null,attendance:Number(byId('tAttendance').value)||0,estimated_value:Number(byId('tEstimated').value)||0,requirements_json:requirements,include_site_plan:true,event_id:eventId};
 if(editingTenderId){
   const {data,error}=await siteplanCloud.from('tenders').update(row).eq('id',editingTenderId).eq('owner_id',siteplanCloudUser.id).select('*,events(name,venue,event_date),tender_submissions(id,company_name,contact_name,email,price,answers,notes,inclusions,exclusions,status,submitted_at)').single();
   if(error){toast(error.message);return}
   const i=tenders.findIndex(x=>x.id===editingTenderId);if(i>=0)tenders[i]=cloudTenderToLocal(data);editingTenderId='';
   localStorage.setItem('siteplan_tenders',JSON.stringify(tenders));byId('tenderModal').classList.add('hidden');renderTenders();renderSupplierDashboard();renderEvents();toast('Tender changes saved');return;
 }
 row.owner_id=siteplanCloudUser.id;row.status='published';
 const {data,error}=await siteplanCloud.from('tenders').insert(row).select('*,events(name,venue,event_date),tender_submissions(id,company_name,contact_name,email,price,answers,notes,inclusions,exclusions,status,submitted_at)').single();
 if(error){toast(error.message);return}
 tenders.unshift(cloudTenderToLocal(data));localStorage.setItem('siteplan_tenders',JSON.stringify(tenders));byId('tenderModal').classList.add('hidden');renderTenders();renderSupplierDashboard();renderEvents();toast('Tender published · linked to '+(evt.name||'event'));
};
byId('publishTenderBtn').onclick=publishTender;
})();

/* ---- v64.js ---- */
// SitePlan V64: shared supplier network + bulk supplier import
(()=>{
const css=document.createElement('style');css.textContent=`
.supplier-import-btn{white-space:nowrap}.supplier-network-pill{display:inline-flex;align-items:center;gap:5px;border:1px solid #55752e;border-radius:99px;padding:5px 8px;color:var(--green);font-size:10px;font-weight:900;text-transform:uppercase}.supplier-network-dot{width:6px;height:6px;border-radius:50%;background:var(--green)}
#importSupplierModal .modal-card{width:min(860px,100%)}.import-summary{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:12px 0 16px}.import-stat{border:1px solid var(--line);background:var(--panel2);border-radius:12px;padding:12px}.import-stat small{display:block;color:var(--muted);font-weight:800}.import-stat b{display:block;font-size:22px;margin-top:3px}.import-table-wrap{max-height:360px;overflow:auto;border:1px solid var(--line);border-radius:12px}.import-table{width:100%;border-collapse:collapse}.import-table th,.import-table td{padding:9px 10px;border-bottom:1px solid var(--line);font-size:11px;text-align:left;vertical-align:top}.import-table th{position:sticky;top:0;background:#151a20;z-index:1}.import-bad{color:#ff8c98}.import-good{color:var(--green)}.supplier-directory-tools{flex-wrap:wrap}
@media(max-width:700px){.import-summary{grid-template-columns:1fr 1fr}}
`;document.head.appendChild(css);

const CAT_ALIASES={'Catering / Bar':['Food Vendor','Bars & Beverage'],'Generators':['Power & Generators'],'Toilets':['Toilets & Sanitation'],'Marquees':['Marquees & Structures'],'Sound & Lighting':['Production / AV'],'Staging':['Production / AV'],'Custom':['Other']};
const REGION_ALIASES={'New Plymouth':'Taranaki','Manawatu':'Manawatu-Whanganui','Kapiti Coast':'Wellington','Wairarapa':'Wellington'};
const splitList=v=>String(v||'').split(/[;|]/).map(x=>x.trim()).filter(Boolean);
const canonCats=v=>[...new Set(splitList(v).flatMap(x=>CAT_ALIASES[x]||[x]).filter(x=>SUPPLIER_CATEGORIES.includes(x)))];
const canonRegions=v=>[...new Set(splitList(v).map(x=>REGION_ALIASES[x]||x).filter(x=>SUPPLIER_REGIONS.includes(x)))];

const oldCloudSupplierToLocal=cloudSupplierToLocal;
cloudSupplierToLocal=function(s){const x=oldCloudSupplierToLocal(s);x.isGlobal=!!s.is_global;x.sourceUrl=s.source_url||'';x.verificationStatus=s.verification_status||'';return x};

const oldSupplierCard=supplierCard;
supplierCard=function(s){
 if(!s?.isGlobal)return oldSupplierCard(s);
 return `<div class="tender"><div><h3>${esc(s.company)}</h3><small>${esc(s.contact||'SitePlan Network')}${s.email?' · '+esc(s.email):''}${s.phone?' · '+esc(s.phone):''}</small></div><span class="supplier-network-pill"><span class="supplier-network-dot"></span>SitePlan Network</span><div style="grid-column:span 2"><small>${(s.categories||[]).map(esc).join(' · ')}</small><br><small>${(s.regions||[]).map(esc).join(' · ')} · Insurance: ${esc(s.insurance||'TBD')}</small></div><div class="tender-actions"><button class="btn" onclick="useSupplier('${s.id}')">Dashboard</button></div></div>`;
};

const oldOpenSupplierModal=openSupplierModal;
openSupplierModal=function(id=''){
 const s=id?suppliers.find(x=>x.id===id):null;
 if(s?.isGlobal){toast('SitePlan Network suppliers are managed centrally');return}
 return oldOpenSupplierModal(id);
};
const oldDeleteSupplier=deleteSupplier;
deleteSupplier=function(id){const s=suppliers.find(x=>x.id===id);if(s?.isGlobal){toast('SitePlan Network suppliers cannot be removed');return}return oldDeleteSupplier(id)};

function addImportUI(){
 const tools=document.querySelector('.supplier-directory-tools');if(!tools||byId('importSuppliersBtn'))return;
 const btn=document.createElement('button');btn.className='btn supplier-import-btn';btn.id='importSuppliersBtn';btn.type='button';btn.textContent='Import Suppliers';tools.appendChild(btn);
 const input=document.createElement('input');input.type='file';input.id='supplierImportFile';input.accept='.csv,.xlsx,.xls';input.hidden=true;document.body.appendChild(input);
 const modal=document.createElement('div');modal.className='modal hidden';modal.id='importSupplierModal';modal.innerHTML=`<div class="modal-card"><div class="modal-head"><div><h2 style="margin:0">Import Suppliers</h2><small style="color:var(--muted)">Imported suppliers are private to your account. SitePlan Network suppliers stay shared and read-only.</small></div><button class="btn" id="closeImportSupplierModal">×</button></div><div id="supplierImportBody"></div></div>`;document.body.appendChild(modal);
 btn.onclick=()=>{if(!siteplanCloudUser){openAuthModal();return}input.value='';input.click()};
 input.onchange=()=>{const f=input.files?.[0];if(f)readSupplierFile(f)};
 byId('closeImportSupplierModal').onclick=()=>modal.classList.add('hidden');
}

function parseCSV(text){
 const rows=[];let row=[],cell='',q=false;
 for(let i=0;i<text.length;i++){
  const ch=text[i];
  if(q){if(ch==='"'&&text[i+1]==='"'){cell+='"';i++}else if(ch==='"')q=false;else cell+=ch}
  else if(ch==='"')q=true;else if(ch===','){row.push(cell);cell=''}else if(ch==='\n'){row.push(cell);rows.push(row);row=[];cell=''}else if(ch!=='\r')cell+=ch;
 }
 if(cell.length||row.length){row.push(cell);rows.push(row)}return rows;
}
async function loadXLSX(){
 if(window.XLSX)return;
 await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';s.onload=resolve;s.onerror=reject;document.head.appendChild(s)});
}
async function readSupplierFile(file){
 try{
  let matrix=[];
  if(/\.xlsx?$/i.test(file.name)){
   await loadXLSX();const ab=await file.arrayBuffer();const book=XLSX.read(ab,{type:'array'});const sheet=book.Sheets[book.SheetNames[0]];matrix=XLSX.utils.sheet_to_json(sheet,{header:1,defval:''});
  }else matrix=parseCSV(await file.text());
  previewSupplierImport(matrix,file.name);
 }catch(e){toast('Could not read supplier file');console.error(e)}
}
function rowObject(headers,row){const o={};headers.forEach((h,i)=>o[h]=row[i]??'');return o}
function normalHeader(h){return String(h||'').trim().toLowerCase().replace(/\s+/g,'_')}
function previewSupplierImport(matrix,fileName){
 const modal=byId('importSupplierModal'),body=byId('supplierImportBody');modal.classList.remove('hidden');
 if(matrix.length<2){body.innerHTML='<div class="empty-state">No supplier rows found.</div>';return}
 const headers=matrix[0].map(normalHeader),existing=new Set(suppliers.map(s=>(s.company||'').trim().toLowerCase()+'|'+(s.email||'').trim().toLowerCase()));
 const parsed=[];let invalid=0,dupes=0;
 matrix.slice(1).forEach((r,n)=>{
  const x=rowObject(headers,r),company=String(x.company_name||x.company||'').trim(),email=String(x.email||'').trim(),categories=canonCats(x.categories||x.category),regions=canonRegions(x.regions||x.region);
  if(!company&&!email)return;
  const duplicate=existing.has(company.toLowerCase()+'|'+email.toLowerCase());
  const errors=[];if(!company)errors.push('Company missing');if(!categories.length)errors.push('Category missing/unknown');if(!regions.length)errors.push('Region missing/unknown');
  if(duplicate)dupes++;if(errors.length)invalid++;
  parsed.push({line:n+2,company,email,phone:String(x.phone||'').trim(),website:String(x.website||'').trim(),contact:String(x.contact_name||x.contact||'').trim(),categories,regions,minimum:Number(x.minimum||0)||0,eventSize:Number(x.event_size||x.eventsize||0)||0,capabilities:String(x.capabilities||'').trim(),insurance:String(x.insurance||'TBD').trim()||'TBD',notifications:String(x.notifications||'all').trim()||'all',duplicate,errors});
 });
 const ready=parsed.filter(x=>!x.duplicate&&!x.errors.length);
 window.__siteplanSupplierImport=ready;
 body.innerHTML=`<div style="color:var(--muted);font-size:12px">${esc(fileName)}</div><div class="import-summary"><div class="import-stat"><small>Rows found</small><b>${parsed.length}</b></div><div class="import-stat"><small>Ready</small><b class="import-good">${ready.length}</b></div><div class="import-stat"><small>Duplicates</small><b>${dupes}</b></div><div class="import-stat"><small>Needs attention</small><b class="${invalid?'import-bad':''}">${invalid}</b></div></div><div class="import-table-wrap"><table class="import-table"><thead><tr><th>Company</th><th>Category</th><th>Region</th><th>Status</th></tr></thead><tbody>${parsed.slice(0,200).map(x=>`<tr><td>${esc(x.company||'—')}</td><td>${esc(x.categories.join(', ')||'—')}</td><td>${esc(x.regions.join(', ')||'—')}</td><td>${x.duplicate?'Duplicate':x.errors.length?`<span class="import-bad">${esc(x.errors.join(', '))}</span>`:'<span class="import-good">Ready</span>'}</td></tr>`).join('')}</tbody></table></div><div style="display:flex;gap:8px;justify-content:flex-end;margin-top:14px"><button class="btn" id="cancelSupplierImport">Cancel</button><button class="btn primary" id="confirmSupplierImport" ${ready.length?'':'disabled'}>Import ${ready.length} suppliers</button></div>`;
 byId('cancelSupplierImport').onclick=()=>modal.classList.add('hidden');byId('confirmSupplierImport').onclick=importSupplierRows;
}
async function importSupplierRows(){
 const rows=window.__siteplanSupplierImport||[];if(!rows.length)return;if(!siteplanCloudUser){openAuthModal();return}
 const btn=byId('confirmSupplierImport');btn.disabled=true;btn.textContent='Importing…';
 const payload=rows.map(x=>({owner_id:siteplanCloudUser.id,company_name:x.company,contact_name:x.contact||null,email:x.email||null,phone:x.phone||null,website:x.website||null,categories:x.categories,regions:x.regions,minimum:x.minimum,event_size:x.eventSize,capabilities:x.capabilities||null,insurance:x.insurance,notifications:x.notifications,active:true,is_global:false}));
 const {data,error}=await siteplanCloud.from('suppliers').insert(payload).select('*');
 if(error){btn.disabled=false;btn.textContent='Try import again';toast(error.message);return}
 const added=(data||[]).map(cloudSupplierToLocal);suppliers=[...added,...suppliers];localStorage.setItem('siteplan_suppliers',JSON.stringify(suppliers));byId('importSupplierModal').classList.add('hidden');renderSuppliers();renderTenders();renderSupplierDashboard();toast(`${added.length} suppliers imported`);
}

async function refreshSupplierNetwork(){
 if(!siteplanCloudUser)return;
 const {data,error}=await siteplanCloud.from('suppliers').select('*').order('created_at',{ascending:false});if(error)return;
 suppliers=(data||[]).map(cloudSupplierToLocal);localStorage.setItem('siteplan_suppliers',JSON.stringify(suppliers));renderSuppliers();renderTenders();renderSupplierDashboard();
}
addImportUI();setTimeout(refreshSupplierNetwork,500);
})();

/* ---- v65.js ---- */
// SitePlan V65: tender history wording, rebuilt quote comparison, organiser quote notifications, delivery tracking
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
.delivery-list{display:grid;gap:8px;margin-top:10px}.delivery-row{display:grid;grid-template-columns:minmax(220px,1.4fr) minmax(150px,.8fr) auto;gap:12px;align-items:center;padding:12px 14px;border:1px solid var(--line);border-radius:12px;background:#0d1116}.delivery-row b{display:block;font-size:13px}.delivery-row small{display:block;color:var(--muted);margin-top:2px;overflow-wrap:anywhere}.delivery-time{color:var(--muted);font-size:11px}.delivery-badge{display:inline-flex;align-items:center;justify-content:center;border:1px solid var(--line);border-radius:999px;padding:6px 9px;font-size:10px;font-weight:900;text-transform:uppercase;white-space:nowrap}.delivery-badge.delivered{color:var(--green);border-color:#55752e;background:rgba(168,255,53,.05)}.delivery-badge.sent{color:#9fd1ff}.delivery-badge.delivery_delayed{color:#ffd36b}.delivery-badge.bounced,.delivery-badge.failed,.delivery-badge.suppressed,.delivery-badge.complained{color:#ff8c98;border-color:#6b3038}
@media(max-width:900px){.quote-card{grid-template-columns:1fr 1fr}.quote-decision{grid-column:1/-1}.quote-decision .quote-status-actions{grid-template-columns:repeat(3,1fr)}}
@media(max-width:620px){#quoteModal .modal-card{width:96vw!important;padding:14px!important}.quote-card{grid-template-columns:1fr;gap:12px;padding:13px}.quote-decision{grid-column:auto}.quote-price-grid{grid-template-columns:repeat(3,1fr)}.quote-decision .quote-status-actions{grid-template-columns:1fr}.quote-decision .quote-status-actions .btn{font-size:11px}.delivery-row{grid-template-columns:1fr auto}.delivery-time{grid-column:1/-1}}
`;
document.head.appendChild(style);

relabelTenderHistory();
const oldRenderTenders=renderTenders;
renderTenders=function(){const result=oldRenderTenders.apply(this,arguments);relabelTenderHistory();return result};

function deliveryLabel(status){
 const labels={sent:'Sent',delivered:'Delivered',delivery_delayed:'Delayed',bounced:'Bounced',failed:'Failed',suppressed:'Suppressed',complained:'Complaint'};
 return labels[status]||status||'Sent';
}

async function loadTenderDeliveryStatus(tenderId){
 const host=byId('tenderDeliveryStatus');if(!host||!siteplanCloudUser)return;
 const {data,error}=await siteplanCloud.from('tender_email_deliveries').select('*').eq('tender_id',tenderId).order('sent_at',{ascending:false});
 if(error){host.innerHTML='<div class="empty">Delivery tracking is not available yet.</div>';return}
 if(!data?.length){host.innerHTML='<div class="empty">No tracked tender emails yet. New sends will appear here.</div>';return}
 host.innerHTML=`<div class="delivery-list">${data.map(r=>{const when=r.updated_at||r.sent_at;const time=when?new Date(when).toLocaleString('en-NZ',{dateStyle:'medium',timeStyle:'short'}):'';return `<div class="delivery-row"><div><b>${esc(r.company_name||'Supplier')}</b><small>${esc(r.recipient_email||'')}</small></div><div class="delivery-time">${esc(time)}</div><div><span class="delivery-badge ${esc(r.status||'sent')}">${esc(deliveryLabel(r.status))}</span></div></div>`}).join('')}</div>`;
}

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
 byId('quoteModalContent').innerHTML=`<div class="modal-head"><div><h2>${esc(t.title)}</h2><small>${esc(t.eventName||'Event')} · ${esc(t.category)} · ${esc(t.region||'No region')}</small></div><button class="btn" onclick="byId('quoteModal').classList.add('hidden')">×</button></div><div class="tender-status-bar"><span class="label">Tender status</span>${statusButtons}${t.status==='Awarded'?'<span class="pill awarded">Awarded</span>':''}</div><p style="color:var(--muted)">${esc(t.brief||'No additional brief.')}</p><div class="section-title">Supplier link</div><div class="copy-link-box">${esc(link)}</div><div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap"><button class="btn primary" onclick="copyTenderLink('${t.id}')">Copy Tender Link</button><button class="btn" onclick="window.open('${link}','_blank')">Preview supplier form</button><button class="btn" onclick="refreshCloudTenders().then(()=>openTenderView('${t.id}'))">Refresh quotes</button></div><div class="section-title" style="margin-top:22px">Requirements</div>${(t.requirements||[]).map(r=>`<div class="summary-row"><span>${esc(r.name)}</span><strong>${esc(r.qty)} ${esc(r.unit)}</strong></div>`).join('')||'<div class="empty">No itemised requirements.</div>'}<div class="section-title" style="margin-top:22px">Quote comparison</div><div class="quote-summary-grid"><div class="quote-summary-card"><span>Quotes received</span><b>${qs.length}</b></div><div class="quote-summary-card"><span>Lowest</span><b>${lowest?money(lowest):'—'}</b></div><div class="quote-summary-card"><span>Range</span><b>${priced.length>1?money(highest-lowest):'—'}</b></div><div class="quote-summary-card"><span>Awarded</span><b>${awarded?esc(awarded.company):'—'}</b></div></div><div class="quote-card-list">${quoteCards||'<div class="quote-empty">No supplier quotes received yet.</div>'}</div><div class="section-title" style="margin-top:22px">Tender delivery</div><div id="tenderDeliveryStatus"><div class="empty">Checking email delivery status…</div></div><div class="section-title" style="margin-top:22px">Attachments</div><div id="tenderAttachments" class="attachment-list"><div class="empty">Checking supplier attachments…</div></div><div style="display:flex;gap:8px;margin-top:18px;flex-wrap:wrap"><button class="btn primary" onclick="editTender('${t.id}')">Edit Tender</button><button class="btn danger" onclick="deleteTender('${t.id}')">Delete tender</button></div>`;
 byId('quoteModal').classList.remove('hidden');
 loadTenderDeliveryStatus(t.id);
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

/* ---- v66.js ---- */
// SitePlan V66: clearer tender event subtitle + custom supplier service types + sent supplier viewer
(()=>{
const CUSTOM_CATEGORY_KEY='siteplan_custom_supplier_categories';
const BASE_ADDITIONS=['Furniture'];

function savedCustomCategories(){
 try{return JSON.parse(localStorage.getItem(CUSTOM_CATEGORY_KEY)||'[]').filter(Boolean)}catch{return []}
}
function saveCustomCategories(items){localStorage.setItem(CUSTOM_CATEGORY_KEY,JSON.stringify([...new Set(items.filter(Boolean))]))}
function categoriesFromSuppliers(){return [...new Set((suppliers||[]).flatMap(s=>s.categories||[]).filter(Boolean))]}
function allCustomCategories(){return [...new Set([...BASE_ADDITIONS,...savedCustomCategories(),...categoriesFromSuppliers()])];}
function ensureCategories(){
 const custom=allCustomCategories();
 custom.forEach(c=>{if(!SUPPLIER_CATEGORIES.includes(c))SUPPLIER_CATEGORIES.splice(Math.max(0,SUPPLIER_CATEGORIES.indexOf('Other')),0,c)});
 saveCustomCategories(custom.filter(c=>!BASE_ADDITIONS.includes(c)&&c!=='Other'));
 syncCategoryControls();
}
function syncSelect(select,includeAll=false){
 if(!select)return;
 const current=select.value;
 if(includeAll){
   const first=select.options[0]?.value===''?select.options[0]:new Option('All supplier types','');
   select.innerHTML='';select.add(first);
 }
 SUPPLIER_CATEGORIES.forEach(c=>{if(![...select.options].some(o=>o.value===c))select.add(new Option(c,c))});
 if(current&&[...select.options].some(o=>o.value===current))select.value=current;
}
function syncCategoryControls(){syncSelect(byId('tCategory'));syncSelect(byId('supplierCategoryFilter'),true)}
function addCustomCategory(raw,selectAfter=true){
 const name=String(raw||'').trim().replace(/\s+/g,' ');
 if(!name){toast('Enter a service type');return ''}
 const existing=SUPPLIER_CATEGORIES.find(c=>c.toLowerCase()===name.toLowerCase());
 const finalName=existing||name;
 if(!existing){
   const custom=savedCustomCategories();custom.push(finalName);saveCustomCategories(custom);
   const otherIndex=SUPPLIER_CATEGORIES.indexOf('Other');SUPPLIER_CATEGORIES.splice(otherIndex>=0?otherIndex:SUPPLIER_CATEGORIES.length,0,finalName);
 }
 syncCategoryControls();
 if(selectAfter&&byId('tCategory'))byId('tCategory').value=finalName;
 return finalName;
}

const css=document.createElement('style');css.textContent=`
.tender-event-subtitle{font-size:15px;font-weight:850;color:#444d45;margin-top:4px;margin-bottom:5px}.tender-meta-line{font-size:12px;color:#747c72}
.custom-type-row{display:flex;gap:7px;margin-top:9px}.custom-type-row input{flex:1}.custom-type-row .btn{padding:9px 11px;white-space:nowrap}
.sent-supplier-list{display:grid;gap:8px;margin-top:14px}.sent-supplier-row{display:grid;grid-template-columns:minmax(220px,1.4fr) minmax(120px,.7fr) auto;gap:12px;align-items:center;padding:12px 14px;border:1px solid var(--line);border-radius:12px;background:#0d1116}.sent-supplier-row b{display:block}.sent-supplier-row small{display:block;color:var(--muted);margin-top:2px;overflow-wrap:anywhere}.sent-supplier-time{font-size:11px;color:var(--muted)}
@media(max-width:700px){.sent-supplier-row{grid-template-columns:1fr auto}.sent-supplier-time{grid-column:1/-1}}
`;document.head.appendChild(css);

ensureCategories();

function enhanceSupplierCategoryField(){
 const host=byId('supplierCategories');if(!host)return;
 const field=host.closest('.field');if(!field||field.querySelector('.custom-type-row'))return;
 const row=document.createElement('div');row.className='custom-type-row';row.innerHTML='<input id="newSupplierType" placeholder="Add another service type"><button type="button" class="btn" id="addSupplierTypeBtn">+ Add type</button>';
 field.appendChild(row);
 byId('addSupplierTypeBtn').onclick=()=>{
   const checked=[...host.querySelectorAll('input:checked')].map(x=>x.value);
   const name=addCustomCategory(byId('newSupplierType').value,false);if(!name)return;
   checkboxCards('supplierCategories',SUPPLIER_CATEGORIES);
   [...byId('supplierCategories').querySelectorAll('input')].forEach(x=>x.checked=checked.includes(x.value)||x.value===name);
   byId('newSupplierType').value='';toast(`${name} added`);
 };
 byId('newSupplierType').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();byId('addSupplierTypeBtn').click()}});
}

function enhanceTenderCategoryField(){
 const select=byId('tCategory');if(!select)return;
 const field=select.closest('.field');if(!field||field.querySelector('.custom-type-row'))return;
 const row=document.createElement('div');row.className='custom-type-row';row.innerHTML='<input id="newTenderType" placeholder="Add another tender type"><button type="button" class="btn" id="addTenderTypeBtn">+ Add type</button>';
 field.appendChild(row);
 byId('addTenderTypeBtn').onclick=()=>{const name=addCustomCategory(byId('newTenderType').value,true);if(name){byId('newTenderType').value='';toast(`${name} added and selected`)}};
 byId('newTenderType').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();byId('addTenderTypeBtn').click()}});
}

enhanceSupplierCategoryField();enhanceTenderCategoryField();

function addSentButtons(){
 const host=byId('tenderList');if(!host)return;
 host.querySelectorAll('.tender').forEach(card=>{
   const actions=card.querySelector('.tender-actions');if(!actions||actions.querySelector('.sent-to-btn'))return;
   const view=[...actions.querySelectorAll('button')].find(b=>(b.textContent||'').trim()==='View');
   const call=view?.getAttribute('onclick')||'';const match=call.match(/openTenderView\(['\"]([^'\"]+)['\"]\)/);if(!match)return;
   const btn=document.createElement('button');btn.className='btn sent-to-btn';btn.type='button';btn.textContent='Sent to';btn.onclick=()=>showTenderRecipients(match[1]);
   const share=[...actions.querySelectorAll('button')].find(b=>(b.textContent||'').trim().startsWith('Share to'));
   if(share)actions.insertBefore(btn,share);else actions.appendChild(btn);
 });
}

window.showTenderRecipients=async function(tenderId){
 const t=tenders.find(x=>x.id===tenderId);if(!t)return;
 const qmc=byId('quoteModalContent');qmc.style.width='min(760px,96vw)';qmc.style.maxWidth='760px';qmc.style.padding='22px';qmc.style.background='var(--panel)';
 qmc.innerHTML=`<div class="modal-head"><div><h2 style="margin:0">Sent suppliers</h2><small>${esc(t.title)} · ${esc(t.eventName||'Event')}</small></div><button class="btn" onclick="byId('quoteModal').classList.add('hidden')">×</button></div><div id="sentSupplierBody"><div class="empty">Checking tender sends…</div></div>`;
 byId('quoteModal').classList.remove('hidden');
 const body=byId('sentSupplierBody');
 if(!siteplanCloudUser){body.innerHTML='<div class="empty">Sign in to view tender delivery history.</div>';return}
 const {data,error}=await siteplanCloud.from('tender_email_deliveries').select('*').eq('tender_id',tenderId).order('sent_at',{ascending:false});
 if(error){body.innerHTML='<div class="empty">Could not load sent suppliers.</div>';return}
 if(!data?.length){body.innerHTML='<div class="empty">No tracked sends for this tender yet. Any new sends will appear here.</div>';return}
 const statusLabel=s=>({sent:'Sent',delivered:'Delivered',delivery_delayed:'Delayed',bounced:'Bounced',failed:'Failed',suppressed:'Suppressed',complained:'Complaint'}[s]||s||'Sent');
 body.innerHTML=`<div style="color:var(--muted);font-size:12px">${data.length} supplier${data.length===1?'':'s'} sent this tender</div><div class="sent-supplier-list">${data.map(r=>{const when=r.updated_at||r.sent_at;const time=when?new Date(when).toLocaleString('en-NZ',{dateStyle:'medium',timeStyle:'short'}):'';return `<div class="sent-supplier-row"><div><b>${esc(r.company_name||'Supplier')}</b><small>${esc(r.recipient_email||'')}</small></div><div class="sent-supplier-time">${esc(time)}</div><span class="delivery-badge ${esc(r.status||'sent')}">${esc(statusLabel(r.status))}</span></div>`}).join('')}</div>`;
};

const previousRenderSuppliers=renderSuppliers;
renderSuppliers=function(){ensureCategories();return previousRenderSuppliers.apply(this,arguments)};

const previousRenderTenders=renderTenders;
renderTenders=function(){const result=previousRenderTenders.apply(this,arguments);addSentButtons();return result};
addSentButtons();

const previousOpenSupplierModal=openSupplierModal;
openSupplierModal=function(){ensureCategories();const result=previousOpenSupplierModal.apply(this,arguments);enhanceSupplierCategoryField();return result};

const previousOpenTender=openTender;
openTender=function(){ensureCategories();const result=previousOpenTender.apply(this,arguments);enhanceTenderCategoryField();return result};
if(byId('newTenderBtn'))byId('newTenderBtn').onclick=openTender;

const previousOpenSupplierForm=openSupplierForm;
openSupplierForm=function(){
 const result=previousOpenSupplierForm.apply(this,arguments);
 const id=arguments[0],t=tenders.find(x=>x.id===id);
 const head=document.querySelector('#quoteModalContent .tender-public-head');
 const h2=head?.querySelector('h2');
 if(head&&h2&&t){
   const oldMeta=h2.nextElementSibling;
   if(!head.querySelector('.tender-event-subtitle')){
     const sub=document.createElement('div');sub.className='tender-event-subtitle';sub.textContent=t.eventName||'Event';h2.insertAdjacentElement('afterend',sub);
   }
   if(oldMeta&&!oldMeta.classList.contains('tender-event-subtitle')){
     oldMeta.classList.add('tender-meta-line');
     const bits=[];if(t.region)bits.push(t.region);if(t.due)bits.push('Quote due '+t.due);oldMeta.textContent=bits.join(' · ');
   }
 }
 return result;
};
})();

/* ---- v67.js ---- */
// SitePlan V67: resilient sent-supplier history fallback
(()=>{
const SEND_HISTORY_KEY='siteplan_tender_send_history_v1';

function readSendHistory(){try{return JSON.parse(localStorage.getItem(SEND_HISTORY_KEY)||'{}')}catch{return {}}}
function writeSendHistory(v){localStorage.setItem(SEND_HISTORY_KEY,JSON.stringify(v||{}))}
function saveSendHistory(tenderId,recipients){
 if(!tenderId||!Array.isArray(recipients)||!recipients.length)return;
 const history=readSendHistory();const now=new Date().toISOString();const existing=Array.isArray(history[tenderId])?history[tenderId]:[];
 const rows=recipients.map(r=>({company_name:r.company||r.company_name||'Supplier',recipient_email:r.email||'',status:'sent',sent_at:now,updated_at:now,resend_email_id:r.deliveryId||null,source:'local'}));
 history[tenderId]=[...rows,...existing].filter((r,i,a)=>a.findIndex(x=>(x.recipient_email||'').toLowerCase()===(r.recipient_email||'').toLowerCase())===i);
 writeSendHistory(history);
}
function localRows(tenderId){const h=readSendHistory();return Array.isArray(h[tenderId])?h[tenderId]:[]}
function statusLabel(s){return ({sent:'Sent',delivered:'Delivered',delivery_delayed:'Delayed',bounced:'Bounced',failed:'Failed',suppressed:'Suppressed',complained:'Complaint'}[s]||s||'Sent')}
function mergeRows(...sets){
 const map=new Map();sets.flat().filter(Boolean).forEach(r=>{const key=(r.recipient_email||r.resend_email_id||crypto.randomUUID()).toLowerCase();const old=map.get(key);if(!old||r.source==='resend'||r.source==='cloud')map.set(key,r)});
 return [...map.values()].sort((a,b)=>new Date(b.updated_at||b.sent_at||0)-new Date(a.updated_at||a.sent_at||0));
}
function supplierNameForEmail(email){const s=(suppliers||[]).find(x=>(x.email||'').toLowerCase()===String(email||'').toLowerCase());return s?.company||'Supplier'}

const oldShare=shareTenderToAll;
shareTenderToAll=function(id){
 let restored=false;const nativeFetch=window.fetch;
 window.fetch=async function(input,init){
   const url=typeof input==='string'?input:(input?.url||'');
   const response=await nativeFetch.apply(this,arguments);
   if(url.includes('/api/send-tender')){
     try{if(response.ok){const data=await response.clone().json();saveSendHistory(id,data.recipients||[])}}catch(e){console.warn('Could not cache tender recipients',e)}
     window.fetch=nativeFetch;restored=true;
   }
   return response;
 };
 const result=oldShare.apply(this,arguments);
 setTimeout(()=>{if(!restored){window.fetch=nativeFetch;restored=true}},120000);
 return result;
};

async function serverRows(tenderId){
 try{
   const session=(await siteplanCloud.auth.getSession()).data?.session;const token=session?.access_token;if(!token)return [];
   const r=await fetch(`/api/tender-recipients?tenderId=${encodeURIComponent(tenderId)}`,{headers:{Authorization:`Bearer ${token}`}});
   const d=await r.json().catch(()=>({}));if(!r.ok)return [];
   return (d.recipients||[]).map(x=>({...x,company_name:supplierNameForEmail(x.recipient_email),source:'resend'}));
 }catch(e){return []}
}

window.showTenderRecipients=async function(tenderId){
 const t=tenders.find(x=>x.id===tenderId);if(!t)return;
 const qmc=byId('quoteModalContent');qmc.style.width='min(760px,96vw)';qmc.style.maxWidth='760px';qmc.style.padding='22px';qmc.style.background='var(--panel)';
 qmc.innerHTML=`<div class="modal-head"><div><h2 style="margin:0">Sent suppliers</h2><small>${esc(t.title)} · ${esc(t.eventName||'Event')}</small></div><button class="btn" onclick="byId('quoteModal').classList.add('hidden')">×</button></div><div id="sentSupplierBody"><div class="empty">Checking tender sends…</div></div>`;
 byId('quoteModal').classList.remove('hidden');
 const body=byId('sentSupplierBody');let cloud=[];
 if(siteplanCloudUser){
   try{const {data,error}=await siteplanCloud.from('tender_email_deliveries').select('*').eq('tender_id',tenderId).order('sent_at',{ascending:false});if(!error)cloud=(data||[]).map(x=>({...x,source:'cloud'}))}catch(e){}
 }
 const remote=await serverRows(tenderId);
 const rows=mergeRows(localRows(tenderId),cloud,remote);
 if(!rows.length){body.innerHTML='<div class="empty">No recorded sends for this tender yet.</div>';return}
 body.innerHTML=`<div style="color:var(--muted);font-size:12px">${rows.length} supplier${rows.length===1?'':'s'} sent this tender</div><div class="sent-supplier-list">${rows.map(r=>{const when=r.updated_at||r.sent_at;const time=when?new Date(when).toLocaleString('en-NZ',{dateStyle:'medium',timeStyle:'short'}):'';return `<div class="sent-supplier-row"><div><b>${esc(r.company_name||'Supplier')}</b><small>${esc(r.recipient_email||'')}</small></div><div class="sent-supplier-time">${esc(time)}</div><span class="delivery-badge ${esc(r.status||'sent')}">${esc(statusLabel(r.status))}</span></div>`}).join('')}</div>`;
};
})();

/* ---- v68.js ---- */
// SitePlan V68: comprehensive mobile layout pass
(()=>{
const style=document.createElement('style');
style.textContent=`
@media(max-width:900px){
  html,body{height:auto!important;min-height:100%!important;overflow:auto!important;-webkit-overflow-scrolling:touch}
  .app{height:auto!important;min-height:100vh!important;display:block!important}
  header{height:auto!important;min-height:64px!important;padding:10px 12px!important;display:flex!important;flex-wrap:wrap!important;gap:8px!important;position:sticky!important;top:0!important;z-index:120!important}
  .brand{order:1;max-width:calc(100% - 90px)}
  .event-name{order:3;flex:1 1 100%!important;min-width:0!important;width:100%!important}
  .search-wrap{order:4;flex:1 1 100%!important;min-width:0!important;width:100%!important}
  .top-actions{order:2;margin-left:auto;display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}
  .top-actions .btn{padding:9px 10px;font-size:12px}
  .nav-tabs{order:5;width:100%;overflow-x:auto;display:flex;gap:6px;margin:0;padding-bottom:2px;scrollbar-width:none}
  .nav-tabs::-webkit-scrollbar{display:none}.nav-tab{flex:0 0 auto;white-space:nowrap;padding:9px 10px}

  .module{height:auto!important;min-height:0!important}
  .workspace{display:flex!important;flex-direction:column!important;min-height:0!important}
  .map-wrap{order:1!important;position:relative!important;height:62vh!important;min-height:420px!important;width:100%!important}
  .sidebar{order:2!important;width:100%!important;max-height:none!important;overflow:visible!important;border-right:0!important;border-top:1px solid var(--line)!important;padding:14px!important}
  .inspector{order:3!important;width:100%!important;max-height:none!important;overflow:visible!important;border-left:0!important;border-top:1px solid var(--line)!important;padding:14px!important}
  .object-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important}
  .object-btn{min-height:48px!important}
  .stats{left:8px!important;right:8px!important;bottom:8px!important}.stat{font-size:10px!important;padding:7px 9px!important}
  .map-tip,.draw-banner{max-width:calc(100vw - 24px)!important;white-space:normal!important;text-align:center!important}

  .procure{padding:16px 12px!important;overflow:visible!important}.procure-inner{max-width:none!important}.page-head{align-items:flex-start!important;flex-direction:column!important;gap:12px!important}.page-head h1{font-size:25px!important}.page-head .btn{width:100%!important}
  .cards{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important}.metric{padding:13px!important}.metric b{font-size:21px!important}
  .tender{grid-template-columns:1fr!important;gap:10px!important;padding:14px!important}.tender h3{font-size:16px!important}.tender-actions{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;width:100%!important;gap:7px!important}.tender-actions .btn{width:100%!important;padding:10px 8px!important}.tender-actions .primary{grid-column:1/-1!important}

  .modal{padding:8px!important;align-items:start!important;overflow:auto!important}.modal-card{width:100%!important;max-width:100%!important;max-height:none!important;min-height:0!important;border-radius:16px!important;padding:16px!important;margin:8px 0 24px!important;overflow:visible!important}.modal-head{align-items:flex-start!important;gap:10px!important}.modal-head h2{font-size:22px!important;line-height:1.15!important}.form-grid{grid-template-columns:1fr!important}.form-grid .full{grid-column:auto!important}.req-row{grid-template-columns:1fr 64px!important}.req-row>*:nth-child(3){grid-column:1/2}.req-row>*:nth-child(4){grid-column:2/3;grid-row:2}
  .quote-summary-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}.quote-card{grid-template-columns:1fr!important}.quote-decision{grid-column:auto!important}.quote-decision .quote-status-actions{grid-template-columns:1fr!important}.quote-price-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:6px!important}.quote-price{padding:8px!important}.quote-price b{font-size:15px!important}
  .delivery-row,.sent-supplier-row{grid-template-columns:1fr auto!important;gap:8px!important}.delivery-time,.sent-supplier-time{grid-column:1/-1!important}

  .supplier-directory-tools{display:grid!important;grid-template-columns:1fr!important;gap:8px!important}.supplier-directory-tools>*{width:100%!important}.supplier-card,.event-card{min-width:0!important}.supplier-grid,.event-grid{grid-template-columns:1fr!important}.supplier-actions,.event-actions{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:7px!important}.supplier-actions .btn,.event-actions .btn{width:100%!important}

  table{max-width:100%!important}.quote-table-wrap,.table-wrap{overflow-x:auto!important;-webkit-overflow-scrolling:touch}.copy-link-box{overflow-wrap:anywhere!important;word-break:break-word!important}
  input,select,textarea{font-size:16px!important}
  .btn{min-height:42px}.setup{padding:14px!important}.setup-card{padding:22px 18px!important;border-radius:18px!important}.setup h1{font-size:27px!important}
}

@media(max-width:560px){
  header{padding:9px 10px!important}.brand small{display:none!important}.brand{font-size:15px!important}.brand-mark{width:30px!important;height:30px!important}
  .top-actions{width:auto}.top-actions .btn{font-size:11px!important;padding:8px!important}
  .map-wrap{height:58vh!important;min-height:360px!important}
  .cards{grid-template-columns:1fr 1fr!important}.metric{padding:11px!important}.metric span{font-size:9px!important}.metric b{font-size:19px!important}
  .object-grid{grid-template-columns:1fr 1fr!important}.object-btn{font-size:11px!important;padding:10px 7px!important}
  .tender-actions{grid-template-columns:1fr 1fr!important}
  .quote-summary-grid{grid-template-columns:1fr 1fr!important}.quote-price-grid{grid-template-columns:1fr!important}.quote-price{display:flex!important;align-items:center!important;justify-content:space-between!important}.quote-price span,.quote-price b{margin:0!important}
  .sp-send-bg{padding:8px!important;align-items:flex-start!important;overflow:auto!important}.sp-send{width:100%!important;max-height:none!important;margin:8px 0 20px!important}.sp-row{grid-template-columns:24px 1fr!important}.sp-row .hide-mobile{display:none!important}.sp-actions{display:grid!important;grid-template-columns:1fr!important}.sp-btn{width:100%!important}
  .custom-type-row{display:grid!important;grid-template-columns:1fr!important}.custom-type-row .btn{width:100%!important}
  .public-card{padding:18px!important}.public-card h1,.public-card h2{overflow-wrap:anywhere!important}
}
`;
document.head.appendChild(style);

function mobileSanity(){
 if(innerWidth>900)return;
 document.querySelectorAll('.modal-card,#quoteModalContent').forEach(el=>{el.style.maxWidth='100%';});
}
window.addEventListener('resize',mobileSanity,{passive:true});
mobileSanity();
})();

/* ---- v71.js ---- */
// SitePlan V71: isolated mobile-only event navigation (no core data overrides)
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
  .sp-mobile-eventbar button.active{background:var(--green)!important;border-color:var(--green)!important;color:#0b0d10!important}
  body.sp-mobile-in-event #plannerModule{padding-bottom:76px!important}
}
`;document.head.appendChild(css);

const bar=document.createElement('div');bar.className='sp-mobile-eventbar';bar.innerHTML=`<button class="sp-home" data-go="dashboard">← Events</button><button data-go="planner">Map</button><button data-go="tenders">Tenders</button><button data-go="budget">Budget</button>`;document.body.appendChild(bar);

function moduleOpen(name){const el=document.getElementById(name+'Module');return !!(el&&!el.classList.contains('hidden'))}
function activeModule(){for(const n of ['dashboard','planner','tenders','budget','suppliers'])if(moduleOpen(n))return n;return ''}
function paintActive(){const current=activeModule();bar.querySelectorAll('button[data-go]').forEach(b=>b.classList.toggle('active',b.dataset.go===current))}
function go(name){
  if(typeof window.switchModule==='function') window.switchModule(name);
  else {
    const t=document.querySelector(`.nav-tab[data-module="${name}"]`);
    if(t) t.click();
  }
  if(name==='planner') setTimeout(()=>{try{if(window.map&&window.google?.maps?.event){window.google.maps.event.trigger(window.map,'resize')}}catch(e){}},80);
  setTimeout(()=>{sync();paintActive()},0);
}
bar.addEventListener('click',e=>{const b=e.target.closest('button[data-go]');if(!b)return;e.preventDefault();e.stopPropagation();go(b.dataset.go)});

function sync(){
 if(!mobile()){document.body.classList.remove('sp-mobile-in-event');paintActive();return}
 const current=activeModule();
 document.body.classList.toggle('sp-mobile-in-event',['planner','tenders','budget','suppliers'].includes(current));
 paintActive();
}

const observer=new MutationObserver(()=>requestAnimationFrame(sync));
['dashboardModule','plannerModule','tendersModule','budgetModule','suppliersModule'].forEach(id=>{const el=document.getElementById(id);if(el)observer.observe(el,{attributes:true,attributeFilter:['class']})});
document.addEventListener('click',()=>setTimeout(sync,0),true);
window.addEventListener('resize',sync,{passive:true});
setTimeout(sync,250);
})();

/* ---- v72.js ---- */
// SitePlan V72: mobile-only compact header + venue search dropdown
(()=>{
const style=document.createElement('style');style.textContent=`
.sp-mobile-search-toggle{display:none}
@media(max-width:900px){
 header{align-items:center!important}
 header .search-wrap{display:none!important;order:6!important;width:100%!important;flex-basis:100%!important;margin:0!important}
 header.sp-search-open .search-wrap{display:flex!important}
 .sp-mobile-search-toggle{display:inline-flex!important;order:4;align-items:center;justify-content:center;min-height:40px;border:1px solid var(--line);background:var(--panel2);color:var(--text);border-radius:10px;padding:8px 11px;font-size:11px;font-weight:900}
 header .event-name{order:3!important;flex:1 1 180px!important;width:auto!important;min-width:140px!important}
 header .nav-tabs{order:5!important}
 header .top-actions{order:2!important}
}
@media(max-width:560px){
 header .event-name{flex:1 1 calc(100% - 105px)!important;max-width:none!important}
 .sp-mobile-search-toggle{flex:0 0 auto}
 header .search-wrap{padding-top:2px!important}
 header .search-wrap .place-host,header .search-wrap gmp-place-autocomplete{width:100%!important;max-width:100%!important}
}
`;document.head.appendChild(style);
const header=document.querySelector('#app header');if(!header)return;
const btn=document.createElement('button');btn.type='button';btn.className='sp-mobile-search-toggle';btn.textContent='⌕ Venue';btn.setAttribute('aria-expanded','false');
const eventName=header.querySelector('.event-name');if(eventName)eventName.insertAdjacentElement('afterend',btn);else header.appendChild(btn);
btn.addEventListener('click',()=>{const open=header.classList.toggle('sp-search-open');btn.setAttribute('aria-expanded',String(open));btn.textContent=open?'× Close search':'⌕ Venue';if(open)setTimeout(()=>header.querySelector('gmp-place-autocomplete input,input')?.focus(),80)});
})();

/* ---- v73.js ---- */
// SitePlan V73: cloud-first workspace + event plan sync
(()=>{
const SUPABASE_URL='https://qkvkemcqfnbmaktbxddg.supabase.co';
const SUPABASE_KEY='sb_publishable_tiPl-Y7wvfrpB7RzNzOBVA_CMIGBTwA';
if(!window.supabase?.createClient)return;
// Reuse the app's primary client so auth storage and SIGNED_IN/SIGNED_OUT state
// cannot diverge between two clients in the same browser tab.
const cloud=typeof siteplanCloud!=='undefined'
  ? siteplanCloud
  : window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
let user=null,syncing=false,saveTimer=null,allowEmptyOnce=false,ready=false;
let lastSaveError='';
function saveState(text,error=false){let el=document.getElementById('siteplanSaveState');if(!el){el=document.createElement('div');el.id='siteplanSaveState';el.style.cssText='position:fixed;right:14px;bottom:42px;z-index:1101;padding:7px 10px;border-radius:999px;background:#12171c;border:1px solid #303943;color:#aab3bd;font:800 10px/1.2 Arial,sans-serif;pointer-events:none;transition:opacity .2s';document.body.appendChild(el)}el.textContent=text;el.style.color=error?'#ff8c98':'#aab3bd';el.style.borderColor=error?'#6b3038':'#303943';el.style.opacity='1';if(!error)setTimeout(()=>{if(el.textContent===text)el.style.opacity='.45'},1800)}
function reportSaveError(error){const message=error?.message||'Cloud save failed';console.error('SitePlan cloud save',error);saveState('Save failed',true);if(message!==lastSaveError){lastSaveError=message;toast?.(`Cloud save failed: ${message}`)}}
const clone=v=>JSON.parse(JSON.stringify(v));
const parse=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch(e){return d}};
const planHasContent=p=>!!(p&&((p.markers?.length||0)||(p.shapes?.length||0)));
const when=t=>{const n=Date.parse(t||'');return Number.isFinite(n)?n:0};
const localEvents=()=>Array.isArray(typeof events!=='undefined'?events:null)?events:parse('siteplan_events',[]);
const localTenders=()=>Array.isArray(typeof tenders!=='undefined'?tenders:null)?tenders:parse('siteplan_tenders',[]);
const localSuppliers=()=>Array.isArray(typeof suppliers!=='undefined'?suppliers:null)?suppliers:parse('siteplan_suppliers',[]);
const currentKey=()=>typeof currentEventId!=='undefined'?currentEventId:(localStorage.getItem('siteplan_current_event_id')||'');
function mergeById(a,b){const out=new Map();[...(a||[]),...(b||[])].forEach(x=>{if(!x?.id)return;const old=out.get(x.id);if(!old){out.set(x.id,clone(x));return}if(when(x.updated||x.created)>=when(old.updated||old.created))out.set(x.id,clone(x));});return [...out.values()]}
function eventMeta(e){const m=clone(e||{});delete m.plan;return m}
function workspacePayload(){return {events:clone(localEvents()),tenders:clone(localTenders()),suppliers:clone(localSuppliers()),currentEventId:currentKey(),version:73,savedAt:new Date().toISOString()}}
async function session(){const {data}=await cloud.auth.getSession();user=data?.session?.user||null;return user}
async function upsertPlan(e,{forceEmpty=false}={}){if(!user||!e?.id)return;const has=planHasContent(e.plan);const {data:existing,error:readError}=await cloud.from('siteplan_event_plans').select('plan_data').eq('owner_id',user.id).eq('event_key',String(e.id)).maybeSingle();if(readError)throw readError;if(!forceEmpty&&!has&&planHasContent(existing?.plan_data))return;const {error}=await cloud.from('siteplan_event_plans').upsert({owner_id:user.id,event_key:String(e.id),event_name:e.name||e.plan?.eventName||'Untitled Event',plan_data:e.plan||null,event_meta:eventMeta(e),updated_at:new Date().toISOString()},{onConflict:'owner_id,event_key'});if(error)throw error}
async function migratePopulatedLocalPlans(){if(!user)return;const rich=localEvents().filter(e=>e?.id&&planHasContent(e.plan));if(!rich.length)return;const {data:rows,error}=await cloud.from('siteplan_event_plans').select('event_key,plan_data,updated_at').eq('owner_id',user.id);if(error)throw error;const remote=new Map((rows||[]).map(r=>[String(r.event_key),r]));for(const e of rich){const r=remote.get(String(e.id));if(!r||!planHasContent(r.plan_data)||when(e.updated)>when(r.updated_at)){await upsertPlan(e)}}}
async function saveWorkspace(){if(!user||syncing)return;saveState('Saving…');const {error}=await cloud.from('siteplan_workspace_state').upsert({owner_id:user.id,workspace_data:workspacePayload(),updated_at:new Date().toISOString()},{onConflict:'owner_id'});if(error)throw error;const evt=localEvents().find(x=>String(x.id)===String(currentKey()));if(evt)await upsertPlan(evt,{forceEmpty:allowEmptyOnce});allowEmptyOnce=false;lastSaveError='';saveState('Saved')}
function queueSave(){clearTimeout(saveTimer);saveTimer=setTimeout(()=>saveWorkspace().catch(reportSaveError),450)}
async function reconcile(){if(syncing)return;syncing=true;try{if(!await session())return;await migratePopulatedLocalPlans();const [{data:rows,error:pe},{data:ws,error:we}]=await Promise.all([cloud.from('siteplan_event_plans').select('event_key,event_name,plan_data,event_meta,updated_at').eq('owner_id',user.id),cloud.from('siteplan_workspace_state').select('workspace_data,updated_at').eq('owner_id',user.id).maybeSingle()]);if(pe||we)return;let ev=clone(localEvents()),te=clone(localTenders()),su=clone(localSuppliers());const cloudWS=ws?.workspace_data||{};ev=mergeById(ev,cloudWS.events||[]);te=mergeById(te,cloudWS.tenders||[]);su=mergeById(su,cloudWS.suppliers||[]);const map=new Map(ev.map(x=>[String(x.id),x]));for(const r of rows||[]){const key=String(r.event_key),local=map.get(key),meta=clone(r.event_meta||{}),cloudPlan=r.plan_data||null;if(!local){map.set(key,{...meta,id:key,name:r.event_name||meta.name||'Untitled Event',plan:cloudPlan,updated:r.updated_at,created:meta.created||r.updated_at,budget:Number(meta.budget||0)});continue}const localRich=planHasContent(local.plan),cloudRich=planHasContent(cloudPlan);if(cloudRich&&!localRich){local.plan=cloudPlan;local.name=r.event_name||local.name;local.updated=r.updated_at||local.updated}else if(cloudRich&&localRich&&when(r.updated_at)>when(local.updated)){local.plan=cloudPlan;local.name=r.event_name||local.name;local.updated=r.updated_at}else if(localRich&&(!cloudRich||when(local.updated)>=when(r.updated_at)))await upsertPlan(local)}ev=[...map.values()];if(typeof events!=='undefined')events=ev;if(typeof tenders!=='undefined')tenders=te;if(typeof suppliers!=='undefined')suppliers=su;localStorage.setItem('siteplan_events',JSON.stringify(ev));localStorage.setItem('siteplan_tenders',JSON.stringify(te));localStorage.setItem('siteplan_suppliers',JSON.stringify(su));const preferred=currentKey()||cloudWS.currentEventId||ev[0]?.id||'';if(preferred){if(typeof currentEventId!=='undefined')currentEventId=preferred;localStorage.setItem('siteplan_current_event_id',preferred)}if(typeof renderEvents==='function')renderEvents();if(typeof renderTenders==='function')renderTenders();if(typeof renderSupplierDashboard==='function')renderSupplierDashboard();await cloud.from('siteplan_workspace_state').upsert({owner_id:user.id,workspace_data:workspacePayload(),updated_at:new Date().toISOString()},{onConflict:'owner_id'});for(const e of ev)if(planHasContent(e.plan))await upsertPlan(e);ready=true}finally{syncing=false}}
async function recoverOne(id){if(!user)await session();if(!user)return false;const {data}=await cloud.from('siteplan_event_plans').select('event_name,plan_data,event_meta,updated_at').eq('owner_id',user.id).eq('event_key',String(id)).maybeSingle();if(!data)return false;let e=localEvents().find(x=>String(x.id)===String(id));if(!e){e={...(data.event_meta||{}),id:String(id),name:data.event_name||'Untitled Event',plan:data.plan_data||null,updated:data.updated_at,created:data.event_meta?.created||data.updated_at};if(typeof events!=='undefined')events.unshift(e)}else if(planHasContent(data.plan_data)&&(!planHasContent(e.plan)||when(data.updated_at)>when(e.updated))){e.plan=data.plan_data;e.name=data.event_name||e.name;e.updated=data.updated_at}localStorage.setItem('siteplan_events',JSON.stringify(localEvents()));return true}
function wrapCore(){if(typeof savePlan==='function'&&!savePlan.__spCloud){const old=savePlan;const wrapped=function(){const r=old.apply(this,arguments);queueSave();return r};wrapped.__spCloud=true;savePlan=wrapped}if(typeof saveEvents==='function'&&!saveEvents.__spCloud){const old=saveEvents;const wrapped=function(){const r=old.apply(this,arguments);queueSave();return r};wrapped.__spCloud=true;saveEvents=wrapped}if(typeof openEvent==='function'&&!openEvent.__spCloud){const old=openEvent;const wrapped=async function(id){try{await recoverOne(id)}catch(e){}return old.call(this,id)};wrapped.__spCloud=true;openEvent=wrapped}if(typeof deleteEvent==='function'&&!deleteEvent.__spCloud){const old=deleteEvent;const wrapped=function(id){const r=old.apply(this,arguments);if(user)cloud.from('siteplan_event_plans').delete().eq('owner_id',user.id).eq('event_key',String(id)).then(()=>queueSave());return r};wrapped.__spCloud=true;deleteEvent=wrapped}const clear=document.getElementById('clearBtn');if(clear&&!clear.dataset.spCloud){clear.dataset.spCloud='1';clear.addEventListener('click',()=>{allowEmptyOnce=true;setTimeout(()=>{allowEmptyOnce=false},5000)},true)}}
wrapCore();setTimeout(async()=>{try{await reconcile();wrapCore()}catch(e){reportSaveError(e)}},700);cloud.auth.onAuthStateChange((_event,s)=>{user=s?.user||null;if(user)setTimeout(()=>reconcile().catch(reportSaveError),120)});window.addEventListener('beforeunload',()=>{if(ready)queueSave()});
})();

/* ---- v74.js ---- */
// SitePlan V74: keep mobile contractor/supplier read-only plans aligned to the saved master view
(()=>{
  const install=()=>{
    if(typeof window.renderReadOnlyPlanMap!=='function') return false;
    if(window.__siteplanV74Installed) return true;
    window.__siteplanV74Installed=true;

    const original=window.renderReadOnlyPlanMap;
    window.renderReadOnlyPlanMap=function(containerId,plan,full=false){
      original(containerId,plan,full);
      if(!window.matchMedia?.('(max-width:900px)').matches) return;

      const host=document.getElementById(containerId);
      const roMap=host?.__mapInstance;
      if(!roMap||!plan) return;

      const lat=Number(plan.center?.lat), lng=Number(plan.center?.lng);
      const zoom=Number(plan.zoom)||18;
      if(!Number.isFinite(lat)||!Number.isFinite(lng)) return;
      const center={lat,lng};

      // The base contractor renderer fits to object bounds. On a narrow phone viewport
      // that changes the apparent plan framing versus the saved builder map. Restore the
      // exact saved centre/zoom after the map/container has settled, without changing any
      // stored marker or shape coordinates.
      const restore=()=>{
        try{
          window.google?.maps?.event?.trigger?.(roMap,'resize');
          roMap.setTilt?.(0);
          roMap.setCenter(center);
          roMap.setZoom(zoom);
        }catch(e){}
      };

      requestAnimationFrame(restore);
      setTimeout(restore,120);
      setTimeout(restore,320);
    };
    return true;
  };

  if(!install()){
    let tries=0;
    const timer=setInterval(()=>{
      tries++;
      if(install()||tries>40) clearInterval(timer);
    },100);
  }
})();

/* ---- v75.js ---- */
// SitePlan V75: robust supplier spreadsheet import
(()=>{
  function norm(v){return String(v??'').replace(/^\uFEFF/,'').trim().toLowerCase().replace(/&/g,'and').replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'')}
  const aliases={company:['company','company_name','supplier','supplier_name','business','business_name','name','vendor','vendor_name','food_truck','food_truck_name'],email:['email','email_address','e_mail','contact_email'],phone:['phone','phone_number','mobile','contact_number'],website:['website','web','url','website_url','site'],contact:['contact','contact_name','contact_person','person'],category:['category','categories','supplier_type','service','service_type','type'],region:['region','regions','area','location','locations'],capabilities:['capabilities','services','notes','description'],insurance:['insurance','public_liability_insurance'],minimum:['minimum','minimum_job_value'],eventSize:['event_size','eventsize','max_event_size'],notifications:['notifications','email_alerts']};
  function findHeaderRow(matrix){let best={i:0,score:-1};matrix.slice(0,20).forEach((row,i)=>{const hs=(row||[]).map(norm);let score=0;Object.values(aliases).forEach(a=>{if(a.some(x=>hs.includes(x)))score++});if(score>best.score)best={i,score}});return best.i}
  function val(obj,key){for(const a of aliases[key]||[]){if(obj[a]!==undefined&&String(obj[a]).trim()!=='')return obj[a]}return ''}
  function split(v){return String(v||'').split(/[;,|]/).map(x=>x.trim()).filter(Boolean)}
  function mapCategory(v){const all=typeof SUPPLIER_CATEGORIES!=='undefined'?SUPPLIER_CATEGORIES:[];const direct=split(v).filter(x=>all.includes(x));if(direct.length)return [...new Set(direct)];const s=String(v||'').toLowerCase();if(/food|truck|cater|coffee|ice cream|dessert|vendor/.test(s))return ['Food Vendor'];if(/bar|beverage|drink/.test(s))return ['Bars & Beverage'];return []}
  function mapRegion(v){const all=typeof SUPPLIER_REGIONS!=='undefined'?SUPPLIER_REGIONS:[];const out=[];split(v).forEach(x=>{let r=x;if(/hamilton|cambridge|te awamutu|matamata|morrinsville|waikato/i.test(r))r='Waikato';if(!all.length||all.includes(r))out.push(r)});return [...new Set(out)]}
  function esc2(v){return typeof esc==='function'?esc(String(v??'')):String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
  async function importRows(){
    const rows=window.__siteplanSupplierImport||[];if(!rows.length)return;
    if(typeof siteplanCloudUser==='undefined'||!siteplanCloudUser){if(typeof openAuthModal==='function')openAuthModal();return}
    const btn=document.getElementById('confirmSupplierImport');if(btn){btn.disabled=true;btn.textContent='Importing…'}
    try{
      const payload=rows.map(x=>({owner_id:siteplanCloudUser.id,company_name:x.company,contact_name:x.contact||null,email:x.email||null,phone:x.phone||null,website:x.website||null,categories:x.categories,regions:x.regions,minimum:x.minimum,event_size:x.eventSize,capabilities:x.capabilities||null,insurance:x.insurance,notifications:x.notifications,active:true,is_global:false}));
      const {data,error}=await siteplanCloud.from('suppliers').insert(payload).select('*');
      if(error)throw error;
      const added=(data||[]).map(s=>typeof cloudSupplierToLocal==='function'?cloudSupplierToLocal(s):s);
      if(typeof suppliers!=='undefined')suppliers=[...added,...suppliers];
      try{localStorage.setItem('siteplan_suppliers',JSON.stringify(suppliers))}catch(e){}
      document.getElementById('importSupplierModal')?.classList.add('hidden');
      if(typeof renderSuppliers==='function')renderSuppliers();if(typeof renderTenders==='function')renderTenders();if(typeof renderSupplierDashboard==='function')renderSupplierDashboard();if(typeof toast==='function')toast(`${added.length} suppliers imported`);
    }catch(e){console.error(e);if(btn){btn.disabled=false;btn.textContent='Try import again'}if(typeof toast==='function')toast(e?.message||'Supplier import failed')}
  }
  window.siteplanImportSupplierRows=importRows;
  function preview(matrix,fileName){
    const modal=document.getElementById('importSupplierModal'),body=document.getElementById('supplierImportBody');if(!modal||!body)return;modal.classList.remove('hidden');
    if(!Array.isArray(matrix)||!matrix.length){body.innerHTML='<div class="empty-state">No supplier rows found.</div>';return}
    const hi=findHeaderRow(matrix),headers=(matrix[hi]||[]).map(norm),existing=new Set((typeof suppliers!=='undefined'?suppliers:[]).map(s=>(s.company||'').trim().toLowerCase()+'|'+(s.email||'').trim().toLowerCase()));
    const parsed=[];let invalid=0,dupes=0;
    matrix.slice(hi+1).forEach((row,n)=>{const x={};headers.forEach((h,i)=>{if(h)x[h]=row?.[i]??''});const company=String(val(x,'company')).trim(),email=String(val(x,'email')).trim();if(!company&&!email)return;let categories=mapCategory(val(x,'category')),regions=mapRegion(val(x,'region'));const context=(String(fileName||'')+' '+company+' '+String(val(x,'category'))).toLowerCase();if(!categories.length&&/food.?truck|food.?vendor|cater/.test(context))categories=['Food Vendor'];if(!regions.length&&/waikato|hamilton|cambridge|te.?awamutu|matamata|morrinsville/.test(context))regions=['Waikato'];const duplicate=existing.has(company.toLowerCase()+'|'+email.toLowerCase());const errors=[];if(!company)errors.push('Company missing');if(!categories.length)errors.push('Category missing/unknown');if(!regions.length)errors.push('Region missing/unknown');if(duplicate)dupes++;if(errors.length)invalid++;parsed.push({line:hi+n+2,company,email,phone:String(val(x,'phone')).trim(),website:String(val(x,'website')).trim(),contact:String(val(x,'contact')).trim(),categories,regions,minimum:Number(val(x,'minimum')||0)||0,eventSize:Number(val(x,'eventSize')||0)||0,capabilities:String(val(x,'capabilities')).trim(),insurance:String(val(x,'insurance')||'TBD').trim()||'TBD',notifications:String(val(x,'notifications')||'all').trim()||'all',duplicate,errors})});
    const ready=parsed.filter(x=>!x.duplicate&&!x.errors.length);window.__siteplanSupplierImport=ready;
    body.innerHTML=`<div style="color:var(--muted);font-size:12px">${esc2(fileName)}</div><div class="import-summary"><div class="import-stat"><small>Rows found</small><b>${parsed.length}</b></div><div class="import-stat"><small>Ready</small><b class="import-good">${ready.length}</b></div><div class="import-stat"><small>Duplicates</small><b>${dupes}</b></div><div class="import-stat"><small>Needs attention</small><b class="${invalid?'import-bad':''}">${invalid}</b></div></div><div class="import-table-wrap"><table class="import-table"><thead><tr><th>Company</th><th>Category</th><th>Region</th><th>Status</th></tr></thead><tbody>${parsed.slice(0,200).map(x=>`<tr><td>${esc2(x.company||'—')}</td><td>${esc2(x.categories.join(', ')||'—')}</td><td>${esc2(x.regions.join(', ')||'—')}</td><td>${x.duplicate?'Duplicate':x.errors.length?`<span class="import-bad">${esc2(x.errors.join(', '))}</span>`:'<span class="import-good">Ready</span>'}</td></tr>`).join('')}</tbody></table></div><div style="display:flex;gap:8px;justify-content:flex-end;margin-top:14px"><button class="btn" id="cancelSupplierImport">Cancel</button><button class="btn primary" id="confirmSupplierImport" ${ready.length?'':'disabled'}>Import ${ready.length} suppliers</button></div>`;
    document.getElementById('cancelSupplierImport').onclick=()=>modal.classList.add('hidden');document.getElementById('confirmSupplierImport').onclick=importRows;
  }
  window.previewSupplierImport=preview;
  async function readFile(file){try{let matrix=[];if(/\.xlsx?$/i.test(file.name)){if(!window.XLSX)await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';s.onload=resolve;s.onerror=reject;document.head.appendChild(s)});const ab=await file.arrayBuffer(),book=XLSX.read(ab,{type:'array'}),sheet=book.Sheets[book.SheetNames[0]];matrix=XLSX.utils.sheet_to_json(sheet,{header:1,defval:'',blankrows:true})}else{const text=await file.text();matrix=text.split(/\r?\n/).map(line=>line.split(','))}preview(matrix,file.name)}catch(e){console.error(e);if(typeof toast==='function')toast('Could not read supplier file')}}
  function hook(){const input=document.getElementById('supplierImportFile');if(!input)return false;input.onchange=()=>{const f=input.files?.[0];if(f)readFile(f)};return true}
  if(!hook()){let tries=0;const t=setInterval(()=>{if(hook()||++tries>40)clearInterval(t)},100)}
})();

/* ---- v76.js ---- */
// SitePlan V76: organiser manual quote entry + file upload
(()=>{
const SOURCE_MARKER='__SITEPLAN_ORGANISER_UPLOAD__';
const style=document.createElement('style');
style.textContent=`
.manual-quote-source{display:inline-flex;align-items:center;border:1px solid #55752e;background:rgba(168,255,53,.06);color:var(--green);border-radius:999px;padding:5px 8px;font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:.06em;margin-top:8px}
#manualQuoteModal .modal-card{width:min(680px,96vw)}
.manual-quote-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.manual-quote-grid .full{grid-column:1/-1}
@media(max-width:620px){.manual-quote-grid{grid-template-columns:1fr}.manual-quote-grid .full{grid-column:auto}}
`;
document.head.appendChild(style);

function addModal(){
 if(document.getElementById('manualQuoteModal'))return;
 const m=document.createElement('div');m.id='manualQuoteModal';m.className='modal hidden';
 m.innerHTML=`<div class="modal-card"><div class="modal-head"><div><h2 style="margin:0">Add quote manually</h2><small style="color:var(--muted)">For quotes received by email, phone or outside SitePlan.</small></div><button class="btn" id="closeManualQuote">×</button></div><div id="manualQuoteBody"></div></div>`;
 document.body.appendChild(m);document.getElementById('closeManualQuote').onclick=()=>m.classList.add('hidden');
}
addModal();

window.openManualQuote=function(tenderId){
 const t=tenders.find(x=>x.id===tenderId);if(!t)return;addModal();
 const opts=(suppliers||[]).filter(s=>!s.isGlobal||s.email).map(s=>`<option value="${esc(s.id)}">${esc(s.company)}${s.email?' · '+esc(s.email):''}</option>`).join('');
 const b=document.getElementById('manualQuoteBody');
 b.innerHTML=`<div class="manual-quote-grid">
  <div class="field full"><label>Supplier</label><select id="mqSupplier"><option value="">Choose supplier…</option>${opts}</select></div>
  <div class="field"><label>Company</label><input id="mqCompany" placeholder="Supplier company"></div>
  <div class="field"><label>Email</label><input id="mqEmail" type="email" placeholder="supplier@email.co.nz"></div>
  <div class="field"><label>Contact name</label><input id="mqContact" placeholder="Optional"></div>
  <div class="field"><label>Total incl. GST</label><input id="mqTotal" type="number" step="0.01" min="0" placeholder="0.00"></div>
  <div class="field"><label>Net</label><input id="mqNet" type="number" step="0.01" min="0" placeholder="0.00"></div>
  <div class="field"><label>GST</label><input id="mqGst" type="number" step="0.01" min="0" placeholder="0.00"></div>
  <div class="field full"><label>Quote file</label><input id="mqFile" type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"></div>
  <div class="field full"><label>Notes / exclusions</label><textarea id="mqNotes" style="width:100%;min-height:110px" placeholder="Optional notes"></textarea></div>
 </div><button class="btn primary" id="saveManualQuote" style="width:100%;padding:13px">Add quote</button>`;
 const sel=document.getElementById('mqSupplier');
 sel.onchange=()=>{const s=suppliers.find(x=>x.id===sel.value);if(!s)return;document.getElementById('mqCompany').value=s.company||'';document.getElementById('mqEmail').value=s.email||'';document.getElementById('mqContact').value=s.contact||''};
 document.getElementById('mqTotal').oninput=()=>{const total=Number(document.getElementById('mqTotal').value)||0;if(total>0&&!document.getElementById('mqNet').value){const net=total/1.15;document.getElementById('mqNet').value=net.toFixed(2);document.getElementById('mqGst').value=(total-net).toFixed(2)}};
 document.getElementById('saveManualQuote').onclick=()=>saveManualQuote(tenderId);
 document.getElementById('manualQuoteModal').classList.remove('hidden');
};

async function saveManualQuote(tenderId){
 const t=tenders.find(x=>x.id===tenderId);if(!t)return;
 const btn=document.getElementById('saveManualQuote');
 const company=document.getElementById('mqCompany').value.trim();
 const email=document.getElementById('mqEmail').value.trim();
 const contact=document.getElementById('mqContact').value.trim();
 const total=Number(document.getElementById('mqTotal').value)||0;
 const net=Number(document.getElementById('mqNet').value)||0;
 const gst=Number(document.getElementById('mqGst').value)||0;
 const notes=document.getElementById('mqNotes').value.trim();
 if(!company){toast('Company is required');return}if(!email){toast('Supplier email is required');return}if(!total){toast('Quote total is required');return}
 btn.disabled=true;btn.textContent='Adding quote…';
 try{
   const d=await publicTenderRequest(t.publicToken||t.id,'POST',{company_name:company,contact_name:contact,email,phone:'',price:total,gst_included:true,availability:'',notes:`${SOURCE_MARKER}${notes?`\n${notes}`:''}`,inclusions:'',exclusions:'',answers:{net,gst_amount:gst,source:'organiser_upload'}});
   const f=document.getElementById('mqFile').files?.[0];
   if(f){const fd=new FormData();fd.append('upload_token',d.upload_token);fd.append('file',f);const r=await fetch(`${SITEPLAN_SUPABASE_URL}/functions/v1/tender-file-upload`,{method:'POST',headers:{'Authorization':`Bearer ${SITEPLAN_EDGE_ANON}`,'apikey':SITEPLAN_EDGE_ANON},body:fd});const u=await r.json().catch(()=>({}));if(!r.ok)throw new Error(u.error||'Quote added but file upload failed')}
   document.getElementById('manualQuoteModal').classList.add('hidden');
   if(typeof refreshCloudTenders==='function')await refreshCloudTenders();
   openTenderView(tenderId);toast('Manual quote added');
 }catch(e){console.error(e);toast(e.message||'Could not add quote');btn.disabled=false;btn.textContent='Add quote'}
}

const oldOpenTenderView=openTenderView;
openTenderView=function(id){
 const r=oldOpenTenderView.apply(this,arguments);
 const t=tenders.find(x=>x.id===id);if(!t)return r;
 const actionRow=document.querySelector('#quoteModalContent .copy-link-box')?.nextElementSibling;
 if(actionRow&&!actionRow.querySelector('.manual-quote-btn')){const b=document.createElement('button');b.className='btn manual-quote-btn';b.textContent='+ Add quote manually';b.onclick=()=>openManualQuote(id);actionRow.appendChild(b)}
 const cards=[...document.querySelectorAll('#quoteModalContent .quote-card')];
 (t.quotes||[]).forEach((q,i)=>{if(!(q.notes||'').startsWith(SOURCE_MARKER)||!cards[i])return;const supplier=cards[i].querySelector('.quote-supplier');if(supplier&&!supplier.querySelector('.manual-quote-source'))supplier.insertAdjacentHTML('beforeend','<div class="manual-quote-source">Uploaded by organiser</div>');const note=cards[i].querySelector('.quote-details div:nth-child(2)');if(note){const cleaned=(q.notes||'').replace(SOURCE_MARKER,'').trim();note.innerHTML=`<strong>Notes:</strong> ${esc(cleaned||'—')}`}});
 return r;
};
})();

/* ---- v77.js ---- */
// SitePlan V77: live tender email delivery summary + sent counts
(()=>{
const style=document.createElement('style');
style.textContent=`
.delivery-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:10px 0 12px}.delivery-summary-card{border:1px solid var(--line);border-radius:12px;background:#0d1116;padding:10px}.delivery-summary-card span{display:block;color:var(--muted);font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:.08em}.delivery-summary-card b{display:block;font-size:18px;margin-top:4px}.delivery-summary-card.bad b{color:#ff8c98}.delivery-summary-card.good b{color:var(--green)}
.delivery-live-note{font-size:11px;color:var(--muted);margin:4px 0 10px}.delivery-live-list{display:grid;gap:8px}.delivery-live-row{display:grid;grid-template-columns:minmax(190px,1.4fr) minmax(130px,.7fr) auto;gap:12px;align-items:center;padding:11px 12px;border:1px solid var(--line);border-radius:11px;background:#0d1116}.delivery-live-row b{display:block;font-size:13px}.delivery-live-row small{display:block;color:var(--muted);margin-top:2px;overflow-wrap:anywhere}.delivery-live-time{font-size:11px;color:var(--muted)}
.delivery-badge.bounced,.delivery-badge.failed,.delivery-badge.suppressed,.delivery-badge.complained{color:#ff8c98;border-color:#6b3038;background:rgba(255,80,95,.06)}.delivery-badge.delivered{color:var(--green);border-color:#55752e;background:rgba(168,255,53,.05)}.delivery-badge.delivery_delayed{color:#ffd36b;border-color:#66582a;background:rgba(255,211,107,.05)}
@media(max-width:620px){.delivery-summary{grid-template-columns:repeat(2,1fr)}.delivery-live-row{grid-template-columns:1fr auto}.delivery-live-time{grid-column:1/-1}}
`;
document.head.appendChild(style);

function label(s){return ({sent:'Sent',delivered:'Delivered',delivery_delayed:'Delayed',bounced:'Bounced',failed:'Failed',suppressed:'Suppressed',complained:'Complaint',clicked:'Clicked',opened:'Opened'}[s]||s||'Sent')}
function effectiveStatus(s){return s==='clicked'||s==='opened'?'delivered':s}
function supplierName(email){try{const x=(suppliers||[]).find(s=>String(s.email||'').toLowerCase()===String(email||'').toLowerCase());return x?.company||x?.company_name||'Supplier'}catch{return 'Supplier'}}
function newestPerEmail(rows){const map=new Map();(rows||[]).forEach(r=>{const k=String(r.recipient_email||'').toLowerCase();if(!k)return;const old=map.get(k);if(!old||new Date(r.updated_at||r.sent_at||0)>new Date(old.updated_at||old.sent_at||0))map.set(k,r)});return [...map.values()]}
async function getTenderRecipients(tenderId){
 const session=(await siteplanCloud.auth.getSession()).data?.session;const token=session?.access_token;if(!token)return [];
 const r=await fetch(`/api/tender-recipients?tenderId=${encodeURIComponent(tenderId)}`,{headers:{Authorization:`Bearer ${token}`}});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'Could not load delivery status');return newestPerEmail(d.recipients||[]);
}
async function renderLiveTenderDelivery(tenderId){
 const host=document.getElementById('tenderDeliveryStatus');if(!host)return;host.innerHTML='<div class="empty">Checking live delivery status…</div>';
 try{const rows=await getTenderRecipients(tenderId);if(!rows.length){host.innerHTML='<div class="empty">No recorded tender emails yet.</div>';return}
  const counts={delivered:0,bounced:0,suppressed:0,other:0};rows.forEach(x=>{const s=effectiveStatus(x.status);if(s==='delivered')counts.delivered++;else if(s==='bounced')counts.bounced++;else if(s==='suppressed'||s==='complained'||s==='failed')counts.suppressed++;else counts.other++});
  host.innerHTML=`<div class="delivery-summary"><div class="delivery-summary-card"><span>Sent</span><b>${rows.length}</b></div><div class="delivery-summary-card good"><span>Delivered</span><b>${counts.delivered}</b></div><div class="delivery-summary-card bad"><span>Bounced</span><b>${counts.bounced}</b></div><div class="delivery-summary-card bad"><span>Suppressed / failed</span><b>${counts.suppressed}</b></div></div><div class="delivery-live-note">Live status from the email provider. Delivered means the recipient mail server accepted the message; it may still be filtered into junk.</div><div class="delivery-live-list">${rows.map(x=>{const when=x.updated_at||x.sent_at;const time=when?new Date(when).toLocaleString('en-NZ',{dateStyle:'medium',timeStyle:'short'}):'';const s=effectiveStatus(x.status);return `<div class="delivery-live-row"><div><b>${esc(supplierName(x.recipient_email))}</b><small>${esc(x.recipient_email||'')}</small></div><div class="delivery-live-time">${esc(time)}</div><span class="delivery-badge ${esc(s)}">${esc(label(x.status))}</span></div>`}).join('')}</div>`;
 }catch(e){console.warn('Live tender delivery',e);host.innerHTML=`<div class="empty">Delivery status could not be loaded. ${esc(e?.message||'')}</div>`}
}
async function refreshSentCounts(){
 const host=document.getElementById('tenderList');if(!host)return;
 const cards=[...host.querySelectorAll('.tender')];
 await Promise.all(cards.map(async card=>{const view=[...card.querySelectorAll('button')].find(b=>(b.textContent||'').trim()==='View');const m=(view?.getAttribute('onclick')||'').match(/openTenderView\(['\"]([^'\"]+)['\"]\)/);if(!m)return;const sent=[...card.querySelectorAll('button')].find(b=>b.classList.contains('sent-to-btn')||(b.textContent||'').trim().startsWith('Sent to'));if(!sent)return;try{const rows=await getTenderRecipients(m[1]);sent.textContent=`Sent to ${rows.length}`}catch{sent.textContent='Sent to'}}));
}
const oldOpen=window.openTenderView;if(typeof oldOpen==='function')window.openTenderView=function(id){const out=oldOpen.apply(this,arguments);setTimeout(()=>renderLiveTenderDelivery(id),0);return out};
// Delivery status is loaded only when a tender is opened. Do not refresh every
// tender card automatically: that previously created a request storm.
window.refreshTenderDelivery=renderLiveTenderDelivery;
window.refreshTenderSentCounts=refreshSentCounts;
})();

/* ---- v78.js ---- */
// SitePlan V78: reliable tender sent counts + active event title
(()=>{
const HISTORY_KEY='siteplan_tender_send_history_v1';
const memoryCounts=new Map();
const css=document.createElement('style');
css.textContent=`.tenders-active-event{display:inline-flex;align-items:center;margin-left:14px;padding:7px 11px;border:1px solid var(--line);border-radius:999px;color:var(--green);font-size:13px;font-weight:850;vertical-align:middle}.tenders-active-event:empty{display:none}@media(max-width:700px){.tenders-active-event{display:flex;width:max-content;margin:7px 0 0;font-size:12px}}`;
document.head.appendChild(css);
function history(){try{return JSON.parse(localStorage.getItem(HISTORY_KEY)||'{}')}catch{return {}}}
function localCount(id){const rows=history()[id];if(!Array.isArray(rows))return 0;return new Set(rows.map(r=>String(r.recipient_email||'').trim().toLowerCase()).filter(Boolean)).size}
function tenderId(card){const view=[...card.querySelectorAll('button')].find(b=>(b.textContent||'').trim()==='View');return (view?.getAttribute('onclick')||'').match(/openTenderView\(['\"]([^'\"]+)['\"]\)/)?.[1]||''}
function sentButton(card){return [...card.querySelectorAll('button')].find(b=>b.classList.contains('sent-to-btn')||(b.textContent||'').trim().startsWith('Sent to'))}
function renderCount(btn,id,n){if(!btn||!id||!Number.isFinite(n)||n<1)return;const best=Math.max(n,memoryCounts.get(id)||0);memoryCounts.set(id,best);btn.textContent=`Sent to ${best}`}
function applyKnownCounts(){document.querySelectorAll('#tenderList .tender').forEach(card=>{const id=tenderId(card),btn=sentButton(card);if(!id||!btn)return;const n=Math.max(localCount(id),memoryCounts.get(id)||0);if(n>0)renderCount(btn,id,n)})}
async function enrichCounts(){
 applyKnownCounts();
 try{
  if(typeof siteplanCloud==='undefined'||typeof siteplanCloudUser==='undefined'||!siteplanCloudUser)return;
  const {data,error}=await siteplanCloud.from('tender_email_deliveries').select('tender_id,recipient_email').eq('email_type','tender_invitation');
  if(error){console.warn('Tender sent counts',error);return}
  const counts=new Map();
  (data||[]).forEach(row=>{
   const id=String(row.tender_id||''),email=String(row.recipient_email||'').trim().toLowerCase();
   if(!id||!email)return;
   if(!counts.has(id))counts.set(id,new Set());
   counts.get(id).add(email);
  });
  document.querySelectorAll('#tenderList .tender').forEach(card=>{
   const id=tenderId(card),btn=sentButton(card);if(!id||!btn)return;
   renderCount(btn,id,Math.max(localCount(id),counts.get(id)?.size||0));
  });
 }catch(error){console.warn('Tender sent counts',error)}
}
function eventName(){const input=document.getElementById('eventName');if(input?.value?.trim())return input.value.trim();try{if(typeof currentEventId!=='undefined'&&typeof events!=='undefined'){const e=(events||[]).find(x=>String(x.id)===String(currentEventId));return String(e?.name||e?.eventName||'').trim()}}catch{}return ''}
function showEventTitle(){const list=document.getElementById('tenderList');if(!list)return;let root=list.closest('section')||list.parentElement?.parentElement||document;const heading=[...root.querySelectorAll('h1,h2')].find(h=>(h.textContent||'').includes('Tenders & Quotes'))||[...document.querySelectorAll('h1,h2')].find(h=>(h.textContent||'').includes('Tenders & Quotes'));if(!heading)return;let badge=heading.querySelector('.tenders-active-event');if(!badge){badge=document.createElement('span');badge.className='tenders-active-event';heading.appendChild(badge)}const name=eventName();badge.textContent=name?`Event: ${name}`:''}
let refreshPromise=null;
function refreshOnce(){showEventTitle();applyKnownCounts();if(!refreshPromise)refreshPromise=enrichCounts().finally(()=>{refreshPromise=null})}
document.addEventListener('click',e=>{if(e.target.closest('[data-module="tenders"],#navTenders,.mobile-nav-tenders'))setTimeout(refreshOnce,80)},true);
window.addEventListener('storage',e=>{if(e.key===HISTORY_KEY)applyKnownCounts()});
setTimeout(()=>{showEventTitle();applyKnownCounts()},150);
})();

/* ---- v79.js ---- */
// SitePlan V79: release-candidate polish — account, limits, recovery, mobile QA, launch/legal
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const safe=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const PLAN_LIMITS={free:{label:'Free',events:3,suppliers:25,tenders:5},beta:{label:'Beta',events:50,suppliers:500,tenders:200},pro:{label:'Pro',events:Infinity,suppliers:Infinity,tenders:Infinity}};
let accountUser=null;
const css=document.createElement('style');
css.textContent=`
.sp-release-pill{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--line);border-radius:999px;padding:6px 9px;font-size:10px;font-weight:900;white-space:nowrap;color:var(--muted);background:#10151a}.sp-release-pill.good{color:var(--green);border-color:#455d2e}.sp-release-pill.warn{color:#ffd36b}.sp-release-pill.bad{color:#ff8c98}
.sp-account-bg{position:fixed;inset:0;background:rgba(0,0,0,.76);z-index:1300;display:grid;place-items:center;padding:18px}.sp-account-card{width:min(680px,100%);max-height:92vh;overflow:auto;background:var(--panel);border:1px solid var(--line);border-radius:20px;padding:22px;box-shadow:var(--shadow)}.sp-account-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px}.sp-account-head h2{margin:0 0 4px}.sp-account-head p{margin:0;color:var(--muted);font-size:12px}.sp-account-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:18px}.sp-account-section{border:1px solid var(--line);border-radius:14px;background:#0e1318;padding:14px}.sp-account-section.full{grid-column:1/-1}.sp-account-section h3{margin:0 0 10px;font-size:14px}.sp-account-section p{font-size:12px;color:var(--muted);line-height:1.5}.sp-account-actions{display:flex;gap:8px;flex-wrap:wrap}.sp-usage{display:grid;gap:9px}.sp-usage-row{display:grid;grid-template-columns:90px 1fr auto;gap:9px;align-items:center;font-size:11px}.sp-usage-row span:first-child{color:var(--muted)}.sp-usage-track{height:7px;border-radius:999px;background:#20272e;overflow:hidden}.sp-usage-fill{height:100%;background:var(--green);border-radius:999px}.sp-legal-bg{position:fixed;inset:0;background:rgba(0,0,0,.78);z-index:1400;display:grid;place-items:center;padding:18px}.sp-legal-card{width:min(820px,100%);max-height:90vh;overflow:auto;background:var(--panel);border:1px solid var(--line);border-radius:20px;padding:24px}.sp-legal-card h2{margin-top:0}.sp-legal-card h3{margin:20px 0 7px;font-size:15px}.sp-legal-card p,.sp-legal-card li{color:#aab3bd;font-size:12px;line-height:1.6}.sp-legal-card ul{padding-left:20px}.sp-footer-links{display:inline-flex;gap:14px;flex-wrap:wrap}.sp-footer-links button{border:0;background:none;color:#8c97a2;padding:0;font:inherit;cursor:pointer;text-decoration:underline}.sp-limit-note{font-size:11px;color:var(--muted);margin-top:8px}.sp-recovery-link{display:block;width:100%;border:0;background:transparent;color:#a8ff35;text-align:left;padding:8px 0 0;font-weight:800;cursor:pointer}.sp-connection{position:fixed;right:14px;bottom:14px;z-index:1100;pointer-events:none}.sp-event-context{display:inline-flex;align-items:center;margin-left:12px;color:var(--green);font-size:13px;font-weight:850}.quote-card[data-awarded="true"]{border-color:#55752e!important;box-shadow:0 0 0 1px rgba(168,255,53,.12) inset}.public-form-note{border:1px solid #d9ded6;background:#fff;border-radius:10px;padding:10px 12px;color:#5f675d;font-size:11px;line-height:1.45;margin-bottom:12px}
@media(max-width:900px){.sp-account-grid{grid-template-columns:1fr}.sp-account-section.full{grid-column:auto}.sp-account-card,.sp-legal-card{max-height:none;margin:6px 0 30px}.sp-account-bg,.sp-legal-bg{align-items:start;overflow:auto;padding:8px}.sp-event-context{display:block;margin:6px 0 0}.tender-actions{grid-template-columns:1fr 1fr!important}.tender-actions .btn{min-width:0!important;white-space:normal!important}.tender-actions .primary{grid-column:1/-1!important}.delivery-summary{grid-template-columns:1fr 1fr!important}.quote-card-list{gap:10px!important}.quote-card{padding:12px!important}.readonly-builder-shell{max-width:100vw!important}.readonly-builder-map-wrap{min-height:420px!important}.readonly-builder-inspector{padding:13px!important}}
@media(max-width:560px){.sp-account-card,.sp-legal-card{padding:16px;border-radius:15px}.sp-account-actions{display:grid;grid-template-columns:1fr}.sp-account-actions .btn{width:100%}.sp-usage-row{grid-template-columns:72px 1fr auto}.readonly-builder-map-wrap{height:58vh!important;min-height:360px!important}.readonly-builder-workspace{grid-template-rows:auto auto!important}.tender-public-body{padding-bottom:26px!important}.public-money-grid{grid-template-columns:1fr!important}.delivery-live-row{grid-template-columns:1fr!important}.delivery-live-time{grid-column:auto!important}.quote-decision .quote-status-actions{grid-template-columns:1fr!important}.modal-head{position:sticky;top:0;z-index:5;background:inherit;padding-bottom:8px}.sp-connection{right:8px;bottom:74px}}
`;
document.head.appendChild(css);
function planKey(user){return String(user?.user_metadata?.siteplan_plan||'beta').toLowerCase()}
function planFor(user){return PLAN_LIMITS[planKey(user)]||PLAN_LIMITS.beta}
function counts(){const ev=typeof events!=='undefined'&&Array.isArray(events)?events:[];const su=typeof suppliers!=='undefined'&&Array.isArray(suppliers)?suppliers:[];const te=typeof tenders!=='undefined'&&Array.isArray(tenders)?tenders:[];return {events:ev.filter(x=>!x.archived).length,suppliers:su.length,tenders:te.filter(x=>String(x.status||'').toLowerCase()==='open').length}}
function usageHtml(label,value,max){const finite=Number.isFinite(max),pct=finite?Math.min(100,Math.round(value/Math.max(1,max)*100)):8;return `<div class="sp-usage-row"><span>${label}</span><div class="sp-usage-track"><div class="sp-usage-fill" style="width:${pct}%"></div></div><b>${value} / ${finite?max:'∞'}</b></div>`}
function atLimit(kind){if(!accountUser)return false;const p=planFor(accountUser),c=counts();return Number.isFinite(p[kind])&&c[kind]>=p[kind]}
function showLimit(kind){const p=planFor(accountUser);const names={events:'events',suppliers:'suppliers',tenders:'open tenders'};toast(`${p.label} plan limit reached for ${names[kind]}. Open Account to review your plan.`);openAccount()}
function connectionChip(text,cls='good'){let host=$('spConnection');if(!host){host=document.createElement('div');host.id='spConnection';host.className='sp-connection';document.body.appendChild(host)}host.innerHTML=`<span class="sp-release-pill ${cls}">${safe(text)}</span>`}
function markOnline(){connectionChip(navigator.onLine?'Cloud connected':'Offline — changes cached',navigator.onLine?'good':'warn')}
window.addEventListener('online',()=>{markOnline();toast('Back online')});window.addEventListener('offline',()=>{markOnline();toast('Offline — changes will stay cached')});
function addEventContext(){const head=$('tendersModule')?.querySelector('.page-head h1');if(!head)return;let span=head.querySelector('.sp-event-context');if(!span){span=document.createElement('span');span.className='sp-event-context';head.appendChild(span)}let name='';try{const e=(events||[]).find(x=>String(x.id)===String(currentEventId));name=e?.name||e?.eventName||''}catch{}span.textContent=name?`· ${name}`:''}
function addPublicFormGuard(){const card=document.querySelector('.tender-public-body');if(!card||card.querySelector('.public-form-note'))return;const submit=$('publicSubmitBtn');if(!submit)return;const note=document.createElement('div');note.className='public-form-note';note.textContent='Your quote is private to the event organiser. Check your email, totals and attachment before submitting.';submit.parentElement.insertBefore(note,submit);const price=$('qPrice'),net=$('qNet'),gst=$('qGstAmount');const calc=()=>{if(!price||!net||!gst)return;const n=Number(net.value)||0,g=Number(gst.value)||0;if(n||g)price.value=(n+g).toFixed(2)};net?.addEventListener('input',calc);gst?.addEventListener('input',calc);submit.addEventListener('click',e=>{const email=String($('qEmail')?.value||'').trim(),file=$('qFile')?.files?.[0];if(email&&!/^\S+@\S+\.\S+$/.test(email)){e.preventDefault();e.stopImmediatePropagation();toast('Enter a valid email address');return}if(file&&file.size>10*1024*1024){e.preventDefault();e.stopImmediatePropagation();toast('Attachment must be 10 MB or smaller')}},true)}
function legal(type){const privacy=`<h2>SitePlan Privacy Notice</h2><p>Last updated 11 September 2026. SitePlan stores the information needed to provide the service, including account details, event plans, supplier contact information, tender details, quote submissions and uploaded files.</p><h3>How information is used</h3><ul><li>To save and sync event workspaces across devices.</li><li>To send tender invitations and quote notifications requested by organisers.</li><li>To operate supplier quote and read-only site-plan links.</li><li>To maintain security, troubleshoot errors and improve the service.</li></ul><h3>Service providers</h3><p>SitePlan uses infrastructure and services including Supabase, Netlify, Google Maps and Resend. Information required to provide a feature may be processed by those providers.</p><h3>Supplier data</h3><p>Organisers are responsible for having a lawful reason to store and contact supplier details. Do not use SitePlan for unsolicited bulk outreach.</p><h3>Your choices</h3><p>You can export local backup data from the Events dashboard. Account deletion and full data export requests should be handled by the SitePlan operator during beta.</p><h3>Security</h3><p>Cloud records are protected using authenticated access and row-level security. No online service can guarantee absolute security, so keep your account credentials private.</p>`;const terms=`<h2>SitePlan Beta Terms</h2><p>Last updated 11 September 2026. These terms apply to the SitePlan beta event-planning workspace.</p><h3>Your account and data</h3><p>You are responsible for the accuracy of information entered into SitePlan and for activity under your account. You retain responsibility for your event plans, supplier records, briefs and commercial decisions.</p><h3>Supplier workflows</h3><p>SitePlan helps send briefs, collect quotes and record award decisions. It is not a party to contracts between organisers and suppliers and does not guarantee supplier performance, availability, pricing or suitability.</p><h3>Maps and operational planning</h3><p>Maps, measurements and site-plan outputs are planning aids. Verify critical measurements, emergency arrangements, access routes and safety information independently before relying on them operationally.</p><h3>Acceptable use</h3><p>Do not use SitePlan for unlawful activity, spam, abuse, unauthorised access or infringement of another person's rights.</p><h3>Beta availability</h3><p>Features may change during beta. Keep appropriate operational backups for important events. SitePlan may suspend access where necessary to protect the service or other users.</p><h3>Liability</h3><p>To the extent permitted by law, SitePlan is provided on an as-available basis during beta. Nothing in these terms limits rights that cannot legally be excluded.</p>`;const bg=document.createElement('div');bg.className='sp-legal-bg';bg.innerHTML=`<div class="sp-legal-card"><div style="display:flex;justify-content:flex-end"><button class="btn" data-close>×</button></div>${type==='privacy'?privacy:terms}</div>`;document.body.appendChild(bg);bg.addEventListener('click',e=>{if(e.target===bg||e.target.closest('[data-close]'))bg.remove()})}
function installFooter(){const f=document.querySelector('.marketing-footer');if(!f||f.querySelector('.sp-footer-links'))return;const links=document.createElement('span');links.className='sp-footer-links';links.innerHTML='<button type="button" data-terms>Terms</button><button type="button" data-privacy>Privacy</button>';f.appendChild(links);links.querySelector('[data-terms]').onclick=()=>legal('terms');links.querySelector('[data-privacy]').onclick=()=>legal('privacy')}
async function refreshAccountUser(){try{const {data}=await siteplanCloud.auth.getSession();accountUser=data?.session?.user||null;return accountUser}catch{return null}}
async function openAccount(){await refreshAccountUser();if(!accountUser){if(typeof openAuthModalMode==='function')openAuthModalMode('signin');return}document.querySelector('.sp-account-bg')?.remove();const p=planFor(accountUser),c=counts(),name=accountUser.user_metadata?.full_name||accountUser.user_metadata?.name||'';const bg=document.createElement('div');bg.className='sp-account-bg';bg.innerHTML=`<div class="sp-account-card"><div class="sp-account-head"><div><h2>Your SitePlan account</h2><p>${safe(accountUser.email||'')}</p></div><button class="btn" data-close>×</button></div><div class="sp-account-grid"><section class="sp-account-section"><h3>Profile</h3><div class="field"><label>Name</label><input id="spProfileName" value="${safe(name)}" placeholder="Your name"></div><div class="sp-account-actions"><button class="btn primary" id="spSaveProfile">Save profile</button><button class="btn" id="spResetPassword">Reset password</button></div></section><section class="sp-account-section"><h3>${safe(p.label)} plan</h3><div class="sp-usage">${usageHtml('Events',c.events,p.events)}${usageHtml('Suppliers',c.suppliers,p.suppliers)}${usageHtml('Tenders',c.tenders,p.tenders)}</div><div class="sp-limit-note">Beta accounts have generous launch limits while paid billing is being connected.</div><div class="sp-account-actions" style="margin-top:10px"><button class="btn primary" id="spUpgrade">Upgrade / Billing</button></div></section><section class="sp-account-section full"><h3>Data & account</h3><p>Your event plans are synced to SitePlan Cloud when signed in. Browser storage remains as a local cache/fallback.</p><div class="sp-account-actions"><button class="btn" id="spBackup">Export backup</button><button class="btn" id="spTerms">Terms</button><button class="btn" id="spPrivacy">Privacy</button><button class="btn danger" id="spSignOut">Sign out</button></div></section></div></div>`;document.body.appendChild(bg);bg.addEventListener('click',e=>{if(e.target===bg||e.target.closest('[data-close]'))bg.remove()});$('spSaveProfile').onclick=async()=>{const n=String($('spProfileName').value||'').trim();const {data,error}=await siteplanCloud.auth.updateUser({data:{full_name:n}});if(error){toast(error.message);return}accountUser=data.user;toast('Profile saved')};$('spResetPassword').onclick=async()=>{const {error}=await siteplanCloud.auth.resetPasswordForEmail(accountUser.email,{redirectTo:location.origin+location.pathname});if(error)toast(error.message);else toast('Password reset email sent')};$('spBackup').onclick=()=>exportLocalBackup?.();$('spTerms').onclick=()=>legal('terms');$('spPrivacy').onclick=()=>legal('privacy');$('spUpgrade').onclick=()=>toast('Stripe billing connection is the final external setup step');$('spSignOut').onclick=async()=>{const btn=$('spSignOut'),label=btn.textContent;btn.disabled=true;btn.textContent='Signing out…';try{const {error}=await siteplanCloud.auth.signOut({scope:'local'});if(error)throw error;accountUser=null;if(typeof siteplanCloudUser!=='undefined')siteplanCloudUser=null;bg.remove();cloudStatus?.('Sign in');toast('Signed out')}catch(error){console.error('SitePlan sign out',error);toast(error?.message||'Could not sign out');btn.disabled=false;btn.textContent=label}}}
window.openSitePlanAccount=openAccount;
function installAccount(){const btn=$('accountBtn');if(!btn)return;btn.addEventListener('click',e=>{const signedIn=accountUser||(typeof siteplanCloudUser!=='undefined'&&siteplanCloudUser);if(!signedIn)return;e.preventDefault();e.stopImmediatePropagation();openAccount()},true)}
function installForgot(){const pass=$('authPassword')?.closest('.field');if(!pass||pass.querySelector('.sp-recovery-link'))return;const b=document.createElement('button');b.type='button';b.className='sp-recovery-link';b.textContent='Forgot password?';pass.appendChild(b);b.onclick=async()=>{const email=String($('authEmail')?.value||'').trim();if(!email){authMsg?.('Enter your email first.');return}try{const {error}=await siteplanCloud.auth.resetPasswordForEmail(email,{redirectTo:location.origin+location.pathname});if(error)throw error;authMsg?.('Password reset email sent. Check your inbox.')}catch(e){authMsg?.(e.message)}}}
function passwordRecoveryModal(){document.querySelector('.sp-account-bg')?.remove();const bg=document.createElement('div');bg.className='sp-account-bg';bg.innerHTML=`<div class="sp-account-card" style="width:min(430px,100%)"><div class="sp-account-head"><div><h2>Set a new password</h2><p>Choose a new password for your SitePlan account.</p></div></div><div class="field" style="margin-top:18px"><label>New password</label><input id="spNewPassword" type="password" autocomplete="new-password" placeholder="At least 8 characters"></div><button class="btn primary" id="spSetPassword" style="width:100%">Update password</button></div>`;document.body.appendChild(bg);$('spSetPassword').onclick=async()=>{const pw=$('spNewPassword').value;if(pw.length<8){toast('Use at least 8 characters');return}const {error}=await siteplanCloud.auth.updateUser({password:pw});if(error){toast(error.message);return}toast('Password updated');bg.remove();history.replaceState(null,'',location.pathname+location.search)}}
function installRecoveryListener(){siteplanCloud?.auth?.onAuthStateChange((event,session)=>{accountUser=session?.user||null;if(event==='PASSWORD_RECOVERY')setTimeout(passwordRecoveryModal,50)})}
function installLimits(){const wrap=(name,kind,buttonId)=>{try{const old=window[name]||eval(name);if(typeof old!=='function'||old.__sp79)return;const fn=function(){if(atLimit(kind)){showLimit(kind);return}return old.apply(this,arguments)};fn.__sp79=true;window[name]=fn;try{eval(`${name}=window[name]`)}catch{}const b=$(buttonId);if(b)b.onclick=fn}catch{}};wrap('newEvent','events','newEventBtn');wrap('openTender','tenders','newTenderBtn');wrap('openSupplierModal','suppliers','newSupplierBtn')}
function polishAwards(){try{if(typeof setCloudQuoteStatus!=='function'||setCloudQuoteStatus.__sp79)return;const old=setCloudQuoteStatus;const fn=async function(tid,qid,status){if(status==='awarded'&&!confirm('Award this supplier? Other active quotes for this tender will be declined.'))return;return old.apply(this,arguments)};fn.__sp79=true;setCloudQuoteStatus=fn;window.setCloudQuoteStatus=fn}catch{}}
function decorateAwardState(){document.querySelectorAll('.quote-card').forEach(card=>{const pill=card.querySelector('.pill');const awarded=(pill?.textContent||'').trim().toLowerCase()==='awarded';card.dataset.awarded=awarded?'true':'false';if(awarded)card.querySelectorAll('.quote-status-actions button').forEach(b=>{if((b.textContent||'').trim()==='Award'){b.disabled=true;b.textContent='Awarded'}})})}
function refreshPolish(){addEventContext();addPublicFormGuard();decorateAwardState()}
const observer=new MutationObserver(()=>{clearTimeout(observer._t);observer._t=setTimeout(refreshPolish,60)});observer.observe(document.body,{childList:true,subtree:true});
function installErrorGuard(){window.addEventListener('unhandledrejection',e=>{const m=String(e.reason?.message||e.reason||'');if(/fetch|network|offline|failed to fetch/i.test(m))toast('Connection issue — your browser copy is still available')})}
async function init(){installFooter();installAccount();installForgot();installRecoveryListener();await refreshAccountUser();installLimits();polishAwards();markOnline();refreshPolish();installErrorGuard();setTimeout(refreshPolish,900)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,0));else setTimeout(init,0);
})();

/* ---- v80.js ---- */
// SitePlan V80: tender engagement tracking — delivered, opened, viewed, quote submitted
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const safe=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const HISTORY_KEY='siteplan_tender_send_history_v1';
const LABELS={sent:'Sent',delivered:'Delivered',opened:'Email opened',clicked:'Tender viewed',quote_submitted:'Quote submitted',delivery_delayed:'Delayed',bounced:'Bounced',failed:'Failed',suppressed:'Suppressed',complained:'Complaint'};
const cls=s=>['bounced','failed','suppressed','complained'].includes(s)?'bad':['quote_submitted','clicked','opened','delivered'].includes(s)?'good':'neutral';
const css=document.createElement('style');
css.textContent=`.delivery-badge.good{color:var(--green)!important;border-color:#55752e!important;background:rgba(168,255,53,.05)!important}.delivery-badge.bad{color:#ff8c98!important;border-color:#6b3038!important}.delivery-badge.neutral{color:#9fd1ff!important}.sp-engagement-note{margin:10px 0 2px;color:var(--muted);font-size:11px;line-height:1.45}.sp-engagement-note b{color:var(--text)}.sent-supplier-row{grid-template-columns:minmax(190px,1.4fr) minmax(130px,.7fr) auto 34px!important}.sent-supplier-remove{width:30px;height:30px;min-width:30px;padding:0!important;border-radius:9px!important;font-size:17px!important;line-height:1!important}@media(max-width:620px){.sent-supplier-row{grid-template-columns:1fr auto 34px!important}.sent-supplier-time{grid-column:1/-1}.sent-supplier-remove{grid-column:3;grid-row:1}}`;
document.head.appendChild(css);

function quotesFor(tender){return Array.isArray(tender?.quotes)?tender.quotes:[]}
function quoteEmails(tender){return new Set(quotesFor(tender).map(q=>String(q.email||'').trim().toLowerCase()).filter(Boolean))}
function localRows(tenderId){
 try{
  const all=JSON.parse(localStorage.getItem(HISTORY_KEY)||'{}');
  return (Array.isArray(all[tenderId])?all[tenderId]:[]).map(x=>({...x,_local:true,status:String(x.status||'sent').toLowerCase()}));
 }catch{return []}
}
function newestPerEmail(rows){
 const map=new Map();
 (rows||[]).forEach(row=>{
  const email=String(row.recipient_email||'').trim().toLowerCase();if(!email)return;
  const old=map.get(email),when=new Date(row.updated_at||row.sent_at||0).getTime()||0,oldWhen=new Date(old?.updated_at||old?.sent_at||0).getTime()||0;
  if(!old||when>=oldWhen)map.set(email,{...old,...row,recipient_email:email});
 });
 return [...map.values()].sort((a,b)=>new Date(b.updated_at||b.sent_at||0)-new Date(a.updated_at||a.sent_at||0));
}
async function rowsFor(tenderId){
 let live=[];
 try{
  if(typeof siteplanCloud!=='undefined'){
   const session=(await siteplanCloud.auth.getSession()).data?.session;
   if(session?.access_token){
    const r=await fetch(`/api/tender-recipients?tenderId=${encodeURIComponent(tenderId)}&v=80`,{headers:{Authorization:`Bearer ${session.access_token}`},cache:'no-store'});
    const d=await r.json().catch(()=>({}));if(r.ok)live=d.recipients||[];
   }
  }
 }catch{}
 const t=(typeof tenders!=='undefined'?(tenders||[]):[]).find(x=>String(x.id)===String(tenderId));
 const submitted=quoteEmails(t);
 return newestPerEmail([...localRows(tenderId),...live]).map(x=>{const email=String(x.recipient_email||'').trim().toLowerCase();return {...x,status:submitted.has(email)?'quote_submitted':String(x.status||'sent').toLowerCase()}});
}
function renderRows(host,rows,tenderId){
 if(!host)return;
 if(!rows.length){host.innerHTML='<div class="empty">No recorded sends for this tender yet.</div>';return}
 host.innerHTML=`<div style="color:var(--muted);font-size:12px">${rows.length} supplier${rows.length===1?'':'s'} sent this tender</div><div class="sp-engagement-note"><b>Delivered</b> means the recipient mail server accepted it. <b>Tender viewed</b> means they clicked the tender link.</div><div class="sent-supplier-list">${rows.map(r=>{const when=r.updated_at||r.sent_at;const time=when?new Date(when).toLocaleString('en-NZ',{dateStyle:'medium',timeStyle:'short'}):'';const s=String(r.status||'sent').toLowerCase(),email=String(r.recipient_email||'');return `<div class="sent-supplier-row"><div><b>${safe(r.company_name||'Supplier')}</b><small>${safe(email)}</small></div><div class="sent-supplier-time">${safe(time)}</div><span class="delivery-badge ${cls(s)}">${safe(LABELS[s]||s)}</span><button type="button" class="btn danger sent-supplier-remove" title="Remove from sent history" aria-label="Remove ${safe(r.company_name||email)} from sent history" onclick="removeTenderRecipient('${safe(tenderId)}','${safe(email)}')">×</button></div>`}).join('')}</div>`;
}
window.removeTenderRecipient=async function(tenderId,email){
 const normalized=String(email||'').trim().toLowerCase();if(!normalized)return;
 if(!confirm('Remove this supplier from the sent history?'))return;
 try{
  if(typeof siteplanCloud!=='undefined'){
   const {error}=await siteplanCloud.from('tender_email_deliveries').delete().eq('tender_id',tenderId).ilike('recipient_email',normalized);
   if(error)throw error;
  }
  const all=JSON.parse(localStorage.getItem(HISTORY_KEY)||'{}');
  all[tenderId]=(Array.isArray(all[tenderId])?all[tenderId]:[]).filter(r=>String(r.recipient_email||'').trim().toLowerCase()!==normalized);
  localStorage.setItem(HISTORY_KEY,JSON.stringify(all));
  const rows=await rowsFor(tenderId);renderRows($('sentSupplierBody'),rows,tenderId);
  if(typeof renderTenders==='function')renderTenders();
  toast('Removed from sent history');
 }catch(error){console.error('Remove tender recipient',error);toast(error?.message||'Could not remove supplier from sent history')}
};
window.showTenderRecipients=async function(tenderId){
 const t=(typeof tenders!=='undefined'?(tenders||[]):[]).find(x=>String(x.id)===String(tenderId));if(!t)return;
 const qmc=$('quoteModalContent');qmc.style.width='min(760px,96vw)';qmc.style.maxWidth='760px';qmc.style.padding='22px';qmc.style.background='var(--panel)';
 qmc.innerHTML=`<div class="modal-head"><div><h2 style="margin:0">Sent suppliers</h2><small>${safe(t.title)} · ${safe(t.eventName||'Event')}</small></div><button class="btn" onclick="document.getElementById('quoteModal').classList.add('hidden')">×</button></div><div id="sentSupplierBody"><div class="empty">Checking delivery and engagement…</div></div>`;
 $('quoteModal').classList.remove('hidden');renderRows($('sentSupplierBody'),await rowsFor(tenderId),tenderId);
};
const oldOpen=window.openTenderView;
if(typeof oldOpen==='function')window.openTenderView=function(id){
 const out=oldOpen.apply(this,arguments);
 setTimeout(async()=>{
  const host=$('tenderDeliveryStatus');if(!host)return;
  const rows=await rowsFor(id);if(!rows.length)return;
  host.innerHTML=`<div class="sp-engagement-note"><b>Delivered</b> = accepted by recipient mail server. <b>Tender viewed</b> = tender link clicked.</div><div class="delivery-list">${rows.map(r=>{const s=String(r.status||'sent').toLowerCase(),when=r.updated_at||r.sent_at,time=when?new Date(when).toLocaleString('en-NZ',{dateStyle:'medium',timeStyle:'short'}):'';return `<div class="delivery-row"><div><b>${safe(r.company_name||'Supplier')}</b><small>${safe(r.recipient_email||'')}</small></div><div class="delivery-time">${safe(time)}</div><div><span class="delivery-badge ${cls(s)}">${safe(LABELS[s]||s)}</span></div></div>`}).join('')}</div>`;
 },120);
 return out;
};
})();

/* ---- v81.js ---- */
// SitePlan V81: free-text map labels
(()=>{
'use strict';

// Add a dedicated text object to the normal map object palette.
if(typeof OBJECT_TYPES!=='undefined' && !OBJECT_TYPES.some(x=>x[0]==='label')){
  OBJECT_TYPES.unshift(['label','T','Text label','#ffffff']);
}

const oldMarkerContent=typeof markerContent==='function'?markerContent:null;
if(oldMarkerContent){
  markerContent=function(item){
    if(item?.type!=='label') return oldMarkerContent(item);
    const safe=String(item.name||'Label').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
    const el=document.createElement('div');
    el.className='site-marker site-text-label';
    el.innerHTML=`<div class="ml">${safe}</div>`;
    return el;
  };
}

const oldAddMarker=typeof addMarker==='function'?addMarker:null;
if(oldAddMarker){
  addMarker=function(type,position,data={}){
    if(type!=='label') return oldAddMarker(type,position,data);
    const supplied=String(data?.name||'').trim();
    const text=supplied || (isRestoringPlan ? 'Label' : (prompt('Label text','')||'').trim());
    if(!text && !isRestoringPlan){pendingObjectType=null;byId('mapTip')?.classList.remove('show');return null;}
    const item=oldAddMarker(type,position,{...data,name:text||'Label'});
    if(item && !isRestoringPlan){setTimeout(()=>{const input=byId('selName');if(input){input.focus();input.select();}},0);}
    return item;
  };
}

const style=document.createElement('style');
style.textContent=`
.site-marker.site-text-label{
  min-width:max-content!important;width:max-content!important;max-width:none!important;
  height:auto!important;min-height:0!important;padding:0!important;
  border:0!important;border-radius:0!important;background:transparent!important;
  box-shadow:none!important;color:#151719!important;display:inline-flex!important;
  overflow:visible!important;white-space:nowrap!important;
}
.site-marker.site-text-label .mi{display:none!important}
.site-marker.site-text-label .ml{
  position:static!important;transform:none!important;background:#fff!important;
  color:#151719!important;padding:6px 10px!important;border-radius:7px!important;
  font-size:11px!important;font-weight:850!important;text-transform:none!important;
  width:max-content!important;min-width:max-content!important;max-width:none!important;
  white-space:nowrap!important;overflow:visible!important;text-overflow:clip!important;
  box-shadow:0 2px 6px rgba(0,0,0,.28)!important;line-height:1.15!important;
}
.site-marker.site-text-label.selected .ml{
  box-shadow:0 0 0 3px rgba(168,255,53,.45),0 2px 6px rgba(0,0,0,.28)!important;
}
.site-marker.site-text-label.selected{transform:none!important}
.object-btn[data-search*="text label"] .ico{background:#252c34!important;color:#a8ff35!important;font-weight:1000!important}
`;
document.head.appendChild(style);
})();

/* ---- v82.js ---- */
// SitePlan V82: email all or selected awarded suppliers before the event
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const safe=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
async function timedFetch(url,init,timeoutMs=25000){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs);try{return await fetch(url,{...init,signal:controller.signal})}catch(error){if(error?.name==='AbortError')throw new Error('Sending timed out. Please check whether the email was received before trying again.');throw error}finally{clearTimeout(timer)}}

const css=document.createElement('style');
css.textContent=`
.sp-tender-head-actions{display:flex;align-items:center;justify-content:flex-end;gap:8px;flex-wrap:wrap}.sp-brief-btn{white-space:nowrap}.sp-brief-bg{position:fixed;inset:0;background:rgba(0,0,0,.76);z-index:1500;display:grid;place-items:center;padding:18px}.sp-brief-card{width:min(820px,100%);max-height:92vh;overflow:auto;background:var(--panel);border:1px solid var(--line);border-radius:20px;padding:22px;box-shadow:var(--shadow)}.sp-brief-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}.sp-brief-head h2{margin:0 0 4px}.sp-brief-head p{margin:0;color:var(--muted);font-size:12px}.sp-brief-tools{display:flex;justify-content:space-between;align-items:center;gap:10px;margin:16px 0 10px;flex-wrap:wrap}.sp-approved-list{display:grid;gap:8px;margin-bottom:16px}.sp-approved-row{display:grid;grid-template-columns:auto 1fr auto;gap:10px;align-items:center;border:1px solid var(--line);border-radius:12px;padding:12px;background:#0e1318}.sp-approved-row b{display:block}.sp-approved-row small{display:block;color:var(--muted);margin-top:2px;overflow-wrap:anywhere}.sp-approved-row .pill{justify-self:end}.sp-brief-fields{display:grid;grid-template-columns:1fr 1fr;gap:12px}.sp-brief-fields .full{grid-column:1/-1}.sp-brief-fields textarea{width:100%;min-height:130px;background:var(--panel2);border:1px solid var(--line);color:var(--text);border-radius:9px;padding:10px;resize:vertical}.sp-brief-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:16px}.sp-brief-empty{border:1px dashed var(--line);border-radius:12px;padding:18px;color:var(--muted)}
@media(max-width:620px){.sp-brief-bg{padding:8px;align-items:start;overflow:auto}.sp-brief-card{max-height:none;padding:15px;border-radius:15px}.sp-approved-row{grid-template-columns:auto 1fr}.sp-approved-row .pill{grid-column:2}.sp-brief-fields{grid-template-columns:1fr}.sp-brief-fields .full{grid-column:auto}.sp-brief-actions{display:grid;grid-template-columns:1fr}.sp-brief-actions .btn{width:100%}}
`;
document.head.appendChild(css);

function currentEvent(){try{return (events||[]).find(e=>String(e.id)===String(currentEventId))||null}catch{return null}}
function awardedRecipients(){
  const byEmail=new Map();
  try{
    (tenders||[]).filter(t=>!currentEventId||String(t.eventId||'')===String(currentEventId)).forEach(t=>{
      (t.quotes||[]).filter(q=>String(q.status||'').toLowerCase()==='awarded'&&q.email).forEach(q=>{
        const email=String(q.email||'').trim().toLowerCase();if(!email)return;
        const link=typeof publicLinkFor==='function'?publicLinkFor(t):'';
        const row={email,company:q.company||'Supplier',contact:q.contact||'',service:t.title||t.category||'',tenderTitle:t.title||'',planLink:link?(link+(link.includes('#')?'&':'#')+'plan=1'):''};
        const old=byEmail.get(email);
        if(old){old.service=[old.service,row.service].filter(Boolean).filter((v,i,a)=>a.indexOf(v)===i).join(' · ');if(!old.planLink)old.planLink=row.planLink}else byEmail.set(email,row);
      });
    });
  }catch(e){console.warn('Approved supplier list',e)}
  return [...byEmail.values()].sort((a,b)=>String(a.company).localeCompare(String(b.company)));
}
function installButton(){
  const module=$('tendersModule');if(!module)return;
  const head=module.querySelector('.page-head');if(!head)return;
  const newTender=$('newTenderBtn');
  let actions=head.querySelector('.sp-tender-head-actions');
  if(!actions){
    actions=document.createElement('div');actions.className='sp-tender-head-actions';
    if(newTender&&newTender.parentElement===head){head.insertBefore(actions,newTender);actions.appendChild(newTender)}else head.appendChild(actions);
  }
  const existing=head.querySelector('[data-event-brief]');
  if(existing){if(existing.parentElement!==actions)actions.appendChild(existing);return}
  const btn=document.createElement('button');btn.className='btn primary sp-brief-btn';btn.dataset.eventBrief='1';btn.textContent='Email approved suppliers';btn.onclick=openBriefModal;
  actions.appendChild(btn);
}
function openBriefModal(){
  const ev=currentEvent(),rows=awardedRecipients();
  document.querySelector('.sp-brief-bg')?.remove();
  const bg=document.createElement('div');bg.className='sp-brief-bg';
  const eventName=ev?.name||$('eventName')?.value||'Event';
  const date=ev?.eventDate||'';const location=ev?.location||'';
  bg.innerHTML=`<div class="sp-brief-card"><div class="sp-brief-head"><div><h2>Email approved suppliers</h2><p>${safe(eventName)} · send a final brief to all or selected awarded suppliers.</p></div><button class="btn" data-close>×</button></div>${rows.length?`<div class="sp-brief-tools"><strong>${rows.length} approved supplier${rows.length===1?'':'s'}</strong><div><button class="btn" data-all>Select all</button> <button class="btn" data-none>Clear</button></div></div><div class="sp-approved-list">${rows.map((r,i)=>`<label class="sp-approved-row"><input type="checkbox" class="sp-approved-check" data-i="${i}" checked><div><b>${safe(r.company)}</b><small>${safe(r.email)}</small><small>${safe(r.service)}</small></div><span class="pill awarded">Approved</span></label>`).join('')}</div><div class="sp-brief-fields"><div class="field full"><label>Subject</label><input id="spBriefSubject" value="${safe(eventName)} – final event brief"></div><div class="field full"><label>Message</label><textarea id="spBriefMessage">Hi team,\n\nWe’re getting close to the event. Please review the final event information below and the latest site plan, and reply to confirm everything is still on track.\n\nIf anything has changed with timings, access, staffing or equipment, please let us know as soon as possible.</textarea></div><div class="field"><label>Event date</label><input id="spBriefDate" value="${safe(date)}" placeholder="e.g. 5 December 2026"></div><div class="field"><label>Location</label><input id="spBriefLocation" value="${safe(location)}" placeholder="Event venue / address"></div></div><div class="sp-brief-actions"><button class="btn" data-close>Cancel</button><button class="btn primary" id="spSendBrief">Email selected suppliers</button></div>`:`<div class="sp-brief-empty" style="margin-top:16px">No awarded supplier quotes are attached to this event yet. Award a quote first, then those suppliers will appear here automatically.</div><div class="sp-brief-actions"><button class="btn" data-close>Close</button></div>`}</div>`;
  document.body.appendChild(bg);
  bg.addEventListener('click',e=>{if(e.target===bg||e.target.closest('[data-close]'))bg.remove()});
  bg.querySelector('[data-all]')?.addEventListener('click',()=>bg.querySelectorAll('.sp-approved-check').forEach(x=>x.checked=true));
  bg.querySelector('[data-none]')?.addEventListener('click',()=>bg.querySelectorAll('.sp-approved-check').forEach(x=>x.checked=false));
  const send=$('spSendBrief');if(send)send.onclick=async()=>{
    const chosen=[...bg.querySelectorAll('.sp-approved-check:checked')].map(x=>rows[Number(x.dataset.i)]).filter(Boolean);
    if(!chosen.length){toast('Select at least one approved supplier');return}
    if(!confirm(`Email the final brief to ${chosen.length} approved supplier${chosen.length===1?'':'s'}?`))return;
    send.disabled=true;send.textContent='Sending…';
    try{
      const session=(await siteplanCloud.auth.getSession()).data?.session;if(!session)throw new Error('Sign in before emailing suppliers.');
      const r=await timedFetch('/api/send-event-brief',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${session.access_token}`},body:JSON.stringify({eventName,eventDate:$('spBriefDate')?.value||date,location:$('spBriefLocation')?.value||location,subject:$('spBriefSubject')?.value||`${eventName} – final event brief`,message:$('spBriefMessage')?.value||'',recipients:chosen})});
      const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'Could not send event brief');
      toast(`Brief emailed to ${d.sent} supplier${d.sent===1?'':'s'}`);bg.remove();
    }catch(e){toast(e.message||'Could not send event brief');send.disabled=false;send.textContent='Email selected suppliers'}
  };
}
window.openApprovedSupplierBrief=openBriefModal;

const observer=new MutationObserver(installButton);observer.observe(document.documentElement,{childList:true,subtree:true});
installButton();
})();

/* ---- v83.js ---- */
// SitePlan V83: reliable supplier create/edit with direct Supabase diagnostics
(()=>{
'use strict';
let editingSupplierId='';
const by=id=>document.getElementById(id);
async function supplierRequest(body,token){let lastError;for(let attempt=0;attempt<2;attempt++){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);try{const r=await fetch('/api/save-supplier',{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`},body:JSON.stringify(body),signal:controller.signal});const d=await r.json().catch(()=>({}));if(!r.ok){const error=new Error(d.error||`Supplier save failed (${r.status})`);error.status=r.status;throw error}return d.supplier}catch(error){lastError=error;const retryable=error?.name==='AbortError'||error?.status===429||Number(error?.status)>=500;if(!retryable||attempt===1)break;await new Promise(resolve=>setTimeout(resolve,600));}finally{clearTimeout(timer)}}if(lastError?.name==='AbortError')throw new Error('Supplier save timed out. The same supplier ID was retained, so it is safe to try again.');throw lastError}
function fillChecks(hostId,values){const host=by(hostId);if(!host)return;[...host.querySelectorAll('input[type="checkbox"]')].forEach(x=>x.checked=(values||[]).includes(x.value));}
function cleanSupplierId(value){if(typeof value!=='string')return '';const id=value.trim();return id&&id!=='[object Object]'&&id!=='[object PointerEvent]'&&id!=='[object MouseEvent]'?id:'';}

window.openSupplierModal=function(id=''){
 editingSupplierId=cleanSupplierId(id);
 checkboxCards('supplierCategories',SUPPLIER_CATEGORIES);
 checkboxCards('supplierRegions',SUPPLIER_REGIONS);
 const s=editingSupplierId?suppliers.find(x=>String(x.id)===editingSupplierId):null;
 by('sCompany').value=s?.company||'';by('sContact').value=s?.contact||'';by('sEmail').value=s?.email||'';by('sPhone').value=s?.phone||'';by('sWebsite').value=s?.website||'';by('sMinimum').value=s?.minimum||'';by('sEventSize').value=s?.eventSize||'';by('sCapabilities').value=s?.capabilities||'';by('sInsurance').value=s?.insurance||'Yes';by('sNotifications').value=s?.notifications||'all';
 fillChecks('supplierCategories',s?.categories||[]);fillChecks('supplierRegions',s?.regions||[]);
 const modal=by('supplierModal'),title=modal?.querySelector('.modal-head h2'),save=by('saveSupplierBtn');if(title)title.textContent=s?'Edit Supplier':'Supplier Registration';if(save)save.textContent=s?'Save Changes':'Create Supplier Profile';modal?.classList.remove('hidden');
};

function supplierFromCloud(data){
 if(typeof cloudSupplierToLocal==='function')return cloudSupplierToLocal(data);
 return {id:data.id,company:data.company_name||'',contact:data.contact_name||'',email:data.email||'',phone:data.phone||'',website:data.website||'',categories:data.categories||[],regions:data.regions||[],minimum:Number(data.minimum)||0,eventSize:Number(data.event_size)||0,capabilities:data.capabilities||'',insurance:data.insurance||'Yes',notifications:data.notifications||'all',active:data.active!==false,isGlobal:!!data.is_global};
}

window.addSupplier=async function(){
 const company=String(by('sCompany')?.value||'').trim(),email=String(by('sEmail')?.value||'').trim();
 if(!company||!email){toast('Add company name and email');return}
 const categories=[...by('supplierCategories').querySelectorAll('input:checked')].map(x=>x.value),regions=[...by('supplierRegions').querySelectorAll('input:checked')].map(x=>x.value);
 if(!categories.length||!regions.length){toast('Choose category and region');return}
 const row={company_name:company,contact_name:String(by('sContact')?.value||'').trim()||null,email:email.toLowerCase(),phone:String(by('sPhone')?.value||'').trim()||null,website:String(by('sWebsite')?.value||'').trim()||null,categories,regions,minimum:Number(by('sMinimum')?.value)||0,event_size:Number(by('sEventSize')?.value)||0,capabilities:String(by('sCapabilities')?.value||'').trim()||null,insurance:by('sInsurance')?.value||'Yes',notifications:by('sNotifications')?.value||'all',active:true};
 const save=by('saveSupplierBtn');if(save){save.disabled=true;save.textContent='Saving…'}
 try{
  const session=(await siteplanCloud.auth.getSession()).data?.session;if(!session){if(typeof openAuthModal==='function')openAuthModal();throw new Error('Please sign in first.');}
  const editId=cleanSupplierId(editingSupplierId),requestId=editId||crypto.randomUUID();
  const data=await supplierRequest({id:requestId,create:!editId,row},session.access_token);
  if(!data)throw new Error('Supabase returned no supplier after saving.');
  const saved=supplierFromCloud(data);
  if(editId){suppliers=suppliers.map(s=>String(s.id)===editId?saved:s);editingSupplierId='';}else{suppliers.unshift(saved);}
  localStorage.setItem('siteplan_suppliers',JSON.stringify(suppliers));by('supplierModal')?.classList.add('hidden');renderSuppliers();renderTenders();renderSupplierDashboard();toast(editId?'Supplier updated':'Supplier saved');
 }catch(error){console.error('Supplier save failed',error);toast(error?.message||'Supplier could not be saved.');}
 finally{if(save){save.disabled=false;save.textContent=editingSupplierId?'Save Changes':'Create Supplier Profile';}}
};
const save=by('saveSupplierBtn');if(save)save.onclick=window.addSupplier;
})();

/* ---- v84.js ---- */
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

/* ---- v85.js ---- */
// SitePlan V85: canonical tender editor + optional editable tender email composer
(()=>{
'use strict';

const $=id=>document.getElementById(id);
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const escHtml=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

const css=document.createElement('style');
css.textContent=`
.sp-mail-fields{display:grid;gap:12px;margin:16px 0}.sp-mail-fields label{display:block;font-size:11px;font-weight:850;color:#aeb9c1;margin-bottom:6px}.sp-mail-fields input,.sp-mail-fields textarea{width:100%;box-sizing:border-box;background:#111d25;border:1px solid #344653;color:#f5f7f8;border-radius:10px;padding:11px 12px;font:inherit}.sp-mail-fields textarea{min-height:240px;resize:vertical;line-height:1.45}.sp-template-help{font-size:11px;color:#89959e;line-height:1.45;margin-top:6px}.sp-saving{opacity:.7;pointer-events:none}.sp-mail-preview{margin:14px 0;padding:14px 16px;border:1px solid #2f3b45;border-radius:12px;background:#10171d;color:#dce3e8;font-size:13px;line-height:1.55;white-space:pre-wrap}.sp-mail-preview-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px}.sp-mail-preview-head b{font-size:12px}.sp-edit-mail{white-space:nowrap}.sp-mail-editor.hidden{display:none!important}
`;
document.head.appendChild(css);

function optionValue(select,value){
 if(!select)return;
 const wanted=String(value||'').trim();
 if(wanted && ![...select.options].some(o=>o.value===wanted))select.add(new Option(wanted,wanted));
 select.value=wanted||select.options[0]?.value||'';
}
function setValue(id,value){const el=$(id);if(el)el.value=value??''}
function clearRequirements(){const host=$('reqRows');if(host)host.innerHTML=''}
function addRequirement(r={}){if(typeof addReqRow==='function')addReqRow(r.name||'',r.qty||'',r.unit||'')}
function activeEventSafe(){try{return (events||[]).find(e=>String(e.id)===String(currentEventId))||null}catch{return null}}
function eventNote(){
 const grid=$('tenderModal')?.querySelector('.form-grid');if(!grid)return;
 let field=$('tenderEventField');
 if(!field){field=document.createElement('div');field.id='tenderEventField';field.className='field full';grid.insertBefore(field,grid.firstChild)}
 const ev=activeEventSafe();
 field.innerHTML=`<div class="tender-event-link"><span class="dot"></span><span>This tender is linked to <b>${escHtml(ev?.name||'the current event')}</b>${ev?.location?' · '+escHtml(ev.location):''}</span></div>`;
}
function openModal(){
 $('quoteModal')?.classList.add('hidden');
 $('tenderModal')?.classList.remove('hidden');
 eventNote();
}

window.openTender=function(){
 editingTenderId='';
 const heading=$('tenderModal')?.querySelector('.modal-head h2');if(heading)heading.textContent='Create Tender';
 const save=$('publishTenderBtn');if(save){save.textContent='Publish Tender';save.disabled=false;save.classList.remove('sp-saving')}
 setValue('tTitle','');setValue('tDue','');setValue('tAttendance','');setValue('tEstimated','');setValue('tBrief','');
 optionValue($('tCategory'),$('tCategory')?.options?.[0]?.value||'Food Vendor');
 optionValue($('tRegion'),activeEventSafe()?.region||'Wellington');
 clearRequirements();addRequirement({name:'General requirement',qty:'1',unit:'item'});addRequirement();
 openModal();
};

window.editTender=function(id){
 try{
  const tenderId=typeof id==='string'?id:'';
  const t=(tenders||[]).find(x=>String(x.id)===tenderId);
  if(!t){toast('Tender could not be found. Refresh and try again.');return}
  editingTenderId=tenderId;
  const heading=$('tenderModal')?.querySelector('.modal-head h2');if(heading)heading.textContent='Edit Tender';
  const save=$('publishTenderBtn');if(save){save.textContent='Save Changes';save.disabled=false;save.classList.remove('sp-saving')}
  setValue('tTitle',t.title||'');optionValue($('tCategory'),t.category||'Other');
  setValue('tDue',String(t.due||'').slice(0,10));optionValue($('tRegion'),typeof normalizeRegion==='function'?normalizeRegion(t.region||'Wellington'):(t.region||'Wellington'));
  setValue('tAttendance',t.attendance||'');setValue('tEstimated',t.estimatedValue||'');setValue('tBrief',t.brief||'');
  clearRequirements();(t.requirements||[]).forEach(addRequirement);if(!(t.requirements||[]).length)addRequirement();
  openModal();
 }catch(err){console.error('editTender',err);toast('Could not open this tender for editing. Please refresh and try again.')}
};

async function withRetry(task){
 try{return await task()}catch(err){
  const msg=String(err?.message||err||'');
  if(!(err instanceof TypeError)&&!/failed to fetch|network/i.test(msg))throw err;
  await wait(650);return task();
 }
}

window.publishTender=async function(){
 const btn=$('publishTenderBtn');
 try{
  if(!siteplanCloudUser){openAuthModal();authMsg('Sign in before saving a tender.');return}
  const evt=activeEventSafe();if(!evt){toast('Create or open an event first');return}
  const title=$('tTitle')?.value.trim()||(($('tCategory')?.value||'Supplier')+' Tender');
  const requirements=[...document.querySelectorAll('#reqRows .req-row')].map(r=>({name:r.querySelector('.rname')?.value?.trim()||'',qty:r.querySelector('.rqty')?.value||'',unit:r.querySelector('.runit')?.value||''})).filter(x=>x.name);
  const row={title,category:$('tCategory')?.value||'Other',brief:$('tBrief')?.value||null,due_at:$('tDue')?.value?new Date($('tDue').value+'T23:59:59').toISOString():null,region:$('tRegion')?.value||null,attendance:Number($('tAttendance')?.value)||0,estimated_value:Number($('tEstimated')?.value)||0,requirements_json:requirements,include_site_plan:true};
  if(btn){btn.disabled=true;btn.classList.add('sp-saving');btn.textContent=editingTenderId?'Saving…':'Publishing…'}
  let query;
  if(editingTenderId){
   const id=editingTenderId;
   query=()=>siteplanCloud.from('tenders').update(row).eq('id',id).eq('owner_id',siteplanCloudUser.id).select('*,events(name,venue,event_date),tender_submissions(id,company_name,contact_name,email,price,answers,notes,inclusions,exclusions,status,submitted_at)').single();
  }else{
   row.event_id=evt.id;row.owner_id=siteplanCloudUser.id;row.status='published';
   query=()=>siteplanCloud.from('tenders').insert(row).select('*,events(name,venue,event_date),tender_submissions(id,company_name,contact_name,email,price,answers,notes,inclusions,exclusions,status,submitted_at)').single();
  }
  const result=await withRetry(query);if(result?.error)throw result.error;
  const local=cloudTenderToLocal(result.data);
  if(editingTenderId){const i=tenders.findIndex(x=>String(x.id)===String(editingTenderId));if(i>=0)tenders[i]=local;editingTenderId=''}else tenders.unshift(local);
  localStorage.setItem('siteplan_tenders',JSON.stringify(tenders));
  $('tenderModal')?.classList.add('hidden');
  renderTenders();renderSupplierDashboard();renderEvents();renderBudget?.();
  toast(local.status==='Open'?'Tender saved':'Tender changes saved');
 }catch(err){
  console.error('publishTender',err);
  const msg=String(err?.message||'Could not save tender');
  toast(/failed to fetch|network/i.test(msg)?'Connection problem while saving. Your form is still open — try again.':msg);
 }finally{
  if(btn){btn.disabled=false;btn.classList.remove('sp-saving');btn.textContent=editingTenderId?'Save Changes':'Publish Tender'}
 }
};

function tenderDue(t){if(!t?.due)return'Not specified';try{return new Date(t.due+'T12:00:00').toLocaleDateString('en-NZ',{day:'numeric',month:'long',year:'numeric'})}catch{return String(t.due)}}
function defaultMessage(){return `Hi [Supplier],\n\n[Organiser] is inviting you to provide a quote for [Tender] for [Event].\n\nService: [Category]\nLocation/region: [Region]\nQuote due: [Due Date]\n\nTender details and quote submission:\n[Tender Link]\n\nIf you'd rather reply by email, just reply to this message and it will go directly to [Organiser].\n\nRegards,\n[Organiser]\nSent via SitePlan`}
function saveLocalSendHistory(tenderId,recipients){
 try{
  const key='siteplan_tender_send_history_v1',all=JSON.parse(localStorage.getItem(key)||'{}'),rows=Array.isArray(all[tenderId])?all[tenderId]:[],now=new Date().toISOString();
  recipients.forEach(r=>rows.push({recipient_email:r.email||'',company_name:r.company||'Supplier',sent_at:now,status:'sent'}));all[tenderId]=rows;localStorage.setItem(key,JSON.stringify(all));
 }catch{}
}

window.shareTenderToAll=async function(id){
 const t=(tenders||[]).find(x=>String(x.id)===String(id));if(!t)return;
 if(!siteplanCloudUser){openAuthModal();toast('Sign in before sending tenders');return}
 const matches=typeof matchingSuppliers==='function'?matchingSuppliers(t):[];if(!matches.length){toast('No matching suppliers for this category and region');return}
 const ev=(events||[]).find(e=>String(e.id)===String(t.eventId||t.event_id))||activeEventSafe();const eventName=ev?.name||t.eventName||'Event';
 const subjectDefault='[Event] – [Tender]';
 const messageDefault=defaultMessage();
 document.querySelector('.sp-send-bg')?.remove();
 const bg=document.createElement('div');bg.className='sp-send-bg';
 bg.innerHTML=`<div class="sp-send"><div class="sp-head"><div class="sp-icon">✉</div><div><div class="sp-title">Send tender to suppliers</div><div class="sp-sub">Choose who receives this tender. The normal SitePlan email will be used unless you edit it.</div></div><button class="sp-x">×</button></div><div class="sp-body"><div class="sp-box"><b>${escHtml(t.title||'Tender')}</b><div class="sp-meta">Event: ${escHtml(eventName)} &nbsp; | &nbsp; Category: ${escHtml(t.category||'Supplier')} &nbsp; | &nbsp; Response due: ${escHtml(tenderDue(t))}</div></div><div class="sp-label">Matched suppliers (${matches.length})</div><div class="sp-note">Untick anyone you don't want to receive this tender.</div><div class="sp-list">${matches.map(s=>`<label class="sp-row"><input class="sp-pick" type="checkbox" value="${escHtml(s.id)}" checked><strong>${escHtml(s.company)}</strong><span class="sp-muted">${escHtml(s.email)}</span><span class="sp-muted hide-mobile">${escHtml((s.categories||[]).join(', '))}</span></label>`).join('')}</div><div class="sp-label">Email</div><div class="sp-mail-preview-head"><b>Standard SitePlan tender email</b><button type="button" class="sp-btn sp-edit-mail">Edit email</button></div><div class="sp-mail-preview">Subject: ${escHtml(subjectDefault)}\n\n${escHtml(messageDefault)}</div><div class="sp-mail-editor hidden"><div class="sp-mail-fields"><div><label>Subject</label><input id="spTenderSubject" value="${escHtml(subjectDefault)}"></div><div><label>Message</label><textarea id="spTenderMessage">${escHtml(messageDefault)}</textarea><div class="sp-template-help">Available placeholders: [Supplier], [Organiser], [Tender], [Event], [Category], [Region], [Due Date], [Tender Link]</div></div></div></div><div class="sp-actions"><button class="sp-btn cancel">Cancel</button><button class="sp-btn primary send">Send tender</button></div></div></div>`;
 document.body.appendChild(bg);
 const editor=bg.querySelector('.sp-mail-editor');const preview=bg.querySelector('.sp-mail-preview');const editBtn=bg.querySelector('.sp-edit-mail');
 editBtn.onclick=()=>{editor.classList.toggle('hidden');preview.classList.toggle('hidden');editBtn.textContent=editor.classList.contains('hidden')?'Edit email':'Use standard email'};
 const close=()=>bg.remove();bg.querySelector('.sp-x').onclick=close;bg.querySelector('.cancel').onclick=close;bg.onclick=e=>{if(e.target===bg)close()};
 bg.querySelector('.send').onclick=async()=>{
  const selected=[...bg.querySelectorAll('.sp-pick:checked')].map(x=>x.value);if(!selected.length){toast('Select at least one supplier');return}
  const subject=$('spTenderSubject')?.value.trim()||subjectDefault;const message=$('spTenderMessage')?.value.trim()||messageDefault;
  const btn=bg.querySelector('.send');btn.disabled=true;btn.textContent='Sending…';
  try{
   const session=(await siteplanCloud.auth.getSession()).data?.session;if(!session)throw new Error('Your session expired. Please sign in again.');
   const r=await withRetry(()=>fetch('/api/send-tender',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${session.access_token}`},body:JSON.stringify({tenderId:t.id,supplierIds:selected,subject,message})}));
   const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'Tender email could not be sent');
   saveLocalSendHistory(t.id,d.recipients||[]);close();toast(`Tender sent to ${d.sent} supplier${d.sent===1?'':'s'}`);setTimeout(()=>renderTenders(),50);
  }catch(err){console.error('shareTenderToAll',err);btn.disabled=false;btn.textContent='Send tender';toast(/failed to fetch|network/i.test(String(err?.message||''))?'Connection problem while sending. Nothing was changed — try again.':(err?.message||'Tender email could not be sent'))}
 };
};

const saveBtn=$('publishTenderBtn');if(saveBtn)saveBtn.onclick=window.publishTender;
const newBtn=$('newTenderBtn');if(newBtn)newBtn.onclick=window.openTender;
})();

/* ---- v86.js ---- */
// SitePlan V86: secure public read-only map sharing
(()=>{
'use strict';
const SHARE_KEY='siteplan_public_map_tokens_v1';
const escHtml=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
function savedTokens(){try{return JSON.parse(localStorage.getItem(SHARE_KEY)||'{}')}catch{return {}}}
function saveToken(eventId,token){const x=savedTokens();if(token)x[eventId]=token;else delete x[eventId];localStorage.setItem(SHARE_KEY,JSON.stringify(x))}
async function sessionToken(){try{return (await siteplanCloud.auth.getSession()).data?.session?.access_token||''}catch{return ''}}
async function shareRequest(method,eventId){
 const token=await sessionToken();if(!token)throw new Error('Sign in before sharing a map.');
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);let r;
 try{r=await fetch('/api/public-map-share',{method,headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`},body:JSON.stringify({eventId}),signal:controller.signal})}
 catch(error){if(error?.name==='AbortError')throw new Error('Map sharing timed out. Please try again.');throw error}
 finally{clearTimeout(timer)}
 const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'Could not update map sharing.');return d;
}
function shareButton(){
 const actions=document.querySelector('header .top-actions');if(!actions||document.getElementById('shareMapBtn'))return;
 const btn=document.createElement('button');btn.className='btn';btn.id='shareMapBtn';btn.type='button';btn.textContent='Share map';
 const print=document.getElementById('printBtn');if(print)actions.insertBefore(btn,print);else actions.appendChild(btn);
 btn.onclick=openShareMap;
}
async function openShareMap(){
 const evt=typeof activeEvent==='function'?activeEvent():null;if(!evt?.id){toast('Open an event first');return}
 try{if(typeof savePlan==='function')savePlan(false)}catch(e){}
 const btn=document.getElementById('shareMapBtn');if(btn){btn.disabled=true;btn.textContent='Preparing…'}
 try{
  const d=await shareRequest('POST',evt.id);saveToken(evt.id,d.token);
  const q=document.getElementById('quoteModalContent');
  q.style.width='min(680px,96vw)';q.style.maxWidth='680px';q.style.padding='24px';q.style.background='var(--panel)';
  q.innerHTML=`<div class="modal-head"><div><h2 style="margin:0">Share read-only map</h2><small>${escHtml(evt.name||'Event')} · anyone with the link can view</small></div><button class="btn" onclick="document.getElementById('quoteModal').classList.add('hidden')">×</button></div><div class="empty" style="margin-bottom:14px">This link opens only the event map. No SitePlan account is required and viewers cannot edit anything.</div><div class="copy-link-box" id="publicMapShareLink">${escHtml(d.url)}</div><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px"><button class="btn primary" id="copyPublicMapBtn">Copy map link</button><button class="btn" id="openPublicMapBtn">Open preview</button><button class="btn danger" id="disablePublicMapBtn">Disable link</button></div><div style="color:var(--muted);font-size:11px;margin-top:14px">Opening Share map again refreshes this public view with the latest saved site plan while keeping the same link.</div>`;
  document.getElementById('quoteModal').classList.remove('hidden');
  document.getElementById('copyPublicMapBtn').onclick=async()=>{await navigator.clipboard.writeText(d.url);toast('Map link copied')};
  document.getElementById('openPublicMapBtn').onclick=()=>window.open(d.url,'_blank','noopener');
  document.getElementById('disablePublicMapBtn').onclick=async()=>{if(!confirm('Disable this public map link?'))return;try{await shareRequest('DELETE',evt.id);saveToken(evt.id,'');document.getElementById('quoteModal').classList.add('hidden');toast('Public map link disabled')}catch(e){toast(e.message)}};
 }catch(e){toast(e.message||'Could not share map')}finally{if(btn){btn.disabled=false;btn.textContent='Share map'}}
}
async function showPublicMap(token){
 const marketing=document.getElementById('marketingHome');if(marketing)marketing.classList.add('hidden');
 try{
  await startSitePlan();
  const r=await fetch('/api/public-map-share?token='+encodeURIComponent(token),{cache:'no-store'});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'This shared map is unavailable.');
  const s=d.share||{},plan=s.plan||{},mapId='publicSharedMap';
  const q=document.getElementById('quoteModalContent');
  q.style.width='min(1500px,98vw)';q.style.maxWidth='1500px';q.style.height='auto';q.style.maxHeight='96vh';q.style.padding='0';q.style.overflow='hidden';q.style.background='var(--panel)';q.style.borderRadius='18px';
  q.innerHTML=`<div class="readonly-builder-shell"><div class="readonly-builder-head"><div><div class="rb-event">${escHtml(s.eventName||'Event')}</div><div class="rb-sub">Shared SitePlan · interactive read-only map${s.venue?' · '+escHtml(s.venue):''}</div></div><div class="readonly-builder-head-actions"><span class="readonly-chip">● READ ONLY</span></div></div><div class="readonly-builder-workspace"><main class="readonly-builder-map-wrap">${plan&&((plan.markers||[]).length||(plan.shapes||[]).length)?`<div id="${mapId}" class="readonly-builder-map"></div>`:'<div class="empty" style="position:absolute;left:20px;right:20px;top:20px">No map objects have been saved for this event yet.</div>'}<div class="readonly-builder-stats"><div class="stat"><b>${(plan.markers||[]).length}</b> objects</div><div class="stat"><b>${(plan.shapes||[]).filter(x=>String(x.type||'').toLowerCase().includes('barrier')).length}</b> barriers</div><div class="stat"><b>${(plan.shapes||[]).filter(x=>['zone','area','polygon','coloured-area','colored-area'].includes(String(x.type||'').toLowerCase())).length}</b> zones</div></div></main><aside class="readonly-builder-inspector"><div class="section-title">Selected item</div><div class="empty readonly-builder-empty" id="${mapId}_empty">Click an icon, route, barrier or coloured zone to view its details and measurements.</div><div id="${mapId}_inspector"></div></aside></div></div>`;
  document.getElementById('quoteModal').classList.remove('hidden');
  if(plan&&((plan.markers||[]).length||(plan.shapes||[]).length))requestAnimationFrame(()=>requestAnimationFrame(()=>renderReadOnlyPlanMap(mapId,plan,true)));
 }catch(e){
  const q=document.getElementById('quoteModalContent');if(q){q.style.padding='26px';q.innerHTML=`<div class="empty"><b>Shared map unavailable.</b><br>${escHtml(e.message||'The link may have been disabled.')}</div>`;document.getElementById('quoteModal').classList.remove('hidden')}
 }
}
const originalAuthInit=window.siteplanAuthInit||siteplanAuthInit;
siteplanAuthInit=async function(){const p=new URLSearchParams(location.hash.replace(/^#/,''));const token=p.get('map');if(token){await showPublicMap(token);return}return originalAuthInit.apply(this,arguments)};
shareButton();
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',shareButton);else setTimeout(shareButton,0);
})();

/* ---- v87.js ---- */
// SitePlan V87: ready-to-send populated tender email with optional editing
(()=>{
'use strict';
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
async function sendWithTimeout(url,init,timeoutMs=25000){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs);try{return await fetch(url,{...init,signal:controller.signal})}catch(error){if(error?.name==='AbortError')throw new Error('Sending timed out. The email may have been accepted—check Sent suppliers before trying again.');throw error}finally{clearTimeout(timer)}}
function dueText(t){if(!t?.due)return'Not specified';try{return new Date(t.due+'T12:00:00').toLocaleDateString('en-NZ',{day:'numeric',month:'long',year:'numeric'})}catch{return String(t.due)}}
function organiserName(){const u=siteplanCloudUser||{};return String(u.user_metadata?.full_name||u.user_metadata?.name||u.email?.split('@')[0]||'Event organiser').trim()}
function tenderLink(t){const token=t?.publicToken||t?.public_token||'';return token?`${location.origin}/#tender=${encodeURIComponent(token)}`:''}
function populatedEmail(t,ev){
 const eventName=ev?.name||t?.eventName||'Event',organiser=organiserName(),link=tenderLink(t);
 const venue=ev?.location||ev?.venue||t?.region||'Not specified';
 const subject=`${eventName} – ${t?.title||'Tender'}`;
 const requirements=(t?.requirements||[]).length?`\n\nRequirements:\n${t.requirements.map(r=>`• ${r.name||'Requirement'} — ${r.qty||''} ${r.unit||''}`.trim()).join('\n')}`:'';
 const message=`Hi,

${organiser} is inviting you to provide a quote for ${t?.title||'this tender'} for ${eventName}.

Service: ${t?.category||'Supplier'}
Event location: ${venue}
Region: ${t?.region||'Not specified'}
Quote due: ${dueText(t)}
Expected attendance: ${Number(t?.attendance)||'Not specified'}

Full brief:
${t?.brief||'No additional brief supplied.'}${requirements}

Tender details, site plan and quote submission:
${link||'Tender link unavailable — save or republish this tender first.'}

If you'd rather reply by email, just reply to this message and it will go directly to ${organiser}.

Regards,
${organiser}
Sent via SitePlan`;
 return {subject,message};
}
function saveHistory(tenderId,recipients){try{const key='siteplan_tender_send_history_v1',all=JSON.parse(localStorage.getItem(key)||'{}'),rows=Array.isArray(all[tenderId])?all[tenderId]:[],now=new Date().toISOString();(recipients||[]).forEach(r=>rows.push({recipient_email:r.email||'',company_name:r.company||'Supplier',sent_at:now,status:'sent'}));all[tenderId]=rows;localStorage.setItem(key,JSON.stringify(all));}catch{}}

window.shareTenderToAll=async function(id){
 const t=(tenders||[]).find(x=>String(x.id)===String(id));if(!t)return;
 if(!siteplanCloudUser){openAuthModal?.();toast('Sign in before sending tenders');return}
 const matches=typeof matchingSuppliers==='function'?matchingSuppliers(t):[];if(!matches.length){toast('No matching suppliers for this category and region');return}
 const ev=(events||[]).find(e=>String(e.id)===String(t.eventId||t.event_id))||null;
 document.querySelector('.sp-send-bg')?.remove();
 const bg=document.createElement('div');bg.className='sp-send-bg';
 bg.innerHTML=`<div class="sp-send"><div class="sp-head"><div class="sp-icon">✉</div><div><div class="sp-title">Send tender to suppliers</div><div class="sp-sub">Ready to send. Edit the email only if you want to.</div></div><button class="sp-x">×</button></div><div class="sp-body"><div class="sp-box"><b>${esc(t.title||'Tender')}</b><div class="sp-meta">Event: ${esc(ev?.name||t.eventName||'Event')} &nbsp; | &nbsp; Category: ${esc(t.category||'Supplier')} &nbsp; | &nbsp; Response due: ${esc(dueText(t))}</div></div><div class="sp-label">Matched suppliers (${matches.length})</div><div class="sp-note">Untick anyone you don't want to receive this tender.</div><div class="sp-list">${matches.map(s=>`<label class="sp-row"><input class="sp-pick" type="checkbox" value="${esc(s.id)}" checked><strong>${esc(s.company)}</strong><span class="sp-muted">${esc(s.email)}</span><span class="sp-muted hide-mobile">${esc((s.categories||[]).join(', '))}</span></label>`).join('')}</div><div class="sp-label">Email</div><div class="sp-mail-preview-head"><b>Ready to send</b><button type="button" class="sp-btn sp-edit-mail">Edit email</button></div><div class="sp-mail-preview"></div><div class="sp-mail-editor hidden"><div class="sp-mail-fields"><div><label>Subject</label><input id="spTenderSubject"></div><div><label>Message</label><textarea id="spTenderMessage"></textarea></div></div></div><div class="sp-actions"><button class="sp-btn cancel">Cancel</button><button class="sp-btn primary send">Send tender</button></div></div></div>`;
 document.body.appendChild(bg);
 const close=()=>bg.remove();bg.querySelector('.sp-x').onclick=close;bg.querySelector('.cancel').onclick=close;bg.onclick=e=>{if(e.target===bg)close()};
 let {subject,message}=populatedEmail(t,ev);
 bg.querySelector('.sp-mail-preview').textContent=`Subject: ${subject}\n\n${message}`;
 bg.querySelector('#spTenderSubject').value=subject;bg.querySelector('#spTenderMessage').value=message;
 const edit=bg.querySelector('.sp-edit-mail');
 edit.onclick=()=>{const editor=bg.querySelector('.sp-mail-editor'),preview=bg.querySelector('.sp-mail-preview');editor.classList.toggle('hidden');preview.classList.toggle('hidden');edit.textContent=editor.classList.contains('hidden')?'Edit email':'Preview email';if(editor.classList.contains('hidden')){subject=bg.querySelector('#spTenderSubject').value.trim();message=bg.querySelector('#spTenderMessage').value.trim();preview.textContent=`Subject: ${subject}\n\n${message}`;}};

 bg.querySelector('.send').onclick=async()=>{
  const selected=[...bg.querySelectorAll('.sp-pick:checked')].map(x=>x.value);if(!selected.length){toast('Select at least one supplier');return}
  subject=bg.querySelector('#spTenderSubject').value.trim();message=bg.querySelector('#spTenderMessage').value.trim();if(!subject||!message){toast('Add an email subject and message');return}
  const btn=bg.querySelector('.send');btn.disabled=true;btn.textContent='Sending…';
  try{
   const session=(await siteplanCloud.auth.getSession()).data?.session;if(!session)throw new Error('Your session expired. Please sign in again.');
   const requestId=crypto.randomUUID();
   const r=await sendWithTimeout('/api/send-tender',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${session.access_token}`},body:JSON.stringify({tenderId:t.id,supplierIds:selected,subject,message,requestId})});
   const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'Tender email could not be sent');
   saveHistory(t.id,d.recipients||[]);close();toast(`Tender sent to ${d.sent} supplier${d.sent===1?'':'s'}`);setTimeout(()=>renderTenders(),50);
  }catch(err){console.error('shareTenderToAll',err);btn.disabled=false;btn.textContent='Send tender';toast(err?.message||'Tender email could not be sent');}
 };
};
})();

/* ---- v88.js ---- */
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
  const action=card.querySelector('[onclick*="setCloudQuoteStatus"]')?.getAttribute('onclick')||'';
  const ids=action.match(/setCloudQuoteStatus\('([^']+)'\s*,\s*'([^']+)'/);
  card.dataset.tenderId=String(ids?.[1]||tender?.id||'');
  card.dataset.submissionId=String(ids?.[2]||quote?.id||'');
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

function enrichVisibleCards(tender){
 const cards=prepareCards(tender).filter(card=>card.dataset.tenderId&&card.dataset.submissionId&&card.dataset.quoteFilesState!=='loading'&&card.dataset.quoteFilesState!=='done');
 if(!cards.length)return;
 const groups=new Map();cards.forEach(card=>{card.dataset.quoteFilesState='loading';const id=card.dataset.tenderId;if(!groups.has(id))groups.set(id,[]);groups.get(id).push(card)});
 groups.forEach((group,id)=>loadCardFiles(id,group).finally(()=>group.forEach(card=>card.dataset.quoteFilesState='done')));
}

const originalOpen=window.openTenderView;
if(typeof originalOpen==='function')window.openTenderView=function(id){
 const out=originalOpen.apply(this,arguments);
 const tender=(typeof tenders!=='undefined'?(tenders||[]):[]).find(x=>String(x.id)===String(id));
 enrichVisibleCards(tender);return out;
};

const quoteHost=document.getElementById('quoteModalContent');
if(quoteHost)new MutationObserver(()=>enrichVisibleCards()).observe(quoteHost,{childList:true,subtree:true});

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
  const nr=await fetch('/api/notify-quote',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:t.publicToken||t.id,submissionId:d.submission_id,attachmentUrl,attachmentName})});
  if(!nr.ok){const x=await nr.json().catch(()=>({}));console.warn('Quote notification',x.error||nr.status)}
  byId('quoteModalContent').innerHTML='<div class="public-card" style="text-align:center;padding:42px"><div style="font-size:38px">✓</div><h2>Quote submitted</h2><p class="muted">Your private response has been sent to the event organiser.</p></div>';toast('Private quote submitted');
 }catch(e){console.error(e);toast(e.message||'Could not submit quote');btn.disabled=false;btn.textContent='Submit Private Quote'}
};
})();

/* ---- v89.js ---- */
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
