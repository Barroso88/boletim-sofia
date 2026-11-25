import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Bath, Plus, Clock, Pencil, Trash2 } from 'lucide-react';
import { api } from '../services/api';
import { tempoDesdeBanho } from '../services/banhos';
import { comAutor } from '../services/quem';
import Quem from './Quem';

const AZUL = 'linear-gradient(135deg, #0891b2, #22d3ee)';

// Separador "Banhos" da página de Registos. `data` é o dia escolhido (yyyy-MM-dd).
const BanhosTab = ({ data }) => {
  const [registos, setRegistos] = useState([]);
  const [aAdicionar, setAAdicionar] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [hora, setHora] = useState(() => format(new Date(), 'HH:mm'));
  const [aConfirmar, setAConfirmar] = useState(null);

  useEffect(() => {
    api.getBanhos().then((lista) => setRegistos(lista || []));
  }, []);

  const doDia = registos.filter((r) => r.data === data).sort((a, b) => b.hora.localeCompare(a.hora));
  const ultimo = [...registos].sort((a, b) => `${b.data}T${b.hora}`.localeCompare(`${a.data}T${a.hora}`))[0];
  const desdeUltimo = ultimo ? tempoDesdeBanho(ultimo.data, ultimo.hora) : null;
  const diaDaSemana = format(parseISO(data), "EEEE, d 'de' MMMM", { locale: ptBR });

  const abrirFormulario = (registo) => {
    setEditandoId(registo ? registo.id : null);
    setHora(registo ? registo.hora : format(new Date(), 'HH:mm'));
    setAAdicionar(true);
  };

  const fechar = () => {
    setAAdicionar(false);
    setEditandoId(null);
  };

  const guardar = (e) => {
    e.preventDefault();
    if (!hora) return;
    const registo = comAutor({ id: editandoId || Date.now(), data, hora }, registos);
    setRegistos((lista) => [registo, ...lista.filter((r) => r.id !== registo.id)]);
    api.saveBanho(registo);
    fechar();
  };

  const apagar = (id) => {
    setRegistos((lista) => lista.filter((r) => r.id !== id));
    api.deleteBanho(id);
    setAConfirmar(null);
  };

  return (
    <>
      <div className="leite-hero-card">
        <div className="hero-top-row">
          <div className="hero-title-group">
            <div className="icon-badge-glow" style={{ background: AZUL }}>
              <Bath size={26} />
            </div>
            <div>
              <h2 className="hero-day-title">{diaDaSemana}</h2>
              <p className="hero-day-subtitle">Resumo dos banhos</p>
            </div>
          </div>
        </div>
        <div className="hero-main-stat">
          <span className="hero-stat-value">{doDia.length}</span>
          <span className="hero-stat-unit">{doDia.length === 1 ? 'banho neste dia' : 'banhos neste dia'}</span>
        </div>
        <p className="text-secondary" style={{ margin: 0, fontWeight: 700 }}>
          {desdeUltimo ? `Último banho há ${desdeUltimo.text}` : 'Ainda não há banhos registados'}
        </p>
      </div>

      {!aAdicionar ? (
        <button className="btn-quick-add" onClick={() => abrirFormulario(null)}>
          <Plus size={22} />
          <span>Registar Banho</span>
        </button>
      ) : (
        <form className="add-form-card" onSubmit={guardar}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 className="h3 flex-center" style={{ gap: '0.5rem' }}>
              <Bath size={20} />
              <span>{editandoId ? 'Editar Banho' : 'Registar Banho'}</span>
            </h3>
            <span className="text-secondary" style={{ fontSize: '0.85rem' }}>{data}</span>
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <div className="form-section-title">Hora do Banho</div>
            <label className="banho-hora">
              <Clock size={18} className="text-secondary" />
              <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} required />
            </label>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="button" className="btn btn-outline" style={{ flex: 1, borderRadius: '16px', padding: '0.85rem' }} onClick={fechar}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1.5, borderRadius: '16px', padding: '0.85rem' }}>
              Confirmar Banho
            </button>
          </div>
        </form>
      )}

      <h3 className="h3 flex-center" style={{ gap: '0.5rem', marginTop: '0.5rem' }}>
        <Bath size={18} />
        <span>Banhos Registados</span>
      </h3>

      <div className="feedings-list">
        {doDia.length === 0 ? (
          <div className="empty-state-card">
            <h4 style={{ margin: '0 0 0.25rem 0', color: 'var(--color-text)', fontWeight: 800 }}>Sem banhos neste dia</h4>
            <p className="text-secondary" style={{ fontSize: '0.85rem', margin: 0 }}>
              Toque no botão acima para registar um banho da Sofia.
            </p>
          </div>
        ) : (
          doDia.map((registo) => (
            <div key={registo.id} className="feeding-card">
              <div className="feeding-left">
                <div className="feeding-icon-box" style={{ background: 'rgba(8, 145, 178, 0.1)', color: '#0891b2' }}>
                  <Bath size={20} />
                </div>
                <div className="feeding-time">
                  {registo.hora}
                  <Quem nome={registo.quem} />
                </div>
              </div>
              {aConfirmar === registo.id ? (
                <div className="btn-action-group">
                  <button type="button" className="btn btn-outline" onClick={() => setAConfirmar(null)}>Manter</button>
                  <button type="button" className="btn btn-primary" onClick={() => apagar(registo.id)}>Apagar</button>
                </div>
              ) : (
                <div className="btn-action-group">
                  <button className="btn-action-edit" onClick={() => abrirFormulario(registo)} title="Editar registo">
                    <Pencil size={17} />
                  </button>
                  <button className="btn-action-delete" onClick={() => setAConfirmar(registo.id)} title="Apagar registo">
                    <Trash2 size={17} />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </>
  );
};

export default BanhosTab;
