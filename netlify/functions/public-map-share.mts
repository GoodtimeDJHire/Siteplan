import type { Context, Config } from "@netlify/functions";
import { getStore, getDeployStore } from "@netlify/blobs";

function store(){
  return Netlify.context?.deploy?.context === "production" ? getStore("siteplan-public-maps",{consistency:"strong"}) : getDeployStore("siteplan-public-maps");
}
function supabaseConfig(){
  const url=Netlify.env.get("SITEPLAN_SUPABASE_URL");
  const key=Netlify.env.get("SITEPLAN_SUPABASE_KEY");
  if(!url||!key)throw new Error("SitePlan database configuration is missing.");
  return {url,key};
}
async function authUser(req:Request){
  const jwt=(req.headers.get("authorization")||"").replace(/^Bearer\s+/i,"").trim();
  if(!jwt)return null;
  const {url,key}=supabaseConfig();
  const r=await fetch(`${url}/auth/v1/user`,{headers:{apikey:key,Authorization:`Bearer ${jwt}`}});
  if(!r.ok)return null;
  return {jwt,user:await r.json()};
}
async function ownedEvent(eventId:string,jwt:string){
  const {url,key}=supabaseConfig();
  const r=await fetch(`${url}/rest/v1/events?id=eq.${encodeURIComponent(eventId)}&select=id,name,venue,event_date,plan_data,updated_at`,{headers:{apikey:key,Authorization:`Bearer ${jwt}`,Accept:"application/json"}});
  if(!r.ok)return null;
  const rows=await r.json();return rows?.[0]||null;
}
function makeToken(){return crypto.randomUUID().replace(/-/g,"")+crypto.randomUUID().replace(/-/g,"").slice(0,12)}

export default async(req:Request,_context:Context)=>{
  const url=new URL(req.url);
  const s=store();
  try{
    if(req.method==="GET"){
      const t=String(url.searchParams.get("token")||"").trim();
      if(!t)return Response.json({error:"Map token is required."},{status:400});
      const data=await s.get(`share/${t}`,{type:"json"});
      if(!data||data.enabled===false)return Response.json({error:"This shared map is unavailable."},{status:404});
      return Response.json({ok:true,share:data});
    }
    const auth=await authUser(req);
    if(!auth)return Response.json({error:"Sign in to manage a shared map."},{status:401});
    const body=await req.json().catch(()=>({}));
    const eventId=String(body.eventId||"").trim();
    if(!eventId)return Response.json({error:"Event ID is required."},{status:400});
    const event=await ownedEvent(eventId,auth.jwt);
    if(!event)return Response.json({error:"Event not found or you do not have access."},{status:404});
    const ownerKey=`owner/${auth.user.id}/${eventId}`;
    const existing=await s.get(ownerKey,{type:"json"});
    if(req.method==="DELETE"){
      if(existing?.token)await s.delete(`share/${existing.token}`);
      await s.delete(ownerKey);
      return Response.json({ok:true});
    }
    if(req.method!=="POST")return new Response("Method not allowed",{status:405});
    const shareToken=existing?.token||makeToken();
    const share={token:shareToken,eventId:event.id,eventName:event.name||"Event",venue:event.venue||"",eventDate:event.event_date||"",plan:event.plan_data||{},updatedAt:event.updated_at||new Date().toISOString(),enabled:true};
    await s.setJSON(`share/${shareToken}`,share);
    await s.setJSON(ownerKey,{token:shareToken,eventId:event.id});
    return Response.json({ok:true,token:shareToken,url:`${url.origin}/#map=${shareToken}`});
  }catch(error:any){
    console.error("public-map-share",error);
    return Response.json({error:error?.message||"Shared map request failed."},{status:500});
  }
};

export const config:Config={path:"/api/public-map-share"};
