/**
 * app.js
 * Presentation Layer: kontrol DOM, rendering dinamis, dan event.
 * Seluruh data diambil lewat ApiService (api-service.js).
 */
const App = {
  // Waktu minimum tampilan skeleton agar tidak berkedip saat data sangat cepat.
  // Ubah ke 0 jika tidak diperlukan.
  LOADING_MIN_MS: 400,

  state: {
    projects: [],
    services: [],
    category: 'Semua',
    query: ''
  },

  el: {},

  // Kunci penyimpanan riwayat permintaan layanan di localStorage.
  STORAGE_KEY: 'ppw_week4_service_orders',

  /* ---------- Utilitas ---------- */

  // Sanitasi string agar tidak dieksekusi sebagai HTML (pencegahan DOM XSS).
  escapeHTML(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  // Hanya mengizinkan URL relatif, http, atau https. Selain itu dikosongkan.
  safeUrl(value) {
    if (typeof value !== 'string' || !value.trim()) return '';
    try {
      const parsed = new URL(value, window.location.href);
      return ['http:', 'https:'].includes(parsed.protocol) ? value : '';
    } catch (err) {
      return '';
    }
  },

  // Hanya mengizinkan nama kelas Bootstrap Icons, misalnya bi-server.
  safeIcon(value) {
    return typeof value === 'string' && /^bi-[a-z0-9-]+$/.test(value) ? value : 'bi-folder2-open';
  },

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  },

  /* ---------- Inisialisasi ---------- */

  init() {
    this.cacheElements();
    this.bindEvents();
    this.loadProfile();
    this.loadSkills();
    this.loadProjects();
    this.loadServices();
    this.bindForm();
    this.updateOrderBadge();
  },

  cacheElements() {
    const $ = (id) => document.getElementById(id);
    this.el = {
      grid: $('projectGrid'),
      filterGroup: $('filterGroup'),
      search: $('projectSearch'),
      count: $('resultCount'),
      error: $('projectError'),
      errorMessage: $('projectErrorMessage'),
      retry: $('retryBtn'),
      empty: $('projectEmpty'),
      resetFilter: $('resetFilterBtn'),
      skills: $('skillsList'),
      modal: $('universalProjectModal'),
      modalTitle: $('projectModalTitle'),
      modalBody: $('projectModalBody'),
      modalFooter: $('projectModalFooter'),
      profileEyebrow: $('profileEyebrow'),
      profileName: $('tentang-heading'),
      profileRole: $('profileRole'),
      profileBio: $('profileBio'),
      journeyList: $('journeyList'),
      factsList: $('factsList'),
      servicesCatalog: $('servicesCatalog'),
      form: $('serviceForm'),
      message: $('pesan'),
      orderBadge: $('orderBadge')
    };
  },

  bindEvents() {
    // Event delegation: satu listener untuk seluruh tombol "Lihat Detail".
    this.el.grid.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-project-id]');
      if (btn) this.openProjectModal(btn.dataset.projectId);
    });

    this.el.filterGroup.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-category]');
      if (!btn) return;
      this.state.category = btn.dataset.category;
      this.updateFilterButtons();
      this.applyFilters();
    });

    this.el.search.addEventListener('input', () => {
      this.state.query = this.el.search.value;
      this.applyFilters();
    });

    // Katalog layanan: tombol "Tanya Paket Ini" dan "Coba Lagi" (event delegation).
    this.el.servicesCatalog.addEventListener('click', (e) => {
      const ask = e.target.closest('[data-service-id]');
      if (ask) this.selectService(ask.dataset.serviceId);
      if (e.target.closest('[data-retry-services]')) this.loadServices();
    });

    this.el.retry.addEventListener('click', () => this.loadProjects());
    this.el.resetFilter.addEventListener('click', () => this.resetFilters());
  },

  /* ---------- Profil dan keahlian ---------- */

  async loadProfile() {
    try {
      const profile = await ApiService.getProfile();
      this.el.profileEyebrow.textContent = profile.eyebrow || '';
      this.el.profileName.textContent = profile.name || '';
      this.el.profileRole.textContent = profile.role || '';
      this.el.profileBio.textContent = profile.bio || '';

      this.el.journeyList.replaceChildren(
        ...(profile.journey || []).map((text) => {
          const li = document.createElement('li');
          li.textContent = text;
          return li;
        })
      );

      const facts = [];
      (profile.facts || []).forEach((fact) => {
        const dt = document.createElement('dt');
        dt.textContent = fact.label;
        const dd = document.createElement('dd');
        dd.textContent = fact.value;
        facts.push(dt, dd);
      });
      this.el.factsList.replaceChildren(...facts);
    } catch (err) {
              console.error('[Profil]', err);
      this.el.profileBio.textContent = 'Data profil gagal dimuat. Silakan muat ulang halaman.';
    }
  },

  async loadSkills() {
    try {
      const skills = await ApiService.getSkills();
      this.el.skills.replaceChildren(
        // Urutkan dari teks terpanjang agar baris chip tampak rapi.
        ...[...skills].sort((a, b) => b.name.length - a.name.length).map((skill) => {
          const li = document.createElement('li');
          li.textContent = skill.name;
          return li;
        })
      );
    } catch (err) {
      const li = document.createElement('li');
      li.textContent = 'Keahlian gagal dimuat';
      this.el.skills.replaceChildren(li);
    }
  },

  /* ---------- Proyek: pemuatan dan UI states ---------- */

  async loadProjects() {
    this.showState('loading');
    try {
      const [projects] = await Promise.all([
        ApiService.getProjects(),
        this.sleep(this.LOADING_MIN_MS)
      ]);
      if (!Array.isArray(projects)) {
        throw new Error('Format data proyek tidak valid.');
      }
      this.state.projects = projects;
      this.renderFilters();
      this.applyFilters();
    } catch (err) {
      this.showState('error', err.message);
    }
  },

  // Empat state: loading, success, empty, error.
  showState(name, message = '') {
    const { grid, error, errorMessage, empty, count } = this.el;
    grid.setAttribute('aria-busy', name === 'loading' ? 'true' : 'false');

    error.classList.toggle('d-none', name !== 'error');
    empty.classList.toggle('d-none', name !== 'empty');
    grid.classList.toggle('d-none', name === 'error' || name === 'empty');

    if (name === 'loading') {
      this.renderSkeleton();
      count.textContent = '';
    }
    if (name === 'error') {
      grid.replaceChildren();
      errorMessage.textContent = message || 'Terjadi kesalahan saat memuat data.';
      count.textContent = '';
    }
  },

  renderSkeleton() {
    const card = `
      <div class="col" aria-hidden="true">
        <div class="card h-100 project-card">
          <div class="skeleton-banner"></div>
          <div class="card-body placeholder-glow">
            <span class="placeholder col-5 mb-3"></span>
            <span class="placeholder col-10 mb-2"></span>
            <span class="placeholder col-12 mb-2"></span>
            <span class="placeholder col-7"></span>
          </div>
        </div>
      </div>`;
    this.el.grid.innerHTML = card.repeat(3);
  },

  /* ---------- Proyek: filter ---------- */

  renderFilters() {
    const categories = ['Semua', ...new Set(this.state.projects.map((p) => p.category))];
    this.el.filterGroup.innerHTML = categories
      .map(
        (cat) => `
        <button type="button" class="filter-btn" data-category="${this.escapeHTML(cat)}">
          ${this.escapeHTML(cat)}
        </button>`
      )
      .join('');
    this.updateFilterButtons();
  },

  updateFilterButtons() {
    this.el.filterGroup.querySelectorAll('[data-category]').forEach((btn) => {
      const active = btn.dataset.category === this.state.category;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', String(active));
    });
  },

  applyFilters() {
    const { projects, category, query } = this.state;
    const q = query.trim().toLowerCase();

    const result = projects.filter((p) => {
      const matchCategory = category === 'Semua' || p.category === category;
      const haystack = [p.title, p.summary, p.role, ...(p.tags || [])].join(' ').toLowerCase();
      return matchCategory && (!q || haystack.includes(q));
    });

    this.renderProjects(result);
  },

  resetFilters() {
    this.state.category = 'Semua';
    this.state.query = '';
    this.el.search.value = '';
    this.updateFilterButtons();
    this.applyFilters();
  },

  /* ---------- Proyek: rendering kartu ---------- */

  renderProjects(list) {
    if (list.length === 0) {
      this.showState('empty');
      this.el.count.textContent = '';
      return;
    }

    this.el.grid.innerHTML = list.map((p) => this.projectCardHTML(p)).join('');
    this.showState('success');
    this.el.count.textContent = `Menampilkan ${list.length} dari ${this.state.projects.length} proyek`;
  },

  projectCardHTML(p) {
    const e = (v) => this.escapeHTML(v);
    const imageUrl = this.safeUrl(p.image);
    const banner = imageUrl
      ? `<img src="${e(imageUrl)}" alt="${e(p.title)}" class="card-banner-img" loading="lazy">`
      : `<div class="card-banner"><i class="bi ${this.safeIcon(p.icon)}"></i></div>`;
    const tags = (p.tags || [])
      .map((t) => `<span class="badge tag-chip">${e(t)}</span>`)
      .join('');
    // Nomor urut tetap (berdasarkan urutan di project.json), tidak berubah saat difilter.
    const number = String(this.state.projects.indexOf(p) + 1).padStart(2, '0');

    return `
      <div class="col">
        <div class="card h-100 shadow-sm project-card">
          ${banner}
          <div class="card-body">
            <div class="project-number" aria-hidden="true">${number}</div>
            <span class="badge project-badge mb-2">${e(p.role)}</span>
            <h3 class="card-title h5">${e(p.title)}</h3>
            <p class="card-text">${e(p.summary)}</p>
            <div class="d-flex flex-wrap gap-1 mb-2">${tags}</div>
            <p class="card-text"><small class="text-muted">${e(p.year)} · ${e(p.status)}</small></p>
          </div>
          <div class="card-footer bg-transparent border-0 pb-3">
            <button type="button" class="btn btn-sm project-btn" data-project-id="${e(p.id)}">
              Lihat Detail
            </button>
          </div>
        </div>
      </div>`;
  },

  /* ---------- Universal Dynamic Modal ---------- */

  // Galeri (Bootstrap Carousel) di dalam modal universal; hanya dipakai jika ada >= 2 gambar valid.
  galleryHTML(proj) {
    const e = (v) => this.escapeHTML(v);
    const items = (Array.isArray(proj.gallery) ? proj.gallery : [])
      .map((g) => ({ src: this.safeUrl(g && g.src), caption: (g && g.caption) || '' }))
      .filter((g) => g.src);
    if (items.length < 2) return '';

    const indicators = items
      .map((_, i) => `<button type="button" data-bs-target="#projectCarousel" data-bs-slide-to="${i}"
          class="${i === 0 ? 'active' : ''}" ${i === 0 ? 'aria-current="true"' : ''}
          aria-label="Gambar ${i + 1}"></button>`)
      .join('');
    const slides = items
      .map((g, i) => `
        <div class="carousel-item ${i === 0 ? 'active' : ''}">
          <img src="${e(g.src)}" alt="${e(proj.title)} - ${e(g.caption)}" loading="lazy">
          <p class="carousel-caption-text">${e(g.caption)}</p>
        </div>`)
      .join('');

    return `
      <div id="projectCarousel" class="carousel slide project-carousel mb-3" aria-label="Galeri ${e(proj.title)}">
        <div class="carousel-inner rounded">${slides}</div>
        <button class="carousel-control-prev" type="button" data-bs-target="#projectCarousel" data-bs-slide="prev">
          <span class="carousel-control-prev-icon" aria-hidden="true"></span>
          <span class="visually-hidden">Sebelumnya</span>
        </button>
        <button class="carousel-control-next" type="button" data-bs-target="#projectCarousel" data-bs-slide="next">
          <span class="carousel-control-next-icon" aria-hidden="true"></span>
          <span class="visually-hidden">Berikutnya</span>
        </button>
        <div class="carousel-indicators">${indicators}</div>
      </div>`;
  },

  openProjectModal(projectId) {
    const proj = this.state.projects.find((p) => p.id === projectId);
    if (!proj) return;

    const e = (v) => this.escapeHTML(v);
    const imageUrl = this.safeUrl(proj.image);

    this.el.modalTitle.textContent = proj.title;

    const image = this.galleryHTML(proj) || (imageUrl
      ? `<img src="${e(imageUrl)}" class="img-fluid rounded mb-3 w-100" alt="${e(proj.title)}">`
      : '');
    const tags = (proj.tags || [])
      .map((t) => `<span class="badge tag-chip">${e(t)}</span>`)
      .join('');
    const metrics = (proj.metrics || [])
      .map(
        (m) => `
        <div class="metric-item">
          <strong>${e(m.value)}</strong>
          <span>${e(m.label)}</span>
        </div>`
      )
      .join('');

    this.el.modalBody.innerHTML = `
      ${image}
      <p class="mb-1"><strong>Peran:</strong> ${e(proj.role)}</p>
      <p class="mb-3"><strong>Tahun:</strong> ${e(proj.year)} · <strong>Status:</strong> ${e(proj.status)}</p>
      <p>${e(proj.description)}</p>
      <div class="d-flex flex-wrap gap-1 mb-3">${tags}</div>
      <div class="metric-list">${metrics}</div>`;

    // Footer dibuat lewat DOM API: tautan hanya dipasang jika URL lolos validasi.
    const linkUrl = proj.link ? this.safeUrl(proj.link.url) : '';
    if (linkUrl) {
      const a = document.createElement('a');
      a.href = linkUrl;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.className = 'btn project-btn';
      a.textContent = proj.link.label || 'Buka Tautan';
      this.el.modalFooter.replaceChildren(a);
    } else {
      const span = document.createElement('span');
      span.className = 'text-muted small';
      span.textContent = 'Tidak ada tautan publik untuk proyek ini.';
      this.el.modalFooter.replaceChildren(span);
    }

    bootstrap.Modal.getOrCreateInstance(this.el.modal).show();
  },

  /* ---------- Layanan: katalog paket dari services.json ---------- */

  async loadServices() {
    const box = this.el.servicesCatalog;
    box.setAttribute('aria-busy', 'true');
    box.innerHTML = this.serviceSkeletonHTML(); // state: loading
    try {
      const [services] = await Promise.all([
        ApiService.getServices(),
        this.sleep(this.LOADING_MIN_MS)
      ]);
      if (!Array.isArray(services)) {
        throw new Error('Format data layanan tidak valid.');
      }
      this.state.services = services;
      this.renderServices(); // state: success atau empty
    } catch (err) {
      // state: error
      box.innerHTML = `
        <div class="col-12">
          <div class="alert alert-danger mb-0" role="alert">
            <h3 class="h6 alert-heading mb-1"><i class="bi bi-exclamation-triangle me-1"></i> Paket layanan gagal dimuat</h3>
            <p class="mb-2">${this.escapeHTML(err.message)}</p>
            <button type="button" class="btn btn-sm btn-outline-danger" data-retry-services>Coba Lagi</button>
          </div>
        </div>`;
    } finally {
      box.setAttribute('aria-busy', 'false');
    }
  },

  serviceSkeletonHTML() {
    const card = `
      <div class="col" aria-hidden="true">
        <div class="card project-card">
          <div class="card-body placeholder-glow">
            <span class="placeholder col-4 mb-2"></span>
            <span class="placeholder col-12 mb-2"></span>
            <span class="placeholder col-8"></span>
          </div>
        </div>
      </div>`;
    return card.repeat(3);
  },

  renderServices() {
    const box = this.el.servicesCatalog;
    if (this.state.services.length === 0) {
      box.innerHTML = `
        <div class="col-12">
          <div class="empty-state"><i class="bi bi-box-seam"></i>
            <p class="mb-0 mt-2">Belum ada paket layanan yang tersedia.</p></div>
        </div>`;
      return;
    }
    box.innerHTML = this.state.services.map((s) => this.serviceCardHTML(s)).join('');
  },

  serviceCardHTML(s) {
    const e = (v) => this.escapeHTML(v);
    const features = (s.features || []).map((f) => `<li>${e(f)}</li>`).join('');

    return `
      <div class="col">
        <div class="card h-100 shadow-sm project-card service-card">
          <div class="card-body d-flex flex-column">
            <div class="d-flex align-items-center gap-2 mb-2">
              <div class="service-icon" aria-hidden="true"><i class="bi ${this.safeIcon(s.icon)}"></i></div>
              <h4 class="h6 card-title mb-0">${e(s.name)}</h4>
            </div>
            <p class="card-text small mb-2">${e(s.description)}</p>
            <ul class="service-features">${features}</ul>
            <div class="service-footer mt-auto pt-3 d-flex flex-wrap align-items-center justify-content-between gap-2">
              <span class="rate-chip">Tarif: <strong>${e(s.rate)}</strong></span>
              <button type="button" class="btn btn-sm project-btn" data-service-id="${e(s.id)}">
                Pilih Layanan Ini
              </button>
            </div>
          </div>
        </div>
      </div>`;
  },

  // Memilih radio "Jenis Layanan" yang sesuai, lalu menggulir ke form.
  selectService(serviceId) {
    const form = this.el.form;
    if (!form) return;
    const radio = Array.from(form.querySelectorAll('input[name="layanan"]'))
      .find((r) => r.value === serviceId);
    if (radio) {
      radio.checked = true;
      radio.dispatchEvent(new Event('change', { bubbles: true }));
    }
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    (radio || form.elements.nama)?.focus({ preventScroll: true });
  },

  /* ---------- Form: pengiriman asinkron (fetch POST) ---------- */

  bindForm() {
    const form = this.el.form;
    form.addEventListener('submit', async (e) => {
      e.preventDefault(); // tanpa full page reload

      if (!form.checkValidity()) {
        form.classList.add('was-validated');
        this.showToast('Formulir belum lengkap', 'Periksa kembali kolom yang wajib diisi.', 'warning');
        return;
      }

      // Serialisasi form menjadi DTO JSON.
      const payload = Object.fromEntries(new FormData(form).entries());
      const checked = form.querySelector('input[name="layanan"]:checked');
      payload.layananLabel = checked ? checked.closest('label').textContent.trim() : '';
      payload.setuju = form.elements.setuju.checked;
      payload.createdAt = new Date().toISOString();

      const submitBtn = form.querySelector('button[type="submit"]');
      const originalLabel = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" aria-hidden="true"></span> Mengirim...';

      try {
        const result = await ApiService.submitServiceOrder(payload);
        const orderId = 'ORD-' + Date.now();
        this.saveOrder({ orderId, serverRef: result.id ?? null, ...payload });
        this.showToast('Sukses!', `Permintaan layanan berhasil diproses (${orderId}).`, 'success');
        form.reset();
        form.classList.remove('was-validated');
      } catch (err) {
        this.showToast('Gagal mengirim', 'Permintaan belum terkirim. Periksa koneksi lalu coba lagi.', 'danger');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalLabel;
      }
    });
  },

  /* ---------- State lokal: localStorage + badge ---------- */

  getOrders() {
    try {
      const data = JSON.parse(localStorage.getItem(this.STORAGE_KEY));
      return Array.isArray(data) ? data : [];
    } catch (err) {
      return [];
    }
  },

  saveOrder(order) {
    const orders = this.getOrders();
    orders.push(order);
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(orders));
    } catch (err) {
      console.warn('[Storage] Gagal menyimpan pesanan:', err);
    }
    this.updateOrderBadge();
  },

  updateOrderBadge() {
    const badge = this.el.orderBadge;
    if (!badge) return;
    const count = this.getOrders().length;
    badge.textContent = count;
    badge.classList.toggle('d-none', count === 0);
    badge.title = `${count} permintaan layanan tersimpan`;
  },

  /* ---------- Toast Bootstrap ---------- */

  showToast(title, message, variant = 'success') {
    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast text-bg-${variant} border-0`;
    toast.setAttribute('role', variant === 'danger' ? 'alert' : 'status');
    toast.innerHTML = `
      <div class="toast-header">
        <strong class="me-auto"></strong>
        <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Tutup"></button>
      </div>
      <div class="toast-body"></div>`;
    toast.querySelector('strong').textContent = title;      // textContent: aman dari XSS
    toast.querySelector('.toast-body').textContent = message;
    container.appendChild(toast);
    toast.addEventListener('hidden.bs.toast', () => toast.remove());
    bootstrap.Toast.getOrCreateInstance(toast, { delay: 4000 }).show();
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());