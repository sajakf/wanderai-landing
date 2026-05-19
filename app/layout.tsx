import type { Metadata } from 'next'
import { Outfit, Playfair_Display } from 'next/font/google'
import './globals.css'

// NORWAY by Minimalistartstudio is not on Google Fonts.
// Outfit is the closest available geometric sans-serif match.
// To use the real NORWAY font: add the .woff2 files to /public/fonts/
// and replace this with a @font-face in globals.css.
const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-norway',
  weight: ['300', '400', '500', '600', '700'],
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  style: ['normal', 'italic'],
  weight: ['400', '700', '900'],
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
    <html lang="en" className={`${outfit.variable} ${playfair.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
