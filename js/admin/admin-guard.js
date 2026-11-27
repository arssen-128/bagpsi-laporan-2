import { getSupabase } from "../services/supabase.js";

const ENTRY_KEY = "bagpsi.admin.entry";

export async function requireAdminPanel() {
  const client = getSupabase();
  const { data: sessionData, error: sessionError } = await client.auth.getSession();
  if (sessionError) throw sessionError;

  const session = sessionData?.session;
  if (!session) {
    sessionStorage.removeItem(ENTRY_KEY);
    location.replace(new URL("../../index.html", location.href));
    return null;
  }

  // Opsi B: admin panel is entered from the authenticated app shortcut.
  // This marker is navigation UX only, never the security boundary.
  if (sessionStorage.getItem(ENTRY_KEY) !== "1") {
    alert("Dashboard Admin dibuka melalui shortcut Ctrl + Shift + Alt + P dari aplikasi BAGPSI.");
    location.replace(new URL("../dashboard.html", location.href));
    return null;
  }

  // Always re-validate role against the database on every Admin page load.
  const { data: isAdmin, error: roleError } = await client.rpc("is_bagpsi_admin");
  if (roleError) throw roleError;
  if (isAdmin !== true) {
    sessionStorage.removeItem(ENTRY_KEY);
    alert("Akses Admin tidak dapat diverifikasi. Anda dikembalikan ke Dashboard User.");
    location.replace(new URL("../dashboard.html", location.href));
    return null;
  }

  const emailNode = document.querySelector("#account-email");
  if (emailNode) emailNode.textContent = session.user.email || "Administrator";

  const logout = document.querySelector("#logout");
  if (logout && !logout.dataset.bound) {
    logout.dataset.bound = "1";
    logout.addEventListener("click", async () => {
      logout.disabled = true;
      const { error } = await client.auth.signOut();
      if (error) {
        logout.disabled = false;
        showToast(error.message, true);
        return;
      }
      sessionStorage.removeItem(ENTRY_KEY);
      location.replace(new URL("../../index.html", location.href));
    });
  }

  client.auth.onAuthStateChange((_event, nextSession) => {
    if (!nextSession) {
      sessionStorage.removeItem(ENTRY_KEY);
      location.replace(new URL("../../index.html", location.href));
    }
  });

  setupAdminMobileMenu();
  return { client, session, user: session.user };
}

function showToast(message, error = false) {
  const node = document.querySelector("#toast");
  if (!node) { alert(message); return; }
  node.textContent = message;
  node.classList.toggle("error", error);
  node.classList.add("show");
  setTimeout(() => node.classList.remove("show"), 3000);
}

function setupAdminMobileMenu() {
  const layout = document.querySelector(".layout");
  const toggle = document.querySelector("#menu-toggle");
  if (!layout || !toggle || toggle.dataset.bound) return;
  toggle.dataset.bound = "1";
  toggle.addEventListener("click", () => layout.classList.toggle("menu-open"));
}
