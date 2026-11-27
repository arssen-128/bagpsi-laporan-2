import { getSupabase } from "../services/supabase.js";

const $ = (id) => document.getElementById(id);
const client = getSupabase();

async function boot() {
  const { data: sessionData, error: sessionError } = await client.auth.getSession();
  if (sessionError) throw sessionError;
  const user = sessionData?.session?.user;
  if (!user) {
    location.replace(new URL("../../index.html", location.href));
    return;
  }
  $("admin-email").textContent = user.email || "Administrator";

  const { data: profile, error: profileError } = await client
    .from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profileError) throw profileError;
  if (profile?.role !== "admin") {
    alert("Akses ditolak. Halaman ini hanya untuk Admin.");
    location.replace(new URL("../dashboard.html", location.href));
    return;
  }

  const [users, admins, reports, drafts, finals] = await Promise.all([
    client.from("profiles").select("id", {count:"exact",head:true}),
    client.from("profiles").select("id", {count:"exact",head:true}).eq("role","admin"),
    client.from("laporan_cloud").select("id", {count:"exact",head:true}),
    client.from("laporan_cloud").select("id", {count:"exact",head:true}).eq("status","draft"),
    client.from("laporan_cloud").select("id", {count:"exact",head:true}).eq("status","final")
  ]);
  const firstError = [users,admins,reports,drafts,finals].find(x=>x.error)?.error;
  if (firstError) throw firstError;
  $("users-count").textContent = users.count ?? 0;
  $("admins-count").textContent = admins.count ?? 0;
  $("reports-count").textContent = reports.count ?? 0;
  $("draft-count").textContent = drafts.count ?? 0;
  $("final-count").textContent = finals.count ?? 0;
  $("db-status").textContent = "Supabase terhubung; query dasar berhasil.";
}

boot().catch((error)=>{
  console.error("[BAGPSI Admin]",error);
  $("db-status").textContent = `Pemeriksaan gagal: ${error.message || "Kesalahan database/RLS"}`;
});
