import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DENTES, VISTA } from '../src/services/boca.js';

// mesma identificação e ordem de erupção que a app já usava (os registos guardados dependem destes ids)
const ESPERADO = {};
for (const [arco, ordens] of [['u', [2, 3, 6, 5, 7]], ['l', [1, 4, 6, 5, 7]]]) {
  ['ic', 'il', 'c', 'm1', 'm2'].forEach((peca, i) => {
    for (const lado of ['r', 'l']) ESPERADO[`${arco}_${peca}_${lado}`] = { ordem: ordens[i], posicao: i };
  });
}
const NOMES = { ic: 'Incisivo Central', il: 'Incisivo Lateral', c: 'Canino', m1: '1º Molar', m2: '2º Molar' };

test('há os 20 dentes, com os mesmos ids e ordem de erupção', () => {
  assert.equal(DENTES.length, 20);
  assert.deepEqual(DENTES.map((d) => d.id).sort(), Object.keys(ESPERADO).sort());
  for (const d of DENTES) assert.equal(d.order, ESPERADO[d.id].ordem, d.id);
});

test('o nome de cada dente corresponde ao id', () => {
  for (const d of DENTES) {
    const [arco, peca, lado] = d.id.split('_');
    assert.ok(d.label.startsWith(NOMES[peca]), `${d.id}: ${d.label}`);
    assert.ok(d.label.includes(arco === 'u' ? 'Sup.' : 'Inf.'), `${d.id}: ${d.label}`);
    assert.ok(d.label.endsWith(lado === 'r' ? 'Direito' : 'Esquerdo'), `${d.id}: ${d.label}`);
  }
});

test('em cima em cima, direita da bebé à esquerda do ecrã, do centro para o fundo', () => {
  const meio = VISTA.largura / 2;
  for (const d of DENTES) {
    const [arco, , lado] = d.id.split('_');
    assert.ok(arco === 'u' ? d.y < VISTA.altura / 2 : d.y > VISTA.altura / 2, d.id);
    assert.ok(lado === 'r' ? d.x < meio : d.x > meio, d.id);
  }
  for (const arco of ['u', 'l']) for (const lado of ['r', 'l']) {
    const fila = ['ic', 'il', 'c', 'm1', 'm2'].map((p) => DENTES.find((d) => d.id === `${arco}_${p}_${lado}`));
    const afastamento = fila.map((d) => Math.abs(d.x - meio));
    assert.deepEqual(afastamento, [...afastamento].sort((a, b) => a - b), `${arco} ${lado}`);
  }
});

test('os dentes não se atropelam', () => {
  for (const a of DENTES) for (const b of DENTES) {
    if (a.id < b.id) assert.ok(Math.hypot(a.x - b.x, a.y - b.y) > (a.w + b.w) / 2 - 1, `${a.id} / ${b.id}`);
  }
});
