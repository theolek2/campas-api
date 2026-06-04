import { useState, useCallback, useMemo } from 'react'
import {
  DEPENDENCIES, AUTO_CHECK, FINAL_NODE, MAP_COORDS, NODE_RADIUS,
} from '../data/mapNodes'

/**
 * useMapState — zarządza stanem mapy.
 * mapState = { nodes: { "1.1": "done" }, character_position: { node_id: "1.1" } }
 */
export default function useMapState(initialMapState, meta) {
  const [mapState, setMapState] = useState(() => ({
    nodes: {},
    character_position: { node_id: '0.1' },
    ...initialMapState,
  }))

  // Oblicz status każdego węzła na podstawie mapState.nodes i auto-check
  const nodeStatus = useMemo(() => {
    const status = {}
    const allNodeIds = Object.keys(MAP_COORDS)

    // Inicjalnie wszystkie na locked
    allNodeIds.forEach(id => { status[id] = 'locked' })

    // ETAP 0 zawsze available
    status['0.1'] = 'available'

    // Auto-check
    for (const [id, fn] of Object.entries(AUTO_CHECK)) {
      if (fn(meta)) {
        status[id] = 'done'
      } else {
        status[id] = 'available'
      }
    }

    // Manualne statusy z mapState
    for (const [id, s] of Object.entries(mapState.nodes || {})) {
      if (s === 'done') status[id] = 'done'
      else if (s === 'available' && status[id] !== 'done') status[id] = 'available'
    }

    // Sprawdź zależności — dostępne tylko jeśli wszystkie wymagane są done
    for (const [id, deps] of Object.entries(DEPENDENCIES)) {
      if (status[id] !== 'done') {
        const allDepsDone = deps.every(dep => status[dep] === 'done')
        if (allDepsDone && status[id] !== 'done') {
          status[id] = 'available'
        } else if (!allDepsDone) {
          status[id] = 'locked'
        }
      }
    }

    // 6.4 (finał) — automatycznie done gdy wszystkie inne done
    const allOthers = Object.keys(MAP_COORDS).filter(k => k !== FINAL_NODE)
    if (allOthers.every(k => status[k] === 'done')) {
      status[FINAL_NODE] = 'done'
    }

    return status
  }, [mapState, meta])

  // Aktualna pozycja postaci
  const charPosition = useMemo(() => {
    const nodeId = mapState.character_position?.node_id || '0.1'
    return MAP_COORDS[nodeId] || { x: 1000, y: 200 }
  }, [mapState.character_position])

  // Ustaw status węzła
  const setNodeStatus = useCallback((nodeId, newStatus) => {
    setMapState(prev => ({
      ...prev,
      nodes: { ...(prev.nodes || {}), [nodeId]: newStatus },
      character_position: { node_id: newStatus === 'done' ? nodeId : prev.character_position?.node_id || nodeId },
    }))
  }, [])

  // Sprawdź czy ścieżka była odwiedzona (oba końce dostępne/done)
  const isPathActive = useCallback((fromId, toId) => {
    const fromStatus = nodeStatus[fromId] || 'locked'
    const toStatus = nodeStatus[toId] || 'locked'
    return fromStatus !== 'locked' || toStatus !== 'locked'
  }, [nodeStatus])

  const isPathDone = useCallback((fromId, toId) => {
    const fromStatus = nodeStatus[fromId] || 'locked'
    const toStatus = nodeStatus[toId] || 'locked'
    return fromStatus === 'done' && toStatus === 'done'
  }, [nodeStatus])

  // Zwróć mapState do zapisu
  const getMapState = useCallback(() => mapState, [mapState])

  return {
    nodeStatus,
    charPosition,
    setNodeStatus,
    isPathActive,
    isPathDone,
    getMapState,
    mapState,
    setMapState,
  }
}
