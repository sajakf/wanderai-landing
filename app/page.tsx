'use client'

import { useState, useEffect, useRef } from 'react'
import { WA_LINK } from '@/lib/messaging'

// ─── Curated travel photos (verified Unsplash IDs) ───────────────────────────
const BASE = 'https://images.unsplash.com'
const P    = '?auto=format&fit=crop&w=1920&q=85'

const PHOTOS = [
  { url: `${BASE}/photo-1551410224-699683e15636${P}`, location: 'Isle of Skye, Scotland'      },
  { url: `${BASE}/photo-1520769945061-0a448c463865${P}`, location: 'Lofoten Islands, Norway'  },
  { url: `${BASE}/photo-1490806843957-31f4c9a91c65${P}`, location: 'Mount Fuji, Japan'        },
  { url: `${BASE}/photo-1533105079780-92b9be482077${P}`, location: 'Santorini, Greece'        },
  { url: `${BASE}/photo-1590523277543-a94d2e4eb00b${P}`, location: 'Maldives'                 },
  { url: `${BASE}/photo-1561718541-b00339c8db2a${P}`,  location: 'Provence, France'           },
  { url: `${BASE}/photo-1531366936337-7c912a4589a7${P}`, location: 'Northern Lights, Norway'  },
  { url: `${BASE}/photo-1476514525535-07fb3b4ae5f1${P}`, location: 'Amalfi Coast, Italy'      },
  { url: `${BASE}/photo-1558618666-fcd25c85cd64${P}`,  location: 'Meteora, Greece'            },
  { url: `${BASE}/photo-1543783207-ec64e4d95325${P}`,  location: 'Alhambra, Spain'            },
  { url: `${BASE}/photo-1526481280693-3bfa7568e0f3${P}`, location: 'Mount Fuji at Sunrise'    },
  { url: `${BASE}/photo-1693653631563-f2ca63a1e3b0${P}`, location: 'Puglia, Italy'            },
  { url: `${BASE}/photo-1589489873423-d1745278a8f4${P}`, location: 'Scottish Highlands'       },
  { url: `${BASE}/photo-1539037116277-4db20889f2d4${P}`, location: 'Barcelona, Spain'         },
  { url: `${BASE}/photo-1522383225653-ed111181a951${P}`, location: 'Kyoto, Japan'             },
  { url: `${BASE}/photo-1600582910964-5b7c109e6868${P}`, location: 'Caribbean'                },
  { url: `${BASE}/photo-1688949078626-a358f500e063${P}`, location: 'Maldives Overwater Villas'},
  { url: `${BASE}/photo-1663428520845-056989f8a664${P}`, location: 'Norwegian Fjords'         },
]

const INTERVAL_MS   = 6000
const TRANSITION_MS = 1400

const AVATAR_COLORS = [
  'hsl(35,55%,72%)', 'hsl(200,45%,68%)', 'hsl(15,50%,70%)',
  'hsl(150,35%,65%)', 'hsl(270,30%,72%)',
]

// ─── Mock WhatsApp conversation ───────────────────────────────────────────────
const CHAT = [
  { from: 'user', text: "Hey! I want a sunny 7-day trip, budget ~€1,500 🌞", time: '10:02' },
  { from: 'bot',  text: "Hi! I'm WanderAI 🌍 Love that energy — let me find you something perfect.", time: '10:02' },
  { from: 'bot',  text: "Top picks for your budget & dates:\n\n🇬🇷 *Santorini* — iconic sunsets & white villages\n🇲🇦 *Marrakech* — vibrant souks & desert adventures\n🇵🇹 *Algarve* — dramatic cliffs & golden beaches\n\nWhich speaks to you?", time: '10:03' },
  { from: 'user', text: "Santorini sounds amazing! Plan the whole trip?", time: '10:04' },
  { from: 'bot',  text: "Done! Your 7-day Santorini plan ✈️\n\n*Day 1–2:* Fira arrival, Oia sunset, local tavernas\n*Day 3:* Volcano hike + hot springs cruise\n*Day 4:* Wine tasting, Akrotiri ruins\n*Day 5–6:* Perissa beach, private sailing tour\n*Day 7:* Morning market, fly home\n\n💰 Est. total: *€1,380* incl. flights & hotels\n\nShall I book anything?", time: '10:05' },
  { from: 'user', text: "This is perfect. Book the flights please! 🙌", time: '10:06' },
]

// ─── Feature cards ────────────────────────────────────────────────────────────
const FEATURES = [
  {
    emoji: '💬',
    gradient: 'from-green-50 to-emerald-50',
    accent: '#25D366',
    title: 'No app needed',
    desc: 'Chat on WhatsApp — the app you already use every day.',
  },
  {
    emoji: '✨',
    gradient: 'from-amber-50 to-yellow-50',
    accent: '#9a6f1e',
    title: 'AI trip planning',
    desc: 'Full personalised itinerary in under 3 minutes.',
  },
  {
    emoji: '🌙',
    gradient: 'from-indigo-50 to-blue-50',
    accent: '#4f46e5',
    title: '24 / 7 available',
    desc: 'Ask at midnight, change plans mid-flight. Always on.',
  },
  {
    emoji: '💰',
    gradient: 'from-rose-50 to-orange-50',
    accent: '#e05a2b',
    title: 'Budget-smart',
    desc: 'Set your budget once — we stay within it, always.',
  },
]

const STEPS = [
  { n: '01', title: 'Send a message', desc: 'Tell us your destination, dates, and budget on WhatsApp. No forms, no sign-up.' },
  { n: '02', title: 'Get recommendations', desc: 'WanderAI replies with curated options tailored to you — not generic lists.' },
  { n: '03', title: 'Receive your plan', desc: 'A full day-by-day itinerary with costs, right in your chat. Share with friends in one tap.' },
]

// ─── Hooks ────────────────────────────────────────────────────────────────────
function useReveal(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } }, { threshold })
    obs.observe(el); return () => obs.disconnect()
  }, [threshold])
  return { ref, visible }
}

// ─── Photo cycler — two-slot alternating crossfade + Ken Burns, zero glitch ───
// How it works:
//   Slot A and Slot B alternate being "active" (opacity 1) and "standby" (opacity 0).
//   When it's time to advance, we first update the STANDBY slot's image (invisible → no flash),
//   wait one rAF for React to commit the new src, then flip which slot is active.
//   Both slots always have a CSS opacity transition, so the crossfade is butter-smooth.
//   Each image gets a random Ken Burns animation restarted via React key.
const KB_COUNT = 6

function PhotoCycler() {
  const [slotA, setSlotA] = useState({ photoIdx: 0, kbKey: 0, kbClass: 'kb-0' })
  const [slotB, setSlotB] = useState({ photoIdx: 1, kbKey: 1, kbClass: 'kb-1' })
  const [aActive, setAActive] = useState(true)   // which slot is currently visible
  const nextPhoto = useRef(2)
  const aActiveRef = useRef(true)
  const busy = useRef(false)

  // Preload all images up front so transitions never stall on a network fetch
  useEffect(() => {
    PHOTOS.forEach(p => { const img = new Image(); img.src = p.url })
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      if (busy.current) return
      busy.current = true

      const idx      = nextPhoto.current % PHOTOS.length
      const kbClass  = `kb-${Math.floor(Math.random() * KB_COUNT)}`
      nextPhoto.current++

      if (aActiveRef.current) {
        // A is showing → silently update B (it's invisible), then fade B in
        setSlotB({ photoIdx: idx, kbKey: Date.now(), kbClass })
        requestAnimationFrame(() => requestAnimationFrame(() => {
          setAActive(false)
          aActiveRef.current = false
          setTimeout(() => { busy.current = false }, TRANSITION_MS + 100)
        }))
      } else {
        // B is showing → silently update A (it's invisible), then fade A in
        setSlotA({ photoIdx: idx, kbKey: Date.now(), kbClass })
        requestAnimationFrame(() => requestAnimationFrame(() => {
          setAActive(true)
          aActiveRef.current = true
          setTimeout(() => { busy.current = false }, TRANSITION_MS + 100)
        }))
      }
    }, INTERVAL_MS)

    return () => clearInterval(timer)
  }, [])

  const FADE = `opacity ${TRANSITION_MS}ms cubic-bezier(0.4,0,0.2,1)`
  const activeLocation = aActive ? PHOTOS[slotA.photoIdx].location : PHOTOS[slotB.photoIdx].location

  return (
    <>
      {/* Slot A */}
      <div className="absolute inset-0 overflow-hidden"
        style={{ zIndex: aActive ? 2 : 1, opacity: aActive ? 1 : 0, transition: FADE }}>
        <img
          key={slotA.kbKey}
          src={PHOTOS[slotA.photoIdx].url}
          alt={PHOTOS[slotA.photoIdx].location}
          className={`absolute inset-0 w-full h-full object-cover will-change-transform ${slotA.kbClass}`}
        />
      </div>

      {/* Slot B */}
      <div className="absolute inset-0 overflow-hidden"
        style={{ zIndex: aActive ? 1 : 2, opacity: aActive ? 0 : 1, transition: FADE }}>
        <img
          key={slotB.kbKey}
          src={PHOTOS[slotB.photoIdx].url}
          alt={PHOTOS[slotB.photoIdx].location}
          className={`absolute inset-0 w-full h-full object-cover will-change-transform ${slotB.kbClass}`}
        />
      </div>

      {/* Location badge */}
      <div className="absolute bottom-5 left-5 z-10 flex items-center gap-1.5"
        style={{ background: 'rgba(0,0,0,0.32)', backdropFilter: 'blur(10px)', borderRadius: 999, padding: '5px 14px', border: '1px solid rgba(255,255,255,0.15)' }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3 text-amber-300">
          <path d="M12 21c-4.418-4.418-7-8.582-7-11a7 7 0 1114 0c0 2.418-2.582 6.582-7 11z"/>
          <circle cx="12" cy="10" r="2"/>
        </svg>
        <span className="text-[10px] text-white/80 font-medium tracking-wide">{activeLocation}</span>
      </div>
    </>
  )
}

// ─── WhatsApp icon ────────────────────────────────────────────────────────────
function WaIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  )
}

// ─── WhatsApp CTA button ──────────────────────────────────────────────────────
function WaButton({ size = 'md', label = 'Chat on WhatsApp', hideIcon = false }: { size?: 'sm' | 'md' | 'lg'; label?: string; hideIcon?: boolean }) {
  const sizes = {
    sm: 'px-4 py-2.5 text-xs gap-2',
    md: 'px-6 py-3.5 text-sm gap-2.5',
    lg: 'px-8 py-4 text-base gap-3',
  }
  return (
    <a
      href={WA_LINK}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center font-semibold rounded-full transition-all duration-200 hover:scale-[1.03] hover:shadow-lg active:scale-[0.97] ${sizes[size]}`}
      style={{ backgroundColor: '#25D366', color: '#fff', boxShadow: '0 4px 20px rgba(37,211,102,0.35)' }}
    >
      {!hideIcon && <WaIcon className={size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5'} />}
      {label}
    </a>
  )
}

// ─── Chat bubble ──────────────────────────────────────────────────────────────
function Bubble({ msg, idx }: { msg: typeof CHAT[0]; idx: number }) {
  const { ref, visible } = useReveal()
  const isUser = msg.from === 'user'
  const html = msg.text.replace(/\*([^*]+)\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>')
  return (
    <div ref={ref} className={`flex ${isUser ? 'justify-end' : 'justify-start'} transition-all duration-500`}
      style={{ opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(12px)', transitionDelay: `${idx * 100}ms` }}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-[#25D366] flex items-center justify-center mr-2 flex-shrink-0 self-end mb-1">
          <WaIcon className="w-3.5 h-3.5 text-white" />
        </div>
      )}
      <div className="max-w-[80%]">
        <div className={`px-3 py-2 rounded-2xl text-xs leading-relaxed ${isUser ? 'bg-[#dcf8c6] text-stone-800 rounded-tr-sm' : 'bg-white text-stone-800 rounded-tl-sm shadow-sm'}`}
          dangerouslySetInnerHTML={{ __html: html }} />
        <p className={`text-[9px] text-stone-400 mt-0.5 ${isUser ? 'text-right' : ''}`}>
          {msg.time}{isUser && <span className="text-blue-400 ml-0.5"> ✓✓</span>}
        </p>
      </div>
    </div>
  )
}

// ─── Step item (own component — keeps hooks at top level) ─────────────────────
function StepItem({ step, idx }: { step: typeof STEPS[0]; idx: number }) {
  const { ref, visible } = useReveal()
  return (
    <div ref={ref} className="flex gap-4 transition-all duration-500"
      style={{ opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateX(20px)', transitionDelay: `${idx * 120}ms` }}>
      <div className="flex-shrink-0 w-9 h-9 rounded-full border border-stone-200 bg-white flex items-center justify-center">
        <span className="text-[10px] font-mono text-stone-400">{step.n}</span>
      </div>
      <div>
        <h3 className="font-serif font-semibold text-stone-800 text-base mb-1">{step.title}</h3>
        <p className="text-stone-500 text-sm font-light leading-relaxed">{step.desc}</p>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Home() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const featuresReveal = useReveal()
  const demoReveal = useReveal()
  const ctaReveal = useReveal()

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (email.trim()) setSent(true) }

  return (
    <div className="bg-stone-50">

      {/* ══════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════ */}
      <section className="relative h-screen flex flex-col overflow-hidden">
        <PhotoCycler />
        <div className="video-overlay absolute inset-0" />
        <div className="grain absolute inset-0 opacity-[0.09] pointer-events-none" />
        <div className="orb orb-gold" />
        <div className="orb orb-rose" />

        {/* Nav */}
        <nav className="relative z-10 flex items-center justify-between px-5 sm:px-10 pt-6 fade-up delay-1">
          <div className="flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 22 22" fill="none" className="text-stone-700">
              <circle cx="11" cy="11" r="10" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M1 11h20M11 1c-3 3-4.5 6-4.5 10s1.5 7 4.5 10M11 1c3 3 4.5 6 4.5 10s-1.5 7-4.5 10" stroke="currentColor" strokeWidth="1.4"/>
            </svg>
            <span className="text-xs tracking-[0.2em] uppercase text-stone-700 font-semibold">WanderAI</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] tracking-widest text-stone-500 uppercase font-light hidden sm:block">Coming soon</span>
          </div>
        </nav>

        {/* Hero body */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-5 text-center">
          <div className="fade-up delay-2 flex items-center gap-2.5 mb-7">
            <div className="w-8 h-px bg-stone-400/50" />
            <span className="text-[10px] tracking-[0.35em] uppercase text-stone-500 font-light">AI travel agent · WhatsApp</span>
            <div className="w-8 h-px bg-stone-400/50" />
          </div>

          <h1 className="hero-text font-serif text-stone-900 mb-5 fade-up delay-3">
            <span className="block font-light text-stone-800">Pack light.</span>
            <span className="block font-black italic" style={{ color: '#9a6f1e' }}>Dream heavy.</span>
          </h1>

          <p className="fade-up delay-4 text-sm sm:text-base font-medium max-w-sm mb-8 leading-relaxed"
            style={{ color: '#fff', textShadow: '0 1px 8px rgba(0,0,0,0.55)' }}>
            Your personal AI travel agent lives on WhatsApp.
            No app to download, no account to create.
          </p>

          {/* Primary CTA — WhatsApp */}
          <div className="fade-up delay-5 flex flex-col sm:flex-row items-center gap-4 mb-8">
            <WaButton size="lg" label="Start planning on WhatsApp" hideIcon />
            <a href="#how"
              className="text-sm font-medium transition-colors"
              style={{ color: 'rgba(255,255,255,0.9)', textShadow: '0 1px 6px rgba(0,0,0,0.5)', textDecoration: 'underline', textUnderlineOffset: '4px' }}>
              See how it works ↓
            </a>
          </div>

          {/* Social proof — Instagram style */}
          <div className="fade-up delay-6 flex items-center gap-3">
            <div className="flex -space-x-2">
              {AVATAR_COLORS.map((c, i) => (
                <div key={i} className="w-7 h-7 rounded-full border-2 border-white/80 shadow-sm" style={{ backgroundColor: c, zIndex: 5 - i }} />
              ))}
            </div>
            <div className="flex items-center gap-1.5">
              <a
                href="https://www.instagram.com/wanderai.travels"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
              >
                <svg viewBox="0 0 24 24" fill="white" className="w-3.5 h-3.5" style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.4))' }}>
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
                </svg>
                <span className="text-xs font-semibold" style={{ color: '#fff', textShadow: '0 1px 6px rgba(0,0,0,0.5)' }}>
                  @wanderai.travels
                </span>
              </a>
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.75)', textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>· 2,847 followers</span>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="relative z-10 flex justify-between items-center px-5 sm:px-10 pb-5 fade-up delay-6">
          <span className="text-[10px] text-stone-400 tracking-widest uppercase">thewanderlust.app</span>
          <span className="text-[10px] text-stone-400">© 2025 WanderAI</span>
        </div>

        {/* Corner deco */}
        <div className="absolute top-0 left-0 pointer-events-none">
          <div className="absolute top-5 left-5 w-px h-6 bg-stone-300/40" />
          <div className="absolute top-5 left-5 w-6 h-px bg-stone-300/40" />
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          FEATURES
      ══════════════════════════════════════════════ */}
      <section className="py-16 px-5 bg-white">
        <div
          ref={featuresReveal.ref}
          className="max-w-4xl mx-auto transition-all duration-700"
          style={{ opacity: featuresReveal.visible ? 1 : 0, transform: featuresReveal.visible ? 'none' : 'translateY(28px)' }}
        >
          <div className="text-center mb-10">
            <p className="text-[10px] tracking-[0.35em] uppercase text-stone-400 mb-3">Why WanderAI</p>
            <h2 className="font-serif text-2xl sm:text-3xl font-light text-stone-800">
              Travel planning,{' '}
              <span className="italic font-semibold" style={{ color: '#9a6f1e' }}>reinvented</span>
            </h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map((f, i) => (
              <div key={i}
                className={`bg-gradient-to-br ${f.gradient} rounded-2xl p-6 border border-white hover:shadow-md transition-all duration-300 group cursor-default`}
                style={{ opacity: featuresReveal.visible ? 1 : 0, transform: featuresReveal.visible ? 'none' : 'translateY(20px)', transition: `opacity .5s ease ${i * 80 + 150}ms, transform .5s ease ${i * 80 + 150}ms, box-shadow .3s` }}>
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300 inline-block">
                  {f.emoji}
                </div>
                <h3 className="font-serif font-semibold text-stone-800 text-sm mb-1.5">{f.title}</h3>
                <p className="text-stone-500 text-xs font-light leading-relaxed">{f.desc}</p>
                <div className="mt-4 h-0.5 w-8 rounded-full transition-all duration-300 group-hover:w-16" style={{ backgroundColor: f.accent }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          WHATSAPP DEMO
      ══════════════════════════════════════════════ */}
      <section id="how" className="py-16 px-5 bg-stone-50">
        <div
          ref={demoReveal.ref}
          className="max-w-4xl mx-auto transition-all duration-700"
          style={{ opacity: demoReveal.visible ? 1 : 0, transform: demoReveal.visible ? 'none' : 'translateY(28px)' }}
        >
          <div className="text-center mb-10">
            <p className="text-[10px] tracking-[0.35em] uppercase text-stone-400 mb-3">See it in action</p>
            <h2 className="font-serif text-2xl sm:text-3xl font-light text-stone-800">
              Just send a{' '}
              <span className="italic font-semibold" style={{ color: '#9a6f1e' }}>message</span>
            </h2>
            <p className="text-stone-500 text-sm mt-2 font-light max-w-xs mx-auto">
              Tell us where you want to go — get a complete trip plan in minutes.
            </p>
          </div>

          <div className="flex flex-col lg:flex-row items-start gap-8 lg:gap-12">

            {/* Phone mockup — hidden on small mobile, shown md+ */}
            <div className="hidden sm:flex flex-shrink-0 justify-center w-full lg:w-auto">
              <div className="relative w-[270px]">
                <div className="bg-stone-900 rounded-[36px] p-2.5 shadow-2xl">
                  <div className="bg-[#ece5dd] rounded-[27px] overflow-hidden">

                    {/* WA header */}
                    <div className="bg-[#075e54] px-3.5 pt-8 pb-2.5 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#25D366] flex items-center justify-center flex-shrink-0">
                        <WaIcon className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-white text-xs font-semibold">WanderAI</p>
                        <p className="text-emerald-300 text-[9px]">online · AI travel agent</p>
                      </div>
                    </div>

                    {/* Messages */}
                    <div className="px-2.5 py-3 space-y-2.5 min-h-[360px] max-h-[360px] overflow-y-auto">
                      {CHAT.map((msg, i) => <Bubble key={i} msg={msg} idx={i} />)}
                    </div>

                    {/* Input */}
                    <div className="bg-[#f0f0f0] px-2.5 py-2 flex items-center gap-2">
                      <div className="flex-1 bg-white rounded-full px-3 py-1.5 text-[10px] text-stone-400">Type a message</div>
                      <div className="w-7 h-7 rounded-full bg-[#25D366] flex items-center justify-center flex-shrink-0">
                        <svg viewBox="0 0 24 24" fill="white" className="w-3.5 h-3.5"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating badges */}
                <div className="absolute -right-3 top-14 bg-white rounded-xl shadow-md px-3 py-2 border border-stone-100">
                  <p className="text-[9px] text-stone-400 mb-0.5">Trip total</p>
                  <p className="text-sm font-serif font-semibold text-stone-800">€1,380</p>
                  <p className="text-[9px] text-emerald-600 font-medium">Within budget ✓</p>
                </div>
                <div className="absolute -left-4 bottom-20 bg-white rounded-xl shadow-md px-3 py-2 border border-stone-100">
                  <p className="text-[9px] text-stone-400 mb-0.5">Planned in</p>
                  <p className="text-sm font-serif font-semibold text-stone-800">3 min</p>
                  <div className="flex gap-0.5 mt-0.5">{[...Array(5)].map((_,i)=><span key={i} className="text-amber-400 text-[9px]">★</span>)}</div>
                </div>
              </div>
            </div>

            {/* Steps + mobile chat preview */}
            <div className="flex-1 w-full space-y-6">
              {/* Mobile-only: simplified chat (no phone frame) */}
              <div className="sm:hidden bg-white rounded-2xl border border-stone-100 overflow-hidden">
                <div className="bg-[#075e54] px-4 py-3 flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-[#25D366] flex items-center justify-center">
                    <WaIcon className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div>
                    <p className="text-white text-xs font-semibold">WanderAI</p>
                    <p className="text-emerald-300 text-[9px]">online · AI travel agent</p>
                  </div>
                </div>
                <div className="bg-[#ece5dd] px-3 py-3 space-y-2.5 max-h-56 overflow-y-auto">
                  {CHAT.map((msg, i) => <Bubble key={i} msg={msg} idx={i} />)}
                </div>
              </div>

              {/* Steps */}
              <div className="space-y-5">
                {STEPS.map((s, i) => <StepItem key={i} step={s} idx={i} />)}
              </div>

              {/* CTA inside demo section */}
              <div className="pt-2">
                <WaButton size="md" label="Try it now on WhatsApp" />
                <p className="text-[10px] text-stone-400 mt-2 font-light">Free to use · No download · No account</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          EMAIL WAITLIST CTA
      ══════════════════════════════════════════════ */}
      <section className="py-16 px-5 bg-stone-900 relative overflow-hidden">
        <div className="orb-dark orb-dark-gold pointer-events-none" />
        <div
          ref={ctaReveal.ref}
          className="relative max-w-lg mx-auto text-center transition-all duration-700"
          style={{ opacity: ctaReveal.visible ? 1 : 0, transform: ctaReveal.visible ? 'none' : 'translateY(28px)' }}
        >
          <p className="text-[10px] tracking-[0.35em] uppercase text-stone-500 mb-3">Early access</p>
          <h2 className="font-serif text-2xl sm:text-3xl font-light text-white mb-2">
            Be first to{' '}
            <span className="italic font-semibold" style={{ color: '#c49a3c' }}>board</span>
          </h2>
          <p className="text-stone-400 text-sm font-light mb-7 max-w-xs mx-auto">
            Join the waitlist for priority access when we launch.
          </p>

          <div className="flex items-center justify-center gap-2.5 mb-6">
            <div className="flex -space-x-2">
              {AVATAR_COLORS.map((c, i) => (
                <div key={i} className="w-7 h-7 rounded-full border-2 border-stone-800" style={{ backgroundColor: c, zIndex: 5 - i }} />
              ))}
            </div>
            <p className="text-xs text-stone-400"><span className="text-white font-medium">2,847</span> waiting</p>
          </div>

          {/* Email form */}
          {!sent ? (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2.5 mb-4">
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com" required
                className="flex-1 px-5 py-3.5 rounded-full border border-stone-700 bg-stone-800 text-sm text-stone-200 placeholder-stone-500 focus:outline-none focus:border-stone-500 transition-colors" />
              <button type="submit" className="btn-primary px-6 py-3.5 rounded-full text-sm font-semibold whitespace-nowrap text-stone-900"
                style={{ backgroundColor: '#c49a3c' }}>
                Join waitlist ↗
              </button>
            </form>
          ) : (
            <div className="px-6 py-3.5 rounded-full border border-stone-700 bg-stone-800/60 mb-4">
              <span className="text-sm text-stone-300 font-light">✦ You&apos;re on the list — first-class details incoming.</span>
            </div>
          )}

          {/* Or just WA */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-stone-800" />
            <span className="text-[10px] text-stone-600 uppercase tracking-widest">or</span>
            <div className="flex-1 h-px bg-stone-800" />
          </div>
          <WaButton size="md" label="Chat with us on WhatsApp" />

          <p className="mt-4 text-[10px] text-stone-600 font-light">No spam. Unsubscribe anytime.</p>

          <div className="mt-10 pt-6 border-t border-stone-800 flex justify-between text-[10px] text-stone-600">
            <span className="tracking-widest uppercase">thewanderlust.app</span>
            <span>© 2025 WanderAI</span>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          FLOATING WHATSAPP BUTTON
      ══════════════════════════════════════════════ */}
      <a
        href={WA_LINK}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-transform duration-200 hover:scale-110 active:scale-95"
        style={{ backgroundColor: '#25D366', boxShadow: '0 4px 24px rgba(37,211,102,0.45)' }}
        aria-label="Chat on WhatsApp"
      >
        {/* Pulse ring */}
        <span className="absolute inset-0 rounded-full animate-ping-slow opacity-30" style={{ backgroundColor: '#25D366' }} />
        <WaIcon className="w-7 h-7 text-white relative z-10" />
      </a>

    </div>
  )
}
