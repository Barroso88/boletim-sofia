import { useState, useEffect } from 'react';
import { differenceInCalendarDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, Scale, Trash2, TrendingUp, TrendingDown, Minus, AlertTriangle, X, Pencil } from 'lucide-react';
import WeightChart from '../components/WeightChart';
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
  const [registos, setRegistos] = useState([]);
  const [adicionando, setAdicionando] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [novaData, setNovaData] = useState('');
  const [novoPeso, setNovoPeso] = useState('');
  const [confirmarDelete, setConfirmarDelete] = useState(null);

  useEffect(() => {
    api.getPesos().then(data => setRegistos(data));
  }, []);

  const abrirEdicao = (registo) => {
    setEditandoId(registo.id);
    setNovaData(registo.data);
    setNovoPeso(registo.peso.toString());
    setAdicionando(true);
  };

  const adicionarRegisto = (e) => {
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

  const confirmarRemocao = (id) => setConfirmarDelete(id);

  const removerRegisto = () => {
    const idToDelete = confirmarDelete;
    setRegistos(prev => prev.filter(r => r.id !== idToDelete));
    api.deletePeso(idToDelete);
    setConfirmarDelete(null);
  };

  // Sort ascending, compute ganhoDia (g/dia vs prev record)
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

      // Total gain/loss since first record
      if (index > 0) {
        const first = array[0];
        ganhoTotal = Math.round((registo.peso - first.peso) * 1000);
      }

      return { ...registo, ganhoDia, ganhoTotal };
    })
    .reverse(); // Newest first

  const chartData = [...processedRegistos].reverse().map(r => ({
    dataFormato: format(parseDate(r.data), 'dd/MM'),
    peso: r.peso,
    ganhoDia: r.ganhoDia,
  }));

  return (
    <div className="page-container">
      <div className="flex-between mb-4">
        <h2 className="h2 text-gradient" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Scale size={32} color="var(--color-primary)" /> Registo de Peso
        </h2>
        <button className="btn-primary" onClick={() => setAdicionando(true)}>
          <Plus size={20} />
          Novo Peso
        </button>
      </div>

      {adicionando && (
        <div className="modal-overlay" onClick={() => setAdicionando(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <div className="modal-icon-badge">
                  <Scale size={22} />
                </div>
                <div>
                  <h3 className="modal-title">Registar Nova Pesagem</h3>
                  <p className="modal-subtitle">Registe o peso atual da Sofia em kg</p>
                </div>
              </div>
              <button className="btn-icon" onClick={() => setAdicionando(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={adicionarRegisto} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
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
                  value={novoPeso}
                  onChange={(e) => setNovoPeso(e.target.value)}
                  placeholder="Ex: 3.500"
                  required
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn-outline" onClick={() => setAdicionando(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Guardar Registo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {registos.length >= 2 && (
        <div className="glass-card mb-4 animate-fade-in" style={{ padding: '1.5rem 1rem 1rem', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', padding: '0 0.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text)', margin: 0 }}>Evolução de Peso</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', margin: '2px 0 0' }}>{registos.length} pesagens registadas</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-light)', margin: 0 }}>Peso Máximo</p>
              <p style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-primary)', margin: 0 }}>{Math.max(...registos.map(r => r.peso)).toFixed(3)} kg</p>
            </div>
          </div>
          <WeightChart chartData={chartData} />
        </div>
      )}

      <div className="peso-table-container glass-card">
        {processedRegistos.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-light)' }}>
            <Scale size={64} style={{ margin: '0 auto 1rem', opacity: 0.2 }} />
            <p>Ainda não foram registados pesos.</p>
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
                const dateObj = new Date(registo.data);
                const isGain = registo.ganhoDia !== null && registo.ganhoDia > 0;
                const isLoss = registo.ganhoDia !== null && registo.ganhoDia < 0;
                const isTotalGain = registo.ganhoTotal !== null && registo.ganhoTotal > 0;

                return (
                  <tr key={registo.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
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
                        <button className="btn-action-edit" onClick={() => abrirEdicao(registo)} title="Editar pesagem">
                          <Pencil size={17} />
                        </button>
                        <button className="btn-action-delete" onClick={() => confirmarRemocao(registo.id)} title="Remover registo">
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

      {/* Delete Confirmation Modal */}
      {confirmarDelete && (
        <div className="modal-overlay" onClick={() => setConfirmarDelete(null)}>
          <div className="modal-card" style={{ maxWidth: '400px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.5rem' }}>
              <AlertTriangle size={26} color="#ef4444" />
            </div>
            <div>
              <h3 style={{ margin: '0 0 0.35rem', fontSize: '1.15rem', fontWeight: 800 }}>Remover Pesagem?</h3>
              <p style={{ color: 'var(--color-text-light)', fontSize: '0.86rem', margin: 0 }}>
                Esta ação não pode ser desfeita.
              </p>
            </div>
            <div className="form-actions" style={{ marginTop: '0.5rem' }}>
              <button className="btn-outline" onClick={() => setConfirmarDelete(null)}>
                <X size={16} /> Cancelar
              </button>
              <button
                className="btn-primary"
                style={{ background: '#ef4444', borderColor: '#ef4444', boxShadow: '0 4px 14px rgba(239,68,68,0.35)' }}
                onClick={removerRegisto}
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
