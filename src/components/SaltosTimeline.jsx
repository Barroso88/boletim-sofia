import { useState, useEffect } from 'react';
import { Brain, Calendar, Info, CloudRain, Sun } from 'lucide-react';
import { differenceInWeeks, addWeeks, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { api } from '../services/api';
import { SALTOS_DESENVOLVIMENTO } from '../data/saltos';

const SaltosTimeline = () => {
  const [dpp, setDpp] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getPerfil().then(data => {
      if (data && data.data_provavel_parto) {
        setDpp(new Date(data.data_provavel_parto));
      } else if (data && data.data_nascimento) {
        // Fallback to birth date if DPP is missing
        setDpp(new Date(data.data_nascimento));
      }
      setLoading(false);
    });
  }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: '2rem' }}>A carregar...</div>;

  if (!dpp) {
    return (
      <div className="marcos-empty">
        <div className="marcos-empty-icon">🧠</div>
        <p style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Data Provável de Parto em falta</p>
        <p style={{ fontSize: '0.9rem', maxWidth: '300px', margin: '0 auto' }}>
          Para calcular os saltos de desenvolvimento corretamente, precisamos da Data Provável de Parto (DPP). Pode adicioná-la no separador <strong>Perfil</strong>.
        </p>
      </div>
    );
  }

  const currentWeeks = differenceInWeeks(new Date(), dpp);
  
  // Find current leap
  const currentLeap = SALTOS_DESENVOLVIMENTO.find(
    salto => currentWeeks >= salto.startWeek && currentWeeks <= salto.endWeek
  );

  return (
    <div className="saltos-container animate-fade-in" style={{ padding: '1rem 0' }}>
      
      {/* Current Leap Status Widget */}
      <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem', background: currentLeap ? 'linear-gradient(135deg, rgba(239, 246, 255, 0.9), rgba(219, 234, 254, 0.9))' : 'linear-gradient(135deg, rgba(254, 252, 232, 0.9), rgba(254, 240, 138, 0.9))', borderColor: currentLeap ? 'rgba(59, 130, 246, 0.3)' : 'rgba(234, 179, 8, 0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <div style={{ background: currentLeap ? '#3b82f6' : '#eab308', color: 'white', padding: '0.75rem', borderRadius: '50%' }}>
            {currentLeap ? <CloudRain size={28} /> : <Sun size={28} />}
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#1e293b' }}>
              {currentLeap ? 'Fase de Tempestade (Salto)' : 'Fase de Sol (Tranquilidade)'}
            </h3>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#475569' }}>
              A Sofia está na {currentWeeks}ª semana (desde a DPP).
            </p>
          </div>
        </div>
        
        {currentLeap ? (
          <div>
            <p style={{ fontWeight: 600, color: '#1e40af', marginBottom: '0.5rem' }}>{currentLeap.title}</p>
            <p style={{ fontSize: '0.9rem', color: '#334155', margin: 0 }}>
              É normal que o sono e o apetite da Sofia estejam alterados. Ela está a processar uma enorme quantidade de nova informação!
            </p>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: '0.9rem', color: '#334155', margin: 0 }}>
              Semana calma para brincar e praticar as novas habilidades adquiridas. Aproveitem o sol!
            </p>
          </div>
        )}
      </div>

      <h3 className="h3" style={{ marginBottom: '1rem' }}>Próximos Saltos</h3>

      <div className="timeline-container">
        {SALTOS_DESENVOLVIMENTO.map((salto, index) => {
          const isPast = currentWeeks > salto.endWeek;
          const isCurrent = currentWeeks >= salto.startWeek && currentWeeks <= salto.endWeek;
          const isFuture = currentWeeks < salto.startWeek;
          
          let cardBg = 'rgba(255,255,255,0.8)';
          let borderColor = 'rgba(0,0,0,0.05)';
          let iconColor = '#94a3b8';
          let dotBg = '#f1f5f9';

          if (isCurrent) {
            cardBg = 'linear-gradient(135deg, rgba(239, 246, 255, 0.95), rgba(219, 234, 254, 0.95))';
            borderColor = 'rgba(59, 130, 246, 0.3)';
            iconColor = '#3b82f6';
            dotBg = '#eff6ff';
          } else if (isPast) {
            cardBg = 'rgba(248, 250, 252, 0.8)';
            dotBg = '#e2e8f0';
          }

          const startDate = addWeeks(dpp, salto.startWeek);
          const endDate = addWeeks(dpp, salto.endWeek);

          return (
            <div key={salto.id} className={`marco-item ${isPast ? 'opacity-70' : ''}`} style={{ animationDelay: `${index * 0.05}s` }}>
              <div 
                className="marco-dot"
                style={{
                  background: dotBg,
                  borderColor: iconColor,
                  boxShadow: isCurrent ? `0 0 0 4px rgba(59, 130, 246, 0.2), 0 4px 12px rgba(0,0,0,0.08)` : 'none'
                }}
              >
                <Brain size={16} color={iconColor} />
              </div>

              <div className="marco-card" style={{ background: cardBg, borderColor, padding: '1.25rem' }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <h4 style={{ margin: 0, fontSize: '1.1rem', color: isCurrent ? '#1e40af' : '#1e293b' }}>
                    Salto {salto.id}: {salto.title}
                  </h4>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, background: 'rgba(0,0,0,0.05)', padding: '0.2rem 0.5rem', borderRadius: '12px' }}>
                    Semana {salto.startWeek} a {salto.endWeek}
                  </span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: '#64748b', marginBottom: '1rem' }}>
                  <Calendar size={12} />
                  Previsto: {format(startDate, "dd MMM", { locale: ptBR })} - {format(endDate, "dd MMM yyyy", { locale: ptBR })}
                </div>

                <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                  <div>
                    <h5 style={{ margin: '0 0 0.5rem', fontSize: '0.85rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <CloudRain size={14} /> Tempestade (Sinais)
                    </h5>
                    <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.85rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      {salto.symptoms.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                  <div>
                    <h5 style={{ margin: '0 0 0.5rem', fontSize: '0.85rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Sun size={14} /> Sol (Habilidades)
                    </h5>
                    <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.85rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      {salto.abilities.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                </div>
                
                <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(255,255,255,0.5)', borderRadius: '8px', border: '1px dashed rgba(0,0,0,0.1)', fontSize: '0.85rem', color: '#475569' }}>
                  <strong><Info size={12} style={{ display: 'inline', marginRight: 4 }}/> Dica:</strong> {salto.tips}
                </div>

              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SaltosTimeline;
