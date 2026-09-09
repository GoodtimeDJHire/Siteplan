// SitePlan V63: clearer supplier selection + explicit event-linked tenders
(()=>{
const css=document.createElement('style');css.textContent=`
#supplierCategories.check-grid,#supplierRegions.check-grid{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important;max-height:300px;overflow:auto;padding:4px}
#supplierCategories .check-card,#supplierRegions .check-card{display:flex!important;align-items:center!important;justify-content:flex-start!important;gap:10px!important;min-height:44px!important;padding:10px 12px!important;border:1px solid var(--line)!important;border-radius:10px!important;background:var(--panel2)!important;cursor:pointer}
#supplierCategories .check-card:hover,#supplierRegions .check-card:hover{border-color:#59636f!important;background:#20262e!important}
#supplierCategories .check-card input,#supplierRegions .check-card input{order:0!important;margin:0!important;flex:0 0 auto!important;width:17px!important;height:17px!important;accent-color:var(--green)!important}
#supplierCategories .check-card span,#supplierRegions .check-card span{order:1!important;flex:1!important;line-height:1.25!important;white-space:normal!important;font-size:12px!important;font-weight:750!important}
#tenderEventField{grid-column:1/-1}.tender-event-note{font-size:11px;color:var(--muted);margin-top:6px;line-height:1.4}.tender-event-chip{display:inline-block;margin-top:7px;padding:6px 9px;border:1px solid #496333;border-radius:999px;color:var(--green);font-size:11px;font-weight:850}
@media(max-width:650px){#supplierCategories.check-grid,#supplierRegions.check-grid{grid-template-columns:1fr!important;max-height:260px}}
`;document.head.appendChild(css);

function ensureTenderEventField(){
 const grid=byId('tenderModal')?.querySelector('.form-grid');if(!grid)return null;
 let field=byId('tenderEventField');
 if(!field){field=document.createElement('div');field.className='field full';field.id='tenderEventField';field.innerHTML='<label>Linked event</label><select id="tEvent"></select><div class="tender-event-note">This tender belongs to an event. Supplier quotes, the site plan and tender history will stay grouped with that event.</div>';grid.insertBefore(field,grid.firstChild)}
 const sel=byId('tEvent');
 const rows=(events||[]).map(e=>`<option value="${esc(e.id)}">${esc(e.name||'Untitled event')}${e.venue?' — '+esc(e.venue):''}</option>`).join('');
 sel.innerHTML=rows||'<option value="">No events available</option>';
 return sel;
}

const oldOpenTender=openTender;
openTender=function(){oldOpenTender();const sel=ensureTenderEventField();if(sel){sel.value=currentEventId||events?.[0]?.id||''}}

const oldEditTender=editTender;
editTender=function(id){oldEditTender(id);const t=tenders.find(x=>x.id===id);const sel=ensureTenderEventField();if(sel&&t)sel.value=t.eventId||t.event_id||currentEventId||''}

publishTender=async function(){
 if(!siteplanCloudUser){openAuthModal();authMsg('Sign in before saving a tender.');return}
 const sel=ensureTenderEventField();const eventId=sel?.value||currentEventId;const evt=(events||[]).find(e=>e.id===eventId);
 if(!evt){toast('Choose an event for this tender');return}
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