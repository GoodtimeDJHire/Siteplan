// SitePlan V78: reliable tender sent counts + active event title
(()=>{
const HISTORY_KEY='siteplan_tender_send_history_v1';
const memoryCounts=new Map();
const css=document.createElement('style');
css.textContent=`.tenders-active-event{display:inline-flex;align-items:center;margin-left:14px;padding:7px 11px;border:1px solid var(--line);border-radius:999px;color:var(--green);font-size:13px;font-weight:850;vertical-align:middle}.tenders-active-event:empty{display:none}@media(max-width:700px){.tenders-active-event{display:flex;width:max-content;margin:7px 0 0;font-size:12px}}`;
document.head.appendChild(css);
function history(){try{return JSON.parse(localStorage.getItem(HISTORY_KEY)||'{}')}catch{return {}}}
function localCount(id){const rows=history()[id];if(!Array.isArray(rows))return 0;return new Set(rows.map(r=>String(r.recipient_email||'').trim().toLowerCase()).filter(Boolean)).size}
function tenderId(card){const view=[...card.querySelectorAll('button')].find(b=>(b.textContent||'').trim()==='View');return (view?.getAttribute('onclick')||'').match(/openTenderView\(['\"]([^'\"]+)['\"]\)/)?.[1]||''}
function sentButton(card){return [...card.querySelectorAll('button')].find(b=>b.classList.contains('sent-to-btn')||(b.textContent||'').trim().startsWith('Sent to'))}
function renderCount(btn,id,n){if(!btn||!id||!Number.isFinite(n)||n<1)return;const best=Math.max(n,memoryCounts.get(id)||0);memoryCounts.set(id,best);btn.textContent=`Sent to ${best}`}
function applyKnownCounts(){document.querySelectorAll('#tenderList .tender').forEach(card=>{const id=tenderId(card),btn=sentButton(card);if(!id||!btn)return;const n=Math.max(localCount(id),memoryCounts.get(id)||0);if(n>0)renderCount(btn,id,n)})}
async function enrichCounts(){applyKnownCounts();try{if(typeof siteplanCloud==='undefined')return;const session=(await siteplanCloud.auth.getSession()).data?.session,token=session?.access_token;if(!token)return;await Promise.all([...document.querySelectorAll('#tenderList .tender')].map(async card=>{const id=tenderId(card),btn=sentButton(card);if(!id||!btn)return;try{const r=await fetch(`/api/tender-recipients?tenderId=${encodeURIComponent(id)}`,{headers:{Authorization:`Bearer ${token}`},cache:'no-store'}),d=await r.json();if(!r.ok)return;const emails=new Set((d.recipients||[]).map(x=>String(x.recipient_email||'').trim().toLowerCase()).filter(Boolean));const n=Math.max(localCount(id),emails.size,memoryCounts.get(id)||0);if(n>0)renderCount(btn,id,n)}catch{}}))}catch{}}
function eventName(){const input=document.getElementById('eventName');if(input?.value?.trim())return input.value.trim();try{if(typeof currentEventId!=='undefined'&&typeof events!=='undefined'){const e=(events||[]).find(x=>String(x.id)===String(currentEventId));return String(e?.name||e?.eventName||'').trim()}}catch{}return ''}
function showEventTitle(){const list=document.getElementById('tenderList');if(!list)return;let root=list.closest('section')||list.parentElement?.parentElement||document;const heading=[...root.querySelectorAll('h1,h2')].find(h=>(h.textContent||'').includes('Tenders & Quotes'))||[...document.querySelectorAll('h1,h2')].find(h=>(h.textContent||'').includes('Tenders & Quotes'));if(!heading)return;let badge=heading.querySelector('.tenders-active-event');if(!badge){badge=document.createElement('span');badge.className='tenders-active-event';heading.appendChild(badge)}const name=eventName();badge.textContent=name?`Event: ${name}`:''}
let timer=0;function refresh(){clearTimeout(timer);timer=setTimeout(()=>{showEventTitle();enrichCounts()},100)}
const host=document.getElementById('tenderList');if(host)new MutationObserver(mutations=>{if(mutations.some(m=>m.type==='childList'&&[...m.addedNodes].some(n=>n.nodeType===1)))refresh()}).observe(host,{childList:true,subtree:true});
document.addEventListener('click',e=>{if(e.target.closest('[data-module="tenders"],#navTenders,.mobile-nav-tenders'))setTimeout(refresh,80)},true);
window.addEventListener('storage',e=>{if(e.key===HISTORY_KEY)refresh()});
setTimeout(refresh,150);setTimeout(refresh,900);
})();
