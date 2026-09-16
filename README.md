# Uangku

Aplikasi keuangan harian dan target tabungan dalam bahasa Indonesia, nyaman untuk iPhone. Tidak ada data contoh: mulai dari saldo nol, lalu catat saldo awal sebagai pemasukan.

## Jalankan

Node.js 22 atau lebih baru: `npm run dev`, buka http://127.0.0.1:5174. Jalankan `npm test` untuk verifikasi perhitungan. Tidak perlu install dependensi. File statis dapat dihosting melalui GitHub Pages.

## Fitur

Pemasukan, pengeluaran, edit/hapus transaksi, filter bulan dan jenis, anggaran bulanan, laporan kategori, beberapa target tabungan, setor/ambil tabungan, ekspor CSV, cadangan/pemulihan JSON, dan shell offline. Transfer tabungan tidak dihitung sebagai pemasukan/pengeluaran.

## Penyimpanan

Versi awal menyimpan data di localStorage perangkat/browser ini. Belum ada login, database cloud, enkripsi aplikasi, atau sinkronisasi. Unduh cadangan JSON secara berkala melalui Pengaturan. Safari dan aplikasi Home Screen bisa memiliki penyimpanan berbeda; pulihkan cadangan jika berpindah. Menghapus data browser dapat menghapus catatan. Jangan menyimpan cadangan transaksi di repository GitHub.

## iPhone

Buka alamat HTTPS di Safari → Bagikan → Tambahkan ke Layar Utama. Pengujian iPhone fisik masih diperlukan. Service worker menyediakan aset lokal saat offline setelah kunjungan pertama. Pembaruan aktif setelah semua jendela aplikasi versi lama ditutup.
