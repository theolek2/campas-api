import { useState, useRef, useEffect } from 'react'

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
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]

const SUGGESTIONS = [
  'Co muszę zrobić żeby zorganizować obóz?',
  'Jakie dokumenty wysłać do PSP?',
  'Ile czasu przed obozem wysłać dokumenty do kuratorium?',
  'Podaj treść Prawa Harcerskiego',
  'Jakie są zasady bezpieczeństwa przeciwpożarowego?',
  'Co powinien zawierać regulamin obozu?',
]

function Message({ msg, onNavigate }) {
  const isRobert = msg.role === 'assistant'
  return (
    <div className={`flex gap-3 ${isRobert ? '' : 'flex-row-reverse'}`}>
      {isRobert && (
        <div className="w-8 h-8 rounded-full bg-green-700 flex items-center justify-center text-white text-sm font-bold shrink-0 mt-0.5">R</div>
      )}
      <div className="max-w-[80%]">
        <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isRobert
            ? 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm'
            : 'bg-green-700 text-white rounded-tr-sm'
        }`}>
          {msg.content.split('\n').map((line, i) => (
            <span key={i}>{line}{i < msg.content.split('\n').length - 1 && <br/>}</span>
          ))}
        </div>
        {/* Źródła — pliki PDF */}
        {isRobert && msg.links?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {msg.links.map((src, i) => (
              src.url ? (
                <a key={i} href={src.url} target="_blank" rel="noopener"
                  className="text-xs bg-green-50 border border-green-200 text-green-700 rounded-lg px-2.5 py-1 hover:bg-green-100 transition flex items-center gap-1">
                  <span>📥</span>
                  <span>{src.title}</span>
                </a>
              ) : (
                <span key={i} className="text-xs bg-gray-50 border border-gray-100 text-gray-400 rounded-lg px-2.5 py-1 flex items-center gap-1">
                  <span>📄</span>
                  <span>{src.title}</span>
                </span>
              )
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function RobertTab({ onNavigate }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Cześć! Jestem Robert — Twój asystent skautowy. Mogę pomóc z organizacją obozu, dokumentami, przepisami ppoż. i prawem harcerskim. O co chcesz zapytać?' }
  ])
  const [idleGif] = useState(() => pick(IDLE_GIFS))
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const send = async (text) => {
    const question = (text || input).trim()
    if (!question || loading) return

    setInput('')
    setError('')
    const newMessages = [...messages, { role: 'user', content: question }]
    setMessages(newMessages)
    setLoading(true)

    try {
      const _tok = localStorage.getItem('campas_token') || ''
      const res = await fetch('/api/robert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${_tok}` },
        body: JSON.stringify({
          question,
          history: newMessages.slice(-8).map(m => ({ role: m.role, content: m.content })),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Błąd serwera')
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.answer,
        links: data.sources || [],
      }])
    } catch (err) {
      setError(err.message)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Przepraszam, wystąpił błąd. Spróbuj ponownie za chwilę.'
      }])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
      {/* Nagłówek */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-white rounded-full overflow-hidden w-10 h-10 shrink-0">
            <img src={`/filmiki/${idleGif}`} alt="Robert" className="w-full h-full object-cover" />
          </div>
          <div>
            <h2 className="font-bold text-gray-800">Robert</h2>
            <p className="text-xs text-gray-500">Asystent skautowy · Skauci Europy</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-xs text-gray-400">online</span>
          </div>
        </div>
      </div>

      {/* Historia czatu */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg, i) => <Message key={i} msg={msg} onNavigate={onNavigate} />)}

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-green-700 flex items-center justify-center text-white text-sm font-bold shrink-0">R</div>
            <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:'0ms'}}/>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:'150ms'}}/>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:'300ms'}}/>
              </div>
            </div>
          </div>
        )}

        {messages.length === 1 && !loading && (
          <div className="space-y-2 pt-2">
            <p className="text-xs text-gray-400 text-center">Przykładowe pytania:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {SUGGESTIONS.map((s, i) => (
                <button key={i} onClick={() => send(s)}
                  className="text-xs bg-white border border-gray-200 rounded-full px-3 py-1.5 text-gray-600 hover:border-green-400 hover:text-green-700 hover:bg-green-50 transition">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {error && (
        <div className="mx-4 mb-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-600">
          ⚠️ {error}
        </div>
      )}

      {/* Input */}
      <div className="bg-white border-t border-gray-200 p-4 shrink-0">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Napisz pytanie do Roberta… (Enter = wyślij)"
            className="flex-1 resize-none border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-500 leading-relaxed"
            style={{ maxHeight: '120px', overflowY: 'auto' }}
            disabled={loading}
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || loading}
            className="bg-green-700 text-white rounded-xl px-4 py-2.5 font-bold text-sm hover:bg-green-800 disabled:opacity-40 transition shrink-0">
            ➤
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1.5 text-center">
          Powered by DeepSeek + Jina · baza wiedzy Skautów Europy
        </p>
      </div>
    </div>
  )
}
