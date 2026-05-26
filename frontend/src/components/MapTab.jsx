import { useState, useRef, useEffect, useCallback } from 'react'
import html2canvas from 'html2canvas'
import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import PictogramPanel from './map/PictogramPanel'
import MapEditor from './map/MapEditor'
import CampRegistrationModal from './CampRegistrationModal'
import { makePlacedItem, DEFAULT_ARROW_COLORS } from '../utils/mapPictograms'

// Dostawcy map — wszyscy darmowi, legalni, bez klucza API
const MAP_PROVIDERS = [
  {
    id: 'esri',
    name: '🛰️ Satelita (Esri)',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '© Esri',
    maxZoom: 19,
  },
  {
    id: 'topo',
    name: '🏔️ Topograficzna',
    url: 'https://tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '© OpenTopoMap, © OSM',
    maxZoom: 17,
  },
  {
    id: 'osm',
    name: '🗺️ Ulice (OSM)',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    subdomains: 'abc',
    attribution: '© OpenStreetMap',
    maxZoom: 19,
  },
  {
    id: 'carto',
    name: '🎨 Jasna (CartoDB)',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    subdomains: 'abcd',
    attribution: '© CartoDB, © OSM',
    maxZoom: 19,
  },
]

// Napraw domyślne ikony Leaflet w Vite
import L from 'leaflet'
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

function MapEventsCapture({ onReady }) {
  const map = useMapEvents({
    moveend: () => onReady(map),
    zoomend: () => onReady(map),
  })
  useEffect(() => { onReady(map) }, [])
  return null
}

// Nakładka pokazująca kadr PDF — czerwone tło poza obszarem wydruku
function CropOverlay({ ratio }) {
  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 500 }}>
      <svg
        width="100%" height="100%"
        style={{ position: 'absolute', inset: 0 }}
        preserveAspectRatio="none"
      >
        <defs>
          {/* Maska: biała = pokazuj tło, czarna = przezroczyste (kadr) */}
          <mask id="frame-mask">
            <rect width="100%" height="100%" fill="white" />
            {/* Kadr wyśrodkowany z proporcjami PDF */}
            <CropRect ratio={ratio} />
          </mask>
        </defs>
        {/* Czerwone tło maskowane — widoczne tylko POZA kadrem */}
        <rect width="100%" height="100%" fill="rgba(220,38,38,0.45)" mask="url(#frame-mask)" />
      </svg>
      {/* Biała ramka kadru */}
      <CropBorder ratio={ratio} />
    </div>
  )
}

// Renderuje prostokąt kadru jako czarną dziurę w masce SVG
function CropRect({ ratio }) {
  // Używamy foreignObject trick — liczymy przez CSS
  // Zamiast tego użyjemy viewBox i obliczeń procentowych
  // Kadr: wyśrodkowany, aspect-ratio = ratio
  // Jeśli kontener W×H: jeśli W/H > ratio → kadr W'=H*ratio, H'=H; else W'=W, H'=W/ratio
  // Wyrażamy przez SVG units (viewport = 1000×1000 dla wygody)
  const VW = 1000, VH = 1000
  let cw, ch
  if (VW / VH > ratio) { ch = VH; cw = VH * ratio }
  else { cw = VW; ch = VW / ratio }
  const cx = (VW - cw) / 2
  const cy = (VH - ch) / 2
  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} width="100%" height="100%" preserveAspectRatio="none" style={{position:'absolute',inset:0}}>
      <rect x={cx} y={cy} width={cw} height={ch} fill="black" />
    </svg>
  )
}

// Renderuje białą ramkę + label
function CropBorder({ ratio }) {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        aspectRatio: `${ratio}`,
        maxWidth: '100%',
        maxHeight: '100%',
        border: '2px dashed rgba(255,255,255,0.9)',
        boxShadow: '0 0 0 1px rgba(0,0,0,0.3)',
        position: 'relative',
      }}>
        <span style={{
          position: 'absolute', top: 6, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.6)', color: 'white', padding: '2px 10px',
          borderRadius: 4, fontSize: 11, whiteSpace: 'nowrap',
        }}>
          ✅ Ta strefa trafi do PDF
        </span>
        <span style={{
          position: 'absolute', bottom: 6, right: 8,
          background: 'rgba(220,38,38,0.8)', color: 'white', padding: '2px 8px',
          borderRadius: 4, fontSize: 10,
        }}>
          A4 poziomo
        </span>
      </div>
    </div>
  )
}

export default function MapTab({ user, meta }) {
  const [step, setStep] = useState('coords')   // 'coords' | 'navigate' | 'edit'
  const [coords, setCoords] = useState({ lat: '', lng: '' })
  const [locationName, setLocationName] = useState('')
  const [mapRef, setMapRef] = useState(null)
  const [mapImageUrl, setMapImageUrl] = useState(null)
  const [providerId, setProviderId] = useState(() => {
    try { return localStorage.getItem('skauting_map_provider') || 'esri' } catch { return 'esri' }
  })
  const [items, setItems] = useState([])
  const [selected, setSelected] = useState(null)
  const [arrowColors, setArrowColors] = useState(DEFAULT_ARROW_COLORS)
  const [customPictograms, setCustomPictograms] = useState([])
  const [paths, setPaths]           = useState([])
  const [paintMode, setPaintMode]   = useState(false)
  const [paintColor, setPaintColor] = useState('#ef4444')
  const [mapRotation, setMapRotation] = useState(0)
  const [showCampModal, setShowCampModal] = useState(false)
  const [showCampPrompt, setShowCampPrompt] = useState(false)
  const editorRef = useRef(null)

  const updateArrowColor = (id, label) =>
    setArrowColors(prev => prev.map(c => c.id === id ? { ...c, label } : c))

  // Walidacja współrzędnych
  const coordsOk = !isNaN(parseFloat(coords.lat)) && !isNaN(parseFloat(coords.lng))

  const handleStart = () => {
    if (!coordsOk) return
    setStep('navigate')
  }

  const handleGenerateMap = async () => {
    if (!mapRef) return
    // Screenshot mapy z aktualnie wybraną warstwą — zrób ZANIM zmienisz step
    try {
      await new Promise(r => setTimeout(r, 800))
      const canvas = await html2canvas(mapRef.getContainer(), {
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
      })
      setMapImageUrl(canvas.toDataURL())
    } catch (e) {
      console.warn('html2canvas failed, using fallback', e)
    }
    setStep('edit')
    // Zapytaj o dodanie na mapę kraju tylko jeśli obóz nie jest jeszcze zaplanowany
    if (!meta?.date_start) {
      setTimeout(() => setShowCampPrompt(true), 300)
    }
  }

  const handlePlace = (x, y) => {
    if (!selected) return
    const item = makePlacedItem({ ...selected, x, y })
    setItems(prev => [...prev, item])
    // Nie resetuj selected — pozwól wstawiać wiele
  }

  const handleUpdate = (id, patch) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...patch } : i))
  }

  const handleDelete = (id) => {
    setItems(prev => prev.filter(i => i.id !== id))
  }

  const handleExport = () => {
    const win = window.open('', '_blank')
    if (!win) { alert('Zezwól na popup'); return }

    const lat = parseFloat(coords.lat).toFixed(5)
    const lng = parseFloat(coords.lng).toFixed(5)

    // Symbole na mapie
    const itemsHtml = items.map(item => {
      const imgSrc = (item.type==='icon' && item.icon) || (item.type==='custom' && item.imageUrl)
      const isArrow = item.type === 'arrow'
      const symbol = imgSrc
        ? `<img src="${imgSrc}" style="width:2rem;height:2rem;object-fit:contain;transform:rotate(${item.rotation||0}deg);filter:drop-shadow(1px 1px 2px rgba(0,0,0,.6));" />`
        : isArrow
          ? `<svg viewBox="0 0 24 24" style="width:2rem;height:2rem;display:block;transform:rotate(${item.rotation||0}deg);filter:drop-shadow(1px 1px 2px rgba(0,0,0,.5));"><path fill="${item.color||'#ef4444'}" d="M12 2L4 10h5v12h6V10h5z"/></svg>`
          : `<span style="font-size:2rem;line-height:1;${item.color?`color:${item.color};`:''}display:inline-block;transform:rotate(${item.rotation||0}deg);filter:drop-shadow(1px 1px 2px rgba(0,0,0,.7));">${item.emoji||''}</span>`
      const labelHtml = item.showLabel!==false && item.label
        ? `<span style="background:rgba(255,255,255,.92);color:#111;font-size:9px;font-weight:700;padding:1px 4px;border-radius:3px;margin-top:2px;white-space:nowrap;box-shadow:0 1px 3px rgba(0,0,0,.3);">${item.label}</span>` : ''
      return `<div style="position:absolute;left:${item.x}%;top:${item.y}%;transform:translate(-50%,-50%) scale(${item.size||1});transform-origin:center bottom;display:flex;flex-direction:column;align-items:center;pointer-events:none;">${symbol}${labelHtml}</div>`
    }).join('')

    // Ścieżki SVG
    const pathsSvg = paths.length ? `<svg xmlns="http://www.w3.org/2000/svg" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;" viewBox="0 0 100 100" preserveAspectRatio="none">
      ${paths.map(p=>`<polyline points="${p.pts.map(pt=>`${pt.x},${pt.y}`).join(' ')}" fill="none" stroke="${p.color}" stroke-width="${p.width||3}" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>`).join('')}
    </svg>` : ''

    // Legenda
    // Legenda — strzałki, ikony, kolory ścieżek
    const usedArrows     = arrowColors.filter(c => items.some(i=>i.type==='arrow'&&i.colorId===c.id))
    const usedIcons      = items.filter(i=>i.type==='icon'||i.type==='custom').reduce((a,i)=>a.find(x=>x.label===i.label)?a:[...a,i],[])
    const usedPathColors = [...new Set(paths.map(p=>p.color))].map(hex=>{
      const match = arrowColors.find(c=>c.hex===hex)
      return { hex, label: match?.label || `Linia ${hex}` }
    })

    const legendItems = [
      ...usedArrows.map(c=>`<div style="display:flex;align-items:center;gap:2mm;font-size:8pt;white-space:nowrap;"><svg viewBox="0 0 24 24" style="width:1rem;height:1rem;flex-shrink:0;"><path fill="${c.hex}" d="M12 2L4 10h5v12h6V10h5z"/></svg><span>${c.label}</span></div>`),
      ...usedPathColors.filter(p=>!usedArrows.find(a=>a.hex===p.hex)).map(p=>`<div style="display:flex;align-items:center;gap:2mm;font-size:8pt;white-space:nowrap;"><span style="display:inline-block;width:1.5rem;height:3px;background:${p.hex};border-radius:2px;flex-shrink:0;"></span><span>${p.label}</span></div>`),
      ...usedIcons.map(i=>{const s=i.icon||i.imageUrl; return `<div style="display:flex;align-items:center;gap:2mm;font-size:8pt;white-space:nowrap;">${s?`<img src="${s}" style="width:1rem;height:1rem;object-fit:contain;flex-shrink:0;"/>`:'<span>■</span>'}<span>${i.label}</span></div>`}),
    ]

    // A4 landscape: 297mm × 210mm — SZTYWNE wymiary
    win.document.write(`<!DOCTYPE html><html lang="pl"><head><meta charset="UTF-8"><title>Mapa terenu</title>
    <style>
      *{margin:0;padding:0;box-sizing:border-box;}
      html,body{width:297mm;height:210mm;overflow:hidden;font-family:Arial,sans-serif;}
      @media print{@page{size:297mm 210mm;margin:0;}html,body{width:297mm;height:210mm;}}
      .header{height:16mm;background:#2d6a2d;color:white;padding:0 8mm;display:flex;justify-content:space-between;align-items:center;}
      .map-wrap{height:170mm;position:relative;overflow:hidden;width:100%;}
      .footer{height:24mm;background:#f0f0f0;border-top:2px solid #2d6a2d;padding:2mm 8mm;display:flex;align-items:center;}
    </style></head><body>
    <div class="header">
      <div><b style="font-size:12pt;">Mapa terenu obozu</b>&nbsp;·&nbsp;<span style="font-size:9pt;opacity:.85;">${locationName||'—'}</span></div>
      <div style="text-align:right;font-size:8pt;opacity:.85;">Wsp.: ${lat}°N, ${lng}°E &nbsp;·&nbsp; Skauci Europy · by Aleksander Nasiłowski</div>
    </div>
    <div class="map-wrap">
      <img src="${mapImageUrl}" style="width:100%;height:100%;object-fit:fill;" crossorigin="anonymous"/>
      ${itemsHtml}
      ${pathsSvg}
    </div>
    <div class="footer">
      <b style="font-size:9pt;color:#1a4a1a;white-space:nowrap;margin-right:6mm;">Legenda:</b>
      <div style="display:flex;gap:5mm;flex-wrap:nowrap;overflow:hidden;align-items:center;">
        ${legendItems.join('')}
        ${legendItems.length===0?'<span style="font-size:8pt;color:#888;">Brak symboli na mapie</span>':''}
      </div>
    </div>
    <script>window.onload=()=>window.print();<\/script>
    </body></html>`)
    win.document.close()
  }

  // ── KROK 1: Wpisz współrzędne ─────────────────────────────────────────
  if (step === 'coords') {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 p-8">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">🗺️</div>
            <h2 className="text-xl font-bold text-green-800">Mapa terenu obozu</h2>
            <p className="text-sm text-gray-500 mt-1">Wpisz lokalizację potencjalnego obozowiska</p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Nazwa miejscowości / terenu</label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
                placeholder="np. Leśniczówka Pisary k. Nowego Sącza"
                value={locationName}
                onChange={e => setLocationName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Szerokość geograficzna (N)</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
                  placeholder="np. 49.6285"
                  value={coords.lat}
                  onChange={e => setCoords(c => ({ ...c, lat: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Długość geograficzna (E)</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
                  placeholder="np. 20.7140"
                  value={coords.lng}
                  onChange={e => setCoords(c => ({ ...c, lng: e.target.value }))}
                />
      </div>
      {/* Zielone okienko — zapytanie o dodanie obozu na mapę */}
      {showCampPrompt && (
        <div className="fixed inset-0 z-[2800] flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center border-2 border-green-400 relative">
            <div className="text-5xl mb-4">🏕️</div>
            <h2 className="text-lg font-bold text-green-800 mb-2">Mapa wygenerowana!</h2>
            <p className="text-sm text-gray-600 mb-6">
              Czy chcesz dodać to miejsce na ogólnopolską mapę obozów Skautów Europy?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowCampPrompt(false)}
                className="flex-1 border-2 border-gray-300 text-gray-600 font-semibold px-4 py-2.5 rounded-xl hover:bg-gray-50 transition text-sm">
                Nie, edytuję mapę
              </button>
              <button onClick={() => { setShowCampPrompt(false); setShowCampModal(true) }}
                className="flex-1 bg-green-700 text-white font-bold px-4 py-2.5 rounded-xl hover:bg-green-800 transition text-sm">
                Tak, dodaj →
              </button>
            </div>
          </div>
        </div>
      )}
      {showCampModal && user && (
        <CampRegistrationModal
          onClose={() => setShowCampModal(false)}
          onSaved={() => setShowCampModal(false)}
          userId={user.id}
          prefill={{
            jednostka:    meta?.jednostka || '',
            kierownik:    meta?.kierownik || '',
            tel_kierownik: meta?.tel_kierownik || '',
            date_start:   meta?.date_start || '',
            date_end:     meta?.date_end || '',
          }}
        />
      )}
    </div>
            <p className="text-xs text-gray-400">
              💡 Współrzędne znajdziesz w Google Maps — kliknij prawym na wybranym miejscu → skopiuj
            </p>
            <button
              onClick={handleStart}
              disabled={!coordsOk}
              className="w-full bg-green-700 text-white py-3 rounded-xl font-bold text-base hover:bg-green-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition mt-2"
            >
              Otwórz mapę →
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── KROK 2: Nawiguj po mapie ──────────────────────────────────────────
  // Proporcje kadru PDF: 297mm × 170mm (A4 landscape minus nagłówek/stopka)
  const PDF_RATIO = 297 / 170  // ≈ 1.747

  if (step === 'navigate') {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <div className="flex items-center gap-3 px-4 py-2.5 bg-green-800 text-white shrink-0 flex-wrap">
          <button onClick={() => setStep('coords')} className="text-white/70 hover:text-white text-sm">← Wróć</button>
          <span className="font-semibold text-sm">📍 {locationName || 'Brak nazwy'}</span>
          <span className="text-green-300 text-xs hidden sm:block">{coords.lat}, {coords.lng}</span>

          {/* Wybór dostawcy mapy */}
          <select
            value={providerId}
            onChange={e => { setProviderId(e.target.value); try { localStorage.setItem('skauting_map_provider', e.target.value) } catch {} }}
            className="ml-2 bg-green-700 text-white text-xs border border-green-500 rounded px-2 py-1 focus:outline-none"
          >
            {MAP_PROVIDERS.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          <div className="ml-auto flex gap-3 items-center">
            <p className="text-green-300 text-xs hidden md:block">
              🔴 poza kadrem · ustaw widok → Generuj
            </p>
            <button onClick={handleGenerateMap}
              className="bg-white text-green-800 font-bold px-5 py-1.5 rounded-lg hover:bg-green-50 text-sm">
              📸 Generuj mapę obozu
            </button>
          </div>
        </div>

        {/* Mapa z nakładką kadru */}
        <div className="flex-1 relative overflow-hidden">
          <MapContainer
            center={[parseFloat(coords.lat), parseFloat(coords.lng)]}
            zoom={15}
            style={{ width: '100%', height: '100%' }}
          >
            {(() => {
              const p = MAP_PROVIDERS.find(x => x.id === providerId) || MAP_PROVIDERS[0]
              return (
                <TileLayer
                  key={p.id}
                  url={p.url}
                  attribution={p.attribution}
                  maxZoom={p.maxZoom || 19}
                  subdomains={p.subdomains || 'abc'}
                />
              )
            })()}
            <MapEventsCapture onReady={setMapRef} />
          </MapContainer>

          {/* Nakładka kadru — SVG z dziurą w proporcjach PDF */}
          <CropOverlay ratio={PDF_RATIO} />
        </div>
      </div>
    )
  }

  // ── KROK 3: Edytor piktogramów ────────────────────────────────────────
  return (
    <div className="flex-1 relative overflow-hidden" ref={editorRef}>

      {/* MAPA — zajmuje całą przestrzeń */}
      <MapEditor
        mapImageUrl={mapImageUrl}
        items={items}
        selected={selected}
        onPlace={handlePlace}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        coords={{ lat: parseFloat(coords.lat), lng: parseFloat(coords.lng) }}
        locationName={locationName}
        paths={paths}
        onAddPath={p => setPaths(prev => [...prev, p])}
        paintMode={paintMode}
        paintColor={paintColor}
        mapRotation={mapRotation}
      />

      {/* LEWY PANEL — floating */}
      <div className="absolute top-10 left-2 bottom-12 w-56 bg-white/95 backdrop-blur rounded-xl shadow-xl border border-gray-200 flex flex-col overflow-hidden z-40"
        style={{maxHeight:'calc(100% - 56px)'}}>
        <div className="flex items-center justify-between px-3 py-2 bg-green-700 rounded-t-xl shrink-0">
          <span className="text-sm font-bold text-white">🗂️ Piktogramy</span>
          <button onClick={() => { setStep('navigate'); setItems([]) }}
            className="text-white/70 hover:text-white text-xs">← Widok</button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          <PictogramPanel
            selected={selected}
            onSelect={setSelected}
            customPictograms={customPictograms}
            onAddCustom={p => setCustomPictograms(prev => [...prev, p])}
          />
        </div>
      </div>

      {/* PRAWY PANEL — floating strzałki + malowanie */}
      <div className="absolute top-10 right-2 bottom-12 w-14 bg-white/95 backdrop-blur rounded-xl shadow-xl border border-gray-200 flex flex-col items-center py-2 gap-1.5 overflow-y-auto z-40"
        style={{maxHeight:'calc(100% - 56px)'}}>
        <p style={{fontSize:8,fontWeight:700,textTransform:'uppercase',letterSpacing:1,color:'#9ca3af'}}>↑</p>
        {arrowColors.map(color => {
          const isActive = selected?.type === 'arrow' && selected?.colorId === color.id
          return (
            <button key={color.id}
              onClick={() => { setSelected({ type:'arrow', color:color.hex, colorId:color.id, label:color.label }); setPaintMode(false) }}
              title={color.label}
              className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center transition ${isActive ? 'border-gray-700 scale-110' : 'border-gray-200 hover:border-gray-500'}`}
              style={{ backgroundColor: color.hex + '18' }}
            >
              <svg viewBox="0 0 24 24" style={{width:22,height:22}}>
                <path fill={color.hex} d="M12 2L4 10h5v12h6V10h5z"/>
              </svg>
            </button>
          )
        })}
        <div className="w-8 border-t border-gray-200 my-1" />
        <button onClick={() => { setPaintMode(m => !m); setSelected(null) }} title="Malowanie"
          className={`w-10 h-10 rounded-lg border-2 text-lg flex items-center justify-center transition ${paintMode ? 'bg-purple-600 border-purple-600 text-white' : 'border-gray-300 hover:border-purple-400'}`}>
          🖌️
        </button>
        {['#ef4444','#3b82f6','#22c55e','#f97316','#a855f7'].map(c => (
          <button key={c} onClick={() => { setPaintColor(c); setPaintMode(true); setSelected(null) }}
            className={`w-7 h-7 rounded-full border-2 transition ${paintColor===c&&paintMode?'border-gray-800 scale-110':'border-transparent hover:border-gray-400'}`}
            style={{ backgroundColor: c }} />
        ))}
        <div className="w-8 border-t border-gray-200 my-1" />
        <button onClick={() => setPaths(prev => prev.slice(0,-1))} title="Cofnij"
          className="w-10 h-8 rounded-lg border border-gray-300 text-sm hover:bg-gray-100 flex items-center justify-center">↩</button>
        <button onClick={() => setPaths([])} title="Wyczyść rysunki"
          className="w-10 h-8 rounded-lg border border-red-200 text-red-400 hover:bg-red-50 text-xs flex items-center justify-center">🗑</button>

        {/* Obrót mapy */}
        <div className="w-8 border-t border-gray-200 my-1" />
        <p style={{fontSize:8,fontWeight:700,textTransform:'uppercase',letterSpacing:1,color:'#9ca3af'}}>Obróć</p>
        <button onClick={() => setMapRotation(r => (r - 15 + 360) % 360)} title="Obróć w lewo o 15°"
          className="w-10 h-10 rounded-lg border border-gray-300 text-lg hover:bg-gray-100 flex items-center justify-center">↺</button>
        <span className="text-xs font-mono text-gray-500">{mapRotation}°</span>
        <button onClick={() => setMapRotation(r => (r + 15) % 360)} title="Obróć w prawo o 15°"
          className="w-10 h-10 rounded-lg border border-gray-300 text-lg hover:bg-gray-100 flex items-center justify-center">↻</button>
        <button onClick={() => setMapRotation(0)} title="Resetuj obrót"
          className="w-10 h-7 rounded-lg border border-gray-200 text-xs text-gray-400 hover:bg-gray-100 flex items-center justify-center">0°</button>
      </div>

      {/* DOLNY PASEK — floating */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center gap-2 px-4 py-2 bg-white/95 backdrop-blur border-t border-gray-200 z-40">
        <button onClick={() => setItems([])}
          className="text-xs text-red-400 hover:text-red-600 border border-red-200 px-3 py-1.5 rounded-lg">
          🗑 Wyczyść symbole
        </button>
        <button onClick={handleExport}
          className="ml-auto bg-green-700 text-white font-bold px-5 py-1.5 rounded-lg hover:bg-green-800 text-sm">
          📄 Eksportuj mapę PDF
        </button>
      </div>
    </div>
  )
}
