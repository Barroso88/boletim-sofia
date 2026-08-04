import { useState, useEffect } from 'react';
import { Settings, Palette, CheckCircle } from 'lucide-react';
import './Definicoes.css';

const THEMES = [
  { id: 'rosegold', name: 'Rose Gold', primary: '#F43F5E', bg: '#F8FAFC' },
  { id: 'ocean', name: 'Ocean Blue', primary: '#0EA5E9', bg: '#F0F9FF' },
  { id: 'forest', name: 'Forest Green', primary: '#10B981', bg: '#F0FDF4' },
  { id: 'lavender', name: 'Lavender Purple', primary: '#A855F7', bg: '#FAF5FF' },
  { id: 'sunflower', name: 'Sunflower Yellow', primary: '#EAB308', bg: '#FEFCE8' },
  { id: 'midnight', name: 'Midnight Dark', primary: '#6366F1', bg: '#0F172A' },
  { id: 'mocha', name: 'Mocha Brown', primary: '#A8A29E', bg: '#FAFAF9' },
  { id: 'sunset', name: 'Sunset Orange', primary: '#F97316', bg: '#FFF7ED' },
  { id: 'mint', name: 'Mint Green', primary: '#14B8A6', bg: '#F0FDFA' },
  { id: 'cherry', name: 'Cherry Red', primary: '#DC2626', bg: '#FEF2F2' },
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
                  <div className="theme-color-circle" style={{ backgroundColor: theme.primary }}></div>
                  <div className="theme-fake-card">
                    <div className="fake-line" style={{ width: '40%' }}></div>
                    <div className="fake-line" style={{ width: '80%' }}></div>
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
