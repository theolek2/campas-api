import { useState, useCallback, useMemo } from 'react'
import {
  DEPENDENCIES, AUTO_CHECK, FINAL_NODE, ALL_NODE_IDS,
} from '../data/mapNodes'

/**
 * useMapState — zarządza stanem mapy.
 */
export default function useMapState(initialMapState, meta) {
  const [mapState, setMapState] = useState(() => ({
    nodes: {},
    character_position: { node_id: '0.1' },
    ...initialMapState,
  }))

  const nodeStatus = useMemo(() => {
    const status = {}
    ALL_NODE_IDS.forEach(id => { status[id] = 'locked' })
    status['0.1'] = 'available'

    for (const [id, fn] of Object.entries(AUTO_CHECK)) {
      status[id] = fn(meta) ? 'done' : 'available'
    }

    for (const [id, s] of Object.entries(mapState.nodes || {})) {
      if (s === 'done') status[id] = 'done'
      else if (s === 'available' && status[id] !== 'done') status[id] = 'available'
    }

    for (const [id, deps] of Object.entries(DEPENDENCIES)) {
      if (status[id] !== 'done') {
        const allDepsDone = deps.every(dep => status[dep] === 'done')
        status[id] = allDepsDone ? 'available' : 'locked'
      }
    }

    const allOthers = ALL_NODE_IDS.filter(k => k !== FINAL_NODE)
    if (allOthers.every(k => status[k] === 'done')) {
      status[FINAL_NODE] = 'done'
    }

    return status
  }, [mapState, meta])

  const setNodeStatus = useCallback((nodeId, newStatus) => {
    setMapState(prev => ({
      ...prev,
      nodes: { ...(prev.nodes || {}), [nodeId]: newStatus },
      character_position: { node_id: nodeId },
    }))
  }, [])

  const getMapState = useCallback(() => mapState, [mapState])

  return { nodeStatus, setNodeStatus, getMapState, mapState, setMapState }
}
