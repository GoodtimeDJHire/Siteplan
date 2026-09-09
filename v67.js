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
