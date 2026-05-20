# WanderAI — Supabase Schema

## Tables

| Table | Purpose |
|-------|---------|
| `wa_conversations` | One row per WhatsApp number — stores state (stage, language, budget, etc.) |
| `wa_messages` | Every message in a conversation (user, assistant, tool calls) |
| `wa_offers` | Travel offers presented to users — tracks pricing, payment, expiry |
| `wa_scenario_logs` | Audit trail for booking scenarios — used for analytics |

## Applying migrations

### Option A — Supabase Dashboard (quickest)

1. Open [supabase.com/dashboard](https://supabase.com/dashboard) → your project
2. Go to **SQL Editor**
3. Run each file in order:
   - `migrations/20250520000001_create_wa_conversations.sql`
   - `migrations/20250520000002_create_wa_messages.sql`
   - `migrations/20250520000003_create_wa_offers.sql`
   - `migrations/20250520000004_create_wa_scenario_logs.sql`
4. Optionally run `seed.sql` to populate sample data for testing

### Option B — Supabase CLI

```bash
# Install CLI if needed
npm install -g supabase

# Link to your project (get project ref from dashboard URL)
supabase link --project-ref tbsqnuqziflzgrcagmrq

# Push all migrations
supabase db push

# Seed (optional)
supabase db execute --file supabase/seed.sql
```

## Notes

- All tables have **Row Level Security enabled** — only the service role key (used server-side) can read/write. The anon key has no access.
- `updated_at` on `wa_conversations` is kept in sync automatically via a trigger.
- Foreign keys cascade on delete — deleting a conversation removes all its messages, offers and logs.
- The `state` column on `wa_conversations` is JSONB and mirrors the `ConversationState` interface in `lib/db.ts`.
