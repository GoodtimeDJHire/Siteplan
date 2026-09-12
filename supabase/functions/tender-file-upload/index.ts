import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
const json=(value:unknown,status=200)=>new Response(JSON.stringify(value),{status,headers:{...cors,"Content-Type":"application/json"}});
Deno.serve(async(req)=>{
  if(req.method==="OPTIONS") return new Response("ok",{headers:cors});
  if(req.method!=="POST") return json({error:"Method not allowed"},405);
  try{
    const form=await req.formData();
    const uploadToken=String(form.get("upload_token")||"");
    const file=form.get("file");
    if(!uploadToken || !(file instanceof File)) throw new Error("Upload token and file are required");
    if(file.size>10485760) throw new Error("File exceeds 10 MB limit");
    const allowed=["application/pdf","image/jpeg","image/png","application/vnd.openxmlformats-officedocument.wordprocessingml.document","application/msword"];
    if(!allowed.includes(file.type)) throw new Error("File type not allowed");
    const url=Deno.env.get("SUPABASE_URL")!;
    const service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb=createClient(url,service,{auth:{persistSession:false}});
    const {data:tok,error:tokErr}=await sb.from("tender_upload_tokens").select("submission_id,tender_id,expires_at").eq("upload_token",uploadToken).single();
    if(tokErr||!tok||new Date(tok.expires_at)<new Date()) throw new Error("Upload token invalid or expired");
    const safe=file.name.replace(/[^a-zA-Z0-9._-]/g,"_");
    const path=`${tok.tender_id}/${tok.submission_id}/${crypto.randomUUID()}-${safe}`;
    const {error:upErr}=await sb.storage.from("tender-files").upload(path,file,{contentType:file.type,upsert:false});
    if(upErr) throw upErr;
    const {error:dbErr}=await sb.from("tender_files").insert({submission_id:tok.submission_id,tender_id:tok.tender_id,storage_path:path,file_name:file.name,content_type:file.type,size_bytes:file.size});
    if(dbErr){await sb.storage.from("tender-files").remove([path]);throw dbErr;}
    const {data:signed,error:signedErr}=await sb.storage.from("tender-files").createSignedUrl(path,60*60*24*7,{download:file.name});
    if(signedErr) console.error("Could not create attachment link",signedErr);
    return json({ok:true,file_name:file.name,signed_url:signed?.signedUrl||null});
  }catch(e){return json({error:e instanceof Error?e.message:"Upload failed"},400)}
});