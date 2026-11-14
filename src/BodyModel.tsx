import { useEffect, useRef, useState } from 'react';
import { Minus, Plus, RotateCcw, ScanLine } from 'lucide-react';
import { organs, type Mode, type OrganId } from './data';

interface Props { mode: Mode; selected: OrganId; onSelect: (id: OrganId) => void; active: boolean; labels: boolean; reduced: boolean; pulse: number; alert?: boolean; neuralSignal?: boolean; hormoneSignal?: boolean; source?: OrganId }
const nervePaths = [
  'M300 88 L300 353',
  'M300 159 Q255 150 232 183 L213 250 L185 322 L171 377',
  'M300 159 Q345 150 368 183 L387 250 L415 322 L429 377',
  'M300 190 L260 210 L248 253 M260 210 L233 228 M250 244 L225 260',
  'M300 190 L340 210 L352 253 M340 210 L367 228 M350 244 L375 260',
  'M300 238 L269 259 L259 293 M300 238 L332 259 L342 295',
  'M300 277 L275 302 L265 335 M300 277 L325 302 L335 335',
  'M300 330 L275 375 L266 439 L251 516 L246 609 L237 653',
  'M300 330 L325 375 L334 439 L349 516 L354 609 L363 653',
  'M266 439 L248 463 L242 501 M334 439 L352 463 L358 501',
  'M185 322 L177 344 L160 370 M185 322 L193 346 L185 375',
  'M415 322 L423 344 L440 370 M415 322 L407 346 L415 375',
  'M300 172 Q318 180 325 213',
];
const bloodPaths = ['M324 213 Q347 239 330 287 L317 342 Q316 385 333 421 L351 584', 'M322 217 Q283 235 280 294 L287 348 Q287 381 267 421 L249 585', 'M322 214 L318 151 Q321 115 307 96', 'M325 218 Q361 191 369 226 L399 306 L420 359', 'M318 219 Q252 185 233 225 L201 307 L180 360'];
export function BodyModel({ mode, selected, onSelect, active, labels, reduced, pulse, alert, neuralSignal = true, hormoneSignal = true, source = 'pancreas' }: Props) {
  const [zoom, setZoom] = useState(1), [pan, setPan] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const svg = useRef<SVGSVGElement>(null);
  useEffect(() => {
    if (!svg.current) return;
    if (active && !reduced) svg.current.unpauseAnimations(); else svg.current.pauseAnimations();
  }, [active, reduced]);
  const neural = mode !== 'humoral', humoral = mode !== 'neural';
  const point = organs.find(o => o.id === selected)!;
  const emitter = organs.find(o => o.id === source)!;
  const hormonePaths = [
    `M${emitter.x} ${emitter.y} Q321 ${emitter.y + 10} 327 248 Q337 227 325 213 Q284 228 280 294 L287 348 Q287 381 267 421 L249 585`,
    `M${emitter.x} ${emitter.y} Q321 ${emitter.y + 10} 327 248 Q337 227 325 213 Q347 239 330 287 L317 342 Q316 385 333 421 L351 584`,
  ];
  return <div className={`body-stage ${active ? 'is-active' : ''} ${reduced ? 'still' : ''} ${alert ? 'alert' : ''}`} style={{ '--beat': `${60 / pulse}s` } as React.CSSProperties}>
    <div className="stage-corner top-left" /><div className="stage-corner top-right" /><div className="stage-corner bottom-left" /><div className="stage-corner bottom-right" />
    <div className="stage-caption"><span className="live-dot" /> МОДЕЛЬ ОРГАНИЗМА <span className="muted">/ ВИД СПЕРЕДИ</span></div>
    <div className="stage-axis axis-x" /><div className="stage-axis axis-y" />
    <svg ref={svg} className="anatomy" viewBox="0 0 600 700" role="img" aria-label="Интерактивная схема органов человека. Органы также доступны в списке слева."
      onPointerDown={e => { if ((e.target as Element).closest('[data-organ]')) return; drag.current = { x: e.clientX, y: e.clientY, ox: pan.x, oy: pan.y }; e.currentTarget.setPointerCapture(e.pointerId); }}
      onPointerMove={e => { if (drag.current) setPan({ x: Math.max(-140, Math.min(140, drag.current.ox + (e.clientX - drag.current.x) * .7)), y: Math.max(-160, Math.min(160, drag.current.oy + (e.clientY - drag.current.y) * .7)) }); }}
      onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}>
      <defs>
        <linearGradient id="body-fill" x1="0" x2="1"><stop stopColor="#13374b" stopOpacity=".2" /><stop offset=".45" stopColor="#17435a" stopOpacity=".32" /><stop offset="1" stopColor="#0b2133" stopOpacity=".1" /></linearGradient>
        <radialGradient id="aura"><stop stopColor="#00d5ff" stopOpacity=".12" /><stop offset="1" stopColor="#00d5ff" stopOpacity="0" /></radialGradient>
        <filter id="glow"><feGaussianBlur stdDeviation="3" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        <linearGradient id="brain-fill"><stop stopColor="#087b96" /><stop offset="1" stopColor="#0b344f" /></linearGradient>
      </defs>
      <ellipse cx="300" cy="325" rx="220" ry="305" fill="url(#aura)" />
      <g transform={`translate(${pan.x} ${pan.y}) translate(300 350) scale(${zoom}) translate(-300 -350)`}>
        <ellipse cx="300" cy="672" rx="110" ry="13" fill="none" stroke="#1b4e60" strokeDasharray="3 8" />
        <path d="M279 112 Q268 103 267 83 Q256 77 266 66 L268 48 Q269 22 300 21 Q331 22 332 48 L334 66 Q344 77 333 83 Q332 103 321 112 L323 137 Q341 148 365 153 Q388 160 397 189 L410 247 L425 298 L440 339 L452 371 Q452 381 445 375 L437 357 L440 385 Q438 394 434 383 L428 360 L429 391 Q425 399 422 386 L419 361 L416 387 Q410 393 409 379 L405 345 L394 321 L370 273 L354 221 Q350 260 354 283 L365 348 Q374 383 363 421 L348 485 Q346 504 355 539 L365 610 L362 643 Q371 655 378 663 Q383 674 369 675 L343 674 Q335 669 337 656 L336 620 L325 554 L313 495 L301 422 L299 422 L287 495 L275 554 L264 620 L263 656 Q265 669 257 674 L231 675 Q217 674 222 663 Q229 655 238 643 L235 610 L245 539 Q254 504 252 485 L237 421 Q226 383 235 348 L246 283 Q250 260 246 221 L230 273 L206 321 L195 345 L191 379 Q190 393 184 387 L181 361 L178 386 Q175 399 171 391 L172 360 L166 383 Q162 394 160 385 L163 357 L155 375 Q148 381 148 371 L160 339 L175 298 L190 247 L203 189 Q212 160 235 153 Q259 148 277 137 Z" fill="url(#body-fill)" stroke="#397084" strokeWidth="1.4" />
        <g fill="none" stroke="#396276" opacity=".23" strokeWidth="1">
          <path d="M279 147 Q266 174 252 190 M321 147 Q334 174 348 190 M299 153 L299 385 M253 199 Q274 184 296 194 M347 199 Q326 184 304 194" />
          {[212, 227, 242, 257, 272].map((y, i) => <path key={y} d={`M298 ${y} Q${251 + i * 2} ${y - 10} ${252 + i * 2} ${y + 7} Q275 ${y + 22} 298 ${y + 7} M302 ${y} Q${349 - i * 2} ${y - 10} ${348 - i * 2} ${y + 7} Q325 ${y + 22} 302 ${y + 7}`} />)}
          <path d="M251 347 Q275 367 300 353 Q325 367 349 347 M242 386 Q269 377 289 405 M358 386 Q331 377 311 405 M249 427 L268 491 M351 427 L332 491 M268 505 L246 610 M332 505 L354 610" />
          <ellipse cx="300" cy="58" rx="30" ry="34" />
        </g>
        <g opacity={humoral ? .65 : .14} fill="none" stroke="#ff5574" strokeWidth="2">
          {bloodPaths.map((d, i) => <path key={i} id={`blood-${i}`} d={d} />)}
          <path d="M280 294 L259 295 M330 287 L342 295 M317 326 L292 326" />
        </g>
        {humoral && hormoneSignal && <g className="hormone-particles">{hormonePaths.map((d, i) => <g key={`${source}-${i}`}><path d={d} fill="none" stroke="#ff5574" strokeWidth="1" opacity=".25" />{[0, 1, 2, 3].map(n => <circle key={n} r="3" fill="#ff7791" filter="url(#glow)"><animateMotion dur={`${5 + i * .4}s`} begin={`${-n * 1.5}s`} repeatCount="indefinite" path={d} /></circle>)}</g>)}<circle cx={emitter.x} cy={emitter.y} r="12" fill="#ff557422" stroke="#ff7791" strokeWidth=".7" /></g>}
        <g opacity={neural ? 1 : .13} fill="none" stroke="#00c8ee" strokeWidth="1.7" strokeLinecap="round">
          {nervePaths.map((d, i) => <path key={i} d={d} />)}
          {Array.from({ length: 13 }, (_, i) => <path key={i} d={`M300 ${170 + i * 12} l-6 5 m6 -5 l6 5`} opacity=".5" />)}
        </g>
        {neural && neuralSignal && <g className="nerve-particles">{nervePaths.filter((_, i) => [0, 1, 2, 5, 7, 8, 12].includes(i)).map((d, i) => <circle key={i} r="2.6" fill="#bdffff" filter="url(#glow)"><animateMotion dur={`${1.7 + i * .15}s`} begin={`${-i * .35}s`} path={d} repeatCount="indefinite" /></circle>)}</g>}
        <g className={`organ-shape ${selected === 'brain' ? 'chosen' : ''}`} data-organ="brain" onClick={() => onSelect('brain')}><title>Головной мозг</title><path d="M298 35 Q280 26 273 42 Q264 45 270 56 Q263 65 273 75 Q278 85 296 78 Q302 85 315 78 Q334 75 331 61 Q339 50 327 44 Q324 29 308 34 Q302 30 298 35 Z" fill="url(#brain-fill)" stroke="#31d1f1" strokeWidth="1.3" /><path d="M298 37 L299 77 M288 36 Q280 48 289 54 Q277 59 281 68 M310 36 Q321 47 310 53 Q323 61 317 72 M271 51 L280 49 M322 46 L327 52 M288 64 L295 59 M303 67 L310 62" fill="none" stroke="#57d6ea" opacity=".7" /></g>
        <g fill="#ff6682" stroke="#ff8c9f" opacity={humoral ? 1 : .4}>
          <path data-organ="thyroid" className="organ-shape" onClick={() => onSelect('thyroid')} d="M296 135 Q279 121 282 142 Q284 158 297 145 L303 145 Q316 158 318 142 Q321 121 304 135 Z"><title>Щитовидная железа</title></path>
          <path data-organ="adrenal" className="organ-shape" onClick={() => onSelect('adrenal')} d="M249 297 Q259 278 271 296 Z M331 296 Q343 278 353 297 Z"><title>Надпочечники</title></path>
          <path data-organ="pancreas" className="organ-shape" onClick={() => onSelect('pancreas')} d="M276 326 Q294 312 312 321 Q326 318 338 325 Q333 334 316 332 Q295 339 276 332 Z"><title>Поджелудочная железа</title></path>
        </g>
        <g fill="#203d50" stroke="#446274" opacity=".5"><path d="M257 302 Q242 302 246 323 Q248 337 259 332 Q268 327 260 317 Z" /><path d="M343 302 Q358 302 354 323 Q352 337 341 332 Q332 327 340 317 Z" /></g>
        <g className="heart-beat organ-shape" data-organ="heart" onClick={() => onSelect('heart')}><title>Сердце</title><path d="M322 197 Q313 184 307 197 Q303 210 323 232 Q342 215 340 204 Q339 191 330 198 L327 188 L320 188 Z" fill="#c83760" stroke="#ff7293" strokeWidth="1.4" /><path d="M319 201 L328 215 L323 225" fill="none" stroke="#ff9ab2" /></g>
        <path d="M300 81 L300 91 L308 98" stroke="#bd91ff" strokeWidth="3" filter="url(#glow)" fill="none" />
        <circle cx="300" cy="83" r="4" fill="#c1a1ff" /><circle cx="308" cy="98" r="4" fill="#ff83ac" />
        <g fill="none" stroke={selected === 'heart' ? '#ff5574' : '#7be3f8'}><circle cx={point.x} cy={point.y} r="19" strokeDasharray="3 4" className="selection-ring" /><circle cx={point.x} cy={point.y} r="25" opacity=".25" /></g>
        {labels && <g className="body-labels">{[
          { id: 'brain', x: 127, y: 55, tx: 274, ty: 55, text: 'Головной мозг' },
          { id: 'thyroid', x: 365, y: 134, tx: 315, ty: 140, text: 'Щитовидная железа' },
          { id: 'heart', x: 389, y: 209, tx: 338, ty: 213, text: 'Сердце' },
          { id: 'spinal', x: 92, y: 245, tx: 297, ty: 245, text: 'Спинной мозг' },
          { id: 'adrenal', x: 383, y: 292, tx: 349, ty: 295, text: 'Надпочечники' },
          { id: 'pancreas', x: 70, y: 330, tx: 281, ty: 327, text: 'Поджелудочная' },
        ].map(l => <g key={l.id} data-organ={l.id} onClick={() => onSelect(l.id as OrganId)} className="model-label"><path d={`M${l.tx} ${l.ty} L${l.x > 300 ? l.x - 10 : l.x + 105} ${l.y - 4}`} stroke="#447083" strokeWidth=".6" /><circle cx={l.tx} cy={l.ty} r="2" fill="#7edced" /><text x={l.x} y={l.y} fill={selected === l.id ? '#b8f5ff' : '#7f9eaf'} fontSize="11">{l.text}</text></g>)}</g>}
        <g className="organ-targets">{organs.map(o => <circle key={o.id} data-organ={o.id} cx={o.x} cy={o.y} r={['hypothalamus', 'pituitary'].includes(o.id) ? 7 : 13} fill="transparent" className="organ-target" onClick={() => onSelect(o.id)}><title>{o.name}</title></circle>)}</g>
      </g>
      {humoral && <g className="receptor-inset" transform="translate(420 455)"><rect width="147" height="124" rx="8" fill="#0b1b2cef" stroke="#254155" /><text x="12" y="19" fill="#739bb2" fontSize="8" letterSpacing="1">КЛЕТКА-МИШЕНЬ</text><path d="M42 46 Q87 26 111 66 Q118 105 78 109 Q42 107 43 85 L35 85 L35 72 L43 72 Q43 63 42 59 L35 59 L35 46 Z" fill="#133a3d" stroke="#38e6b0" strokeWidth="1.2" /><ellipse cx="80" cy="76" rx="12" ry="15" fill="#245254" stroke="#3c7776" /><path d="M13 52 H29" stroke="#ff5574" strokeDasharray="2 3" /><circle cx="20" cy="52" r="4" fill="#ff7791" /><text x="11" y="119" fill="#7a9eae" fontSize="7">Гормон → рецептор → ответ</text><path d="M23 82 l4 7 l-8 0 Z" fill="#72869a" /><text x="9" y="103" fill="#547185" fontSize="6">не подходит</text></g>}
      <g opacity=".6" fill="#5e899d" fontSize="9" fontFamily="monospace"><text x="28" y="80">01</text><text x="28" y="230">02</text><text x="28" y="380">03</text><text x="28" y="530">04</text><text x="28" y="660">05</text></g>
    </svg>
    <div className="zoom-tools"><button title="Уменьшить модель" aria-label="Уменьшить модель" onClick={() => setZoom(z => Math.max(.8, z - .2))}><Minus size={15} /></button><span>{Math.round(zoom * 100)}%</span><button title="Увеличить модель" aria-label="Увеличить модель" onClick={() => setZoom(z => Math.min(2, z + .2))}><Plus size={15} /></button><button title="Сбросить вид" aria-label="Сбросить вид" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}><RotateCcw size={14} /></button></div>
    <span className="model-note"><ScanLine size={13} /> Учебная схема · не в масштабе</span>
  </div>;
}
