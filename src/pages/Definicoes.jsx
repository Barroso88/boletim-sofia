import { useState, useEffect } from 'react';
import { Settings, Palette, CheckCircle, BellRing, Eye, RotateCcw, Sparkles, Image } from 'lucide-react';
import './Definicoes.css';

const BABY_THEMES = [
  { id: 'baby-clouds', name: 'Nuvem & Estrelas ☁️', primary: '#0284C7', secondary: '#818CF8', bg: '#F0F9FF', tag: 'Elementos no fundo' },
  { id: 'baby-teddy', name: 'Ursinho Carinho 🧸', primary: '#D97706', secondary: '#F59E0B', bg: '#FFFBEB', tag: 'Elementos no fundo' },
  { id: 'baby-nursery', name: 'Biberão & Chupeta 🍼', primary: '#EC4899', secondary: '#38BDF8', bg: '#FFF1F2', tag: 'Elementos no fundo' },
  { id: 'baby-rainbow', name: 'Arco-Íris Bebé 🌈', primary: '#8B5CF6', secondary: '#F43F5E', bg: '#F5F3FF', tag: 'Elementos no fundo' },
  { id: 'baby-safari', name: 'Safari Bebés 🦒', primary: '#10B981', secondary: '#F59E0B', bg: '#ECFDF5', tag: 'Elementos no fundo' },
  { id: 'baby-duckling', name: 'Patinho de Banho 🐥', primary: '#F59E0B', secondary: '#06B6D4', bg: '#FEFCE8', tag: 'Elementos no fundo' },
];

const STANDARD_THEMES = [
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
  const [headerPattern, setHeaderPattern] = useState('/cabecalho.jpg');
  const [mensagemSucesso, setMensagemSucesso] = useState('');

  useEffect(() => {
    const savedTheme = localStorage.getItem('sofia_theme');
    if (savedTheme) {
      setActiveTheme(savedTheme);
    }
    const savedPattern = localStorage.getItem('sofia_header_pattern');
    if (savedPattern) {
      setHeaderPattern(savedPattern);
    }
  }, []);

  const changeTheme = (themeId) => {
    setActiveTheme(themeId);
    localStorage.setItem('sofia_theme', themeId);
    document.documentElement.setAttribute('data-theme', themeId);
  };

  const changeHeaderPattern = (pattern) => {
    let finalPattern = pattern.trim();
    if (!finalPattern.startsWith('/') && !finalPattern.startsWith('http')) {
      finalPattern = '/' + finalPattern;
    }
    setHeaderPattern(finalPattern);
    localStorage.setItem('sofia_header_pattern', finalPattern);
    window.dispatchEvent(new CustomEvent('headerPatternChanged', { detail: finalPattern }));
    
    setMensagemSucesso('Padrão do cabeçalho atualizado!');
    setTimeout(() => setMensagemSucesso(''), 4000);
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
        
        {/* Selector de Padrão do Cabeçalho */}
        <div className="glass-card settings-section animate-fade-in" style={{ border: '2px solid rgba(2,132,199,0.25)', background: 'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(224,242,254,0.5))' }}>
          <div className="settings-header">
            <Image size={24} color="var(--color-primary)" />
            <h3 className="h3" style={{ color: 'var(--color-primary-dark)' }}>🖼️ Padrão do Cabeçalho</h3>
          </div>
          <p className="text-small mb-4">
            Escolha abaixo um dos padrões disponíveis para preencher o fundo do cabeçalho da aplicação.
          </p>

          <div className="themes-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '1rem' }}>
            {['cabecalho.jpg', 'cabecalho2.jpg', 'cabecalho3.jpg', 'cabecalho4.jpg', 'cabecalho5.jpg', 'cabecalho6.jpg', 'cabecalho7.jpg', 'cabecalho8.jpg', 'cabecalho9.jpg', 'cabecalho10.jpg'].map((pattern) => (
              <div 
                key={pattern}
                className={`theme-card ${headerPattern === '/' + pattern ? 'active' : ''}`}
                onClick={() => changeHeaderPattern(pattern)}
                style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}
              >
                <div 
                  className="theme-preview"
                  style={{ 
                    backgroundImage: `url('/${pattern}')`, 
                    backgroundSize: 'cover', 
                    backgroundPosition: 'center',
                    height: '80px',
                    width: '100%',
                    borderRadius: 'var(--radius-md)',
                    border: headerPattern === '/' + pattern ? '2px solid var(--color-primary)' : '1px solid var(--color-border)'
                  }}
                >
                  {headerPattern === '/' + pattern && (
                    <div className="theme-check" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(255,255,255,0.8)', borderRadius: '50%', padding: '2px' }}>
                      <CheckCircle size={24} color="var(--color-primary)" fill="white" />
                    </div>
                  )}
                </div>
                <span className="text-small" style={{ fontSize: '0.75rem', fontWeight: 600, textAlign: 'center' }}>
                  {pattern.replace('.jpg', '').replace('cabecalho', 'Padrão ')}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Temas Especiais Bebé com Fundo Ilustrado */}
        <div className="glass-card settings-section animate-fade-in" style={{ border: '2px solid rgba(244,63,94,0.25)', background: 'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(254,243,199,0.5))' }}>
          <div className="settings-header">
            <Sparkles size={24} color="var(--color-primary)" />
            <h3 className="h3" style={{ color: 'var(--color-primary-dark)' }}>🍼 Temas Especiais Bebé (Ilustrações de Fundo)</h3>
          </div>
          <p className="text-small mb-4">
            Temas com marca d’água e ilustrações suaves e transparentes no fundo (nuvens, ursinhos, biberões, chocalhos e patinhos) sem saturar a vista.
          </p>

          <div className="themes-grid">
            {BABY_THEMES.map((theme, index) => (
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
                    <div className="fake-line" style={{ width: '50%', background: theme.primary }}></div>
                    <div className="fake-line" style={{ width: '70%' }}></div>
                  </div>
                  
                  {activeTheme === theme.id && (
                    <div className="theme-check">
                      <CheckCircle size={20} color={theme.primary} fill="white" />
                    </div>
                  )}
                </div>
                
                <span className="theme-name" style={{ fontWeight: 800 }}>{theme.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Temas Clássicos */}
        <div className="glass-card settings-section animate-fade-in">
          <div className="settings-header">
            <Palette size={24} color="var(--color-secondary)" />
            <h3 className="h3">Temas Clássicos</h3>
          </div>
          <p className="text-small mb-4">
            Cores de destaque suaves e elegantes em tom pastel.
          </p>

          <div className="themes-grid">
            {STANDARD_THEMES.map((theme, index) => (
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
