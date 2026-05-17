export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { disconnectWhatsApp } from '@/lib/wa-client'
import { NextResponse } from 'next/server'

export async function POST() {
  await disconnectWhatsApp()
  return NextResponse.json({ ok: true })
}
