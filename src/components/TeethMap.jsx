import { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import './TeethMap.css';

// 10 top teeth, 10 bottom teeth. Types: molar, canine, incisor
const TEETH_LAYOUT = {
  top: [
    { id: 't1', type: 'molar', label: '2º Molar Superior Dir.', pos: 't-1' },
    { id: 't2', type: 'molar', label: '1º Molar Superior Dir.', pos: 't-2' },
    { id: 't3', type: 'canine', label: 'Canino Superior Dir.', pos: 't-3' },
    { id: 't4', type: 'incisor', label: 'Incisivo Lat. Superior Dir.', pos: 't-4' },
    { id: 't5', type: 'incisor', label: 'Incisivo Cent. Superior Dir.', pos: 't-5' },
    { id: 't6', type: 'incisor', label: 'Incisivo Cent. Superior Esq.', pos: 't-6' },
    { id: 't7', type: 'incisor', label: 'Incisivo Lat. Superior Esq.', pos: 't-7' },
    { id: 't8', type: 'canine', label: 'Canino Superior Esq.', pos: 't-8' },
    { id: 't9', type: 'molar', label: '1º Molar Superior Esq.', pos: 't-9' },
    { id: 't10', type: 'molar', label: '2º Molar Superior Esq.', pos: 't-10' },
  ],
  bottom: [
    { id: 'b1', type: 'molar', label: '2º Molar Inferior Dir.', pos: 't-1' },
    { id: 'b2', type: 'molar', label: '1º Molar Inferior Dir.', pos: 't-2' },
    { id: 'b3', type: 'canine', label: 'Canino Inferior Dir.', pos: 't-3' },
    { id: 'b4', type: 'incisor', label: 'Incisivo Lat. Inferior Dir.', pos: 't-4' },
    { id: 'b5', type: 'incisor', label: 'Incisivo Cent. Inferior Dir.', pos: 't-5' },
    { id: 'b6', type: 'incisor', label: 'Incisivo Cent. Inferior Esq.', pos: 't-6' },
    { id: 'b7', type: 'incisor', label: 'Incisivo Lat. Inferior Esq.', pos: 't-7' },
    { id: 'b8', type: 'canine', label: 'Canino Inferior Esq.', pos: 't-8' },
    { id: 'b9', type: 'molar', label: '1º Molar Inferior Esq.', pos: 't-9' },
    { id: 'b10', type: 'molar', label: '2º Molar Inferior Esq.', pos: 't-10' },
  ]
};

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

  const renderTooth = (tooth) => {
    const isErupted = !!teethingData[tooth.id];
    const dateStr = isErupted ? format(new Date(teethingData[tooth.id]), "MMM yy", { locale: ptBR }) : '';

    return (
      <div 
        key={tooth.id} 
        className={`tooth-wrapper tooth-${tooth.type} ${isErupted ? 'tooth-erupted' : ''} ${tooth.pos}`}
        onClick={() => openModal(tooth)}
        title={tooth.label}
      >
        {!isErupted && <span className="tooth-date">Registar</span>}
        <div className="tooth-icon"></div>
        {isErupted && <span className="tooth-date">{dateStr}</span>}
      </div>
    );
  };

  return (
    <div className="teeth-map-container">
      <div className="arch-section">
        <h3 className="arch-title">Arcada Superior</h3>
        <div className="jaw-arch arch-top">
          {TEETH_LAYOUT.top.map(renderTooth)}
        </div>
      </div>

      <div className="arch-section">
        <div className="jaw-arch arch-bottom">
          {TEETH_LAYOUT.bottom.map(renderTooth)}
        </div>
        <h3 className="arch-title" style={{ marginTop: '1.5rem', marginBottom: 0 }}>Arcada Inferior</h3>
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
