import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { LATO_REGULAR_BASE64 } from '../assets/fonts/latoBase64.js'

const FONT_NAME = 'Lato'
const FONT = 'Lato'

export function generateDiary({ meta, days, wychowawca, planItems, campDays, activities }) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a5' })
  const W = 148
  const H = 210

  doc.addFileToVFS(`${FONT_NAME}-Regular.ttf`, LATO_REGULAR_BASE64)
  doc.addFont(`${FONT_NAME}-Regular.ttf`, FONT_NAME, 'normal')
  doc.addFont(`${FONT_NAME}-Regular.ttf`, FONT_NAME, 'bold')
  doc.addFont(`${FONT_NAME}-Regular.ttf`, FONT_NAME, 'italic')

  const totalDays = campDays || days.length

  // ── STRONA 1: Strona tytułowa ──────────────────────────────────────────────
  doc.setFillColor(34, 85, 34)
  doc.rect(0, 0, W, 40, 'F')

  doc.setFont(FONT, 'bold')
  doc.setFontSize(14)
  doc.setTextColor(255)
  doc.text('DZIENNIK ZAJ\u0118\u0106', W / 2, 18, { align: 'center' })
  doc.setFontSize(10)
  doc.setFont(FONT, 'normal')
  doc.text('Skauci Europy', W / 2, 27, { align: 'center' })

  doc.setTextColor(0)
  doc.setFontSize(11)

  const fields = [
    ['Jednostka:', meta.jednostka || ''],
    ['Kierownik:', meta.kierownik || ''],
    ['Wychowawca:', wychowawca || ''],
    ['Miejsce obozu:', meta.miejsce || ''],
    ['Termin:', meta.date_start && meta.date_end ? `${meta.date_start} - ${meta.date_end}` : (meta.termin || '')],
  ]

  let y = 56
  fields.forEach(([label, val]) => {
    doc.setFont(FONT, 'bold')
    doc.text(label, 15, y)
    doc.setFont(FONT, 'normal')
    doc.text(val, 55, y)
    doc.setLineWidth(0.2)
    doc.setDrawColor(200)
    doc.line(15, y + 2, W - 15, y + 2)
    y += 14
  })

  doc.setFontSize(8)
  doc.setTextColor(150)
  doc.text('Dokument wygenerowany przez CampAs \u00b7 Skauci Europy \u00b7 by Aleksander Nasi\u0142owski', W / 2, H - 8, { align: 'center' })

  // ── STRONA 2: Spis zaj\u0119\u0107 ────────────────────────────────────────────────
  doc.addPage()

  doc.setFillColor(34, 85, 34)
  doc.rect(0, 0, W, 12, 'F')
  doc.setFont(FONT, 'bold')
  doc.setFontSize(11)
  doc.setTextColor(255)
  doc.text('SPIS ZAJ\u0118\u0106', W / 2, 8.5, { align: 'center' })
  doc.setTextColor(0)

  if (!activities || activities.length === 0) {
    doc.setFont(FONT, 'italic')
    doc.setFontSize(9)
    doc.setTextColor(150)
    doc.text('Brak zaj\u0119\u0107 w spisie', W / 2, 30, { align: 'center' })
  } else {
    const spisRows = activities.map((a, i) => [
      `${i + 1}.`,
      a.name || '',
      a.description || '',
    ])
    autoTable(doc, {
      startY: 15,
      margin: { left: 12, right: 12 },
      head: [['Nr', 'Nazwa zaj\u0119cia', 'Opis']],
      body: spisRows,
      styles: { fontSize: 8, cellPadding: 2.5, font: FONT, fontStyle: 'normal' },
      headStyles: { fillColor: [60, 120, 60], textColor: 255, fontSize: 8, font: FONT, fontStyle: 'bold' },
      columnStyles: { 0: { cellWidth: 10 }, 1: { cellWidth: 48 } },
    })
  }

  // ── STRONA 3: Lista uczestnik\u00f3w (RODO) ─────────────────────────────────
  doc.addPage()

  doc.setFillColor(34, 85, 34)
  doc.rect(0, 0, W, 12, 'F')
  doc.setFont(FONT, 'bold')
  doc.setFontSize(11)
  doc.setTextColor(255)
  doc.text('LISTA UCZESTNIK\u00d3W', W / 2, 8.5, { align: 'center' })
  doc.setTextColor(0)

  doc.setFontSize(7.5)
  doc.setFont(FONT, 'italic')
  doc.setTextColor(100)
  doc.text('Uczestnicy wype\u0142niaj\u0105 list\u0119 samodzielnie (RODO)', W / 2, 18, { align: 'center' })
  doc.setTextColor(0)

  const dotImie = '\u02d9\u02d9\u02d9\u02d9\u02d9\u02d9\u02d9\u02d9\u02d9\u02d9\u02d9\u02d9\u02d9\u02d9\u02d9\u02d9\u02d9\u02d9\u02d9\u02d9\u02d9\u02d9\u02d9\u02d9\u02d9\u02d9\u02d9\u02d9\u02d9\u02d9\u02d9\u02d9\u02d9\u02d9\u02d9\u02d9\u02d9\u02d9\u02d9\u02d9\u02d9\u02d9\u02d9\u02d9\u02d9\u02d9\u02d9\u02d9\u02d9\u02d9\u02d9\u02d9\u02d9\u02d9\u02d9'
  const dotRok = '\u02d9\u02d9\u02d9\u02d9\u02d9\u02d9\u02d9\u02d9\u02d9\u02d9\u02d9\u02d9\u02d9\u02d9\u02d9\u02d9\u02d9\u02d9\u02d9\u02d9\u02d9\u02d9\u02d9\u02d9\u02d9\u02d9\u02d9\u02d9\u02d9\u02d9\u02d9\u02d9'

  const emptyRows = Array.from({ length: 20 }, (_, i) => [`${i + 1}.`, dotImie, dotRok])
  autoTable(doc, {
    startY: 22,
    margin: { left: 12, right: 12 },
    head: [['Lp.', 'Imi\u0119 i nazwisko', 'Rok urodzenia']],
    body: emptyRows,
    styles: { fontSize: 8, cellPadding: 3, font: FONT, fontStyle: 'normal', textColor: [160, 160, 160] },
    headStyles: { fillColor: [60, 120, 60], textColor: 255, fontSize: 8, font: FONT, fontStyle: 'bold' },
    columnStyles: { 0: { cellWidth: 10 }, 1: { cellWidth: 75 }, 2: { cellWidth: 40 } },
  })

  // ── STRONY 3+: Plan dnia dla ka\u017cdego dnia obozu ──────────────────────────
  const sortedItems = [...(planItems || [])].sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'))

  for (let i = 0; i < totalDays; i++) {
    doc.addPage()

    const dayDate = meta.date_start
      ? (() => {
          const d = new Date(meta.date_start)
          d.setDate(d.getDate() + i)
          return d.toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })
        })()
      : ''

    const day = days[i] || { label: '', slots: [] }

    // Nag\u0142\u00f3wek dnia
    doc.setFillColor(34, 85, 34)
    doc.rect(0, 0, W, 14, 'F')
    doc.setFont(FONT, 'bold')
    doc.setFontSize(11)
    doc.setTextColor(255)
    doc.text(`DZIE\u0143 ${i + 1}${day.label ? ' - ' + day.label.toUpperCase() : ''}`, W / 2, 7, { align: 'center' })
    doc.setFontSize(8)
    doc.setFont(FONT, 'normal')
    if (dayDate) doc.text(dayDate, W / 2, 12, { align: 'center' })
    doc.setTextColor(0)

    // Wiersze planu dnia z planItems
    const planRows = sortedItems.map(item => [
      item.time || '',
      item.isBlok ? `Blok zaj\u0119ciowy nr ..........` : (item.name || ''),
      item.description || '',
    ])

    autoTable(doc, {
      startY: 17,
      margin: { left: 10, right: 10 },
      head: [['Godz.', 'Zaj\u0119cia', 'Opis / uwagi']],
      body: planRows,
      styles: { fontSize: 8, cellPadding: 2.5, valign: 'top', overflow: 'linebreak', font: FONT, fontStyle: 'normal' },
      headStyles: { fillColor: [60, 120, 60], textColor: 255, fontSize: 8, font: FONT, fontStyle: 'bold' },
      columnStyles: { 0: { cellWidth: 18 }, 1: { cellWidth: 50 } },
      didParseCell(data) {
        const item = sortedItems[data.row.index]
        if (item && item.isBlok && data.section === 'body') {
          data.cell.styles.fontStyle = 'italic'
          data.cell.styles.textColor = [100, 100, 100]
          data.cell.styles.fillColor = [245, 245, 245]
        }
      },
    })

    // Podpisy na dole strony
    const finalY = doc.lastAutoTable?.finalY || 160
    if (finalY < H - 28) {
      doc.setFontSize(8)
      doc.setFont(FONT, 'normal')
      doc.setTextColor(150)
      doc.text('Podpis wychowawcy: ____________________________', 12, finalY + 9)
      doc.text('Podpis kierownika: ____________________________', 12, finalY + 16)
    } else if (finalY < H - 15) {
      doc.setFontSize(8)
      doc.setFont(FONT, 'normal')
      doc.setTextColor(150)
      doc.text('Podpis wychowawcy: _____________   Podpis kierownika: _____________', 12, finalY + 9)
    }
  }

  doc.save(`dziennik_${(wychowawca || 'oboz').replace(/\s+/g, '_')}.pdf`)
}
