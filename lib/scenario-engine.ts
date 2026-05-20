/**
 * Scenario Engine — intent detection, stage transitions, and AI context building.
 *
 * 6 supported scenarios:
 *   1. search_book_pay      — customer searches a specific trip → confirm → pay
 *   2. suggestion_24hr      — agent proactively suggests → 24-hr offer → confirm or expire
 *   3. budget_changes       — agent suggests based on budget → customer tweaks → pay
 *   4. love_at_first_sight  — agent suggests → customer immediately accepts → pay
 *   5. family_group         — family with kids → kid-friendly package → pay
 *   6. last_minute_solo     — solo budget traveler → fastest/cheapest option → pay
 */

import type { ConversationState, ScenarioType, ConversationStage } from './db'

// ── Intent detection ───────────────────────────────────────────────────────────

const RE_CONFIRM  = /\b(yes|ok|okay|confirm|book|go ahead|perfect|great|love it|sounds good|proceed|sure|yep|absolutely|deal|let's do it|يلا|نعم|أيوه|موافق|تمام|ممتاز|كمل|زين|خلاص|ابدأ|احجز|أوكي)\b/i
const RE_REJECT   = /\b(no|nope|cancel|don't|not interested|stop|لا|ما أبي|ما أريد|إلغاء|مو زين)\b/i
const RE_CHANGE   = /\b(change|different|another|cheaper|upgrade|downgrade|instead|prefer|modify|adjust|other option|بدّل|غيّر|أرخص|ارخص|بدل|عدّل|خيار ثاني)\b/i
const RE_PAY      = /\b(pay|payment|checkout|link|دفع|ادفع|ادفع|سدد|وين أدفع|رابط الدفع)\b/i
const RE_FAMILY   = /\b(family|kid|child|children|son|daughter|baby|toddler|wife|husband|spouse|عائلة|أطفال|ولد|بنت|طفل|رضيع|زوجة|زوج)\b/i
const RE_SOLO     = /\b(solo|alone|myself|just me|single|only me|بنفسي|لوحدي|وحدي|أنا بس)\b/i
const RE_LASTMIN  = /\b(last.?minute|asap|urgent|tomorrow|this week|next week|soon|عاجل|سريع|قريب|بكرا|الأسبوع|هالأسبوع|الجاي)\b/i
const RE_BUDGET   = /(\d[\d,\.]+)\s*(kwd|kd|usd|aed|eur|\$|€|دينار|دولار|د\.ك)/i
const RE_ARABIC   = /[؀-ۿ]/

export interface Intent {
  confirms:   boolean
  rejects:    boolean
  wantsChange: boolean
  wantsPay:   boolean
  isFamily:   boolean
  isSolo:     boolean
  isLastMin:  boolean
  budget:     { amount: number; currency: ConversationState['currency'] } | null
  language:   'en' | 'ar'
}

export function detectIntent(text: string): Intent {
  const arabicRatio = (text.match(RE_ARABIC) ?? []).length / Math.max(text.length, 1)
  return {
    confirms:    RE_CONFIRM.test(text),
    rejects:     RE_REJECT.test(text),
    wantsChange: RE_CHANGE.test(text),
    wantsPay:    RE_PAY.test(text),
    isFamily:    RE_FAMILY.test(text),
    isSolo:      RE_SOLO.test(text),
    isLastMin:   RE_LASTMIN.test(text),
    budget:      parseBudget(text),
    language:    arabicRatio > 0.15 ? 'ar' : 'en',
  }
}

function parseBudget(text: string): Intent['budget'] {
  const m = text.match(RE_BUDGET)
  if (!m) return null
  const amount = parseFloat(m[1].replace(/,/g, ''))
  const raw = m[2].toLowerCase()
  const currency: ConversationState['currency'] =
    raw === 'usd' || raw === '$' || raw === 'دولار'   ? 'USD' :
    raw === 'aed'                                      ? 'AED' :
    raw === 'eur' || raw === '€'                       ? 'EUR' : 'KWD'
  return { amount, currency }
}

// ── Scenario detection (called on first message) ───────────────────────────────

export function detectScenario(intent: Intent): ScenarioType {
  if (intent.isFamily)                      return 'family_group'
  if (intent.isSolo && intent.isLastMin)    return 'last_minute_solo'
  if (intent.isLastMin)                     return 'last_minute_solo'
  if (intent.isSolo && intent.budget)       return 'last_minute_solo'
  if (intent.budget)                        return 'budget_changes'
  return 'suggestion_24hr'                  // default: agent proactively suggests
}

// ── Stage transition ───────────────────────────────────────────────────────────

export function nextStage(
  state: ConversationState,
  intent: Intent
): Partial<ConversationState> {
  const update: Partial<ConversationState> = {}

  // Language always tracks the customer's current message
  if (intent.language !== state.language) update.language = intent.language

  // Capture budget if not already stored
  if (intent.budget && !state.budget) {
    update.budget   = intent.budget.amount
    update.currency = intent.budget.currency
  }

  // Family flags
  if (intent.isFamily && !state.is_family) update.is_family = true

  const s = state.stage
  const sc = state.scenario

  // Advance turn counter every call
  update.turn_count = (state.turn_count ?? 0) + 1

  switch (sc) {
    // ── 1. search_book_pay ──────────────────────────────────────────────────
    case 'search_book_pay':
      if (s === 'idle')                                       { update.stage = 'gathering_requirements'; break }
      if (s === 'gathering_requirements' && update.turn_count >= 2) { update.stage = 'options_presented'; break }
      if (s === 'options_presented' && intent.confirms)       { update.stage = 'offer_accepted'; break }
      if (s === 'options_presented' && intent.wantsChange)    { update.stage = 'customer_modifying'; break }
      if (s === 'customer_modifying' && intent.confirms)      { update.stage = 'offer_accepted'; break }
      if (s === 'offer_accepted')                             { update.stage = 'payment_sent'; break }
      break

    // ── 2. suggestion_24hr ──────────────────────────────────────────────────
    case 'suggestion_24hr':
      if (s === 'idle')                                       { update.stage = 'gathering_requirements'; break }
      if (s === 'gathering_requirements' && update.turn_count >= 2) { update.stage = 'suggestion_made'; break }
      if (s === 'suggestion_made' && intent.confirms)         { update.stage = 'offer_accepted'; break }
      if (s === 'suggestion_made' && intent.wantsChange)      { update.stage = 'customer_modifying'; break }
      if (s === 'customer_modifying' && intent.confirms)      { update.stage = 'offer_accepted'; break }
      if (s === 'offer_accepted')                             { update.stage = 'payment_sent'; break }
      break

    // ── 3. budget_changes ───────────────────────────────────────────────────
    case 'budget_changes':
      if (s === 'idle')                                       { update.stage = 'budget_captured'; break }
      if (s === 'budget_captured')                            { update.stage = 'suggestion_made'; break }
      if (s === 'suggestion_made' && intent.wantsChange)      { update.stage = 'customer_modifying'; break }
      if (s === 'suggestion_made' && intent.confirms)         { update.stage = 'offer_accepted'; break }
      if (s === 'customer_modifying' && intent.confirms)      { update.stage = 'offer_accepted'; break }
      if (s === 'offer_accepted')                             { update.stage = 'payment_sent'; break }
      break

    // ── 4. love_at_first_sight ──────────────────────────────────────────────
    case 'love_at_first_sight':
      if (s === 'idle')                                       { update.stage = 'gathering_requirements'; break }
      if (s === 'gathering_requirements')                     { update.stage = 'suggestion_made'; break }
      if (s === 'suggestion_made' && intent.confirms)         { update.stage = 'offer_accepted'; break }
      if (s === 'offer_accepted')                             { update.stage = 'payment_sent'; break }
      break

    // ── 5. family_group ─────────────────────────────────────────────────────
    case 'family_group':
      if (s === 'idle')                                       { update.stage = 'family_details'; update.is_family = true; break }
      if (s === 'family_details' && update.turn_count >= 2)   { update.stage = 'options_presented'; break }
      if (s === 'options_presented' && intent.confirms)       { update.stage = 'offer_accepted'; break }
      if (s === 'options_presented' && intent.wantsChange)    { update.stage = 'customer_modifying'; break }
      if (s === 'customer_modifying' && intent.confirms)      { update.stage = 'offer_accepted'; break }
      if (s === 'offer_accepted')                             { update.stage = 'payment_sent'; break }
      break

    // ── 6. last_minute_solo ─────────────────────────────────────────────────
    case 'last_minute_solo':
      if (s === 'idle')                                       { update.stage = 'budget_captured'; update.traveler_count = 1; break }
      if (s === 'budget_captured')                            { update.stage = 'suggestion_made'; break }
      if (s === 'suggestion_made' && intent.confirms)         { update.stage = 'offer_accepted'; break }
      if (s === 'suggestion_made' && intent.wantsChange)      { update.stage = 'customer_modifying'; break }
      if (s === 'customer_modifying' && intent.confirms)      { update.stage = 'offer_accepted'; break }
      if (s === 'offer_accepted')                             { update.stage = 'payment_sent'; break }
      break
  }

  return update
}

// ── AI system prompt context ───────────────────────────────────────────────────

const STAGE_INSTRUCTION: Record<ConversationStage, string> = {
  idle:
    'Greet the customer warmly. Ask about their dream destination and travel dates.',
  gathering_requirements:
    'Gather: destination, travel dates, budget, number of travelers, any preferences or must-haves.',
  options_presented:
    'Present 2–3 tailored trip options with prices. Ask which one they prefer.',
  suggestion_made:
    'You have presented a trip offer. Remind the customer it is valid for 24 hours. Wait for them to confirm or request changes.',
  customer_modifying:
    "Acknowledge the customer's requested changes. Present a revised trip option that addresses their feedback.",
  family_details:
    "Ask: how many adults and children, children's ages, any specific family needs (pool, kids club, connecting rooms, dietary).",
  budget_captured:
    'Acknowledge the budget. Now present 2–3 destination options that fit perfectly within that budget, with rough price breakdowns.',
  offer_accepted:
    'The customer has confirmed they want to book. Tell them you are generating a secure payment link and they will receive it momentarily.',
  payment_sent:
    'Share the payment link clearly. Tell the customer it is secure and processed by MyFatoorah. Ask them to complete payment and confirm once done.',
  completed:
    'The trip is booked! Share excitement. Remind them to check their email, prepare documents, and feel free to message with any questions.',
}

const SCENARIO_NOTE: Partial<Record<ScenarioType, string>> = {
  suggestion_24hr:
    'IMPORTANT: When you present the offer, explicitly state it is valid for 24 hours only. If the offer expires, tell the customer warmly and offer to create a fresh quote.',
  family_group:
    "Emphasise kid-friendly hotels, family rooms, swimming pools, kids clubs, and age-appropriate activities. Always ask the children's ages if not provided.",
  last_minute_solo:
    'This is a last-minute solo booking. Keep messages short and action-focused. Show the cheapest available option first. Prioritise speed of decision.',
  budget_changes:
    'Lead with budget-conscious options. When the customer requests changes, adjust price breakdown transparently.',
}

export function buildScenarioContext(
  state: ConversationState,
  isOfferExpired: boolean,
  paymentUrl?: string
): string {
  const lang = state.language === 'ar' ? 'Arabic' : 'English'
  const lines: string[] = [
    `LANGUAGE: Always reply in ${lang}. Mirror the customer's language exactly — if they write Arabic, reply in Arabic; if English, reply in English.`,
    '',
    `SCENARIO: ${state.scenario ?? 'not yet determined'}`,
    `STAGE:    ${state.stage}`,
  ]

  if (state.budget)          lines.push(`BUDGET:   ${state.budget} ${state.currency ?? 'KWD'}`)
  if (state.traveler_count)  lines.push(`TRAVELERS: ${state.traveler_count}${state.is_family ? ' (family with children)' : ''}`)
  if (state.destination)     lines.push(`DESTINATION: ${state.destination}`)

  if (isOfferExpired) {
    lines.push(
      '',
      '⚠️ OFFER EXPIRED: The customer had a pending offer that has now passed the 24-hour window.',
      'Inform them warmly that the offer expired. Apologise briefly and offer to generate a fresh quote immediately.',
    )
  }

  const stageInstr = STAGE_INSTRUCTION[state.stage]
  if (stageInstr) lines.push('', `WHAT TO DO NOW: ${stageInstr}`)

  if (state.scenario) {
    const note = SCENARIO_NOTE[state.scenario]
    if (note) lines.push('', `SCENARIO NOTE: ${note}`)
  }

  if (paymentUrl) {
    lines.push(
      '',
      `PAYMENT LINK (share this with the customer): ${paymentUrl}`,
      'Present the payment link clearly in your message. Tell them it is secure, processed by MyFatoorah, and ask them to complete it and reply when done.',
    )
  }

  return lines.join('\n')
}
