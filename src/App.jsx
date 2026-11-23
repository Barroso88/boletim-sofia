import { Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Pagina from './components/Pagina';
import ErroPagina from './components/ErroPagina';
import { aplicarTema } from './services/natal';
import { ORDEM_PREPARACAO, preCarregar, recarregarSeFicheiroEmFalta } from './services/paginas';

// As rotas ficam dentro do router para o aviso de erro se limpar sozinho ao mudar de separador.
function Rotas() {
  const { pathname } = useLocation();
  return (
    <ErroPagina chave={pathname}>
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/agenda" element={<Pagina caminho="/agenda" />} />
          <Route path="/marcos" element={<Pagina caminho="/marcos" />} />
          <Route path="/documentos" element={<Pagina caminho="/documentos" />} />
          <Route path="/peso" element={<Pagina caminho="/peso" />} />
          <Route path="/vacinas" element={<Pagina caminho="/vacinas" />} />
          <Route path="/leite" element={<Pagina caminho="/leite" />} />
          <Route path="/definicoes" element={<Pagina caminho="/definicoes" />} />
          <Route path="/perfil" element={<Pagina caminho="/perfil" />} />
        </Routes>
      </Suspense>
    </ErroPagina>
  );
}

function App() {
  useEffect(() => {
    aplicarTema();
  }, []);

  // Depois de uma atualização, ficheiros antigos deixam de existir: recarrega uma vez para apanhar a versão nova
  useEffect(() => {
    const aoFalharFicheiro = () => recarregarSeFicheiroEmFalta();
    window.addEventListener('vite:preloadError', aoFalharFicheiro);
    return () => window.removeEventListener('vite:preloadError', aoFalharFicheiro);
  }, []);

  // Com a app parada, vai buscando as outras páginas, para abrirem logo ao tocar no separador
  useEffect(() => {
    let cancelado = false;
    let id;
    const preparar = (indice = 0) => {
      if (cancelado || indice >= ORDEM_PREPARACAO.length) return;
      preCarregar(ORDEM_PREPARACAO[indice]);
      id = window.setTimeout(() => preparar(indice + 1), 150);
    };
    id = window.setTimeout(() => preparar(0), 800);
    return () => {
      cancelado = true;
      window.clearTimeout(id);
    };
  }, []);

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Layout>
        <Rotas />
      </Layout>
    </BrowserRouter>
  );
}

export default App;
