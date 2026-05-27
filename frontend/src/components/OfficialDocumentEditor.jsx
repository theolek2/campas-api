import { useState, useRef, useCallback, useEffect } from 'react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import officialDocs from '../data/official-docs.json'

let pdfjsLib = null
let pdfjsLoading = false
let pdfjsResolvers = []

function loadPdfJs() {
  return new Promise((resolve) => {
    if (pdfjsLib) return resolve(pdfjsLib)
    pdfjsResolvers.push(resolve)
    if (pdfjsLoading) return
    pdfjsLoading = true
    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
    script.onload = () => {
      pdfjsLib = window.pdfjsLib
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
      pdfjsResolvers.forEach(r => r(pdfjsLib))
      pdfjsResolvers = []
    }
    script.onerror = () => {
      pdfjsLoading = false
      pdfjsResolvers.forEach(r => r(null))
      pdfjsResolvers = []
    }
    document.head.appendChild(script)
  })
}

async function renderPdfPages(fileUrl) {
  const lib = await loadPdfJs()
  if (!lib) throw new Error('Nie udało się załadować biblioteki PDF.js')
  const response = await fetch(fileUrl + '?v=2', { cache: 'no-cache' })
  if (!response.ok) throw new Error(`PDF not found: ${response.status}`)
  const arrayBuffer = await response.arrayBuffer()
  if (arrayBuffer.byteLength < 100) throw new Error('Plik PDF jest uszkodzony lub za mały')
  const pdf = await lib.getDocument({ data: arrayBuffer }).promise
  const pages = []
  const scale = 1.5
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const viewport = page.getViewport({ scale })
    const canvas = document.createElement('canvas')
    canvas.width = viewport.width
    canvas.height = viewport.height
    const ctx = canvas.getContext('2d')
    await page.render({ canvasContext: ctx, viewport }).promise
    pages.push({ dataUrl: canvas.toDataURL(), width: viewport.width, height: viewport.height })
  }
  return pages
}

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

const OFFICIAL_HEADER = `
<div style="display:flex;align-items:center;gap:12px;border-bottom:2px solid #2d6a2d;padding-bottom:8px;margin-bottom:14px;font-family:'Segoe UI',Arial,sans-serif;">
  <img src="/logo.png" style="height:44px;width:auto;" onerror="this.style.display='none'" />
  <div>
    <div style="font-weight:bold;font-size:11pt;color:#1a4a1a;">Skauci Europy</div>
    <div style="font-size:8pt;color:#555;">Stowarzyszenie Harcerstwa Katolickiego „Zawisza" · Federacja Skautingu Europejskiego</div>
  </div>
</div>`

const OFFICIAL_FOOTER = (page, total) => `
<div style="border-top:1px solid #ccc;margin-top:10px;padding-top:6px;text-align:center;font-size:7.5pt;color:#666;font-family:'Segoe UI',Arial,sans-serif;">
  Skauci Europy · ul. Bitwy Warszawskiej 1920 r. nr 14, 02-366 Warszawa · skauci-europy.pl · biuro@skauci-europy.pl
  <br/>Strona ${page} z ${total}
</div>`

export default function OfficialDocumentEditor({ docId, meta, onClose }) {
  const docConfig = officialDocs[docId]
  const [pages, setPages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [fieldData, setFieldData] = useState({})
  const [selectedField, setSelectedField] = useState(null)
  const containerRef = useRef(null)

  const MAX_W = 794

  useEffect(() => {
    if (!docConfig) { setError('Dokument nie znaleziony'); setLoading(false); return }
    setLoading(true)
    setError('')
    renderPdfPages(docConfig.file)
      .then(loadedPages => {
        setPages(loadedPages)
        const init = {}
        docConfig.fields.forEach(f => { init[f.var] = fieldValue(meta, f.var) })
        setFieldData(init)
        setLoading(false)
      })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [docId, docConfig])

  useEffect(() => {
    if (!docConfig) return
    const init = {}
    docConfig.fields.forEach(f => { init[f.var] = fieldValue(meta, f.var) })
    setFieldData(init)
  }, [meta])

  const handleExport = async () => {
    if (!containerRef.current || pages.length === 0) return
    try {
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const imgW = 210

      for (let pi = 0; pi < pages.length; pi++) {
        if (pi > 0) pdf.addPage()
        const pageEl = document.getElementById(`pdf-page-${pi}`)
        if (!pageEl) continue
        const canvas = await html2canvas(pageEl, { scale: 2, backgroundColor: '#ffffff' })
        const imgH = (canvas.height * imgW) / canvas.width
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, imgW, imgH)
      }
      pdf.save(`${docConfig.label.replace(/\s+/g, '_')}.pdf`)
    } catch { alert('Błąd eksportu PDF') }
  }

  if (loading) return (
    <div className="fixed inset-0 z-[3000] bg-gray-900/60 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-8 text-center"><div className="animate-spin text-4xl mb-3">⏳</div><p className="text-gray-600">Wczytywanie dokumentu...</p></div>
    </div>
  )

  if (error) return (
    <div className="fixed inset-0 z-[3000] bg-gray-900/60 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-8 text-center max-w-md">
        <div className="text-4xl mb-3">⚠️</div>
        <p className="text-red-600 font-semibold mb-2">{error}</p>
        <button onClick={onClose} className="mt-3 text-sm text-gray-500 hover:text-red-600">Zamknij</button>
      </div>
    </div>
  )

  const pageFields = (configFields, pageNum) =>
    configFields.filter(f => (f.page || 1) === pageNum)

  return (
    <div className="fixed inset-0 z-[3000] flex flex-col bg-gray-900/60 backdrop-blur-sm overflow-hidden">
      <div className="bg-white border-b border-gray-200 shrink-0">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-3">
            <h2 className="font-bold text-gray-800 text-sm">{docConfig.icon} {docConfig.label}</h2>
            <span className="text-xs text-gray-400">{pages.length} stron</span>
            <span className="text-xs text-gray-400 bg-blue-50 px-2 py-0.5 rounded">{docConfig.fields.length} pól do wypełnienia</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleExport}
              className="text-xs bg-green-700 text-white px-4 py-1.5 rounded-lg font-bold hover:bg-green-800 transition">
              🖨️ Drukuj / Zapisz PDF
            </button>
            <button onClick={onClose}
              className="w-8 h-8 flex items-center justify-center bg-red-500 text-white rounded-full hover:bg-red-600 font-bold">×</button>
          </div>
        </div>
      </div>

      <div ref={containerRef} className="flex-1 overflow-y-auto p-4 flex flex-col items-center gap-6">
        {pages.map((page, pi) => {
          const scale = Math.min(1, MAX_W / page.width)
          const pw = page.width * scale
          const ph = page.height * scale
          const fields = pageFields(docConfig.fields, pi + 1)

          return (
            <div key={pi} id={`pdf-page-${pi}`} className="bg-white shadow-xl shrink-0" style={{ width: pw }}>
              {pi === 0 && (
                <div className="px-4 pt-3" dangerouslySetInnerHTML={{ __html: OFFICIAL_HEADER }} />
              )}
              <div className="relative" style={{ width: pw, height: ph }}>
                <img src={page.dataUrl} alt={`Strona ${pi + 1}`} className="w-full h-full block" />
                {fields.map(f => {
                  const relX = (f.x / 100) * pw
                  const relY = (f.y / 100) * ph
                  const relW = (f.w / 100) * pw
                  const val = fieldData[f.var] || ''
                  const isActive = selectedField === f.var
                  return (
                    <div key={f.var} className="absolute" style={{ left: relX, top: relY, width: relW, minWidth: 80 }}>
                      <div className="text-[8px] text-gray-400 mb-0.5 ml-0.5">{f.label}</div>
                      <input
                        className={`w-full border-2 rounded px-1.5 py-0.5 text-xs bg-white/95 focus:outline-none ${isActive ? 'border-green-500' : f.var === selectedField ? 'border-blue-400' : 'border-blue-200'}`}
                        value={val}
                        onChange={e => setFieldData(p => ({ ...p, [f.var]: e.target.value }))}
                        onFocus={() => setSelectedField(f.var)}
                        onBlur={() => setSelectedField(null)}
                        style={{ fontSize: '10px', lineHeight: '1.3' }}
                      />
                    </div>
                  )
                })}
              </div>
              <div dangerouslySetInnerHTML={{ __html: OFFICIAL_FOOTER(pi + 1, pages.length) }} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
