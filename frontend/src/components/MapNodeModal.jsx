import { useState } from 'react'
import {
  NODE_LABELS, NODE_ICONS, NODE_DETAIL_IMAGE_KEY, NODE_TO_AREA, NODE_AREAS,
} from '../data/mapNodes'
import detaleInfo from '../assets/map/detale-info.png'
import detalePsp from '../assets/map/detale-psp.png'
import detaleKuratorium from '../assets/map/detale-kuratorium.png'
import detaleOgolny from '../assets/map/detale-ogolny.png'

const IMAGE_MAP = {
  'detale-info': detaleInfo, 'detale-psp': detalePsp,
  'detale-kuratorium': detaleKuratorium, 'detale-ogolny': detaleOgolny,
}
const DEFAULT_DETAIL_IMAGE = detaleOgolny

/**
 * MapNodeModal — modal po kliknięciu obszaru na mapie.
 */
export default function MapNodeModal({ nodeId, status, meta, onClose, onDone, onNavigate, allNodeIds, nodeStatus, onSelectNode }) {
  const label = NODE_LABELS[nodeId] || nodeId
  const icon = NODE_ICONS[nodeId] || '📍'

  // Znajdź wszystkie węzły w tym obszarze
  const areaId = NODE_TO_AREA[nodeId] || nodeId
  const siblingNodes = allNodeIds.filter(nid => (NODE_TO_AREA[nid] || nid) === areaId)

  const getDetailImage = () => {
    const key = NODE_DETAIL_IMAGE_KEY[nodeId] || NODE_DETAIL_IMAGE_KEY[areaId]
    return key ? IMAGE_MAP[key] || DEFAULT_DETAIL_IMAGE : DEFAULT_DETAIL_IMAGE
  }
  const detailImg = getDetailImage()

  // ── Treść modala zależna od typu węzła ──
  const renderContent = () => {
    switch (nodeId) {
      case '0.1':
        return (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Wybierz miejsce obozu — rozpocznij od wskazania lokalizacji na mapie w zakładce "Teren".
            </p>
            <button
              onClick={() => onNavigate('/before/camp')}
              className="w-full bg-green-700 text-white py-2.5 rounded-xl font-bold hover:bg-green-800 transition"
            >
              🗺️ Otwórz zakładkę "Teren"
            </button>
            {status === 'done' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
                ✅ Lokalizacja wybrana — świetnie!
              </div>
            )}
          </div>
        )

      case '1.1': return <MetaField label="Nazwa jednostki" field="jednostka" meta={meta} />
      case '1.2': return <MetaField label="Imię i nazwisko kierownika" field="kierownik" meta={meta} />
      case '1.3': return (
        <div className="space-y-2">
          <MetaField label="Data rozpoczęcia" field="date_start" meta={meta} type="date" />
          <MetaField label="Data zakończenia" field="date_end" meta={meta} type="date" />
        </div>
      )
      case '1.4': return <MetaField label="Liczba uczestników" field="uczestnicy" meta={meta} type="number" />
      case '1.5': return (
        <div className="space-y-2">
          <p className="text-sm text-gray-600">Dodaj wychowawców (imię, nazwisko, funkcja, data niekaralności):</p>
          <button
            onClick={() => onNavigate('/before/camp')}
            className="w-full bg-green-700 text-white py-2 rounded-xl font-bold hover:bg-green-800 transition text-sm"
          >
            📋 Otwórz formularz kadry
          </button>
          {Array.isArray(meta.wychowawcy) && meta.wychowawcy.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-2 text-xs">
              ✅ {meta.wychowawcy.length} osób w kadrze
            </div>
          )}
        </div>
      )

      case '2.1': return <DocLink label="Regulamin obozu" onNavigate={() => onNavigate('/before/docs')} />
      case '2.2': return <ManualCheck label="Instrukcja ppoż gotowa?" nodeId={nodeId} onDone={onDone} />
      case '2.3': return <DocLink label="Mapa zagospodarowania terenu" onNavigate={() => onNavigate('/before/map')} />
      case '2.4': return <DocLink label="Drogi ewakuacyjne + mapa dojazdu" onNavigate={() => onNavigate('/before/map')} />
      case '2.5': return (
        <div className="space-y-2">
          <p className="text-sm text-gray-600">Określ środki łączności i liczbę uczestników (zał. 6 do PSP).</p>
          <button
            onClick={() => onNavigate('/before/camp')}
            className="w-full bg-green-700 text-white py-2 rounded-xl font-bold hover:bg-green-800 transition text-sm"
          >
            📡 Otwórz dane
          </button>
        </div>
      )

      case '3.1': return (
        <div className="space-y-3">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
            ⚠️ To kluczowy etap! PSP ma 2-3 tygodnie na wydanie opinii. Może wymagać wizji lokalnej.
          </div>
          <ManualCheck label="Wniosek o opinię ppoż wysłany" nodeId={nodeId} onDone={onDone} />
        </div>
      )

      case '4.1': return (
        <div className="space-y-3">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
            ⚠️ Zgłoszenie musi trafić do Kuratorium najpóźniej 21 dni przed obozem.
          </div>
          <ManualCheck label="Zgłoszenie wysłane do Kuratorium" nodeId={nodeId} onDone={onDone} />
        </div>
      )

      case '4.2': case '4.3':
      case '5.1': case '5.2': case '5.3': case '5.4': case '5.5':
      case '6.2': case '6.3':
        return <ManualCheck label={`"${label}" — gotowe?`} nodeId={nodeId} onDone={onDone} />

      case '6.1': return (
        <div className="space-y-2">
          <button onClick={() => onNavigate('/before/plan')} className="w-full bg-green-700 text-white py-2 rounded-xl font-bold hover:bg-green-800 transition text-sm">
            📋 Plan zajęć
          </button>
          <button onClick={() => onNavigate('/before/jadlospis')} className="w-full bg-green-700 text-white py-2 rounded-xl font-bold hover:bg-green-800 transition text-sm">
            🍽️ Jadłospis
          </button>
        </div>
      )

      case '6.4': return (
        <div className="text-center py-4 space-y-3">
          <div className="text-5xl">🏁</div>
          <h3 className="text-xl font-bold text-green-800">Obóz gotowy!</h3>
          <p className="text-sm text-gray-600">Wszystkie zadania wykonane. Czas pakować plecaki!</p>
        </div>
      )

      default:
        return <ManualCheck label={`"${label}" — gotowe?`} nodeId={nodeId} onDone={onDone} />
    }
  }

  const isLocked = status === 'locked'
  const hasSubTabs = siblingNodes.length > 1

  return (
    <div className="fixed inset-0 z-[3000] flex" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div
        className="relative m-auto w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="relative h-48 bg-gray-100 rounded-t-2xl overflow-hidden">
          <img src={detailImg} alt={label} className="w-full h-full object-cover" />
          <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center text-gray-600 hover:bg-white transition">✕</button>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/40 to-transparent p-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{icon}</span>
              <h3 className="text-white font-bold text-lg">{label}</h3>
            </div>
          </div>
        </div>

        {/* Sub-tabs dla obszarów z wieloma węzłami */}
        {hasSubTabs && (
          <div className="flex border-b border-gray-200 bg-gray-50">
            {siblingNodes.map(nid => {
              const s = nodeStatus[nid] || 'locked'
              const nodeLabel = NODE_LABELS[nid] || nid
              return (
                <button key={nid} onClick={() => onSelectNode(nid)}
                  className={`flex-1 py-2 text-xs font-semibold transition ${
                    nid === nodeId ? 'bg-white text-green-800 border-b-2 border-green-600' : 'text-gray-500 hover:text-gray-700'
                  }`}>
                  <span className="mr-1">{s === 'done' ? '✅' : NODE_ICONS[nid]}</span>{nodeLabel}
                </button>
              )
            })}
          </div>
        )}

        {/* Treść */}
        <div className="p-5">
          {isLocked ? (
            <div className="text-center py-6 space-y-3">
              <div className="text-4xl">🔒</div>
              <p className="font-semibold text-gray-700">Ten punkt jest zablokowany</p>
              <p className="text-sm text-gray-500">Wykonaj wcześniejsze zadania, aby go odblokować.</p>
              {nodeId === '3.1' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800 text-left">
                  <p className="font-semibold mb-1">Potrzebujesz:</p>
                  <ul className="list-disc pl-4 space-y-0.5">
                    <li>✅ Wypełniona nazwa jednostki (ETAP 1)</li>
                    <li>Wszystkie załączniki do PSP (ETAP 2): regulamin, instrukcja ppoż, mapy, drogi ewakuacyjne, środki łączności</li>
                  </ul>
                </div>
              )}
              {nodeId === '4.1' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800 text-left">
                  <p className="font-semibold mb-1">Potrzebujesz:</p>
                  <ul className="list-disc pl-4 space-y-0.5">
                    <li>✅ Pozytywna opinia PSP (ETAP 3)</li>
                  </ul>
                </div>
              )}
            </div>
          ) : (
            renderContent()
          )}
        </div>
      </div>
    </div>
  )
}

// ── Proste komponenty pomocnicze ─────────────────────────────────────────

function MetaField({ label, field, meta, type = 'text' }) {
  const value = meta?.[field] || ''
  const isDone = !!value
  return (
    <div className={`bg-white border rounded-xl p-4 ${isDone ? 'border-green-300 bg-green-50' : 'border-gray-200'}`}>
      <div className="text-xs text-gray-400 uppercase mb-1">{label}</div>
      {isDone ? (
        <div className="flex items-center gap-2">
          <span className="font-medium text-green-800">
            {type === 'date' ? new Date(value).toLocaleDateString('pl-PL') : value}
          </span>
          <span className="text-green-500">✅</span>
        </div>
      ) : (
        <div className="text-gray-400 italic text-sm">Jeszcze nie podano</div>
      )}
    </div>
  )
}

function DocLink({ label, onNavigate }) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600">{label}</p>
      <button
        onClick={onNavigate}
        className="w-full bg-green-700 text-white py-2.5 rounded-xl font-bold hover:bg-green-800 transition"
      >
        📄 Otwórz dokumenty
      </button>
    </div>
  )
}

function ManualCheck({ label, nodeId, onDone }) {
  const [checked, setChecked] = useState(false)

  const handle = () => {
    setChecked(true)
    if (onDone) onDone(nodeId, 'done')
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600">{label}</p>
      {checked ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800 flex items-center gap-2">
          <span>✅</span> Zrobione!
        </div>
      ) : (
        <button
          onClick={handle}
          className="w-full bg-green-700 text-white py-2.5 rounded-xl font-bold hover:bg-green-800 transition"
        >
          ✅ Oznacz jako zrobione
        </button>
      )}
    </div>
  )
}
