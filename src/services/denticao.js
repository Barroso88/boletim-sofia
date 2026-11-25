// Dentes nascidos { idDoDente: 'aaaa-mm-dd' }, partilhados entre telemóveis pelo servidor.
// O que não chegar ao servidor fica "pendente" no telemóvel e é reenviado mais tarde.
import { DENTES } from './boca.js';

const CHAVE = 'sofia_denticao';
const PENDENTES = 'sofia_denticao_pendentes'; // { id: data, ou null se foi removido }
const SINCRONIZADO = 'sofia_denticao_sincronizado';
const IDS = new Set(DENTES.map((d) => d.id));

const pedirAoServidor = async (url, opcoes = {}) => {
  try {
    const res = await fetch(url, { ...opcoes, signal: AbortSignal.timeout(4000) });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
};

export const criarDenticao = (pedir = pedirAoServidor, armazem = globalThis.localStorage) => {
  const ler = (chave) => {
    try {
      const valor = JSON.parse(armazem.getItem(chave)) || {};
      return Object.fromEntries(Object.entries(valor).filter(([id]) => IDS.has(id)));
    } catch {
      return {};
    }
  };
  const escrever = (chave, valor) => armazem.setItem(chave, JSON.stringify(valor));

  const aplicar = (mapa, id, data) => {
    if (data) mapa[id] = data;
    else delete mapa[id];
    return mapa;
  };

  const enviar = async (id, data) => {
    const resposta = data
      ? await pedir('/api/denticao', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dente: id, data }),
        })
      : await pedir(`/api/denticao/${id}`, { method: 'DELETE' });
    const pendentes = ler(PENDENTES);
    if (resposta?.success && pendentes[id] === data) {
      delete pendentes[id];
      escrever(PENDENTES, pendentes);
    }
  };

  const alterar = async (id, data) => {
    escrever(CHAVE, aplicar(ler(CHAVE), id, data));
    escrever(PENDENTES, { ...ler(PENDENTES), [id]: data });
    await enviar(id, data);
  };

  return {
    local: () => ler(CHAVE),
    guardar: (id, data) => alterar(id, data),
    remover: (id) => alterar(id, null),

    async carregar() {
      const remoto = await pedir('/api/denticao');
      if (!Array.isArray(remoto)) return ler(CHAVE);
      const dentes = Object.fromEntries(remoto.filter((r) => IDS.has(r.dente)).map((r) => [r.dente, r.data]));

      // Primeira vez: o que só existe neste telemóvel segue para o servidor
      if (!armazem.getItem(SINCRONIZADO)) {
        const novos = Object.entries(ler(CHAVE)).filter(([id]) => !dentes[id]);
        escrever(PENDENTES, { ...Object.fromEntries(novos), ...ler(PENDENTES) });
        armazem.setItem(SINCRONIZADO, '1');
      }

      const pendentes = Object.entries(ler(PENDENTES));
      pendentes.forEach(([id, data]) => aplicar(dentes, id, data));
      escrever(CHAVE, dentes);
      for (const [id, data] of pendentes) await enviar(id, data);
      return ler(CHAVE);
    },
  };
};

export const denticao = criarDenticao();
