import { getSupabase } from "../services/supabase.js";
import { installAdminShortcut } from "../admin/admin-shortcut.js";

export async function requireSession() {
  const client = getSupabase();
  const { data, error } = await client.auth.getSession();
  if (error) throw error;

  if (!data.session) {
    location.replace(new URL("../index.html", location.href));
    return null;
  }

  const email = document.querySelector("#account-email");
  if (email) email.textContent = data.session.user.email || "Akun aktif";

  const logout = document.querySelector("#logout-button");
  if (logout && !logout.dataset.bound) {
    logout.dataset.bound = "1";
    logout.addEventListener("click", async () => {
      logout.disabled = true;
      const { error: logoutError } = await client.auth.signOut();
      if (logoutError) {
        logout.disabled = false;
        notify(logoutError.message, true);
        return;
      }
      try { sessionStorage.removeItem("bagpsi.admin.entry"); } catch {}
      location.replace(new URL("../index.html", location.href));
    });
  }

  client.auth.onAuthStateChange((_event, session) => {
    if (!session) {
      try { sessionStorage.removeItem("bagpsi.admin.entry"); } catch {}
      location.replace(new URL("../index.html", location.href));
    }
  });

  // Shortcut is registered only on authenticated application pages.
  // It does not grant authorization; the RPC and admin page guard re-check it.
  installAdminShortcut(client);
  setupMobileMenu();

  return { client, session: data.session, user: data.session.user };
}

export function notify(message, error = false) {
  const node = document.querySelector("#toast");
  if (!node) { alert(message); return; }
  node.textContent = message;
  node.classList.toggle("error", error);
  node.classList.add("show");
  clearTimeout(notify.timer);
  notify.timer = setTimeout(() => node.classList.remove("show"), 2800);
}

function setupMobileMenu() {
  const frame = document.querySelector(".app-frame");
  const toggle = document.querySelector("#menu-toggle");
  const backdrop = document.querySelector("#mobile-backdrop");
  const close = () => {
    frame?.classList.remove("menu-open");
    toggle?.setAttribute("aria-expanded", "false");
  };

  if (toggle && !toggle.dataset.bound) {
    toggle.dataset.bound = "1";
    toggle.addEventListener("click", () => {
      const open = !frame?.classList.contains("menu-open");
      frame?.classList.toggle("menu-open", open);
      toggle.setAttribute("aria-expanded", String(Boolean(open)));
    });
  }
  backdrop?.addEventListener("click", close);
  document.querySelectorAll(".nav-link").forEach(link => {
    if (link.dataset.menuBound) return;
    link.dataset.menuBound = "1";
    link.addEventListener("click", close);
  });
  if (!document.documentElement.dataset.escapeBound) {
    document.documentElement.dataset.escapeBound = "1";
    document.addEventListener("keydown", event => {
      if (event.key === "Escape") close();
    });
  }
}
