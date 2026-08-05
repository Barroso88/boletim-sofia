import { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, Trash2, Sparkles, CheckCircle } from 'lucide-react';
import './TeethMap.css';

/* ─── Eruption order colors ──────────────────────────────────────────────── */
const ORDER_COLORS = {
  1: '#4CAF50', 2: '#E91E63', 3: '#2196F3', 4: '#D97706',
  5: '#EF4444', 6: '#9333EA', 7: '#F59E0B',
};

/* ─── Legend data ────────────────────────────────────────────────────────── */
const LEGEND = [
  { num: 1, label: 'Entre os 6 e 8 meses',   desc: 'Incisivos centrais inferiores', color: '#4CAF50' },
  { num: 2, label: 'Por volta dos 8 meses',   desc: 'Incisivos centrais superiores', color: '#E91E63' },
  { num: 3, label: 'Entre os 8 e 12 meses',   desc: 'Incisivos laterais superiores', color: '#2196F3' },
  { num: 4, label: 'Entre os 10 e 12 meses',  desc: 'Incisivos laterais inferiores', color: '#D97706' },
  { num: 5, label: 'Entre os 14 e 20 meses',  desc: 'Primeiros molares',             color: '#EF4444' },
  { num: 6, label: 'Entre os 18 e 24 meses',  desc: 'Caninos',                       color: '#9333EA' },
  { num: 7, label: 'Entre os 2 e 3 anos',     desc: 'Segundos molares',              color: '#F59E0B' },
];

/* ─── SVG Tooth definitions (viewBox 0 0 300 420) ────────────────────────── */
/* cx/cy = center, rx/ry = radii, rot = rotation (degrees) to follow the arch */
const TEETH = [
  // ── Upper arch — Right side (patient's right = image left)
  { id: 'u_m2_r', label: '2º Molar Sup. Direito',         order: 7, cx: 38, cy: 155, rx: 16, ry: 14, rot: -55 },
  { id: 'u_m1_r', label: '1º Molar Sup. Direito',         order: 5, cx: 42, cy: 112, rx: 14, ry: 13, rot: -42 },
  { id: 'u_c_r',  label: 'Canino Sup. Direito',            order: 6, cx: 62, cy: 74,  rx: 10, ry: 15, rot: -28 },
  { id: 'u_il_r', label: 'Incisivo Lateral Sup. Direito',  order: 3, cx: 97, cy: 46,  rx: 11, ry: 14, rot: -12 },
  { id: 'u_ic_r', label: 'Incisivo Central Sup. Direito',  order: 2, cx: 132, cy: 32, rx: 13, ry: 17, rot: -2 },
  // ── Upper arch — Left side
  { id: 'u_ic_l', label: 'Incisivo Central Sup. Esquerdo', order: 2, cx: 168, cy: 32, rx: 13, ry: 17, rot: 2 },
  { id: 'u_il_l', label: 'Incisivo Lateral Sup. Esquerdo', order: 3, cx: 203, cy: 46, rx: 11, ry: 14, rot: 12 },
  { id: 'u_c_l',  label: 'Canino Sup. Esquerdo',           order: 6, cx: 238, cy: 74, rx: 10, ry: 15, rot: 28 },
  { id: 'u_m1_l', label: '1º Molar Sup. Esquerdo',        order: 5, cx: 258, cy: 112, rx: 14, ry: 13, rot: 42 },
  { id: 'u_m2_l', label: '2º Molar Sup. Esquerdo',        order: 7, cx: 262, cy: 155, rx: 16, ry: 14, rot: 55 },

  // ── Lower arch — Right side
  { id: 'l_m2_r', label: '2º Molar Inf. Direito',         order: 7, cx: 42, cy: 270, rx: 16, ry: 14, rot: 55 },
  { id: 'l_m1_r', label: '1º Molar Inf. Direito',         order: 5, cx: 48, cy: 310, rx: 14, ry: 13, rot: 42 },
  { id: 'l_c_r',  label: 'Canino Inf. Direito',            order: 6, cx: 68, cy: 348, rx: 10, ry: 14, rot: 28 },
  { id: 'l_il_r', label: 'Incisivo Lateral Inf. Direito',  order: 4, cx: 102, cy: 374, rx: 10, ry: 13, rot: 12 },
  { id: 'l_ic_r', label: 'Incisivo Central Inf. Direito',  order: 1, cx: 135, cy: 388, rx: 11, ry: 14, rot: 2 },
  // ── Lower arch — Left side
  { id: 'l_ic_l', label: 'Incisivo Central Inf. Esquerdo', order: 1, cx: 165, cy: 388, rx: 11, ry: 14, rot: -2 },
  { id: 'l_il_l', label: 'Incisivo Lateral Inf. Esquerdo', order: 4, cx: 198, cy: 374, rx: 10, ry: 13, rot: -12 },
  { id: 'l_c_l',  label: 'Canino Inf. Esquerdo',           order: 6, cx: 232, cy: 348, rx: 10, ry: 14, rot: -28 },
  { id: 'l_m1_l', label: '1º Molar Inf. Esquerdo',        order: 5, cx: 252, cy: 310, rx: 14, ry: 13, rot: -42 },
  { id: 'l_m2_l', label: '2º Molar Inf. Esquerdo',        order: 7, cx: 258, cy: 270, rx: 16, ry: 14, rot: -55 },
];

/* ─── Component ──────────────────────────────────────────────────────────── */
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
    setEruptionDate(teethingData[t.id] || new Date().toISOString().split('T')[0]);
  };

  const closeModal = () => { setSelectedTooth(null); setEruptionDate(''); };

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
    <div className="teething-layout">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="teething-header">
        <h2 className="teething-title">
          <Sparkles size={22} color="var(--color-primary)" /> Dentição da Sofia 🦷
        </h2>
        <p className="teething-subtitle">
          <strong>{eruptedCount} de 20</strong> dentes nascidos — Toque num dente para registar
        </p>
      </div>

      {/* ── SVG Dental Chart ───────────────────────────────────────────── */}
      <div className="teeth-svg-wrap">
        <svg viewBox="0 0 300 420" className="teeth-chart" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="gumGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#D49A97" />
              <stop offset="100%" stopColor="#C07E7B" />
            </linearGradient>
            <filter id="toothGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="1" stdDeviation="2.5" floodColor="#fff" floodOpacity="0.45" />
            </filter>
          </defs>

          {/* Upper jaw — gum with palate cutout */}
          <path
            fillRule="evenodd"
            d={`
              M 150,5 C 80,5 12,45 12,120 C 12,172 48,195 80,195 L 220,195 C 252,195 288,172 288,120 C 288,45 220,5 150,5 Z
              M 150,82 C 118,82 88,102 88,142 C 88,172 108,195 140,195 L 160,195 C 192,195 212,172 212,142 C 212,102 182,82 150,82 Z
            `}
            fill="url(#gumGrad)"
          />

          {/* Lower jaw — gum with tongue cutout */}
          <path
            fillRule="evenodd"
            d={`
              M 80,225 C 44,225 12,255 12,312 C 12,385 78,415 150,415 C 222,415 288,385 288,312 C 288,255 256,225 220,225 Z
              M 138,225 C 108,225 82,252 82,286 C 82,328 112,350 150,350 C 188,350 218,328 218,286 C 218,252 192,225 162,225 Z
            `}
            fill="url(#gumGrad)"
          />

          {/* Label between arches */}
          <text x="150" y="213" textAnchor="middle" className="svg-label-text">
            ORDEM DE ERUPÇÃO
          </text>

          {/* ── Teeth ──────────────────────────────────────────────────── */}
          {TEETH.map(tooth => {
            const erupted = !!teethingData[tooth.id];
            return (
              <ellipse
                key={tooth.id}
                className={`tooth-el${erupted ? ' erupted' : ''}`}
                cx={tooth.cx}
                cy={tooth.cy}
                rx={tooth.rx}
                ry={tooth.ry}
                transform={`rotate(${tooth.rot} ${tooth.cx} ${tooth.cy})`}
                onClick={() => openModal(tooth)}
                role="button"
                tabIndex={0}
                aria-label={tooth.label}
                onKeyDown={e => e.key === 'Enter' && openModal(tooth)}
              />
            );
          })}
        </svg>
      </div>

      {/* ── Legend ──────────────────────────────────────────────────────── */}
      <div className="teething-legend">
        <h3 className="legend-title">Ordem de Erupção dos Dentes</h3>
        <div className="legend-grid">
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

      {/* ── Modal ──────────────────────────────────────────────────────── */}
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
              <div className="tooth-modal-order-badge" style={{ backgroundColor: ORDER_COLORS[selectedTooth.order] }}>
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
                <span>Este dente já está registado ✨</span>
              </div>
            )}

            <form onSubmit={saveToothDate}>
              <div className="input-group mb-4">
                <label className="input-label" style={{ fontWeight: 700 }}>
                  <CalendarIcon size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
                  Data em que nasceu
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
                  {teethingData[selectedTooth.id] ? 'Atualizar Data' : 'Confirmar 🦷'}
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
