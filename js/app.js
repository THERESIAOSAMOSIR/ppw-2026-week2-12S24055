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
    category: 'Semua',
    query: ''
  },

  el: {},

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
      factsList: $('factsList')
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
        ...skills.map((skill) => {
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

    return `
      <div class="col">
        <div class="card h-100 shadow-sm project-card">
          ${banner}
          <div class="card-body">
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

  openProjectModal(projectId) {
    const proj = this.state.projects.find((p) => p.id === projectId);
    if (!proj) return;

    const e = (v) => this.escapeHTML(v);
    const imageUrl = this.safeUrl(proj.image);

    this.el.modalTitle.textContent = proj.title;

    const image = imageUrl
      ? `<img src="${e(imageUrl)}" class="img-fluid rounded mb-3 w-100" alt="${e(proj.title)}">`
      : '';
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
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());