import { useState, useEffect } from 'react';
import { differenceInDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, Scale, Trash2, TrendingUp, Minus } from 'lucide-react';
import './Peso.css';

const Peso = () => {
  const [registos, setRegistos] = useState(() => {
    const saved = localStorage.getItem('sofia_peso');
    if (saved) return JSON.parse(saved);
    return [];
  });
  
  const [adicionando, setAdicionando] = useState(false);
  const [novaData, setNovaData] = useState('');
  const [novoPeso, setNovoPeso] = useState('');

  useEffect(() => {
    localStorage.setItem('sofia_peso', JSON.stringify(registos));
  }, [registos]);

  const adicionarRegisto = (e) => {
    e.preventDefault();
    if (!novaData || !novoPeso) return;
    
    const registo = {
      id: Date.now(),
      data: novaData,
      peso: parseFloat(novoPeso) // in Kg
    };
    
    setRegistos([...registos, registo]);
    setAdicionando(false);
    setNovaData('');
    setNovoPeso('');
  };

  const removerRegisto = (id) => {
    if (window.confirm('Tem a certeza que deseja remover este registo de peso?')) {
      setRegistos(registos.filter(r => r.id !== id));
    }
  };

  // Process data for display: sort ascending, calculate diffs, then reverse for display
  const processedRegistos = [...registos]
    .sort((a, b) => new Date(a.data) - new Date(b.data))
    .map((registo, index, array) => {
      let ganhoDia = null;
      if (index > 0) {
        const prev = array[index - 1];
        const daysDiff = differenceInDays(new Date(registo.data), new Date(prev.data));
        const weightDiffGrams = (registo.peso - prev.peso) * 1000;
        
        if (daysDiff > 0) {
          ganhoDia = Math.round(weightDiffGrams / daysDiff);
        }
      }
      return { ...registo, ganhoDia };
    })
    .reverse(); // Newest first

  return (
    <div className="page-container">
      <div className="flex-between mb-4">
        <h2 className="h2 text-gradient" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Scale size={32} color="var(--color-primary)" /> Registo de Peso
        </h2>
        <button className="btn-primary" onClick={() => setAdicionando(true)}>
          <Plus size={20} />
          Novo Peso
        </button>
      </div>

      {adicionando && (
        <div className="glass-card mb-4 animate-fade-in" style={{ padding: '2rem' }}>
          <h3 className="h3 mb-4">Adicionar Nova Pesagem</h3>
          <form onSubmit={adicionarRegisto}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div className="input-group">
                <label className="input-label">Data da Pesagem</label>
                <input
                  type="date"
                  className="input-field"
                  value={novaData}
                  onChange={(e) => setNovaData(e.target.value)}
                  required
                />
              </div>
              <div className="input-group">
                <label className="input-label">Peso (kg)</label>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  className="input-field"
                  value={novoPeso}
                  onChange={(e) => setNovoPeso(e.target.value)}
                  placeholder="Ex: 3.500"
                  required
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button type="submit" className="btn-primary">Guardar Registo</button>
              <button type="button" className="btn-outline" onClick={() => setAdicionando(false)}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      <div className="peso-list">
        {processedRegistos.length === 0 ? (
          <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-light)' }}>
            <Scale size={64} style={{ margin: '0 auto 1rem', opacity: 0.2 }} />
            <p>Ainda não foram registados pesos.</p>
          </div>
        ) : (
          processedRegistos.map((registo, index) => {
            const dateObj = new Date(registo.data);
            const isGain = registo.ganhoDia !== null && registo.ganhoDia > 0;
            const isLoss = registo.ganhoDia !== null && registo.ganhoDia < 0;
            const isNeutral = registo.ganhoDia === 0;

            return (
              <div key={registo.id} className="glass-card peso-item animate-fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
                <div className="peso-date-block">
                  <div className="peso-day">{format(dateObj, 'dd')}</div>
                  <div className="peso-month">{format(dateObj, 'MMM, yyyy', { locale: ptBR })}</div>
                </div>
                
                <div className="peso-details">
                  <h3 className="peso-value">{registo.peso.toFixed(3)} <span className="peso-unit">kg</span></h3>
                  
                  {registo.ganhoDia !== null && (
                    <div className={`ganho-badge ${isGain ? 'gain' : isLoss ? 'loss' : 'neutral'}`}>
                      {isGain ? <TrendingUp size={16} /> : isLoss ? <TrendingUp size={16} style={{ transform: 'scaleY(-1)' }} /> : <Minus size={16} />}
                      <span>
                        {registo.ganhoDia > 0 ? '+' : ''}{registo.ganhoDia} g / dia
                      </span>
                    </div>
                  )}
                  {registo.ganhoDia === null && (
                    <div className="ganho-badge neutral">
                      <span>Primeiro Registo</span>
                    </div>
                  )}
                </div>

                <button className="btn-delete" onClick={() => removerRegisto(registo.id)} title="Remover registo">
                  <Trash2 size={20} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Peso;
