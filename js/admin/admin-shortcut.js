import { getSupabase } from "../services/supabase.js";

let openingAdmin = false;
export function installAdminShortcut() {
  if (window.__bagpsiAdminShortcutInstalled) return;
  window.__bagpsiAdminShortcutInstalled = true;

  document.addEventListener("keydown", async (event) => {
    if (!(event.ctrlKey && event.shiftKey && event.altKey && event.key.toLowerCase() === "p")) return;
    event.preventDefault();
    if (openingAdmin) return;
    openingAdmin = true;
    try {
      const client = getSupabase();
      const { data, error } = await client.auth.getSession();
      if (error) throw error;
      if (!data.session) {
        alert("Silakan login terlebih dahulu.");
        return;
      }
      const { data: profile, error: profileError } = await client
        .from("profiles").select("role").eq("id", data.session.user.id).maybeSingle();
      if (profileError) throw profileError;
      if (profile?.role !== "admin") {
        alert("Akses ditolak. Akun ini tidak memiliki role Admin.");
        return;
      }
      location.href = new URL("../../pages/admin/index.html", import.meta.url).href;
    } catch (error) {
      console.error("[Admin shortcut]", error);
      alert(`Admin Panel gagal dibuka: ${error.message || error}`);
    } finally {
      openingAdmin = false;
    }
  });
}
