BAGPSI REPORT - SMART PERSONNEL PICKER UPDATE

File yang diperbarui:
- pages/buat-laporan.html
- js/pages/report-editor.js
- css/app.css

Cara memasang:
1. Ekstrak ZIP.
2. Upload isi folder pages/, js/, dan css/ ke root repository bagpsi-laporan-2.
3. Replace file pada path yang sama persis.
4. Commit ke branch main.
5. Tunggu GitHub Pages selesai deploy, lalu hard refresh (Ctrl+Shift+R).

Perubahan:
- Dropdown native diganti searchable dropdown bergaya kartu.
- Pencarian menggunakan nama, NRP, pangkat, jabatan, dan bagian.
- Memilih personel tetap mengisi pangkat, nama, gelar, dan jabatan secara otomatis.
- Setelah menambahkan personel, picker di-reset dan tetap dapat digunakan untuk memilih personel berikutnya.
- Personel yang sama tidak disembunyikan/dinonaktifkan setelah dipilih; pemilihan ulang tetap dimungkinkan.
- Daftar pelaksana diurutkan berdasarkan hierarki pangkat yang dikenali aplikasi.
- Personel dengan pangkat tertinggi dalam daftar ditandai dengan aksen gold tanpa label penjelasan.
- Penghapusan personel dari daftar tetap tersedia.

Catatan:
- Pembaruan ini hanya menyentuh UI picker, pengurutan daftar pelaksana, dan styling.
- Tidak mengubah schema database, tabel Master Personel, RLS, alur Draft/Final, maupun mekanisme penyimpanan laporan.
- Uji sintaks JavaScript dilakukan dengan node --check. Belum dilakukan pengujian browser live pada akun Supabase.
