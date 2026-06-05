import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import MapCharacter from './MapCharacter'
import MapGlobe from './MapGlobe'
import MapNodeModal from './MapNodeModal'
import useMapState from './useMapState'
import MapRealPath from './MapRealPath'
import {
  ALL_AREA_IDS, NODE_TO_AREA, ALL_NODE_IDS, STAGE_GROUPS, REAL_PATHS,
  START_NODE, hitTest, getCharPosition, getAllPolygons, findPathWaypoints,
} from '../data/mapNodes'
import tloImg from '../assets/map/tlo.png'

const MAP_WIDTH = 784
const MAP_HEIGHT = 1360

export default function DashboardMap({ meta, campId, mapState: initialMapState, onStateChange }) {
  const navigate = useNavigate()
  const { nodeStatus, setNodeStatus, getMapState } = useMapState(initialMapState, meta)

  const [selectedNode, setSelectedNode] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [scale, setScale] = useState(1)
  const [hoveredArea, setHoveredArea] = useState(null)
  const [walking, setWalking] = useState(false)
  const [waypoints, setWaypoints] = useState(null)

  const hasLocation = nodeStatus['0.1'] === 'done'
  const charNodeId = initialMapState?.character_position?.node_id || (hasLocation ? START_NODE : '0.1')
  const charPos = getCharPosition(charNodeId)
  const currentAreaId = NODE_TO_AREA[charNodeId] || charNodeId

  // Kompletność etapów
  const stageComplete = {}
  for (const [stage, nodes] of Object.entries(STAGE_GROUPS)) {
    stageComplete[stage] = nodes.every(nid => nodeStatus[nid] === 'done')
  }

  const notifyStateChange = useCallback((newMapState) => {
    if (onStateChange) onStateChange(newMapState)
  }, [onStateChange])

  const findArea = useCallback((svgX, svgY) => {
    for (const areaId of ALL_AREA_IDS) {
      if (hitTest(areaId, svgX, svgY)) return areaId
    }
    return null
  }, [])

  const w = MAP_WIDTH * scale
  const h = MAP_HEIGHT * scale

  const toMapCoords = useCallback((e) => {
    const svg = e.currentTarget
    const rect = svg.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * w / scale
    const y = ((e.clientY - rect.top) / rect.height) * h / scale
    return { x, y }
  }, [scale, w, h])

  const handleMapClick = (e) => {
    if (walking) return
    const { x, y } = toMapCoords(e)
    const areaId = findArea(x, y)
    if (!areaId) return
    let nodeId = areaId
    for (const [nid, aid] of Object.entries(NODE_TO_AREA)) {
      if (aid === areaId) { nodeId = nid; break }
    }
    const targetAreaId = NODE_TO_AREA[nodeId] || nodeId
    const wps = findPathWaypoints(currentAreaId, targetAreaId)

    // Jeśli brak ścieżki lub stoimy już na miejscu — pokaż modal od razu
    if (!wps || wps.length === 0 || (wps.length === 1 && Math.hypot(wps[0].x - charPos.x, wps[0].y - charPos.y) < 5)) {
      setNodeStatus(nodeId, nodeStatus[nodeId])
      const updated = getMapState()
      notifyStateChange({ ...updated, character_position: { node_id: nodeId } })
      setSelectedNode(nodeId)
      setShowModal(true)
      return
    }

    setWalking(true)
    setWaypoints(wps)
    setSelectedNode(nodeId)
  }

  const handleArrive = () => {
    if (selectedNode) {
      setWalking(false)
      setWaypoints(null)
      setNodeStatus(selectedNode, nodeStatus[selectedNode])
      const updated = getMapState()
      notifyStateChange({ ...updated, character_position: { node_id: selectedNode } })
      setShowModal(true)
    }
  }

  const handleMapMove = (e) => {
    const { x, y } = toMapCoords(e)
    const areaId = findArea(x, y)
    if (areaId !== hoveredArea) setHoveredArea(areaId)
  }

  const handleDone = (nodeId) => {
    setNodeStatus(nodeId, 'done')
    const updated = getMapState()
    notifyStateChange({ ...updated, nodes: { ...(updated.nodes || {}), [nodeId]: 'done' }, character_position: { node_id: nodeId } })
  }

  const handleNavigate = (path) => { setShowModal(false); navigate(`/${campId}${path}`) }
  const handleChooseLocation = () => navigate(`/${campId}/before/camp`)

  if (!hasLocation) return <MapGlobe onChooseLocation={handleChooseLocation} />

  // Mapowanie node ID → stage (do tytułu w modalu)
  const nodeStage = {}
  for (const [stage, nodes] of Object.entries(STAGE_GROUPS)) {
    for (const nid of nodes) nodeStage[nid] = stage
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-100">
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between shrink-0">
        <h2 className="font-bold text-gray-800">🗺️ Organizacja obozu</h2>
        <div className="flex items-center gap-2">
          <button onClick={() => setScale(s => Math.min(3, +(s + 0.3).toFixed(1)))} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-sm font-bold">+</button>
          <button onClick={() => setScale(s => Math.max(0.3, +(s - 0.3).toFixed(1)))} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-sm font-bold">−</button>
          <span className="text-xs text-gray-400">{Math.round(scale * 100)}%</span>
        </div>
      </div>

      <div className="flex-1 overflow-auto relative">
        <div style={{ width: w, height: h, position: 'relative' }}>
          <img src={tloImg} alt="Mapa organizacji obozu" style={{ width: '100%', height: '100%', display: 'block', pointerEvents: 'none' }} />

          <svg
            viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
            width={w} height={h}
            style={{ position: 'absolute', top: 0, left: 0 }}
            onClick={handleMapClick}
            onMouseMove={handleMapMove}
            onMouseLeave={() => setHoveredArea(null)}
          >
            {/* Ścieżki */}
            {REAL_PATHS.map((p, i) => (
              <MapRealPath key={p.id || i} points={p.points} nodeStatus={nodeStatus} />
            ))}

            {/* Obszary klikalne */}
            {ALL_AREA_IDS.map(areaId => {
              const polys = getAllPolygons(areaId)
              if (!polys || polys.length === 0) return null
              let nodeId = areaId
              for (const [nid, aid] of Object.entries(NODE_TO_AREA)) { if (aid === areaId) { nodeId = nid; break } }
              const isDone = nodeStatus[nodeId] === 'done'
              const isLocked = nodeStatus[nodeId] === 'locked'
              const isHovered = hoveredArea === areaId
              // Stage completion border
              const stage = nodeStage[nodeId]
              const stageDone = stage != null ? stageComplete[stage] : false
              return polys.map((poly, pi) => {
                const pts = poly.map(p => `${p.x},${p.y}`).join(' ')
                return (
                  <polygon
                    key={`${areaId}-${pi}`}
                    points={pts}
                    fill={isHovered ? (isDone ? 'rgba(34,197,94,0.25)' : isLocked ? 'rgba(156,163,175,0.1)' : 'rgba(59,130,246,0.2)') : (stageDone ? 'rgba(34,197,94,0.08)' : 'transparent')}
                    stroke={stageDone && !isHovered ? '#22c55e' : isHovered ? (isDone ? '#22c55e' : isLocked ? '#9ca3af' : '#3b82f6') : 'none'}
                    strokeWidth={stageDone && !isHovered ? 1.5 : isHovered ? 2 : 0}
                    strokeDasharray={stageDone && !isHovered ? '6 3' : 'none'}
                    style={{ transition: 'fill 0.2s, stroke 0.2s' }}
                  />
                )
              })
            })}

            {/* Ludzik z płynną animacją po ścieżce */}
            <MapCharacter x={charPos.x} y={charPos.y} waypoints={waypoints} onArrive={handleArrive} />
          </svg>
        </div>
      </div>

      <div className="bg-white border-t border-gray-200 px-4 py-2 flex items-center gap-4 text-xs shrink-0">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-gray-400 inline-block" /> Zablokowane</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-500 inline-block" /> Dostępne</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500 inline-block" /> Wykonane</span>
        <span className="flex items-center gap-1 ml-4"><span className="w-3 h-3 border border-dashed border-green-500 inline-block" style={{ width: 12, height: 12 }} /> Etap ukończony</span>
      </div>

      {showModal && selectedNode && (
        <MapNodeModal
          nodeId={selectedNode}
          status={nodeStatus[selectedNode]}
          meta={meta}
          stage={nodeStage[selectedNode]}
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
