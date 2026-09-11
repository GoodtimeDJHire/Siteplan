import type { Context, Config } from "@netlify/functions";

const SUPABASE_URL = "https://qkvkemcqfnbmaktbxddg.supabase.co";
const SUPABASE_KEY = "sb_publishable_tiPl-Y7wvfrpB7RzNzOBVA_CMIGBTwA";

async function supabaseGet(path:string,jwt:string){
  const r=await fetch(`${SUPABASE_URL}/rest/v1/${path}`,{headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${jwt}`,Accept:"application/json"}});
  if(!r.ok) throw new Error(`Database request failed (${r.status})`);
  return r.json();
}

export default async(req:Request,_context:Context)=>{
  if(req.method!=="GET") return new Response("Method not allowed",{status:405});
  try{
    const jwt=(req.headers.get("authorization")||"").replace(/^Bearer\s+/i,"").trim();
    if(!jwt) return Response.json({error:"Please sign in first."},{status:401});
    const ur=await fetch(`${SUPABASE_URL}/auth/v1/user`,{headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${jwt}`}});
    if(!ur.ok) return Response.json({error:"Your session has expired. Please sign in again."},{status:401});
    const user=await ur.json();
    const url=new URL(req.url),tenderId=String(url.searchParams.get("tenderId")||"").trim();
    if(!tenderId) return Response.json({error:"Tender ID is required."},{status:400});
    const tr=await supabaseGet(`tenders?id=eq.${encodeURIComponent(tenderId)}&select=*`,jwt),t=tr?.[0];
    if(!t) return Response.json({error:"Tender not found."},{status:404});
    let eventName="your event";
    if(t.event_id){const er=await supabaseGet(`events?id=eq.${encodeURIComponent(t.event_id)}&select=name`,jwt);if(er?.[0]?.name)eventName=er[0].name}
    const organiser=String(user.user_metadata?.full_name||user.user_metadata?.name||user.email?.split('@')[0]||"Event organiser");
    const due=t.due_at?new Date(t.due_at).toLocaleDateString("en-NZ",{day:"numeric",month:"long",year:"numeric",timeZone:"Pacific/Auckland"}):"Not specified";
    const origin=new URL(req.url).origin;
    const link=`${origin}/#tender=${encodeURIComponent(t.public_token)}`;
    const subject=`${eventName} – ${t.title}`;
    const message=`Hi,\n\n${organiser} is inviting you to provide a quote for ${t.title} for ${eventName}.\n\nService: ${t.category||"Supplier"}\nLocation/region: ${t.region||"Not specified"}\nQuote due: ${due}\n\nTender details and quote submission:\n${link}\n\nIf you'd rather reply by email, just reply to this message and it will go directly to ${organiser}.\n\nRegards,\n${organiser}\nSent via SitePlan`;
    return Response.json({subject,message});
  }catch(error:any){
    console.error("tender-email-preview",error);
    return Response.json({error:error?.message||"Could not prepare the tender email."},{status:500});
  }
};

export const config:Config={path:"/api/tender-email-preview"};
