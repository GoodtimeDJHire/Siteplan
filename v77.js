// SitePlan V77: live tender email delivery summary inside tender view
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

async function renderLiveTenderDelivery(tenderId){
 const host=document.getElementById('tenderDeliveryStatus');if(!host)return;
 host.innerHTML='<div class="empty">Checking live delivery status…</div>';
 try{
  const session=(await siteplanCloud.auth.getSession()).data?.session;const token=session?.access_token;if(!token){host.innerHTML='<div class="empty">Sign in to view delivery status.</div>';return}
  const r=await fetch(`/api/tender-recipients?tenderId=${encodeURIComponent(tenderId)}`,{headers:{Authorization:`Bearer ${token}`}});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'Could not load delivery status');
  const rows=newestPerEmail(d.recipients||[]);
  if(!rows.length){host.innerHTML='<div class="empty">No recorded tender emails yet.</div>';return}
  const counts={delivered:0,bounced:0,suppressed:0,other:0};rows.forEach(x=>{const s=effectiveStatus(x.status);if(s==='delivered')counts.delivered++;else if(s==='bounced')counts.bounced++;else if(s==='suppressed'||s==='complained'||s==='failed')counts.suppressed++;else counts.other++});
  host.innerHTML=`<div class="delivery-summary"><div class="delivery-summary-card"><span>Sent</span><b>${rows.length}</b></div><div class="delivery-summary-card good"><span>Delivered</span><b>${counts.delivered}</b></div><div class="delivery-summary-card bad"><span>Bounced</span><b>${counts.bounced}</b></div><div class="delivery-summary-card bad"><span>Suppressed / failed</span><b>${counts.suppressed}</b></div></div><div class="delivery-live-note">Live status from the email provider. Delivered means the recipient mail server accepted the message; it may still be filtered into junk.</div><div class="delivery-live-list">${rows.map(x=>{const when=x.updated_at||x.sent_at;const time=when?new Date(when).toLocaleString('en-NZ',{dateStyle:'medium',timeStyle:'short'}):'';const s=effectiveStatus(x.status);return `<div class="delivery-live-row"><div><b>${esc(supplierName(x.recipient_email))}</b><small>${esc(x.recipient_email||'')}</small></div><div class="delivery-live-time">${esc(time)}</div><span class="delivery-badge ${esc(s)}">${esc(label(x.status))}</span></div>`}).join('')}</div>`;
 }catch(e){console.warn('Live tender delivery',e);host.innerHTML=`<div class="empty">Delivery status could not be loaded. ${esc(e?.message||'')}</div>`}
}

const oldOpen=window.openTenderView;
if(typeof oldOpen==='function'){
 window.openTenderView=function(id){const out=oldOpen.apply(this,arguments);setTimeout(()=>renderLiveTenderDelivery(id),0);return out};
}
window.refreshTenderDelivery=renderLiveTenderDelivery;
})();
