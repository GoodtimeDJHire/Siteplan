// SitePlan V87: ready-to-send populated tender email with optional editing
(()=>{
'use strict';
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function withRetry(task){try{return await task()}catch(err){if(!(err instanceof TypeError)&&!/failed to fetch|network/i.test(String(err?.message||err||'')))throw err;await wait(500);return task();}}
function dueText(t){if(!t?.due)return'Not specified';try{return new Date(t.due+'T12:00:00').toLocaleDateString('en-NZ',{day:'numeric',month:'long',year:'numeric'})}catch{return String(t.due)}}
function organiserName(){const u=siteplanCloudUser||{};return String(u.user_metadata?.full_name||u.user_metadata?.name||u.email?.split('@')[0]||'Event organiser').trim()}
function tenderLink(t){const token=t?.publicToken||t?.public_token||'';return token?`${location.origin}/#tender=${encodeURIComponent(token)}`:''}
function populatedEmail(t,ev){
 const eventName=ev?.name||t?.eventName||'Event',organiser=organiserName(),link=tenderLink(t);
 const venue=ev?.location||ev?.venue||t?.region||'Not specified';
 const subject=`${eventName} – ${t?.title||'Tender'}`;
 const message=`Hi,

${organiser} is inviting you to provide a quote for ${t?.title||'this tender'} for ${eventName}.

Service: ${t?.category||'Supplier'}
Event location: ${venue}
Region: ${t?.region||'Not specified'}
Quote due: ${dueText(t)}

Tender details and quote submission:
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
   const r=await withRetry(()=>fetch('/api/send-tender',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${session.access_token}`},body:JSON.stringify({tenderId:t.id,supplierIds:selected,subject,message})}));
   const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'Tender email could not be sent');
   saveHistory(t.id,d.recipients||[]);close();toast(`Tender sent to ${d.sent} supplier${d.sent===1?'':'s'}`);setTimeout(()=>renderTenders(),50);
  }catch(err){console.error('shareTenderToAll',err);btn.disabled=false;btn.textContent='Send tender';toast(err?.message||'Tender email could not be sent');}
 };
};
})();
