// SitePlan V90: visual UX refinement only — no application logic/state/backend changes.
(()=>{
'use strict';
const style=document.createElement('style');
style.textContent=`
:root{--sp-accent:#b7ff4a;--sp-bg:#090c0f;--sp-panel:#101419;--sp-panel2:#151a20;--sp-line:#252d35;--sp-soft:#89949f}
body{background:var(--sp-bg)}
.btn{transition:background .15s,border-color .15s,transform .15s}.btn:hover{transform:translateY(-1px)}
header{background:rgba(9,12,15,.97)!important;border-color:var(--sp-line)!important;box-shadow:0 8px 28px rgba(0,0,0,.16)}
header .event-name{background:#11171c!important;border-color:#29323b!important;font-weight:800!important}
header .nav-tab{border:0!important;background:transparent!important;border-radius:8px!important}
header .nav-tab.active{background:#1a2128!important;color:var(--sp-accent)!important}
.workspace{background:#0b0f13!important}
.sidebar,.inspector{background:#0d1216!important}
.sidebar{padding:14px!important;border-color:var(--sp-line)!important}
.inspector{border-color:var(--sp-line)!important}
.section-title{color:#77838e!important;font-size:10px!important;letter-spacing:.14em!important}
.icon-search{background:#12181e!important;border-color:#29323b!important}
.object-grid{gap:6px!important}
.object-btn{background:#12181e!important;border-color:#252e37!important;border-radius:9px!important}
.object-btn:hover{background:#182027!important;border-color:#43505c!important}
.object-btn .ico{background:#1c252c!important;color:var(--sp-accent)!important}
.tool{background:#12181e!important;border-color:#252e37!important}
.tool:hover{background:#182027!important}.tool.active{background:#172019!important;color:var(--sp-accent)!important;border-color:#668f31!important}
.map-tip,.stat{background:rgba(10,14,17,.9)!important;backdrop-filter:blur(14px)}
.inspector .empty{background:#10161b!important;border-color:#2b343d!important}
.inspector .field input,.inspector .field select{background:#12181e!important;border-color:#29323b!important}
.summary{border-color:#252e37!important}
.dashboard,.procure{background:#0b0f13!important;padding:30px!important}
.dashboard-inner,.procure-inner{max-width:1240px!important}
.page-head{align-items:center!important;margin-bottom:26px!important}
.page-head h1{font-size:32px!important;letter-spacing:-.045em!important}
.page-head p{font-size:13px!important;max-width:680px!important}
.cards{gap:10px!important}.metric{background:#10161b!important;border-color:#252e37!important;border-radius:13px!important}.metric b{font-size:24px!important}
.event-grid{gap:12px!important}.event-card{background:#10161b!important;border-color:#252e37!important;border-radius:14px!important}.event-card:hover{border-color:#475560!important}
.event-thumb{height:138px!important}.event-body{padding:15px!important}
.tender{background:#10161b!important;border-color:#252e37!important;border-radius:12px!important}
.modal{backdrop-filter:blur(5px)}.modal-card{background:#10151a!important;border-color:#2a343d!important}
.form-grid .field input,.form-grid .field select,.form-grid .field textarea{background:#12181e!important;border-color:#29323b!important}
.quote-card{border-color:#29323b!important;background:#0e1318!important}
.supplier-directory-tools input,.supplier-directory-tools select{background:#10161b!important;border-color:#29323b!important}
.supplier-group{background:#10161b!important;border-color:#252e37!important}
.marketing-home{background:radial-gradient(circle at 18% 8%,rgba(183,255,74,.09),transparent 27%),linear-gradient(180deg,#080b0e,#0b1014)!important}
.marketing-preview,.feature-card,.workflow-step,.cta-box{border-color:#252e37!important}
@media(max-width:1200px){.dashboard,.procure{padding:22px!important}}
@media(max-width:760px){.dashboard,.procure{padding:16px!important}.page-head{align-items:flex-start!important}.page-head h1{font-size:27px!important}.cards{grid-template-columns:1fr 1fr!important}}
`;
document.head.appendChild(style);
})();