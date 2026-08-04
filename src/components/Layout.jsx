import { Link, useLocation } from 'react-router-dom';
import { Baby, Calendar, Image, FileText, Scale, Syringe, Settings } from 'lucide-react';
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
    { path: '/definicoes', label: 'Definições', icon: <Settings size={20} /> },
  ];

  return (
    <div className="layout">
      <nav className="navbar glass-card">
        <div className="navbar-brand">
          <div className="avatar">S</div>
          <span className="h3 text-gradient">Boletim da Sofia</span>
        </div>
        {/* On desktop, this hidden class can be applied, or we handle via CSS */}
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
