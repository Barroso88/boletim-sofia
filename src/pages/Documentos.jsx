import { useState, useEffect } from 'react';
import { Plus, Edit2, Save, Trash2, X } from 'lucide-react';

const Documentos = () => {
  const [documentos, setDocumentos] = useState(() => {
    const saved = localStorage.getItem('sofia_documentos');
    if (saved) return JSON.parse(saved);
    return [
      { id: 1, titulo: 'NIF (Número de Identificação Fiscal)', numero: '' },
      { id: 2, titulo: 'Nº Identificação Civil (CC)', numero: '' },
      { id: 3, titulo: 'Nº Utente de Saúde', numero: '' },
    ];
  });

  const [editandoId, setEditandoId] = useState(null);
  const [editValue, setEditValue] = useState('');
  
  const [adicionandoNovo, setAdicionandoNovo] = useState(false);
  const [novoTitulo, setNovoTitulo] = useState('');
  const [novoNumero, setNovoNumero] = useState('');

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
      numero: novoNumero
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

  return (
    <div className="page-container">
      <div className="flex-between mb-4">
        <h2 className="h2 text-gradient">Documentos da Sofia</h2>
        <button className="btn-primary" onClick={() => setAdicionandoNovo(true)}>
          <Plus size={20} />
          Adicionar Novo
        </button>
      </div>

      <div className="document-list" style={{ display: 'grid', gap: '1rem' }}>
        {documentos.map(doc => (
          <div key={doc.id} className="glass-card" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="doc-info" style={{ flex: 1 }}>
              <h3 className="h3" style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>{doc.titulo}</h3>
              
              {editandoId === doc.id ? (
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="text"
                    className="input-field"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    placeholder="Introduza o número..."
                    autoFocus
                  />
                  <button onClick={() => guardarEdicao(doc.id)} style={{ color: 'var(--color-primary-dark)' }}>
                    <Save size={20} />
                  </button>
                  <button onClick={cancelarEdicao} style={{ color: 'var(--color-text-light)' }}>
                    <X size={20} />
                  </button>
                </div>
              ) : (
                <p className="text-body" style={{ fontSize: '1.2rem', fontWeight: 600, letterSpacing: '1px' }}>
                  {doc.numero || 'Não registado'}
                </p>
              )}
            </div>

            {editandoId !== doc.id && (
              <div className="doc-actions" style={{ display: 'flex', gap: '1rem' }}>
                <button onClick={() => iniciarEdicao(doc)} style={{ color: 'var(--color-text)' }}>
                  <Edit2 size={20} />
                </button>
                {doc.id > 3 && ( // Permite apagar apenas os adicionados manualmente
                  <button onClick={() => removerDocumento(doc.id)} style={{ color: 'var(--color-text-light)' }}>
                    <Trash2 size={20} />
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {adicionandoNovo && (
        <div className="glass-card" style={{ padding: '1.5rem', marginTop: '2rem', border: '2px dashed var(--color-primary)' }}>
          <h3 className="h3 mb-4">Adicionar Novo Documento</h3>
          <form onSubmit={adicionarNovoDocumento}>
            <div className="input-group">
              <label className="input-label">Nome do Documento (Ex: Passaporte)</label>
              <input
                type="text"
                className="input-field"
                value={novoTitulo}
                onChange={(e) => setNovoTitulo(e.target.value)}
                required
              />
            </div>
            <div className="input-group">
              <label className="input-label">Número</label>
              <input
                type="text"
                className="input-field"
                value={novoNumero}
                onChange={(e) => setNovoNumero(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button type="submit" className="btn-primary">Guardar Documento</button>
              <button type="button" className="btn-outline" onClick={() => setAdicionandoNovo(false)}>Cancelar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Documentos;
