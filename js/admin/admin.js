import { getSupabase } from "../services/supabase.js";

const el = (id) => document.getElementById(id);

async function initAdminPanel() {
  const client = getSupabase();
  const { data: sessionResult, error: sessionError } = await client.auth.getSession();
  if (sessionError) throw sessionError;
  const session = sessionResult?.session;

  if (!session) {
    location.replace(new URL("../../index.html", location.href));
    return;
  }

  el("admin-email").textContent = session.user.email || "Admin";
  const { data: profile, error: profileError } = await client
    .from("profiles").select("role").eq("id", session.user.id).maybeSingle();

  if (profileError) throw profileError;
  if (profile?.role !== "admin") {
    alert("Akses ditolak. Akun ini bukan Admin.");
    location.replace(new URL("../dashboard.html", location.href));
    return;
  }

  const queries = await Promise.all([
    client.from("profiles").select("id", { count: "exact", head: true }),
    client.from("profiles").select("id", { count: "exact", head: true }).eq("role", "admin"),
    client.from("laporan_cloud").select("id", { count: "exact", head: true }),
    client.from("laporan_cloud").select("id", { count: "exact", head: true }).eq("status", "draft"),
    client.from("laporan_cloud").select("id", { count: "exact", head: true }).eq("status", "final")
  ]);
  const failed = queries.find(q => q.error);
  if (failed) throw failed.error;

  ["users-count", "admins-count", "reports-count", "draft-count", "final-count"].forEach((id, i) => {
    const q = [queries[0], queries[1], queries[2], queries[3], queries[4]][i];
    el(id).textContent = q.count ?? 0;
  });
  el("db-status").textContent = "Supabase terhubung; query ringkasan berhasil.";
}

initAdminPanel().catch(error => {
  console.error("[BAGPSI Admin]", error);
  el("db-status").textContent = `Gagal memuat data: ${error.message || "Periksa RLS dan konfigurasi Supabase."}`;
});
