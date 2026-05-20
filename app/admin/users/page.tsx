'use client'

import { useEffect, useState } from 'react'

const BRAND = { gold: '#C8A36B', teal: '#517D86', slate: '#2E3538', terracotta: '#C56A4E' }

interface User {
  id:           string
  phone_number: string
  display_name: string | null
  state:        { stage?: string; destination?: string; language?: string; budget?: number; currency?: string } | null
  created_at:   string
  updated_at:   string
  messageCount: number
}

function formatPhone(jid: string) {
  return '+' + jid.replace('@s.whatsapp.net', '').replace('@c.us', '')
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

const STAGE_COLOR: Record<string, string> = {
  completed:      '#34d399',
  payment_sent:   BRAND.gold,
  offer_accepted: BRAND.gold,
  idle:           'rgba(255,255,255,0.2)',
}

export default function UsersPage() {
  const [users, setUsers]     = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [sort, setSort]       = useState<'recent' | 'messages'>('recent')

  useEffect(() => {
    fetch('/api/admin/conversations')
      .then(r => r.json())
      .then(d => setUsers(d.conversations ?? []))
      .finally(() => setLoading(false))
  }, [])

  const filtered = users
    .filter(u => {
      const q = search.toLowerCase()
      if (!q) return true
      return (
        (u.display_name ?? '').toLowerCase().includes(q) ||
        formatPhone(u.phone_number).includes(q) ||
        (u.state?.destination ?? '').toLowerCase().includes(q)
      )
    })
    .sort((a, b) => sort === 'messages'
      ? b.messageCount - a.messageCount
      : new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    )

  return (
    <div style={{ padding: '36px 40px', fontFamily: 'var(--font-norway)' }}>

      {/* Page title */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <div style={{ width: 20, height: 1, backgroundColor: BRAND.gold, opacity: 0.5 }} />
          <p style={{ fontSize: '0.6rem', letterSpacing: '0.35em', textTransform: 'uppercase', color: BRAND.teal }}>Directory</p>
        </div>
        <h1 style={{ fontFamily: 'var(--font-playfair)', fontWeight: 300, fontSize: '1.8rem', color: '#fff' }}>Users</h1>
        <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>
          {users.length} total users
        </p>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"
            style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', width: 13, height: 13, color: 'rgba(255,255,255,0.25)' }}>
            <circle cx="6.5" cy="6.5" r="4.5"/><path d="M11 11l3 3" strokeLinecap="round"/>
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, phone or destination…"
            style={{
              width: '100%', paddingLeft: 32, paddingRight: 14, paddingTop: 9, paddingBottom: 9,
              backgroundColor: BRAND.slate, border: '1px solid rgba(200,163,107,0.15)',
              borderRadius: 10, color: '#fff', fontSize: '0.75rem', outline: 'none',
            }}
          />
        </div>

        {/* Sort */}
        <div style={{ display: 'flex', gap: 6 }}>
          {(['recent', 'messages'] as const).map(s => (
            <button key={s} onClick={() => setSort(s)} style={{
              padding: '8px 14px', borderRadius: 8, fontSize: '0.68rem', fontWeight: 500,
              cursor: 'pointer', border: 'none', transition: 'all 0.15s',
              backgroundColor: sort === s ? 'rgba(200,163,107,0.18)' : 'rgba(255,255,255,0.05)',
              color: sort === s ? BRAND.gold : 'rgba(255,255,255,0.4)',
            }}>
              {s === 'recent' ? 'Most Recent' : 'Most Messages'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ backgroundColor: BRAND.slate, border: '1px solid rgba(200,163,107,0.12)', borderRadius: 16, overflow: 'hidden' }}>

        {/* Table header */}
        <div style={{
          display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 1fr 0.8fr 0.8fr',
          padding: '12px 20px', borderBottom: '1px solid rgba(200,163,107,0.1)',
          backgroundColor: 'rgba(0,0,0,0.2)',
        }}>
          {['User', 'Phone', 'Destination', 'Stage', 'Messages', 'Last Active'].map(h => (
            <p key={h} style={{ fontSize: '0.58rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: BRAND.teal }}>{h}</p>
          ))}
        </div>

        {/* Rows */}
        {loading && (
          <p style={{ padding: '32px 20px', textAlign: 'center', fontSize: '0.75rem', color: 'rgba(255,255,255,0.2)' }}>Loading…</p>
        )}
        {!loading && filtered.length === 0 && (
          <p style={{ padding: '32px 20px', textAlign: 'center', fontSize: '0.75rem', color: 'rgba(255,255,255,0.2)' }}>No users found</p>
        )}
        {filtered.map((user, i) => {
          const name = user.display_name ?? formatPhone(user.phone_number)
          const stage = user.state?.stage ?? 'idle'
          return (
            <div
              key={user.id}
              style={{
                display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 1fr 0.8fr 0.8fr',
                padding: '14px 20px',
                borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                transition: 'background-color 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(200,163,107,0.05)')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              {/* Name + avatar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                  backgroundColor: 'rgba(200,163,107,0.12)',
                  border: '1px solid rgba(200,163,107,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontSize: '0.68rem', color: BRAND.gold, fontWeight: 500 }}>{name[0].toUpperCase()}</span>
                </div>
                <div>
                  <p style={{ fontSize: '0.78rem', fontWeight: 500, color: 'rgba(255,255,255,0.85)' }}>{name}</p>
                  <p style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.25)', marginTop: 1 }}>
                    {user.state?.language === 'ar' ? 'Arabic' : 'English'}
                    {user.state?.budget && ` · ${user.state.budget} ${user.state.currency ?? 'USD'}`}
                  </p>
                </div>
              </div>

              {/* Phone */}
              <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', alignSelf: 'center' }}>
                {formatPhone(user.phone_number)}
              </p>

              {/* Destination */}
              <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)', alignSelf: 'center' }}>
                {user.state?.destination ?? '—'}
              </p>

              {/* Stage badge */}
              <div style={{ alignSelf: 'center' }}>
                <span style={{
                  fontSize: '0.6rem', padding: '3px 9px', borderRadius: 99,
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  color: STAGE_COLOR[stage] ?? 'rgba(255,255,255,0.4)',
                  letterSpacing: '0.06em',
                }}>
                  {stage}
                </span>
              </div>

              {/* Message count */}
              <p style={{ fontSize: '0.78rem', color: user.messageCount > 0 ? BRAND.gold : 'rgba(255,255,255,0.2)', alignSelf: 'center', fontWeight: user.messageCount > 5 ? 600 : 400 }}>
                {user.messageCount}
              </p>

              {/* Last active */}
              <p style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.3)', alignSelf: 'center' }}>
                {timeAgo(user.updated_at)}
              </p>
            </div>
          )
        })}
      </div>

    </div>
  )
}
