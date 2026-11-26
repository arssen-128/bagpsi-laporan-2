import { requireSession, notify } from "../core/auth-guard.js";
import { TABLES } from "../config.js";
import { buildReport } from "../core/report-format.js";
const auth = await requireSession();
if (!auth) throw new Error("Sesi tidak tersedia.");
const { client } = auth;
const id = new URLSearchParams(location.search).get("id");
const $ = selector => document.querySelector(selector);
if (!id) throw new Error("ID laporan tidak ditemukan.");
const { data, error } = await client.from(TABLES.reports)
  .select("id,judul,jenis,data,isi_laporan,status,finalized_at,updated_at,deleted_at")
  .eq("id", id).is("deleted_at", null).single();
if (error || !data) {
  $("#read-content").textContent = "Laporan tidak dapat dibuka atau Anda tidak memiliki hak akses.";
  notify("Laporan tidak ditemukan atau akses ditolak.", true);
} else {
  $("#read-title").textContent = data.judul || "Laporan tanpa judul";
  $("#read-meta").textContent = `${data.jenis === "karopsi" ? "KAROPSI" : "KARO SDM"} · Diperbarui ${new Date(data.updated_at).toLocaleString("id-ID")}`;
  const status = data.status || "draft";
  $("#read-status").textContent = status.toUpperCase();
  $("#read-status").className = `tag status-${status}`;
  $("#read-content").textContent = data.isi_laporan || buildReport(data.data || {});
  const sync = $("#sync-status"); if (sync) sync.textContent = "Terhubung · laporan dimuat";
}
