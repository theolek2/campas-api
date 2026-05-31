import { useState, useEffect, useRef } from 'react'
import CampRegistrationModal from './CampRegistrationModal'
import LeafletLocationPicker from './LeafletLocationPicker'
import { useAlert } from './AlertContext'
import { fetchAllGeoData } from '../utils/geoportal.js'

// ── Moduł bazowy: karta z tytułem i możliwością zwijania ─────────────────────
function Module({ icon, title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-4">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-5 py-3.5 bg-green-700 text-white hover:bg-green-800 transition"
      >
        <span className="text-xl">{icon}</span>
        <span className="font-bold text-sm flex-1 text-left">{title}</span>
        <span className="text-white/60 text-sm">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="p-5">{children}</div>}
    </div>
  )
}

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  )
}

const inputCls = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"

// ── Główna zakładka ──────────────────────────────────────────────────────────
export default function CampDataTab({ meta, onUpdateMeta, userId, progress, onToggleProgress }) {
  const alert = useAlert()
  const [showCampModal, setShowCampModal] = useState(false)
  const [activeSubTab, setActiveSubTab] = useState('oboz')
  const [geoLat, setGeoLat] = useState(meta.coords?.lat?.toString() || '')
  const [geoLng, setGeoLng] = useState(meta.coords?.lng?.toString() || '')
  const [gpsLoading, setGpsLoading] = useState(false)
  const [locationMode, setLocationMode] = useState('gps')
  const [parcelId, setParcelId] = useState('')
  const [parcelAddVal, setParcelAddVal] = useState('')
  const [parcelLoading, setParcelLoading] = useState(false)
  const normalizeDzialki = (v) => {
    if (Array.isArray(v)) return v.map(String).filter(s => s && s !== 'Pobrano' && s !== '0')
    if (typeof v === 'string' && v) return v.split(',').map(s => s.trim()).filter(s => s && s !== 'Pobrano' && s !== '0')
    return []
  }
  const [parcels, setParcels] = useState(() => normalizeDzialki(meta.nr_dzialka))
  const parcelsRef = useRef(parcels)
  useEffect(() => { parcelsRef.current = parcels }, [parcels])
  const updateParcels = (newParcels) => {
    setParcels(newParcels)
    parcelsRef.current = newParcels
    onUpdateMeta({ nr_dzialki: newParcels })
  }
  const [geoResults, setGeoResults] = useState(() => {
    try {
      const raw = localStorage.getItem('skauting_geo_results')
      if (raw) {
        const cached = JSON.parse(raw)
        if (cached.lat === geoLat && cached.lng === geoLng) return cached.data
      }
    } catch {}
    return null
  })
  const hasCoords = !!(meta.coords?.lat && meta.coords?.lng)
  // editMode: 'location' (form), 'edit' (geo results + selections), 'view' (summary)
  const [editMode, setEditMode] = useState(hasCoords ? 'view' : 'location')
  const metaOk = meta.jednostka && meta.kierownik

  const runGeoFetch = async (lat, lng) => {
    setGpsLoading(true)
    try {
      const data = await fetchAllGeoData(lat, lng)
      setGeoResults(data)
      try { localStorage.setItem('skauting_geo_results', JSON.stringify({ lat: String(lat), lng: String(lng), data })) } catch {}
      const patch = { coords: { lat: parseFloat(lat.toFixed(6)), lng: parseFloat(lng.toFixed(6)) } }
      if (data.geocode) {
        patch.gmina = data.geocode.gmina?.replace(/^(gmina\s+|miasto\s+)/i, '') || data.geocode.gmina
        patch.powiat = data.geocode.powiat?.replace(/^(powiat\s+)/i, '') || data.geocode.powiat
        patch.wojewodztwo = data.geocode.wojewodztwo?.replace(/^(województwo\s+)/i, '') || data.geocode.wojewodztwo
        if (data.geocode.miejscowosc) patch.miejscowosc = data.geocode.miejscowosc
      }
      if (data.forest?.name)      patch.nadlesnictwo = data.forest.name
      if (data.forestRange?.name) patch.lesnictwo    = data.forestRange.name
      if (data.parcel) {
        if (data.parcel.dzialka && data.parcel.dzialka !== 'Pobrano' && data.parcel.dzialka !== '0') {
          const merged = [data.parcel.dzialka, ...parcelsRef.current.filter(x => x !== data.parcel.dzialka)]
          patch.nr_dzialki = merged
          setParcels(merged)
        } else if (data.parcel.wkbHex) {
          try {
            const token = localStorage.getItem('campas_token')
            const r = await fetch(`/api/uldk?request=GetParcelByXY&lat=${lat}&lng=${lng}`, { headers: { Authorization: `Bearer ${token}` } })
            const parsed = await r.json()
            if (parsed.fields?.dzialka && parsed.fields.dzialka !== '0') {
              const merged = [parsed.fields.dzialka, ...parcels.filter(x => x !== parsed.fields.dzialka)]
              patch.nr_dzialki = merged
              setParcels(merged)
              setParcelId(parsed.fields.dzialka)
            }
          } catch {}
        }
      }
      if (data.nfz) { patch.przychodnia = data.nfz.name; patch.tel_przychodnia = data.nfz.phone }
      if (data.hospitals?.[0]) patch.szpital = data.hospitals[0].name
      if (data.police?.[0]) patch.policja = data.police[0].name
      if (data.fire?.[0]) patch.psp = data.fire[0].name
      if (data.clinics?.[0] && !patch.przychodnia) patch.przychodnia = data.clinics[0].name
      onUpdateMeta(patch)
      setEditMode('edit')
    } catch { alert('Błąd pobierania danych', 'error') }
    finally { setGpsLoading(false) }
  }

  const handleCoordsChange = (lat, lng) => {
    setGeoLat(lat.toFixed(6))
    setGeoLng(lng.toFixed(6))
    runGeoFetch(lat, lng)
  }

  const handleParcelLookup = async () => {
    const id = parcelId.trim()
    if (!id) { alert('Wpisz numer działki', 'warning'); return }
    if (!/^\d{6}_\d{1,4}\.[\dA-Za-z_./]+$/.test(id)) { alert('Nieprawidłowy format działki. Przykład: 146501_1.0001.12', 'warning'); return }
    setParcelLoading(true)
    try {
      const token = localStorage.getItem('campas_token')
      const r = await fetch(`/api/uldk?request=GetParcelById&id=${id}`, { headers: { Authorization: `Bearer ${token}` } })
      if (!r.ok) { const err = await r.json(); alert(err.detail || 'Nie znaleziono działki', 'error'); return }
      const parsed = await r.json()
      if (parsed.centroid) {
        const { lat, lng } = parsed.centroid
        console.log('📋 ULDK GetParcelById OK', { parcelId: id, centroid: { lat, lng }, raw: parsed.raw })
        setGeoLat(lat.toString())
        setGeoLng(lng.toString())
        const newParcels = [id, ...parcelsRef.current.filter(x => x !== id)]
        updateParcels(newParcels)
        onUpdateMeta({ coords: { lat, lng } })
        await runGeoFetch(lat, lng)
      } else {
        console.error('📋 ULDK GetParcelById - brak centroid', { raw: parsed.raw, fields: parsed.fields })
        alert('Nie udało się odczytać współrzędnych działki', 'error')
      }
    } catch (e) {
      console.error('📋 ULDK GetParcelById FAIL', e)
      alert('Błąd wyszukiwania działki', 'error')
    }
    finally { setParcelLoading(false) }
  }

  const SUB_TABS = [
    { id: 'oboz',  icon: '🏕️', label: 'Obóz' },
    { id: 'kadra', icon: '👥', label: 'Kadra' },
    { id: 'teren', icon: '📍', label: 'Teren' },
    { id: 'org',   icon: '🏛️', label: 'Org.' },
  ]

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">

      {/* Nagłówek + sub-zakładki */}
      <div className="bg-white border-b border-gray-200 shrink-0 px-6 pt-4 pb-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-xl font-bold text-green-900">🏕️ Dane obozu</h2>
            {!metaOk && <p className="text-xs text-orange-600 mt-0.5">⚠️ Uzupełnij Jednostkę i Kierownika</p>}
            {metaOk && <p className="text-xs text-green-600 mt-0.5">✅ Dane kompletne</p>}
          </div>
          <button onClick={(e) => onToggleProgress?.('camp', e)}
            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition ${
              progress?.camp ? 'bg-green-500 text-white border-green-600' : 'bg-white text-gray-500 border-gray-300 hover:border-green-400'
            }`}>
            {progress?.camp ? '✅' : '⬜'} Zrobione
          </button>
        </div>
        {/* Sub-zakładki */}
        <div className="flex gap-1">
          {SUB_TABS.map(t => (
            <button key={t.id} onClick={() => setActiveSubTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 transition ${
                activeSubTab === t.id
                  ? 'border-green-600 text-green-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}>
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto p-6">

        {/* ── ZAKŁADKA: OBÓZ ── */}
        {activeSubTab === 'oboz' && <>
        <Module icon="📋" title="Podstawowe dane obozu">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Typ obozu */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-2">Typ obozu <span className="text-red-500">*</span></label>
              <div className="flex gap-3 flex-wrap">
                {[
                  { val: 'wilczkowy', label: '🐺 Obóz wilczkowy', sub: 'Zuchy 6–10 lat' },
                  { val: 'harcerski', label: '⚜️ Drużyna harcerska', sub: 'Harcerze 10–16 lat' },
                  { val: 'starszoharcerski', label: '🏔️ Starszoharcerski', sub: '16+ lat' },
                  { val: 'wędrowniczy', label: '🎒 Wędrowniczy', sub: 'Wędrownicy 18+ lat' },
                ].map(opt => (
                  <button key={opt.val} type="button"
                    onClick={() => onUpdateMeta({ typ_obozu: opt.val })}
                    className={`flex-1 min-w-[140px] px-4 py-3 rounded-xl border-2 text-left transition ${
                      meta.typ_obozu === opt.val
                        ? 'border-green-600 bg-green-50'
                        : 'border-gray-200 hover:border-green-400'
                    }`}>
                    <div className="font-semibold text-sm">{opt.label}</div>
                    <div className="text-xs text-gray-400">{opt.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            <Field label="Jednostka / nazwa szczepu" required>
              <input className={inputCls}
                placeholder={'np. 1 DH „Leśny Wicher"'}
                value={meta.jednostka}
                onChange={e => onUpdateMeta({ jednostka: e.target.value })}
              />
            </Field>
            <Field label="Kierownik obozu" required>
              <input className={inputCls}
                placeholder="Imię i nazwisko"
                value={meta.kierownik}
                onChange={e => onUpdateMeta({ kierownik: e.target.value })}
              />
            </Field>
            <Field label="Miejsce obozu" required>
              <input className={inputCls}
                placeholder="np. Leśniczówka Pisary, gmina Olesno"
                value={meta.miejsce}
                onChange={e => onUpdateMeta({ miejsce: e.target.value })}
              />
            </Field>
            <Field label="Data rozpoczęcia">
              <input className={inputCls} type="date"
                value={meta.date_start || ''}
                onChange={e => onUpdateMeta({
                  date_start: e.target.value,
                  termin: `${e.target.value}${meta.date_end ? ' – ' + meta.date_end : ''}`,
                })}
              />
            </Field>
            <Field label="Data zakończenia">
              <input className={inputCls} type="date"
                value={meta.date_end || ''}
                onChange={e => onUpdateMeta({
                  date_end: e.target.value,
                  termin: `${meta.date_start || ''}${e.target.value ? ' – ' + e.target.value : ''}`,
                })}
              />
            </Field>
            <Field label="Liczba uczestników">
              <input className={inputCls} type="number" min="1"
                placeholder="np. 32"
                value={meta.uczestnicy || ''}
                onChange={e => onUpdateMeta({ uczestnicy: e.target.value })}
              />
            </Field>
            <Field label="Kategoria wiekowa">
              <input className={inputCls}
                placeholder="np. Zuchy 7-10 lat"
                value={meta.wiek || ''}
                onChange={e => onUpdateMeta({ wiek: e.target.value })}
              />
            </Field>
          </div>
        </Module>

        </> /* koniec zakładki Obóz */}

        {/* ── ZAKŁADKA: KADRA ── */}
        {activeSubTab === 'kadra' && <>
        <Module icon="👥" title="Kadra obozu">
          <p className="text-xs text-gray-400 mb-4">
            Uzupełnij dane kierownika i wychowawców — będą widoczni w dzienniku zajęć i dokumentach.
          </p>

          {/* Kierownik */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <Field label="Kierownik obozu" required>
              <input className={inputCls}
                placeholder="Imię i nazwisko"
                value={meta.kierownik || ''}
                onChange={e => onUpdateMeta({ kierownik: e.target.value })}
              />
            </Field>
            <Field label="Telefon kierownika" required>
              <input className={inputCls} type="tel" maxLength={15}
                placeholder="+48 000 000 000"
                value={meta.tel_kierownik || ''}
                onChange={e => onUpdateMeta({ tel_kierownik: e.target.value })}
              />
            </Field>
          </div>

          {/* Wychowawcy */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-700">Wychowawcy</h4>
              <button type="button"
                onClick={() => onUpdateMeta({ wychowawcy: [...(meta.wychowawcy || []), { name: '', phone: '' }] })}
                className="text-xs text-green-700 border border-green-400 px-3 py-1 rounded-lg hover:bg-green-50 transition">
                + Dodaj wychowawcę
              </button>
            </div>

            {(meta.wychowawcy || []).length === 0 && (
              <p className="text-xs text-gray-400 py-3 text-center border border-dashed border-gray-300 rounded-lg">
                Brak wychowawców — kliknij „Dodaj wychowawcę"
              </p>
            )}

            <div className="space-y-2">
              {(meta.wychowawcy || []).map((w, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <div className="w-7 h-7 bg-green-700 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <input className={inputCls} placeholder="Imię i nazwisko"
                      value={w.name || ''}
                      onChange={e => {
                        const arr = [...(meta.wychowawcy || [])]
                        arr[i] = { ...arr[i], name: e.target.value }
                        onUpdateMeta({ wychowawcy: arr })
                      }}
                    />
                    <input className={inputCls} type="tel" maxLength={15} placeholder="+48 000 000 000"
                      value={w.phone || ''}
                      onChange={e => {
                        const arr = [...(meta.wychowawcy || [])]
                        arr[i] = { ...arr[i], phone: e.target.value }
                        onUpdateMeta({ wychowawcy: arr })
                      }}
                    />
                  </div>
                  <button type="button"
                    onClick={() => {
                      const arr = (meta.wychowawcy || []).filter((_, idx) => idx !== i)
                      onUpdateMeta({ wychowawcy: arr })
                    }}
                    className="text-red-400 hover:text-red-600 text-lg shrink-0">×</button>
                </div>
              ))}
            </div>
          </div>
        </Module>

        {/* Moduł 4: Kontakty alarmowe */}
        <Module icon="📞" title="Kontakty alarmowe" defaultOpen={false}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Telefon zastępcy kierownika">
              <input className={inputCls} type="tel" maxLength={15}
                placeholder="+48 000 000 000"
                value={meta.tel_zastepca || ''}
                onChange={e => onUpdateMeta({ tel_zastepca: e.target.value })}
              />
            </Field>
            <Field label="Najbliższy szpital / SOR">
              <input className={inputCls}
                placeholder="np. Szpital Miejski w Nowym Sączu"
                value={meta.szpital || ''}
                onChange={e => onUpdateMeta({ szpital: e.target.value })}
              />
            </Field>
            <Field label="Telefon do szpitala">
              <input className={inputCls} type="tel" maxLength={15}
                placeholder="+48 000 000 000"
                value={meta.tel_szpital || ''}
                onChange={e => onUpdateMeta({ tel_szpital: e.target.value })}
              />
            </Field>
            <Field label="Pogotowie / Straż / Policja (lokalny)">
              <input className={inputCls}
                placeholder="np. Policja Olesno: +48 18 123 456"
                value={meta.tel_alarmowy || ''}
                onChange={e => onUpdateMeta({ tel_alarmowy: e.target.value })}
              />
            </Field>
            <Field label="Lekarz obozowy / pielęgniarka">
              <input className={inputCls}
                placeholder="Imię i telefon"
                value={meta.lekarz || ''}
                onChange={e => onUpdateMeta({ lekarz: e.target.value })}
              />
            </Field>
          </div>
        </Module>

        </> /* koniec zakładki Kadra */}

        {/* ── ZAKŁADKA: ORG (Informacje + Hufiec) ── */}
        {activeSubTab === 'org' && <>
        <Module icon="🏛️" title="Informacje organizacyjne" defaultOpen={true}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Organ prowadzący / hufiec">
              <input className={inputCls}
                placeholder="np. Hufiec ZHP Kraków-Podgórze"
                value={meta.hufiec || ''}
                onChange={e => onUpdateMeta({ hufiec: e.target.value })}
              />
            </Field>
            <Field label="Komendant hufca (tel.)">
              <input className={inputCls} type="tel" maxLength={15}
                placeholder="+48 000 000 000"
                value={meta.komendant_tel || ''}
                onChange={e => onUpdateMeta({ komendant_tel: e.target.value })}
              />
            </Field>
            <Field label="Numer zgłoszenia / decyzji">
              <input className={inputCls}
                placeholder="np. KH-123/2025"
                value={meta.nr_zgloszenia || ''}
                onChange={e => onUpdateMeta({ nr_zgloszenia: e.target.value })}
              />
            </Field>
            <Field label="Data zgłoszenia do kuratorium">
              <input className={inputCls} type="date"
                value={meta.data_zgloszenia || ''}
                onChange={e => onUpdateMeta({ data_zgloszenia: e.target.value })}
              />
            </Field>
          </div>
          <div className="mt-4">
            <Field label="Uwagi / dodatkowe informacje">
              <textarea className={inputCls + ' resize-none'} rows={3}
                placeholder="Dodatkowe informacje dla inspektorów..."
                value={meta.uwagi || ''}
                onChange={e => onUpdateMeta({ uwagi: e.target.value })}
              />
            </Field>
          </div>
        </Module>

        {/* Opublikuj na mapie — na dole zakładki Org */}
        <div className="bg-gradient-to-r from-green-700 to-green-600 rounded-2xl p-5 text-white mt-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold">🌍 Mapa obozów Skautów Europy</h3>
              <p className="text-green-200 text-xs mt-0.5">Opublikuj obóz — inni drużynowi zobaczą gdzie jesteś</p>
            </div>
            <button onClick={() => setShowCampModal(true)}
              className="bg-white text-green-800 font-bold px-4 py-2 rounded-xl hover:bg-green-50 transition text-sm shrink-0">
              + Dodaj na mapę
            </button>
          </div>
        </div>
        </> /* koniec zakładki Org */}

        {/* ── ZAKŁADKA: TEREN (GPS + Mapa + Działka + Schronienie) ── */}
        {activeSubTab === 'teren' && <>
        <Module icon="📍" title="Lokalizacja obozu" defaultOpen={true}>

          {editMode === 'view' && hasCoords && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-3">
              <div className="text-xs text-green-600 mb-3">
                📍 <span className="font-mono">{meta.coords.lat.toFixed(4)}, {meta.coords.lng.toFixed(4)}</span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                {parcels.length > 0 && (
                  <div className="col-span-2"><span className="text-gray-500">Działki:</span> <span className="text-gray-800 font-mono">{parcels.join(', ')}</span></div>
                )}
                {meta.szpital && <div><span className="text-gray-500">🏥 Szpital:</span> <span className="text-gray-800">{meta.szpital}</span></div>}
                {meta.psp && <div><span className="text-gray-500">🚒 PSP:</span> <span className="text-gray-800">{meta.psp}</span></div>}
                {meta.policja && <div><span className="text-gray-500">🚔 Policja:</span> <span className="text-gray-800">{meta.policja}</span></div>}
                {meta.przychodnia && <div><span className="text-gray-500">🩺 Przychodnia:</span> <span className="text-gray-800">{meta.przychodnia}</span></div>}
                {meta.nadlesnictwo && <div><span className="text-gray-500">🌲 Nadleśnictwo:</span> <span className="text-gray-800">{meta.nadlesnictwo}</span></div>}
                {meta.lesnictwo && <div><span className="text-gray-500">🌳 Leśnictwo:</span> <span className="text-gray-800">{meta.lesnictwo}{meta.oddzial_lesny ? ` / oddz. ${meta.oddzial_lesny}` : ''}</span></div>}
                {meta.gmina && <div><span className="text-gray-500">🏘️ Gmina:</span> <span className="text-gray-800">{meta.gmina}</span></div>}
                {meta.powiat && <div><span className="text-gray-500">📋 Powiat:</span> <span className="text-gray-800">{meta.powiat}</span></div>}
                {meta.wojewodztwo && <div><span className="text-gray-500">🗺️ Województwo:</span> <span className="text-gray-800">{meta.wojewodztwo}</span></div>}
              </div>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-green-200">
                {!geoResults && (
                  <button onClick={() => runGeoFetch(meta.coords.lat, meta.coords.lng)} disabled={gpsLoading}
                    className="text-xs bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800 transition">
                    {gpsLoading ? '⏳ Ładowanie...' : '📡 Wczytaj dane terenu'}
                  </button>
                )}
                <div className="flex-1" />
                <button onClick={() => setEditMode('edit')}
                  className="text-sm bg-white border border-green-300 text-green-700 px-6 py-2 rounded-lg hover:bg-green-100 transition font-medium">
                  ✏️ Edytuj dane
                </button>
              </div>
            </div>
          )}

          {editMode === 'location' && <>
            <p className="text-sm font-semibold text-gray-700 mb-3">Podaj lokalizację na jeden z trzech sposobów — dane zostaną zsynchronizowane.</p>

            {/* Segmented control */}
            <div className="flex rounded-lg bg-gray-100 p-1 mb-4">
            {[
              { id: 'gps', icon: '🌐', label: 'GPS' },
              { id: 'map', icon: '🗺️', label: 'Mapa' },
              { id: 'parcel', icon: '📋', label: 'Działka' },
            ].map(m => (
              <button key={m.id}
                onClick={() => setLocationMode(m.id)}
                className={`flex-1 text-xs font-semibold py-2 px-2 rounded-md transition ${locationMode === m.id ? 'bg-white shadow text-green-800' : 'text-gray-500 hover:text-gray-700'}`}>
                {m.icon} {m.label}
              </button>
            ))}
          </div>

          {/* ── Tryb GPS ── */}
          {locationMode === 'gps' && (
            <div className="flex items-end gap-2 mb-4">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Szerokość (lat)</label>
                <input type="number" step="any" className={inputCls} placeholder="52.2297" value={geoLat} onChange={e => setGeoLat(e.target.value)} />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Długość (lng)</label>
                <input type="number" step="any" className={inputCls} placeholder="21.0122" value={geoLng} onChange={e => setGeoLng(e.target.value)} />
              </div>
              <button onClick={() => { const lat=parseFloat(geoLat); const lng=parseFloat(geoLng); if(lat&&lng) handleCoordsChange(lat,lng); else alert('Wpisz poprawne współrzędne','warning') }} disabled={gpsLoading}
                className="shrink-0 bg-green-700 text-white text-sm font-bold px-5 py-2 rounded-lg hover:bg-green-800 disabled:opacity-50">
                {gpsLoading ? '⏳' : '📍'} Pobierz
              </button>
            </div>
          )}

          {/* ── Tryb Mapa ── */}
          {locationMode === 'map' && (
            <div className="mb-4">
              <p className="text-xs text-gray-400 mb-2">Kliknij na mapie, aby wskazać lokalizację obozu.</p>
              <LeafletLocationPicker
                lat={parseFloat(geoLat) || null}
                lng={parseFloat(geoLng) || null}
                onCoordsChange={handleCoordsChange}
                height="320px"
              />
              {(geoLat && geoLng) && (
                <p className="text-xs text-gray-500 mt-1">
                  Wybrano: {parseFloat(geoLat).toFixed(6)}, {parseFloat(geoLng).toFixed(6)}
                </p>
              )}
            </div>
          )}

          {/* ── Tryb Działka ── */}
          {locationMode === 'parcel' && (
            <div className="mb-4">
              <p className="text-xs text-gray-400 mb-2">Wyszukaj działkę po numerze — współrzędne zostaną pobrane automatycznie.</p>
              <div className="flex items-end gap-2 mb-3">
                <div className="flex-1">
                  <input type="text" className={inputCls} placeholder="146501_1.0001.12" value={parcelId}
                    onChange={e => setParcelId(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleParcelLookup()} />
                </div>
                <button onClick={handleParcelLookup} disabled={parcelLoading}
                  className="shrink-0 bg-green-700 text-white text-sm font-bold px-5 py-2 rounded-lg hover:bg-green-800 disabled:opacity-50">
                  {parcelLoading ? '⏳' : '🔍'} Szukaj
                </button>
              </div>
            </div>
          )}

          {gpsLoading && <p className="text-xs text-gray-400 py-3 text-center">Pobieranie danych...</p>}

          {editMode !== 'view' && hasCoords && (
              <div className="flex justify-between pt-2 border-t border-gray-100">
                <span className="text-xs text-gray-400">lub</span>
                <button onClick={() => setEditMode(geoResults ? 'edit' : 'view')}
                  className="text-xs bg-gray-100 text-gray-600 px-4 py-1.5 rounded-lg hover:bg-gray-200 transition">
                  Anuluj
                </button>
            </div>
          )}
          </>}

          {editMode === 'edit' && hasCoords && (
            <div>
              {editMode === 'edit' && (
                <button onClick={() => setEditMode('location')}
                  className="text-xs bg-white border border-gray-300 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition mb-3">
                  ✏️ Zmień lokalizację
                </button>
              )}
            <div className="grid grid-cols-2 gap-3 mb-4 pt-4 border-t border-gray-100">
              <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Nr działek</label>
              <div className="flex flex-wrap items-center gap-1.5">
                {parcels.map((dz, i) => (
                  <span key={i} className="inline-flex items-center gap-1 bg-green-50 border border-green-200 text-green-800 text-xs rounded-full pl-2.5 pr-1.5 py-1">
                    <span className="font-mono">{dz}</span>
                    <button onClick={() => updateParcels(parcels.filter((_, j) => j !== i))}
                      className="text-green-400 hover:text-red-500 leading-none text-sm">&times;</button>
                  </span>
                ))}
                {parcels.length === 0 && <span className="text-xs text-gray-400 py-1">Brak</span>}
                <span className="inline-flex items-center gap-1 bg-white border border-dashed border-gray-300 rounded-full px-2 py-1">
                  <input className="text-xs border-none outline-none bg-transparent w-32" placeholder="dodaj działkę"
                    value={parcelAddVal} onChange={e => setParcelAddVal(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        const v = e.target.value.trim()
                        if (v && /^\d{6}_\d{1,4}\.[\dA-Za-z_./]+$/.test(v)) {
                          if (!parcels.includes(v)) { updateParcels([...parcels, v]); setParcelAddVal('') }
                        } else if (v) { alert('Nieprawidłowy format działki', 'warning') }
                      }
                    }} />
                  <button onClick={() => {
                    const v = parcelAddVal.trim()
                    if (!v) return
                    if (!/^\d{6}_\d{1,4}\.[\dA-Za-z_./]+$/.test(v)) { alert('Nieprawidłowy format działki', 'warning'); return }
                    if (!parcels.includes(v)) { updateParcels([...parcels, v]); setParcelAddVal('') }
                  }} className="text-green-600 hover:text-green-800 text-sm font-bold leading-none">+</button>
                </span>
              </div>
            </div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Nadleśnictwo</label>
                <input className={inputCls} value={meta.nadlesnictwo||''} onChange={e=>onUpdateMeta({nadlesnictwo:e.target.value})}/></div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Leśnictwo</label>
                <input className={inputCls} value={meta.lesnictwo||''} onChange={e=>onUpdateMeta({lesnictwo:e.target.value})}/></div>
            </div>
            </div>
          )}

          {editMode === 'edit' && geoResults && !gpsLoading && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3 pt-2 border-t border-gray-100">
                <div><label className="block text-xs font-semibold text-gray-600 mb-1">Gmina</label>
                  <input className={inputCls} value={meta.gmina||''} onChange={e=>onUpdateMeta({gmina:e.target.value})}/></div>
                <div><label className="block text-xs font-semibold text-gray-600 mb-1">Powiat</label>
                  <input className={inputCls} value={meta.powiat||''} onChange={e=>onUpdateMeta({powiat:e.target.value})}/></div>
                <div><label className="block text-xs font-semibold text-gray-600 mb-1">Województwo</label>
                  <input className={inputCls} value={meta.wojewodztwo||''} onChange={e=>onUpdateMeta({wojewodztwo:e.target.value})}/></div>
              </div>
              {geoResults.hospitals?.length > 0 && (
                <div><p className="text-xs font-semibold text-gray-600 mb-1">🏥 Szpitale</p>
                  {geoResults.hospitals.map((h,i) => (
                    <label key={i} className={`flex items-center gap-2 text-xs cursor-pointer px-3 py-1.5 rounded border transition ${meta.szpital===h.name?'border-green-400 bg-green-50':'border-gray-100 hover:bg-gray-50'}`}>
                      <input type="radio" name="szpital" checked={meta.szpital===h.name||(i===0&&!meta.szpital)} onChange={()=>onUpdateMeta({szpital:h.name,szpital_tel:h.phone})} className="accent-green-600"/>
                      <span className="font-medium flex-1 text-gray-700">{h.name}</span>
                      <span className="text-xs text-gray-400">{h.duration_min} min &middot; {h.distance_km} km</span>
                    </label>))}
                </div>)}
              {geoResults.fire?.length > 0 && (
                <div><p className="text-xs font-semibold text-gray-600 mb-1">🚒 PSP</p>
                  {geoResults.fire.map((f,i) => (
                    <label key={i} className={`flex items-center gap-2 text-xs cursor-pointer px-3 py-1.5 rounded border transition ${meta.psp===f.name?'border-green-400 bg-green-50':'border-gray-100 hover:bg-gray-50'}`}>
                      <input type="radio" name="psp" checked={meta.psp===f.name||(i===0&&!meta.psp)} onChange={()=>onUpdateMeta({psp:f.name,psp_tel:f.phone})} className="accent-green-600"/>
                      <span className="font-medium flex-1 text-gray-700">{f.name}</span>
                      {f.distance_km !== '-' && <span className="text-xs text-gray-400">{f.duration_min} min &middot; {f.distance_km} km</span>}
                    </label>))}
                </div>)}
              {geoResults.police?.length > 0 && (
                <div><p className="text-xs font-semibold text-gray-600 mb-1">🚔 Policja ({meta.gmina||'najbliższa'})</p>
                  {geoResults.police.map((p,i) => (
                    <label key={i} className={`flex items-center gap-2 text-xs cursor-pointer px-3 py-1.5 rounded border transition ${meta.policja===p.name?'border-green-400 bg-green-50':'border-gray-100 hover:bg-gray-50'}`}>
                      <input type="radio" name="policja" checked={meta.policja===p.name||(i===0&&!meta.policja)} onChange={()=>onUpdateMeta({policja:p.name,policja_tel:p.phone})} className="accent-green-600"/>
                      <span className="font-medium flex-1 text-gray-700">{p.name}</span>
                      <span className="text-xs text-gray-400">{p.duration_min} min &middot; {p.distance_km} km</span>
                    </label>))}
                </div>)}
              {((geoResults.clinics?.length>0)||geoResults.nfz) && (
                <div><p className="text-xs font-semibold text-gray-600 mb-1">🩺 Przychodnie</p>
                  {geoResults.nfz&&(
                    <label className={`flex items-center gap-2 text-xs cursor-pointer px-3 py-1.5 rounded border transition ${meta.przychodnia===geoResults.nfz.name?'border-green-400 bg-green-50':'border-gray-100 hover:bg-gray-50'}`}>
                      <input type="radio" name="przychodnia" checked={meta.przychodnia===geoResults.nfz.name||!meta.przychodnia} onChange={()=>onUpdateMeta({przychodnia:geoResults.nfz.name,tel_przychodnia:geoResults.nfz.phone})} className="accent-green-600"/>
                      <span className="font-medium flex-1 text-gray-700">{geoResults.nfz.name}</span>
                      {geoResults.nfz.phone&&<span className="text-xs text-gray-400">{geoResults.nfz.phone}</span>}
                    </label>)}
                  {(geoResults.clinics||[]).filter(c => c && typeof c.name === 'string' && c.name.trim()).slice(0,3).map((c,i)=>(
                    <label key={i} className={`flex items-center gap-2 text-xs cursor-pointer px-3 py-1.5 rounded border transition ${meta.przychodnia===c.name?'border-green-400 bg-green-50':'border-gray-100 hover:bg-gray-50'}`}>
                      <input type="radio" name="przychodnia" checked={meta.przychodnia===c.name} onChange={()=>onUpdateMeta({przychodnia:c.name})} className="accent-green-600"/>
                      <span className="font-medium flex-1 text-gray-700">{c.name}</span>
                      <span className="text-xs text-gray-400">{c.duration_min} min &middot; {c.distance_km} km</span>
                    </label>))}
                </div>)}
              {editMode === 'edit' && (
                <div className="flex justify-end pt-3 border-t border-gray-100">
                  <button onClick={() => setEditMode('view')}
                    className="text-sm bg-green-700 text-white px-6 py-2 rounded-lg hover:bg-green-800 transition font-medium">
                    ✅ Zapisz
                  </button>
                </div>
              )}
            </div>)}
        </Module>

        {/* Moduł: Miejsce bezpieczne (schronienie) */}
        <Module icon="🏠" title="Miejsce bezpieczne (schronienie)">
          <p className="text-xs text-gray-400 mb-4">Miejsce tymczasowego schronienia na wypadek ewakuacji — wymagane przed obozem.</p>
          <div className="grid grid-cols-1 gap-3">
            <Field label="Miejscowość" required>
              <input className={inputCls}
                value={meta.bezp_miejscowosc || ''}
                onChange={e => onUpdateMeta({ bezp_miejscowosc: e.target.value })} />
            </Field>
            <Field label="Budynek / nazwa">
              <input className={inputCls}
                value={meta.bezp_budynek || ''}
                onChange={e => onUpdateMeta({ bezp_budynek: e.target.value })} />
            </Field>
            <Field label="Dokładny adres">
              <input className={inputCls}
                value={meta.bezp_adres || ''}
                onChange={e => onUpdateMeta({ bezp_adres: e.target.value })} />
            </Field>
          </div>
        </Module>

        </> /* koniec zakładki Teren */}

      </div>
      </div> {/* koniec flex-1 overflow-y-auto */}

      {showCampModal && (
        <CampRegistrationModal
          onClose={() => setShowCampModal(false)}
          onSaved={() => setShowCampModal(false)}
          userId={userId}
          prefill={{
            jednostka:    meta.jednostka,
            kierownik:    meta.kierownik,
            tel_kierownik: meta.tel_kierownik,
            date_start:   meta.date_start,
            date_end:     meta.date_end,
          }}
        />
      )}
    </div>
  )
}
