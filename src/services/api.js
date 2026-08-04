// API Service Layer for Boletim Sofia
// Communicates with Express + PostgreSQL backend, with automatic fallback to localStorage if offline.

const API_BASE = '/api';

// Helper fetch with timeout
async function fetchWithFallback(url, options = {}) {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
    return await res.json();
  } catch (err) {
    return null; // Fallback signal
  }
}

export const api = {
  // Check API & DB status
  async checkHealth() {
    const data = await fetchWithFallback(`${API_BASE}/health`);
    return data && data.db === 'connected';
  },

  // --- PESO ---
  async getPesos(localKey = 'sofia_peso') {
    const remote = await fetchWithFallback(`${API_BASE}/peso`);
    if (remote && Array.isArray(remote)) {
      // Sync to localStorage as backup
      localStorage.setItem(localKey, JSON.stringify(remote));
      return remote;
    }
    const saved = localStorage.getItem(localKey);
    return saved ? JSON.parse(saved) : [];
  },

  async savePeso(registo, localKey = 'sofia_peso') {
    // Local save first
    const saved = localStorage.getItem(localKey);
    let list = saved ? JSON.parse(saved) : [];
    list.push(registo);
    localStorage.setItem(localKey, JSON.stringify(list));

    // Async DB save
    fetchWithFallback(`${API_BASE}/peso`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registo)
    });
  },

  async deletePeso(id, localKey = 'sofia_peso') {
    const saved = localStorage.getItem(localKey);
    if (saved) {
      const list = JSON.parse(saved).filter(r => r.id !== id);
      localStorage.setItem(localKey, JSON.stringify(list));
    }
    fetchWithFallback(`${API_BASE}/peso/${id}`, { method: 'DELETE' });
  },

  // --- AGENDA ---
  async getAgenda(localKey = 'sofia_agenda') {
    const remote = await fetchWithFallback(`${API_BASE}/agenda`);
    if (remote && Array.isArray(remote)) {
      localStorage.setItem(localKey, JSON.stringify(remote));
      return remote;
    }
    const saved = localStorage.getItem(localKey);
    return saved ? JSON.parse(saved) : [];
  },

  async saveEvento(evento, localKey = 'sofia_agenda') {
    const saved = localStorage.getItem(localKey);
    let list = saved ? JSON.parse(saved) : [];
    list.push(evento);
    list.sort((a, b) => new Date(a.data) - new Date(b.data));
    localStorage.setItem(localKey, JSON.stringify(list));

    fetchWithFallback(`${API_BASE}/agenda`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(evento)
    });
  },

  async deleteEvento(id, localKey = 'sofia_agenda') {
    const saved = localStorage.getItem(localKey);
    if (saved) {
      const list = JSON.parse(saved).filter(e => e.id !== id);
      localStorage.setItem(localKey, JSON.stringify(list));
    }
    fetchWithFallback(`${API_BASE}/agenda/${id}`, { method: 'DELETE' });
  },

  // --- MARCOS ---
  async getMarcos(localKey = 'sofia_marcos') {
    const remote = await fetchWithFallback(`${API_BASE}/marcos`);
    if (remote && Array.isArray(remote)) {
      localStorage.setItem(localKey, JSON.stringify(remote));
      return remote;
    }
    const saved = localStorage.getItem(localKey);
    return saved ? JSON.parse(saved) : [];
  },

  async saveMarco(marco, localKey = 'sofia_marcos') {
    const saved = localStorage.getItem(localKey);
    let list = saved ? JSON.parse(saved) : [];
    list.push(marco);
    list.sort((a, b) => new Date(a.data) - new Date(b.data));
    localStorage.setItem(localKey, JSON.stringify(list));

    fetchWithFallback(`${API_BASE}/marcos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(marco)
    });
  },

  async deleteMarco(id, localKey = 'sofia_marcos') {
    const saved = localStorage.getItem(localKey);
    if (saved) {
      const list = JSON.parse(saved).filter(m => m.id !== id);
      localStorage.setItem(localKey, JSON.stringify(list));
    }
    fetchWithFallback(`${API_BASE}/marcos/${id}`, { method: 'DELETE' });
  },

  // --- VACINAS ---
  async getVacinas(defaultList, localKey = 'sofia_vacinas') {
    const remote = await fetchWithFallback(`${API_BASE}/vacinas`);
    if (remote && Array.isArray(remote) && remote.length > 0) {
      localStorage.setItem(localKey, JSON.stringify(remote));
      return remote;
    }
    const saved = localStorage.getItem(localKey);
    const result = saved ? JSON.parse(saved) : defaultList;

    // Bulk sync default to DB
    if (result && result.length > 0) {
      fetchWithFallback(`${API_BASE}/vacinas/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result)
      });
    }
    return result;
  },

  async toggleVacina(id, novaLista, localKey = 'sofia_vacinas') {
    localStorage.setItem(localKey, JSON.stringify(novaLista));
    const target = novaLista.find(v => v.id === id);
    if (target) {
      fetchWithFallback(`${API_BASE}/vacinas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tomada: target.tomada })
      });
    }
  },

  // --- DOCUMENTOS ---
  async getDocumentos(defaultList, localKey = 'sofia_documentos') {
    const remote = await fetchWithFallback(`${API_BASE}/documentos`);
    if (remote && Array.isArray(remote) && remote.length > 0) {
      localStorage.setItem(localKey, JSON.stringify(remote));
      return remote;
    }
    const saved = localStorage.getItem(localKey);
    const result = saved ? JSON.parse(saved) : defaultList;

    if (result && result.length > 0) {
      fetchWithFallback(`${API_BASE}/documentos/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result)
      });
    }
    return result;
  },

  async saveDocumentos(novaLista, localKey = 'sofia_documentos') {
    localStorage.setItem(localKey, JSON.stringify(novaLista));
    fetchWithFallback(`${API_BASE}/documentos/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(novaLista)
    });
  },

  async updateDocumento(id, titulo, numero, novaLista, localKey = 'sofia_documentos') {
    localStorage.setItem(localKey, JSON.stringify(novaLista));
    fetchWithFallback(`${API_BASE}/documentos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo, numero })
    });
  },

  async deleteDocumento(id, novaLista, localKey = 'sofia_documentos') {
    localStorage.setItem(localKey, JSON.stringify(novaLista));
    fetchWithFallback(`${API_BASE}/documentos/${id}`, { method: 'DELETE' });
  },

  // --- LEITE ---
  async getLeite(localKey = 'sofia_leite') {
    const remote = await fetchWithFallback(`${API_BASE}/leite`);
    if (remote && Array.isArray(remote)) {
      localStorage.setItem(localKey, JSON.stringify(remote));
      return remote;
    }
    const saved = localStorage.getItem(localKey);
    return saved ? JSON.parse(saved) : [];
  },

  async saveLeite(registo, localKey = 'sofia_leite') {
    const saved = localStorage.getItem(localKey);
    let list = saved ? JSON.parse(saved) : [];
    list.push(registo);
    // Sort by time descending
    list.sort((a, b) => b.hora.localeCompare(a.hora));
    localStorage.setItem(localKey, JSON.stringify(list));

    fetchWithFallback(`${API_BASE}/leite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registo)
    });
  },

  async deleteLeite(id, localKey = 'sofia_leite') {
    const saved = localStorage.getItem(localKey);
    if (saved) {
      const list = JSON.parse(saved).filter(r => r.id !== id);
      localStorage.setItem(localKey, JSON.stringify(list));
    }
    fetchWithFallback(`${API_BASE}/leite/${id}`, { method: 'DELETE' });
  },

  // --- FRALDAS ---
  async getFraldas(localKey = 'sofia_fraldas') {
    const remote = await fetchWithFallback(`${API_BASE}/fraldas`);
    if (remote && Array.isArray(remote)) {
      localStorage.setItem(localKey, JSON.stringify(remote));
      return remote;
    }
    const saved = localStorage.getItem(localKey);
    return saved ? JSON.parse(saved) : [];
  },

  async saveFralda(registo, localKey = 'sofia_fraldas') {
    const saved = localStorage.getItem(localKey);
    let list = saved ? JSON.parse(saved) : [];
    list.push(registo);
    list.sort((a, b) => b.hora.localeCompare(a.hora));
    localStorage.setItem(localKey, JSON.stringify(list));

    fetchWithFallback(`${API_BASE}/fraldas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registo)
    });
  },

  async deleteFralda(id, localKey = 'sofia_fraldas') {
    const saved = localStorage.getItem(localKey);
    if (saved) {
      const list = JSON.parse(saved).filter(r => r.id !== id);
      localStorage.setItem(localKey, JSON.stringify(list));
    }
    fetchWithFallback(`${API_BASE}/fraldas/${id}`, { method: 'DELETE' });
  }
};
