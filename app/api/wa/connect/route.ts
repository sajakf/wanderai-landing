export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { connectWhatsApp, wa } from '@/lib/wa-client'
import { NextResponse } from 'next/server'

export async function POST() {
  await connectWhatsApp()
  return NextResponse.json({ status: wa.status })
}
