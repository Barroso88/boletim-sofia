import { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, Trash2, Sparkles, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { createPortal } from 'react-dom';
import Boca from './Boca';
import { DENTES as TEETH } from '../services/boca';
import { denticao } from '../services/denticao';
import './TeethMap.css';

/* ─── Eruption order colors ──────────────────────────────────────────────── */
const ORDER_COLORS = {
  1: '#4CAF50', 2: '#E91E63', 3: '#2196F3', 4: '#D97706',
  5: '#EF4444', 6: '#9333EA', 7: '#F59E0B',
};

/* ─── Legend data ────────────────────────────────────────────────────────── */
const LEGEND = [
  { num: 1, label: 'Entre os 6 e 8 meses',   desc: 'Incisivos centrais inferiores', color: '#4CAF50' },
  { num: 2, label: 'Por volta dos 8 meses',   desc: 'Incisivos centrais superiores', color: '#E91E63' },
  { num: 3, label: 'Entre os 8 e 12 meses',   desc: 'Incisivos laterais superiores', color: '#2196F3' },
  { num: 4, label: 'Entre os 10 e 12 meses',  desc: 'Incisivos laterais inferiores', color: '#D97706' },
  { num: 5, label: 'Entre os 14 e 20 meses',  desc: 'Primeiros molares',             color: '#EF4444' },
  { num: 6, label: 'Entre os 18 e 24 meses',  desc: 'Caninos',                       color: '#9333EA' },
  { num: 7, label: 'Entre os 2 e 3 anos',     desc: 'Segundos molares',              color: '#F59E0B' },
];

/* ─── Date formatter ─────────────────────────────────────────────────────── */
const formatDate = (iso) => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};

/* ─── Component ──────────────────────────────────────────────────────────── */
const TeethMap = () => {
  const [teethingData, setTeethingData] = useState(denticao.local);
  const [selectedTooth, setSelectedTooth] = useState(null);
  const [eruptionDate, setEruptionDate] = useState('');

  // Mostra já o que está no telemóvel e atualiza com o que estiver no servidor
  useEffect(() => {
    denticao.carregar().then(setTeethingData);
  }, []);

  const openModal = (t) => {
    setSelectedTooth(t);
    setEruptionDate(teethingData[t.id] || new Date().toISOString().split('T')[0]);
  };
  const closeModal = () => { setSelectedTooth(null); setEruptionDate(''); };

  const saveToothDate = (e) => {
    e.preventDefault();
    if (!eruptionDate) return;
    setTeethingData(prev => ({ ...prev, [selectedTooth.id]: eruptionDate }));
    denticao.guardar(selectedTooth.id, eruptionDate);
    closeModal();
  };

  const [confirmarDelete, setConfirmarDelete] = useState(false);

  const removeToothDateConfirmed = () => {
    if (!selectedTooth) return;
    setTeethingData(prev => {
      const next = { ...prev }; delete next[selectedTooth.id]; return next;
    });
    denticao.remover(selectedTooth.id);
    setConfirmarDelete(false);
    closeModal();
  };

  // Registered teeth sorted by date
  const registeredList = TEETH
    .filter(t => Boolean(teethingData[t.id]))
    .sort((a, b) => (teethingData[a.id] || '').localeCompare(teethingData[b.id] || ''));

  const eruptedCount = registeredList.length;

  return (
    <div className="teething-layout">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="teething-header">
        <h2 className="teething-title">
          <Sparkles size={20} color="var(--color-primary)" />
          Dentição da Sofia
        </h2>
        <p className="teething-subtitle">
          <strong>{eruptedCount} de 20</strong> dentes nascidos — Toque num dente para registar
        </p>
        {/* Progress bar */}
        <div className="teeth-progress-bar">
          <div className="teeth-progress-fill" style={{ width: `${(eruptedCount / 20) * 100}%` }} />
        </div>
      </div>

      {/* ── SVG Dental Chart ───────────────────────────────────────────── */}
      <div className="teeth-svg-wrap">
        <Boca nascidos={teethingData} cores={ORDER_COLORS} onEscolher={openModal} />
      </div>

      {/* ── Legend ──────────────────────────────────────────────────────── */}
      <div className="teething-legend">
        <h3 className="legend-title">Ordem de Erupção dos Dentes</h3>
        <div className="legend-grid">
          {LEGEND.map(item => (
            <div key={item.num} className="legend-item">
              <div className="legend-number" style={{ backgroundColor: item.color }}>{item.num}</div>
              <div>
                <div className="legend-text" style={{ color: item.color }}>{item.label}</div>
                <div className="legend-desc">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Registered teeth list ────────────────────────────────────────── */}
      {registeredList.length > 0 && (
        <div className="teeth-record-section">
          <h3 className="legend-title">Registo Individual de Erupção</h3>
          <div className="teeth-record-list">
            {registeredList.map((tooth, i) => (
              <button
                key={tooth.id}
                className="teeth-record-item"
                onClick={() => openModal(tooth)}
              >
                <div className="record-badge" style={{ backgroundColor: ORDER_COLORS[tooth.order] }}>
                  {tooth.order}
                </div>
                <div className="record-info">
                  <span className="record-label">{tooth.label}</span>
                  <span className="record-date">
                    <Clock size={11} />
                    {formatDate(teethingData[tooth.id])}
                  </span>
                </div>
                <CheckCircle size={16} color="#22c55e" style={{ marginLeft: 'auto', flexShrink: 0 }} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Modal ──────────────────────────────────────────────────────── */}
      {selectedTooth && createPortal(
        <div className="tooth-modal-overlay" onClick={closeModal}>
          <div className="tooth-modal animate-fade-in" onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="tooth-modal-header">
              <div className="tooth-modal-icon" style={{ backgroundColor: ORDER_COLORS[selectedTooth.order] }}>
                {selectedTooth.order}
              </div>
              <div className="tooth-modal-title-area">
                <h3 className="tooth-modal-title">{selectedTooth.label}</h3>
                <p className="tooth-modal-subtitle" style={{ color: ORDER_COLORS[selectedTooth.order] }}>
                  {LEGEND.find(l => l.num === selectedTooth.order)?.label}
                </p>
              </div>
              <button className="tooth-modal-close" onClick={closeModal}>
                <X size={18} />
              </button>
            </div>

            {/* Status pill */}
            {teethingData[selectedTooth.id] ? (
              <div className="tooth-status erupted-status">
                <CheckCircle size={16} />
                <span>Nascido a <strong>{formatDate(teethingData[selectedTooth.id])}</strong></span>
              </div>
            ) : (
              <div className="tooth-status pending-status">
                <Clock size={16} />
                <span>Ainda não registado</span>
              </div>
            )}

            {/* Date input */}
            <form onSubmit={saveToothDate} className="tooth-modal-form">
              <label className="tooth-modal-label">
                <CalendarIcon size={15} />
                Data de Erupção
              </label>
              <input
                type="date"
                className="tooth-modal-date-input"
                value={eruptionDate}
                onChange={e => setEruptionDate(e.target.value)}
                required
              />

              <div className="tooth-modal-actions">
                <button type="submit" className="btn-confirm">
                  {teethingData[selectedTooth.id] ? 'Atualizar' : 'Confirmar Erupção 🦷'}
                </button>
                {teethingData[selectedTooth.id] && (
                  <button type="button" className="btn-delete" onClick={() => setConfirmarDelete(true)} title="Remover registo">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Confirmation Modal */}
      {confirmarDelete && createPortal(
        <div className="modal-overlay" style={{ zIndex: 2147483647 }} onClick={() => setConfirmarDelete(false)}>
          <div className="modal-card" style={{ maxWidth: '400px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.5rem' }}>
              <AlertTriangle size={26} color="#ef4444" />
            </div>
            <div>
              <h3 style={{ margin: '0 0 0.35rem', fontSize: '1.15rem', fontWeight: 800 }}>Remover Dente Nascido?</h3>
              <p style={{ color: 'var(--color-text-light)', fontSize: '0.86rem', margin: 0 }}>
                O registo de erupção para o dente <strong>{selectedTooth?.label}</strong> será removido.
              </p>
            </div>
            <div className="form-actions" style={{ marginTop: '0.5rem' }}>
              <button className="btn-outline" onClick={() => setConfirmarDelete(false)}>
                <X size={16} /> Cancelar
              </button>
              <button
                className="btn-primary"
                style={{ background: '#ef4444', borderColor: '#ef4444', boxShadow: '0 4px 14px rgba(239,68,68,0.35)' }}
                onClick={removeToothDateConfirmed}
              >
                <Trash2 size={16} /> Remover
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default TeethMap;
