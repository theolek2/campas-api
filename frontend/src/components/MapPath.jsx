import { MAP_COORDS, PATH_WIDTH, STATUS_COLORS } from '../data/mapNodes'

/**
 * MapPath — ścieżka między dwoma węzłami.
 * Kolor: szary (locked), niebieski (available), zielony (done, rysowana).
 */
export default function MapPath({ fromId, toId, status }) {
  const from = MAP_COORDS[fromId]
  const to = MAP_COORDS[toId]
  if (!from || !to) return null

  const color = status === 'done' ? STATUS_COLORS.done
    : status === 'available' ? STATUS_COLORS.available
    : STATUS_COLORS.locked

  return (
    <line
      x1={from.x} y1={from.y}
      x2={to.x} y2={to.y}
      stroke={color}
      strokeWidth={PATH_WIDTH}
      strokeLinecap="round"
      opacity={status === 'locked' ? 0.3 : status === 'done' ? 1 : 0.7}
      style={{
        transition: 'stroke 0.5s, opacity 0.5s',
        strokeDasharray: status === 'done' ? 'none' : '8 4',
      }}
    />
  )
}
