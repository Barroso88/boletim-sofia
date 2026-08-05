import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Syringe, CheckCircle, Circle, ShieldCheck, Clock, Calendar, Sparkles, Pencil, Trash2, Plus, AlertTriangle, X } from 'lucide-react';
import { api } from '../services/api';
import { defaultVacinas } from '../data/defaultVacinas';
import './Vacinas.css';

const Vacinas = () => {
  const [vacinas, setVacinas] = useState([]);
  const [editandoVacina, setEditandoVacina] = useState(null);
  const [adicionandoVacina, setAdicionandoVacina] = useState(false);
  const [confirmarDelete, setConfirmarDelete] = useState(null);

  // Form state
  const [formNome, setFormNome] = useState('');
  const [formGrupo, setFormGrupo] = useState('Nascimento');
  const [formDataRecomendada, setFormDataRecomendada] = useState('');
  const [formDataAdministrada, setFormDataAdministrada] = useState('');
  const [formTomada, setFormTomada] = useState(false);

  useEffect(() => {
    api.getVacinas(defaultVacinas).then(loadedData => {
      if (!loadedData || loadedData.length === 0) {
        setVacinas(defaultVacinas);
        return;
      }
      const existingIds = new Set(loadedData.map(v => v.id));
      const missingDefaults = defaultVacinas.filter(d => !existingIds.has(d.id));
      const merged = [...loadedData, ...missingDefaults];
      setVacinas(merged);
    });
  }, []);

  const persistVacinas = (novaLista) => {
    setVacinas(novaLista);
    localStorage.setItem('sofia_vacinas', JSON.stringify(novaLista));
  };

  const toggleTomada = (id) => {
    const hojeFormatted = format(new Date(), 'dd/MM/yyyy');
    const novaLista = vacinas.map(v => {
      if (v.id === id) {
        const novoTomada = !v.tomada;
        return {
          ...v,
          tomada: novoTomada,
          dataAdministrada: novoTomada ? (v.dataAdministrada || hojeFormatted) : null,
        };
      }
      return v;
    });
    persistVacinas(novaLista);
    api.toggleVacina(id, novaLista);
  };

  const abrirEdicaoVacina = (vacina) => {
    setEditandoVacina(vacina);
    setFormNome(vacina.nome || '');
    setFormGrupo(vacina.grupo || 'Outras');
    setFormDataRecomendada(vacina.dataRecomendada || '');
    setFormDataAdministrada(vacina.dataAdministrada || '');
    setFormTomada(!!vacina.tomada);
  };

  const guardarEdicaoVacina = (e) => {
    e.preventDefault();
    if (!editandoVacina) return;
    const novaLista = vacinas.map(v => {
      if (v.id === editandoVacina.id) {
        return {
          ...v,
          nome: formNome,
          grupo: formGrupo,
          dataRecomendada: formDataRecomendada,
          dataAdministrada: formTomada ? (formDataAdministrada || format(new Date(), 'dd/MM/yyyy')) : null,
          tomada: formTomada,
        };
      }
      return v;
    });
    persistVacinas(novaLista);
    api.toggleVacina(editandoVacina.id, novaLista);
    setEditandoVacina(null);
  };

  const abrirCriacaoVacina = () => {
    setFormNome('');
    setFormGrupo('Outras');
    setFormDataRecomendada('Sob recomendação médica');
    setFormDataAdministrada(format(new Date(), 'dd/MM/yyyy'));
    setFormTomada(false);
    setAdicionandoVacina(true);
  };

  const adicionarNovaVacina = (e) => {
    e.preventDefault();
    const novaVacina = {
      id: Date.now(),
      nome: formNome,
      grupo: formGrupo || 'Outras',
      dataRecomendada: formDataRecomendada || 'Sob indicação médica',
      dataAdministrada: formTomada ? (formDataAdministrada || format(new Date(), 'dd/MM/yyyy')) : null,
      tomada: formTomada,
    };
    const novaLista = [...vacinas, novaVacina];
    persistVacinas(novaLista);
    api.toggleVacina(novaVacina.id, novaLista);
    setAdicionandoVacina(false);
  };

  const removerVacina = () => {
    if (!confirmarDelete) return;
    const novaLista = vacinas.filter(v => v.id !== confirmarDelete);
    persistVacinas(novaLista);
    api.toggleVacina(confirmarDelete, novaLista);
    setConfirmarDelete(null);
  };

  const administradas = vacinas.filter(v => v.tomada);
  const porTomar = vacinas.filter(v => !v.tomada);

  const groupedPorTomar = porTomar.reduce((acc, vacina) => {
    const grp = vacina.grupo || 'Outras';
    if (!acc[grp]) acc[grp] = [];
    acc[grp].push(vacina);
    return acc;
  }, {});

  const totalCount = vacinas.length;
  const takenCount = administradas.length;
  const percent = totalCount > 0 ? Math.round((takenCount / totalCount) * 100) : 0;

  return (
    <div className="page-container page-vacinas">
      {/* Header */}
      <div className="flex-between mb-4 flex-wrap gap-3">
        <div>
          <h1 className="h1" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span>Boletim de Vacinas</span>
            <Syringe size={26} className="text-primary" />
          </h1>
          <p className="text-secondary" style={{ marginTop: '0.2rem' }}>Plano Nacional de Vacinação da Sofia</p>
        </div>
        <button className="btn-primary" onClick={abrirCriacaoVacina}>
          <Plus size={18} /> Nova Vacina
        </button>
      </div>

      {/* Official SNS 24 Card */}
      <div className="sns-card glass-card mb-4">
        <div className="sns-header">
          <div className="sns-badge-icon">
            <ShieldCheck size={26} />
          </div>
          <div>
            <h3 className="sns-child-name">SOFIA MORAIS BARROSO</h3>
            <p className="sns-child-details">
              N.º Utente: <strong>961057968</strong> • Nasc.: <strong>13/07/2026</strong>
            </p>
          </div>
        </div>

        <div className="sns-progress-section">
          <div className="sns-progress-labels">
            <span>Próxima inoculação: <strong>a partir de 13/09/2026</strong></span>
            <span className="sns-progress-count">{takenCount} de {totalCount} tomadas ({percent}%)</span>
          </div>
          <div className="sns-progress-bar-bg">
            <div className="sns-progress-bar-fill" style={{ width: `${percent}%` }} />
          </div>
        </div>
      </div>

      {/* ─── SECTION 1: VACINAS ADMINISTRADAS (TOP) ────────────────────── */}
      <div className="vacina-section-block mb-4">
        <div className="section-title-row">
          <CheckCircle size={22} className="text-success" />
          <h2 className="section-title text-success">Vacinas Administradas ({administradas.length})</h2>
        </div>

        {administradas.length === 0 ? (
          <div className="empty-state-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
            <p className="text-secondary" style={{ margin: 0 }}>Nenhuma vacina administrada registada.</p>
          </div>
        ) : (
          <div className="vacinas-list">
            {administradas.map(vacina => (
              <div
                key={vacina.id}
                className="vacina-card glass-card tomada"
                onClick={() => toggleTomada(vacina.id)}
                title="Clique para alterar estado"
              >
                <div className="vacina-status">
                  <CheckCircle size={26} className="icon-check" />
                </div>

                <div className="vacina-info">
                  <h4 className="vacina-nome">{vacina.nome}</h4>
                  <span className="vacina-data-admin">
                    ✓ Administrada em: <strong>{vacina.dataAdministrada || vacina.dataRecomendada}</strong>
                  </span>
                </div>

                <div className="btn-action-group" onClick={e => e.stopPropagation()}>
                  <button
                    className="btn-action-edit"
                    onClick={() => abrirEdicaoVacina(vacina)}
                    title="Editar vacina"
                  >
                    <Pencil size={17} />
                  </button>
                  <button
                    className="btn-action-delete"
                    onClick={() => setConfirmarDelete(vacina.id)}
                    title="Apagar vacina"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── SECTION 2: VACINAS POR TOMAR (BOTTOM) ───────────────────────── */}
      <div className="vacina-section-block">
        <div className="section-title-row">
          <Clock size={22} style={{ color: 'var(--color-secondary)' }} />
          <h2 className="section-title" style={{ color: 'var(--color-secondary)' }}>
            Vacinas Por Tomar ({porTomar.length})
          </h2>
        </div>

        {porTomar.length === 0 ? (
          <div className="empty-state-card" style={{ padding: '2rem', textAlign: 'center' }}>
            <Sparkles size={32} className="text-primary" style={{ marginBottom: '0.5rem' }} />
            <h4 style={{ margin: 0, fontWeight: '800' }}>Plano de Vacinação Concluído! 🎉</h4>
            <p className="text-secondary" style={{ fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>
              Todas as vacinas recomendadas foram administradas.
            </p>
          </div>
        ) : (
          <div className="vacinas-container">
            {Object.entries(groupedPorTomar).map(([grupo, lista], index) => (
              <div key={grupo} className="vacina-group animate-fade-in" style={{ animationDelay: `${index * 0.08}s` }}>
                <h3 className="grupo-title flex-center" style={{ gap: '0.5rem', justifyContent: 'flex-start' }}>
                  <Calendar size={18} />
                  <span>{grupo}</span>
                </h3>

                <div className="vacinas-list">
                  {lista.map(vacina => (
                    <div
                      key={vacina.id}
                      className="vacina-card glass-card"
                      onClick={() => toggleTomada(vacina.id)}
                      title="Clique para marcar como administrada"
                    >
                      <div className="vacina-status">
                        <Circle size={26} className="icon-circle" />
                      </div>

                      <div className="vacina-info">
                        <h4 className="vacina-nome">{vacina.nome}</h4>
                        <span className="vacina-data">
                          Data recomendada: <strong>{vacina.dataRecomendada}</strong>
                        </span>
                      </div>

                      <div className="btn-action-group" onClick={e => e.stopPropagation()}>
                        <button
                          className="btn-action-edit"
                          onClick={() => abrirEdicaoVacina(vacina)}
                          title="Editar vacina"
                        >
                          <Pencil size={17} />
                        </button>
                        <button
                          className="btn-action-delete"
                          onClick={() => setConfirmarDelete(vacina.id)}
                          title="Apagar vacina"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── EDIT VACCINE MODAL ─── */}
      {editandoVacina && (
        <div className="modal-overlay" onClick={() => setEditandoVacina(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <div className="modal-icon-badge">
                  <Syringe size={22} />
                </div>
                <div>
                  <h3 className="modal-title">Editar Vacina</h3>
                  <p className="modal-subtitle">{editandoVacina.nome}</p>
                </div>
              </div>
              <button className="btn-icon" onClick={() => setEditandoVacina(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={guardarEdicaoVacina} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="input-group">
                <label className="input-label">Nome da Vacina</label>
                <input
                  type="text"
                  className="input-field"
                  value={formNome}
                  onChange={e => setFormNome(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="form-grid-2col">
                <div className="input-group">
                  <label className="input-label">Grupo / Idade</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formGrupo}
                    onChange={e => setFormGrupo(e.target.value)}
                    placeholder="Ex: 2 Meses"
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Data Recomendada</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formDataRecomendada}
                    onChange={e => setFormDataRecomendada(e.target.value)}
                    placeholder="Ex: 13/09/2026"
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Estado de Administração</label>
                <select
                  className="input-field"
                  value={formTomada ? 'true' : 'false'}
                  onChange={e => setFormTomada(e.target.value === 'true')}
                >
                  <option value="true">✓ Administrada (Tomada)</option>
                  <option value="false">⏳ Por Tomar (Pendente)</option>
                </select>
              </div>

              {formTomada && (
                <div className="input-group">
                  <label className="input-label">Data de Administração</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formDataAdministrada}
                    onChange={e => setFormDataAdministrada(e.target.value)}
                    placeholder="Ex: 14/07/2026"
                  />
                </div>
              )}

              <div className="form-actions">
                <button type="button" className="btn-outline" onClick={() => setEditandoVacina(null)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Guardar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── ADD NEW VACCINE MODAL ─── */}
      {adicionandoVacina && (
        <div className="modal-overlay" onClick={() => setAdicionandoVacina(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <div className="modal-icon-badge">
                  <Plus size={22} />
                </div>
                <div>
                  <h3 className="modal-title">Nova Vacina</h3>
                  <p className="modal-subtitle">Adicione uma vacina personalizada ao plano</p>
                </div>
              </div>
              <button className="btn-icon" onClick={() => setAdicionandoVacina(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={adicionarNovaVacina} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="input-group">
                <label className="input-label">Nome da Vacina</label>
                <input
                  type="text"
                  className="input-field"
                  value={formNome}
                  onChange={e => setFormNome(e.target.value)}
                  placeholder="Ex: Bexsero (Dose Extra) / Gripe"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="form-grid-2col">
                <div className="input-group">
                  <label className="input-label">Grupo / Idade</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formGrupo}
                    onChange={e => setFormGrupo(e.target.value)}
                    placeholder="Ex: Outras / Extra"
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Data Recomendada</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formDataRecomendada}
                    onChange={e => setFormDataRecomendada(e.target.value)}
                    placeholder="Ex: Sob indicação médica"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-outline" onClick={() => setAdicionandoVacina(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Adicionar Vacina
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── DELETE CONFIRMATION MODAL ─── */}
      {confirmarDelete && (
        <div className="modal-overlay" onClick={() => setConfirmarDelete(null)}>
          <div className="modal-card" style={{ maxWidth: '400px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.5rem' }}>
              <AlertTriangle size={26} color="#ef4444" />
            </div>
            <div>
              <h3 style={{ margin: '0 0 0.35rem', fontSize: '1.15rem', fontWeight: 800 }}>Remover Vacina?</h3>
              <p style={{ color: 'var(--color-text-light)', fontSize: '0.86rem', margin: 0 }}>
                Esta vacina será removida do boletim da Sofia.
              </p>
            </div>
            <div className="form-actions" style={{ marginTop: '0.5rem' }}>
              <button className="btn-outline" onClick={() => setConfirmarDelete(null)}>
                <X size={16} /> Cancelar
              </button>
              <button
                className="btn-primary"
                style={{ background: '#ef4444', borderColor: '#ef4444', boxShadow: '0 4px 14px rgba(239,68,68,0.35)' }}
                onClick={removerVacina}
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

export default Vacinas;
