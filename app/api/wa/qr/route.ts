export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { wa } from '@/lib/wa-client'

export async function GET() {
  const encoder = new TextEncoder()

  function send(data: object) {
    return encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
  }

  let qrListener: ((url: string | null) => void) | null = null
  let statusListener: ((s: string) => void) | null = null

  const stream = new ReadableStream({
    start(controller) {
      // Send current state immediately
      controller.enqueue(send({ qr: wa.qrDataUrl, status: wa.status }))

      qrListener = (url) => {
        try { controller.enqueue(send({ qr: url, status: wa.status })) } catch {}
      }
      statusListener = (s) => {
        try { controller.enqueue(send({ qr: wa.qrDataUrl, status: s })) } catch {}
      }

      wa.emitter.on('qr', qrListener)
      wa.emitter.on('status', statusListener)
    },
    cancel() {
      if (qrListener)    wa.emitter.off('qr', qrListener)
      if (statusListener) wa.emitter.off('status', statusListener)
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
