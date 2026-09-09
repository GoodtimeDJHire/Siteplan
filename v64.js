// SitePlan V64: shared supplier network + bulk supplier import
(()=>{
const css=document.createElement('style');css.textContent=`
.supplier-import-btn{white-space:nowrap}.supplier-network-pill{display:inline-flex;align-items:center;gap:5px;border:1px solid #55752e;border-radius:99px;padding:5px 8px;color:var(--green);font-size:10px;font-weight:900;text-transform:uppercase}.supplier-network-dot{width:6px;height:6px;border-radius:50%;background:var(--green)}
#importSupplierModal .modal-card{width:min(860px,100%)}.import-summary{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:12px 0 16px}.import-stat{border:1px solid var(--line);background:var(--panel2);border-radius:12px;padding:12px}.import-stat small{display:block;color:var(--muted);font-weight:800}.import-stat b{display:block;font-size:22px;margin-top:3px}.import-table-wrap{max-height:360px;overflow:auto;border:1px solid var(--line);border-radius:12px}.import-table{width:100%;border-collapse:collapse}.import-table th,.import-table td{padding:9px 10px;border-bottom:1px solid var(--line);font-size:11px;text-align:left;vertical-align:top}.import-table th{position:sticky;top:0;background:#151a20;z-index:1}.import-bad{color:#ff8c98}.import-good{color:var(--green)}.supplier-directory-tools{flex-wrap:wrap}
@media(max-width:700px){.import-summary{grid-template-columns:1fr 1fr}}
`;document.head.appendChild(css);

const CAT_ALIASES={'Catering / Bar':['Food Vendor','Bars & Beverage'],'Generators':['Power & Generators'],'Toilets':['Toilets & Sanitation'],'Marquees':['Marquees & Structures'],'Sound & Lighting':['Production / AV'],'Staging':['Production / AV'],'Custom':['Other']};
const REGION_ALIASES={'New Plymouth':'Taranaki','Manawatu':'Manawatu-Whanganui','Kapiti Coast':'Wellington','Wairarapa':'Wellington'};
const splitList=v=>String(v||'').split(/[;|]/).map(x=>x.trim()).filter(Boolean);
const canonCats=v=>[...new Set(splitList(v).flatMap(x=>CAT_ALIASES[x]||[x]).filter(x=>SUPPLIER_CATEGORIES.includes(x)))];
const canonRegions=v=>[...new Set(splitList(v).map(x=>REGION_ALIASES[x]||x).filter(x=>SUPPLIER_REGIONS.includes(x)))];

const oldCloudSupplierToLocal=cloudSupplierToLocal;
cloudSupplierToLocal=function(s){const x=oldCloudSupplierToLocal(s);x.isGlobal=!!s.is_global;x.sourceUrl=s.source_url||'';x.verificationStatus=s.verification_status||'';return x};

const oldSupplierCard=supplierCard;
supplierCard=function(s){
 if(!s?.isGlobal)return oldSupplierCard(s);
 return `<div class="tender"><div><h3>${esc(s.company)}</h3><small>${esc(s.contact||'SitePlan Network')}${s.email?' · '+esc(s.email):''}${s.phone?' · '+esc(s.phone):''}</small></div><span class="supplier-network-pill"><span class="supplier-network-dot"></span>SitePlan Network</span><div style="grid-column:span 2"><small>${(s.categories||[]).map(esc).join(' · ')}</small><br><small>${(s.regions||[]).map(esc).join(' · ')} · Insurance: ${esc(s.insurance||'TBD')}</small></div><div class="tender-actions"><button class="btn" onclick="useSupplier('${s.id}')">Dashboard</button></div></div>`;
};

const oldOpenSupplierModal=openSupplierModal;
openSupplierModal=function(id=''){
 const s=id?suppliers.find(x=>x.id===id):null;
 if(s?.isGlobal){toast('SitePlan Network suppliers are managed centrally');return}
 return oldOpenSupplierModal(id);
};
const oldDeleteSupplier=deleteSupplier;
deleteSupplier=function(id){const s=suppliers.find(x=>x.id===id);if(s?.isGlobal){toast('SitePlan Network suppliers cannot be removed');return}return oldDeleteSupplier(id)};

function addImportUI(){
 const tools=document.querySelector('.supplier-directory-tools');if(!tools||byId('importSuppliersBtn'))return;
 const btn=document.createElement('button');btn.className='btn supplier-import-btn';btn.id='importSuppliersBtn';btn.type='button';btn.textContent='Import Suppliers';tools.appendChild(btn);
 const input=document.createElement('input');input.type='file';input.id='supplierImportFile';input.accept='.csv,.xlsx,.xls';input.hidden=true;document.body.appendChild(input);
 const modal=document.createElement('div');modal.className='modal hidden';modal.id='importSupplierModal';modal.innerHTML=`<div class="modal-card"><div class="modal-head"><div><h2 style="margin:0">Import Suppliers</h2><small style="color:var(--muted)">Imported suppliers are private to your account. SitePlan Network suppliers stay shared and read-only.</small></div><button class="btn" id="closeImportSupplierModal">×</button></div><div id="supplierImportBody"></div></div>`;document.body.appendChild(modal);
 btn.onclick=()=>{if(!siteplanCloudUser){openAuthModal();return}input.value='';input.click()};
 input.onchange=()=>{const f=input.files?.[0];if(f)readSupplierFile(f)};
 byId('closeImportSupplierModal').onclick=()=>modal.classList.add('hidden');
}

function parseCSV(text){
 const rows=[];let row=[],cell='',q=false;
 for(let i=0;i<text.length;i++){
  const ch=text[i];
  if(q){if(ch==='"'&&text[i+1]==='"'){cell+='"';i++}else if(ch==='"')q=false;else cell+=ch}
  else if(ch==='"')q=true;else if(ch===','){row.push(cell);cell=''}else if(ch==='\n'){row.push(cell);rows.push(row);row=[];cell=''}else if(ch!=='\r')cell+=ch;
 }
 if(cell.length||row.length){row.push(cell);rows.push(row)}return rows;
}
async function loadXLSX(){
 if(window.XLSX)return;
 await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';s.onload=resolve;s.onerror=reject;document.head.appendChild(s)});
}
async function readSupplierFile(file){
 try{
  let matrix=[];
  if(/\.xlsx?$/i.test(file.name)){
   await loadXLSX();const ab=await file.arrayBuffer();const book=XLSX.read(ab,{type:'array'});const sheet=book.Sheets[book.SheetNames[0]];matrix=XLSX.utils.sheet_to_json(sheet,{header:1,defval:''});
  }else matrix=parseCSV(await file.text());
  previewSupplierImport(matrix,file.name);
 }catch(e){toast('Could not read supplier file');console.error(e)}
}
function rowObject(headers,row){const o={};headers.forEach((h,i)=>o[h]=row[i]??'');return o}
function normalHeader(h){return String(h||'').trim().toLowerCase().replace(/\s+/g,'_')}
function previewSupplierImport(matrix,fileName){
 const modal=byId('importSupplierModal'),body=byId('supplierImportBody');modal.classList.remove('hidden');
 if(matrix.length<2){body.innerHTML='<div class="empty-state">No supplier rows found.</div>';return}
 const headers=matrix[0].map(normalHeader),existing=new Set(suppliers.map(s=>(s.company||'').trim().toLowerCase()+'|'+(s.email||'').trim().toLowerCase()));
 const parsed=[];let invalid=0,dupes=0;
 matrix.slice(1).forEach((r,n)=>{
  const x=rowObject(headers,r),company=String(x.company_name||x.company||'').trim(),email=String(x.email||'').trim(),categories=canonCats(x.categories||x.category),regions=canonRegions(x.regions||x.region);
  if(!company&&!email)return;
  const duplicate=existing.has(company.toLowerCase()+'|'+email.toLowerCase());
  const errors=[];if(!company)errors.push('Company missing');if(!categories.length)errors.push('Category missing/unknown');if(!regions.length)errors.push('Region missing/unknown');
  if(duplicate)dupes++;if(errors.length)invalid++;
  parsed.push({line:n+2,company,email,phone:String(x.phone||'').trim(),website:String(x.website||'').trim(),contact:String(x.contact_name||x.contact||'').trim(),categories,regions,minimum:Number(x.minimum||0)||0,eventSize:Number(x.event_size||x.eventsize||0)||0,capabilities:String(x.capabilities||'').trim(),insurance:String(x.insurance||'TBD').trim()||'TBD',notifications:String(x.notifications||'all').trim()||'all',duplicate,errors});
 });
 const ready=parsed.filter(x=>!x.duplicate&&!x.errors.length);
 window.__siteplanSupplierImport=ready;
 body.innerHTML=`<div style="color:var(--muted);font-size:12px">${esc(fileName)}</div><div class="import-summary"><div class="import-stat"><small>Rows found</small><b>${parsed.length}</b></div><div class="import-stat"><small>Ready</small><b class="import-good">${ready.length}</b></div><div class="import-stat"><small>Duplicates</small><b>${dupes}</b></div><div class="import-stat"><small>Needs attention</small><b class="${invalid?'import-bad':''}">${invalid}</b></div></div><div class="import-table-wrap"><table class="import-table"><thead><tr><th>Company</th><th>Category</th><th>Region</th><th>Status</th></tr></thead><tbody>${parsed.slice(0,200).map(x=>`<tr><td>${esc(x.company||'—')}</td><td>${esc(x.categories.join(', ')||'—')}</td><td>${esc(x.regions.join(', ')||'—')}</td><td>${x.duplicate?'Duplicate':x.errors.length?`<span class="import-bad">${esc(x.errors.join(', '))}</span>`:'<span class="import-good">Ready</span>'}</td></tr>`).join('')}</tbody></table></div><div style="display:flex;gap:8px;justify-content:flex-end;margin-top:14px"><button class="btn" id="cancelSupplierImport">Cancel</button><button class="btn primary" id="confirmSupplierImport" ${ready.length?'':'disabled'}>Import ${ready.length} suppliers</button></div>`;
 byId('cancelSupplierImport').onclick=()=>modal.classList.add('hidden');byId('confirmSupplierImport').onclick=importSupplierRows;
}
async function importSupplierRows(){
 const rows=window.__siteplanSupplierImport||[];if(!rows.length)return;if(!siteplanCloudUser){openAuthModal();return}
 const btn=byId('confirmSupplierImport');btn.disabled=true;btn.textContent='Importing…';
 const payload=rows.map(x=>({owner_id:siteplanCloudUser.id,company_name:x.company,contact_name:x.contact||null,email:x.email||null,phone:x.phone||null,website:x.website||null,categories:x.categories,regions:x.regions,minimum:x.minimum,event_size:x.eventSize,capabilities:x.capabilities||null,insurance:x.insurance,notifications:x.notifications,active:true,is_global:false}));
 const {data,error}=await siteplanCloud.from('suppliers').insert(payload).select('*');
 if(error){btn.disabled=false;btn.textContent='Try import again';toast(error.message);return}
 const added=(data||[]).map(cloudSupplierToLocal);suppliers=[...added,...suppliers];localStorage.setItem('siteplan_suppliers',JSON.stringify(suppliers));byId('importSupplierModal').classList.add('hidden');renderSuppliers();renderTenders();renderSupplierDashboard();toast(`${added.length} suppliers imported`);
}

async function refreshSupplierNetwork(){
 if(!siteplanCloudUser)return;
 const {data,error}=await siteplanCloud.from('suppliers').select('*').order('created_at',{ascending:false});if(error)return;
 suppliers=(data||[]).map(cloudSupplierToLocal);localStorage.setItem('siteplan_suppliers',JSON.stringify(suppliers));renderSuppliers();renderTenders();renderSupplierDashboard();
}
addImportUI();setTimeout(refreshSupplierNetwork,500);
})();
