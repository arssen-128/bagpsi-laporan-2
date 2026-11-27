const ENTRY_KEY = "bagpsi.admin.entry";
let installed = false;
let opening = false;

export function installAdminShortcut(client) {
  if (installed || !client) return;
  installed = true;

  document.addEventListener("keydown", async event => {
    const key = (event.key || "").toLowerCase();
    const target = event.target;
    const typing = target instanceof HTMLElement &&
      (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

    if (!(event.ctrlKey && event.shiftKey && event.altKey && key === "p")) return;
    if (typing || event.repeat) return;

    event.preventDefault();
    if (opening) return;
    opening = true;

    try {
      const { data: sessionData, error: sessionError } = await client.auth.getSession();
      if (sessionError) throw sessionError;
      if (!sessionData?.session) {
        alert("Sesi login tidak ditemukan. Silakan login kembali.");
        return;
      }

      // Database RPC is the authority for Admin status.
      const { data: isAdmin, error: roleError } = await client.rpc("is_bagpsi_admin");
      if (roleError) throw roleError;
      if (isAdmin !== true) {
        alert("Akses ditolak. Shortcut Admin hanya tersedia untuk akun Administrator.");
        return;
      }

      // UX entry marker: Admin pages still re-check session and server role.
      sessionStorage.setItem(ENTRY_KEY, "1");
      window.location.assign(new URL("./admin/index.html", window.location.href).href);
    } catch (error) {
      console.error("[BAGPSI Admin Shortcut]", error);
      alert(`Verifikasi Admin gagal: ${error.message || "Periksa koneksi dan RPC is_bagpsi_admin."}`);
    } finally {
      opening = false;
    }
  });
}
