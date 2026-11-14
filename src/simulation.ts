export interface Metrics { pulse: number; breath: number; sympathetic: number; hormone: number; glucose: number }
export const baseline: Metrics = { pulse: 72, breath: 16, sympathetic: 12, hormone: 10, glucose: 100 };
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
// Это опорные учебные состояния, а не формулы измерения стресса или клинический прогноз.
const stressStates: Metrics[] = [baseline, { pulse: 86, breath: 20, sympathetic: 42, hormone: 35, glucose: 100 }, { pulse: 106, breath: 25, sympathetic: 78, hormone: 72, glucose: 100 }];
const loadStates: Metrics[] = [baseline, { pulse: 94, breath: 22, sympathetic: 38, hormone: 24, glucose: 100 }, { pulse: 132, breath: 32, sympathetic: 72, hormone: 58, glucose: 100 }];
function interpolate(states: Metrics[], value: number): Metrics {
  const t = Math.max(0, Math.min(100, value)) / 50;
  const a = states[Math.min(1, Math.floor(t))];
  const b = states[Math.min(2, Math.floor(t) + 1)];
  const fraction = t === 2 ? 1 : t % 1;
  return Object.fromEntries(Object.keys(a).map(k => [k, lerp(a[k as keyof Metrics], b[k as keyof Metrics], fraction)])) as unknown as Metrics;
}
export function controlTarget(stress: number, load: number): Metrics {
  const s = interpolate(stressStates, stress), l = interpolate(loadStates, load);
  // При сочетании воздействий выбирается более выраженный ответ, без суммирования до нереальных величин.
  return { pulse: Math.max(s.pulse, l.pulse), breath: Math.max(s.breath, l.breath), sympathetic: Math.max(s.sympathetic, l.sympathetic), hormone: Math.max(s.hormone, l.hormone), glucose: 100 };
}
export function approach(current: Metrics, target: Metrics, slow: boolean): Metrics {
  return Object.fromEntries(Object.keys(current).map(key => {
    const k = key as keyof Metrics;
    const rate = target[k] >= current[k] ? .16 : slow ? .025 : .09;
    const next = lerp(current[k], target[k], rate);
    return [k, Math.abs(next - target[k]) < .15 ? target[k] : next];
  })) as unknown as Metrics;
}
export function experimentMetrics(id: string, progress: number, intensity: number): Metrics {
  const t = Math.max(0, Math.min(5, progress));
  const profile = [0, .2, .65, 1, .8, 0];
  const i = Math.min(4, Math.floor(t)), f = t - i;
  const activation = lerp(profile[i], profile[i + 1], f);
  if (id === 'chocolate') {
    const glucose = [100, 100 + intensity * 32, 100 + intensity * 48, 100 + intensity * 30, 100 + intensity * 10, 100];
    return { ...baseline, glucose: lerp(glucose[i], glucose[i + 1], f), hormone: 10 + 65 * activation };
  }
  const target = id === 'exercise' ? controlTarget(0, intensity * 33.333) : controlTarget(90, 0);
  const hormoneProfile = [0, 0, 0, .7, 1, 0];
  const hormoneActivation = lerp(hormoneProfile[i], hormoneProfile[i + 1], f);
  return Object.fromEntries(Object.keys(baseline).map(k => [k, lerp(baseline[k as keyof Metrics], target[k as keyof Metrics], k === 'hormone' ? hormoneActivation : activation)])) as unknown as Metrics;
}
export function pointsForAttempt(attempt: number) { return attempt === 0 ? 100 : attempt === 1 ? 50 : 0; }
