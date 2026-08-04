import { useState, useEffect } from 'react';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, Milk, Trash2, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { api } from '../services/api';

const Leite = () => {
  const [registos, setRegistos] = useState([]);
  const [dataSelecionada, setDataSelecionada] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [adicionando, setAdicionando] = useState(false);
  const [novaHora, setNovaHora] = useState(format(new Date(), 'HH:mm'));
  const [novaQuantidade, setNovaQuantidade] = useState('120');

  useEffect(() => {
    api.getLeite().then(data => setRegistos(data));
  }, []);

  const registosDoDia = registos.filter(r => r.data === dataSelecionada).sort((a, b) => b.hora.localeCompare(a.hora));
  const totalMlDoDia = registosDoDia.reduce((total, r) => total + r.quantidade_ml, 0);

  const adicionarRegisto = (e) => {
    e.preventDefault();
    if (!novaHora || !novaQuantidade) return;
    const registo = {
      id: Date.now(),
      data: dataSelecionada,
      hora: novaHora,
      quantidade_ml: parseInt(novaQuantidade, 10),
    };
    setRegistos(prev => [...prev, registo]);
    api.saveLeite(registo);
    setAdicionando(false);
  };

  const apagarRegisto = (id) => {
    setRegistos(prev => prev.filter(r => r.id !== id));
    api.deleteLeite(id);
  };

  const diaDaSemana = format(new Date(dataSelecionada), 'EEEE', { locale: ptBR });
  
  const diasAtras = differenceInDays(new Date(), new Date(dataSelecionada));
  let labelDia = '';
  if (diasAtras === 0) labelDia = 'Hoje';
  else if (diasAtras === 1) labelDia = 'Ontem';
  else if (diasAtras === -1) labelDia = 'Amanhã';

  return (
    <div className="page-container page-peso">
      <header className="page-header">
        <h1 className="h1">Alimentação</h1>
        <p className="text-secondary">Registo diário de leite</p>
      </header>

      {/* Date Selector */}
      <div className="card glass-card mb-4" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <CalendarIcon size={20} className="text-primary" />
        <input 
          type="date" 
          value={dataSelecionada} 
          onChange={(e) => setDataSelecionada(e.target.value)}
          className="input"
          style={{ flex: 1 }}
        />
      </div>

      {/* Daily Summary */}
      <div className="card glass-card mb-4">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 className="h3" style={{ textTransform: 'capitalize' }}>
              {labelDia ? `${labelDia} (${diaDaSemana})` : diaDaSemana}
            </h3>
            <p className="text-secondary">Total consumido</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>
              {totalMlDoDia} <span style={{ fontSize: '1rem' }}>ml</span>
            </div>
            <p className="text-secondary">{registosDoDia.length} mamada{registosDoDia.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>

      {/* Add New Record */}
      {!adicionando ? (
        <button className="btn btn-primary mb-4" style={{ width: '100%' }} onClick={() => {
          setAdicionando(true);
          setNovaHora(format(new Date(), 'HH:mm')); // current time default
        }}>
          <Plus size={20} />
          Registar Mamada
        </button>
      ) : (
        <form className="card glass-card mb-4" onSubmit={adicionarRegisto}>
          <h3 className="h3 mb-3">Nova Mamada</h3>
          
          <div className="form-group">
            <label className="label">Hora</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={18} className="text-secondary" />
              <input 
                type="time" 
                value={novaHora}
                onChange={(e) => setNovaHora(e.target.value)}
                className="input"
                required
              />
            </div>
          </div>
          
          <div className="form-group mb-4">
            <label className="label">Quantidade (ml)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Milk size={18} className="text-secondary" />
              <input 
                type="number"
                step="10"
                min="10"
                max="500"
                value={novaQuantidade}
                onChange={(e) => setNovaQuantidade(e.target.value)}
                className="input"
                required
              />
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setAdicionando(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
              Guardar
            </button>
          </div>
        </form>
      )}

      {/* List of records for the day */}
      <h3 className="h3 mb-3">Registos do Dia</h3>
      <div className="timeline">
        {registosDoDia.length === 0 ? (
          <div className="text-secondary" style={{ textAlign: 'center', padding: '2rem 0' }}>
            Nenhum registo de leite para este dia.
          </div>
        ) : (
          registosDoDia.map(reg => (
            <div key={reg.id} className="card glass-card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)', padding: '0.5rem', borderRadius: '12px' }}>
                  <Milk size={24} />
                </div>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{reg.quantidade_ml} ml</div>
                  <div className="text-secondary">{reg.hora}</div>
                </div>
              </div>
              <button className="btn-icon" onClick={() => apagarRegisto(reg.id)} title="Apagar registo" style={{ color: '#d32f2f' }}>
                <Trash2 size={20} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Leite;
