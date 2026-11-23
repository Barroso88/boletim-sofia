// Modo Natal: tema de fundo + cabeçalho natalício, ligado/desligado nas Definições.
// Desligado (por defeito), a app fica exatamente como estava.
const CHAVE = 'sofia_natal';

export const NATAL_TEMA = 'baby-natal';
export const NATAL_CABECALHO = '/natal-cabecalho-casa.jpg';

export const isNatalAtivo = () => {
  try {
    return localStorage.getItem(CHAVE) === '1';
  } catch {
    return false;
  }
};

// Aplica ao <html> o tema de Natal (se ativo) ou o tema guardado pelo utilizador.
export const aplicarTema = () => {
  let tema = 'rosegold';
  try {
    tema = isNatalAtivo() ? NATAL_TEMA : localStorage.getItem('sofia_theme') || 'rosegold';
  } catch {
    // sem acesso ao armazenamento local: mantém o tema por defeito
  }
  document.documentElement.setAttribute('data-theme', tema);
};

export const setNatalAtivo = (ativo) => {
  try {
    if (ativo) localStorage.setItem(CHAVE, '1');
    else localStorage.removeItem(CHAVE);
  } catch {
    // sem acesso ao armazenamento local
  }
  aplicarTema();
  window.dispatchEvent(new CustomEvent('natalModeChanged', { detail: ativo }));
};
