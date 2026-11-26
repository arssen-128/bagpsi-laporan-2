import {requireSession,notify} from "../core/auth-guard.js";
import {TABLES} from "../config.js";
import {buildReport,DEFAULT_REPORT} from "../core/report-format.js";
const auth=await requireSession();if(!auth)throw new Error("Sesi tidak tersedia.");
const {client,user}=auth;
const DRAFT_KEY="bagpsi-report-draft-v3";
const $=s=>document.querySelector(s),activities=$("#activities"),template=$("#activity-template");
let reportId=new URLSearchParams(location.search).get("id"),reportOwnerId=null,masterPeople=[],saving=false,saveAgain=false,saveTimer=null,reportStatus="draft",finalData=null;
function readDraft(){try{return JSON.parse(localStorage.getItem(DRAFT_KEY)||"null")}catch{return null}}
function collect(){
 return {jenis:$("#jenis").value,penerima:$("#penerima").value.trim(),pembuka:$("#pembuka").value,penutup:$("#penutup").value,
 kegiatan:[...activities.querySelectorAll(".activity-card")].map(card=>({
 nama:card.querySelector(".activity-name").value.trim(),tanggal:card.querySelector(".activity-date").value,hari:card.querySelector(".activity-day").value,
 mulai:card.querySelector(".activity-start").value,selesai:card.querySelector(".activity-until").checked?"hingga":card.querySelector(".activity-end").value,
 lokasi:card.querySelector(".activity-location").value.trim(),lokasi_meta:JSON.parse(card.querySelector(".activity-location").dataset.meta||"null"),uraian:card.querySelector(".activity-description").value,hasil:card.querySelector(".activity-result").value,
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
 const locationInput=card.querySelector(".activity-location");if(data.lokasi_meta)locationInput.dataset.meta=JSON.stringify(data.lokasi_meta);else delete locationInput.dataset.meta;
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
function reportPayload(data,status="draft"){
 const now=new Date().toISOString();
 return {user_id:reportOwnerId||user.id,judul:(data.kegiatan[0]?.nama||"Laporan BAGPSI").slice(0,180),jenis:data.jenis,data,isi_laporan:buildReport(data),status,updated_at:now,finalized_at:status==="final"?now:null};
}
function setEditorMode(status){
 reportStatus=status;
 const isFinal=status==="final";
 document.querySelectorAll("#report-form input,#report-form textarea,#report-form select,#report-form button").forEach(el=>{
  if(["new-report","copy-preview"].includes(el.id))return;
  el.disabled=isFinal;
 });
 $("#save-draft").hidden=isFinal;$("#finalize-report").hidden=isFinal;
 $("#new-report").textContent=isFinal?"Buat Revisi":"Laporan baru";
 $("#report-status-badge").textContent=isFinal?"FINAL":"DRAFT";
 $("#report-status-badge").className=`status-badge ${isFinal?"final":"draft"}`;
 $("#editor-mode").textContent=isFinal?"Laporan final — terkunci":"Laporan dalam penyusunan";
 $("#draft-status").textContent=isFinal?`Difinalisasi ${finalData?.finalized_at?new Date(finalData.finalized_at).toLocaleString("id-ID"):""}. Buat revisi untuk melakukan perubahan.`:"Perubahan disimpan sebagai draft otomatis.";
}
async function persistDraft({quiet=false}={}){
 if(reportStatus==="final"){if(!quiet)notify("Laporan final terkunci. Gunakan Buat Revisi untuk mengubahnya.",true);return false;}
 if(saving){saveAgain=true;return false;}saving=true;clearTimeout(saveTimer);$("#save-draft").disabled=true;
 const data=collect(),payload=reportPayload(data,"draft");
 try{
  let result=reportId?await client.from(TABLES.reports).update(payload).eq("id",reportId).select("id,status").single():await client.from(TABLES.reports).insert(payload).select("id,status").single();
  if(result.error)throw result.error;reportId=result.data.id;reportStatus="draft";
  history.replaceState(null,"",`./buat-laporan.html?id=${encodeURIComponent(reportId)}`);
  $("#sync-status").textContent=`Draft tersimpan online · ${new Date().toLocaleTimeString("id-ID")}`;
  $("#draft-status").textContent="Draft tersimpan online. Belum menjadi laporan final.";
  if(!quiet)notify("Draft berhasil disimpan. Laporan belum difinalisasi.");
  return true;
 }catch(e){if(!quiet)notify(`Draft gagal disimpan online: ${e.message}. Salinan lokal tetap tersedia jika browser tidak menghapus datanya.`,true);else $("#draft-status").textContent=`Gagal autosave online: ${e.message}. Draft lokal masih tersimpan.`;return false;}
 finally{$("#save-draft").disabled=false;saving=false;if(saveAgain){saveAgain=false;scheduleSave();}}
}
async function finalizeReport(){
 if(reportStatus==="final")return;
 const data=collect();
 if(!data.kegiatan.length||!data.kegiatan[0].nama){notify("Isi nama kegiatan sebelum finalisasi.",true);return;}
 if(!confirm("Finalisasi laporan ini? Setelah final, laporan akan dikunci. Untuk perubahan berikutnya gunakan Buat Revisi."))return;
 const saved=reportId?true:await persistDraft({quiet:false});if(!saved||!reportId)return;
 $("#finalize-report").disabled=true;
 try{
  const {data:row,error}=await client.rpc("finalize_laporan",{p_report_id:reportId});
  if(error)throw error;finalData=row;setEditorMode("final");localStorage.removeItem(DRAFT_KEY);$("#sync-status").textContent="Laporan final tersimpan online";notify("Laporan berhasil difinalisasi.");
 }catch(e){notify(`Finalisasi gagal: ${e.message}. Data tetap berstatus draft.`,true);}
 finally{$("#finalize-report").disabled=false;}
}
function scheduleSave(){clearTimeout(saveTimer);if(reportStatus==="final")return;$("#draft-status").textContent="Perubahan tersimpan lokal; autosave online sebagai draft dalam 2,5 detik…";saveTimer=setTimeout(()=>persistDraft({quiet:true}),2500);}

// Location picker: GPS, draggable map waypoint, and manual address entry.
let activeLocationCard=null,leafletMap=null,mapPoint={lat:-6.12,lng:106.15},mapBusy=false;
const locationModal=$("#location-modal"),manualModal=$("#manual-location-modal");
const showModal=el=>{el.classList.add("open");el.setAttribute("aria-hidden","false");document.body.classList.add("modal-open");};
const hideModal=el=>{el.classList.remove("open");el.setAttribute("aria-hidden","true");if(!document.querySelector(".location-modal.open"))document.body.classList.remove("modal-open");};
function applyLocation(address,meta){if(!activeLocationCard)return;const input=activeLocationCard.querySelector(".activity-location");input.value=address;input.dataset.meta=JSON.stringify(meta||null);renderPreview();scheduleSave();}
async function reverseGeocode(lat,lng){
 const url=`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&zoom=18&addressdetails=1`;
 const response=await fetch(url,{headers:{"Accept":"application/json"}});if(!response.ok)throw new Error(`Layanan alamat merespons ${response.status}`);
 const result=await response.json();if(!result.display_name)throw new Error("Alamat untuk titik ini tidak ditemukan.");return result.display_name;
}
function updateMapPoint(){if(!leafletMap)return;const c=leafletMap.getCenter();mapPoint={lat:c.lat,lng:c.lng};$("#map-coordinates").textContent=`Lat: ${c.lat.toFixed(6)} · Lng: ${c.lng.toFixed(6)}`;$("#map-address").textContent="Titik dipilih. Tekan OK untuk mengambil alamat lengkap.";}
function initMap(lat,lng){
 if(!window.L){notify("Komponen peta belum termuat. Periksa koneksi internet lalu coba lagi.",true);return false;}
 if(!leafletMap){leafletMap=window.L.map("location-map",{zoomControl:true}).setView([lat,lng],16);window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'}).addTo(leafletMap);leafletMap.on("moveend",updateMapPoint);}
 setTimeout(()=>{leafletMap.invalidateSize();leafletMap.setView([lat,lng],16);updateMapPoint();},120);return true;
}
function openMap(card,lat=-6.12,lng=106.15){activeLocationCard=card;$("#map-search").value="";showModal(locationModal);if(initMap(lat,lng))$("#location-modal-title").textContent="Geser peta dan tentukan titik lokasi";}
async function locateCurrent(card){
 activeLocationCard=card;if(!navigator.geolocation){notify("Browser tidak mendukung GPS/lokasi perangkat.",true);return;}
 notify("Mengambil lokasi perangkat…");navigator.geolocation.getCurrentPosition(async pos=>{
  const {latitude:lat,longitude:lng,accuracy}=pos.coords;
  try{const address=await reverseGeocode(lat,lng);applyLocation(address,{source:"gps",lat,lng,accuracy:Math.round(accuracy),captured_at:new Date().toISOString()});notify("Lokasi perangkat berhasil dimasukkan.");}
  catch(e){notify(`Koordinat didapat, tetapi alamat gagal diambil: ${e.message}. Coba pilih di peta atau isi manual.`,true);}
 },err=>{const msg={1:"Izin lokasi ditolak. Aktifkan izin lokasi browser.",2:"Lokasi perangkat tidak tersedia.",3:"Permintaan GPS melewati batas waktu."};notify(msg[err.code]||"Gagal mengambil lokasi perangkat.",true);},{enableHighAccuracy:true,timeout:15000,maximumAge:30000});
}
async function searchMapPlace(){const q=$("#map-search").value.trim();if(!q)return;try{$("#map-search-button").disabled=true;const u=`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(q)}`;const r=await fetch(u,{headers:{"Accept":"application/json"}});if(!r.ok)throw new Error(`Pencarian gagal (${r.status})`);const hits=await r.json();if(!hits.length)throw new Error("Lokasi tidak ditemukan.");leafletMap.setView([Number(hits[0].lat),Number(hits[0].lon)],17);}catch(e){notify(e.message,true);}finally{$("#map-search-button").disabled=false;}}
async function confirmMapLocation(){if(mapBusy)return;mapBusy=true;const btn=$("#location-confirm");btn.disabled=true;btn.textContent="Mengambil alamat…";try{const address=await reverseGeocode(mapPoint.lat,mapPoint.lng);applyLocation(address,{source:"map",lat:mapPoint.lat,lng:mapPoint.lng,captured_at:new Date().toISOString()});hideModal(locationModal);notify("Titik peta berhasil dimasukkan ke lokasi kegiatan.");}catch(e){notify(`Alamat tidak dapat diambil: ${e.message}. Geser titik atau gunakan input manual.`,true);}finally{mapBusy=false;btn.disabled=false;btn.textContent="✓ OK, Gunakan Lokasi";}}
function openManual(card){activeLocationCard=card;const input=card.querySelector(".activity-location");$("#manual-place").value="";$("#manual-address").value=input.value||"";showModal(manualModal);}
function saveManual(){const address=$("#manual-address").value.trim(),place=$("#manual-place").value.trim();if(!address){notify("Alamat lengkap harus diisi.",true);$("#manual-address").focus();return;}applyLocation(place?`${place}, ${address}`:address,{source:"manual",place:place||null});hideModal(manualModal);notify("Alamat manual berhasil dimasukkan.");}
activities.addEventListener("click",e=>{const card=e.target.closest(".activity-card");if(!card)return;if(e.target.closest(".location-current"))locateCurrent(card);if(e.target.closest(".location-map"))openMap(card);if(e.target.closest(".location-manual"))openManual(card);});
$("#location-cancel").addEventListener("click",()=>hideModal(locationModal));$("#location-close").addEventListener("click",()=>hideModal(locationModal));$("#location-confirm").addEventListener("click",confirmMapLocation);$("#map-search-button").addEventListener("click",searchMapPlace);$("#map-search").addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();searchMapPlace();}});
$("#manual-cancel").addEventListener("click",()=>hideModal(manualModal));$("#manual-close").addEventListener("click",()=>hideModal(manualModal));$("#manual-save").addEventListener("click",saveManual);
for(const modal of [locationModal,manualModal])modal.addEventListener("click",e=>{if(e.target===modal)hideModal(modal);});document.addEventListener("keydown",e=>{if(e.key==="Escape"){hideModal(locationModal);hideModal(manualModal);}});

activities.addEventListener("input",e=>{if(reportStatus==="final")return;if(e.target.matches(".activity-location"))delete e.target.dataset.meta;if(e.target.matches(".activity-date")){const d=e.target.value;const day=d?new Intl.DateTimeFormat("id-ID",{weekday:"long"}).format(new Date(d+"T00:00:00")):"";e.target.closest(".activity-card").querySelector(".activity-day").value=day;}renderPreview();scheduleSave();});
$("#report-form").addEventListener("input",e=>{if(reportStatus==="final")return;if(!e.target.closest("#activities")){renderPreview();scheduleSave();}});
$("#report-form").addEventListener("change",e=>{
 if(reportStatus==="final")return;
 if(e.target.id==="jenis"){const d=collect();d.jenis=e.target.value;d.penerima=e.target.value==="karopsi"?"Yth. KAROPSI SSDM POLRI":"Yth. KARO SDM POLDA BANTEN";d.kegiatan=d.kegiatan.slice(0,1);load(d);}
 if(e.target.matches(".master-person-select")){const p=masterPeople.find(x=>x.id===e.target.value);if(p){const c=e.target.closest(".activity-card");c.querySelector(".person-rank").value=p.pangkat;c.querySelector(".person-name").value=p.nama;c.querySelector(".person-degree").value=p.gelar||"";c.querySelector(".person-position").value=p.jabatan||"";}}
 if(e.target.matches(".activity-until"))e.target.closest(".activity-card").querySelector(".activity-end").disabled=e.target.checked;
 renderPreview();scheduleSave();
});
activities.addEventListener("click",e=>{
 if(reportStatus==="final")return;
 const card=e.target.closest(".activity-card");if(!card)return;
 if(e.target.closest(".add-person")){const rank=card.querySelector(".person-rank").value,name=card.querySelector(".person-name").value.trim();if(!rank||!name){notify("Pilih personel dari master terlebih dahulu.",true);return;}addSelectedPerson(card,{pangkat:rank,nama:name,gelar:card.querySelector(".person-degree").value,jabatan:card.querySelector(".person-position").value,personel_id:card.querySelector(".master-person-select").value});card.querySelector(".person-rank").value="";card.querySelector(".person-name").value="";card.querySelector(".person-degree").value="";card.querySelector(".person-position").value="";card.querySelector(".master-person-select").value="";renderPreview();scheduleSave();}
 if(e.target.closest(".remove-activity")&&activities.children.length>1){card.remove();updateNumbers();renderPreview();scheduleSave();}
});
$("#add-activity").addEventListener("click",()=>{if($("#jenis").value==="karopsi"){addActivity();scheduleSave();}});
$("#save-draft").addEventListener("click",()=>persistDraft());
$("#finalize-report").addEventListener("click",finalizeReport);
$("#new-report").addEventListener("click",()=>{
 const isRevision=reportStatus==="final";
 if(!confirm(isRevision?"Buat revisi baru dari laporan final ini? Laporan final sebelumnya tetap tersimpan." : "Mulai laporan baru? Draft yang sedang dikerjakan tetap tersimpan di arsip."))return;
 clearTimeout(saveTimer);saveAgain=false;const seed=isRevision?collect():DEFAULT_REPORT();reportId=null;reportOwnerId=user.id;reportStatus="draft";finalData=null;history.replaceState(null,"","./buat-laporan.html");load(seed);setEditorMode("draft");scheduleSave();
 });
$("#copy-preview").addEventListener("click",async()=>{try{await navigator.clipboard.writeText($("#live-preview").textContent);notify("Teks laporan disalin.");}catch{notify("Clipboard tidak tersedia pada browser ini.",true);}});
$("#sync-status").textContent="Memeriksa koneksi…";
await loadPeople();
if(reportId){
 const {data,error}=await client.from(TABLES.reports).select("id,user_id,data,status,finalized_at").eq("id",reportId).is("deleted_at",null).single();
 if(error){notify(`Laporan gagal dibuka: ${error.message}`,true);load(readDraft()||DEFAULT_REPORT());}
 else{reportOwnerId=data.user_id;load(data.data);finalData=data;if(data.status==="final")localStorage.removeItem(DRAFT_KEY);setEditorMode(data.status==="final"?"final":"draft");if(data.status==="draft"&&data.user_id!==user.id){notify("Anda sedang membuka draft milik pengguna lain sebagai admin.");}}
}else{reportOwnerId=user.id;load(readDraft()||DEFAULT_REPORT());setEditorMode("draft");}
