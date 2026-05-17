/**
 * Baileys WhatsApp client — global singleton
 *
 * Stored on `globalThis` so it survives Next.js HMR reloads in dev.
 * One connection per process; all API routes share this state.
 */

import path from 'path'
import fs from 'fs'
import { EventEmitter } from 'events'

export type ConnectionStatus = 'disconnected' | 'connecting' | 'qr' | 'connected'

export interface WAMessage {
  id: string
  phone: string          // remote JID cleaned to phone number
  jid: string            // full WhatsApp JID
  text: string
  role: 'user' | 'agent'
  ts: number
}

interface WAGlobal {
  status: ConnectionStatus
  qrDataUrl: string | null
  messages: WAMessage[]
  conversationHistory: Record<string, { role: 'user' | 'assistant'; content: string }[]>
  emitter: EventEmitter
  sock: any | null
  stopping: boolean
}

const g = globalThis as typeof globalThis & { __wa?: WAGlobal }

if (!g.__wa) {
  g.__wa = {
    status: 'disconnected',
    qrDataUrl: null,
    messages: [],
    conversationHistory: {},
    emitter: new EventEmitter(),
    sock: null,
    stopping: false,
  }
  g.__wa.emitter.setMaxListeners(50)
}

export const wa = g.__wa!

// ─── Helpers ──────────────────────────────────────────────────────────────────
export function jidToPhone(jid: string): string {
  return jid.replace(/@.+$/, '').replace(/[^0-9]/g, '')
}

export function setStatus(s: ConnectionStatus) {
  wa.status = s
  wa.emitter.emit('status', s)
}

export function setQR(dataUrl: string | null) {
  wa.qrDataUrl = dataUrl
  wa.emitter.emit('qr', dataUrl)
}

export function pushMessage(msg: WAMessage) {
  wa.messages.push(msg)
  if (wa.messages.length > 500) wa.messages.shift()
  wa.emitter.emit('message', msg)
}

// ─── Connect ──────────────────────────────────────────────────────────────────
export async function connectWhatsApp() {
  if (wa.status === 'connected' || wa.status === 'connecting' || wa.status === 'qr') return
  wa.stopping = false
  setStatus('connecting')

  const authDir = path.join(process.cwd(), 'data', 'wa-auth')
  fs.mkdirSync(authDir, { recursive: true })

  const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } =
    await import('@whiskeysockets/baileys')
  const { default: QRCode } = await import('qrcode')
  const { default: pino }   = await import('pino')
  const { Boom }             = await import('@hapi/boom')
  const { getAIResponse }    = await import('./openrouter')

  const { state, saveCreds } = await useMultiFileAuthState(authDir)
  const { version }          = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    browser: ['WanderAI Admin', 'Chrome', '1.0'],
    generateHighQualityLinkPreview: false,
  })

  wa.sock = sock

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      setStatus('qr')
      const dataUrl = await QRCode.toDataURL(qr, { width: 280, margin: 2, color: { dark: '#111827', light: '#ffffff' } })
      setQR(dataUrl)
    }

    if (connection === 'open') {
      setStatus('connected')
      setQR(null)
    }

    if (connection === 'close') {
      const code = (lastDisconnect?.error as InstanceType<typeof Boom>)?.output?.statusCode
      const shouldReconnect = code !== DisconnectReason.loggedOut && !wa.stopping

      wa.sock = null
      setStatus('disconnected')
      setQR(null)

      if (shouldReconnect) {
        setTimeout(() => connectWhatsApp(), 3000)
      }
    }
  })

  sock.ev.on('messages.upsert', async ({ messages: msgs, type }) => {
    if (type !== 'notify') return

    for (const msg of msgs) {
      if (msg.key.fromMe) continue
      if (!msg.message) continue

      const text =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        msg.message.imageMessage?.caption ||
        ''

      if (!text.trim()) continue

      const jid   = msg.key.remoteJid!
      const phone = jidToPhone(jid)

      pushMessage({ id: msg.key.id!, phone, jid, text, role: 'user', ts: Date.now() })

      // Maintain per-contact history
      if (!wa.conversationHistory[jid]) wa.conversationHistory[jid] = []
      wa.conversationHistory[jid].push({ role: 'user', content: text })
      // Keep last 20 turns per contact
      if (wa.conversationHistory[jid].length > 40) wa.conversationHistory[jid].splice(0, 2)

      // AI reply
      try {
        await sock.sendPresenceUpdate('composing', jid)
        const reply = await getAIResponse(wa.conversationHistory[jid])
        await sock.sendPresenceUpdate('paused', jid)
        await sock.sendMessage(jid, { text: reply })

        wa.conversationHistory[jid].push({ role: 'assistant', content: reply })
        pushMessage({ id: `ai-${Date.now()}`, phone, jid, text: reply, role: 'agent', ts: Date.now() })
      } catch (err) {
        console.error('[WanderAI] AI reply failed:', err)
      }
    }
  })
}

// ─── Disconnect ───────────────────────────────────────────────────────────────
export async function disconnectWhatsApp() {
  wa.stopping = true
  if (wa.sock) {
    await wa.sock.logout().catch(() => {})
    wa.sock = null
  }
  // Clear saved credentials so next connect shows QR
  const authDir = path.join(process.cwd(), 'data', 'wa-auth')
  fs.rmSync(authDir, { recursive: true, force: true })
  setStatus('disconnected')
  setQR(null)
}
