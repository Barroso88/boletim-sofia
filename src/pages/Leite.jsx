import { useState, useEffect } from 'react';
import { format, parseISO, formatDistanceToNow, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, Milk, Trash2, Calendar as CalendarIcon, Clock, Minus, Sparkles, ChevronLeft, ChevronRight, Droplets, Layers, Pencil, AlertTriangle, X, BarChart2, TrendingUp, Award } from 'lucide-react';
import { api } from '../services/api';
import './Leite.css';

const PRESET_AMOUNTS = [30, 60, 90, 120, 150, 180, 210, 240];
const DIAPER_TYPES = [
  { id: 'Cocó', label: 'Cocó', icon: '💩', badgeClass: 'coco' },
  { id: 'Xixi', label: 'Xixi', icon: '💧', badgeClass: 'xixi' },
  { id: 'Cocó + Xixi', label: 'Cocó + Xixi', icon: '🧻', badgeClass: 'coco-xixi' },
];

const Leite = () => {
  const [activeSubTab, setActiveSubTab] = useState('leite'); // 'leite' | 'fraldas' | 'sonos'

  // Leite State
  const [registosLeite, setRegistosLeite] = useState([]);
  const [dataSelecionada, setDataSelecionada] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [adicionandoLeite, setAdicionandoLeite] = useState(false);
  const [editandoIdLeite, setEditandoIdLeite] = useState(null);
  const [novaHoraLeite, setNovaHoraLeite] = useState(format(new Date(), 'HH:mm'));
  const [novaQuantidade, setNovaQuantidade] = useState(150);
  const [mostrarRelatorioSemanal, setMostrarRelatorioSemanal] = useState(false);

  // Fraldas State
  const [registosFraldas, setRegistosFraldas] = useState([]);
  const [adicionandoFralda, setAdicionandoFralda] = useState(false);
  const [editandoIdFralda, setEditandoIdFralda] = useState(null);
  const [novaHoraFralda, setNovaHoraFralda] = useState(format(new Date(), 'HH:mm'));
  const [tipoFraldaSelecionado, setTipoFraldaSelecionado] = useState('Xixi');
  const [mostrarRelatorioFraldas, setMostrarRelatorioFraldas] = useState(false);

  // Sonos State
  const [registosSonos, setRegistosSonos] = useState([]);
  const [adicionandoSono, setAdicionandoSono] = useState(false);
  const [editandoIdSono, setEditandoIdSono] = useState(null);
  const [novaHoraInicioSono, setNovaHoraInicioSono] = useState(format(new Date(), 'HH:mm'));
  const [novaHoraFimSono, setNovaHoraFimSono] = useState('');
  const [mostrarRelatorioSonos, setMostrarRelatorioSonos] = useState(false);
  useEffect(() => {
    api.getLeite().then(data => setRegistosLeite(data));
    api.getFraldas().then(data => setRegistosFraldas(data));
    api.getSonos().then(data => setRegistosSonos(data));
  }, []);

  // --- RELATÓRIO SEMANAL CALCULATIONS ---
  const getDadosRelatorioSemanal = () => {
    const START_DATE_STR = '2026-08-05';
    const hoje = new Date();
    const dias = [];
    
    for (let i = 6; i >= 0; i--) {
      const d = subDays(hoje, i);
      const dateStr = format(d, 'yyyy-MM-dd');
      
      // Ignore days before tracking start date (05/08/2026)
      if (dateStr < START_DATE_STR) continue;

      const dayLabelRaw = format(d, 'eee', { locale: ptBR });
      const dayFullLabel = format(d, "eeee (dd/MM)", { locale: ptBR });
      
      const registosDoDia = registosLeite.filter(r => r.data === dateStr);
      const totalMl = registosDoDia.reduce((acc, r) => acc + (r.quantidade_ml || 0), 0);
      const count = registosDoDia.length;
      const avgMl = count > 0 ? Math.round(totalMl / count) : 0;

      const dayLabel = dayLabelRaw.charAt(0).toUpperCase() + dayLabelRaw.slice(1, 3);

      dias.push({
        dateStr,
        dayLabel,
        dayFullLabel: dayFullLabel.charAt(0).toUpperCase() + dayFullLabel.slice(1),
        totalMl,
        count,
        avgMl
      });
    }

    const numDiasValidos = Math.max(dias.length, 1);
    const totalSemanalMl = dias.reduce((sum, d) => sum + d.totalMl, 0);
    const totalSemanalMamadas = dias.reduce((sum, d) => sum + d.count, 0);
    const mediaDiariaMl = Math.round(totalSemanalMl / numDiasValidos);
    const mediaMamadasDia = (totalSemanalMamadas / numDiasValidos).toFixed(1);

    let maxDia = dias[0] || { totalMl: 0, dayLabel: '--' };
    dias.forEach(d => {
      if (d.totalMl > maxDia.totalMl) maxDia = d;
    });

    const maxMlGraph = Math.max(...dias.map(d => d.totalMl), 100);

    return {
      dias,
      totalSemanalMl,
      totalSemanalMamadas,
      mediaDiariaMl,
      mediaMamadasDia,
      maxDia,
      maxMlGraph,
      numDiasValidos
    };
  };

  // --- RELATÓRIO SEMANAL FRALDAS CALCULATIONS ---
  const getDadosRelatorioFraldas = () => {
    const START_DATE_STR = '2026-08-05';
    const hoje = new Date();
    const dias = [];
    
    for (let i = 6; i >= 0; i--) {
      const d = subDays(hoje, i);
      const dateStr = format(d, 'yyyy-MM-dd');
      
      if (dateStr < START_DATE_STR) continue;

      const dayLabelRaw = format(d, 'eee', { locale: ptBR });
      const dayFullLabel = format(d, "eeee (dd/MM)", { locale: ptBR });
      
      const registosDoDia = registosFraldas.filter(r => r.data === dateStr);
      const countTotal = registosDoDia.length;
      
      let countXixi = 0;
      let countCoco = 0;
      let countAmbos = 0;

      registosDoDia.forEach(r => {
        const t = (r.tipo || '').toLowerCase();
        if (t.includes('cocó') && t.includes('xixi')) countAmbos++;
        else if (t.includes('cocó')) countCoco++;
        else countXixi++;
      });

      const dayLabel = dayLabelRaw.charAt(0).toUpperCase() + dayLabelRaw.slice(1, 3);

      dias.push({
        dateStr,
        dayLabel,
        dayFullLabel: dayFullLabel.charAt(0).toUpperCase() + dayFullLabel.slice(1),
        countTotal,
        countXixi,
        countCoco,
        countAmbos
      });
    }

    const numDiasValidos = Math.max(dias.length, 1);
    const totalSemanalFraldas = dias.reduce((sum, d) => sum + d.countTotal, 0);
    const totalSemanalXixi = dias.reduce((sum, d) => sum + d.countXixi + d.countAmbos, 0);
    const totalSemanalCoco = dias.reduce((sum, d) => sum + d.countCoco + d.countAmbos, 0);
    
    const mediaDiariaFraldas = (totalSemanalFraldas / numDiasValidos).toFixed(1);

    let maxDia = dias[0] || { countTotal: 0, dayLabel: '--' };
    dias.forEach(d => {
      if (d.countTotal > maxDia.countTotal) maxDia = d;
    });

    const maxFraldasGraph = Math.max(...dias.map(d => d.countTotal), 5);

    return {
      dias,
      totalSemanalFraldas,
      totalSemanalXixi,
      totalSemanalCoco,
      mediaDiariaFraldas,
      maxDia,
      maxFraldasGraph,
      numDiasValidos
    };
  };

  // --- RELATÓRIO SEMANAL SONOS CALCULATIONS ---
  const getDadosRelatorioSonos = () => {
    const START_DATE_STR = '2026-08-05';
    const hoje = new Date();
    const dias = [];
    
    for (let i = 6; i >= 0; i--) {
      const d = subDays(hoje, i);
      const dateStr = format(d, 'yyyy-MM-dd');
      if (dateStr < START_DATE_STR) continue;

      const dayLabelRaw = format(d, 'eee', { locale: ptBR });
      const dayFullLabel = format(d, "eeee (dd/MM)", { locale: ptBR });
      
      const registosDoDia = registosSonos.filter(r => r.data === dateStr);
      const totalMinutos = registosDoDia.reduce((sum, r) => sum + r.duracao_minutos, 0);
      const numSestas = registosDoDia.length;

      const dayLabel = dayLabelRaw.charAt(0).toUpperCase() + dayLabelRaw.slice(1, 3);
      const horas = Math.floor(totalMinutos / 60);
      const minutos = totalMinutos % 60;
      const totalFormatado = `${horas}h ${minutos}m`;

      dias.push({
        dateStr,
        dayLabel,
        dayFullLabel: dayFullLabel.charAt(0).toUpperCase() + dayFullLabel.slice(1),
        totalMinutos,
        totalFormatado,
        numSestas
      });
    }

    const numDiasValidos = Math.max(dias.length, 1);
    const totalSemanalMinutos = dias.reduce((sum, d) => sum + d.totalMinutos, 0);
    const mediaDiariaMinutos = Math.round(totalSemanalMinutos / numDiasValidos);
    const horasMedia = Math.floor(mediaDiariaMinutos / 60);
    const minutosMedia = mediaDiariaMinutos % 60;
    const mediaDiariaFormatada = `${horasMedia}h ${minutosMedia}m`;

    let maxDia = dias[0] || { totalMinutos: 0, dayLabel: '--' };
    dias.forEach(d => {
      if (d.totalMinutos > maxDia.totalMinutos) maxDia = d;
    });

    const maxMinutosGraph = Math.max(...dias.map(d => d.totalMinutos), 60); // min 1h

    return {
      dias,
      mediaDiariaFormatada,
      totalSemanalSestas: dias.reduce((sum, d) => sum + d.numSestas, 0),
      maxDia,
      maxMinutosGraph,
      numDiasValidos
    };
  };

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

  // --- SONOS CALCULATIONS ---
  const registosSonosDoDia = registosSonos
    .filter(r => r.data === dataSelecionada)
    .sort((a, b) => b.hora_inicio.localeCompare(a.hora_inicio));

  const totalMinutosDoDia = registosSonosDoDia.reduce((sum, r) => sum + r.duracao_minutos, 0);
  const totalHorasSono = Math.floor(totalMinutosDoDia / 60);
  const totalMinutosResto = totalMinutosDoDia % 60;
  const totalSonoFormatado = `${totalHorasSono}h ${totalMinutosResto}m`;

  const calcularDuracao = (inicio, fim) => {
    if (!inicio || !fim) return 0;
    const [hI, mI] = inicio.split(':').map(Number);
    const [hF, mF] = fim.split(':').map(Number);
    let duracao = (hF * 60 + mF) - (hI * 60 + mI);
    if (duracao < 0) {
      duracao += 24 * 60; // Passou da meia-noite
    }
    return duracao;
  };

  const duracaoPrevista = calcularDuracao(novaHoraInicioSono, novaHoraFimSono);
  const horasPrevistas = Math.floor(duracaoPrevista / 60);
  const minutosPrevistos = duracaoPrevista % 60;

  const abrirEdicaoSono = (reg) => {
    setEditandoIdSono(reg.id);
    setNovaHoraInicioSono(reg.hora_inicio);
    setNovaHoraFimSono(reg.hora_fim);
    setAdicionandoSono(true);
  };

  const adicionarRegistoSono = (e) => {
    e.preventDefault();
    if (!novaHoraInicioSono) return;
    const duracao = novaHoraFimSono ? calcularDuracao(novaHoraInicioSono, novaHoraFimSono) : 0;
    if (novaHoraFimSono && duracao === 0) return; // Evitar registos de 0 min se tiver hora fim
    
    const registo = {
      id: editandoIdSono || Date.now(),
      data: dataSelecionada,
      hora_inicio: novaHoraInicioSono,
      hora_fim: novaHoraFimSono || "",
      duracao_minutos: duracao,
    };
    setRegistosSonos(prev => {
      const exists = prev.some(r => r.id === registo.id);
      if (exists) return prev.map(r => r.id === registo.id ? registo : r);
      return [registo, ...prev];
    });
    api.saveSono(registo);
    setAdicionandoSono(false);
    setEditandoIdSono(null);
  };

  const terminarSono = (reg) => {
    const horaAtual = format(new Date(), 'HH:mm');
    const duracao = calcularDuracao(reg.hora_inicio, horaAtual);
    const novoRegisto = { ...reg, hora_fim: horaAtual, duracao_minutos: duracao };
    
    setRegistosSonos(prev => prev.map(r => r.id === reg.id ? novoRegisto : r));
    api.saveSono(novoRegisto);
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
    } else if (type === 'sono') {
      setRegistosSonos(prev => prev.filter(s => s.id !== id));
      api.deleteSono(id);
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
        <h1 className="page-title">
          <span>Leite & Fraldas & Sono</span>
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
        <button
          className={`sub-tab-btn ${activeSubTab === 'sonos' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('sonos')}
        >
          <Clock size={18} />
          <span>Sono</span>
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

          {/* Button to Open Weekly Feeding Report */}
          <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center' }}>
            <button
              className="btn-weekly-report"
              onClick={() => setMostrarRelatorioSemanal(true)}
            >
              <BarChart2 size={20} />
              <span>Ver Relatório Semanal das Mamadas</span>
            </button>
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
                )
              })
            )}
          </div>

          {/* Button to Open Weekly Diaper Report */}
          <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center' }}>
            <button
              className="btn-weekly-report btn-weekly-report-diapers"
              onClick={() => setMostrarRelatorioFraldas(true)}
            >
              <BarChart2 size={20} />
              <span>Ver Relatório Semanal de Fraldas</span>
            </button>
          </div>
        </>
      )}

      {/* ─── TAB 3: SONOS ────────────────────────────────────────────────── */}
      {activeSubTab === 'sonos' && (
        <>
          {/* Hero Stats Card */}
          <div className="leite-hero-card">
            <div className="hero-top-row">
              <div className="hero-title-group">
                <div className="icon-badge-glow" style={{ background: 'linear-gradient(135deg, #8b5cf6, #c084fc)' }}>
                  <Clock size={26} />
                </div>
                <div>
                  <h2 className="hero-day-title">{diaDaSemana}</h2>
                  <p className="hero-day-subtitle">Resumo de sonos</p>
                </div>
              </div>
            </div>

            <div className="hero-main-stat">
              <span className="hero-stat-value">{totalSonoFormatado.split('h')[0]}</span>
              <span className="hero-stat-unit">h {totalSonoFormatado.split(' ')[1]} de sono</span>
            </div>

            <div className="hero-grid-stats">
              <div className="substat-card">
                <div className="substat-val">{registosSonosDoDia.length}</div>
                <div className="substat-lbl">Sestas/Sonos</div>
              </div>
              <div className="substat-card">
                <div className="substat-val">{totalHorasSono}h {totalMinutosResto}m</div>
                <div className="substat-lbl">Total Diário</div>
              </div>
            </div>
          </div>

          {/* Quick Add Form */}
          {!adicionandoSono ? (
            <button
              className="btn-quick-add"
              style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #c084fc 100%)', boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)' }}
              onClick={() => {
                setAdicionandoSono(true);
                setNovaHoraInicioSono(format(new Date(), 'HH:mm'));
                setNovaHoraFimSono('');
              }}
            >
              <Plus size={22} />
              <span>Registar Novo Sono</span>
            </button>
          ) : (
            <form className="add-form-card" onSubmit={adicionarRegistoSono}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 className="h3 flex-center" style={{ gap: '0.5rem', color: '#8b5cf6' }}>
                  <Clock size={20} />
                  <span>Registar Sono</span>
                </h3>
                <span className="text-secondary" style={{ fontSize: '0.85rem' }}>{dataSelecionada}</span>
              </div>

              <div className="time-input-group" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <div className="form-section-title">Hora Início</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0,0,0,0.03)', padding: '0.75rem 1rem', borderRadius: '14px', border: '1px solid var(--color-border)' }}>
                    <Clock size={18} className="text-secondary" />
                    <input
                      type="time"
                      value={novaHoraInicioSono}
                      onChange={(e) => setNovaHoraInicioSono(e.target.value)}
                      style={{ border: 'none', background: 'transparent', width: '100%', fontSize: '1.1rem', fontWeight: '700', outline: 'none', color: 'var(--color-text)' }}
                      required
                    />
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div className="form-section-title">Hora Fim</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0,0,0,0.03)', padding: '0.75rem 1rem', borderRadius: '14px', border: '1px solid var(--color-border)' }}>
                    <Clock size={18} className="text-secondary" />
                    <input
                      type="time"
                      value={novaHoraFimSono}
                      onChange={(e) => setNovaHoraFimSono(e.target.value)}
                      style={{ border: 'none', background: 'transparent', width: '100%', fontSize: '1.1rem', fontWeight: '700', outline: 'none', color: 'var(--color-text)' }}
                    />
                  </div>
                </div>
              </div>

              {novaHoraFimSono ? (
                <div className="duracao-estimada" style={{ background: '#f3f4f6', borderRadius: '12px', padding: '1rem', textAlign: 'center', marginBottom: '1.5rem' }}>
                  <span style={{ display: 'block', fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.25rem' }}>Duração do Sono</span>
                  <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#8b5cf6' }}>
                    {horasPrevistas}h {minutosPrevistos}m
                  </span>
                </div>
              ) : (
                <div className="duracao-estimada" style={{ background: 'rgba(139,92,246,0.1)', borderRadius: '12px', padding: '1rem', textAlign: 'center', marginBottom: '1.5rem', color: '#8b5cf6' }}>
                  <span style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem', fontWeight: 600 }}>Em curso...</span>
                  <span style={{ fontSize: '0.85rem' }}>A duração será calculada quando a Sofia acordar.</span>
                </div>
              )}

              <div className="form-actions">
                <button type="button" className="btn-outline" onClick={() => {
                  setAdicionandoSono(false);
                  setEditandoIdSono(null);
                }}>
                  <X size={18} /> Cancelar
                </button>
                <button type="submit" className="btn-primary" style={{ background: 'linear-gradient(135deg, #8b5cf6, #c084fc)' }}>
                  <Clock size={18} /> Guardar Sono
                </button>
              </div>
            </form>
          )}

          {/* Listagem de Sonos */}
          <div className="feedings-list">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 0.5rem', marginBottom: '0.25rem' }}>
              <h3 className="h3" style={{ fontSize: '1.1rem', margin: 0 }}>Registos de {diaDaSemana.split(',')[0]}</h3>
              <span className="badge-ml" style={{ background: '#f3f4f6', color: '#6b7280' }}>
                {registosSonosDoDia.length} {registosSonosDoDia.length === 1 ? 'registo' : 'registos'}
              </span>
            </div>

            {registosSonosDoDia.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon-wrap" style={{ background: 'rgba(139,92,246,0.1)' }}>
                  <Clock size={32} color="#8b5cf6" />
                </div>
                <p>Nenhum sono registado neste dia.</p>
              </div>
            ) : (
              <>
                {registosSonosDoDia.map((reg) => {
                  const hrs = Math.floor(reg.duracao_minutos / 60);
                  const mins = reg.duracao_minutos % 60;
                  return (
                    <div key={reg.id} className="feeding-card" style={{ borderLeft: '4px solid #8b5cf6' }}>
                      <div className="feeding-left">
                        <div className="feeding-icon-box" style={{ color: '#8b5cf6', background: 'rgba(139,92,246,0.1)' }}>
                          <Clock size={20} />
                        </div>
                        <div>
                          <div className="feeding-time">
                            {reg.hora_inicio} - {reg.hora_fim ? reg.hora_fim : <span style={{ color: '#8b5cf6', fontSize: '0.9rem', fontStyle: 'italic' }}>A dormir...</span>}
                          </div>
                          <div className="text-secondary" style={{ fontSize: '0.85rem' }}>
                            {reg.hora_fim ? (
                              <>{hrs > 0 ? `${hrs}h ` : ''}{mins}m</>
                            ) : (
                              'Em curso'
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="btn-action-group">
                        {!reg.hora_fim && (
                          <button 
                            className="btn-action-edit" 
                            style={{ background: '#8b5cf6', color: 'white', padding: '0.4rem 0.8rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }} 
                            onClick={() => terminarSono(reg)}
                          >
                            Acordou
                          </button>
                        )}
                        <button className="btn-action-edit" onClick={() => abrirEdicaoSono(reg)} title="Editar">
                          <Pencil size={18} />
                        </button>
                        <button className="btn-action-delete" onClick={() => setConfirmarDelete({ id: reg.id, type: 'sono' })} title="Apagar">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>

          <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center' }}>
            <button
              className="btn-weekly-report"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #c084fc)', color: '#fff', borderColor: 'transparent' }}
              onClick={() => setMostrarRelatorioSonos(true)}
            >
              <BarChart2 size={20} />
              <span>Ver Relatório Semanal de Sonos</span>
            </button>
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
                Remover {confirmarDelete.type === 'leite' ? 'Registo de Leite' : confirmarDelete.type === 'fralda' ? 'Registo de Fralda' : 'Registo de Sono'}?
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

      {/* Modal de Relatório Semanal de Mamadas */}
      {mostrarRelatorioSemanal && (() => {
        const relatorio = getDadosRelatorioSemanal();
        return (
          <div className="modal-overlay" onClick={() => setMostrarRelatorioSemanal(false)}>
            <div className="modal-card weekly-report-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <div className="modal-title-group">
                  <div className="icon-badge-glow" style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))' }}>
                    <BarChart2 size={22} />
                  </div>
                  <div>
                    <h2 className="modal-title">Relatório Semanal das Mamadas</h2>
                    <p className="modal-subtitle">
                      {relatorio.numDiasValidos < 7
                        ? `Resumo dos registos (desde 05/08 · ${relatorio.numDiasValidos} ${relatorio.numDiasValidos === 1 ? 'dia' : 'dias'})`
                        : 'Resumo dos últimos 7 dias da Sofia'}
                    </p>
                  </div>
                </div>
                <button className="btn-action-close" onClick={() => setMostrarRelatorioSemanal(false)}>
                  <X size={20} />
                </button>
              </div>

              <div className="modal-body">
                {/* 4 Cards de Métricas */}
                <div className="weekly-stats-grid">
                  <div className="weekly-stat-card">
                    <div className="weekly-stat-icon text-primary"><TrendingUp size={18} /></div>
                    <div className="weekly-stat-val">{relatorio.mediaDiariaMl} <span className="stat-unit">ml</span></div>
                    <div className="weekly-stat-lbl">Média Diária</div>
                  </div>

                  <div className="weekly-stat-card">
                    <div className="weekly-stat-icon text-secondary"><Milk size={18} /></div>
                    <div className="weekly-stat-val">{relatorio.totalSemanalMl} <span className="stat-unit">ml</span></div>
                    <div className="weekly-stat-lbl">{relatorio.numDiasValidos < 7 ? `Total (${relatorio.numDiasValidos}d)` : 'Total 7 Dias'}</div>
                  </div>

                  <div className="weekly-stat-card">
                    <div className="weekly-stat-icon" style={{ color: '#8b5cf6' }}><Clock size={18} /></div>
                    <div className="weekly-stat-val">{relatorio.mediaMamadasDia}</div>
                    <div className="weekly-stat-lbl">Mamadas / Dia</div>
                  </div>

                  <div className="weekly-stat-card">
                    <div className="weekly-stat-icon" style={{ color: '#f59e0b' }}><Award size={18} /></div>
                    <div className="weekly-stat-val">{relatorio.maxDia.totalMl} <span className="stat-unit">ml</span></div>
                    <div className="weekly-stat-lbl">Dia de Pico ({relatorio.maxDia.dayLabel})</div>
                  </div>
                </div>

                {/* Gráfico de Barras dos 7 Dias */}
                <div className="weekly-chart-card">
                  <h3 className="chart-title">Consumo Diário (desde 05/08)</h3>
                  <div className="bars-container">
                    {relatorio.dias.map(d => {
                      const heightPct = Math.round((d.totalMl / relatorio.maxMlGraph) * 100);
                      const isMax = d.dateStr === relatorio.maxDia.dateStr && d.totalMl > 0;
                      return (
                        <div key={d.dateStr} className="bar-column">
                          <div className="bar-val">{d.totalMl > 0 ? `${d.totalMl}` : ''}</div>
                          <div className="bar-track">
                            <div
                              className={`bar-fill ${isMax ? 'max-bar' : ''}`}
                              style={{ height: `${Math.max(heightPct, 6)}%` }}
                              title={`${d.totalMl} ml (${d.count} mamadas)`}
                            />
                          </div>
                          <div className="bar-label">{d.dayLabel}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Tabela Detalhada por Dia */}
                <div className="weekly-table-card">
                  <h3 className="chart-title">Detalhamento por Dia</h3>
                  <div className="weekly-table-wrapper">
                    <table className="weekly-table">
                      <thead>
                        <tr>
                          <th>Dia / Data</th>
                          <th>Total (ml)</th>
                          <th>N.º Mamadas</th>
                          <th className="hide-mobile">Média / Mamada</th>
                        </tr>
                      </thead>
                      <tbody>
                        {relatorio.dias.slice().reverse().map(d => (
                          <tr key={d.dateStr}>
                            <td><strong>{d.dayFullLabel}</strong></td>
                            <td><span className="badge-ml">{d.totalMl} ml</span></td>
                            <td>{d.count} mamadas</td>
                            <td className="hide-mobile">{d.avgMl > 0 ? `${d.avgMl} ml` : '--'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal de Relatório Semanal de Fraldas */}
      {mostrarRelatorioFraldas && (() => {
        const relatorio = getDadosRelatorioFraldas();
        return (
          <div className="modal-overlay" onClick={() => setMostrarRelatorioFraldas(false)}>
            <div className="modal-card weekly-report-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <div className="modal-title-group">
                  <div className="icon-badge-glow" style={{ background: 'linear-gradient(135deg, #0284c7, #6366f1)' }}>
                    <BarChart2 size={22} />
                  </div>
                  <div>
                    <h2 className="modal-title">Relatório Semanal de Fraldas</h2>
                    <p className="modal-subtitle">
                      {relatorio.numDiasValidos < 7
                        ? `Resumo dos registos (desde 05/08 · ${relatorio.numDiasValidos} ${relatorio.numDiasValidos === 1 ? 'dia' : 'dias'})`
                        : 'Resumo dos últimos 7 dias da Sofia'}
                    </p>
                  </div>
                </div>
                <button className="btn-action-close" onClick={() => setMostrarRelatorioFraldas(false)}>
                  <X size={20} />
                </button>
              </div>

              <div className="modal-body">
                {/* 4 Cards de Métricas */}
                <div className="weekly-stats-grid">
                  <div className="weekly-stat-card">
                    <div className="weekly-stat-icon" style={{ color: '#0284c7' }}><TrendingUp size={18} /></div>
                    <div className="weekly-stat-val">{relatorio.mediaDiariaFraldas}</div>
                    <div className="weekly-stat-lbl">Média / Dia</div>
                  </div>

                  <div className="weekly-stat-card">
                    <div className="weekly-stat-icon" style={{ color: '#0284c7' }}><Sparkles size={18} /></div>
                    <div className="weekly-stat-val">{relatorio.totalSemanalXixi}</div>
                    <div className="weekly-stat-lbl">Trocas com Xixi 💧</div>
                  </div>

                  <div className="weekly-stat-card">
                    <div className="weekly-stat-icon" style={{ color: '#c2410c' }}><Sparkles size={18} /></div>
                    <div className="weekly-stat-val">{relatorio.totalSemanalCoco}</div>
                    <div className="weekly-stat-lbl">Trocas com Cocó 💩</div>
                  </div>

                  <div className="weekly-stat-card">
                    <div className="weekly-stat-icon" style={{ color: '#f59e0b' }}><Award size={18} /></div>
                    <div className="weekly-stat-val">{relatorio.maxDia.countTotal}</div>
                    <div className="weekly-stat-lbl">Dia de Pico ({relatorio.maxDia.dayLabel})</div>
                  </div>
                </div>

                {/* Gráfico de Barras dos 7 Dias */}
                <div className="weekly-chart-card">
                  <h3 className="chart-title">Trocas Diárias (desde 05/08)</h3>
                  <div className="bars-container">
                    {relatorio.dias.map(d => {
                      const heightPct = Math.round((d.countTotal / relatorio.maxFraldasGraph) * 100);
                      const isMax = d.dateStr === relatorio.maxDia.dateStr && d.countTotal > 0;
                      return (
                        <div key={d.dateStr} className="bar-column">
                          <div className="bar-val">{d.countTotal > 0 ? `${d.countTotal}` : ''}</div>
                          <div className="bar-track">
                            <div
                              className={`bar-fill bar-fill-diaper ${isMax ? 'max-bar' : ''}`}
                              style={{ height: `${Math.max(heightPct, 6)}%` }}
                              title={`${d.countTotal} fraldas (💧${d.countXixi} | 💩${d.countCoco} | 🧻${d.countAmbos})`}
                            />
                          </div>
                          <div className="bar-label">{d.dayLabel}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Tabela Detalhada por Dia */}
                <div className="weekly-table-card">
                  <h3 className="chart-title">Detalhamento por Dia</h3>
                  <div className="weekly-table-wrapper">
                    <table className="weekly-table">
                      <thead>
                        <tr>
                          <th>Dia / Data</th>
                          <th>Total Fraldas</th>
                          <th>Xixi 💧</th>
                          <th>Cocó 💩</th>
                          <th className="hide-mobile">Ambos 🧻</th>
                        </tr>
                      </thead>
                      <tbody>
                        {relatorio.dias.slice().reverse().map(d => (
                          <tr key={d.dateStr}>
                            <td><strong>{d.dayFullLabel}</strong></td>
                            <td><span className="badge-diaper">{d.countTotal} fraldas</span></td>
                            <td>{d.countXixi + d.countAmbos}</td>
                            <td>{d.countCoco + d.countAmbos}</td>
                            <td className="hide-mobile">{d.countAmbos}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal de Relatório Semanal de Sonos */}
      {mostrarRelatorioSonos && (() => {
        const relatorio = getDadosRelatorioSonos();
        return (
          <div className="modal-overlay" onClick={() => setMostrarRelatorioSonos(false)}>
            <div className="modal-card weekly-report-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <div className="modal-title-group">
                  <div className="icon-badge-glow" style={{ background: 'linear-gradient(135deg, #8b5cf6, #c084fc)' }}>
                    <BarChart2 size={22} />
                  </div>
                  <div>
                    <h2 className="modal-title">Relatório Semanal de Sonos</h2>
                    <p className="modal-subtitle">
                      {relatorio.numDiasValidos < 7
                        ? `Resumo dos registos (desde 05/08 · ${relatorio.numDiasValidos} ${relatorio.numDiasValidos === 1 ? 'dia' : 'dias'})`
                        : 'Resumo dos últimos 7 dias da Sofia'}
                    </p>
                  </div>
                </div>
                <button className="btn-action-close" onClick={() => setMostrarRelatorioSonos(false)}>
                  <X size={20} />
                </button>
              </div>

              <div className="modal-body">
                {/* Cards de Métricas */}
                <div className="weekly-stats-grid">
                  <div className="weekly-stat-card">
                    <div className="weekly-stat-icon" style={{ color: '#8b5cf6' }}><TrendingUp size={18} /></div>
                    <div className="weekly-stat-val">{relatorio.mediaDiariaFormatada}</div>
                    <div className="weekly-stat-lbl">Média / Dia</div>
                  </div>

                  <div className="weekly-stat-card">
                    <div className="weekly-stat-icon" style={{ color: '#8b5cf6' }}><Clock size={18} /></div>
                    <div className="weekly-stat-val">{relatorio.totalSemanalSestas}</div>
                    <div className="weekly-stat-lbl">Sestas na Semana</div>
                  </div>

                  <div className="weekly-stat-card">
                    <div className="weekly-stat-icon" style={{ color: '#f59e0b' }}><Award size={18} /></div>
                    <div className="weekly-stat-val">{relatorio.maxDia.totalFormatado}</div>
                    <div className="weekly-stat-lbl">Dia de Pico ({relatorio.maxDia.dayLabel})</div>
                  </div>
                </div>

                {/* Gráfico de Barras dos 7 Dias */}
                <div className="weekly-chart-card">
                  <h3 className="chart-title">Sonos Diários (desde 05/08)</h3>
                  <div className="bars-container">
                    {relatorio.dias.map(d => {
                      const heightPct = Math.round((d.totalMinutos / relatorio.maxMinutosGraph) * 100);
                      const isMax = d.dateStr === relatorio.maxDia.dateStr && d.totalMinutos > 0;
                      return (
                        <div key={d.dateStr} className="bar-column">
                          <div className="bar-val">{d.totalMinutos > 0 ? d.totalFormatado.replace(' ', '') : ''}</div>
                          <div className="bar-track">
                            <div
                              className={`bar-fill ${isMax ? 'max-bar' : ''}`}
                              style={{ height: `${Math.max(heightPct, 6)}%`, background: isMax ? 'linear-gradient(to top, #8b5cf6, #c084fc)' : '#c4b5fd' }}
                              title={`${d.totalFormatado} (${d.numSestas} sestas)`}
                            />
                          </div>
                          <div className="bar-label">{d.dayLabel}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Tabela Detalhada por Dia */}
                <div className="weekly-table-card">
                  <h3 className="chart-title">Detalhamento por Dia</h3>
                  <div className="weekly-table-wrapper">
                    <table className="weekly-table">
                      <thead>
                        <tr>
                          <th>Dia / Data</th>
                          <th>Tempo Total</th>
                          <th>N.º Sestas</th>
                        </tr>
                      </thead>
                      <tbody>
                        {relatorio.dias.slice().reverse().map(d => (
                          <tr key={d.dateStr}>
                            <td><strong>{d.dayFullLabel}</strong></td>
                            <td><span className="badge-ml" style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}>{d.totalFormatado}</span></td>
                            <td>{d.numSestas} sestas</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default Leite;
