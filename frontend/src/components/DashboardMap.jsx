import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import MapCharacter from './MapCharacter'
import MapPath from './MapPath'
import MapGlobe from './MapGlobe'
import MapNodeModal from './MapNodeModal'
import useMapState from './useMapState'
import {
  MAP_COORDS, PATHS, NODE_LABELS, NODE_ICONS, NODE_RADIUS,
  START_NODE, STATUS_COLORS,
} from '../data/mapNodes'
import tloImg from '../assets/map/tlo.png'

const MAP_IMAGE = tloImg
const MAP_WIDTH = 2000
const MAP_HEIGHT = 3500

/**
 * DashboardMap — główny komponent interaktywnej mapy organizacji obozu.
 */
export default function DashboardMap({ meta, campId, mapState: initialMapState, onStateChange }) {
  const navigate = useNavigate()
  const { nodeStatus, charPosition, setNodeStatus, isPathActive, isPathDone, getMapState } =
    useMapState(initialMapState, meta)

  const [selectedNode, setSelectedNode] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [scale, setScale] = useState(1)

  const hasLocation = nodeStatus['0.1'] === 'done'
  const charNodeId = initialMapState?.character_position?.node_id || (hasLocation ? START_NODE : '0.1')

  // Zapisz stan po zmianie
  const notifyStateChange = useCallback((newMapState) => {
    if (onStateChange) onStateChange(newMapState)
  }, [onStateChange])

  const handleNodeClick = (nodeId) => {
    const status = nodeStatus[nodeId]
    if (status === 'locked') return
    setSelectedNode(nodeId)
    setShowModal(true)
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

  // ViewBox dopasowany do skali
  const vbW = MAP_WIDTH / scale
  const vbH = MAP_HEIGHT / scale
  const vbX = 0
  const vbY = 0

  if (!hasLocation) {
    return <MapGlobe onChooseLocation={handleChooseLocation} />
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-100">
      {/* Pasek narzędzi */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between shrink-0">
        <h2 className="font-bold text-gray-800">🗺️ Organizacja obozu</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setScale(s => Math.min(3, s + 0.3))}
            className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-sm font-bold"
            title="Przybliż"
          >+</button>
          <button
            onClick={() => setScale(s => Math.max(0.5, s - 0.3))}
            className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-sm font-bold"
            title="Oddal"
          >−</button>
          <span className="text-xs text-gray-400">{Math.round(scale * 100)}%</span>
        </div>
      </div>

      {/* Mapa SVG */}
      <div className="flex-1 overflow-auto">
        <svg
          viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`}
          className="w-full"
          style={{ minHeight: '100%', background: '#f0f4e8' }}
        >
          {/* Tło mapy */}
          <image
            href={MAP_IMAGE}
            x={0} y={0}
            width={MAP_WIDTH} height={MAP_HEIGHT}
            preserveAspectRatio="xMidYMid slice"
          />

          {/* Ścieżki */}
          {PATHS.map(([fromId, toId], i) => {
            const active = isPathActive(fromId, toId)
            const done = isPathDone(fromId, toId)
            const status = done ? 'done' : active ? 'available' : 'locked'
            return <MapPath key={`${fromId}-${toId}-${i}`} fromId={fromId} toId={toId} status={status} />
          })}

          {/* Węzły */}
          {Object.entries(MAP_COORDS).map(([id, pos]) => {
            const status = nodeStatus[id]
            if (!status) return null
            const isLocked = status === 'locked'
            const isDone = status === 'done'
            const icon = NODE_ICONS[id] || '📍'
            const label = NODE_LABELS[id]

            return (
              <g
                key={id}
                onClick={() => handleNodeClick(id)}
                className="cursor-pointer"
                style={{ opacity: isLocked ? 0.4 : 1, transition: 'opacity 0.3s' }}
              >
                {/* Pierścień zewnętrzny */}
                <circle
                  cx={pos.x} cy={pos.y}
                  r={NODE_RADIUS + 4}
                  fill="white"
                  stroke={isDone ? STATUS_COLORS.done : isLocked ? STATUS_COLORS.locked : STATUS_COLORS.available}
                  strokeWidth={3}
                  style={{
                    animation: status === 'available' && !isDone ? 'pulse 2s infinite' : 'none',
                  }}
                />
                {/* Tło ikony */}
                <circle
                  cx={pos.x} cy={pos.y}
                  r={NODE_RADIUS}
                  fill={isDone ? '#dcfce7' : isLocked ? '#f3f4f6' : '#eff6ff'}
                />
                {/* Ikona */}
                <text
                  x={pos.x} y={pos.y + 8}
                  textAnchor="middle"
                  fontSize={24}
                  style={{ userSelect: 'none' }}
                >
                  {isDone ? '✅' : icon}
                </text>
                {/* Etykieta */}
                {label && (
                  <text
                    x={pos.x} y={pos.y + NODE_RADIUS + 18}
                    textAnchor="middle"
                    fontSize={13}
                    fontWeight={600}
                    fill={isLocked ? '#9ca3af' : '#374151'}
                    style={{ userSelect: 'none' }}
                  >
                    {label}
                  </text>
                )}
              </g>
            )
          })}

          {/* Ludzik na ostatniej pozycji */}
          <MapCharacter nodeId={charNodeId} />
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
        />
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { stroke-opacity: 0.6; stroke-width: 3; }
          50% { stroke-opacity: 1; stroke-width: 5; }
        }
      `}</style>
    </div>
  )
}
