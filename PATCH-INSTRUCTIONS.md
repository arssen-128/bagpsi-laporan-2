# BAGPSI Admin Entry & Routing Fix v0.5

## Opsi B yang diterapkan
- Login Admin dan User tetap melalui `index.html`.
- Setelah login, keduanya tetap diarahkan ke `pages/dashboard.html`.
- Shortcut `Ctrl + Shift + Alt + P` dipasang dari `requireSession()` pada halaman aplikasi yang sudah login.
- Shortcut memanggil RPC `is_bagpsi_admin()`. Hanya jika hasilnya `true`, browser diarahkan ke `pages/admin/index.html`.
- Halaman Admin dan seluruh subhalaman memeriksa session dan RPC lagi.
- Membuka URL Admin secara langsung tanpa marker sesi shortcut akan diarahkan kembali ke Dashboard User.
- Logout dari Admin menghapus marker dan mengakhiri Supabase session.

## File yang diganti/ditambahkan
- `js/core/auth-guard.js` (replace)
- `js/admin/admin-shortcut.js` (replace)
- `js/admin/admin-guard.js` (new)
- `js/admin/admin.js` (replace)
- `pages/admin/index.html` (replace; sekarang memakai shell yang sama dengan subhalaman)
- `pages/admin/users.html`, `reports.html`, `permissions.html`, `audit-log.html`, `system.html`, `settings.html` (normalisasi active navigation dan button type)

## Cara memasang
Ekstrak ZIP, lalu gabungkan isi folder ke root repository `bagpsi-laporan-2`, pertahankan struktur direktori. Commit ke branch `main`.

## Catatan penting
1. `js/pages/login.js` sengaja tidak diubah. Login tetap menuju Dashboard User untuk semua role, sesuai Opsi B.
2. Shortcut menggunakan RPC `is_bagpsi_admin()` yang sudah dipanggil oleh modul Master Personel dan disebut dalam dokumentasi proyek. Jika RPC belum tersedia atau error, akses Admin ditolak (fail closed).
3. Marker `sessionStorage` hanya mengatur jalur masuk UX sesuai Opsi B. Otorisasi sebenarnya tetap dilakukan ulang melalui RPC pada setiap halaman Admin.
4. Dashboard Admin membaca hitungan dari `profiles` dan `laporan_cloud`. Jika RLS tidak mengizinkan SELECT, angka ditampilkan sebagai `—` dan pesan error akan menjelaskan bahwa query/RLS perlu diperiksa.
5. Modul akun, perubahan role, disable, reset password, perubahan template, penghapusan/finalisasi, dan audit log tidak diaktifkan dalam patch ini. Skema database dan Edge Functions untuk operasi tersebut belum diaudit.
6. Tidak ada SQL migration dan tidak ada perubahan pada dashboard User atau stylesheet dashboard.
7. Jangan menghapus file JavaScript duplikat di root pada pemasangan ini. File root tidak menjadi entry point halaman modular yang digunakan, tetapi penghapusan dilakukan terpisah setelah pemeriksaan dependensi lengkap.
