import { useRef, useState, useCallback, useEffect } from 'react'

const BASE_PX = 48

export default function MapEditor({
  mapImageUrl, items, selected,
  onPlace, onUpdate, onDelete,
  coords, locationName,
  paths, onAddPath,
  paintMode, paintColor,
  mapRotation = 0,
}) {
  const containerRef  = useRef(null)
  const [activeId, setActiveId] = useState(null)
  const [drag, setDrag]         = useState(null)
  // Malowanie
  const [drawing, setDrawing]   = useState(false)
  const [currentPts, setCurrentPts] = useState([])

  const getRect = () => containerRef.current?.getBoundingClientRect() || { left:0,top:0,width:1,height:1 }

  const toRel = (clientX, clientY) => {
    const r = getRect()
    return { x: (clientX - r.left) / r.width * 100, y: (clientY - r.top) / r.height * 100 }
  }

  // ── Global events ─────────────────────────────────────────────────────────
  const onMouseMove = useCallback((e) => {
    if (drawing) {
      const pt = toRel(e.clientX, e.clientY)
      setCurrentPts(prev => [...prev, pt])
      return
    }
    if (!drag) return
    const r = getRect()
    if (drag.type === 'move') {
      const dx = (e.clientX - drag.startX) / r.width  * 100
      const dy = (e.clientY - drag.startY) / r.height * 100
      onUpdate(drag.id, { x: Math.max(0,Math.min(100,drag.ox+dx)), y: Math.max(0,Math.min(100,drag.oy+dy)) })
    }
    if (drag.type === 'resize') {
      const item = items.find(i=>i.id===drag.id); if (!item) return
      const cx = r.left + item.x/100*r.width, cy = r.top + item.y/100*r.height
      const d = Math.sqrt((e.clientX-cx)**2+(e.clientY-cy)**2)
      onUpdate(drag.id, { size: parseFloat(Math.max(0.3,Math.min(5,d/drag.baseDist*drag.origSize)).toFixed(2)) })
    }
    if (drag.type === 'stretchX') {
      const item = items.find(i=>i.id===drag.id); if (!item) return
      const dx = (e.clientX - drag.startX) / r.width * 100
      const newSX = Math.max(0.2, Math.min(8, drag.origSX + dx * drag.dir * 0.05))
      onUpdate(drag.id, { scaleX: parseFloat(newSX.toFixed(2)) })
    }
    if (drag.type === 'stretchY') {
      const item = items.find(i=>i.id===drag.id); if (!item) return
      const dy = (e.clientY - drag.startY) / r.height * 100
      const newSY = Math.max(0.2, Math.min(8, drag.origSY + dy * drag.dir * 0.05))
      onUpdate(drag.id, { scaleY: parseFloat(newSY.toFixed(2)) })
    }
    if (drag.type === 'rotate') {
      const item = items.find(i=>i.id===drag.id); if (!item) return
      const cx = r.left + item.x/100*r.width, cy = r.top + item.y/100*r.height
      onUpdate(drag.id, { rotation: Math.round(Math.atan2(e.clientY-cy,e.clientX-cx)*180/Math.PI+90) % 360 })
    }
  }, [drawing, drag, items, onUpdate])

  const onMouseUp = useCallback(() => {
    if (drawing && currentPts.length > 1) {
      onAddPath({ id: `path_${Date.now()}`, color: paintColor, pts: currentPts, width: 3 })
    }
    setDrawing(false)
    setCurrentPts([])
    setDrag(null)
  }, [drawing, currentPts, onAddPath, paintColor])

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup',   onMouseUp)
    return () => { window.removeEventListener('mousemove',onMouseMove); window.removeEventListener('mouseup',onMouseUp) }
  }, [onMouseMove, onMouseUp])

  // ── Klik mapa ─────────────────────────────────────────────────────────────
  const handleMapClick = (e) => {
    if (drag || drawing) return
    if (activeId) { setActiveId(null); return }
    if (!selected || paintMode) return
    const { x, y } = toRel(e.clientX, e.clientY)
    onPlace(x, y)
  }

  const handleMapMouseDown = (e) => {
    if (paintMode) {
      setDrawing(true)
      setCurrentPts([toRel(e.clientX, e.clientY)])
    }
  }

  const startMove = (e,item) => { e.stopPropagation(); const r=getRect(); setDrag({type:'move',id:item.id,startX:e.clientX,startY:e.clientY,ox:item.x,oy:item.y,W:r.width,H:r.height}) }
  const startResize = (e,item) => { e.stopPropagation(); e.preventDefault(); const r=getRect(); const cx=r.left+item.x/100*r.width,cy=r.top+item.y/100*r.height; const d=Math.sqrt((e.clientX-cx)**2+(e.clientY-cy)**2); setDrag({type:'resize',id:item.id,baseDist:d||1,origSize:item.size||1}) }
  const startRotate = (e,item) => { e.stopPropagation(); e.preventDefault(); setDrag({type:'rotate',id:item.id}) }
  const startStretchX = (e,item,dir) => { e.stopPropagation(); e.preventDefault(); setDrag({type:'stretchX',id:item.id,startX:e.clientX,origSX:item.scaleX||1,dir}) }
  const startStretchY = (e,item,dir) => { e.stopPropagation(); e.preventDefault(); setDrag({type:'stretchY',id:item.id,startY:e.clientY,origSY:item.scaleY||1,dir}) }

  // ── Render SVG paths ──────────────────────────────────────────────────────
  const renderPaths = (allPaths, extraPts, extraColor) => (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{zIndex:50}} preserveAspectRatio="none" viewBox="0 0 100 100">
      {allPaths.map(p => (
        <polyline key={p.id}
          points={p.pts.map(pt=>`${pt.x},${pt.y}`).join(' ')}
          fill="none" stroke={p.color} strokeWidth={p.width || 3}
          strokeLinecap="round" strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      ))}
      {extraPts.length > 1 && (
        <polyline
          points={extraPts.map(pt=>`${pt.x},${pt.y}`).join(' ')}
          fill="none" stroke={extraColor} strokeWidth={3}
          strokeLinecap="round" strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      )}
    </svg>
  )

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-4 px-3 py-2 bg-gray-800 text-white text-xs shrink-0">
        <span>📍 <b>{locationName||'—'}</b></span>
        {coords && <span className="text-gray-400">{coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}</span>}
        <span className="ml-auto text-gray-400">
          {paintMode ? '🖌️ Tryb malowania — kliknij i ciągnij aby rysować'
            : activeId ? 'Narożniki=skala · ↻=rotacja · ✓Opis=etykieta'
            : selected ? `Kliknij mapę: ${selected.label || ''}` : 'Wybierz piktogram z lewego panelu'}
        </span>
      </div>

      <div ref={containerRef}
        className="flex-1 relative overflow-hidden"
        style={{ cursor: paintMode ? 'crosshair' : selected && !activeId ? 'crosshair' : 'default', userSelect:'none' }}
        onClick={handleMapClick}
        onMouseDown={handleMapMouseDown}
      >
        {/* Obracalna zawartość mapy */}
        <div style={{
          position: 'absolute', inset: 0,
          transform: `rotate(${mapRotation}deg)`,
          transformOrigin: 'center center',
          transition: 'transform 0.3s ease',
        }}>
          {mapImageUrl
            ? <img src={mapImageUrl} alt="mapa" style={{width:'100%',height:'100%',objectFit:'fill'}} crossOrigin="anonymous" draggable={false}/>
            : <div className="absolute inset-0 bg-gray-200 flex items-center justify-center text-gray-500">Ładowanie mapy...</div>}
          {renderPaths(paths||[], currentPts, paintColor)}
        </div>

        {/* Piktogramy (nie obracają się z mapą — zostają na stałych pozycjach) */}
        {!paintMode && items.map(item => {
          const isActive = activeId === item.id
          const sz = (item.size||1) * BASE_PX
          const isArrow = item.type === 'arrow'
          const imgSrc = (item.type==='icon' && item.icon) || (item.type==='custom' && item.imageUrl)

          return (
            <div key={item.id} className="absolute"
              style={{ left:`${item.x}%`, top:`${item.y}%`, transform:'translate(-50%,-50%)', zIndex:isActive?200:10,
                cursor: drag?.id===item.id&&drag?.type==='move' ? 'grabbing' : 'grab' }}
              onClick={e=>{ e.stopPropagation(); setActiveId(p=>p===item.id?null:item.id) }}
              onMouseDown={e=>isActive&&startMove(e,item)}
            >
              {/* Pasek akcji */}
              {isActive && (
                <div onClick={e=>e.stopPropagation()} style={{
                  position:'absolute', bottom:`calc(100% + ${sz/2+8}px)`, left:'50%', transform:'translateX(-50%)',
                  background:'white', border:'1px solid #e5e7eb', borderRadius:10, boxShadow:'0 2px 8px rgba(0,0,0,.15)',
                  padding:'4px 8px', display:'flex', gap:6, alignItems:'center', whiteSpace:'nowrap', zIndex:400,
                }}>
                  {/* Edycja etykiety */}
                  <input
                    value={item.label||''}
                    onChange={e=>onUpdate(item.id,{label:e.target.value})}
                    placeholder="Opis punktu..."
                    style={{border:'1px solid #d1d5db',borderRadius:6,padding:'2px 6px',fontSize:11,width:130,outline:'none'}}
                  />
                  <label style={{display:'flex',alignItems:'center',gap:3,fontSize:11,cursor:'pointer',color:'#555'}}>
                    <input type="checkbox" checked={item.showLabel!==false}
                      onChange={e=>onUpdate(item.id,{showLabel:e.target.checked})} style={{width:12,height:12}}/>
                    Pokaż
                  </label>
                  <div style={{width:1,background:'#e5e7eb',height:16}}/>
                  {item.rotation!==undefined && <span style={{fontSize:10,color:'#888',minWidth:28,textAlign:'center'}}>{item.rotation||0}°</span>}
                  <button onClick={e=>{e.stopPropagation();setActiveId(null);onDelete(item.id)}}
                    style={{background:'#fee2e2',color:'#dc2626',border:'none',borderRadius:6,padding:'2px 8px',cursor:'pointer',fontWeight:700,fontSize:13}}>×</button>
                </div>
              )}

              {/* Symbol */}
              <div style={{ position:'relative', display:'inline-flex', flexDirection:'column', alignItems:'center',
                outline:isActive?'2px dashed #3b82f6':'none', outlineOffset:4, borderRadius:4, padding:2 }}>
                {imgSrc
                  ? <img src={imgSrc} alt={item.label} draggable={false}
                      style={{ width:sz, height:sz, objectFit:'contain', filter:'drop-shadow(1px 1px 2px rgba(0,0,0,.5))',
                        transform:`rotate(${item.rotation||0}deg)` }} />
                  : isArrow
                    ? <svg viewBox="0 0 24 24" style={{ width:sz*(item.scaleX||1), height:sz*(item.scaleY||1), display:'block',
                        filter:'drop-shadow(1px 1px 2px rgba(0,0,0,.5))',
                        transform:`rotate(${item.rotation||0}deg)`,
                        transformOrigin:'center center' }}>
                        <path fill={item.color||'#ef4444'} d="M12 2L4 10h5v12h6V10h5z"/>
                      </svg>
                    : <span style={{ fontSize:sz, lineHeight:1, display:'inline-block',
                        color:item.color, filter:'drop-shadow(1px 1px 2px rgba(0,0,0,.5))',
                        transform:`rotate(${item.rotation||0}deg)` }}>{item.emoji}</span>
                }
                {item.showLabel!==false && item.label && (
                  <span style={{ marginTop:2, padding:'1px 5px', background:'rgba(255,255,255,.92)',
                    color:'#111', fontSize:Math.max(9,sz*.28), fontWeight:700, borderRadius:3,
                    whiteSpace:'nowrap', boxShadow:'0 1px 3px rgba(0,0,0,.3)' }}>{item.label}</span>
                )}
              </div>

              {/* Uchwyty */}
              {isActive && (() => {
                const half = sz/2+4
                return <>
                  {[[-1,-1],[1,-1],[1,1],[-1,1]].map(([cx,cy],i)=>(
                    <div key={`c${i}`} onMouseDown={e=>startResize(e,item)} style={{
                      position:'absolute', left:`calc(50% + ${cx*half}px)`, top:`calc(50% + ${cy*half}px)`,
                      transform:'translate(-50%,-50%)', width:12, height:12,
                      background:'white', border:'2px solid #3b82f6', borderRadius:'50%', cursor:'nwse-resize', zIndex:300 }}/>
                  ))}
                  {[[0,-1],[1,0],[0,1],[-1,0]].map(([cx,cy],i)=>(
                    <div key={`e${i}`} onMouseDown={e=>startResize(e,item)} style={{
                      position:'absolute', left:`calc(50% + ${cx*half}px)`, top:`calc(50% + ${cy*half}px)`,
                      transform:'translate(-50%,-50%)', width:10, height:10,
                      background:'white', border:'2px solid #3b82f6', borderRadius:2,
                      cursor:cx===0?'ns-resize':'ew-resize', zIndex:300 }}/>
                  ))}
                  <div onMouseDown={e=>startRotate(e,item)} title="Obróć" style={{
                    position:'absolute', left:'50%', top:`calc(50% - ${half+20}px)`,
                    transform:'translate(-50%,-50%)', width:16, height:16,
                    background:'#3b82f6', borderRadius:'50%', cursor:'grab', zIndex:300,
                    display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:10 }}>↻</div>

                  {/* Uchwyty rozciągania (tylko strzałki) */}
                  {isArrow && <>
                    {/* Lewa/prawa — scaleX */}
                    <div onMouseDown={e=>startStretchX(e,item,-1)} title="Rozciągnij ←"
                      style={{position:'absolute',left:`calc(50% - ${half}px)`,top:'50%',transform:'translate(-50%,-50%)',
                        width:14,height:20,background:'#f97316',borderRadius:3,cursor:'ew-resize',zIndex:300,opacity:.8}}/>
                    <div onMouseDown={e=>startStretchX(e,item,1)} title="Rozciągnij →"
                      style={{position:'absolute',left:`calc(50% + ${half}px)`,top:'50%',transform:'translate(-50%,-50%)',
                        width:14,height:20,background:'#f97316',borderRadius:3,cursor:'ew-resize',zIndex:300,opacity:.8}}/>
                    {/* Góra/dół — scaleY */}
                    <div onMouseDown={e=>startStretchY(e,item,-1)} title="Rozciągnij ↑"
                      style={{position:'absolute',left:'50%',top:`calc(50% - ${half}px)`,transform:'translate(-50%,-50%)',
                        width:20,height:14,background:'#f97316',borderRadius:3,cursor:'ns-resize',zIndex:300,opacity:.8}}/>
                    <div onMouseDown={e=>startStretchY(e,item,1)} title="Rozciągnij ↓"
                      style={{position:'absolute',left:'50%',top:`calc(50% + ${half}px)`,transform:'translate(-50%,-50%)',
                        width:20,height:14,background:'#f97316',borderRadius:3,cursor:'ns-resize',zIndex:300,opacity:.8}}/>
                  </>}
                </>
              })()}
            </div>
          )
        })}
      </div>
    </div>
  )
}
