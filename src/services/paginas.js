// Páginas carregadas à parte (code splitting) com cache e pré-carregamento.
// Uma página já carregada aparece logo, sem esperar nem mostrar ecrã em branco.
const CARREGADORES = {
  '/agenda': () => import('../pages/Agenda'),
  '/marcos': () => import('../pages/Marcos'),
  '/documentos': () => import('../pages/Documentos'),
  '/peso': () => import('../pages/Peso'),
  '/vacinas': () => import('../pages/Vacinas'),
  '/leite': () => import('../pages/Leite'),
  '/definicoes': () => import('../pages/Definicoes'),
  '/perfil': () => import('../pages/Perfil'),
};

// Ordem de preparação em segundo plano: as mais usadas e as mais pesadas primeiro
export const ORDEM_PREPARACAO = ['/leite', '/peso', '/agenda', '/vacinas', '/marcos', '/documentos', '/definicoes', '/perfil'];

const cache = new Map();

// Depois de uma atualização, uma versão antiga em memória pede ficheiros que já não existem.
// Nesse caso recarrega a página para apanhar a versão nova. Para nunca recarregar em ciclo (por exemplo,
// se um ficheiro faltar mesmo), só recarrega uma vez por minuto; depois disso mostra o aviso de erro.
const CHAVE_RECARGA = 'sofia_recarga_por_erro';
const INTERVALO_MINIMO_MS = 60000;

export const recarregarSeFicheiroEmFalta = () => {
  try {
    const ultima = parseInt(sessionStorage.getItem(CHAVE_RECARGA) || '0', 10);
    if (Date.now() - ultima < INTERVALO_MINIMO_MS) return false;
    sessionStorage.setItem(CHAVE_RECARGA, String(Date.now()));
  } catch {
    return false; // sem sessionStorage não arriscamos um ciclo de recargas
  }
  window.location.reload();
  return true;
};

// Uma falha fica guardada uns segundos (para o aviso de erro aparecer e não haver tentativas em ciclo).
// Passado esse tempo, ao voltar ao separador, tenta outra vez.
const ESPERA_ANTES_DE_REPETIR_MS = 5000;

// Esquece as falhas, para o botão "Tentar outra vez" voltar a pedir o ficheiro.
export const esquecerErros = () => {
  [...cache.entries()].forEach(([caminho, entrada]) => {
    if (entrada.erro) cache.delete(caminho);
  });
};

export const entradaDaPagina = (caminho) => {
  const guardada = cache.get(caminho);
  if (guardada && guardada.erro && Date.now() - guardada.falhouEm > ESPERA_ANTES_DE_REPETIR_MS) {
    cache.delete(caminho);
  }
  if (!cache.has(caminho)) {
    const entrada = { componente: null, erro: null, falhouEm: 0, promessa: null };
    entrada.promessa = CARREGADORES[caminho]()
      .then((modulo) => {
        entrada.componente = modulo.default;
      })
      .catch((erro) => {
        entrada.erro = erro;
        entrada.falhouEm = Date.now();
        recarregarSeFicheiroEmFalta();
      });
    cache.set(caminho, entrada);
  }
  return cache.get(caminho);
};

// Começa a carregar a página (sem a mostrar). Seguro de chamar muitas vezes.
export const preCarregar = (caminho) => {
  if (CARREGADORES[caminho]) entradaDaPagina(caminho);
};
