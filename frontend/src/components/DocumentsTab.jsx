import { useState } from 'react'
import { DOC_TEMPLATES } from '../data/dokumenty-szablony.js'
import DocumentEditor from './DocumentEditor.jsx'
import ImportDocumentEditor from './ImportDocumentEditor.jsx'

const BUILTIN_DOCS = Object.entries(DOC_TEMPLATES).map(([id, t]) => ({ id, ...t }))

export default function DocumentsTab({ meta, onNavigate, progress, onToggleProgress }) {
  const metaOk = meta.jednostka && meta.kierownik

  const [selectedDoc, setSelectedDoc] = useState(null)
  const [showImport, setShowImport] = useState(false)

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
            Generuj pisma i dokumenty wymagane do organizacji obozu — dane pobierane automatycznie
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
          {BUILTIN_DOCS.map(doc => (
            <button key={doc.id}
              onClick={() => setSelectedDoc(doc)}
              className={`w-full flex items-center gap-4 p-4 bg-white rounded-2xl border-2 text-left transition ${
                metaOk
                  ? 'border-gray-200 hover:border-green-400 hover:bg-green-50'
                  : 'border-gray-200 opacity-60 cursor-not-allowed'
              }`}
            >
              <span className="text-3xl shrink-0">{doc.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-gray-800 leading-tight truncate">{doc.label}</div>
                <div className="text-xs text-gray-400 mt-0.5">Kliknij aby edytować</div>
              </div>
            </button>
          ))}
        </div>

        {metaOk && (
          <button onClick={() => setShowImport(true)}
            className="w-full border-2 border-dashed border-gray-300 rounded-2xl py-4 text-sm text-gray-400 hover:border-green-400 hover:text-green-600 transition">
            📥 Importuj dokument z pliku (JPG, PNG, PDF)
          </button>
        )}
      </div>

      {/* Edytor full screen */}
      {selectedDoc && (
        <DocumentEditor
          templateHtml={selectedDoc.html || ''}
          meta={meta}
          docLabel={selectedDoc.label}
          onClose={() => setSelectedDoc(null)}
          onSave={() => {}}
          recipients={selectedDoc.recipients || null}
          multiRecipient={selectedDoc.multiRecipient || false}
          attachments={selectedDoc.attachments || null}
        />
      )}

      {/* Import dokumentu */}
      {showImport && (
        <ImportDocumentEditor
          onClose={() => setShowImport(false)}
          onDocumentSaved={() => {}}
        />
      )}
    </div>
  )
}
