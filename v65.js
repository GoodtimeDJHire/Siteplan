// SitePlan V65: tender history wording, responsive quote comparison, organiser quote notifications
(()=>{
function relabelTenderHistory(){
  document.querySelectorAll('.section-title').forEach(el=>{
    const text=(el.textContent||'').trim().toLowerCase();
    if(text==='past event tender history') el.textContent='Other Event Tenders';
  });
}

const style=document.createElement('style');
style.textContent=`
#quoteModal .modal-card{width:min(1180px,96vw)!important}
#quoteModal .quote-table-wrap{overflow:hidden!important}
#quoteModal .quote-table{width:100%!important;min-width:0!important;table-layout:fixed}
#quoteModal .quote-table th,#quoteModal .quote-table td{white-space:normal!important;overflow-wrap:normal;word-break:normal;vertical-align:top}
#quoteModal .quote-table th:nth-child(1),#quoteModal .quote-table td:nth-child(1){width:22%}
#quoteModal .quote-table th:nth-child(2),#quoteModal .quote-table td:nth-child(2){width:14%}
#quoteModal .quote-table th:nth-child(3),#quoteModal .quote-table td:nth-child(3){width:8%}
#quoteModal .quote-table th:nth-child(4),#quoteModal .quote-table td:nth-child(4){width:8%}
#quoteModal .quote-table th:nth-child(5),#quoteModal .quote-table td:nth-child(5){width:9%}
#quoteModal .quote-table th:nth-child(6),#quoteModal .quote-table td:nth-child(6){width:18%}
#quoteModal .quote-table th:nth-child(7),#quoteModal .quote-table td:nth-child(7){width:11%}
#quoteModal .quote-table th:nth-child(8),#quoteModal .quote-table td:nth-child(8){width:10%}
#quoteModal .quote-table td:nth-child(1) small{overflow-wrap:anywhere}
#quoteModal .quote-status-actions{display:flex;flex-direction:column;gap:5px;min-width:0}
#quoteModal .quote-status-actions .btn{padding:7px 6px;font-size:10px;width:100%;white-space:nowrap}
@media(max-width:760px){
 #quoteModal .modal-card{width:96vw!important;padding:14px}
 #quoteModal .quote-table-wrap{border:0!important;overflow:visible!important}
 #quoteModal .quote-table,#quoteModal .quote-table tbody,#quoteModal .quote-table tr,#quoteModal .quote-table td{display:block;width:100%!important}
 #quoteModal .quote-table>tbody>tr:first-child{display:none}
 #quoteModal .quote-table tr{border:1px solid var(--line);border-radius:12px;margin:0 0 12px;padding:10px;background:#0d1116}
 #quoteModal .quote-table td{border:0!important;padding:6px 4px!important}
 #quoteModal .quote-table td:before{display:block;color:var(--muted);font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:.08em;margin-bottom:2px}
 #quoteModal .quote-table td:nth-child(1):before{content:'Supplier'}
 #quoteModal .quote-table td:nth-child(2):before{content:'Contact'}
 #quoteModal .quote-table td:nth-child(3):before{content:'Net'}
 #quoteModal .quote-table td:nth-child(4):before{content:'GST'}
 #quoteModal .quote-table td:nth-child(5):before{content:'Total'}
 #quoteModal .quote-table td:nth-child(6):before{content:'Details'}
 #quoteModal .quote-table td:nth-child(7):before{content:'Status'}
 #quoteModal .quote-table td:nth-child(8):before{content:'Decision'}
 #quoteModal .quote-status-actions{flex-direction:row;flex-wrap:wrap}
 #quoteModal .quote-status-actions .btn{width:auto}
}
`;
document.head.appendChild(style);

relabelTenderHistory();
const oldRenderTenders=renderTenders;
renderTenders=function(){const result=oldRenderTenders.apply(this,arguments);relabelTenderHistory();return result};

submitDemoQuote=async function(id){
 const t=tenders.find(x=>x.id===id);if(!t)return;const btn=byId('publicSubmitBtn');
 const company=byId('qCompany')?.value.trim(),email=byId('qEmail')?.value.trim();if(!company||!email){toast('Company and email are required');return}
 const contact=byId('qContact')?.value.trim()||'',phone=byId('qPhone')?.value.trim()||'',availability=byId('qAvailability')?.value.trim()||'',notes=byId('qNotes')?.value.trim()||'',inclusions=byId('qInclusions')?.value.trim()||'';
 const net=Number(byId('qNet')?.value)||0,gst=Number(byId('qGstAmount')?.value)||0,total=Number(byId('qPrice')?.value)||0;
 btn.disabled=true;btn.textContent='Submitting…';
 try{
  const d=await publicTenderRequest(t.publicToken||t.id,'POST',{company_name:company,contact_name:contact,email,phone,price:total||null,gst_included:!!byId('qGST')?.checked,availability,notes,inclusions,exclusions:'',answers:{net,gst_amount:gst}});
  const f=byId('qFile')?.files?.[0];
  if(f){
    const fd=new FormData();fd.append('upload_token',d.upload_token);fd.append('file',f);
    const r=await fetch(`${SITEPLAN_SUPABASE_URL}/functions/v1/tender-file-upload`,{method:'POST',headers:{'Authorization':`Bearer ${SITEPLAN_EDGE_ANON}`,'apikey':SITEPLAN_EDGE_ANON},body:fd});
    const u=await r.json().catch(()=>({}));if(!r.ok)throw new Error(u.error||'Quote submitted but file upload failed');
  }
  fetch('/api/notify-quote',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:t.publicToken||t.id,company,contact,email,net,gst,total,inclusions,notes})}).then(async r=>{if(!r.ok){const x=await r.json().catch(()=>({}));console.warn('Quote notification',x.error||r.status)}}).catch(e=>console.warn('Quote notification',e));
  byId('quoteModalContent').innerHTML=`<div class="public-card" style="text-align:center;padding:42px"><div style="font-size:38px">✓</div><h2>Quote submitted</h2><p class="muted">Your private response has been sent to the event organiser.</p></div>`;toast('Private quote submitted');
 }catch(e){toast(e.message);btn.disabled=false;btn.textContent='Submit Private Quote'}
};
})();
