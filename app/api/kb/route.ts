export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import fs from 'fs'
import path from 'path'
import { NextRequest, NextResponse } from 'next/server'

const KB_PATH = path.join(process.cwd(), 'data', 'knowledge-base.md')

export async function GET() {
  try {
    const content = fs.readFileSync(KB_PATH, 'utf8')
    return NextResponse.json({ content })
  } catch {
    return NextResponse.json({ content: '' })
  }
}

export async function PUT(req: NextRequest) {
  const { content } = await req.json()
  fs.mkdirSync(path.dirname(KB_PATH), { recursive: true })
  fs.writeFileSync(KB_PATH, content, 'utf8')
  return NextResponse.json({ ok: true })
}
