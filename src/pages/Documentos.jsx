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
      case 'tax': return <FileBadge size={20} />;
      case 'id': return <Fingerprint size={20} />;
      case 'health': return <Stethoscope size={20} />;
      case 'blood': return <Droplet size={20} color="#ef4444" />;
      case 'custom': return <CreditCard size={20} />;
      default: return <FolderHeart size={20} />;
    }
  };

  return (
    <div className="page-container">
      <div className="flex-between mb-4">
        <h2 className="h2 text-gradient">Documentos Oficiais</h2>
        <button className="btn-primary" onClick={() => setAdicionandoNovo(true)}>
          <Plus size={20} />
          <span className="hide-mobile">Adicionar</span>
        </button>
      </div>

      <div className="docs-table-container glass-card">
        <table className="docs-table">
          <thead>
            <tr>
              <th>Documento</th>
              <th>Número / Registo</th>
              <th className="actions-col">Ações</th>
            </tr>
          </thead>
          <tbody>
            {documentos.map((doc, index) => (
              <tr key={doc.id} className={doc.type === 'blood' ? 'blood-row' : ''} style={{ animationDelay: `${index * 0.05}s` }}>
                
                {/* COL 1: Icon and Title */}
                <td className="doc-title-cell">
                  <div className="doc-icon-wrapper">
                    {getDocIcon(doc.type)}
                  </div>
                  <span className="doc-title-text">{doc.titulo}</span>
                </td>

                {/* COL 2: Value or Edit Input */}
                <td className="doc-value-cell">
                  {editandoId === doc.id ? (
                    <div className="table-edit-mode">
                      {doc.type === 'blood' ? (
                        <select
                          className="input-field compact-input"
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
                          className="input-field compact-input"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          placeholder="Introduza o número..."
                          autoFocus
                        />
                      )}
                    </div>
                  ) : (
                    <div className="doc-value-display">
                      {doc.numero ? (
                        <span className={doc.type === 'blood' ? 'blood-badge' : 'doc-number'}>
                          {doc.numero}
                        </span>
                      ) : (
                        <span className="doc-empty-state">Não preenchido</span>
                      )}
                    </div>
                  )}
                </td>

                {/* COL 3: Actions */}
                <td className="doc-actions-cell">
                  {editandoId === doc.id ? (
                    <div className="table-action-btns">
                       <button className="action-btn cancel-btn" onClick={cancelarEdicao} title="Cancelar">
                         <X size={16} />
                       </button>
                       <button className="action-btn save-btn" onClick={() => guardarEdicao(doc.id)} title="Guardar">
                         <Save size={16} />
                       </button>
                    </div>
                  ) : (
                    <div className="table-action-btns">
                      <button 
                        className="action-btn copy-btn" 
                        onClick={() => copiarParaClipboard(doc.numero, doc.id)}
                        title="Copiar"
                        disabled={!doc.numero}
                        style={{ opacity: !doc.numero ? 0.3 : 1 }}
                      >
                        {copiadoId === doc.id ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
                      </button>
                      <button className="action-btn edit-btn" onClick={() => iniciarEdicao(doc)} title="Editar">
                        <Edit2 size={16} />
                      </button>
                      {doc.id > 3 ? (
                        <button className="action-btn delete-btn" onClick={() => removerDocumento(doc.id)} title="Remover">
                          <Trash2 size={16} />
                        </button>
                      ) : (
                        <div style={{ width: '28px' }}></div> /* spacer to align icons if no delete button */
                      )}
                    </div>
                  )}
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add new document modal/panel */}
      {adicionandoNovo && (
        <div className="add-doc-panel animate-fade-in glass-card">
          <div className="flex-between mb-4">
            <h3 className="h3">Adicionar Novo Documento</h3>
            <button className="btn-icon" onClick={() => setAdicionandoNovo(false)}><X size={20} /></button>
          </div>
          <form onSubmit={adicionarNovoDocumento} style={{ display: 'grid', gap: '1rem' }}>
            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="input-group">
                <label className="input-label">Tipo de Documento</label>
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
            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
              Gravar Documento
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Documentos;
