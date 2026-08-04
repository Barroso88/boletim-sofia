import { useState, useEffect } from 'react';
import { differenceInDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, Scale, Trash2, TrendingUp, Minus } from 'lucide-react';
import WeightChart from '../components/WeightChart';
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

  // Chart data: chronological order (ascending), includes ganhoDia for tooltip
  const chartData = [...processedRegistos].reverse().map(r => ({
    dataFormato: format(new Date(r.data), 'dd MMM', { locale: ptBR }),
    peso: r.peso,
    ganhoDia: r.ganhoDia,
  }));

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

      {registos.length >= 2 && (
        <div className="glass-card mb-4 animate-fade-in" style={{ padding: '1.5rem 1rem 1rem', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', padding: '0 0.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text)', margin: 0 }}>Evolução de Peso</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', margin: '2px 0 0' }}>{processedRegistos.length} pesagens registadas</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-light)', margin: 0 }}>Máximo</p>
              <p style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-primary)', margin: 0 }}>{Math.max(...registos.map(r => r.peso)).toFixed(3)} kg</p>
            </div>
          </div>
          <WeightChart chartData={chartData} />
        </div>
      )}

      <div className="peso-table-container glass-card">
        {processedRegistos.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-light)' }}>
            <Scale size={64} style={{ margin: '0 auto 1rem', opacity: 0.2 }} />
            <p>Ainda não foram registados pesos.</p>
          </div>
        ) : (
          <table className="premium-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Peso</th>
                <th>Evolução Diária</th>
                <th className="text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {processedRegistos.map((registo, index) => {
                const dateObj = new Date(registo.data);
                const isGain = registo.ganhoDia !== null && registo.ganhoDia > 0;
                const isLoss = registo.ganhoDia !== null && registo.ganhoDia < 0;
                const isNeutral = registo.ganhoDia === 0;

                return (
                  <tr key={registo.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
                    <td>
                      <div className="td-date">{format(dateObj, "dd MMM, yyyy", { locale: ptBR })}</div>
                    </td>
                    <td>
                      <div className="td-weight">{registo.peso.toFixed(3)} <span>kg</span></div>
                    </td>
                    <td>
                      {registo.ganhoDia !== null ? (
                        <div className={`ganho-badge ${isGain ? 'gain' : isLoss ? 'loss' : 'neutral'}`}>
                          {isGain ? <TrendingUp size={16} /> : isLoss ? <TrendingUp size={16} style={{ transform: 'scaleY(-1)' }} /> : <Minus size={16} />}
                          <span>
                            {registo.ganhoDia > 0 ? '+' : ''}{registo.ganhoDia} g/dia
                          </span>
                        </div>
                      ) : (
                        <div className="ganho-badge neutral">
                          <span>Primeiro Registo</span>
                        </div>
                      )}
                    </td>
                    <td className="text-right">
                      <button className="btn-delete" onClick={() => removerRegisto(registo.id)} title="Remover registo">
                        <Trash2 size={20} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Peso;
