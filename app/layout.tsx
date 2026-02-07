import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Book Q&A AI Agent',
  description: 'Upload books and ask questions',
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
