/**
 * Baileys WhatsApp client — global singleton with Supabase persistence.
 *
 * Flow per incoming message:
 *   1.  Persist message to Supabase
 *   2.  Load conversation state
 *   3.  Expire any stale 24-hour offers → notify customer
 *   4.  Detect intent + language
 *   5.  Assign scenario on first message
 *   6.  Advance stage via scenario engine
 *   7.  Create offer record when stage reaches 'suggestion_made'
 *   8.  Create MyFatoorah payment link when stage reaches 'offer_accepted'
 *   9.  Call AI with full scenario context (+ payment URL if applicable)
 *   10. Persist AI reply + updated state
 *   11. Send reply via WhatsApp
 */

import path from 'path'
import fs   from 'fs'
import { EventEmitter } from 'events'

export type ConnectionStatus = 'disconnected' | 'connecting' | 'qr' | 'connected'

export interface WAMessage {
  id:    string
  phone: string
  jid:   string
  text:  string
  role:  'user' | 'agent'
  ts:    number
}

interface WAGlobal {
  status:   ConnectionStatus
  qrDataUrl: string | null
  messages:  WAMessage[]          // in-memory ring buffer (admin SSE)
  emitter:   EventEmitter
  sock:      any | null
  stopping:  boolean
}

const g = globalThis as typeof globalThis & { __wa?: WAGlobal }
if (!g.__wa) {
  g.__wa = {
    status:    'disconnected',
    qrDataUrl: null,
    messages:  [],
    emitter:   new EventEmitter(),
    sock:      null,
    stopping:  false,
  }
  g.__wa.emitter.setMaxListeners(50)
}

export const wa = g.__wa!

// ── Helpers ────────────────────────────────────────────────────────────────────

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

// ── Message handler ────────────────────────────────────────────────────────────

async function handleIncomingMessage(
  jid:    string,
  msgId:  string,
  text:   string,
  sock:   any
) {
  const phone = jidToPhone(jid)

  // Push to in-memory ring buffer for SSE admin panel
  pushMessage({ id: msgId, phone, jid, text, role: 'user', ts: Date.now() })

  // ── DB imports (lazy to avoid edge-runtime issues) ─────────────────────────
  const {
    getOrCreateConversation, saveMessage, getMessageHistory,
    updateConversationState, createOffer, getActiveOffer,
    updateOfferStage, expireStaleOffers, logScenarioStart,
    logScenarioComplete,
  } = await import('./db')

  const { detectIntent, detectScenario, nextStage, buildScenarioContext } =
    await import('./scenario-engine')

  const { createPaymentLink } = await import('./myfatoorah')
  const { getAIResponse }     = await import('./openrouter')

  // ── 1. Conversation record ─────────────────────────────────────────────────
  const conv  = await getOrCreateConversation(phone)
  const state = (conv.state ?? { stage: 'idle', language: 'en', turn_count: 0 }) as import('./db').ConversationState

  // ── 2. Persist user message ────────────────────────────────────────────────
  await saveMessage(conv.id, 'user', text)

  // ── 3. Expire stale offers ─────────────────────────────────────────────────
  const expiredIds = await expireStaleOffers(phone)
  const isOfferExpired = expiredIds.length > 0

  if (isOfferExpired && state.offer_id && expiredIds.includes(state.offer_id)) {
    state.offer_id = undefined // clear from state so a new offer gets created
    if (state.scenario_log_id) {
      await logScenarioComplete(state.scenario_log_id, 'expired').catch(() => {})
    }
  }

  // ── 4. Detect intent ───────────────────────────────────────────────────────
  const intent = detectIntent(text)

  // ── 5. Assign scenario on first real message ───────────────────────────────
  if (!state.scenario) {
    state.scenario = detectScenario(intent)
    // 'love_at_first_sight' is only assigned externally; default search → suggestion_24hr
  }

  // ── 6. Advance stage ───────────────────────────────────────────────────────
  const stageUpdate = nextStage(state, intent)
  Object.assign(state, stageUpdate)

  // ── 7. Create offer record when suggestion is first presented ──────────────
  let offerId = state.offer_id
  if (!offerId && state.stage === 'suggestion_made' && state.scenario) {
    try {
      const offer = await createOffer({
        conversationId: conv.id,
        phone,
        scenario: state.scenario,
        totalKwd: state.budget,
        currency: state.currency,
      })
      offerId = offer.id
      state.offer_id = offerId

      // Start scenario log
      const logId = await logScenarioStart(conv.id, phone, state.scenario, offerId)
      state.scenario_log_id = logId
    } catch (err) {
      console.error('[WanderAI] createOffer failed:', err)
    }
  }

  // ── 8. Create payment link when customer accepts ───────────────────────────
  let paymentUrl: string | undefined
  if (state.stage === 'offer_accepted' && offerId) {
    try {
      const activeOffer = await getActiveOffer(phone) ?? await import('./db').then(m => m.getOfferById(offerId!))
      const amountKwd   = activeOffer?.total_kwd ?? state.budget ?? 0

      const payment = await createPaymentLink({
        customerName:  `WA+${phone}`,
        customerPhone: phone,
        amountKwd,
        description:   `WanderAI Trip — ${state.destination ?? state.scenario ?? 'Travel Package'}`,
        invoiceRef:    offerId,
        language:      state.language,
      })

      paymentUrl = payment.paymentUrl

      await updateOfferStage(offerId, 'accepted', {
        paymentUrl:       payment.paymentUrl,
        paymentInvoiceId: payment.invoiceId,
      })
    } catch (err) {
      console.error('[WanderAI] createPaymentLink failed:', err)
      // Continue without payment URL — AI will still reply
    }
  }

  // ── 9. Build AI context ────────────────────────────────────────────────────
  const scenarioCtx = buildScenarioContext(state, isOfferExpired, paymentUrl)
  const history     = await getMessageHistory(conv.id, 18)

  // ── 10. Get AI reply ───────────────────────────────────────────────────────
  await sock.sendPresenceUpdate('composing', jid)
  const reply = await getAIResponse(history, scenarioCtx, paymentUrl)
  await sock.sendPresenceUpdate('paused', jid)

  // ── 11. Persist AI reply ───────────────────────────────────────────────────
  await saveMessage(conv.id, 'assistant', reply)

  // Advance to payment_sent now that reply is being sent
  if (state.stage === 'offer_accepted') state.stage = 'payment_sent'

  // Log scenario complete when payment is sent
  if (state.stage === 'payment_sent' && state.scenario_log_id) {
    await logScenarioComplete(state.scenario_log_id, 'completed').catch(() => {})
    state.scenario_log_id = undefined
  }

  await updateConversationState(phone, state)

  // ── 12. Send WhatsApp reply ────────────────────────────────────────────────
  await sock.sendMessage(jid, { text: reply })
  pushMessage({ id: `ai-${Date.now()}`, phone, jid, text: reply, role: 'agent', ts: Date.now() })
}

// ── Connect ────────────────────────────────────────────────────────────────────

export async function connectWhatsApp() {
  if (wa.status === 'connected' || wa.status === 'connecting' || wa.status === 'qr') return
  wa.stopping = false
  setStatus('connecting')

  // Use /tmp on read-only environments (Vercel), fallback to project data dir locally
  const authDir = process.env.VERCEL
    ? path.join('/tmp', 'wa-auth')
    : path.join(process.cwd(), 'data', 'wa-auth')
  fs.mkdirSync(authDir, { recursive: true })

  const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
  } = await import('@whiskeysockets/baileys')
  const { default: QRCode } = await import('qrcode')
  const { default: pino   } = await import('pino')
  const { Boom }             = await import('@hapi/boom')

  const { state, saveCreds } = await useMultiFileAuthState(authDir)
  const { version }          = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    version,
    auth:   state,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    browser: ['WanderAI Admin', 'Chrome', '1.0'],
    generateHighQualityLinkPreview: false,
  })

  wa.sock = sock
  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }: any) => {
    if (qr) {
      setStatus('qr')
      const dataUrl = await QRCode.toDataURL(qr, {
        width: 280, margin: 2,
        color: { dark: '#111827', light: '#ffffff' },
      })
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
      if (shouldReconnect) setTimeout(() => connectWhatsApp(), 3000)
    }
  })

  sock.ev.on('messages.upsert', async ({ messages: msgs, type }: any) => {
    if (type !== 'notify') return

    for (const msg of msgs) {
      if (msg.key.fromMe)  continue
      if (!msg.message)    continue

      const text =
        msg.message.conversation ??
        msg.message.extendedTextMessage?.text ??
        msg.message.imageMessage?.caption ??
        ''

      if (!text.trim()) continue

      const jid = msg.key.remoteJid!
      try {
        await handleIncomingMessage(jid, msg.key.id!, text, sock)
      } catch (err) {
        console.error('[WanderAI] handleIncomingMessage failed:', err)
        // Fallback: send a simple apology so the customer isn't left waiting
        try {
          await sock.sendMessage(jid, {
            text: "Sorry, I ran into an issue. Please try again in a moment! / عذراً، حدث خطأ. الرجاء المحاولة لاحقاً!",
          })
        } catch {}
      }
    }
  })
}

// ── Disconnect ─────────────────────────────────────────────────────────────────

export async function disconnectWhatsApp() {
  wa.stopping = true
  if (wa.sock) {
    await wa.sock.logout().catch(() => {})
    wa.sock = null
  }
  const authDir = path.join(process.cwd(), 'data', 'wa-auth')
  fs.rmSync(authDir, { recursive: true, force: true })
  setStatus('disconnected')
  setQR(null)
}
