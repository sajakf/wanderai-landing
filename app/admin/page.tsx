'use client'

import { useEffect, useState } from 'react'

type Status = 'disconnected' | 'connecting' | 'qr' | 'connected'

const STATUS_LABEL: Record<Status, string> = {
  disconnected: 'Disconnected',
  connecting:   'Connecting…',
  qr:           'Scan QR code',
  connected:    'Connected',
}
const STATUS_COLOR: Record<Status, string> = {
  disconnected: 'text-red-400',
  connecting:   'text-amber-400',
  qr:           'text-amber-400',
  connected:    'text-emerald-400',
}

export default function AdminDashboard() {
  const [status, setStatus]   = useState<Status>('disconnected')
  const [qr, setQr]           = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [msgCount, setMsgCount] = useState(0)

  useEffect(() => {
    fetch('/api/wa/status').then(r => r.json()).then(d => setStatus(d.status))
    fetch('/api/messages').then(r => r.json()).then(d => setMsgCount(d.messages?.length ?? 0))

    const es = new EventSource('/api/wa/qr')
    es.onmessage = (e) => {
      const d = JSON.parse(e.data)
      if (d.status) setStatus(d.status as Status)
      if ('qr' in d)   setQr(d.qr)
    }
    return () => es.close()
  }, [])

  const connect = async () => {
    setLoading(true)
    await fetch('/api/wa/connect', { method: 'POST' })
    setLoading(false)
  }

  const disconnect = async () => {
    setLoading(true)
    await fetch('/api/wa/disconnect', { method: 'POST' })
    setStatus('disconnected')
    setQr(null)
    setLoading(false)
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-xl font-serif font-semibold text-stone-100 mb-1">WhatsApp Connection</h1>
        <p className="text-stone-500 text-sm font-light">Connect your WhatsApp Business number to start receiving and replying to customers.</p>
      </div>

      {/* Status card */}
      <div className="bg-stone-900 rounded-2xl border border-stone-800 p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-stone-600 mb-1">Status</p>
            <p className={`text-lg font-semibold ${STATUS_COLOR[status]}`}>{STATUS_LABEL[status]}</p>
          </div>
          <div className="flex gap-2.5">
            {status === 'disconnected' && (
              <button
                onClick={connect}
                disabled={loading}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
                style={{ backgroundColor: '#25D366', color: '#fff' }}
              >
                {loading ? 'Starting…' : 'Connect WhatsApp'}
              </button>
            )}
            {(status === 'connected' || status === 'qr' || status === 'connecting') && (
              <button
                onClick={disconnect}
                disabled={loading}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-stone-800 text-stone-300 hover:bg-stone-700 transition-all disabled:opacity-50"
              >
                {loading ? 'Stopping…' : 'Disconnect'}
              </button>
            )}
          </div>
        </div>

        {/* QR code area */}
        {status === 'qr' && qr && (
          <div className="flex flex-col items-center py-4">
            <p className="text-sm text-stone-400 mb-5 text-center">
              Open WhatsApp on your phone → <strong className="text-stone-200">Linked Devices</strong> → <strong className="text-stone-200">Link a Device</strong>
            </p>
            <div className="p-4 bg-white rounded-2xl shadow-xl">
              <img src={qr} alt="WhatsApp QR Code" width={256} height={256} className="block" />
            </div>
            <p className="text-xs text-stone-600 mt-4 animate-pulse">Waiting for scan…</p>
          </div>
        )}

        {status === 'connecting' && !qr && (
          <div className="flex items-center justify-center py-10">
            <div className="flex gap-1.5">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
              ))}
            </div>
          </div>
        )}

        {status === 'connected' && (
          <div className="flex items-center gap-3 py-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#25D366' }}>
              <svg viewBox="0 0 24 24" fill="white" className="w-6 h-6">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </div>
            <div>
              <p className="text-stone-100 font-medium text-sm">WhatsApp is live</p>
              <p className="text-stone-500 text-xs">AI agent is active — customers will receive automatic replies</p>
            </div>
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Messages', value: msgCount, sub: 'all time' },
          { label: 'AI Model', value: 'OpenRouter', sub: process.env.NEXT_PUBLIC_OR_MODEL ?? 'claude-haiku' },
          { label: 'Knowledge Base', value: 'Active', sub: 'data/knowledge-base.md' },
        ].map((s, i) => (
          <div key={i} className="bg-stone-900 rounded-xl border border-stone-800 p-4">
            <p className="text-[10px] uppercase tracking-widest text-stone-600 mb-1">{s.label}</p>
            <p className="text-stone-100 font-semibold text-base">{s.value}</p>
            <p className="text-stone-600 text-[10px] mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Setup guide */}
      <div className="mt-6 bg-stone-900/50 rounded-2xl border border-stone-800 p-5">
        <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">Quick setup</p>
        <ol className="space-y-2">
          {[
            'Add OPENROUTER_API_KEY to your .env.local file',
            'Click "Connect WhatsApp" above',
            'Scan the QR code with your WhatsApp Business app',
            'Edit the Knowledge Base to customise AI behaviour',
            'Watch live replies arrive in the Messages tab',
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-stone-800 text-stone-500 text-[9px] font-mono flex items-center justify-center mt-0.5">{i + 1}</span>
              <span className="text-stone-500 text-xs leading-relaxed">{step}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
