# Changelog — Kompilasi KAROPSI

## 27 November 2026 — perbaikan transaksi dan diagnosis sumber kosong
- Penyimpanan Draft/Final kompilasi dipindahkan ke RPC database transaksional.
- Validasi sumber dilakukan ulang di database: sumber wajib `jenis='karo_sdm'` dan `status='final'`.
- ID sumber duplikat ditolak.
- Snapshot data dan teks setiap sumber dibuat dalam transaksi yang sama dengan laporan induk.
- Ditambahkan kebijakan SELECT untuk laporan KARO SDM Final agar dapat ditemukan lintas pengguna terautentikasi (tetap tunduk pada kebijakan RLS lain yang berlaku).
- Pesan halaman menjelaskan bahwa data lama yang masih Draft harus diperiksa dan difinalisasi satu per satu; tidak ada promosi massal otomatis.
