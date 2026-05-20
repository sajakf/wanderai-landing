import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const db = () => createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
)

export async function GET() {
  try {
    const supabase = db()
    const today = new Date(); today.setHours(0, 0, 0, 0)

    const [convRes, msgRes, todayRes, recentRes] = await Promise.all([
      supabase.from('wa_conversations').select('id', { count: 'exact', head: true }),
      supabase.from('wa_messages').select('id', { count: 'exact', head: true }),
      supabase.from('wa_conversations')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', today.toISOString()),
      supabase.from('wa_conversations')
        .select('id, phone_number, display_name, created_at, state')
        .order('created_at', { ascending: false })
        .limit(5),
    ])

    return NextResponse.json({
      totalConversations: convRes.count ?? 0,
      totalMessages:      msgRes.count  ?? 0,
      activeToday:        todayRes.count ?? 0,
      recentConversations: recentRes.data ?? [],
    })
  } catch (err) {
    console.error('[admin/stats]', err)
    return NextResponse.json({ totalConversations: 0, totalMessages: 0, activeToday: 0, recentConversations: [] })
  }
}
