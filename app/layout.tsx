import type { Metadata, Viewport } from 'next'
import './globals.css'
import { PWARegister } from '@/components/PWARegister'

export const viewport: Viewport = {
  themeColor: '#061a38',
}

export const metadata: Metadata = {
  title: 'TeachTrack Pro',
  description: 'Teacher performance and professional development tracking system',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'TeachTrack', statusBarStyle: 'default' },
  icons: { icon: [{ url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }, { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' }], apple: '/icons/icon-192.png' },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><PWARegister/>{children}</body></html>
}
