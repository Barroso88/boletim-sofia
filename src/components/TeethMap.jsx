import { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import './TeethMap.css';

// ─── Simple Tooth SVGs to match the flat illustration style ───────────────

const ToothSVG = ({ type, hasCross }) => {
  if (type === 'incisor-front') return (
    <svg viewBox="0 0 40 45" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 2C30 2 38 10 38 25C38 35 32 43 20 43C8 43 2 35 2 25C2 10 10 2 20 2Z" fill="white" stroke="#e0e0e0" strokeWidth="2"/>
    </svg>
  );

  if (type === 'incisor-lat') return (
    <svg viewBox="0 0 35 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.5 2C26 2 33 8 33 22C33 32 28 38 17.5 38C7 38 2 32 2 22C2 8 9 2 17.5 2Z" fill="white" stroke="#e0e0e0" strokeWidth="2"/>
    </svg>
  );

  if (type === 'canine') return (
    <svg viewBox="0 0 35 45" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.5 2C28 2 33 15 33 25C33 35 25 43 17.5 43C10 43 2 35 2 25C2 15 7 2 17.5 2Z" fill="white" stroke="#e0e0e0" strokeWidth="2"/>
    </svg>
  );

  if (type === 'molar') return (
    <svg viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M25 2C38 2 48 10 48 25C48 40 38 48 25 48C12 48 2 40 2 25C2 10 12 2 25 2Z" fill="white" stroke="#e0e0e0" strokeWidth="2"/>
      {hasCross && (
        <path d="M15 15L35 35M35 15L15 35" stroke="#e0e0e0" strokeWidth="1.5" strokeLinecap="round"/>
      )}
    </svg>
  );

  return null;
};

// Data based on the reference image order
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

const TEETH = [
  // Upper
  { id: 't1',  type: 'molar',         label: '2º Molar Sup. Dir.',      order: 10, top: 70, left: 10, rot: -40, cross: true },
  { id: 't2',  type: 'molar',         label: '1º Molar Sup. Dir.',      order: 6,  top: 50, left: 14, rot: -20, cross: false },
  { id: 't3',  type: 'canine',        label: 'Canino Sup. Dir.',        order: 7,  top: 30, left: 24, rot: -10, cross: false },
  { id: 't4',  type: 'incisor-lat',   label: 'Incisivo Lat. Sup. Dir.', order: 3,  top: 15, left: 35, rot: -5,  cross: false },
  { id: 't5',  type: 'incisor-front', label: 'Incisivo Cent. Sup. Dir.',order: 2,  top: 10, left: 45, rot: 0,   cross: false },
  { id: 't6',  type: 'incisor-front', label: 'Incisivo Cent. Sup. Esq.',order: 2,  top: 10, left: 55, rot: 0,   cross: false },
  { id: 't7',  type: 'incisor-lat',   label: 'Incisivo Lat. Sup. Esq.', order: 3,  top: 15, left: 65, rot: 5,   cross: false },
  { id: 't8',  type: 'canine',        label: 'Canino Sup. Esq.',        order: 7,  top: 30, left: 76, rot: 10,  cross: false },
  { id: 't9',  type: 'molar',         label: '1º Molar Sup. Esq.',      order: 6,  top: 50, left: 86, rot: 20,  cross: false },
  { id: 't10', type: 'molar',         label: '2º Molar Sup. Esq.',      order: 10, top: 70, left: 90, rot: 40,  cross: true },
  
  // Lower
  { id: 'b1',  type: 'molar',         label: '2º Molar Inf. Dir.',      order: 9,  top: 30, left: 10, rot: -140, cross: true },
  { id: 'b2',  type: 'molar',         label: '1º Molar Inf. Dir.',      order: 5,  top: 50, left: 14, rot: -160, cross: true },
  { id: 'b3',  type: 'canine',        label: 'Canino Inf. Dir.',        order: 8,  top: 70, left: 24, rot: -170, cross: false },
  { id: 'b4',  type: 'incisor-lat',   label: 'Incisivo Lat. Inf. Dir.', order: 4,  top: 85, left: 35, rot: -175, cross: false },
  { id: 'b5',  type: 'incisor-front', label: 'Incisivo Cent. Inf. Dir.',order: 1,  top: 90, left: 45, rot: 180,  cross: false },
  { id: 'b6',  type: 'incisor-front', label: 'Incisivo Cent. Inf. Esq.',order: 1,  top: 90, left: 55, rot: 180,  cross: false },
  { id: 'b7',  type: 'incisor-lat',   label: 'Incisivo Lat. Inf. Esq.', order: 4,  top: 85, left: 65, rot: 175,  cross: false },
  { id: 'b8',  type: 'canine',        label: 'Canino Inf. Esq.',        order: 8,  top: 70, left: 76, rot: 170,  cross: false },
  { id: 'b9',  type: 'molar',         label: '1º Molar Inf. Esq.',      order: 5,  top: 50, left: 86, rot: 160,  cross: true },
  { id: 'b10', type: 'molar',         label: '2º Molar Inf. Esq.',      order: 9,  top: 30, left: 90, rot: 140,  cross: true },
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

  return (
    <div className="teething-illustration-layout">
      
      {/* Title Area */}
      <div className="teething-header">
        <h2 className="teething-title">ORDEM DE NASCIMENTO</h2>
        <p className="teething-subtitle">Toque num dente para registar!</p>
      </div>

      <div className="teething-main-content">
        
        {/* Mouth Graphic */}
        <div className="teething-mouth-graphic">
          
          {/* Upper Gum */}
          <div className="gum-arch upper-gum">
             {TEETH.slice(0, 10).map(tooth => {
               const isErupted = !!teethingData[tooth.id];
               return (
                 <div key={tooth.id} className="tooth-container" style={{ top: `${tooth.top}%`, left: `${tooth.left}%` }}>
                   <div className="tooth-order-number upper-number">{tooth.order}</div>
                   <div 
                      className={`tooth-svg-wrapper ${isErupted ? 'erupted' : 'unerupted'}`}
                      style={{ transform: `translate(-50%, -50%) rotate(${tooth.rot}deg)` }}
                      onClick={() => openModal(tooth)}
                   >
                     <ToothSVG type={tooth.type} hasCross={tooth.cross} />
                   </div>
                 </div>
               )
             })}
          </div>

          <div className="gum-divider">ORDEM DE SAÍDA</div>

          {/* Lower Gum */}
          <div className="gum-arch lower-gum">
             {TEETH.slice(10, 20).map(tooth => {
               const isErupted = !!teethingData[tooth.id];
               return (
                 <div key={tooth.id} className="tooth-container" style={{ top: `${tooth.top}%`, left: `${tooth.left}%` }}>
                   <div className="tooth-order-number lower-number">{tooth.order}</div>
                   <div 
                      className={`tooth-svg-wrapper ${isErupted ? 'erupted' : 'unerupted'}`}
                      style={{ transform: `translate(-50%, -50%) rotate(${tooth.rot}deg)` }}
                      onClick={() => openModal(tooth)}
                   >
                     <ToothSVG type={tooth.type} hasCross={tooth.cross} />
                   </div>
                 </div>
               )
             })}
          </div>

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
              <div style={{ width: '40px' }}>
                <ToothSVG type={selectedTooth.type} hasCross={selectedTooth.cross} />
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
