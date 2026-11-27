import { getSupabase } from "../services/supabase.js";

const SHORTCUT = (e) =>
  e.ctrlKey && e.shiftKey && e.altKey &&
  (e.key || "").toLowerCase() === "p";

let busy = false;

export function installAdminShortcut() {
  if (window.__bagpsiAdminShortcutInstalled) return;
  window.__bagpsiAdminShortcutInstalled = true;

  document.addEventListener("keydown", async (event) => {
    if (!SHORTCUT(event)) return;
    event.preventDefault();
    if (busy) return;
    busy = true;

    try {
      const client = getSupabase();
      const { data: sessionData, error: sessionError } = await client.auth.getSession();
      if (sessionError) throw sessionError;
      const user = sessionData?.session?.user;
      if (!user) {
        alert("Silakan login terlebih dahulu.");
        return;
      }

      const { data: profile, error } = await client
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (error) throw error;
      if (profile?.role !== "admin") {
        alert("Akses ditolak. Akun ini tidak memiliki role Admin.");
        return;
      }

      window.location.href = new URL("../admin/index.html", window.location.href).href;
    } catch (err) {
      console.error("[BAGPSI Admin Shortcut]", err);
      alert(`Tidak dapat membuka Admin Panel: ${err.message || "Terjadi kesalahan."}`);
    } finally {
      busy = false;
    }
  });
}
