import {requireSession,notify} from "../core/auth-guard.js";
const {client}=await requireSession();if(client){
 const {data,error}=await client.from("laporan_cloud").select("id,judul,jenis,status,updated_at").order("updated_at",{ascending:false}).limit(100);
 if(error){notify(`Gagal memuat ringkasan: ${error.message}`,true);}
 else{
  const rows=data||[];document.querySelector("#dash-total").textContent=rows.length;
  document.querySelector("#dash-karo").textContent=rows.filter(x=>x.jenis==="karo_sdm").length;
  document.querySelector("#dash-psi").textContent=rows.filter(x=>x.jenis==="karopsi").length;
  const drafts=rows.filter(x=>(x.status||"draft")==="draft").length;
  const finals=rows.filter(x=>x.status==="final").length;
  const dash=document.querySelector(".stat-grid");
  if(dash&&!document.querySelector("#dash-drafts")){dash.insertAdjacentHTML("beforeend",`<article class="stat-card"><span>Draft</span><strong id="dash-drafts">${drafts}</strong><small>Belum difinalisasi</small></article><article class="stat-card"><span>Final</span><strong id="dash-finals">${finals}</strong><small>Sudah difinalisasi</small></article>`);}
  else{const d=document.querySelector("#dash-drafts"),f=document.querySelector("#dash-finals");if(d)d.textContent=drafts;if(f)f.textContent=finals;}
  const box=document.querySelector("#dashboard-recent");
  if(!rows.length)box.innerHTML='<p class="muted">Belum ada laporan tersimpan.</p>';
  else box.innerHTML=rows.slice(0,6).map(r=>`<a class="recent-item" href="./laporan-tersimpan.html"><b>${escapeHTML(r.judul||"Laporan tanpa judul")}</b><span>${r.jenis==="karopsi"?"KAROPSI":"KARO SDM"} · ${new Date(r.updated_at).toLocaleDateString("id-ID")}</span></a>`).join("");
 }
}
function escapeHTML(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
