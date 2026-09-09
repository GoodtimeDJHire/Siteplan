// SitePlan V72: mobile-only compact header + venue search dropdown
(()=>{
const style=document.createElement('style');style.textContent=`
.sp-mobile-search-toggle{display:none}
@media(max-width:900px){
 header{align-items:center!important}
 header .search-wrap{display:none!important;order:6!important;width:100%!important;flex-basis:100%!important;margin:0!important}
 header.sp-search-open .search-wrap{display:flex!important}
 .sp-mobile-search-toggle{display:inline-flex!important;order:4;align-items:center;justify-content:center;min-height:40px;border:1px solid var(--line);background:var(--panel2);color:var(--text);border-radius:10px;padding:8px 11px;font-size:11px;font-weight:900}
 header .event-name{order:3!important;flex:1 1 180px!important;width:auto!important;min-width:140px!important}
 header .nav-tabs{order:5!important}
 header .top-actions{order:2!important}
}
@media(max-width:560px){
 header .event-name{flex:1 1 calc(100% - 105px)!important;max-width:none!important}
 .sp-mobile-search-toggle{flex:0 0 auto}
 header .search-wrap{padding-top:2px!important}
 header .search-wrap .place-host,header .search-wrap gmp-place-autocomplete{width:100%!important;max-width:100%!important}
}
`;document.head.appendChild(style);
const header=document.querySelector('#app header');if(!header)return;
const btn=document.createElement('button');btn.type='button';btn.className='sp-mobile-search-toggle';btn.textContent='⌕ Venue';btn.setAttribute('aria-expanded','false');
const eventName=header.querySelector('.event-name');if(eventName)eventName.insertAdjacentElement('afterend',btn);else header.appendChild(btn);
btn.addEventListener('click',()=>{const open=header.classList.toggle('sp-search-open');btn.setAttribute('aria-expanded',String(open));btn.textContent=open?'× Close search':'⌕ Venue';if(open)setTimeout(()=>header.querySelector('gmp-place-autocomplete input,input')?.focus(),80)});
})();
