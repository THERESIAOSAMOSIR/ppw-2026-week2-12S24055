# Praktikum Minggu 4 - Refactoring Arsitektural Personal Portfolio & Service Portal

**Mata Kuliah:** Pemrograman dan Pengujian Web (12S3101) - Institut Teknologi Del
**Nama:** Theresia Oktaviani Samosir | **NIM:** 12S24055 | **Kelas:** 13SI2
**Live Demo (GitHub Pages):** https://theresiaosamosir.github.io/ppw-2026-week2-12S24055/
**Branch:** `PPW-2026-Week4_12S24055`

Proyek ini adalah lanjutan dari portofolio Minggu 3 yang memakai Bootstrap 5.3. Pada Minggu 3, semua isi kartu, modal, dan daftar layanan ditulis langsung di `index.html`. Di Minggu 4 ini, semua isi tersebut dipindahkan ke file JSON terpisah, lalu ditampilkan oleh JavaScript saat halaman dibuka (Client-Side Rendering). Dengan begitu, `index.html` hanya berisi kerangka halaman.

---

## 1. Struktur Direktori

```
Praktikum Week 4/
├── index.html            # Kerangka HTML5 + Bootstrap 5, tanpa kartu hardcoded
├── style.css             # Gaya kustom, tema, dan CSS variables
├── theresia-profile.jpeg # Foto profil
├── images/               # Gambar dan screenshot proyek
├── js/
│   ├── api-service.js    # Data Access Layer: fetch, penanganan error, POST tiruan
│   └── app.js            # Presentation Layer: DOM, rendering, event, modal, form
└── data/
    ├── profile.json      # Biodata dan info cepat
    ├── project.json      # 8 proyek (kategori, tags, metrics, link, galeri)
    ├── services.json     # 3 paket layanan (fitur dan tarif)
    └── keahlian.json     # 7 keahlian utama
```

---

## 2. Diagram Arsitektur (C4 Container Model)

```mermaid
flowchart LR
    user(["👤 Pengunjung<br/>[Person]"])

    subgraph browser["Browser Pengguna - Presentation Tier"]
        spa["<b>Web App (CSR)</b><br/>[Container: HTML5, Bootstrap 5.3, JavaScript ES6+]<br/>app.js: render DOM, filter, modal, form, toast"]
        api["<b>Data Access Layer</b><br/>[Container: api-service.js]<br/>fetch(), error handling"]
        ls[("<b>localStorage</b><br/>[Container: Web Storage]<br/>riwayat permintaan layanan")]
    end

    subgraph host["GitHub Pages - Static Hosting"]
        cdn["<b>CDN Edge / Static Server</b><br/>[Container: GitHub Pages]<br/>index.html, style.css, js/*"]
        json[("<b>JSON Providers</b><br/>[Container: /data/*.json]<br/>project, services, profile, keahlian")]
    end

    ext["<b>Mock REST API</b><br/>[External System: jsonplaceholder]<br/>POST /posts"]
    libs["<b>CDN Library</b><br/>[External: jsDelivr, Google Fonts]<br/>Bootstrap, Bootstrap Icons"]

    user -->|"membuka halaman (HTTPS)"| cdn
    cdn -->|"HTML shell + aset statis"| spa
    libs -->|"CSS, JS, font"| spa
    spa -->|"memanggil"| api
    api -->|"GET JSON (fetch, async)"| json
    api -->|"POST JSON DTO (fetch, async)"| ext
    spa -->|"simpan dan baca pesanan"| ls
```

**Pembagian lapisan (Multi-Tier):**

| Tier | Komponen | Tugasnya |
|---|---|---|
| Presentation Tier | `index.html`, `style.css`, `app.js` | Menampilkan antarmuka, merakit DOM, mengatur interaksi, UI states, dan Toast |
| Application / API Logic Tier | `api-service.js`, Mock REST API | Mengatur cara mengambil dan mengirim data, serta menangani error HTTP |
| Data Storage Tier | `/data/*.json`, `localStorage` | Menyimpan data statis (JSON) dan riwayat pesanan di sisi klien |

---

## 3. Separation of Concerns (SoC)

Di Minggu 3, struktur halaman, isi data, dan tampilan bercampur dalam satu file `index.html`. Akibatnya, setiap kali ingin menambah proyek, saya harus mengedit kode HTML secara langsung. Cara ini kurang praktis dan mudah menimbulkan kesalahan.

Di Minggu 4, tanggung jawab dipisah menjadi empat bagian. Setiap bagian hanya mengurus satu hal:

1. **Struktur (HTML):** `index.html` hanya berisi kerangka dan wadah kosong seperti `#projectGrid`, `#servicesCatalog`, dan `#skillsList`. Tidak ada data yang ditulis di sini.
2. **Data (JSON):** isi portofolio disimpan di folder `/data`. Untuk menambah proyek, saya cukup menambah satu objek di `project.json` tanpa menyentuh HTML maupun JavaScript.
3. **Akses data (`api-service.js`):** hanya file ini yang memanggil `fetch`. File ini tidak menyentuh DOM, sehingga sumber data bisa diganti (misalnya ke REST API sungguhan) tanpa mengubah kode tampilan.
4. **Tampilan (`app.js`):** menerima data dari `ApiService`, lalu membuat kartu, filter, modal, form, dan notifikasi.

Pola ini mirip dengan Jamstack: file statis disajikan dari CDN, sedangkan datanya diambil lewat API saat halaman berjalan. Keuntungannya, proyek lebih mudah dirawat, setiap bagian bisa diuji sendiri, dan halaman tetap cepat dimuat karena server hanya mengirim kerangka HTML yang kecil.

### Perbandingan paradigma rendering

| Parameter | SSR | CSR (proyek ini) | Jamstack |
|---|---|---|---|
| Perakitan DOM | Di server setiap request | Di browser lewat JavaScript | Saat build, lalu dilengkapi lewat API |
| Beban server | Tinggi | Sangat rendah | Minimal (dilayani CDN) |
| TTFB | Menengah sampai lambat | Cepat (HTML kecil) | Sangat cepat (cache CDN) |
| Hosting | Server harus aktif terus | CDN statis (GitHub Pages) | CDN statis + serverless |

---

## 4. Fitur yang Diimplementasikan

- **Dynamic CSR dan 4 UI States:** loading (skeleton), success (kartu tampil), empty (hasil filter kosong), dan error (pesan peringatan dengan tombol "Coba Lagi").
- **Filter kategori dan pencarian** pada portofolio. Hasilnya langsung berubah tanpa memuat ulang halaman, dan nomor proyek tetap sama walaupun difilter.
- **Universal Dynamic Modal:** hanya ada satu modal untuk semua proyek. Isinya diganti sesuai ID proyek yang diklik, dan proyek yang punya beberapa gambar menampilkannya dalam galeri geser.
- **Katalog layanan dinamis** dari `services.json`. Tombol "Pilih Layanan Ini" otomatis memilih jenis layanan yang sesuai di formulir.
- **Form asinkron:** data dikirim memakai `fetch` POST dalam format JSON tanpa reload halaman. Tombol berubah menjadi "Mengirim..." saat proses berjalan, lalu muncul Toast Bootstrap sebagai notifikasi.
- **State lokal:** pesanan disimpan di `localStorage`, dan jumlahnya ditampilkan pada badge "Pesanan" di navbar yang langsung ter-update.
- **Keamanan sisi klien:**
  - `escapeHTML()` dipakai untuk semua nilai dinamis agar tidak dibaca sebagai kode HTML.
  - `safeUrl()` hanya mengizinkan URL `http`, `https`, atau relatif.
  - `safeIcon()` hanya mengizinkan nama kelas `bi-*`.
  - `textContent` dipakai untuk Toast dan data profil.

### Rancangan Content Security Policy (CSP)

Berikut direktif CSP yang saya rancang untuk situs ini. Direktif ini bisa dipasang lewat meta tag atau header server.

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

Skrip inline sudah dihapus dari `index.html`, jadi `script-src` tidak membutuhkan `'unsafe-inline'`.

---

## 5. Perbandingan Sebelum vs Sesudah Refactoring

| Aspek | Minggu 3 (Sebelum) | Minggu 4 (Sesudah) |
|---|---|---|
| Sumber konten | Ditulis langsung di `index.html` | Dimuat dari `/data/*.json` |
| Arsitektur | Monolitik statis | Decoupled multi-tier |
| Rendering | Statis di HTML | Dynamic CSR (fetch + async/await) |
| Menambah proyek | Mengedit HTML | Menambah objek di `project.json` |
| Detail proyek | Modal terpisah untuk tiap proyek | 1 Universal Dynamic Modal |
| Status tampilan | Tidak ada | Loading, success, empty, error |
| Filter portofolio | Tidak ada | Filter kategori dan pencarian instan |
| Form layanan | Submit biasa (halaman dimuat ulang) | Fetch POST asinkron + Toast |
| Penyimpanan | Tidak ada | `localStorage` + badge yang ter-update |
| Keamanan | Belum ada penanganan khusus | `escapeHTML`, validasi URL, rancangan CSP |

---

## 6. Hasil Profiling Jaringan (Chrome DevTools)

**Kondisi pengujian:** Chrome versi `___`, tab Network, tanpa throttling, diuji pada URL GitHub Pages. <!-- TODO: isi versi Chrome -->
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

### 6.2 Analisis Caching (per berkas)

| Berkas | Status Cold | Status Warm | Cache-Control | ETag | Ukuran |
|---|---|---|---|---|---|
| `index.html` | 200 | 304 / 200 (cache) | ___ | ___ | ___ KB |
| `style.css` | 200 | ___ | ___ | ___ | ___ KB |
| `js/app.js` | 200 | ___ | ___ | ___ | ___ KB |
| `js/api-service.js` | 200 | ___ | ___ | ___ | ___ KB |
| `data/project.json` | 200 | ___ | ___ | ___ | ___ KB |
| `data/services.json` | 200 | ___ | ___ | ___ | ___ KB |

### 6.3 Screenshot Waterfall

| Cold Load | Warm Load |
|---|---|
| ![Waterfall cold load](docs/screenshots/waterfall-cold.png) | ![Waterfall warm load](docs/screenshots/waterfall-warm.png) |

### 6.4 Analisis

<!-- TODO: tulis 3-5 kalimat berdasarkan hasil pengukuran. Poin yang bisa dibahas:
- Kenapa warm load lebih cepat (cache browser atau status 304 Not Modified yang body-nya kosong sehingga hemat bandwidth)
- Urutan request di waterfall: HTML, lalu CSS/JS, baru setelah itu file JSON (karena JSON baru diminta setelah app.js berjalan)
- Pengaruh CSR terhadap FCP: HTML kecil sehingga TTFB rendah, tetapi isi kartu baru muncul setelah JSON selesai dimuat
-->

---

## 7. Cara Menjalankan

1. Buka folder proyek di VS Code, lalu jalankan **Live Server**. Proyek ini tidak bisa dibuka langsung lewat `file://` karena `fetch` untuk membaca JSON membutuhkan server.
2. Buka `http://127.0.0.1:5500/index.html` di browser.

## 8. Git dan Deployment

```bash
git checkout PPW-2026-Week4_12S24055
git add .
git commit -m "feat(week4): decouple architecture to json data providers and async CSR"
git push origin PPW-2026-Week4_12S24055
```

Aktifkan GitHub Pages: **Settings > Pages > Source: Deploy from a branch > Branch `PPW-2026-Week4_12S24055` > / (root) > Save**.
