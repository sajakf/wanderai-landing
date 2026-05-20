-- ─────────────────────────────────────────────────────────────────────────────
-- Seed: sample data for local development and admin panel testing
-- Run AFTER all migrations have been applied.
-- Safe to run multiple times (uses ON CONFLICT DO NOTHING).
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Sample conversations ──────────────────────────────────────────────────────
insert into wa_conversations (id, phone_number, display_name, state)
values
  (
    '00000000-0000-0000-0000-000000000001',
    '96512345001@s.whatsapp.net',
    'Sarah K.',
    '{"stage":"completed","language":"en","destination":"Santorini","budget":1500,"currency":"USD","traveler_count":2,"turn_count":8}'
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    '96512345002@s.whatsapp.net',
    'Ahmed M.',
    '{"stage":"options_presented","language":"ar","destination":"Istanbul","budget":800,"currency":"KWD","traveler_count":1,"turn_count":4}'
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    '96512345003@s.whatsapp.net',
    'Layla H.',
    '{"stage":"idle","language":"en","turn_count":1}'
  )
on conflict (phone_number) do nothing;

-- ── Sample messages ───────────────────────────────────────────────────────────
insert into wa_messages (conversation_id, role, content)
values
  ('00000000-0000-0000-0000-000000000001', 'user',      'Hey! I want a sunny 7-day trip, budget ~€1,500 🌞'),
  ('00000000-0000-0000-0000-000000000001', 'assistant', 'Hi! I''m WanderAI 🌍 Love that energy — let me find you something perfect.'),
  ('00000000-0000-0000-0000-000000000001', 'user',      'Santorini sounds amazing! Plan the whole trip?'),
  ('00000000-0000-0000-0000-000000000001', 'assistant', 'Done! Your 7-day Santorini plan ✈️ Est. total: €1,380 incl. flights & hotels'),
  ('00000000-0000-0000-0000-000000000002', 'user',      'مرحبا! أريد السفر إلى إسطنبول'),
  ('00000000-0000-0000-0000-000000000002', 'assistant', 'أهلاً! يسعدني مساعدتك في التخطيط لرحلتك إلى إسطنبول 🕌'),
  ('00000000-0000-0000-0000-000000000003', 'user',      'Hi!'),
  ('00000000-0000-0000-0000-000000000003', 'assistant', 'Hi! I''m WanderAI, your personal travel assistant on WhatsApp 🌍')
on conflict do nothing;

-- ── Sample offer ──────────────────────────────────────────────────────────────
insert into wa_offers (
  id, conversation_id, phone_number, scenario, stage,
  offer_data, total_usd, currency, expires_at
)
values (
  '00000000-0000-0000-0000-000000000101',
  '00000000-0000-0000-0000-000000000001',
  '96512345001@s.whatsapp.net',
  'search_book_pay',
  'paid',
  '{"destination":"Santorini","nights":7,"hotel":"Canaves Oia Boutique Hotel","flight":"Emirates EK107"}',
  1380.00,
  'USD',
  now() + interval '24 hours'
)
on conflict do nothing;

-- ── Sample scenario log ───────────────────────────────────────────────────────
insert into wa_scenario_logs (
  conversation_id, phone_number, scenario, offer_id, outcome, completed_at
)
values (
  '00000000-0000-0000-0000-000000000001',
  '96512345001@s.whatsapp.net',
  'search_book_pay',
  '00000000-0000-0000-0000-000000000101',
  'completed',
  now()
)
on conflict do nothing;
