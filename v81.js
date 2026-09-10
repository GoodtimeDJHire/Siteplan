// SitePlan V81: free-text map labels
(()=>{
'use strict';

// Add a dedicated text object to the normal map object palette.
if(typeof OBJECT_TYPES!=='undefined' && !OBJECT_TYPES.some(x=>x[0]==='label')){
  OBJECT_TYPES.unshift(['label','T','Text label','#ffffff']);
}

const oldMarkerContent=typeof markerContent==='function'?markerContent:null;
if(oldMarkerContent){
  markerContent=function(item){
    if(item?.type!=='label') return oldMarkerContent(item);
    const safe=String(item.name||'Label').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
    const el=document.createElement('div');
    el.className='site-marker site-text-label';
    el.innerHTML=`<div class="mi">T</div><div class="ml">${safe}</div>`;
    return el;
  };
}

const oldAddMarker=typeof addMarker==='function'?addMarker:null;
if(oldAddMarker){
  addMarker=function(type,position,data={}){
    if(type!=='label') return oldAddMarker(type,position,data);
    const supplied=String(data?.name||'').trim();
    const text=supplied || (isRestoringPlan ? 'Label' : (prompt('Label text','')||'').trim());
    if(!text && !isRestoringPlan){pendingObjectType=null;byId('mapTip')?.classList.remove('show');return null;}
    const item=oldAddMarker(type,position,{...data,name:text||'Label'});
    if(item && !isRestoringPlan){setTimeout(()=>{const input=byId('selName');if(input){input.focus();input.select();}},0);}
    return item;
  };
}

const style=document.createElement('style');
style.textContent=`
.site-marker.site-text-label{
  min-width:42px!important;width:42px!important;height:42px!important;padding:0!important;
  border-radius:999px!important;background:#ffffff!important;border:3px solid #a8ff35!important;
  box-shadow:0 3px 10px rgba(0,0,0,.45)!important;color:#111827!important;
  display:flex!important;align-items:center!important;justify-content:center!important;
}
.site-marker.site-text-label .mi{font-size:15px!important;font-weight:1000!important;line-height:1!important;color:#111827!important}
.site-marker.site-text-label .ml{
  position:absolute!important;transform:translateY(33px)!important;background:#fff!important;
  color:#151719!important;padding:3px 5px!important;border-radius:4px!important;
  font-size:7px!important;font-weight:900!important;text-transform:none!important;
  max-width:140px!important;white-space:nowrap!important;overflow:hidden!important;
  text-overflow:ellipsis!important;box-shadow:0 2px 5px rgba(0,0,0,.25)!important;
}
.site-marker.site-text-label.selected{box-shadow:0 0 0 4px rgba(168,255,53,.35),0 5px 14px rgba(0,0,0,.5)!important;transform:scale(1.12)}
.object-btn[data-search*="text label"] .ico{background:#252c34!important;color:#a8ff35!important;font-weight:1000!important}
`;
document.head.appendChild(style);
})();
