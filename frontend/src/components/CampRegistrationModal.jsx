import { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { getTerrains, addTerrain, addCamp } from '../lib/api'
import L from 'leaflet'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

function LocationPicker({ onPick }) {
  useMapEvents({ click: e => onPick(e.latlng) })
  return null
}

// Komponent do centrowania mapy gdy zmienią się koordynaty
function MapFlyTo({ pos }) {
  const map = useMap()
  useEffect(() => {
    if (pos) map.flyTo([pos.lat, pos.lng], 14, { animate: true, duration: 1 })
  }, [pos])
  return null
}

export default function CampRegistrationModal({ onClose, onSaved, userId, prefill = {}, initialTerrain = null }) {
  // Jeśli initialTerrain podany → od razu do kroku 'camp'
  const [step, setStep]         = useState(initialTerrain ? 'camp' : 'terrain')
  const [terrains, setTerrains] = useState([])
  const [selectedTerrain, setSelectedTerrain] = useState(initialTerrain)
  const [newTerrain, setNewTerrain] = useState(false)
  const [pickedPos, setPickedPos] = useState(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  // Koordynaty wpisywane ręcznie
  const [coordInput, setCoordInput] = useState('')

  // Teren fields
  const [tName, setTName]       = useState('')
  const [tAddr, setTAddr]       = useState('')
  const [tOwner, setTOwner]     = useState('')
  const [tOwnerTel, setTOwnerTel] = useState('')
  const [tNotes, setTNotes]     = useState('')

  // Obóz fields
  const [unitName, setUnitName] = useState(prefill.jednostka || '')
  const [contact,  setContact]  = useState(prefill.kierownik  || '')
  const [phone,    setPhone]    = useState(prefill.tel_kierownik || '')
  const [teams,    setTeams]    = useState(prefill.num_teams || 1)
  const [dateStart, setDateStart] = useState(prefill.date_start || '')
  const [dateEnd,   setDateEnd]   = useState(prefill.date_end   || '')
  const [notes,    setNotes]    = useState('')

  useEffect(() => {
    getTerrains().then(setTerrains).catch(() => {})
  }, [])

  // Parsuj koordynaty wpisane ręcznie: "50.7658, 22.5287" lub "50.7658 22.5287"
  const handleCoordInput = (val) => {
    setCoordInput(val)
    const parts = val.replace(',', ' ').trim().split(/\s+/)
    if (parts.length >= 2) {
      const lat = parseFloat(parts[0])
      const lng = parseFloat(parts[1])
      if (!isNaN(lat) && !isNaN(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
        setPickedPos({ lat, lng })
      }
    }
  }

  const handleAddTerrain = async () => {
    if (!tName || !pickedPos) { setError('Podaj nazwę i wskaż lokalizację na mapie (lub wpisz koordynaty)'); return }
    setLoading(true)
    try {
      const t = await addTerrain({
        name: tName, lat: pickedPos.lat, lng: pickedPos.lng,
        address: tAddr, owner_name: tOwner, owner_contact: tOwnerTel,
        owner_notes: tNotes, created_by: userId, is_public: true,
      })
      setSelectedTerrain(t)
      setTerrains(prev => [...prev, t])
      setNewTerrain(false)
      setStep('camp')
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  const handleSaveCamp = async () => {
    if (!unitName || !dateStart || !dateEnd) { setError('Uzupełnij wymagane pola'); return }
    setLoading(true)
    try {
      await addCamp({
        terrain_id: selectedTerrain.id,
        organizer_id: userId,
        unit_name: unitName,
        contact_person: contact,
        contact_phone: phone,
        num_teams: parseInt(teams) || 1,
        date_start: dateStart,
        date_end: dateEnd,
        notes,
      })
      onSaved()
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  const inp = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4" style={{zIndex:2000}}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="bg-green-700 text-white px-6 py-4 rounded-t-2xl flex items-center justify-between shrink-0">
          <h2 className="text-lg font-bold">
            {step === 'terrain' ? '📍 Wybierz / dodaj teren' : '⛺ Dane obozu'}
          </h2>
          <button onClick={onClose} className="text-white/70 hover:text-white text-xl">×</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {error && <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg mb-4">{error}</p>}

          {/* ── KROK 1: Wybór terenu ── */}
          {step === 'terrain' && !newTerrain && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">Wybierz istniejący teren lub dodaj nowy:</p>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {terrains.map(t => (
                  <button key={t.id} onClick={() => { setSelectedTerrain(t); setStep('camp') }}
                    className={`w-full text-left px-4 py-3 rounded-xl border-2 transition ${
                      selectedTerrain?.id === t.id ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-400'
                    }`}>
                    <div className="font-semibold text-sm">{t.name}</div>
                    <div className="text-xs text-gray-500">{t.address}</div>
                    {t.owner_name && <div className="text-xs text-gray-400">Właściciel: {t.owner_name}</div>}
                  </button>
                ))}
                {terrains.length === 0 && <p className="text-sm text-gray-400 py-4 text-center">Brak terenów — dodaj pierwszy!</p>}
              </div>
              <button onClick={() => setNewTerrain(true)}
                className="w-full border-2 border-dashed border-green-400 rounded-xl py-3 text-sm text-green-700 hover:bg-green-50 font-semibold">
                + Dodaj nowy teren
              </button>
            </div>
          )}

          {/* ── Formularz nowego terenu ── */}
          {step === 'terrain' && newTerrain && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Nazwa terenu *</label>
                  <input className={inp} placeholder="np. Leśniczówka Pisary" value={tName} onChange={e=>setTName(e.target.value)} />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Adres</label>
                  <input className={inp} placeholder="np. ul. Leśna 1, 33-100 Tarnów" value={tAddr} onChange={e=>setTAddr(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Właściciel / zarządca terenu</label>
                  <input className={inp} placeholder="Imię i nazwisko / firma" value={tOwner} onChange={e=>setTOwner(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Kontakt do właściciela</label>
                  <input className={inp} placeholder="+48 000 000 000" value={tOwnerTel} onChange={e=>setTOwnerTel(e.target.value)} />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Uwagi o terenie</label>
                  <textarea className={inp + ' resize-none'} rows={2} value={tNotes} onChange={e=>setTNotes(e.target.value)}
                    placeholder="Dojazd, warunki, ograniczenia..." />
                </div>
              </div>

              {/* Wpisz koordynaty */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  📌 Koordynaty (wklej lub kliknij mapę)
                  {pickedPos && <span className="text-green-600 ml-2">✓ {pickedPos.lat.toFixed(4)}, {pickedPos.lng.toFixed(4)}</span>}
                </label>
                <input className={inp} placeholder="np. 50.7658, 22.5287 (skopiuj z Google Maps)"
                  value={coordInput}
                  onChange={e => handleCoordInput(e.target.value)}
                />
                <p className="text-xs text-gray-400 mt-1">Lub kliknij bezpośrednio na mapie poniżej</p>
              </div>

              {/* Mapa */}
              <div className="h-48 rounded-xl overflow-hidden border border-gray-300">
                <MapContainer
                  center={pickedPos ? [pickedPos.lat, pickedPos.lng] : [52, 20]}
                  zoom={pickedPos ? 13 : 6}
                  style={{width:'100%',height:'100%'}}
                >
                  <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" attribution="© Esri" />
                  <LocationPicker onPick={(pos) => {
                    setPickedPos(pos)
                    setCoordInput(`${pos.lat.toFixed(6)}, ${pos.lng.toFixed(6)}`)
                  }} />
                  {pickedPos && <Marker position={pickedPos} />}
                  {pickedPos && <MapFlyTo pos={pickedPos} />}
                </MapContainer>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setNewTerrain(false)} className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50">← Wróć</button>
                <button onClick={handleAddTerrain} disabled={loading}
                  className="flex-1 bg-green-700 text-white py-2 rounded-xl font-bold hover:bg-green-800 disabled:opacity-50">
                  {loading ? 'Zapisuję...' : 'Zapisz teren i dalej →'}
                </button>
              </div>
            </div>
          )}

          {/* ── KROK 2: Dane obozu ── */}
          {step === 'camp' && (
            <div className="space-y-4">
              {selectedTerrain && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm">
                  <b>Teren:</b> {selectedTerrain.name} &nbsp;·&nbsp;
                  {!initialTerrain && <button onClick={() => setStep('terrain')} className="text-green-700 underline text-xs">Zmień</button>}
                  {selectedTerrain.owner_name && <div className="text-xs text-gray-500 mt-1">Właściciel: {selectedTerrain.owner_name} · {selectedTerrain.owner_contact}</div>}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Nazwa jednostki *</label>
                  <input className={inp} placeholder='np. 1 DH' value={unitName} onChange={e=>setUnitName(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Osoba kontaktowa</label>
                  <input className={inp} placeholder="Imię i nazwisko" value={contact} onChange={e=>setContact(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Telefon</label>
                  <input className={inp} placeholder="+48 000 000 000" value={phone} onChange={e=>setPhone(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Data od *</label>
                  <input type="date" className={inp} value={dateStart} onChange={e=>setDateStart(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Data do *</label>
                  <input type="date" className={inp} value={dateEnd} onChange={e=>setDateEnd(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Liczba drużyn</label>
                  <input type="number" min="1" className={inp} value={teams} onChange={e=>setTeams(e.target.value)} />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Uwagi</label>
                  <textarea className={inp + ' resize-none'} rows={2} value={notes} onChange={e=>setNotes(e.target.value)} />
                </div>
              </div>
              <button onClick={handleSaveCamp} disabled={loading}
                className="w-full bg-green-700 text-white py-3 rounded-xl font-bold hover:bg-green-800 disabled:opacity-50 text-base">
                {loading ? 'Zapisuję...' : '✅ Dodaj obóz na mapę'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
