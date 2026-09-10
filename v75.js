// SitePlan V75: robust supplier spreadsheet import
(()=>{
  function norm(v){return String(v??'').replace(/^\uFEFF/,'').trim().toLowerCase().replace(/&/g,'and').replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'')}
  const aliases={
    company:['company','company_name','supplier','supplier_name','business','business_name','name','vendor','vendor_name','food_truck','food_truck_name'],
    email:['email','email_address','e_mail','contact_email'],
    phone:['phone','phone_number','mobile','contact_number'],
    website:['website','web','url','website_url','site'],
    contact:['contact','contact_name','contact_person','person'],
    category:['category','categories','supplier_type','service','service_type','type'],
    region:['region','regions','area','location','locations'],
    capabilities:['capabilities','services','notes','description'],
    insurance:['insurance','public_liability_insurance'],
    minimum:['minimum','minimum_job_value'],
    eventSize:['event_size','eventsize','max_event_size'],
    notifications:['notifications','email_alerts']
  };
  function findHeaderRow(matrix){
    let best={i:0,score:-1};
    matrix.slice(0,15).forEach((row,i)=>{
      const hs=(row||[]).map(norm);let score=0;
      Object.values(aliases).forEach(a=>{if(a.some(x=>hs.includes(x)))score++});
      if(score>best.score)best={i,score};
    });
    return best.i;
  }
  function val(obj,key){for(const a of aliases[key]||[]){if(obj[a]!==undefined&&String(obj[a]).trim()!=='')return obj[a]}return ''}
  function split(v){return String(v||'').split(/[;,|]/).map(x=>x.trim()).filter(Boolean)}
  function mapCategory(v){
    const all=typeof SUPPLIER_CATEGORIES!=='undefined'?SUPPLIER_CATEGORIES:[];
    const direct=split(v).filter(x=>all.includes(x));if(direct.length)return [...new Set(direct)];
    const s=String(v||'').toLowerCase();
    if(/food|truck|cater|coffee|ice cream|dessert|vendor/.test(s)&&all.includes('Food Vendor'))return ['Food Vendor'];
    if(/bar|beverage|drink/.test(s)&&all.includes('Bars & Beverage'))return ['Bars & Beverage'];
    return [];
  }
  function mapRegion(v){
    const all=typeof SUPPLIER_REGIONS!=='undefined'?SUPPLIER_REGIONS:[];
    const out=[];split(v).forEach(x=>{
      let r=x;
      if(/hamilton|cambridge|te awamutu|matamata|morrinsville|waikato/i.test(r))r='Waikato';
      if(all.includes(r))out.push(r);
    });
    return [...new Set(out)];
  }
  function esc2(v){return typeof esc==='function'?esc(String(v??'')):String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
  window.previewSupplierImport=function(matrix,fileName){
    const modal=document.getElementById('importSupplierModal'),body=document.getElementById('supplierImportBody');if(!modal||!body)return;
    modal.classList.remove('hidden');
    if(!Array.isArray(matrix)||!matrix.length){body.innerHTML='<div class="empty-state">No supplier rows found.</div>';return}
    const hi=findHeaderRow(matrix),headers=(matrix[hi]||[]).map(norm);
    const existing=new Set((typeof suppliers!=='undefined'?suppliers:[]).map(s=>(s.company||'').trim().toLowerCase()+'|'+(s.email||'').trim().toLowerCase()));
    const parsed=[];let invalid=0,dupes=0;
    matrix.slice(hi+1).forEach((row,n)=>{
      const x={};headers.forEach((h,i)=>{if(h)x[h]=row?.[i]??''});
      const company=String(val(x,'company')).trim(),email=String(val(x,'email')).trim();
      if(!company&&!email)return;
      let categories=mapCategory(val(x,'category'));let regions=mapRegion(val(x,'region'));
      // Sensible defaults for purpose-built lists such as Waikato food-truck contact sheets.
      const context=(String(fileName||'')+' '+company+' '+String(val(x,'category'))).toLowerCase();
      if(!categories.length&&/food.?truck|food.?vendor|cater/.test(context))categories=['Food Vendor'];
      if(!regions.length&&/waikato|hamilton|cambridge|te.?awamutu|matamata|morrinsville/.test(context))regions=['Waikato'];
      const duplicate=existing.has(company.toLowerCase()+'|'+email.toLowerCase());
      const errors=[];if(!company)errors.push('Company missing');if(!categories.length)errors.push('Category missing/unknown');if(!regions.length)errors.push('Region missing/unknown');
      if(duplicate)dupes++;if(errors.length)invalid++;
      parsed.push({line:hi+n+2,company,email,phone:String(val(x,'phone')).trim(),website:String(val(x,'website')).trim(),contact:String(val(x,'contact')).trim(),categories,regions,minimum:Number(val(x,'minimum')||0)||0,eventSize:Number(val(x,'eventSize')||0)||0,capabilities:String(val(x,'capabilities')).trim(),insurance:String(val(x,'insurance')||'TBD').trim()||'TBD',notifications:String(val(x,'notifications')||'all').trim()||'all',duplicate,errors});
    });
    const ready=parsed.filter(x=>!x.duplicate&&!x.errors.length);window.__siteplanSupplierImport=ready;
    body.innerHTML=`<div style="color:var(--muted);font-size:12px">${esc2(fileName)}</div><div class="import-summary"><div class="import-stat"><small>Rows found</small><b>${parsed.length}</b></div><div class="import-stat"><small>Ready</small><b class="import-good">${ready.length}</b></div><div class="import-stat"><small>Duplicates</small><b>${dupes}</b></div><div class="import-stat"><small>Needs attention</small><b class="${invalid?'import-bad':''}">${invalid}</b></div></div><div class="import-table-wrap"><table class="import-table"><thead><tr><th>Company</th><th>Category</th><th>Region</th><th>Status</th></tr></thead><tbody>${parsed.slice(0,200).map(x=>`<tr><td>${esc2(x.company||'—')}</td><td>${esc2(x.categories.join(', ')||'—')}</td><td>${esc2(x.regions.join(', ')||'—')}</td><td>${x.duplicate?'Duplicate':x.errors.length?`<span class="import-bad">${esc2(x.errors.join(', '))}</span>`:'<span class="import-good">Ready</span>'}</td></tr>`).join('')}</tbody></table></div><div style="display:flex;gap:8px;justify-content:flex-end;margin-top:14px"><button class="btn" id="cancelSupplierImport">Cancel</button><button class="btn primary" id="confirmSupplierImport" ${ready.length?'':'disabled'}>Import ${ready.length} suppliers</button></div>`;
    document.getElementById('cancelSupplierImport').onclick=()=>modal.classList.add('hidden');
    document.getElementById('confirmSupplierImport').onclick=()=>typeof importSupplierRows==='function'&&importSupplierRows();
  };
})();
