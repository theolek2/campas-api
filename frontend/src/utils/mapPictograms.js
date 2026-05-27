export const DEFAULT_ARROW_COLORS = [
  { id: 'red',    hex: '#ef4444', label: 'Trasa czerwona' },
  { id: 'blue',   hex: '#3b82f6', label: 'Trasa niebieska' },
  { id: 'green',  hex: '#22c55e', label: 'Trasa zielona' },
  { id: 'orange', hex: '#f97316', label: 'Trasa pomarańczowa' },
  { id: 'purple', hex: '#a855f7', label: 'Trasa fioletowa' },
]

// Piktogramy oparte na SVG z /icons/
export const PICTOGRAM_CATEGORIES = [
  {
    name: 'Obóz',
    items: [
      { id: 'namiot',        icon: '/icons/namiot.svg',              label: 'Namiot / zastęp' },
      { id: 'namiot_fiol',   icon: '/icons/namiot-fiolet-tlo.svg',   label: 'Namiot (fiolet)' },
      { id: 'namiot_pom',    icon: '/icons/namiot-pom-tlo.svg',      label: 'Namiot (pom.)' },
      { id: 'namiot_zol',    icon: '/icons/namiot-zolty-tlo.svg',    label: 'Namiot (żółty)' },
      { id: 'mauzer',        icon: '/icons/mauzer.svg',              label: 'Mauzer / magazyn' },
      { id: 'dom',           icon: '/icons/dom.svg',                 label: 'Budynek / dom' },
    ],
  },
  {
    name: 'Bezpieczeństwo',
    items: [
      { id: 'gasnica',       icon: '/icons/gasnica.svg',        label: 'Gaśnica' },
      { id: 'ognisko_ppoz',  icon: '/icons/ognisko_z_pkt_ppoz.svg',  label: 'Ognisko + p.poż.' },
      { id: 'ognisko_znak',  icon: '/icons/ognisko_znak.svg',        label: 'Znak ogniska' },
      { id: 'ewakuacja',     icon: '/icons/Punkt-zbiorki-do-ewakuacji.svg', label: 'Punkt zbiórki ewak.' },
    ],
  },
  {
    name: 'Obozowanie',
    items: [
      { id: 'ognisko',       icon: '/icons/ognisko.svg',             label: 'Ognisko' },
      { id: 'kosciol',       icon: '/icons/kosciol.svg',             label: 'Kościół / msza' },
      { id: 'stacja_kol',    icon: '/icons/stacja_kol.svg',          label: 'Stacja kolejowa' },
      { id: 'rozne',         icon: '/icons/rozne.svg',     label: 'Inne' },
    ],
  },
  {
    name: 'Sanitarno-higieniczne',
    items: [
      { id: 'toalety',       icon: '/icons/toalety.svg',             label: 'Toalety' },
      { id: 'natryski',      icon: '/icons/natryski.svg',            label: 'Natryski / prysznice' },
      { id: 'woda',          icon: '/icons/woda.svg',                label: 'Woda pitna' },
      { id: 'smieci',        icon: '/icons/smieci.svg',              label: 'Śmietnik' },
    ],
  },
]

export function makePlacedItem({ type, icon, imageUrl, label, color, colorId, x, y }) {
  return {
    id: `item_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    type,        // 'icon' | 'arrow' | 'custom'
    icon,        // path to SVG in /icons/
    imageUrl,    // for custom uploads
    label,
    color,
    colorId,
    x, y,
    size: 1,
    scaleX: 1,
    scaleY: 1,
    rotation: 0,
    showLabel: true,
  }
}

export async function removeBg(file) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const src = e.target.result
      if (file.type === 'image/svg+xml') { resolve(src); return }
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0)
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const px = data.data
        const bgR = px[0], bgG = px[1], bgB = px[2]
        const thr = 40
        for (let i = 0; i < px.length; i += 4) {
          if (Math.abs(px[i]-bgR) < thr && Math.abs(px[i+1]-bgG) < thr && Math.abs(px[i+2]-bgB) < thr)
            px[i+3] = 0
        }
        ctx.putImageData(data, 0, 0)
        resolve(canvas.toDataURL('image/png'))
      }
      img.src = src
    }
    reader.readAsDataURL(file)
  })
}
