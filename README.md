# Sign Up & Sign In (Multifungsi)

Form Sign Up & Sign In dengan simulasi "database" di browser (localStorage) — tanpa backend.

## Fitur

- **Sign Up**: nama depan, nama belakang, nickname, email, password + konfirmasi password.
- **Validasi form**: field wajib, format email, kekuatan password (min. 8 karakter, huruf besar, huruf kecil, angka), password & konfirmasi harus sama, nickname/email duplikat ditolak.
- **Show/Hide Password**: tombol "Tampilkan/Sembunyikan" pada setiap field password.
- **Sign In nyata**: mencocokkan nickname & password dengan data yang tersimpan dari proses Sign Up.
- **Redirect ke Dashboard**: setelah login sukses, pengguna diarahkan ke `dashboard.html` yang menampilkan data akun & tombol Logout.
- **Notifikasi (Alert)**: menggunakan [SweetAlert2](https://sweetalert2.github.io/) — toast untuk sukses/gagal ringan, modal untuk konfirmasi penting (mis. sukses registrasi).

## Struktur File

```
index.html               -> Halaman utama (tab Sign Up / Sign In)
dashboard.html            -> Halaman setelah login berhasil
css/
  tailwind.min.css        -> Tailwind hasil build statis (self-hosted, bukan CDN)
  sweetalert2.min.css     -> Style SweetAlert2 (self-hosted)
javascript/
  auth.js                 -> Logika validasi, rate-limit, honeypot, penyimpanan data, alert
  dashboard.js             -> Logika halaman dashboard (cek sesi, logout)
  tabs.js                  -> Logika perpindahan tab
  vendor/sweetalert2.min.js -> SweetAlert2 (self-hosted)
```

## Ketahanan & Keamanan (Hardening)

Situs ini di-hosting di GitHub Pages (statis, tanpa backend), jadi proteksi
DDoS di level jaringan sudah ditangani infrastruktur GitHub sendiri. Bagian
yang diperkuat di level kode:

- **Tidak lagi bergantung ke CDN pihak ketiga** (Tailwind & SweetAlert2 di-*self-host* di repo ini) — situs tetap jalan walau CDN eksternal down/diblokir.
- **Content-Security-Policy** (`script-src 'self'`, dll.) — mempersempit celah XSS/clickjacking, hanya file dari repo sendiri yang boleh dieksekusi.
- **Rate limiting** pada form Sign Up & Sign In (maks. 5 percobaan/menit) — mencegah spam/brute-force otomatis dari script.
- **Honeypot field** tersembunyi di kedua form — bot sederhana yang mengisi semua field otomatis akan tertangkap dan ditolak diam-diam.
- **Batas jumlah akun tersimpan** (maks. 200) dan **`maxlength`** di setiap input — mencegah localStorage dipenuhi data sampah (storage-filling).
- **Tidak ada `innerHTML` untuk data pengguna** — semua output pakai `textContent`, aman dari XSS.
- **Pesan login gagal generik** ("nickname atau password salah") — tidak membocorkan apakah nickname terdaftar atau tidak.

## Cara Pakai

Cukup buka `index.html` di browser — tidak perlu server/backend.

> Catatan: Data disimpan di `localStorage` browser (per perangkat/browser), password di-encode dengan Base64 hanya untuk simulasi — **bukan** enkripsi yang aman untuk produksi. Untuk aplikasi nyata, gunakan backend + hashing password (mis. bcrypt) dan koneksi HTTPS.
