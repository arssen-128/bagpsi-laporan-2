import { requireSession, notify } from "../core/auth-guard.js";
import { TABLES } from "../config.js";

const auth = await requireSession();
if (!auth) throw new Error("Sesi tidak tersedia.");
const { client, user } = auth;
const $ = (selector) => document.querySelector(selector);
let records = [], page = 1, isAdmin = false;
const pageSize = 5;
const statusNode = $("#sync-status");
const setConnection = (text, error = false) => {
  if (!statusNode) return;
  statusNode.textContent = text;
  statusNode.classList.toggle("error", error);
  statusNode.title = text;
};
const esc = (value) => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function reportDate(row) {
  return (row.data?.kegiatan || []).map(item => item.tanggal).filter(Boolean).sort()[0] || "";
}
function formatDate(value, withTime = false) {
  if (!value) return "—";
  const date = new Date(withTime ? value : `${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("id-ID", withTime
    ? { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" }
    : { day:"2-digit", month:"short", year:"numeric" }).format(date);
}
function rowActions(row) {
  const own = row.user_id === user.id;
  const canManageDraft = own || isAdmin;
  const read = `<a class="btn outline action-btn" href="./baca-laporan.html?id=${encodeURIComponent(row.id)}">Baca</a>`;
  const edit = row.status === "draft" && canManageDraft
    ? `<a class="btn outline action-btn" href="./buat-laporan.html?id=${encodeURIComponent(row.id)}">Edit</a>` : "";
  const canDelete = (row.status === "draft" && canManageDraft) || (row.status === "final" && isAdmin);
  const remove = canDelete ? `<button class="btn danger-outline action-btn" type="button" data-delete="${esc(row.id)}">Hapus</button>` : "";
  return `<div class="archive-actions">${read}${edit}${remove}</div>`;
}
function filteredRows() {
  const query = $("#archive-search").value.trim().toLowerCase();
  const template = $("#archive-template").value;
  const period = $("#archive-period").value;
  const status = $("#archive-status").value;
  return records.filter(row => {
    const data = row.data || {};
    const haystack = [row.judul, data.penerima, ...(data.kegiatan || []).flatMap(item => [item.nama, item.uraian, item.hasil, item.lokasi])].join(" ").toLowerCase();
    const date = reportDate(row);
    return haystack.includes(query) && (template === "all" || row.jenis === template) &&
      (period === "all" || date.startsWith(period)) && (status === "all" || row.status === status);
  });
}
function render() {
  const list = filteredRows();
  const pages = Math.max(1, Math.ceil(list.length / pageSize));
  page = Math.min(page, pages);
  const start = (page - 1) * pageSize;
  const visible = list.slice(start, start + pageSize);
  $("#archive-body").innerHTML = visible.length ? visible.map((row, index) => {
    const owner = row.user_id === user.id ? "Anda" : (isAdmin ? `Pengguna · ${esc(String(row.user_id || "").slice(0, 8))}` : "Pengguna");
    const status = row.status === "final" ? "final" : "draft";
    return `<tr><td>${start + index + 1}.</td><td><strong>${esc(row.judul || "Laporan tanpa judul")}</strong><small>${esc(row.data?.penerima || "Penerima belum diisi")}</small></td><td><span class="tag ${row.jenis === "karopsi" ? "psi" : ""}">${row.jenis === "karopsi" ? "KAROPSI" : "KARO SDM"}</span></td><td><span class="tag status-${status}">${status.toUpperCase()}</span></td><td>${formatDate(reportDate(row))}</td><td>${formatDate(row.updated_at, true)}</td><td>${owner}</td><td>${rowActions(row)}</td></tr>`;
  }).join("") : '<tr><td colspan="8" class="empty-cell">Tidak ada laporan yang dapat ditampilkan.</td></tr>';
  $("#archive-summary").textContent = list.length ? `Menampilkan ${start + 1}–${Math.min(start + pageSize, list.length)} dari ${list.length} laporan` : "Menampilkan 0 laporan";
  const nav = $("#archive-pages");
  nav.replaceChildren();
  const addPage = (label, target, active = false, disabled = false) => {
    const button = document.createElement("button");
    button.type = "button"; button.textContent = label; button.disabled = disabled;
    button.classList.toggle("active", active);
    button.addEventListener("click", () => { page = target; render(); });
    nav.append(button);
  };
  addPage("‹", Math.max(1, page - 1), false, page === 1);
  for (let n = 1; n <= pages; n++) addPage(String(n), n, n === page);
  addPage("›", Math.min(pages, page + 1), false, page === pages);
}
function buildPeriods() {
  const node = $("#archive-period"), previous = node.value;
  const periods = [...new Set(records.map(reportDate).filter(Boolean).map(date => date.slice(0, 7)))].sort().reverse();
  node.replaceChildren(new Option("Semua Periode", "all"));
  periods.forEach(period => {
    const [year, month] = period.split("-");
    node.add(new Option(new Intl.DateTimeFormat("id-ID", { month:"long", year:"numeric" }).format(new Date(+year, +month - 1, 1)), period));
  });
  node.value = periods.includes(previous) ? previous : "all";
}
async function load() {
  setConnection("Menghubungkan ke database…");
  $("#archive-body").innerHTML = '<tr><td colspan="8" class="empty-cell">Memuat laporan…</td></tr>';
  const { data, error } = await client.from(TABLES.reports)
    .select("id,user_id,judul,jenis,data,status,finalized_at,updated_at,deleted_at")
    .is("deleted_at", null).order("updated_at", { ascending: false }).limit(1000);
  if (error) {
    setConnection("Koneksi database bermasalah", true);
    $("#archive-body").innerHTML = `<tr><td colspan="8" class="empty-cell">${esc(error.message)}</td></tr>`;
    notify(`Gagal memuat arsip: ${error.message}`, true);
    return;
  }
  records = (data || []).map(row => ({ ...row, status: row.status || "draft" }));
  buildPeriods(); page = 1; render();
  setConnection(`Terhubung · ${records.length} laporan dimuat`);
}
async function deleteRow(id) {
  const row = records.find(item => item.id === id);
  if (!row) return;
  const own = row.user_id === user.id;
  const permitted = row.status === "draft" ? (own || isAdmin) : (row.status === "final" && isAdmin);
  if (!permitted) { notify("Anda tidak memiliki hak untuk menghapus laporan ini.", true); return; }
  const prompt = row.status === "final"
    ? "Hapus laporan FINAL ini? Tindakan ini hanya dapat dilakukan admin."
    : "Hapus draft ini? Data akan dihapus dari arsip.";
  if (!window.confirm(prompt)) return;
  const { error } = await client.from(TABLES.reports).delete().eq("id", id);
  if (error) { notify(`Gagal menghapus laporan: ${error.message}`, true); return; }
  notify("Laporan berhasil dihapus.");
  await load();
}

const { data: adminValue, error: adminError } = await client.rpc("is_bagpsi_admin");
isAdmin = !adminError && adminValue === true;
["input", "change"].forEach(eventName => {
  ["#archive-search", "#archive-template", "#archive-status", "#archive-period"].forEach(selector => {
    $(selector).addEventListener(eventName, () => { page = 1; render(); });
  });
});
$("#archive-refresh").addEventListener("click", load);
$("#archive-body").addEventListener("click", event => {
  const button = event.target.closest("[data-delete]");
  if (button) deleteRow(button.dataset.delete);
});
await load();
