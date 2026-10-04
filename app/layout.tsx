import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Phantom Projects',
  description: 'Creative studio — film, fashion, art, brand, performance.',
  openGraph: {
    title: 'Phantom Projects',
    description: 'Creative studio based in New York City.',
    url: 'https://phantom-projects.nyc',
    siteName: 'Phantom Projects',
    locale: 'en_US',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
