// SitePlan V61 supplier editing
(()=>{
let editingSupplierId='';

function fillChecks(hostId, values){
 const host=byId(hostId); if(!host)return;
 [...host.querySelectorAll('input[type="checkbox"]')].forEach(x=>x.checked=(values||[]).includes(x.value));
}

openSupplierModal=function(id=''){
 editingSupplierId=id||'';
 checkboxCards('supplierCategories',SUPPLIER_CATEGORIES);
 checkboxCards('supplierRegions',SUPPLIER_REGIONS);
 const s=editingSupplierId?suppliers.find(x=>x.id===editingSupplierId):null;
 byId('sCompany').value=s?.company||'';
 byId('sContact').value=s?.contact||'';
 byId('sEmail').value=s?.email||'';
 byId('sPhone').value=s?.phone||'';
 byId('sWebsite').value=s?.website||'';
 byId('sMinimum').value=s?.minimum||'';
 byId('sEventSize').value=s?.eventSize||'';
 byId('sCapabilities').value=s?.capabilities||'';
 byId('sInsurance').value=s?.insurance||'Yes';
 byId('sNotifications').value=s?.notifications||'all';
 fillChecks('supplierCategories',s?.categories||[]);
 fillChecks('supplierRegions',s?.regions||[]);
 const modal=byId('supplierModal');
 const title=modal?.querySelector('.modal-head h2'); if(title)title.textContent=s?'Edit Supplier':'Supplier Registration';
 const save=byId('saveSupplierBtn'); if(save)save.textContent=s?'Save Changes':'Create Supplier Profile';
 modal?.classList.remove('hidden');
};

addSupplier=async function(){
 const company=byId('sCompany').value.trim(),email=byId('sEmail').value.trim();
 if(!company||!email){toast('Add company name and email');return}
 if(!siteplanCloudUser){openAuthModal();return}
 const categories=[...byId('supplierCategories').querySelectorAll('input:checked')].map(x=>x.value),regions=[...byId('supplierRegions').querySelectorAll('input:checked')].map(x=>x.value);
 if(!categories.length||!regions.length){toast('Choose category and region');return}
 const row={company_name:company,contact_name:byId('sContact').value.trim()||null,email,phone:byId('sPhone').value.trim()||null,website:byId('sWebsite').value.trim()||null,categories,regions,minimum:Number(byId('sMinimum').value)||0,event_size:Number(byId('sEventSize').value)||0,capabilities:byId('sCapabilities').value.trim()||null,insurance:byId('sInsurance').value,notifications:byId('sNotifications').value,active:true};
 if(editingSupplierId){
   const {data,error}=await siteplanCloud.from('suppliers').update(row).eq('id',editingSupplierId).eq('owner_id',siteplanCloudUser.id).select().single();
   if(error){toast(error.message);return}
   const updated=cloudSupplierToLocal(data); suppliers=suppliers.map(s=>s.id===editingSupplierId?updated:s);
   localStorage.setItem('siteplan_suppliers',JSON.stringify(suppliers)); editingSupplierId=''; byId('supplierModal').classList.add('hidden'); renderSuppliers();renderTenders();renderSupplierDashboard();toast('Supplier updated');return;
 }
 row.owner_id=siteplanCloudUser.id;
 const {data,error}=await siteplanCloud.from('suppliers').insert(row).select().single();if(error){toast(error.message);return}
 suppliers.unshift(cloudSupplierToLocal(data));localStorage.setItem('siteplan_suppliers',JSON.stringify(suppliers));byId('supplierModal').classList.add('hidden');renderSuppliers();renderTenders();renderSupplierDashboard();toast('Supplier saved to cloud');
};

supplierCard=function(s){return `<div class="tender"><div><h3>${esc(s.company)}</h3><small>${esc(s.contact||'No contact')} · ${esc(s.email)}${s.phone?' · '+esc(s.phone):''}</small></div><span class="pill open">${s.active?'Active':'Paused'}</span><div style="grid-column:span 2"><small>${(s.categories||[]).map(esc).join(' · ')}</small><br><small>${(s.regions||[]).map(esc).join(' · ')} · Insurance: ${esc(s.insurance||'—')}</small></div><div class="tender-actions"><button class="btn" onclick="openSupplierModal('${s.id}')">Edit</button><button class="btn" onclick="useSupplier('${s.id}')">Dashboard</button><button class="btn danger" onclick="deleteSupplier('${s.id}')">Remove</button></div></div>`};

const save=byId('saveSupplierBtn');if(save)save.onclick=addSupplier;
const close=byId('closeSupplierModal');if(close)close.addEventListener('click',()=>{editingSupplierId=''});
renderSuppliers();
})();