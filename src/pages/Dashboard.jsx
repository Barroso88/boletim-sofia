import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { differenceInMonths, differenceInDays, differenceInYears, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Syringe, Milk, Sparkles, Clock, Moon, Layers } from 'lucide-react';
import { api } from '../services/api';
import { defaultVacinas } from '../data/defaultVacinas';
import biberaoIcon from '../assets/icons/baby-bottle.png';
import fraldaIcon from '../assets/icons/diaper.png';
import dormirIcon from '../assets/icons/baby-sleep.png';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const birthDate = new Date(2026, 6, 13); // 13 de Julho de 2026
  const now = new Date();
  
  // Age Calculation
  const years = differenceInYears(now, birthDate);
  const dateAfterYears = new Date(birthDate);
  dateAfterYears.setFullYear(birthDate.getFullYear() + years);
  const months = differenceInMonths(now, dateAfterYears);
  const dateAfterMonths = new Date(dateAfterYears);
  dateAfterMonths.setMonth(dateAfterYears.getMonth() + months);
  const days = differenceInDays(now, dateAfterMonths);
  const age = { years, months, days };

  // Data State
  const [eventos, setEventos] = useState([]);
  const [vacinas, setVacinas] = useState([]);
  const [registosLeite, setRegistosLeite] = useState([]);
  const [registosFraldas, setRegistosFraldas] = useState([]);
  const [registosSonos, setRegistosSonos] = useState([]);

  useEffect(() => {
    api.getAgenda().then(data => setEventos(data));
    api.getVacinas(defaultVacinas).then(data => setVacinas(data));
    api.getLeite().then(data => setRegistosLeite(data || []));
    api.getFraldas().then(data => setRegistosFraldas(data || []));
    api.getSonos().then(data => setRegistosSonos(data || []));
  }, []);

  // Filter 5 Consultas
  const getConsultas = (futuras) => {
    const hoje = new Date();
    const filtradas = eventos.filter(e => {
      if (e.tipo !== 'Consulta') return false;
      const d = new Date(e.data);
      return futuras ? d >= hoje : d < hoje;
    });

    filtradas.sort((a, b) => {
      const dA = new Date(a.data).getTime();
      const dB = new Date(b.data).getTime();
      return futuras ? dA - dB : dB - dA;
    });

    return filtradas.slice(0, 5).map(c => ({
      id: c.id,
      titulo: c.titulo,
      dataFormatted: format(new Date(c.data), "d MMM, HH:mm", { locale: ptBR })
    }));
  };

  // Filter 5 Vacinas
  const getVacinas = (futuras) => {
    const listToUse = (vacinas && vacinas.length > 0) ? vacinas : defaultVacinas;

    if (futuras) {
      const pnvFuturas = listToUse.filter(v => !v.tomada).map(v => ({
        id: `pnv-${v.id}`,
        titulo: v.nome,
        dataFormatted: v.dataRecomendada,
        subtext: `Grupo: ${v.grupo}`
      }));

      const agendaFuturas = eventos.filter(e => {
        if (e.tipo !== 'Vacina') return false;
        return new Date(e.data) >= new Date();
      }).map(e => ({
        id: `agenda-${e.id}`,
        titulo: e.titulo,
        dataFormatted: format(new Date(e.data), "d MMM, HH:mm", { locale: ptBR }),
        subtext: 'Agendada na Agenda'
      }));

      return [...pnvFuturas, ...agendaFuturas].slice(0, 5);
    } else {
      const pnvPassadas = listToUse.filter(v => v.tomada || Boolean(v.dataAdministrada)).map(v => ({
        id: `pnv-${v.id}`,
        titulo: v.nome,
        dataFormatted: v.dataAdministrada ? `✓ ${v.dataAdministrada}` : '✓ Administrada',
        subtext: `PNV (${v.grupo || 'Administrada'})`
      }));

      const agendaPassadas = eventos.filter(e => {
        if (e.tipo !== 'Vacina') return false;
        return new Date(e.data) < new Date();
      }).map(e => ({
        id: `agenda-${e.id}`,
        titulo: e.titulo,
        dataFormatted: format(new Date(e.data), "d MMM, HH:mm", { locale: ptBR }),
        subtext: 'Realizada'
      }));

      return [...pnvPassadas, ...agendaPassadas].slice(0, 5);
    }
  };

  const consultasPassadas = getConsultas(false);
  const consultasFuturas = getConsultas(true);
  const vacinasPassadas = getVacinas(false);
  const vacinasFuturas = getVacinas(true);

  // Quick Snapshot Calculations
  const sortedLeite = [...registosLeite].sort((a, b) => {
    const dtA = `${a.data}T${a.hora}`;
    const dtB = `${b.data}T${b.hora}`;
    return dtB.localeCompare(dtA);
  });
  const ultimaMamada = sortedLeite[0];

  const sortedFraldas = [...registosFraldas].sort((a, b) => {
    const dtA = `${a.data}T${a.hora}`;
    const dtB = `${b.data}T${b.hora}`;
    return dtB.localeCompare(dtA);
  });
  const ultimaFralda = sortedFraldas[0];

  const sortedSonos = [...registosSonos].sort((a, b) => {
    const dtA = `${a.data}T${a.hora_inicio}`;
    const dtB = `${b.data}T${b.hora_inicio}`;
    return dtB.localeCompare(dtA);
  });
  const ultimoSono = sortedSonos[0];

  const getTempoDecorredor = (dataStr, horaStr) => {
    if (!dataStr || !horaStr) return null;
    try {
      const past = new Date(`${dataStr}T${horaStr}:00`);
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

  const formatDataLabel = (dataStr) => {
    if (!dataStr) return '';
    const hoje = format(new Date(), 'yyyy-MM-dd');
    if (dataStr === hoje) return 'Hoje';
    try {
      const [ano, mes, dia] = dataStr.split('-');
      return `${dia}/${mes}`;
    } catch (e) {
      return dataStr;
    }
  };

  const getFraldaInfo = (tipo) => {
    if (!tipo) return { cls: 'xixi', icon: '💧' };
    const t = tipo.toLowerCase();
    if (t.includes('cocó') && t.includes('xixi')) return { cls: 'ambos', icon: '🧻' };
    if (t.includes('cocó')) return { cls: 'coco', icon: '💩' };
    return { cls: 'xixi', icon: '💧' };
  };

  const renderList = (items, emptyMessage, isPast = false) => {
    if (!items || items.length === 0) {
      return <div className="no-events">{emptyMessage}</div>;
    }
    return (
      <div className="event-list">
        {items.map(item => (
          <div key={item.id} className="event-item">
            <div className="event-header">
              <span className="event-title">{item.titulo}</span>
              <span className={`event-date ${isPast ? 'past' : ''}`}>
                {item.dataFormatted}
              </span>
            </div>
            {item.subtext && (
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', marginTop: '2px' }}>
                {item.subtext}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="dashboard">
      <div className="hero-card glass-card">
        <div className="age-stats">
          <div className="stat-box box-years">
            <span className="stat-value">{age.years}</span>
            <span className="stat-label">Anos</span>
          </div>
          <div className="stat-box box-months">
            <span className="stat-value">{age.months}</span>
            <span className="stat-label">Meses</span>
          </div>
          <div className="stat-box box-days">
            <span className="stat-value">{age.days}</span>
            <span className="stat-label">Dias</span>
          </div>
        </div>
      </div>


      {/* Quick View Snapshots: Última Mamada & Última Fralda */}
      <div className="quick-snapshots-grid">
        {/* Card 1: Última Mamada */}
        <div 
          className="quick-snapshot-card milk-card glass-card"
          onClick={() => {
            sessionStorage.setItem('leite_active_tab', 'leite');
            navigate('/leite');
          }}
          style={{ cursor: 'pointer' }}
        >
          <div className="snapshot-header">
            <div className="snapshot-title-group">
              <div className="snapshot-icon-badge">
                <img src={biberaoIcon} alt="Biberão" style={{ width: '38px', height: '38px', objectFit: 'contain' }} />
              </div>
              <div>
                <h3 className="snapshot-title">Última Mamada</h3>
                <p className="snapshot-subtitle">Alimentação</p>
              </div>
            </div>
            {ultimaMamada && (
              <div className="snapshot-timer-pill">
                <Clock size={13} />
                <span>há {getTempoDecorredor(ultimaMamada.data, ultimaMamada.hora)}</span>
              </div>
            )}
          </div>

          {ultimaMamada ? (
            <div className="snapshot-body">
              <div className="snapshot-primary-val">
                {ultimaMamada.quantidade_ml} <span className="snapshot-unit">ml</span>
              </div>
              <div className="snapshot-meta">
                <span>às <strong>{ultimaMamada.hora}</strong> ({formatDataLabel(ultimaMamada.data)})</span>
              </div>
            </div>
          ) : (
            <div className="snapshot-empty">Sem registos de leite</div>
          )}
        </div>

        {/* Card 2: Última Fralda */}
        <div 
          className="quick-snapshot-card diaper-card glass-card"
          onClick={() => {
            sessionStorage.setItem('leite_active_tab', 'fraldas');
            navigate('/leite');
          }}
          style={{ cursor: 'pointer' }}
        >
          <div className="snapshot-header">
            <div className="snapshot-title-group">
              <div className="snapshot-icon-badge">
                <img src={fraldaIcon} alt="Fralda" style={{ width: '38px', height: '38px', objectFit: 'contain' }} />
              </div>
              <div>
                <h3 className="snapshot-title">Última Fralda</h3>
                <p className="snapshot-subtitle">Higiene</p>
              </div>
            </div>
            {ultimaFralda && (
              <div className="snapshot-timer-pill">
                <Clock size={13} />
                <span>há {getTempoDecorredor(ultimaFralda.data, ultimaFralda.hora)}</span>
              </div>
            )}
          </div>

          {ultimaFralda ? (
            <div className="snapshot-body">
              <div className={`snapshot-type-tag type-${getFraldaInfo(ultimaFralda.tipo).cls}`}>
                <span style={{ marginRight: '6px' }}>{getFraldaInfo(ultimaFralda.tipo).icon}</span>
                {ultimaFralda.tipo}
              </div>
              <div className="snapshot-meta">
                <span>às <strong>{ultimaFralda.hora}</strong> ({formatDataLabel(ultimaFralda.data)})</span>
              </div>
            </div>
          ) : (
            <div className="snapshot-empty">Sem registos de fralda</div>
          )}
        </div>

        {/* Card 3: Último Sono */}
        <div 
          className="quick-snapshot-card sleep-card glass-card" 
          onClick={() => {
            sessionStorage.setItem('leite_active_tab', 'sonos');
            navigate('/leite');
          }}
          style={{ cursor: 'pointer', background: 'linear-gradient(135deg, rgba(245, 243, 255, 0.95), rgba(2ede, 233, 254, 0.85))', border: '1px solid rgba(139, 92, 246, 0.35)', borderBottom: '3px solid rgba(124, 58, 237, 0.8)', boxShadow: '0 8px 32px -4px rgba(139, 92, 246, 0.25), inset 0 0 12px rgba(255, 255, 255, 0.7)' }}
        >
          <div className="snapshot-header">
            <div className="snapshot-title-group">
              <div className="snapshot-icon-badge">
                <img src={dormirIcon} alt="Dormir" style={{ width: '38px', height: '38px', objectFit: 'contain' }} />
              </div>
              <div>
                <h3 className="snapshot-title">Último Sono</h3>
                <p className="snapshot-subtitle">Descanso</p>
              </div>
            </div>
            {ultimoSono && ultimoSono.hora_fim && (
              <div className="snapshot-timer-pill" style={{ color: '#8b5cf6', background: 'rgba(139, 92, 246, 0.08)', borderColor: 'rgba(139, 92, 246, 0.15)' }}>
                <Clock size={13} />
                <span>acordou há {getTempoDecorredor(ultimoSono.data, ultimoSono.hora_fim)}</span>
              </div>
            )}
          </div>

          {ultimoSono ? (
            <div className="snapshot-body" style={{ alignItems: 'center' }}>
              <div className="snapshot-primary-val" style={{ color: '#8b5cf6', fontSize: '1.5rem' }}>
                {ultimoSono.hora_fim ? (
                  <>
                    {Math.floor(ultimoSono.duracao_minutos / 60)}<span className="snapshot-unit" style={{marginRight: '4px'}}>h</span>
                    {ultimoSono.duracao_minutos % 60}<span className="snapshot-unit">m</span>
                  </>
                ) : (
                  <span style={{ fontSize: '1.2rem', fontStyle: 'italic' }}>A dormir...</span>
                )}
              </div>
              
              {!ultimoSono.hora_fim ? (
                <button 
                  className="btn-primary" 
                  style={{ background: 'linear-gradient(135deg, #8b5cf6, #c084fc)', padding: '0.4rem 1rem', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 'bold', border: 'none', color: '#fff', boxShadow: '0 4px 10px rgba(139, 92, 246, 0.2)', cursor: 'pointer' }}
                  onClick={async () => {
                    const horaAtual = format(new Date(), 'HH:mm');
                    const [hI, mI] = ultimoSono.hora_inicio.split(':').map(Number);
                    const [hF, mF] = horaAtual.split(':').map(Number);
                    let duracao = (hF * 60 + mF) - (hI * 60 + mI);
                    if (duracao < 0) duracao += 24 * 60;
                    
                    const novoRegisto = { ...ultimoSono, hora_fim: horaAtual, duracao_minutos: duracao };
                    setRegistosSonos(prev => prev.map(r => r.id === ultimoSono.id ? novoRegisto : r));
                    await api.saveSono(novoRegisto);
                  }}
                >
                  Acordou
                </button>
              ) : (
                <div className="snapshot-meta">
                  <span>{ultimoSono.hora_inicio} - {ultimoSono.hora_fim} ({formatDataLabel(ultimoSono.data)})</span>
                </div>
              )}
            </div>
          ) : (
            <div className="snapshot-empty">Sem registos de sono</div>
          )}
        </div>
      </div>
      
      {/* Health Summary Grid */}
      <div className="health-summary">
        {/* Column 1: Consultas */}
        <div className="health-column">
          <h2 className="health-title"><Calendar size={24} /> Consultas</h2>
          
          <div className="health-section section-proximas">
            <h3 className="text-body text-light mb-4" style={{ fontWeight: 600, fontSize: '0.9rem', textTransform: 'uppercase' }}>
              Próximas (5)
            </h3>
            {renderList(consultasFuturas, "Sem consultas agendadas.", false)}
          </div>
          
          <div className="health-section section-ultimas">
            <h3 className="text-body text-light mb-4" style={{ fontWeight: 600, fontSize: '0.9rem', textTransform: 'uppercase' }}>
              Últimas (5)
            </h3>
            {renderList(consultasPassadas, "Sem histórico registado.", true)}
          </div>
        </div>

        {/* Column 2: Vacinas */}
        <div className="health-column">
          <h2 className="health-title"><Syringe size={24} /> Vacinas</h2>
          
          <div className="health-section section-proximas">
            <h3 className="text-body text-light mb-4" style={{ fontWeight: 600, fontSize: '0.9rem', textTransform: 'uppercase' }}>
              Próximas (5)
            </h3>
            {renderList(vacinasFuturas, "Sem vacinas pendentes.", false)}
          </div>
          
          <div className="health-section section-ultimas">
            <h3 className="text-body text-light mb-4" style={{ fontWeight: 600, fontSize: '0.9rem', textTransform: 'uppercase' }}>
              Últimas (5)
            </h3>
            {renderList(vacinasPassadas, "Sem histórico de vacinas.", true)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
