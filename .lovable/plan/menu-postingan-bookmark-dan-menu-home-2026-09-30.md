# Menu postingan, bookmark, dan menu Home

## Yang akan dibangun
- Tambahkan tombol tiga titik di kanan atas setiap postingan.
- Untuk postingan sendiri, sediakan **Edit** dan **Hapus**; edit dilakukan langsung dengan batas 500 karakter.
- Untuk postingan pengguna lain, sediakan **Laporkan** dengan pilihan alasan dan konfirmasi sebelum dikirim.
- Tambahkan tombol bookmark pada baris interaksi setiap postingan; status tersimpan terlihat jelas dan bisa dibatalkan.
- Tambahkan tombol tiga garis di kanan atas halaman Home dengan menu **Grup**, **Buat grup — segera hadir**, **Verifikasi akun — segera hadir**, dan **Bookmark**.
- Menu Bookmark membuka daftar postingan yang disimpan. Grup membuka tampilan placeholder sederhana, sedangkan dua fitur “segera hadir” tidak menjalankan aksi palsu.

## Penyimpanan dan keamanan
- Buat data bookmark per pengguna dan per postingan; hanya pemilik yang dapat melihat, menambah, atau menghapus bookmark mereka.
- Buat data laporan postingan dengan alasan; pengguna hanya dapat mengirim dan melihat laporan miliknya, serta tidak dapat mengubah atau menghapus laporan yang sudah dikirim.
- Pertahankan aturan bahwa hanya penulis postingan yang dapat mengedit atau menghapus postingannya.

## Detail teknis
- Gunakan menu, dialog, tombol, ikon, dan notifikasi yang sudah tersedia agar konsisten dengan tampilan frosted-glass Ponscaster.
- Perluas pembacaan feed agar status bookmark pengguna ikut ditampilkan tanpa mengubah isi postingan publik.
- Perbarui tipe database yang dihasilkan setelah perubahan database diterapkan.
- Uji menu, edit, hapus, report, bookmark, serta tampilan desktop dan mobile; pastikan aplikasi tetap lolos pemeriksaan build.
