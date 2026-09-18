# Aktivasi backup Google Drive

Ekspor Excel dan backup JSON lokal langsung berfungsi. Backup cloud memerlukan proyek Google Cloud dan OAuth Web Client ID milik pemilik aplikasi. Tidak perlu Client Secret, kartu pembayaran, atau server untuk implementasi ini. Kuota akun Drive berlaku; tidak perlu paket berbayar selama ruang tersedia.

## Setup satu kali oleh pemilik aplikasi

1. Buka https://console.cloud.google.com/ dan buat/pilih proyek untuk Uangku. Tidak perlu mengaktifkan billing untuk alur Drive ini.
2. Di APIs & Services → Library, aktifkan **Google Drive API**.
3. Buka Google Auth Platform. Isi Branding untuk Uangku (nama, email dukungan dan kontak pengembang). Pada Audience pilih External, gunakan mode Testing untuk pemakaian pribadi, dan tambahkan email akun Google yang akan dipakai sebagai Test user.
4. Pada Data Access tambahkan scope `https://www.googleapis.com/auth/drive.appdata`. Jangan meminta akses seluruh Drive.
5. Pada Clients, buat OAuth Client dengan jenis **Web application**. Pada Authorized JavaScript origins isi **https://alden779.github.io** (tanpa `/Uangku/`). Jika menguji lokal, tambahkan **http://127.0.0.1:5174**. Token popup tidak memerlukan redirect URI aplikasi.
6. Salin **Client ID** yang berakhiran `.apps.googleusercontent.com`. Kirim Client ID kepada pengembang untuk diisi ke `cloud-config.js`, kemudian deploy. Client ID bersifat publik. Jangan mengirim Client Secret, password, atau token akun.
7. Setelah deploy, buka Uangku → Pengaturan → Sambungkan Google Drive. Pilih akun dan berikan izin data aplikasi. Tekan **Backup sekarang** untuk salinan pertama. Perubahan berikutnya otomatis membuat salinan baru saat aplikasi terbuka dan sesi Google aktif.

Google mungkin meminta verifikasi branding/domain untuk publikasi di luar Testing. GitHub Pages menggunakan domain bersama; untuk pemakaian pribadi tetap gunakan akun test. Layar dan persyaratan Google dapat berubah: ikuti panduan resmi di bawah.

## Yang perlu diketahui

- Backup berisi seluruh transaksi, target tabungan, dan anggaran, bukan hanya bulan yang dipilih. Token login tidak ikut dicadangkan.
- Salinan disimpan di area data aplikasi (`appDataFolder`) akun Google, tidak terlihat sebagai file biasa di My Drive. Pulihkan melalui Uangku → Pengaturan → pilih salinan Drive.
- Setiap backup adalah snapshot baru. Aplikasi tidak menimpa atau menghapus snapshot lama. Daftar menampilkan 20 salinan terbaru; salinan lama masih memakai kuota. Data dua perangkat tidak otomatis digabung. Pemulihan mengganti data lokal setelah konfirmasi.
- Access token hanya ada dalam memori. Setelah menutup/memuat ulang aplikasi atau ketika sesi kedaluwarsa, sambungkan ulang. Tidak ada popup login otomatis.
- Backup berjalan saat aplikasi terbuka, online, dan sesi aktif. iPhone dapat menghentikan proses ketika aplikasi di latar belakang/ditutup. Perubahan offline tetap lokal dan dicoba lagi saat online/aktif; jangan mengandalkan backup saat aplikasi tertutup.
- Cadangan JSON manual tetap disediakan, termasuk dukungan untuk file JSON versi awal. Cadangkan sebelum memindahkan perangkat atau memulihkan cloud.
- Backup ini bukan enkripsi end-to-end. Data ditransfer melalui HTTPS dan disimpan di akun Google yang dipilih.

## Verifikasi setelah konfigurasi

Di akun test: hubungkan, backup kosong atau contoh non-pribadi, catat transaksi, tunggu status berhasil, periksa salinan, sambungkan di perangkat kedua, pulihkan, cocokkan transaksi/target/anggaran. Uji penolakan izin, popup ditutup, offline, sesi berakhir, dan kapasitas Drive. Koneksi nyata belum diverifikasi sebelum Client ID tersedia.

Referensi resmi:
- https://developers.google.com/identity/oauth2/web/guides/get-google-api-clientid
- https://developers.google.com/identity/oauth2/web/guides/use-token-model
- https://developers.google.com/workspace/drive/api/guides/appdata
- https://support.google.com/accounts/answer/6374270
