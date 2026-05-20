-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: create wa_messages
--
-- Every message in a conversation — user, assistant, and tool call results.
-- Mirrors the OpenAI ChatCompletionMessageParam shape so history can be fed
-- directly to the AI model without transformation.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists wa_messages (
  id              uuid        primary key default gen_random_uuid(),
  conversation_id uuid        not null references wa_conversations (id) on delete cascade,

  -- 'user' | 'assistant' | 'tool'
  role            text        not null check (role in ('user', 'assistant', 'tool')),

  -- Main message text (null for assistant messages that only contain tool_calls)
  content         text,

  -- OpenAI tool_calls array — present on assistant messages that invoke tools
  tool_calls      jsonb,

  -- Present on role='tool' messages — links back to the assistant tool_call
  tool_call_id    text,
  tool_name       text,

  created_at      timestamptz not null default now()
);

-- Chronological history fetch is the dominant query
create index if not exists wa_messages_conversation_created_idx
  on wa_messages (conversation_id, created_at asc);

alter table wa_messages enable row level security;
