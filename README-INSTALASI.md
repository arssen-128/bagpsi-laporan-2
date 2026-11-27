# BAGPSI Dashboard UI Fix v0.4

## Root cause verified from the current GitHub source
`css/app.css` defines `.sidebar { position: fixed; ... }`.
But `css/dashboard.css` later defines `.dashboard-sidebar { position: relative; ... }`.
Because `.dashboard-sidebar` has greater specificity, the sidebar returns to normal
document flow. It takes up the first ~420px of the page, so `.app-main` and the hero
begin below it. This is the large blank region shown in the screenshot.

## Install (one small, non-destructive change)
1. Upload `css/dashboard-layout-fix.css` to the repository at `css/dashboard-layout-fix.css`.
2. Open `pages/dashboard.html`.
3. In `<head>`, immediately after:
   `<link rel="stylesheet" href="../css/dashboard.css">`
   add:
   `<link rel="stylesheet" href="../css/dashboard-layout-fix.css">`
4. Commit and push to `main`.
5. Open the dashboard and press `Ctrl + F5`.

## Expected result
- Sidebar stays fixed at the left from the top of the viewport.
- Hero begins at the top of the main content, not after the sidebar's natural height.
- Main content remains offset by 258px on desktop.
- Existing mobile slide-in sidebar behavior remains available.

This patch only fixes layout. It does not change report data, Supabase queries,
authentication, routes, or any database schema.
