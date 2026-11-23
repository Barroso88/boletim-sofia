// Letras decorativas do nome no cabeçalho: só se carregam quando são precisas.
// Antes, as 9 famílias eram importadas no CSS (bloqueavam o primeiro desenho da página).
const FONTES = {
  'Pacifico': 'Pacifico',
  'Caveat': 'Caveat:wght@600',
  'Dancing Script': 'Dancing+Script:wght@600',
  'Great Vibes': 'Great+Vibes',
  'Satisfy': 'Satisfy',
  'Amatic SC': 'Amatic+SC:wght@700',
  'Cookie': 'Cookie',
  'Sacramento': 'Sacramento',
  'Parisienne': 'Parisienne',
};

const jaCarregadas = new Set();

const adicionarFolha = (chave, url) => {
  if (jaCarregadas.has(chave)) return;
  jaCarregadas.add(chave);
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = url;
  document.head.appendChild(link);
};

// Carrega só a letra escolhida para o nome (ex.: "'Pacifico', cursive").
export const carregarFonteCabecalho = (familia) => {
  const nome = (familia || '').split(',')[0].replace(/['"]/g, '').trim();
  const consulta = FONTES[nome];
  if (!consulta) return; // por exemplo a letra por defeito, que não vem do Google Fonts
  adicionarFolha(nome, `https://fonts.googleapis.com/css2?family=${consulta}&display=swap`);
};

// Carrega todas (para mostrar as pré-visualizações na página de Definições).
export const carregarTodasAsFontes = () => {
  const parametros = Object.values(FONTES).map((consulta) => `family=${consulta}`).join('&');
  adicionarFolha('todas', `https://fonts.googleapis.com/css2?${parametros}&display=swap`);
};
