import { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import './TeethMap.css';

// ─── Tooth SVG shapes ────────────────────────────────────────────────────────
// Each shape is an SVG rendered at the tooth's position, rotated to face outward

const ToothSVG = ({ type, size = 20 }) => {
  const w = size;
  const h = size * 1.3;

  // Incisor: flat rectangular with rounded top
  if (type === 'incisor') return (
    <svg width={w} height={h} viewBox="0 0 20 26" fill="none">
      <defs>
        <linearGradient id="tg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fff" />
          <stop offset="100%" stopColor="#e8e8e8" />
        </linearGradient>
        <filter id="ts"><feDropShadow dx="0" dy="1" stdDeviation="1" floodOpacity="0.3"/></filter>
      </defs>
      <rect x="2" y="4" width="16" height="20" rx="4" ry="5" fill="url(#tg)" stroke="#ccc" strokeWidth="1" filter="url(#ts)" />
      <rect x="5" y="7" width="4" height="10" rx="2" fill="rgba(255,255,255,0.6)" />
    </svg>
  );

  // Canine: pointed / fang shape
  if (type === 'canine') return (
    <svg width={w} height={h} viewBox="0 0 20 26" fill="none">
      <defs>
        <linearGradient id="cg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fff" />
          <stop offset="100%" stopColor="#ddd" />
        </linearGradient>
        <filter id="cs"><feDropShadow dx="0" dy="1" stdDeviation="1" floodOpacity="0.3"/></filter>
      </defs>
      <path d="M3 4 Q3 4 10 24 Q17 4 17 4 Q10 0 3 4Z" fill="url(#cg)" stroke="#ccc" strokeWidth="1" filter="url(#cs)" />
      <path d="M7 6 Q5 10 10 20" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  );

  // Molar: wide with cusps
  if (type === 'molar') return (
    <svg width={w * 1.3} height={h * 0.9} viewBox="0 0 26 22" fill="none">
      <defs>
        <linearGradient id="mg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fff" />
          <stop offset="100%" stopColor="#ddd" />
        </linearGradient>
        <filter id="ms"><feDropShadow dx="0" dy="1" stdDeviation="1" floodOpacity="0.3"/></filter>
      </defs>
      {/* Main body */}
      <rect x="1" y="6" width="24" height="15" rx="4" fill="url(#mg)" stroke="#ccc" strokeWidth="1" filter="url(#ms)" />
      {/* Cusps */}
      <ellipse cx="6" cy="6" rx="4" ry="4" fill="url(#mg)" stroke="#ccc" strokeWidth="1" />
      <ellipse cx="13" cy="5" rx="4" ry="4" fill="url(#mg)" stroke="#ccc" strokeWidth="1" />
      <ellipse cx="20" cy="6" rx="4" ry="4" fill="url(#mg)" stroke="#ccc" strokeWidth="1" />
      {/* Fissure lines */}
      <line x1="13" y1="10" x2="13" y2="20" stroke="rgba(150,150,150,0.4)" strokeWidth="1" />
      <line x1="6" y1="13" x2="20" y2="13" stroke="rgba(150,150,150,0.4)" strokeWidth="1" />
    </svg>
  );

  return null;
};

// ─── Tooth definitions: position (% of container), type, label, rotation ─────
// Positioned to sit ON the gum ridges of the new image
// Upper arch: top ~10-30%, Lower arch: top ~62-85%
// rotation: angle to face outward from center of arch

const TEETH = [
  // Upper arch (left to right from patient's right)
  { id: 't1',  type: 'molar',   label: '2º Molar Sup. Dir.',    top: 22, left: 14, rot: 150 },
  { id: 't2',  type: 'molar',   label: '1º Molar Sup. Dir.',    top: 14, left: 22, rot: 135 },
  { id: 't3',  type: 'canine',  label: 'Canino Sup. Dir.',      top: 10, left: 31, rot: 110 },
  { id: 't4',  type: 'incisor', label: 'Incisivo Lat. Sup. Dir.',top: 8, left: 40, rot: 90  },
  { id: 't5',  type: 'incisor', label: 'Incisivo Cent. Sup. Dir.',top:7, left: 48, rot: 90  },
  { id: 't6',  type: 'incisor', label: 'Incisivo Cent. Sup. Esq.',top:7, left: 56, rot: 90  },
  { id: 't7',  type: 'incisor', label: 'Incisivo Lat. Sup. Esq.',top: 8, left: 64, rot: 90  },
  { id: 't8',  type: 'canine',  label: 'Canino Sup. Esq.',      top: 10, left: 73, rot: 70  },
  { id: 't9',  type: 'molar',   label: '1º Molar Sup. Esq.',    top: 14, left: 80, rot: 45  },
  { id: 't10', type: 'molar',   label: '2º Molar Sup. Esq.',    top: 22, left: 86, rot: 30  },
  // Lower arch (right to left from patient's right)
  { id: 'b1',  type: 'molar',   label: '2º Molar Inf. Dir.',    top: 75, left: 13, rot: 210 },
  { id: 'b2',  type: 'molar',   label: '1º Molar Inf. Dir.',    top: 82, left: 21, rot: 225 },
  { id: 'b3',  type: 'canine',  label: 'Canino Inf. Dir.',      top: 87, left: 30, rot: 250 },
  { id: 'b4',  type: 'incisor', label: 'Incisivo Lat. Inf. Dir.',top: 89,left: 40, rot: 270 },
  { id: 'b5',  type: 'incisor', label: 'Incisivo Cent. Inf. Dir.',top:90,left: 48, rot: 270 },
  { id: 'b6',  type: 'incisor', label: 'Incisivo Cent. Inf. Esq.',top:90,left: 56, rot: 270 },
  { id: 'b7',  type: 'incisor', label: 'Incisivo Lat. Inf. Esq.',top: 89,left: 64, rot: 270 },
  { id: 'b8',  type: 'canine',  label: 'Canino Inf. Esq.',      top: 87, left: 73, rot: 290 },
  { id: 'b9',  type: 'molar',   label: '1º Molar Inf. Esq.',    top: 82, left: 80, rot: 315 },
  { id: 'b10', type: 'molar',   label: '2º Molar Inf. Esq.',    top: 75, left: 86, rot: 330 },
];

const TeethMap = () => {
  const [teethingData, setTeethingData] = useState(() => {
    const saved = localStorage.getItem('sofia_denticao');
    return saved ? JSON.parse(saved) : {};
  });

  const [selectedTooth, setSelectedTooth] = useState(null);
  const [eruptionDate, setEruptionDate] = useState('');
  const [tooltip, setTooltip] = useState(null);

  useEffect(() => {
    localStorage.setItem('sofia_denticao', JSON.stringify(teethingData));
  }, [teethingData]);

  const openModal = (tooth) => { setSelectedTooth(tooth); setEruptionDate(teethingData[tooth.id] || ''); };
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
    <div className="teeth-map-container">
      {/* Stats */}
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '1.25rem' }}>
        <div style={{ textAlign: 'center', background: 'rgba(244,63,94,0.08)', padding: '0.5rem 1.25rem', borderRadius: '2rem' }}>
          <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-primary)' }}>{erupted}</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', marginLeft: '6px' }}>dente{erupted !== 1 ? 's' : ''} nascido{erupted !== 1 ? 's' : ''}</span>
        </div>
        <div style={{ textAlign: 'center', background: 'rgba(100,116,139,0.08)', padding: '0.5rem 1.25rem', borderRadius: '2rem' }}>
          <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-text-light)' }}>{20 - erupted}</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', marginLeft: '6px' }}>por nascer</span>
        </div>
      </div>

      <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--color-text-light)', marginBottom: '1rem' }}>
        Toque num dente para registar a data de erupção
      </p>

      {/* Mouth wrapper */}
      <div className="realistic-mouth-wrapper">
        {/* Gum image background */}
        <img
          src="/realistic_gums.png"
          alt="Gengivas bebé"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', borderRadius: '24px' }}
          draggable={false}
        />

        {/* Tooth overlays */}
        {TEETH.map(tooth => {
          const isErupted = !!teethingData[tooth.id];
          const size = tooth.type === 'molar' ? 18 : tooth.type === 'canine' ? 15 : 14;

          return (
            <div
              key={tooth.id}
              onClick={() => openModal(tooth)}
              onMouseEnter={() => setTooltip(tooth.id)}
              onMouseLeave={() => setTooltip(null)}
              style={{
                position: 'absolute',
                top: `${tooth.top}%`,
                left: `${tooth.left}%`,
                transform: `translate(-50%, -50%) rotate(${tooth.rot}deg)`,
                cursor: 'pointer',
                opacity: isErupted ? 1 : 0.15,
                transition: 'opacity 0.3s ease, transform 0.3s ease',
                filter: isErupted
                  ? 'drop-shadow(0 0 6px rgba(255,255,255,0.9)) drop-shadow(0 2px 6px rgba(0,0,0,0.3))'
                  : 'brightness(0) invert(1)',
                zIndex: isErupted ? 10 : 5,
              }}
              title={tooth.label}
            >
              <ToothSVG type={tooth.type} size={size} />
            </div>
          );
        })}

        {/* Ghost spots for un-erupted teeth (clickable hitbox) */}
        {TEETH.map(tooth => {
          const isErupted = !!teethingData[tooth.id];
          if (isErupted) return null;
          return (
            <div
              key={`hit-${tooth.id}`}
              onClick={() => openModal(tooth)}
              style={{
                position: 'absolute',
                top: `${tooth.top}%`,
                left: `${tooth.left}%`,
                transform: 'translate(-50%, -50%)',
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                border: '1.5px dashed rgba(255,255,255,0.5)',
                cursor: 'pointer',
                zIndex: 6,
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; setTooltip(tooth.id); }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; setTooltip(null); }}
              title={tooth.label}
            />
          );
        })}

        {/* Tooltip */}
        {tooltip && (() => {
          const t = TEETH.find(x => x.id === tooltip);
          const dateStr = teethingData[tooltip] ? format(new Date(teethingData[tooltip]), 'dd MMM yyyy', { locale: ptBR }) : null;
          return (
            <div style={{
              position: 'absolute',
              top: `${t.top}%`,
              left: `${t.left}%`,
              transform: 'translate(-50%, -130%)',
              background: 'rgba(0,0,0,0.8)',
              color: '#fff',
              fontSize: '0.7rem',
              fontWeight: 600,
              padding: '4px 10px',
              borderRadius: '8px',
              whiteSpace: 'nowrap',
              zIndex: 20,
              pointerEvents: 'none',
            }}>
              {t.label}{dateStr ? ` · ${dateStr}` : ''}
            </div>
          );
        })()}
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
              <div style={{ padding: '8px', background: 'rgba(244,63,94,0.08)', borderRadius: '12px' }}>
                <ToothSVG type={selectedTooth.type} size={28} />
              </div>
              <div>
                <p style={{ fontWeight: 700, margin: 0 }}>{selectedTooth.label}</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', margin: 0, textTransform: 'capitalize' }}>{selectedTooth.type}</p>
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
