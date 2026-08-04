import { Link, useLocation } from 'react-router-dom';
import { Baby, Calendar, Image, FileText, Scale, Syringe, Settings, Milk } from 'lucide-react';
import './Layout.css';

const Layout = ({ children }) => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Início', icon: <Baby size={20} /> },
    { path: '/agenda', label: 'Agenda', icon: <Calendar size={20} /> },
    { path: '/marcos', label: 'Marcos', icon: <Image size={20} /> },
    { path: '/documentos', label: 'Documentos', icon: <FileText size={20} /> },
    { path: '/peso', label: 'Peso', icon: <Scale size={20} /> },
    { path: '/vacinas', label: 'Vacinas', icon: <Syringe size={20} /> },
    { path: '/leite', label: 'Leite', icon: <Milk size={20} /> },
  ];

  return (
    <div className="layout">
      <nav className="navbar glass-card">
        <div className="navbar-left">
          <Link
            to="/definicoes"
            className={`btn-settings-header ${location.pathname === '/definicoes' ? 'active' : ''}`}
            title="Definições"
          >
            <Settings size={20} />
          </Link>
          <div className="navbar-brand">
            <div className="avatar" style={{ padding: '3px', background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <img src="/favicon.png" alt="Sofia" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '50%' }} />
            </div>
            <span className="h3 text-gradient">Boletim da Sofia</span>
          </div>
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
