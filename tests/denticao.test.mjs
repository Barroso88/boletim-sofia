import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarDenticao } from '../src/services/denticao.js';

const armazem = (inicial = {}) => {
  const m = new Map(Object.entries(inicial).map(([k, v]) => [k, JSON.stringify(v)]));
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) };
};

// servidor em memória, partilhado pelos "telemóveis"
const servidor = () => {
  const dentes = new Map();
  const s = { dentes, ligado: true };
  s.pedir = async (url, { method = 'GET', body } = {}) => {
    if (!s.ligado) return null;
    if (method === 'POST') { const { dente, data } = JSON.parse(body); dentes.set(dente, data); return { success: true }; }
    if (method === 'DELETE') { dentes.delete(url.split('/').pop()); return { success: true }; }
    return [...dentes].map(([dente, data]) => ({ dente, data }));
  };
  return s;
};

test('o que já estava em cada telemóvel é enviado e junta-se', async () => {
  const s = servidor();
  const pai = criarDenticao(s.pedir, armazem({ sofia_denticao: { l_ic_r: '2026-05-01' } }));
  const mae = criarDenticao(s.pedir, armazem({ sofia_denticao: { l_ic_l: '2026-05-02', l_ic_r: '2026-05-09', lixo: 'x' } }));
  await pai.carregar();
  assert.deepEqual(await mae.carregar(), { l_ic_r: '2026-05-01', l_ic_l: '2026-05-02' });
  assert.deepEqual(await pai.carregar(), { l_ic_r: '2026-05-01', l_ic_l: '2026-05-02' });
});

test('um dente removido num telemóvel não volta por causa do outro', async () => {
  const s = servidor();
  const pai = criarDenticao(s.pedir, armazem({ sofia_denticao: { l_ic_r: '2026-05-01' } }));
  const mae = criarDenticao(s.pedir, armazem());
  await pai.carregar();
  await mae.carregar();
  await mae.remover('l_ic_r');
  assert.deepEqual(await pai.carregar(), {});
  assert.equal(s.dentes.size, 0);
});

test('sem ligação ao servidor nada se perde, e segue mais tarde', async () => {
  const s = servidor();
  s.dentes.set('u_ic_r', '2026-06-01');
  const tel = criarDenticao(s.pedir, armazem());
  await tel.carregar();
  s.ligado = false;
  await tel.guardar('u_ic_l', '2026-06-02');
  await tel.remover('u_ic_r');
  assert.deepEqual(await tel.carregar(), { u_ic_l: '2026-06-02' });
  s.ligado = true;
  assert.deepEqual(await tel.carregar(), { u_ic_l: '2026-06-02' });
  assert.deepEqual([...s.dentes], [['u_ic_l', '2026-06-02']]);
});

test('servidor ainda antigo: fica tudo no telemóvel e é enviado depois da atualização', async () => {
  const s = servidor();
  s.ligado = false;
  const guardado = armazem({ sofia_denticao: { l_ic_r: '2026-05-01' } });
  const tel = criarDenticao(s.pedir, guardado);
  assert.deepEqual(await tel.carregar(), { l_ic_r: '2026-05-01' });
  s.ligado = true;
  await tel.carregar();
  assert.equal(s.dentes.get('l_ic_r'), '2026-05-01');
});
