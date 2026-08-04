import { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, Trash2 } from 'lucide-react';
import './TeethMap.css';

const LEGEND = [
  { num: 1, months: '6-10 meses' },
  { num: 2, months: '7-12 meses' },
  { num: 3, months: '9-13 meses' },
  { num: 4, months: '7-16 meses' },
  { num: 5, months: '13-19 meses' },
  { num: 6, months: '12-18 meses' },
  { num: 7, months: '16-22 meses' },
  { num: 8, months: '16-23 meses' },
  { num: 9, months: '20-31 meses' },
  { num: 10, months: '25-33 meses' },
];

// SVG canvas: 400 x 420
// Upper arch center: (200, 210), radius 155
// Lower arch center: (200, 210), radius 155
// Teeth are placed along an ellipse arc

// Upper teeth: angles from 200° to 340° (left to right from viewer's perspective)
// Lower teeth: angles from 20° to 160°

function toothPosition(cx, cy, rx, ry, angleDeg) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: cx + rx * Math.cos(rad),
    y: cy + ry * Math.sin(rad),
  };
}

// Upper arch: 10 teeth, spread from 215° to 325°
const upperAngles = [215, 228, 242, 257, 271, 289, 303, 318, 332, 345];
// Lower arch: 10 teeth, spread from 35° to 145°
const lowerAngles = [35, 48, 57, 71, 89, 107, 121, 135, 148, 161];

const CX = 200, CY_UP = 185, CY_LOW = 235;
const RX = 155, RY = 110;
// Number badge offset inward from the tooth (toward center)
const NUM_RX = 125, NUM_RY = 82;

const UPPER_TEETH = [
  { id: 't1',  label: '2º Molar Sup. Dir.',       order: 10, size: 'molar',   cross: true  },
  { id: 't2',  label: '1º Molar Sup. Dir.',        order: 6,  size: 'molar',   cross: false },
  { id: 't3',  label: 'Canino Sup. Dir.',          order: 7,  size: 'canine',  cross: false },
  { id: 't4',  label: 'Incisivo Lat. Sup. Dir.',   order: 3,  size: 'incisor', cross: false },
  { id: 't5',  label: 'Incisivo Cent. Sup. Dir.',  order: 2,  size: 'incisor', cross: false },
  { id: 't6',  label: 'Incisivo Cent. Sup. Esq.',  order: 2,  size: 'incisor', cross: false },
  { id: 't7',  label: 'Incisivo Lat. Sup. Esq.',   order: 3,  size: 'incisor', cross: false },
  { id: 't8',  label: 'Canino Sup. Esq.',          order: 7,  size: 'canine',  cross: false },
  { id: 't9',  label: '1º Molar Sup. Esq.',        order: 6,  size: 'molar',   cross: false },
  { id: 't10', label: '2º Molar Sup. Esq.',        order: 10, size: 'molar',   cross: true  },
].map((t, i) => ({
  ...t,
  ...toothPosition(CX, CY_UP, RX, RY, upperAngles[i]),
  angle: upperAngles[i],
  numPos: toothPosition(CX, CY_UP, NUM_RX, NUM_RY, upperAngles[i]),
}));

const LOWER_TEETH = [
  { id: 'b1',  label: '2º Molar Inf. Dir.',        order: 9,  size: 'molar',   cross: true  },
  { id: 'b2',  label: '1º Molar Inf. Dir.',        order: 5,  size: 'molar',   cross: true  },
  { id: 'b3',  label: 'Canino Inf. Dir.',          order: 8,  size: 'canine',  cross: false },
  { id: 'b4',  label: 'Incisivo Lat. Inf. Dir.',   order: 4,  size: 'incisor', cross: false },
  { id: 'b5',  label: 'Incisivo Cent. Inf. Dir.',  order: 1,  size: 'incisor', cross: false },
  { id: 'b6',  label: 'Incisivo Cent. Inf. Esq.',  order: 1,  size: 'incisor', cross: false },
  { id: 'b7',  label: 'Incisivo Lat. Inf. Esq.',   order: 4,  size: 'incisor', cross: false },
  { id: 'b8',  label: 'Canino Inf. Esq.',          order: 8,  size: 'canine',  cross: false },
  { id: 'b9',  label: '1º Molar Inf. Esq.',        order: 5,  size: 'molar',   cross: true  },
  { id: 'b10', label: '2º Molar Inf. Esq.',        order: 9,  size: 'molar',   cross: true  },
].map((t, i) => ({
  ...t,
  ...toothPosition(CX, CY_LOW, RX, RY, lowerAngles[i]),
  angle: lowerAngles[i],
  numPos: toothPosition(CX, CY_LOW, NUM_RX, NUM_RY, lowerAngles[i]),
}));

function ToothShape({ size, cross, erupted, onClick, cx, cy, angle }) {
  const toothAngle = angle + 90; // teeth point inward
  const sizes = { molar: 22, canine: 16, incisor: 13 };
  const r = sizes[size] || 14;

  const fill = erupted ? '#fff9c4' : 'white';
  const stroke = erupted ? '#f9a825' : '#ccc';

  return (
    <g
      transform={`translate(${cx},${cy}) rotate(${toothAngle})`}
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    >
      {size === 'molar' ? (
        <rect x={-r} y={-r * 0.65} width={r * 2} height={r * 1.3} rx={r * 0.5} fill={fill} stroke={stroke} strokeWidth="1.5" />
      ) : size === 'canine' ? (
        <ellipse cx={0} cy={0} rx={r * 0.7} ry={r} fill={fill} stroke={stroke} strokeWidth="1.5" />
      ) : (
        <rect x={-r * 0.75} y={-r * 0.6} width={r * 1.5} height={r * 1.2} rx={r * 0.4} fill={fill} stroke={stroke} strokeWidth="1.5" />
      )}
      {cross && (
        <>
          <line x1={-r * 0.5} y1={-r * 0.4} x2={r * 0.5} y2={r * 0.4} stroke={stroke} strokeWidth="1" />
          <line x1={r * 0.5} y1={-r * 0.4} x2={-r * 0.5} y2={r * 0.4} stroke={stroke} strokeWidth="1" />
        </>
      )}
      {erupted && (
        <circle cx={0} cy={0} r={r * 0.25} fill="#f9a825" opacity="0.6" />
      )}
    </g>
  );
}

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

  const openModal = (tooth) => {
    setSelectedTooth(tooth);
    setEruptionDate(teethingData[tooth.id] || '');
  };
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

  const allTeeth = [...UPPER_TEETH, ...LOWER_TEETH];

  return (
    <div className="teething-illustration-layout">

      <div className="teething-header">
        <h2 className="teething-title">ORDEM DE NASCIMENTO</h2>
        <p className="teething-subtitle">Toque num dente para registar!</p>
      </div>

      <div className="teething-main-content">

        {/* SVG Mouth Map */}
        <div className="teething-svg-wrap">
          <svg viewBox="0 0 400 420" xmlns="http://www.w3.org/2000/svg" className="teething-svg">

            {/* Upper gum arch */}
            <ellipse cx={CX} cy={CY_UP} rx={RX + 28} ry={RY + 28} fill="#d68787" opacity="0.9" />
            <ellipse cx={CX} cy={CY_UP} rx={RX - 30} ry={RY - 35} fill="#c97474" />

            {/* Lower gum arch */}
            <ellipse cx={CX} cy={CY_LOW} rx={RX + 28} ry={RY + 28} fill="#d68787" opacity="0.9" />
            <ellipse cx={CX} cy={CY_LOW} rx={RX - 30} ry={RY - 35} fill="#c97474" />

            {/* Center divider label */}
            <text x={CX} y={212} textAnchor="middle" fontSize="11" fontWeight="700" fill="#d68787" letterSpacing="2">DENTINHOS DA SOFIA</text>

            {/* Upper Teeth */}
            {UPPER_TEETH.map(tooth => (
              <ToothShape
                key={tooth.id}
                size={tooth.size}
                cross={tooth.cross}
                erupted={!!teethingData[tooth.id]}
                onClick={() => openModal(tooth)}
                cx={tooth.x}
                cy={tooth.y}
                angle={tooth.angle}
              />
            ))}

            {/* Lower Teeth */}
            {LOWER_TEETH.map(tooth => (
              <ToothShape
                key={tooth.id}
                size={tooth.size}
                cross={tooth.cross}
                erupted={!!teethingData[tooth.id]}
                onClick={() => openModal(tooth)}
                cx={tooth.x}
                cy={tooth.y}
                angle={tooth.angle}
              />
            ))}

            {/* Upper number badges */}
            {UPPER_TEETH.map(tooth => (
              <g key={`num-${tooth.id}`} style={{ pointerEvents: 'none' }}>
                <circle cx={tooth.numPos.x} cy={tooth.numPos.y} r={11} fill="#3b7d6a" />
                <text
                  x={tooth.numPos.x}
                  y={tooth.numPos.y + 4}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="800"
                  fill="white"
                >
                  {tooth.order}
                </text>
              </g>
            ))}

            {/* Lower number badges */}
            {LOWER_TEETH.map(tooth => (
              <g key={`num-${tooth.id}`} style={{ pointerEvents: 'none' }}>
                <circle cx={tooth.numPos.x} cy={tooth.numPos.y} r={11} fill="#3b7d6a" />
                <text
                  x={tooth.numPos.x}
                  y={tooth.numPos.y + 4}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="800"
                  fill="white"
                >
                  {tooth.order}
                </text>
              </g>
            ))}
          </svg>
        </div>

        {/* Legend */}
        <div className="teething-legend">
          <h3 className="legend-title">IDADE (MESES)</h3>
          <div className="legend-list">
            {LEGEND.map(item => (
              <div key={item.num} className="legend-item">
                <div className="legend-number">{item.num}</div>
                <div className="legend-text">{item.months}</div>
              </div>
            ))}
          </div>
        </div>

      </div>

      <div className="teething-footer">
        Faltam nascer {20 - Object.keys(teethingData).length} dentes!
      </div>

      {/* Modal */}
      {selectedTooth && (
        <div className="tooth-modal-overlay" onClick={closeModal}>
          <div className="tooth-modal" onClick={e => e.stopPropagation()}>
            <div className="flex-between mb-4">
              <h3 className="h3">Registar Dente</h3>
              <button className="btn-icon" onClick={closeModal}><X size={24} /></button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#3b7d6a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: 'white', fontWeight: 800, fontSize: '1.1rem' }}>{selectedTooth.order}</span>
              </div>
              <div>
                <p style={{ fontWeight: 700, margin: 0 }}>{selectedTooth.label}</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', margin: 0 }}>Ordem típica: {selectedTooth.order}</p>
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
                  onChange={(e) => setEruptionDate(e.target.value)}
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
