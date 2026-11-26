# Quality Check — BAGPSI REPORT Rebuild

## Pemeriksaan statis yang dijalankan
- Seluruh file JavaScript diperiksa dengan `node --check`.
- Seluruh import relatif antar-modul diperiksa keberadaannya.
- Seluruh `src`/`href` lokal pada HTML diperiksa keberadaan targetnya.
- ID HTML duplikat diperiksa per halaman.
- Setiap halaman internal memiliki entry-point JavaScript khusus.
- Login terpisah dari halaman internal; halaman internal memakai session guard.
- Tidak ada `service_role` key dalam project.

## Hasil pemeriksaan paket
- 10 file JavaScript: 0 syntax error.
- Import lokal hilang: 0.
- Referensi file lokal HTML/CSS/JS hilang: 0.
- ID HTML duplikat: 0.

## Pengujian yang tetap wajib dilakukan setelah deployment
1. Login dengan akun BAGPSI yang benar.
2. Logout lalu coba akses URL internal langsung; harus diarahkan ke login.
3. Buka Dashboard, Buat Laporan, Arsip, Pratinjau, Master Personel melalui link halaman.
4. Simpan laporan KARO SDM dan KAROPSI.
5. Pastikan autosave tidak membuat duplikasi laporan.
6. Buka laporan dari arsip, ubah, lalu simpan kembali.
7. Uji filter arsip dan pagination.
8. Uji master personel dengan akun admin dan non-admin.
9. Pastikan RLS membatasi data sesuai kebijakan Supabase.

## Batas jaminan
Tidak ada dasar untuk menjanjikan "no bug" sebelum uji end-to-end di lingkungan deployment, akun, dan database pemilik. Paket ini sudah lolos pemeriksaan statis di atas; koneksi live Supabase, RLS, dan hak admin belum dapat diverifikasi dari lingkungan pembuatan.


## Pembaruan pemilih lokasi
- Ditambahkan tiga jalur input: GPS perangkat, waypoint pada peta, dan input manual.
- Hasil GPS/peta diubah menjadi alamat melalui reverse geocoding dan dimasukkan ke textbox lokasi.
- Koordinat disimpan sebagai metadata pada JSON laporan, bukan pada teks laporan.
- Tombol Batal pada dialog peta/manual tidak menerapkan perubahan lokasi.
- Pemeriksaan pada paket ini bersifat statis; GPS, tile peta, geocoding, izin browser, dan penyimpanan Supabase tetap harus diuji pada deployment HTTPS dengan perangkat nyata.


## Siklus Draft/Final
- Autosave cloud hanya menulis `status='draft'`.
- Simpan Draft tetap draft.
- Finalisasi hanya melalui tombol eksplisit dan menyimpan `finalized_at`.
- Final dikunci; perubahan dilakukan melalui Buat Revisi yang membuat record draft baru.
- Arsip menampilkan dan memfilter Draft/Final.
- SQL migration wajib dijalankan sebelum deploy; pemeriksaan browser/Supabase live belum dilakukan.
