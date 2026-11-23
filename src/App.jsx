import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import { aplicarTema } from './services/natal';

// O Início carrega logo; as outras páginas só quando são abertas (e são preparadas em segundo plano
// quando a app está parada). Assim o primeiro carregamento tem muito menos JavaScript para processar.
const carregarAgenda = () => import('./pages/Agenda');
const carregarMarcos = () => import('./pages/Marcos');
const carregarDocumentos = () => import('./pages/Documentos');
const carregarPeso = () => import('./pages/Peso');
const carregarVacinas = () => import('./pages/Vacinas');
const carregarLeite = () => import('./pages/Leite');
const carregarDefinicoes = () => import('./pages/Definicoes');
const carregarPerfil = () => import('./pages/Perfil');

const Agenda = lazy(carregarAgenda);
const Marcos = lazy(carregarMarcos);
const Documentos = lazy(carregarDocumentos);
const Peso = lazy(carregarPeso);
const Vacinas = lazy(carregarVacinas);
const Leite = lazy(carregarLeite);
const Definicoes = lazy(carregarDefinicoes);
const Perfil = lazy(carregarPerfil);

// Primeiro as mais usadas e as mais pesadas (Registos e Peso, que tem o gráfico)
const PAGINAS = [carregarLeite, carregarPeso, carregarAgenda, carregarVacinas, carregarMarcos, carregarDocumentos, carregarDefinicoes, carregarPerfil];

function App() {
  useEffect(() => {
    aplicarTema();
  }, []);

  // Com a app parada, vai buscando as outras páginas uma a uma, para a navegação ser instantânea
  useEffect(() => {
    let cancelado = false;
    let id;
    const preparar = (indice = 0) => {
      if (cancelado || indice >= PAGINAS.length) return;
      PAGINAS[indice]().catch(() => {});
      id = window.setTimeout(() => preparar(indice + 1), 400);
    };
    id = window.setTimeout(() => preparar(0), 1500);
    return () => {
      cancelado = true;
      window.clearTimeout(id);
    };
  }, []);

  return (
    <BrowserRouter>
      <Layout>
        <Suspense fallback={null}>
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
        </Suspense>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
