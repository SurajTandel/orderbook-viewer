import type { Metadata } from 'next'
import "../styles/globals.css"

export const metadata: Metadata = {
  title: 'Orderbook Viewer',
  description: 'Real-time orderbook visualization',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
} 