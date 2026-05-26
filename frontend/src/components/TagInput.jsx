import { useState, useEffect, useRef, useCallback } from 'react'
import { SEED_INGREDIENTS } from '../data/skladniki.js'
import { getAllIngredients, addIngredient } from '../lib/api'

export default function TagInput({ value, onChange, placeholder }) {
  const [allIngredients, setAllIngredients] = useState([])
  const [input, setInput] = useState('')
  const [show, setShow] = useState(false)
  const [highlightIdx, setHighlightIdx] = useState(-1)
  const wrapperRef = useRef(null)

  useEffect(() => {
    const load = async () => {
      const fromDb = await getAllIngredients()
      const merged = [...new Set([...SEED_INGREDIENTS, ...fromDb])].sort()
      setAllIngredients(merged)
    }
    load()
  }, [])

  const tags = value ? value.split(',').map(t => t.trim()).filter(Boolean) : []

  const filtered = allIngredients.filter(i =>
    i.toLowerCase().includes(input.toLowerCase()) && !tags.includes(i)
  ).slice(0, 8)

  const addTag = useCallback((name) => {
    const clean = name.trim().toLowerCase()
    if (!clean) return
    if (!tags.includes(clean)) {
      onChange([...tags, clean].join(', '))
    }
    setInput(''); setShow(false); setHighlightIdx(-1)
  }, [tags, onChange])

  const removeTag = (name) => {
    onChange(tags.filter(t => t !== name).join(', '))
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (highlightIdx >= 0 && filtered[highlightIdx]) {
        addTag(filtered[highlightIdx])
      } else if (input.trim()) {
        // Dodaj nowy składnik
        const name = input.trim().toLowerCase()
        addIngredient(name)
        if (!allIngredients.includes(name)) {
          setAllIngredients(prev => [...prev, name].sort())
        }
        addTag(name)
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightIdx(i => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightIdx(i => Math.max(i - 1, -1))
    } else if (e.key === 'Escape') {
      setShow(false)
    } else if (e.key === 'Backspace' && !input && tags.length > 0) {
      removeTag(tags[tags.length - 1])
    }
  }

  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setShow(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={wrapperRef} className="relative flex-1 min-w-0">
      <div className="flex flex-wrap gap-1 p-1 border border-gray-300 rounded min-h-[30px] bg-white focus-within:border-green-500 cursor-text"
        onClick={() => { if (!show && input) setShow(true) }}>
        {tags.map(t => (
          <span key={t} className="inline-flex items-center gap-0.5 bg-blue-100 text-blue-800 text-xs px-1.5 py-0.5 rounded-full">
            {t}
            <button onClick={(e) => { e.stopPropagation(); removeTag(t) }}
              className="text-blue-400 hover:text-red-500 ml-0.5 leading-none">×</button>
          </span>
        ))}
        <input className="flex-1 min-w-[80px] border-none outline-none text-sm bg-transparent py-0.5"
          placeholder={tags.length === 0 ? (placeholder || 'Składniki...') : ''}
          value={input}
          onChange={e => { setInput(e.target.value); setShow(true); setHighlightIdx(-1) }}
          onFocus={() => setShow(true)}
          onKeyDown={handleKeyDown}
        />
      </div>
      {show && (filtered.length > 0 || input.trim().length > 0) && (
        <div className="absolute top-full left-0 z-50 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-36 overflow-y-auto mt-0.5">
          {filtered.map((item, i) => (
            <div key={item}
              onMouseDown={(e) => { e.preventDefault(); addTag(item) }}
              className={`px-3 py-1.5 text-sm cursor-pointer ${i === highlightIdx ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-700'}`}>
              {item}
            </div>
          ))}
          {input.trim() && !filtered.find(f => f === input.trim().toLowerCase()) && (
            <div onMouseDown={(e) => {
              e.preventDefault()
              const name = input.trim().toLowerCase()
              addIngredient(name)
              addTag(name)
            }}
              className="px-3 py-1.5 text-sm cursor-pointer hover:bg-green-50 text-green-600 border-t border-gray-100">
              + Dodaj nowy: <b>{input.trim().toLowerCase()}</b>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
