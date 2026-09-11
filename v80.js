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