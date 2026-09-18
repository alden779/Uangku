# Uangku

Aplikasi keuangan harian dan target tabungan dalam bahasa Indonesia, nyaman untuk iPhone. Tidak ada data contoh: mulai dari saldo nol, lalu catat saldo awal sebagai pemasukan.

## Jalankan

Node.js 22 atau lebih baru: `npm run dev`, buka http://127.0.0.1:5174. Jalankan `npm test` untuk verifikasi perhitungan. Tidak perlu install dependensi. File statis dapat dihosting melalui GitHub Pages.

## Fitur

Pemasukan, pengeluaran, edit/hapus transaksi, filter bulan dan jenis, anggaran bulanan, laporan kategori, beberapa target tabungan, setor/ambil tabungan, laporan Excel (.xlsx), CSV, cadangan/pemulihan JSON, dan shell offline. Transfer tabungan tidak dihitung sebagai pemasukan/pengeluaran.

## Laporan dan backup

Pada Transaksi → Ekspor laporan, pilih Excel untuk laporan bulan terpilih: Ringkasan, tabel Transaksi dengan filter dan header beku, serta progres Tabungan. Nominal dan tanggal memakai nilai numerik Excel; laporan adalah snapshot saat ekspor, bukan workbook input/sinkronisasi. Saldo kumulatif dihitung sampai akhir bulan terpilih. Setoran tabungan menampilkan kategori Tabungan dan nama target.

CSV tetap tersedia untuk transfer data ke aplikasi lain. Separator titik koma dan baris `sep=;` membantu Excel mengenali kolom; beberapa aplikasi lain perlu memilih pemisah saat import. CSV tidak menyimpan format atau keseluruhan target/pengaturan, sehingga bukan cadangan lengkap.

Pada Pengaturan, backup JSON berisi seluruh bulan, target, dan anggaran. Pemulihan mendukung JSON versi awal serta format baru dengan versi schema.

## Backup cloud

Google Drive sudah dikonfigurasi dengan OAuth Client ID publik di `cloud-config.js`. Pengguna menghubungkan akun Google masing-masing; mode Testing memerlukan email terdaftar sebagai test user. Ikuti [panduan aktivasi](docs/backup-drive.md). Jangan menaruh Client Secret atau token di kode.

Backup baru berisi JSON lengkap dan Excel bulan berjalan dalam folder **My Drive → Uangku Backups**. Tombol Backup sekarang menampilkan loading dan popup hasil; keberhasilan memerlukan konfirmasi kedua file dari Drive. Pengguna versi lama harus menyambungkan ulang untuk izin file yang dibuat Uangku. Salinan JSON tersembunyi lama tetap dapat dipulihkan.

Setelah terhubung, perubahan otomatis dicadangkan ketika aplikasi terbuka, online, dan sesi Google aktif. Setelah reload/penutupan atau token kedaluwarsa, pengguna harus menghubungkan ulang. Snapshot bersifat terpisah, tidak ditimpa/digabung. Tidak ada backup latar belakang saat iPhone menutup aplikasi. Koneksi Google yang sebenarnya perlu diuji setelah konfigurasi; tes otomatis memakai server Drive simulasi.

## Penyimpanan

Data utama disimpan di localStorage perangkat/browser ini. Belum ada login aplikasi, enkripsi aplikasi, atau sinkronisasi antar perangkat. Backup Drive hanya aktif setelah setup dan koneksi akun. Unduh cadangan JSON secara berkala melalui Pengaturan. Safari dan aplikasi Home Screen bisa memiliki penyimpanan berbeda; pulihkan cadangan jika berpindah. Menghapus data browser dapat menghapus catatan. Jangan menyimpan cadangan transaksi di repository GitHub.

## iPhone

Buka alamat HTTPS di Safari → Bagikan → Tambahkan ke Layar Utama. Pengujian iPhone fisik masih diperlukan. Service worker menyediakan aset lokal saat offline setelah kunjungan pertama. Pembaruan aktif setelah semua jendela aplikasi versi lama ditutup.
