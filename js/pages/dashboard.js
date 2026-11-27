import { requireSession, notify } from "../core/auth-guard.js";

const $ = (selector) => document.querySelector(selector);
const fmt = (value) => new Intl.NumberFormat("id-ID").format(Number(value || 0));
const monthFmt = new Intl.DateTimeFormat("id-ID", { month: "short" });
const dateFmt = new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

const sessionContext = await requireSession();
if (sessionContext?.client) {
  const { client } = sessionContext;
  const now = new Date();
  $("#today-label").textContent = new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(now);

  try {
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const [totalQ, draftQ, finalQ, monthQ, karoQ, psiQ, recentQ, trendQ] = await Promise.all([
      client.from("laporan_cloud").select("id", { count: "exact", head: true }),
      client.from("laporan_cloud").select("id", { count: "exact", head: true }).eq("status", "draft"),
      client.from("laporan_cloud").select("id", { count: "exact", head: true }).eq("status", "final"),
      client.from("laporan_cloud").select("id", { count: "exact", head: true }).gte("updated_at", new Date(now.getFullYear(), now.getMonth(), 1).toISOString()),
      client.from("laporan_cloud").select("id", { count: "exact", head: true }).eq("jenis", "karo_sdm"),
      client.from("laporan_cloud").select("id", { count: "exact", head: true }).eq("jenis", "karopsi"),
      client.from("laporan_cloud").select("id,judul,jenis,status,updated_at").order("updated_at", { ascending: false }).limit(8),
      client.from("laporan_cloud").select("status,updated_at").gte("updated_at", sixMonthsAgo.toISOString()).order("updated_at", { ascending: false }).limit(1000)
    ]);
    const firstError = [totalQ, draftQ, finalQ, monthQ, karoQ, psiQ, recentQ, trendQ].find((q) => q.error)?.error;
    if (firstError) throw firstError;

    const total = totalQ.count ?? 0;
    const drafts = draftQ.count ?? 0;
    const finals = finalQ.count ?? 0;
    const karo = karoQ.count ?? 0;
    const psi = psiQ.count ?? 0;
    const recent = recentQ.data || [];

    $("#dash-total").textContent = fmt(total);
    $("#dash-drafts").textContent = fmt(drafts);
    $("#dash-finals").textContent = fmt(finals);
    $("#dash-month").textContent = fmt(monthQ.count ?? 0);
    $("#dash-psi").textContent = fmt(psi);
    $("#dash-karo").textContent = fmt(karo);
    $("#dash-psi-template").textContent = fmt(psi);
    $("#donut-total").textContent = fmt(total);
    $("#legend-final-count").textContent = fmt(finals);
    $("#legend-draft-count").textContent = fmt(drafts);

    const denominator = Math.max(karo + psi, 1);
    $("#karo-track").style.width = `${Math.round((karo / denominator) * 100)}%`;
    $("#psi-track").style.width = `${Math.round((psi / denominator) * 100)}%`;
    const finalDegrees = total ? (finals / total) * 360 : 0;
    const draftDegrees = total ? (drafts / total) * 360 : 0;
    $("#status-donut").style.background = `conic-gradient(#176ed0 0deg ${finalDegrees}deg,#d89a24 ${finalDegrees}deg ${finalDegrees + draftDegrees}deg,#edf2f8 ${finalDegrees + draftDegrees}deg 360deg)`;

    renderTrend(trendQ.data || [], sixMonthsAgo, now);
    renderRecent(recent);
    setConnection(true);
    $("#last-loaded").textContent = dateFmt.format(new Date());
    const sync = $("#sync-status");
    if (sync) sync.textContent = "Terhubung · data diperbarui";
  } catch (error) {
    setConnection(false);
    $("#sync-status").textContent = "Gagal memuat data";
    $("#dashboard-recent").innerHTML = `<p class="recent-empty">Data dashboard tidak dapat dimuat. ${escapeHTML(error.message || "Periksa koneksi dan kebijakan database.")}</p>`;
    $("#report-trend").innerHTML = '<div class="trend-empty">Tren belum dapat dimuat.</div>';
    notify(`Dashboard gagal dimuat: ${error.message || "Kesalahan database"}`, true);
  }
}

function setConnection(online) {
  const state = $("#db-state");
  const pulse = $("#system-pulse");
  const sidebar = $("#sidebar-connection");
  if (state) { state.textContent = online ? "Terhubung" : "Tidak terhubung"; state.className = online ? "ok" : "fail"; }
  if (pulse) pulse.classList.toggle("offline", !online);
  if (sidebar) {
    sidebar.classList.toggle("connection-error", !online);
    const label = sidebar.querySelector("span");
    if (label) label.textContent = online ? "Terhubung ke BAGPSI REPORT" : "Koneksi bermasalah";
  }
}

function renderTrend(rows, start, end) {
  const months = [];
  for (let i = 0; i < 6; i++) months.push(new Date(start.getFullYear(), start.getMonth() + i, 1));
  const counts = months.map((month) => ({ month, draft: 0, final: 0 }));
  rows.forEach((row) => {
    const date = new Date(row.updated_at);
    const item = counts.find((entry) => entry.month.getFullYear() === date.getFullYear() && entry.month.getMonth() === date.getMonth());
    if (!item) return;
    if (row.status === "final") item.final += 1;
    else item.draft += 1;
  });
  const max = Math.max(1, ...counts.flatMap((x) => [x.draft, x.final]));
  $("#report-trend").innerHTML = `<div class="trend-bars">${counts.map((item) => {
    const finalHeight = Math.max(item.final ? 5 : 2, (item.final / max) * 140);
    const draftHeight = Math.max(item.draft ? 5 : 2, (item.draft / max) * 140);
    return `<div class="trend-month"><div class="trend-pair"><i class="trend-bar" style="height:${finalHeight}px" title="Final: ${item.final}"></i><i class="trend-bar draft" style="height:${draftHeight}px" title="Draft: ${item.draft}"></i></div><small>${monthFmt.format(item.month)}</small><em>${item.final + item.draft}</em></div>`;
  }).join("")}</div>`;
}

function renderRecent(rows) {
  if (!rows.length) {
    $("#dashboard-recent").innerHTML = '<div class="recent-empty">Belum ada laporan yang dapat ditampilkan.</div>';
    return;
  }
  $("#dashboard-recent").innerHTML = `<table class="recent-table"><thead><tr><th>Judul laporan</th><th>Template</th><th>Status</th><th>Terakhir diperbarui</th></tr></thead><tbody>${rows.slice(0, 6).map((row) => {
    const status = row.status === "final" ? "final" : "draft";
    const template = row.jenis === "karopsi" ? "KAROPSI" : "KARO SDM";
    return `<tr><td><div class="recent-title"><b>${escapeHTML(row.judul || "Laporan tanpa judul")}</b><small>${template}</small></div></td><td>${template}</td><td><span class="status-badge ${status}">${status === "final" ? "Final" : "Draft"}</span></td><td>${dateFmt.format(new Date(row.updated_at))}</td></tr>`;
  }).join("")}</tbody></table>`;
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}
