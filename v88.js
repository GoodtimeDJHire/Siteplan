// SitePlan V88: show uploaded supplier quote files to the tender owner
(()=>{
'use strict';
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const css=document.createElement('style');css.textContent='.quote-file-links{display:flex;gap:6px;flex-wrap:wrap;margin-top:7px}.quote-file-link{display:inline-flex;align-items:center;padding:6px 9px;border-radius:8px;background:#202a31;border:1px solid #3b4a54;color:#dfffb8;text-decoration:none;font-size:11px;font-weight:850}.quote-file-link:hover{border-color:#a8ff35}';document.head.appendChild(css);
async function addQuoteFiles(tenderId){
 try{
  if(typeof siteplanCloud==='undefined'||!siteplanCloudUser)return;
  const {data:files,error}=await siteplanCloud.from('tender_files').select('id,submission_id,storage_path,file_name,content_type,size_bytes').eq('tender_id',tenderId).order('created_at',{ascending:true});
  if(error)throw error;if(!files?.length)return;
  const t=(tenders||[]).find(x=>String(x.id)===String(tenderId));if(!t)return;
  const rows=[...document.querySelectorAll('#quoteModalContent .quote-table tr')].slice(1);
  for(let i=0;i<(t.quotes||[]).length;i++){
   const q=t.quotes[i],quoteFiles=files.filter(f=>String(f.submission_id)===String(q.id));if(!quoteFiles.length||!rows[i])continue;
   const links=[];
   for(const f of quoteFiles){
    const {data,error}=await siteplanCloud.storage.from('tender-files').createSignedUrl(f.storage_path,3600,{download:f.file_name});
    if(error||!data?.signedUrl)continue;
    links.push(`<a class="quote-file-link" href="${esc(data.signedUrl)}" target="_blank" rel="noopener">📎 ${esc(f.file_name||'Open attachment')}</a>`);
   }
   if(links.length){const cell=rows[i].querySelector('td');if(cell)cell.insertAdjacentHTML('beforeend',`<div class="quote-file-links">${links.join('')}</div>`)}
  }
 }catch(error){console.error('Load quote attachments',error);toast('Quote attachments could not be loaded')}
}
const original=window.openTenderView;
if(typeof original==='function')window.openTenderView=function(id){const out=original.apply(this,arguments);setTimeout(()=>addQuoteFiles(id),80);return out};
window.refreshQuoteAttachments=addQuoteFiles;
})();