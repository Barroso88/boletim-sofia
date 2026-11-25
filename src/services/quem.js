// De quem é este telemóvel. Os registos novos feitos nele levam esse nome.
export const PESSOAS = ['Pai', 'Mãe'];
const CHAVE = 'sofia_quem';

export const getQuem = () => {
  try {
    const valor = localStorage.getItem(CHAVE);
    return PESSOAS.includes(valor) ? valor : null;
  } catch {
    return null;
  }
};

export const setQuem = (valor) => {
  try {
    if (PESSOAS.includes(valor)) localStorage.setItem(CHAVE, valor);
    else localStorage.removeItem(CHAVE);
  } catch {
    // sem acesso ao armazenamento local
  }
};

// Registo novo: leva o nome deste telemóvel. Edição: mantém o autor original (ou nenhum).
export const comAutor = (registo, existentes = []) => {
  const anterior = existentes.find((r) => String(r.id) === String(registo.id));
  const quem = anterior ? anterior.quem : getQuem();
  return quem ? { ...registo, quem } : registo;
};
