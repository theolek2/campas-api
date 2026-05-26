import { useState, useEffect, useRef } from 'react'

const COLORS = ['#f44336','#e91e63','#9c27b0','#673ab7','#3f51b5','#2196f3','#00bcd4','#009688','#4caf50','#8bc34a','#ffeb3b','#ffc107','#ff9800','#ff5722','#ff4081']
const PIECES = 150

export default function Confetti({ active, onDone, origin }) {
  const [pieces, setPieces] = useState([])
  const ref = useRef(null)

  useEffect(() => {
    if (!active) return
    const rect = origin || { left: window.innerWidth / 2, top: window.innerHeight / 2, width: 100, height: 40 }
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2

    const arr = Array.from({ length: PIECES }, (_, i) => ({
      id: i,
      startX: cx,
      startY: cy,
      angle: (i / PIECES) * 360 + (Math.random() - 0.5) * 30,
      distance: 150 + Math.random() * 400,
      size: 8 + Math.random() * 14,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      delay: Math.random() * 0.1,
      shape: Math.random() > 0.5 ? 'square' : 'circle',
      rotation: Math.random() * 1080 - 540,
    }))
    setPieces(arr)
    const t = setTimeout(() => { setPieces([]); onDone?.() }, 3200)
    return () => clearTimeout(t)
  }, [active])

  if (!active || pieces.length === 0) return null

  return (
    <div ref={ref} className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      {pieces.map(p => (
        <div key={p.id}
          className="absolute"
          style={{
            left: p.startX,
            top: p.startY,
            width: p.size,
            height: p.size,
            backgroundColor: p.shape === 'square' ? p.color : undefined,
            borderRadius: p.shape === 'circle' ? '50%' : '2px',
            animation: `confettiBurst 2.8s ${p.delay}s ease-out forwards`,
            ['--angle'   ]: `${p.angle}deg`,
            ['--distance']: `${p.distance}px`,
            ['--rot'     ]: `${p.rotation}deg`,
          }}
        />
      ))}
      <style>{`
        @keyframes confettiBurst {
          0%   { opacity:1; transform: translate(0,0) rotate(0deg) scale(1); }
          20%  { opacity:1; transform: translate(
                  calc(cos(var(--angle)) * var(--distance) * 0.6),
                  calc(sin(var(--angle)) * var(--distance) * 0.6 - 80px)
                ) rotate(calc(var(--rot)*0.4)) scale(1.1); }
          70%  { opacity:0.8; transform: translate(
                  calc(cos(var(--angle)) * var(--distance)),
                  calc(sin(var(--angle)) * var(--distance) + 40px)
                ) rotate(var(--rot)) scale(0.8); }
          100% { opacity:0; transform: translate(
                  calc(cos(var(--angle)) * var(--distance) * 1.2),
                  calc(sin(var(--angle)) * var(--distance) * 1.2 + 120px)
                ) rotate(calc(var(--rot)*1.3)) scale(0.4); }
        }
      `}</style>
    </div>
  )
}
