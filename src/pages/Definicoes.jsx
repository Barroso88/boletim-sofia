import { useState, useEffect } from 'react';
import { Settings, Palette, CheckCircle } from 'lucide-react';
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

  return (
    <div className="page-container">
      <div className="flex-between mb-4">
        <h2 className="h2 text-gradient" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Settings size={32} color="var(--color-primary)" /> Definições
        </h2>
      </div>

      <div className="settings-grid">
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

        {/* Future settings sections can go here */}
      </div>
    </div>
  );
};

export default Definicoes;
