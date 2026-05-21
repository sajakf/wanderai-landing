'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { WA_LINK } from '@/lib/messaging'

// ─── Brand colours ────────────────────────────────────────────────────────────
const BRAND = {
  gold:       '#C8A36B',
  sand:       '#EBDFD1',
  ivory:      '#F7F4EF',
  terracotta: '#C56A4E',
  teal:       '#517D86',
  slate:      '#2E3538',
}

// ─── Modal content data ───────────────────────────────────────────────────────
type ModalData = { category: string; accent: string; title: string; body: string }
const MODALS: Record<string, ModalData> = {
  // Product
  features: {
    category: 'Product',
    accent: BRAND.teal,
    title: 'Everything you need, nothing you don\'t.',
    body: 'WanderAi searches flights, hotels and experiences in seconds. Fast responses, 24/7 availability, and smart personalised recommendations — all delivered as a clean, readable summary directly in WhatsApp.',
  },
  howItWorks: {
    category: 'Product',
    accent: BRAND.teal,
    title: 'Three messages to your perfect trip.',
    body: 'Tell us where you want to go, your dates and your budget. WanderAi listens, understands and builds a full day-by-day itinerary in under three minutes — no forms, no apps, no waiting.',
  },
  aiTrip: {
    category: 'Product',
    accent: BRAND.gold,
    title: 'Your personal AI travel curator.',
    body: 'From a single message, WanderAi crafts a complete, personalised travel plan. Every recommendation is tailored to your style, budget and dreams — not a generic list.',
  },
  hotelSearch: {
    category: 'Product',
    accent: BRAND.terracotta,
    title: 'The world\'s best hotels, one message away.',
    body: 'Search thousands of properties across top destinations, filtered by your budget, dates and preferences — without ever leaving your WhatsApp conversation.',
  },
  flightSearch: {
    category: 'Product',
    accent: BRAND.teal,
    title: 'Best flights found, instantly.',
    body: 'WanderAi scans live availability for your route and dates, then presents the top options in a clear, readable format. No browser tabs. No comparison sites.',
  },
  // Company
  about: {
    category: 'Company',
    accent: BRAND.gold,
    title: 'Intelligent travel, delivered through a message.',
    body: 'WanderAi is a luxury AI travel agent that blends human taste with artificial intelligence. We design personalised journeys with precision, insight and soul — seamlessly through WhatsApp.',
  },
  blog: {
    category: 'Company',
    accent: BRAND.teal,
    title: 'Stories, guides & travel inspiration.',
    body: 'Destination deep-dives, insider tips from the WanderAi team, and real stories from travellers who let AI plan their adventures. Follow along for your next big idea.',
  },
  careers: {
    category: 'Company',
    accent: BRAND.terracotta,
    title: 'Help us reinvent how people explore the world.',
    body: 'We\'re a small, ambitious team of designers, engineers and travel lovers. If you believe travel should be effortless, intelligent and deeply personal — we want to meet you.',
  },
  press: {
    category: 'Company',
    accent: BRAND.teal,
    title: 'Recognised for reimagining travel.',
    body: 'WanderAi has been featured for its unique approach to AI-powered travel planning. For interviews, media kits and press enquiries, get in touch with our team.',
  },
  partners: {
    category: 'Company',
    accent: BRAND.gold,
    title: 'Built on the world\'s best travel infrastructure.',
    body: 'We work with leading hotels, airlines and experience providers to bring you exceptional options at every price point. Interested in partnering with WanderAi? Let\'s talk.',
  },
}

// ─── Curated travel photos (verified Unsplash IDs) ───────────────────────────
const BASE = 'https://images.unsplash.com'
const P    = '?auto=format&fit=crop&w=1920&q=85'

const PHOTOS = [
  { url: `${BASE}/photo-1499856871958-5b9627545d1a${P}`, location: 'Isle of Skye, Scotland'     },
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

// ─── Mock WhatsApp conversation ───────────────────────────────────────────────
const CHAT = [
  { from: 'user', text: "Hey! I want a sunny 7-day trip, budget ~€1,500 🌞", time: '10:02' },
  { from: 'bot',  text: "Hi! I'm WanderAI 🌍 Love that energy — let me find you something perfect.", time: '10:02' },
  { from: 'bot',  text: "Top picks for your budget & dates:\n\n🇬🇷 *Santorini* — iconic sunsets & white villages\n🇲🇦 *Marrakech* — vibrant souks & desert adventures\n🇵🇹 *Algarve* — dramatic cliffs & golden beaches\n\nWhich speaks to you?", time: '10:03' },
  { from: 'user', text: "Santorini sounds amazing! Plan the whole trip?", time: '10:04' },
  { from: 'bot',  text: "Done! Your 7-day Santorini plan ✈️\n\n*Day 1–2:* Fira arrival, Oia sunset, local tavernas\n*Day 3:* Volcano hike + hot springs cruise\n*Day 4:* Wine tasting, Akrotiri ruins\n*Day 5–6:* Perissa beach, private sailing tour\n*Day 7:* Morning market, fly home\n\n💰 Est. total: *€1,380* incl. flights & hotels\n\nShall I book anything?", time: '10:05' },
  { from: 'user', text: "This is perfect. Book the flights please! 🙌", time: '10:06' },
]

// ─── W mark logo (calligraphic W + plane, traced from brand handoff) ─────────
function WMark({ className = 'w-8 h-6', color = 'currentColor' }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 260 148" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/*
        Continuous stroke — traced from the brand logo PNG:
        1. Tail: starts bottom-left, hooks down then sweeps up-left
        2. Left curl: large arc swinging left then back right
        3. Left arm: curves down to left valley
        4. Center rise to teardrop loop (knot at W midpoint)
        5. Down to right valley
        6. Long dramatic arc up-right to plane
      */}
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
      {/* Plane — body + wings facing upper-right at ~42° */}
      <g transform="translate(239,25) rotate(-42)">
        <path d="M0 0 L-12 -4 L-8.5 0 L-12 4 Z" fill={color}/>
        <path d="M-8.5 -1 L-16 -7.5 L-14.5 -1 L-16 1 L-14.5 1 L-16 7.5 L-8.5 1 Z" fill={color} opacity="0.85"/>
      </g>
    </svg>
  )
}

// ─── Modal icon (per modal key) ───────────────────────────────────────────────
function ModalIcon({ name, color }: { name: string; color: string }) {
  const s = { fill: 'none', stroke: color, strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, className: 'w-10 h-10' }
  const icons: Record<string, React.ReactNode> = {
    features:    <svg viewBox="0 0 40 40" {...s}><path d="M20 6l2.5 8H30l-6.5 4.5 2.5 8L20 22l-6 4.5 2.5-8L10 14h7.5z"/></svg>,
    howItWorks:  <svg viewBox="0 0 40 40" {...s}><circle cx="10" cy="20" r="4"/><circle cx="20" cy="12" r="4"/><circle cx="30" cy="20" r="4"/><path d="M14 20h2M24 20h2"/></svg>,
    aiTrip:      <svg viewBox="0 0 40 40" {...s}><circle cx="20" cy="20" r="14"/><path d="M26 14l-3.5 8-8 3.5 3.5-8 8-3.5z"/></svg>,
    hotelSearch: <svg viewBox="0 0 40 40" {...s}><rect x="8" y="14" width="24" height="20" rx="2"/><path d="M15 34V26h10v8M2 34h36M13 14V8h14v6"/><rect x="17" y="18" width="6" height="5" rx="1"/></svg>,
    flightSearch:<svg viewBox="0 0 40 40" {...s}><path d="M6 28l6-2 16-16 4 4-16 16-2 6zM22 12l6 6"/><path d="M8 32l4-1 1-4"/></svg>,
    about:       <svg viewBox="0 0 40 40" {...s}><circle cx="20" cy="20" r="14"/><path d="M6 20h28M20 6c-4 4-6 8-6 14s2 10 6 14M20 6c4 4 6 8 6 14s-2 10-6 14"/></svg>,
    blog:        <svg viewBox="0 0 40 40" {...s}><path d="M10 8h20a2 2 0 012 2v22a2 2 0 01-2 2H10a2 2 0 01-2-2V10a2 2 0 012-2z"/><path d="M14 16h12M14 21h12M14 26h8"/></svg>,
    careers:     <svg viewBox="0 0 40 40" {...s}><rect x="6" y="16" width="28" height="18" rx="2"/><path d="M14 16v-4a2 2 0 012-2h8a2 2 0 012 2v4M20 25v-4M18 23h4"/></svg>,
    press:       <svg viewBox="0 0 40 40" {...s}><path d="M8 10h24v24H8zM8 16h24M14 10v24M14 22h12M14 27h8"/></svg>,
    partners:    <svg viewBox="0 0 40 40" {...s}><path d="M6 22c0-2 2-4 4-4l6-6c1-1 3-1 4 0l2 2-8 8 2 2 10-10 2 2-10 10 2 2 8-8 2 2-8 8c-1 1-3 1-4 0l-8-8c-2-2-2-4-4-4"/></svg>,
  }
  return <>{icons[name] ?? null}</>
}

// ─── Modal overlay ────────────────────────────────────────────────────────────
function Modal({ modalKey, visible, onClose }: { modalKey: string | null; visible: boolean; onClose: () => void }) {
  // Keep last data during fade-out so content doesn't snap away
  const [cachedData, setCachedData] = useState<ModalData | null>(null)
  const cachedKey = useRef<string | null>(null)

  useEffect(() => {
    if (modalKey) { setCachedData(MODALS[modalKey]); cachedKey.current = modalKey }
  }, [modalKey])

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = visible ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [visible])

  // Escape key
  useEffect(() => {
    if (!visible) return
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [visible, onClose])

  if (!cachedData && !visible) return null
  const data = cachedData

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
        backgroundColor: visible ? 'rgba(0,0,0,0.65)' : 'rgba(0,0,0,0)',
        backdropFilter: visible ? 'blur(14px)' : 'blur(0px)',
        WebkitBackdropFilter: visible ? 'blur(14px)' : 'blur(0px)',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.3s ease, background-color 0.3s ease',
        pointerEvents: visible ? 'auto' : 'none',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: BRAND.slate,
          border: `1px solid rgba(200,163,107,0.2)`,
          borderRadius: '20px',
          padding: '36px 32px 32px',
          maxWidth: '400px',
          width: '100%',
          position: 'relative',
          transform: visible ? 'translateY(0)' : 'translateY(24px)',
          transition: 'transform 0.35s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 16, right: 18,
            color: 'rgba(255,255,255,0.4)', fontSize: '1.4rem',
            lineHeight: 1, background: 'none', border: 'none', cursor: 'pointer',
            transition: 'color 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.9)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
        >×</button>

        {/* W mark + category */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <WMark className="w-8 h-6" color={BRAND.gold} />
          <span style={{ fontSize: '0.6rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: data?.accent ?? BRAND.teal, fontFamily: 'var(--font-norway)' }}>
            {data?.category}
          </span>
        </div>

        {/* Icon */}
        <div style={{ marginBottom: 16 }}>
          <ModalIcon name={cachedKey.current ?? ''} color={data?.accent ?? BRAND.gold} />
        </div>

        {/* Title */}
        <h3 style={{
          fontFamily: 'var(--font-playfair)', fontWeight: 400, fontStyle: 'normal',
          fontSize: '1.3rem', lineHeight: 1.25, color: '#fff', marginBottom: 12,
        }}>
          {data?.title}
        </h3>

        {/* Body */}
        <p style={{
          fontFamily: 'var(--font-norway)', fontWeight: 300, fontSize: '0.82rem',
          lineHeight: 1.65, color: 'rgba(247,244,239,0.62)', marginBottom: 28,
        }}>
          {data?.body}
        </p>

        {/* Gold rule */}
        <div style={{ height: 1, background: `linear-gradient(to right, ${data?.accent ?? BRAND.gold}44, transparent)`, marginBottom: 24 }} />

        {/* CTA */}
        <a href={WA_LINK} target="_blank" rel="noopener noreferrer"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            fontSize: '0.75rem', fontFamily: 'var(--font-norway)',
            letterSpacing: '0.12em', textTransform: 'uppercase',
            color: BRAND.gold, textDecoration: 'none',
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.7')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          Start planning
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{ width: 14, height: 14 }}>
            <path d="M3 8h10M9 4l4 4-4 4"/>
          </svg>
        </a>
      </div>
    </div>
  )
}

// ─── Feature icon components (from brand handoff) ─────────────────────────────
function IconChat() {
  // Speech bubble with three dots
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10">
      <path d="M8 10C8 7.8 9.8 6 12 6H36C38.2 6 40 7.8 40 10V28C40 30.2 38.2 32 36 32H27L22 38L17 32H12C9.8 32 8 30.2 8 28V10Z"/>
      <circle cx="17" cy="21" r="1.8" fill="currentColor" stroke="none"/>
      <circle cx="24" cy="21" r="1.8" fill="currentColor" stroke="none"/>
      <circle cx="31" cy="21" r="1.8" fill="currentColor" stroke="none"/>
    </svg>
  )
}
function IconRoute() {
  // Winding road with sparkle stars
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10">
      <path d="M8 42C14 38 14 30 22 26C30 22 32 14 40 8" strokeWidth="2.2"/>
      <path d="M17 17L18.5 13L20 17L24 18.5L20 20L18.5 24L17 20L13 18.5Z" strokeWidth="1.4"/>
      <path d="M34 36L34.8 34L35.6 36L37.6 36.8L35.6 37.5L34.8 39.5L34 37.5L32 36.8Z" strokeWidth="1.2"/>
    </svg>
  )
}
function IconClockPlane() {
  // Clock face + small airplane at edge
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10">
      <circle cx="22" cy="26" r="16"/>
      <polyline points="22,16 22,26 29,30"/>
      {/* Small plane upper-right */}
      <g transform="translate(34,11) rotate(-45)">
        <path d="M0 0L-5 -1.8L-3.5 0L-5 1.8Z" fill="currentColor" stroke="none"/>
        <path d="M-3.5 -0.5L-7.5 -3.5L-7 -0.5L-7.5 0.5L-7 0.5L-7.5 3.5L-3.5 0.5Z" fill="currentColor" stroke="none" opacity="0.8"/>
      </g>
    </svg>
  )
}
function IconWallet() {
  // Open wallet with coin
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10">
      <rect x="6" y="14" width="36" height="26" rx="3"/>
      <path d="M6 22H42"/>
      <rect x="28" y="27" width="13" height="9" rx="2.5"/>
      <circle cx="34.5" cy="31.5" r="2.5" fill="currentColor" stroke="none" opacity="0.7"/>
    </svg>
  )
}

// ─── Feature cards ────────────────────────────────────────────────────────────
const FEATURES = [
  { Icon: IconChat,       accent: BRAND.teal,       title: 'No app needed',    desc: 'Chat on WhatsApp — the app you already use every day.' },
  { Icon: IconRoute,      accent: BRAND.gold,       title: 'AI trip planning', desc: 'Full personalised itinerary in under 3 minutes.' },
  { Icon: IconClockPlane, accent: BRAND.terracotta, title: '24 / 7 available', desc: 'Ask at midnight, change plans mid-flight. Always on.' },
  { Icon: IconWallet,     accent: BRAND.slate,      title: 'Budget-smart',     desc: 'Set your budget once — we stay within it, always.' },
]

const STEPS = [
  { n: '01', title: 'Send a message',       desc: 'Tell us your destination, dates, and budget on WhatsApp. No forms, no sign-up.' },
  { n: '02', title: 'Get recommendations',  desc: 'WanderAI replies with curated options tailored to you — not generic lists.' },
  { n: '03', title: 'Receive your plan',    desc: 'A full day-by-day itinerary with costs, right in your chat. Share with friends in one tap.' },
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
const KB_COUNT = 6

function PhotoCycler() {
  const [slotA, setSlotA] = useState({ photoIdx: 0, kbKey: 0, kbClass: 'kb-0' })
  const [slotB, setSlotB] = useState({ photoIdx: 1, kbKey: 1, kbClass: 'kb-1' })
  const [aActive, setAActive] = useState(true)
  const nextPhoto = useRef(2)
  const aActiveRef = useRef(true)
  const busy = useRef(false)

  useEffect(() => {
    PHOTOS.forEach(p => { const img = new Image(); img.src = p.url })
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      if (busy.current) return
      busy.current = true

      const idx     = nextPhoto.current % PHOTOS.length
      const kbClass = `kb-${Math.floor(Math.random() * KB_COUNT)}`
      nextPhoto.current++

      if (aActiveRef.current) {
        setSlotB({ photoIdx: idx, kbKey: Date.now(), kbClass })
        requestAnimationFrame(() => requestAnimationFrame(() => {
          setAActive(false)
          aActiveRef.current = false
          setTimeout(() => { busy.current = false }, TRANSITION_MS + 100)
        }))
      } else {
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
        <img key={slotA.kbKey} src={PHOTOS[slotA.photoIdx].url} alt={PHOTOS[slotA.photoIdx].location}
          className={`absolute inset-0 w-full h-full object-cover will-change-transform ${slotA.kbClass}`} />
      </div>

      {/* Slot B */}
      <div className="absolute inset-0 overflow-hidden"
        style={{ zIndex: aActive ? 1 : 2, opacity: aActive ? 0 : 1, transition: FADE }}>
        <img key={slotB.kbKey} src={PHOTOS[slotB.photoIdx].url} alt={PHOTOS[slotB.photoIdx].location}
          className={`absolute inset-0 w-full h-full object-cover will-change-transform ${slotB.kbClass}`} />
      </div>

      {/* Location badge */}
      <div className="absolute bottom-5 left-5 z-10 flex items-center gap-1.5"
        style={{ background: 'rgba(0,0,0,0.32)', backdropFilter: 'blur(10px)', borderRadius: 999, padding: '5px 14px', border: '1px solid rgba(255,255,255,0.15)' }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3" style={{ color: BRAND.gold }}>
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
    <a href={WA_LINK} target="_blank" rel="noopener noreferrer"
      className={`inline-flex items-center justify-center font-semibold rounded-full transition-all duration-200 hover:scale-[1.03] hover:shadow-lg active:scale-[0.97] ${sizes[size]}`}
      style={{ backgroundColor: '#25D366', color: '#fff', boxShadow: '0 4px 20px rgba(37,211,102,0.35)' }}>
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

// ─── Step item ────────────────────────────────────────────────────────────────
function StepItem({ step, idx }: { step: typeof STEPS[0]; idx: number }) {
  const { ref, visible } = useReveal()
  return (
    <div ref={ref} className="flex gap-4 transition-all duration-500"
      style={{ opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateX(20px)', transitionDelay: `${idx * 120}ms` }}>
      <div className="flex-shrink-0 w-9 h-9 rounded-full border flex items-center justify-center"
        style={{ borderColor: BRAND.sand, backgroundColor: 'white' }}>
        <span className="text-[10px] font-mono" style={{ color: BRAND.teal }}>{step.n}</span>
      </div>
      <div>
        <h3 className="font-serif font-semibold text-base mb-1" style={{ color: BRAND.slate }}>{step.title}</h3>
        <p className="text-sm font-light leading-relaxed text-stone-500">{step.desc}</p>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Home() {
  const [activeModal, setActiveModal] = useState<string | null>(null)
  const [modalVisible, setModalVisible] = useState(false)

  const openModal = useCallback((key: string) => {
    setActiveModal(key)
    requestAnimationFrame(() => setModalVisible(true))
  }, [])

  const closeModal = useCallback(() => {
    setModalVisible(false)
    setTimeout(() => setActiveModal(null), 320)
  }, [])

  const featuresReveal = useReveal()
  const demoReveal = useReveal()
  const ctaReveal = useReveal()

  return (
    <div style={{ backgroundColor: BRAND.ivory }}>

      {/* ══════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════ */}
      <section className="relative h-screen flex flex-col overflow-hidden">
        <PhotoCycler />
        <div className="video-overlay absolute inset-0" />
        <div className="grain absolute inset-0 opacity-[0.07] pointer-events-none" />
        <div className="orb orb-gold" />
        <div className="orb orb-rose" />

        {/* ── Centered nav: links · logo · links ── */}
        <nav className="relative z-10 fade-up delay-1 px-6 sm:px-12 pt-7">
          <div className="flex items-center justify-between">

            {/* Left nav links */}
            <div className="hidden sm:flex items-center gap-7">
              <a href="#features" className="nav-link">Features</a>
              <a href="#how" className="nav-link">How it works</a>
            </div>

            {/* Center — W mark + wordmark stacked */}
            <div className="flex flex-col items-center gap-1.5 mx-auto sm:mx-0">
              <WMark className="w-20 h-14" color="rgba(200,163,107,0.96)" />
              <span className="font-serif font-light uppercase text-[13px]"
                style={{ color: 'rgba(255,255,255,0.92)', textShadow: '0 1px 8px rgba(0,0,0,0.5)', letterSpacing: '0.26em' }}>
                WanderAi
              </span>
            </div>

            {/* Right — empty spacer to keep logo centered */}
            <div className="hidden sm:block" style={{ width: '160px' }} />
          </div>

          {/* Thin gold rule under nav */}
          <div className="mt-5 h-px mx-auto w-full max-w-5xl" style={{ background: 'linear-gradient(to right, transparent, rgba(200,163,107,0.25), transparent)' }} />
        </nav>

        {/* ── Hero body ── */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-5 text-center">

          {/* Eyebrow label */}
          <div className="fade-up delay-2 flex items-center gap-3 mb-8">
            <div className="w-10 h-px" style={{ background: 'rgba(200,163,107,0.55)' }} />
            <span className="text-[9px] tracking-[0.45em] uppercase font-light"
              style={{ color: 'rgba(255,255,255,0.78)', textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
              AI travel agent &nbsp;·&nbsp; WhatsApp
            </span>
            <div className="w-10 h-px" style={{ background: 'rgba(200,163,107,0.55)' }} />
          </div>

          {/* Oversized headline with corner brackets */}
          <div className="relative fade-up delay-3 px-8 sm:px-12">
            {/* Top-left bracket */}
            <span className="absolute -top-4 -left-1 sm:left-2 w-5 h-5 border-t border-l pointer-events-none"
              style={{ borderColor: 'rgba(200,163,107,0.45)' }} />
            {/* Top-right bracket */}
            <span className="absolute -top-4 -right-1 sm:right-2 w-5 h-5 border-t border-r pointer-events-none"
              style={{ borderColor: 'rgba(200,163,107,0.45)' }} />

            <h1 className="hero-xl font-serif">
              <span className="block font-light" style={{ color: '#fff', textShadow: '0 4px 24px rgba(0,0,0,0.4)' }}>
                Pack light.
              </span>
              <span className="block font-semibold italic" style={{ color: BRAND.gold, textShadow: '0 4px 20px rgba(0,0,0,0.35)' }}>
                Dream heavy.
              </span>
            </h1>

            {/* Bottom-left bracket */}
            <span className="absolute -bottom-4 -left-1 sm:left-2 w-5 h-5 border-b border-l pointer-events-none"
              style={{ borderColor: 'rgba(200,163,107,0.45)' }} />
            {/* Bottom-right bracket */}
            <span className="absolute -bottom-4 -right-1 sm:right-2 w-5 h-5 border-b border-r pointer-events-none"
              style={{ borderColor: 'rgba(200,163,107,0.45)' }} />
          </div>

          {/* Sub-copy */}
          <p className="fade-up delay-4 mt-8 text-sm sm:text-base font-light max-w-xs leading-relaxed"
            style={{ color: 'rgba(255,255,255,0.82)', textShadow: '0 1px 8px rgba(0,0,0,0.5)' }}>
            Your personal AI travel agent, delivered through WhatsApp.
          </p>

          {/* CTA */}
          <div className="fade-up delay-5 mt-8 flex flex-col sm:flex-row items-center gap-4">
            <WaButton size="lg" label="Start planning on WhatsApp" hideIcon />
          </div>

          {/* Social proof */}
          <div className="fade-up delay-6 mt-6 flex items-center gap-2">
            <a href="https://www.instagram.com/wanderai.travels" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
              <svg viewBox="0 0 24 24" fill="white" className="w-3 h-3 opacity-70">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
              </svg>
              <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.65)', textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
                @wanderai.travels &nbsp;·&nbsp; 2,847 followers
              </span>
            </a>
          </div>
        </div>

        {/* ── Scroll indicator — bottom center ── */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 fade-up delay-7 flex flex-col items-center gap-2">
          <span className="text-[7px] tracking-[0.4em] uppercase"
            style={{ color: 'rgba(255,255,255,0.45)', writingMode: 'vertical-rl', transform: 'rotate(180deg)', letterSpacing: '0.3em' }}>
            Scroll
          </span>
          <div className="relative w-px h-14 overflow-hidden rounded-full"
            style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
            <div className="scroll-line absolute inset-0 rounded-full" style={{ backgroundColor: BRAND.gold }} />
          </div>
        </div>

        {/* ── Location badge (bottom-left) + domain (bottom-right) ── */}
        <div className="relative z-10 flex justify-between items-end px-5 sm:px-10 pb-5 fade-up delay-8">
          <span className="text-[9px] tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.35)' }}>thewanderlust.app</span>
          <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.35)' }}>© 2025 WanderAi</span>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          FEATURES — Why WanderAI
      ══════════════════════════════════════════════ */}
      <section id="features" className="py-20 px-5" style={{ backgroundColor: BRAND.sand }}>
        <div ref={featuresReveal.ref} className="max-w-4xl mx-auto transition-all duration-700"
          style={{ opacity: featuresReveal.visible ? 1 : 0, transform: featuresReveal.visible ? 'none' : 'translateY(28px)' }}>

          <div className="text-center mb-12">
            <p className="text-[10px] tracking-[0.35em] uppercase mb-3" style={{ color: BRAND.teal }}>Why WanderAI</p>
            <h2 className="font-serif text-2xl sm:text-3xl font-light" style={{ color: BRAND.slate }}>
              Travel planning,{' '}
              <span className="italic font-semibold" style={{ color: BRAND.gold }}>reinvented</span>
            </h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map((f, i) => (
              <div key={i}
                className="rounded-2xl p-6 border hover:shadow-md transition-all duration-300 group cursor-default"
                style={{
                  backgroundColor: BRAND.ivory,
                  borderColor: 'rgba(235,223,209,0.6)',
                  opacity: featuresReveal.visible ? 1 : 0,
                  transform: featuresReveal.visible ? 'none' : 'translateY(20px)',
                  transition: `opacity .5s ease ${i * 80 + 150}ms, transform .5s ease ${i * 80 + 150}ms, box-shadow .3s`,
                }}>
                <div className="mb-4 group-hover:scale-110 transition-transform duration-300 inline-block"
                  style={{ color: f.accent }}>
                  <f.Icon />
                </div>
                <h3 className="font-serif font-semibold text-sm mb-1.5" style={{ color: BRAND.slate }}>{f.title}</h3>
                <p className="text-xs font-light leading-relaxed text-stone-500">{f.desc}</p>
                <div className="mt-4 h-0.5 w-8 rounded-full transition-all duration-300 group-hover:w-16"
                  style={{ backgroundColor: f.accent }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          WHATSAPP DEMO
      ══════════════════════════════════════════════ */}
      <section id="how" className="py-20 px-5" style={{ backgroundColor: BRAND.ivory }}>
        <div ref={demoReveal.ref} className="max-w-4xl mx-auto transition-all duration-700"
          style={{ opacity: demoReveal.visible ? 1 : 0, transform: demoReveal.visible ? 'none' : 'translateY(28px)' }}>

          <div className="text-center mb-12">
            <p className="text-[10px] tracking-[0.35em] uppercase mb-3" style={{ color: BRAND.teal }}>See it in action</p>
            <h2 className="font-serif text-2xl sm:text-3xl font-light" style={{ color: BRAND.slate }}>
              Just send a{' '}
              <span className="italic font-semibold" style={{ color: BRAND.gold }}>message</span>
            </h2>
            <p className="text-sm mt-2 font-light max-w-xs mx-auto text-stone-500">
              Tell us where you want to go — get a complete trip plan in minutes.
            </p>
          </div>

          <div className="flex flex-col lg:flex-row items-start gap-8 lg:gap-12">

            {/* Phone mockup */}
            <div className="hidden sm:flex flex-shrink-0 justify-center w-full lg:w-auto">
              <div className="relative w-[270px]">
                <div className="bg-stone-900 rounded-[36px] p-2.5 shadow-2xl">
                  <div className="bg-[#ece5dd] rounded-[27px] overflow-hidden">
                    <div className="bg-[#075e54] px-3.5 pt-8 pb-2.5 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#25D366] flex items-center justify-center flex-shrink-0">
                        <WaIcon className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-white text-xs font-semibold">WanderAI</p>
                        <p className="text-emerald-300 text-[9px]">online · AI travel agent</p>
                      </div>
                    </div>
                    <div className="px-2.5 py-3 space-y-2.5 min-h-[360px] max-h-[360px] overflow-y-auto">
                      {CHAT.map((msg, i) => <Bubble key={i} msg={msg} idx={i} />)}
                    </div>
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
                  <p className="text-sm font-serif font-semibold" style={{ color: BRAND.slate }}>€1,380</p>
                  <p className="text-[9px] font-medium" style={{ color: BRAND.teal }}>Within budget ✓</p>
                </div>
                <div className="absolute -left-4 bottom-20 bg-white rounded-xl shadow-md px-3 py-2 border border-stone-100">
                  <p className="text-[9px] text-stone-400 mb-0.5">Planned in</p>
                  <p className="text-sm font-serif font-semibold" style={{ color: BRAND.slate }}>3 min</p>
                  <div className="flex gap-0.5 mt-0.5">{[...Array(5)].map((_,i)=><span key={i} className="text-[9px]" style={{ color: BRAND.gold }}>★</span>)}</div>
                </div>
              </div>
            </div>

            {/* Steps */}
            <div className="flex-1 w-full space-y-6">
              {/* Mobile-only simplified chat */}
              <div className="sm:hidden rounded-2xl border overflow-hidden" style={{ borderColor: BRAND.sand }}>
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

              <div className="space-y-5">
                {STEPS.map((s, i) => <StepItem key={i} step={s} idx={i} />)}
              </div>

              <div className="pt-2">
                <p className="text-[10px] font-light" style={{ color: BRAND.teal, letterSpacing: '0.1em' }}>Free to use &nbsp;·&nbsp; No download &nbsp;·&nbsp; No account</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          CTA — LAUNCHED
      ══════════════════════════════════════════════ */}
      <section id="join" className="py-24 px-5 relative overflow-hidden" style={{ backgroundColor: BRAND.slate }}>
        <div className="orb-dark orb-dark-gold pointer-events-none" />
        <div ref={ctaReveal.ref} className="relative max-w-2xl mx-auto text-center transition-all duration-700"
          style={{ opacity: ctaReveal.visible ? 1 : 0, transform: ctaReveal.visible ? 'none' : 'translateY(28px)' }}>

          <p className="text-[9px] tracking-[0.45em] uppercase mb-5" style={{ color: BRAND.teal }}>Available now</p>

          <h2 className="font-serif font-light text-white mb-4" style={{ fontSize: 'clamp(2rem, 6vw, 4rem)', lineHeight: 1.1 }}>
            Your trip is one<br />
            <span className="italic font-semibold" style={{ color: BRAND.gold }}>message away.</span>
          </h2>

          <p className="text-sm font-light mb-10 max-w-xs mx-auto" style={{ color: 'rgba(247,244,239,0.5)' }}>
            No app to download. No account to create.<br />Send a message and your trip begins.
          </p>

          <a href={WA_LINK} target="_blank" rel="noopener noreferrer"
            className="btn-primary inline-flex items-center justify-center font-semibold rounded-full px-10 py-4 text-base tracking-wide transition-all"
            style={{ backgroundColor: BRAND.gold, color: BRAND.slate, letterSpacing: '0.06em' }}>
            Start planning
          </a>

          <p className="mt-5 text-[10px] font-light tracking-wide" style={{ color: 'rgba(255,255,255,0.2)' }}>
            Free to use &nbsp;·&nbsp; No download &nbsp;·&nbsp; No account required
          </p>

        </div>
      </section>

      {/* ══════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════ */}
      <footer style={{ backgroundColor: '#131a1c' }} className="px-5 sm:px-12 pt-16 pb-8">
        <div className="max-w-5xl mx-auto">

          {/* Logo + tagline */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-8 mb-14 pb-10"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <WMark className="w-12 h-9" color={BRAND.gold} />
                <span className="font-serif font-light text-lg tracking-wide" style={{ color: 'rgba(255,255,255,0.9)' }}>WanderAi</span>
              </div>
              <p className="text-[11px] font-light italic" style={{ color: 'rgba(255,255,255,0.3)' }}>Pack light. Dream heavy.</p>
            </div>
          </div>

          {/* Sitemap grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-10 mb-14">

            <div>
              <p className="text-[9px] tracking-[0.3em] uppercase mb-4 font-medium" style={{ color: BRAND.teal }}>Product</p>
              <ul className="space-y-2.5">
                {([
                  ['Features',        'features'],
                  ['How it works',    'howItWorks'],
                  ['AI Trip Planning','aiTrip'],
                  ['Hotel Search',    'hotelSearch'],
                  ['Flight Search',   'flightSearch'],
                ] as [string, string][]).map(([label, key]) => (
                  <li key={key}>
                    <button
                      onClick={() => openModal(key)}
                      className="text-xs font-light hover:opacity-100 transition-opacity text-left"
                      style={{ color: 'rgba(255,255,255,0.42)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                      {label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-[9px] tracking-[0.3em] uppercase mb-4 font-medium" style={{ color: BRAND.teal }}>Company</p>
              <ul className="space-y-2.5">
                {([
                  ['About us', 'about'],
                  ['Blog',     'blog'],
                  ['Careers',  'careers'],
                  ['Press',    'press'],
                  ['Partners', 'partners'],
                ] as [string, string][]).map(([label, key]) => (
                  <li key={key}>
                    <button
                      onClick={() => openModal(key)}
                      className="text-xs font-light hover:opacity-100 transition-opacity text-left"
                      style={{ color: 'rgba(255,255,255,0.42)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                      {label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-[9px] tracking-[0.3em] uppercase mb-4 font-medium" style={{ color: BRAND.teal }}>Support</p>
              <ul className="space-y-2.5">
                {['FAQ', 'Contact us', 'Privacy policy', 'Terms of service', 'Cookie policy'].map(l => (
                  <li key={l}><a href="#" className="text-xs font-light hover:opacity-100 transition-opacity" style={{ color: 'rgba(255,255,255,0.42)' }}>{l}</a></li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-[9px] tracking-[0.3em] uppercase mb-4 font-medium" style={{ color: BRAND.teal }}>Connect</p>
              <ul className="space-y-2.5">
                <li>
                  <a href="https://www.instagram.com/wanderai.travels" target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs font-light hover:opacity-100 transition-opacity" style={{ color: 'rgba(255,255,255,0.42)' }}>
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 flex-shrink-0">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
                    </svg>
                    @wanderai.travels
                  </a>
                </li>
                <li>
                  <a href={WA_LINK} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs font-light hover:opacity-100 transition-opacity" style={{ color: 'rgba(255,255,255,0.42)' }}>
                    <WaIcon className="w-3.5 h-3.5 flex-shrink-0" />
                    WhatsApp us
                  </a>
                </li>
                <li>
                  <a href="https://x.com/wanderai" target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs font-light hover:opacity-100 transition-opacity" style={{ color: 'rgba(255,255,255,0.42)' }}>
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 flex-shrink-0">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                    @wanderai
                  </a>
                </li>
                <li>
                  <a href="#" className="flex items-center gap-2 text-xs font-light hover:opacity-100 transition-opacity" style={{ color: 'rgba(255,255,255,0.42)' }}>
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 flex-shrink-0">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                    LinkedIn
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Travel partner affiliates */}
          <div className="mb-10 pb-10" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-[9px] tracking-[0.3em] uppercase mb-5 font-medium" style={{ color: 'rgba(255,255,255,0.25)' }}>Travel partners & affiliates</p>
            <div className="flex flex-wrap gap-3">
              {['Booking.com', 'Hotels.com', 'Skyscanner', 'Viator', 'Amadeus', 'Expedia', 'GetYourGuide', 'Kayak'].map(p => (
                <span key={p}
                  className="px-3.5 py-1.5 rounded-full text-[10px] font-light tracking-wide"
                  style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)' }}>
                  {p}
                </span>
              ))}
            </div>
          </div>

          {/* Bottom bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-[10px]"
            style={{ color: 'rgba(255,255,255,0.2)' }}>
            <span className="tracking-widest uppercase">thewanderlust.app</span>
            <span>© 2025 WanderAi. All rights reserved.</span>
          </div>

        </div>
      </footer>

      {/* ── Modal overlay ── */}
      <Modal modalKey={activeModal} visible={modalVisible} onClose={closeModal} />

    </div>
  )
}
