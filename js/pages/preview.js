import {requireSession,notify} from "../core/auth-guard.js";
import {buildReport,DEFAULT_REPORT} from "../core/report-format.js";
await requireSession();
let data;try{data=JSON.parse(localStorage.getItem("bagpsi-report-draft-v3")||"null")}catch{}
document.querySelector("#full-preview").textContent=buildReport(data||DEFAULT_REPORT());
document.querySelector("#preview-copy").addEventListener("click",async()=>{try{await navigator.clipboard.writeText(document.querySelector("#full-preview").textContent);notify("Teks laporan disalin.");}catch{notify("Clipboard tidak tersedia.",true);}});
