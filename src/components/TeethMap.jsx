import { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, Trash2 } from 'lucide-react';
import './TeethMap.css';

// ── Legend based on reference image ───────────────────────────────────────────
const LEGEND = [
  { num: 1, label: 'Entre os 6 e 8 meses',    desc: 'Dois incisivos inferiores centrais', color: '#4CAF50' },
  { num: 2, label: 'Por volta dos 8 meses',    desc: 'Dois incisivos superiores centrais', color: '#2196F3' },
  { num: 3, label: 'Entre os 8 e 12 meses',    desc: 'Dois incisivos superiores laterais', color: '#2196F3' },
  { num: 4, label: 'Entre os 10 e 12 meses',   desc: 'Dois incisivos inferiores laterais', color: '#4CAF50' },
  { num: 5, label: 'Entre os 14 e 20 meses',   desc: 'Quatro primeiros molares',           color: '#FF9800' },
  { num: 6, label: 'Entre os 18 e 24 meses',   desc: 'Quatro caninos',                     color: '#E91E63' },
  { num: 7, label: 'Entre os 2 e 3 anos',      desc: 'Quatro segundos molares',            color: '#FF9800' },
];

// Color per order number
const ORDER_COLORS = {
  1: '#4CAF50',
  2: '#2196F3',
  3: '#2196F3',
  4: '#4CAF50',
  5: '#FF9800',
  6: '#E91E63',
  7: '#FF9800',
};

// ── Teeth definition (20 total, circular layout) ───────────────────────────────
// Angles: 0° = right, going clockwise
// Upper teeth (top of circle): 210° → 330° (left to right from viewer)
// Lower teeth (bottom of circle): 30° → 150°

// SVG center and radius
const CX = 210, CY = 210, R_GUM = 190, R_TEETH = 155, R_BADGE = 120;

function pos(cx, cy, r, angleDeg) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

// Upper teeth: angles 210→330, 10 teeth evenly spaced
// Lower teeth: angles 30→150, 10 teeth evenly spaced
const UP_ANGLES   = [210, 222, 234, 246, 258, 282, 294, 306, 318, 330];
const LOW_ANGLES  = [30,   42,  54,  66,  78, 102, 114, 126, 138, 150];

const UPPER_TEETH = [
  { id: 'u0',  label: '2º Molar Sup. Dir.',       order: 7, shape: 'molar'   },
  { id: 'u1',  label: '1º Molar Sup. Dir.',        order: 5, shape: 'molar'   },
  { id: 'u2',  label: 'Canino Sup. Dir.',          order: 6, shape: 'canine'  },
  { id: 'u3',  label: 'Incisivo Lat. Sup. Dir.',   order: 3, shape: 'incisor' },
  { id: 'u4',  label: 'Incisivo Cent. Sup. Dir.',  order: 2, shape: 'incisor' },
  { id: 'u5',  label: 'Incisivo Cent. Sup. Esq.',  order: 2, shape: 'incisor' },
  { id: 'u6',  label: 'Incisivo Lat. Sup. Esq.',   order: 3, shape: 'incisor' },
  { id: 'u7',  label: 'Canino Sup. Esq.',          order: 6, shape: 'canine'  },
  { id: 'u8',  label: '1º Molar Sup. Esq.',        order: 5, shape: 'molar'   },
  { id: 'u9',  label: '2º Molar Sup. Esq.',        order: 7, shape: 'molar'   },
].map((t, i) => ({
  ...t,
  angle: UP_ANGLES[i],
  pos: pos(CX, CY, R_TEETH, UP_ANGLES[i]),
  badgePos: pos(CX, CY, R_BADGE, UP_ANGLES[i]),
  color: ORDER_COLORS[t.order],
}));

const LOWER_TEETH = [
  { id: 'l0',  label: '2º Molar Inf. Dir.',        order: 7, shape: 'molar'   },
  { id: 'l1',  label: '1º Molar Inf. Dir.',        order: 5, shape: 'molar'   },
  { id: 'l2',  label: 'Canino Inf. Dir.',          order: 6, shape: 'canine'  },
  { id: 'l3',  label: 'Incisivo Lat. Inf. Dir.',   order: 4, shape: 'incisor' },
  { id: 'l4',  label: 'Incisivo Cent. Inf. Dir.',  order: 1, shape: 'incisor' },
  { id: 'l5',  label: 'Incisivo Cent. Inf. Esq.',  order: 1, shape: 'incisor' },
  { id: 'l6',  label: 'Incisivo Lat. Inf. Esq.',   order: 4, shape: 'incisor' },
  { id: 'l7',  label: 'Canino Inf. Esq.',          order: 6, shape: 'canine'  },
  { id: 'l8',  label: '1º Molar Inf. Esq.',        order: 5, shape: 'molar'   },
  { id: 'l9',  label: '2º Molar Inf. Esq.',        order: 7, shape: 'molar'   },
].map((t, i) => ({
  ...t,
  angle: LOW_ANGLES[i],
  pos: pos(CX, CY, R_TEETH, LOW_ANGLES[i]),
  badgePos: pos(CX, CY, R_BADGE, LOW_ANGLES[i]),
  color: ORDER_COLORS[t.order],
}));

const ALL_TEETH = [...UPPER_TEETH, ...LOWER_TEETH];

// ── Tooth SVG shape ────────────────────────────────────────────────────────────
function ToothGroup({ tooth, erupted, onClick }) {
  const { pos: p, angle, color, shape } = tooth;
  // Rotate to point inward (toward center)
  const rotate = angle + 90;

  const sizes = { molar: 20, canine: 15, incisor: 12 };
  const hw = sizes[shape]; // half-width
  const hh = shape === 'molar' ? 14 : shape === 'canine' ? 18 : 15;

  const fillColor = erupted ? '#FFF9C4' : '#FFF5F0';
  const strokeColor = color;

  return (
    <g
      transform={`translate(${p.x},${p.y}) rotate(${rotate})`}
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    >
      {shape === 'molar' ? (
        <rect x={-hw} y={-hh} width={hw * 2} height={hh * 2} rx={8} ry={8}
          fill={fillColor} stroke={strokeColor} strokeWidth="2.5" />
      ) : shape === 'canine' ? (
        <ellipse cx={0} cy={0} rx={hw * 0.8} ry={hh}
          fill={fillColor} stroke={strokeColor} strokeWidth="2.5" />
      ) : (
        <rect x={-hw} y={-hh} width={hw * 2} height={hh * 2} rx={6} ry={6}
          fill={fillColor} stroke={strokeColor} strokeWidth="2.5" />
      )}
      {erupted && (
        <circle cx={0} cy={0} r={4} fill={strokeColor} opacity={0.5} />
      )}
    </g>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
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

  const openModal  = (t)  => { setSelectedTooth(t); setEruptionDate(teethingData[t.id] || ''); };
  const closeModal = ()   => { setSelectedTooth(null); setEruptionDate(''); };

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

  return (
    <div className="teething-illustration-layout">

      <div className="teething-header">
        <h2 className="teething-title">Dentes de Leite</h2>
        <p className="teething-subtitle">Toque num dente para registar a data!</p>
      </div>

      <div className="teething-main-content">

        {/* ── SVG Circular Map ── */}
        <div className="teething-svg-wrap">
          <svg viewBox="0 0 420 420" xmlns="http://www.w3.org/2000/svg" className="teething-svg">

            {/* Outer gum circle */}
            <circle cx={CX} cy={CY} r={R_GUM} fill="#e8a0a0" />
            {/* Inner mouth void */}
            <circle cx={CX} cy={CY} r={96} fill="#f5e6d3" />

            {/* Center text */}
            <text x={CX} y={CY - 8} textAnchor="middle" fontSize="22" fontWeight="800"
              fill="#E91E63" fontFamily="Outfit, sans-serif">Dentes</text>
            <text x={CX} y={CY + 16} textAnchor="middle" fontSize="16" fontWeight="600"
              fill="#E91E63" fontFamily="Outfit, sans-serif">de Leite</text>
            <text x={CX} y={CY + 38} textAnchor="middle" fontSize="11"
              fill="#c97474" fontFamily="Outfit, sans-serif">
              {20 - Object.keys(teethingData).length} por nascer
            </text>

            {/* All Teeth */}
            {ALL_TEETH.map(tooth => (
              <ToothGroup
                key={tooth.id}
                tooth={tooth}
                erupted={!!teethingData[tooth.id]}
                onClick={() => openModal(tooth)}
              />
            ))}

            {/* Order number badges */}
            {ALL_TEETH.map(tooth => (
              <g key={`badge-${tooth.id}`} style={{ pointerEvents: 'none' }}>
                <circle cx={tooth.badgePos.x} cy={tooth.badgePos.y} r={12}
                  fill={tooth.color} />
                <text
                  x={tooth.badgePos.x}
                  y={tooth.badgePos.y + 4}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="800"
                  fill="white"
                  fontFamily="Outfit, sans-serif"
                >
                  {tooth.order}
                </text>
              </g>
            ))}
          </svg>
        </div>

        {/* ── Legend ── */}
        <div className="teething-legend">
          <h3 className="legend-title">QUANDO NASCEM?</h3>
          <div className="legend-list">
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
                width: '44px', height: '44px', borderRadius: '50%',
                background: selectedTooth.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <span style={{ color: 'white', fontWeight: 800, fontSize: '1.2rem' }}>{selectedTooth.order}</span>
              </div>
              <div>
                <p style={{ fontWeight: 700, margin: 0 }}>{selectedTooth.label}</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', margin: 0 }}>
                  Ordem de nascimento: {selectedTooth.order}
                </p>
              </div>
            </div>
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
