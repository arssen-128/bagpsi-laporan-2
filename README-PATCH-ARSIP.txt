# BAGPSI REPORT — Patch Aksi Arsip

## File yang harus diganti / ditambahkan
- Replace `pages/laporan-tersimpan.html`
- Replace `js/pages/archive.js`
- Replace `css/app.css`
- Add `pages/baca-laporan.html`
- Add `js/pages/read-report.js`

## Prasyarat database
Jalankan kedua migration SQL sesuai urutan di `supabase/migrations/` pada Supabase SQL Editor, setelah meninjau kebijakan RLS dan memastikan fungsi `public.is_bagpsi_admin()` tersedia. Jika migration draft/final dan RLS sebelumnya sudah berhasil dijalankan, jangan jalankan ulang migration RLS tanpa review.

## Perilaku tombol
- Baca: membuka halaman baca-saja.
- Edit: hanya muncul untuk Draft milik pengguna atau admin.
- Hapus: Draft dapat dihapus pemilik/admin; Final hanya admin.
- Status dan visibilitas tetap harus ditegakkan oleh RLS Supabase, bukan UI saja.

Paket ini adalah patch frontend arsip. Belum diuji pada project Supabase live.
