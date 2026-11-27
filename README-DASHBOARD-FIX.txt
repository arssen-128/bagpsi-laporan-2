BAGPSI REPORT — DASHBOARD REDESIGN FIX

ROOT CAUSE:
CSS sebelumnya mengubah .dashboard-sidebar menjadi position:relative. Akibatnya sidebar masuk kembali ke alur dokumen dan mendorong header/dashboard ke bawah, sehingga muncul ruang kosong besar. Perbaikan mengembalikan sidebar menjadi fixed setinggi viewport dan menjaga app-main berada di kolom kanan.

FILE:
- pages/dashboard.html (replace)
- js/pages/dashboard.js (replace)
- css/dashboard.css (replace)
- assets/sidebar-konseling.jpeg (replace/add)
- assets/polda-banten-header.png (replace/add)
- assets/psi-watermark.png (replace/add)

TIDAK PERLU MENGUBAH:
css/app.css, css/base.css, konfigurasi Supabase, auth guard, database, atau RLS.

PENEMPATAN FOTO:
- assets/sidebar-konseling.jpeg: foto mobil pada bagian bawah sidebar, tidak menimpa menu.
- assets/polda-banten-header.png: banner header gedung Polda.
- assets/psi-watermark.png: watermark ringan pada kartu komposisi.

CARA PASANG:
1. Ekstrak ZIP.
2. Upload isi ZIP langsung ke root repository, bukan folder pembungkus.
3. Replace/tambahkan file sesuai path.
4. Commit ke branch main.
5. Setelah deploy, buka /pages/dashboard.html dan tekan Ctrl+Shift+R.

PEMERIKSAAN:
ZIP dan path aset diperiksa. JavaScript dan query Supabase tidak diubah dari paket sebelumnya. Perbaikan utama adalah CSS posisi sidebar. Belum dilakukan browser E2E atau live Supabase test pada akun pengguna.
