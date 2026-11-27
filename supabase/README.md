# Supabase backend — intentionally not migrated in v0.1

Folder ini disediakan untuk migration dan Edge Functions tahap berikutnya, tetapi belum berisi migration yang mengubah database. Alasannya: struktur tabel, policy RLS, grants, function, dan trigger pada project aktif belum diperiksa melalui koneksi database. Membuat migration role/audit berdasarkan asumsi dapat merusak fungsi `is_bagpsi_admin()` yang sudah digunakan aplikasi.

Sebelum membuat migration:
1. Export schema aktual dari Supabase (tanpa secrets).
2. Inventarisasi semua RLS policies, grants, functions, triggers, dan extensions.
3. Pastikan sumber role Admin/User dan perilaku `is_bagpsi_admin()`.
4. Rancang migrasi additive dan idempotent, lalu uji pada project/staging.

Edge Functions yang direncanakan: `admin-create-user`, `admin-update-user-role`, `admin-disable-user`, `admin-reset-password`, `admin-report-action`, dan `admin-audit-write`. Semua operasi sensitif harus memvalidasi JWT, role Admin, payload, dan menulis audit log di server. `SUPABASE_SERVICE_ROLE_KEY` hanya boleh disimpan sebagai secret function.
