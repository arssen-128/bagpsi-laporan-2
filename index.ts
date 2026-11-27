import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, apikey, x-client-info, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
const reply=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,"Content-Type":"application/json"}});
Deno.serve(async req=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
 if(req.method!=="POST")return reply({error:"Method not allowed"},405);
 try{
  const url=Deno.env.get("SUPABASE_URL"),anon=Deno.env.get("SUPABASE_ANON_KEY"),service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if(!url||!anon||!service)throw Error("Secret Supabase Edge Function belum lengkap.");
  const auth=req.headers.get("Authorization");if(!auth)return reply({error:"Sesi tidak ditemukan."},401);
  const caller=createClient(url,anon,{global:{headers:{Authorization:auth}}});
  const {data:u,error:ue}=await caller.auth.getUser();if(ue||!u.user)return reply({error:"Sesi tidak valid."},401);
  const {data:isAdmin,error:ae}=await caller.rpc("is_bagpsi_admin");if(ae||isAdmin!==true)return reply({error:"Akses Admin ditolak."},403);
  const db=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
  const b=await req.json(),action=String(b.action||""),actor=u.user.id;
  const audit=async(target,action,before,after)=>{const {error}=await db.from("admin_audit_log").insert({actor_id:actor,target_user_id:target,action,before_data:before||null,after_data:after||null,result:"success"});if(error)throw Error("Perubahan telah dilakukan tetapi pencatatan audit gagal: "+error.message)};
  if(action==="list"){
   const {data,error}=await db.auth.admin.listUsers({page:1,perPage:1000});if(error)throw error;
   const authUsers=data.users||[],ids=authUsers.map(x=>x.id);
   const {data:profiles,error:pe}=ids.length?await db.from("profiles").select("id,display_name,role,account_status,created_at").in("id",ids):{data:[],error:null};if(pe)throw pe;
   const map=new Map((profiles||[]).map(x=>[x.id,x]));
   const users=authUsers.map(x=>{const p=map.get(x.id)||{};return{id:x.id,email:x.email||"",display_name:p.display_name||x.user_metadata?.display_name||"",role:p.role||"user",account_status:p.account_status||(x.banned_until?"inactive":"active"),created_at:p.created_at||x.created_at}}).sort((a,b)=>String(b.created_at).localeCompare(String(a.created_at)));
   return reply({users,stats:{total:users.length,admin:users.filter(x=>x.role==="admin").length,user:users.filter(x=>x.role==="user").length,inactive:users.filter(x=>x.account_status==="inactive").length}});
  }
  if(action==="create"){
   const name=String(b.display_name||"").trim(),email=String(b.email||"").trim().toLowerCase(),role=String(b.role||"user"),password=String(b.temporary_password||"");
   if(!name||name.length>120||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||!["admin","user"].includes(role)||password.length<12||password.length>128)return reply({error:"Nama, email, role, atau password sementara tidak memenuhi ketentuan."},400);
   const {data:created,error:ce}=await db.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{display_name:name}});if(ce)throw ce;
   const {error:pe}=await db.from("profiles").upsert({id:created.user.id,display_name:name,role,account_status:"active"},{onConflict:"id"});
   if(pe){await db.auth.admin.deleteUser(created.user.id);throw pe}
   await audit(created.user.id,"account.create",null,{email,display_name:name,role,account_status:"active"});
   return reply({ok:true,user_id:created.user.id});
  }
  if(action==="update-role"){
   const id=String(b.user_id||""),role=String(b.role||"");if(!/^[0-9a-f-]{36}$/i.test(id)||!["admin","user"].includes(role))return reply({error:"Parameter tidak valid."},400);
   if(id===actor&&role==="user")return reply({error:"Admin tidak dapat menurunkan role akunnya sendiri dari panel ini."},409);
   const {data:p,error:pe}=await db.from("profiles").select("id,display_name,role,account_status").eq("id",id).maybeSingle();if(pe)throw pe;if(!p)return reply({error:"Profil tidak ditemukan."},404);if(p.role===role)return reply({ok:true,unchanged:true});
   if(p.role==="admin"&&role==="user"&&p.account_status!=="inactive"){const {count,error}=await db.from("profiles").select("id",{count:"exact",head:true}).eq("role","admin").eq("account_status","active");if(error)throw error;if((count||0)<=1)return reply({error:"Admin terakhir tidak dapat diturunkan menjadi User."},409)}
   const {error}=await db.from("profiles").update({role}).eq("id",id);if(error)throw error;await audit(id,"account.role.update",p,{...p,role});return reply({ok:true});
  }
  if(action==="set-status"){
   const id=String(b.user_id||""),status=String(b.status||"");if(!/^[0-9a-f-]{36}$/i.test(id)||!["active","inactive"].includes(status))return reply({error:"Parameter tidak valid."},400);
   if(id===actor&&status==="inactive")return reply({error:"Admin tidak dapat menonaktifkan akunnya sendiri dari panel ini."},409);
   const {data:p,error:pe}=await db.from("profiles").select("id,display_name,role,account_status").eq("id",id).maybeSingle();if(pe)throw pe;if(!p)return reply({error:"Profil tidak ditemukan."},404);
   const old=p.account_status||"active";if(old===status)return reply({ok:true,unchanged:true});
   if(status==="inactive"&&p.role==="admin"){const {count,error}=await db.from("profiles").select("id",{count:"exact",head:true}).eq("role","admin").eq("account_status","active");if(error)throw error;if((count||0)<=1)return reply({error:"Admin terakhir tidak dapat dinonaktifkan."},409)}
   const {error:authError}=await db.auth.admin.updateUserById(id,{ban_duration:status==="inactive"?"876000h":"none"});if(authError)throw authError;
   const {error:profileError}=await db.from("profiles").update({account_status:status}).eq("id",id);
   if(profileError){await db.auth.admin.updateUserById(id,{ban_duration:old==="inactive"?"876000h":"none"});throw profileError}
   await audit(id,status==="inactive"?"account.disable":"account.enable",p,{...p,account_status:status});return reply({ok:true});
  }
  return reply({error:"Action tidak dikenal."},400);
 }catch(e){console.error("admin-users",e);return reply({error:e?.message||"Internal server error."},500)}
});
