# BAGPSI Dashboard + Admin access patch v0.2

## Temuan yang ditangani
1. `css/dashboard.css` menetapkan `.dashboard-sidebar { position: relative; }`.
   Ini menimpa `.sidebar { position: fixed; }` pada `css/app.css`. Sidebar
   akhirnya kembali ke alur dokumen, mengambil tinggi satu baris, dan mendorong
   `.app-main` ke bawah. Gejala ini sesuai dengan ruang kosong besar pada screenshot.
2. `js/core/auth-guard.js` saat ini hanya memasang logout dan mobile menu;
   belum ada listener `Ctrl+Shift+Alt+P`.
3. `js/admin/admin-guard.js` tidak ada pada branch `main` saat pemeriksaan.
4. `pages/admin/index.html` belum ada pada branch `main`.

## Cara pasang
1. Salin `css/dashboard-fix.css` ke repository.
2. Pada `pages/dashboard.html`, tambahkan setelah link `dashboard.css`:
   `<link rel="stylesheet" href="../css/dashboard-fix.css">`
3. Salin folder `js/admin/` dan `pages/admin/` ke root repository.
4. Pada `js/core/auth-guard.js`, tambahkan import:
   `import { installAdminShortcut } from "../admin/admin-shortcut.js";`
   lalu panggil `installAdminShortcut();` di dalam `requireSession()` setelah sesi berhasil diperoleh.
5. Pastikan tabel `profiles` berisi baris untuk user yang akan menjadi Admin dengan `role='admin'`.
6. Commit dan push, lalu hard refresh browser (Ctrl+F5).

## Catatan keamanan dan batasan
- Shortcut bukan mekanisme otorisasi. Kode memeriksa sesi Supabase dan `profiles.role`.
- Admin page memeriksa role lagi. RLS wajib tetap menjadi batas keamanan di database.
- ZIP ini belum mengubah role, membuat/menghapus akun, menonaktifkan akun,
  menghapus/finalisasi laporan, atau mengubah template.
- Operasi tersebut harus menggunakan Edge Functions/secure RPC, audit trail
  append-only, dan policy RLS yang sudah diverifikasi.
- SQL yang diberikan pengguna tidak memuat policies/RLS atau tabel audit log.
  Karena itu ZIP ini tidak menambahkan migration SQL yang berisiko mengunci
  atau membuka data tanpa pemeriksaan policies yang sebenarnya.
- Query ringkasan dashboard admin hanya akan berhasil bila policies RLS
  mengizinkan Admin membaca data yang dimaksud.
