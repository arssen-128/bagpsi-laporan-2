import {requireSession,notify} from "../core/auth-guard.js";
import {TABLES} from "../config.js";
import {buildReport,DEFAULT_REPORT} from "../core/report-format.js";
const auth=await requireSession();if(!auth)throw new Error("Sesi tidak tersedia.");
const {client,user}=auth;
const DRAFT_KEY="bagpsi-report-draft-v3";
const $=s=>document.querySelector(s),activities=$("#activities"),template=$("#activity-template");
let reportId=new URLSearchParams(location.search).get("id"),masterPeople=[],saving=false,saveAgain=false,saveTimer=null;
function readDraft(){try{return JSON.parse(localStorage.getItem(DRAFT_KEY)||"null")}catch{return null}}
function collect(){
 return {jenis:$("#jenis").value,penerima:$("#penerima").value.trim(),pembuka:$("#pembuka").value,penutup:$("#penutup").value,
 kegiatan:[...activities.querySelectorAll(".activity-card")].map(card=>({
 nama:card.querySelector(".activity-name").value.trim(),tanggal:card.querySelector(".activity-date").value,hari:card.querySelector(".activity-day").value,
 mulai:card.querySelector(".activity-start").value,selesai:card.querySelector(".activity-until").checked?"hingga":card.querySelector(".activity-end").value,
 lokasi:card.querySelector(".activity-location").value.trim(),uraian:card.querySelector(".activity-description").value,hasil:card.querySelector(".activity-result").value,
 orang:[...card.querySelectorAll(".selected-person")].map(n=>({pangkat:n.dataset.rank,nama:n.dataset.name,gelar:n.dataset.degree,jabatan:n.dataset.position,personel_id:n.dataset.id||null}))
 }))};
}
function renderPreview(){const text=buildReport(collect());$("#live-preview").textContent=text;try{localStorage.setItem(DRAFT_KEY,JSON.stringify(collect()));$("#draft-status").textContent="Draf tersimpan di perangkat ini."}catch{}}
function updateNumbers(){const cards=[...activities.children];cards.forEach((c,i)=>{c.querySelector(".activity-number").textContent=`Kegiatan ${i+1}`;c.querySelector(".remove-activity").hidden=cards.length===1;});$("#add-activity").hidden=$("#jenis").value==="karo_sdm";}
function fillPersonOptions(card){
 const select=card.querySelector(".master-person-select");select.replaceChildren(new Option(masterPeople.length?"Pilih personel…":"Belum ada personel aktif",""));
 masterPeople.filter(p=>p.status==="aktif").forEach(p=>select.add(new Option(`${p.pangkat} ${p.nama}${p.jabatan?" — "+p.jabatan:""}`,p.id)));
}
function addSelectedPerson(card,p){
 if(!p?.pangkat||!p?.nama)return;
 const row=document.createElement("div");row.className="selected-person";
 Object.assign(row.dataset,{rank:p.pangkat,name:p.nama,degree:p.gelar||"",position:p.jabatan||"",id:p.personel_id||p.id||""});
 const detail=document.createElement("span");detail.innerHTML=`<b>${esc(`${p.pangkat} ${p.nama}`)}</b><small>${esc([p.gelar,p.jabatan].filter(Boolean).join(" · "))}</small>`;
 const del=document.createElement("button");del.type="button";del.className="text-button";del.textContent="Hapus";del.addEventListener("click",()=>{row.remove();renderPreview()});
 row.append(detail,del);card.querySelector(".selected-people").append(row);
 const box=card.querySelector(".selected-people");[...box.children].sort((a,b)=>{const rank={JENDERAL:17,KOMJEN:16,IRJEN:15,BRIGJEN:14,KOMBES:13,AKBP:12,KOMPOL:11,AKP:10,IPTU:9,IPDA:8,AIPTU:7,AIPDA:6,BRIPKA:5,BRIGPOL:4,BRIPTU:3,BRIPDA:2};return (rank[b.dataset.rank]||0)-(rank[a.dataset.rank]||0)||a.dataset.name.localeCompare(b.dataset.name,"id")}).forEach(x=>box.append(x));
}
function addActivity(data={}){
 if($("#jenis").value==="karo_sdm"&&activities.children.length>=1)return;
 const card=template.content.firstElementChild.cloneNode(true);activities.append(card);fillPersonOptions(card);
 for(const [selector,key] of [[".activity-name","nama"],[".activity-date","tanggal"],[".activity-day","hari"],[".activity-start","mulai"],[".activity-location","lokasi"],[".activity-description","uraian"],[".activity-result","hasil"]])card.querySelector(selector).value=data[key]||"";
 if(data.selesai==="hingga")card.querySelector(".activity-until").checked=true;else card.querySelector(".activity-end").value=data.selesai||"";
 (data.orang||[]).forEach(p=>addSelectedPerson(card,p));
 updateNumbers();renderPreview();return card;
}
function load(data){
 const d=data||DEFAULT_REPORT();$("#jenis").value=d.jenis==="karopsi"?"karopsi":"karo_sdm";$("#penerima").value=d.penerima||($("#jenis").value==="karopsi"?"Yth. KAROPSI SSDM POLRI":"Yth. KARO SDM POLDA BANTEN");$("#pembuka").value=d.pembuka||"";$("#penutup").value=d.penutup||"";
 activities.replaceChildren();(d.kegiatan?.length?d.kegiatan:[{}]).slice(0,$("#jenis").value==="karo_sdm"?1:50).forEach(addActivity);updateNumbers();renderPreview();
}
async function loadPeople(){
 const {data,error}=await client.from(TABLES.personnel).select("id,nrp,pangkat,nama,gelar,jabatan,bagian,status").eq("status","aktif").order("nama");
 if(error){notify(`Master personel tidak dapat dimuat: ${error.message}`,true);masterPeople=[];}else masterPeople=data||[];
 activities.querySelectorAll(".activity-card").forEach(fillPersonOptions);
}
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
async function save(){
 if(saving){saveAgain=true;return;}saving=true;clearTimeout(saveTimer);$("#save-report").disabled=true;
 const data=collect(),payload={user_id:user.id,judul:(data.kegiatan[0]?.nama||"Laporan BAGPSI").slice(0,180),jenis:data.jenis,data,isi_laporan:buildReport(data),updated_at:new Date().toISOString()};
 try{
  let result=reportId?await client.from(TABLES.reports).update(payload).eq("id",reportId).select("id").single():await client.from(TABLES.reports).insert(payload).select("id").single();
  if(result.error)throw result.error;reportId=result.data.id;history.replaceState(null,"",`./buat-laporan.html?id=${encodeURIComponent(reportId)}`);
  $("#editor-mode").textContent="Laporan tersimpan";$("#sync-status").textContent=`Tersimpan online · ${new Date().toLocaleTimeString("id-ID")}`;
  notify("Laporan berhasil disimpan online.");
 }catch(e){notify(`Gagal menyimpan laporan: ${e.message}`,true);}
 finally{$("#save-report").disabled=false;saving=false;if(saveAgain){saveAgain=false;scheduleSave();}}
}
function scheduleSave(){clearTimeout(saveTimer);$("#draft-status").textContent="Ada perubahan belum disimpan online.";saveTimer=setTimeout(()=>save(),2500);}
activities.addEventListener("input",e=>{if(e.target.matches(".activity-date")){const d=e.target.value;const day=d?new Intl.DateTimeFormat("id-ID",{weekday:"long"}).format(new Date(d+"T00:00:00")):"";e.target.closest(".activity-card").querySelector(".activity-day").value=day;}renderPreview();scheduleSave();});
$("#report-form").addEventListener("input",e=>{if(!e.target.closest("#activities")){renderPreview();scheduleSave();}});
$("#report-form").addEventListener("change",e=>{
 if(e.target.id==="jenis"){const d=collect();d.jenis=e.target.value;d.penerima=e.target.value==="karopsi"?"Yth. KAROPSI SSDM POLRI":"Yth. KARO SDM POLDA BANTEN";d.kegiatan=d.kegiatan.slice(0,1);load(d);}
 if(e.target.matches(".master-person-select")){const p=masterPeople.find(x=>x.id===e.target.value);if(p){const c=e.target.closest(".activity-card");c.querySelector(".person-rank").value=p.pangkat;c.querySelector(".person-name").value=p.nama;c.querySelector(".person-degree").value=p.gelar||"";c.querySelector(".person-position").value=p.jabatan||"";}}
 if(e.target.matches(".activity-until"))e.target.closest(".activity-card").querySelector(".activity-end").disabled=e.target.checked;
 renderPreview();scheduleSave();
});
activities.addEventListener("click",e=>{
 const card=e.target.closest(".activity-card");if(!card)return;
 if(e.target.closest(".add-person")){const rank=card.querySelector(".person-rank").value,name=card.querySelector(".person-name").value.trim();if(!rank||!name){notify("Pilih personel dari master terlebih dahulu.",true);return;}addSelectedPerson(card,{pangkat:rank,nama:name,gelar:card.querySelector(".person-degree").value,jabatan:card.querySelector(".person-position").value,personel_id:card.querySelector(".master-person-select").value});card.querySelector(".person-rank").value="";card.querySelector(".person-name").value="";card.querySelector(".person-degree").value="";card.querySelector(".person-position").value="";card.querySelector(".master-person-select").value="";renderPreview();scheduleSave();}
 if(e.target.closest(".remove-activity")&&activities.children.length>1){card.remove();updateNumbers();renderPreview();scheduleSave();}
});
$("#add-activity").addEventListener("click",()=>{if($("#jenis").value==="karopsi"){addActivity();scheduleSave();}});
$("#save-report").addEventListener("click",save);
$("#new-report").addEventListener("click",()=>{if(!confirm("Kosongkan form dan mulai laporan baru?"))return;clearTimeout(saveTimer);saveAgain=false;reportId=null;history.replaceState(null,"","./buat-laporan.html");load(DEFAULT_REPORT());$("#editor-mode").textContent="Laporan baru";});
$("#copy-preview").addEventListener("click",async()=>{try{await navigator.clipboard.writeText($("#live-preview").textContent);notify("Teks laporan disalin.");}catch{notify("Clipboard tidak tersedia pada browser ini.",true);}});
$("#sync-status").textContent="Memeriksa koneksi…";
await loadPeople();
if(reportId){
 const {data,error}=await client.from(TABLES.reports).select("id,data").eq("id",reportId).single();
 if(error){notify(`Laporan gagal dibuka: ${error.message}`,true);load(readDraft()||DEFAULT_REPORT());}
 else{load(data.data);$("#editor-mode").textContent="Mengedit laporan tersimpan";}
}else load(readDraft()||DEFAULT_REPORT());
