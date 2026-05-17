'use client'

import { useState, useCallback, useEffect, useRef } from 'react'

// ─── Aerial nature videos (cycling) ───────────────────────────────────────────
const VIDEOS = [
  'https://assets.mixkit.co/videos/5008/5008-720.mp4',
  'https://assets.mixkit.co/videos/5012/5012-720.mp4',
  'https://assets.mixkit.co/videos/4999/4999-720.mp4',
  'https://assets.mixkit.co/videos/44370/44370-720.mp4',
  'https://assets.mixkit.co/videos/36615/36615-720.mp4',
]

const AVATAR_COLORS = [
  'hsl(35, 55%, 72%)',
  'hsl(200, 45%, 68%)',
  'hsl(15, 50%, 70%)',
  'hsl(150, 35%, 65%)',
  'hsl(270, 30%, 72%)',
]

// ─── WhatsApp chat messages ───────────────────────────────────────────────────
const CHAT = [
  { from: 'user', text: "Hey! I want a sunny 7-day trip, budget around €1,500. Any ideas?", time: '10:02' },
  { from: 'bot',  text: "Hi! I'm WanderAI 🌍 Great budget — let me find you the perfect destination.", time: '10:02' },
  { from: 'bot',  text: "Based on your budget and the season, here are my top picks:\n\n🇬🇷 *Santorini, Greece* — iconic sunsets & white villages\n🇲🇦 *Marrakech, Morocco* — vibrant souks & desert adventures\n🇵🇹 *Algarve, Portugal* — dramatic cliffs & golden beaches\n\nWhich one calls to you?", time: '10:03' },
  { from: 'user', text: "Santorini sounds amazing! Can you plan the whole trip?", time: '10:04' },
  { from: 'bot',  text: "Done! Here's your 7-day Santorini plan ✈️\n\n*Day 1–2:* Arrive Fira, sunset at Oia, local tavernas\n*Day 3:* Volcano hike + hot springs boat tour\n*Day 4:* Wine tasting in Pyrgos, akrotiri ruins\n*Day 5–6:* Perissa black-sand beach, sailing cruise\n*Day 7:* Morning market, fly home\n\n💰 Estimated total: €1,380 incl. flights & hotels\n\nShall I book anything for you?", time: '10:05' },
  { from: 'user', text: "This is exactly what I needed. Please book the flights!", time: '10:06' },
]

// ─── Features ────────────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
        <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
    title: 'No app to download',
    desc: 'Chat directly on WhatsApp. No sign-ups, no new passwords, no friction — just open a chat and go.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
        <path d="M9.663 17h4.673M12 3v1m6.364 1.636-.707.707M21 12h-1M4 12H3m3.343-5.657-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    title: 'AI-powered planning',
    desc: 'Get personalised itineraries, curated recommendations, and budget breakdowns in under a minute.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
        <path d="M12 6v6l4 2m6-2a10 10 0 1 1-20 0 10 10 0 0 1 20 0z" />
      </svg>
    ),
    title: '24 / 7 travel companion',
    desc: 'Ask questions at midnight, change plans on the way to the airport — your agent is always online.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
        <path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3H6a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3z" />
      </svg>
    ),
    title: 'Budget-aware',
    desc: 'Tell us your budget and we\'ll stay within it — flights, hotels, activities, and hidden costs included.',
  },
]

// ─── How-it-works steps ───────────────────────────────────────────────────────
const STEPS = [
  {
    step: '01',
    title: 'Tell us where you want to go',
    desc: 'Share your destination ideas, dates, budget, and travel style. As specific or vague as you like — our AI figures it out.',
  },
  {
    step: '02',
    title: 'Get instant recommendations',
    desc: 'WanderAI surfaces curated options tailored to you — not generic lists. Flights, stays, activities, all in one conversation.',
  },
  {
    step: '03',
    title: 'Receive your full trip plan',
    desc: 'A complete day-by-day itinerary with cost estimates, delivered directly in WhatsApp. Share it with friends in one tap.',
  },
]

// ─── Scroll-reveal hook ───────────────────────────────────────────────────────
function useReveal() {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); obs.disconnect() }
    }, { threshold: 0.15 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return { ref, visible }
}

// ─── Step item (needs its own component to use useReveal legally) ─────────────
function StepItem({ item, index }: { item: typeof STEPS[0]; index: number }) {
  const { ref, visible } = useReveal()
  return (
    <div
      ref={ref}
      className="flex gap-5"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateX(0)' : 'translateX(24px)',
        transition: `opacity 0.6s ease ${index * 150}ms, transform 0.6s ease ${index * 150}ms`,
      }}
    >
      <div className="flex-shrink-0 w-10 h-10 rounded-full border border-stone-200 flex items-center justify-center">
        <span className="text-xs font-mono text-stone-400">{item.step}</span>
      </div>
      <div>
        <h3 className="font-serif font-semibold text-stone-800 text-lg mb-1.5">{item.title}</h3>
        <p className="text-stone-500 text-sm font-light leading-relaxed">{item.desc}</p>
      </div>
    </div>
  )
}

// ─── Video cycler ─────────────────────────────────────────────────────────────
function VideoCycler() {
  const [current, setCurrent] = useState(0)
  const [next, setNext] = useState<number | null>(null)
  const [transitioning, setTransitioning] = useState(false)

  const handleEnded = useCallback(() => {
    const nextIndex = (current + 1) % VIDEOS.length
    setNext(nextIndex)
    setTransitioning(true)
    setTimeout(() => {
      setCurrent(nextIndex)
      setNext(null)
      setTransitioning(false)
    }, 900)
  }, [current])

  return (
    <>
      <video
        key={current}
        autoPlay
        muted
        playsInline
        onEnded={handleEnded}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-[900ms] ${
          transitioning ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <source src={VIDEOS[current]} type="video/mp4" />
      </video>
      {next !== null && (
        <video
          key={`next-${next}`}
          autoPlay
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-100"
          style={{ zIndex: -1 }}
        >
          <source src={VIDEOS[next]} type="video/mp4" />
        </video>
      )}
    </>
  )
}

// ─── WhatsApp chat bubble ─────────────────────────────────────────────────────
function ChatBubble({ msg, index }: { msg: typeof CHAT[0]; index: number }) {
  const { ref, visible } = useReveal()
  const isUser = msg.from === 'user'

  const formattedText = msg.text
    .replace(/\*([^*]+)\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br />')

  return (
    <div
      ref={ref}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} transition-all duration-500`}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(16px)',
        transitionDelay: `${index * 120}ms`,
      }}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center mr-2 flex-shrink-0 mt-auto mb-1">
          <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4">
            <path d="M12 2a10 10 0 0 1 10 10c0 5.523-4.477 10-10 10a9.96 9.96 0 0 1-4.906-1.285L2 22l1.32-4.964A9.96 9.96 0 0 1 2 12 10 10 0 0 1 12 2z"/>
          </svg>
        </div>
      )}
      <div className="max-w-[78%]">
        <div
          className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
            isUser
              ? 'bg-[#dcf8c6] text-stone-800 rounded-tr-sm'
              : 'bg-white text-stone-800 rounded-tl-sm shadow-sm'
          }`}
          dangerouslySetInnerHTML={{ __html: formattedText }}
        />
        <p className={`text-[10px] text-stone-400 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
          {msg.time} {isUser && (
            <span className="text-blue-400 ml-0.5">✓✓</span>
          )}
        </p>
      </div>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function Home() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'success'>('idle')
  const featuresReveal = useReveal()
  const ctaReveal = useReveal()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email.trim()) setStatus('success')
  }

  return (
    <div className="bg-stone-50">

      {/* ══════════════════════════════════════════════════════════
          HERO — full-viewport video background
      ══════════════════════════════════════════════════════════ */}
      <section className="relative h-screen overflow-hidden flex flex-col">

        <VideoCycler />
        <div className="video-overlay absolute inset-0" />
        <div className="grain absolute inset-0 opacity-[0.10]" />
        <div className="orb orb-gold" />
        <div className="orb orb-rose" />

        {/* Nav */}
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

        {/* Hero content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">

          <div className="fade-up delay-2 flex items-center gap-3 mb-10">
            <div className="w-10 h-px bg-stone-400/60" />
            <span className="text-xs tracking-[0.38em] uppercase text-stone-500 font-light">
              Your AI travel agent on WhatsApp
            </span>
            <div className="w-10 h-px bg-stone-400/60" />
          </div>

          <h1 className="hero-text font-serif text-stone-900 mb-8 fade-up delay-3">
            <span className="block font-light text-stone-800">Pack light.</span>
            <span className="block font-black italic" style={{ color: '#9a6f1e' }}>
              Dream heavy.
            </span>
          </h1>

          <p className="fade-up delay-4 text-lg md:text-xl text-stone-600 font-light leading-relaxed tracking-wide max-w-xl mb-12">
            Chat with your personal travel agent directly on WhatsApp —
            no app to download, no account to create.
          </p>

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

          {/* Scroll CTA */}
          <a
            href="#features"
            className="fade-up delay-6 flex flex-col items-center gap-2 text-stone-500 hover:text-stone-700 transition-colors group"
          >
            <span className="text-xs tracking-widest uppercase font-light">Discover how it works</span>
            <div className="w-px h-8 bg-stone-400/60 group-hover:bg-stone-600/60 transition-colors animate-bounce-slow" />
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
              <path d="M8 3v10M3 9l5 5 5-5" />
            </svg>
          </a>
        </div>

        {/* Footer line */}
        <div className="relative z-10 flex items-center justify-between px-8 md:px-14 pb-6 fade-up delay-6">
          <span className="text-xs text-stone-400 font-light tracking-widest uppercase">thewanderlust.app</span>
          <span className="text-xs text-stone-400 font-light">© 2025 WanderAI</span>
        </div>

        {/* Corner deco */}
        <div className="absolute top-0 left-0 w-20 h-20 pointer-events-none">
          <div className="absolute top-6 left-6 w-px h-8 bg-stone-300/50" />
          <div className="absolute top-6 left-6 w-8 h-px bg-stone-300/50" />
        </div>
        <div className="absolute bottom-0 right-0 w-20 h-20 pointer-events-none">
          <div className="absolute bottom-6 right-6 w-px h-8 bg-stone-300/50" />
          <div className="absolute bottom-6 right-6 w-8 h-px bg-stone-300/50" />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          FEATURES
      ══════════════════════════════════════════════════════════ */}
      <section id="features" className="py-28 px-6 bg-stone-50">
        <div
          ref={featuresReveal.ref}
          className="max-w-5xl mx-auto"
          style={{
            opacity: featuresReveal.visible ? 1 : 0,
            transform: featuresReveal.visible ? 'translateY(0)' : 'translateY(32px)',
            transition: 'opacity 0.7s ease, transform 0.7s ease',
          }}
        >
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-3 mb-5">
              <div className="w-8 h-px bg-stone-300" />
              <span className="text-xs tracking-[0.35em] uppercase text-stone-400 font-light">
                Why WanderAI
              </span>
              <div className="w-8 h-px bg-stone-300" />
            </div>
            <h2 className="font-serif text-4xl md:text-5xl font-light text-stone-800 mb-4">
              Travel planning,{' '}
              <span className="italic font-semibold" style={{ color: '#9a6f1e' }}>reinvented</span>
            </h2>
            <p className="text-stone-500 font-light max-w-lg mx-auto">
              Your AI travel agent lives where you already are — WhatsApp.
              No new app, no learning curve, just results.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-7 border border-stone-100 hover:border-stone-200 hover:shadow-md transition-all group"
                style={{
                  opacity: featuresReveal.visible ? 1 : 0,
                  transform: featuresReveal.visible ? 'translateY(0)' : 'translateY(24px)',
                  transition: `opacity 0.6s ease ${i * 100 + 200}ms, transform 0.6s ease ${i * 100 + 200}ms`,
                }}
              >
                <div className="w-11 h-11 rounded-xl bg-stone-100 group-hover:bg-amber-50 flex items-center justify-center text-stone-500 group-hover:text-amber-700 transition-colors mb-5">
                  {f.icon}
                </div>
                <h3 className="font-serif font-semibold text-stone-800 text-lg mb-2">{f.title}</h3>
                <p className="text-stone-500 text-sm font-light leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          WHATSAPP DEMO
      ══════════════════════════════════════════════════════════ */}
      <section className="py-28 px-6 bg-gradient-to-br from-stone-100 to-stone-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-3 mb-5">
              <div className="w-8 h-px bg-stone-300" />
              <span className="text-xs tracking-[0.35em] uppercase text-stone-400 font-light">
                See it in action
              </span>
              <div className="w-8 h-px bg-stone-300" />
            </div>
            <h2 className="font-serif text-4xl md:text-5xl font-light text-stone-800 mb-4">
              Just send a{' '}
              <span className="italic font-semibold" style={{ color: '#9a6f1e' }}>message</span>
            </h2>
            <p className="text-stone-500 font-light max-w-lg mx-auto">
              Tell WanderAI where you want to go, your budget, and your travel style —
              and get a complete trip plan in minutes, right in WhatsApp.
            </p>
          </div>

          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">

            {/* Phone frame */}
            <div className="flex-shrink-0 mx-auto lg:mx-0">
              <div className="relative w-[320px]">
                {/* Phone shell */}
                <div className="bg-stone-900 rounded-[40px] p-3 shadow-2xl">
                  {/* Screen */}
                  <div className="bg-[#ece5dd] rounded-[30px] overflow-hidden">

                    {/* WhatsApp header */}
                    <div className="bg-[#075e54] px-4 pt-9 pb-3 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-emerald-400 flex items-center justify-center flex-shrink-0">
                        <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
                          <path d="M12 2a10 10 0 0 1 10 10c0 5.523-4.477 10-10 10a9.96 9.96 0 0 1-4.906-1.285L2 22l1.32-4.964A9.96 9.96 0 0 1 2 12 10 10 0 0 1 12 2z"/>
                        </svg>
                      </div>
                      <div>
                        <p className="text-white text-sm font-semibold">WanderAI</p>
                        <p className="text-emerald-200 text-[10px]">online</p>
                      </div>
                    </div>

                    {/* Chat area */}
                    <div className="px-3 py-4 space-y-3 min-h-[420px]">
                      {CHAT.map((msg, i) => (
                        <ChatBubble key={i} msg={msg} index={i} />
                      ))}
                    </div>

                    {/* Input bar */}
                    <div className="bg-[#f0f0f0] px-3 py-2.5 flex items-center gap-2.5">
                      <div className="flex-1 bg-white rounded-full px-4 py-2 text-xs text-stone-400">
                        Type a message
                      </div>
                      <div className="w-8 h-8 rounded-full bg-[#075e54] flex items-center justify-center">
                        <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4">
                          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating badge */}
                <div className="absolute -right-4 top-16 bg-white rounded-2xl shadow-lg px-4 py-3 border border-stone-100">
                  <p className="text-xs text-stone-500 font-light mb-0.5">Trip total</p>
                  <p className="text-lg font-serif font-semibold text-stone-800">€1,380</p>
                  <p className="text-[10px] text-emerald-600 font-medium">Within budget ✓</p>
                </div>

                <div className="absolute -left-6 bottom-24 bg-white rounded-2xl shadow-lg px-4 py-3 border border-stone-100">
                  <p className="text-[10px] text-stone-400 font-light mb-1">Planned in</p>
                  <p className="text-base font-serif font-semibold text-stone-800">3 min</p>
                  <div className="flex gap-0.5 mt-1">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className="text-amber-400 text-xs">★</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right side explanation */}
            <div className="flex-1 space-y-8">
              {STEPS.map((item, i) => (
                <StepItem key={i} item={item} index={i} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          CTA / EMAIL CAPTURE
      ══════════════════════════════════════════════════════════ */}
      <section className="py-28 px-6 bg-stone-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="grain w-full h-full" />
        </div>
        <div className="orb-dark orb-dark-gold" />

        <div
          ref={ctaReveal.ref}
          className="relative max-w-2xl mx-auto text-center"
          style={{
            opacity: ctaReveal.visible ? 1 : 0,
            transform: ctaReveal.visible ? 'translateY(0)' : 'translateY(32px)',
            transition: 'opacity 0.7s ease, transform 0.7s ease',
          }}
        >
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-8 h-px bg-stone-600" />
            <span className="text-xs tracking-[0.35em] uppercase text-stone-500 font-light">
              Get early access
            </span>
            <div className="w-8 h-px bg-stone-600" />
          </div>

          <h2 className="font-serif text-4xl md:text-5xl font-light text-white mb-4">
            Be first to{' '}
            <span className="italic font-semibold" style={{ color: '#c49a3c' }}>board</span>
          </h2>
          <p className="text-stone-400 font-light mb-10 max-w-md mx-auto">
            Join the waitlist and get priority access when we launch.
            First-class spots are limited.
          </p>

          {/* Social proof */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="flex -space-x-2.5">
              {AVATAR_COLORS.map((color, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full border-2 border-stone-800 shadow-sm"
                  style={{ backgroundColor: color, zIndex: 5 - i }}
                />
              ))}
            </div>
            <p className="text-sm text-stone-400 font-light">
              <span className="text-white font-medium">2,847</span> travellers already waiting
            </p>
          </div>

          {status === 'idle' ? (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="flex-1 px-6 py-4 rounded-full border border-stone-700 bg-stone-800/60 backdrop-blur-md text-sm text-stone-200 placeholder-stone-500 focus:outline-none focus:border-stone-500 focus:bg-stone-800 transition-all"
              />
              <button
                type="submit"
                className="btn-primary px-8 py-4 rounded-full text-sm font-medium tracking-wide whitespace-nowrap text-stone-900"
                style={{ backgroundColor: '#c49a3c' }}
              >
                Board now ↗
              </button>
            </form>
          ) : (
            <div className="px-8 py-4 rounded-full border border-stone-700 bg-stone-800/60 max-w-md mx-auto">
              <span className="text-sm text-stone-300 font-light">
                ✦ &nbsp;You&apos;re on the list — first-class boarding details incoming.
              </span>
            </div>
          )}

          <p className="mt-5 text-xs text-stone-600 font-light tracking-wide">
            No spam. Unsubscribe anytime.
          </p>

          <div className="mt-14 pt-8 border-t border-stone-800 flex items-center justify-between text-xs text-stone-600">
            <span className="tracking-widest uppercase font-light">thewanderlust.app</span>
            <span>© 2025 WanderAI</span>
          </div>
        </div>
      </section>

    </div>
  )
}
