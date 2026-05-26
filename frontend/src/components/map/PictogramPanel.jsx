import { useRef } from 'react'
import { PICTOGRAM_CATEGORIES, removeBg } from '../../utils/mapPictograms'

export default function PictogramPanel({ selected, onSelect, customPictograms, onAddCustom }) {
  const uploadRef = useRef()

  const selectIcon = (item) =>
    onSelect({ type: 'icon', icon: item.icon, label: item.label })

  const handleUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const name = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')
    const url = await removeBg(file)
    onAddCustom({ id: `custom_${Date.now()}`, imageUrl: url, label: name })
    e.target.value = ''
  }

  return (
    <div className="flex flex-col gap-4 overflow-y-auto h-full pb-4">

      {/* Piktogramy SVG */}
      {PICTOGRAM_CATEGORIES.map(cat => (
        <div key={cat.name}>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">{cat.name}</p>
          <div className="grid grid-cols-3 gap-1.5">
            {cat.items.map(item => {
              const isActive = selected?.type === 'icon' && selected?.label === item.label
              return (
                <button key={item.id} onClick={() => selectIcon(item)} title={item.label}
                  className={`flex flex-col items-center p-2 rounded-lg border text-center transition text-xs leading-tight ${
                    isActive ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-400 bg-white text-gray-700'
                  }`}>
                  <img src={item.icon} alt={item.label} className="w-10 h-10 object-contain mb-1" />
                  <span className="truncate w-full text-center">{item.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      ))}

      {/* Własne emblematy */}
      <div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Własne emblematy</p>
        <button onClick={() => uploadRef.current.click()}
          className="w-full border-2 border-dashed border-gray-300 rounded-lg py-3 text-sm text-gray-500 hover:border-green-400 hover:text-green-700 transition mb-2">
          📤 Wgraj PNG / JPG / SVG<br/>
          <span className="text-xs opacity-70">(tło zostanie usunięte)</span>
        </button>
        <input ref={uploadRef} type="file" accept=".png,.jpg,.jpeg,.svg,image/*" className="hidden" onChange={handleUpload} />
        {customPictograms.length > 0 && (
          <div className="grid grid-cols-3 gap-1.5">
            {customPictograms.map(item => (
              <button key={item.id}
                onClick={() => onSelect({ type: 'custom', imageUrl: item.imageUrl, label: item.label })}
                className={`flex flex-col items-center p-2 rounded-lg border text-center transition text-xs ${
                  selected?.imageUrl === item.imageUrl ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-400 bg-white'
                }`}>
                <img src={item.imageUrl} alt={item.label} className="w-10 h-10 object-contain mb-1" />
                <span className="truncate w-full">{item.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <div className="bg-green-50 border border-green-300 rounded-lg p-2 text-xs text-green-800">
          <b>Zaznaczono:</b>{' '}
          {selected.icon ? <img src={selected.icon} className="inline w-5 h-5 object-contain" alt="" />
            : selected.imageUrl ? <img src={selected.imageUrl} className="inline w-5 h-5 object-contain" alt="" />
            : null}{' '}{selected.label}<br/>Kliknij na mapie aby umieścić
        </div>
      )}
    </div>
  )
}
