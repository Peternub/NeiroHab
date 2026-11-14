import { test } from 'node:test';
import assert from 'node:assert/strict';
import { approach, baseline, controlTarget, experimentMetrics, pointsForAttempt } from '../src/simulation.ts';
import { experiments, lessons, organs, questions } from '../src/data.ts';

test('Покой совпадает с исходным состоянием; увеличение воздействия усиливает ответ', () => {
  assert.deepEqual(controlTarget(0, 0), baseline);
  for (let value = 5; value <= 100; value += 5) {
    for (const key of ['pulse', 'breath', 'sympathetic', 'hormone'] as const) {
      assert.ok(controlTarget(value, 0)[key] >= controlTarget(value - 5, 0)[key]);
      assert.ok(controlTarget(0, value)[key] >= controlTarget(0, value - 5)[key]);
    }
  }
});
test('Сочетание воздействий ограничено опорными учебными состояниями', () => {
  const m = controlTarget(100, 100);
  assert.equal(m.pulse, 132);
  assert.equal(m.breath, 32);
  assert.ok(m.sympathetic <= 100 && m.hormone <= 100);
});
test('Восстановление постепенно, замедленный режим занимает больше времени', () => {
  const start = controlTarget(100, 100);
  const normal = approach(start, baseline, false), slow = approach(start, baseline, true);
  assert.ok(normal.pulse < slow.pulse && normal.pulse > baseline.pulse);
  let current = start;
  for (let i = 0; i < 600; i++) current = approach(current, baseline, true);
  assert.deepEqual(current, baseline);
});
test('Каждый эксперимент начинается и заканчивается в исходном состоянии', () => {
  for (const ex of experiments) for (const intensity of [1, 2, 3]) {
    assert.deepEqual(experimentMetrics(ex.id, 0, intensity), baseline);
    assert.deepEqual(experimentMetrics(ex.id, 5, intensity), baseline);
    for (let t = 0; t <= 5; t += .1) assert.ok(Object.values(experimentMetrics(ex.id, t, intensity)).every(Number.isFinite));
  }
});
test('Глюкоза возрастает, затем снижается; инсулиновый сигнал следует за стимулом', () => {
  assert.ok(experimentMetrics('chocolate', 1, 1).glucose > baseline.glucose);
  assert.ok(experimentMetrics('chocolate', 3, 1).hormone > experimentMetrics('chocolate', 1, 1).hormone);
  assert.ok(experimentMetrics('chocolate', 4, 1).glucose < experimentMetrics('chocolate', 2, 1).glucose);
  assert.ok(experimentMetrics('chocolate', 2, 3).glucose > experimentMetrics('chocolate', 2, 1).glucose);
});
test('Пять заданий; максимум 500; очки за повторные попытки не растут', () => {
  assert.equal(questions.length, 5);
  assert.equal(questions.reduce(s => s + pointsForAttempt(0), 0), 500);
  assert.deepEqual([0, 1, 2, 3].map(pointsForAttempt), [100, 50, 0, 0]);
  for (const q of questions) assert.ok(q.correct >= 0 && q.correct < q.options.length);
});
test('Сценарий урока длится 180 секунд, все ссылки на органы корректны', () => {
  assert.equal(lessons.reduce((sum, l) => sum + l.seconds, 0), 180);
  assert.equal(organs.length, 10);
  for (const entry of [...lessons, ...questions, ...experiments.flatMap(e => e.steps)]) assert.ok(organs.some(o => o.id === entry.organ));
});
