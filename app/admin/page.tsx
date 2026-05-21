'use client'

import { useEffect, useState } from 'react'

const BRAND = { gold: '#C8A36B', teal: '#517D86', slate: '#2E3538', terracotta: '#C56A4E' }

interface Stats {
  totalConversations: number
  totalMessages:      number
  activeToday:        number
  recentConversations: {
    id: string
    phone_number: string
    display_name: string | null
    state: { stage?: string; destination?: string } | null
    created_at: string
  }[]
}

function StatCard({ label, value, sub, accent }: { label: string; value: string | number; sub: string; accent: string }) {
  return (
    <div style={{
      backgroundColor: BRAND.slate, border: `1px solid rgba(200,163,107,0.12)`,
      borderRadius: 16, padding: '20px 22px',
    }}>
      <p style={{ fontSize: '0.6rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: accent, marginBottom: 8 }}>{label}</p>
      <p style={{ fontSize: '1.6rem', fontFamily: 'var(--font-playfair)', fontWeight: 400, color: '#fff', lineHeight: 1 }}>{value}</p>
      <p style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.3)', marginTop: 5 }}>{sub}</p>
    </div>
  )
}

function formatPhone(jid: string) {
  return jid.replace('@s.whatsapp.net', '').replace('@c.us', '')
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

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({ totalConversations: 0, totalMessages: 0, activeToday: 0, recentConversations: [] })

  useEffect(() => {
    fetch('/api/admin/stats').then(r => r.json()).then(setStats).catch(() => {})
  }, [])

  const stageColor: Record<string, string> = {
    completed:   BRAND.teal,
    idle:        'rgba(255,255,255,0.25)',
    payment_sent: BRAND.gold,
    offer_accepted: BRAND.gold,
  }

  return (
    <div style={{ padding: '36px 40px', maxWidth: 900, fontFamily: 'var(--font-norway)' }}>

      {/* Page title */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <div style={{ width: 20, height: 1, backgroundColor: BRAND.gold, opacity: 0.5 }} />
          <p style={{ fontSize: '0.6rem', letterSpacing: '0.35em', textTransform: 'uppercase', color: BRAND.teal }}>Overview</p>
        </div>
        <h1 style={{ fontFamily: 'var(--font-playfair)', fontWeight: 300, fontSize: '1.8rem', color: '#fff' }}>Dashboard</h1>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
        <StatCard label="Total Conversations" value={stats.totalConversations} sub="all time"       accent={BRAND.teal} />
        <StatCard label="Messages Sent"        value={stats.totalMessages}      sub="all time"       accent={BRAND.gold} />
        <StatCard label="New Today"            value={stats.activeToday}        sub="conversations"  accent={BRAND.terracotta} />
      </div>

      {/* Two column: WhatsApp status + Recent activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* WhatsApp Bot status card */}
        <div style={{ backgroundColor: BRAND.slate, border: '1px solid rgba(200,163,107,0.12)', borderRadius: 16, padding: 24 }}>
          <p style={{ fontSize: '0.6rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: BRAND.teal, marginBottom: 16 }}>WhatsApp Bot</p>

          {/* Active indicator based on recent conversations */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{
              width: 9, height: 9, borderRadius: '50%', flexShrink: 0,
              backgroundColor: stats.totalMessages > 0 ? '#34d399' : 'rgba(255,255,255,0.15)',
            }} />
            <p style={{ fontSize: '0.9rem', fontWeight: 500, color: stats.totalMessages > 0 ? '#fff' : 'rgba(255,255,255,0.4)' }}>
              {stats.totalMessages > 0 ? 'Bot has been active' : 'No activity yet'}
            </p>
          </div>

          {/* Instructions */}
          <div style={{ backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 10, padding: '14px 16px', marginBottom: 16 }}>
            <p style={{ fontSize: '0.7rem', fontWeight: 600, color: BRAND.gold, marginBottom: 8, letterSpacing: '0.05em' }}>
              How to connect WhatsApp
            </p>
            <ol style={{ paddingLeft: 16, margin: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
              {[
                'Open terminal on your server / local machine',
                'cd /Users/skf/wanderai-bot',
                'npm start',
                'Scan the QR code that appears in terminal',
              ].map((step, i) => (
                <li key={i} style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
                  {i === 1 || i === 2
                    ? <code style={{ backgroundColor: 'rgba(200,163,107,0.12)', padding: '1px 6px', borderRadius: 4, color: BRAND.gold, fontFamily: 'monospace', fontSize: '0.72rem' }}>{step}</code>
                    : step}
                </li>
              ))}
            </ol>
          </div>

          {/* Gold rule */}
          <div style={{ height: 1, background: `linear-gradient(to right, rgba(200,163,107,0.2), transparent)` }} />
          <p style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.2)', marginTop: 12 }}>
            Model: {process.env.NEXT_PUBLIC_OR_MODEL ?? 'claude-haiku'} · Baileys WebSocket
          </p>
        </div>

        {/* Recent conversations */}
        <div style={{ backgroundColor: BRAND.slate, border: '1px solid rgba(200,163,107,0.12)', borderRadius: 16, padding: 24 }}>
          <p style={{ fontSize: '0.6rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: BRAND.teal, marginBottom: 16 }}>Recent Activity</p>

          {stats.recentConversations.length === 0 ? (
            <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.2)', textAlign: 'center', padding: '24px 0' }}>No conversations yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {stats.recentConversations.map(conv => (
                <div key={conv.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 30, height: 30, borderRadius: '50%', backgroundColor: 'rgba(200,163,107,0.15)', border: `1px solid rgba(200,163,107,0.2)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: '0.65rem', color: BRAND.gold }}>{(conv.display_name ?? formatPhone(conv.phone_number))[0].toUpperCase()}</span>
                    </div>
                    <div>
                      <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>
                        {conv.display_name ?? formatPhone(conv.phone_number)}
                      </p>
                      <p style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>
                        {conv.state?.destination ?? conv.state?.stage ?? 'idle'}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
                    <p style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.25)' }}>{timeAgo(conv.created_at)}</p>
                    <span style={{ fontSize: '0.55rem', letterSpacing: '0.1em', padding: '2px 7px', borderRadius: 99, backgroundColor: 'rgba(200,163,107,0.1)', color: stageColor[conv.state?.stage ?? ''] ?? 'rgba(255,255,255,0.25)' }}>
                      {conv.state?.stage ?? 'idle'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
