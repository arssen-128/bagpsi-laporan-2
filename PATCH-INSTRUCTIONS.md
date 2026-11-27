# RECOVERY PATCH — BAGPSI ROOT LOGIN + ADMIN PANEL

## Tujuan
Mengembalikan `index.html` root ke halaman login BAGPSI dan menempatkan Admin Panel pada URL terpisah. Patch ini mengikuti struktur modular yang didokumentasikan repository: `js/services/supabase.js`, `js/core/auth-guard.js`, `js/pages/login.js`.

## File dalam ZIP
- `index.html`: salinan halaman login yang tercatat di branch main.
- `pages/admin/index.html` dan `pages/admin/admin.css`: halaman Admin terpisah dengan path asset yang benar.
- `js/admin/admin.js`: validasi session + `profiles.role`, lalu query statistik.
- `js/admin/admin-shortcut.js`: handler shortcut; perlu dihubungkan dari auth guard.
- `PATCH-INSTRUCTIONS.md`: petunjuk integrasi.

## Langkah pemulihan
1. Download ZIP, ekstrak.
2. Dari folder hasil ekstrak, upload/ganti `index.html` ke ROOT repository. Ini mengembalikan halaman login.
3. Upload folder `pages/admin/` dan `js/admin/` ke root repository, jangan upload folder pembungkus ZIP.
4. Pada file `js/core/auth-guard.js` (sesuaikan lokasi persis yang ada di repository), tambahkan import:
   `import { installAdminShortcut } from "../admin/admin-shortcut.js";`
   Di akhir alur `requireSession()` setelah sesi terverifikasi, panggil `installAdminShortcut();`.
5. Commit ke branch `main`.
6. Buka `https://arssen-128.github.io/bagpsi-laporan-2/` untuk login.
7. Admin Panel ada di `https://arssen-128.github.io/bagpsi-laporan-2/pages/admin/index.html`.

## Pemeriksaan sebelum push
- Pastikan file client Supabase benar-benar berada di `js/services/supabase.js`, sesuai struktur README. `admin.js` mengimpor path tersebut.
- Pastikan `profiles` memiliki row untuk akun Admin dengan `role='admin'`.
- Jika statistik gagal dimuat tetapi halaman tampil, cek RLS SELECT untuk `profiles` dan `laporan_cloud`.

## Batasan keamanan
Shortcut bukan otorisasi; halaman memeriksa ulang session dan role. Operasi buat akun, ubah role, disable, reset password, delete/finalize report, dan ubah template tidak disediakan dalam patch ini. Jangan menaruh service_role key di browser. Operasi sensitif memerlukan Edge Function/secure RPC, RLS, dan audit log append-only.
