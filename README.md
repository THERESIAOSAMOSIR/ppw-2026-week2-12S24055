# Personal Portfolio & Service Portal (Week 3: Bootstrap 5)

**Nama:** Theresia Oktaviani Samosir
**NIM:** 12S24055
**Kelas:** 13SI2
**Mata Kuliah:** Pemrograman dan Pengujian Web (12S3101)
**Program Studi:** S1 Sistem Informasi - Institut Teknologi Del

🌐 **Live Demo:** https://theresiaosamosir.github.io/ppw-2026-week2-12S24055/

---

## Deskripsi

Halaman web portofolio profil profesional tunggal (*single page showcase*) yang menyajikan identitas akademik, rekapitulasi proyek, keahlian, serta formulir layanan. Minggu 2 dibangun dengan HTML5 semantik dan CSS3 murni. Minggu 3 merefaktor proyek yang sama menggunakan **Bootstrap 5.3** dan **custom CSS overrides**.

## Ringkasan Pembaruan (Week 3)

- Integrasi Bootstrap 5.3.3 (CSS dan JS bundle via CDN) dan Bootstrap Icons
- Responsive navbar sticky dengan tombol hamburger (collapse) di layar ponsel
- Hero section dengan tombol call-to-action
- Grid portofolio responsif (`row-cols-1 row-cols-md-2 row-cols-lg-3`) berisi kartu proyek
- Modal dialog Bootstrap untuk detail setiap proyek
- Formulir layanan baru: floating labels, input group berikon, select, checkbox, dan validasi visual (`valid-feedback` / `invalid-feedback`)
- Custom CSS (`style.css`) dimuat setelah Bootstrap untuk tema dan mikro-interaksi

## Sebelum vs Sesudah Integrasi Framework

### Hero / Tentang Saya
| Sebelum (Week 2) | Sesudah (Week 3) |
|---|---|
| ![before](assets/before-hero.png) | ![after](assets/after-hero.png) |

### Portofolio
| Sebelum (Week 2) | Sesudah (Week 3) |
|---|---|
| ![before](assets/before-portofolio.png) | ![after](assets/after-portofolio.png) |

### Formulir
| Sebelum (Week 2) | Sesudah (Week 3) |
|---|---|
| ![before](assets/before-form.png) | ![after](assets/after-form.png) |

### Tabel Komparasi
| Aspek | Sebelum | Sesudah |
|---|---|---|
| Layout Portofolio | Carousel horizontal manual | Grid Bootstrap 5 (row-cols) |
| Navbar | Statis, tanpa toggle | Responsive, sticky, collapse hamburger |
| Detail Proyek | Tidak ada | Modal Dialog Bootstrap |
| Formulir | Input dasar | Floating Labels + validasi visual |
| CSS Framework | CSS murni | Bootstrap 5.3 + custom overrides |

## Struktur Direktori

```
ppw-2026-week2-12S24055/
├── index.html              # Halaman utama (HTML5 Semantic + Bootstrap 5.3)
├── style.css               # Custom CSS dan override Bootstrap
├── theresia-profile.jpeg   # Foto profil
├── README.md               # Dokumentasi proyek
└── assets/                 # Screenshot perbandingan Week 2 dan Week 3
    ├── before-hero.png
    ├── after-hero.png
    ├── before-portofolio.png
    ├── after-portofolio.png
    ├── before-form.png
    └── after-form.png
```

## Cara Menjalankan Secara Lokal

1. Clone repositori ini
2. Buka folder di VS Code
3. Klik kanan `index.html` lalu pilih **Open with Live Server**