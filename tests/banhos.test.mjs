import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tempoDesdeBanho } from '../src/services/banhos.js';

const agora = new Date('2026-11-25T18:00:00');

test('minutos e horas no mesmo dia', () => {
  assert.deepEqual(tempoDesdeBanho('2026-11-25', '17:35', agora), { text: '25 min', isUrgent: false });
  assert.deepEqual(tempoDesdeBanho('2026-11-25', '15:00', agora), { text: '3h', isUrgent: false });
  assert.deepEqual(tempoDesdeBanho('2026-11-25', '14:50', agora), { text: '3h 10min', isUrgent: false });
});

test('a partir de 24 h conta em dias', () => {
  assert.deepEqual(tempoDesdeBanho('2026-11-24', '18:00', agora), { text: '1 dia', isUrgent: false });
  assert.deepEqual(tempoDesdeBanho('2026-11-23', '18:01', agora), { text: '1 dia', isUrgent: false });
});

test('vermelho a partir de 2 dias', () => {
  assert.deepEqual(tempoDesdeBanho('2026-11-23', '18:00', agora), { text: '2 dias', isUrgent: true });
  assert.deepEqual(tempoDesdeBanho('2026-11-20', '10:00', agora), { text: '5 dias', isUrgent: true });
});

test('hora no futuro de hoje conta como ontem', () => {
  assert.deepEqual(tempoDesdeBanho('2026-11-25', '21:00', agora), { text: '21h', isUrgent: false });
});

test('sem dados ou inválidos devolve null', () => {
  assert.equal(tempoDesdeBanho('', '10:00', agora), null);
  assert.equal(tempoDesdeBanho('2026-11-25', '', agora), null);
  assert.equal(tempoDesdeBanho('abc', 'xx', agora), null);
});
