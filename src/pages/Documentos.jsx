import { useState, useEffect } from 'react';
import { Plus, Edit2, Save, Trash2, X, Copy, Check, CreditCard, FolderHeart, Droplet } from 'lucide-react';
import './Documentos.css';

const Documentos = () => {
  const [documentos, setDocumentos] = useState(() => {
    const defaultDocs = [
      { id: 1, titulo: 'NIF (Número de Identificação Fiscal)', numero: '', type: 'tax' },
      { id: 2, titulo: 'Nº Identificação Civil (CC)', numero: '', type: 'id' },
      { id: 3, titulo: 'Nº Utente de Saúde', numero: '', type: 'health' },
      { id: 4, titulo: 'Nº Segurança Social (NISS)', numero: '', type: 'social' },
      { id: 5, titulo: 'Grupo Sanguíneo', numero: '', type: 'blood' },
    ];
    const saved = localStorage.getItem('sofia_documentos');
    if (saved) {
      let parsed = JSON.parse(saved);
      if (!parsed.find(d => d.type === 'social' || (d.titulo && d.titulo.toLowerCase().includes('segurança social')))) {
        const insertIndex = parsed.findIndex(d => d.titulo && d.titulo.toLowerCase().includes('utente'));
        const nissDoc = { id: Date.now(), titulo: 'Nº Segurança Social (NISS)', numero: '', type: 'social' };
        insertIndex !== -1 ? parsed.splice(insertIndex + 1, 0, nissDoc) : parsed.push(nissDoc);
      }
      return parsed;
    }
    return defaultDocs;
  });

  // Edit modal state
  const [editDoc, setEditDoc] = useState(null);   // doc being edited
  const [editTitulo, setEditTitulo] = useState('');
  const [editNumero, setEditNumero] = useState('');

  // Add new doc form
  const [adicionandoNovo, setAdicionandoNovo] = useState(false);
  const [novoTitulo, setNovoTitulo] = useState('');
  const [novoNumero, setNovoNumero] = useState('');

  const [copiadoId, setCopiadoId] = useState(null);

  useEffect(() => {
    localStorage.setItem('sofia_documentos', JSON.stringify(documentos));
  }, [documentos]);

  const abrirEdicao = (doc) => {
    setEditDoc(doc);
    setEditTitulo(doc.titulo || '');
    setEditNumero(doc.numero || '');
  };

  const guardarEdicao = () => {
    if (!editDoc) return;
    setDocumentos(documentos.map(doc =>
      doc.id === editDoc.id ? { ...doc, titulo: editTitulo, numero: editNumero } : doc
    ));
    setEditDoc(null);
  };

  const adicionarNovoDocumento = (e) => {
    e.preventDefault();
    if (novoTitulo.trim() === '') return;
    const novoDoc = { id: Date.now(), titulo: novoTitulo, numero: novoNumero, type: 'custom' };
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
    if (title.includes('segurança social') || title.includes('niss') || title.includes('social')) return 'social';
    if (title.includes('sanguíneo') || title.includes('sangue')) return 'blood';
    if (title.includes('passaporte') || title.includes('passport')) return 'passport';
    return doc.type || 'custom';
  };

  const getDocIcon = (doc) => {
    const t = getDocType(doc);
    switch (t) {
      case 'tax':      return <img src="/nif_logo.png" alt="NIF" className="doc-icon-img" />;
      case 'id':       return <img src="/cc_logo.png" alt="CC" className="doc-icon-img" />;
      case 'health':   return <img src="/sns_logo.png" alt="SNS" className="doc-icon-img" />;
      case 'social':   return <img src="/seg_social_logo.png" alt="NISS" className="doc-icon-img" />;
      case 'blood':    return <Droplet size={22} color="#ef4444" />;
      case 'passport': return <img src="/passport_logo.png" alt="Passaporte" className="doc-icon-img" style={{ borderRadius: '4px' }} />;
      case 'custom':   return <CreditCard size={22} />;
      default:         return <FolderHeart size={22} />;
    }
  };

  const isBlood = (doc) => getDocType(doc) === 'blood';
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

      {/* Table — visible on all screen sizes */}
      <div className="executive-table-wrapper glass-card">
        <table className="executive-table">
          <thead>
            <tr>
              <th>Documento</th>
              <th className="col-number">Número</th>
              <th className="text-right col-actions">Ações</th>
            </tr>
          </thead>
          <tbody>
            {documentos.map((doc, index) => {
              const isPreenchido = doc.numero && doc.numero.trim() !== '';
              return (
                <tr key={doc.id} className="executive-row" style={{ animationDelay: `${index * 0.05}s` }}>
                  {/* Doc name + icon */}
                  <td className="cell-doc">
                    <div className={`cell-icon-badge icon-bg-${getDocType(doc)}`}>
                      {getDocIcon(doc)}
                    </div>
                    <span className="doc-name">{doc.titulo}</span>
                  </td>

                  {/* Number */}
                  <td className="cell-value col-number">
                    {isPreenchido ? (
                      <div className="value-badge-container">
                        <span className={isBlood(doc) ? 'blood-type-badge' : 'mono-number'}>{doc.numero}</span>
                        <button className={`quick-copy-icon ${copiadoId === doc.id ? 'copied' : ''}`} onClick={() => copiarParaClipboard(doc.numero, doc.id)} title="Copiar">
                          {copiadoId === doc.id ? <Check size={13} /> : <Copy size={13} />}
                        </button>
                      </div>
                    ) : (
                      <span className="empty-placeholder">—</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="cell-actions text-right col-actions">
                    <div className="action-pill-group justify-end">
                      <button className="pill-btn edit-pill" onClick={() => abrirEdicao(doc)} title="Editar">
                        <Edit2 size={15} /> <span>Editar</span>
                      </button>
                      <button className="pill-btn delete-pill" onClick={() => removerDocumento(doc.id)} title="Apagar">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ─── EDIT MODAL ─── */}
      {editDoc && (
        <div className="doc-modal-overlay" onClick={() => setEditDoc(null)}>
          <div className="doc-modal-sheet glass-card animate-fade-in" onClick={e => e.stopPropagation()}>
            {/* Sheet handle */}
            <div className="doc-modal-handle"></div>

            <div className="flex-between mb-4">
              <div>
                <p className="doc-modal-label">A editar documento</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.25rem' }}>
                  <div className={`cell-icon-badge icon-bg-${getDocType(editDoc)}`} style={{ width: '32px', height: '32px' }}>
                    {getDocIcon(editDoc)}
                  </div>
                </div>
              </div>
              <button className="btn-icon" onClick={() => setEditDoc(null)}><X size={20} /></button>
            </div>

            {/* Title field */}
            <div className="input-group">
              <label className="input-label">Nome do Documento</label>
              <input
                type="text"
                className="input-field"
                value={editTitulo}
                onChange={e => setEditTitulo(e.target.value)}
                placeholder="Ex: NIF, Cartão de Cidadão..."
              />
            </div>

            {/* Number / Blood type field */}
            <div className="input-group">
              <label className="input-label">
                {isBlood(editDoc) ? 'Grupo Sanguíneo' : 'Número / Identificador'}
              </label>
              {isBlood(editDoc) ? (
                <select className="input-field" value={editNumero} onChange={e => setEditNumero(e.target.value)} autoFocus>
                  <option value="">Selecione o grupo...</option>
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  className="input-field"
                  value={editNumero}
                  onChange={e => setEditNumero(e.target.value)}
                  placeholder="Insira o número ou código..."
                  autoFocus
                />
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button className="btn-outline" style={{ flex: 1 }} onClick={() => setEditDoc(null)}>
                <X size={16} /> Cancelar
              </button>
              <button className="btn-primary" style={{ flex: 1 }} onClick={guardarEdicao}>
                <Save size={16} /> Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── ADD DOCUMENT FORM ─── */}
      {adicionandoNovo && (
        <div className="executive-add-card glass-card animate-fade-in">
          <div className="flex-between mb-3">
            <h3 className="h3">Novo Registo Oficial</h3>
            <button className="btn-icon" onClick={() => setAdicionandoNovo(false)}><X size={20} /></button>
          </div>
          <form onSubmit={adicionarNovoDocumento} className="add-form-grid">
            <div className="input-group">
              <label className="input-label">Nome do Documento</label>
              <input type="text" className="input-field" value={novoTitulo} onChange={(e) => setNovoTitulo(e.target.value)} required placeholder="Ex: Passaporte / Cartão de Seguro" />
            </div>
            <div className="input-group">
              <label className="input-label">Número de Registo</label>
              <input type="text" className="input-field" value={novoNumero} onChange={(e) => setNovoNumero(e.target.value)} placeholder="Ex: N12345678" />
            </div>
            <div className="form-submit-row">
              <button type="button" className="btn-outline" onClick={() => setAdicionandoNovo(false)}>Cancelar</button>
              <button type="submit" className="btn-primary">Gravar Registo</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Documentos;
