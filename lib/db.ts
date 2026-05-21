/**
 * Supabase DB helpers — server-side only (uses service role key).
 * All conversation state, messages, offers, and scenario logs are persisted here.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Lazy singleton — created on first use, not at module load time
// (prevents Vercel build failure when env vars are only available at runtime)
let _client: SupabaseClient | null = null
function supabaseClient(): SupabaseClient {
  if (!_client) {
    _client = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
    )
  }
  return _client
}
// Alias kept for backwards compat with existing call sites
const supabase = new Proxy({} as SupabaseClient, {
  get(_t, prop) {
    return (supabaseClient() as unknown as Record<string | symbol, unknown>)[prop]
  },
})

// ── Types ──────────────────────────────────────────────────────────────────────

export type ScenarioType =
  | 'search_book_pay'       // 1. Customer searches → agent finds options → confirm → pay
  | 'suggestion_24hr'       // 2. Agent suggests → 24-hour offer window → confirm or expire
  | 'budget_changes'        // 3. Agent suggests based on budget → customer tweaks → pay
  | 'love_at_first_sight'   // 4. Agent suggests → customer loves it immediately → pay
  | 'family_group'          // 5. Family with kids → kid-friendly → multiple rooms → pay
  | 'last_minute_solo'      // 6. Solo traveler → tight budget → last-minute options → pay

export type ConversationStage =
  | 'idle'
  | 'gathering_requirements'
  | 'options_presented'
  | 'suggestion_made'
  | 'customer_modifying'
  | 'family_details'
  | 'budget_captured'
  | 'offer_accepted'
  | 'payment_sent'
  | 'completed'

export interface ConversationState {
  scenario?: ScenarioType
  stage: ConversationStage
  language: 'en' | 'ar'
  offer_id?: string
  scenario_log_id?: string
  budget?: number
  currency?: 'KWD' | 'USD' | 'AED' | 'EUR'
  traveler_count?: number
  is_family?: boolean
  children_count?: number
  destination?: string
  turn_count: number
}

// ── Conversations ──────────────────────────────────────────────────────────────

export async function getOrCreateConversation(phone: string) {
  const { data: existing } = await supabase
    .from('wa_conversations')
    .select('*')
    .eq('phone_number', phone)
    .single()

  if (existing) return existing

  const initialState: ConversationState = {
    stage: 'idle',
    language: 'en',
    turn_count: 0,
  }

  const { data, error } = await supabase
    .from('wa_conversations')
    .insert({ phone_number: phone, state: initialState })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateConversationState(phone: string, state: ConversationState) {
  const { error } = await supabase
    .from('wa_conversations')
    .update({ state, updated_at: new Date().toISOString() })
    .eq('phone_number', phone)

  if (error) throw error
}

// ── Messages ───────────────────────────────────────────────────────────────────

export async function saveMessage(
  conversationId: string,
  role: 'user' | 'assistant',
  content: string
) {
  const { error } = await supabase
    .from('wa_messages')
    .insert({ conversation_id: conversationId, role, content })

  if (error) throw error
}

export async function getMessageHistory(
  conversationId: string,
  limit = 20
): Promise<{ role: 'user' | 'assistant'; content: string }[]> {
  const { data, error } = await supabase
    .from('wa_messages')
    .select('role, content')
    .eq('conversation_id', conversationId)
    .in('role', ['user', 'assistant'])
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return ((data ?? []) as { role: 'user' | 'assistant'; content: string }[]).reverse()
}

// ── Offers ─────────────────────────────────────────────────────────────────────

export async function createOffer(params: {
  conversationId: string
  phone: string
  scenario: ScenarioType
  totalKwd?: number
  totalUsd?: number
  currency?: string
}) {
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

  const { data, error } = await supabase
    .from('wa_offers')
    .insert({
      conversation_id: params.conversationId,
      phone_number: params.phone,
      scenario: params.scenario,
      stage: 'presented',
      offer_data: {},
      total_kwd: params.totalKwd,
      total_usd: params.totalUsd,
      currency: params.currency ?? 'KWD',
      expires_at: expiresAt,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getActiveOffer(phone: string) {
  const { data } = await supabase
    .from('wa_offers')
    .select('*')
    .eq('phone_number', phone)
    .eq('stage', 'presented')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return data
}

export async function getOfferById(offerId: string) {
  const { data } = await supabase
    .from('wa_offers')
    .select('*')
    .eq('id', offerId)
    .single()

  return data
}

export async function updateOfferStage(
  offerId: string,
  stage: 'accepted' | 'expired' | 'cancelled' | 'paid',
  extra?: { paymentUrl?: string; paymentInvoiceId?: string; paidAt?: string }
) {
  const { error } = await supabase
    .from('wa_offers')
    .update({
      stage,
      ...(extra?.paymentUrl        && { payment_url: extra.paymentUrl }),
      ...(extra?.paymentInvoiceId  && { payment_invoice_id: extra.paymentInvoiceId }),
      ...(extra?.paidAt            && { paid_at: extra.paidAt }),
    })
    .eq('id', offerId)

  if (error) throw error
}

export async function expireStaleOffers(phone: string): Promise<string[]> {
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('wa_offers')
    .update({ stage: 'expired' })
    .eq('phone_number', phone)
    .eq('stage', 'presented')
    .lt('expires_at', now)
    .select('id')

  if (error) throw error
  return (data ?? []).map((r: any) => r.id)
}

// ── Scenario logs ──────────────────────────────────────────────────────────────

export async function logScenarioStart(
  conversationId: string,
  phone: string,
  scenario: ScenarioType,
  offerId?: string
) {
  const { data, error } = await supabase
    .from('wa_scenario_logs')
    .insert({
      conversation_id: conversationId,
      phone_number: phone,
      scenario,
      offer_id: offerId,
    })
    .select('id')
    .single()

  if (error) throw error
  return data?.id as string
}

export async function logScenarioComplete(
  logId: string,
  outcome: 'completed' | 'expired' | 'abandoned' | 'payment_failed',
  metadata?: object
) {
  const { error } = await supabase
    .from('wa_scenario_logs')
    .update({ outcome, completed_at: new Date().toISOString(), metadata })
    .eq('id', logId)

  if (error) throw error
}
