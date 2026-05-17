'use client'

import { useEffect, useState } from 'react'

export default function KBPage() {
  const [content, setContent] = useState('')
  const [saved, setSaved]     = useState(false)
  const [saving, setSaving]   = useState(false)
  const [loaded, setLoaded]   = useState(false)

  useEffect(() => {
    fetch('/api/kb').then(r => r.json()).then(d => {
      setContent(d.content ?? '')
      setLoaded(true)
    })
  }, [])

  const save = async () => {
    setSaving(true)
    await fetch('/api/kb', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-serif font-semibold text-stone-100 mb-1">Knowledge Base</h1>
          <p className="text-stone-500 text-sm font-light">
            This Markdown document is injected as the AI agent's system prompt.
            Edit it to control personality, destinations, pricing, and how the agent responds.
          </p>
        </div>
        <button
          onClick={save}
          disabled={saving || !loaded}
          className="flex-shrink-0 ml-6 px-5 py-2.5 rounded-xl text-xs font-semibold transition-all disabled:opacity-40"
          style={{ backgroundColor: saved ? '#25D366' : '#c49a3c', color: '#fff' }}
        >
          {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save changes'}
        </button>
      </div>

      {/* Tips */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { icon: '🎭', tip: 'Define personality', desc: 'Friendly? Professional? Set the tone here.' },
          { icon: '🗺️', tip: 'List destinations', desc: 'Tell the agent which regions you cover.' },
          { icon: '💬', tip: 'Format for WhatsApp', desc: 'Use *bold* and short lines — mobile first.' },
        ].map((t, i) => (
          <div key={i} className="bg-stone-900 rounded-xl border border-stone-800 p-3.5">
            <span className="text-lg">{t.icon}</span>
            <p className="text-xs font-semibold text-stone-300 mt-2 mb-1">{t.tip}</p>
            <p className="text-[10px] text-stone-600 leading-relaxed">{t.desc}</p>
          </div>
        ))}
      </div>

      {/* Editor */}
      <div className="bg-stone-900 rounded-2xl border border-stone-800 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-stone-800">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
          </div>
          <span className="text-[10px] text-stone-600 font-mono">data/knowledge-base.md</span>
          <span className="text-[10px] text-stone-600">{content.split('\n').length} lines</span>
        </div>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder={loaded ? '' : 'Loading…'}
          className="w-full bg-transparent text-stone-300 text-xs font-mono leading-relaxed p-5 resize-none focus:outline-none min-h-[520px]"
          spellCheck={false}
        />
      </div>

      <p className="mt-3 text-[10px] text-stone-700">
        Changes take effect on the next incoming message — no restart required.
      </p>
    </div>
  )
}
