import { useState, useEffect } from 'react'
import officialDocs from '../data/official-docs.json'

function fieldValue(meta, varName) {
  const w = (meta.wychowawcy || []).filter(x => x.name)
  const map = {
    data_dzis: new Date().toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' }),
    kontakt1: w[0]?.name || '',
    tel_kontakt1: w[0]?.phone || '',
    kontakt2: w[1]?.name || '',
    tel_kontakt2: w[1]?.phone || '',
    termin: (meta.date_start && meta.date_end) ? `${meta.date_start} – ${meta.date_end}` : '',
    liczba_kadry: meta.liczba_kadry || (w.length + 1).toString(),
  }
  if (varName in map) return map[varName]
  return meta[varName] || ''
}

export default function OfficialDocumentEditor({ docId, meta, onClose }) {
  const docConfig = (officialDocs && officialDocs[docId]) || null
  const [fieldData, setFieldData] = useState({})
  const [error, setError] = useState('')

  useEffect(() => {
    if (!docConfig) return
    try {
      const init = {}
      docConfig.fields.forEach(f => { init[f.var] = fieldValue(meta, f.var) })
      setFieldData(init)
    } catch (e) { setError(e.message) }
  }, [docId])

  if (!docConfig) return (
    <div className="fixed inset-0 z-[3000] bg-gray-900/60 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-8">Nie znaleziono dokumentu: {docId}</div>
    </div>
  )

  if (error) return (
    <div className="fixed inset-0 z-[3000] bg-gray-900/60 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-8 text-red-600">{error}</div>
    </div>
  )

  const file = docConfig.file
  const filename = file.split('/').pop()

  return (
    <div className="fixed inset-0 z-[3000] flex flex-col bg-gray-900/60 backdrop-blur-sm overflow-hidden">
      <div className="bg-white border-b border-gray-200 shrink-0">
        <div className="flex items-center justify-between px-4 py-2">
          <h2 className="font-bold text-gray-800 text-sm">{docConfig.icon} {docConfig.label}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center bg-red-500 text-white rounded-full hover:bg-red-600 font-bold">×</button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 bg-gray-200 flex items-start justify-center overflow-auto p-4">
          <div className="bg-white shadow-xl" style={{ width: '210mm', minHeight: '297mm' }}>
            <iframe
              src={`/dokumenty/${filename}`}
              className="w-full border-0"
              style={{ height: `${(docConfig.pages || 1) * 297}mm` }}
              title={docConfig.label}
            />
          </div>
        </div>

        <div className="w-72 shrink-0 bg-white border-l border-gray-200 flex flex-col overflow-y-auto">
          <div className="p-3 border-b border-gray-100">
            <h3 className="font-semibold text-sm text-gray-700">Pola do wypełnienia</h3>
            <p className="text-xs text-gray-400 mt-0.5">Jeśli chcesz wydrukować: Ctrl+P w przeglądarce</p>
          </div>
          <div className="flex-1 p-3 space-y-3">
            {docConfig.fields && docConfig.fields.map(f => (
              <div key={f.var} className="mb-2.5">
                <label className="block text-[10px] text-gray-500 mb-0.5">{f.label || f.var}</label>
                <input className="w-full border-2 border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-green-500 hover:border-blue-300"
                  value={fieldData[f.var] || ''}
                  onChange={e => setFieldData(p => ({ ...p, [f.var]: e.target.value }))}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
