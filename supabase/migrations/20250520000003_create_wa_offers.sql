-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: create wa_offers
--
-- A travel offer presented to a user — flight + hotel + experiences bundle.
-- Offers expire after 24 hours unless accepted. Payment is tracked here.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists wa_offers (
  id                  uuid        primary key default gen_random_uuid(),
  conversation_id     uuid        not null references wa_conversations (id) on delete cascade,
  phone_number        text        not null,

  -- Which booking scenario this offer came from (mirrors ScenarioType in lib/db.ts)
  scenario            text        not null check (scenario in (
    'search_book_pay',
    'suggestion_24hr',
    'budget_changes',
    'love_at_first_sight',
    'family_group',
    'last_minute_solo'
  )),

  -- Offer lifecycle stage
  stage               text        not null default 'presented' check (stage in (
    'presented',
    'accepted',
    'expired',
    'cancelled',
    'paid'
  )),

  -- Full offer details — flights, hotels, experiences, breakdown, etc.
  offer_data          jsonb       not null default '{}'::jsonb,

  -- Pricing
  total_kwd           numeric(10, 3),
  total_usd           numeric(10, 2),
  currency            text        not null default 'KWD',

  -- Payment (MyFatoorah)
  payment_url         text,
  payment_invoice_id  text,
  paid_at             timestamptz,

  -- Offer window — default 24 hours from creation
  expires_at          timestamptz not null,

  created_at          timestamptz not null default now()
);

-- Look up active offer for a phone number quickly
create index if not exists wa_offers_phone_stage_idx
  on wa_offers (phone_number, stage);

-- Background job to expire stale offers
create index if not exists wa_offers_expires_at_idx
  on wa_offers (expires_at) where stage = 'presented';

alter table wa_offers enable row level security;
