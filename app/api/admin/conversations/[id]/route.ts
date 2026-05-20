import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const db = () => createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
)

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = db()
    const { data, error } = await supabase
      .from('wa_messages')
      .select('id, role, content, created_at')
      .eq('conversation_id', params.id)
      .in('role', ['user', 'assistant'])
      .order('created_at', { ascending: true })
      .limit(200)

    if (error) throw error
    return NextResponse.json({ messages: data ?? [] })
  } catch (err) {
    console.error('[admin/conversations/[id]]', err)
    return NextResponse.json({ messages: [] })
  }
}
