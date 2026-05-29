import { useState, useRef } from 'react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

function fieldValue(meta, varName) {
  const w = (meta?.wychowawcy || []).filter(x => x && x.name)
  const m = {
    data_dzis: new Date().toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' }),
    kontakt1: w[0]?.name || '', tel_kontakt1: w[0]?.phone || '',
    kontakt2: w[1]?.name || '', tel_kontakt2: w[1]?.phone || '',
    termin: (meta?.date_start && meta?.date_end) ? `${meta.date_start} – ${meta.date_end}` : '',
    liczba_kadry: meta?.liczba_kadry || (w.length + 1).toString(),
  }
  return m[varName] || meta?.[varName] || ''
}

export default function DocumentEditorView({ doc, meta, onBack }) {
  const [fields, setFields] = useState(() => {
    const init = {}
    if (doc.fields) doc.fields.forEach(f => { init[f.var] = fieldValue(meta, f.var) })
    if (doc.selects) doc.selects.forEach(s => { init[s.var] = s.options[0] })
    return init
  })
  const [exporting, setExporting] = useState(false)
  const pagesRef = useRef([])

  const file = (doc.file || '').split('/').pop().replace('.pdf', '')
  const pages = doc.pages || 1

  const updateField = (varName, value) => setFields(p => ({ ...p, [varName]: value }))

  const handleExport = async () => {
    setExporting(true)
    try {
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const imgW = 210
      for (let pi = 0; pi < pages; pi++) {
        if (pi > 0) pdf.addPage()
        const el = pagesRef.current[pi]
        if (!el) continue
        const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#ffffff' })
        const imgH = (canvas.height * imgW) / canvas.width
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, imgW, imgH)
      }
      pdf.save(`${doc.label.replace(/\s+/g, '_')}.pdf`)
    } catch { alert('Błąd eksportu') }
    finally { setExporting(false) }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-100">
      <div className="bg-white border-b border-gray-200 shrink-0 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-sm text-gray-500 hover:text-green-700 flex items-center gap-1">
            <span className="text-lg leading-none">←</span> Powrót
          </button>
          <h2 className="font-bold text-gray-800 text-sm">{doc.icon} {doc.label}</h2>
          <span className="text-xs text-gray-400">{pages} str. · {(doc.fields?.length||0)+(doc.selects?.length||0)} pól</span>
        </div>
        <button onClick={handleExport} disabled={exporting}
          className="text-xs bg-green-700 text-white px-4 py-1.5 rounded-lg font-bold hover:bg-green-800 disabled:opacity-50">
          {exporting ? '⏳' : '🖨️'} Drukuj PDF
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center gap-6">
        {Array.from({ length: pages }, (_, pi) => {
          const pf = doc.fields?.filter(f => (f.page || 1) === pi + 1) || []
          const ps = doc.selects?.filter(s => (s.page || 1) === pi + 1) || []

          return (
            <div key={pi} ref={el => pagesRef.current[pi] = el}
              className="relative bg-white shadow-xl shrink-0" style={{ width: 794 }}>
              {/* Nagłówek */}
              <div className="flex items-center gap-3 px-5 pt-4 pb-2 border-b-2 border-green-800">
                <div>
                  <div className="font-bold text-[13px] text-green-900">Skauci Europy</div>
                  <div className="text-[9px] text-gray-500">SHK „Zawisza" · Federacja Skautingu Europejskiego</div>
                </div>
              </div>

              {/* Obrazek strony */}
              <div className="relative" style={{ minHeight: 1123 }}>
                <img
                  src={`/api/robert/render-document?file=${encodeURIComponent(file)}.pdf&page=${pi + 1}&scale=150`}
                  alt={`Strona ${pi + 1}`}
                  className="w-full block"
                  onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
                />
                <div className="hidden items-center justify-center text-gray-400 text-sm absolute inset-0">
                  ⏳ Generowanie podglądu strony {pi + 1}...
                </div>

                {/* Nakładki — inputy */}
                {pf.map(f => (
                  <div key={f.var} className="absolute" style={{ left: `${f.x}%`, top: `${f.y}%`, width: `${f.w}%` }}>
                    <input
                      value={fields[f.var] || ''}
                      onChange={e => updateField(f.var, e.target.value)}
                      className="w-full bg-white/80 border border-gray-300 rounded px-1.5 py-0.5 text-[11px] focus:outline-none focus:border-green-500 focus:bg-white"
                      style={{ fontFamily: 'inherit' }}
                    />
                  </div>
                ))}

                {/* Nakładki — dropdowny */}
                {ps.map(s => (
                  <div key={s.var} className="absolute" style={{ left: `${s.x}%`, top: `${s.y}%`, width: `${s.w}%` }}>
                    <select
                      value={fields[s.var] || ''}
                      onChange={e => updateField(s.var, e.target.value)}
                      className="w-full bg-yellow-50/90 border border-yellow-400 rounded px-1.5 py-0.5 text-[11px] focus:outline-none focus:border-yellow-600"
                      style={{ fontFamily: 'inherit' }}
                    >
                      {s.options.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                ))}
              </div>

              {/* Stopka */}
              <div className="px-5 py-2 border-t border-gray-200 text-center text-[9px] text-gray-400">
                Skauci Europy · ul. Bitwy Warszawskiej 1920 r. nr 14, 02-366 Warszawa · skauci-europy.pl · Strona {pi + 1} z {pages}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
