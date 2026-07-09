import type { Metadata } from 'next'
import { JetBrains_Mono } from 'next/font/google'
import { QueryProvider } from '@/lib/query-provider'
import { Toaster } from '@/components/ui/toaster'
import './globals.css'

const jetBrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://www.unheardradio.io'),
  title: 'Unheard Radio - Discover Obscure Underground Radio Stations Worldwide',
  description: 'Anti-algorithm radio discovery platform. Find the world\'s most obscure, underground radio stations with zero listeners. Stream live broadcasts from forgotten corners of the globe.',
  keywords: 'radio, obscure radio, underground radio, radio discovery, live radio, streaming radio, zero listeners, anti-algorithm, radio browser, global radio, experimental radio, rare radio stations',
  authors: [{ name: 'Z13labs' }],
  creator: 'Z13labs',
  publisher: 'Unheard Radio',
  category: 'Music & Audio',
  robots: 'index, follow',
  openGraph: {
    title: 'Unheard Radio - Discover Obscure Radio Stations',
    description: 'Your portal to the strange side of sound. Stream live radio from the world\'s most overlooked stations.',
    url: 'https://www.unheardradio.io',
    siteName: 'Unheard Radio',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Unheard Radio - Discover Obscure Radio Stations',
    description: 'Anti-algorithm radio discovery. Find stations with zero listeners.',
    creator: '@z13labs',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${jetBrainsMono.variable} dark`}>
      <body className="min-h-screen bg-chart-bg text-chart-ink antialiased">
        <QueryProvider>
          {children}
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  )
}
