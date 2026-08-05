import { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, Trash2, CheckCircle, Sparkles } from 'lucide-react';
import './TeethMap.css';

// Order colors from the reference image
const ORDER_COLORS = {
  1: '#4CAF50', // green
  2: '#E91E63', // pink/magenta
  3: '#2196F3', // blue
  4: '#D97706', // amber/brown
  5: '#EF4444', // red
  6: '#9333EA', // purple
  7: '#F59E0B', // orange
};

const LEGEND = [
  { num: 1, label: 'Entre os 6 e 8 meses',   desc: 'Dois incisivos inferiores centrais', color: '#4CAF50' },
  { num: 2, label: 'Por volta dos 8 meses',   desc: 'Dois incisivos superiores centrais', color: '#E91E63' },
  { num: 3, label: 'Entre os 8 e 12 meses',   desc: 'Dois incisivos superiores laterais', color: '#2196F3' },
  { num: 4, label: 'Entre os 10 e 12 meses',  desc: 'Dois incisivos inferiores laterais', color: '#D97706' },
  { num: 5, label: 'Entre os 14 e 20 meses',  desc: 'Quatro primeiros molares',           color: '#EF4444' },
  { num: 6, label: 'Entre os 18 e 24 meses',  desc: 'Quatro caninos',                     color: '#9333EA' },
  { num: 7, label: 'Entre os 2 e 3 anos',     desc: 'Quatro segundos molares',            color: '#F59E0B' },
];

// Image coordinates mapped precisely to dentes-leite.png arch (634px / 1024px clipped circle area)
const TEETH = [
  // ── ARCADA SUPERIOR (UPPER) ───────────────────────────────────────────────
  { id: 'u_ic_dir', label: 'Incisivo Central Sup. Direito',  order: 2, top: 23.5, left: 40.0, w: 9.0, h: 6.0, borderRadius: '6px 6px 14px 14px' },
  { id: 'u_ic_esq', label: 'Incisivo Central Sup. Esquerdo', order: 2, top: 23.5, left: 51.0, w: 9.0, h: 6.0, borderRadius: '6px 6px 14px 14px' },
  { id: 'u_il_dir', label: 'Incisivo Lateral Sup. Direito',  order: 3, top: 25.5, left: 29.5, w: 8.5, h: 6.0, borderRadius: '6px 8px 12px 14px' },
  { id: 'u_il_esq', label: 'Incisivo Lateral Sup. Esquerdo', order: 3, top: 25.5, left: 62.0, w: 8.5, h: 6.0, borderRadius: '8px 6px 14px 12px' },
  { id: 'u_c_dir',  label: 'Canino Superior Direito',        order: 6, top: 30.5, left: 20.0, w: 8.5, h: 6.5, borderRadius: '6px 12px 10px 14px' },
  { id: 'u_c_esq',  label: 'Canino Superior Esquerdo',       order: 6, top: 30.5, left: 71.5, w: 8.5, h: 6.5, borderRadius: '12px 6px 14px 10px' },
  { id: 'u_m1_dir', label: '1º Molar Superior Direito',      order: 5, top: 38.0, left: 14.5, w: 10.0, h: 7.0, borderRadius: '8px' },
  { id: 'u_m1_esq', label: '1º Molar Superior Esquerdo',     order: 5, top: 38.0, left: 75.5, w: 10.0, h: 7.0, borderRadius: '8px' },
  { id: 'u_m2_dir', label: '2º Molar Superior Direito',      order: 7, top: 46.5, left: 13.0, w: 10.5, h: 7.5, borderRadius: '10px' },
  { id: 'u_m2_esq', label: '2º Molar Superior Esquerdo',     order: 7, top: 46.5, left: 76.5, w: 10.5, h: 7.5, borderRadius: '10px' },

  // ── ARCADA INFERIOR (LOWER) ───────────────────────────────────────────────
  { id: 'l_ic_dir', label: 'Incisivo Central Inf. Direito',  order: 1, top: 80.5, left: 42.0, w: 7.5, h: 5.5, borderRadius: '14px 14px 6px 6px' },
  { id: 'l_ic_esq', label: 'Incisivo Central Inf. Esquerdo', order: 1, top: 80.5, left: 50.5, w: 7.5, h: 5.5, borderRadius: '14px 14px 6px 6px' },
  { id: 'l_il_dir', label: 'Incisivo Lateral Inf. Direito',  order: 4, top: 78.5, left: 33.5, w: 8.0, h: 5.5, borderRadius: '12px 14px 6px 8px' },
  { id: 'l_il_esq', label: 'Incisivo Lateral Inf. Esquerdo', order: 4, top: 78.5, left: 58.5, w: 8.0, h: 5.5, borderRadius: '14px 12px 8px 6px' },
  { id: 'l_c_dir',  label: 'Canino Inferior Direito',        order: 6, top: 73.0, left: 25.0, w: 8.5, h: 6.0, borderRadius: '12px 14px 6px 10px' },
  { id: 'l_c_esq',  label: 'Canino Inferior Esquerdo',       order: 6, top: 73.0, left: 66.5, w: 8.5, h: 6.0, borderRadius: '14px 12px 10px 6px' },
  { id: 'l_m1_dir', label: '1º Molar Inferior Direito',      order: 5, top: 64.0, left: 18.0, w: 10.0, h: 7.0, borderRadius: '10px' },
  { id: 'l_m1_esq', label: '1º Molar Inferior Esquerdo',     order: 5, top: 64.0, left: 72.0, w: 10.0, h: 7.0, borderRadius: '10px' },
  { id: 'l_m2_dir', label: '2º Molar Inferior Direito',      order: 7, top: 54.0, left: 15.0, w: 10.5, h: 7.5, borderRadius: '12px' },
  { id: 'l_m2_esq', label: '2º Molar Inferior Esquerdo',     order: 7, top: 54.0, left: 74.5, w: 10.5, h: 7.5, borderRadius: '12px' },
];

const TeethMap = () => {
  const [teethingData, setTeethingData] = useState(() => {
    const saved = localStorage.getItem('sofia_denticao');
    return saved ? JSON.parse(saved) : {};
  });
  const [selectedTooth, setSelectedTooth] = useState(null);
  const [eruptionDate, setEruptionDate] = useState('');

  useEffect(() => {
    localStorage.setItem('sofia_denticao', JSON.stringify(teethingData));
  }, [teethingData]);

  const openModal = (t) => {
    setSelectedTooth(t);
    const hojeStr = new Date().toISOString().split('T')[0];
    setEruptionDate(teethingData[t.id] || hojeStr);
  };
  
  const closeModal = () => {
    setSelectedTooth(null);
    setEruptionDate('');
  };

  const saveToothDate = (e) => {
    e.preventDefault();
    if (!eruptionDate) return;
    setTeethingData(prev => ({ ...prev, [selectedTooth.id]: eruptionDate }));
    closeModal();
  };

  const removeToothDate = () => {
    setTeethingData(prev => {
      const next = { ...prev };
      delete next[selectedTooth.id];
      return next;
    });
    closeModal();
  };

  const eruptedCount = Object.keys(teethingData).length;

  return (
    <div className="teething-illustration-layout">
      <div className="teething-header">
        <h2 className="teething-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <Sparkles size={24} color="var(--color-primary)" /> Dentição da Sofia 🦷
        </h2>
        <p className="teething-subtitle">
          <strong>{eruptedCount} de 20 dentes nascidos</strong> • Clique no dente para registar a data e pintá-lo de branco!
        </p>
      </div>

      {/* Mapa do dente (recortado exatamente na arcada da imagem dentes-leite.png) */}
      <div className="teeth-image-map-container">
        <div className="teeth-image-clip">
          <img
            src="/realistic_gums.jpg"
            alt="Gengivas"
            className="teeth-base-image"
            draggable={false}
          />

          {/* Dentes sobrepostos com mapeamento perfeito */}
          {TEETH.map(tooth => {
            const isErupted = !!teethingData[tooth.id];
            const color = ORDER_COLORS[tooth.order];
            return (
              <button
                key={tooth.id}
                type="button"
                className={`tooth-hotspot ${isErupted ? 'tooth-erupted' : ''}`}
                style={{
                  top: `${tooth.top}%`,
                  left: `${tooth.left}%`,
                  width: `${tooth.w}%`,
                  height: `${tooth.h}%`,
                  borderRadius: tooth.borderRadius,
                  borderColor: color,
                }}
                onClick={() => openModal(tooth)}
                title={`${tooth.label} ${isErupted ? '(Nascido a ' + teethingData[tooth.id] + ')' : '(Clique para adicionar)'}`}
              >
                {isErupted ? (
                  <span className="tooth-erupted-badge">
                    <CheckCircle size={14} color={color} fill="white" />
                  </span>
                ) : (
                  <span className="tooth-order-num" style={{ color: color }}>
                    {tooth.order}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legenda de Erupção */}
      <div className="teething-legend teething-legend-horizontal">
        <h3 className="legend-title">Ordem de Erupção dos Dentes</h3>
        <div className="legend-list legend-grid">
          {LEGEND.map(item => (
            <div key={item.num} className="legend-item">
              <div className="legend-number" style={{ backgroundColor: item.color }}>{item.num}</div>
              <div>
                <div className="legend-text" style={{ color: item.color }}>{item.label}</div>
                <div className="legend-desc">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal para registar a data */}
      {selectedTooth && (
        <div className="tooth-modal-overlay" onClick={closeModal}>
          <div className="tooth-modal glass-card animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="flex-between mb-4">
              <h3 className="h3" style={{ color: 'var(--color-primary-dark)' }}>
                {teethingData[selectedTooth.id] ? 'Dente Registado 🦷' : 'Registar Novo Dente 🦷'}
              </h3>
              <button className="btn-icon" onClick={closeModal}><X size={20} /></button>
            </div>

            <div className="tooth-modal-info">
              <div 
                className="tooth-modal-order-badge" 
                style={{ backgroundColor: ORDER_COLORS[selectedTooth.order] }}
              >
                {selectedTooth.order}
              </div>
              <div>
                <h4 style={{ fontWeight: 800, margin: 0, fontSize: '1.05rem' }}>{selectedTooth.label}</h4>
                <p style={{ fontSize: '0.85rem', color: ORDER_COLORS[selectedTooth.order], fontWeight: 700, margin: '2px 0 0' }}>
                  {LEGEND.find(l => l.num === selectedTooth.order)?.label} ({LEGEND.find(l => l.num === selectedTooth.order)?.desc})
                </p>
              </div>
            </div>

            {teethingData[selectedTooth.id] && (
              <div className="tooth-erupted-alert">
                <CheckCircle size={18} color="#10B981" />
                <span>
                  Este dente já nasceu e está <strong>pintado de branco ✨</strong>!
                </span>
              </div>
            )}

            <form onSubmit={saveToothDate}>
              <div className="input-group mb-4">
                <label className="input-label" style={{ fontWeight: 700 }}>
                  <CalendarIcon size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
                  Data em que nasceu (rasgou a gengiva)
                </label>
                <input
                  type="date"
                  className="input-field"
                  value={eruptionDate}
                  onChange={e => setEruptionDate(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                  {teethingData[selectedTooth.id] ? 'Atualizar Data' : 'Confirmar & Pintar de Branco 🦷'}
                </button>
                {teethingData[selectedTooth.id] && (
                  <button type="button" className="btn-outline" onClick={removeToothDate} style={{ color: '#EF4444', borderColor: '#FCA5A5' }} title="Remover Registo">
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeethMap;
