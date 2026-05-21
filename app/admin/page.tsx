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

          {/* Connect button */}
          <button
            onClick={() => window.open('http://localhost:3000/qr', '_blank')}
            style={{
              width: '100%', padding: '13px 0', marginBottom: 16,
              backgroundColor: '#25D366', border: 'none', borderRadius: 12,
              color: '#fff', fontSize: '0.78rem', fontWeight: 600,
              letterSpacing: '0.06em', textTransform: 'uppercase',
              cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 8,
            }}
          >
            <svg viewBox="0 0 24 24" fill="white" width={16} height={16}>
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Scan QR Code — Connect WhatsApp
          </button>

          <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.25)', textAlign: 'center', marginBottom: 16 }}>
            Make sure <code style={{ color: BRAND.gold, fontFamily: 'monospace' }}>npm start</code> is running in <code style={{ color: BRAND.gold, fontFamily: 'monospace' }}>wanderai-bot</code>
          </p>

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
