import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const db = () => createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
)

export async function GET() {
  try {
    const supabase = db()

    // Get all conversations
    const { data: conversations, error } = await supabase
      .from('wa_conversations')
      .select('id, phone_number, display_name, state, created_at, updated_at')
      .order('updated_at', { ascending: false })
      .limit(100)

    if (error) throw error

    // For each conversation get the last message + message count
    const enriched = await Promise.all((conversations ?? []).map(async (conv) => {
      const [lastMsg, countRes] = await Promise.all([
        supabase.from('wa_messages')
          .select('content, role, created_at')
          .eq('conversation_id', conv.id)
          .in('role', ['user', 'assistant'])
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase.from('wa_messages')
          .select('id', { count: 'exact', head: true })
          .eq('conversation_id', conv.id),
      ])
      return {
        ...conv,
        lastMessage:  lastMsg.data ?? null,
        messageCount: countRes.count ?? 0,
      }
    }))

    return NextResponse.json({ conversations: enriched })
  } catch (err) {
    console.error('[admin/conversations]', err)
    return NextResponse.json({ conversations: [] })
  }
}
