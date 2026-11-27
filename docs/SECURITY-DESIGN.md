# Security design decisions

1. Shortcut keyboard hanya pemicu navigasi, bukan autentikasi.
2. Server/database tetap menjadi otoritas untuk role. UI memanggil `is_bagpsi_admin()` hanya sebagai gerbang tampilan; setiap operasi mutasi wajib memverifikasi role lagi di server.
3. `service_role` tidak boleh masuk ke HTML, JavaScript, repository, atau GitHub Pages. Simpan sebagai secret pada Supabase Edge Functions.
4. Admin Panel sebaiknya memakai MFA/TOTP atau re-authentication, session admin berumur pendek, rate limiting, dan audit atas kegagalan verifikasi.
5. Jangan izinkan penonaktifan/penghapusan Admin terakhir. Deaktivasi akun tidak sama dengan menghapus data laporan.
6. Audit log bersifat append-only, ditulis server-side, dan tidak menyediakan operasi edit/delete melalui UI.
7. Pengubahan template harus memvalidasi struktur data dan menyimpan before/after; jika tidak kompatibel, tolak dan minta proses migrasi/revisi yang eksplisit.
8. Laporan Final tidak boleh ditimpa autosave. Perubahan dilakukan melalui revisi; snapshot kompilasi KAROPSI tidak boleh berubah diam-diam.
