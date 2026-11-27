# BAGPSI REPORT — Implementasi Kompilasi KAROPSI

## Isi paket
- Halaman baru `pages/karopsi-builder.html`.
- Modul `js/pages/karopsi-builder.js`.
- Tabel relasi snapshot `laporan_kompilasi_sumber`.
- Migration RLS `supabase/migrations/20261127_karopsi_compilation.sql`.
- Link navigasi Kompilasi KAROPSI pada halaman internal.

## Prasyarat
1. Jalankan migration status Draft/Final `20261126_report_status_draft_final.sql` terlebih dahulu.
2. Pastikan RPC `public.is_bagpsi_admin()` sudah ada dan mengembalikan boolean.
3. Pastikan tabel `laporan_cloud` memiliki kolom `id`, `user_id`, `judul`, `jenis`, `data`, `isi_laporan`, `status`, `updated_at`, dan `finalized_at`.
4. Pastikan policy `laporan_cloud` yang ada mengizinkan user membuat Draft miliknya, membaca laporan Final, dan membaca Draft miliknya/Admin. Migration ini tidak mengubah policy tabel utama.
5. Jalankan migration baru melalui Supabase SQL Editor.

## Cara deploy
Upload isi ZIP langsung ke root repository GitHub Pages, dengan mempertahankan direktori `pages/`, `js/`, `css/`, dan `supabase/`. Jangan mengunggah folder pembungkus ZIP.

## Alur fitur
- Sumber yang ditampilkan: `jenis = karo_sdm` dan `status = final`, sesuai akses RLS user.
- Satu sumber hanya dapat dipilih sekali dalam satu kompilasi; sumber yang sama boleh dipakai di kompilasi lain.
- Data sumber disalin sebagai snapshot pada tabel relasi dan `data.sumber_kompilasi`.
- Draft kompilasi dapat diedit oleh pembuat/Admin sesuai policy tabel utama.
- Finalisasi mengubah status parent menjadi `final`; snapshot relasi tidak berubah.

## Batasan yang wajib diketahui
- Migration ini mengasumsikan fungsi `is_bagpsi_admin()` tersedia, sebagaimana dipanggil modul Master Personel.
- Policy tabel `laporan_cloud` tidak diganti karena definisi policy produksi perlu diverifikasi terlebih dahulu.
- Pembukaan ulang/revisi laporan sumber Final masih mengikuti mekanisme revisi yang sudah ada pada editor. Paket ini tidak mengubah mekanisme revisi sumber.
- Formatter mengandalkan struktur `data.kegiatan[0]` pada laporan KARO SDM. Data historis dengan struktur berbeda perlu diperiksa dan mungkin memerlukan penyesuaian formatter.
- Penyimpanan parent dan tabel relasi dilakukan berurutan melalui client, bukan satu transaksi RPC. Jika insert relasi gagal setelah parent tersimpan, Draft induk dapat tertinggal tanpa relasi; pengguna dapat membuka Draft dan menyimpan ulang. Transaksi RPC atomik direkomendasikan sebagai tahap penguatan berikutnya.

## Pemeriksaan yang dilakukan
Paket diperiksa untuk syntax JavaScript, referensi file lokal, dan struktur direktori. Belum dilakukan uji browser dengan akun Supabase, uji RLS pada project produksi, atau uji end-to-end. Karena itu jangan menganggap fitur sudah live sebelum migration dan pengujian tersebut selesai.
