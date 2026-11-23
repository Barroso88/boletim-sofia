import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Agenda from './pages/Agenda';
import Marcos from './pages/Marcos';
import Documentos from './pages/Documentos';
import Peso from './pages/Peso';
import Vacinas from './pages/Vacinas';
import Leite from './pages/Leite';
import Definicoes from './pages/Definicoes';
import Perfil from './pages/Perfil';
import { aplicarTema } from './services/natal';

function App() {
  useEffect(() => {
    aplicarTema();
  }, []);

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/agenda" element={<Agenda />} />
          <Route path="/marcos" element={<Marcos />} />
          <Route path="/documentos" element={<Documentos />} />
          <Route path="/peso" element={<Peso />} />
          <Route path="/vacinas" element={<Vacinas />} />
          <Route path="/leite" element={<Leite />} />
          <Route path="/definicoes" element={<Definicoes />} />
          <Route path="/perfil" element={<Perfil />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
