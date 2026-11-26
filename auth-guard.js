import { getSupabase } from "../services/supabase.js";
export async function requireSession() {
 const client=getSupabase();
 const {data,error}=await client.auth.getSession();
 if(error) throw error;
 if(!data.session){ location.replace(new URL("../index.html",location.href)); return null; }
 const email=document.querySelector("#account-email");
 if(email) email.textContent=data.session.user.email || "Akun aktif";
 const logout=document.querySelector("#logout-button");
 logout?.addEventListener("click",async()=>{
  logout.disabled=true;
  const {error:logoutError}=await client.auth.signOut();
  if(logoutError){logout.disabled=false;notify(logoutError.message,true);return;}
  location.replace(new URL("../index.html",location.href));
 });
 client.auth.onAuthStateChange((_event,session)=>{
  if(!session) location.replace(new URL("../index.html",location.href));
 });
 setupMobileMenu();
 return {client,session:data.session,user:data.session.user};
}
export function notify(message,error=false){
 const node=document.querySelector("#toast"); if(!node){alert(message);return;}
 node.textContent=message;node.classList.toggle("error",error);node.classList.add("show");
 clearTimeout(notify.timer);notify.timer=setTimeout(()=>node.classList.remove("show"),2800);
}
function setupMobileMenu(){
 const frame=document.querySelector(".app-frame"),toggle=document.querySelector("#menu-toggle"),backdrop=document.querySelector("#mobile-backdrop");
 const close=()=>{frame?.classList.remove("menu-open");toggle?.setAttribute("aria-expanded","false");};
 toggle?.addEventListener("click",()=>{const open=!frame.classList.contains("menu-open");frame.classList.toggle("menu-open",open);toggle.setAttribute("aria-expanded",String(open));});
 backdrop?.addEventListener("click",close);
 document.querySelectorAll(".nav-link").forEach(link=>link.addEventListener("click",close));
 document.addEventListener("keydown",e=>{if(e.key==="Escape")close();});
}
