import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

const MESSAGES = ['Tuli sammui. Leikkaa!', 'Huopa hoiti homman.', 'Kuvaus voi jatkua.']

const ACTOR_W = 44
const PAD = 8
const RUN_SPEED = 210 // px / s (rauhallinen, harjoiteltu vauhti)

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))
const tx = (x) => `translateX(${x}px)`

/* ---------- Liekit ---------- */

// Liekki piirretty niin, että sen tyvi on pisteessä (0, 0)
const FLAME =
  'M0 -28 C4 -20 10 -16 10 -9 C10 -3 5 0 0 0 C-5 0 -10 -3 -10 -9 C-10 -15 -5 -18 -4 -24 C-2 -22 -1 -24 0 -28 Z'

// Liekit seisovalle ukolle
const FLAMES_STAND = [
  { x: 20, y: 9, s: 0.55, d: 0 },
  { x: 11, y: 24, s: 0.6, d: 0.1 },
  { x: 29, y: 24, s: 0.6, d: 0.2 },
  { x: 20, y: 38, s: 1.0, d: 0.05 },
  { x: 13, y: 54, s: 0.6, d: 0.15 },
  { x: 27, y: 54, s: 0.6, d: 0.25 },
  { x: 20, y: 20, s: 0.8, d: 0.3 },
]

// Liekit maassa makaavalle ukolle (pää vasemmalla, jalat oikealla)
const FLAMES_LIE = [
  { x: 0, y: 50, s: 0.5, d: 0 },
  { x: 10, y: 52, s: 0.7, d: 0.1 },
  { x: 20, y: 52, s: 1.0, d: 0.05 },
  { x: 30, y: 52, s: 0.8, d: 0.2 },
  { x: 40, y: 52, s: 0.6, d: 0.15 },
  { x: 46, y: 52, s: 0.45, d: 0.25 },
  { x: 22, y: 46, s: 0.6, d: 0.3 },
]

function Flames({ items, className }) {
  return (
    <g className={`flames ${className}`}>
      {items.map((f, i) => (
        <g key={i} transform={`translate(${f.x} ${f.y}) scale(${f.s})`}>
          <g
            className="flick"
            style={{ animationDelay: `${f.d}s`, animationDuration: `${0.55 + (i % 3) * 0.15}s` }}
          >
            <path d={FLAME} fill="#e0261c" />
            <path d={FLAME} fill="#ff7a1a" transform="scale(0.72)" />
            <path d={FLAME} fill="#ffd23f" transform="scale(0.44)" />
          </g>
        </g>
      ))}
    </g>
  )
}

/* ---------- Tikku-ukot ---------- */

function Victim() {
  return (
    <svg className="fig" viewBox="0 0 40 60" width="44" height="66" aria-hidden="true">
      <Flames items={FLAMES_STAND} className="flames-stand" />
      <Flames items={FLAMES_LIE} className="flames-lie" />
      <g className="fig-inner">
        <g stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" fill="none">
          <line x1="20" y1="15" x2="20" y2="36" />
          <g className="arm arm-a">
            <line x1="20" y1="21" x2="10" y2="31" />
          </g>
          <g className="arm arm-b">
            <line x1="20" y1="21" x2="30" y2="31" />
          </g>
          <g className="leg leg-a">
            <line x1="20" y1="36" x2="13" y2="56" />
          </g>
          <g className="leg leg-b">
            <line x1="20" y1="36" x2="27" y2="56" />
          </g>
        </g>
        <circle cx="20" cy="8" r="6.5" fill="currentColor" />
      </g>
    </svg>
  )
}

function Helper({ carrying }) {
  return (
    <svg className="fig helper" viewBox="0 0 60 60" width="66" height="66" aria-hidden="true">
      <g className="fig-inner">
        {carrying && (
          <g>
            <rect x="4" y="12" width="20" height="34" rx="2" fill="#8fa3b8" stroke="#5d7186" strokeWidth="1.5" />
            <path d="M10 14 V44 M16 14 V44" stroke="#6f8398" strokeWidth="1" fill="none" />
          </g>
        )}
        <g stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" fill="none">
          <line x1="40" y1="15" x2="40" y2="36" />
          <line x1="40" y1="21" x2="24" y2="24" />
          <line x1="40" y1="25" x2="24" y2="31" />
          <g className="leg leg-a">
            <line x1="40" y1="36" x2="33" y2="56" />
          </g>
          <g className="leg leg-b">
            <line x1="40" y1="36" x2="47" y2="56" />
          </g>
        </g>
        <circle cx="40" cy="8" r="6.5" fill="currentColor" />
      </g>
    </svg>
  )
}

/* ---------- Kohtaus ---------- */

export default function FireStunt() {
  const stageRef = useRef(null)
  const victimRef = useRef(null)
  const helperRef = useRef(null)
  const tokenRef = useRef(null)
  // idle | ready | lit | burning | down | arrive | hold | wrap | unwrap | rise | done
  const [phase, setPhase] = useState('idle')
  const [count, setCount] = useState(0)
  const [message, setMessage] = useState('')
  const [coverX, setCoverX] = useState(0)

  const startX = (W) => clamp(W * 0.25 - ACTOR_W / 2, PAD, W - ACTOR_W - PAD)

  const place = useCallback(() => {
    const stage = stageRef.current
    if (!stage || !victimRef.current || !helperRef.current) return
    const W = stage.clientWidth
    victimRef.current.style.transform = tx(startX(W))
    helperRef.current.style.transform = tx(W + 12)
  }, [])

  const cancelRun = useCallback(() => {
    const token = tokenRef.current
    if (token) {
      token.timers.forEach(clearTimeout)
      token.anims.forEach((a) => a.cancel())
    }
    tokenRef.current = null
  }, [])

  const reset = useCallback(() => {
    cancelRun()
    place()
    setPhase('idle')
    setMessage('')
  }, [cancelRun, place])

  const start = useCallback(async () => {
    const stage = stageRef.current
    const victim = victimRef.current
    const helper = helperRef.current
    if (phase !== 'idle' || !stage || !victim || !helper) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const token = { timers: [], anims: [] }
    tokenRef.current = token

    const wait = (ms) =>
      new Promise((resolve) => token.timers.push(setTimeout(resolve, reduced ? Math.min(ms, 400) : ms)))
    const slide = (el, frames, duration, easing = 'linear') =>
      new Promise((resolve) => {
        const last = frames[frames.length - 1].transform
        if (reduced) {
          el.style.transform = last
          resolve()
          return
        }
        const anim = el.animate(frames, { duration, easing })
        token.anims.push(anim)
        anim.onfinish = () => {
          el.style.transform = last
          resolve()
        }
      })

    const W = stage.clientWidth
    const x0 = startX(W)

    // 0) Hetki ennen kuvausta: ukko seisoo paikallaan
    setPhase('ready')
    await wait(700)

    // 1) Liekit syttyvät, ukko pitää paikkansa hetken
    setPhase('lit')
    await wait(1100)

    // 2) Hallittu juoksu edestakaisin. Ukko on symmetrinen, joten käännöstä ei tarvita:
    //    hän pysähtyy pehmeästi reunaan ja palaa takaisin.
    setPhase('burning')
    const stops = [0.7, 0.2, 0.48].map((f) => clamp(W * f - ACTOR_W / 2, PAD, W - ACTOR_W - PAD))
    const keys = [{ t: 0, x: x0 }]
    let t = 0
    let from = x0
    stops.forEach((to) => {
      t += Math.max(900, (Math.abs(to - from) / RUN_SPEED) * 1000)
      keys.push({ t, x: to })
      from = to
    })
    const frames = keys.map((k) => ({ transform: tx(k.x), offset: k.t / t, easing: 'ease-in-out' }))
    await slide(victim, frames, t)
    const xb = from

    // 3) Palava ukko kaatuu maahan ja palaa siellä hetken
    setPhase('down')
    await wait(1400)

    // 4) Auttaja juoksee paikalle huopa kädessä
    setPhase('arrive')
    const xh0 = W + 12
    const xhArrive = xb + 100
    const arriveMs = Math.max(1100, ((xh0 - xhArrive) / (RUN_SPEED * 1.3)) * 1000)
    await slide(helper, [{ transform: tx(xh0) }, { transform: tx(xhArrive) }], arriveMs, 'ease-out')
    setPhase('hold')
    await wait(450)

    // 5) Huopa maassa makaavan ukon päälle, liekit sammuvat
    setCoverX(xb - 20)
    setPhase('wrap')
    await slide(helper, [{ transform: tx(xhArrive) }, { transform: tx(xb + 40) }], 500, 'ease-in-out')
    await wait(2200)

    // 6) Huopa nostetaan pois
    setPhase('unwrap')
    await slide(helper, [{ transform: tx(xb + 40) }, { transform: tx(xhArrive) }], 700, 'ease-in-out')
    await wait(300)

    // 7) Sammutettu ukko nousee pystyyn
    setPhase('rise')
    await wait(1000)
    setMessage(MESSAGES[Math.floor(Math.random() * MESSAGES.length)])
    setCount((c) => c + 1)
    setPhase('done')
  }, [phase])

  useLayoutEffect(() => {
    place()
  }, [place])

  useEffect(() => {
    const onResize = () => (phase === 'idle' ? place() : reset())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [phase, place, reset])

  useEffect(() => cancelRun, [cancelRun])

  const lit = ['lit', 'burning', 'down', 'arrive', 'hold'].includes(phase)
  const down = ['down', 'arrive', 'hold', 'wrap', 'unwrap'].includes(phase)
  const victimClass = [
    'fire-actor',
    lit && 'is-lit',
    lit && 'is-flailing',
    down && 'is-down',
    phase === 'burning' && 'is-running',
    phase === 'done' && 'is-cheer',
  ]
    .filter(Boolean)
    .join(' ')
  const helperClass = ['fire-actor', 'helper-actor', phase === 'arrive' && 'is-running'].filter(Boolean).join(' ')
  const carrying = phase !== 'wrap' && phase !== 'unwrap'

  return (
    <div>
      <div ref={stageRef} className={`fire-stage${lit ? ' is-glowing' : ''}`}>
        <div ref={victimRef} className={victimClass}>
          {phase === 'idle' && <span className="fire-hint">Sytytetäänkö?</span>}
          <button
            className="fire-btn"
            onClick={start}
            disabled={phase !== 'idle'}
            aria-label="Sytytä tikku-ukko liekkeihin"
          >
            <Victim />
          </button>
        </div>

        <div ref={helperRef} className={helperClass}>
          <Helper carrying={carrying} />
        </div>

        {(phase === 'wrap' || phase === 'unwrap') && (
          <div className={`fire-cover${phase === 'unwrap' ? ' is-off' : ''}`} style={{ left: coverX }}>
            <svg viewBox="0 0 84 40" width="84" height="40" aria-hidden="true">
              <path
                d="M2 38 Q4 12 24 9 Q42 3 60 9 Q80 12 82 38 Z"
                fill="#8fa3b8"
                stroke="#5d7186"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <path d="M22 12 L18 37 M42 8 L42 37 M62 12 L66 37" stroke="#6f8398" strokeWidth="1.5" fill="none" />
            </svg>
            {phase === 'wrap' && (
              <div className="smoke">
                <span />
                <span />
                <span />
              </div>
            )}
          </div>
        )}
      </div>

      <div className="fire-info">
        <div className="fire-message" aria-live="polite">
          {message}
        </div>
        {count > 0 && <div>Onnistuneita sammutuksia: {count}</div>}
        {phase === 'done' && (
          <button className="pit-reset" onClick={reset}>
            Sytytä uudelleen
          </button>
        )}
      </div>
    </div>
  )
}
