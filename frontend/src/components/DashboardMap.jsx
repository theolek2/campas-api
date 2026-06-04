import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import MapCharacter from './MapCharacter'
import MapGlobe from './MapGlobe'
import MapNodeModal from './MapNodeModal'
import useMapState from './useMapState'
import MapRealPath from './MapRealPath'
import {
  NODE_AREAS, REAL_PATHS, ALL_AREA_IDS, NODE_TO_AREA, ALL_NODE_IDS,
  START_NODE, hitTest, getCharPosition, STATUS_COLORS,
} from '../data/mapNodes'
import tloImg from '../assets/map/tlo.png'

const MAP_WIDTH = 2000
const MAP_HEIGHT = 3500

/**
 * DashboardMap — interaktywna mapa z klikalnymi, niewidocznymi obszarami.
 */
export default function DashboardMap({ meta, campId, mapState: initialMapState, onStateChange }) {
  const navigate = useNavigate()
  const { nodeStatus, charPosition, setNodeStatus, getMapState } =
    useMapState(initialMapState, meta)

  const [selectedNode, setSelectedNode] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [scale, setScale] = useState(1)
  const [hoveredArea, setHoveredArea] = useState(null)

  const hasLocation = nodeStatus['0.1'] === 'done'
  const charNodeId = initialMapState?.character_position?.node_id || (hasLocation ? START_NODE : '0.1')
  const charPos = getCharPosition(charNodeId)

  const notifyStateChange = useCallback((newMapState) => {
    if (onStateChange) onStateChange(newMapState)
  }, [onStateChange])

  // Znajdź obszar pod kursorem
  const findArea = useCallback((svgX, svgY) => {
    for (const areaId of ALL_AREA_IDS) {
      if (hitTest(areaId, svgX, svgY)) return areaId
    }
    return null
  }, [])

  const handleMapClick = (e) => {
    const svg = e.currentTarget
    const rect = svg.getBoundingClientRect()
    const scaleX = MAP_WIDTH / rect.width
    const scaleY = MAP_HEIGHT / rect.height
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY

    const areaId = findArea(x, y)
    if (!areaId) return

    // Znajdź odpowiedni node ID (pierwszy pasujący)
    let nodeId = areaId
    for (const [nid, aid] of Object.entries(NODE_TO_AREA)) {
      if (aid === areaId) { nodeId = nid; break }
    }

    const status = nodeStatus[nodeId]
    if (status === 'locked') return

    setSelectedNode(nodeId)
    setShowModal(true)
  }

  const handleMapMove = (e) => {
    const svg = e.currentTarget
    const rect = svg.getBoundingClientRect()
    const scaleX = MAP_WIDTH / rect.width
    const scaleY = MAP_HEIGHT / rect.height
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY
    const areaId = findArea(x, y)
    if (areaId !== hoveredArea) {
      setHoveredArea(areaId)
    }
  }

  const handleDone = (nodeId) => {
    setNodeStatus(nodeId, 'done')
    const updated = getMapState()
    notifyStateChange({
      ...updated,
      nodes: { ...(updated.nodes || {}), [nodeId]: 'done' },
      character_position: { node_id: nodeId },
    })
  }

  const handleNavigate = (path) => {
    setShowModal(false)
    navigate(`/${campId}${path}`)
  }

  const handleChooseLocation = () => {
    navigate(`/${campId}/before/camp`)
  }

  if (!hasLocation) {
    return <MapGlobe onChooseLocation={handleChooseLocation} />
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-100">
      {/* Pasek narzędzi */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between shrink-0">
        <h2 className="font-bold text-gray-800">🗺️ Organizacja obozu</h2>
        <div className="flex items-center gap-2">
          <button onClick={() => setScale(s => Math.min(3, s + 0.3))} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-sm font-bold" title="Przybliż">+</button>
          <button onClick={() => setScale(s => Math.max(0.5, s - 0.3))} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-sm font-bold" title="Oddal">−</button>
          <span className="text-xs text-gray-400">{Math.round(scale * 100)}%</span>
        </div>
      </div>

      {/* SVG */}
      <div className="flex-1 overflow-auto">
        <svg
          viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
          className="w-full cursor-crosshair"
          style={{ background: '#f0f4e8' }}
          onClick={handleMapClick}
          onMouseMove={handleMapMove}
          onMouseLeave={() => setHoveredArea(null)}
        >
          {/* Tło */}
          <image href={tloImg} x={0} y={0} width={MAP_WIDTH} height={MAP_HEIGHT} />

          {/* Ścieżki */}
          {REAL_PATHS.map((p, i) => (
            <MapRealPath key={p.id || i} points={p.points} nodeStatus={nodeStatus} />
          ))}

          {/* Obszary klikalne (przezroczyste) */}
          {ALL_AREA_IDS.map(areaId => {
            const poly = NODE_AREAS[areaId]
            if (!poly) return null
            let nodeId = areaId
            for (const [nid, aid] of Object.entries(NODE_TO_AREA)) { if (aid === areaId) { nodeId = nid; break } }
            const isDone = nodeStatus[nodeId] === 'done'
            const isLocked = nodeStatus[nodeId] === 'locked'
            const isHovered = hoveredArea === areaId
            const pts = poly.map(p => `${p.x},${p.y}`).join(' ')
            return (
              <polygon
                key={areaId}
                points={pts}
                fill={isHovered ? (isDone ? 'rgba(34,197,94,0.25)' : isLocked ? 'rgba(156,163,175,0.1)' : 'rgba(59,130,246,0.2)') : 'transparent'}
                stroke={isHovered ? (isDone ? '#22c55e' : isLocked ? '#9ca3af' : '#3b82f6') : 'none'}
                strokeWidth={isHovered ? 2 : 0}
                style={{ transition: 'fill 0.2s, stroke 0.2s' }}
              />
            )
          })}

          {/* Ludzik */}
          <MapCharacter x={charPos.x} y={charPos.y} />
        </svg>
      </div>

      {/* Legenda */}
      <div className="bg-white border-t border-gray-200 px-4 py-2 flex items-center gap-4 text-xs shrink-0">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-gray-400 inline-block" /> Zablokowane</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-500 inline-block" /> Dostępne</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500 inline-block" /> Wykonane</span>
      </div>

      {/* Modal */}
      {showModal && selectedNode && (
        <MapNodeModal
          nodeId={selectedNode}
          status={nodeStatus[selectedNode]}
          meta={meta}
          onClose={() => setShowModal(false)}
          onDone={handleDone}
          onNavigate={handleNavigate}
          allNodeIds={ALL_NODE_IDS}
          nodeStatus={nodeStatus}
          onSelectNode={setSelectedNode}
        />
      )}
    </div>
  )
}
