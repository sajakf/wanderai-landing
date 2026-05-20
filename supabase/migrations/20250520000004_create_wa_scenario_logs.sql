-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: create wa_scenario_logs
--
-- Audit trail for each booking scenario run — start time, end time, outcome,
-- and any metadata (e.g. error details, payment reference).
-- Used for analytics: conversion rate per scenario, abandonment tracking.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists wa_scenario_logs (
  id              uuid        primary key default gen_random_uuid(),
  conversation_id uuid        not null references wa_conversations (id) on delete cascade,
  phone_number    text        not null,

  -- Which scenario was running
  scenario        text        not null check (scenario in (
    'search_book_pay',
    'suggestion_24hr',
    'budget_changes',
    'love_at_first_sight',
    'family_group',
    'last_minute_solo'
  )),

  -- Associated offer (nullable — set when an offer is generated)
  offer_id        uuid        references wa_offers (id) on delete set null,

  -- How the scenario ended
  outcome         text        check (outcome in (
    'completed',
    'expired',
    'abandoned',
    'payment_failed'
  )),

  -- Optional extra data: error messages, retry count, payment IDs, etc.
  metadata        jsonb,

  created_at      timestamptz not null default now(),
  completed_at    timestamptz
);

-- Analytics queries: filter by scenario + outcome
create index if not exists wa_scenario_logs_scenario_outcome_idx
  on wa_scenario_logs (scenario, outcome);

-- Admin: recent activity feed
create index if not exists wa_scenario_logs_created_at_idx
  on wa_scenario_logs (created_at desc);

alter table wa_scenario_logs enable row level security;
