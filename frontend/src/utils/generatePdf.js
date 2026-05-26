export function generatePdf({ meta, days }) {
  const win = window.open('', '_blank')
  if (!win) { alert('Zezwól na otwieranie okien popup w przeglądarce'); return }

  const css = `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #fff; color: #111; }
    @media print {
      body { margin: 0; }
      @page { size: A4 portrait; margin: 10mm; }
    }

    /* ── Strona tytułowa ── */
    .cover {
      width: 100%; height: 277mm;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      page-break-after: always;
      border-bottom: 3px solid #2a6a2a;
    }
    .cover h1 { font-size: 32pt; font-weight: bold; color: #1a4a1a; margin-bottom: 12mm; }
    .cover .meta { font-size: 14pt; margin: 3mm 0; color: #333; }
    .cover .meta span { font-weight: bold; }
    .cover .footer { position: absolute; bottom: 20mm; font-size: 9pt; color: #aaa; }

    /* ── Strony z dniami ── */
    .page { page-break-inside: avoid; }
    .day-half {
      height: 136mm;
      overflow: hidden;
      page-break-inside: avoid;
    }
    .day-half + .day-half {
      border-top: 1px dashed #bbb;
      page-break-before: avoid;
    }
    .day-title {
      background: #2d6a2d; color: #fff;
      font-size: 11pt; font-weight: bold;
      text-align: center; padding: 4mm 0;
    }
    table { width: 100%; border-collapse: collapse; font-size: 9pt; }
    thead th {
      background: #3d7a3d; color: #fff;
      padding: 2.5mm 3mm; text-align: left; font-size: 9pt;
    }
    tbody tr:nth-child(even) { background: #f5faf5; }
    tbody td { padding: 2mm 3mm; border-bottom: 1px solid #e0e8e0; vertical-align: top; }
    .col-time { width: 22mm; }
    .col-name { width: 55mm; }
    .col-desc { }
  `

  const coverHtml = `
    <div class="cover">
      <h1>Ramowy plan pracy</h1>
      <div class="meta">Jednostka: <span>${meta.jednostka || '—'}</span></div>
      <div class="meta">Kierownik: <span>${meta.kierownik || '—'}</span></div>
      ${meta.miejsce ? `<div class="meta">Miejsce: <span>${meta.miejsce}</span></div>` : ''}
      ${meta.termin  ? `<div class="meta">Termin: <span>${meta.termin}</span></div>` : ''}
      <div class="footer">Skauci Europy · Aplikacja Książki Obozowej · by Aleksander Nasiłowski</div>
    </div>
  `

  // Grupuj dni po 2 na stronę
  const pagesHtml = []
  for (let i = 0; i < days.length; i += 2) {
    const pair = [days[i], days[i + 1]].filter(Boolean)
    const halvesHtml = pair.map((day, di) => {
      const slots = [...day.slots].sort((a, b) => (a.time || '').localeCompare(b.time || ''))
      const rows = slots.map(s => `
        <tr>
          <td class="col-time">${s.time || ''}</td>
          <td class="col-name">${s.name || ''}</td>
          <td class="col-desc">${s.description || ''}</td>
        </tr>
      `).join('')
      const label = day.label ? ` — ${day.label}` : ''
      return `
        <div class="day-half">
          <div class="day-title">Dzień ${i + di + 1}${label}</div>
          <table>
            <thead><tr>
              <th class="col-time">Godziny</th>
              <th class="col-name">Zajęcia</th>
              <th class="col-desc">Opis / uwagi</th>
            </tr></thead>
            <tbody>${rows || '<tr><td colspan="3" style="color:#aaa;text-align:center;padding:4mm">Brak zajęć</td></tr>'}</tbody>
          </table>
        </div>
      `
    }).join('')
    pagesHtml.push(`<div class="page">${halvesHtml}</div>`)
  }

  win.document.write(`<!DOCTYPE html><html lang="pl"><head>
    <meta charset="UTF-8">
    <title>Ramowy plan pracy</title>
    <style>${css}</style>
  </head><body>
    ${coverHtml}
    ${pagesHtml.join('')}
    <script>window.onload = () => { window.print(); }</scr` + `ipt>
  </body></html>`)
  win.document.close()
}
