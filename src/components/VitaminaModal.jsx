import { useState, useEffect } from 'react';
import { Check, X, Sun, BellRing } from 'lucide-react';
import { format } from 'date-fns';
import api from '../services/api';
import './VitaminaModal.css';

const VitaminaModal = () => {
  const [mostrarModal, setMostrarModal] = useState(false);

  useEffect(() => {
    const verificarVitamina = async () => {
      const agora = new Date();
      const hora = agora.getHours();
      const hojeStr = format(agora, 'yyyy-MM-dd');
      
      let dataConfirmada = localStorage.getItem('sofia_vitamina_confirmada_data');
      
      // Try to fetch from backend
      try {
        const backendData = await api.getConfiguracao('vitamina_confirmada_data');
        if (backendData) {
          dataConfirmada = backendData;
          localStorage.setItem('sofia_vitamina_confirmada_data', backendData);
        }
      } catch (err) {
        console.error("Failed to fetch vitamin data from backend", err);
      }
      
      const searchParams = new URLSearchParams(window.location.search);
      const isForcePreview = searchParams.get('previewVitamina') === 'true';

      // Se for forçado por preview de teste ou se for >= 9h e ainda não confirmado
      if (isForcePreview) {
        setMostrarModal(true);
      } else if (dataConfirmada !== hojeStr && hora >= 9) {
        setMostrarModal(true);
      } else {
        setMostrarModal(false);
      }
    };

    verificarVitamina();

    const handleCustomEvent = () => {
      setMostrarModal(true);
    };

    window.addEventListener('abrirPreviewVitamina', handleCustomEvent);
    return () => {
      window.removeEventListener('abrirPreviewVitamina', handleCustomEvent);
    };
  }, []);

  const confirmarVitamina = async () => {
    const hojeStr = format(new Date(), 'yyyy-MM-dd');
    localStorage.setItem('sofia_vitamina_confirmada_data', hojeStr);
    setMostrarModal(false);
    
    // Save to backend so all devices are synced
    await api.saveConfiguracao('vitamina_confirmada_data', hojeStr);
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
