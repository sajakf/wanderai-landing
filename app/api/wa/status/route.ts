export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { wa } from '@/lib/wa-client'
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ status: wa.status })
}
