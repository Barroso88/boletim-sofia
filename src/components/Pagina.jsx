import { use } from 'react';
import { entradaDaPagina } from '../services/paginas';

// Mostra uma página carregada à parte. Se já foi carregada, desenha-a logo; se não, espera
// (o React mantém a página anterior visível enquanto isso, graças às transições do router).
const Pagina = ({ caminho }) => {
  const entrada = entradaDaPagina(caminho);
  if (!entrada.componente) use(entrada.promessa);
  // Se o ficheiro da página não chegou, mostra o aviso de erro (com "Tentar outra vez") em vez de um ecrã vazio
  if (entrada.erro) throw entrada.erro;
  const Componente = entrada.componente;
  return Componente ? <Componente /> : null;
};

export default Pagina;
