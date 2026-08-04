import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import TeethMap from '../components/TeethMap';
import './Dashboard.css'; // Reuse some layout css if needed

const getUniqueId = () => Date.now();

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
  const [activeTab, setActiveTab] = useState('timeline'); // 'timeline' or 'teeth'

  const iconesPredefinidos = ['🌟', '👣', '🗣️', '🦷', '🍼', '🧸', '🎉', '✈️'];

  useEffect(() => {
    localStorage.setItem('sofia_marcos', JSON.stringify(marcos));
  }, [marcos]);

  const adicionarMarco = (e) => {
    e.preventDefault();
    if (!novoTitulo || !novaData) return;
    
    const marco = {
      id: getUniqueId(),
      titulo: novoTitulo,
      data: novaData,
      descricao: novaDescricao,
      icone: novoIcone
    };
    
    // Sort by date ascending
    const novaLista = [...marcos, marco].sort((a, b) => new Date(a.data) - new Date(b.data));
    setMarcos(novaLista);
    setAdicionando(false);
    resetFormulario();
  };
  
  const resetFormulario = () => {
    setNovoTitulo('');
    setNovaData('');
    setNovaDescricao('');
    setNovoIcone('🌟');
  };

  const removerMarco = (id) => {
    if (window.confirm('Tem a certeza que deseja remover este marco?')) {
      setMarcos(marcos.filter(m => m.id !== id));
    }
  };

  return (
    <div className="page-container">
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
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '2px solid var(--color-border)', paddingBottom: '0.5rem', marginBottom: '2rem' }}>
        <button 
          onClick={() => setActiveTab('timeline')}
          style={{ 
            background: 'none', border: 'none', padding: '0.5rem 1rem', fontSize: '1rem', fontWeight: 600, cursor: 'pointer',
            color: activeTab === 'timeline' ? 'var(--color-primary-dark)' : 'var(--color-text-light)',
            borderBottom: activeTab === 'timeline' ? '3px solid var(--color-primary)' : '3px solid transparent',
            marginBottom: '-11px'
          }}
        >
          Linha do Tempo
        </button>
        <button 
          onClick={() => setActiveTab('teeth')}
          style={{ 
            background: 'none', border: 'none', padding: '0.5rem 1rem', fontSize: '1rem', fontWeight: 600, cursor: 'pointer',
            color: activeTab === 'teeth' ? 'var(--color-primary-dark)' : 'var(--color-text-light)',
            borderBottom: activeTab === 'teeth' ? '3px solid var(--color-primary)' : '3px solid transparent',
            marginBottom: '-11px'
          }}
        >
          Dentição
        </button>
      </div>

      {activeTab === 'timeline' ? (
        <>
          {adicionando && (
            <div className="glass-card mb-4" style={{ padding: '1.5rem', border: '2px dashed var(--color-primary)' }}>
              <h3 className="h3 mb-4">Novo Marco na Vida da Sofia</h3>
              <form onSubmit={adicionarMarco}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                  <div className="input-group">
                    <label className="input-label">Título (ex: Primeiro dente!)</label>
                    <input
                      type="text"
                      className="input-field"
                      value={novoTitulo}
                      onChange={(e) => setNovoTitulo(e.target.value)}
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Data</label>
                    <input
                      type="date"
                      className="input-field"
                      value={novaData}
                      onChange={(e) => setNovaData(e.target.value)}
                      required
                    />
                  </div>
                </div>
                
                <div className="input-group">
                  <label className="input-label">Descrição ou Memorando</label>
                  <textarea
                    className="input-field"
                    rows="3"
                    value={novaDescricao}
                    onChange={(e) => setNovaDescricao(e.target.value)}
                  />
                </div>
                
                <div className="input-group">
                  <label className="input-label">Ícone</label>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {iconesPredefinidos.map(ic => (
                      <button 
                        key={ic}
                        type="button"
                        onClick={() => setNovoIcone(ic)}
                        style={{ 
                          fontSize: '1.5rem', 
                          padding: '0.5rem',
                          background: novoIcone === ic ? 'rgba(255, 143, 171, 0.2)' : 'transparent',
                          border: novoIcone === ic ? '2px solid var(--color-primary)' : '2px solid transparent',
                          borderRadius: 'var(--radius-md)'
                        }}
                      >
                        {ic}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button type="submit" className="btn-primary">Guardar Marco</button>
                  <button type="button" className="btn-outline" onClick={() => { setAdicionando(false); resetFormulario(); }}>Cancelar</button>
                </div>
              </form>
            </div>
          )}

          <div className="timeline" style={{ position: 'relative', paddingLeft: '2rem', marginTop: '2rem' }}>
            <div style={{ 
              position: 'absolute', 
              left: '0.85rem', 
              top: 0, 
              bottom: 0, 
              width: '2px', 
              background: 'linear-gradient(to bottom, var(--color-primary-light), var(--color-secondary))' 
            }}></div>
            
            {marcos.map(marco => {
              const dateObj = new Date(marco.data);
              return (
                <div key={marco.id} style={{ position: 'relative', marginBottom: '2rem' }}>
                  <div style={{ 
                    position: 'absolute',
                    left: '-2.7rem',
                    top: '0.5rem',
                    width: '3rem',
                    height: '3rem',
                    background: 'white',
                    border: '2px solid var(--color-primary)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem',
                    boxShadow: 'var(--shadow-sm)'
                  }}>
                    {marco.icone}
                  </div>
                  
                  <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <div className="flex-between mb-2">
                      <span style={{ color: 'var(--color-primary-dark)', fontWeight: '600', fontSize: '0.9rem' }}>
                        {format(dateObj, "dd 'de' MMMM, yyyy", { locale: ptBR })}
                      </span>
                      <button onClick={() => removerMarco(marco.id)} style={{ color: 'var(--color-text-light)' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <h3 className="h3 mb-2">{marco.titulo}</h3>
                    {marco.descricao && <p className="text-body text-light">{marco.descricao}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <TeethMap />
      )}
    </div>
  );
};

export default Marcos;
