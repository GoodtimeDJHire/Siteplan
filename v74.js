// SitePlan V74: keep mobile contractor/supplier read-only plans aligned to the saved master view
(()=>{
  const install=()=>{
    if(typeof window.renderReadOnlyPlanMap!=='function') return false;
    if(window.__siteplanV74Installed) return true;
    window.__siteplanV74Installed=true;

    const original=window.renderReadOnlyPlanMap;
    window.renderReadOnlyPlanMap=function(containerId,plan,full=false){
      original(containerId,plan,full);
      if(!window.matchMedia?.('(max-width:900px)').matches) return;

      const host=document.getElementById(containerId);
      const roMap=host?.__mapInstance;
      if(!roMap||!plan) return;

      const lat=Number(plan.center?.lat), lng=Number(plan.center?.lng);
      const zoom=Number(plan.zoom)||18;
      if(!Number.isFinite(lat)||!Number.isFinite(lng)) return;
      const center={lat,lng};

      // The base contractor renderer fits to object bounds. On a narrow phone viewport
      // that changes the apparent plan framing versus the saved builder map. Restore the
      // exact saved centre/zoom after the map/container has settled, without changing any
      // stored marker or shape coordinates.
      const restore=()=>{
        try{
          window.google?.maps?.event?.trigger?.(roMap,'resize');
          roMap.setTilt?.(0);
          roMap.setCenter(center);
          roMap.setZoom(zoom);
        }catch(e){}
      };

      requestAnimationFrame(restore);
      setTimeout(restore,120);
      setTimeout(restore,320);
    };
    return true;
  };

  if(!install()){
    let tries=0;
    const timer=setInterval(()=>{
      tries++;
      if(install()||tries>40) clearInterval(timer);
    },100);
  }
})();
