'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

type Status = 'disconnected' | 'connecting' | 'qr' | 'connected'

function StatusDot({ status }: { status: Status }) {
  const colors: Record<Status, string> = {
    connected:    'bg-emerald-400',
    qr:           'bg-amber-400 animate-pulse',
    connecting:   'bg-amber-400 animate-pulse',
    disconnected: 'bg-red-500',
  }
  return <span className={`w-2 h-2 rounded-full flex-shrink-0 ${colors[status]}`} />
}

const NAV = [
  {
    href: '/admin',
    label: 'Connection',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z"/>
        <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z"/>
      </svg>
    ),
  },
  {
    href: '/admin/messages',
    label: 'Messages',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd"/>
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

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [status, setStatus] = useState<Status>('disconnected')

  useEffect(() => {
    fetch('/api/wa/status').then(r => r.json()).then(d => setStatus(d.status))
    const es = new EventSource('/api/wa/qr')
    es.onmessage = (e) => {
      const d = JSON.parse(e.data)
      if (d.status) setStatus(d.status)
    }
    return () => es.close()
  }, [])

  return (
    <div className="min-h-screen bg-stone-950 flex text-stone-100 font-sans">
      {/* Sidebar */}
      <aside className="w-52 flex-shrink-0 bg-stone-900 border-r border-stone-800 flex flex-col">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-stone-800">
          <div className="flex items-center gap-2 mb-0.5">
            <svg width="16" height="16" viewBox="0 0 22 22" fill="none" className="text-stone-400">
              <circle cx="11" cy="11" r="10" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M1 11h20M11 1c-3 3-4.5 6-4.5 10s1.5 7 4.5 10M11 1c3 3 4.5 6 4.5 10s-1.5 7-4.5 10" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
            <span className="text-xs tracking-[0.18em] uppercase text-stone-300 font-semibold">WanderAI</span>
          </div>
          <p className="text-[10px] text-stone-600 font-light">Admin Panel</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-1">
          {NAV.map(({ href, label, icon }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                  active
                    ? 'bg-stone-800 text-stone-100'
                    : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
                }`}
              >
                {icon}
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Status */}
        <div className="px-5 py-4 border-t border-stone-800">
          <div className="flex items-center gap-2">
            <StatusDot status={status} />
            <span className="text-[10px] text-stone-500 capitalize">{status}</span>
          </div>
          <Link href="/" className="text-[10px] text-stone-600 hover:text-stone-400 transition-colors mt-1 block">
            ← Landing page
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
