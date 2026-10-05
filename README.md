# Praktikum Minggu 4 - Refactoring Arsitektural Personal Portfolio & Service Portal

**Mata Kuliah:** Pemrograman dan Pengujian Web (12S3101) - Institut Teknologi Del
**Nama:** Theresia Oktaviani Samosir | **NIM:** 12S24055 | **Kelas:** 13SI2
**Live Demo (GitHub Pages):** https://theresiaosamosir.github.io/ppw-2026-week2-12S24055/
**Branch:** `PPW-2026-Week4_12S24055`

Proyek ini melanjutkan portofolio Minggu 3 (Bootstrap 5.3). Pada Minggu 3, seluruh kartu, modal, dan katalog layanan ditulis langsung di `index.html` (monolitik statis). Pada Minggu 4, semua isi tersebut dipindahkan ke file JSON terpisah dan dirender oleh JavaScript di browser (Dynamic Client-Side Rendering), sehingga `index.html` hanya menjadi kerangka halaman.

---

## 1. Struktur Direktori

```
ppw-2026-week4-12S24055/
├── index.html              # Shell HTML5 + Bootstrap 5, tanpa kartu hardcoded
├── style.css               # Gaya kustom, tema, CSS variables dari Week 3
├── data/
│   ├── profile.json        # Biodata dan statistik
│   ├── projects.json       # 8 proyek (kategori, tags, metrics, image, link)
│   ├── services.json       # 3 paket layanan (fitur dan tarif)
│   └── keahlian.json       # 7 keahlian utama
├── js/
│   ├── api-service.js      # Data Access Layer: fetch, error handling, POST
│   └── app.js              # Presentation Layer: DOM, rendering, event, modal, form
├── images/                 # Gambar dan foto proyek
├── docs/
│   ├── architecture-c4.png # Diagram C4 Container
│   └── screenshots/        # Screenshot waterfall DevTools
└── README.md
```

---

## 2. Diagram Arsitektur Sistem (C4 Container Model)

   ![Diagram C4 Container - Personal Portfolio & Service Portal](diagram-c4-container.png)
   
**Pembagian lapisan (Multi-Tier):**

| Tier | Komponen | Tanggung jawab |
|---|---|---|
| Presentation Tier | `index.html`, `style.css`, `app.js` | Antarmuka, perakitan DOM, interaksi, UI states, Toast |
| Application / API Logic Tier | `api-service.js`, JSON Providers (mock GET endpoint), Mock REST API (POST) | Kontrak pengambilan dan pengiriman data, validasi respons, penanganan error HTTP |
| Data Storage Tier | berkas `/data/*.json`, `localStorage` | Penyimpanan data portofolio (statis) dan riwayat pesanan (sisi klien) |

---

## 3. Separation of Concerns dan Komparasi Arsitektur

### 3.1 Separation of Concerns (SoC)

Pada Minggu 3, struktur, data, dan tampilan bercampur dalam satu file `index.html`. Menambah satu proyek berarti mengedit HTML secara langsung, yang tidak praktis dan rawan kesalahan. Pada Minggu 4, tanggung jawab dipisah menjadi empat bagian:

1. **Struktur (HTML):** `index.html` hanya memuat kerangka dan wadah kosong seperti `#projectGrid`, `#servicesCatalog`, dan `#skillsList`.
2. **Data (JSON):** isi portofolio berada di folder `/data`. Menambah proyek cukup dengan menambah satu objek di `projects.json`.
3. **Akses data (`api-service.js`):** satu-satunya file yang memanggil `fetch` dan tidak menyentuh DOM, sehingga sumber data dapat diganti ke REST API sungguhan tanpa mengubah kode tampilan.
4. **Tampilan (`app.js`):** menerima data dari `ApiService`, lalu merakit kartu, filter, modal, form, dan notifikasi.

### 3.2 Monolith vs Microservices

Arsitektur monolitik menyatukan seluruh fungsi dalam satu unit yang di-deploy bersama. Sederhana untuk dibangun, tetapi perubahan kecil memengaruhi seluruh aplikasi dan skalabilitasnya terbatas. Microservices memecah sistem menjadi layanan kecil yang mandiri dan berkomunikasi lewat API, sehingga dapat dikembangkan dan di-scale terpisah, dengan harga kompleksitas operasional yang lebih tinggi. Proyek ini belum microservices, tetapi sudah mengambil prinsip dasarnya: frontend dan penyedia data dipisahkan lewat kontrak JSON, sehingga masing-masing dapat diganti secara independen.

### 3.3 SSR vs CSR vs Jamstack

| Parameter | SSR | CSR (proyek ini) | Jamstack |
|---|---|---|---|
| Perakitan DOM | Di server setiap request | Di browser lewat JavaScript | Saat build, dilengkapi lewat API |
| Beban server | Tinggi | Sangat rendah | Minimal (dilayani CDN) |
| TTFB | Menengah sampai lambat | Cepat (HTML shell kecil) | Sangat cepat (cache CDN) |
| Interaktivitas | Full reload tiap navigasi | Mulus | Mulus dan reaktif |
| Hosting | Server aktif 24/7 | CDN statis (GitHub Pages) | CDN statis + serverless |

Proyek ini memakai CSR di atas hosting statis ala Jamstack. Kelemahannya, isi kartu baru tampil setelah `app.js` berjalan dan JSON selesai dimuat, sehingga ditangani dengan loading state.

---

## 4. Implementasi Utama

### 4.1 Dynamic CSR dan 4 UI States

| State | Kondisi | Tampilan |
|---|---|---|
| Loading | Data JSON sedang diambil | Skeleton placeholder |
| Success | Fetch berhasil | Kartu proyek, layanan, dan keahlian dirender |
| Empty | Filter atau pencarian tidak menghasilkan data | Pesan "tidak ada hasil" |
| Error | Fetch gagal atau HTTP bukan 2xx | Alert peringatan dengan tombol "Coba Lagi" |

Filter kategori dan pencarian bekerja instan tanpa memuat ulang halaman.

### 4.2 Universal Dynamic Modal

Hanya ada satu elemen modal (`#universalProjectModal`) di `index.html`. Isinya diinjeksi lewat `openProjectModal(projectId)` berdasarkan ID proyek yang diklik, memakai `bootstrap.Modal.getOrCreateInstance()`. Proyek dengan beberapa gambar ditampilkan dalam galeri geser.

### 4.3 Decoupled Form REST dan State Lokal

Form layanan dikirim dengan `fetch` POST berformat JSON (DTO) tanpa reload halaman. Tombol submit dinonaktifkan dan berubah menjadi "Mengirim..." selama proses, lalu Bootstrap Toast menampilkan hasilnya. Pesanan disimpan ke `localStorage` dan jumlahnya tampil pada badge "Pesanan" di navbar yang langsung ter-update.

### 4.4 Keamanan Sisi Klien

- `escapeHTML()` untuk semua nilai dinamis yang disisipkan lewat `innerHTML`.
- `safeUrl()` hanya mengizinkan URL `http`, `https`, atau relatif.
- `safeIcon()` hanya mengizinkan nama kelas `bi-*`.
- `textContent` untuk Toast dan data profil.

**Rancangan Content Security Policy (CSP):**

```
default-src 'self';
script-src  'self' https://cdn.jsdelivr.net;
style-src   'self' https://cdn.jsdelivr.net https://fonts.googleapis.com 'unsafe-inline';
font-src    https://fonts.gstatic.com https://cdn.jsdelivr.net;
img-src     'self' data: https:;
connect-src 'self' https://jsonplaceholder.typicode.com;
object-src  'none';
base-uri    'self';
```

Skrip inline sudah dihapus dari `index.html`, sehingga `script-src` tidak membutuhkan `'unsafe-inline'`.

---

## 5. Perbandingan Sebelum vs Sesudah Refactoring

| Aspek | Minggu 3 (Sebelum) | Minggu 4 (Sesudah) |
|---|---|---|
| Sumber konten | Ditulis langsung di `index.html` | Dimuat dari `/data/*.json` |
| Arsitektur | Monolitik statis | Decoupled multi-tier |
| Rendering | Statis di HTML | Dynamic CSR (fetch + async/await) |
| Menambah proyek | Mengedit HTML | Menambah objek di `projects.json` |
| Detail proyek | Modal terpisah tiap proyek | 1 Universal Dynamic Modal |
| Status tampilan | Tidak ada | Loading, success, empty, error |
| Filter portofolio | Tidak ada | Filter kategori dan pencarian instan |
| Form layanan | Submit biasa (reload halaman) | Fetch POST asinkron + Toast |
| Penyimpanan | Tidak ada | `localStorage` + badge reaktif |
| Keamanan | Belum ada penanganan khusus | `escapeHTML`, validasi URL, rancangan CSP |

---

## 6. Hasil Profiling Jaringan (Chrome DevTools)

**Kondisi pengujian:** Chrome versi `___`, tab Network, tanpa throttling, diuji pada URL GitHub Pages.
Cold Load: centang *Disable cache*, lalu hard reload (Ctrl+Shift+R). Warm Load: reload biasa (F5) setelah cold load.

### 6.1 Cold Load vs Warm Load

| Metrik | Cold Load | Warm Load |
|---|---|---|
| TTFB `index.html` | ___ ms | ___ ms |
| First Contentful Paint (FCP) | ___ ms | ___ ms |
| DOMContentLoaded | ___ ms | ___ ms |
| Load | ___ ms | ___ ms |
| Jumlah request | ___ | ___ |
| Data yang ditransfer | ___ KB | ___ KB |

### 6.2 Analisis Caching HTTP (RFC 9111)

| Berkas | Status Cold | Status Warm | Cache-Control | ETag | Ukuran |
|---|---|---|---|---|---|
| `index.html` | 200 | ___ | ___ | ___ | ___ KB |
| `style.css` | 200 | ___ | ___ | ___ | ___ KB |
| `js/app.js` | 200 | ___ | ___ | ___ | ___ KB |
| `js/api-service.js` | 200 | ___ | ___ | ___ | ___ KB |
| `data/projects.json` | 200 | ___ | ___ | ___ | ___ KB |
| `data/services.json` | 200 | ___ | ___ | ___ | ___ KB |

### 6.3 Screenshot Waterfall

| Cold Load | Warm Load |
|---|---|
| ![Waterfall cold load](docs/screenshots/waterfall-cold.png) | ![Waterfall warm load](docs/screenshots/waterfall-warm.png) |

### 6.4 Analisis

<!-- TODO: isi 3-5 kalimat dari hasil pengukuran:
- Kenapa warm load lebih cepat (cache browser atau 304 Not Modified dengan body kosong)
- Urutan waterfall: HTML, CSS/JS, lalu JSON (JSON baru diminta setelah app.js berjalan)
- Pengaruh CSR ke FCP: TTFB rendah karena HTML kecil, tetapi kartu baru muncul setelah JSON selesai dimuat -->

---

## 7. Cara Menjalankan dan Deployment

1. Buka folder proyek di VS Code, jalankan **Live Server**, lalu buka `http://127.0.0.1:5500/index.html`. Proyek tidak bisa dibuka lewat `file://` karena `fetch` membutuhkan server.
2. Deployment: GitHub Pages dengan source branch `PPW-2026-Week4_12S24055` (root). Tautan live ada di bagian atas dokumen ini.
