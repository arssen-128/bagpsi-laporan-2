BAGPSI REPORT — DASHBOARD VISUAL UPDATE

Paket ini adalah patch khusus Dashboard. Tidak mengganti konfigurasi Supabase, auth guard, editor laporan, arsip, atau master personel.

FILE YANG DI-REPLACE DI REPOSITORY:
- pages/dashboard.html
- js/pages/dashboard.js

FILE BARU:
- css/dashboard.css
- assets/sidebar-konseling.jpeg
- assets/polda-banten-header.png
- assets/psi-watermark.png

FILE YANG SUDAH ADA DAN TIDAK DIGANTI:
- css/base.css
- css/app.css
- assets/PSI.png
- js/core/auth-guard.js
- js/services/supabase.js
- js/config.js

CARA PASANG:
1. Ekstrak ZIP.
2. Upload isi folder sesuai path ke root repository bagpsi-laporan-2 (jangan upload folder pembungkus).
3. Replace pages/dashboard.html dan js/pages/dashboard.js.
4. Tambahkan css/dashboard.css.
5. Tambahkan tiga gambar ke assets/.
6. Commit ke branch main.
7. Setelah GitHub Pages selesai deploy, buka /pages/dashboard.html dan tekan Ctrl+Shift+R.

PENEMPATAN FOTO:
- Foto mobil konseling: assets/sidebar-konseling.jpeg
- Foto gedung Polda Banten: assets/polda-banten-header.png
- Logo PSI watermark: assets/psi-watermark.png
- Logo identitas di sidebar tetap menggunakan assets/PSI.png yang sudah ada.

DATA & KEAMANAN:
- Dashboard memakai tabel laporan_cloud dan Supabase client yang sudah ada.
- Ringkasan count memakai query count exact; hasil tetap mengikuti RLS akun yang sedang login.
- Draft tidak ditampilkan jika RLS tidak mengizinkan akun melihatnya.
- Tren dihitung dari updated_at dalam enam bulan terakhir, maksimal 1.000 baris yang dikembalikan API.
- Kartu personel unik/notifikasi aktivitas tidak ditampilkan karena sumber data agregat/notifikasi belum terverifikasi. Tidak ada angka contoh yang dipasang.
- Koneksi ditandai terhubung hanya setelah query dashboard berhasil.

BATAS PENGUJIAN:
- JavaScript diperiksa dengan node --check.
- Path asset dan import relatif diperiksa secara statis.
- Belum dilakukan login, RLS, query Supabase, atau uji tampilan browser live pada project pemilik.
