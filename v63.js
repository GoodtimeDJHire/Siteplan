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