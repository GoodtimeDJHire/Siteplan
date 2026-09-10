// SitePlan V83: fix supplier save UUID/session handling
(()=>{
'use strict';
let editingSupplierId='';
function fillChecks(hostId,values){const host=byId(hostId);if(!host)return;[...host.querySelectorAll('input[type="checkbox"]')].forEach(x=>x.checked=(values||[]).includes(x.value));}
function cleanSupplierId(value){if(typeof value!=='string')return '';const id=value.trim();return id && id!=='[object Object]' && id!=='[object PointerEvent]' && id!=='[object MouseEvent]' ? id : '';}

openSupplierModal=function(id=''){
 editingSupplierId=cleanSupplierId(id);
 checkboxCards('supplierCategories',SUPPLIER_CATEGORIES);
 checkboxCards('supplierRegions',SUPPLIER_REGIONS);
 const s=editingSupplierId?suppliers.find(x=>String(x.id)===editingSupplierId):null;
 byId('sCompany').value=s?.company||'';byId('sContact').value=s?.contact||'';byId('sEmail').value=s?.email||'';byId('sPhone').value=s?.phone||'';byId('sWebsite').value=s?.website||'';byId('sMinimum').value=s?.minimum||'';byId('sEventSize').value=s?.eventSize||'';byId('sCapabilities').value=s?.capabilities||'';byId('sInsurance').value=s?.insurance||'Yes';byId('sNotifications').value=s?.notifications||'all';
 fillChecks('supplierCategories',s?.categories||[]);fillChecks('supplierRegions',s?.regions||[]);
 const modal=byId('supplierModal'),title=modal?.querySelector('.modal-head h2'),save=byId('saveSupplierBtn');if(title)title.textContent=s?'Edit Supplier':'Supplier Registration';if(save)save.textContent=s?'Save Changes':'Create Supplier Profile';modal?.classList.remove('hidden');
};

async function currentUser(){try{const {data,error}=await siteplanCloud.auth.getSession();if(error)throw error;return data?.session?.user||null}catch{return null}}
async function runSupplierWrite(fn){
 try{return await fn()}catch(error){
  if(error instanceof TypeError && /failed to fetch/i.test(String(error.message||''))){
   await new Promise(r=>setTimeout(r,450));
   return await fn();
  }
  throw error;
 }
}
function supplierFromCloud(data){
 if(typeof cloudSupplierToLocal==='function')return cloudSupplierToLocal(data);
 return {id:data.id,company:data.company_name||'',contact:data.contact_name||'',email:data.email||'',phone:data.phone||'',website:data.website||'',categories:data.categories||[],regions:data.regions||[],minimum:Number(data.minimum)||0,eventSize:Number(data.event_size)||0,capabilities:data.capabilities||'',insurance:data.insurance||'Yes',notifications:data.notifications||'all',active:data.active!==false,isGlobal:!!data.is_global};
}

addSupplier=async function(){
 const company=String(byId('sCompany')?.value||'').trim(),email=String(byId('sEmail')?.value||'').trim();
 if(!company||!email){toast('Add company name and email');return}
 const user=await currentUser();if(!user?.id){if(typeof openAuthModal==='function')openAuthModal();else toast('Please sign in first');return}
 const categories=[...byId('supplierCategories').querySelectorAll('input:checked')].map(x=>x.value),regions=[...byId('supplierRegions').querySelectorAll('input:checked')].map(x=>x.value);
 if(!categories.length||!regions.length){toast('Choose category and region');return}
 const row={company_name:company,contact_name:String(byId('sContact')?.value||'').trim()||null,email:email.toLowerCase(),phone:String(byId('sPhone')?.value||'').trim()||null,website:String(byId('sWebsite')?.value||'').trim()||null,categories,regions,minimum:Number(byId('sMinimum')?.value)||0,event_size:Number(byId('sEventSize')?.value)||0,capabilities:String(byId('sCapabilities')?.value||'').trim()||null,insurance:byId('sInsurance')?.value||'Yes',notifications:byId('sNotifications')?.value||'all',active:true};
 const save=byId('saveSupplierBtn');if(save){save.disabled=true;save.textContent='Saving…'}
 try{
  const editId=cleanSupplierId(editingSupplierId);
  if(editId){
   const {data,error}=await runSupplierWrite(()=>siteplanCloud.from('suppliers').update(row).eq('id',editId).eq('owner_id',String(user.id)).select().single());if(error)throw error;
   const updated=supplierFromCloud(data);suppliers=suppliers.map(s=>String(s.id)===editId?updated:s);editingSupplierId='';
  }else{
   const {data,error}=await runSupplierWrite(()=>siteplanCloud.from('suppliers').insert({...row,owner_id:String(user.id)}).select().single());if(error)throw error;suppliers.unshift(supplierFromCloud(data));
  }
  localStorage.setItem('siteplan_suppliers',JSON.stringify(suppliers));byId('supplierModal')?.classList.add('hidden');renderSuppliers();renderTenders();renderSupplierDashboard();toast(editId?'Supplier updated':'Supplier saved to cloud');
 }catch(error){console.error('Supplier save failed',error);const msg=String(error?.message||'Could not save supplier');toast(/failed to fetch/i.test(msg)?'Supplier save could not reach the database. Please try again.':msg)}
 finally{if(save){save.disabled=false;save.textContent=editingSupplierId?'Save Changes':'Create Supplier Profile'}}
};
const save=byId('saveSupplierBtn');if(save)save.onclick=addSupplier;
})();
