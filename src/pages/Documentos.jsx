import { useState, useEffect } from 'react';
import { Plus, Edit2, Save, Trash2, X, Copy, Check, CreditCard, Stethoscope, Fingerprint, FolderHeart, Droplet } from 'lucide-react';
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

  const getDocType = (doc) => {
    if (doc.type && doc.type !== 'custom') return doc.type;
    const title = (doc.titulo || '').toLowerCase();
    if (title.includes('nif') || title.includes('fiscal')) return 'tax';
    if (title.includes('civil') || title.includes('cc')) return 'id';
    if (title.includes('saúde') || title.includes('utente')) return 'health';
    if (title.includes('sanguíneo') || title.includes('sangue')) return 'blood';
    return doc.type || 'custom';
  };

  const getDocIcon = (doc) => {
    const docType = getDocType(doc);
    switch (docType) {
      case 'tax': return <img src="/nif_logo.png" alt="Finanças NIF" style={{ width: '34px', height: '34px', objectFit: 'contain' }} />;
      case 'id': return <Fingerprint size={24} />;
      case 'health': return <Stethoscope size={24} />;
      case 'blood': return <Droplet size={24} color="#ef4444" />;
      case 'custom': return <CreditCard size={24} />;
      default: return <FolderHeart size={24} />;
    }
  };

  const totalPreenchidos = documentos.filter(d => d.numero && d.numero.trim() !== '').length;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex-between mb-4 flex-wrap gap-3">
        <div>
          <h2 className="h2 text-gradient">Registo Documental</h2>
          <p style={{ color: 'var(--color-text-light)', fontSize: '0.9rem', marginTop: '2px' }}>
            Documentos oficiais da Sofia
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="doc-stats-pill">
            <span className="stats-dot green"></span>
            <span><strong>{totalPreenchidos}</strong> de {documentos.length} registados</span>
          </div>
          <button className="btn-primary" onClick={() => setAdicionandoNovo(true)}>
            <Plus size={18} />
            <span className="hide-mobile">Novo Documento</span>
          </button>
        </div>
      </div>

      {/* Clean 3-Column Table Container */}
      <div className="executive-table-wrapper glass-card">
        <table className="executive-table">
          <thead>
            <tr>
              <th>Documento</th>
              <th>Número / Identificador</th>
              <th className="text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {documentos.map((doc, index) => {
              const isPreenchido = doc.numero && doc.numero.trim() !== '';
              const isEditing = editandoId === doc.id;

              return (
                <tr 
                  key={doc.id} 
                  className={`executive-row ${getDocType(doc) === 'blood' ? 'blood-type-row' : ''} ${isEditing ? 'editing-row' : ''}`}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  
                  {/* Document Title + Icon */}
                  <td className="cell-doc">
                    <div className={`cell-icon-badge icon-bg-${getDocType(doc)}`}>
                      {getDocIcon(doc)}
                    </div>
                    <div className="doc-meta">
                      <span className="doc-name">{doc.titulo}</span>
                    </div>
                  </td>

                  {/* Value / Edit Field */}
                  <td className="cell-value">
                    {isEditing ? (
                      <div className="inline-edit-box">
                        {getDocType(doc) === 'blood' ? (
                          <select
                            className="inline-select"
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
                            className="inline-input"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            placeholder="Insira o número..."
                            autoFocus
                          />
                        )}
                      </div>
                    ) : (
                      <div className="value-display-wrapper">
                        {isPreenchido ? (
                          <div className="value-badge-container">
                            <span className={getDocType(doc) === 'blood' ? 'blood-type-badge' : 'mono-number'}>
                              {doc.numero}
                            </span>
                            <button
                              className={`quick-copy-icon ${copiadoId === doc.id ? 'copied' : ''}`}
                              onClick={() => copiarParaClipboard(doc.numero, doc.id)}
                              title="Copiar rápido"
                            >
                              {copiadoId === doc.id ? <Check size={14} /> : <Copy size={14} />}
                            </button>
                          </div>
                        ) : (
                          <span className="empty-placeholder">Não preenchido</span>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="cell-actions text-right">
                    {isEditing ? (
                      <div className="action-pill-group justify-end">
                        <button className="pill-btn save-pill" onClick={() => guardarEdicao(doc.id)} title="Guardar">
                          <Save size={15} /> <span>Guardar</span>
                        </button>
                        <button className="pill-btn cancel-pill" onClick={cancelarEdicao} title="Cancelar">
                          <X size={15} />
                        </button>
                      </div>
                    ) : (
                      <div className="action-pill-group justify-end">
                        <button className="pill-btn edit-pill" onClick={() => iniciarEdicao(doc)} title="Editar">
                          <Edit2 size={15} /> <span>Editar</span>
                        </button>
                        {doc.id > 4 && (
                          <button className="pill-btn delete-pill" onClick={() => removerDocumento(doc.id)} title="Remover">
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    )}
                  </td>

                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add Document Modal/Card */}
      {adicionandoNovo && (
        <div className="executive-add-card glass-card animate-fade-in">
          <div className="flex-between mb-3">
            <h3 className="h3">Novo Registo Oficial</h3>
            <button className="btn-icon" onClick={() => setAdicionandoNovo(false)}><X size={20} /></button>
          </div>
          <form onSubmit={adicionarNovoDocumento} className="add-form-grid">
            <div className="input-group">
              <label className="input-label">Nome do Documento</label>
              <input
                type="text"
                className="input-field"
                value={novoTitulo}
                onChange={(e) => setNovoTitulo(e.target.value)}
                required
                placeholder="Ex: Passaporte / Cartão de Seguro"
              />
            </div>
            <div className="input-group">
              <label className="input-label">Número de Registo</label>
              <input
                type="text"
                className="input-field"
                value={novoNumero}
                onChange={(e) => setNovoNumero(e.target.value)}
                placeholder="Ex: N12345678"
              />
            </div>
            <div className="form-submit-row">
              <button type="button" className="btn-outline" onClick={() => setAdicionandoNovo(false)}>
                Cancelar
              </button>
              <button type="submit" className="btn-primary">
                Gravar Registo
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Documentos;
