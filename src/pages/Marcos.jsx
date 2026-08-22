import { useState, useEffect } from 'react';
import { Plus, Trash2, Star, Calendar, AlertTriangle, X, Pencil } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import TeethMap from '../components/TeethMap';
import SaltosTimeline from '../components/SaltosTimeline';
import { api } from '../services/api';
import './Marcos.css';

const ICONS = ['👶', '🌟', '👣', '🗣️', '🦷', '🍼', '🧸', '🎉', '✈️', '❤️', '🎂', '🏥', '💉', '🌈', '🐣', '👏'];

const MARCO_COLORS = [
  { id: 'rose', name: 'Rosa Suave', bg: 'linear-gradient(135deg, rgba(254, 242, 242, 0.95), rgba(253, 226, 236, 0.95))', border: 'rgba(244, 63, 94, 0.25)', rgb: '244, 63, 94', accent: '#f43f5e', dotBg: '#ffe4e6' },
  { id: 'sky', name: 'Azul Céu', bg: 'linear-gradient(135deg, rgba(240, 249, 255, 0.95), rgba(224, 242, 254, 0.95))', border: 'rgba(2, 132, 199, 0.25)', rgb: '2, 132, 199', accent: '#0284c7', dotBg: '#e0f2fe' },
  { id: 'purple', name: 'Alfazema', bg: 'linear-gradient(135deg, rgba(250, 245, 255, 0.95), rgba(243, 232, 255, 0.95))', border: 'rgba(139, 92, 246, 0.25)', rgb: '139, 92, 246', accent: '#8b5cf6', dotBg: '#f3e8ff' },
  { id: 'emerald', name: 'Menta', bg: 'linear-gradient(135deg, rgba(236, 253, 245, 0.95), rgba(209, 250, 229, 0.95))', border: 'rgba(16, 185, 129, 0.25)', rgb: '16, 185, 129', accent: '#10b981', dotBg: '#d1fae5' },
  { id: 'amber', name: 'Pêssego', bg: 'linear-gradient(135deg, rgba(255, 251, 235, 0.95), rgba(254, 243, 199, 0.95))', border: 'rgba(245, 158, 11, 0.25)', rgb: '245, 158, 11', accent: '#f59e0b', dotBg: '#fef3c7' },
  { id: 'pink', name: 'Orquídea', bg: 'linear-gradient(135deg, rgba(253, 242, 248, 0.95), rgba(252, 231, 243, 0.95))', border: 'rgba(236, 72, 153, 0.25)', rgb: '236, 72, 153', accent: '#ec4899', dotBg: '#fce7f3' },
  { id: 'indigo', name: 'Índigo', bg: 'linear-gradient(135deg, rgba(238, 242, 255, 0.95), rgba(224, 231, 255, 0.95))', border: 'rgba(99, 102, 241, 0.25)', rgb: '99, 102, 241', accent: '#6366f1', dotBg: '#e0e7ff' },
  { id: 'teal', name: 'Turquesa', bg: 'linear-gradient(135deg, rgba(240, 253, 250, 0.95), rgba(204, 251, 241, 0.95))', border: 'rgba(20, 184, 166, 0.25)', rgb: '20, 184, 166', accent: '#14b8a6', dotBg: '#ccfbf1' },
];

const Marcos = () => {
  const [marcos, setMarcos] = useState([]);
  const [adicionando, setAdicionando] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [novoTitulo, setNovoTitulo] = useState('');
  const [novaData, setNovaData] = useState('');
  const [novaDescricao, setNovaDescricao] = useState('');
  const [novoIcone, setNovoIcone] = useState('🌟');
  const [novaCor, setNovaCor] = useState('rose');
  const [activeTab, setActiveTab] = useState(() => {
    const saved = sessionStorage.getItem('marcos_active_tab');
    if (saved) {
      sessionStorage.removeItem('marcos_active_tab');
      return saved;
    }
    return 'timeline';
  });
  const [confirmarDelete, setConfirmarDelete] = useState(null);

  useEffect(() => {
    api.getMarcos().then(data => {
      if (data.length === 0) {
        const defaultMarco = { id: 1, titulo: 'Nasceu!', data: '2026-07-13', descricao: 'O dia mais feliz das nossas vidas.', icone: '👶', cor: 'rose' };
        setMarcos([defaultMarco]);
        api.saveMarco(defaultMarco);
      } else {
        setMarcos(data);
      }
    });
  }, []);

  const abrirEdicao = (marco) => {
    setEditandoId(marco.id);
    setNovoTitulo(marco.titulo);
    setNovaData(marco.data);
    setNovaDescricao(marco.descricao || '');
    setNovoIcone(marco.icone || '🌟');
    const idx = marcos.findIndex(m => m.id === marco.id);
    const fallbackColor = MARCO_COLORS[idx >= 0 ? idx % MARCO_COLORS.length : 0].id;
    setNovaCor(marco.cor || fallbackColor);
    setAdicionando(true);
  };

  const adicionarMarco = (e) => {
    e.preventDefault();
    if (!novoTitulo || !novaData) return;
    const marco = {
      id: editandoId || Date.now(),
      titulo: novoTitulo,
      data: novaData,
      descricao: novaDescricao,
      icone: novoIcone,
      cor: novaCor
    };
    const outros = marcos.filter(m => m.id !== marco.id);
    const novaLista = [...outros, marco].sort((a, b) => new Date(a.data) - new Date(b.data));
    setMarcos(novaLista);
    api.saveMarco(marco);
    setAdicionando(false);
    setEditandoId(null);
    setNovoTitulo(''); setNovaData(''); setNovaDescricao(''); setNovoIcone('🌟'); setNovaCor('rose');
  };

  const removerMarco = () => {
    const idToDelete = confirmarDelete;
    setMarcos(prev => prev.filter(m => m.id !== idToDelete));
    api.deleteMarco(idToDelete);
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
        <button className={`marcos-tab ${activeTab === 'saltos' ? 'active' : ''}`} onClick={() => setActiveTab('saltos')}>
          🧠 Saltos
        </button>
      </div>

      {activeTab === 'timeline' && (
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

                <div className="input-group" style={{ marginTop: '1rem' }}>
                  <label className="input-label">Escolhe a cor do marco</label>
                  <div className="marco-color-picker">
                    {MARCO_COLORS.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        className={`marco-color-btn ${novaCor === c.id ? 'selected' : ''}`}
                        style={{ background: c.accent }}
                        onClick={() => setNovaCor(c.id)}
                        title={c.name}
                      >
                        {novaCor === c.id && <span className="color-check">✓</span>}
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
                const colorObj = MARCO_COLORS.find(c => c.id === marco.cor) || MARCO_COLORS[index % MARCO_COLORS.length];
                const dateObj = new Date(marco.data);
                const distancia = formatDistanceToNow(dateObj, { addSuffix: true, locale: ptBR });

                return (
                  <div key={marco.id} className="marco-item" style={{ animationDelay: `${index * 0.07}s` }}>
                    {/* Icon dot */}
                    <div
                      className="marco-dot"
                      style={{
                        background: colorObj.dotBg,
                        borderColor: colorObj.accent,
                        boxShadow: `0 0 0 4px ${colorObj.border}, 0 4px 12px rgba(0,0,0,0.08)`
                      }}
                    >
                      {marco.icone}
                    </div>

                    {/* Card */}
                    <div
                      className="marco-card"
                      style={{
                        background: colorObj.bg,
                        border: `2px solid rgba(${colorObj.rgb}, 1)`,
                        borderBottom: `3px solid rgba(${colorObj.rgb}, 1)`,
                        boxShadow: `0 0 10px rgba(${colorObj.rgb}, 0.8), 0 0 20px rgba(${colorObj.rgb}, 0.6), inset 0 0 10px rgba(${colorObj.rgb}, 0.8), 0 8px 32px -4px rgba(${colorObj.rgb}, 0.25)`
                      }}
                    >
                      <div className="btn-action-group" style={{ position: 'absolute', top: '1.25rem', right: '1.25rem' }}>
                        <button
                          className="btn-action-edit"
                          onClick={() => abrirEdicao(marco)}
                          title="Editar este marco"
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          className="btn-action-delete"
                          onClick={() => setConfirmarDelete(marco.id)}
                          title="Remover este marco"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div
                        className="marco-date-badge"
                        style={{
                          background: colorObj.dotBg,
                          color: colorObj.accent,
                          display: 'inline-flex',
                          flexDirection: 'column',
                          alignItems: 'flex-start',
                          borderRadius: '12px',
                          gap: '0.2rem',
                          padding: '0.4rem 0.75rem'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Calendar size={12} />
                          {format(dateObj, "dd 'de' MMMM, yyyy", { locale: ptBR })}
                        </div>
                        <span style={{ fontWeight: 500, textTransform: 'none', opacity: 0.85, fontSize: '0.7rem' }}>
                          {distancia}
                        </span>
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
      )}

      {activeTab === 'teeth' && <TeethMap />}
      
      {activeTab === 'saltos' && <SaltosTimeline />}

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
