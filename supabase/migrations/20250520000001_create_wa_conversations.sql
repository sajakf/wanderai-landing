-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: create wa_conversations
--
-- One row per unique WhatsApp number.
-- Stores the phone number, optional display name (push name from WhatsApp),
-- and the full ConversationState JSON (stage, language, budget, etc.)
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists wa_conversations (
  id           uuid        primary key default gen_random_uuid(),
  phone_number text        not null unique,
  display_name text,

  -- Full ConversationState JSON (stage, language, budget, currency, etc.)
  -- Schema mirrors lib/db.ts → ConversationState interface
  state        jsonb       not null default '{
    "stage": "idle",
    "language": "en",
    "turn_count": 0
  }'::jsonb,

  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Keep updated_at in sync automatically
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger wa_conversations_updated_at
  before update on wa_conversations
  for each row execute procedure set_updated_at();

-- Index for fast phone lookups (most common query pattern)
create index if not exists wa_conversations_phone_idx
  on wa_conversations (phone_number);

-- Row Level Security — service role key bypasses all policies,
-- so we enable RLS but don't add anon/user policies (admin-only access).
alter table wa_conversations enable row level security;
