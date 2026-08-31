import { useState, useEffect, useRef } from 'react';
import { Plus, Pencil, Save, Trash2, X, Copy, Check, CreditCard, FolderHeart, Droplet, AlertTriangle, ChevronUp, ChevronDown, GripVertical, FileText, Upload, Image as ImageIcon, File, Download, Lock, Eye, EyeOff } from 'lucide-react';
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

const CATEGORY_COLORS = [
  '#ef4444', // Vermelho
  '#3b82f6', // Azul
  '#10b981', // Verde
  '#f59e0b', // Âmbar
  '#8b5cf6', // Roxo
  '#ec4899', // Rosa
  '#0ea5e9', // Azul Céu
  '#f97316', // Laranja
  '#14b8a6', // Teal
  '#84cc16', // Lima
  '#6366f1', // Indigo
  '#f43f5e'  // Rosa choque
];

const hexToRgb = (hex) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
};

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
  const [activeSubTab, setActiveSubTab] = useState(() => {
    return sessionStorage.getItem('docs_active_tab') || 'text';
  });

  useEffect(() => {
    sessionStorage.setItem('docs_active_tab', activeSubTab);
  }, [activeSubTab]);
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

  // Acessos State
  const [acessos, setAcessos] = useState([]);
  const [adicionandoAcesso, setAdicionandoAcesso] = useState(false);
  const [editAcessoId, setEditAcessoId] = useState(null);
  const [acessoTitulo, setAcessoTitulo] = useState('');
  const [acessoUsername, setAcessoUsername] = useState('');
  const [acessoPassword, setAcessoPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState({});
  const [expandedAcessos, setExpandedAcessos] = useState({});

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
    if (activeSubTab === 'acessos') {
      api.getAcessos().then(data => setAcessos(data || []));
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

  const handleSalvarAcesso = async (e) => {
    e.preventDefault();
    if (!acessoTitulo.trim()) return;
    
    const novoAcesso = {
      id: editAcessoId || Date.now(),
      titulo: acessoTitulo,
      username: acessoUsername,
      password: acessoPassword
    };

    let novaLista;
    if (editAcessoId) {
      novaLista = acessos.map(a => a.id === editAcessoId ? novoAcesso : a);
    } else {
      novaLista = [novoAcesso, ...acessos];
    }
    
    setAcessos(novaLista);
    await api.saveAcesso(novoAcesso);
    
    setAdicionandoAcesso(false);
    setEditAcessoId(null);
    setAcessoTitulo('');
    setAcessoUsername('');
    setAcessoPassword('');
  };

  const handleDeleteAcesso = async (id) => {
    if (!window.confirm("Remover este acesso?")) return;
    setAcessos(prev => prev.filter(a => a.id !== id));
    await api.deleteAcesso(id);
  };

  const abrirEdicaoAcesso = (acesso) => {
    setEditAcessoId(acesso.id);
    setAcessoTitulo(acesso.titulo || '');
    setAcessoUsername(acesso.username || '');
    setAcessoPassword(acesso.password || '');
    setAdicionandoAcesso(true);
  };

  const toggleShowPassword = (id) => {
    setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleAcessoExpand = (id) => {
    setExpandedAcessos(prev => ({ ...prev, [id]: !prev[id] }));
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
          {activeSubTab === 'acessos' && (
            <button className="btn-primary doc-add-btn" onClick={() => {
              setEditAcessoId(null);
              setAcessoTitulo('');
              setAcessoUsername('');
              setAcessoPassword('');
              setAdicionandoAcesso(true);
            }}>
              <Plus size={18} />
              <span>Novo Acesso</span>
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
          <FileText size={16} /> Documentos
        </button>
        <button 
          className={`sub-tab ${activeSubTab === 'scans' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('scans')}
        >
          <ImageIcon size={16} /> Digitalizações
        </button>
        <button 
          className={`sub-tab ${activeSubTab === 'acessos' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('acessos')}
        >
          <Lock size={16} /> Acessos
        </button>
      </div>

      {activeSubTab === 'text' && (
      <div className="executive-list-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
            {documentos.map((doc, index) => {
              const isPreenchido = doc.numero && doc.numero.trim() !== '';
              return (
                <div
                  key={doc.id}
                  className={`executive-card ${draggedIndex === index ? 'dragging' : ''}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                  style={{ 
                    animationDelay: `${index * 0.04}s`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1rem 1.5rem',
                    background: 'linear-gradient(135deg, rgba(253, 242, 248, 0.95), rgba(252, 231, 243, 0.85))',
                    border: '2px solid rgba(244, 63, 94, 1)',
                    borderBottom: '3px solid rgba(225, 29, 72, 1)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: '0 0 10px rgba(244, 63, 94, 0.6), inset 0 0 12px rgba(255, 255, 255, 0.7)',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    opacity: 0,
                    animation: 'tableRowFade 0.5s ease forwards'
                  }}
                >
                  {/* Doc name + drag handle + icon + number */}
                  <div className="cell-doc" style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: 0 }}>
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
                  </div>

                  {/* Actions */}
                  <div className="cell-actions text-right col-actions" style={{ flexShrink: 0, marginLeft: '1rem' }}>
                    <div className="btn-action-group">
                      <button className="btn-action-edit" onClick={() => abrirEdicao(doc)} title="Editar documento">
                        <Pencil size={17} />
                      </button>
                      <button className="btn-action-delete" onClick={() => setConfirmarDelete(doc.id)} title="Remover documento">
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
      </div>
      )}
      
      {activeSubTab === 'scans' && (
      <div className="scans-container">
        {categorias.length === 0 ? (
          <div className="empty-state">
            <FolderHeart size={48} color="var(--color-primary-light)" />
            <p>Nenhuma categoria de digitalizações criada.</p>
            <button className="btn-outline" onClick={() => setAdicionandoCat(true)}>Criar Categoria</button>
          </div>
        ) : (
          <div className="categorias-list">
            {categorias.map((cat, index) => {
              const catDocs = digitalizacoes.filter(d => String(d.categoria_id) === String(cat.id));
              const isExpanded = expandedCats[cat.id];
              const themeColor = CATEGORY_COLORS[index % CATEGORY_COLORS.length];
              const rgb = hexToRgb(themeColor);
              return (
                <div key={cat.id} className="categoria-card" style={{ 
                  border: `2px solid rgba(${rgb}, 1)`, 
                  borderBottom: `3px solid rgba(${rgb}, 1)`, 
                  boxShadow: `0 0 10px rgba(${rgb}, 0.8), 0 0 20px rgba(${rgb}, 0.6), inset 0 0 10px rgba(${rgb}, 0.8), 0 8px 32px -4px rgba(${rgb}, 0.25)` 
                }}>
                  <div className="categoria-header" onClick={() => toggleCategoria(cat.id)}>
                    <div className="cat-title-left">
                      {isExpanded ? <ChevronUp size={20} color={themeColor} /> : <ChevronDown size={20} color={themeColor} />}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.15rem' }}>
                        <span className="cat-name" style={{ color: themeColor, lineHeight: '1.2' }}>{cat.nome}</span>
                        <span className="cat-badge" style={{ padding: '0.1rem 0.5rem', fontSize: '0.7rem' }}>{catDocs.length} ficheiro(s)</span>
                      </div>
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
                        <div className="scans-list">
                          {catDocs.map(doc => {
                            const isPdf = doc.filename.toLowerCase().endsWith('.pdf');
                            const fileUrl = `/uploads/${doc.filename}`;
                            return (
                              <div key={doc.id} className="scan-list-item">
                                <div className="scan-list-icon" onClick={() => setPreviewFile(fileUrl)}>
                                  {isPdf ? <File size={26} color="var(--color-primary)" /> : <img src={fileUrl} alt={doc.titulo} />}
                                </div>
                                <div className="scan-list-info" onClick={() => setPreviewFile(fileUrl)}>
                                  <span className="scan-list-title" title={doc.titulo}>{doc.titulo}</span>
                                </div>
                                <div className="scan-list-actions">
                                  <a 
                                    href={fileUrl} 
                                    download={doc.original_name || doc.filename} 
                                    className="btn-action-edit" 
                                    title="Download" 
                                    onClick={e => e.stopPropagation()}
                                  >
                                    <Download size={16} />
                                  </a>
                                  <button className="btn-action-delete" onClick={(e) => { e.stopPropagation(); handleDeleteScan(doc.id); }}>
                                    <Trash2 size={16} />
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

      {activeSubTab === 'acessos' && (
      <div className="acessos-container">
        {acessos.length === 0 ? (
          <div className="empty-state">
            <Lock size={48} color="var(--color-primary-light)" />
            <p>Nenhum acesso guardado.</p>
            <button className="btn-outline" onClick={() => {
              setEditAcessoId(null);
              setAcessoTitulo('');
              setAcessoUsername('');
              setAcessoPassword('');
              setAdicionandoAcesso(true);
            }}>Criar Acesso</button>
          </div>
        ) : (
          <div className="executive-list-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
            {acessos.map((acesso, index) => {
              const isShowing = showPasswords[acesso.id];
              return (
                <div key={acesso.id} className="executive-card" style={{ 
                    animationDelay: `${index * 0.04}s`,
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '1rem 1.5rem',
                    background: 'linear-gradient(135deg, rgba(253, 242, 248, 0.95), rgba(252, 231, 243, 0.85))',
                    border: '2px solid rgba(139, 92, 246, 0.5)',
                    borderBottom: '3px solid rgba(139, 92, 246, 0.8)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: '0 0 10px rgba(139, 92, 246, 0.3), inset 0 0 12px rgba(255, 255, 255, 0.7)',
                    opacity: 0,
                    animation: 'tableRowFade 0.5s ease forwards'
                  }}>
                  
                  <div 
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                    onClick={() => toggleAcessoExpand(acesso.id)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {expandedAcessos[acesso.id] ? <ChevronUp size={20} color="#8b5cf6" /> : <ChevronDown size={20} color="#8b5cf6" />}
                      <div className="cell-icon-badge icon-bg-social" style={{ transform: 'scale(0.85)', transformOrigin: 'left center' }}>
                        <img src="/seg_social_logo.png" alt="NISS" className="doc-icon-img" />
                      </div>
                      <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#4c1d95' }}>{acesso.titulo}</h4>
                    </div>
                    <div className="btn-action-group" onClick={e => e.stopPropagation()}>
                      <button className="btn-action-edit" onClick={() => abrirEdicaoAcesso(acesso)} title="Editar acesso">
                        <Pencil size={17} />
                      </button>
                      <button className="btn-action-delete" onClick={() => handleDeleteAcesso(acesso.id)} title="Remover acesso">
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </div>

                  {expandedAcessos[acesso.id] && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(139, 92, 246, 0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(255, 255, 255, 0.6)', padding: '0.6rem 0.8rem', borderRadius: '12px', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)', border: '1px solid rgba(255, 255, 255, 0.8)' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#6b7280', width: '85px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Utilizador</span>
                      <span style={{ flex: 1, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', color: '#1f2937', fontWeight: 500, fontSize: '0.95rem' }}>
                        {acesso.username || '-'}
                      </span>
                      <button className="quick-copy-icon" style={{ background: 'white', border: '1px solid #e5e7eb', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }} onClick={() => copiarParaClipboard(acesso.username, acesso.id + 'u')} title="Copiar Utilizador">
                        {copiadoId === (acesso.id + 'u') ? <Check size={15} color="#10b981" /> : <Copy size={15} color="#6b7280" />}
                      </button>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(255, 255, 255, 0.6)', padding: '0.6rem 0.8rem', borderRadius: '12px', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)', border: '1px solid rgba(255, 255, 255, 0.8)' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#6b7280', width: '85px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Password</span>
                      <span style={{ flex: 1, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', color: '#1f2937', fontWeight: 500, fontSize: '0.95rem', letterSpacing: isShowing ? 'normal' : '3px' }}>
                        {isShowing ? (acesso.password || '-') : '••••••••'}
                      </span>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button className="quick-copy-icon" style={{ background: 'white', border: '1px solid #e5e7eb', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }} onClick={() => toggleShowPassword(acesso.id)} title={isShowing ? "Ocultar" : "Mostrar"}>
                          {isShowing ? <EyeOff size={15} color="#6b7280" /> : <Eye size={15} color="#6b7280" />}
                        </button>
                        <button className="quick-copy-icon" style={{ background: 'white', border: '1px solid #e5e7eb', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }} onClick={() => copiarParaClipboard(acesso.password, acesso.id + 'p')} title="Copiar Palavra-passe">
                          {copiadoId === (acesso.id + 'p') ? <Check size={15} color="#10b981" /> : <Copy size={15} color="#6b7280" />}
                        </button>
                      </div>
                    </div>
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
        <div className="modal-overlay" style={{ zIndex: 9999, background: 'rgba(0,0,0,0.85)', padding: '3rem 1rem 1rem 1rem', boxSizing: 'border-box' }} onClick={() => setPreviewFile(null)}>
          <button className="btn-icon" style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'white', borderRadius: '50%', zIndex: 10000, padding: '0.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setPreviewFile(null)}>
            <X size={24} color="black" />
          </button>
          <div className="modal-preview-wrapper" style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={e => e.stopPropagation()}>
            {previewFile.toLowerCase().endsWith('.pdf') ? (
              <iframe src={previewFile} title="Preview" style={{ width: '100%', height: '100%', border: 'none', borderRadius: '12px', background: 'white' }} />
            ) : (
              <img src={previewFile} alt="Preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '12px' }} />
            )}
          </div>
        </div>
      )}

      {/* ─── ADD ACESSO MODAL ─── */}
      {adicionandoAcesso && (
        <div className="modal-overlay" onClick={() => setAdicionandoAcesso(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <div className="modal-icon-badge" style={{ background: '#f3e8ff', color: '#8b5cf6' }}>
                  <Lock size={22} />
                </div>
                <div>
                  <h3 className="modal-title">{editAcessoId ? 'Editar Acesso' : 'Novo Acesso'}</h3>
                  <p className="modal-subtitle">Guarde as credenciais da Sofia</p>
                </div>
              </div>
              <button className="btn-icon" onClick={() => setAdicionandoAcesso(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSalvarAcesso} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="input-group">
                <label className="input-label">Título do Serviço</label>
                <input
                  type="text"
                  className="input-field"
                  value={acessoTitulo}
                  onChange={e => setAcessoTitulo(e.target.value)}
                  placeholder="Ex: Segurança Social Direta"
                  required
                  autoFocus
                />
              </div>

              <div className="input-group">
                <label className="input-label">Nome de Utilizador / NISS</label>
                <input
                  type="text"
                  className="input-field"
                  value={acessoUsername}
                  onChange={e => setAcessoUsername(e.target.value)}
                  placeholder="Utilizador, email ou número..."
                />
              </div>

              <div className="input-group">
                <label className="input-label">Palavra-passe</label>
                <input
                  type="text"
                  className="input-field"
                  value={acessoPassword}
                  onChange={e => setAcessoPassword(e.target.value)}
                  placeholder="Palavra-passe..."
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn-outline" onClick={() => setAdicionandoAcesso(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  {editAcessoId ? 'Atualizar' : 'Guardar'} Acesso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Documentos;
