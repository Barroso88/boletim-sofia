import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Plus, Trash2, ChevronLeft, ChevronRight, Pencil, X } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { api } from '../services/api';
import './Agenda.css';

const Agenda = () => {
  const [eventos, setEventos] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [adicionando, setAdicionando] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [novoTitulo, setNovoTitulo] = useState('');
  const [novaHora, setNovaHora] = useState('09:00');
  const [novoTipo, setNovoTipo] = useState('Consulta');

  useEffect(() => {
    api.getAgenda().then(data => setEventos(data));
  }, []);

  // --- Calendar Logic ---
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  
  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate
  });

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  // --- Events Logic ---
  const eventosDoDiaSelecionado = eventos.filter(ev => isSameDay(new Date(ev.data), selectedDate));
  
  const abrirEdicao = (evento) => {
    setEditandoId(evento.id);
    setNovoTitulo(evento.titulo);
    setNovoTipo(evento.tipo);
    try {
      const d = new Date(evento.data);
      setNovaHora(format(d, 'HH:mm'));
    } catch (e) {
      setNovaHora('09:00');
    }
    setAdicionando(true);
  };

  const adicionarEvento = (e) => {
    e.preventDefault();
    if (!novoTitulo || !novaHora || !selectedDate) return;
    
    const [hours, minutes] = novaHora.split(':');
    const dataComHora = new Date(selectedDate);
    dataComHora.setHours(parseInt(hours, 10));
    dataComHora.setMinutes(parseInt(minutes, 10));
    
    const evento = {
      id: editandoId || Date.now(),
      titulo: novoTitulo,
      data: dataComHora.toISOString(),
      tipo: novoTipo
    };
    
    const outros = eventos.filter(ev => ev.id !== evento.id);
    const novaLista = [...outros, evento].sort((a, b) => new Date(a.data) - new Date(b.data));
    setEventos(novaLista);
    api.saveEvento(evento);
    setAdicionando(false);
    setEditandoId(null);
    setNovoTitulo('');
    setNovaHora('09:00');
  };

  const removerEvento = (id) => {
    if (window.confirm('Tem a certeza que deseja remover este evento?')) {
      setEventos(eventos.filter(e => e.id !== id));
      api.deleteEvento(id);
    }
  };

  return (
    <div className="page-container agenda-layout">
      {/* 1. Calendar Section */}
      <div className="calendar-section glass-card">
        <div className="calendar-header">
          <button onClick={prevMonth} className="btn-nav"><ChevronLeft size={24} /></button>
          <h2 className="calendar-title text-gradient">
            {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
          </h2>
          <button onClick={nextMonth} className="btn-nav"><ChevronRight size={24} /></button>
        </div>
        
        <div className="calendar-grid-header">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
            <div key={day} className="calendar-day-name">{day}</div>
          ))}
        </div>
        
        <div className="calendar-grid">
          {calendarDays.map((day, idx) => {
            const hasEventos = eventos.some(ev => isSameDay(new Date(ev.data), day));
            const hasConsultas = eventos.some(ev => isSameDay(new Date(ev.data), day) && ev.tipo === 'Consulta');
            const hasVacinas = eventos.some(ev => isSameDay(new Date(ev.data), day) && ev.tipo === 'Vacina');
            
            const isSelected = isSameDay(day, selectedDate);
            const isCurrentMonth = isSameMonth(day, monthStart);
            const isTodayDate = isToday(day);
            
            return (
              <div 
                key={idx} 
                className={`calendar-cell ${!isCurrentMonth ? 'other-month' : ''} ${isSelected ? 'selected' : ''} ${isTodayDate ? 'today' : ''}`}
                onClick={() => {
                  setSelectedDate(day);
                  setAdicionando(false);
                }}
              >
                <span className="calendar-day-num">{format(day, 'd')}</span>
                {hasEventos && (
                  <div className="calendar-indicators">
                    {hasConsultas && <span className="dot dot-consulta"></span>}
                    {hasVacinas && <span className="dot dot-vacina"></span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Details Section */}
      <div className="details-section">
        <div className="flex-between mb-4">
          <h3 className="h3" style={{ fontSize: '1.4rem' }}>
            {format(selectedDate, "d 'de' MMMM", { locale: ptBR })}
          </h3>
          <button className="btn-primary btn-sm" onClick={() => setAdicionando(!adicionando)}>
            <Plus size={18} /> Novo
          </button>
        </div>

        {adicionando && (
          <div className="modal-overlay" onClick={() => setAdicionando(false)}>
            <div className="modal-card" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <div className="modal-title-group">
                  <div className="modal-icon-badge">
                    <CalendarIcon size={22} />
                  </div>
                  <div>
                    <h3 className="modal-title">Novo Agendamento</h3>
                    <p className="modal-subtitle">
                      {format(selectedDate, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                  </div>
                </div>
                <button className="btn-icon" onClick={() => setAdicionando(false)}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={adicionarEvento} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="input-group">
                  <label className="input-label">Título do Agendamento</label>
                  <input
                    type="text"
                    className="input-field"
                    value={novoTitulo}
                    onChange={(e) => setNovoTitulo(e.target.value)}
                    placeholder="Ex: Pediatra Dra. Maria / Vacina dos 2 meses"
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="form-grid-2col">
                  <div className="input-group">
                    <label className="input-label">Hora</label>
                    <input
                      type="time"
                      className="input-field"
                      value={novaHora}
                      onChange={(e) => setNovaHora(e.target.value)}
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Tipo de Evento</label>
                    <select
                      className="input-field"
                      value={novoTipo}
                      onChange={(e) => setNovoTipo(e.target.value)}
                    >
                      <option value="Consulta">Consulta 🩺</option>
                      <option value="Vacina">Vacina 💉</option>
                      <option value="Outro">Outro 📌</option>
                    </select>
                  </div>
                </div>

                <div className="form-actions">
                  <button type="button" className="btn-outline" onClick={() => setAdicionando(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary">
                    Guardar Agendamento
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
          <div className="agenda-day-list animate-fade-in">
            {eventosDoDiaSelecionado.length === 0 ? (
              <div className="glass-card" style={{ padding: '2.5rem 1.5rem', textAlign: 'center', color: 'var(--color-text-light)' }}>
                <CalendarIcon size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                <p>O seu dia está livre.</p>
              </div>
            ) : (
              eventosDoDiaSelecionado.map(evento => {
                const dateObj = new Date(evento.data);
                return (
                  <div key={evento.id} className="glass-card evento-card animate-fade-in">
                    <div className={`evento-color-bar ${evento.tipo.toLowerCase()}`}></div>
                    
                    <div className="evento-time">
                      {format(dateObj, 'HH:mm')}
                    </div>
                    
                    <div className="evento-info">
                      <h4 className="evento-title">{evento.titulo}</h4>
                      <span className={`evento-badge ${evento.tipo.toLowerCase()}`}>
                        {evento.tipo}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button className="btn-delete-evento" style={{ color: 'var(--color-primary)' }} onClick={() => abrirEdicao(evento)} title="Editar evento">
                        <Pencil size={20} />
                      </button>
                      <button className="btn-delete-evento" onClick={() => removerEvento(evento.id)} title="Remover evento">
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
  );
};

export default Agenda;
