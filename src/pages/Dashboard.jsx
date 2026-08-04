import { useState, useEffect } from 'react';
import { differenceInMonths, differenceInDays, differenceInYears, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Syringe } from 'lucide-react';
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

  // Agenda Events State
  const [eventos, setEventos] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('sofia_agenda');
    if (saved) {
      setEventos(JSON.parse(saved));
    }
  }, []);

  // Filter and Sort Logic
  const getEventosFiltrados = (tipo, futuros) => {
    const hoje = new Date();
    
    let filtrados = eventos.filter(e => {
      if (e.tipo !== tipo) return false;
      const dataEvento = new Date(e.data);
      return futuros ? dataEvento >= hoje : dataEvento < hoje;
    });

    // Ordenar
    filtrados.sort((a, b) => {
      const dataA = new Date(a.data).getTime();
      const dataB = new Date(b.data).getTime();
      return futuros ? dataA - dataB : dataB - dataA; // Crescent for future, decrescent for past
    });

    return filtrados.slice(0, 3);
  };

  const consultasPassadas = getEventosFiltrados('Consulta', false);
  const consultasFuturas = getEventosFiltrados('Consulta', true);
  const vacinasPassadas = getEventosFiltrados('Vacina', false);
  const vacinasFuturas = getEventosFiltrados('Vacina', true);

  const renderEventList = (events, emptyMessage, isPast = false) => {
    if (events.length === 0) {
      return <div className="no-events">{emptyMessage}</div>;
    }
    return (
      <div className="event-list">
        {events.map(ev => {
          const evDate = new Date(ev.data);
          return (
            <div key={ev.id} className="event-item">
              <div className="event-header">
                <span className="event-title">{ev.titulo}</span>
                <span className={`event-date ${isPast ? 'past' : ''}`}>
                  {format(evDate, "d MMM, HH:mm", { locale: ptBR })}
                </span>
              </div>
            </div>
          );
        })}
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
      
      {/* New Health Summary Grid */}
      <div className="health-summary">
        {/* Column 1: Consultas */}
        <div className="health-column">
          <h2 className="health-title"><Calendar size={24} /> Consultas</h2>
          
          <div className="health-section">
            <h3 className="text-body text-light mb-4" style={{ fontWeight: 600, fontSize: '0.9rem', textTransform: 'uppercase' }}>
              Próximas
            </h3>
            {renderEventList(consultasFuturas, "Sem consultas agendadas.", false)}
          </div>
          
          <div className="health-section">
            <h3 className="text-body text-light mb-4" style={{ fontWeight: 600, fontSize: '0.9rem', textTransform: 'uppercase' }}>
              Últimas (Histórico)
            </h3>
            {renderEventList(consultasPassadas, "Sem histórico registado.", true)}
          </div>
        </div>

        {/* Column 2: Vacinas */}
        <div className="health-column">
          <h2 className="health-title"><Syringe size={24} /> Vacinas</h2>
          
          <div className="health-section">
            <h3 className="text-body text-light mb-4" style={{ fontWeight: 600, fontSize: '0.9rem', textTransform: 'uppercase' }}>
              Próximas
            </h3>
            {renderEventList(vacinasFuturas, "Sem vacinas agendadas.", false)}
          </div>
          
          <div className="health-section">
            <h3 className="text-body text-light mb-4" style={{ fontWeight: 600, fontSize: '0.9rem', textTransform: 'uppercase' }}>
              Últimas (Histórico)
            </h3>
            {renderEventList(vacinasPassadas, "Sem histórico registado.", true)}
          </div>
        </div>
      </div>
      
    </div>
  );
};

export default Dashboard;
