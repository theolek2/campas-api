import { useState } from 'react'
import DocumentEditor from './DocumentEditor.jsx'
import OfficialDocumentEditor from './OfficialDocumentEditor.jsx'
import officialDocs from '../data/official-docs.json'

const OFFICIAL_DOCS = Object.entries(officialDocs).map(([id, t]) => ({ id, ...t }))

export default function DocumentsTab({ meta, onNavigate, progress, onToggleProgress }) {
  const metaOk = meta.jednostka && meta.kierownik
  const [selectedDoc, setSelectedDoc] = useState(null)
  const [selectedOfficialDoc, setSelectedOfficialDoc] = useState(null)

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-green-900">📄 Dokumenty</h2>
          <div className="flex items-center gap-2 mt-2">
            <button onClick={(e) => onToggleProgress?.('docs', e)}
              className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition ${
                progress?.docs ? 'bg-green-500 text-white border-green-600' : 'bg-white text-gray-500 border-gray-300 hover:border-green-400'
              }`}>
              {progress?.docs ? '✅' : '⬜'} Zrobione
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Oficjalne dokumenty PDF — dane pobierane automatycznie z zakładki Dane obozu
          </p>
        </div>

        {!metaOk && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-sm text-orange-700 flex items-center gap-3">
            <span className="text-xl shrink-0">⚠️</span>
            <div className="flex-1">
              <div className="font-semibold">Uzupełnij dane obozu</div>
              <div className="text-orange-600 text-xs mt-0.5">Dokumenty będą auto-wypełniane danymi z zakładki Dane obozu</div>
            </div>
            <button onClick={() => onNavigate('Dane obozu')}
              className="shrink-0 bg-orange-600 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-orange-700 transition">
              Przejdź do danych obozu →
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {OFFICIAL_DOCS.map(doc => (
            <button key={doc.id}
              onClick={() => setSelectedOfficialDoc(doc.id)}
              className={`w-full flex items-center gap-4 p-4 bg-white rounded-2xl border-2 text-left transition ${
                metaOk
                  ? 'border-gray-200 hover:border-green-400 hover:bg-green-50'
                  : 'border-gray-200 opacity-60 cursor-not-allowed'
              }`}
              disabled={!metaOk}
            >
              <span className="text-3xl shrink-0">{doc.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-gray-800 leading-tight truncate">{doc.label}</div>
                <div className="text-xs text-gray-400 mt-0.5">{doc.fields?.length || 0} pól · {doc.pages || 1} str.</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {selectedOfficialDoc && (
        <OfficialDocumentEditor
          docId={selectedOfficialDoc}
          meta={meta}
          onClose={() => setSelectedOfficialDoc(null)}
        />
      )}
    </div>
  )
}
