// SitePlan V88: inline supplier quote files with visible loading and error states
(()=>{
'use strict';
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const css=document.createElement('style');css.textContent='.quote-file-cell{min-width:145px}.quote-file-state{font-size:11px;color:var(--muted)}.quote-file-link{display:inline-flex;align-items:center;gap:5px;padding:7px 9px;border-radius:8px;background:#202a31;border:1px solid #3b4a54;color:#dfffb8;text-decoration:none;font-size:11px;font-weight:850;max-width:190px}.quote-file-link span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.quote-file-link:hover{border-color:#a8ff35}.quote-file-error{color:#ff8c98;font-size:11px}';document.head.appendChild(css);
function prepareCells(tender){
 const table=document.querySelector('#quoteModalContent .quote-table');if(!table)return[];
 const rows=[...table.querySelectorAll('tr')];if(!rows.length)return[];
 const head=document.createElement('th');head.textContent='Quote file';rows[0].appendChild(head);
 return rows.slice(1).map((row,i)=>{const cell=document.createElement('td');cell.className='quote-file-cell';cell.dataset.submissionId=String(tender?.quotes?.[i]?.id||'');cell.innerHTML='<span class="quote-file-state">Loading…</span>';row.appendChild(cell);return cell});
}
async function loadFiles(tenderId,tender,cells){
 try{
  if(typeof siteplanCloud==='undefined'||!siteplanCloudUser)throw new Error('Sign in again to view files');
  const {data:files,error}=await siteplanCloud.from('tender_files').select('id,submission_id,storage_path,file_name,content_type,size_bytes').eq('tender_id',tenderId).order('created_at',{ascending:true});
  if(error)throw error;
  for(const cell of cells){
   const matches=(files||[]).filter(f=>String(f.submission_id)===cell.dataset.submissionId);
   if(!matches.length){cell.innerHTML='<span class="quote-file-state">No attachment</span>';continue}
   const links=[];
   for(const f of matches){
    const {data,error}=await siteplanCloud.storage.from('tender-files').createSignedUrl(f.storage_path,3600,{download:f.file_name});
    if(error)throw error;
    if(data?.signedUrl)links.push(`<a class="quote-file-link" href="${esc(data.signedUrl)}" target="_blank" rel="noopener" title="${esc(f.file_name)}">📎 <span>${esc(f.file_name||'Open attachment')}</span></a>`);
   }
   cell.innerHTML=links.join(' ')||'<span class="quote-file-error">Could not create file link</span>';
  }
 }catch(error){console.error('Load quote attachments',error);cells.forEach(cell=>cell.innerHTML=`<span class="quote-file-error">${esc(error?.message||'Could not load file')}</span>`)}
}
const original=window.openTenderView;
if(typeof original==='function')window.openTenderView=function(id){
 const out=original.apply(this,arguments);
 const tender=(typeof tenders!=='undefined'?(tenders||[]):[]).find(x=>String(x.id)===String(id));
 const cells=prepareCells(tender);if(cells.length)loadFiles(id,tender,cells);return out;
};
})();