import { useState, useEffect, useRef } from 'react';
import { Plus, Pencil, Save, Trash2, X, Copy, Check, CreditCard, FolderHeart, Droplet, AlertTriangle, ChevronUp, ChevronDown, GripVertical, FileText, Upload, Image as ImageIcon, File } from 'lucide-react';
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

  // Scans State
  const [activeSubTab, setActiveSubTab] = useState('text');
  const [categorias, setCategorias] = useState([]);
  const [digitalizacoes, setDigitalizacoes] = useState([]);
  const [expandedCats, setExpandedCats] = useState({});
  const [adicionandoCat, setAdicionandoCat] = useState(false);
  const [novaCatNome, setNovaCatNome] = useState('');
  
  const [adicionandoDocScan, setAdicionandoDocScan] = useState(null); // categoria_id
  const [novoDocScanTitulo, setNovoDocScanTitulo] = useState('');
  const [novoDocScanFicheiro, setNovoDocScanFicheiro] = useState(null);
  const fileInputRef = useRef(null);

  const [previewFile, setPreviewFile] = useState(null); // URL of file to preview

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

  useEffect(() => {
    if (activeSubTab === 'scans') {
      api.getCategorias().then(data => setCategorias(data || []));
      api.getDigitalizacoes().then(data => setDigitalizacoes(data || []));
    }
  }, [activeSubTab]);

  const toggleCategoria = (id) => {
    setExpandedCats(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddCategoria = async (e) => {
    e.preventDefault();
    if (!novaCatNome.trim()) return;
    const nova = { id: Date.now(), nome: novaCatNome, ordem: categorias.length };
    const newList = [...categorias, nova];
    setCategorias(newList);
    setExpandedCats(prev => ({ ...prev, [nova.id]: true }));
    await api.saveCategoria(nova);
    setAdicionandoCat(false);
    setNovaCatNome('');
  };

  const handleDeleteCategoria = async (id) => {
    if (!window.confirm("Remover esta categoria e todos os seus ficheiros?")) return;
    setCategorias(prev => prev.filter(c => c.id !== id));
    setDigitalizacoes(prev => prev.filter(d => d.categoria_id !== id));
    await api.deleteCategoria(id);
  };

  const handleAddScan = async (e) => {
    e.preventDefault();
    if (!novoDocScanTitulo.trim() || !novoDocScanFicheiro) return;

    const formData = new FormData();
    const docId = Date.now();
    formData.append('id', docId);
    formData.append('categoria_id', adicionandoDocScan);
    formData.append('titulo', novoDocScanTitulo);
    formData.append('file', novoDocScanFicheiro);

    // Optimistic UI could be tricky without filename from server, so we wait.
    const res = await api.saveDigitalizacao(formData);
    if (res && res.success) {
      const novo = {
        id: docId,
        categoria_id: adicionandoDocScan,
        titulo: novoDocScanTitulo,
        filename: res.filename,
        original_name: res.original_name,
        created_at: new Date().toISOString()
      };
      setDigitalizacoes(prev => [novo, ...prev]);
    }
    setAdicionandoDocScan(null);
    setNovoDocScanTitulo('');
    setNovoDocScanFicheiro(null);
  };

  const handleDeleteScan = async (id) => {
    if (!window.confirm("Remover ficheiro?")) return;
    setDigitalizacoes(prev => prev.filter(d => d.id !== id));
    await api.deleteDigitalizacao(id);
  };

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
    const listWithOrder = novaLista.map((doc, idx) => ({ ...doc, ordem: idx }));
    setDocumentos(listWithOrder);
    api.saveDocumentos(listWithOrder);
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
        <div className="doc-header-actions">
          {activeSubTab === 'text' && (
            <>
              <div className="doc-stats-pill">
                <span className="stats-dot green"></span>
                <span><strong>{totalPreenchidos}</strong> de {documentos.length} registados</span>
              </div>
              <button className="btn-primary doc-add-btn" onClick={() => setAdicionandoNovo(true)}>
                <Plus size={18} />
                <span>Novo Documento</span>
              </button>
            </>
          )}
          {activeSubTab === 'scans' && (
            <button className="btn-primary doc-add-btn" onClick={() => setAdicionandoCat(true)}>
              <FolderHeart size={18} />
              <span>Nova Categoria</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="sub-tabs-container">
        <button 
          className={`sub-tab ${activeSubTab === 'text' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('text')}
        >
          <FileText size={16} /> Dados Escritos
        </button>
        <button 
          className={`sub-tab ${activeSubTab === 'scans' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('scans')}
        >
          <ImageIcon size={16} /> Digitalizações
        </button>
      </div>

      {activeSubTab === 'text' ? (
      <div className="executive-table-wrapper">
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
                    <div className="drag-handle-badge" title="Arraste para reordenar">
                      <GripVertical size={18} />
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
                      <button className="btn-action-edit" onClick={() => abrirEdicao(doc)} title="Editar documento">
                        <Pencil size={17} />
                      </button>
                      <button className="btn-action-delete" onClick={() => setConfirmarDelete(doc.id)} title="Remover documento">
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      ) : (
      <div className="scans-container">
        {categorias.length === 0 ? (
          <div className="empty-state">
            <FolderHeart size={48} color="var(--color-primary-light)" />
            <p>Nenhuma categoria de digitalizações criada.</p>
            <button className="btn-outline" onClick={() => setAdicionandoCat(true)}>Criar Categoria</button>
          </div>
        ) : (
          <div className="categorias-list">
            {categorias.map(cat => {
              const catDocs = digitalizacoes.filter(d => String(d.categoria_id) === String(cat.id));
              const isExpanded = expandedCats[cat.id];
              return (
                <div key={cat.id} className="categoria-card">
                  <div className="categoria-header" onClick={() => toggleCategoria(cat.id)}>
                    <div className="cat-title-left">
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      <span className="cat-name">{cat.nome}</span>
                      <span className="cat-badge">{catDocs.length} ficheiro(s)</span>
                    </div>
                    <div className="cat-actions" onClick={e => e.stopPropagation()}>
                      <button className="btn-action-edit" title="Adicionar Documento" onClick={() => setAdicionandoDocScan(cat.id)}>
                        <Plus size={16} />
                      </button>
                      <button className="btn-action-delete" title="Remover Categoria" onClick={() => handleDeleteCategoria(cat.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div className="categoria-body">
                      {catDocs.length === 0 ? (
                        <p className="empty-placeholder">Nenhum ficheiro anexado.</p>
                      ) : (
                        <div className="scans-grid">
                          {catDocs.map(doc => {
                            const isPdf = doc.filename.toLowerCase().endsWith('.pdf');
                            const fileUrl = `/uploads/${doc.filename}`;
                            return (
                              <div key={doc.id} className="scan-item">
                                <div className="scan-preview" onClick={() => setPreviewFile(fileUrl)}>
                                  {isPdf ? <File size={40} color="var(--color-primary)" /> : <img src={fileUrl} alt={doc.titulo} />}
                                </div>
                                <div className="scan-info">
                                  <span className="scan-title" title={doc.titulo}>{doc.titulo}</span>
                                  <button className="btn-action-delete" onClick={() => handleDeleteScan(doc.id)}>
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      )}

      {/* ─── ADD CATEGORIA MODAL ─── */}
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

      {/* ─── ADD CATEGORIA MODAL ─── */}
      {adicionandoCat && (
        <div className="modal-overlay" onClick={() => setAdicionandoCat(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Nova Categoria</h3>
              <button className="btn-icon" onClick={() => setAdicionandoCat(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleAddCategoria} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="input-group">
                <label className="input-label">Nome da Categoria</label>
                <input type="text" className="input-field" value={novaCatNome} onChange={e => setNovaCatNome(e.target.value)} placeholder="Ex: Médico, Finanças..." required autoFocus />
              </div>
              <div className="form-actions">
                <button type="button" className="btn-outline" onClick={() => setAdicionandoCat(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Criar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── ADD SCAN MODAL ─── */}
      {adicionandoDocScan && (
        <div className="modal-overlay" onClick={() => { setAdicionandoDocScan(null); setNovoDocScanFicheiro(null); }}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Novo Ficheiro</h3>
              <button className="btn-icon" onClick={() => { setAdicionandoDocScan(null); setNovoDocScanFicheiro(null); }}><X size={18} /></button>
            </div>
            <form onSubmit={handleAddScan} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="input-group">
                <label className="input-label">Título do Documento</label>
                <input type="text" className="input-field" value={novoDocScanTitulo} onChange={e => setNovoDocScanTitulo(e.target.value)} placeholder="Ex: Cartão de Cidadão Frente" required autoFocus />
              </div>
              <div className="input-group">
                <label className="input-label">Ficheiro (Imagem ou PDF)</label>
                <input type="file" ref={fileInputRef} accept="image/*,application/pdf" className="input-field" onChange={e => setNovoDocScanFicheiro(e.target.files[0])} required />
              </div>
              <div className="form-actions">
                <button type="button" className="btn-outline" onClick={() => { setAdicionandoDocScan(null); setNovoDocScanFicheiro(null); }}>Cancelar</button>
                <button type="submit" className="btn-primary">Enviar Ficheiro</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── PREVIEW FILE MODAL ─── */}
      {previewFile && (
        <div className="modal-overlay" style={{ zIndex: 9999, background: 'rgba(0,0,0,0.85)' }} onClick={() => setPreviewFile(null)}>
          <div className="modal-preview-wrapper" style={{ position: 'relative', width: '90%', height: '90%', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={e => e.stopPropagation()}>
            <button className="btn-icon" style={{ position: 'absolute', top: '-10px', right: '-10px', background: 'white', borderRadius: '50%' }} onClick={() => setPreviewFile(null)}>
              <X size={24} color="black" />
            </button>
            {previewFile.toLowerCase().endsWith('.pdf') ? (
              <iframe src={previewFile} title="Preview" style={{ width: '100%', height: '100%', border: 'none', borderRadius: '12px', background: 'white' }} />
            ) : (
              <img src={previewFile} alt="Preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '12px' }} />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Documentos;
