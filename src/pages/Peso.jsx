import { useState, useEffect } from 'react';
import { differenceInDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, Scale, Trash2, TrendingUp, Minus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
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

  const chartData = [...processedRegistos].reverse().map(r => ({
    dataFormato: format(new Date(r.data), 'dd MMM', { locale: ptBR }),
    peso: r.peso
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

      {registos.length > 0 && (
        <div className="glass-card mb-4 animate-fade-in" style={{ padding: '2rem 1.5rem', height: '350px' }}>
          <h3 className="h3 mb-4" style={{ fontSize: '1.2rem', color: 'var(--color-primary-dark)', textAlign: 'center' }}>Evolução de Peso</h3>
          <ResponsiveContainer width="99%" height="100%">
            <LineChart data={chartData} margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
              <XAxis 
                dataKey="dataFormato" 
                stroke="var(--color-text-light)" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
                dy={15} 
              />
              <YAxis 
                stroke="var(--color-text-light)" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
                domain={['dataMin - 0.5', 'dataMax + 0.5']} 
                tickFormatter={(value) => `${parseFloat(value).toFixed(1)}kg`} 
                dx={-10} 
              />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', background: 'var(--color-surface)', boxShadow: 'var(--shadow-md)', padding: '10px 15px' }}
                itemStyle={{ color: 'var(--color-primary-dark)', fontWeight: 'bold', fontSize: '1.1rem' }}
                formatter={(value) => [`${value} kg`, 'Peso']}
                labelStyle={{ color: 'var(--color-text-light)', marginBottom: '5px', fontSize: '0.8rem', textTransform: 'uppercase' }}
                cursor={{ stroke: 'var(--color-primary-light)', strokeWidth: 1, strokeDasharray: '4 4' }}
              />
              <Line 
                type="monotone" 
                dataKey="peso" 
                stroke="var(--color-primary)" 
                strokeWidth={3}
                dot={{ r: 4, fill: '#fff', stroke: 'var(--color-primary)', strokeWidth: 2 }}
                activeDot={{ r: 7, fill: 'var(--color-primary)', stroke: '#fff', strokeWidth: 2, style: { filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' } }} 
              />
            </LineChart>
          </ResponsiveContainer>
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
