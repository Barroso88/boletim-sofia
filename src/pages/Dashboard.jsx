import { useState, useEffect } from 'react';
import { differenceInMonths, differenceInDays, differenceInYears, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Syringe, Milk, Sparkles, Clock } from 'lucide-react';
import { api } from '../services/api';
import { defaultVacinas } from '../data/defaultVacinas';
import './Dashboard.css';

const Dashboard = () => {
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

  useEffect(() => {
    api.getAgenda().then(data => setEventos(data));
    api.getVacinas(defaultVacinas).then(data => setVacinas(data));
    api.getLeite().then(data => setRegistosLeite(data || []));
    api.getFraldas().then(data => setRegistosFraldas(data || []));
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

  const getFraldaClass = (tipo) => {
    if (!tipo) return 'xixi';
    const t = tipo.toLowerCase();
    if (t.includes('cocó') && t.includes('xixi')) return 'ambos';
    if (t.includes('cocó')) return 'coco';
    return 'xixi';
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
        <h1 className="h1 text-gradient mb-2">Olá, Sofia! 🌸</h1>
        <p className="text-body text-light">A crescer todos os dias com muito amor.</p>
        
        <div className="age-stats">
          <div className="stat-box">
            <span className="stat-value">{age.years}</span>
            <span className="stat-label">Anos</span>
          </div>
          <div className="stat-box">
            <span className="stat-value">{age.months}</span>
            <span className="stat-label">Meses</span>
          </div>
          <div className="stat-box">
            <span className="stat-value">{age.days}</span>
            <span className="stat-label">Dias</span>
          </div>
        </div>
      </div>

      {/* Quick View Snapshots: Última Mamada & Última Fralda */}
      <div className="quick-snapshots-grid">
        {/* Card 1: Última Mamada */}
        <div className="quick-snapshot-card milk-card glass-card">
          <div className="snapshot-header">
            <div className="snapshot-title-group">
              <div className="snapshot-icon-badge milk-bg">
                <Milk size={20} />
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
        <div className="quick-snapshot-card diaper-card glass-card">
          <div className="snapshot-header">
            <div className="snapshot-title-group">
              <div className="snapshot-icon-badge diaper-bg">
                <Sparkles size={20} />
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
              <div className={`snapshot-type-tag type-${getFraldaClass(ultimaFralda.tipo)}`}>
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
      </div>
      
      {/* Health Summary Grid */}
      <div className="health-summary">
        {/* Column 1: Consultas */}
        <div className="health-column">
          <h2 className="health-title"><Calendar size={24} /> Consultas</h2>
          
          <div className="health-section">
            <h3 className="text-body text-light mb-4" style={{ fontWeight: 600, fontSize: '0.9rem', textTransform: 'uppercase' }}>
              Próximas (5)
            </h3>
            {renderList(consultasFuturas, "Sem consultas agendadas.", false)}
          </div>
          
          <div className="health-section">
            <h3 className="text-body text-light mb-4" style={{ fontWeight: 600, fontSize: '0.9rem', textTransform: 'uppercase' }}>
              Últimas (5)
            </h3>
            {renderList(consultasPassadas, "Sem histórico registado.", true)}
          </div>
        </div>

        {/* Column 2: Vacinas */}
        <div className="health-column">
          <h2 className="health-title"><Syringe size={24} /> Vacinas</h2>
          
          <div className="health-section">
            <h3 className="text-body text-light mb-4" style={{ fontWeight: 600, fontSize: '0.9rem', textTransform: 'uppercase' }}>
              Próximas (5)
            </h3>
            {renderList(vacinasFuturas, "Sem vacinas agendadas.", false)}
          </div>
          
          <div className="health-section">
            <h3 className="text-body text-light mb-4" style={{ fontWeight: 600, fontSize: '0.9rem', textTransform: 'uppercase' }}>
              Últimas (5)
            </h3>
            {renderList(vacinasPassadas, "Sem histórico registado.", true)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
