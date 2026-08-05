import { useState, useEffect } from 'react';
import { Check, X, Sun, BellRing } from 'lucide-react';
import { format } from 'date-fns';
import './VitaminaModal.css';

const VitaminaModal = () => {
  const [mostrarModal, setMostrarModal] = useState(false);

  useEffect(() => {
    const verificarVitamina = () => {
      const agora = new Date();
      const hora = agora.getHours();
      const hojeStr = format(agora, 'yyyy-MM-dd');
      const dataConfirmada = localStorage.getItem('sofia_vitamina_confirmada_data');

      // Se ainda não confirmou hoje e já são 9h ou mais
      if (dataConfirmada !== hojeStr && hora >= 9) {
        setMostrarModal(true);
      } else {
        setMostrarModal(false);
      }
    };

    verificarVitamina();
  }, []);

  const confirmarVitamina = () => {
    const hojeStr = format(new Date(), 'yyyy-MM-dd');
    localStorage.setItem('sofia_vitamina_confirmada_data', hojeStr);
    setMostrarModal(false);
  };

  const fecharTemporariamente = () => {
    setMostrarModal(false);
  };

  if (!mostrarModal) return null;

  return (
    <div className="vitamina-overlay" onClick={fecharTemporariamente}>
      <div className="vitamina-modal glass-card animate-fade-in" onClick={e => e.stopPropagation()}>
        <button className="vitamina-close-btn" onClick={fecharTemporariamente} title="Lembrar mais tarde">
          <X size={20} />
        </button>

        <div className="vitamina-icon-wrapper">
          <div className="vitamina-glow-bg"></div>
          <div className="vitamina-badge-icon">
            <Sun size={38} className="vitamina-sun" />
          </div>
        </div>

        <div className="vitamina-content">
          <span className="vitamina-tag">
            <BellRing size={14} /> Lembrete Diário (9:00+)
          </span>
          <h2 className="vitamina-title">Tomar Vitamina 💊</h2>
          <p className="vitamina-description">
            Está na hora de dar a dose diária de <strong>Vitamina D3</strong> à Sofia!
          </p>
        </div>

        <div className="vitamina-actions">
          <button className="btn-confirmar-vitamina" onClick={confirmarVitamina}>
            <Check size={20} />
            <span>Confirmar que Tomou</span>
          </button>
          <button className="btn-adiar-vitamina" onClick={fecharTemporariamente}>
            Lembrar mais tarde
          </button>
        </div>
      </div>
    </div>
  );
};

export default VitaminaModal;
