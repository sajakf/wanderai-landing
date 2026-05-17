export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { wa } from '@/lib/wa-client'
import { NextResponse, NextRequest } from 'next/server'

// GET /api/messages?phone=&since=
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const phone = searchParams.get('phone')
  const since = Number(searchParams.get('since') ?? 0)

  let msgs = wa.messages.filter(m => m.ts > since)
  if (phone) msgs = msgs.filter(m => m.phone === phone)

  // Unique phones for sidebar
  const phones = Array.from(new Set(wa.messages.map(m => m.phone)))

  return NextResponse.json({ messages: msgs, phones })
}

// SSE stream for live messages
export async function POST() {
  const encoder = new TextEncoder()
  let listener: ((m: object) => void) | null = null

  const stream = new ReadableStream({
    start(controller) {
      listener = (msg) => {
        try { controller.enqueue(encoder.encode(`data: ${JSON.stringify(msg)}\n\n`)) } catch {}
      }
      wa.emitter.on('message', listener)
    },
    cancel() {
      if (listener) wa.emitter.off('message', listener)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
