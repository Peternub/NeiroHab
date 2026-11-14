import { test } from 'node:test';
import assert from 'node:assert/strict';
import { approach, baseline, controlTarget, experimentMetrics, pointsForAttempt } from '../src/simulation.ts';
import { experiments, lessons, organs, questions, glucoseFeedbackChain } from '../src/data.ts';

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
test('Семь этапов урока укладываются в 5–7 минут, все ссылки на органы корректны', () => {
  assert.equal(lessons.length, 7);
  const duration = lessons.reduce((sum, l) => sum + l.seconds, 0);
  assert.ok(duration >= 300 && duration <= 420);
  assert.equal(duration, 360);
  assert.equal(organs.length, 10);
  for (const entry of [...lessons, ...questions, ...experiments.flatMap(e => e.steps)]) assert.ok(organs.some(o => o.id === entry.organ));
});

test('Игра закрепляет пять вопросов урока, подсказки и ссылки ведут к соответствующим темам', () => {
  assert.equal(lessons.flatMap(step => step.review ?? []).length, questions.length);
  for (const question of questions) {
    assert.ok(question.lessonIndex >= 0 && question.lessonIndex < lessons.length);
    assert.ok(question.hint.length > 0 && question.explanation.length > 0);
    assert.equal(question.options.length, new Set(question.options).size);
  }
  assert.match(questions[0].options[questions[0].correct], /Совместное управление/);
  assert.match(questions[1].options[questions[1].correct], /Нервная/);
  assert.match(questions[2].options[questions[2].correct], /рецепторами/);
  assert.equal(questions[3].options[questions[3].correct], 'Адреналин');
  assert.match(questions[4].options[questions[4].correct], /гомеостаз/);
});

test('Гормоны урока связаны с нужными железами; опыт с глюкозой сохраняет собственную цепочку', () => {
  const hormones = lessons.flatMap(step => step.hormones ?? []);
  assert.deepEqual(hormones.map(h => [h.name, h.organ]), [
    ['Адреналин', 'adrenal'], ['Инсулин', 'pancreas'], ['Гормон роста', 'pituitary'], ['Тироксин', 'thyroid'],
  ]);
  assert.deepEqual(glucoseFeedbackChain, ['Глюкоза ↑', 'Инсулин ↑', 'Поглощение и запасание', 'Глюкоза ↓', 'Стимул к секреции ↓']);
});
