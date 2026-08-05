import { useState, useEffect } from 'react';
import { differenceInMonths, differenceInDays, differenceInYears, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Syringe } from 'lucide-react';
import { api } from '../services/api';
import './Dashboard.css';

const defaultVacinas = [
  { id: 1, nome: 'Vacina contra a Hepatite B (1.ª Dose)', dataRecomendada: '14/07/2026', tomada: true, dataAdministrada: '14/07/2026', grupo: 'Nascimento' },
  { id: 2, nome: 'Vacina contra a Tuberculose (BCG)', dataRecomendada: '31/07/2026', tomada: true, dataAdministrada: '31/07/2026', grupo: 'Nascimento' },
  { id: 3, nome: 'Vacina contra a Difteria', dataRecomendada: 'De 13/09/2026 a 13/10/2026', tomada: false, grupo: '2 Meses' },
  { id: 4, nome: 'Vacina contra a Hepatite B (2.ª Dose)', dataRecomendada: 'De 13/09/2026 a 13/10/2026', tomada: false, grupo: '2 Meses' },
  { id: 5, nome: 'Vacina contra a Poliomielite', dataRecomendada: 'De 13/09/2026 a 13/10/2026', tomada: false, grupo: '2 Meses' },
  { id: 6, nome: 'Vacina contra a Tosse Convulsa, componente acelular', dataRecomendada: 'De 13/09/2026 a 13/10/2026', tomada: false, grupo: '2 Meses' },
  { id: 7, nome: 'Vacina contra o Haemophilus influenzae tipo B', dataRecomendada: 'De 13/09/2026 a 13/10/2026', tomada: false, grupo: '2 Meses' },
  { id: 8, nome: 'Vacina contra o meningococo do grupo B', dataRecomendada: 'De 13/09/2026 a 13/10/2026', tomada: false, grupo: '2 Meses' },
  { id: 9, nome: 'Vacina contra o Tétano', dataRecomendada: 'De 13/09/2026 a 13/10/2026', tomada: false, grupo: '2 Meses' },
  { id: 10, nome: 'Vacina pneumocócica conjugada de 20 componentes', dataRecomendada: 'De 13/09/2026 a 13/10/2026', tomada: false, grupo: '2 Meses' },
  { id: 11, nome: 'Vacina contra a Parotidite Epidémica', dataRecomendada: 'De 13/07/2027 a 13/08/2027', tomada: false, grupo: '12 Meses' },
  { id: 12, nome: 'Vacina meningocócica conjugada contra os serogrupos A, C, W135 e Y', dataRecomendada: 'De 13/07/2027 a 13/08/2027', tomada: false, grupo: '12 Meses' },
  { id: 13, nome: 'Vacina viva contra a Rubéola', dataRecomendada: 'De 13/07/2027 a 13/07/2028', tomada: false, grupo: '12 Meses' },
  { id: 14, nome: 'Vacina viva contra o Sarampo', dataRecomendada: 'De 13/07/2027 a 13/07/2028', tomada: false, grupo: '12 Meses' },
  { id: 15, nome: 'Vacina contra o Vírus do Papiloma Humano (HPV)', dataRecomendada: 'De 13/07/2036 a 13/07/2037', tomada: false, grupo: '10 Anos' },
];

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

  useEffect(() => {
    api.getAgenda().then(data => setEventos(data));
    api.getVacinas(defaultVacinas).then(data => setVacinas(data));
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
    if (futuras) {
      const pnvFuturas = vacinas.filter(v => !v.tomada).map(v => ({
        id: `pnv-${v.id}`,
        titulo: v.nome,
        dataFormatted: v.dataRecomendada,
        subtext: v.grupo
      }));

      const agendaFuturas = eventos.filter(e => {
        if (e.tipo !== 'Vacina') return false;
        return new Date(e.data) >= new Date();
      }).map(e => ({
        id: `agenda-${e.id}`,
        titulo: e.titulo,
        dataFormatted: format(new Date(e.data), "d MMM, HH:mm", { locale: ptBR }),
        subtext: 'Agendada'
      }));

      return [...pnvFuturas, ...agendaFuturas].slice(0, 5);
    } else {
      const pnvPassadas = vacinas.filter(v => v.tomada).map(v => ({
        id: `pnv-${v.id}`,
        titulo: v.nome,
        dataFormatted: v.dataAdministrada || v.dataRecomendada,
        subtext: 'Administrada'
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
