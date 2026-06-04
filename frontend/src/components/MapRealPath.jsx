import { STATUS_COLORS } from '../data/mapNodes'

/**
 * MapRealPath — rzeczywista ścieżka złożona z wielu punktów.
 */
export default function MapRealPath({ points, nodeStatus }) {
  if (!points || points.length < 2) return null

  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')

  // Użyj statusu z nodeStatus (zawsze available — ścieżki są zawsze widoczne)
  const color = STATUS_COLORS.available

  return (
    <path
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity={0.5}
      strokeDasharray="6 4"
    />
  )
}
