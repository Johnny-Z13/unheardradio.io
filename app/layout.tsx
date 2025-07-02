import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { QueryProvider } from '@/lib/query-provider'
import { Toaster } from '@/components/ui/toaster'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Unheard Radio - Obscure Radio Discovery',
  description: 'Your portal to the strange side of sound. Discover the world\'s most obscure radio stations.',
  keywords: 'radio, obscure, underground, streaming, discovery',
  authors: [{ name: 'Z13labs' }],
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  themeColor: '#00FF00',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen bg-black text-vdu-green antialiased`}>
        <QueryProvider>
          {children}
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  )
}