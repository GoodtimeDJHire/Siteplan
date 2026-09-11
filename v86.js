// SitePlan V86: secure public read-only map sharing
(()=>{
'use strict';
const SHARE_KEY='siteplan_public_map_tokens_v1';
const escHtml=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
function savedTokens(){try{return JSON.parse(localStorage.getItem(SHARE_KEY)||'{}')}catch{return {}}}
function saveToken(eventId,token){const x=savedTokens();if(token)x[eventId]=token;else delete x[eventId];localStorage.setItem(SHARE_KEY,JSON.stringify(x))}
async function sessionToken(){try{return (await siteplanCloud.auth.getSession()).data?.session?.access_token||''}catch{return ''}}
async function shareRequest(method,eventId){
 const token=await sessionToken();if(!token)throw new Error('Sign in before sharing a map.');
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);let r;
 try{r=await fetch('/api/public-map-share',{method,headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`},body:JSON.stringify({eventId}),signal:controller.signal})}
 catch(error){if(error?.name==='AbortError')throw new Error('Map sharing timed out. Please try again.');throw error}
 finally{clearTimeout(timer)}
 const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'Could not update map sharing.');return d;
}
function shareButton(){
 const actions=document.querySelector('header .top-actions');if(!actions||document.getElementById('shareMapBtn'))return;
 const btn=document.createElement('button');btn.className='btn';btn.id='shareMapBtn';btn.type='button';btn.textContent='Share map';
 const print=document.getElementById('printBtn');if(print)actions.insertBefore(btn,print);else actions.appendChild(btn);
 btn.onclick=openShareMap;
}
async function openShareMap(){
 const evt=typeof activeEvent==='function'?activeEvent():null;if(!evt?.id){toast('Open an event first');return}
 try{if(typeof savePlan==='function')savePlan(false)}catch(e){}
 const btn=document.getElementById('shareMapBtn');if(btn){btn.disabled=true;btn.textContent='Preparing…'}
 try{
  const d=await shareRequest('POST',evt.id);saveToken(evt.id,d.token);
  const q=document.getElementById('quoteModalContent');
  q.style.width='min(680px,96vw)';q.style.maxWidth='680px';q.style.padding='24px';q.style.background='var(--panel)';
  q.innerHTML=`<div class="modal-head"><div><h2 style="margin:0">Share read-only map</h2><small>${escHtml(evt.name||'Event')} · anyone with the link can view</small></div><button class="btn" onclick="document.getElementById('quoteModal').classList.add('hidden')">×</button></div><div class="empty" style="margin-bottom:14px">This link opens only the event map. No SitePlan account is required and viewers cannot edit anything.</div><div class="copy-link-box" id="publicMapShareLink">${escHtml(d.url)}</div><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px"><button class="btn primary" id="copyPublicMapBtn">Copy map link</button><button class="btn" id="openPublicMapBtn">Open preview</button><button class="btn danger" id="disablePublicMapBtn">Disable link</button></div><div style="color:var(--muted);font-size:11px;margin-top:14px">Opening Share map again refreshes this public view with the latest saved site plan while keeping the same link.</div>`;
  document.getElementById('quoteModal').classList.remove('hidden');
  document.getElementById('copyPublicMapBtn').onclick=async()=>{await navigator.clipboard.writeText(d.url);toast('Map link copied')};
  document.getElementById('openPublicMapBtn').onclick=()=>window.open(d.url,'_blank','noopener');
  document.getElementById('disablePublicMapBtn').onclick=async()=>{if(!confirm('Disable this public map link?'))return;try{await shareRequest('DELETE',evt.id);saveToken(evt.id,'');document.getElementById('quoteModal').classList.add('hidden');toast('Public map link disabled')}catch(e){toast(e.message)}};
 }catch(e){toast(e.message||'Could not share map')}finally{if(btn){btn.disabled=false;btn.textContent='Share map'}}
}
async function showPublicMap(token){
 const marketing=document.getElementById('marketingHome');if(marketing)marketing.classList.add('hidden');
 try{
  await startSitePlan();
  const r=await fetch('/api/public-map-share?token='+encodeURIComponent(token),{cache:'no-store'});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'This shared map is unavailable.');
  const s=d.share||{},plan=s.plan||{},mapId='publicSharedMap';
  const q=document.getElementById('quoteModalContent');
  q.style.width='min(1500px,98vw)';q.style.maxWidth='1500px';q.style.height='auto';q.style.maxHeight='96vh';q.style.padding='0';q.style.overflow='hidden';q.style.background='var(--panel)';q.style.borderRadius='18px';
  q.innerHTML=`<div class="readonly-builder-shell"><div class="readonly-builder-head"><div><div class="rb-event">${escHtml(s.eventName||'Event')}</div><div class="rb-sub">Shared SitePlan · interactive read-only map${s.venue?' · '+escHtml(s.venue):''}</div></div><div class="readonly-builder-head-actions"><span class="readonly-chip">● READ ONLY</span></div></div><div class="readonly-builder-workspace"><main class="readonly-builder-map-wrap">${plan&&((plan.markers||[]).length||(plan.shapes||[]).length)?`<div id="${mapId}" class="readonly-builder-map"></div>`:'<div class="empty" style="position:absolute;left:20px;right:20px;top:20px">No map objects have been saved for this event yet.</div>'}<div class="readonly-builder-stats"><div class="stat"><b>${(plan.markers||[]).length}</b> objects</div><div class="stat"><b>${(plan.shapes||[]).filter(x=>String(x.type||'').toLowerCase().includes('barrier')).length}</b> barriers</div><div class="stat"><b>${(plan.shapes||[]).filter(x=>['zone','area','polygon','coloured-area','colored-area'].includes(String(x.type||'').toLowerCase())).length}</b> zones</div></div></main><aside class="readonly-builder-inspector"><div class="section-title">Selected item</div><div class="empty readonly-builder-empty" id="${mapId}_empty">Click an icon, route, barrier or coloured zone to view its details and measurements.</div><div id="${mapId}_inspector"></div></aside></div></div>`;
  document.getElementById('quoteModal').classList.remove('hidden');
  if(plan&&((plan.markers||[]).length||(plan.shapes||[]).length))requestAnimationFrame(()=>requestAnimationFrame(()=>renderReadOnlyPlanMap(mapId,plan,true)));
 }catch(e){
  const q=document.getElementById('quoteModalContent');if(q){q.style.padding='26px';q.innerHTML=`<div class="empty"><b>Shared map unavailable.</b><br>${escHtml(e.message||'The link may have been disabled.')}</div>`;document.getElementById('quoteModal').classList.remove('hidden')}
 }
}
const originalAuthInit=window.siteplanAuthInit||siteplanAuthInit;
siteplanAuthInit=async function(){const p=new URLSearchParams(location.hash.replace(/^#/,''));const token=p.get('map');if(token){await showPublicMap(token);return}return originalAuthInit.apply(this,arguments)};
shareButton();
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',shareButton);else setTimeout(shareButton,0);
})();
