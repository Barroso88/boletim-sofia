import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

const guardado = new Map();
globalThis.localStorage = {
  getItem: (k) => (guardado.has(k) ? guardado.get(k) : null),
  setItem: (k, v) => guardado.set(k, String(v)),
  removeItem: (k) => guardado.delete(k),
};

const { getQuem, setQuem, comAutor } = await import('../src/services/quem.js');

beforeEach(() => guardado.clear());

test('sem telemóvel definido, o registo novo fica sem nome', () => {
  assert.equal(getQuem(), null);
  assert.deepEqual(comAutor({ id: 1 }, []), { id: 1 });
});

test('registo novo leva o nome do telemóvel', () => {
  setQuem('Mãe');
  assert.deepEqual(comAutor({ id: 1 }, []), { id: 1, quem: 'Mãe' });
});

test('editar mantém o autor original, mesmo noutro telemóvel', () => {
  setQuem('Pai');
  // os ids vindos da base de dados chegam como texto
  assert.deepEqual(comAutor({ id: 1, hora: '10:00' }, [{ id: '1', quem: 'Mãe' }]), { id: 1, hora: '10:00', quem: 'Mãe' });
});

test('editar um registo antigo sem nome não lhe dá um', () => {
  setQuem('Pai');
  assert.deepEqual(comAutor({ id: 1 }, [{ id: 1, quem: null }]), { id: 1 });
});

test('só aceita Pai ou Mãe; "ninguém" apaga a escolha', () => {
  setQuem('Mãe');
  setQuem(null);
  assert.equal(getQuem(), null);
  guardado.set('sofia_quem', 'Outro');
  assert.equal(getQuem(), null);
});
