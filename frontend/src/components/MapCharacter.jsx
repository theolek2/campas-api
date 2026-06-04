import { useState, useEffect } from 'react'
import { MAP_COORDS } from '../data/mapNodes'

const IDLE_GIF = '/camp/map/ludzik-idle.png'
const WALK_GIF = '/camp/map/ludzik-walk.png'

/**
 * MapCharacter — ludzik na mapie.
 * Wyświetla GIF idle na docelowej pozycji.
 * Podczas przejścia: walk GIF przesuwany transformem.
 */
export default function MapCharacter({ nodeId, targetNodeId, onArrive }) {
  const pos = MAP_COORDS[nodeId] || { x: 1000, y: 200 }
  const targetPos = targetNodeId ? MAP_COORDS[targetNodeId] : null
  const [animating, setAnimating] = useState(false)

  useEffect(() => {
    if (targetNodeId && targetPos) {
      setAnimating(true)
      const dist = Math.hypot(targetPos.x - pos.x, targetPos.y - pos.y)
      const duration = Math.min(800, Math.max(300, dist / 2))
      const timer = setTimeout(() => {
        setAnimating(false)
        if (onArrive) onArrive()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [targetNodeId])

  const size = 80

  if (animating && targetPos) {
    const dx = targetPos.x - pos.x
    const dy = targetPos.y - pos.y
    const angle = Math.atan2(dy, dx) * (180 / Math.PI)
    return (
      <g>
        <image
          href={WALK_GIF}
          x={pos.x - size / 2}
          y={pos.y - size}
          width={size}
          height={size}
          style={{
            animation: 'walkToTarget 0.8s ease-in-out forwards',
            '--target-x': `${targetPos.x - size / 2}px`,
            '--target-y': `${targetPos.y - size}px`,
            transform: `rotate(${angle}deg)`,
          }}
        />
        <style>{`
          @keyframes walkToTarget {
            to { transform: translate(calc(var(--target-x) - ${pos.x - size / 2}px), calc(var(--target-y) - ${pos.y - size}px)) rotate(${angle}deg); }
          }
        `}</style>
      </g>
    )
  }

  return (
    <image
      href={IDLE_GIF}
      x={pos.x - size / 2}
      y={pos.y - size}
      width={size}
      height={size}
    />
  )
}
