import { useEffect, useRef, useState } from 'react'
import idleImg from '../assets/map/harcerz-stojacy1.png'
import walkGif from '../assets/map/chodzacy-harcerz.gif'

const SIZE = 96
const SPEED = 0.4

/**
 * MapCharacter — ludzik na mapie z płynną animacją chodzenia po waypointach.
 */
export default function MapCharacter({ x, y, waypoints, onArrive }) {
  const [src, setSrc] = useState(idleImg)
  const [pos, setPos] = useState({ x, y })
  const animRef = useRef(null)
  const wpRef = useRef([])
  const wpIdxRef = useRef(0)
  const startPosRef = useRef({ x, y })
  const mountedRef = useRef(false)

  // Inicjalizacja
  if (!mountedRef.current) {
    startPosRef.current = { x, y }
    setPos({ x, y })
    mountedRef.current = true
  }

  useEffect(() => {
    if (!waypoints || waypoints.length === 0) return
    wpRef.current = waypoints
    wpIdxRef.current = 0
    startPosRef.current = { x: pos.x, y: pos.y }
    setSrc(walkGif)
    walkToNext()

    return () => { if (animRef.current) cancelAnimationFrame(animRef.current) }
  }, [waypoints])

  function walkToNext() {
    if (wpIdxRef.current >= wpRef.current.length) {
      setSrc(idleImg)
      if (onArrive) onArrive()
      return
    }
    const target = wpRef.current[wpIdxRef.current]
    const start = startPosRef.current

    const dx = target.x - start.x
    const dy = target.y - start.y
    const dist = Math.hypot(dx, dy)
    if (dist < 1) {
      startPosRef.current = target
      wpIdxRef.current++
      walkToNext()
      return
    }

    const duration = dist / SPEED
    const startTime = performance.now()
    function animate(now) {
      const elapsed = now - startTime
      const t = Math.min(1, elapsed / duration)
      const cx = start.x + dx * t
      const cy = start.y + dy * t
      setPos({ x: cx, y: cy })
      if (t < 1) {
        animRef.current = requestAnimationFrame(animate)
      } else {
        startPosRef.current = target
        wpIdxRef.current++
        walkToNext()
      }
    }
    animRef.current = requestAnimationFrame(animate)
  }

  return (
    <image
      id="map-char-img"
      href={src}
      x={pos.x - SIZE / 2}
      y={pos.y - SIZE}
      width={SIZE}
      height={SIZE}
      style={{ pointerEvents: 'none' }}
    />
  )
}
