import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { getCamps } from '../lib/api'
import CampRegistrationModal from './CampRegistrationModal'

// Fix Leaflet icons
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const MAP_PROVIDERS = {
  esri:  { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attr: '© Esri', maxZoom: 19, sub: 'abc' },
  topo:  { url: 'https://tile.opentopomap.org/{z}/{x}/{y}.png', attr: '© OpenTopoMap', maxZoom: 17, sub: 'abc' },
  osm:   { url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', attr: '© OSM', maxZoom: 19, sub: 'abc' },
  carto: { url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', attr: '© CartoDB', maxZoom: 19, sub: 'abcd' },
}

// Kolorowe ikony markerów
const makeIcon = (color) => L.divIcon({
  className: '',
  html: `<div style="
    width:28px;height:28px;
    background:${color};
    border:3px solid white;
    border-radius:50% 50% 50% 0;
    transform:rotate(-45deg);
    box-shadow:0 2px 6px rgba(0,0,0,0.3);
  "></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -32],
})

const STATUS_COLOR = { active: '#22c55e', planned: '#f59e0b', ended: '#6b7280' }
const STATUS_LABEL = { active: '🟢 Aktywny', planned: '🟡 Planowany', ended: '⚫ Zakończony' }

// TerrainHistory używa już załadowanych campów — brak zbędnego fetch
function TerrainHistory({ terrainId, allCamps }) {
  const history = allCamps.filter(c => c.terrain?.id === terrainId)
  if (!history.length) return <p className="text-xs text-gray-400">Brak poprzednich obozów</p>
  return (
    <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
      {history.map(c => (
        <div key={c.id} className="text-xs border-l-2 pl-2" style={{ borderColor: STATUS_COLOR[c.status] }}>
          <span className="font-semibold">{c.unit_name}</span>
          <span className="text-gray-500 ml-1">{c.date_start} → {c.date_end}</span>
          {c.organizer?.display_name && <span className="text-gray-400 block">{c.organizer.display_name} · {c.contact_phone}</span>}
        </div>
      ))}
    </div>
  )
}

export default function CampsMapTab({ user, meta }) {
  const [camps, setCamps]                 = useState([])
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState('')
  const [showModal, setShowModal]         = useState(false)
  const [addToTerrain, setAddToTerrain]   = useState(null)
  const [filter, setFilter]               = useState('all')
  const [search, setSearch]               = useState('')
  const [providerId, setProviderId]       = useState(() => {
    try { return localStorage.getItem('skauting_map_provider') || 'esri' } catch { return 'esri' }
  })

  const load = () => {
    setLoading(true)
    setError('')
    getCamps()
      .then(result => {
        // getCamps zwraca teraz { error, camps }
        const campsArray = Array.isArray(result) ? result : (result.camps || [])
        setCamps(campsArray)
        if (result.error) setError(result.error)
      })
      .catch(err => { setError(err.message || 'Błąd łączenia z bazą') })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  // Grupuj obozy po terenie (jeden marker per teren)
  const terrainMap = {}
  camps.forEach(c => {
    if (!c.terrain) return
    const tid = c.terrain.id
    if (!terrainMap[tid]) {
      terrainMap[tid] = { terrain: c.terrain, camps: [] }
    }
    terrainMap[tid].camps.push(c)
  })

  const terrainGroups = Object.values(terrainMap).filter(g => {
    if (filter !== 'all' && !g.camps.some(c => c.status === filter)) return false
    if (search && !g.terrain.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  // Dominujący status dla markera
  const dominantStatus = (camps) => {
    if (camps.some(c => c.status === 'active'))  return 'active'
    if (camps.some(c => c.status === 'planned')) return 'planned'
    return 'ended'
  }

  const stats = {
    active:  camps.filter(c => c.status === 'active').length,
    planned: camps.filter(c => c.status === 'planned').length,
    ended:   camps.filter(c => c.status === 'ended').length,
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Pasek narzędzi */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 flex-wrap shrink-0">
        {error && (
          <div className="w-full bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700">
            ⚠️ Błąd bazy danych: {error}. <button onClick={load} className="underline font-semibold hover:text-red-900">Spróbuj ponownie</button>
          </div>
        )}
        <div className="flex gap-2">
          {[['all','Wszystkie'],['active','Aktywne'],['planned','Planowane'],['ended','Zakończone']].map(([v,l]) => (
            <button key={v} onClick={() => setFilter(v)}
              className={`text-xs px-3 py-1.5 rounded-full font-semibold transition ${
                filter === v ? 'bg-green-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>{l}</button>
          ))}
        </div>
        <input
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-green-500 w-48"
          placeholder="Szukaj terenu..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="flex gap-3 ml-auto text-xs text-gray-500">
          <span>🟢 {stats.active} aktywnych</span>
          <span>🟡 {stats.planned} planowanych</span>
          <span>⚫ {stats.ended} zakończonych</span>
        </div>
        <button onClick={() => setShowModal(true)}
          className="bg-green-700 text-white font-bold px-4 py-1.5 rounded-lg hover:bg-green-800 text-sm">
          + Dodaj obóz
        </button>
        <select value={providerId} onChange={e => { setProviderId(e.target.value); try { localStorage.setItem('skauting_map_provider', e.target.value) } catch {} }}
          className="bg-green-700 text-white text-xs border border-green-500 rounded px-2 py-1 focus:outline-none">
          <option value="esri">🛰️ Satelita</option>
          <option value="topo">🏔️ Topo</option>
          <option value="osm">🗺️ Ulice</option>
          <option value="carto">🎨 Jasna</option>
        </select>
      </div>

      {/* Mapa */}
      <div className="relative" style={{height:'calc(100vh - 100px)'}}>
        {loading && (
          <div className="absolute inset-0 bg-white/70 z-50 flex items-center justify-center">
            <p className="text-green-700 font-semibold">Ładowanie obozów...</p>
          </div>
        )}
        <MapContainer center={[52.0, 19.5]} zoom={6} style={{width:'100%',height:'100%'}}>
          <TileLayer
            key={providerId}
            url={MAP_PROVIDERS[providerId]?.url || MAP_PROVIDERS.esri.url}
            attribution={MAP_PROVIDERS[providerId]?.attr || MAP_PROVIDERS.esri.attr}
            maxZoom={MAP_PROVIDERS[providerId]?.maxZoom || 19}
            subdomains={MAP_PROVIDERS[providerId]?.sub || 'abc'}
          />

          {terrainGroups.map(({ terrain, camps: tc }) => {
            const status = dominantStatus(tc)
            const color  = STATUS_COLOR[status]

            return (
              <Marker key={terrain.id} position={[terrain.lat, terrain.lng]} icon={makeIcon(color)}>
                <Popup minWidth={280} maxWidth={340}>
                  <div className="text-sm">
                    {/* Teren */}
                    <h3 className="font-bold text-base text-green-900 mb-1">{terrain.name}</h3>
                    {terrain.address && <p className="text-xs text-gray-500 mb-2">📍 {terrain.address}</p>}

                    {/* Właściciel */}
                    {terrain.owner_name && (
                      <div className="bg-orange-50 border border-orange-200 rounded-lg px-3 py-2 mb-2 text-xs">
                        <b>Właściciel terenu:</b> {terrain.owner_name}<br/>
                        {terrain.owner_contact && <span>📞 {terrain.owner_contact}</span>}
                        {terrain.owner_notes && <p className="text-gray-400 mt-1">{terrain.owner_notes}</p>}
                      </div>
                    )}

                    {/* Aktualne/przyszłe obozy */}
                    {tc.filter(c => c.status !== 'ended').map(c => (
                      <div key={c.id} className="border border-gray-200 rounded-lg px-3 py-2 mb-2 text-xs">
                        <div className="flex items-center gap-1 mb-1">
                          <span>{STATUS_LABEL[c.status]}</span>
                        </div>
                        <b>{c.unit_name}</b>
                        <div className="text-gray-500">{c.date_start} → {c.date_end}</div>
                        {c.organizer?.display_name && <div>👤 {c.organizer.display_name}</div>}
                        {c.contact_phone && <div>📞 {c.contact_phone}</div>}
                        {c.num_teams > 1 && <div>🏕️ {c.num_teams} drużyn</div>}
                      </div>
                    ))}

                    {/* Historia */}
                    <details className="mt-1 mb-3">
                      <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                        📜 Historia obozów na tym terenie
                      </summary>
                      <TerrainHistory terrainId={terrain.id} allCamps={camps} />
                    </details>

                    {/* Dodaj kolejny obóz */}
                    <button
                      onClick={() => {
                        setAddToTerrain(terrain)
                        setShowModal(true)
                      }}
                      className="w-full bg-green-700 text-white text-xs font-bold py-2 px-3 rounded-lg hover:bg-green-800 transition"
                    >
                      + Dodaj kolejny obóz na tym terenie
                    </button>
                  </div>
                </Popup>
              </Marker>
            )
          })}
        </MapContainer>

        {/* Legenda */}
        <div className="absolute bottom-4 left-4 bg-white/95 rounded-xl shadow-lg px-4 py-3 text-xs z-40">
          <p className="font-bold text-gray-700 mb-1.5">Legenda</p>
          {Object.entries(STATUS_LABEL).map(([k,v]) => (
            <div key={k} className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full" style={{background: STATUS_COLOR[k]}}/>
              <span>{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Modal rejestracji */}
      {showModal && (
        <CampRegistrationModal
          onClose={() => { setShowModal(false); setAddToTerrain(null) }}
          onSaved={() => { setShowModal(false); setAddToTerrain(null); load() }}
          userId={user?.id}
          initialTerrain={addToTerrain}
          prefill={{
            jednostka: meta?.jednostka,
            kierownik: meta?.kierownik,
            tel_kierownik: meta?.tel_kierownik,
            date_start: meta?.termin?.split('–')[0]?.trim(),
            date_end:   meta?.termin?.split('–')[1]?.trim(),
          }}
        />
      )}
    </div>
  )
}
