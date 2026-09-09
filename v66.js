// SitePlan V66: clearer tender event subtitle + custom supplier service types
(()=>{
const CUSTOM_CATEGORY_KEY='siteplan_custom_supplier_categories';
const BASE_ADDITIONS=['Furniture'];

function savedCustomCategories(){
 try{return JSON.parse(localStorage.getItem(CUSTOM_CATEGORY_KEY)||'[]').filter(Boolean)}catch{return []}
}
function allCustomCategories(){return [...new Set([...BASE_ADDITIONS,...savedCustomCategories()])];}
function ensureCategories(){
 allCustomCategories().forEach(c=>{if(!SUPPLIER_CATEGORIES.includes(c))SUPPLIER_CATEGORIES.splice(Math.max(0,SUPPLIER_CATEGORIES.indexOf('Other')),0,c)});
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
function syncCategoryControls(){
 syncSelect(byId('tCategory'));
 syncSelect(byId('supplierCategoryFilter'),true);
}
function addCustomCategory(raw,selectAfter=true){
 const name=String(raw||'').trim().replace(/\s+/g,' ');
 if(!name){toast('Enter a service type');return ''}
 const existing=SUPPLIER_CATEGORIES.find(c=>c.toLowerCase()===name.toLowerCase());
 const finalName=existing||name;
 if(!existing){
   const custom=savedCustomCategories();custom.push(finalName);localStorage.setItem(CUSTOM_CATEGORY_KEY,JSON.stringify([...new Set(custom)]));
   const otherIndex=SUPPLIER_CATEGORIES.indexOf('Other');SUPPLIER_CATEGORIES.splice(otherIndex>=0?otherIndex:SUPPLIER_CATEGORIES.length,0,finalName);
 }
 syncCategoryControls();
 if(selectAfter&&byId('tCategory'))byId('tCategory').value=finalName;
 return finalName;
}

const css=document.createElement('style');css.textContent=`
.tender-event-subtitle{font-size:15px;font-weight:850;color:#444d45;margin-top:4px;margin-bottom:5px}.tender-meta-line{font-size:12px;color:#747c72}
.custom-type-row{display:flex;gap:7px;margin-top:9px}.custom-type-row input{flex:1}.custom-type-row .btn{padding:9px 11px;white-space:nowrap}
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