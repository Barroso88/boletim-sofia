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

const normalizeVaccineName = (nome) => {
  const n = (nome || '').toLowerCase().trim();
  if (n.includes('hepatite b')) return 'Vacina contra a Hepatite B';
  if (n.includes('tuberculose') || n.includes('bcg')) return 'Vacina contra a tuberculose';
  if (n.includes('difteria')) return 'Vacina contra a Difteria';
  if (n.includes('poliomielite')) return 'Vacina contra a Poliomielite';
  if (n.includes('tosse convulsa')) return 'Vacina contra a Tosse Convulsa, componente acelular';
  if (n.includes('haemophilus')) return 'Vacina contra o Haemophilus influenzae tipo B';
  if (n.includes('meningococo do grupo b')) return 'Vacina contra o meningococo do grupo B';
  if (n.includes('tétano') || n.includes('tetano')) return 'Vacina contra o Tétano';
  if (n.includes('pneumocócica') || n.includes('pneumococica')) return 'Vacina pneumocócica conjugada de 20 componentes';
  if (n.includes('parotidite')) return 'Vacina contra a Parotidite Epidémica';
  if (n.includes('serogrupos a, c') || n.includes('w135')) return 'Vacina meningocócica conjugada contra os serogrupos A, C, W135 e Y';
  if (n.includes('rubéola') || n.includes('rubeola')) return 'Vacina viva contra a Rubéola';
  if (n.includes('sarampo')) return 'Vacina viva contra o Sarampo';
  if (n.includes('papilomavírus') || n.includes('papilomavirus') || n.includes('hpv')) return 'Vacina contra o papilomavírus humano (tipo 9)';
  return nome;
};

export const api = {
  // Check API & DB status
  async checkHealth() {
    const data = await fetchWithFallback(`${API_BASE}/health`);
    return data && data.db === 'connected';
  },

  // --- PERFIL ---
  async getPerfil(localKey = 'sofia_perfil') {
    const defaultPerfil = {
      nome_completo: '',
      data_nascimento: '',
      morada: '',
      codigo_postal: '',
      cidade: '',
      nome_pai: '',
      nome_mae: '',
      local_nascimento: '',
      peso_nascimento: '',
      altura_nascimento: '',
      grupo_sanguineo: '',
      notas: ''
    };
    const remote = await fetchWithFallback(`${API_BASE}/perfil`);
    if (remote) {
      localStorage.setItem(localKey, JSON.stringify(remote));
      return remote;
    }
    const saved = localStorage.getItem(localKey);
    return saved ? JSON.parse(saved) : defaultPerfil;
  },

  async savePerfil(perfilData, localKey = 'sofia_perfil') {
    localStorage.setItem(localKey, JSON.stringify(perfilData));
    fetchWithFallback(`${API_BASE}/perfil`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(perfilData)
    });
  },

  // --- PESO ---
  async getPesos(localKey = 'sofia_peso') {
    const remote = await fetchWithFallback(`${API_BASE}/peso`);
    if (remote && Array.isArray(remote)) {
      const saved = localStorage.getItem(localKey);
      const localList = saved ? JSON.parse(saved) : [];
      if (remote.length === 0 && localList.length > 0) {
        // Sync to backend
        localList.forEach(r => this.savePeso(r, localKey));
        return localList;
      }
      localStorage.setItem(localKey, JSON.stringify(remote));
      return remote;
    }
    const saved = localStorage.getItem(localKey);
    return saved ? JSON.parse(saved) : [];
  },

  async savePeso(registo, localKey = 'sofia_peso') {
    const saved = localStorage.getItem(localKey);
    let list = saved ? JSON.parse(saved) : [];
    const idx = list.findIndex(r => r.id === registo.id);
    if (idx >= 0) list[idx] = registo;
    else list.push(registo);
    localStorage.setItem(localKey, JSON.stringify(list));

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

  // --- ALTURA ---
  async getAlturas(localKey = 'sofia_altura') {
    const defaultAlturas = [
      { id: 1, data: '2026-07-13', altura: 50.0 },
      { id: 2, data: '2026-07-28', altura: 52.5 },
      { id: 3, data: '2026-08-05', altura: 54.0 },
    ];
    const remote = await fetchWithFallback(`${API_BASE}/altura`);
    if (remote && Array.isArray(remote) && remote.length > 0) {
      localStorage.setItem(localKey, JSON.stringify(remote));
      return remote;
    }
    const saved = localStorage.getItem(localKey);
    if (!saved) {
      localStorage.setItem(localKey, JSON.stringify(defaultAlturas));
      return defaultAlturas;
    }
    return JSON.parse(saved);
  },

  async saveAltura(registo, localKey = 'sofia_altura') {
    const saved = localStorage.getItem(localKey);
    let list = saved ? JSON.parse(saved) : [];
    const idx = list.findIndex(r => r.id === registo.id);
    if (idx >= 0) list[idx] = registo;
    else list.push(registo);
    localStorage.setItem(localKey, JSON.stringify(list));

    fetchWithFallback(`${API_BASE}/altura`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registo)
    });
  },

  async deleteAltura(id, localKey = 'sofia_altura') {
    const saved = localStorage.getItem(localKey);
    if (saved) {
      const list = JSON.parse(saved).filter(r => r.id !== id);
      localStorage.setItem(localKey, JSON.stringify(list));
    }
    fetchWithFallback(`${API_BASE}/altura/${id}`, { method: 'DELETE' });
  },

  // --- AGENDA ---
  async getAgenda(localKey = 'sofia_agenda') {
    const remote = await fetchWithFallback(`${API_BASE}/agenda`);
    if (remote && Array.isArray(remote)) {
      const saved = localStorage.getItem(localKey);
      const localList = saved ? JSON.parse(saved) : [];
      if (remote.length === 0 && localList.length > 0) {
        localList.forEach(r => this.saveEvento(r, localKey));
        return localList;
      }
      localStorage.setItem(localKey, JSON.stringify(remote));
      return remote;
    }
    const saved = localStorage.getItem(localKey);
    return saved ? JSON.parse(saved) : [];
  },

  async saveEvento(evento, localKey = 'sofia_agenda') {
    const saved = localStorage.getItem(localKey);
    let list = saved ? JSON.parse(saved) : [];
    const idx = list.findIndex(e => e.id === evento.id);
    if (idx >= 0) list[idx] = evento;
    else list.push(evento);
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
      const saved = localStorage.getItem(localKey);
      const localList = saved ? JSON.parse(saved) : [];
      if (remote.length === 0 && localList.length > 0) {
        localList.forEach(r => this.saveMarco(r, localKey));
        return localList;
      }
      localStorage.setItem(localKey, JSON.stringify(remote));
      return remote;
    }
    const saved = localStorage.getItem(localKey);
    return saved ? JSON.parse(saved) : [];
  },

  async saveMarco(marco, localKey = 'sofia_marcos') {
    const saved = localStorage.getItem(localKey);
    let list = saved ? JSON.parse(saved) : [];
    const idx = list.findIndex(m => m.id === marco.id);
    if (idx >= 0) list[idx] = marco;
    else list.push(marco);
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
    let loadedData;
    if (remote && Array.isArray(remote) && remote.length > 0) {
      loadedData = remote;
    } else {
      const saved = localStorage.getItem(localKey);
      loadedData = saved ? JSON.parse(saved) : defaultList;
    }

    if (!defaultList) return loadedData;

    const seen = new Set();
    const cleanList = [];

    (loadedData || []).forEach(v => {
      const normName = normalizeVaccineName(v.nome);
      const key = normName.toLowerCase().trim();
      if (!seen.has(key)) {
        seen.add(key);
        cleanList.push({ ...v, nome: normName });
      }
    });

    defaultList.forEach(def => {
      const normName = normalizeVaccineName(def.nome);
      const key = normName.toLowerCase().trim();
      if (!seen.has(key)) {
        seen.add(key);
        cleanList.push({ ...def, nome: normName });
      }
    });

    localStorage.setItem(localKey, JSON.stringify(cleanList));
    return cleanList;
  },

  async toggleVacina(id, novaLista, localKey = 'sofia_vacinas') {
    localStorage.setItem(localKey, JSON.stringify(novaLista));
    const target = novaLista.find(v => v.id === id);
    if (target) {
      fetchWithFallback(`${API_BASE}/vacinas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tomada: target.tomada, dataAdministrada: target.dataAdministrada })
      });
    }
  },

  // --- DOCUMENTOS ---
  async getDocumentos(defaultList, localKey = 'sofia_documentos') {
    const remote = await fetchWithFallback(`${API_BASE}/documentos`);
    let result = [];
    if (remote && Array.isArray(remote) && remote.length > 0) {
      result = remote;
    } else {
      const saved = localStorage.getItem(localKey);
      result = saved ? JSON.parse(saved) : defaultList;
    }

    // Deduplicate documents by type/title (preserves custom docs)
    const seen = new Set();
    const uniqueList = [];
    (result || []).forEach(doc => {
      const key = (doc.type && doc.type !== 'custom') ? doc.type : (doc.titulo || '').toLowerCase().trim();
      if (!seen.has(key) || doc.type === 'custom') {
        if (doc.type && doc.type !== 'custom') seen.add(key);
        uniqueList.push(doc);
      }
    });

    // Auto-merge any missing default item (e.g. Cartão de Seguro)
    if (defaultList && Array.isArray(defaultList)) {
      defaultList.forEach(d => {
        const key = (d.type && d.type !== 'custom') ? d.type : (d.titulo || '').toLowerCase().trim();
        if (!seen.has(key)) {
          seen.add(key);
          uniqueList.push(d);
        }
      });
    }

    localStorage.setItem(localKey, JSON.stringify(uniqueList));
    return uniqueList;
  },

  async saveDocumentos(novaLista, localKey = 'sofia_documentos') {
    const listWithOrder = (novaLista || []).map((doc, idx) => ({ ...doc, ordem: idx }));
    localStorage.setItem(localKey, JSON.stringify(listWithOrder));
    fetchWithFallback(`${API_BASE}/documentos/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(listWithOrder)
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

  // --- LATAS DE LEITE ---
  async getLatas(localKey = 'sofia_latas') {
    const data = await fetchWithFallback(`${API_BASE}/latas`);
    if (data) {
      localStorage.setItem(localKey, JSON.stringify(data));
      return data;
    }
    const cached = localStorage.getItem(localKey);
    return cached ? JSON.parse(cached) : [];
  },

  async addLata(lata) {
    return fetchWithFallback(`${API_BASE}/latas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lata),
    });
  },

  async deleteLata(id) {
    return fetchWithFallback(`${API_BASE}/latas/${id}`, { method: 'DELETE' });
  },

  // --- LEITE ---
  async getLeite(localKey = 'sofia_leite') {
    const remote = await fetchWithFallback(`${API_BASE}/leite`);
    if (remote && Array.isArray(remote)) {
      const saved = localStorage.getItem(localKey);
      const localList = saved ? JSON.parse(saved) : [];
      if (remote.length === 0 && localList.length > 0) {
        localList.forEach(r => this.saveLeite(r, localKey));
        return localList;
      }
      localStorage.setItem(localKey, JSON.stringify(remote));
      return remote;
    }
    const saved = localStorage.getItem(localKey);
    return saved ? JSON.parse(saved) : [];
  },

  async saveLeite(registo, localKey = 'sofia_leite') {
    const saved = localStorage.getItem(localKey);
    let list = saved ? JSON.parse(saved) : [];
    const idx = list.findIndex(r => r.id === registo.id);
    if (idx >= 0) list[idx] = registo;
    else list.push(registo);
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
      const saved = localStorage.getItem(localKey);
      const localList = saved ? JSON.parse(saved) : [];
      if (remote.length === 0 && localList.length > 0) {
        localList.forEach(r => this.saveFralda(r, localKey));
        return localList;
      }
      localStorage.setItem(localKey, JSON.stringify(remote));
      return remote;
    }
    const saved = localStorage.getItem(localKey);
    return saved ? JSON.parse(saved) : [];
  },

  async saveFralda(registo, localKey = 'sofia_fraldas') {
    const saved = localStorage.getItem(localKey);
    let list = saved ? JSON.parse(saved) : [];
    const idx = list.findIndex(r => r.id === registo.id);
    if (idx >= 0) list[idx] = registo;
    else list.push(registo);
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
  },

  // --- SONOS ---
  async getSonos(localKey = 'sofia_sonos') {
    const remote = await fetchWithFallback(`${API_BASE}/sonos`);
    if (remote && Array.isArray(remote)) {
      const saved = localStorage.getItem(localKey);
      const localList = saved ? JSON.parse(saved) : [];
      if (remote.length === 0 && localList.length > 0) {
        localList.forEach(r => this.saveSono(r, localKey));
        return localList;
      }
      localStorage.setItem(localKey, JSON.stringify(remote));
      return remote;
    }
    const saved = localStorage.getItem(localKey);
    return saved ? JSON.parse(saved) : [];
  },

  async saveSono(registo, localKey = 'sofia_sonos') {
    const saved = localStorage.getItem(localKey);
    let list = saved ? JSON.parse(saved) : [];
    const idx = list.findIndex(r => r.id === registo.id);
    if (idx >= 0) list[idx] = registo;
    else list.push(registo);
    // Sort by hora_inicio descending
    list.sort((a, b) => b.hora_inicio.localeCompare(a.hora_inicio));
    localStorage.setItem(localKey, JSON.stringify(list));

    fetchWithFallback(`${API_BASE}/sonos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registo)
    });
  },

  async deleteSono(id, localKey = 'sofia_sonos') {
    const saved = localStorage.getItem(localKey);
    if (saved) {
      const list = JSON.parse(saved).filter(r => r.id !== id);
      localStorage.setItem(localKey, JSON.stringify(list));
    }
    fetchWithFallback(`${API_BASE}/sonos/${id}`, { method: 'DELETE' });
  },

  // --- CONFIGURACOES ---
  async getConfiguracao(chave) {
    try {
      const result = await fetchWithFallback(`${API_BASE}/configuracoes/${chave}`);
      return result ? result.valor : null;
    } catch (e) {
      console.error('Error fetching config:', e);
      return null;
    }
  },

  async saveConfiguracao(chave, valor) {
    try {
      await fetchWithFallback(`${API_BASE}/configuracoes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chave, valor })
      });
    } catch (e) {
      console.error('Error saving config:', e);
    }
  },

  // --- CATEGORIAS DIGITALIZACOES ---
  async getCategorias(localKey = 'sofia_categorias_digi') {
    const remote = await fetchWithFallback(`${API_BASE}/categorias`);
    if (remote && Array.isArray(remote)) {
      localStorage.setItem(localKey, JSON.stringify(remote));
      return remote;
    }
    const saved = localStorage.getItem(localKey);
    return saved ? JSON.parse(saved) : [];
  },

  async saveCategoria(cat, localKey = 'sofia_categorias_digi') {
    const saved = localStorage.getItem(localKey);
    let list = saved ? JSON.parse(saved) : [];
    const exists = list.some(r => r.id === cat.id);
    if (exists) list = list.map(r => r.id === cat.id ? cat : r);
    else list = [cat, ...list];
    localStorage.setItem(localKey, JSON.stringify(list));

    fetchWithFallback(`${API_BASE}/categorias`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cat)
    });
  },

  async deleteCategoria(id, localKey = 'sofia_categorias_digi') {
    const saved = localStorage.getItem(localKey);
    if (saved) {
      const list = JSON.parse(saved).filter(c => c.id !== id);
      localStorage.setItem(localKey, JSON.stringify(list));
    }
    fetchWithFallback(`${API_BASE}/categorias/${id}`, {
      method: 'DELETE'
    });
  },

  // --- DOCUMENTOS DIGITALIZADOS ---
  async getDigitalizacoes(localKey = 'sofia_digitalizacoes') {
    const remote = await fetchWithFallback(`${API_BASE}/digitalizacoes`);
    if (remote && Array.isArray(remote)) {
      localStorage.setItem(localKey, JSON.stringify(remote));
      return remote;
    }
    const saved = localStorage.getItem(localKey);
    return saved ? JSON.parse(saved) : [];
  },

  async saveDigitalizacao(formData) {
    try {
      const res = await fetch(`${API_BASE}/digitalizacoes`, {
        method: 'POST',
        body: formData
      });
      if (!res.ok) throw new Error('Upload failed');
      return await res.json();
    } catch (err) {
      console.error(err);
      return { error: true };
    }
  },

  async deleteDigitalizacao(id, localKey = 'sofia_digitalizacoes') {
    const saved = localStorage.getItem(localKey);
    if (saved) {
      const list = JSON.parse(saved).filter(d => d.id !== id);
      localStorage.setItem(localKey, JSON.stringify(list));
    }
    fetchWithFallback(`${API_BASE}/digitalizacoes/${id}`, {
      method: 'DELETE'
    });
  }
};
