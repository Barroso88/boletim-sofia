import { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, Trash2, Sparkles, CheckCircle, Clock } from 'lucide-react';
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
const TEETH = [
  // ── Upper arch — Right side
  { id: 'u_m2_r', label: '2º Molar Sup. Direito',         order: 7, cx: 38,  cy: 155, rx: 16, ry: 14, rot: -55 },
  { id: 'u_m1_r', label: '1º Molar Sup. Direito',         order: 5, cx: 42,  cy: 112, rx: 14, ry: 13, rot: -42 },
  { id: 'u_c_r',  label: 'Canino Sup. Direito',            order: 6, cx: 62,  cy: 74,  rx: 10, ry: 15, rot: -28 },
  { id: 'u_il_r', label: 'Incisivo Lateral Sup. Direito',  order: 3, cx: 97,  cy: 46,  rx: 11, ry: 14, rot: -12 },
  { id: 'u_ic_r', label: 'Incisivo Central Sup. Direito',  order: 2, cx: 132, cy: 32,  rx: 13, ry: 17, rot: -2  },
  // ── Upper arch — Left side
  { id: 'u_ic_l', label: 'Incisivo Central Sup. Esquerdo', order: 2, cx: 168, cy: 32,  rx: 13, ry: 17, rot: 2   },
  { id: 'u_il_l', label: 'Incisivo Lateral Sup. Esquerdo', order: 3, cx: 203, cy: 46,  rx: 11, ry: 14, rot: 12  },
  { id: 'u_c_l',  label: 'Canino Sup. Esquerdo',           order: 6, cx: 238, cy: 74,  rx: 10, ry: 15, rot: 28  },
  { id: 'u_m1_l', label: '1º Molar Sup. Esquerdo',         order: 5, cx: 258, cy: 112, rx: 14, ry: 13, rot: 42  },
  { id: 'u_m2_l', label: '2º Molar Sup. Esquerdo',         order: 7, cx: 262, cy: 155, rx: 16, ry: 14, rot: 55  },
  // ── Lower arch — Right side
  { id: 'l_m2_r', label: '2º Molar Inf. Direito',          order: 7, cx: 42,  cy: 270, rx: 16, ry: 14, rot: 55  },
  { id: 'l_m1_r', label: '1º Molar Inf. Direito',          order: 5, cx: 48,  cy: 310, rx: 14, ry: 13, rot: 42  },
  { id: 'l_c_r',  label: 'Canino Inf. Direito',             order: 6, cx: 68,  cy: 348, rx: 10, ry: 14, rot: 28  },
  { id: 'l_il_r', label: 'Incisivo Lateral Inf. Direito',   order: 4, cx: 102, cy: 374, rx: 10, ry: 13, rot: 12  },
  { id: 'l_ic_r', label: 'Incisivo Central Inf. Direito',   order: 1, cx: 135, cy: 388, rx: 11, ry: 14, rot: 2   },
  // ── Lower arch — Left side
  { id: 'l_ic_l', label: 'Incisivo Central Inf. Esquerdo',  order: 1, cx: 165, cy: 388, rx: 11, ry: 14, rot: -2  },
  { id: 'l_il_l', label: 'Incisivo Lateral Inf. Esquerdo',  order: 4, cx: 198, cy: 374, rx: 10, ry: 13, rot: -12 },
  { id: 'l_c_l',  label: 'Canino Inf. Esquerdo',            order: 6, cx: 232, cy: 348, rx: 10, ry: 14, rot: -28 },
  { id: 'l_m1_l', label: '1º Molar Inf. Esquerdo',          order: 5, cx: 252, cy: 310, rx: 14, ry: 13, rot: -42 },
  { id: 'l_m2_l', label: '2º Molar Inf. Esquerdo',          order: 7, cx: 258, cy: 270, rx: 16, ry: 14, rot: -55 },
];

/* ─── Date formatter ─────────────────────────────────────────────────────── */
const formatDate = (iso) => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};

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
      const next = { ...prev }; delete next[selectedTooth.id]; return next;
    });
    closeModal();
  };

  const eruptedCount = Object.keys(teethingData).length;

  // Registered teeth sorted by date
  const registeredList = TEETH
    .filter(t => teethingData[t.id])
    .sort((a, b) => teethingData[a.id].localeCompare(teethingData[b.id]));

  return (
    <div className="teething-layout">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="teething-header">
        <h2 className="teething-title">
          <Sparkles size={20} color="var(--color-primary)" />
          Dentição da Sofia
        </h2>
        <p className="teething-subtitle">
          <strong>{eruptedCount} de 20</strong> dentes nascidos — Toque num dente para registar
        </p>
        {/* Progress bar */}
        <div className="teeth-progress-bar">
          <div className="teeth-progress-fill" style={{ width: `${(eruptedCount / 20) * 100}%` }} />
        </div>
      </div>

      {/* ── SVG Dental Chart ───────────────────────────────────────────── */}
      <div className="teeth-svg-wrap">
        <svg viewBox="0 0 300 420" className="teeth-chart" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="gumGradU" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#c8888a" />
              <stop offset="100%" stopColor="#b87070" />
            </linearGradient>
            <linearGradient id="gumGradL" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#b87070" />
              <stop offset="100%" stopColor="#c8888a" />
            </linearGradient>
          </defs>

          {/* Upper jaw */}
          <path
            fillRule="evenodd"
            d="M 150,5 C 80,5 12,45 12,120 C 12,172 48,195 80,195 L 220,195 C 252,195 288,172 288,120 C 288,45 220,5 150,5 Z
               M 150,82 C 118,82 88,102 88,142 C 88,172 108,195 140,195 L 160,195 C 192,195 212,172 212,142 C 212,102 182,82 150,82 Z"
            fill="url(#gumGradU)"
          />

          {/* Lower jaw */}
          <path
            fillRule="evenodd"
            d="M 80,225 C 44,225 12,255 12,312 C 12,385 78,415 150,415 C 222,415 288,385 288,312 C 288,255 256,225 220,225 Z
               M 138,225 C 108,225 82,252 82,286 C 82,328 112,350 150,350 C 188,350 218,328 218,286 C 218,252 192,225 162,225 Z"
            fill="url(#gumGradL)"
          />

          {/* Divider label */}
          <text x="150" y="213" textAnchor="middle" className="svg-label-text">
            ORDEM DE ERUPÇÃO
          </text>

          {/* ── Render each tooth (ellipse + order number) ─────────────── */}
          {TEETH.map(tooth => {
            const erupted = !!teethingData[tooth.id];
            const color = ORDER_COLORS[tooth.order];
            return (
              <g
                key={tooth.id}
                className={`tooth-group${erupted ? ' erupted' : ''}`}
                onClick={() => openModal(tooth)}
                role="button"
                tabIndex={0}
                aria-label={tooth.label}
                onKeyDown={e => e.key === 'Enter' && openModal(tooth)}
                style={{ cursor: 'pointer' }}
              >
                {/* Tooth body */}
                <ellipse
                  className="tooth-el"
                  cx={tooth.cx}
                  cy={tooth.cy}
                  rx={tooth.rx}
                  ry={tooth.ry}
                  transform={`rotate(${tooth.rot} ${tooth.cx} ${tooth.cy})`}
                />
                {/* Order number — always visible */}
                <text
                  x={tooth.cx}
                  y={tooth.cy + 0.5}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="tooth-num"
                  style={{ fill: erupted ? color : 'rgba(255,255,255,0.55)' }}
                >
                  {tooth.order}
                </text>
              </g>
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

      {/* ── Registered teeth list ────────────────────────────────────────── */}
      {registeredList.length > 0 && (
        <div className="teeth-record-section">
          <h3 className="legend-title">Registo Individual de Erupção</h3>
          <div className="teeth-record-list">
            {registeredList.map((tooth, i) => (
              <button
                key={tooth.id}
                className="teeth-record-item"
                onClick={() => openModal(tooth)}
              >
                <div className="record-badge" style={{ backgroundColor: ORDER_COLORS[tooth.order] }}>
                  {tooth.order}
                </div>
                <div className="record-info">
                  <span className="record-label">{tooth.label}</span>
                  <span className="record-date">
                    <Clock size={11} />
                    {formatDate(teethingData[tooth.id])}
                  </span>
                </div>
                <CheckCircle size={16} color="#22c55e" style={{ marginLeft: 'auto', flexShrink: 0 }} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Modal ──────────────────────────────────────────────────────── */}
      {selectedTooth && (
        <div className="tooth-modal-overlay" onClick={closeModal}>
          <div className="tooth-modal animate-fade-in" onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="tooth-modal-header">
              <div className="tooth-modal-icon" style={{ backgroundColor: ORDER_COLORS[selectedTooth.order] }}>
                {selectedTooth.order}
              </div>
              <div className="tooth-modal-title-area">
                <h3 className="tooth-modal-title">{selectedTooth.label}</h3>
                <p className="tooth-modal-subtitle" style={{ color: ORDER_COLORS[selectedTooth.order] }}>
                  {LEGEND.find(l => l.num === selectedTooth.order)?.label}
                </p>
              </div>
              <button className="tooth-modal-close" onClick={closeModal}>
                <X size={18} />
              </button>
            </div>

            {/* Status pill */}
            {teethingData[selectedTooth.id] ? (
              <div className="tooth-status erupted-status">
                <CheckCircle size={16} />
                <span>Nascido a <strong>{formatDate(teethingData[selectedTooth.id])}</strong></span>
              </div>
            ) : (
              <div className="tooth-status pending-status">
                <Clock size={16} />
                <span>Ainda não registado</span>
              </div>
            )}

            {/* Date input */}
            <form onSubmit={saveToothDate} className="tooth-modal-form">
              <label className="tooth-modal-label">
                <CalendarIcon size={15} />
                Data de Erupção
              </label>
              <input
                type="date"
                className="tooth-modal-date-input"
                value={eruptionDate}
                onChange={e => setEruptionDate(e.target.value)}
                required
              />

              <div className="tooth-modal-actions">
                <button type="submit" className="btn-confirm">
                  {teethingData[selectedTooth.id] ? 'Atualizar' : 'Confirmar Erupção 🦷'}
                </button>
                {teethingData[selectedTooth.id] && (
                  <button type="button" className="btn-delete" onClick={removeToothDate} title="Remover registo">
                    <Trash2 size={16} />
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
