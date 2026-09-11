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
