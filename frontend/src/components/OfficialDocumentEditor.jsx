import { useState, useRef, useEffect } from 'react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import officialDocs from '../data/official-docs.json'

function fieldValue(meta, varName) {
  const wychowawcy = (meta.wychowawcy || []).filter(w => w.name)
  const map = {
    data_dzis: new Date().toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' }),
    kontakt1: wychowawcy[0]?.name || '',
    tel_kontakt1: wychowawcy[0]?.phone || '',
    kontakt2: wychowawcy[1]?.name || '',
    tel_kontakt2: wychowawcy[1]?.phone || '',
    termin: (meta.date_start && meta.date_end) ? `${meta.date_start} – ${meta.date_end}` : '',
    liczba_kadry: meta.liczba_kadry || (wychowawcy.length + 1).toString(),
  }
  if (varName in map) return map[varName]
  return meta[varName] || ''
}

export default function OfficialDocumentEditor({ docId, meta, onClose }) {
  const docConfig = officialDocs[docId]
  const [fieldData, setFieldData] = useState({})
  const [selectedField, setSelectedField] = useState(null)
  const [exporting, setExporting] = useState(false)
  const exportRef = useRef(null)

  useEffect(() => {
    if (!docConfig) return
    const init = {}
    docConfig.fields.forEach(f => { init[f.var] = fieldValue(meta, f.var) })
    setFieldData(init)
  }, [docId, meta])

  if (!docConfig) return null

  const handleExport = async () => {
    if (!exportRef.current) return
    setExporting(true)
    try {
      const A4_W = 794 // px at 96dpi
      const A4_H = 1123
      const margin = 40
      const logoImg = new Image()
      logoImg.src = '/logo.png'

      await new Promise(r => { logoImg.onload = r; if (logoImg.complete) r() })

      const canvas = document.createElement('canvas')
      canvas.width = A4_W
      canvas.height = A4_H * docConfig.pages
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#fff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      for (let pi = 0; pi < docConfig.pages; pi++) {
        const pageY = pi * A4_H
        const pageFields = docConfig.fields.filter(f => (f.page || 1) === pi + 1)

        // Nagłówek (tylko pierwsza strona)
        if (pi === 0) {
          ctx.strokeStyle = '#2d6a2d'
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.moveTo(margin, margin + 70)
          ctx.lineTo(A4_W - margin, margin + 70)
          ctx.stroke()

          if (logoImg.width > 0) {
            ctx.drawImage(logoImg, margin, margin + 10, 52, 52)
          }
          ctx.fillStyle = '#1a4a1a'
          ctx.font = 'bold 17px Segoe UI, Arial, sans-serif'
          ctx.fillText('Skauci Europy', margin + 64, margin + 38)
          ctx.fillStyle = '#555'
          ctx.font = '11px Segoe UI, Arial, sans-serif'
          ctx.fillText('Stowarzyszenie Harcerstwa Katolickiego „Zawisza" · Federacja Skautingu Europejskiego', margin + 64, margin + 56)
        }

        // Pola
        ctx.font = '12px Segoe UI, Arial, sans-serif'
        ctx.textBaseline = 'top'
        let lastBottom = 0
        pageFields.forEach(f => {
          const x = margin + (f.x / 100) * (A4_W - margin * 2)
          const y = pageY + margin + 70 + (f.y / 100) * (A4_H - margin * 2 - 70)
          const w = (f.w / 100) * (A4_W - margin * 2)

          ctx.fillStyle = '#666'
          ctx.font = '9px Segoe UI, Arial, sans-serif'
          ctx.fillText(f.label || f.var, x, y - 14)
          ctx.fillStyle = '#111'
          ctx.font = 'bold 11px Segoe UI, Arial, sans-serif'
          ctx.fillText(fieldData[f.var] || '_____________', x, y)
          ctx.strokeStyle = '#ccc'
          ctx.lineWidth = 0.5
          ctx.beginPath()
          ctx.moveTo(x, y + 16)
          ctx.lineTo(x + Math.max(w, 80), y + 16)
          ctx.stroke()

          if (y > lastBottom) lastBottom = y + 20
        })

        // Stopka
        const footerY = pageY + A4_H - margin + 5
        ctx.strokeStyle = '#ccc'
        ctx.lineWidth = 0.5
        ctx.beginPath()
        ctx.moveTo(margin, footerY - 14)
        ctx.lineTo(A4_W - margin, footerY - 14)
        ctx.stroke()
        ctx.fillStyle = '#888'
        ctx.font = '9px Segoe UI, Arial, sans-serif'
        ctx.fillText('Skauci Europy · ul. Bitwy Warszawskiej 1920 r. nr 14, 02-366 Warszawa · skauci-europy.pl', margin, footerY)
        ctx.fillText(`Strona ${pi + 1} z ${docConfig.pages}`, A4_W - margin - 80, footerY)
      }

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      for (let pi = 0; pi < docConfig.pages; pi++) {
        if (pi > 0) pdf.addPage()
        const pageCanvas = document.createElement('canvas')
        pageCanvas.width = A4_W
        pageCanvas.height = A4_H
        const pctx = pageCanvas.getContext('2d')
        pctx.drawImage(canvas, 0, pi * A4_H, A4_W, A4_H, 0, 0, A4_W, A4_H)
        pdf.addImage(pageCanvas.toDataURL('image/png'), 'PNG', 0, 0, 210, 297)
      }
      pdf.save(`${docConfig.label.replace(/\s+/g, '_')}.pdf`)
    } catch { alert('Błąd eksportu') }
    finally { setExporting(false) }
  }

  return (
    <div className="fixed inset-0 z-[3000] flex flex-col bg-gray-900/60 backdrop-blur-sm overflow-hidden">
      <div className="bg-white border-b border-gray-200 shrink-0">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-3">
            <h2 className="font-bold text-gray-800 text-sm">{docConfig.icon} {docConfig.label}</h2>
            <span className="text-xs text-gray-400">{docConfig.pages} str. · {docConfig.fields.length} pól</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleExport} disabled={exporting}
              className="text-xs bg-green-700 text-white px-4 py-1.5 rounded-lg font-bold hover:bg-green-800 transition disabled:opacity-50">
              {exporting ? 'Generowanie...' : '🖨️ Drukuj PDF'}
            </button>
            <button onClick={onClose}
              className="w-8 h-8 flex items-center justify-center bg-red-500 text-white rounded-full hover:bg-red-600 font-bold">×</button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Lewa: Podgląd PDF */}
        <div className="flex-1 bg-gray-200 flex items-start justify-center overflow-auto p-4">
          <div className="bg-white shadow-xl" style={{ width: '210mm', minHeight: '297mm' }}>
            <iframe
              src={docConfig.file}
              className="w-full border-0"
              style={{ height: `${docConfig.pages * 297}mm` }}
              title="Podgląd dokumentu"
            />
          </div>
        </div>

        {/* Prawa: Panel pól */}
        <div className="w-72 shrink-0 bg-white border-l border-gray-200 flex flex-col overflow-y-auto">
          <div className="p-3 border-b border-gray-100">
            <h3 className="font-semibold text-sm text-gray-700">Pola do wypełnienia</h3>
            <p className="text-xs text-gray-400 mt-0.5">Dane auto-uzupełniane z zakładki Dane obozu</p>
          </div>
          <div className="flex-1 p-3 space-y-3">
            {Array.from(new Set(docConfig.fields.map(f => f.page || 1))).map(pi => (
              <div key={pi}>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Strona {pi}</p>
                {docConfig.fields.filter(f => (f.page || 1) === pi).map(f => (
                  <div key={f.var} className="mb-2.5">
                    <label className="block text-[10px] text-gray-500 mb-0.5">{f.label}</label>
                    <input
                      className={`w-full border-2 rounded px-2 py-1 text-xs focus:outline-none ${f.var === selectedField ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-blue-300'}`}
                      value={fieldData[f.var] || ''}
                      onChange={e => { setFieldData(p => ({ ...p, [f.var]: e.target.value })); setSelectedField(f.var) }}
                      onFocus={() => setSelectedField(f.var)}
                      onBlur={() => setSelectedField(null)}
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div ref={exportRef} style={{ position: 'absolute', left: '-9999px', top: 0 }} />
    </div>
  )
}
