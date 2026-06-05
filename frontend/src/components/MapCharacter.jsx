import { useEffect, useRef } from 'react'
import idleImg from '../assets/map/harcerz-stojacy1.png'
import walkGif from '../assets/map/chodzacy-harcerz.gif'

const SIZE = 48
const SPEED = 0.4 // px per ms

/**
 * MapCharacter — ludzik na mapie z płynną animacją chodzenia.
 * Gdy zmienia się targetX/targetY — idzie płynnie do celu, potem staje.
 */
export default function MapCharacter({ x, y, targetX, targetY, onArrive }) {
  const animRef = useRef(null)
  const posRef = useRef({ x: 0, y: 0 })
  const srcRef = useRef(idleImg)

  // Inicjalizacja pozycji przy pierwszym renderze
  const mountedRef = useRef(false)
  if (!mountedRef.current) {
    posRef.current = { x, y }
    mountedRef.current = true
  }

  useEffect(() => {
    if (targetX == null || targetY == null) return
    const startX = posRef.current.x
    const startY = posRef.current.y
    const dx = targetX - startX
    const dy = targetY - startY
    const dist = Math.hypot(dx, dy)
    if (dist < 3) return

    const duration = dist / SPEED
    const startTime = performance.now()
    srcRef.current = walkGif

    function animate(now) {
      const elapsed = now - startTime
      const t = Math.min(1, elapsed / duration)
      const cx = startX + dx * t
      const cy = startY + dy * t
      posRef.current = { x: cx, y: cy }
      const el = document.getElementById('map-char-img')
      if (el) {
        el.setAttribute('x', cx - SIZE / 2)
        el.setAttribute('y', cy - SIZE)
      }
      if (t < 1) {
        animRef.current = requestAnimationFrame(animate)
      } else {
        srcRef.current = idleImg
        if (el) el.setAttribute('href', idleImg)
        if (onArrive) onArrive()
      }
    }
    animRef.current = requestAnimationFrame(animate)
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current) }
  }, [targetX, targetY])

  return (
    <image
      id="map-char-img"
      href={idleImg}
      x={posRef.current.x - SIZE / 2}
      y={posRef.current.y - SIZE}
      width={SIZE}
      height={SIZE}
      style={{ pointerEvents: 'none' }}
    />
  )
}
