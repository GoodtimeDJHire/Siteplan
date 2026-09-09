// SitePlan V66: clearer tender event subtitle + custom supplier service types + sent supplier viewer
(()=>{
const CUSTOM_CATEGORY_KEY='siteplan_custom_supplier_categories';
const BASE_ADDITIONS=['Furniture'];

function savedCustomCategories(){
 try{return JSON.parse(localStorage.getItem(CUSTOM_CATEGORY_KEY)||'[]').filter(Boolean)}catch{return []}
}
function saveCustomCategories(items){localStorage.setItem(CUSTOM_CATEGORY_KEY,JSON.stringify([...new Set(items.filter(Boolean))]))}
function categoriesFromSuppliers(){return [...new Set((suppliers||[]).flatMap(s=>s.categories||[]).filter(Boolean))]}
function allCustomCategories(){return [...new Set([...BASE_ADDITIONS,...savedCustomCategories(),...categoriesFromSuppliers()])];}
function ensureCategories(){
 const custom=allCustomCategories();
 custom.forEach(c=>{if(!SUPPLIER_CATEGORIES.includes(c))SUPPLIER_CATEGORIES.splice(Math.max(0,SUPPLIER_CATEGORIES.indexOf('Other')),0,c)});
 saveCustomCategories(custom.filter(c=>!BASE_ADDITIONS.includes(c)&&c!=='Other'));
 syncCategoryControls();
}
function syncSelect(select,includeAll=false){
 if(!select)return;
 const current=select.value;
 if(includeAll){
   const first=select.options[0]?.value===''?select.options[0]:new Option('All supplier types','');
   select.innerHTML='';select.add(first);
 }
 SUPPLIER_CATEGORIES.forEach(c=>{if(![...select.options].some(o=>o.value===c))select.add(new Option(c,c))});
 if(current&&[...select.options].some(o=>o.value===current))select.value=current;
}
function syncCategoryControls(){syncSelect(byId('tCategory'));syncSelect(byId('supplierCategoryFilter'),true)}
function addCustomCategory(raw,selectAfter=true){
 const name=String(raw||'').trim().replace(/\s+/g,' ');
 if(!name){toast('Enter a service type');return ''}
 const existing=SUPPLIER_CATEGORIES.find(c=>c.toLowerCase()===name.toLowerCase());
 const finalName=existing||name;
 if(!existing){
   const custom=savedCustomCategories();custom.push(finalName);saveCustomCategories(custom);
   const otherIndex=SUPPLIER_CATEGORIES.indexOf('Other');SUPPLIER_CATEGORIES.splice(otherIndex>=0?otherIndex:SUPPLIER_CATEGORIES.length,0,finalName);
 }
 syncCategoryControls();
 if(selectAfter&&byId('tCategory'))byId('tCategory').value=finalName;
 return finalName;
}

const css=document.createElement('style');css.textContent=`
.tender-event-subtitle{font-size:15px;font-weight:850;color:#444d45;margin-top:4px;margin-bottom:5px}.tender-meta-line{font-size:12px;color:#747c72}
.custom-type-row{display:flex;gap:7px;margin-top:9px}.custom-type-row input{flex:1}.custom-type-row .btn{padding:9px 11px;white-space:nowrap}
.sent-supplier-list{display:grid;gap:8px;margin-top:14px}.sent-supplier-row{display:grid;grid-template-columns:minmax(220px,1.4fr) minmax(120px,.7fr) auto;gap:12px;align-items:center;padding:12px 14px;border:1px solid var(--line);border-radius:12px;background:#0d1116}.sent-supplier-row b{display:block}.sent-supplier-row small{display:block;color:var(--muted);margin-top:2px;overflow-wrap:anywhere}.sent-supplier-time{font-size:11px;color:var(--muted)}
@media(max-width:700px){.sent-supplier-row{grid-template-columns:1fr auto}.sent-supplier-time{grid-column:1/-1}}
`;document.head.appendChild(css);

ensureCategories();

function enhanceSupplierCategoryField(){
 const host=byId('supplierCategories');if(!host)return;
 const field=host.closest('.field');if(!field||field.querySelector('.custom-type-row'))return;
 const row=document.createElement('div');row.className='custom-type-row';row.innerHTML='<input id="newSupplierType" placeholder="Add another service type"><button type="button" class="btn" id="addSupplierTypeBtn">+ Add type</button>';
 field.appendChild(row);
 byId('addSupplierTypeBtn').onclick=()=>{
   const checked=[...host.querySelectorAll('input:checked')].map(x=>x.value);
   const name=addCustomCategory(byId('newSupplierType').value,false);if(!name)return;
   checkboxCards('supplierCategories',SUPPLIER_CATEGORIES);
   [...byId('supplierCategories').querySelectorAll('input')].forEach(x=>x.checked=checked.includes(x.value)||x.value===name);
   byId('newSupplierType').value='';toast(`${name} added`);
 };
 byId('newSupplierType').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();byId('addSupplierTypeBtn').click()}});
}

function enhanceTenderCategoryField(){
 const select=byId('tCategory');if(!select)return;
 const field=select.closest('.field');if(!field||field.querySelector('.custom-type-row'))return;
 const row=document.createElement('div');row.className='custom-type-row';row.innerHTML='<input id="newTenderType" placeholder="Add another tender type"><button type="button" class="btn" id="addTenderTypeBtn">+ Add type</button>';
 field.appendChild(row);
 byId('addTenderTypeBtn').onclick=()=>{const name=addCustomCategory(byId('newTenderType').value,true);if(name){byId('newTenderType').value='';toast(`${name} added and selected`)}};
 byId('newTenderType').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();byId('addTenderTypeBtn').click()}});
}

enhanceSupplierCategoryField();enhanceTenderCategoryField();

function addSentButtons(){
 const host=byId('tenderList');if(!host)return;
 host.querySelectorAll('.tender').forEach(card=>{
   const actions=card.querySelector('.tender-actions');if(!actions||actions.querySelector('.sent-to-btn'))return;
   const view=[...actions.querySelectorAll('button')].find(b=>(b.textContent||'').trim()==='View');
   const call=view?.getAttribute('onclick')||'';const match=call.match(/openTenderView\(['\"]([^'\"]+)['\"]\)/);if(!match)return;
   const btn=document.createElement('button');btn.className='btn sent-to-btn';btn.type='button';btn.textContent='Sent to';btn.onclick=()=>showTenderRecipients(match[1]);
   const share=[...actions.querySelectorAll('button')].find(b=>(b.textContent||'').trim().startsWith('Share to'));
   if(share)actions.insertBefore(btn,share);else actions.appendChild(btn);
 });
}

window.showTenderRecipients=async function(tenderId){
 const t=tenders.find(x=>x.id===tenderId);if(!t)return;
 const qmc=byId('quoteModalContent');qmc.style.width='min(760px,96vw)';qmc.style.maxWidth='760px';qmc.style.padding='22px';qmc.style.background='var(--panel)';
 qmc.innerHTML=`<div class="modal-head"><div><h2 style="margin:0">Sent suppliers</h2><small>${esc(t.title)} · ${esc(t.eventName||'Event')}</small></div><button class="btn" onclick="byId('quoteModal').classList.add('hidden')">×</button></div><div id="sentSupplierBody"><div class="empty">Checking tender sends…</div></div>`;
 byId('quoteModal').classList.remove('hidden');
 const body=byId('sentSupplierBody');
 if(!siteplanCloudUser){body.innerHTML='<div class="empty">Sign in to view tender delivery history.</div>';return}
 const {data,error}=await siteplanCloud.from('tender_email_deliveries').select('*').eq('tender_id',tenderId).order('sent_at',{ascending:false});
 if(error){body.innerHTML='<div class="empty">Could not load sent suppliers.</div>';return}
 if(!data?.length){body.innerHTML='<div class="empty">No tracked sends for this tender yet. Any new sends will appear here.</div>';return}
 const statusLabel=s=>({sent:'Sent',delivered:'Delivered',delivery_delayed:'Delayed',bounced:'Bounced',failed:'Failed',suppressed:'Suppressed',complained:'Complaint'}[s]||s||'Sent');
 body.innerHTML=`<div style="color:var(--muted);font-size:12px">${data.length} supplier${data.length===1?'':'s'} sent this tender</div><div class="sent-supplier-list">${data.map(r=>{const when=r.updated_at||r.sent_at;const time=when?new Date(when).toLocaleString('en-NZ',{dateStyle:'medium',timeStyle:'short'}):'';return `<div class="sent-supplier-row"><div><b>${esc(r.company_name||'Supplier')}</b><small>${esc(r.recipient_email||'')}</small></div><div class="sent-supplier-time">${esc(time)}</div><span class="delivery-badge ${esc(r.status||'sent')}">${esc(statusLabel(r.status))}</span></div>`}).join('')}</div>`;
};

const previousRenderSuppliers=renderSuppliers;
renderSuppliers=function(){ensureCategories();return previousRenderSuppliers.apply(this,arguments)};

const previousRenderTenders=renderTenders;
renderTenders=function(){const result=previousRenderTenders.apply(this,arguments);addSentButtons();return result};
addSentButtons();

const previousOpenSupplierModal=openSupplierModal;
openSupplierModal=function(){ensureCategories();const result=previousOpenSupplierModal.apply(this,arguments);enhanceSupplierCategoryField();return result};

const previousOpenTender=openTender;
openTender=function(){ensureCategories();const result=previousOpenTender.apply(this,arguments);enhanceTenderCategoryField();return result};
if(byId('newTenderBtn'))byId('newTenderBtn').onclick=openTender;

const previousOpenSupplierForm=openSupplierForm;
openSupplierForm=function(){
 const result=previousOpenSupplierForm.apply(this,arguments);
 const id=arguments[0],t=tenders.find(x=>x.id===id);
 const head=document.querySelector('#quoteModalContent .tender-public-head');
 const h2=head?.querySelector('h2');
 if(head&&h2&&t){
   const oldMeta=h2.nextElementSibling;
   if(!head.querySelector('.tender-event-subtitle')){
     const sub=document.createElement('div');sub.className='tender-event-subtitle';sub.textContent=t.eventName||'Event';h2.insertAdjacentElement('afterend',sub);
   }
   if(oldMeta&&!oldMeta.classList.contains('tender-event-subtitle')){
     oldMeta.classList.add('tender-meta-line');
     const bits=[];if(t.region)bits.push(t.region);if(t.due)bits.push('Quote due '+t.due);oldMeta.textContent=bits.join(' · ');
   }
 }
 return result;
};
})();