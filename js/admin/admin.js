import { requireAdminPanel } from "./admin-guard.js";

const $ = id => document.getElementById(id);
const pageKey = location.pathname.split("/").pop().replace(".html", "") || "index";

const pages = {
  index: { key: "dashboard", title: "Dashboard Admin", crumb: "DASHBOARD" },
  users: { key: "users", title: "Manajemen Akun", crumb: "MANAJEMEN AKUN" },
  reports: { key: "reports", title: "Manajemen Laporan", crumb: "MANAJEMEN LAPORAN" },
  permissions: { key: "permissions", title: "Hak Akses", crumb: "HAK AKSES" },
  "audit-log": { key: "audit", title: "Audit Log", crumb: "AUDIT LOG" },
  system: { key: "system", title: "Database & Sistem", crumb: "DATABASE & SISTEM" },
  settings: { key: "settings", title: "Pengaturan", crumb: "PENGATURAN" }
};

const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, c => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[c]));

async function start() {
  const auth = await requireAdminPanel();
  if (!auth) return;

  const current = pages[pageKey] || pages.index;
  document.title = `${current.title} — BAGPSI REPORT`;
  if ($("page-title")) $("page-title").textContent = current.title;
  if ($("crumb")) $("crumb").textContent = current.crumb;

  document.querySelectorAll("#admin-nav [data-page]").forEach(link => {
    const active = link.dataset.page === current.key;
    link.classList.toggle("active", active);
    if (active) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });

  const { client } = auth;
  if (current.key === "dashboard") {
    await renderDashboard(client);
  } else {
    renderModule(current.key);
  }
}

async function renderDashboard(client) {
  const host = $("content");
  if (!host) return;
  host.innerHTML = `<div class="grid stats">
    ${statCard("Total Pengguna", "users-count")}
    ${statCard("Total Laporan", "reports-count")}
    ${statCard("Draft", "draft-count")}
    ${statCard("Final", "final-count")}
    ${statCard("Akun Admin", "admins-count")}
  </div>
  <div class="grid cols">
    <section class="card"><h2>Aktivitas Administrasi</h2>
      <p class="muted">Dashboard Admin menjadi pusat pemantauan akun, laporan, hak akses, dan kondisi sistem.</p>
      <div class="notice success">Verifikasi session dan hak Admin berhasil.</div>
      <p class="muted">Modul yang melakukan perubahan data akan diaktifkan setelah Edge Function, RLS, dan audit trail diverifikasi.</p>
    </section>
    <section class="card"><h2>Status Pemeriksaan</h2>
      <p id="db-status" class="muted">Memeriksa data…</p>
      <p class="muted">Sumber role: RPC <code>is_bagpsi_admin()</code>.</p>
    </section>
  </div>`;
  try {
    const results = await Promise.all([
      client.from("profiles").select("id", { count: "exact", head: true }),
      client.from("profiles").select("id", { count: "exact", head: true }).eq("role", "admin"),
      client.from("laporan_cloud").select("id", { count: "exact", head: true }),
      client.from("laporan_cloud").select("id", { count: "exact", head: true }).eq("status", "draft"),
      client.from("laporan_cloud").select("id", { count: "exact", head: true }).eq("status", "final")
    ]);
    const failed = results.find(result => result.error);
    if (failed) throw failed.error;

    ["users-count", "admins-count", "reports-count", "draft-count", "final-count"].forEach((id, i) => {
      $(id).textContent = results[i].count ?? 0;
    });
    $("db-status").textContent = "Koneksi Supabase dan query ringkasan berhasil.";
  } catch (error) {
    ["users-count", "admins-count", "reports-count", "draft-count", "final-count"].forEach(id => {
      const node = $(id);
      if (node) node.textContent = "—";
    });
    $("db-status").textContent = `Query ringkasan belum berhasil: ${error.message || error}. Periksa RLS SELECT untuk akun Admin.`;
    $("db-status").classList.add("danger-note");
  }
}

function statCard(label, id) {
  return `<article class="card stat"><div><small>${label}</small><strong id="${id}">—</strong></div></article>`;
}

function renderModule(key) {
  const host = $("content");
  if (!host) return;
  const modules = {
    users: {
      title: "Manajemen Akun",
      desc: "Pengelolaan akun pengguna BAGPSI REPORT.",
      status: "Operasi membuat akun, mengubah role, menonaktifkan akun, dan reset password belum diaktifkan.",
      details: ["Daftar akun dan status aktif", "Perubahan role User/Admin", "Reset password melalui Supabase Auth", "Perlindungan agar Admin terakhir tidak dapat dinonaktifkan"]
    },
    reports: {
      title: "Manajemen Laporan",
      desc: "Pemantauan laporan KARO SDM dan KAROPSI.",
      status: "Aksi perubahan, penghapusan, finalisasi, dan konversi template masih dikunci sampai validasi server-side tersedia.",
      details: ["Filter jenis laporan dan Draft/Final", "Identitas pembuat dan waktu perubahan", "Konversi template dengan validasi struktur", "Perlindungan laporan Final dan snapshot KAROPSI"]
    },
    permissions: {
      title: "Hak Akses",
      desc: "Sumber role aplikasi adalah fungsi otorisasi database dan public.profiles.",
      status: "Perubahan role harus dilakukan melalui operasi server-side yang membuat audit event.",
      details: ["Role yang digunakan: Admin dan User", "Verifikasi server-side untuk setiap perubahan", "Pencegahan demosi Admin terakhir"]
    },
    audit: {
      title: "Audit Log",
      desc: "Riwayat tindakan pengguna dan administrator.",
      status: "Tabel audit log belum tercantum dalam skema yang diberikan; tidak ada data audit yang akan direkayasa atau ditampilkan sebagai riwayat.",
      details: ["Login dan kegagalan verifikasi", "Perubahan role dan status akun", "Finalisasi, revisi, dan penghapusan laporan", "Perubahan template dan tindakan administratif"]
    },
    system: {
      title: "Database & Sistem",
      desc: "Pemeriksaan awal koneksi dan komponen sistem.",
      status: "Status RPC Admin telah diverifikasi pada saat halaman ini dibuka. Pemeriksaan RLS, migration, trigger, dan grants memerlukan audit database terpisah.",
      details: ["Supabase Auth session", "RPC is_bagpsi_admin()", "Tabel profiles dan laporan_cloud", "RLS policies, grants, triggers, dan migration"]
    },
    settings: {
      title: "Pengaturan",
      desc: "Konfigurasi keamanan dan perilaku Admin Panel.",
      status: "Pengaturan keamanan belum diaktifkan sebagai kontrol produksi.",
      details: ["Re-authentication atau MFA", "Durasi sesi Admin", "Rate limiting tindakan sensitif", "Preferensi tampilan panel"]
    }
  };
  const item = modules[key] || modules.system;
  host.innerHTML = `<div class="section-head"><h2>${item.title}</h2><span class="pill draft">Fondasi / belum aktif</span></div>
    <section class="card"><p>${item.desc}</p><div class="notice">${item.status}</div>
    <h3>Ruang lingkup modul</h3><ul>${item.details.map(detail => `<li>${escapeHTML(detail)}</li>`).join("")}</ul></section>`;
}

start().catch(error => {
  console.error("[BAGPSI Admin Panel]", error);
  const host = $("content");
  if (host) host.innerHTML = `<div class="notice danger-note"><b>Admin Panel tidak dapat dibuka.</b><br>${escapeHTML(error.message || error)}<br><small>Periksa session, RPC is_bagpsi_admin(), dan kebijakan database.</small></div>`;
});
