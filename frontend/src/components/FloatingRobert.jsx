import { useState, useRef, useEffect } from 'react'
import GIF_DURATIONS from '../data/gif-durations.json'

const BASE = '/filmiki'

const IDLE_GIFS = [
  'A_cheerful_boy_scout_sitting_by_a_campfire_ro.gif',
  'A_cheerful_boy_scout_sitting_by_a_campfire_ty.gif',
  'Harcerz_siedzcy_przy_ognisku_cieszy_si_i_bi.gif',
  'The_boy_scout_from_the_original_video_stands.gif',
  'The_boy_scout_from_the_reference_images_unfol.gif',
  'The_boy_scout_looks_directly_at_the_camera_wi.gif',
  'The_boy_scout_pulls_out_a_pair_of_binoculars.gif',
  'The_boy_scout_takes_a_refreshing_sip_from_an.gif',
  'Masz_grafike_to_ma_byc_pierwsza_i_ostatnia_kl.gif',
]

const THINK_GIFS = ['think.gif', 'lupa.gif']

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]

// Awatar z białym tłem — wspiera crossfade
function AvCircle({ gif, size, border = 'border-0', className = '' }) {
  return (
    <div className={`bg-white rounded-full overflow-hidden relative shrink-0 ${border} ${className}`}
      style={{ width: size, height: size }}>
      <img src={`${BASE}/${gif}`} alt="Robert" className="absolute inset-0 w-full h-full object-cover" />
    </div>
  )
}

// Awatar z crossfade (dwie warstwy)
function AvCrossfade({ newGif, oldGif, size, border = 'border-0', className = '', onDone }) {
  return (
    <div className={`bg-white rounded-full overflow-hidden relative shrink-0 ${border} ${className}`}
      style={{ width: size, height: size }}>
      {/* Nowy GIF — na spodzie, zawsze widoczny */}
      <img src={`${BASE}/${newGif}`} alt="" className="absolute inset-0 w-full h-full object-cover" />
      {/* Stary GIF — na wierzchu, zanika */}
      {oldGif && (
        <img
          key={oldGif + Date.now()}
          src={`${BASE}/${oldGif}`}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{ animation: 'fadeOut 50ms forwards' }}
          onAnimationEnd={onDone}
        />
      )}
    </div>
  )
}

export default function FloatingRobert({ onNavigate, hidden }) {
  const [phase, setPhase] = useState('idle')
  const [idleGif, setIdleGif] = useState(() => pick(IDLE_GIFS))
  const [fadeOutGif, setFadeOutGif] = useState(null)
  const [thinkGif, setThinkGif] = useState(() => pick(THINK_GIFS))
  const [visible, setVisible] = useState(true)
  const [maximized, setMaximized] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Cześć! Jestem Robert. O co chcesz zapytać?' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const idleRef = useRef(idleGif)
  useEffect(() => { idleRef.current = idleGif }, [idleGif])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Rotacja: wyświetl GIF do pełnej długości, w ostatnich 50ms crossfade
  useEffect(() => {
    const dur = GIF_DURATIONS[idleGif] || 10000
    const timer = setTimeout(() => {
      setFadeOutGif(idleRef.current)
      setIdleGif(pick(IDLE_GIFS))
    }, Math.max(dur - 50, 100))
    return () => clearTimeout(timer)
  }, [idleGif])

  // Wstrzyknij CSS keyframe
  useEffect(() => {
    if (document.getElementById('robert-fade-style')) return
    const style = document.createElement('style')
    style.id = 'robert-fade-style'
    style.textContent = '@keyframes fadeOut{from{opacity:1}to{opacity:0}}'
    document.head.appendChild(style)
  }, [])

  const handleOpen = () => {
    if (phase !== 'idle') return
    setMaximized(false)
    setVisible(false)
    setTimeout(() => {
      setPhase('open')
      setVisible(true)
      setTimeout(() => inputRef.current?.focus(), 200)
    }, 200)
  }

  const handleClose = () => {
    setVisible(false)
    setMaximized(false)
    setTimeout(() => {
      setPhase('idle')
      setFadeOutGif(idleRef.current)
      setIdleGif(pick(IDLE_GIFS))
      setVisible(true)
    }, 200)
  }

  const send = async (text) => {
    const question = (text || input).trim()
    if (!question || loading) return
    setInput('')
    setError('')
    const newMessages = [...messages, { role: 'user', content: question }]
    setMessages(newMessages)
    setLoading(true)
    setThinkGif(pick(THINK_GIFS))
    setVisible(false)
    setTimeout(() => { setPhase('thinking'); setVisible(true) }, 200)
    try {
      const _tok = localStorage.getItem('campas_token') || localStorage.getItem('skauting_external_session')
        ? (JSON.parse(localStorage.getItem('skauting_external_session') || '{}')?.token || localStorage.getItem('campas_token') || '')
        : ''
      const res = await fetch('/api/robert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${_tok}` },
        body: JSON.stringify({
          question,
          history: newMessages.slice(-6).map(m => ({ role: m.role, content: m.content })),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || data.error || 'Błąd')
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.answer,
        links: data.sources || [],
      }])
    } catch (err) {
      setError(err.message)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Przepraszam, wystąpił błąd. Spróbuj ponownie.'
      }])
    } finally {
      setLoading(false)
      setVisible(false)
      setTimeout(() => { setPhase('open'); setVisible(true) }, 200)
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  if (hidden) return null

  const showButton = phase === 'idle'
  const showChat   = phase === 'open' || phase === 'thinking'

  const chatCls = maximized
    ? 'fixed inset-4 z-[9999]'
    : 'fixed bottom-5 right-5 w-96 max-w-[calc(100vw-2rem)] h-[520px] max-h-[calc(100vh-5rem)]'

  const headAvatarSize  = maximized ? 80 : 44
  const headNameCls     = maximized ? 'text-lg' : 'text-sm'
  const headSubCls      = maximized ? 'text-xs' : 'text-[10px]'

  return (
    <>
      {showButton && (
        <div
          onClick={handleOpen}
          className={`fixed bottom-5 right-5 z-[9999] cursor-pointer hover:scale-110 active:scale-95 transition-all duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
          title="Robert — asystent skautowy"
        >
          <AvCrossfade newGif={idleGif} oldGif={fadeOutGif} size={112} border="border-3 border-green-700"
            onDone={() => setFadeOutGif(null)}
            className="shadow-xl" />
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-white" />
        </div>
      )}

      {showChat && (
        <div className={`${chatCls} bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden transition-all duration-300 ${visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
          <div className="bg-green-800 text-white px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              {loading
                ? <AvCircle gif={thinkGif} size={headAvatarSize} border="border-2 border-white/30" />
                : <AvCrossfade newGif={idleGif} oldGif={fadeOutGif} size={headAvatarSize}
                    border="border-2 border-white/30" onDone={() => setFadeOutGif(null)} />
              }
              <div>
                <div className={`font-semibold ${headNameCls}`}>Robert</div>
                <div className={`text-green-300 ${headSubCls}`}>
                  {loading ? 'Analizuje...' : 'Asystent skautowy'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setMaximized(m => !m)}
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/20 text-white/70 hover:text-white transition text-sm">
                {maximized ? '⛷' : '⛶'}
              </button>
              <button onClick={handleClose}
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/20 text-white/70 hover:text-white text-lg leading-none transition">
                ×
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3 text-sm">
            {messages.map((msg, i) => {
              const isRobert = msg.role === 'assistant'
              return (
                <div key={i} className={`flex gap-2 ${isRobert ? '' : 'flex-row-reverse'}`}>
                  {isRobert && (
                    <AvCircle gif={idleGif} size={36} border="border border-green-300" className="mt-0.5" />
                  )}
                  <div>
                    <div className={`rounded-xl px-3 py-2 text-xs leading-relaxed max-w-[260px] ${
                      isRobert
                        ? 'bg-gray-100 text-gray-800 rounded-tl-sm'
                        : 'bg-green-700 text-white rounded-tr-sm'
                    }`}>
                      {msg.content.split('\n').map((line, j) => (
                        <span key={j}>{line}{j < msg.content.split('\n').length - 1 && <br/>}</span>
                      ))}
                    </div>
                    {isRobert && msg.links?.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {msg.links.slice(0, 3).map((src, k) => (
                          src.url ? (
                            <a key={k} href={src.url} target="_blank" rel="noopener"
                              className="text-[10px] bg-green-50 border border-green-200 text-green-700 rounded-md px-2 py-0.5 hover:bg-green-100 transition flex items-center gap-0.5">
                              <span>📥</span>
                              <span className="truncate max-w-[120px]">{src.title}</span>
                            </a>
                          ) : (
                            <span key={k} className="text-[10px] bg-gray-50 border border-gray-100 text-gray-400 rounded-md px-2 py-0.5 flex items-center gap-0.5">
                              <span>📄</span>
                              <span className="truncate max-w-[120px]">{src.title}</span>
                            </span>
                          )
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}

            {loading && (
              <div className="flex gap-2">
                <AvCircle gif={thinkGif} size={40} border="border border-green-300" className="mt-0.5" />
                <div className="bg-gray-100 rounded-xl rounded-tl-sm px-3 py-2">
                  <span className="text-xs text-gray-400 italic">Robert analizuje...</span>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {error && (
            <div className="mx-3 mb-1 bg-red-50 border border-red-200 rounded-lg px-2.5 py-1.5 text-[10px] text-red-600">
              {error}
            </div>
          )}

          <div className="border-t border-gray-100 p-2.5 shrink-0">
            <div className="flex gap-1.5">
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Zapytaj Roberta..."
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-green-400"
                disabled={loading}
              />
              <button
                onClick={() => send()}
                disabled={!input.trim() || loading}
                className="bg-green-700 text-white rounded-lg px-3 py-2 font-bold text-xs hover:bg-green-800 disabled:opacity-40 transition shrink-0">
                ➤
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
