-- ─────────────────────────────────────────────────────────────────────────────
-- WanderAI — Safe schema apply (idempotent, run any number of times)
-- Works whether tables already exist or are brand new.
-- Paste the ENTIRE file into Supabase SQL Editor → Run
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. wa_conversations ───────────────────────────────────────────────────────
create table if not exists wa_conversations (
  id           uuid        primary key default gen_random_uuid(),
  phone_number text        not null unique,
  display_name text,
  state        jsonb       not null default '{"stage":"idle","language":"en","turn_count":0}'::jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Add missing columns to existing table (safe no-op if already present)
alter table wa_conversations add column if not exists display_name  text;
alter table wa_conversations add column if not exists state         jsonb        not null default '{"stage":"idle","language":"en","turn_count":0}'::jsonb;
alter table wa_conversations add column if not exists created_at    timestamptz  not null default now();
alter table wa_conversations add column if not exists updated_at    timestamptz  not null default now();

create index if not exists wa_conversations_phone_idx
  on wa_conversations (phone_number);

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists wa_conversations_updated_at on wa_conversations;
create trigger wa_conversations_updated_at
  before update on wa_conversations
  for each row execute procedure set_updated_at();

alter table wa_conversations enable row level security;

-- ── 2. wa_messages ────────────────────────────────────────────────────────────
create table if not exists wa_messages (
  id              uuid        primary key default gen_random_uuid(),
  conversation_id uuid        not null references wa_conversations (id) on delete cascade,
  role            text        not null,
  content         text,
  tool_calls      jsonb,
  tool_call_id    text,
  tool_name       text,
  created_at      timestamptz not null default now()
);

alter table wa_messages add column if not exists tool_calls      jsonb;
alter table wa_messages add column if not exists tool_call_id    text;
alter table wa_messages add column if not exists tool_name       text;
alter table wa_messages add column if not exists created_at      timestamptz not null default now();

create index if not exists wa_messages_conversation_created_idx
  on wa_messages (conversation_id, created_at asc);

alter table wa_messages enable row level security;

-- ── 3. wa_offers ──────────────────────────────────────────────────────────────
create table if not exists wa_offers (
  id                 uuid        primary key default gen_random_uuid(),
  conversation_id    uuid        not null references wa_conversations (id) on delete cascade,
  phone_number       text        not null,
  scenario           text        not null,
  stage              text        not null default 'presented',
  offer_data         jsonb       not null default '{}'::jsonb,
  total_kwd          numeric(10,3),
  total_usd          numeric(10,2),
  currency           text        not null default 'KWD',
  payment_url        text,
  payment_invoice_id text,
  paid_at            timestamptz,
  expires_at         timestamptz not null default now() + interval '24 hours',
  created_at         timestamptz not null default now()
);

alter table wa_offers add column if not exists offer_data          jsonb        not null default '{}'::jsonb;
alter table wa_offers add column if not exists total_kwd           numeric(10,3);
alter table wa_offers add column if not exists total_usd           numeric(10,2);
alter table wa_offers add column if not exists currency            text         not null default 'KWD';
alter table wa_offers add column if not exists payment_url         text;
alter table wa_offers add column if not exists payment_invoice_id  text;
alter table wa_offers add column if not exists paid_at             timestamptz;
alter table wa_offers add column if not exists expires_at          timestamptz  not null default now() + interval '24 hours';
alter table wa_offers add column if not exists created_at          timestamptz  not null default now();

create index if not exists wa_offers_phone_stage_idx
  on wa_offers (phone_number, stage);

alter table wa_offers enable row level security;

-- ── 4. wa_scenario_logs ───────────────────────────────────────────────────────
create table if not exists wa_scenario_logs (
  id              uuid        primary key default gen_random_uuid(),
  conversation_id uuid        not null references wa_conversations (id) on delete cascade,
  phone_number    text        not null,
  scenario        text        not null,
  offer_id        uuid,
  outcome         text,
  metadata        jsonb,
  created_at      timestamptz not null default now(),
  completed_at    timestamptz
);

alter table wa_scenario_logs add column if not exists offer_id      uuid;
alter table wa_scenario_logs add column if not exists outcome        text;
alter table wa_scenario_logs add column if not exists metadata       jsonb;
alter table wa_scenario_logs add column if not exists created_at     timestamptz not null default now();
alter table wa_scenario_logs add column if not exists completed_at   timestamptz;

create index if not exists wa_scenario_logs_created_at_idx
  on wa_scenario_logs (created_at desc);

alter table wa_scenario_logs enable row level security;
