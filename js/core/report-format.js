const MONTHS=["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
const RANKS={"JENDERAL":17,"KOMJEN":16,"IRJEN":15,"BRIGJEN":14,"KOMBES":13,"KOMBES POL.":13,"AKBP":12,"KOMPOL":11,"AKP":10,"IPTU":9,"IPDA":8,"AIPTU":7,"AIPDA":6,"BRIPKA":5,"BRIGPOL":4,"BRIPTU":3,"BRIPDA":2};
export function sortPeople(list=[]){return [...list].sort((a,b)=>(RANKS[b.pangkat]||0)-(RANKS[a.pangkat]||0)||String(a.nama).localeCompare(String(b.nama),"id",{sensitivity:"base"}));}
function dateText(value){if(!value)return "";const [y,m,d]=value.split("-");return `${Number(d)} ${MONTHS[Number(m)-1]} ${y}`;}
function lines(value){return String(value||"").split(/\n+/).map(s=>s.trim()).filter(Boolean).map((s,i)=>`${i+1}. ${s}`).join("\n");}
function timeText(a,b){if(!a&&!b)return "";if(b==="hingga")return `${a||""} WIB hingga selesai`.trim();return a&&b?`${a}-${b} WIB`:`${a||b} WIB`;}
function peopleText(people=[]){return sortPeople(people).map((p,i)=>`${i+1}. ${[p.pangkat,p.nama].filter(Boolean).join(" ")}${p.gelar?", "+p.gelar:""}${p.jabatan?"\n   "+p.jabatan:""}`).join("\n");}
function karo(data){
 const a=(data.kegiatan||[])[0]||{}, sections=[
 ["KEGIATAN",a.nama],["WAKTU DAN TEMPAT",[
  a.tanggal?`Hari/Tanggal: ${a.hari||""}${a.hari?", ":""}${dateText(a.tanggal)}`:"",
  timeText(a.mulai,a.selesai)?`Waktu: ${timeText(a.mulai,a.selesai)}`:"",
  a.lokasi?`Tempat: ${a.lokasi}`:""].filter(Boolean).join("\n")],
 ["URAIAN KEGIATAN",lines(a.uraian)],["HASIL KEGIATAN",lines(a.hasil)],["PELAKSANA",peopleText(a.orang)]
 ].filter(x=>x[1]);
 return sections.map((x,i)=>`*${["I","II","III","IV","V"][i]}. ${x[0]}*\n${x[1]}`).join("\n\n");
}
function karopsi(data){return (data.kegiatan||[]).map((a,i)=>{
 const sections=[
 ["Waktu",[a.tanggal?`Hari/Tanggal: ${a.hari||""}${a.hari?", ":""}${dateText(a.tanggal)}`:"",timeText(a.mulai,a.selesai)?`Waktu: ${timeText(a.mulai,a.selesai)}`:""].filter(Boolean).join("\n")],
 ["Tempat",a.lokasi],["Pelaksana",peopleText(a.orang)],["Uraian",lines(a.uraian)],["Hasil",lines(a.hasil)]
 ].filter(x=>x[1]);
 return `*${["I","II","III","IV","V","VI","VII","VIII","IX","X"][i]||i+1}${a.nama?". "+a.nama:""}*\n`+sections.map(s=>`\n*${s[0]}*\n${s[1]}`).join("\n");
 }).join("\n\n");}
export function buildReport(data={}){
 const body=data.jenis==="karopsi"?karopsi(data):karo(data);
 return ["*KEPADA:*",data.penerima||"Yth. KARO SDM POLDA BANTEN","","*DARI:*","KABAGPSI RO SDM POLDA BANTEN","","*PERIHAL:*","","*LAPORAN KEGIATAN BAGPSI RO SDM POLDA BANTEN*","","*TEMBUSAN:*","1. Psikolog Utama Ropsi SSDM Polri;","2. Para Kabag di lingkungan Ropsi SSDM Polri;","3. Psikolog Madya Ropsi SSDM Polri.","","Assalamualaikum Wr. Wb.","Salam sejahtera untuk kita semua.","Om Swastyastu.","Namo Buddhaya.","Salam Kebajikan.",data.pembuka||"",body,data.penutup||"","DUMM","","KABAGPSI RO SDM POLDA BANTEN","","SDM BERKEUNGGULAN","POLISI BERSAMA MASYARAKAT","INDONESIA MAJU"].filter((v,i,a)=>v!==""|| (i>0&&a[i-1]!=="")).join("\n").trim()+"\n";
}
export const DEFAULT_REPORT=()=>({jenis:"karo_sdm",penerima:"Yth. KARO SDM POLDA BANTEN",pembuka:"Dengan hormat,\nBersama ini disampaikan laporan kegiatan sebagai berikut.",penutup:"Demikian disampaikan, atas perhatiannya diucapkan terima kasih.",kegiatan:[{nama:"",tanggal:"",hari:"",mulai:"",selesai:"",lokasi:"",uraian:"",hasil:"",orang:[]}]});
