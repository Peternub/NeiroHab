import { useEffect, useRef, useState } from 'react';
import { Activity, ArrowDownToLine, ArrowLeft, ArrowRight, BookOpen, Brain, Check, ChevronRight, CircleHelp, FlaskConical, Fullscreen, Gamepad2, Info, Layers3, Maximize, Microscope, Moon, Pause, Play, RotateCcw, Settings2, ShieldCheck, SkipForward, SlidersHorizontal, Sparkles, Tag, Trophy, X, Zap } from 'lucide-react';
import { BodyModel } from './BodyModel';
import { Chain, ExperimentChart, MetricsPanel } from './components';
import { experiments, lessons, modes, organs, questions, sources, type Mode, type OrganId, type Section } from './data';
import { approach, baseline, controlTarget, experimentMetrics, pointsForAttempt, type Metrics } from './simulation';

type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
const navigation = [
  { id: 'model' as Section, label: 'Модель организма', icon: Brain },
  { id: 'experiments' as Section, label: 'Эксперименты', icon: FlaskConical },
  { id: 'control' as Section, label: 'Управление', icon: SlidersHorizontal },
  { id: 'lesson' as Section, label: 'Режим урока', icon: BookOpen },
  { id: 'game' as Section, label: 'Спаси организм', icon: Gamepad2 },
];
const sectionInfo = {
  model: ['Исследуй организм.', 'Открой невидимое.', 'Выбери систему регуляции и узнай, как органы работают вместе.'],
  experiments: ['Один стимул.', 'Цепочка реакций.', 'Запускай эксперименты и наблюдай за ответом организма по шагам.'],
  control: ['Меняй условия.', 'Наблюдай ответ.', 'Исследуй, как стресс и нагрузка влияют на учебную модель.'],
  lesson: ['Сложная тема.', 'За три минуты.', 'Готовый сценарий для знакомства с регуляцией организма.'],
  game: ['Твои знания.', 'Важное решение.', 'Пять ситуаций. Один организм. Стань оператором лаборатории.'],
};
export default function App() {
  const [section, setSection] = useState<Section>('model');
  const [mode, setMode] = useState<Mode>('neural');
  const [selected, setSelected] = useState<OrganId>('brain');
  const [active, setActive] = useState(false), [labels, setLabels] = useState(true);
  const [reduced, setReduced] = useState(() => localStorage.getItem('neurolab-motion') === 'off' || window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [notice, setNotice] = useState(''), [help, setHelp] = useState(false);
  const [online, setOnline] = useState(navigator.onLine), [offlineReady, setOfflineReady] = useState(false);
  const [install, setInstall] = useState<InstallPrompt | null>(null);
  const [experiment, setExperiment] = useState(0), [progress, setProgress] = useState(0), [slow, setSlow] = useState(false);
  const [intensity, setIntensity] = useState(1), [feedback, setFeedback] = useState(false), [explain, setExplain] = useState(false);
  const [stress, setStress] = useState(0), [load, setLoad] = useState(0), [recovery, setRecovery] = useState(false);
  const [metrics, setMetrics] = useState<Metrics>(baseline), [history, setHistory] = useState<Metrics[]>(Array(20).fill(baseline));
  const [lesson, setLesson] = useState(-1), [lessonTime, setLessonTime] = useState(0), [lessonAuto, setLessonAuto] = useState(true);
  const [level, setLevel] = useState(0), [attempts, setAttempts] = useState(0), [answered, setAnswered] = useState(false), [wrong, setWrong] = useState<number[]>([]);
  const [answers, setAnswers] = useState<{ points: number; attempts: number; mistakes: string[] }[]>([]);
  const currentMetrics = useRef(metrics);
  const ex = experiments[experiment], step = Math.min(5, Math.floor(progress)), organ = organs.find(o => o.id === selected)!;
  const q = questions[Math.min(4, level)];

  useEffect(() => { currentMetrics.current = metrics; }, [metrics]);
  useEffect(() => {
    const timer = window.setInterval(() => setHistory(h => [...h.slice(-39), currentMetrics.current]), 600);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (section !== 'experiments' || !active) return;
    const timer = window.setInterval(() => setProgress(p => Math.min(5, p + (slow ? .018 : .045))), 150);
    return () => clearInterval(timer);
  }, [section, active, slow]);
  useEffect(() => {
    if (section !== 'experiments') return;
    setMetrics(experimentMetrics(ex.id, progress, intensity));
    setSelected(ex.steps[step].organ);
    if (progress >= 5) setActive(false);
  }, [section, experiment, progress, intensity]);
  useEffect(() => {
    if (section !== 'control') return;
    const timer = window.setInterval(() => setMetrics(m => approach(m, controlTarget(stress, load), recovery)), 150);
    setActive(stress > 0 || load > 0 || metrics.pulse > 73);
    return () => clearInterval(timer);
  }, [section, stress, load, recovery, metrics.pulse > 73]);
  useEffect(() => {
    if (section !== 'lesson' || lesson < 0 || lesson > 4 || !active || !lessonAuto) return;
    const timer = window.setInterval(() => setLessonTime(t => t + (slow ? .5 : 1)), 1000);
    return () => clearInterval(timer);
  }, [section, lesson, active, lessonAuto, slow]);
  useEffect(() => {
    if (lesson >= 0 && lesson < 5 && lessonTime >= lessons[lesson].seconds) { setLesson(l => l + 1); setLessonTime(0); }
  }, [lessonTime, lesson]);
  useEffect(() => {
    if (section === 'lesson' && lesson >= 0 && lesson < 5) { setMode(lessons[lesson].mode); setSelected(lessons[lesson].organ); }
    if (lesson === 5) setActive(false);
  }, [lesson, section]);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    const capture = (e: Event) => { e.preventDefault(); setInstall(e as InstallPrompt); };
    const installed = () => { setInstall(null); setNotice('Лаборатория установлена на устройство.'); };
    window.addEventListener('online', update); window.addEventListener('offline', update);
    window.addEventListener('beforeinstallprompt', capture); window.addEventListener('appinstalled', installed);
    if ('serviceWorker' in navigator && import.meta.env.PROD) navigator.serviceWorker.register('./sw.js').then(async registration => {
      await navigator.serviceWorker.ready;
      const check = () => caches.keys().then(keys => setOfflineReady(keys.some(key => key.startsWith('neurolab-'))));
      check(); registration.addEventListener('updatefound', () => registration.installing?.addEventListener('statechange', check));
    }).catch(() => setNotice('Офлайн-кэш недоступен. Лаборатория продолжает работать в браузере.'));
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update); window.removeEventListener('beforeinstallprompt', capture); window.removeEventListener('appinstalled', installed); };
  }, []);
  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(''), 6000); return () => clearTimeout(timer); }, [notice]);
  useEffect(() => {
    if (!help) return;
    const previous = document.activeElement as HTMLElement;
    const trap = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const controls = document.querySelectorAll<HTMLElement>('.modal button, .modal a');
      const first = controls[0], last = controls[controls.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
      if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', trap);
    return () => { document.removeEventListener('keydown', trap); previous?.focus(); };
  }, [help]);
  useEffect(() => { localStorage.setItem('neurolab-motion', reduced ? 'off' : 'on'); }, [reduced]);
  useEffect(() => {
    const keydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setHelp(false);
      if (help || ['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;
      if (section === 'lesson' && lesson >= 0 && e.key === 'ArrowRight') changeLesson(1);
      if (section === 'lesson' && lesson >= 0 && e.key === 'ArrowLeft') changeLesson(-1);
      if (['BUTTON', 'A'].includes((e.target as HTMLElement).tagName)) return;
      if (e.code === 'Space' && ['model', 'experiments', 'lesson'].includes(section)) {
        e.preventDefault();
        if (section === 'experiments') launchExperiment();
        else if (section === 'model' || lesson >= 0 && lesson < 5) setActive(a => !a);
      }
    };
    window.addEventListener('keydown', keydown); return () => window.removeEventListener('keydown', keydown);
  }, [section, lesson, help, progress]);
  async function fullscreen() {
    try { if (!document.fullscreenElement) await document.documentElement.requestFullscreen(); else await document.exitFullscreen(); }
    catch { setNotice('Полноэкранный режим недоступен в этом окне. Откройте сайт в отдельном браузере и нажмите F11.'); }
  }
  function navigate(next: Section) {
    setActive(false); setSection(next); setExplain(false); setMetrics(baseline); setHistory(Array(20).fill(baseline));
    if (next === 'experiments') setMode(ex.mode);
    if (next === 'control') setMode('combined');
    if (next === 'game') { setMode(q.mode); setSelected(q.organ); }
  }
  function reset() {
    setActive(false); setProgress(0); setStress(0); setLoad(0); setMetrics(baseline); setHistory(Array(20).fill(baseline)); setExplain(false);
    if (section === 'model') { setMode('neural'); setSelected('brain'); }
    setNotice('Состояние организма сброшено.');
  }
  function selectExperiment(index: number) { setExperiment(index); setProgress(0); setActive(false); setMode(experiments[index].mode); setIntensity(1); setExplain(false); setHistory(Array(20).fill(baseline)); }
  function launchExperiment() { if (progress >= 5) { setProgress(0); setHistory(Array(20).fill(baseline)); } setActive(a => !a); }
  function changeLesson(delta: number) { setLesson(l => Math.max(0, Math.min(5, l + delta))); setLessonTime(0); }
  function startLesson() { setLesson(0); setLessonTime(0); setActive(true); void fullscreen(); }
  function answer(index: number) {
    if (answered || wrong.includes(index)) return;
    if (index === q.correct) {
      setAnswered(true); setActive(true); setSelected(q.organ);
      setAnswers(a => [...a, { points: pointsForAttempt(attempts), attempts: attempts + 1, mistakes: wrong.map(i => q.options[i]) }]);
    } else { setWrong(w => [...w, index]); setAttempts(a => a + 1); }
  }
  function nextLevel() { setLevel(l => l + 1); setAnswered(false); setWrong([]); setAttempts(0); setActive(false); if (level < 4) { setMode(questions[level + 1].mode); setSelected(questions[level + 1].organ); } }
  function restartGame() { setLevel(0); setAttempts(0); setAnswered(false); setWrong([]); setAnswers([]); setActive(false); setMode(questions[0].mode); setSelected(questions[0].organ); }
  const selectOrgan = (id: OrganId) => { setSelected(id); if (section === 'model' && mode !== 'neural' && organs.find(o => o.id === id)?.hormones) setActive(true); };
  const hormoneSource: OrganId = section === 'experiments' ? experiment === 1 ? 'pancreas' : 'adrenal' : organs.find(o => o.id === selected)?.hormones ? selected : mode === 'combined' ? 'adrenal' : 'pancreas';
  const model = <BodyModel mode={mode} selected={selected} onSelect={selectOrgan} active={active} labels={labels} reduced={reduced} pulse={metrics.pulse} neuralSignal={section !== 'experiments' || step >= 2} hormoneSignal={section !== 'experiments' || step >= (experiment === 1 ? 2 : 3)} source={hormoneSource} alert={section === 'experiments' && experiment === 0 && step === 1} />;
  const explanation = <div className="explanation"><div className="mini-label"><Sparkles size={14} /> ЧТО ПРОИСХОДИТ</div><p>{section === 'experiments' ? ex.steps[step].text : modes[mode].description}</p></div>;

  return <div className={`app ${reduced ? 'reduced-motion' : ''} ${section === 'lesson' && lesson >= 0 ? 'projector' : ''}`}>
    <a className="skip-link" href="#main">Перейти к содержимому</a>
    <header className="topbar"><a href="#" className="brand" onClick={e => { e.preventDefault(); navigate('model'); }} aria-label="НЕЙРОЛАБ — главная"><span className="brand-mark"><Activity size={25} /></span><span>НЕЙРО<span className="cyan">ЛАБ</span><small>ИНТЕРАКТИВНАЯ ЛАБОРАТОРИЯ</small></span></a><nav aria-label="Разделы лаборатории">{navigation.map(({ id, label, icon: Icon }, i) => <button key={id} className={section === id ? 'nav-active' : ''} onClick={() => navigate(id)} aria-current={section === id ? 'page' : undefined}><Icon size={17} /><span>{label}</span><small>0{i + 1}</small></button>)}</nav><div className="header-actions"><span className="class-badge">БИОЛОГИЯ <b>9 КЛАСС</b></span><button className="icon-button" title="Справка и источники" aria-label="Справка и источники" onClick={() => setHelp(true)}><CircleHelp size={19} /></button><button className="icon-button" title="Полноэкранный режим" aria-label="Полноэкранный режим" onClick={fullscreen}><Fullscreen size={19} /></button></div></header>
    <main id="main">
      <div className="page-heading"><div><div className="eyebrow"><span /> ВИРТУАЛЬНАЯ ЛАБОРАТОРИЯ <b>/ {String(navigation.findIndex(n => n.id === section) + 1).padStart(2, '0')}</b></div><h1>{sectionInfo[section][0]} <span>{sectionInfo[section][1]}</span></h1><p>{sectionInfo[section][2]}</p></div><div className="status-badge"><span className="live-dot" /> {active ? 'Симуляция активна' : 'Лаборатория готова'}<small>СИСТЕМА РЕГУЛЯЦИИ ЧЕЛОВЕКА</small></div></div>
      {section !== 'lesson' && section !== 'game' ? <>
        <div className="lab-layout">
          <aside className="left-column">
            {section === 'model' && <><section className="panel mode-panel"><div className="panel-heading"><Layers3 size={17} /><h2>Система регуляции</h2></div><div className="mode-list">{(Object.keys(modes) as Mode[]).map((m, i) => <button key={m} className={`mode-button ${mode === m ? 'selected' : ''}`} style={{ '--mode-color': modes[m].color } as React.CSSProperties} onClick={() => { setMode(m); setActive(false); }} aria-pressed={mode === m}><span className="mode-symbol">{i === 0 ? <Zap size={21} /> : i === 1 ? <span className="molecule">●</span> : <Activity size={21} />}</span><span><b>{modes[m].short}</b><small>{['Импульсы по нервным путям', 'Гормоны в кровотоке', 'Согласованная работа систем'][i]}</small></span>{mode === m && <Check size={15} />}</button>)}</div></section><section className="panel organ-list"><div className="panel-heading"><ScanIcon /><h2>Исследуй органы</h2><span className="count">10</span></div>{organs.map((o, i) => <button key={o.id} className={selected === o.id ? 'selected' : ''} onClick={() => selectOrgan(o.id)}><span className="organ-number">{String(i + 1).padStart(2, '0')}</span>{o.name}<ChevronRight size={13} /></button>)}</section></>}
            {section === 'experiments' && <><section className="panel"><div className="panel-heading"><FlaskConical size={17} /><h2>Выбери эксперимент</h2></div><div className="experiment-list">{experiments.map((item, i) => <button key={item.id} className={experiment === i ? 'selected' : ''} onClick={() => selectExperiment(i)}><span className={`experiment-icon ex-${i}`}>{item.icon}</span><span><b>{item.title}</b><small>{item.subtitle}</small></span></button>)}</div></section><section className="panel settings-panel"><div className="panel-heading"><Settings2 size={16} /><h3>Настройки опыта</h3></div>{experiment === 0 ? <p className="muted">Краткий зрительный раздражитель запускает учебную стрессовую реакцию.</p> : <label className="field-label">{experiment === 1 ? 'Условная порция углеводов' : 'Интенсивность нагрузки'}<select value={intensity} disabled={active} onChange={e => { setIntensity(Number(e.target.value)); setProgress(0); }}>{(experiment === 1 ? ['Небольшая порция', 'Средняя порция', 'Большая порция'] : ['Лёгкая ходьба', 'Бег', 'Интенсивный бег']).map((s, i) => <option value={i + 1} key={s}>{s}</option>)}</select></label>}<label className="toggle-row"><input type="checkbox" checked={slow} onChange={e => setSlow(e.target.checked)} /><span>Замедленный просмотр</span></label>{experiment === 1 && <label className="toggle-row"><input type="checkbox" checked={feedback} onChange={e => setFeedback(e.target.checked)} /><span>Отрицательная обратная связь</span></label>}<button className="text-button" onClick={() => setExplain(!explain)}><CircleHelp size={15} /> Объяснить эксперимент</button></section></>}
            {section === 'control' && <><section className="panel control-panel"><div className="panel-heading"><SlidersHorizontal size={17} /><h2>Внешние условия</h2></div><label className="range-field"><span>Интенсивность стресса <b>{stress}%</b></span><input type="range" min="0" max="100" step="5" value={stress} onChange={e => setStress(Number(e.target.value))} /><small>Нет воздействия <span>Сильное</span></small></label><label className="range-field"><span>Физическая нагрузка <b>{load}%</b></span><input type="range" min="0" max="100" step="5" value={load} onChange={e => setLoad(Number(e.target.value))} /><small>Покой <span>Интенсивная</span></small></label><label className="field-label">Восстановление<select value={recovery ? 'slow' : 'normal'} onChange={e => setRecovery(e.target.value === 'slow')}><option value="normal">Обычное</option><option value="slow">Замедленное</option></select></label><button className="secondary full-width" onClick={() => { setStress(0); setLoad(0); }}>Прекратить воздействие</button><button className="text-button" onClick={() => setExplain(!explain)}><CircleHelp size={15} /> Почему так произошло?</button></section><section className="panel educational-note"><ShieldCheck size={21} /><h3>Исследуй закономерности</h3><p>Ползунки задают интенсивность условных воздействий. Проценты не измеряют реальный стресс. Ответы заданы отдельными учебными состояниями; восстановление происходит постепенно.</p></section></>}
            <div className="small-note"><span className="live-dot" /> Наблюдай. Экспериментируй. Понимай.</div>
          </aside>
          <section className="center-column"><div className="model-toolbar"><span className="system-name" style={{ color: modes[mode].color }}><span style={{ background: modes[mode].color }} />{modes[mode].title}</span><div><button className={`icon-button ${labels ? 'is-on' : ''}`} title="Подписи органов" aria-label="Подписи органов" aria-pressed={labels} onClick={() => setLabels(l => !l)}><Tag size={15} /></button><button className="icon-button" title="Сбросить состояние" aria-label="Сбросить состояние" onClick={reset}><RotateCcw size={15} /></button></div></div>{model}
            <div className="simulation-bar"><div className="legend"><span><i className="cyan-bg" />Нервные пути</span><span><i className="pink-bg" />Гормоны</span></div>{section === 'model' && <button className="primary" onClick={() => setActive(a => !a)}>{active ? <Pause size={15} /> : <Play size={15} />}{active ? 'Пауза' : 'Запустить сигнал'}</button>}{section === 'experiments' && <div className="playback"><button className="primary" onClick={launchExperiment}>{active ? <Pause size={15} /> : <Play size={15} />}{active ? 'Пауза' : progress >= 5 ? 'Повторить' : 'Запустить'}</button><button className="secondary" onClick={() => { setActive(false); setProgress(p => Math.min(5, Math.floor(p) + 1)); }} disabled={progress >= 5} title="Следующий этап"><SkipForward size={15} /><span>По шагам</span></button><button className="icon-button" onClick={() => { setProgress(0); setActive(true); setHistory(Array(20).fill(baseline)); }} title="Повторить эксперимент" aria-label="Повторить эксперимент"><RotateCcw size={16} /></button></div>}{section === 'control' && <span className="control-state"><span className="live-dot" />{stress || load ? 'Ответ на воздействие' : metrics.pulse > 73 ? 'Восстановление' : 'Равновесие'}</span>}</div>
            {section === 'experiments' ? <div className="experiment-progress"><div><span>ЭТАП {step + 1} / 6</span><b>{ex.steps[step].title}</b><span>{Math.round(progress / 5 * 100)}%</span></div><div className="progress-track"><i style={{ width: `${progress / 5 * 100}%` }} /></div></div> : explanation}
          </section>
          <aside className="right-column">{section === 'model' ? <section className="panel organ-card"><div className="panel-heading"><Info size={16} /><h3>В фокусе</h3><span className="tiny-tag">ОРГАН</span></div><div className="organ-card-title"><span className="organ-card-icon">{selected === 'brain' ? <Brain size={30} /> : selected === 'heart' ? <Activity size={30} /> : <Microscope size={30} />}</span><div><h2>{organ.name}</h2><small>{organ.role}</small></div></div><p>{organ.function}</p><details key={organ.id}><summary>Расположение и участие в регуляции</summary><p>{organ.location}</p><p>{organ.regulation}</p>{organ.hormones && <p><b>Гормоны: </b>{organ.hormones}</p>}</details><div className="fact"><Sparkles size={14} /><p>{organ.fact}</p></div></section> : section === 'experiments' ? <section className="panel stage-list"><div className="panel-heading"><Activity size={16} /><h3>Ход эксперимента</h3></div>{ex.steps.map((s, i) => <button key={s.title} className={step === i ? 'current' : step > i ? 'complete' : ''} onClick={() => { setActive(false); setProgress(i); }}><span>{step > i ? <Check size={12} /> : i + 1}</span>{s.title}</button>)}</section> : <section className="panel state-card"><span className="live-dot" /><h3>{stress > 60 || load > 60 ? 'Активная мобилизация' : stress || load ? 'Умеренная активация' : metrics.pulse > 73 ? 'Постепенное восстановление' : 'Спокойное состояние'}</h3><p>{stress || load ? 'Нервные и гормональные механизмы согласуют работу органов с новыми условиями.' : 'После прекращения воздействия активность постепенно снижается. Равновесие поддерживается постоянно.'}</p><span className="tiny-tag">ВОССТАНОВЛЕНИЕ: {recovery ? 'ЗАМЕДЛЕННОЕ' : 'ОБЫЧНОЕ'}</span></section>}<MetricsPanel metrics={metrics} history={history} chocolate={section === 'experiments' && experiment === 1} /></aside>
        </div>
        {section === 'experiments' && <section className="process-description">{explanation}<ExperimentChart history={history} chocolate={experiment === 1} />{(explain || feedback && experiment === 1) && <div className="panel expanded-explanation"><h3>{feedback && experiment === 1 ? 'Как работает отрицательная обратная связь' : 'Причина и результат'}</h3><Chain items={experiment === 1 ? lessons[4].chain : experiment === 0 ? ['Раздражитель', 'Нервные центры', 'Симпатические влияния', 'Надпочечники и сердце', 'Восстановление'] : ['Работа мышц', 'Нервные центры', 'Сердце и дыхание ↑', 'Доставка ресурсов', 'Восстановление']} /><p>{ex.steps[5].text}</p></div>}</section>}
        {section === 'control' && explain && <section className="panel expanded-explanation"><h3>Цепочка регуляции</h3><Chain items={load > stress ? ['Нагрузка ↑', 'Сигналы от центров и мышц', 'Вегетативные влияния', 'Пульс и дыхание ↑', 'Кровоснабжение мышц ↑'] : ['Стрессовый раздражитель', 'Нервные центры', 'Симпатическая активация', 'Нервные и гормональные влияния', 'Мобилизация']} /><p>После прекращения воздействия сигналы ослабевают. При замедленном восстановлении возвращение к исходным значениям занимает больше условного времени. Проценты и числа иллюстрируют направление изменений.</p></section>}
        {section === 'model' && <section className="discovery"><div className="discovery-heading"><div><span className="eyebrow">ОТ ТЕОРИИ К ПРАКТИКЕ</span><h2>Что, если?.. <span>Проверь в эксперименте</span></h2></div><button className="text-button" onClick={() => navigate('experiments')}>Все эксперименты <ArrowRight size={16} /></button></div><div className="discovery-grid">{experiments.map((item, i) => <button key={item.id} className="discovery-card" onClick={() => { navigate('experiments'); selectExperiment(i); }}><span className={`experiment-icon ex-${i}`}>{item.icon}</span><span><small>ЭКСПЕРИМЕНТ 0{i + 1}</small><h3>{item.title}</h3><p>{item.subtitle}</p></span><ArrowRight size={19} /></button>)}</div></section>}
      </> : section === 'lesson' ? <section className="lesson-layout"><div className="lesson-content panel">{lesson === -1 ? <><span className="big-symbol"><BookOpen size={44} /></span><div className="eyebrow">ГОТОВЫЙ СЦЕНАРИЙ · 5 ШАГОВ · 180 СЕКУНД</div><h2>Как организм<br /><span className="cyan">управляет собой?</span></h2><p className="large-copy">Нервный импульс, гормоны и обратная связь — на одной живой схеме. Крупные подписи и автоматические переходы для показа всему классу.</p><button className="primary large" onClick={startLesson}><Play size={19} /> Начать урок <Maximize size={17} /></button><ol className="lesson-outline">{lessons.map((l, i) => <li key={l.title}><button onClick={() => { setLesson(i); setLessonTime(0); setActive(true); }}>{l.title}<span>{l.seconds} сек</span></button></li>)}</ol></> : lesson < 5 ? <><div className="eyebrow">ШАГ 0{lesson + 1} / 05 <span className="lesson-time">{Math.floor(lessonTime)} / {lessons[lesson].seconds} сек</span></div><h2>{lessons[lesson].title}</h2><p className="large-copy">{lessons[lesson].text}</p><Chain items={lessons[lesson].chain} /><div className="progress-track"><i style={{ width: `${lessonTime / lessons[lesson].seconds * 100}%` }} /></div><div className="lesson-controls"><button className="secondary" disabled={lesson === 0} onClick={() => changeLesson(-1)} aria-label="Предыдущий шаг"><ArrowLeft size={18} /></button><button className="primary" onClick={() => setActive(a => !a)}>{active ? <Pause size={17} /> : <Play size={17} />}{active ? 'Пауза' : 'Продолжить'}</button><button className="secondary" onClick={() => { setLessonTime(0); setActive(true); }} aria-label="Повторить шаг"><RotateCcw size={17} /></button><button className="secondary" onClick={() => changeLesson(1)}>Далее <ArrowRight size={17} /></button></div><label className="toggle-row"><input type="checkbox" checked={lessonAuto} onChange={e => setLessonAuto(e.target.checked)} />Автоматические переходы</label><label className="toggle-row"><input type="checkbox" checked={slow} onChange={e => setSlow(e.target.checked)} />Замедленный просмотр</label></> : <><span className="eyebrow">УРОК ЗАВЕРШЁН</span><h2>Два механизма.<br /><span className="cyan">Общая задача.</span></h2><div className="comparison-scroll"><table><thead><tr><th>Признак</th><th>Нервная</th><th>Гуморальная</th></tr></thead><tbody>{[['Передача', 'По нервным путям', 'Через жидкие среды'], ['Сигнал', 'Импульсы, медиаторы', 'Гормоны и другие вещества'], ['Скорость', 'Обычно высокая', 'Часто медленнее'], ['Адресность', 'Высокая', 'Зависит от рецепторов'], ['Длительность', 'Часто кратковременная', 'Часто более длительная']].map(row => <tr key={row[0]}>{row.map(cell => <td key={cell}>{cell}</td>)}</tr>)}</tbody></table></div><p className="lesson-thesis">Нейрогуморальная регуляция — согласованная работа нервных и гуморальных механизмов, обеспечивающая управление функциями организма.</p><button className="primary" onClick={() => { setLesson(0); setLessonTime(0); setActive(true); }}><RotateCcw size={17} /> Повторить урок</button><button className="text-button" onClick={() => navigate('game')}>Закрепить в игре <ArrowRight size={16} /></button></>}</div><div className="lesson-visual">{model}<div className="lesson-visual-note"><span className="live-dot" /> {modes[mode].title}</div></div></section> : <section className="game-layout"><div className="game-visual">{model}<div className="game-visual-note"><ShieldCheck size={21} /><span>{answered ? 'Верное решение. Организм справляется.' : level >= 5 ? 'Все системы под контролем.' : 'Организм ждёт твоего решения.'}</span></div></div><div className="panel game-content">{level < 5 ? <><div className="game-topline"><span className="eyebrow">УРОВЕНЬ 0{level + 1} / 05</span><span className="score"><Trophy size={17} />{answers.reduce((s, a) => s + a.points, 0)} баллов</span></div><div className="level-dots">{questions.map((_, i) => <i key={i} className={i < level ? 'done' : i === level ? 'now' : ''} />)}</div><h2>{q.title}</h2><p className="game-scene">{q.scene}</p><h3>{q.question}</h3><div className="answer-options">{q.options.map((option, i) => <button key={option} disabled={answered || wrong.includes(i)} className={answered && i === q.correct ? 'correct' : wrong.includes(i) ? 'wrong' : ''} onClick={() => answer(i)}><span>{['А', 'Б', 'В', 'Г'][i]}</span>{option}{answered && i === q.correct && <Check size={18} />}</button>)}</div>{answered ? <div className="answer-feedback success" role="status"><h3><Check size={17} /> Верно! +{pointsForAttempt(attempts)} баллов</h3><p>{q.explanation}</p><button className="primary" onClick={nextLevel}>{level === 4 ? 'Посмотреть результат' : 'Следующий уровень'}<ArrowRight size={16} /></button></div> : wrong.length > 0 ? <div className="answer-feedback" role="status"><h3>Попробуй ещё раз</h3><p>{['Вспомни рефлекторную дугу: рецептор → нервные пути → мышца.', 'Ищи гормон β-клеток поджелудочной железы, который помогает запасать глюкозу.', 'Вспомни согласованную работу нервной системы и мозгового вещества надпочечников.', 'Работающим мышцам нужно больше кислорода и питательных веществ.', 'Отрицательная обратная связь уменьшает исходное изменение.'][level]}</p><small>За следующую верную попытку: {pointsForAttempt(attempts)} баллов</small></div> : <p className="game-hint"><Info size={14} />С первой попытки — 100 баллов, со второй — 50.</p>}</> : <><span className="big-symbol"><Trophy size={44} /></span><span className="eyebrow">МИССИЯ ЗАВЕРШЕНА</span><h2>Организм спасён!</h2><div className="final-score">{answers.reduce((s, a) => s + a.points, 0)}<span>/ 500 баллов</span></div><p>Решено: 5 из 5. С первой попытки: {answers.filter(a => a.attempts === 1).length} из 5.</p><div className="game-review">{answers.map((a, i) => <details key={i}><summary>{a.points === 100 ? <Check size={15} /> : <Info size={15} />}{questions[i].title}<b>{a.points} баллов</b></summary>{a.mistakes.length > 0 && <p>Ошибочные варианты: {a.mistakes.join('; ')}.</p>}<p>{questions[i].explanation}</p></details>)}</div><button className="primary" onClick={restartGame}><RotateCcw size={17} /> Повторить игру</button></>}</div></section>}
      <footer><span><span className="footer-brand">НЕЙРОЛАБ</span> Невидимые процессы. Понятные связи.</span><div><button onClick={() => setReduced(r => !r)} aria-pressed={reduced}><Moon size={13} />{reduced ? 'Анимации выключены' : 'Анимации включены'}</button><button onClick={() => setHelp(true)}><Info size={13} />О проекте и источники</button><span className="connection"><span className="live-dot" />{!online ? 'Офлайн' : offlineReady ? 'Готов к работе офлайн' : 'Без регистрации'}</span></div></footer>
    </main>
    {notice && <div className="toast" role="status">{notice}<button aria-label="Закрыть уведомление" onClick={() => setNotice('')}><X size={16} /></button></div>}
    {help && <div className="modal-backdrop" onClick={() => setHelp(false)}><section className="modal panel" role="dialog" aria-modal="true" aria-labelledby="help-title" onClick={e => e.stopPropagation()}><button autoFocus className="icon-button modal-close" onClick={() => setHelp(false)} aria-label="Закрыть справку"><X size={20} /></button><span className="eyebrow">БИОЛОГИЯ · 9 КЛАСС</span><h2 id="help-title">Лаборатория, в которой<br />можно увидеть связи.</h2><p>НЕЙРОЛАБ — учебная модель нервной, гуморальной и нейрогуморальной регуляции. Все числа и временные масштабы иллюстрационные. Схемы органов условны; симулятор не предназначен для оценки здоровья.</p><h3>Управление</h3><p>Выбирайте органы на схеме или в списке. Кнопки + / − меняют масштаб, перетаскивание перемещает модель. Пробел — запуск и пауза; стрелки ← → переключают шаги урока. Tab перемещает фокус, Enter активирует кнопку.</p><h3>Работа без интернета</h3><p>{offlineReady ? 'Ресурсы сохранены. Можно отключить интернет и перезагрузить страницу.' : 'Офлайн-доступ работает в собранной версии через локальный сервер или HTTPS. После первой полной загрузки ресурсы сохраняются автоматически.'} Для отдельного окна используйте установку приложения в меню браузера.</p>{install && <button className="secondary" onClick={async () => { await install.prompt(); await install.userChoice; setInstall(null); }}><ArrowDownToLine size={16} /> Установить НЕЙРОЛАБ</button>}<h3>Учебные источники</h3><p>Объяснения сопоставлены с открытыми учебниками OpenStax. Материал адаптирован для 9 класса; не является официальной экспертизой конкретного школьного учебника.</p><ul className="source-list">{sources.map(s => <li key={s.url}><a href={s.url} target="_blank" rel="noreferrer">{s.name} ↗</a></li>)}</ul><button className="primary" onClick={() => setHelp(false)}>Вернуться в лабораторию</button></section></div>}
  </div>;
}
function ScanIcon() { return <Microscope size={17} />; }
