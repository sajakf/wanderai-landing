'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

// ─── Brand ───────────────────────────────────────────────────────────────────
const BRAND = {
  gold:  '#C8A36B',
  teal:  '#517D86',
  slate: '#2E3538',
}

type Status = 'disconnected' | 'connecting' | 'qr' | 'connected'

// ─── W mark ───────────────────────────────────────────────────────────────────
function WMark({ className = 'w-10 h-7', color = 'currentColor' }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 260 148" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path
        d="M 30 112
           C 22 98, 14 80, 20 60
           C 26 40, 46 26, 68 36
           C 84 44, 90 60, 84 80
           C 78 100, 74 116, 76 128
           C 80 140, 94 142, 106 130
           C 118 118, 126 98, 128 80
           C 130 62, 130 50, 134 48
           C 138 46, 142 50, 142 60
           C 144 72, 138 86, 130 90
           C 122 94, 116 86, 118 76
           C 120 66, 128 62, 136 70
           C 146 82, 158 108, 168 122
           C 180 138, 198 136, 210 120
           C 224 102, 234 70, 238 28"
        stroke={color} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"
      />
      <g transform="translate(239,25) rotate(-42)">
        <path d="M0 0 L-12 -4 L-8.5 0 L-12 4 Z" fill={color} />
        <path d="M-8.5 -1 L-16 -7.5 L-14.5 -1 L-16 1 L-14.5 1 L-16 7.5 L-8.5 1 Z" fill={color} opacity="0.85" />
      </g>
    </svg>
  )
}

// ─── Status dot ───────────────────────────────────────────────────────────────
function StatusDot({ status }: { status: Status }) {
  const colors: Record<Status, string> = {
    connected:    '#34d399',
    qr:           '#fbbf24',
    connecting:   '#fbbf24',
    disconnected: '#f87171',
  }
  const pulse = status === 'qr' || status === 'connecting'
  return (
    <span style={{
      width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
      backgroundColor: colors[status],
      display: 'inline-block',
      animation: pulse ? 'pulse 1.5s ease-in-out infinite' : 'none',
    }} />
  )
}

// ─── Nav items ────────────────────────────────────────────────────────────────
const NAV = [
  {
    href: '/admin',
    label: 'Dashboard',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z"/>
        <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z"/>
      </svg>
    ),
  },
  {
    href: '/admin/messages',
    label: 'Conversations',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd"/>
      </svg>
    ),
  },
  {
    href: '/admin/users',
    label: 'Users',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
      </svg>
    ),
  },
  {
    href: '/admin/kb',
    label: 'Knowledge Base',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z"/>
      </svg>
    ),
  },
]

// ─── Layout ───────────────────────────────────────────────────────────────────
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router   = useRouter()
  const [status, setStatus] = useState<Status>('disconnected')

  useEffect(() => {
    // Poll WhatsApp status every 15s — avoids SSE timeout issues on Vercel
    let cancelled = false
    async function pollStatus() {
      if (cancelled) return
      try {
        const r = await fetch('/api/wa/status')
        if (!cancelled && r.ok) {
          const d = await r.json()
          setStatus(d.status)
        }
      } catch (_) {}
      if (!cancelled) setTimeout(pollStatus, 15_000)
    }
    pollStatus()
    return () => { cancelled = true }
  }, [])

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/admin/login')
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0d1315', display: 'flex', color: '#fff', fontFamily: 'var(--font-norway)' }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: 220, flexShrink: 0,
        backgroundColor: BRAND.slate,
        borderRight: '1px solid rgba(200,163,107,0.1)',
        display: 'flex', flexDirection: 'column',
      }}>

        {/* Logo */}
        <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid rgba(200,163,107,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <WMark className="w-10 h-7" color={BRAND.gold} />
            <span style={{
              fontFamily: 'var(--font-playfair)',
              fontWeight: 300, fontSize: '1rem',
              letterSpacing: '0.18em',
              color: 'rgba(255,255,255,0.9)',
            }}>
              WanderAi
            </span>
          </div>
          <p style={{ fontSize: '0.6rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: BRAND.teal, marginLeft: 2 }}>
            Admin Panel
          </p>
        </div>

        {/* Gold rule */}
        <div style={{ height: 1, background: `linear-gradient(to right, rgba(200,163,107,0.25), transparent)`, margin: '0 0 8px' }} />

        {/* Nav */}
        <nav style={{ flex: 1, padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV.map(({ href, label, icon }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 12px', borderRadius: 10,
                  fontSize: '0.75rem', fontWeight: active ? 500 : 400,
                  letterSpacing: '0.04em',
                  color: active ? '#fff' : 'rgba(255,255,255,0.45)',
                  backgroundColor: active ? 'rgba(200,163,107,0.14)' : 'transparent',
                  borderLeft: active ? `2px solid ${BRAND.gold}` : '2px solid transparent',
                  textDecoration: 'none',
                  transition: 'all 0.18s',
                }}
              >
                <span style={{ color: active ? BRAND.gold : 'rgba(255,255,255,0.35)' }}>{icon}</span>
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Bottom — status + logout */}
        <div style={{ padding: '14px 20px 20px', borderTop: '1px solid rgba(200,163,107,0.1)' }}>
          {/* WhatsApp status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
            <StatusDot status={status} />
            <span style={{ fontSize: '0.65rem', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.35)', textTransform: 'capitalize' }}>
              WhatsApp: {status}
            </span>
          </div>

          {/* Back to site */}
          <Link href="/" style={{
            display: 'block', fontSize: '0.65rem', color: 'rgba(255,255,255,0.25)',
            textDecoration: 'none', letterSpacing: '0.05em', marginBottom: 8,
            transition: 'color 0.18s',
          }}>
            ← Back to site
          </Link>

          {/* Logout */}
          <button
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'none', border: '1px solid rgba(200,163,107,0.2)',
              borderRadius: 8, padding: '6px 10px', cursor: 'pointer',
              fontSize: '0.65rem', letterSpacing: '0.08em', textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.35)', transition: 'all 0.18s', width: '100%',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = BRAND.gold
              e.currentTarget.style.borderColor = 'rgba(200,163,107,0.5)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = 'rgba(255,255,255,0.35)'
              e.currentTarget.style.borderColor = 'rgba(200,163,107,0.2)'
            }}
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
              <path d="M6 14H3a1 1 0 01-1-1V3a1 1 0 011-1h3M10 11l3-3-3-3M13 8H6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Log out
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main style={{ flex: 1, overflow: 'auto', backgroundColor: '#0d1315' }}>
        {children}
      </main>

    </div>
  )
}
