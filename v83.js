// SitePlan V83: fix supplier save UUID/session handling
(()=>{
'use strict';
let editingSupplierId='';
function fillChecks(hostId,values){const host=byId(hostId);if(!host)return;[...host.querySelectorAll('input[type="checkbox"]')].forEach(x=>x.checked=(values||[]).includes(x.value));}

openSupplierModal=function(id=''){
 editingSupplierId=id||'';
 checkboxCards('supplierCategories',SUPPLIER_CATEGORIES);
 checkboxCards('supplierRegions',SUPPLIER_REGIONS);
 const s=editingSupplierId?suppliers.find(x=>String(x.id)===String(editingSupplierId)):null;
 byId('sCompany').value=s?.company||'';byId('sContact').value=s?.contact||'';byId('sEmail').value=s?.email||'';byId('sPhone').value=s?.phone||'';byId('sWebsite').value=s?.website||'';byId('sMinimum').value=s?.minimum||'';byId('sEventSize').value=s?.eventSize||'';byId('sCapabilities').value=s?.capabilities||'';byId('sInsurance').value=s?.insurance||'Yes';byId('sNotifications').value=s?.notifications||'all';
 fillChecks('supplierCategories',s?.categories||[]);fillChecks('supplierRegions',s?.regions||[]);
 const modal=byId('supplierModal'),title=modal?.querySelector('.modal-head h2'),save=byId('saveSupplierBtn');if(title)title.textContent=s?'Edit Supplier':'Supplier Registration';if(save)save.textContent=s?'Save Changes':'Create Supplier Profile';modal?.classList.remove('hidden');
};

async function currentUser(){
 try{const {data,error}=await siteplanCloud.auth.getSession();if(error)throw error;return data?.session?.user||null}catch{return null}
}

addSupplier=async function(){
 const company=String(byId('sCompany')?.value||'').trim(),email=String(byId('sEmail')?.value||'').trim();
 if(!company||!email){toast('Add company name and email');return}
 const user=await currentUser();if(!user?.id){if(typeof openAuthModal==='function')openAuthModal();else toast('Please sign in first');return}
 const categories=[...byId('supplierCategories').querySelectorAll('input:checked')].map(x=>x.value),regions=[...byId('supplierRegions').querySelectorAll('input:checked')].map(x=>x.value);
 if(!categories.length||!regions.length){toast('Choose category and region');return}
 const row={company_name:company,contact_name:String(byId('sContact')?.value||'').trim()||null,email,phone:String(byId('sPhone')?.value||'').trim()||null,website:String(byId('sWebsite')?.value||'').trim()||null,categories,regions,minimum:Number(byId('sMinimum')?.value)||0,event_size:Number(byId('sEventSize')?.value)||0,capabilities:String(byId('sCapabilities')?.value||'').trim()||null,insurance:byId('sInsurance')?.value||'Yes',notifications:byId('sNotifications')?.value||'all',active:true};
 try{
  if(editingSupplierId){
   const {data,error}=await siteplanCloud.from('suppliers').update(row).eq('id',String(editingSupplierId)).eq('owner_id',user.id).select().single();if(error)throw error;
   const updated=cloudSupplierToLocal(data);suppliers=suppliers.map(s=>String(s.id)===String(editingSupplierId)?updated:s);editingSupplierId='';
  }else{
   const {data,error}=await siteplanCloud.from('suppliers').insert({...row,owner_id:user.id}).select().single();if(error)throw error;suppliers.unshift(cloudSupplierToLocal(data));
  }
  localStorage.setItem('siteplan_suppliers',JSON.stringify(suppliers));byId('supplierModal')?.classList.add('hidden');renderSuppliers();renderTenders();renderSupplierDashboard();toast(editingSupplierId?'Supplier updated':'Supplier saved to cloud');
 }catch(error){console.error('Supplier save failed',error);toast(error?.message||'Could not save supplier')}
};
const save=byId('saveSupplierBtn');if(save)save.onclick=addSupplier;
})();
