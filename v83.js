// SitePlan V83: reliable supplier create/edit through backend endpoint
(()=>{
'use strict';
let editingSupplierId='';
const by=id=>document.getElementById(id);
function fillChecks(hostId,values){const host=by(hostId);if(!host)return;[...host.querySelectorAll('input[type="checkbox"]')].forEach(x=>x.checked=(values||[]).includes(x.value));}
function cleanSupplierId(value){if(typeof value!=='string')return '';const id=value.trim();return id&&id!=='[object Object]'&&id!=='[object PointerEvent]'&&id!=='[object MouseEvent]'?id:'';}

window.openSupplierModal=function(id=''){
 editingSupplierId=cleanSupplierId(id);
 checkboxCards('supplierCategories',SUPPLIER_CATEGORIES);
 checkboxCards('supplierRegions',SUPPLIER_REGIONS);
 const s=editingSupplierId?suppliers.find(x=>String(x.id)===editingSupplierId):null;
 by('sCompany').value=s?.company||'';by('sContact').value=s?.contact||'';by('sEmail').value=s?.email||'';by('sPhone').value=s?.phone||'';by('sWebsite').value=s?.website||'';by('sMinimum').value=s?.minimum||'';by('sEventSize').value=s?.eventSize||'';by('sCapabilities').value=s?.capabilities||'';by('sInsurance').value=s?.insurance||'Yes';by('sNotifications').value=s?.notifications||'all';
 fillChecks('supplierCategories',s?.categories||[]);fillChecks('supplierRegions',s?.regions||[]);
 const modal=by('supplierModal'),title=modal?.querySelector('.modal-head h2'),save=by('saveSupplierBtn');if(title)title.textContent=s?'Edit Supplier':'Supplier Registration';if(save)save.textContent=s?'Save Changes':'Create Supplier Profile';modal?.classList.remove('hidden');
};

function supplierFromCloud(data){
 if(typeof cloudSupplierToLocal==='function')return cloudSupplierToLocal(data);
 return {id:data.id,company:data.company_name||'',contact:data.contact_name||'',email:data.email||'',phone:data.phone||'',website:data.website||'',categories:data.categories||[],regions:data.regions||[],minimum:Number(data.minimum)||0,eventSize:Number(data.event_size)||0,capabilities:data.capabilities||'',insurance:data.insurance||'Yes',notifications:data.notifications||'all',active:data.active!==false,isGlobal:!!data.is_global};
}

window.addSupplier=async function(){
 const company=String(by('sCompany')?.value||'').trim(),email=String(by('sEmail')?.value||'').trim();
 if(!company||!email){toast('Add company name and email');return}
 const categories=[...by('supplierCategories').querySelectorAll('input:checked')].map(x=>x.value),regions=[...by('supplierRegions').querySelectorAll('input:checked')].map(x=>x.value);
 if(!categories.length||!regions.length){toast('Choose category and region');return}
 const row={company_name:company,contact_name:String(by('sContact')?.value||'').trim()||null,email:email.toLowerCase(),phone:String(by('sPhone')?.value||'').trim()||null,website:String(by('sWebsite')?.value||'').trim()||null,categories,regions,minimum:Number(by('sMinimum')?.value)||0,event_size:Number(by('sEventSize')?.value)||0,capabilities:String(by('sCapabilities')?.value||'').trim()||null,insurance:by('sInsurance')?.value||'Yes',notifications:by('sNotifications')?.value||'all',active:true};
 const save=by('saveSupplierBtn');if(save){save.disabled=true;save.textContent='Saving…'}
 try{
  const session=(await siteplanCloud.auth.getSession()).data?.session;if(!session){if(typeof openAuthModal==='function')openAuthModal();throw new Error('Please sign in first.');}
  const editId=cleanSupplierId(editingSupplierId);
  const r=await fetch('/api/save-supplier',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${session.access_token}`},body:JSON.stringify({id:editId,row})});
  const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'Supplier could not be saved.');
  const saved=supplierFromCloud(d.supplier);
  if(editId){suppliers=suppliers.map(s=>String(s.id)===editId?saved:s);editingSupplierId='';}else{suppliers.unshift(saved);}
  localStorage.setItem('siteplan_suppliers',JSON.stringify(suppliers));by('supplierModal')?.classList.add('hidden');renderSuppliers();renderTenders();renderSupplierDashboard();toast(editId?'Supplier updated':'Supplier saved');
 }catch(error){console.error('Supplier save failed',error);toast(error?.message||'Supplier could not be saved.');}
 finally{if(save){save.disabled=false;save.textContent=editingSupplierId?'Save Changes':'Create Supplier Profile';}}
};
const save=by('saveSupplierBtn');if(save)save.onclick=window.addSupplier;
})();
