import { useState } from 'react'
import { createPortal } from 'react-dom'

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

export default function OfficialDocumentEditor({ docId, doc, meta, onClose }) {
  if (!doc) return null

  const file = (doc.file || '').split('/').pop()
  const pages = doc.pages || 1

  const [fields, setFields] = useState(() => {
    const init = {}
    if (doc.fields) doc.fields.forEach(f => { init[f.var] = fieldValue(meta, f.var) })
    return init
  })

  const handlePrint = () => {
    const w = window.open('', '_blank')
    if (!w) return
    const today = new Date().toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })
    let html = `<!DOCTYPE html><html lang="pl"><head><meta charset="UTF-8"/><title>${doc.label}</title>
<style>body{font-family:Arial,sans-serif;margin:0;padding:0}.page{padding:20mm 18mm;page-break-after:always;min-height:90vh}
.page:last-child{page-break-after:auto}.hdr{display:flex;align-items:center;gap:12px;border-bottom:2px solid #2d6a2d;padding-bottom:2mm;margin-bottom:5mm}
.hdr img{height:14mm}.hdr b{font-size:13pt;color:#1a4a1a}.hdr span{font-size:9pt;color:#555}
.ftr{border-top:1px solid #ccc;margin-top:8mm;padding-top:3mm;text-align:center;font-size:8pt;color:#888}
.fld{margin-bottom:5mm}.fld label{font-size:8pt;color:#888;display:block;margin-bottom:1mm}
.fld div{font-weight:bold;border-bottom:1px solid #ccc;padding:2mm 0;min-height:5mm}
@media print{@page{margin:0}.page{min-height:0}}</style>
<script>onload=function(){setTimeout(function(){print();close()},300)}</script></head><body>`
    for (let pi = 0; pi < pages; pi++) {
      const pf = doc.fields.filter(f => (f.page || 1) === pi + 1)
      html += `<div class="page"><div class="hdr"><img src="/logo.png" onerror="this.style.display='none'"/><div><b>Skauci Europy</b><br/><span>SHK „Zawisza" · Federacja Skautingu Europejskiego</span></div></div>`
      html += `<p style="text-align:right;color:#666;font-size:9pt;margin-bottom:3mm">${today}</p>`
      pf.forEach(f => { html += `<div class="fld"><label>${f.label||f.var}</label><div>${fields[f.var]||'........................'}</div></div>` })
      html += `<div class="ftr">Skauci Europy · ul. Bitwy Warszawskiej 1920 r. nr 14, 02-366 Warszawa · skauci-europy.pl · Strona ${pi+1} z ${pages}</div></div>`
    }
    html += '</body></html>'
    w.document.write(html)
    w.document.close()
  }

  return createPortal(
    <div style={{position:'fixed',inset:0,zIndex:99999,background:'rgba(0,0,0,.6)',display:'flex',flexDirection:'column',fontFamily:'Segoe UI,Arial,sans-serif'}}>
      <div style={{background:'#fff',padding:'8px 16px',display:'flex',alignItems:'center',justifyContent:'space-between',borderBottom:'1px solid #e5e7eb'}}>
        <b style={{fontSize:14}}>{doc.icon} {doc.label}</b>
        <span style={{fontSize:12,color:'#888'}}>{doc.fields?.length||0} pól · {pages} str.</span>
        <div style={{display:'flex',gap:8}}>
          <button onClick={handlePrint} style={{padding:'6px 14px',fontSize:12,fontWeight:'bold',background:'#2d6a2d',color:'#fff',border:'none',borderRadius:6,cursor:'pointer'}}>Drukuj PDF</button>
          <button onClick={onClose} style={{width:28,height:28,borderRadius:'50%',background:'#ef4444',color:'#fff',border:'none',cursor:'pointer',fontSize:16,fontWeight:'bold'}}>×</button>
        </div>
      </div>
      <div style={{flex:1,display:'flex',overflow:'hidden'}}>
        <div style={{flex:1,overflow:'auto',padding:12,background:'#e5e7eb',display:'flex',justifyContent:'center',alignItems:'flex-start'}}>
          <div style={{width:794,background:'#fff',boxShadow:'0 0 20px rgba(0,0,0,.15)'}}>
            <iframe src={`/dokumenty/${file}`} style={{width:'100%',height:1123*pages,border:0,display:'block'}} title={doc.label} />
          </div>
        </div>
        <div style={{width:280,background:'#fff',borderLeft:'1px solid #e5e7eb',overflow:'auto'}}>
          <div style={{padding:'12px 16px',borderBottom:'1px solid #eee',position:'sticky',top:0,background:'#fff',zIndex:1}}>
            <div style={{fontWeight:600,fontSize:14}}>Pola do wypełnienia</div>
            <div style={{fontSize:11,color:'#888',marginTop:2}}>Dane z zakładki Dane obozu</div>
          </div>
          <div style={{padding:8}}>
            {doc.fields && doc.fields.map(f => (
              <div key={f.var} style={{marginBottom:8}}>
                <label style={{fontSize:10,color:'#888',display:'block',marginBottom:1}}>{f.label||f.var}</label>
                <input value={fields[f.var]||''} onChange={e=>setFields(p=>({...p,[f.var]:e.target.value}))}
                  style={{width:'100%',padding:'4px 8px',fontSize:12,border:'1px solid #d1d5db',borderRadius:6,outline:'none',boxSizing:'border-box'}}
                  onFocus={e=>e.target.style.borderColor='#22c55e'} onBlur={e=>e.target.style.borderColor='#d1d5db'} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
