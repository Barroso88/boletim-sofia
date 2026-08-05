import { useState, useEffect } from 'react';
import { Settings, Palette, CheckCircle, BellRing, Eye, RotateCcw } from 'lucide-react';
import './Definicoes.css';

const THEMES = [
  { id: 'rosegold', name: 'Rose Gold', primary: '#F43F5E', secondary: '#FB923C', bg: '#FFF5F7' },
  { id: 'ocean', name: 'Ocean Blue', primary: '#0284C7', secondary: '#6366F1', bg: '#E0F2FE' },
  { id: 'forest', name: 'Forest Green', primary: '#059669', secondary: '#0D9488', bg: '#DCFCE7' },
  { id: 'lavender', name: 'Lavender Purple', primary: '#9333EA', secondary: '#EC4899', bg: '#F3E8FF' },
  { id: 'sunflower', name: 'Sunflower Amber', primary: '#D97706', secondary: '#EA580C', bg: '#FEF3C7' },
  { id: 'midnight', name: 'Midnight Dark', primary: '#6366F1', secondary: '#F43F5E', bg: '#0B132B' },
  { id: 'mocha', name: 'Mocha Cream', primary: '#87431D', secondary: '#D97706', bg: '#F5EBE6' },
  { id: 'sunset', name: 'Sunset Orange', primary: '#EA580C', secondary: '#E11D48', bg: '#FFEDD5' },
  { id: 'mint', name: 'Mint Fresh', primary: '#0D9488', secondary: '#10B981', bg: '#CCFBF1' },
  { id: 'cherry', name: 'Cherry Ruby', primary: '#E11D48', secondary: '#F43F5E', bg: '#FFE4E6' },
];

const Definicoes = () => {
  const [activeTheme, setActiveTheme] = useState('rosegold');
  const [mensagemSucesso, setMensagemSucesso] = useState('');

  useEffect(() => {
    const savedTheme = localStorage.getItem('sofia_theme');
    if (savedTheme) {
      setActiveTheme(savedTheme);
    }
  }, []);

  const changeTheme = (themeId) => {
    setActiveTheme(themeId);
    localStorage.setItem('sofia_theme', themeId);
    document.documentElement.setAttribute('data-theme', themeId);
  };

  const testarPopUpVitamina = () => {
    window.dispatchEvent(new Event('abrirPreviewVitamina'));
  };

  const resetarEstadoVitamina = () => {
    localStorage.removeItem('sofia_vitamina_confirmada_data');
    setMensagemSucesso('Confirmação de vitamina limpa! Se for 9h+, o pop-up abrirá novamente.');
    setTimeout(() => setMensagemSucesso(''), 4000);
  };

  return (
    <div className="page-container">
      <div className="flex-between mb-4">
        <h2 className="h2 text-gradient" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Settings size={32} color="var(--color-primary)" /> Definições
        </h2>
      </div>

      <div className="settings-grid" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Temas */}
        <div className="glass-card settings-section animate-fade-in">
          <div className="settings-header">
            <Palette size={24} color="var(--color-secondary)" />
            <h3 className="h3">Temas de Aparência</h3>
          </div>
          <p className="text-small mb-4">
            Personalize as cores de toda a aplicação selecionando um dos nossos 10 temas premium disponíveis abaixo.
          </p>

          <div className="themes-grid">
            {THEMES.map((theme, index) => (
              <div 
                key={theme.id}
                className={`theme-card ${activeTheme === theme.id ? 'active' : ''}`}
                onClick={() => changeTheme(theme.id)}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div 
                  className="theme-preview"
                  style={{ backgroundColor: theme.bg }}
                >
                  <div className="theme-color-swatch" style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})` }}></div>
                  <div className="theme-fake-card">
                    <div className="fake-line" style={{ width: '40%', background: theme.primary }}></div>
                    <div className="fake-line" style={{ width: '70%' }}></div>
                  </div>
                  
                  {activeTheme === theme.id && (
                    <div className="theme-check">
                      <CheckCircle size={20} color={theme.primary} fill="white" />
                    </div>
                  )}
                </div>
                
                <span className="theme-name">{theme.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Lembrete de Vitamina Test / Config */}
        <div className="glass-card settings-section animate-fade-in">
          <div className="settings-header">
            <BellRing size={24} color="var(--color-primary)" />
            <h3 className="h3">Lembrete Diário: Vitamina D 💊</h3>
          </div>
          <p className="text-small mb-4">
            A partir das 9h da manhã, se a Vitamina D ainda não tiver sido tomada hoje, a aplicação exibe um pop-up de lembrete.
          </p>

          {mensagemSucesso && (
            <div style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', color: '#047857', padding: '0.75rem 1rem', borderRadius: '12px', fontSize: '0.88rem', fontWeight: '700', marginBottom: '1rem' }}>
              ✓ {mensagemSucesso}
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button className="btn-primary" onClick={testarPopUpVitamina} style={{ flex: 1, minWidth: '220px' }}>
              <Eye size={18} /> Ver Preview do Pop-up Agora
            </button>
            <button className="btn-outline" onClick={resetarEstadoVitamina} style={{ flex: 1, minWidth: '220px' }}>
              <RotateCcw size={18} /> Limpar Confirmação de Hoje
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Definicoes;
