import { Activity, Heart, Wind, Zap, Droplets, TrendingUp } from 'lucide-react';
import type { Metrics } from './simulation';
export function Sparkline({ values, color = '#00d5ff', label = 'История показателя', min, max }: { values: number[]; color?: string; label?: string; min?: number; max?: number }) {
  const lo = min ?? Math.min(...values) - 5, hi = max ?? Math.max(...values) + 5;
  const points = values.map((v, i) => `${i / Math.max(1, values.length - 1) * 300},${65 - (v - lo) / Math.max(1, hi - lo) * 55}`).join(' ');
  return <svg className="sparkline" viewBox="0 0 300 75" role="img" aria-label={label} preserveAspectRatio="none"><path d="M0 20H300M0 45H300M0 70H300" stroke="#203142" strokeDasharray="3 5" fill="none" /><polygon points={`0,75 ${points} 300,75`} fill={color} opacity=".06" /><polyline points={points} stroke={color} fill="none" strokeWidth="2" vectorEffect="non-scaling-stroke" /></svg>;
}
export function MetricsPanel({ metrics, history, chocolate = false }: { metrics: Metrics; history: Metrics[]; chocolate?: boolean }) {
  const items = [
    { icon: Heart, name: 'Пульс', key: 'pulse' as const, unit: 'уд/мин', color: '#ff6e8c', range: [50, 150] },
    { icon: Wind, name: 'Дыхание', key: 'breath' as const, unit: 'вдох/мин', color: '#00d5ff', range: [10, 40] },
    { icon: Zap, name: 'Симпатическая активность', key: 'sympathetic' as const, unit: 'усл. ед.', color: '#ad91ff', range: [0, 100] },
    { icon: chocolate ? TrendingUp : Droplets, name: chocolate ? 'Глюкоза' : 'Гормональный сигнал', key: chocolate ? 'glucose' as const : 'hormone' as const, unit: chocolate ? '% от исходного' : 'усл. ед.', color: '#38e6b0', range: chocolate ? [80, 250] : [0, 100] },
  ];
  return <section className="panel metrics-panel"><div className="panel-heading"><Activity size={16} /><h3>Показатели организма</h3><span className="live-dot" /></div>{items.map(({ icon: Icon, name, key, unit, color, range }) => <div className="metric" key={key} style={{ '--metric-color': color } as React.CSSProperties}><div className="metric-label"><Icon size={15} /><span>{name}</span></div><div className="metric-row"><strong>{Math.round(metrics[key])}</strong><span>{unit}</span><Sparkline values={history.map(h => h[key])} min={range[0]} max={range[1]} label={`${name}: ${Math.round(metrics[key])} ${unit}`} color={color} /></div></div>)}<p className="metric-disclaimer">Условные учебные значения.<br />Не измерения и не медицинский прогноз.</p></section>;
}
export function Chain({ items }: { items: string[] }) { return <div className="chain">{items.map((item, i) => <div className="chain-piece" key={i}><span>{item}</span>{i < items.length - 1 && <b>→</b>}</div>)}</div>; }
export function ExperimentChart({ history, chocolate }: { history: Metrics[]; chocolate: boolean }) {
  const current = history[history.length - 1];
  return <section className="panel experiment-chart"><div className="panel-heading"><TrendingUp size={17} /><h3>Динамика эксперимента</h3><span className="tiny-tag">УСЛОВНОЕ ВРЕМЯ →</span></div><div className="chart-grid"><div><div className="chart-title"><span style={{ color: chocolate ? '#38e6b0' : '#00d5ff' }}>{chocolate ? 'Глюкоза' : 'Пульс'}</span><b>{Math.round(chocolate ? current.glucose : current.pulse)} <small>{chocolate ? '% от исходного' : 'уд/мин'}</small></b></div><Sparkline values={history.map(m => chocolate ? m.glucose : m.pulse)} color={chocolate ? '#38e6b0' : '#00d5ff'} min={chocolate ? 80 : 60} max={chocolate ? 250 : 150} label={chocolate ? 'Изменение глюкозы за последние 24 условные секунды' : 'Изменение пульса за последние 24 условные секунды'} /></div><div><div className="chart-title"><span style={{ color: '#ff7791' }}>{chocolate ? 'Инсулиновый сигнал' : 'Гормональный сигнал'}</span><b>{Math.round(current.hormone)} <small>усл. ед.</small></b></div><Sparkline values={history.map(m => m.hormone)} color="#ff7791" min={0} max={100} label="Изменение гормонального сигнала за последние 24 условные секунды" /></div></div><p>Последние 24 секунды демонстрации. Физиологическое время сжато; вертикальные шкалы графиков различаются.</p></section>;
}
