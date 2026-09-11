import type { Context, Config } from "@netlify/functions";

const SUPABASE_URL = "https://qkvkemcqfnbmaktbxddg.supabase.co";
const SUPABASE_KEY = "sb_publishable_tiPl-Y7wvfrpB7RzNzOBVA_CMIGBTwA";

async function getUser(jwt:string){
  const r=await fetch(`${SUPABASE_URL}/auth/v1/user`,{headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${jwt}`}});
  if(!r.ok) return null;
  return r.json();
}

export default async(req:Request,_context:Context)=>{
  if(req.method!=="POST") return new Response("Method not allowed",{status:405});
  try{
    const jwt=(req.headers.get("authorization")||"").replace(/^Bearer\s+/i,"").trim();
    if(!jwt) return Response.json({error:"Please sign in first."},{status:401});
    const user=await getUser(jwt);
    if(!user?.id) return Response.json({error:"Your session has expired. Please sign in again."},{status:401});

    const body=await req.json().catch(()=>({}));
    const id=typeof body.id==="string"?body.id.trim():"";
    const input=body.row||{};
    const company=String(input.company_name||"").trim();
    const email=String(input.email||"").trim().toLowerCase();
    const categories=Array.isArray(input.categories)?input.categories.map(String).filter(Boolean):[];
    const regions=Array.isArray(input.regions)?input.regions.map(String).filter(Boolean):[];
    if(!company||!email) return Response.json({error:"Add company name and email."},{status:400});
    if(!categories.length||!regions.length) return Response.json({error:"Choose category and region."},{status:400});

    const row={
      company_name:company,
      contact_name:String(input.contact_name||"").trim()||null,
      email,
      phone:String(input.phone||"").trim()||null,
      website:String(input.website||"").trim()||null,
      categories,
      regions,
      minimum:Number(input.minimum)||0,
      event_size:Number(input.event_size)||0,
      capabilities:String(input.capabilities||"").trim()||null,
      insurance:String(input.insurance||"Yes"),
      notifications:String(input.notifications||"all"),
      active:true,
      owner_id:user.id
    };

    const path=id
      ? `suppliers?id=eq.${encodeURIComponent(id)}&owner_id=eq.${encodeURIComponent(user.id)}`
      : "suppliers";
    const r=await fetch(`${SUPABASE_URL}/rest/v1/${path}`,{
      method:id?"PATCH":"POST",
      headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${jwt}`,"Content-Type":"application/json",Prefer:"return=representation"},
      body:JSON.stringify(row)
    });
    const data=await r.json().catch(()=>null);
    if(!r.ok) return Response.json({error:data?.message||data?.error||`Supplier save failed (${r.status}).`},{status:r.status});
    const saved=Array.isArray(data)?data[0]:data;
    if(!saved) return Response.json({error:"Supplier was not returned after saving."},{status:500});
    return Response.json({ok:true,supplier:saved});
  }catch(error:any){
    console.error("save-supplier",error);
    return Response.json({error:error?.message||"Supplier could not be saved."},{status:500});
  }
};

export const config:Config={path:"/api/save-supplier"};
