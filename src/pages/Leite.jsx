import { useState, useEffect } from 'react';
import { format, differenceInDays, parseISO, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, Milk, Trash2, Calendar as CalendarIcon, Clock, Minus, Sparkles, ChevronLeft, ChevronRight, Droplets } from 'lucide-react';
import { api } from '../services/api';
import './Leite.css';

const PRESET_AMOUNTS = [60, 90, 120, 150, 180, 210, 240];

const Leite = () => {
  const [registos, setRegistos] = useState([]);
  const [dataSelecionada, setDataSelecionada] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [adicionando, setAdicionando] = useState(false);
  const [novaHora, setNovaHora] = useState(format(new Date(), 'HH:mm'));
  const [novaQuantidade, setNovaQuantidade] = useState(150);

  useEffect(() => {
    api.getLeite().then(data => setRegistos(data));
  }, []);

  const registosDoDia = registos
    .filter(r => r.data === dataSelecionada)
    .sort((a, b) => b.hora.localeCompare(a.hora));

  const totalMlDoDia = registosDoDia.reduce((sum, r) => sum + r.quantidade_ml, 0);
  const mediaMl = registosDoDia.length > 0 ? Math.round(totalMlDoDia / registosDoDia.length) : 0;

  // Find last feeding overall
  const registosOrdenadosGeral = [...registos].sort((a, b) => {
    const dtA = `${a.data}T${a.hora}`;
    const dtB = `${b.data}T${b.hora}`;
    return dtB.localeCompare(dtA);
  });

  const ultimaMamada = registosOrdenadosGeral[0];

  const getTempoDesdeUltima = () => {
    if (!ultimaMamada) return null;
    try {
      const dataHoraStr = `${ultimaMamada.data}T${ultimaMamada.hora}:00`;
      const dateObj = parseISO(dataHoraStr);
      return formatDistanceToNow(dateObj, { addSuffix: true, locale: ptBR });
    } catch (e) {
      return null;
    }
  };

  const tempoUltimaStr = getTempoDesdeUltima();

  const adicionarRegisto = (e) => {
    e.preventDefault();
    if (!novaHora || !novaQuantidade) return;
    const registo = {
      id: Date.now(),
      data: dataSelecionada,
      hora: novaHora,
      quantidade_ml: Number(novaQuantidade),
    };
    setRegistos(prev => [registo, ...prev]);
    api.saveLeite(registo);
    setAdicionando(false);
  };

  const apagarRegisto = (id) => {
    setRegistos(prev => prev.filter(r => r.id !== id));
    api.deleteLeite(id);
  };

  // Quick date change helpers
  const mudarDia = (offset) => {
    const curr = parseISO(dataSelecionada);
    curr.setDate(curr.getDate() + offset);
    setDataSelecionada(format(curr, 'yyyy-MM-dd'));
  };

  const hojeStr = format(new Date(), 'yyyy-MM-dd');
  const ontemStr = format(new Date(Date.now() - 86400000), 'yyyy-MM-dd');

  // Quick time helpers
  const definirHoraRelativa = (minutosAtras) => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - minutosAtras);
    setNovaHora(format(d, 'HH:mm'));
  };

  const adjustAmount = (delta) => {
    setNovaQuantidade(prev => Math.max(10, Math.min(500, prev + delta)));
  };

  const diaDaSemana = format(parseISO(dataSelecionada), 'EEEE, d \'de\' MMMM', { locale: ptBR });

  return (
    <div className="leite-container">
      {/* Header */}
      <header className="page-header" style={{ marginBottom: '0.5rem' }}>
        <h1 className="h1 flex-center" style={{ gap: '0.6rem', justifyContent: 'flex-start' }}>
          <span>Leite & Mamadas</span>
          <Sparkles size={24} style={{ color: 'var(--color-secondary)' }} />
        </h1>
        <p className="text-secondary">Acompanhamento diário de nutrição da Sofia</p>
      </header>

      {/* Date Navigation Bar */}
      <div className="date-selector-bar">
        <button className="btn-icon" onClick={() => mudarDia(-1)} title="Dia anterior">
          <ChevronLeft size={20} />
        </button>

        <div className="date-quick-chips">
          <button
            className={`chip-btn ${dataSelecionada === ontemStr ? 'active' : ''}`}
            onClick={() => setDataSelecionada(ontemStr)}
          >
            Ontem
          </button>
          <button
            className={`chip-btn ${dataSelecionada === hojeStr ? 'active' : ''}`}
            onClick={() => setDataSelecionada(hojeStr)}
          >
            Hoje
          </button>
        </div>

        <div className="date-input-wrapper">
          <CalendarIcon size={16} className="text-primary" />
          <input
            type="date"
            value={dataSelecionada}
            onChange={(e) => setDataSelecionada(e.target.value)}
            className="date-input-hidden"
          />
        </div>

        <button className="btn-icon" onClick={() => mudarDia(1)} title="Dia seguinte">
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Hero Stats Card */}
      <div className="leite-hero-card">
        <div className="hero-top-row">
          <div className="hero-title-group">
            <div className="icon-badge-glow">
              <Milk size={26} />
            </div>
            <div>
              <h2 className="hero-day-title">{diaDaSemana}</h2>
              <p className="hero-day-subtitle">Resumo diário de consumo</p>
            </div>
          </div>
        </div>

        <div className="hero-main-stat">
          <span className="hero-stat-value">{totalMlDoDia}</span>
          <span className="hero-stat-unit">ml de leite</span>
        </div>

        <div className="hero-grid-stats">
          <div className="substat-card">
            <div className="substat-val">{registosDoDia.length}</div>
            <div className="substat-lbl">Mamadas</div>
          </div>
          <div className="substat-card">
            <div className="substat-val">{mediaMl} ml</div>
            <div className="substat-lbl">Média / mamada</div>
          </div>
          <div className="substat-card">
            <div className="substat-val">{tempoUltimaStr ? tempoUltimaStr.replace('há ', '') : '--'}</div>
            <div className="substat-lbl">Última mamada</div>
          </div>
        </div>
      </div>

      {/* Quick Add Button / Drawer */}
      {!adicionando ? (
        <button
          className="btn-quick-add"
          onClick={() => {
            setAdicionando(true);
            setNovaHora(format(new Date(), 'HH:mm'));
          }}
        >
          <Plus size={22} />
          <span>Registar Nova Mamada</span>
        </button>
      ) : (
        <form className="add-form-card" onSubmit={adicionarRegisto}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 className="h3 flex-center" style={{ gap: '0.5rem' }}>
              <Milk size={20} className="text-primary" />
              <span>Registar Mamada</span>
            </h3>
            <span className="text-secondary" style={{ fontSize: '0.85rem' }}>{dataSelecionada}</span>
          </div>

          {/* Stepper Quantity Picker */}
          <div className="quantity-stepper-container">
            <div className="form-section-title">Quantidade</div>
            
            <div className="stepper-main">
              <button
                type="button"
                className="btn-stepper"
                onClick={() => adjustAmount(-10)}
                title="-10ml"
              >
                <Minus size={22} />
              </button>

              <div className="stepper-display">
                <div className="stepper-number">{novaQuantidade}</div>
                <div className="stepper-unit">mililitros</div>
              </div>

              <button
                type="button"
                className="btn-stepper"
                onClick={() => adjustAmount(10)}
                title="+10ml"
              >
                <Plus size={22} />
              </button>
            </div>

            {/* Presets */}
            <div className="presets-grid">
              {PRESET_AMOUNTS.map(amt => (
                <button
                  key={amt}
                  type="button"
                  className={`preset-chip ${novaQuantidade === amt ? 'selected' : ''}`}
                  onClick={() => setNovaQuantidade(amt)}
                >
                  {amt} ml
                </button>
              ))}
            </div>
          </div>

          {/* Time Picker */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div className="form-section-title">Hora da Mamada</div>
            <div className="time-quick-row">
              <button type="button" className="time-chip" onClick={() => definirHoraRelativa(0)}>
                Agora
              </button>
              <button type="button" className="time-chip" onClick={() => definirHoraRelativa(15)}>
                -15m
              </button>
              <button type="button" className="time-chip" onClick={() => definirHoraRelativa(30)}>
                -30m
              </button>
              <button type="button" className="time-chip" onClick={() => definirHoraRelativa(60)}>
                -1h
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0,0,0,0.03)', padding: '0.75rem 1rem', borderRadius: '14px', border: '1px solid var(--color-border)' }}>
              <Clock size={18} className="text-secondary" />
              <input
                type="time"
                value={novaHora}
                onChange={(e) => setNovaHora(e.target.value)}
                style={{ border: 'none', background: 'transparent', width: '100%', fontSize: '1.1rem', fontWeight: '700', outline: 'none', color: 'var(--color-text)' }}
                required
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="button"
              className="btn btn-outline"
              style={{ flex: 1, borderRadius: '16px', padding: '0.85rem' }}
              onClick={() => setAdicionando(false)}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: 1.5, borderRadius: '16px', padding: '0.85rem', boxShadow: '0 4px 15px rgba(244,63,94,0.3)' }}
            >
              Confirmar Mamada
            </button>
          </div>
        </form>
      )}

      {/* Feedings Feed Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
        <h3 className="h3 flex-center" style={{ gap: '0.5rem' }}>
          <Droplets size={18} className="text-primary" />
          <span>Mamadas Registadas</span>
        </h3>
        <span className="badge" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', padding: '0.25rem 0.65rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '700' }}>
          {registosDoDia.length}
        </span>
      </div>

      {/* Feedings List */}
      <div className="feedings-list">
        {registosDoDia.length === 0 ? (
          <div className="empty-state-card">
            <div className="empty-icon-circle">
              <Milk size={32} />
            </div>
            <h4 style={{ margin: '0 0 0.25rem 0', color: 'var(--color-text)', fontWeight: '800' }}>Sem registos hoje</h4>
            <p className="text-secondary" style={{ fontSize: '0.85rem', margin: 0 }}>
              Toque no botão acima para registar a primeira mamada da Sofia neste dia.
            </p>
          </div>
        ) : (
          registosDoDia.map(reg => (
            <div key={reg.id} className="feeding-card">
              <div className="feeding-left">
                <div className="feeding-icon-box">
                  <Milk size={22} />
                </div>
                <div>
                  <div className="feeding-time">{reg.hora}</div>
                  <div className="feeding-relative-time">
                    {dataSelecionada === hojeStr ? 'Hoje' : dataSelecionada}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div className="feeding-amount-badge">
                  <span className="amount-val">{reg.quantidade_ml}</span>
                  <span className="amount-unit">ml</span>
                </div>

                <button
                  className="btn-delete-item"
                  onClick={() => apagarRegisto(reg.id)}
                  title="Apagar registo"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Leite;
