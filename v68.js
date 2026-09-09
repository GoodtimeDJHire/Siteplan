// SitePlan V68: comprehensive mobile layout pass
(()=>{
const style=document.createElement('style');
style.textContent=`
@media(max-width:900px){
  html,body{height:auto!important;min-height:100%!important;overflow:auto!important;-webkit-overflow-scrolling:touch}
  .app{height:auto!important;min-height:100vh!important;display:block!important}
  header{height:auto!important;min-height:64px!important;padding:10px 12px!important;display:flex!important;flex-wrap:wrap!important;gap:8px!important;position:sticky!important;top:0!important;z-index:120!important}
  .brand{order:1;max-width:calc(100% - 90px)}
  .event-name{order:3;flex:1 1 100%!important;min-width:0!important;width:100%!important}
  .search-wrap{order:4;flex:1 1 100%!important;min-width:0!important;width:100%!important}
  .top-actions{order:2;margin-left:auto;display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}
  .top-actions .btn{padding:9px 10px;font-size:12px}
  .nav-tabs{order:5;width:100%;overflow-x:auto;display:flex;gap:6px;margin:0;padding-bottom:2px;scrollbar-width:none}
  .nav-tabs::-webkit-scrollbar{display:none}.nav-tab{flex:0 0 auto;white-space:nowrap;padding:9px 10px}

  .module{height:auto!important;min-height:0!important}
  .workspace{display:flex!important;flex-direction:column!important;min-height:0!important}
  .map-wrap{order:1!important;position:relative!important;height:62vh!important;min-height:420px!important;width:100%!important}
  .sidebar{order:2!important;width:100%!important;max-height:none!important;overflow:visible!important;border-right:0!important;border-top:1px solid var(--line)!important;padding:14px!important}
  .inspector{order:3!important;width:100%!important;max-height:none!important;overflow:visible!important;border-left:0!important;border-top:1px solid var(--line)!important;padding:14px!important}
  .object-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important}
  .object-btn{min-height:48px!important}
  .stats{left:8px!important;right:8px!important;bottom:8px!important}.stat{font-size:10px!important;padding:7px 9px!important}
  .map-tip,.draw-banner{max-width:calc(100vw - 24px)!important;white-space:normal!important;text-align:center!important}

  .procure{padding:16px 12px!important;overflow:visible!important}.procure-inner{max-width:none!important}.page-head{align-items:flex-start!important;flex-direction:column!important;gap:12px!important}.page-head h1{font-size:25px!important}.page-head .btn{width:100%!important}
  .cards{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important}.metric{padding:13px!important}.metric b{font-size:21px!important}
  .tender{grid-template-columns:1fr!important;gap:10px!important;padding:14px!important}.tender h3{font-size:16px!important}.tender-actions{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;width:100%!important;gap:7px!important}.tender-actions .btn{width:100%!important;padding:10px 8px!important}.tender-actions .primary{grid-column:1/-1!important}

  .modal{padding:8px!important;align-items:start!important;overflow:auto!important}.modal-card{width:100%!important;max-width:100%!important;max-height:none!important;min-height:0!important;border-radius:16px!important;padding:16px!important;margin:8px 0 24px!important;overflow:visible!important}.modal-head{align-items:flex-start!important;gap:10px!important}.modal-head h2{font-size:22px!important;line-height:1.15!important}.form-grid{grid-template-columns:1fr!important}.form-grid .full{grid-column:auto!important}.req-row{grid-template-columns:1fr 64px!important}.req-row>*:nth-child(3){grid-column:1/2}.req-row>*:nth-child(4){grid-column:2/3;grid-row:2}
  .quote-summary-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}.quote-card{grid-template-columns:1fr!important}.quote-decision{grid-column:auto!important}.quote-decision .quote-status-actions{grid-template-columns:1fr!important}.quote-price-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:6px!important}.quote-price{padding:8px!important}.quote-price b{font-size:15px!important}
  .delivery-row,.sent-supplier-row{grid-template-columns:1fr auto!important;gap:8px!important}.delivery-time,.sent-supplier-time{grid-column:1/-1!important}

  .supplier-directory-tools{display:grid!important;grid-template-columns:1fr!important;gap:8px!important}.supplier-directory-tools>*{width:100%!important}.supplier-card,.event-card{min-width:0!important}.supplier-grid,.event-grid{grid-template-columns:1fr!important}.supplier-actions,.event-actions{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:7px!important}.supplier-actions .btn,.event-actions .btn{width:100%!important}

  table{max-width:100%!important}.quote-table-wrap,.table-wrap{overflow-x:auto!important;-webkit-overflow-scrolling:touch}.copy-link-box{overflow-wrap:anywhere!important;word-break:break-word!important}
  input,select,textarea{font-size:16px!important}
  .btn{min-height:42px}.setup{padding:14px!important}.setup-card{padding:22px 18px!important;border-radius:18px!important}.setup h1{font-size:27px!important}
}

@media(max-width:560px){
  header{padding:9px 10px!important}.brand small{display:none!important}.brand{font-size:15px!important}.brand-mark{width:30px!important;height:30px!important}
  .top-actions{width:auto}.top-actions .btn{font-size:11px!important;padding:8px!important}
  .map-wrap{height:58vh!important;min-height:360px!important}
  .cards{grid-template-columns:1fr 1fr!important}.metric{padding:11px!important}.metric span{font-size:9px!important}.metric b{font-size:19px!important}
  .object-grid{grid-template-columns:1fr 1fr!important}.object-btn{font-size:11px!important;padding:10px 7px!important}
  .tender-actions{grid-template-columns:1fr 1fr!important}
  .quote-summary-grid{grid-template-columns:1fr 1fr!important}.quote-price-grid{grid-template-columns:1fr!important}.quote-price{display:flex!important;align-items:center!important;justify-content:space-between!important}.quote-price span,.quote-price b{margin:0!important}
  .sp-send-bg{padding:8px!important;align-items:flex-start!important;overflow:auto!important}.sp-send{width:100%!important;max-height:none!important;margin:8px 0 20px!important}.sp-row{grid-template-columns:24px 1fr!important}.sp-row .hide-mobile{display:none!important}.sp-actions{display:grid!important;grid-template-columns:1fr!important}.sp-btn{width:100%!important}
  .custom-type-row{display:grid!important;grid-template-columns:1fr!important}.custom-type-row .btn{width:100%!important}
  .public-card{padding:18px!important}.public-card h1,.public-card h2{overflow-wrap:anywhere!important}
}
`;
document.head.appendChild(style);

function mobileSanity(){
 if(innerWidth>900)return;
 document.querySelectorAll('.modal-card,#quoteModalContent').forEach(el=>{el.style.maxWidth='100%';});
}
window.addEventListener('resize',mobileSanity,{passive:true});
mobileSanity();
})();
