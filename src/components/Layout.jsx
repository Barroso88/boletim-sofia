import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Baby, Calendar, Image, FileText, Scale, Syringe, Settings, ClipboardList, RefreshCw } from 'lucide-react';
import VitaminaModal from './VitaminaModal';
import './Layout.css';

const Layout = ({ children }) => {
  const location = useLocation();
  const [headerPattern, setHeaderPattern] = useState('/cabecalho.jpg');
  const [headerFont, setHeaderFont] = useState("'Sweet Cucumber Mocktail', cursive");
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const savedPattern = localStorage.getItem('sofia_header_pattern');
    if (savedPattern) {
      setHeaderPattern(savedPattern);
    }
    const savedFont = localStorage.getItem('sofia_header_font');
    if (savedFont) {
      setHeaderFont(savedFont);
    }
    
    const handlePatternChange = (e) => {
      setHeaderPattern(e.detail);
    };
    
    const handleFontChange = (e) => {
      setHeaderFont(e.detail);
    };
    
    // Auto-refresh when app comes to foreground (after being backgrounded on iOS)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // We could force a reload here, but a manual button is safer.
        // We will just leave the manual button for now.
      }
    };
    
    window.addEventListener('headerPatternChanged', handlePatternChange);
    window.addEventListener('headerFontChanged', handleFontChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('headerPatternChanged', handlePatternChange);
      window.removeEventListener('headerFontChanged', handleFontChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      // Avoid window.location.reload() on iOS standalone PWAs to prevent freezing
      if (window.navigator.standalone || /iPad|iPhone|iPod/.test(navigator.userAgent)) {
        window.location.href = window.location.href;
      } else {
        window.location.reload();
      }
    }, 300);
  };

  const navItems = [
    { path: '/', label: 'Início', icon: <Baby size={20} /> },
    { path: '/agenda', label: 'Agenda', icon: <Calendar size={20} /> },
    { path: '/marcos', label: 'Marcos', icon: <Image size={20} /> },
    { path: '/documentos', label: 'Documentos', icon: <FileText size={20} /> },
    { path: '/peso', label: 'Peso', icon: <Scale size={20} /> },
    { path: '/vacinas', label: 'Vacinas', icon: <Syringe size={20} /> },
    { path: '/leite', label: 'Registos', icon: <ClipboardList size={20} /> },
  ];

  return (
    <div className="layout">
      <VitaminaModal />
      <nav
        className="navbar glass-card theme-neon"
        style={{
          '--header-pattern': `url('${headerPattern}')`
        }}
      >
        <div className="navbar-left">
          <Link to="/perfil" className="navbar-brand brand-link">
            <div className="avatar-ring theme-neon-avatar">
              <div className="avatar">
                <img src="/favicon.png?v=4" alt="Sofia" />
              </div>
            </div>
          </Link>
        </div>

        <div className="navbar-center" style={{ display: 'flex', justifyContent: 'center', flex: 1 }}>
          <Link to="/perfil" className="brand-link" style={{ textDecoration: 'none' }}>
            <span className="brand-title" style={{ 
              fontFamily: headerFont, 
              fontSize: '3.5rem', 
              lineHeight: 1,
              padding: '0.5rem 1rem'
            }}>
              Sofia
            </span>
          </Link>
        </div>
        <div className="navbar-right mobile-only">
          <button 
            className="btn-settings-header btn-refresh" 
            onClick={handleRefresh}
            title="Atualizar"
            style={{ marginRight: '0.5rem' }}
          >
            <RefreshCw size={20} className={isRefreshing ? 'spin-animation' : ''} />
          </button>
          <Link
            to="/definicoes"
            className={`btn-settings-header ${location.pathname === '/definicoes' ? 'active' : ''}`}
            title="Definições"
          >
            <Settings size={20} />
          </Link>
        </div>

        <div className="nav-links desktop-only">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
          <Link
            to="/definicoes"
            className={`nav-item ${location.pathname === '/definicoes' ? 'active' : ''}`}
          >
            <Settings size={20} />
            <span>Definições</span>
          </Link>
        </div>
      </nav>
      
      <main className="main-content container animate-fade-in">
        {children}
      </main>

      {/* On mobile, this standalone nav-links sits at the very root of the layout avoiding ALL stacking context traps */}
      <div className="nav-links mobile-only">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
          >
            {item.icon}
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Layout;
