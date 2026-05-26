import { useState, useEffect, useRef } from 'react'
import { getSharedFiles, uploadSharedFile, deleteSharedFile, getFileDownloadUrl } from '../lib/api'

export default function FilesTab({ user, campId }) {
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)

  const load = async () => {
    if (!campId) return
    try {
      const f = await getSharedFiles(campId)
      setFiles(f || [])
    } catch {}
  }

  useEffect(() => { load() }, [campId])

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !campId) return
    setUploading(true)
    try {
      await uploadSharedFile(campId, file)
      load()
    } catch (err) {
      alert('Błąd uploadu: ' + err.message)
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const handleDelete = async (file) => {
    if (!confirm('Usunąć plik?')) return
    try {
      await deleteSharedFile(campId, file.id)
      load()
    } catch (err) {
      alert('Błąd: ' + err.message)
    }
  }

  const formatSize = (bytes) => {
    if (!bytes) return ''
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  if (!campId) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 p-8">
        <p className="text-center">Wybierz obóz aby zobaczyć pliki</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-green-900 mb-1">📁 Pliki obozowe</h2>
        <p className="text-sm text-gray-500 mb-6">
          Dropbox obozowy — pliki przechowywane na serwerze campas.pl
        </p>

        <div className="mb-4">
          <input ref={fileRef} type="file" className="hidden" onChange={handleUpload} />
          <button onClick={() => fileRef.current?.click()} disabled={uploading}
            className="bg-green-700 text-white font-bold px-5 py-2.5 rounded-xl hover:bg-green-800 transition text-sm disabled:opacity-50">
            {uploading ? '⏳ Wgrywanie...' : '📤 Wgraj plik'}
          </button>
        </div>

        {files.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-3">📁</div>
            <p className="font-semibold">Brak plików</p>
            <p className="text-sm mt-1">Wgraj pierwszy plik do dropboxa obozowego</p>
          </div>
        ) : (
          <div className="space-y-2">
            {files.map(f => (
              <div key={f.id} className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-3 hover:border-green-400 transition">
                <span className="text-2xl">📄</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-gray-800 truncate">{f.filename}</div>
                  <div className="text-xs text-gray-400">
                    {formatSize(f.size)}
                    {f.created_at && ` · ${new Date(f.created_at).toLocaleDateString('pl-PL')}`}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={getFileDownloadUrl(campId, f.id)}
                    download={f.filename}
                    className="text-blue-500 hover:text-blue-700 text-sm px-2 py-1 rounded border border-blue-200 hover:bg-blue-50"
                  >
                    ⬇
                  </a>
                  <button onClick={() => handleDelete(f)} className="text-gray-300 hover:text-red-500 text-lg leading-none">×</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
