import type { OrganId } from './data';
import type { LessonStep } from './lesson';

export function RegulationComparison() {
  return <div className="comparison-scroll"><table>
    <caption className="visually-hidden">Сравнение нервной и гуморальной регуляции</caption>
    <thead><tr><th scope="col">Признак</th><th scope="col">Нервная</th><th scope="col">Гуморальная</th></tr></thead>
    <tbody>{[
      ['Передача', 'По нервным путям', 'Через жидкие среды'],
      ['Сигнал', 'Импульсы, медиаторы', 'Гормоны и другие вещества'],
      ['Скорость', 'Обычно высокая', 'Часто медленнее'],
      ['Адресность', 'Высокая', 'Зависит от рецепторов'],
      ['Длительность', 'Часто кратковременная', 'Часто более длительная'],
    ].map(([feature, neural, humoral]) => <tr key={feature}><th scope="row">{feature}</th><td>{neural}</td><td>{humoral}</td></tr>)}</tbody>
  </table></div>;
}

export function LessonContent({ step, selected, onSelect, onDiscuss }: {
  step: LessonStep; selected: OrganId; onSelect: (organ: OrganId) => void; onDiscuss: () => void;
}) {
  return <>
    {step.points && <ul className="lesson-points">{step.points.map(point => <li key={point}>{point}</li>)}</ul>}
    {step.hormones && <div className="lesson-hormones" aria-label="Гормоны и их действие">{step.hormones.map(hormone => <button key={hormone.name} className="lesson-hormone" aria-pressed={selected === hormone.organ} onClick={() => onSelect(hormone.organ)}>
      <strong>{hormone.name}</strong><small>{hormone.gland}</small><span>{hormone.action}</span>
    </button>)}</div>}
    {step.comparison && <RegulationComparison />}
    {step.review && <ol className="lesson-review">{step.review.map(item => <li key={item.question}><details onToggle={event => { if (event.currentTarget.open) onDiscuss(); }}><summary>{item.question}</summary><p>{item.answer}</p></details></li>)}</ol>}
  </>;
}
