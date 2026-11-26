import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

const MESSAGES = ['Fordi on entinen. Kuski selvisi ehjin nahoin.', 'Tarkistetaan portti. Hieno ajo.', 'Siirrytään lähikuviin.']

/* ---------- Tien geometria (SVG-yksiköissä, kuvan koko 800 x 300) ---------- */

const SLOPE = 142 / 430 // mäen jyrkkyys
const ANGLE = (Math.atan(SLOPE) * 180) / Math.PI // noin 18 astetta
const FLAT_X = 430 // tästä tie on tasainen

const roadY = (x) => (x < FLAT_X ? 98 + SLOPE * x : 240)

const roadAngle = (x) => {
  if (x <= 400) return ANGLE
  if (x >= 460) return 0
  const u = (x - 400) / 60
  return ANGLE * (1 - u * u * (3 - 2 * u))
}

// Auton asento: kulkee tien mukaan, dy siirtää sivuun (ojaan) ja extra kallistaa
const pose = (x, dy = 0, extra = 0) =>
  `translate(${x}px, ${roadY(x) + dy}px) rotate(${roadAngle(x) + extra}deg)`

const sample = (n, fn) =>
  Array.from({ length: n + 1 }, (_, i) => {
    const u = i / n
    return { transform: fn(u), offset: u }
  })

/* ---------- Koreografia ---------- */

const DRIVE = sample(34, (u) => pose(40 + 370 * u ** 1.8)) // kiihtyy alamäessä

const BRAKE = sample(16, (u) => {
  const e = 1 - (1 - u) ** 2.2
  return pose(410 + 95 * e, 0, 7 * (1 - u) ** 1.5 * Math.min(1, u * 6)) // keula painuu jarrutuksessa
})

const SKID = sample(12, (u) => {
  const e = u * u * (3 - 2 * u)
  return pose(505 + 40 * e, 18 * e, 4 * Math.sin(2 * Math.PI * u)) // luisu kohti ojaa
})

const DITCH = sample(10, (u) => {
  const e = u * u
  return pose(545 + 40 * e, 18 + 18 * e, 12 * e) // keula ojaan
})

const SETTLE = sample(8, (u) => pose(585, 36, 9 + 3 * Math.cos(Math.PI * u * 1.5) * (1 - u)))

const RUN = [{ transform: 'translate(576px, 268px)' }, { transform: 'translate(370px, 262px)' }]

/* ---------- Liekit ---------- */

const FLAME =
  'M0 -28 C4 -20 10 -16 10 -9 C10 -3 5 0 0 0 C-5 0 -10 -3 -10 -9 C-10 -15 -5 -18 -4 -24 C-2 -22 -1 -24 0 -28 Z'

const CAR_FLAMES = [
  { x: 30, y: -20, s: 1.2, d: 0 },
  { x: 12, y: -22, s: 1.0, d: 0.1 },
  { x: -6, y: -40, s: 1.3, d: 0.2 },
  { x: -22, y: -24, s: 0.9, d: 0.05 },
  { x: 40, y: -12, s: 0.7, d: 0.15 },
  { x: -36, y: -22, s: 0.7, d: 0.25 },
  { x: 4, y: -26, s: 1.4, d: 0.3 },
]

/* ---------- Kohtaus ---------- */

export default function CarStunt() {
  const svgRef = useRef(null)
  const carRef = useRef(null)
  const runnerRef = useRef(null)
  const tokenRef = useRef(null)
  // idle | drive | brake | skid | crash | fire | flee | watch | dying | out | done
  const [phase, setPhase] = useState('idle')
  const [count, setCount] = useState(0)
  const [message, setMessage] = useState('')

  const place = useCallback(() => {
    if (!carRef.current) return
    carRef.current.style.transform = pose(40)
    runnerRef.current.style.transform = 'translate(576px, 268px)'
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
    svgRef.current?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 600 })
  }, [cancelRun, place])

  const start = useCallback(async () => {
    const car = carRef.current
    const runner = runnerRef.current
    if (phase !== 'idle' || !car || !runner) return

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

    // 1) Auto lähtee mäkeä alas ja kiihtyy
    setPhase('drive')
    await slide(car, DRIVE, 3400)

    // 2) Äkkijarrutus
    setPhase('brake')
    await slide(car, BRAKE, 1100)

    // 3) Luisu kohti ojaa
    setPhase('skid')
    await slide(car, SKID, 900)

    // 4) Auto keulii ojaan
    setPhase('crash')
    await slide(car, DITCH, 700)
    await slide(car, SETTLE, 400)
    await wait(500)

    // 5) Auto syttyy palamaan
    setPhase('fire')
    await wait(1300)

    // 6) Kuski kömpii ulos ja lähtee pakoon
    setPhase('flee')
    await slide(runner, RUN, 2600, 'ease-out')

    // 7) Kuski jää tyytyväisenä katsomaan etäämmältä
    setPhase('watch')
    await wait(2400)

    // 8) Tuli hiipuu ja sammuu
    setPhase('dying')
    await wait(2200)
    setPhase('out')
    await wait(1600)

    setMessage(MESSAGES[Math.floor(Math.random() * MESSAGES.length)])
    setCount((c) => c + 1)
    setPhase('done')
  }, [phase])

  useLayoutEffect(() => {
    place()
  }, [place])

  useEffect(() => cancelRun, [cancelRun])

  const has = (...p) => p.includes(phase)
  const sceneClass = [
    'car-scene',
    has('idle') && 'is-idle',
    has('brake', 'skid') && 'is-brake-lights',
    has('fire', 'flee', 'watch') && 'is-burning',
    has('dying') && 'is-dying',
    has('dying', 'out', 'done') && 'is-charred',
    has('flee', 'watch', 'dying', 'out', 'done') && 'is-out',
    has('flee') && 'is-fleeing',
    has('watch', 'dying', 'out', 'done') && 'is-content',
  ]
    .filter(Boolean)
    .join(' ')
  const stageClass = `car-stage${has('fire', 'flee', 'watch', 'dying') ? ' is-glowing' : ''}`

  const onKey = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      start()
    }
  }

  return (
    <div>
      <div className={stageClass}>
        <svg
          ref={svgRef}
          className={sceneClass}
          viewBox="0 0 800 300"
          role="img"
          aria-label="Tikku-ukko ajaa autolla mäkeä alas, jarruttaa äkisti ja päätyy ojaan. Auto syttyy palamaan."
        >
          {/* maa, tie ja oja */}
          <path d="M0 108 L430 250 L800 250 L800 300 L0 300 Z" fill="#0b0504" />
          <path d="M0 64 L430 206 L800 206 L800 250 L430 250 L0 108 Z" fill="#2c1a15" />
          <path d="M0 64 L430 206 L800 206" fill="none" stroke="#3d1f18" strokeWidth="2" />
          <path d="M486 250 L522 281 L652 285 L692 250 Z" fill="#050302" />

          {/* auto ja kuski */}
          <g
            ref={carRef}
            className="car"
            role="button"
            tabIndex={phase === 'idle' ? 0 : -1}
            aria-label="Lähetä auto liikkeelle mäen päältä"
            onClick={start}
            onKeyDown={onKey}
          >
            <g transform="scale(1.25)">
              <rect className="car-body" x="-46" y="-26" width="92" height="17" rx="4" />
              <path className="car-body" d="M-30 -26 L-20 -44 L20 -44 L32 -26 Z" />
              <path className="car-window" d="M-24 -28 L-17 -41 L2 -41 L2 -28 Z" />
              <path className="car-window" d="M6 -28 L6 -41 L16 -41 L26 -28 Z" />
              <circle className="driver" cx="-9" cy="-35" r="4.5" fill="#fff" />
              <rect className="headlamp" x="42" y="-22" width="5" height="6" rx="1" />
              <rect className="brake-light" x="-47" y="-22" width="4" height="6" rx="1" />
              {[-28, 28].map((wx) => (
                <g key={wx} transform={`translate(${wx} -9)`}>
                  <circle r="9" fill="#0d0d0d" />
                  <circle r="3.5" fill="#9aa3ad" />
                </g>
              ))}

              <g className="car-flames">
                {CAR_FLAMES.map((f, i) => (
                  <g key={i} transform={`translate(${f.x} ${f.y}) scale(${f.s})`}>
                    <g className="flame-grow">
                      <g
                        className="flick"
                        style={{ animationDelay: `${f.d}s`, animationDuration: `${0.55 + (i % 3) * 0.15}s` }}
                      >
                        <path d={FLAME} fill="#e0261c" />
                        <path d={FLAME} fill="#ff7a1a" transform="scale(0.72)" />
                        <path d={FLAME} fill="#ffd23f" transform="scale(0.44)" />
                      </g>
                    </g>
                  </g>
                ))}
              </g>

              <g className="car-smoke">
                <circle cx="2" cy="-46" r="7" />
                <circle cx="-8" cy="-46" r="6" />
                <circle cx="12" cy="-46" r="6" />
              </g>
            </g>
          </g>

          {/* ojan reunus peittää auton alaosan */}
          <path d="M470 300 L470 280 Q520 266 590 266 Q650 266 700 284 L700 300 Z" fill="#0b0504" />

          {/* pakoon juokseva ja lopuksi tyytyväisenä katsova tikku-ukko */}
          <g ref={runnerRef} className="runner">
            <g transform="scale(0.85)">
              <g transform="translate(-20 -56)">
                <g stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
                  <line x1="20" y1="15" x2="20" y2="36" />
                  <g className="swing-arms">
                    <g className="r-arm r-arm-a">
                      <line x1="20" y1="21" x2="10" y2="31" />
                    </g>
                    <g className="r-arm r-arm-b">
                      <line x1="20" y1="21" x2="30" y2="31" />
                    </g>
                  </g>
                  <polyline className="hip-arms" points="20,21 11,28 18,34" />
                  <polyline className="hip-arms" points="20,21 29,28 22,34" />
                  <g className="r-leg r-leg-a">
                    <line x1="20" y1="36" x2="13" y2="56" />
                  </g>
                  <g className="r-leg r-leg-b">
                    <line x1="20" y1="36" x2="27" y2="56" />
                  </g>
                </g>
                <circle cx="20" cy="8" r="6.5" fill="#fff" />
                <g className="face" fill="#1a100b">
                  <circle cx="17.8" cy="7" r="0.9" />
                  <circle cx="22.2" cy="7" r="0.9" />
                  <path d="M16.8 10 Q20 13.4 23.2 10" fill="none" stroke="#1a100b" strokeWidth="1.1" strokeLinecap="round" />
                </g>
              </g>
            </g>
          </g>

          {phase === 'idle' && (
            <g className="car-hint" transform="translate(10 18)">
              <rect width="118" height="28" rx="8" fill="#ffb000" />
              <text x="59" y="19" textAnchor="middle" fontSize="14" fontWeight="500" fill="#140a08" fontFamily="'Bricolage Grotesque', sans-serif">
                Lähdetäänkö?
              </text>
            </g>
          )}
        </svg>
      </div>

      <div className="fire-info">
        <div className="fire-message" aria-live="polite">
          {message}
        </div>
        {count > 0 && <div>Onnistuneita ajoja: {count}</div>}
        {phase === 'done' && (
          <button className="pit-reset" onClick={reset}>
            Aja uudelleen
          </button>
        )}
      </div>
    </div>
  )
}
