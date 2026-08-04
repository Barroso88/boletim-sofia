import { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import './TeethMap.css';

// 20 Primary Teeth layout
const TEETH_DATA = [
  // Top Arch
  { id: 't1', label: '2º Molar Superior Dir.', pos: 'pos-t1' },
  { id: 't2', label: '1º Molar Superior Dir.', pos: 'pos-t2' },
  { id: 't3', label: 'Canino Superior Dir.', pos: 'pos-t3' },
  { id: 't4', label: 'Incisivo Lat. Superior Dir.', pos: 'pos-t4' },
  { id: 't5', label: 'Incisivo Cent. Superior Dir.', pos: 'pos-t5' },
  { id: 't6', label: 'Incisivo Cent. Superior Esq.', pos: 'pos-t6' },
  { id: 't7', label: 'Incisivo Lat. Superior Esq.', pos: 'pos-t7' },
  { id: 't8', label: 'Canino Superior Esq.', pos: 'pos-t8' },
  { id: 't9', label: '1º Molar Superior Esq.', pos: 'pos-t9' },
  { id: 't10', label: '2º Molar Superior Esq.', pos: 'pos-t10' },
  // Bottom Arch
  { id: 'b1', label: '2º Molar Inferior Dir.', pos: 'pos-b1' },
  { id: 'b2', label: '1º Molar Inferior Dir.', pos: 'pos-b2' },
  { id: 'b3', label: 'Canino Inferior Dir.', pos: 'pos-b3' },
  { id: 'b4', label: 'Incisivo Lat. Inferior Dir.', pos: 'pos-b4' },
  { id: 'b5', label: 'Incisivo Cent. Inferior Dir.', pos: 'pos-b5' },
  { id: 'b6', label: 'Incisivo Cent. Inferior Esq.', pos: 'pos-b6' },
  { id: 'b7', label: 'Incisivo Lat. Inferior Esq.', pos: 'pos-b7' },
  { id: 'b8', label: 'Canino Inferior Esq.', pos: 'pos-b8' },
  { id: 'b9', label: '1º Molar Inferior Esq.', pos: 'pos-b9' },
  { id: 'b10', label: '2º Molar Inferior Esq.', pos: 'pos-b10' },
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

  const openModal = (tooth) => {
    setSelectedTooth(tooth);
    setEruptionDate(teethingData[tooth.id] || '');
  };

  const closeModal = () => {
    setSelectedTooth(null);
    setEruptionDate('');
  };

  const saveToothDate = (e) => {
    e.preventDefault();
    if (!eruptionDate) return;
    
    setTeethingData(prev => ({
      ...prev,
      [selectedTooth.id]: eruptionDate
    }));
    closeModal();
  };

  const removeToothDate = () => {
    setTeethingData(prev => {
      const newData = { ...prev };
      delete newData[selectedTooth.id];
      return newData;
    });
    closeModal();
  };

  const renderToothSpot = (tooth) => {
    const isErupted = !!teethingData[tooth.id];
    const dateStr = isErupted ? format(new Date(teethingData[tooth.id]), "MMM yy", { locale: ptBR }) : 'Registar';

    return (
      <div 
        key={tooth.id} 
        className={`tooth-spot ${isErupted ? 'erupted' : ''} ${tooth.pos}`}
        onClick={() => openModal(tooth)}
        title={tooth.label}
      >
        <span className="spot-date">{dateStr}</span>
      </div>
    );
  };

  return (
    <div className="teeth-map-container">
      <p className="text-body text-light mb-4 text-center">
        Toque num espaço da gengiva para registar o nascimento do dente.
      </p>

      <div className="realistic-mouth-wrapper">
        {TEETH_DATA.map(renderToothSpot)}
      </div>

      {/* Modal */}
      {selectedTooth && (
        <div className="tooth-modal-overlay" onClick={closeModal}>
          <div className="tooth-modal" onClick={e => e.stopPropagation()}>
            <div className="flex-between mb-4">
              <h3 className="h3">Registar Dente</h3>
              <button className="btn-icon" onClick={closeModal}><X size={24} /></button>
            </div>
            
            <p className="text-body mb-4">
              <strong>{selectedTooth.label}</strong>
            </p>

            <form onSubmit={saveToothDate}>
              <div className="input-group">
                <label className="input-label"><CalendarIcon size={16} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '4px' }}/> Data de Erupção (Rasgou a gengiva)</label>
                <input
                  type="date"
                  className="input-field"
                  value={eruptionDate}
                  onChange={(e) => setEruptionDate(e.target.value)}
                  required
                />
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Guardar Data</button>
                {teethingData[selectedTooth.id] && (
                  <button type="button" className="btn-outline" onClick={removeToothDate} style={{ padding: '0.5rem 1rem', color: 'var(--color-text-light)' }} title="Remover registo deste dente">
                    <Trash2 size={20} />
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
