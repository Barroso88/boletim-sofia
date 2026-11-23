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

// Fundo do modo Natal: 'rosa' (bolachas de gengibre, por defeito) ou 'vermelho' (bolachas, bengalas e árvores).
const CHAVE_FUNDO = 'sofia_natal_fundo';

export const getFundo = () => {
  try {
    return localStorage.getItem(CHAVE_FUNDO) === 'vermelho' ? 'vermelho' : 'rosa';
  } catch {
    return 'rosa';
  }
};

export const setFundo = (tipo) => {
  try {
    if (tipo === 'vermelho') localStorage.setItem(CHAVE_FUNDO, 'vermelho');
    else localStorage.removeItem(CHAVE_FUNDO);
  } catch {
    // sem acesso ao armazenamento local
  }
  aplicarTema();
};

// Ícone da app (separador do browser, ecrã principal): no modo Natal usa a foto natalícia.
// Guarda o endereço original no próprio elemento para o repor ao desligar o modo.
// Nota: o ícone do ecrã principal só muda ao (re)adicionar a app ao ecrã principal.
const ICONES_NATAL = {
  'link[rel="icon"]': '/natal-icone-192.png?v=1',
  'link[rel="apple-touch-icon"]': '/natal-icone-512.png?v=1',
  'link[rel="manifest"]': '/manifest-natal.json?v=1',
};

export const aplicarIcone = (natal) => {
  Object.entries(ICONES_NATAL).forEach(([seletor, hrefNatal]) => {
    const el = document.querySelector(seletor);
    if (!el) return;
    if (!el.dataset.original) el.dataset.original = el.getAttribute('href');
    el.setAttribute('href', natal ? hrefNatal : el.dataset.original);
  });
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

  // Fundo do modo Natal: o atributo só existe com o modo ligado
  if (tema === NATAL_TEMA) document.documentElement.setAttribute('data-natal-fundo', getFundo());
  else document.documentElement.removeAttribute('data-natal-fundo');

  aplicarIcone(tema === NATAL_TEMA);
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

// Neve do modo Natal (só existe dentro do modo Natal):
//   'estrelas'  -> estrelas coloridas a cair (por defeito)
//   'flocos'    -> flocos de neve brancos em estrela
//   'desligada' -> sem neve
const CHAVE_NEVE = 'sofia_natal_neve';

export const getNeve = () => {
  try {
    const valor = localStorage.getItem(CHAVE_NEVE);
    if (valor === '0' || valor === 'desligada') return 'desligada';
    if (valor === 'flocos') return 'flocos';
    return 'estrelas';
  } catch {
    return 'estrelas';
  }
};

export const setNeve = (tipo) => {
  try {
    if (tipo === 'estrelas') localStorage.removeItem(CHAVE_NEVE);
    else localStorage.setItem(CHAVE_NEVE, tipo === 'flocos' ? 'flocos' : '0');
  } catch {
    // sem acesso ao armazenamento local
  }
  window.dispatchEvent(new CustomEvent('natalSnowChanged', { detail: tipo }));
};
