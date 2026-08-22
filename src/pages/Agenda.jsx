import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Plus, Trash2, ChevronLeft, ChevronRight, Pencil, X, AlertTriangle, FileText } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { api } from '../services/api';
import './Agenda.css';

const getTipoClass = (tipo) => {
  if (!tipo) return 'outro';
  const t = tipo.toLowerCase();
  if (t.includes('consulta')) return 'consulta';
  if (t.includes('exame')) return 'exames';
  if (t.includes('análise') || t.includes('analise')) return 'analises';
  if (t.includes('vacin')) return 'vacina';
  if (t.includes('mêsversário') || t.includes('mesversario')) return 'mesversario';
  if (t.includes('aniversário') || t.includes('aniversario')) return 'aniversario';
  return 'outro';
};

const Agenda = () => {
  const [eventos, setEventos] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [adicionando, setAdicionando] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [novoTitulo, setNovoTitulo] = useState('');
  const [novaHora, setNovaHora] = useState('09:00');
  const [novoTipo, setNovoTipo] = useState('Consulta');
  const [novaNota, setNovaNota] = useState('');

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
    setNovaNota(evento.notas || '');
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
      tipo: novoTipo,
      notas: novaNota
    };
    
    const outros = eventos.filter(ev => ev.id !== evento.id);
    const novaLista = [...outros, evento].sort((a, b) => new Date(a.data) - new Date(b.data));
    setEventos(novaLista);
    api.saveEvento(evento);
    setAdicionando(false);
    setEditandoId(null);
    setNovoTitulo('');
    setNovaHora('09:00');
    setNovaNota('');
  };

  const [confirmarDelete, setConfirmarDelete] = useState(null);

  const removerEventoConfirmado = () => {
    if (!confirmarDelete) return;
    const id = confirmarDelete;
    setEventos(eventos.filter(e => e.id !== id));
    api.deleteEvento(id);
    setConfirmarDelete(null);
  };

  return (
    <div className="page-container agenda-layout">
      {/* 1. Calendar Section */}
      <div className="calendar-section">
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
            const dayEvents = eventos.filter(ev => isSameDay(new Date(ev.data), day));
            const hasEventos = dayEvents.length > 0;
            const hasConsultas = dayEvents.some(ev => getTipoClass(ev.tipo) === 'consulta');
            const hasExames = dayEvents.some(ev => getTipoClass(ev.tipo) === 'exames');
            const hasAnalises = dayEvents.some(ev => getTipoClass(ev.tipo) === 'analises');
            const hasVacinas = dayEvents.some(ev => getTipoClass(ev.tipo) === 'vacina');
            const hasMesversario = dayEvents.some(ev => getTipoClass(ev.tipo) === 'mesversario');
            const hasAniversario = dayEvents.some(ev => getTipoClass(ev.tipo) === 'aniversario');
            const hasOutros = dayEvents.some(ev => getTipoClass(ev.tipo) === 'outro');

            const isSelected = isSameDay(day, selectedDate);
            const isCurrentMonth = isSameMonth(day, monthStart);
            const isTodayDate = isToday(day);

            const dominantTipo = dayEvents.length > 0 ? getTipoClass(dayEvents[0].tipo) : null;
            const eventClass = hasEventos ? `has-event has-event-${dominantTipo}` : '';

            return (
              <div
                key={idx}
                className={`calendar-cell ${!isCurrentMonth ? 'other-month' : ''} ${isSelected ? 'selected' : ''} ${isTodayDate ? 'today' : ''} ${eventClass}`}
                onClick={() => {
                  setSelectedDate(day);
                  setAdicionando(false);
                }}
              >
                <span className="calendar-day-num">{format(day, 'd')}</span>

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
                    placeholder="Ex: Pediatra Dra. Maria / Exames de Sangue / Mêsversário"
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
                      <option value="Exames">Exames 🔬</option>
                      <option value="Análises">Análises 🧪</option>
                      <option value="Vacina">Vacinas 💉</option>
                      <option value="Mêsversário">Mêsversário 🎂</option>
                      <option value="Aniversário">Aniversário 🎉</option>
                      <option value="Outro">Outro 📌</option>
                    </select>
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">Notas (Opcional)</label>
                  <textarea
                    className="input-field"
                    value={novaNota}
                    onChange={(e) => setNovaNota(e.target.value)}
                    placeholder="Ex: Levar boletim de vacinas, perguntar sobre cólicas..."
                    rows="3"
                  ></textarea>
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
                const tipoCls = getTipoClass(evento.tipo);
                return (
                  <div key={evento.id} className={`glass-card evento-card animate-fade-in ${tipoCls}`}>
                    <div className={`evento-color-bar ${tipoCls}`}></div>
                    
                    <div className="evento-time">
                      {format(dateObj, 'HH:mm')}
                    </div>
                    
                    <div className="evento-info">
                      <h4 className="evento-title">{evento.titulo}</h4>
                      <span className={`evento-badge ${tipoCls}`}>
                        {evento.tipo}
                      </span>
                      {evento.notas && (
                        <div className="evento-notas-premium">
                          <FileText size={16} className="notas-icon" />
                          <p>{evento.notas}</p>
                        </div>
                      )}
                    </div>

                    <div className="btn-action-group">
                      <button className="btn-action-edit" onClick={() => abrirEdicao(evento)} title="Editar evento">
                        <Pencil size={17} />
                      </button>
                      <button className="btn-action-delete" onClick={() => setConfirmarDelete(evento.id)} title="Remover evento">
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      {/* Delete Confirmation Modal */}
      {confirmarDelete && (
        <div className="modal-overlay" onClick={() => setConfirmarDelete(null)}>
          <div className="modal-card" style={{ maxWidth: '400px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.5rem' }}>
              <AlertTriangle size={26} color="#ef4444" />
            </div>
            <div>
              <h3 style={{ margin: '0 0 0.35rem', fontSize: '1.15rem', fontWeight: 800 }}>Remover Evento?</h3>
              <p style={{ color: 'var(--color-text-light)', fontSize: '0.86rem', margin: 0 }}>
                Este agendamento será removido permanentemente da agenda.
              </p>
            </div>
            <div className="form-actions" style={{ marginTop: '0.5rem' }}>
              <button className="btn-outline" onClick={() => setConfirmarDelete(null)}>
                <X size={16} /> Cancelar
              </button>
              <button
                className="btn-primary"
                style={{ background: '#ef4444', borderColor: '#ef4444', boxShadow: '0 4px 14px rgba(239,68,68,0.35)' }}
                onClick={removerEventoConfirmado}
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

export default Agenda;
