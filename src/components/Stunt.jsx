import { useCallback, useEffect, useRef, useState } from 'react'

const MESSAGES = [
  'Pehmeä lasku!',
  'Kymppi tyylistä.',
  'Stunt-koordinaattori hyväksyy.',
  'Pahvi kesti, ukko kesti.',
]

/**
 * Hoitaa hypyn: mittaa, missä tikku-ukko ja laatikkokasa ovat,
 * ja animoi ukon kaarella kasan päälle.
 */
export function useStunt() {
  const figureRef = useRef(null)
  const pitRef = useRef(null)
  const animRef = useRef(null)
  const [phase, setPhase] = useState('idle') // idle | air | landed
  const [count, setCount] = useState(0)
  const [message, setMessage] = useState('')

  const jump = useCallback(() => {
    const fig = figureRef.current
    const pit = pitRef.current
    if (phase !== 'idle' || !fig || !pit) return

    const f = fig.getBoundingClientRect()
    const p = pit.getBoundingClientRect()
    const dx = p.left + p.width / 2 - (f.left + f.width / 2)
    const dy = p.top - 5 - (f.top + f.height / 2)

    const land = () => {
      fig.style.transform = `translate(${dx}px, ${dy}px) rotate(-90deg)`
      setPhase('landed')
      setCount((c) => c + 1)
      setMessage(MESSAGES[Math.floor(Math.random() * MESSAGES.length)])
      if (!reduced) {
        pit.animate(
          [
            { transform: 'scale(1, 1)' },
            { transform: 'scale(1.06, 0.86)', offset: 0.25 },
            { transform: 'scale(0.98, 1.04)', offset: 0.6 },
            { transform: 'scale(1, 1)' },
          ],
          { duration: 450, easing: 'ease-out' },
        )
      }
    }

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      land()
      return
    }

    setPhase('air')
    const lift = 70 // hypyn alkunousu pikseleinä
    const steps = 24
    const frames = Array.from({ length: steps + 1 }, (_, i) => {
      const t = i / steps
      const x = dx * t
      const y = -lift * t + (dy + lift) * t * t // painovoimakaari
      return {
        transform: `translate(${x}px, ${y}px) rotate(${-450 * t}deg)`,
        offset: t,
      }
    })
    const anim = fig.animate(frames, {
      duration: Math.min(1400, 700 + Math.abs(dy) * 1.2),
      easing: 'linear',
    })
    anim.onfinish = land
    animRef.current = anim
  }, [phase])

  const reset = useCallback(() => {
    const fig = figureRef.current
    if (!fig) return
    fig.style.transform = ''
    fig.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 350 })
    setPhase('idle')
    setMessage('')
  }, [])

  // Jos ikkunan koko muuttuu laskun jälkeen, asettelu muuttuu: palautetaan ukko alkuun.
  useEffect(() => {
    if (phase !== 'landed') return
    window.addEventListener('resize', reset)
    return () => window.removeEventListener('resize', reset)
  }, [phase, reset])

  useEffect(() => () => animRef.current?.cancel(), [])

  return { figureRef, pitRef, phase, count, message, jump, reset }
}

function RoofCorner() {
  const courses = [12, 18, 24, 30]
  const joints = courses.flatMap((y, i) =>
    Array.from({ length: 8 }, (_, k) => (i % 2 ? 9 : 0) + 18 * k)
      .filter((x) => x > 0 && x < 134)
      .map((x) => ({ x, y })),
  )

  return (
    <svg className="stunt-roof" viewBox="0 0 150 36" aria-hidden="true">
      {/* katon pinta */}
      <polygon points="16,0 150,0 134,8 0,8" fill="#7d7268" />
      {/* reunakivi */}
      <rect x="0" y="8" width="134" height="4" fill="#b8ab9b" />
      <polygon points="134,8 150,0 150,4 134,12" fill="#948878" />
      {/* etuseinä */}
      <rect x="0" y="12" width="134" height="24" fill="#7b3f33" />
      {/* sivuseinä (varjossa) */}
      <polygon points="134,12 150,4 150,28 134,36" fill="#4e2a23" />
      {/* tiilisaumat */}
      <g stroke="#3b2019" strokeWidth="1">
        {courses.slice(1).map((y) => (
          <g key={y}>
            <line x1="0" y1={y} x2="134" y2={y} />
            <line x1="134" y1={y} x2="150" y2={y - 8} />
          </g>
        ))}
        {joints.map(({ x, y }) => (
          <line key={`${x}-${y}`} x1={x} y1={y} x2={x} y2={y + 6} />
        ))}
      </g>
    </svg>
  )
}

export function StuntFigure({ stunt }) {
  const { figureRef, phase, jump } = stunt
  const air = phase === 'air'

  return (
    <div className="stunt-slot">
      <div className="stunt-body">
        {phase === 'idle' && (
          <span className="stunt-hint" aria-hidden="true">
            Hypätäänkö?
          </span>
        )}
        <button
          ref={figureRef}
          className="stunt-figure"
          onClick={jump}
          disabled={phase !== 'idle'}
          aria-label="Hyppää laatikkokasaan"
        >
          <svg viewBox="0 0 40 60" aria-hidden="true">
            <g stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" fill="none">
              <line x1="20" y1="15" x2="20" y2="36" />
              {air ? (
                <>
                  <line x1="20" y1="21" x2="8" y2="9" />
                  <line x1="20" y1="21" x2="32" y2="9" />
                  <line x1="20" y1="36" x2="8" y2="52" />
                  <line x1="20" y1="36" x2="32" y2="52" />
                </>
              ) : (
                <>
                  <line x1="20" y1="21" x2="10" y2="31" />
                  <line x1="20" y1="21" x2="30" y2="31" />
                  <line x1="20" y1="36" x2="13" y2="56" />
                  <line x1="20" y1="36" x2="27" y2="56" />
                </>
              )}
            </g>
            <circle cx="20" cy="8" r="6.5" fill="currentColor" />
          </svg>
        </button>
      </div>
      <RoofCorner />
    </div>
  )
}

function Box({ x, y, r = 0 }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r} 30 20)`}>
      <rect width="60" height="40" rx="2" fill="#c08a4f" stroke="#7a4f24" strokeWidth="2" />
      <rect x="26" width="8" height="40" fill="#e0bb85" />
      <line x1="0" y1="7" x2="60" y2="7" stroke="#7a4f24" strokeWidth="1.5" opacity="0.6" />
    </g>
  )
}

export function BoxPile({ stunt }) {
  const { pitRef, phase, count, message, reset } = stunt

  return (
    <div className="pit">
      <svg ref={pitRef} className="pit-boxes" viewBox="0 -12 200 122" aria-hidden="true">
        <Box x={8} y={70} r={-2} />
        <Box x={70} y={70} r={1} />
        <Box x={132} y={70} r={3} />
        <Box x={38} y={32} r={-3} />
        <Box x={100} y={32} r={2} />
        <Box x={69} y={-6} r={-2} />
      </svg>
      <div className="pit-info">
        <div className="pit-message" aria-live="polite">
          {message}
        </div>
        {count > 0 && <div>Onnistuneita laskuja: {count}</div>}
        {phase === 'landed' && (
          <button className="pit-reset" onClick={reset}>
            Hyppää uudelleen
          </button>
        )}
      </div>
    </div>
  )
}
