import { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, Trash2, CheckCircle } from 'lucide-react';
import './TeethMap.css';

// ── Image dimensions: 1024x661 — but we crop to the circle (approx 0–65% width)
// We use the image as-is, cropped to show only the circle.
// Tooth hotspot positions are in % relative to the image container.
// The image is shown at 100% width, so % coords map directly.

// Order colors from the reference image
const ORDER_COLORS = {
  1: '#4CAF50', // green
  2: '#2196F3', // blue
  3: '#2196F3', // blue
  4: '#4CAF50', // green
  5: '#FF9800', // orange
  6: '#E91E63', // pink/red
  7: '#FF9800', // orange
};

const LEGEND = [
  { num: 1, label: 'Entre os 6 e 8 meses',   desc: 'Dois incisivos inferiores centrais', color: '#4CAF50' },
  { num: 2, label: 'Por volta dos 8 meses',   desc: 'Dois incisivos superiores centrais', color: '#2196F3' },
  { num: 3, label: 'Entre os 8 e 12 meses',   desc: 'Dois incisivos superiores laterais', color: '#2196F3' },
  { num: 4, label: 'Entre os 10 e 12 meses',  desc: 'Dois incisivos inferiores laterais', color: '#4CAF50' },
  { num: 5, label: 'Entre os 14 e 20 meses',  desc: 'Quatro primeiros molares',           color: '#FF9800' },
  { num: 6, label: 'Entre os 18 e 24 meses',  desc: 'Quatro caninos',                     color: '#E91E63' },
  { num: 7, label: 'Entre os 2 e 3 anos',     desc: 'Quatro segundos molares',            color: '#FF9800' },
];

// Hotspot positions as % of the image (1024x661 original, cropped to 65% width → circle only)
// Mapped from visual inspection of each tooth in the image.
// Format: { id, label, order, top%, left%, w%, h% }
const TEETH = [
  // ── UPPER arch (top of circle) ─────────────────────────────────────────────
  // Incisivo Central Superior Dir (2) — top center-left
  { id: 'u_ic_dir', label: 'Incisivo Central Sup. Direito',  order: 2, top: 7,  left: 37, w: 8, h: 13 },
  // Incisivo Central Superior Esq (2)
  { id: 'u_ic_esq', label: 'Incisivo Central Sup. Esquerdo', order: 2, top: 7,  left: 47, w: 8, h: 13 },
  // Incisivo Lateral Superior Dir (3)
  { id: 'u_il_dir', label: 'Incisivo Lateral Sup. Direito',  order: 3, top: 10, left: 27, w: 8, h: 12 },
  // Incisivo Lateral Superior Esq (3)
  { id: 'u_il_esq', label: 'Incisivo Lateral Sup. Esquerdo', order: 3, top: 10, left: 57, w: 8, h: 12 },
  // Canino Superior Dir (6)
  { id: 'u_c_dir',  label: 'Canino Superior Direito',        order: 6, top: 20, left: 19, w: 8, h: 13 },
  // Canino Superior Esq (6)
  { id: 'u_c_esq',  label: 'Canino Superior Esquerdo',       order: 6, top: 20, left: 65, w: 8, h: 13 },
  // 1º Molar Superior Dir (5)
  { id: 'u_m1_dir', label: '1º Molar Superior Direito',      order: 5, top: 30, left: 10, w: 10, h: 15 },
  // 1º Molar Superior Esq (5)
  { id: 'u_m1_esq', label: '1º Molar Superior Esquerdo',     order: 5, top: 30, left: 73, w: 10, h: 15 },
  // 2º Molar Superior Dir (7)
  { id: 'u_m2_dir', label: '2º Molar Superior Direito',      order: 7, top: 46, left: 5,  w: 11, h: 15 },
  // 2º Molar Superior Esq (7)
  { id: 'u_m2_esq', label: '2º Molar Superior Esquerdo',     order: 7, top: 46, left: 78, w: 11, h: 15 },

  // ── LOWER arch (bottom of circle) ──────────────────────────────────────────
  // Incisivo Central Inferior Dir (1)
  { id: 'l_ic_dir', label: 'Incisivo Central Inf. Direito',  order: 1, top: 78, left: 37, w: 8, h: 13 },
  // Incisivo Central Inferior Esq (1)
  { id: 'l_ic_esq', label: 'Incisivo Central Inf. Esquerdo', order: 1, top: 78, left: 47, w: 8, h: 13 },
  // Incisivo Lateral Inferior Dir (4)
  { id: 'l_il_dir', label: 'Incisivo Lateral Inf. Direito',  order: 4, top: 74, left: 27, w: 8, h: 12 },
  // Incisivo Lateral Inferior Esq (4)
  { id: 'l_il_esq', label: 'Incisivo Lateral Inf. Esquerdo', order: 4, top: 74, left: 57, w: 8, h: 12 },
  // Canino Inferior Dir (6)
  { id: 'l_c_dir',  label: 'Canino Inferior Direito',        order: 6, top: 65, left: 19, w: 8, h: 13 },
  // Canino Inferior Esq (6)
  { id: 'l_c_esq',  label: 'Canino Inferior Esquerdo',       order: 6, top: 65, left: 65, w: 8, h: 13 },
  // 1º Molar Inferior Dir (5)
  { id: 'l_m1_dir', label: '1º Molar Inferior Direito',      order: 5, top: 55, left: 10, w: 10, h: 15 },
  // 1º Molar Inferior Esq (5)
  { id: 'l_m1_esq', label: '1º Molar Inferior Esquerdo',     order: 5, top: 55, left: 73, w: 10, h: 15 },
  // 2º Molar Inferior Dir (7)
  { id: 'l_m2_dir', label: '2º Molar Inferior Direito',      order: 7, top: 43, left: 4,  w: 12, h: 16 },
  // 2º Molar Inferior Esq (7)
  { id: 'l_m2_esq', label: '2º Molar Inferior Esquerdo',     order: 7, top: 43, left: 78, w: 12, h: 16 },
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

  const openModal  = (t) => { setSelectedTooth(t); setEruptionDate(teethingData[t.id] || ''); };
  const closeModal = () => { setSelectedTooth(null); setEruptionDate(''); };

  const saveToothDate = (e) => {
    e.preventDefault();
    if (!eruptionDate) return;
    setTeethingData(prev => ({ ...prev, [selectedTooth.id]: eruptionDate }));
    closeModal();
  };

  const removeToothDate = () => {
    setTeethingData(prev => { const n = { ...prev }; delete n[selectedTooth.id]; return n; });
    closeModal();
  };

  const erupted = Object.keys(teethingData).length;

  return (
    <div className="teething-illustration-layout">

      <div className="teething-header">
        <h2 className="teething-title">Dentes de Leite</h2>
        <p className="teething-subtitle">
          {erupted} de 20 nascidos • Toque num dente para registar!
        </p>
      </div>

      {/* ── Image map ── */}
      <div className="teeth-image-map-container">
        <img
          src="/dentes-leite.png"
          alt="Mapa de Dentes de Leite"
          className="teeth-base-image"
          draggable={false}
        />

        {/* Clickable hotspots overlaid on image */}
        {TEETH.map(tooth => {
          const isErupted = !!teethingData[tooth.id];
          const color = ORDER_COLORS[tooth.order];
          return (
            <button
              key={tooth.id}
              className={`tooth-hotspot ${isErupted ? 'tooth-erupted' : ''}`}
              style={{
                top: `${tooth.top}%`,
                left: `${tooth.left}%`,
                width: `${tooth.w}%`,
                height: `${tooth.h}%`,
                borderColor: color,
                backgroundColor: isErupted ? `${color}55` : 'transparent',
              }}
              onClick={() => openModal(tooth)}
              title={tooth.label}
            >
              {isErupted && (
                <span className="tooth-check">✓</span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Legend ── */}
      <div className="teething-legend teething-legend-horizontal">
        <h3 className="legend-title">QUANDO NASCEM?</h3>
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

      {/* ── Modal ── */}
      {selectedTooth && (
        <div className="tooth-modal-overlay" onClick={closeModal}>
          <div className="tooth-modal" onClick={e => e.stopPropagation()}>
            <div className="flex-between mb-4">
              <h3 className="h3">Registar Dente</h3>
              <button className="btn-icon" onClick={closeModal}><X size={24} /></button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '50%',
                background: ORDER_COLORS[selectedTooth.order],
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <span style={{ color: 'white', fontWeight: 800, fontSize: '1.3rem' }}>{selectedTooth.order}</span>
              </div>
              <div>
                <p style={{ fontWeight: 700, margin: 0 }}>{selectedTooth.label}</p>
                <p style={{ fontSize: '0.8rem', color: ORDER_COLORS[selectedTooth.order], margin: '2px 0 0' }}>
                  {LEGEND.find(l => l.num === selectedTooth.order)?.label}
                </p>
              </div>
            </div>
            {teethingData[selectedTooth.id] && (
              <div style={{ background: '#f0fdf4', borderRadius: 10, padding: '0.6rem 1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle size={16} color="#4CAF50" />
                <span style={{ fontSize: '0.85rem', color: '#2e7d32', fontWeight: 600 }}>
                  Nasceu a {new Date(teethingData[selectedTooth.id]).toLocaleDateString('pt-PT')}
                </span>
              </div>
            )}
            <form onSubmit={saveToothDate}>
              <div className="input-group">
                <label className="input-label">
                  <CalendarIcon size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
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
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Guardar</button>
                {teethingData[selectedTooth.id] && (
                  <button type="button" className="btn-outline" onClick={removeToothDate} style={{ color: '#ef4444' }}>
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
