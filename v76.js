// SitePlan V76: organiser manual quote entry + file upload
(()=>{
const SOURCE_MARKER='__SITEPLAN_ORGANISER_UPLOAD__';
const style=document.createElement('style');
style.textContent=`
.manual-quote-source{display:inline-flex;align-items:center;border:1px solid #55752e;background:rgba(168,255,53,.06);color:var(--green);border-radius:999px;padding:5px 8px;font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:.06em;margin-top:8px}
#manualQuoteModal .modal-card{width:min(680px,96vw)}
.manual-quote-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.manual-quote-grid .full{grid-column:1/-1}
@media(max-width:620px){.manual-quote-grid{grid-template-columns:1fr}.manual-quote-grid .full{grid-column:auto}}
`;
document.head.appendChild(style);

function addModal(){
 if(document.getElementById('manualQuoteModal'))return;
 const m=document.createElement('div');m.id='manualQuoteModal';m.className='modal hidden';
 m.innerHTML=`<div class="modal-card"><div class="modal-head"><div><h2 style="margin:0">Add quote manually</h2><small style="color:var(--muted)">For quotes received by email, phone or outside SitePlan.</small></div><button class="btn" id="closeManualQuote">×</button></div><div id="manualQuoteBody"></div></div>`;
 document.body.appendChild(m);document.getElementById('closeManualQuote').onclick=()=>m.classList.add('hidden');
}
addModal();

window.openManualQuote=function(tenderId){
 const t=tenders.find(x=>x.id===tenderId);if(!t)return;addModal();
 const opts=(suppliers||[]).filter(s=>!s.isGlobal||s.email).map(s=>`<option value="${esc(s.id)}">${esc(s.company)}${s.email?' · '+esc(s.email):''}</option>`).join('');
 const b=document.getElementById('manualQuoteBody');
 b.innerHTML=`<div class="manual-quote-grid">
  <div class="field full"><label>Supplier</label><select id="mqSupplier"><option value="">Choose supplier…</option>${opts}</select></div>
  <div class="field"><label>Company</label><input id="mqCompany" placeholder="Supplier company"></div>
  <div class="field"><label>Email</label><input id="mqEmail" type="email" placeholder="supplier@email.co.nz"></div>
  <div class="field"><label>Contact name</label><input id="mqContact" placeholder="Optional"></div>
  <div class="field"><label>Total incl. GST</label><input id="mqTotal" type="number" step="0.01" min="0" placeholder="0.00"></div>
  <div class="field"><label>Net</label><input id="mqNet" type="number" step="0.01" min="0" placeholder="0.00"></div>
  <div class="field"><label>GST</label><input id="mqGst" type="number" step="0.01" min="0" placeholder="0.00"></div>
  <div class="field full"><label>Quote file</label><input id="mqFile" type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"></div>
  <div class="field full"><label>Notes / exclusions</label><textarea id="mqNotes" style="width:100%;min-height:110px" placeholder="Optional notes"></textarea></div>
 </div><button class="btn primary" id="saveManualQuote" style="width:100%;padding:13px">Add quote</button>`;
 const sel=document.getElementById('mqSupplier');
 sel.onchange=()=>{const s=suppliers.find(x=>x.id===sel.value);if(!s)return;document.getElementById('mqCompany').value=s.company||'';document.getElementById('mqEmail').value=s.email||'';document.getElementById('mqContact').value=s.contact||''};
 document.getElementById('mqTotal').oninput=()=>{const total=Number(document.getElementById('mqTotal').value)||0;if(total>0&&!document.getElementById('mqNet').value){const net=total/1.15;document.getElementById('mqNet').value=net.toFixed(2);document.getElementById('mqGst').value=(total-net).toFixed(2)}};
 document.getElementById('saveManualQuote').onclick=()=>saveManualQuote(tenderId);
 document.getElementById('manualQuoteModal').classList.remove('hidden');
};

async function saveManualQuote(tenderId){
 const t=tenders.find(x=>x.id===tenderId);if(!t)return;
 const btn=document.getElementById('saveManualQuote');
 const company=document.getElementById('mqCompany').value.trim();
 const email=document.getElementById('mqEmail').value.trim();
 const contact=document.getElementById('mqContact').value.trim();
 const total=Number(document.getElementById('mqTotal').value)||0;
 const net=Number(document.getElementById('mqNet').value)||0;
 const gst=Number(document.getElementById('mqGst').value)||0;
 const notes=document.getElementById('mqNotes').value.trim();
 if(!company){toast('Company is required');return}if(!email){toast('Supplier email is required');return}if(!total){toast('Quote total is required');return}
 btn.disabled=true;btn.textContent='Adding quote…';
 try{
   const d=await publicTenderRequest(t.publicToken||t.id,'POST',{company_name:company,contact_name:contact,email,phone:'',price:total,gst_included:true,availability:'',notes:`${SOURCE_MARKER}${notes?`\n${notes}`:''}`,inclusions:'',exclusions:'',answers:{net,gst_amount:gst,source:'organiser_upload'}});
   const f=document.getElementById('mqFile').files?.[0];
   if(f){const fd=new FormData();fd.append('upload_token',d.upload_token);fd.append('file',f);const r=await fetch(`${SITEPLAN_SUPABASE_URL}/functions/v1/tender-file-upload`,{method:'POST',headers:{'Authorization':`Bearer ${SITEPLAN_EDGE_ANON}`,'apikey':SITEPLAN_EDGE_ANON},body:fd});const u=await r.json().catch(()=>({}));if(!r.ok)throw new Error(u.error||'Quote added but file upload failed')}
   document.getElementById('manualQuoteModal').classList.add('hidden');
   if(typeof refreshCloudTenders==='function')await refreshCloudTenders();
   openTenderView(tenderId);toast('Manual quote added');
 }catch(e){console.error(e);toast(e.message||'Could not add quote');btn.disabled=false;btn.textContent='Add quote'}
}

const oldOpenTenderView=openTenderView;
openTenderView=function(id){
 const r=oldOpenTenderView.apply(this,arguments);
 const t=tenders.find(x=>x.id===id);if(!t)return r;
 const actionRow=document.querySelector('#quoteModalContent .copy-link-box')?.nextElementSibling;
 if(actionRow&&!actionRow.querySelector('.manual-quote-btn')){const b=document.createElement('button');b.className='btn manual-quote-btn';b.textContent='+ Add quote manually';b.onclick=()=>openManualQuote(id);actionRow.appendChild(b)}
 const cards=[...document.querySelectorAll('#quoteModalContent .quote-card')];
 (t.quotes||[]).forEach((q,i)=>{if(!(q.notes||'').startsWith(SOURCE_MARKER)||!cards[i])return;const supplier=cards[i].querySelector('.quote-supplier');if(supplier&&!supplier.querySelector('.manual-quote-source'))supplier.insertAdjacentHTML('beforeend','<div class="manual-quote-source">Uploaded by organiser</div>');const note=cards[i].querySelector('.quote-details div:nth-child(2)');if(note){const cleaned=(q.notes||'').replace(SOURCE_MARKER,'').trim();note.innerHTML=`<strong>Notes:</strong> ${esc(cleaned||'—')}`}});
 return r;
};
})();
