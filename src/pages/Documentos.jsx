import { useState, useEffect } from 'react';
import { Plus, Pencil, Save, Trash2, X, Copy, Check, CreditCard, FolderHeart, Droplet, AlertTriangle, ChevronUp, ChevronDown, GripVertical } from 'lucide-react';
import { api } from '../services/api';
import './Documentos.css';

const defaultDocs = [
  { id: 1, titulo: 'NIF', numero: '', type: 'tax' },
  { id: 2, titulo: 'Cartão Cidadão', numero: '', type: 'id' },
  { id: 3, titulo: 'Nº Utente', numero: '', type: 'health' },
  { id: 4, titulo: 'Segurança Social', numero: '', type: 'social' },
  { id: 5, titulo: 'Cartão de Seguro', numero: '', type: 'insurance' },
  { id: 6, titulo: 'Grupo Sanguíneo', numero: '', type: 'blood' },
];

const Documentos = () => {
  const [documentos, setDocumentos] = useState([]);
  const [editDoc, setEditDoc] = useState(null);
  const [editTitulo, setEditTitulo] = useState('');
  const [editNumero, setEditNumero] = useState('');
  const [adicionandoNovo, setAdicionandoNovo] = useState(false);
  const [novoTitulo, setNovoTitulo] = useState('');
  const [novoNumero, setNovoNumero] = useState('');
  const [copiadoId, setCopiadoId] = useState(null);
  const [confirmarDelete, setConfirmarDelete] = useState(null);
  const [draggedIndex, setDraggedIndex] = useState(null);

  useEffect(() => {
    api.getDocumentos(defaultDocs).then(data => {
      const seenTypes = new Set();
      const clean = [];
      (data || []).forEach(doc => {
        const docType = getDocType(doc);
        const typeKey = (docType && docType !== 'custom') ? docType : (doc.titulo || '').toLowerCase().trim();
        
        const normalizedDoc = { ...doc, type: docType };
        if (docType === 'insurance') normalizedDoc.titulo = 'Cartão de Seguro';
        if (docType === 'blood') normalizedDoc.titulo = 'Grupo Sanguíneo';

        if (!seenTypes.has(typeKey) || docType === 'custom') {
          if (docType && docType !== 'custom') seenTypes.add(typeKey);
          clean.push(normalizedDoc);
        }
      });

      // Ensure Cartão de Seguro exists
      if (!seenTypes.has('insurance')) {
        clean.push({ id: Date.now(), titulo: 'Cartão de Seguro', numero: '', type: 'insurance' });
      }

      setDocumentos(clean);
      localStorage.setItem('sofia_documentos', JSON.stringify(clean));
      api.saveDocumentos(clean);
    });
  }, []);

  const abrirEdicao = (doc) => {
    setEditDoc(doc);
    setEditTitulo(doc.titulo || '');
    setEditNumero(doc.numero || '');
  };

  const guardarEdicao = () => {
    if (!editDoc) return;
    const novaLista = documentos.map(doc =>
      doc.id === editDoc.id ? { ...doc, titulo: editTitulo, numero: editNumero } : doc
    );
    setDocumentos(novaLista);
    api.updateDocumento(editDoc.id, editTitulo, editNumero, novaLista);
    setEditDoc(null);
  };

  const adicionarNovoDocumento = (e) => {
    e.preventDefault();
    if (novoTitulo.trim() === '') return;
    const novoDoc = { id: Date.now(), titulo: novoTitulo, numero: novoNumero, type: 'custom' };
    const novaLista = [...documentos, novoDoc];
    setDocumentos(novaLista);
    api.saveDocumentos(novaLista);
    setAdicionandoNovo(false);
    setNovoTitulo('');
    setNovoNumero('');
  };

  const removerDocumentoConfirmado = () => {
    if (!confirmarDelete) return;
    const id = confirmarDelete;
    const novaLista = documentos.filter(doc => doc.id !== id);
    setDocumentos(novaLista);
    api.deleteDocumento(id, novaLista);
    setConfirmarDelete(null);
  };

  const moverDoc = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= documentos.length) return;
    const novaLista = [...documentos];
    const [movedItem] = novaLista.splice(index, 1);
    novaLista.splice(targetIndex, 0, movedItem);
    setDocumentos(novaLista);
    api.saveDocumentos(novaLista);
  };

  // Drag & Drop Handlers
  const handleDragStart = (e, index) => {
    e.dataTransfer.setData('text/plain', index.toString());
    setDraggedIndex(index);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    const dragIndexStr = e.dataTransfer.getData('text/plain');
    const dragIndex = parseInt(dragIndexStr, 10);
    if (isNaN(dragIndex) || dragIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }
    const novaLista = [...documentos];
    const [movedItem] = novaLista.splice(dragIndex, 1);
    novaLista.splice(dropIndex, 0, movedItem);
    setDocumentos(novaLista);
    api.saveDocumentos(novaLista);
    setDraggedIndex(null);
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
    if (title.includes('civil') || title.includes('cc') || title.includes('cidadão')) return 'id';
    if (title.includes('saúde') || title.includes('utente')) return 'health';
    if (title.includes('segurança social') || title.includes('niss') || title.includes('social')) return 'social';
    if (title.includes('seguro') || title.includes('insurance') || title.includes('generali')) return 'insurance';
    if (title.includes('sanguíneo') || title.includes('sangue')) return 'blood';
    if (title.includes('passaporte') || title.includes('passport')) return 'passport';
    return doc.type || 'custom';
  };

  const getDocIcon = (doc) => {
    const t = getDocType(doc);
    switch (t) {
      case 'tax':       return <img src="/nif_logo.png" alt="NIF" className="doc-icon-img" />;
      case 'id':        return <img src="/cc_logo.png" alt="CC" className="doc-icon-img" />;
      case 'health':    return <img src="/sns_logo.png" alt="SNS" className="doc-icon-img" />;
      case 'social':    return <img src="/seg_social_logo.png" alt="NISS" className="doc-icon-img" />;
      case 'insurance': return <img src="/generalli.png" alt="Cartão de Seguro" className="doc-icon-img-insurance" />;
      case 'blood':     return <Droplet size={22} color="#ef4444" />;
      case 'passport':  return <img src="/passport_logo.png" alt="Passaporte" className="doc-icon-img" style={{ borderRadius: '4px' }} />;
      case 'custom':    return <CreditCard size={22} />;
      default:          return <FolderHeart size={22} />;
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
          <colgroup>
            <col style={{ width: '65%' }} />   {/* Document name & number */}
            <col style={{ width: '35%' }} />   {/* Actions */}
          </colgroup>
          <thead>
            <tr>
              <th>Documento</th>
              <th className="text-right col-actions">Ações</th>
            </tr>
          </thead>
          <tbody>
            {documentos.map((doc, index) => {
              const isPreenchido = doc.numero && doc.numero.trim() !== '';
              return (
                <tr
                  key={doc.id}
                  className={`executive-row ${draggedIndex === index ? 'dragging' : ''}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                  style={{ animationDelay: `${index * 0.04}s` }}
                >
                  {/* Doc name + drag handle + icon + number */}
                  <td className="cell-doc">
                    <div className="drag-handle-icon" title="Arraste para reordenar">
                      <GripVertical size={16} color="var(--color-border)" />
                    </div>
                    <div className={`cell-icon-badge icon-bg-${getDocType(doc)}`}>
                      {getDocIcon(doc)}
                    </div>
                    <div className="doc-meta">
                      <span className="doc-name">{doc.titulo}</span>
                      {isPreenchido ? (
                        <div className="value-badge-container" style={{ marginTop: '0.25rem' }}>
                          <span className={isBlood(doc) ? 'blood-type-badge' : 'mono-number'}>{doc.numero}</span>
                          <button className={`quick-copy-icon ${copiadoId === doc.id ? 'copied' : ''}`} onClick={() => copiarParaClipboard(doc.numero, doc.id)} title="Copiar">
                            {copiadoId === doc.id ? <Check size={13} /> : <Copy size={13} />}
                          </button>
                        </div>
                      ) : (
                        <span className="empty-placeholder" style={{ marginTop: '0.2rem', display: 'block' }}>Não preenchido</span>
                      )}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="cell-actions text-right col-actions">
                    <div className="btn-action-group">
                      <button
                        className="btn-action-move"
                        onClick={() => moverDoc(index, -1)}
                        disabled={index === 0}
                        title="Mover para cima"
                      >
                        <ChevronUp size={16} />
                      </button>
                      <button
                        className="btn-action-move"
                        onClick={() => moverDoc(index, 1)}
                        disabled={index === documentos.length - 1}
                        title="Mover para baixo"
                      >
                        <ChevronDown size={16} />
                      </button>
                      <button className="btn-action-edit" onClick={() => abrirEdicao(doc)} title="Editar documento">
                        <Pencil size={16} />
                      </button>
                      <button className="btn-action-delete" onClick={() => setConfirmarDelete(doc.id)} title="Remover documento">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ─── EDIT DOCUMENT MODAL ─── */}
      {editDoc && (
        <div className="modal-overlay" onClick={() => setEditDoc(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <div className={`modal-icon-badge icon-bg-${getDocType(editDoc)}`}>
                  {getDocIcon(editDoc)}
                </div>
                <div>
                  <h3 className="modal-title">Editar Documento</h3>
                  <p className="modal-subtitle">{editDoc.titulo}</p>
                </div>
              </div>
              <button className="btn-icon" onClick={() => setEditDoc(null)}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="input-group">
                <label className="input-label">Nome do Documento</label>
                <input
                  type="text"
                  className="input-field"
                  value={editTitulo}
                  onChange={e => setEditTitulo(e.target.value)}
                  placeholder="Ex: NIF, Cartão de Cidadão, Cartão de Seguro..."
                />
              </div>

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

              <div className="form-actions">
                <button className="btn-outline" onClick={() => setEditDoc(null)}>
                  <X size={16} /> Cancelar
                </button>
                <button className="btn-primary" onClick={guardarEdicao}>
                  <Save size={16} /> Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── ADD DOCUMENT MODAL ─── */}
      {adicionandoNovo && (
        <div className="modal-overlay" onClick={() => setAdicionandoNovo(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <div className="modal-icon-badge">
                  <Plus size={22} />
                </div>
                <div>
                  <h3 className="modal-title">Novo Documento</h3>
                  <p className="modal-subtitle">Adicione um novo documento ao registo</p>
                </div>
              </div>
              <button className="btn-icon" onClick={() => setAdicionandoNovo(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={adicionarNovoDocumento} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="input-group">
                <label className="input-label">Nome do Documento</label>
                <input
                  type="text"
                  className="input-field"
                  value={novoTitulo}
                  onChange={e => setNovoTitulo(e.target.value)}
                  placeholder="Ex: Cartão de Seguro / Passaporte"
                  required
                  autoFocus
                />
              </div>

              <div className="input-group">
                <label className="input-label">Número / Identificador</label>
                <input
                  type="text"
                  className="input-field"
                  value={novoNumero}
                  onChange={e => setNovoNumero(e.target.value)}
                  placeholder="Insira o número..."
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn-outline" onClick={() => setAdicionandoNovo(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Gravar Registo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmarDelete && (
        <div className="modal-overlay" onClick={() => setConfirmarDelete(null)}>
          <div className="modal-card" style={{ maxWidth: '400px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.5rem' }}>
              <AlertTriangle size={26} color="#ef4444" />
            </div>
            <div>
              <h3 style={{ margin: '0 0 0.35rem', fontSize: '1.15rem', fontWeight: 800 }}>Remover Documento?</h3>
              <p style={{ color: 'var(--color-text-light)', fontSize: '0.86rem', margin: 0 }}>
                Este documento será removido do registo da Sofia.
              </p>
            </div>
            <div className="form-actions" style={{ marginTop: '0.5rem' }}>
              <button className="btn-outline" onClick={() => setConfirmarDelete(null)}>
                <X size={16} /> Cancelar
              </button>
              <button
                className="btn-primary"
                style={{ background: '#ef4444', borderColor: '#ef4444', boxShadow: '0 4px 14px rgba(239,68,68,0.35)' }}
                onClick={removerDocumentoConfirmado}
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

export default Documentos;
