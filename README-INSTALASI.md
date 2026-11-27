# BAGPSI REPORT — Admin Control Panel (Foundation v0.1)

Paket ini dibuat sebagai fondasi UI modular untuk repository `arssen-128/bagpsi-laporan-2`, berdasarkan struktur dan konfigurasi yang terlihat pada repository publik saat pemeriksaan. File aplikasi utama tidak disertakan/ditimpa; paket ini hanya menambahkan folder `pages/admin/`, `js/admin/`, `css/admin/`, `supabase/`, dan `docs/`.

## Isi
- 7 halaman HTML modular: Dashboard, Manajemen Akun, Manajemen Laporan, Hak Akses, Audit Log, Database & Sistem, Pengaturan.
- Sidebar responsif, autentikasi sesi, pemeriksaan hak Admin melalui RPC `is_bagpsi_admin()`.
- Dashboard dan Manajemen Laporan membaca `laporan_cloud` (maksimum 250 record terbaru).
- Modul akun, perubahan role, finalisasi/hapus, audit log, dan konfigurasi sistem ditahan/nonaktif sampai schema serta Edge Functions diverifikasi.
- Draft desain visual disertakan di `docs/admin-panel-mockup.png`.

## Cara memasang
1. Backup repository terlebih dahulu.
2. Ekstrak ZIP ini; salin folder `pages/admin`, `js/admin`, `css/admin`, dan `docs` ke root repository, dengan mempertahankan struktur folder.
3. Pastikan `config.js` berada di root repository sebagaimana terlihat pada repository publik saat pemeriksaan. Modul admin membuat Supabase client dari konfigurasi tersebut; jika lokasi konfigurasi berbeda pada checkout lokal, sesuaikan import `../../config.js` di `js/admin/admin.js`.
4. Deploy GitHub Pages. Buka `pages/admin/index.html` setelah login.
5. Pastikan RPC `is_bagpsi_admin()` sudah berjalan. Jika tidak tersedia atau mengembalikan false, akses ditolak.

## Batas fungsi saat ini — baca sebelum deploy
Ini **foundation / tahap 1**, bukan implementasi produksi lengkap. Dashboard dan daftar laporan melakukan query baca. Modul pengelolaan akun belum terhubung ke Auth Admin API; tindakan mutasi akun/laporan sengaja tidak dibuat aktif. Tidak ada service-role key di frontend. Tidak ada migration yang otomatis dijalankan. Tidak ada perubahan pada RLS atau schema database.

## Catatan kompatibilitas
Repository saat ini menggunakan Supabase project URL dan publishable key melalui `config.js`, tabel `laporan_cloud`, serta RPC `is_bagpsi_admin()`. Modul admin menggunakan `@supabase/supabase-js` dari esm.sh dan konfigurasi publishable key yang sudah ada. Verifikasi struktur file aktual sebelum menggabungkan.

## Rencana implementasi tahap berikutnya
- Audit aktual schema, RLS, grants, RPC, triggers, dan migrations.
- Tetapkan tabel role resmi dan kebijakan role Admin/User.
- Implementasikan Edge Functions: create user, update role, deactivate user, reset password, dan audit event.
- Terapkan MFA/TOTP atau re-auth untuk akses administratif.
- Implementasikan audit log append-only dengan before/after values.
- Implementasikan ubah template melalui validasi kompatibilitas dan transaksi server-side.
- Uji dengan akun Admin dan User terpisah sebelum produksi.

## Verifikasi yang dilakukan
- File HTML/JS/CSS dibuat dengan path relatif yang konsisten dalam paket.
- Pemeriksaan sintaks JavaScript dapat dilakukan dengan `node --check` setelah ekstraksi (gunakan mode module).
- **Belum** dilakukan browser end-to-end, live Supabase, RLS, Edge Function, atau pengujian deployment. Tidak boleh dianggap lulus sebelum diuji pada project pemilik.
