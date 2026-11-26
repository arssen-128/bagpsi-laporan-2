import {getSupabase} from "../services/supabase.js";
const form=document.querySelector("#login-form"),button=document.querySelector("#login-submit"),message=document.querySelector("#login-message");
function say(text,error=false){message.textContent=text;message.classList.toggle("error",error);}
try{
 const client=getSupabase();
 const {data,error}=await client.auth.getSession();if(error)throw error;
 if(data.session) location.replace("./pages/dashboard.html");
 form.addEventListener("submit",async e=>{
  e.preventDefault();button.disabled=true;say("Memeriksa akun…");
  try{
   const {error}=await client.auth.signInWithPassword({email:document.querySelector("#email").value.trim(),password:document.querySelector("#password").value});
   if(error)throw error;location.replace("./pages/dashboard.html");
  }catch(err){say(`Login gagal: ${err.message||err}`,true);}
  finally{button.disabled=false;}
 });
}catch(err){say(`Aplikasi gagal diinisialisasi: ${err.message||err}`,true);}
