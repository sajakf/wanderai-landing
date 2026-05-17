'use client'

import { useEffect, useRef, useState } from 'react'

interface Msg {
  id: string
  phone: string
  jid: string
  text: string
  role: 'user' | 'agent'
  ts: number
}

function fmt(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function MessagesPage() {
  const [phones, setPhones]     = useState<string[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [messages, setMessages] = useState<Msg[]>([])
  const bottomRef               = useRef<HTMLDivElement>(null)

  // Initial load
  useEffect(() => {
    fetch('/api/messages').then(r => r.json()).then(d => {
      setPhones(d.phones ?? [])
      setMessages(d.messages ?? [])
      if (d.phones?.length && !selected) setSelected(d.phones[0])
    })
  }, [])

  // Live SSE stream
  useEffect(() => {
    const es = new EventSource('/api/messages')
    es.onmessage = (e) => {
      const msg: Msg = JSON.parse(e.data)
      setMessages(prev => [...prev, msg])
      setPhones(prev => prev.includes(msg.phone) ? prev : [...prev, msg.phone])
    }
    return () => es.close()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, selected])

  const thread = selected ? messages.filter(m => m.phone === selected) : []

  return (
    <div className="flex h-screen">
      {/* Contact list */}
      <div className="w-56 flex-shrink-0 border-r border-stone-800 bg-stone-900 flex flex-col">
        <div className="px-4 py-4 border-b border-stone-800">
          <p className="text-[10px] uppercase tracking-widest text-stone-500">Conversations</p>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {phones.length === 0 && (
            <p className="px-4 py-6 text-xs text-stone-600 text-center">No messages yet</p>
          )}
          {phones.map(phone => {
            const last = [...messages].reverse().find(m => m.phone === phone)
            const unread = messages.filter(m => m.phone === phone && m.role === 'user').length
            return (
              <button
                key={phone}
                onClick={() => setSelected(phone)}
                className={`w-full text-left px-4 py-3 hover:bg-stone-800 transition-colors ${selected === phone ? 'bg-stone-800' : ''}`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-medium text-stone-200 truncate">+{phone}</span>
                  <span className="text-[9px] text-stone-600">{last ? fmt(last.ts) : ''}</span>
                </div>
                <p className="text-[10px] text-stone-500 truncate">{last?.text ?? ''}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Thread */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-800 bg-stone-900 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#25D366' }}>
            <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-stone-100">{selected ? `+${selected}` : 'Select a conversation'}</p>
            {selected && <p className="text-[10px] text-stone-500">via WhatsApp · AI replies active</p>}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-3 bg-[#0d1117]"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(37,211,102,0.03) 0%, transparent 50%)' }}>
          {thread.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <p className="text-stone-700 text-sm">{selected ? 'No messages yet' : 'Select a conversation'}</p>
            </div>
          )}
          {thread.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-stone-800 text-stone-200 rounded-tl-sm'
                  : 'text-stone-900 rounded-tr-sm'
              }`}
                style={msg.role === 'agent' ? { backgroundColor: '#dcf8c6' } : {}}>
                {msg.text}
                <span className={`block text-[9px] mt-1 ${msg.role === 'user' ? 'text-stone-600' : 'text-stone-500'} text-right`}>
                  {fmt(msg.ts)} {msg.role === 'agent' && '✓✓'}
                </span>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  )
}
