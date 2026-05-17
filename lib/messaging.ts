/**
 * Messaging abstraction layer
 *
 * Switch providers by setting NEXT_PUBLIC_MESSAGING_PROVIDER in .env.local
 * The user-facing entry point (wa.me deep link) is the same across all providers.
 * The provider setting tells your backend WHICH webhook/API handles the reply.
 *
 * Quick-start (zero cost): leave provider as 'wa_me'
 *   → set NEXT_PUBLIC_WA_PHONE to your WhatsApp Business number (international format)
 *   → users tap the button, WhatsApp opens with a pre-filled message, you reply manually
 *     (or connect your AI agent via the provider's webhook later)
 */

export type Provider = 'wa_me' | 'twilio' | 'meta_cloud_api' | 'wati' | 'ultramsg'

const PHONE    = process.env.NEXT_PUBLIC_WA_PHONE    ?? '1234567890'
const PREFILL  = process.env.NEXT_PUBLIC_WA_PREFILL  ?? "Hi! I'd like to plan a trip with WanderAI 🌍"
export const PROVIDER = (process.env.NEXT_PUBLIC_MESSAGING_PROVIDER ?? 'wa_me') as Provider

/**
 * Returns the wa.me deep link that opens WhatsApp with a pre-filled message.
 * Works for all providers — the backend webhook handles the reply side.
 */
export function getWhatsAppLink(customPrefill?: string): string {
  const phone = PHONE.replace(/\D/g, '')
  const text  = encodeURIComponent(customPrefill ?? PREFILL)
  return `https://wa.me/${phone}?text=${text}`
}

export const WA_LINK = getWhatsAppLink()

// ─── Provider registry ────────────────────────────────────────────────────────
// Used to surface setup docs and capabilities in your admin / README.

export interface ProviderMeta {
  name: string
  free: boolean
  freeTier: string
  docsUrl: string
  webhookSupport: boolean
  notes: string
}

export const PROVIDERS: Record<Provider, ProviderMeta> = {
  wa_me: {
    name: 'WhatsApp wa.me (direct link)',
    free: true,
    freeTier: 'Unlimited — no API required',
    docsUrl: 'https://faq.whatsapp.com/5246950315728862',
    webhookSupport: false,
    notes: 'Best for launch. No API key needed. Connect an AI agent later by migrating to meta_cloud_api.',
  },
  meta_cloud_api: {
    name: 'Meta WhatsApp Cloud API',
    free: true,
    freeTier: '1,000 user-initiated conversations / month free',
    docsUrl: 'https://developers.facebook.com/docs/whatsapp/cloud-api',
    webhookSupport: true,
    notes: 'Official free tier. Requires Meta Business verification. Best long-term choice.',
  },
  twilio: {
    name: 'Twilio WhatsApp Business',
    free: false,
    freeTier: 'Sandbox for testing (free)',
    docsUrl: 'https://www.twilio.com/en-us/whatsapp',
    webhookSupport: true,
    notes: 'Easiest developer experience. ~$0.005/message after sandbox. Great for rapid prototyping.',
  },
  wati: {
    name: 'WATI (WhatsApp Team Inbox)',
    free: false,
    freeTier: '7-day trial',
    docsUrl: 'https://www.wati.io',
    webhookSupport: true,
    notes: 'Built on Meta Cloud API. Adds a team inbox UI and chatbot builder on top.',
  },
  ultramsg: {
    name: 'UltraMsg WhatsApp API',
    free: false,
    freeTier: '3-day trial',
    docsUrl: 'https://ultramsg.com',
    webhookSupport: true,
    notes: 'Simpler setup than Meta Cloud API. Not officially sanctioned — risk of number bans.',
  },
}
