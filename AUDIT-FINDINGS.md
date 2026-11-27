# Audit findings from uploaded repository ZIP

1. `js/pages/login.js` currently routes an existing session and a successful sign-in to `./pages/dashboard.html`. This is preserved because the selected requirement is Opsi B.
2. `js/admin/admin-shortcut.js` exists but is not imported or invoked by `js/core/auth-guard.js`; therefore no keyboard listener is registered on authenticated app pages.
3. The canonical modular auth guard is `js/core/auth-guard.js`; it is imported by modular page entry points such as `js/pages/dashboard.js`, `archive.js`, `report-editor.js`, `personnel.js`, and others.
4. Admin landing page `pages/admin/index.html` used a separate `admin-page` markup and loaded `./admin.css`, while the six submodule pages used the shared `.layout/.sidebar/.main/#content` shell and `../../css/admin/admin.css`.
5. The existing `js/admin/admin.js` expected dashboard IDs (`admin-email`, `users-count`, `db-status`) and did not implement the `#content` module renderer expected by submodule pages. Thus the six submodule pages could not be initialized by the current script.
6. A root-level duplicate `admin-shortcut.js` and other root JS/CSS duplicates exist. This patch leaves them untouched to avoid deleting files without a full dependency graph.
7. Existing app code calls `client.rpc("is_bagpsi_admin")` in `js/pages/personnel.js` and `js/pages/karopsi-builder.js`; project security design also names this RPC as the admin gate. Patch uses it and fails closed if the RPC errors.
8. No database migration is included. The uploaded repository's `supabase/README.md` explicitly says migrations are not added because live policies, grants, functions, and triggers have not been audited.
