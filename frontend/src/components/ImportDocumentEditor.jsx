import { useState, useRef, useCallback } from 'react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

let pdfjsLib = null

function loadPdfJs() {
  return new Promise((resolve, reject) => {
    if (pdfjsLib) return resolve(pdfjsLib)
    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
    script.onload = () => {
      // ustaw workera
      if (window.pdfjsLib) {
        pdfjsLib = window.pdfjsLib
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
        resolve(pdfjsLib)
      } else {
        reject(new Error('pdf.js nie załadowany'))
      }
    }
    script.onerror = reject
    document.head.appendChild(script)
  })
}

async function pdfToImage(file) {
  await loadPdfJs()
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  const page = await pdf.getPage(1)
  const viewport = page.getViewport({ scale: 1.5 })
  const canvas = document.createElement('canvas')
  canvas.width = viewport.width
  canvas.height = viewport.height
  const ctx = canvas.getContext('2d')
  await page.render({ canvasContext: ctx, viewport }).promise
  return { dataUrl: canvas.toDataURL(), width: viewport.width, height: viewport.height }
}

export default function ImportDocumentEditor({ onClose, onDocumentSaved }) {
  const [image, setImage] = useState(null)
  const [imageSize, setImageSize] = useState(null)
  const [fields, setFields] = useState([])
  const [dragField, setDragField] = useState(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [loading, setLoading] = useState(false)
  const containerRef = useRef(null)
  const fileRef = useRef(null)
  const [docName, setDocName] = useState('')

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setDocName(file.name.replace(/\.[^.]+$/, ''))
    setLoading(true)
    setFields([])

    try {
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        const result = await pdfToImage(file)
        const maxW = 794
        const scale = Math.min(1, maxW / result.width)
        setImageSize({ width: result.width * scale, height: result.height * scale })
        setImage(result.dataUrl)
      } else {
        const dataUrl = await new Promise((resolve) => {
          const reader = new FileReader()
          reader.onload = (ev) => resolve(ev.target.result)
          reader.readAsDataURL(file)
        })
        const img = new Image()
        img.onload = () => {
          const maxW = 794
          const scale = Math.min(1, maxW / img.width)
          setImageSize({ width: img.width * scale, height: img.height * scale })
          setImage(dataUrl)
        }
        img.src = dataUrl
      }
    } catch {
      alert('Nie udało się wczytać pliku. Spróbuj innego formatu.')
    } finally {
      setLoading(false)
    }
    // reset input aby można było wybrać ten sam plik ponownie
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleCanvasClick = (e) => {
    if (!containerRef.current || !imageSize) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / imageSize.width) * 100
    const y = ((e.clientY - rect.top) / imageSize.height) * 100
    setFields(prev => [...prev, { id: Date.now(), x: Math.round(x), y: Math.round(y), text: '' }])
  }

  const updateFieldText = (id, text) =>
    setFields(prev => prev.map(f => f.id === id ? { ...f, text } : f))

  const removeField = (id) =>
    setFields(prev => prev.filter(f => f.id !== id))

  const handleFieldMouseDown = (e, field) => {
    e.stopPropagation()
    if (!containerRef.current || !imageSize) return
    const rect = containerRef.current.getBoundingClientRect()
    const clickX = ((e.clientX - rect.left) / imageSize.width) * 100
    const clickY = ((e.clientY - rect.top) / imageSize.height) * 100
    setDragField(field.id)
    setDragOffset({ x: clickX - field.x, y: clickY - field.y })
  }

  const handleMouseMove = useCallback((e) => {
    if (!dragField || !containerRef.current || !imageSize) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / imageSize.width) * 100
    const y = ((e.clientY - rect.top) / imageSize.height) * 100
    setFields(prev => prev.map(f =>
      f.id === dragField ? { ...f, x: Math.round(x - dragOffset.x), y: Math.round(y - dragOffset.y) } : f
    ))
  }, [dragField, dragOffset, imageSize])

  const handleMouseUp = () => setDragField(null)

  const handleExport = async () => {
    if (!containerRef.current) return
    try {
      const canvas = await html2canvas(containerRef.current, { scale: 2, backgroundColor: '#ffffff' })
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const imgW = 210
      const imgH = (canvas.height * imgW) / canvas.width
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, imgW, imgH)
      pdf.save(`${docName || 'dokument'}.pdf`)
    } catch {
      alert('Błąd eksportu PDF')
    }
  }

  return (
    <div className="fixed inset-0 z-[3000] flex flex-col bg-gray-900/60 backdrop-blur-sm overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 shrink-0">
        <div className="flex items-center justify-between px-4 py-2 max-w-5xl mx-auto">
          <div className="flex items-center gap-3">
            <h2 className="font-bold text-gray-800 text-sm">Importuj dokument</h2>
            {!image && !loading && <span className="text-xs text-gray-400">Wybierz obraz, PDF lub zeskanowany dokument</span>}
            {loading && <span className="text-xs text-gray-400">Wczytywanie pliku...</span>}
            {image && <span className="text-xs text-gray-400">Kliknij na dokumencie by dodać pole tekstowe</span>}
          </div>
          <div className="flex items-center gap-2">
            <input ref={fileRef} type="file" accept="image/*,.pdf" onChange={handleFile} className="hidden" />
            <button onClick={() => fileRef.current?.click()}
              className="text-xs text-gray-600 border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition">
              {image ? 'Zmień plik' : 'Wybierz plik'}
            </button>
            {fields.length > 0 && (
              <button onClick={handleExport}
                className="text-xs bg-green-700 text-white px-4 py-1.5 rounded-lg font-bold hover:bg-green-800 transition">
                Eksportuj PDF
              </button>
            )}
            <button onClick={onClose}
              className="w-8 h-8 flex items-center justify-center bg-red-500 text-white rounded-full hover:bg-red-600 transition font-bold text-lg leading-none">×</button>
          </div>
        </div>
      </div>

      {/* Obszar dokumentu */}
      <div className="flex-1 overflow-auto flex justify-center p-4">
        {!image && !loading && (
          <div className="flex items-center justify-center w-full max-w-2xl">
            <button onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-2xl p-16 text-center hover:border-green-400 transition bg-white">
              <div className="text-5xl mb-4">📥</div>
              <p className="font-semibold text-gray-600">Kliknij aby wybrać dokument</p>
              <p className="text-sm text-gray-400 mt-1">JPG, PNG, PDF — skan lub zdjęcie formularza</p>
            </button>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center w-full max-w-2xl">
            <div className="text-center">
              <div className="animate-spin text-4xl mb-3">⏳</div>
              <p className="text-sm text-gray-500">Wczytywanie dokumentu...</p>
            </div>
          </div>
        )}

        {image && !loading && (
          <div
            ref={containerRef}
            onClick={handleCanvasClick}
            className="relative bg-white shadow-xl cursor-crosshair shrink-0"
            style={{ width: imageSize.width, height: imageSize.height }}
          >
            <img src={image} alt="Dokument" className="w-full h-full block select-none pointer-events-none" />
            {fields.map(f => (
              <div key={f.id}
                onMouseDown={e => handleFieldMouseDown(e, f)}
                className="absolute cursor-move group"
                style={{ left: `${f.x}%`, top: `${f.y}%` }}
              >
                <div className="flex items-start gap-1">
                  <span className="text-gray-400 text-xs mt-1 cursor-grab select-none opacity-0 group-hover:opacity-100">⠿</span>
                  <input
                    className="border-2 border-blue-400 rounded px-2 py-1 text-xs min-w-[80px] bg-white/90 focus:outline-none focus:border-blue-600"
                    value={f.text}
                    onChange={e => updateFieldText(f.id, e.target.value)}
                    onClick={e => e.stopPropagation()}
                    placeholder="..."
                  />
                  <button onClick={e => { e.stopPropagation(); removeField(f.id) }}
                    className="text-red-400 hover:text-red-600 text-xs opacity-0 group-hover:opacity-100">×</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
