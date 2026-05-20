'use client'

import { useEffect, useRef, useState } from 'react'

const BRAND = { gold: '#C8A36B', teal: '#517D86', slate: '#2E3538' }

interface Conversation {
  id:           string
  phone_number: string
  display_name: string | null
  state:        { stage?: string; destination?: string; language?: string } | null
  updated_at:   string
  lastMessage:  { content: string | null; role: string; created_at: string } | null
  messageCount: number
}

interface Message {
  id:         string
  role:       'user' | 'assistant'
  content:    string | null
  created_at: string
}

function formatPhone(jid: string) {
  return '+' + jid.replace('@s.whatsapp.net', '').replace('@c.us', '')
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function fmtDate(iso: string) {
  const d = new Date(iso)
  const today = new Date()
  if (d.toDateString() === today.toDateString()) return 'Today'
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString([], { day: 'numeric', month: 'short' })
}

function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      backgroundColor: 'rgba(200,163,107,0.15)',
      border: '1px solid rgba(200,163,107,0.25)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <span style={{ fontSize: size * 0.38, color: BRAND.gold, fontWeight: 500 }}>
        {name[0].toUpperCase()}
      </span>
    </div>
  )
}

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selected, setSelected]           = useState<Conversation | null>(null)
  const [messages, setMessages]           = useState<Message[]>([])
  const [loadingConvs, setLoadingConvs]   = useState(true)
  const [loadingMsgs, setLoadingMsgs]     = useState(false)
  const [search, setSearch]               = useState('')
  const bottomRef                         = useRef<HTMLDivElement>(null)

  // Load conversations list
  useEffect(() => {
    fetch('/api/admin/conversations')
      .then(r => r.json())
      .then(d => {
        setConversations(d.conversations ?? [])
        if (d.conversations?.length) setSelected(d.conversations[0])
      })
      .finally(() => setLoadingConvs(false))
  }, [])

  // Load messages when conversation selected
  useEffect(() => {
    if (!selected) return
    setLoadingMsgs(true)
    fetch(`/api/admin/conversations/${selected.id}`)
      .then(r => r.json())
      .then(d => setMessages(d.messages ?? []))
      .finally(() => setLoadingMsgs(false))
  }, [selected])

  // Auto scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const filtered = conversations.filter(c => {
    const q = search.toLowerCase()
    if (!q) return true
    return (
      (c.display_name ?? '').toLowerCase().includes(q) ||
      formatPhone(c.phone_number).includes(q) ||
      (c.state?.destination ?? '').toLowerCase().includes(q)
    )
  })

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'var(--font-norway)' }}>

      {/* ── Left: conversation list ── */}
      <div style={{
        width: 280, flexShrink: 0,
        backgroundColor: '#111920',
        borderRight: '1px solid rgba(200,163,107,0.1)',
        display: 'flex', flexDirection: 'column',
      }}>

        {/* Header */}
        <div style={{ padding: '20px 16px 14px', borderBottom: '1px solid rgba(200,163,107,0.08)' }}>
          <p style={{ fontSize: '0.6rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: BRAND.teal, marginBottom: 12 }}>
            Conversations · {conversations.length}
          </p>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"
              style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', width: 12, height: 12, color: 'rgba(255,255,255,0.25)' }}>
              <circle cx="6.5" cy="6.5" r="4.5"/><path d="M11 11l3 3"/>
            </svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search…"
              style={{
                width: '100%', paddingLeft: 28, paddingRight: 10, paddingTop: 7, paddingBottom: 7,
                backgroundColor: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(200,163,107,0.15)', borderRadius: 8,
                color: '#fff', fontSize: '0.72rem', outline: 'none',
              }}
            />
          </div>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loadingConvs && (
            <p style={{ padding: '24px 16px', fontSize: '0.72rem', color: 'rgba(255,255,255,0.2)', textAlign: 'center' }}>Loading…</p>
          )}
          {!loadingConvs && filtered.length === 0 && (
            <p style={{ padding: '24px 16px', fontSize: '0.72rem', color: 'rgba(255,255,255,0.2)', textAlign: 'center' }}>No conversations yet</p>
          )}
          {filtered.map(conv => {
            const isActive = selected?.id === conv.id
            const name = conv.display_name ?? formatPhone(conv.phone_number)
            return (
              <button
                key={conv.id}
                onClick={() => setSelected(conv)}
                style={{
                  width: '100%', textAlign: 'left',
                  padding: '12px 16px',
                  backgroundColor: isActive ? 'rgba(200,163,107,0.1)' : 'transparent',
                  borderLeft: `2px solid ${isActive ? BRAND.gold : 'transparent'}`,
                  border: 'none', cursor: 'pointer',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <Avatar name={name} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 500, color: isActive ? '#fff' : 'rgba(255,255,255,0.7)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 120 }}>
                        {name}
                      </span>
                      <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.25)', flexShrink: 0 }}>
                        {fmtDate(conv.updated_at)}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {conv.lastMessage?.content ?? 'No messages yet'}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      <span style={{ fontSize: '0.55rem', padding: '2px 6px', borderRadius: 99, backgroundColor: 'rgba(81,125,134,0.2)', color: BRAND.teal }}>
                        {conv.state?.stage ?? 'idle'}
                      </span>
                      <span style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.2)' }}>{conv.messageCount} msgs</span>
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Right: message thread ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#0d1315' }}>

        {/* Thread header */}
        {selected ? (
          <div style={{
            padding: '16px 24px', borderBottom: '1px solid rgba(200,163,107,0.08)',
            backgroundColor: '#111920', display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <Avatar name={selected.display_name ?? formatPhone(selected.phone_number)} size={38} />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '0.9rem', fontWeight: 500, color: '#fff' }}>
                {selected.display_name ?? formatPhone(selected.phone_number)}
              </p>
              <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
                {formatPhone(selected.phone_number)}
                {selected.state?.destination && ` · ${selected.state.destination}`}
                {selected.state?.language && ` · ${selected.state.language === 'ar' ? 'Arabic' : 'English'}`}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: BRAND.teal }}>{selected.state?.stage ?? 'idle'}</p>
              <p style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.2)', marginTop: 2 }}>{selected.messageCount} messages</p>
            </div>
          </div>
        ) : (
          <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(200,163,107,0.08)', backgroundColor: '#111920' }}>
            <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.2)' }}>Select a conversation</p>
          </div>
        )}

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {loadingMsgs && (
            <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '0.75rem', marginTop: 40 }}>Loading messages…</p>
          )}
          {!loadingMsgs && messages.length === 0 && selected && (
            <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '0.75rem', marginTop: 40 }}>No messages in this conversation</p>
          )}
          {!loadingMsgs && !selected && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ color: 'rgba(255,255,255,0.12)', fontSize: '0.8rem' }}>Select a conversation to view messages</p>
            </div>
          )}
          {messages.map((msg, i) => {
            const isUser = msg.role === 'user'
            // Show date separator if first message or date changed
            const prevDate = i > 0 ? new Date(messages[i-1].created_at).toDateString() : null
            const thisDate = new Date(msg.created_at).toDateString()
            const showDate = prevDate !== thisDate
            return (
              <div key={msg.id}>
                {showDate && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '8px 0' }}>
                    <div style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.06)' }} />
                    <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em' }}>{fmtDate(msg.created_at)}</span>
                    <div style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.06)' }} />
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: isUser ? 'flex-start' : 'flex-end' }}>
                  <div style={{
                    maxWidth: '68%',
                    padding: '10px 14px',
                    borderRadius: 16,
                    borderTopLeftRadius:  isUser ? 4 : 16,
                    borderTopRightRadius: isUser ? 16 : 4,
                    backgroundColor: isUser ? BRAND.slate : 'rgba(200,163,107,0.15)',
                    border: isUser ? '1px solid rgba(255,255,255,0.06)' : `1px solid rgba(200,163,107,0.2)`,
                  }}>
                    <p style={{ fontSize: '0.78rem', lineHeight: 1.55, color: isUser ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.9)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {msg.content ?? ''}
                    </p>
                    <p style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.25)', marginTop: 4, textAlign: 'right' }}>
                      {fmtTime(msg.created_at)} {!isUser && '✓✓'}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>
      </div>

    </div>
  )
}
