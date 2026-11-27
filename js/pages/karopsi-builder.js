import {requireSession,notify} from "../core/auth-guard.js";
import {TABLES} from "../config.js";
const auth=await requireSession(); if(!auth) throw new Error("Sesi tidak tersedia.");
const {client,user}=auth; const $=s=>document.querySelector(s);
const params=new URLSearchParams(location.search), existingId=params.get("id");
let sources=[], selected=[], reportId=existingId, status="draft", admin=false, saving=false;
const roman=n=>["I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII","XIII","XIV","XV","XVI","XVII","XVIII","XIX","XX"][n-1]||String(n);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const dateText=v=>{if(!v)return "Tanggal tidak dicantumkan";const d=new Date(v+"T00:00:00");return Number.isNaN(d.getTime())?v:new Intl.DateTimeFormat("id-ID",{day:"2-digit",month:"long",year:"numeric"}).format(d)};
const firstActivity=r=>(r.data?.kegiatan||[])[0]||{};
const reportDate=r=>{const dates=(r.data?.kegiatan||[]).map(a=>a.tanggal).filter(Boolean).sort();return dates[0]||""};
function canEdit(){return status==="draft";}
function snapshot(r){return {source_id:r.id,judul:r.judul||"Laporan KARO SDM",jenis:r.jenis,status:r.status,data:r.data||{},isi_laporan:r.isi_laporan||"",source_updated_at:r.updated_at||null,source_finalized_at:r.finalized_at||null};}
function sourceLabel(r){const a=firstActivity(r);return a.nama||r.judul||"Laporan tanpa judul";}
function buildText(){
 const title=$("#report-title").value.trim()||"LAPORAN KEGIATAN BAGPSI RO SDM POLDA BANTEN";
 const lines=["**KEPADA:**",$("#recipient").value.trim()||"Yth. KAROPSI SSDM POLRI","","**DARI:**","KABAGPSI RO SDM POLDA BANTEN","","**PERIHAL:**","",`**${title}**`,"","**TEMBUSAN:**","1. Psikolog Utama Ropsi SSDM Polri;","2. Para Kabag di lingkungan Ropsi SSDM Polri;","3. Psikolog Madya Ropsi SSDM Polri;","","Assalamualaikum Wr. Wb.","Salam sejahtera untuk kita semua.","Om Swastyastu.","Namo Buddhaya.","Salam Kebajikan.",$("#opening").value.trim()];
 selected.forEach((s,i)=>{const a=firstActivity(s.snapshot);const d=s.snapshot.data||{};const people=a.orang||[];lines.push("",`**${roman(i+1)}. ${(a.nama||s.snapshot.judul||"KEGIATAN").toUpperCase()} — ${String(s.snapshot.data?.asal_satuan||s.snapshot.data?.polres||s.snapshot.data?.satuan||"LAPORAN KARO SDM").toUpperCase()}**`,"","🕰️📍 **WAKTU & TEMPAT**",`1. Hari/Tanggal : ${a.hari||""}${a.hari?", ":""}${dateText(a.tanggal)};`,a.mulai?`2. Pukul : ${a.mulai}${a.selesai&&a.selesai!=="hingga"?" s.d. "+a.selesai:" s.d. selesai"} WIB;`:"2. Pukul : Tidak dicantumkan;",`3. Tempat : ${a.lokasi||"Tidak dicantumkan"}.`,"","👮 **PELAKSANA**");
  if(people.length) people.forEach((p,j)=>lines.push(`${j+1}. ${[p.pangkat,p.nama].filter(Boolean).join(" ")}${p.gelar?", "+p.gelar:""}${p.jabatan?" ("+p.jabatan+")":""};`)); else lines.push("Data pelaksana tidak dicantumkan.");
  lines.push("","📓 **URAIAN KEGIATAN**",a.uraian||"Uraian kegiatan tidak dicantumkan.","","📒 **HASIL KEGIATAN**",a.hasil||"Hasil kegiatan tidak dicantumkan.");
 });
 lines.push("",$("#closing").value.trim()||"Demikian yang dapat dilaporkan.","","Wassalamualaikum Wr. Wb.","","**DUMM**","","**KABAGPSI RO SDM POLDA BANTEN**","","SDM BERKEUNGGULAN","POLISI BERSAMA MASYARAKAT","INDONESIA MAJU");
 return lines.filter((x,i)=>x!==""||lines[i-1]!=="").join("\n").trim()+"\n";
}
function renderPreview(){const text=buildText();$("#compilation-preview").textContent=text;return text;}
function renderSelected(){const root=$("#selected-sources");$("#source-count").textContent=`${selected.length} laporan dipilih`;
 if(!selected.length){root.innerHTML='<div class="empty-state">Belum ada laporan yang dipilih.</div>';renderPreview();return;}
 root.innerHTML=selected.map((s,i)=>`<article class="selected-source"><div class="selected-source-number">${roman(i+1)}</div><div class="selected-source-info"><strong>${esc(sourceLabel(s.snapshot))}</strong><small>${esc(s.snapshot.judul)} · ${esc(dateText(reportDate(s.snapshot)))}</small></div><div class="selected-source-actions"><button type="button" data-move="up" data-index="${i}" aria-label="Naik" ${i===0||!canEdit()?"disabled":""}>↑</button><button type="button" data-move="down" data-index="${i}" aria-label="Turun" ${i===selected.length-1||!canEdit()?"disabled":""}>↓</button><button type="button" data-remove="${i}" ${!canEdit()?"disabled":""}>Hapus</button></div></article>`).join("");renderPreview();}
function renderSources(){const q=$("#source-search").value.trim().toLowerCase(),period=$("#source-period").value;const picked=new Set(selected.map(x=>x.snapshot.source_id));const rows=sources.filter(r=>{const a=firstActivity(r),hay=[r.judul,a.nama,a.lokasi,a.uraian,r.data?.penerima].join(" ").toLowerCase();return hay.includes(q)&&(period==="all"||reportDate(r).startsWith(period));});
 const root=$("#source-list");if(!rows.length){root.innerHTML='<div class="empty-state">Tidak ada laporan Final yang cocok atau dapat Anda akses.</div>';return;}
 root.innerHTML=rows.map(r=>{const a=firstActivity(r),isPicked=picked.has(r.id);return `<article class="source-row"><div class="source-main"><strong>${esc(sourceLabel(r))}</strong><small>${esc(r.judul||"Laporan KARO SDM")} · ${esc(dateText(reportDate(r)))} · ${esc(a.lokasi||"Lokasi tidak dicantumkan")}</small><span class="tag status-final">FINAL</span></div><button class="btn ${isPicked?"quiet":"outline"}" data-add-source="${esc(r.id)}" ${isPicked||!canEdit()?"disabled":""}>${isPicked?"Sudah ditambahkan":"＋ Tambahkan"}</button></article>`;}).join("");}
function renderPeriods(){const el=$("#source-period"),old=el.value,values=[...new Set(sources.map(reportDate).filter(Boolean).map(x=>x.slice(0,7)))].sort().reverse();el.replaceChildren(new Option("Semua periode","all"));values.forEach(v=>{const [y,m]=v.split("-");el.add(new Option(new Intl.DateTimeFormat("id-ID",{month:"long",year:"numeric"}).format(new Date(+y,+m-1,1)),v));});el.value=values.includes(old)?old:"all";}
async function loadSources(){
 $("#source-list").innerHTML='<div class="empty-state">Memuat laporan Final…</div>';
 const {data,error}=await client.from(TABLES.reports).select("id,user_id,judul,jenis,data,isi_laporan,status,updated_at,finalized_at").eq("jenis","karo_sdm").eq("status","final").order("finalized_at",{ascending:false}).limit(500);
 if(error){$("#source-list").innerHTML=`<div class="empty-state">Gagal memuat sumber: ${esc(error.message)}. Pastikan migration kompilasi sudah dijalankan dan kebijakan RLS mengizinkan pembacaan laporan Final.</div>`;notify("Gagal memuat laporan sumber. Periksa migration dan RLS.",true);return;}
 sources=data||[];renderPeriods();renderSources();
 if(!sources.length){
  const {count}=await client.from(TABLES.reports).select("id",{count:"exact",head:true}).eq("jenis","karo_sdm").eq("status","draft");
  const note=$("#source-empty-note");
  if(note)note.textContent=count>0?`Belum ada laporan KARO SDM berstatus Final. Terdapat ${count} laporan Draft; buka arsip, periksa kelengkapan, lalu finalisasi laporan yang benar-benar sudah disetujui.`:"Belum ada laporan KARO SDM berstatus Final yang dapat dikompilasi.";
 }
}
async function save(statusWanted){
 if(saving||!canEdit())return;
 if(!selected.length){notify("Pilih minimal satu laporan sumber.",true);return;}
 saving=true;$("#save-draft").disabled=$("#finalize").disabled=true;
 const text=renderPreview();
 const payload={jenis:"karopsi",penerima:$("#recipient").value.trim(),pembuka:$("#opening").value,penutup:$("#closing").value};
 try{
  const {data,error}=await client.rpc("save_karopsi_compilation",{
   p_report_id:reportId,
   p_judul:$("#report-title").value.trim()||"Laporan Kompilasi KAROPSI",
   p_data:payload,
   p_isi_laporan:text,
   p_source_ids:selected.map(s=>s.snapshot.source_id),
   p_finalize:statusWanted==="final"
  });
  if(error)throw error;
  reportId=data;status=statusWanted;
  if(statusWanted==="final"){
   $("#status-badge").textContent="FINAL";$("#status-badge").className="status-badge final";
   $("#editor-mode").textContent="Laporan KAROPSI Final";
   $("#save-message").textContent="Dokumen final terkunci. Snapshot sumber telah disimpan dan tidak berubah jika laporan sumber diperbarui.";
   $("#save-draft").hidden=true;$("#finalize").hidden=true;
   ["#report-title","#recipient","#opening","#closing"].forEach(sel=>$(sel).disabled=true);
   renderSelected();notify("Laporan KAROPSI berhasil difinalisasi.");
  }else{
   $("#status-badge").textContent="DRAFT";$("#status-badge").className="status-badge draft";
   $("#save-message").textContent="Draft tersimpan. Hanya pembuat dan Admin yang dapat melihatnya.";
   history.replaceState(null,"",`./karopsi-builder.html?id=${encodeURIComponent(reportId)}`);
   notify("Draft kompilasi KAROPSI berhasil disimpan.");
  }
  $("#sync-status").textContent="Tersimpan online · kompilasi KAROPSI";
 }catch(e){notify(`Penyimpanan kompilasi gagal: ${e.message}`,true);}
 finally{saving=false;$("#save-draft").disabled=status==="final";$("#finalize").disabled=status==="final";}
}
async function loadExisting(){const {data,error}=await client.from(TABLES.reports).select("id,user_id,judul,jenis,data,isi_laporan,status,finalized_at").eq("id",reportId).single();if(error)throw error;if(data.jenis!=="karopsi")throw new Error("Dokumen ini bukan laporan KAROPSI.");if(data.status==="draft"&&data.user_id!==user.id&&!admin)throw new Error("Draft hanya dapat dibuka pembuat atau Admin.");status=data.status;$("#report-title").value=data.judul||$("#report-title").value;$("#recipient").value=data.data?.penerima||$("#recipient").value;$("#opening").value=data.data?.pembuka||"";$("#closing").value=data.data?.penutup||"";
 const {data:links,error:linkError}=await client.from(TABLES.compilationSources).select("urutan,laporan_sumber_id,snapshot_data,snapshot_isi_laporan,snapshot_updated_at,snapshot_finalized_at").eq("laporan_karopsi_id",reportId).order("urutan");if(linkError)throw linkError;selected=(links||[]).map(l=>({snapshot:{source_id:l.laporan_sumber_id,judul:(l.snapshot_data?.kegiatan||[])[0]?.nama||"Laporan sumber",jenis:"karo_sdm",status:"final",data:l.snapshot_data||{},isi_laporan:l.snapshot_isi_laporan||"",source_updated_at:l.snapshot_updated_at,source_finalized_at:l.snapshot_finalized_at}}));
 if(status==="final"){$("#status-badge").textContent="FINAL";$("#status-badge").className="status-badge final";$("#editor-mode").textContent="Laporan KAROPSI Final";$("#save-message").textContent="Dokumen final terkunci.";$("#save-draft").hidden=true;$("#finalize").hidden=true;["#report-title","#recipient","#opening","#closing"].forEach(s=>$(s).disabled=true);}renderSelected();}
$("#source-search").addEventListener("input",renderSources);$("#source-period").addEventListener("change",renderSources);$("#reload-sources").addEventListener("click",loadSources);$("#refresh-preview").addEventListener("click",renderPreview);
$("#source-list").addEventListener("click",e=>{const b=e.target.closest("[data-add-source]");if(!b||!canEdit())return;const r=sources.find(x=>x.id===b.dataset.addSource);if(!r||selected.some(x=>x.snapshot.source_id===r.id))return;selected.push({snapshot:snapshot(r)});renderSelected();renderSources();});
$("#selected-sources").addEventListener("click",e=>{if(!canEdit())return;const rm=e.target.closest("[data-remove]");if(rm){selected.splice(Number(rm.dataset.remove),1);renderSelected();renderSources();return;}const mv=e.target.closest("[data-move]");if(mv){const i=Number(mv.dataset.index),j=mv.dataset.move==="up"?i-1:i+1;if(j<0||j>=selected.length)return;[selected[i],selected[j]]=[selected[j],selected[i]];renderSelected();}});
["#report-title","#recipient","#opening","#closing"].forEach(s=>$(s).addEventListener("input",renderPreview));$("#save-draft").addEventListener("click",()=>save("draft"));$("#finalize").addEventListener("click",()=>{if(confirm("Finalisasi laporan KAROPSI? Dokumen akan dikunci dan snapshot sumber tidak dapat diubah."))save("final");});
try{const {data:ad}=await client.rpc("is_bagpsi_admin");admin=ad===true;}catch{}
await loadSources();if(existingId){try{await loadExisting();}catch(e){notify(`Gagal membuka kompilasi: ${e.message}`,true);}}
$("#sync-status").textContent="Terhubung · kompilasi KAROPSI";
