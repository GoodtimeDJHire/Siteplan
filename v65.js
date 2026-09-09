// SitePlan V65: clarify tender history section for non-current events
(()=>{
function relabelTenderHistory(){
  document.querySelectorAll('.section-title').forEach(el=>{
    const text=(el.textContent||'').trim().toLowerCase();
    if(text==='past event tender history') el.textContent='Other Event Tenders';
  });
}
relabelTenderHistory();
const oldRenderTenders=renderTenders;
renderTenders=function(){const result=oldRenderTenders.apply(this,arguments);relabelTenderHistory();return result};
})();
