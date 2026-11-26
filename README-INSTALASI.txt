BAGPSI REPORT — PATCH ARSIP AKSI V2

PAKET INI MENARGETKAN FILE AKTIF DI REPOSITORY:
- pages/laporan-tersimpan.html (replace)
- js/pages/archive.js (replace)
- css/app.css (replace; stylesheet dasar + tambahan aksi arsip)
- pages/baca-laporan.html (add)
- js/pages/read-report.js (add)

UPLOAD:
Ekstrak ZIP, lalu upload isi folder langsung ke root repository bagpsi-laporan-2.
Jangan upload folder pembungkus BAGPSI-ARSIP-AKSI-FIX-V2.

FITUR:
- Filter status Draft/Final.
- Baca semua laporan yang dapat diakses oleh RLS.
- Edit hanya Draft milik pembuat atau yang dikelola admin.
- Hapus Draft oleh pembuat/admin; hapus Final oleh admin.
- Indikator koneksi di bawah email diperbarui setelah query arsip berhasil/gagal.

PRASYARAT:
- Kolom status, finalized_at, deleted_at pada public.laporan_cloud.
- RPC public.is_bagpsi_admin() tersedia dan mengembalikan boolean.
- RLS Supabase harus sudah menerapkan hak akses Draft/Final yang telah disepakati.
- Kolom user_id harus terisi dengan auth.uid() untuk laporan baru.

CATATAN PENTING:
- Tombol UI bukan pengamanan. RLS database tetap menjadi enforcement utama.
- Tombol Hapus memakai DELETE fisik dan harus ditolak RLS jika pengguna tidak berwenang.
- Status Final hanya dapat dibaca semua pengguna login jika policy SELECT final memang telah aktif.
- Paket ini belum diuji terhadap project Supabase live atau browser live.
- Jika CSS dasar repository telah berubah sejak snapshot yang menjadi dasar patch, lakukan diff sebelum mengganti css/app.css. File css/app.css di paket ini membawa stylesheet dasar beserta tambahan arsip.
