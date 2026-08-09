import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Baby, Calendar, Image, FileText, Scale, Syringe, Settings, ClipboardList } from 'lucide-react';
import VitaminaModal from './VitaminaModal';
import './Layout.css';

const Layout = ({ children }) => {
  const location = useLocation();
  const [headerPattern, setHeaderPattern] = useState('/cabecalho.jpg');

  useEffect(() => {
    const saved = localStorage.getItem('sofia_header_pattern');
    if (saved) {
      setHeaderPattern(saved);
    }
    
    const handlePatternChange = (e) => {
      setHeaderPattern(e.detail);
    };
    
    window.addEventListener('headerPatternChanged', handlePatternChange);
    return () => window.removeEventListener('headerPatternChanged', handlePatternChange);
  }, []);

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
        className="navbar glass-card"
        style={{
          '--header-pattern': `url('${headerPattern}')`
        }}
      >
        <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}>
          <Link to="/perfil" className="brand-link" style={{ textDecoration: 'none' }}>
            <span className="brand-title" style={{ 
              fontFamily: "'Sweet Cucumber Mocktail', cursive", 
              fontSize: '3.5rem', 
              lineHeight: 1,
              padding: '0.5rem 1rem'
            }}>
              Sofia
            </span>
          </Link>
        </div>
        
        {/* Empty div to maintain flex space-between balance since left is absolute now */}
        <div className="navbar-left" style={{ width: '42px' }}></div>
        <div className="navbar-right">
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
