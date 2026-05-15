'use client'

import { useState } from 'react'

const AVATAR_COLORS = [
  'hsl(35, 55%, 72%)',
  'hsl(200, 45%, 68%)',
  'hsl(15, 50%, 70%)',
  'hsl(150, 35%, 65%)',
  'hsl(270, 30%, 72%)',
]

export default function Home() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'success'>('idle')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email.trim()) setStatus('success')
  }

  return (
    <main className="relative min-h-screen overflow-hidden flex flex-col">

      {/* ── Video Background ── */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3Crect fill='%23d4e9eb'/%3E%3C/svg%3E"
      >
        <source src="https://assets.mixkit.co/videos/5008/5008-720.mp4" type="video/mp4" />
      </video>
      <div className="video-overlay absolute inset-0" />
      <div className="grain absolute inset-0 opacity-[0.12]" />
      <div className="orb orb-gold" />
      <div className="orb orb-rose" />

      {/* ── Top nav ── */}
      <nav className="relative z-10 flex items-center justify-between px-8 md:px-14 pt-9 fade-up delay-1">
        <div className="flex items-center gap-2.5">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" className="text-stone-700">
            <circle cx="11" cy="11" r="10" stroke="currentColor" strokeWidth="1.4" />
            <path d="M1 11h20M11 1c-3 3-4.5 6-4.5 10s1.5 7 4.5 10M11 1c3 3 4.5 6 4.5 10s-1.5 7-4.5 10" stroke="currentColor" strokeWidth="1.4" />
          </svg>
          <span className="text-sm tracking-[0.22em] uppercase text-stone-700 font-semibold">
            WanderAI
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs tracking-widest text-stone-600 uppercase font-light">
            Coming soon
          </span>
        </div>
      </nav>

      {/* ── Main content ── */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">

        {/* Eyebrow */}
        <div className="fade-up delay-2 flex items-center gap-3 mb-10">
          <div className="w-10 h-px bg-stone-400/60" />
          <span className="text-xs tracking-[0.38em] uppercase text-stone-500 font-light">
            A new way to wander
          </span>
          <div className="w-10 h-px bg-stone-400/60" />
        </div>

        {/* Hero headline */}
        <h1 className="hero-text font-serif text-stone-900 mb-8 fade-up delay-3">
          <span className="block font-light text-stone-800">Pack light.</span>
          <span className="block font-black italic" style={{ color: '#9a6f1e' }}>
            Dream heavy.
          </span>
        </h1>

        {/* Sub-headline */}
        <div className="fade-up delay-4 mb-14 space-y-2">
          <p className="text-lg md:text-xl text-stone-600 font-light leading-relaxed tracking-wide">
            AI-powered travel is boarding soon —
          </p>
          <p className="text-base md:text-lg text-stone-500 font-light">
            and you&apos;ll definitely want a window seat.
          </p>
        </div>

        {/* Social proof */}
        <div className="fade-up delay-5 flex items-center gap-3 mb-10">
          <div className="flex -space-x-2.5">
            {AVATAR_COLORS.map((color, i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                style={{ backgroundColor: color, zIndex: 5 - i }}
              />
            ))}
          </div>
          <p className="text-sm text-stone-500 font-light">
            <span className="text-stone-800 font-medium">2,847</span> travellers already on board
          </p>
        </div>

        {/* Email capture */}
        <div className="fade-up delay-6 w-full max-w-md">
          {status === 'idle' ? (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="flex-1 px-6 py-4 rounded-full border border-stone-200 bg-white/65 backdrop-blur-md text-sm text-stone-700 placeholder-stone-400 focus:outline-none focus:border-stone-400 focus:bg-white/80 transition-all"
              />
              <button
                type="submit"
                className="btn-primary px-8 py-4 rounded-full bg-stone-900 text-white text-sm font-medium tracking-wide whitespace-nowrap"
              >
                Board now ↗
              </button>
            </form>
          ) : (
            <div className="px-8 py-4 rounded-full border border-stone-200/80 bg-white/60 backdrop-blur-md">
              <span className="text-sm text-stone-600 font-light">
                ✦ &nbsp;You&apos;re on the list — first-class boarding details incoming.
              </span>
            </div>
          )}
          <p className="mt-4 text-xs text-stone-400 font-light tracking-wide">
            No spam. Unsubscribe anytime. First-class spots are limited.
          </p>
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <footer className="relative z-10 flex items-center justify-between px-8 md:px-14 pb-8 fade-up delay-6">
        <span className="text-xs text-stone-400 font-light tracking-widest uppercase">
          thewanderlust.app
        </span>
        <div className="flex items-center gap-5">
          <span className="text-xs text-stone-400 font-light">© 2025 WanderAI</span>
        </div>
      </footer>

      {/* ── Decorative corner lines ── */}
      <div className="absolute top-0 left-0 w-20 h-20 pointer-events-none">
        <div className="absolute top-6 left-6 w-px h-8 bg-stone-300/50" />
        <div className="absolute top-6 left-6 w-8 h-px bg-stone-300/50" />
      </div>
      <div className="absolute bottom-0 right-0 w-20 h-20 pointer-events-none">
        <div className="absolute bottom-6 right-6 w-px h-8 bg-stone-300/50" />
        <div className="absolute bottom-6 right-6 w-8 h-px bg-stone-300/50" />
      </div>
    </main>
  )
}
