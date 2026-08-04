import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Syringe, CheckCircle, Circle, ShieldCheck, Clock, Calendar, Sparkles } from 'lucide-react';
import { api } from '../services/api';
import './Vacinas.css';

const defaultVacinas = [
  // ── Administradas no PDF (Nascimento) ───────────────────────────────────
  { id: 1, nome: 'Vacina contra a Hepatite B (1.ª Dose)', dataRecomendada: '14/07/2026', tomada: true, dataAdministrada: '14/07/2026', grupo: 'Nascimento' },
  { id: 2, nome: 'Vacina contra a Tuberculose (BCG)', dataRecomendada: '31/07/2026', tomada: true, dataAdministrada: '31/07/2026', grupo: 'Nascimento' },

  // ── 2 Meses (De 13/09/2026 a 13/10/2026) ──────────────────────────────────
  { id: 3, nome: 'Vacina contra a Difteria', dataRecomendada: 'De 13/09/2026 a 13/10/2026', tomada: false, grupo: '2 Meses' },
  { id: 4, nome: 'Vacina contra a Hepatite B (2.ª Dose)', dataRecomendada: 'De 13/09/2026 a 13/10/2026', tomada: false, grupo: '2 Meses' },
  { id: 5, nome: 'Vacina contra a Poliomielite', dataRecomendada: 'De 13/09/2026 a 13/10/2026', tomada: false, grupo: '2 Meses' },
  { id: 6, nome: 'Vacina contra a Tosse Convulsa, componente acelular', dataRecomendada: 'De 13/09/2026 a 13/10/2026', tomada: false, grupo: '2 Meses' },
  { id: 7, nome: 'Vacina contra o Haemophilus influenzae tipo B', dataRecomendada: 'De 13/09/2026 a 13/10/2026', tomada: false, grupo: '2 Meses' },
  { id: 8, nome: 'Vacina contra o meningococo do grupo B', dataRecomendada: 'De 13/09/2026 a 13/10/2026', tomada: false, grupo: '2 Meses' },
  { id: 9, nome: 'Vacina contra o Tétano', dataRecomendada: 'De 13/09/2026 a 13/10/2026', tomada: false, grupo: '2 Meses' },
  { id: 10, nome: 'Vacina pneumocócica conjugada de 20 componentes', dataRecomendada: 'De 13/09/2026 a 13/10/2026', tomada: false, grupo: '2 Meses' },

  // ── 12 Meses (De 13/07/2027 a 13/08/2027) ─────────────────────────────────
  { id: 11, nome: 'Vacina contra a Parotidite Epidémica', dataRecomendada: 'De 13/07/2027 a 13/08/2027', tomada: false, grupo: '12 Meses' },
  { id: 12, nome: 'Vacina meningocócica conjugada contra os serogrupos A, C, W135 e Y', dataRecomendada: 'De 13/07/2027 a 13/08/2027', tomada: false, grupo: '12 Meses' },
  { id: 13, nome: 'Vacina viva contra a Rubéola', dataRecomendada: 'De 13/07/2027 a 13/07/2028', tomada: false, grupo: '12 Meses' },
  { id: 14, nome: 'Vacina viva contra o Sarampo', dataRecomendada: 'De 13/07/2027 a 13/08/2027', tomada: false, grupo: '12 Meses' },

  // ── 10 Anos (De 13/07/2036 a 13/07/2037) ──────────────────────────────────
  { id: 15, nome: 'Vacina contra o papilomavírus humano (tipo 9)', dataRecomendada: 'De 13/07/2036 a 13/07/2037', tomada: false, grupo: '10 Anos' },
];

const Vacinas = () => {
  const [vacinas, setVacinas] = useState([]);

  useEffect(() => {
    api.getVacinas(defaultVacinas).then(loadedData => {
      if (!loadedData || loadedData.length === 0) {
        setVacinas(defaultVacinas);
        return;
      }
      // Ensure all items from defaultVacinas exist in the loaded data (merging if missing)
      const existingIds = new Set(loadedData.map(v => v.id));
      const missingDefaults = defaultVacinas.filter(d => !existingIds.has(d.id));
      const merged = [...loadedData, ...missingDefaults];
      setVacinas(merged);
    });
  }, []);

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
    setVacinas(novaLista);
    api.toggleVacina(id, novaLista);
  };

  const administradas = vacinas.filter(v => v.tomada);
  const porTomar = vacinas.filter(v => !v.tomada);

  // Group 'por tomar' by 'grupo'
  const groupedPorTomar = porTomar.reduce((acc, vacina) => {
    if (!acc[vacina.grupo]) {
      acc[vacina.grupo] = [];
    }
    acc[vacina.grupo].push(vacina);
    return acc;
  }, {});

  const totalCount = vacinas.length;
  const takenCount = administradas.length;
  const percent = totalCount > 0 ? Math.round((takenCount / totalCount) * 100) : 0;

  return (
    <div className="page-container page-vacinas">
      {/* Header */}
      <header className="page-header" style={{ marginBottom: '1rem' }}>
        <h1 className="h1 flex-center" style={{ gap: '0.6rem', justifyContent: 'flex-start' }}>
          <span>Boletim de Vacinas</span>
          <Syringe size={26} className="text-primary" />
        </h1>
        <p className="text-secondary">Plano Nacional de Vacinação da Sofia</p>
      </header>

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
                title="Clique para desmarcar ou mover para Por Tomar"
              >
                <div className="vacina-status">
                  <CheckCircle size={28} className="icon-check" />
                </div>
                
                <div className="vacina-info">
                  <h4 className="vacina-nome">{vacina.nome}</h4>
                  <span className="vacina-data-admin">
                    ✓ Administrada em: <strong>{vacina.dataAdministrada || vacina.dataRecomendada}</strong>
                  </span>
                </div>
                
                <div className="vacina-badge">
                  <span className="badge-concluida">Administrada</span>
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
                      title="Clique para marcar como administrada (move para o topo)"
                    >
                      <div className="vacina-status">
                        <Circle size={28} className="icon-circle" />
                      </div>
                      
                      <div className="vacina-info">
                        <h4 className="vacina-nome">{vacina.nome}</h4>
                        <span className="vacina-data">
                          Data recomendada: <strong>{vacina.dataRecomendada}</strong>
                        </span>
                      </div>
                      
                      <div className="vacina-badge">
                        <span className="badge-proxima">Por Tomar</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Vacinas;
