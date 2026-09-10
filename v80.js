// SitePlan V80: tender engagement tracking — delivered, opened, viewed, quote submitted
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const safe=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const LABELS={sent:'Sent',delivered:'Delivered',opened:'Email opened',clicked:'Tender viewed',quote_submitted:'Quote submitted',delivery_delayed:'Delayed',bounced:'Bounced',failed:'Failed',suppressed:'Suppressed',complained:'Complaint'};
const cls=s=>['bounced','failed','suppressed','complained'].includes(s)?'bad':['quote_submitted','clicked','opened','delivered'].includes(s)?'good':'neutral';
const css=document.createElement('style');
css.textContent=`.delivery-badge.good{color:var(--green)!important;border-color:#55752e!important;background:rgba(168,255,53,.05)!important}.delivery-badge.bad{color:#ff8c98!important;border-color:#6b3038!important}.delivery-badge.neutral{color:#9fd1ff!important}.sp-engagement-note{margin:10px 0 2px;color:var(--muted);font-size:11px;line-height:1.45}.sp-engagement-note b{color:var(--text)}`;
document.head.appendChild(css);
function quotesFor(tender){return Array.isArray(tender?.quotes)?tender.quotes:[]}
function quoteEmails(tender){return new Set(quotesFor(tender).map(q=>String(q.email||'').trim().toLowerCase()).filter(Boolean))}
async function rowsFor(tenderId){
 try{
  if(typeof siteplanCloud==='undefined')return [];
  const session=(await siteplanCloud.auth.getSession()).data?.session; if(!session?.access_token)return [];
  const r=await fetch(`/api/tender-recipients?tenderId=${encodeURIComponent(tenderId)}&v=80`,{headers:{Authorization:`Bearer ${session.access_token}`},cache:'no-store'});
  const d=await r.json().catch(()=>({})); if(!r.ok)return [];
  const t=(typeof tenders!=='undefined'?(tenders||[]):[]).find(x=>String(x.id)===String(tenderId));
  const submitted=quoteEmails(t);
  return (d.recipients||[]).map(x=>{const email=String(x.recipient_email||'').trim().toLowerCase();return {...x,status:submitted.has(email)?'quote_submitted':String(x.status||'sent').toLowerCase()}});
 }catch{return []}
}
function renderRows(host,rows){
 if(!host)return;
 if(!rows.length){host.innerHTML='<div class="empty">No recorded sends for this tender yet.</div>';return}
 host.innerHTML=`<div style="color:var(--muted);font-size:12px">${rows.length} supplier${rows.length===1?'':'s'} sent this tender</div><div class="sp-engagement-note"><b>Delivered</b> means the recipient mail server accepted it. <b>Tender viewed</b> means they clicked the tender link.</div><div class="sent-supplier-list">${rows.map(r=>{const when=r.updated_at||r.sent_at;const time=when?new Date(when).toLocaleString('en-NZ',{dateStyle:'medium',timeStyle:'short'}):'';const s=String(r.status||'sent').toLowerCase();return `<div class="sent-supplier-row"><div><b>${safe(r.company_name||'Supplier')}</b><small>${safe(r.recipient_email||'')}</small></div><div class="sent-supplier-time">${safe(time)}</div><span class="delivery-badge ${cls(s)}">${safe(LABELS[s]||s)}</span></div>`}).join('')}</div>`;
}
window.showTenderRecipients=async function(tenderId){
 const t=(typeof tenders!=='undefined'?(tenders||[]):[]).find(x=>String(x.id)===String(tenderId));if(!t)return;
 const qmc=$('quoteModalContent');qmc.style.width='min(760px,96vw)';qmc.style.maxWidth='760px';qmc.style.padding='22px';qmc.style.background='var(--panel)';
 qmc.innerHTML=`<div class="modal-head"><div><h2 style="margin:0">Sent suppliers</h2><small>${safe(t.title)} · ${safe(t.eventName||'Event')}</small></div><button class="btn" onclick="document.getElementById('quoteModal').classList.add('hidden')">×</button></div><div id="sentSupplierBody"><div class="empty">Checking delivery and engagement…</div></div>`;
 $('quoteModal').classList.remove('hidden');renderRows($('sentSupplierBody'),await rowsFor(tenderId));
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
