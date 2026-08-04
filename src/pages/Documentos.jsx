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
      case 'tax': return <FileBadge size={24} />;
      case 'id': return <Fingerprint size={24} />;
      case 'health': return <Stethoscope size={24} />;
      case 'blood': return <Droplet size={24} color="#ef4444" />;
      case 'custom': return <CreditCard size={24} />;
      default: return <FolderHeart size={24} />;
    }
  };

  return (
    <div className="page-container">
      <div className="flex-between mb-4">
        <h2 className="h2 text-gradient">Documentos Oficiais</h2>
        <button className="btn-primary" onClick={() => setAdicionandoNovo(true)}>
          <Plus size={20} />
          <span className="hide-mobile">Adicionar Documento</span>
        </button>
      </div>

      <div className="docs-grid">
        {documentos.map((doc, index) => (
          <div key={doc.id} className={`doc-card ${doc.type === 'blood' ? 'blood-card' : ''}`} style={{ animationDelay: `${index * 0.1}s` }}>
            {editandoId !== doc.id && (
              <div className="doc-actions-overlay">
                <button 
                  className="action-icon-btn" 
                  onClick={() => copiarParaClipboard(doc.numero, doc.id)}
                  title="Copiar Número"
                  disabled={!doc.numero}
                  style={{ opacity: !doc.numero ? 0.5 : 1 }}
                >
                  {copiadoId === doc.id ? <Check size={18} color="var(--color-primary)" /> : <Copy size={18} />}
                </button>
                <button className="action-icon-btn" onClick={() => iniciarEdicao(doc)} title="Editar">
                  <Edit2 size={18} />
                </button>
                {doc.id > 3 && (
                  <button className="action-icon-btn" onClick={() => removerDocumento(doc.id)} title="Remover">
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            )}

            <div className="doc-header">
              <div className="doc-icon">
                {getDocIcon(doc.type)}
              </div>
              <h3 className="doc-title">{doc.titulo}</h3>
            </div>
            
            {editandoId === doc.id ? (
              <div className="doc-edit-mode">
                {doc.type === 'blood' ? (
                  <select
                    className="input-field"
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
                    className="input-field"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    placeholder="Introduza o número..."
                    autoFocus
                  />
                )}
                <div className="doc-edit-actions">
                  <button className="btn-outline" onClick={cancelarEdicao} style={{ padding: '0.5rem' }}>
                    <X size={18} /> Cancelar
                  </button>
                  <button className="btn-primary" onClick={() => guardarEdicao(doc.id)} style={{ padding: '0.5rem' }}>
                    <Save size={18} /> Guardar
                  </button>
                </div>
              </div>
            ) : (
              <div className="doc-body">
                <span className="doc-label">{doc.type === 'blood' ? 'Tipo Sanguíneo' : 'Nº Identificação'}</span>
                <div className="doc-value-container">
                  {doc.numero ? (
                    <span className="doc-value">{doc.numero}</span>
                  ) : (
                    <span className="doc-empty">Não preenchido</span>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {adicionandoNovo && (
        <div className="add-doc-panel">
          <div className="flex-between mb-4">
            <h3 className="h3">Novo Documento</h3>
            <button className="btn-icon" onClick={() => setAdicionandoNovo(false)}><X size={24} /></button>
          </div>
          <form onSubmit={adicionarNovoDocumento}>
            <div className="input-group">
              <label className="input-label">Tipo de Documento (Ex: Passaporte, Seguro)</label>
              <input
                type="text"
                className="input-field"
                value={novoTitulo}
                onChange={(e) => setNovoTitulo(e.target.value)}
                required
                placeholder="Insira o nome do documento"
              />
            </div>
            <div className="input-group">
              <label className="input-label">Número / Identificador</label>
              <input
                type="text"
                className="input-field"
                value={novoNumero}
                onChange={(e) => setNovoNumero(e.target.value)}
                placeholder="Insira o número de identificação"
              />
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button type="submit" className="btn-primary" style={{ flex: 1 }}>Gravar Documento</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Documentos;
