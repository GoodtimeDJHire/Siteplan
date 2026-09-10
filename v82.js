// SitePlan V82: email all or selected awarded suppliers before the event
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const safe=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

const css=document.createElement('style');
css.textContent=`
.sp-brief-btn{white-space:nowrap}.sp-brief-bg{position:fixed;inset:0;background:rgba(0,0,0,.76);z-index:1500;display:grid;place-items:center;padding:18px}.sp-brief-card{width:min(820px,100%);max-height:92vh;overflow:auto;background:var(--panel);border:1px solid var(--line);border-radius:20px;padding:22px;box-shadow:var(--shadow)}.sp-brief-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}.sp-brief-head h2{margin:0 0 4px}.sp-brief-head p{margin:0;color:var(--muted);font-size:12px}.sp-brief-tools{display:flex;justify-content:space-between;align-items:center;gap:10px;margin:16px 0 10px;flex-wrap:wrap}.sp-approved-list{display:grid;gap:8px;margin-bottom:16px}.sp-approved-row{display:grid;grid-template-columns:auto 1fr auto;gap:10px;align-items:center;border:1px solid var(--line);border-radius:12px;padding:12px;background:#0e1318}.sp-approved-row b{display:block}.sp-approved-row small{display:block;color:var(--muted);margin-top:2px;overflow-wrap:anywhere}.sp-approved-row .pill{justify-self:end}.sp-brief-fields{display:grid;grid-template-columns:1fr 1fr;gap:12px}.sp-brief-fields .full{grid-column:1/-1}.sp-brief-fields textarea{width:100%;min-height:130px;background:var(--panel2);border:1px solid var(--line);color:var(--text);border-radius:9px;padding:10px;resize:vertical}.sp-brief-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:16px}.sp-brief-empty{border:1px dashed var(--line);border-radius:12px;padding:18px;color:var(--muted)}
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
  const head=module.querySelector('.page-head');if(!head||head.querySelector('[data-event-brief]'))return;
  const btn=document.createElement('button');btn.className='btn primary sp-brief-btn';btn.dataset.eventBrief='1';btn.textContent='Email approved suppliers';btn.onclick=openBriefModal;
  const actions=head.lastElementChild; if(actions&&actions!==head.firstElementChild) actions.appendChild(btn); else head.appendChild(btn);
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
      const r=await fetch('/api/send-event-brief',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${session.access_token}`},body:JSON.stringify({eventName,eventDate:$('spBriefDate')?.value||date,location:$('spBriefLocation')?.value||location,subject:$('spBriefSubject')?.value||`${eventName} – final event brief`,message:$('spBriefMessage')?.value||'',recipients:chosen})});
      const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'Could not send event brief');
      toast(`Brief emailed to ${d.sent} supplier${d.sent===1?'':'s'}`);bg.remove();
    }catch(e){toast(e.message||'Could not send event brief');send.disabled=false;send.textContent='Email selected suppliers'}
  };
}
window.openApprovedSupplierBrief=openBriefModal;

const observer=new MutationObserver(installButton);observer.observe(document.documentElement,{childList:true,subtree:true});
installButton();
})();
