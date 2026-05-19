import type { Metadata } from 'next'
import { Inter, Cormorant_Garamond } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-norway',
  weight: ['300', '400', '500', '600', '700'],
})

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-playfair',
  style: ['normal', 'italic'],
  weight: ['300', '400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'WanderAI — Pack light. Dream heavy.',
  description: 'AI-powered travel is boarding soon. Join the waitlist and get first access.',
  openGraph: {
    title: 'WanderAI — Pack light. Dream heavy.',
    description: "AI-powered travel is boarding soon. You'll want a window seat.",
    url: 'https://thewanderlust.app',
    siteName: 'WanderAI',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WanderAI — Pack light. Dream heavy.',
    description: 'AI-powered travel is boarding soon.',
  },
  metadataBase: new URL('https://thewanderlust.app'),
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${cormorant.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
