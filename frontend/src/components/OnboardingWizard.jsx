import { useState } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { addTerrain, addCamp } from '../lib/api'
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

function MapFlyTo({ pos }) {
  const map = useMap()
  if (pos) map.flyTo([pos.lat, pos.lng], 14, { animate: true, duration: 1 })
  return null
}

const inp = 'w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-500'

export default function OnboardingWizard({ onDone, updateMeta, meta, userId }) {
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)

  // Krok 1 — Kto jesteś
  const [typ,        setTyp]        = useState(meta.typ_obozu || '')
  const [jednostka,  setJednostka]  = useState(meta.jednostka || '')
  const [kierownik,  setKierownik]  = useState(meta.kierownik || '')
  const [telKier,    setTelKier]    = useState(meta.tel_kierownik || '')
  const [wychowawcy, setWychowawcy] = useState([{ name: '', phone: '' }])

  // Krok 2 — Gdzie i kiedy
  const [miejsce,    setMiejsce]    = useState(meta.miejsce || '')
  const [coords,     setCoords]     = useState(null)
  const [coordInput, setCoordInput] = useState('')
  const [dateStart,  setDateStart]  = useState(meta.date_start || '')
  const [dateEnd,    setDateEnd]    = useState(meta.date_end   || '')

  // Krok 3
  const [publish, setPublish] = useState(true)
  const [error,   setError]   = useState('')

  const handleCoordInput = (val) => {
    setCoordInput(val)
    const parts = val.replace(',', ' ').trim().split(/\s+/)
    if (parts.length >= 2) {
      const lat = parseFloat(parts[0]), lng = parseFloat(parts[1])
      if (!isNaN(lat) && !isNaN(lng)) setCoords({ lat, lng })
    }
  }

  const addWychowawca = () => setWychowawcy(prev => [...prev, { name: '', phone: '' }])
  const updateWychowawca = (i, field, val) =>
    setWychowawcy(prev => prev.map((w, idx) => idx === i ? { ...w, [field]: val } : w))

  const canStep1 = typ && jednostka && kierownik && telKier
  const canStep2 = miejsce && dateStart && dateEnd

  const handleFinish = async () => {
    setSaving(true)
    setError('')
    try {
      // Zapisz do meta
      const newMeta = {
        ...meta,
        typ_obozu: typ,
        jednostka,
        kierownik,
        tel_kierownik: telKier,
        miejsce,
        date_start: dateStart,
        date_end: dateEnd,
        termin: `${dateStart} – ${dateEnd}`,
        wychowawcy: wychowawcy.filter(w => w.name),
      }
      updateMeta(newMeta)

      // Publikuj na mapę
      if (publish && coords && userId) {
        const terrain = await addTerrain({
          name: miejsce,
          lat: coords.lat,
          lng: coords.lng,
          created_by: userId,
          is_public: true,
        })
        await addCamp({
          terrain_id: terrain.id,
          organizer_id: userId,
          unit_name: jednostka,
          contact_person: kierownik,
          contact_phone: telKier,
          date_start: dateStart,
          date_end: dateEnd,
          num_teams: 1,
        })
      }
      onDone()
    } catch (e) {
      setError(e.message || 'Błąd zapisu')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-green-900 flex flex-col items-center justify-start py-10 px-4">
      {/* Logo + tytuł */}
      <div className="text-center mb-8">
        <img src="/logo.png" alt="Skauci Europy" className="h-16 mx-auto mb-3"
          onError={e => { e.currentTarget.style.display='none' }} />
        <h1 className="text-3xl font-bold text-white">Witaj w CampAs!</h1>
        <p className="text-green-300 mt-1">Uzupełnij dane swojego obozu — zajmie to 2 minuty</p>
      </div>

      {/* Pasek kroków */}
      <div className="flex gap-2 mb-8">
        {[1, 2, 3].map(s => (
          <div key={s} className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition ${
            step === s ? 'bg-white text-green-800' : step > s ? 'bg-green-500 text-white' : 'bg-green-700 text-green-300'
          }`}>{step > s ? '✓' : s}</div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl p-8">

        {/* ── KROK 1: Kto jesteś ── */}
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="text-xl font-bold text-green-800 mb-1">1. Kto organizuje obóz?</h2>

            {/* Typ obozu */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">Typ obozu *</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { val: 'wilczkowy',       label: '🐺 Wilczkowy',        sub: 'Zuchy 6–10 lat' },
                  { val: 'harcerski',       label: '⚜️ Harcerski',         sub: '10–16 lat' },
                  { val: 'starszoharcerski',label: '🏔️ Starszoharcerski', sub: '16–18 lat' },
                  { val: 'wędrowniczy',     label: '🎒 Wędrowniczy',       sub: '18+ lat' },
                ].map(opt => (
                  <button key={opt.val} type="button"
                    onClick={() => setTyp(opt.val)}
                    className={`px-3 py-3 rounded-xl border-2 text-left transition ${
                      typ === opt.val ? 'border-green-600 bg-green-50' : 'border-gray-200 hover:border-green-400'
                    }`}>
                    <div className="font-semibold text-sm">{opt.label}</div>
                    <div className="text-xs text-gray-400">{opt.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Nazwa jednostki / szczepu *</label>
              <input className={inp} placeholder='np. 1 DH „Leśny Wicher"' value={jednostka} onChange={e=>setJednostka(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Kierownik obozu *</label>
                <input className={inp} placeholder="Imię i nazwisko" value={kierownik} onChange={e=>setKierownik(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Telefon kierownika *</label>
                <input type="tel" className={inp} placeholder="+48 000 000 000" value={telKier} onChange={e=>setTelKier(e.target.value)} maxLength={15} />
              </div>
            </div>

            {/* Wychowawcy */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">Wychowawcy</label>
              {wychowawcy.map((w, i) => (
                <div key={i} className="grid grid-cols-2 gap-2 mb-2">
                  <input className={inp} placeholder="Imię i nazwisko" value={w.name}
                    onChange={e => updateWychowawca(i, 'name', e.target.value)} />
                  <input type="tel" className={inp} placeholder="+48 000 000 000" value={w.phone}
                    onChange={e => updateWychowawca(i, 'phone', e.target.value)} maxLength={15} />
                </div>
              ))}
              <button onClick={addWychowawca} type="button"
                className="text-xs text-green-700 hover:underline">+ Dodaj kolejnego wychowawcę</button>
            </div>

            <button onClick={() => setStep(2)} disabled={!canStep1}
              className="w-full bg-green-700 text-white py-3 rounded-xl font-bold hover:bg-green-800 disabled:opacity-40">
              Dalej →
            </button>
          </div>
        )}

        {/* ── KROK 2: Gdzie i kiedy ── */}
        {step === 2 && (
          <div className="space-y-5">
            <h2 className="text-xl font-bold text-green-800 mb-1">2. Gdzie i kiedy?</h2>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Nazwa miejsca / miejscowość *</label>
              <input className={inp} placeholder="np. Leśniczówka Pisary k. Nowego Sącza"
                value={miejsce} onChange={e=>setMiejsce(e.target.value)} />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                📌 Koordynaty GPS (wklej lub kliknij mapę)
                {coords && <span className="text-green-600 ml-2">✓ {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}</span>}
              </label>
              <input className={inp} placeholder="np. 50.7658, 22.5287 (skopiuj z Google Maps)"
                value={coordInput} onChange={e => handleCoordInput(e.target.value)} />
              <div className="h-48 rounded-xl overflow-hidden border border-gray-200 mt-2">
                <MapContainer center={coords ? [coords.lat, coords.lng] : [52, 20]} zoom={coords ? 13 : 6} style={{width:'100%',height:'100%'}}>
                  <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" attribution="© Esri" />
                  <LocationPicker onPick={pos => { setCoords(pos); setCoordInput(`${pos.lat.toFixed(6)}, ${pos.lng.toFixed(6)}`) }} />
                  {coords && <><Marker position={coords} /><MapFlyTo pos={coords} /></>}
                </MapContainer>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Data rozpoczęcia *</label>
                <input type="date" className={inp} value={dateStart} onChange={e=>setDateStart(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Data zakończenia *</label>
                <input type="date" className={inp} value={dateEnd} onChange={e=>setDateEnd(e.target.value)} />
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="px-4 py-3 border rounded-xl text-gray-600 hover:bg-gray-50">← Wróć</button>
              <button onClick={() => setStep(3)} disabled={!canStep2}
                className="flex-1 bg-green-700 text-white py-3 rounded-xl font-bold hover:bg-green-800 disabled:opacity-40">
                Dalej →
              </button>
            </div>
          </div>
        )}

        {/* ── KROK 3: Podsumowanie ── */}
        {step === 3 && (
          <div className="space-y-5">
            <h2 className="text-xl font-bold text-green-800 mb-1">3. Podsumowanie</h2>

            <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-1 text-sm">
              <div><b>Typ:</b> {typ}</div>
              <div><b>Jednostka:</b> {jednostka}</div>
              <div><b>Kierownik:</b> {kierownik} · {telKier}</div>
              <div><b>Miejsce:</b> {miejsce}</div>
              <div><b>Termin:</b> {dateStart} – {dateEnd}</div>
              {coords && <div><b>GPS:</b> {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}</div>}
              {wychowawcy.filter(w=>w.name).map((w,i) => (
                <div key={i}><b>Wychowawca {i+1}:</b> {w.name} {w.phone && `· ${w.phone}`}</div>
              ))}
            </div>

            <label className="flex items-center gap-3 cursor-pointer bg-blue-50 border border-blue-200 rounded-xl p-4">
              <input type="checkbox" checked={publish} onChange={e=>setPublish(e.target.checked)} className="w-5 h-5 accent-green-600" />
              <div>
                <div className="font-semibold text-sm text-blue-900">🌍 Opublikuj obóz na mapie Skautów Europy</div>
                <div className="text-xs text-blue-600">Twój obóz będzie widoczny dla innych drużynowych</div>
                {!coords && <div className="text-xs text-orange-500 mt-1">⚠️ Dodaj koordynaty GPS w kroku 2 aby opublikować</div>}
              </div>
            </label>

            {error && <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="px-4 py-3 border rounded-xl text-gray-600 hover:bg-gray-50">← Wróć</button>
              <button onClick={handleFinish} disabled={saving}
                className="flex-1 bg-green-700 text-white py-3 rounded-xl font-bold hover:bg-green-800 disabled:opacity-50">
                {saving ? 'Zapisuję...' : '✅ Gotowe — wejdź do aplikacji'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
