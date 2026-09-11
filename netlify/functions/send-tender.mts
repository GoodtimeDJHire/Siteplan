import type { Context, Config } from "@netlify/functions";

const SUPABASE_URL = "https://qkvkemcqfnbmaktbxddg.supabase.co";
const SUPABASE_KEY = "sb_publishable_tiPl-Y7wvfrpB7RzNzOBVA_CMIGBTwA";

const aliases: Record<string, string[]> = {"Catering / Bar":["Food Vendor","Bars & Beverage"],"Generators":["Power & Generators"],"Toilets":["Toilets & Sanitation"],"Marquees":["Marquees & Structures"],"Sound & Lighting":["Production / AV"],"Staging":["Production / AV"],"Custom":["Other"]};
const regionAliases: Record<string,string>={"New Plymouth":"Taranaki","Manawatu":"Manawatu-Whanganui","Kapiti Coast":"Wellington","Wairarapa":"Wellington"};
const clean=(v:any)=>String(v??"").replace(/[<>&]/g,"");
const escapeHtml=(v:any)=>String(v??"").replace(/[&<>\"']/g,(m)=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]||m));
function normalizeRegion(v:any){const x=String(v||"");return regionAliases[x]||x}
function categoryMatches(s:any,t:any){const wanted=aliases[t.category]||[t.category];return(s.categories||[]).some((c:string)=>wanted.includes(c))}
function regionMatches(s:any,t:any){const wanted=normalizeRegion(t.region||"Wellington"),covered=(s.regions||[]).map(normalizeRegion);return covered.includes("Nationwide")||covered.includes(wanted)}
function score(s:any,t:any){let n=0;if(categoryMatches(s,t))n+=60;if(regionMatches(s,t))n+=25;if(s.insurance==="Yes")n+=5;if(!Number(s.minimum)||!Number(t.estimated_value)||Number(t.estimated_value)>=Number(s.minimum))n+=5;if(!Number(s.event_size)||!Number(t.attendance)||Number(t.attendance)<=Number(s.event_size))n+=5;return n}
async function supabaseGet(path:string,jwt:string){const r=await fetch(`${SUPABASE_URL}/rest/v1/${path}`,{headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${jwt}`,Accept:"application/json"}});if(!r.ok)throw new Error(`Database request failed (${r.status})`);return r.json()}
async function supabaseInsert(path:string,rows:any[],jwt:string){const r=await fetch(`${SUPABASE_URL}/rest/v1/${path}`,{method:"POST",headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${jwt}`,"Content-Type":"application/json",Prefer:"return=minimal"},body:JSON.stringify(rows)});if(!r.ok)throw new Error(`Database insert failed (${r.status}): ${await r.text()}`)}

export default async(req:Request,_context:Context)=>{
 if(req.method!=="POST")return new Response("Method not allowed",{status:405});
 try{
  const jwt=(req.headers.get("authorization")||"").replace(/^Bearer\s+/i,"").trim();if(!jwt)return Response.json({error:"Sign in before sending a tender."},{status:401});
  const ur=await fetch(`${SUPABASE_URL}/auth/v1/user`,{headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${jwt}`}});if(!ur.ok)return Response.json({error:"Your SitePlan session has expired. Please sign in again."},{status:401});const user=await ur.json();
  const body=await req.json().catch(()=>({})),tenderId=String(body.tenderId||"").trim(),ids=Array.isArray(body.supplierIds)?body.supplierIds.map((x:any)=>String(x||"").trim()).filter(Boolean):[];if(!tenderId)return Response.json({error:"Tender ID is required."},{status:400});if(!ids.length)return Response.json({error:"Select at least one supplier to receive this tender."},{status:400});
  const tr=await supabaseGet(`tenders?id=eq.${encodeURIComponent(tenderId)}&select=*`,jwt),t=tr?.[0];if(!t)return Response.json({error:"Tender not found or you do not have access."},{status:404});if(!["published","draft"].includes(String(t.status||"")))return Response.json({error:"Only draft or open tenders can be emailed."},{status:400});
  const suppliers=await supabaseGet("suppliers?select=*&active=eq.true",jwt),matched=(suppliers||[]).filter((s:any)=>s.email&&s.notifications!=="off"&&categoryMatches(s,t)&&regionMatches(s,t)&&(s.notifications!=="high"||score(s,t)>=85));const selected=new Set(ids),recipients=matched.filter((s:any)=>selected.has(String(s.id)));if(!recipients.length)return Response.json({error:"None of the selected suppliers are eligible matching recipients with an email address."},{status:400});
  let eventName="your event";if(t.event_id){const er=await supabaseGet(`events?id=eq.${encodeURIComponent(t.event_id)}&select=name`,jwt);if(er?.[0]?.name)eventName=er[0].name}
  const apiKey=Netlify.env.get("RESEND_API_KEY");if(!apiKey)return Response.json({error:"Tender email sending is not configured yet."},{status:503});
  const origin=new URL(req.url).origin,link=`${origin}/#tender=${encodeURIComponent(t.public_token)}`,due=t.due_at?new Date(t.due_at).toLocaleDateString("en-NZ",{day:"numeric",month:"long",year:"numeric",timeZone:"Pacific/Auckland"}):"Not specified";
  const organiserName=clean(user.user_metadata?.full_name||user.user_metadata?.name||user.email?.split('@')[0]||"Event organiser");
  const customSubject=String(body.subject||"").trim().slice(0,180);
  const customMessage=String(body.message||"").trim().slice(0,12000);
  const defaultSubject=`${clean(eventName)} – ${clean(t.title)}`;
  const defaultMessage=`Hi,\n\n${organiserName} is inviting you to provide a quote for ${clean(t.title)} for ${clean(eventName)}.\n\nService: ${clean(t.category||"Supplier")}\nLocation/region: ${clean(t.region||"Not specified")}\nQuote due: ${due}\n\nTender details and quote submission:\n${link}\n\nIf you'd rather reply by email, just reply to this message and it will go directly to ${organiserName}.\n\nRegards,\n${organiserName}\nSent via SitePlan`;
  const subject=customSubject||defaultSubject;
  const text=customMessage||defaultMessage;
  const emails=recipients.map((s:any)=>{
   const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="margin:0;background:#fff;font-family:Arial,Helvetica,sans-serif;color:#202124"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding:24px 16px"><table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;margin:0 auto"><tr><td style="font-size:15px;line-height:24px;color:#202124;white-space:pre-wrap">${escapeHtml(text).replace(/\n/g,"<br>")}</td></tr></table></td></tr></table></body></html>`;
   return{from:"SitePlan <tenders@goodtimedjhire.co.nz>",to:[s.email],subject,text,html,tags:[{name:"siteplan_tender",value:String(t.id)},{name:"siteplan_supplier",value:String(s.id)}],...(user.email?{reply_to:[user.email]}:{})}
  });
  const sr=await fetch("https://api.resend.com/emails/batch",{method:"POST",headers:{Authorization:`Bearer ${apiKey}`,"Content-Type":"application/json"},body:JSON.stringify(emails)}),sd=await sr.json().catch(()=>({}));if(!sr.ok){console.error("Resend error",sd);return Response.json({error:sd?.message||"Email delivery request failed."},{status:502})}
  const rr=Array.isArray(sd?.data)?sd.data:[],now=new Date().toISOString(),tracking=recipients.map((s:any,i:number)=>({tender_id:t.id,owner_id:user.id,supplier_id:s.id||null,company_name:s.company_name||"Supplier",recipient_email:s.email,resend_email_id:rr[i]?.id||null,status:"sent",sent_at:now,updated_at:now}));try{await supabaseInsert("tender_email_deliveries",tracking,jwt)}catch(e){console.error("Tender delivery tracking insert failed",e)}
  return Response.json({ok:true,sent:recipients.length,recipients:recipients.map((s:any,i:number)=>({company:s.company_name,email:s.email,deliveryId:rr[i]?.id||null}))});
 }catch(error:any){console.error("send-tender",error);return Response.json({error:error?.message||"Tender email could not be sent."},{status:500})}
};
export const config:Config={path:"/api/send-tender"};
