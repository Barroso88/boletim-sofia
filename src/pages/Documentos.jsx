import { useState, useEffect } from 'react';
import { Plus, Edit2, Save, Trash2, X, Copy, Check, FileBadge, CreditCard, Stethoscope, Fingerprint, FolderHeart, Droplet } from 'lucide-react';
import './Documentos.css';

const Documentos = () => {
  const [documentos, setDocumentos] = useState(() => {
    const defaultDocs = [
      { id: 1, titulo: 'NIF (Número de Identificação Fiscal)', numero: '', type: 'tax' },
      { id: 2, titulo: 'Nº Identificação Civil (CC)', numero: '', type: 'id' },
      { id: 3, titulo: 'Nº Utente de Saúde', numero: '', type: 'health' },
      { id: 4, titulo: 'Grupo Sanguíneo', numero: '', type: 'blood' },
    ];
    
    const saved = localStorage.getItem('sofia_documentos');
    if (saved) {
      let parsed = JSON.parse(saved);
      if (!parsed.find(d => d.id === 4)) {
        parsed.push({ id: 4, titulo: 'Grupo Sanguíneo', numero: '', type: 'blood' });
      }
      return parsed;
    }
    return defaultDocs;
  });

  const [editandoId, setEditandoId] = useState(null);
  const [editValue, setEditValue] = useState('');
  
  const [adicionandoNovo, setAdicionandoNovo] = useState(false);
  const [novoTitulo, setNovoTitulo] = useState('');
  const [novoNumero, setNovoNumero] = useState('');
  
  const [copiadoId, setCopiadoId] = useState(null);

  useEffect(() => {
    localStorage.setItem('sofia_documentos', JSON.stringify(documentos));
  }, [documentos]);

  const iniciarEdicao = (doc) => {
    setEditandoId(doc.id);
    setEditValue(doc.numero);
  };

  const guardarEdicao = (id) => {
    setDocumentos(documentos.map(doc => 
      doc.id === id ? { ...doc, numero: editValue } : doc
    ));
    setEditandoId(null);
  };

  const cancelarEdicao = () => {
    setEditandoId(null);
  };

  const adicionarNovoDocumento = (e) => {
    e.preventDefault();
    if (novoTitulo.trim() === '') return;
    
    const novoDoc = {
      id: Date.now(),
      titulo: novoTitulo,
      numero: novoNumero,
      type: 'custom'
    };
    
    setDocumentos([...documentos, novoDoc]);
    setAdicionandoNovo(false);
    setNovoTitulo('');
    setNovoNumero('');
  };

  const removerDocumento = (id) => {
    if (window.confirm('Tem a certeza que deseja remover este documento?')) {
      setDocumentos(documentos.filter(doc => doc.id !== id));
    }
  };

  const copiarParaClipboard = (numero, id) => {
    if (!numero) return;
    navigator.clipboard.writeText(numero).then(() => {
      setCopiadoId(id);
      setTimeout(() => setCopiadoId(null), 2000);
    });
  };

  const getDocIcon = (type) => {
    switch (type) {
      case 'tax': return <FileBadge size={28} opacity={0.8} />;
      case 'id': return <Fingerprint size={28} opacity={0.8} />;
      case 'health': return <Stethoscope size={28} opacity={0.8} />;
      case 'blood': return <Droplet size={28} opacity={0.8} />;
      case 'custom': return <CreditCard size={28} opacity={0.8} />;
      default: return <FolderHeart size={28} opacity={0.8} />;
    }
  };

  return (
    <div className="page-container">
      <div className="flex-between mb-4">
        <div>
          <h2 className="h2 text-gradient">A Carteira da Sofia</h2>
          <p style={{ color: 'var(--color-text-light)', fontSize: '0.9rem', marginTop: '4px' }}>
            Todos os documentos oficiais num formato ultra-premium.
          </p>
        </div>
        <button className="btn-primary add-btn-pulse" onClick={() => setAdicionandoNovo(true)}>
          <Plus size={20} />
          <span className="hide-mobile">Adicionar Cartão</span>
        </button>
      </div>

      <div className="wallet-grid">
        {documentos.map((doc, index) => (
          <div key={doc.id} className={`id-card card-theme-${doc.type}`} style={{ animationDelay: `${index * 0.15}s` }}>
            
            {/* Holographic effect overlay */}
            <div className="card-glare"></div>
            <div className="card-watermark">{getDocIcon(doc.type)}</div>

            {/* Top Bar: Icon + Actions */}
            <div className="card-header flex-between">
              <div className="card-icon-bg">
                {getDocIcon(doc.type)}
              </div>
              
              {editandoId !== doc.id && (
                <div className="card-actions">
                  <button 
                    className="card-action-btn" 
                    onClick={() => copiarParaClipboard(doc.numero, doc.id)}
                    title="Copiar Número"
                    disabled={!doc.numero}
                  >
                    {copiadoId === doc.id ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                  <button className="card-action-btn" onClick={() => iniciarEdicao(doc)} title="Editar">
                    <Edit2 size={16} />
                  </button>
                  {doc.id > 4 && (
                    <button className="card-action-btn delete-btn" onClick={() => removerDocumento(doc.id)} title="Remover">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Main Content: Title & Value */}
            <div className="card-body">
              <h3 className="card-title">{doc.titulo}</h3>
              
              {editandoId === doc.id ? (
                <div className="card-edit-mode">
                  {doc.type === 'blood' ? (
                    <select
                      className="card-input"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      autoFocus
                    >
                      <option value="">Selecione...</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      className="card-input"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      placeholder="Introduza o número..."
                      autoFocus
                    />
                  )}
                  <div className="card-edit-actions">
                    <button className="card-save-btn cancel" onClick={cancelarEdicao}><X size={18} /></button>
                    <button className="card-save-btn confirm" onClick={() => guardarEdicao(doc.id)}><Save size={18} /></button>
                  </div>
                </div>
              ) : (
                <div className="card-value-display">
                  {doc.numero ? (
                    <div className="card-number-wrapper">
                      <span className="card-number">{doc.numero}</span>
                    </div>
                  ) : (
                    <span className="card-empty">Toque em editar para preencher</span>
                  )}
                </div>
              )}
            </div>
            
            {/* Bottom edge chip indicator (just for premium visual flair) */}
            <div className="card-chip"></div>
          </div>
        ))}
      </div>

      {adicionandoNovo && (
        <div className="add-doc-panel animate-fade-in glass-card" style={{ marginTop: '3rem', borderTop: '4px solid var(--color-primary)' }}>
          <div className="flex-between mb-4">
            <h3 className="h3">Criar Novo Cartão</h3>
            <button className="btn-icon" onClick={() => setAdicionandoNovo(false)}><X size={20} /></button>
          </div>
          <form onSubmit={adicionarNovoDocumento} style={{ display: 'grid', gap: '1rem' }}>
            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="input-group">
                <label className="input-label">Título do Cartão</label>
                <input
                  type="text"
                  className="input-field"
                  value={novoTitulo}
                  onChange={(e) => setNovoTitulo(e.target.value)}
                  required
                  placeholder="Ex: Passaporte"
                />
              </div>
              <div className="input-group">
                <label className="input-label">Número / Registo</label>
                <input
                  type="text"
                  className="input-field"
                  value={novoNumero}
                  onChange={(e) => setNovoNumero(e.target.value)}
                  placeholder="Ex: 123456789"
                />
              </div>
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '0.5rem', padding: '1rem' }}>
              Emitir Cartão
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Documentos;
