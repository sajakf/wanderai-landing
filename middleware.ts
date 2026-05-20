import { NextRequest, NextResponse } from 'next/server'

const COOKIE = 'wanderai_admin'
const LOGIN  = '/admin/login'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Only protect /admin routes (but not the login page itself)
  if (!pathname.startsWith('/admin') || pathname === LOGIN) {
    return NextResponse.next()
  }

  const session = req.cookies.get(COOKIE)?.value
  if (session === process.env.ADMIN_PASSWORD) {
    return NextResponse.next()
  }

  // Not authenticated — redirect to login, preserving intended URL
  const url = req.nextUrl.clone()
  url.pathname = LOGIN
  url.searchParams.set('next', pathname)
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ['/admin/:path*'],
}
