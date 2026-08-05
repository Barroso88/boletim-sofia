import { useState, useEffect } from 'react';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, Milk, Trash2, Calendar as CalendarIcon, Clock, Minus, Sparkles, ChevronLeft, ChevronRight, Droplets, Layers, Pencil, AlertTriangle, X } from 'lucide-react';
import { api } from '../services/api';
import './Leite.css';

const PRESET_AMOUNTS = [30, 60, 90, 120, 150, 180, 210, 240];
const DIAPER_TYPES = [
  { id: 'Cocó', label: 'Cocó', icon: '💩', badgeClass: 'coco' },
  { id: 'Xixi', label: 'Xixi', icon: '💧', badgeClass: 'xixi' },
  { id: 'Cocó + Xixi', label: 'Cocó + Xixi', icon: '🧻', badgeClass: 'coco-xixi' },
];

const Leite = () => {
  const [activeSubTab, setActiveSubTab] = useState('leite'); // 'leite' | 'fraldas'

  // Leite State
  const [registosLeite, setRegistosLeite] = useState([]);
  const [dataSelecionada, setDataSelecionada] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [adicionandoLeite, setAdicionandoLeite] = useState(false);
  const [editandoIdLeite, setEditandoIdLeite] = useState(null);
  const [novaHoraLeite, setNovaHoraLeite] = useState(format(new Date(), 'HH:mm'));
  const [novaQuantidade, setNovaQuantidade] = useState(150);

  // Fraldas State
  const [registosFraldas, setRegistosFraldas] = useState([]);
  const [adicionandoFralda, setAdicionandoFralda] = useState(false);
  const [editandoIdFralda, setEditandoIdFralda] = useState(null);
  const [novaHoraFralda, setNovaHoraFralda] = useState(format(new Date(), 'HH:mm'));
  const [tipoFraldaSelecionado, setTipoFraldaSelecionado] = useState('Xixi');

  useEffect(() => {
    api.getLeite().then(data => setRegistosLeite(data));
    api.getFraldas().then(data => setRegistosFraldas(data));
  }, []);

  // --- LEITE CALCULATIONS ---
  const registosLeiteDoDia = registosLeite
    .filter(r => r.data === dataSelecionada)
    .sort((a, b) => b.hora.localeCompare(a.hora));

  const totalMlDoDia = registosLeiteDoDia.reduce((sum, r) => sum + r.quantidade_ml, 0);

  const registosLeiteGeral = [...registosLeite].sort((a, b) => {
    const dtA = `${a.data}T${a.hora}`;
    const dtB = `${b.data}T${b.hora}`;
    return dtB.localeCompare(dtA);
  });
  const ultimaMamada = registosLeiteGeral[0];

  const getTempoDesdeUltimaMamada = () => {
    if (!ultimaMamada) return null;
    try {
      const dataHoraStr = `${ultimaMamada.data}T${ultimaMamada.hora}:00`;
      const past = new Date(dataHoraStr);
      const now = new Date();
      const diffMs = now - past;
      if (isNaN(diffMs) || diffMs < 0) return '0 min';

      const totalMinutes = Math.floor(diffMs / (1000 * 60));
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;

      if (hours === 0) return `${minutes} min`;
      if (minutes === 0) return `${hours}h`;
      return `${hours}h ${minutes}min`;
    } catch (e) {
      return null;
    }
  };

  const abrirEdicaoLeite = (reg) => {
    setEditandoIdLeite(reg.id);
    setNovaHoraLeite(reg.hora);
    setNovaQuantidade(reg.quantidade_ml);
    setAdicionandoLeite(true);
  };

  const adicionarRegistoLeite = (e) => {
    e.preventDefault();
    if (!novaHoraLeite || !novaQuantidade) return;
    const registo = {
      id: editandoIdLeite || Date.now(),
      data: dataSelecionada,
      hora: novaHoraLeite,
      quantidade_ml: Number(novaQuantidade),
    };
    setRegistosLeite(prev => {
      const exists = prev.some(r => r.id === registo.id);
      if (exists) return prev.map(r => r.id === registo.id ? registo : r);
      return [registo, ...prev];
    });
    api.saveLeite(registo);
    setAdicionandoLeite(false);
    setEditandoIdLeite(null);
  };

  const [confirmarDelete, setConfirmarDelete] = useState(null); // { id, type }

  const apagarRegistoConfirmado = () => {
    if (!confirmarDelete) return;
    const { id, type } = confirmarDelete;
    if (type === 'leite') {
      setRegistosLeite(prev => prev.filter(r => r.id !== id));
      api.deleteLeite(id);
    } else if (type === 'fralda') {
      setRegistosFraldas(prev => prev.filter(f => f.id !== id));
      api.deleteFralda(id);
    }
    setConfirmarDelete(null);
  };

  // --- FRALDAS CALCULATIONS ---
  const registosFraldasDoDia = registosFraldas
    .filter(r => r.data === dataSelecionada)
    .sort((a, b) => b.hora.localeCompare(a.hora));

  const countCoco = registosFraldasDoDia.filter(f => f.tipo === 'Cocó').length;
  const countXixi = registosFraldasDoDia.filter(f => f.tipo === 'Xixi').length;
  const countCocoXixi = registosFraldasDoDia.filter(f => f.tipo === 'Cocó + Xixi').length;

  const registosFraldasGeral = [...registosFraldas].sort((a, b) => {
    const dtA = `${a.data}T${a.hora}`;
    const dtB = `${b.data}T${b.hora}`;
    return dtB.localeCompare(dtA);
  });
  const ultimaFralda = registosFraldasGeral[0];

  const getTempoDesdeUltimaFralda = () => {
    if (!ultimaFralda) return null;
    try {
      const dataHoraStr = `${ultimaFralda.data}T${ultimaFralda.hora}:00`;
      const past = new Date(dataHoraStr);
      const now = new Date();
      const diffMs = now - past;
      if (isNaN(diffMs) || diffMs < 0) return '0 min';

      const totalMinutes = Math.floor(diffMs / (1000 * 60));
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;

      if (hours === 0) return `${minutes} min`;
      if (minutes === 0) return `${hours}h`;
      return `${hours}h ${minutes}min`;
    } catch (e) {
      return null;
    }
  };

  const abrirEdicaoFralda = (reg) => {
    setEditandoIdFralda(reg.id);
    setNovaHoraFralda(reg.hora);
    setTipoFraldaSelecionado(reg.tipo);
    setAdicionandoFralda(true);
  };

  const adicionarRegistoFralda = (e) => {
    e.preventDefault();
    if (!novaHoraFralda || !tipoFraldaSelecionado) return;
    const registo = {
      id: editandoIdFralda || Date.now(),
      data: dataSelecionada,
      hora: novaHoraFralda,
      tipo: tipoFraldaSelecionado,
    };
    setRegistosFraldas(prev => {
      const exists = prev.some(r => r.id === registo.id);
      if (exists) return prev.map(r => r.id === registo.id ? registo : r);
      return [registo, ...prev];
    });
    api.saveFralda(registo);
    setAdicionandoFralda(false);
    setEditandoIdFralda(null);
  };

  const apagarRegistoFralda = (id) => {
    setRegistosFraldas(prev => prev.filter(f => f.id !== id));
    api.deleteFralda(id);
  };

  // --- DATE HELPERS ---
  const mudarDia = (offset) => {
    const curr = parseISO(dataSelecionada);
    curr.setDate(curr.getDate() + offset);
    setDataSelecionada(format(curr, 'yyyy-MM-dd'));
  };

  const hojeStr = format(new Date(), 'yyyy-MM-dd');
  const ontemStr = format(new Date(Date.now() - 86400000), 'yyyy-MM-dd');
  const diaDaSemana = format(parseISO(dataSelecionada), 'EEEE, d \'de\' MMMM', { locale: ptBR });

  const adjustAmount = (delta) => {
    setNovaQuantidade(prev => Math.max(10, Math.min(500, prev + delta)));
  };

  return (
    <div className="page-container leite-container">
      {/* Header */}
      <header className="page-header mb-2">
        <h1 className="h1" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span>Leite & Fraldas</span>
          <Sparkles size={24} style={{ color: 'var(--color-secondary)' }} />
        </h1>
        <p className="text-secondary" style={{ marginTop: '0.2rem' }}>Acompanhamento diário da Sofia</p>
      </header>

      {/* Sub Tabs Switcher */}
      <div className="sub-tabs-container">
        <button
          className={`sub-tab-btn ${activeSubTab === 'leite' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('leite')}
        >
          <Milk size={18} />
          <span>Leite</span>
        </button>
        <button
          className={`sub-tab-btn ${activeSubTab === 'fraldas' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('fraldas')}
        >
          <Layers size={18} />
          <span>Fraldas</span>
        </button>
      </div>

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

      {/* ─── TAB 1: LEITE ────────────────────────────────────────────────── */}
      {activeSubTab === 'leite' && (
        <>
          {/* Hero Stats Card */}
          <div className="leite-hero-card">
            <div className="hero-top-row">
              <div className="hero-title-group">
                <div className="icon-badge-glow">
                  <Milk size={26} />
                </div>
                <div>
                  <h2 className="hero-day-title">{diaDaSemana}</h2>
                  <p className="hero-day-subtitle">Resumo de consumo de leite</p>
                </div>
              </div>
            </div>

            <div className="hero-main-stat">
              <span className="hero-stat-value">{totalMlDoDia}</span>
              <span className="hero-stat-unit">ml de leite</span>
            </div>

            <div className="hero-grid-stats">
              <div className="substat-card">
                <div className="substat-val">{registosLeiteDoDia.length}</div>
                <div className="substat-lbl">Mamadas</div>
              </div>
              <div className="substat-card">
                <div className="substat-val">{totalMlDoDia} ml</div>
                <div className="substat-lbl">Total diário</div>
              </div>
              <div className="substat-card">
                <div className="substat-val">
                  {getTempoDesdeUltimaMamada() ? getTempoDesdeUltimaMamada().replace('há ', '') : '--'}
                </div>
                <div className="substat-lbl">Última mamada</div>
              </div>
            </div>
          </div>

          {/* Quick Add Button / Form */}
          {!adicionandoLeite ? (
            <button
              className="btn-quick-add"
              onClick={() => {
                setAdicionandoLeite(true);
                setNovaHoraLeite(format(new Date(), 'HH:mm'));
              }}
            >
              <Plus size={22} />
              <span>Registar Nova Mamada</span>
            </button>
          ) : (
            <form className="add-form-card" onSubmit={adicionarRegistoLeite}>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0,0,0,0.03)', padding: '0.75rem 1rem', borderRadius: '14px', border: '1px solid var(--color-border)' }}>
                  <Clock size={18} className="text-secondary" />
                  <input
                    type="time"
                    value={novaHoraLeite}
                    onChange={(e) => setNovaHoraLeite(e.target.value)}
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
                  onClick={() => setAdicionandoLeite(false)}
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
              {registosLeiteDoDia.length}
            </span>
          </div>

          {/* Feedings List */}
          <div className="feedings-list">
            {registosLeiteDoDia.length === 0 ? (
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
              registosLeiteDoDia.map(reg => (
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

                  <div className="btn-action-group">
                    <div className="feeding-amount-badge">
                      <span className="amount-val">{reg.quantidade_ml}</span>
                      <span className="amount-unit">ml</span>
                    </div>

                    <button
                      className="btn-action-edit"
                      onClick={() => abrirEdicaoLeite(reg)}
                      title="Editar registo"
                    >
                      <Pencil size={17} />
                    </button>

                    <button
                      className="btn-action-delete"
                      onClick={() => setConfirmarDelete({ id: reg.id, type: 'leite' })}
                      title="Apagar registo"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* ─── TAB 2: FRALDAS ──────────────────────────────────────────────── */}
      {activeSubTab === 'fraldas' && (
        <>
          {/* Hero Stats Card */}
          <div className="leite-hero-card">
            <div className="hero-top-row">
              <div className="hero-title-group">
                <div className="icon-badge-glow" style={{ background: 'linear-gradient(135deg, #0284c7, #6366f1)' }}>
                  <Layers size={26} />
                </div>
                <div>
                  <h2 className="hero-day-title">{diaDaSemana}</h2>
                  <p className="hero-day-subtitle">Resumo de troca de fraldas</p>
                </div>
              </div>
            </div>

            <div className="hero-main-stat">
              <span className="hero-stat-value" style={{ background: 'linear-gradient(135deg, #0284c7, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {registosFraldasDoDia.length}
              </span>
              <span className="hero-stat-unit">fraldas trocadas</span>
            </div>

            <div className="hero-grid-stats">
              <div className="substat-card">
                <div className="substat-val">{countXixi}</div>
                <div className="substat-lbl">Xixi 💧</div>
              </div>
              <div className="substat-card">
                <div className="substat-val">{countCoco}</div>
                <div className="substat-lbl">Cocó 💩</div>
              </div>
              <div className="substat-card">
                <div className="substat-val">{countCocoXixi}</div>
                <div className="substat-lbl">Ambos 🧻</div>
              </div>
            </div>
          </div>

          {/* Quick Add Button / Form */}
          {!adicionandoFralda ? (
            <button
              className="btn-quick-add"
              style={{ background: 'linear-gradient(135deg, #0284c7, #6366f1)', boxShadow: '0 8px 25px rgba(2, 132, 199, 0.35)' }}
              onClick={() => {
                setAdicionandoFralda(true);
                setNovaHoraFralda(format(new Date(), 'HH:mm'));
              }}
            >
              <Plus size={22} />
              <span>Registar Nova Fralda</span>
            </button>
          ) : (
            <form className="add-form-card" onSubmit={adicionarRegistoFralda}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 className="h3 flex-center" style={{ gap: '0.5rem' }}>
                  <Layers size={20} style={{ color: '#0284c7' }} />
                  <span>Registar Fralda</span>
                </h3>
                <span className="text-secondary" style={{ fontSize: '0.85rem' }}>{dataSelecionada}</span>
              </div>

              {/* Diaper Type Selector */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div className="form-section-title">Tipo de Fralda</div>
                <div className="diaper-type-grid">
                  {DIAPER_TYPES.map(dt => (
                    <button
                      key={dt.id}
                      type="button"
                      className={`diaper-type-btn ${tipoFraldaSelecionado === dt.id ? 'selected' : ''}`}
                      onClick={() => setTipoFraldaSelecionado(dt.id)}
                    >
                      <span className="diaper-type-icon">{dt.icon}</span>
                      <span>{dt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Picker */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div className="form-section-title">Hora da Troca</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0,0,0,0.03)', padding: '0.75rem 1rem', borderRadius: '14px', border: '1px solid var(--color-border)' }}>
                  <Clock size={18} className="text-secondary" />
                  <input
                    type="time"
                    value={novaHoraFralda}
                    onChange={(e) => setNovaHoraFralda(e.target.value)}
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
                  onClick={() => setAdicionandoFralda(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1.5, borderRadius: '16px', padding: '0.85rem', background: 'linear-gradient(135deg, #0284c7, #6366f1)', boxShadow: '0 4px 15px rgba(2,132,199,0.3)' }}
                >
                  Confirmar Fralda
                </button>
              </div>
            </form>
          )}

          {/* Diapers Feed Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
            <h3 className="h3 flex-center" style={{ gap: '0.5rem' }}>
              <Layers size={18} style={{ color: '#0284c7' }} />
              <span>Fraldas Registadas</span>
            </h3>
            <span className="badge" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', padding: '0.25rem 0.65rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '700' }}>
              {registosFraldasDoDia.length}
            </span>
          </div>

          {/* Diapers List */}
          <div className="feedings-list">
            {registosFraldasDoDia.length === 0 ? (
              <div className="empty-state-card">
                <div className="empty-icon-circle" style={{ background: 'rgba(2, 132, 199, 0.1)', color: '#0284c7' }}>
                  <Layers size={32} />
                </div>
                <h4 style={{ margin: '0 0 0.25rem 0', color: 'var(--color-text)', fontWeight: '800' }}>Sem registos hoje</h4>
                <p className="text-secondary" style={{ fontSize: '0.85rem', margin: 0 }}>
                  Toque no botão acima para registar a primeira troca de fralda da Sofia neste dia.
                </p>
              </div>
            ) : (
              registosFraldasDoDia.map(reg => {
                const diaperMeta = DIAPER_TYPES.find(d => d.id === reg.tipo) || { icon: '🧷', badgeClass: 'xixi' };
                return (
                  <div key={reg.id} className="feeding-card">
                    <div className="feeding-left">
                      <div className="feeding-icon-box" style={{ background: 'rgba(2, 132, 199, 0.1)', color: '#0284c7', fontSize: '1.2rem' }}>
                        {diaperMeta.icon}
                      </div>
                      <div>
                        <div className="feeding-time">{reg.hora}</div>
                        <div className="feeding-relative-time">
                          {dataSelecionada === hojeStr ? 'Hoje' : dataSelecionada}
                        </div>
                      </div>
                    </div>

                    <div className="btn-action-group">
                      <div className={`diaper-badge ${diaperMeta.badgeClass}`}>
                        <span>{diaperMeta.icon}</span>
                        <span>{reg.tipo}</span>
                      </div>

                      <button
                        className="btn-action-edit"
                        onClick={() => abrirEdicaoFralda(reg)}
                        title="Editar registo"
                      >
                        <Pencil size={17} />
                      </button>

                      <button
                        className="btn-action-delete"
                        onClick={() => setConfirmarDelete({ id: reg.id, type: 'fralda' })}
                        title="Apagar registo"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {confirmarDelete && (
        <div className="modal-overlay" onClick={() => setConfirmarDelete(null)}>
          <div className="modal-card" style={{ maxWidth: '400px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.5rem' }}>
              <AlertTriangle size={26} color="#ef4444" />
            </div>
            <div>
              <h3 style={{ margin: '0 0 0.35rem', fontSize: '1.15rem', fontWeight: 800 }}>
                Remover {confirmarDelete.type === 'leite' ? 'Registo de Leite' : 'Registo de Fralda'}?
              </h3>
              <p style={{ color: 'var(--color-text-light)', fontSize: '0.86rem', margin: 0 }}>
                Este registo será apagado permanentemente.
              </p>
            </div>
            <div className="form-actions" style={{ marginTop: '0.5rem' }}>
              <button className="btn-outline" onClick={() => setConfirmarDelete(null)}>
                <X size={16} /> Cancelar
              </button>
              <button
                className="btn-primary"
                style={{ background: '#ef4444', borderColor: '#ef4444', boxShadow: '0 4px 14px rgba(239,68,68,0.35)' }}
                onClick={apagarRegistoConfirmado}
              >
                <Trash2 size={16} /> Remover
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leite;
