// SitePlan V81: free-text map labels
(()=>{
'use strict';

// Add a dedicated text-only object to the normal map object palette.
if(typeof OBJECT_TYPES!=='undefined' && !OBJECT_TYPES.some(x=>x[0]==='label')){
  OBJECT_TYPES.unshift(['label','T','Text label','#ffffff']);
}

const oldMarkerContent=typeof markerContent==='function'?markerContent:null;
if(oldMarkerContent){
  markerContent=function(item){
    if(item?.type!=='label') return oldMarkerContent(item);
    const el=document.createElement('div');
    el.className='site-marker site-text-label';
    el.innerHTML=`<div class="ml">${String(item.name||'Label').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}</div>`;
    return el;
  };
}

const oldAddMarker=typeof addMarker==='function'?addMarker:null;
if(oldAddMarker){
  addMarker=function(type,position,data={}){
    if(type!=='label') return oldAddMarker(type,position,data);
    const supplied=String(data?.name||'').trim();
    const text=supplied || (isRestoringPlan ? 'Label' : (prompt('Label text','')||'').trim());
    if(!text && !isRestoringPlan){
      pendingObjectType=null;
      byId('mapTip')?.classList.remove('show');
      return null;
    }
    const item=oldAddMarker(type,position,{...data,name:text||'Label'});
    if(item && !isRestoringPlan){
      setTimeout(()=>{
        const input=byId('selName');
        if(input){input.focus();input.select();}
      },0);
    }
    return item;
  };
}

const style=document.createElement('style');
style.textContent=`
.site-marker.site-text-label{
  min-width:0!important;width:auto!important;height:auto!important;
  padding:5px 8px!important;border-radius:5px!important;
  background:rgba(255,255,255,.94)!important;border:1px solid rgba(17,24,39,.35)!important;
  box-shadow:0 2px 7px rgba(0,0,0,.30)!important;
  color:#111827!important;display:block!important;white-space:nowrap!important;
  transform-origin:center bottom;
}
.site-marker.site-text-label .ml{
  position:static!important;transform:none!important;background:transparent!important;
  color:#111827!important;padding:0!important;border-radius:0!important;
  box-shadow:none!important;font-size:11px!important;font-weight:850!important;
  text-transform:none!important;max-width:none!important;overflow:visible!important;
  text-overflow:clip!important;white-space:pre!important;line-height:1.15!important;
}
.site-marker.site-text-label.selected{
  box-shadow:0 0 0 3px rgba(168,255,53,.45),0 3px 10px rgba(0,0,0,.35)!important;
}
.object-btn[data-search*="text label"] .ico{background:#fff!important;color:#111827!important;font-weight:1000!important}
`;
document.head.appendChild(style);
})();
