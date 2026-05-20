'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

// ─── Brand ───────────────────────────────────────────────────────────────────
const BRAND = {
  gold:  '#C8A36B',
  sand:  '#EBDFD1',
  ivory: '#F7F4EF',
  teal:  '#517D86',
  slate: '#2E3538',
}

// ─── W mark (reused from landing page) ───────────────────────────────────────
function WMark({ className = 'w-12 h-9', color = 'currentColor' }: { className?: string; color?: string }) {
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

// ─── Lock icon ────────────────────────────────────────────────────────────────
function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
      strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

// ─── Login form (needs Suspense for useSearchParams) ─────────────────────────
function LoginForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const next         = searchParams.get('next') ?? '/admin'

  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!password.trim()) return
    setLoading(true)
    setError('')

    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })

    if (res.ok) {
      router.push(next)
    } else {
      setError('Incorrect password. Try again.')
      setPassword('')
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Password field */}
      <div style={{ position: 'relative' }}>
        <div style={{
          position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
          color: 'rgba(255,255,255,0.3)', pointerEvents: 'none',
        }}>
          <LockIcon />
        </div>
        <input
          ref={inputRef}
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Admin password"
          autoComplete="current-password"
          style={{
            width: '100%',
            paddingLeft: 42, paddingRight: 16,
            paddingTop: 13, paddingBottom: 13,
            backgroundColor: 'rgba(255,255,255,0.06)',
            border: `1px solid ${error ? '#ef4444' : 'rgba(200,163,107,0.25)'}`,
            borderRadius: 12,
            color: '#fff',
            fontSize: '0.875rem',
            fontFamily: 'var(--font-norway)',
            outline: 'none',
            transition: 'border-color 0.2s',
          }}
          onFocus={e => { if (!error) e.target.style.borderColor = BRAND.gold }}
          onBlur={e => { e.target.style.borderColor = error ? '#ef4444' : 'rgba(200,163,107,0.25)' }}
        />
      </div>

      {/* Error */}
      {error && (
        <p style={{ fontSize: '0.75rem', color: '#f87171', textAlign: 'center', fontFamily: 'var(--font-norway)' }}>
          {error}
        </p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading || !password.trim()}
        style={{
          width: '100%',
          padding: '13px 0',
          backgroundColor: loading ? 'rgba(200,163,107,0.5)' : BRAND.gold,
          color: BRAND.slate,
          border: 'none',
          borderRadius: 12,
          fontSize: '0.8rem',
          fontWeight: 600,
          fontFamily: 'var(--font-norway)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s',
        }}
      >
        {loading ? 'Entering…' : 'Enter Admin'}
      </button>
    </form>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AdminLoginPage() {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0d1315',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: 'var(--font-norway)',
    }}>
      {/* Subtle gold orb */}
      <div style={{
        position: 'fixed', top: '-200px', left: '-200px', width: '600px', height: '600px',
        borderRadius: '50%', pointerEvents: 'none',
        background: 'radial-gradient(circle at center, rgba(200,163,107,0.07) 0%, transparent 65%)',
        filter: 'blur(60px)',
      }} />

      <div style={{
        width: '100%', maxWidth: '360px',
        backgroundColor: BRAND.slate,
        border: '1px solid rgba(200,163,107,0.15)',
        borderRadius: 24,
        padding: '40px 32px 36px',
        position: 'relative',
        boxShadow: '0 24px 80px rgba(0,0,0,0.4)',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28 }}>
          <WMark className="w-16 h-12" color={BRAND.gold} />
          <span style={{
            fontFamily: 'var(--font-playfair)',
            fontWeight: 300,
            fontSize: '1.1rem',
            letterSpacing: '0.22em',
            color: 'rgba(255,255,255,0.9)',
            marginTop: 8,
          }}>
            WanderAi
          </span>
          <span style={{
            fontSize: '0.6rem',
            letterSpacing: '0.35em',
            textTransform: 'uppercase',
            color: BRAND.teal,
            marginTop: 4,
          }}>
            Admin Access
          </span>
        </div>

        {/* Gold rule */}
        <div style={{
          height: 1, marginBottom: 28,
          background: `linear-gradient(to right, transparent, rgba(200,163,107,0.3), transparent)`,
        }} />

        {/* Form */}
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>

        {/* Footer */}
        <p style={{
          marginTop: 24, textAlign: 'center',
          fontSize: '0.65rem', letterSpacing: '0.05em',
          color: 'rgba(255,255,255,0.18)',
        }}>
          Restricted access · WanderAi © 2025
        </p>
      </div>
    </div>
  )
}
