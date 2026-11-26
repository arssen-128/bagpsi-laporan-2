# BAGPSI REPORT — Rebuild Multi-Page

Aplikasi dibangun ulang dengan halaman HTML terpisah dan modul JavaScript per halaman.

## Struktur utama
- `index.html`: login.
- `pages/dashboard.html`: dashboard.
- `pages/buat-laporan.html`: editor KARO SDM/KAROPSI, draf lokal, pelaksana, autosave, simpan/edit Supabase.
- `pages/laporan-tersimpan.html`: arsip Supabase, pencarian, filter, pagination, buka laporan.
- `pages/pratinjau.html`: pratinjau dan salin teks draf lokal.
- `pages/master-personel.html`: master personel; tambah/edit/status hanya jika RPC `is_bagpsi_admin()` mengembalikan true.
- `js/core`: session guard dan formatter.
- `js/services`: Supabase client.
- `js/pages`: entry point per halaman.
- `css`: stylesheet global dan per aplikasi.

## Instalasi GitHub Pages
Upload seluruh isi folder hasil ekstrak langsung ke root repository. Jangan upload folder pembungkusnya. `index.html`, `pages/`, `assets/`, `css/`, dan `js/` harus sejajar di root repository.

## Lokasi kegiatan (pembaruan)
- **Lokasi saya sekarang** menggunakan Geolocation API browser. Browser meminta izin lokasi; fitur umumnya memerlukan HTTPS (GitHub Pages sudah menggunakan HTTPS).
- **Pilih di peta** menggunakan Leaflet dan tile OpenStreetMap. Pengguna menggeser peta hingga waypoint/crosshair berada di titik kegiatan, lalu menekan **OK, Gunakan Lokasi**. Tombol **Batal** menutup peta tanpa mengubah lokasi pada form.
- **Isi manual** memungkinkan pengguna memasukkan nama tempat dan alamat lengkap sendiri.
- GPS/peta mengisi alamat hasil reverse geocoding ke textbox lokasi. Koordinat dan sumber lokasi disimpan sebagai `lokasi_meta` di JSON `data.kegiatan`; koordinat tidak ditampilkan dalam teks laporan.
- Mengedit teks lokasi secara manual akan menghapus metadata koordinat sebelumnya agar alamat dan titik tidak berbeda.
- Peta dan geocoding memerlukan koneksi internet. Versi ini menggunakan layanan publik OpenStreetMap/Nominatim; layanan publik memiliki kebijakan penggunaan dan batas kapasitas, sehingga untuk penggunaan produksi berskala tinggi sebaiknya memakai penyedia geocoding dengan SLA/API key atau layanan sendiri. Jangan melakukan request berulang secara masif.

## Supabase
Frontend menggunakan project URL dan publishable key dari konfigurasi sebelumnya. Tabel dan kolom yang dipakai:
- `laporan_cloud`: `id`, `user_id`, `judul`, `jenis`, `data`, `isi_laporan`, `updated_at`.
- `personel_master`: `id`, `nrp`, `pangkat`, `nama`, `gelar`, `jabatan`, `bagian`, `status`, `created_at`, `updated_at`, `created_by`.
- RPC admin: `is_bagpsi_admin`.

Tidak ada SQL migration yang dijalankan. Akses tetap harus dibatasi oleh RLS Supabase. Publishable key boleh ada di frontend; jangan pernah menaruh service_role key.

## Logo
Ganti Logo BAGPSI menggunakan file `assets/PSI.png` yang sudah disertakan. Seluruh halaman merujuk file PNG yang sama. Jika ingin mengganti logo di kemudian hari, cukup replace `assets/PSI.png` dengan file PNG baru bernama sama.

## Catatan teknis
- Halaman terpisah menggunakan link HTML biasa; tidak ada SPA/hash-based page switching.
- Login menyimpan sesi menggunakan Supabase Auth persistent session.
- `requireSession()` melindungi halaman internal dengan mengarahkan ke login jika tidak ada sesi.
- Draf editor disimpan pada localStorage browser.
- Autosave berjalan setelah 2,5 detik tidak ada perubahan dan juga tersedia tombol Simpan Online.
- Buka laporan tersimpan menggunakan URL `buat-laporan.html?id=...`.
- Tanggal arsip diambil dari tanggal kegiatan paling awal dalam JSON `data.kegiatan`.
- Penghapusan arsip tidak diaktifkan; tidak ada tombol hapus yang dapat menghapus data secara tidak sengaja.

## Batas verifikasi
Paket diperiksa untuk sintaks JS, import lokal, referensi file HTML/CSS/JS, dan konsistensi ID selector. Koneksi live Supabase, RLS, RPC admin, dan perilaku browser setelah deployment harus diuji pada project pemilik.


## Siklus status laporan (Draft / Final)
1. Perubahan form disimpan lokal dan di-autosave ke Supabase sebagai `draft` setelah 2,5 detik. Autosave tidak pernah memfinalisasi laporan.
2. Tombol **Simpan Draft** menyimpan/memperbarui status `draft`.
3. Tombol **Finalisasi Laporan** mengubah status menjadi `final` setelah konfirmasi. Laporan final dikunci agar tidak tertimpa oleh autosave.
4. Untuk mengubah laporan final, pilih **Buat Revisi**. Aplikasi membuat record draft baru dari isi final; record final sebelumnya tetap dipertahankan.
5. Halaman Laporan Tersimpan memiliki filter status Draft/Final dan badge status.

### WAJIB sebelum deploy
Jalankan SQL `supabase/migrations/20261126_report_status_draft_final.sql` satu kali pada Supabase SQL Editor. Migrasi menambahkan `status` dan `finalized_at`; semua record lama menjadi `draft` secara konservatif karena autosave versi lama tidak membedakan status. Migrasi tidak mengubah RLS/policies. Jangan menjalankan update massal yang menandai data lama sebagai final tanpa pemeriksaan manual.


## Hak akses Draft dan Final
Lihat `supabase/README-ACCESS-CONTROL.md` dan jalankan migration `supabase/migrations/20261126_draft_visibility_admin_delete.sql` sebelum deploy. Draft hanya terlihat pembuat/admin; Final dapat dibaca semua pengguna terautentikasi; penghapusan Final hanya admin. Arsip menampilkan Baca/Edit/Hapus sesuai status dan hak akses. Final dibaca dalam halaman read-only; revisi dibuat sebagai Draft baru.
