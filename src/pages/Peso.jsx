import { useState, useEffect } from 'react';
import { differenceInCalendarDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, Scale, Ruler, Trash2, TrendingUp, TrendingDown, Minus, AlertTriangle, X, Pencil } from 'lucide-react';
import WeightChart from '../components/WeightChart';
import HeightChart from '../components/HeightChart';
import { api } from '../services/api';
import './Peso.css';

// Helper for local date parsing (prevents timezone shifts for YYYY-MM-DD strings)
const parseDate = (d) => {
  if (!d) return new Date();
  if (d instanceof Date) return d;
  if (typeof d === 'string' && d.length === 10) {
    const [y, m, day] = d.split('-').map(Number);
    return new Date(y, m - 1, day);
  }
  return new Date(d);
};

const Peso = () => {
  const [subTab, setSubTab] = useState('peso'); // 'peso' | 'altura'

  // ─── PESO STATES ─────────────────────────────────────────────────────────────
  const [registos, setRegistos] = useState([]);
  const [adicionando, setAdicionando] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [novaData, setNovaData] = useState('');
  const [novoPeso, setNovoPeso] = useState('');
  const [confirmarDelete, setConfirmarDelete] = useState(null);

  // ─── ALTURA STATES ───────────────────────────────────────────────────────────
  const [alturas, setAlturas] = useState([]);
  const [adicionandoAltura, setAdicionandoAltura] = useState(false);
  const [editandoIdAltura, setEditandoIdAltura] = useState(null);
  const [novaDataAltura, setNovaDataAltura] = useState('');
  const [novaAlturaVal, setNovaAlturaVal] = useState('');
  const [confirmarDeleteAltura, setConfirmarDeleteAltura] = useState(null);

  useEffect(() => {
    api.getPesos().then(data => setRegistos(data));
    api.getAlturas().then(data => setAlturas(data));
  }, []);

  // ─── PESO HANDLERS ───────────────────────────────────────────────────────────
  const abrirEdicaoPeso = (registo) => {
    setEditandoId(registo.id);
    setNovaData(registo.data);
    setNovoPeso(registo.peso.toString());
    setAdicionando(true);
  };

  const abrirCriacaoPeso = () => {
    setEditandoId(null);
    setNovaData(format(new Date(), 'yyyy-MM-dd'));
    setNovoPeso('');
    setAdicionando(true);
  };

  const adicionarRegistoPeso = (e) => {
    e.preventDefault();
    if (!novaData || !novoPeso) return;
    const registo = {
      id: editandoId || Date.now(),
      data: novaData,
      peso: parseFloat(novoPeso),
    };
    setRegistos(prev => {
      const exists = prev.some(r => r.id === registo.id);
      if (exists) return prev.map(r => r.id === registo.id ? registo : r);
      return [...prev, registo];
    });
    api.savePeso(registo);
    setAdicionando(false);
    setEditandoId(null);
    setNovaData('');
    setNovoPeso('');
  };

  const removerRegistoPeso = () => {
    if (!confirmarDelete) return;
    const idToDelete = confirmarDelete;
    setRegistos(prev => prev.filter(r => r.id !== idToDelete));
    api.deletePeso(idToDelete);
    setConfirmarDelete(null);
  };

  // ─── ALTURA HANDLERS ──────────────────────────────────────────────────────────
  const abrirEdicaoAltura = (registo) => {
    setEditandoIdAltura(registo.id);
    setNovaDataAltura(registo.data);
    setNovaAlturaVal(registo.altura.toString());
    setAdicionandoAltura(true);
  };

  const abrirCriacaoAltura = () => {
    setEditandoIdAltura(null);
    setNovaDataAltura(format(new Date(), 'yyyy-MM-dd'));
    setNovaAlturaVal('');
    setAdicionandoAltura(true);
  };

  const adicionarRegistoAltura = (e) => {
    e.preventDefault();
    if (!novaDataAltura || !novaAlturaVal) return;
    const registo = {
      id: editandoIdAltura || Date.now(),
      data: novaDataAltura,
      altura: parseFloat(novaAlturaVal),
    };
    setAlturas(prev => {
      const exists = prev.some(r => r.id === registo.id);
      if (exists) return prev.map(r => r.id === registo.id ? registo : r);
      return [...prev, registo];
    });
    api.saveAltura(registo);
    setAdicionandoAltura(false);
    setEditandoIdAltura(null);
    setNovaDataAltura('');
    setNovaAlturaVal('');
  };

  const removerRegistoAltura = () => {
    if (!confirmarDeleteAltura) return;
    const idToDelete = confirmarDeleteAltura;
    setAlturas(prev => prev.filter(r => r.id !== idToDelete));
    api.deleteAltura(idToDelete);
    setConfirmarDeleteAltura(null);
  };

  // ─── PESO CALCULATIONS ────────────────────────────────────────────────────────
  const processedRegistos = [...registos]
    .sort((a, b) => parseDate(a.data) - parseDate(b.data))
    .map((registo, index, array) => {
      let ganhoDia = null;
      let ganhoTotal = null;

      if (index > 0) {
        const prev = array[index - 1];
        const dCurr = parseDate(registo.data);
        const dPrev = parseDate(prev.data);
        const daysDiff = differenceInCalendarDays(dCurr, dPrev);
        const weightDiffGrams = Math.round((registo.peso - prev.peso) * 1000);
        
        const effectiveDays = daysDiff > 0 ? daysDiff : 1;
        ganhoDia = Math.round(weightDiffGrams / effectiveDays);
      }

      if (index > 0) {
        const first = array[0];
        ganhoTotal = Math.round((registo.peso - first.peso) * 1000);
      }

      return { ...registo, ganhoDia, ganhoTotal };
    })
    .reverse();

  const chartDataPeso = [...processedRegistos].reverse().map(r => ({
    dataFormato: format(parseDate(r.data), 'dd/MM'),
    peso: r.peso,
    ganhoDia: r.ganhoDia,
  }));

  // ─── ALTURA CALCULATIONS ──────────────────────────────────────────────────────
  const processedAlturas = [...alturas]
    .sort((a, b) => parseDate(a.data) - parseDate(b.data))
    .map((registo, index, array) => {
      let ganhoDia = null;
      let ganhoTotal = null;

      if (index > 0) {
        const prev = array[index - 1];
        const dCurr = parseDate(registo.data);
        const dPrev = parseDate(prev.data);
        const daysDiff = differenceInCalendarDays(dCurr, dPrev);
        const diffCm = registo.altura - prev.altura;
        
        const effectiveDays = daysDiff > 0 ? daysDiff : 1;
        ganhoDia = parseFloat((diffCm / effectiveDays).toFixed(2));
      }

      if (index > 0) {
        const first = array[0];
        ganhoTotal = parseFloat((registo.altura - first.altura).toFixed(1));
      }

      return { ...registo, ganhoDia, ganhoTotal };
    })
    .reverse();

  const chartDataAltura = [...processedAlturas].reverse().map(r => ({
    dataFormato: format(parseDate(r.data), 'dd/MM'),
    altura: r.altura,
    ganhoDia: r.ganhoDia,
  }));

  return (
    <div className="page-container">

      {/* Sub-tabs Selection Header */}
      <div className="subtabs-container mb-4">
        <button
          className={`subtab-btn ${subTab === 'peso' ? 'active' : ''}`}
          onClick={() => setSubTab('peso')}
        >
          <Scale size={18} />
          <span>Peso (kg)</span>
        </button>
        <button
          className={`subtab-btn ${subTab === 'altura' ? 'active' : ''}`}
          onClick={() => setSubTab('altura')}
        >
          <Ruler size={18} />
          <span>Altura (cm)</span>
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          SUB-TAB 1: PESO (KG)
         ═══════════════════════════════════════════════════════════════════════ */}
      {subTab === 'peso' && (
        <>
          <div className="flex-between mb-4 flex-wrap gap-2">
            <h2 className="h2 text-gradient flex-center" style={{ gap: '0.5rem', justifyContent: 'flex-start' }}>
              <Scale size={28} color="var(--color-primary)" /> Registo de Peso
            </h2>
            <button className="btn-primary" onClick={abrirCriacaoPeso}>
              <Plus size={18} />
              Novo Peso
            </button>
          </div>

          {/* Weight Chart Card */}
          <div className="glass-card mb-4" style={{ padding: '1.25rem 1rem 0.5rem' }}>
            <WeightChart chartData={chartDataPeso} />
          </div>

          {/* Weight Log Table */}
          <div className="peso-table-container glass-card">
            {processedRegistos.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-light)' }}>
                <Scale size={48} style={{ margin: '0 auto 1rem', opacity: 0.25 }} />
                <p>Ainda não foram registadas pesagens.</p>
              </div>
            ) : (
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Peso</th>
                    <th>Variação / dia</th>
                    <th className="col-total">Total</th>
                    <th className="text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {processedRegistos.map((registo, index) => {
                    const dateObj = parseDate(registo.data);
                    const isGain = registo.ganhoDia !== null && registo.ganhoDia > 0;
                    const isLoss = registo.ganhoDia !== null && registo.ganhoDia < 0;
                    const isTotalGain = registo.ganhoTotal !== null && registo.ganhoTotal > 0;

                    return (
                      <tr key={registo.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.04}s` }}>
                        <td>
                          <div className="td-date">{format(dateObj, "dd/MM/yyyy")}</div>
                        </td>
                        <td>
                          <div className="td-weight">{registo.peso.toFixed(3)} <span>kg</span></div>
                        </td>
                        <td>
                          {registo.ganhoDia !== null ? (
                            <div className={`ganho-badge ${isGain ? 'gain' : isLoss ? 'loss' : 'neutral'}`}>
                              {isGain ? <TrendingUp size={12} /> : isLoss ? <TrendingDown size={12} /> : <Minus size={12} />}
                              <span className="badge-text-full">{registo.ganhoDia > 0 ? '+' : ''}{registo.ganhoDia} g/dia</span>
                              <span className="badge-text-short">{registo.ganhoDia > 0 ? '+' : ''}{registo.ganhoDia}g/d</span>
                            </div>
                          ) : (
                            <div className="ganho-badge neutral">
                              <span className="badge-text-full">— Início</span>
                              <span className="badge-text-short">—</span>
                            </div>
                          )}
                        </td>
                        <td className="col-total">
                          {registo.ganhoTotal !== null ? (
                            <div className={`ganho-badge ${isTotalGain ? 'gain' : 'loss'}`}>
                              <span>{registo.ganhoTotal > 0 ? '+' : ''}{registo.ganhoTotal} g</span>
                            </div>
                          ) : (
                            <div className="ganho-badge neutral"><span>—</span></div>
                          )}
                        </td>
                        <td className="text-right">
                          <div className="btn-action-group">
                            <button className="btn-action-edit" onClick={() => abrirEdicaoPeso(registo)} title="Editar pesagem">
                              <Pencil size={17} />
                            </button>
                            <button className="btn-action-delete" onClick={() => setConfirmarDelete(registo.id)} title="Remover registo">
                              <Trash2 size={17} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          SUB-TAB 2: ALTURA (CM)
         ═══════════════════════════════════════════════════════════════════════ */}
      {subTab === 'altura' && (
        <>
          <div className="flex-between mb-4 flex-wrap gap-2">
            <h2 className="h2 text-gradient flex-center" style={{ gap: '0.5rem', justifyContent: 'flex-start' }}>
              <Ruler size={28} color="#8B5CF6" /> Registo de Altura
            </h2>
            <button className="btn-primary" style={{ background: 'linear-gradient(135deg, #8B5CF6, #EC4899)' }} onClick={abrirCriacaoAltura}>
              <Plus size={18} />
              Nova Altura
            </button>
          </div>

          {/* Height Chart Card */}
          <div className="glass-card mb-4" style={{ padding: '1.25rem 1rem 0.5rem' }}>
            <HeightChart chartData={chartDataAltura} />
          </div>

          {/* Height Log Table */}
          <div className="peso-table-container glass-card">
            {processedAlturas.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-light)' }}>
                <Ruler size={48} style={{ margin: '0 auto 1rem', opacity: 0.25 }} />
                <p>Ainda não foram registadas medições de altura.</p>
              </div>
            ) : (
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Altura</th>
                    <th>Variação / dia</th>
                    <th className="col-total">Total</th>
                    <th className="text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {processedAlturas.map((registo, index) => {
                    const dateObj = parseDate(registo.data);
                    const isGain = registo.ganhoDia !== null && registo.ganhoDia > 0;
                    const isLoss = registo.ganhoDia !== null && registo.ganhoDia < 0;
                    const isTotalGain = registo.ganhoTotal !== null && registo.ganhoTotal > 0;

                    return (
                      <tr key={registo.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.04}s` }}>
                        <td>
                          <div className="td-date">{format(dateObj, "dd/MM/yyyy")}</div>
                        </td>
                        <td>
                          <div className="td-weight" style={{ color: '#8B5CF6' }}>
                            {registo.altura.toFixed(1)} <span>cm</span>
                          </div>
                        </td>
                        <td>
                          {registo.ganhoDia !== null ? (
                            <div className={`ganho-badge ${isGain ? 'gain' : isLoss ? 'loss' : 'neutral'}`}>
                              {isGain ? <TrendingUp size={12} /> : isLoss ? <TrendingDown size={12} /> : <Minus size={12} />}
                              <span className="badge-text-full">{registo.ganhoDia > 0 ? '+' : ''}{registo.ganhoDia} cm/dia</span>
                              <span className="badge-text-short">{registo.ganhoDia > 0 ? '+' : ''}{registo.ganhoDia} cm/d</span>
                            </div>
                          ) : (
                            <div className="ganho-badge neutral">
                              <span className="badge-text-full">— Início</span>
                              <span className="badge-text-short">—</span>
                            </div>
                          )}
                        </td>
                        <td className="col-total">
                          {registo.ganhoTotal !== null ? (
                            <div className={`ganho-badge ${isTotalGain ? 'gain' : 'loss'}`}>
                              <span>{registo.ganhoTotal > 0 ? '+' : ''}{registo.ganhoTotal} cm</span>
                            </div>
                          ) : (
                            <div className="ganho-badge neutral"><span>—</span></div>
                          )}
                        </td>
                        <td className="text-right">
                          <div className="btn-action-group">
                            <button className="btn-action-edit" onClick={() => abrirEdicaoAltura(registo)} title="Editar medição">
                              <Pencil size={17} />
                            </button>
                            <button className="btn-action-delete" onClick={() => setConfirmarDeleteAltura(registo.id)} title="Remover registo">
                              <Trash2 size={17} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* ─── ADD / EDIT WEIGHT MODAL ─── */}
      {adicionando && (
        <div className="modal-overlay" onClick={() => setAdicionando(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <div className="modal-icon-badge">
                  <Scale size={22} />
                </div>
                <div>
                  <h3 className="modal-title">{editandoId ? 'Editar Pesagem' : 'Registar Nova Pesagem'}</h3>
                  <p className="modal-subtitle">Registe o peso atual da Sofia em kg</p>
                </div>
              </div>
              <button className="btn-icon" onClick={() => setAdicionando(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={adicionarRegistoPeso} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="input-group">
                <label className="input-label">Data da Pesagem</label>
                <input
                  type="date"
                  className="input-field"
                  value={novaData}
                  onChange={(e) => setNovaData(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label">Peso (kg)</label>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  className="input-field"
                  placeholder="Ex: 3.450"
                  value={novoPeso}
                  onChange={(e) => setNovoPeso(e.target.value)}
                  required
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn-outline" onClick={() => setAdicionando(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  {editandoId ? 'Guardar Alterações' : 'Adicionar Peso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── ADD / EDIT HEIGHT MODAL ─── */}
      {adicionandoAltura && (
        <div className="modal-overlay" onClick={() => setAdicionandoAltura(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <div className="modal-icon-badge" style={{ background: 'rgba(139,92,246,0.12)', color: '#8B5CF6' }}>
                  <Ruler size={22} />
                </div>
                <div>
                  <h3 className="modal-title">{editandoIdAltura ? 'Editar Medição' : 'Registar Nova Altura'}</h3>
                  <p className="modal-subtitle">Registe a altura atual da Sofia em centímetros (cm)</p>
                </div>
              </div>
              <button className="btn-icon" onClick={() => setAdicionandoAltura(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={adicionarRegistoAltura} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="input-group">
                <label className="input-label">Data da Medição</label>
                <input
                  type="date"
                  className="input-field"
                  value={novaDataAltura}
                  onChange={(e) => setNovaDataAltura(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label">Altura (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  className="input-field"
                  placeholder="Ex: 54.5"
                  value={novaAlturaVal}
                  onChange={(e) => setNovaAlturaVal(e.target.value)}
                  required
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn-outline" onClick={() => setAdicionandoAltura(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" style={{ background: 'linear-gradient(135deg, #8B5CF6, #EC4899)' }}>
                  {editandoIdAltura ? 'Guardar Alterações' : 'Adicionar Altura'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── DELETE WEIGHT CONFIRMATION MODAL ─── */}
      {confirmarDelete && (
        <div className="modal-overlay" onClick={() => setConfirmarDelete(null)}>
          <div className="modal-card" style={{ maxWidth: '400px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.5rem' }}>
              <AlertTriangle size={26} color="#ef4444" />
            </div>
            <div>
              <h3 style={{ margin: '0 0 0.35rem', fontSize: '1.15rem', fontWeight: 800 }}>Remover Pesagem?</h3>
              <p style={{ color: 'var(--color-text-light)', fontSize: '0.86rem', margin: 0 }}>
                Este registo de peso será apagado do gráfico e histórico.
              </p>
            </div>
            <div className="form-actions" style={{ marginTop: '0.5rem' }}>
              <button className="btn-outline" onClick={() => setConfirmarDelete(null)}>
                <X size={16} /> Cancelar
              </button>
              <button
                className="btn-primary"
                style={{ background: '#ef4444', borderColor: '#ef4444', boxShadow: '0 4px 14px rgba(239,68,68,0.35)' }}
                onClick={removerRegistoPeso}
              >
                <Trash2 size={16} /> Remover
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── DELETE HEIGHT CONFIRMATION MODAL ─── */}
      {confirmarDeleteAltura && (
        <div className="modal-overlay" onClick={() => setConfirmarDeleteAltura(null)}>
          <div className="modal-card" style={{ maxWidth: '400px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.5rem' }}>
              <AlertTriangle size={26} color="#ef4444" />
            </div>
            <div>
              <h3 style={{ margin: '0 0 0.35rem', fontSize: '1.15rem', fontWeight: 800 }}>Remover Altura?</h3>
              <p style={{ color: 'var(--color-text-light)', fontSize: '0.86rem', margin: 0 }}>
                Este registo de altura será apagado do histórico.
              </p>
            </div>
            <div className="form-actions" style={{ marginTop: '0.5rem' }}>
              <button className="btn-outline" onClick={() => setConfirmarDeleteAltura(null)}>
                <X size={16} /> Cancelar
              </button>
              <button
                className="btn-primary"
                style={{ background: '#ef4444', borderColor: '#ef4444', boxShadow: '0 4px 14px rgba(239,68,68,0.35)' }}
                onClick={removerRegistoAltura}
              >
                <Trash2 size={16} /> Remover
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Peso;
