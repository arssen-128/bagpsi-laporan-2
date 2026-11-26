BAGPSI REPORT — PERSONNEL PICKER DUPLICATE RULE FIX

PERUBAHAN LOGIKA:
1. Personel yang sudah dipilih pada satu kegiatan disembunyikan dari hasil dropdown kegiatan yang sama.
2. Personel yang sama tetap tersedia dan boleh dipilih pada kegiatan lain dalam laporan yang sama.
3. Validasi duplikasi dilakukan kembali ketika tombol Tambah Pelaksana ditekan, sehingga duplikasi dalam satu kegiatan tetap ditolak meskipun input dilakukan melalui jalur lain.
4. Jika personel dihapus dari daftar pelaksana suatu kegiatan, personel tersebut kembali muncul pada dropdown kegiatan itu.
5. Pengurutan pangkat tertinggi dan aksen gold untuk personel teratas tetap dipertahankan.

FILE YANG DIGANTI:
- pages/buat-laporan.html
- js/pages/report-editor.js
- css/app.css

CARA PEMASANGAN:
Ekstrak ZIP. Upload/replace ketiga file di atas ke path yang sama pada root repository GitHub. Jangan upload folder pembungkus BAGPSI-DRAFT-ACCESS-CONTROL sebagai subfolder baru. Commit ke branch yang digunakan GitHub Pages, lalu hard refresh halaman.

TIDAK ADA MIGRASI DATABASE.

PENGUJIAN YANG PERLU DILAKUKAN SETELAH DEPLOY:
A. Kegiatan 1: pilih Personel A. Pastikan Personel A hilang dari dropdown Kegiatan 1.
B. Kegiatan 2: cari Personel A. Pastikan Personel A masih tersedia dan dapat dipilih.
C. Kegiatan 1: hapus Personel A. Pastikan Personel A muncul kembali di dropdown Kegiatan 1.
D. Coba menambahkan Personel A dua kali pada Kegiatan 1 melalui jalur input apa pun. Penambahan kedua harus ditolak.

Pemeriksaan yang telah dilakukan: node --check pada js/pages/report-editor.js.
Belum dilakukan: pengujian browser live dan transaksi Supabase pada project pengguna.
