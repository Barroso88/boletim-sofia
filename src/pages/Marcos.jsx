import { useState, useEffect } from 'react';
import { Plus, Trash2, Star, Calendar, AlertTriangle, X } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import TeethMap from '../components/TeethMap';
import './Marcos.css';

const ICONS = ['👶', '🌟', '👣', '🗣️', '🦷', '🍼', '🧸', '🎉', '✈️', '❤️', '🎂', '🏥', '💉', '🌈', '🐣', '👏'];

const Marcos = () => {
  const [marcos, setMarcos] = useState(() => {
    const saved = localStorage.getItem('sofia_marcos');
    if (saved) return JSON.parse(saved);
    return [
      { id: 1, titulo: 'Nasceu!', data: '2026-07-13', descricao: 'O dia mais feliz das nossas vidas.', icone: '👶' }
    ];
  });

  const [adicionando, setAdicionando] = useState(false);
  const [novoTitulo, setNovoTitulo] = useState('');
  const [novaData, setNovaData] = useState('');
  const [novaDescricao, setNovaDescricao] = useState('');
  const [novoIcone, setNovoIcone] = useState('🌟');
  const [activeTab, setActiveTab] = useState('timeline');
  const [confirmarDelete, setConfirmarDelete] = useState(null);

  useEffect(() => {
    localStorage.setItem('sofia_marcos', JSON.stringify(marcos));
  }, [marcos]);

  const adicionarMarco = (e) => {
    e.preventDefault();
    if (!novoTitulo || !novaData) return;
    const marco = { id: Date.now(), titulo: novoTitulo, data: novaData, descricao: novaDescricao, icone: novoIcone };
    const novaLista = [...marcos, marco].sort((a, b) => new Date(a.data) - new Date(b.data));
    setMarcos(novaLista);
    setAdicionando(false);
    setNovoTitulo(''); setNovaData(''); setNovaDescricao(''); setNovoIcone('🌟');
  };

  const removerMarco = () => {
    setMarcos(prev => prev.filter(m => m.id !== confirmarDelete));
    setConfirmarDelete(null);
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex-between mb-4">
        <h2 className="h2 text-gradient">Marcos Importantes</h2>
        {activeTab === 'timeline' && (
          <button className="btn-primary" onClick={() => setAdicionando(true)}>
            <Plus size={20} />
            <span className="hide-mobile">Adicionar Marco</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="marcos-tabs">
        <button className={`marcos-tab ${activeTab === 'timeline' ? 'active' : ''}`} onClick={() => setActiveTab('timeline')}>
          ⭐ Linha do Tempo
        </button>
        <button className={`marcos-tab ${activeTab === 'teeth' ? 'active' : ''}`} onClick={() => setActiveTab('teeth')}>
          🦷 Dentição
        </button>
      </div>

      {activeTab === 'timeline' ? (
        <>
          {/* Add Marco Form */}
          {adicionando && (
            <div className="marco-form-card">
              <div className="flex-between mb-4">
                <h3 className="h3">Novo Marco da Sofia</h3>
                <button className="btn-icon" onClick={() => setAdicionando(false)}><X size={22} /></button>
              </div>
              <form onSubmit={adicionarMarco}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }} className="form-grid-2col">
                  <div className="input-group">
                    <label className="input-label">Título do Momento</label>
                    <input
                      type="text"
                      className="input-field"
                      value={novoTitulo}
                      onChange={e => setNovoTitulo(e.target.value)}
                      placeholder="Ex: Primeira palavra!"
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label"><Calendar size={14} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: 4 }} /> Data</label>
                    <input
                      type="date"
                      className="input-field"
                      value={novaData}
                      onChange={e => setNovaData(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">Descrição ou Nota (opcional)</label>
                  <textarea
                    className="input-field"
                    rows="3"
                    value={novaDescricao}
                    onChange={e => setNovaDescricao(e.target.value)}
                    placeholder="Conta-nos o que aconteceu neste dia especial..."
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Escolhe um ícone</label>
                  <div className="emoji-picker">
                    {ICONS.map(ic => (
                      <button
                        key={ic}
                        type="button"
                        className={`emoji-btn ${novoIcone === ic ? 'selected' : ''}`}
                        onClick={() => setNovoIcone(ic)}
                      >
                        {ic}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                  <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                    <Star size={18} /> Guardar Marco
                  </button>
                  <button type="button" className="btn-outline" onClick={() => setAdicionando(false)}>
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Timeline */}
          {marcos.length === 0 ? (
            <div className="marcos-empty">
              <div className="marcos-empty-icon">⭐</div>
              <p style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Ainda sem marcos registados</p>
              <p style={{ fontSize: '0.9rem' }}>Adicione o primeiro momento especial da Sofia!</p>
            </div>
          ) : (
            <div className="timeline-container">
              {marcos.map((marco, index) => {
                const dateObj = new Date(marco.data);
                const distancia = formatDistanceToNow(dateObj, { addSuffix: true, locale: ptBR });

                return (
                  <div key={marco.id} className="marco-item" style={{ animationDelay: `${index * 0.07}s` }}>
                    {/* Icon dot */}
                    <div className="marco-dot">{marco.icone}</div>

                    {/* Card */}
                    <div className="marco-card">
                      <button
                        className="marco-delete-btn"
                        onClick={() => setConfirmarDelete(marco.id)}
                        title="Remover este marco"
                      >
                        <Trash2 size={16} />
                      </button>

                      <div className="marco-date-badge">
                        <Calendar size={12} />
                        {format(dateObj, "dd 'de' MMMM, yyyy", { locale: ptBR })}
                        &nbsp;·&nbsp;
                        <span style={{ fontWeight: 500, textTransform: 'none' }}>{distancia}</span>
                      </div>

                      <h3 className="marco-title">{marco.titulo}</h3>
                      {marco.descricao && <p className="marco-desc">{marco.descricao}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <TeethMap />
      )}

      {/* Delete Confirmation Modal */}
      {confirmarDelete && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}
          onClick={() => setConfirmarDelete(null)}
        >
          <div
            className="glass-card animate-fade-in"
            style={{ padding: '2rem', maxWidth: '380px', width: '90%', textAlign: 'center' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <AlertTriangle size={28} color="#ef4444" />
            </div>
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', fontWeight: 800 }}>Remover Marco?</h3>
            <p style={{ color: 'var(--color-text-light)', fontSize: '0.9rem', margin: '0 0 1.5rem' }}>
              Esta memória será apagada permanentemente.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn-outline" style={{ flex: 1 }} onClick={() => setConfirmarDelete(null)}>
                <X size={16} /> Cancelar
              </button>
              <button
                className="btn-primary"
                style={{ flex: 1, background: '#ef4444', borderColor: '#ef4444' }}
                onClick={removerMarco}
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

export default Marcos;
