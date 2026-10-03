/**
 * api-service.js
 * Data Access Layer: semua komunikasi data (HTTP Fetch) ada di sini.
 * Berkas ini tidak menyentuh DOM. Tampilan diurus oleh app.js.
 */
const ApiService = {
  DATA_PATH: './data/',

  // Endpoint tiruan (mock REST API) untuk simulasi HTTP POST dari GitHub Pages.
  ORDER_ENDPOINT: 'https://jsonplaceholder.typicode.com/posts',

  /**
   * Mengambil satu berkas JSON dari folder data/.
   * Melempar Error jika jaringan gagal atau status HTTP bukan 2xx.
   */
  async fetchJSON(fileName) {
    try {
      const response = await fetch(this.DATA_PATH + fileName);
      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}: ${response.statusText} (${fileName})`);
      }
      return await response.json();
    } catch (err) {
      console.error('[API Network Error]:', err);
      throw err;
    }
  },

  getProjects() {
    return this.fetchJSON('project.json');
  },

  getServices() {
    return this.fetchJSON('services.json');
  },

  getSkills() {
    return this.fetchJSON('keahlian.json');
  },

  getProfile() {
    return this.fetchJSON('profile.json');
  },

  /**
   * Mengirim pesanan layanan sebagai JSON lewat HTTP POST.
   * Mengembalikan respons server (objek JSON), atau melempar Error jika gagal.
   */
  async submitServiceOrder(payload) {
    try {
      const response = await fetch(this.ORDER_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=UTF-8' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (err) {
      console.error('[API Submit Error]:', err);
      throw err;
    }
  }
};